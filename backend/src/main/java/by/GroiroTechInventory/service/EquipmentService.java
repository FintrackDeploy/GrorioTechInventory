package by.GroiroTechInventory.service;

import by.GroiroTechInventory.config.EquipmentSpecifications;
import by.GroiroTechInventory.dto.equipment.EquipmentRequest;
import by.GroiroTechInventory.dto.equipment.EquipmentResponse;
import by.GroiroTechInventory.entity.Employee;
import by.GroiroTechInventory.entity.Equipment;
import by.GroiroTechInventory.entity.Room;
import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.enums.EquipmentType;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.EmployeeRepository;
import by.GroiroTechInventory.repository.EquipmentRepository;
import by.GroiroTechInventory.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
        return equipmentRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public List<EquipmentResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return equipmentRepository.search(query.trim()).stream().map(this::toResponse).toList();
    }

    public EquipmentResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    public EquipmentResponse findByInventoryNumber(String inventoryNumber) {
        return equipmentRepository.findByInventoryNumber(inventoryNumber)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Оборудование не найдено: inv=" + inventoryNumber));
    }

    @Transactional
    public EquipmentResponse create(EquipmentRequest request) {
        if (equipmentRepository.findByInventoryNumber(request.inventoryNumber()).isPresent()) {
            throw new IllegalArgumentException("Инвентарный номер уже существует: " + request.inventoryNumber());
        }

        Equipment equipment = buildFromRequest(new Equipment(), request);
        equipment.setInventoryNumber(request.inventoryNumber().trim());
        return toResponse(equipmentRepository.save(equipment));
    }

    @Transactional
    public EquipmentResponse update(Long id, EquipmentRequest request) {
        Equipment equipment = getEntity(id);

        equipmentRepository.findByInventoryNumber(request.inventoryNumber())
                .filter(e -> !e.getId().equals(id))
                .ifPresent(e -> {
                    throw new IllegalArgumentException("Инвентарный номер уже существует: " + request.inventoryNumber());
                });

        equipment.setInventoryNumber(request.inventoryNumber().trim());
        buildFromRequest(equipment, request);
        return toResponse(equipment);
    }

    @Transactional
    public EquipmentResponse updateStatus(Long id, EquipmentStatus status) {
        Equipment equipment = getEntity(id);
        equipment.setStatus(status);
        return toResponse(equipment);
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

        // ПК / Ноутбук
        equipment.setCpu(blankToNull(request.cpu()));
        equipment.setRamGb(request.ramGb());
        equipment.setStorage(blankToNull(request.storage()));
        equipment.setGpu(blankToNull(request.gpu()));
        equipment.setOs(blankToNull(request.os()));
        equipment.setFormFactor(blankToNull(request.formFactor()));

        // Монитор / Проектор
        equipment.setDiagonalInch(request.diagonalInch());
        equipment.setResolution(blankToNull(request.resolution()));
        equipment.setPanelType(blankToNull(request.panelType()));
        equipment.setConnectors(blankToNull(request.connectors()));

        // Принтер / МФУ
        equipment.setPrintSpeedPpm(request.printSpeedPpm());
        equipment.setPrintColor(request.printColor());
        equipment.setPrintFormat(blankToNull(request.printFormat()));

        // Мышь / Клавиатура
        equipment.setWireless(request.wireless());
        equipment.setSwitchType(blankToNull(request.switchType()));

        // Сеть / ИБП
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

    private EquipmentResponse toResponse(Equipment e) {
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
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}