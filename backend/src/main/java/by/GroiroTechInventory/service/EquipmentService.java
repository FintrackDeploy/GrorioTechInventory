package by.GroiroTechInventory.service;

import by.GroiroTechInventory.config.EquipmentSpecifications;
import by.GroiroTechInventory.dto.equipment.EquipmentBatchRequest;
import by.GroiroTechInventory.dto.equipment.EquipmentRequest;
import by.GroiroTechInventory.dto.equipment.EquipmentResponse;
import by.GroiroTechInventory.dto.equipment.InventoryGroupSuggestion;
import by.GroiroTechInventory.entity.Employee;
import by.GroiroTechInventory.entity.Equipment;
import by.GroiroTechInventory.entity.Room;
import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.enums.EquipmentType;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.EmployeeRepository;
import by.GroiroTechInventory.repository.EquipmentRepository;
import by.GroiroTechInventory.repository.RoomRepository;
import by.GroiroTechInventory.repository.projection.InventoryNumberCount;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final RoomRepository roomRepository;
    private final EmployeeRepository employeeRepository;

    public Page<EquipmentResponse> findAll(EquipmentStatus status,
                                           EquipmentType type,
                                           Long roomId,
                                           Long employeeId,
                                           String q,
                                           Pageable pageable) {
        var spec = EquipmentSpecifications.withFilters(status, type, roomId, employeeId, q);
        Page<Equipment> page = equipmentRepository.findAll(spec, pageable);
        Map<String, Long> groupSizes = loadGroupSizes(page.getContent());
        return page.map(e -> toResponse(e, groupSizes));
    }

    public List<EquipmentResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        List<Equipment> found = equipmentRepository.search(query.trim());
        Map<String, Long> groupSizes = loadGroupSizes(found);
        return found.stream().map(e -> toResponse(e, groupSizes)).toList();
    }

    public EquipmentResponse findById(Long id) {
        Equipment equipment = getEntity(id);
        return toResponse(equipment, groupSizeOf(equipment.getInventoryNumber()));
    }

    public EquipmentResponse findByInventoryNumber(String inventoryNumber) {
        return equipmentRepository.findByInventoryNumber(inventoryNumber)
                .map(e -> toResponse(e, groupSizeOf(inventoryNumber)))
                .orElseThrow(() -> new NotFoundException("Оборудование не найдено: inv=" + inventoryNumber));
    }

    // Весь комплект по инвентарному номеру — для карточки "Комплект" на фронте.
    public List<EquipmentResponse> findGroupByInventoryNumber(String inventoryNumber) {
        List<Equipment> items = equipmentRepository.findAllByInventoryNumberOrderByTypeAsc(inventoryNumber);
        long size = items.size();
        return items.stream().map(e -> toResponse(e, size)).toList();
    }

    // Автоподсказка при вводе инвентарного номера в форме.
    public List<InventoryGroupSuggestion> suggestInventoryNumbers(String q) {
        if (q == null || q.isBlank()) {
            return List.of();
        }
        List<String> numbers = equipmentRepository.findDistinctInventoryNumbers(q.trim()).stream()
                .limit(15)
                .toList();
        List<InventoryGroupSuggestion> result = new ArrayList<>();
        for (String number : numbers) {
            List<Equipment> items = equipmentRepository.findAllByInventoryNumberOrderByTypeAsc(number);
            if (items.isEmpty()) continue;
            Equipment withRoom = items.stream().filter(e -> e.getRoom() != null).findFirst().orElse(items.get(0));
            Equipment withEmployee = items.stream().filter(e -> e.getResponsibleEmployee() != null).findFirst().orElse(items.get(0));
            Room room = withRoom.getRoom();
            Employee employee = withEmployee.getResponsibleEmployee();
            result.add(new InventoryGroupSuggestion(
                    number,
                    items.size(),
                    room != null ? room.getId() : null,
                    room != null ? room.getNumber() : null,
                    employee != null ? employee.getId() : null,
                    employee != null ? employee.getFullName() : null
            ));
        }
        return result;
    }

    @Transactional
    public EquipmentResponse create(EquipmentRequest request) {
        Equipment equipment = buildFromRequest(new Equipment(), request);
        equipment.setInventoryNumber(request.inventoryNumber().trim());
        Equipment saved = equipmentRepository.save(equipment);
        return toResponse(saved, groupSizeOf(saved.getInventoryNumber()));
    }

    // Комплект: несколько единиц техники одним инвентарным номером за один
    // запрос (компьютер + монитор + клавиатура + мышь + принтер + колонки...).
    // Инвентарный номер каждого item'а игнорируется и принудительно
    // выставляется общим — это осознанно разрешённый дубликат, см. миграцию
    // 006-allow-duplicate-inventory-numbers.
    @Transactional
    public List<EquipmentResponse> createBatch(EquipmentBatchRequest request) {
        String inventoryNumber = request.inventoryNumber().trim();
        List<Equipment> saved = request.items().stream()
                .map(item -> {
                    Equipment equipment = buildFromRequest(new Equipment(), item);
                    equipment.setInventoryNumber(inventoryNumber);
                    return equipmentRepository.save(equipment);
                })
                .toList();
        long total = equipmentRepository.countByInventoryNumber(inventoryNumber);
        return saved.stream().map(e -> toResponse(e, total)).toList();
    }

    @Transactional
    public EquipmentResponse update(Long id, EquipmentRequest request) {
        Equipment equipment = getEntity(id);
        equipment.setInventoryNumber(request.inventoryNumber().trim());
        buildFromRequest(equipment, request);
        return toResponse(equipment, groupSizeOf(equipment.getInventoryNumber()));
    }

    @Transactional
    public EquipmentResponse updateStatus(Long id, EquipmentStatus status) {
        Equipment equipment = getEntity(id);
        equipment.setStatus(status);
        return toResponse(equipment, groupSizeOf(equipment.getInventoryNumber()));
    }

    @Transactional
    public void delete(Long id) {
        equipmentRepository.delete(getEntity(id));
    }

    private Equipment buildFromRequest(Equipment equipment, EquipmentRequest request) {
        equipment.setType(request.type());
        equipment.setStatus(request.status());
        equipment.setRoom(resolveRoom(request.roomId()));
        equipment.setResponsibleEmployee(resolveEmployee(request.responsibleEmployeeId()));
        equipment.setPurchaseDate(request.purchaseDate());
        equipment.setIpAddress(blankToNull(request.ipAddress()));
        equipment.setMacAddress(blankToNull(request.macAddress()));
        equipment.setNotes(request.notes());

        equipment.setCpu(blankToNull(request.cpu()));
        equipment.setRamGb(request.ramGb());
        equipment.setStorage(blankToNull(request.storage()));
        equipment.setGpu(blankToNull(request.gpu()));
        equipment.setOs(blankToNull(request.os()));
        equipment.setFormFactor(blankToNull(request.formFactor()));

        equipment.setDiagonalInch(request.diagonalInch());
        equipment.setResolution(blankToNull(request.resolution()));
        equipment.setPanelType(blankToNull(request.panelType()));
        equipment.setConnectors(blankToNull(request.connectors()));

        equipment.setPrintSpeedPpm(request.printSpeedPpm());
        equipment.setPrintColor(request.printColor());
        equipment.setPrintFormat(blankToNull(request.printFormat()));

        equipment.setWireless(request.wireless());
        equipment.setSwitchType(blankToNull(request.switchType()));

        equipment.setPortCount(request.portCount());
        equipment.setPowerVa(request.powerVa());
        equipment.setBatteryRuntimeMin(request.batteryRuntimeMin());

        return equipment;
    }

    private Equipment getEntity(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Оборудование не найдено: id=" + id));
    }

    private Room resolveRoom(Long roomId) {
        if (roomId == null) return null;
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("Кабинет не найден: id=" + roomId));
    }

    private Employee resolveEmployee(Long employeeId) {
        if (employeeId == null) return null;
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Сотрудник не найден: id=" + employeeId));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private Map<String, Long> loadGroupSizes(List<Equipment> items) {
        List<String> numbers = items.stream().map(Equipment::getInventoryNumber).distinct().toList();
        if (numbers.isEmpty()) return Map.of();
        Map<String, Long> result = new HashMap<>();
        for (InventoryNumberCount row : equipmentRepository.countByInventoryNumbers(numbers)) {
            result.put(row.getInventoryNumber(), row.getCnt());
        }
        return result;
    }

    private long groupSizeOf(String inventoryNumber) {
        return equipmentRepository.countByInventoryNumber(inventoryNumber);
    }

    private EquipmentResponse toResponse(Equipment e, Map<String, Long> groupSizes) {
        return toResponse(e, groupSizes.getOrDefault(e.getInventoryNumber(), 1L));
    }

    private EquipmentResponse toResponse(Equipment e, long groupSize) {
        Employee responsible = e.getResponsibleEmployee();
        Room room = e.getRoom();
        return new EquipmentResponse(
                e.getId(),
                e.getInventoryNumber(),
                e.getType(),
                e.getStatus(),
                room != null ? room.getId() : null,
                room != null ? room.getNumber() : null,
                responsible != null ? responsible.getId() : null,
                responsible != null ? responsible.getFullName() : null,
                e.getPurchaseDate(),
                e.getIpAddress(),
                e.getMacAddress(),
                e.getNotes(),
                e.getCpu(),
                e.getRamGb(),
                e.getStorage(),
                e.getGpu(),
                e.getOs(),
                e.getFormFactor(),
                e.getDiagonalInch(),
                e.getResolution(),
                e.getPanelType(),
                e.getConnectors(),
                e.getPrintSpeedPpm(),
                e.getPrintColor(),
                e.getPrintFormat(),
                e.getWireless(),
                e.getSwitchType(),
                e.getPortCount(),
                e.getPowerVa(),
                e.getBatteryRuntimeMin(),
                (int) groupSize,
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}