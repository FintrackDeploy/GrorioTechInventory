package by.GroiroTechInventory.service;

import by.GroiroTechInventory.dto.room.RoomRequest;
import by.GroiroTechInventory.dto.room.RoomResponse;
import by.GroiroTechInventory.entity.Employee;
import by.GroiroTechInventory.entity.Floor;
import by.GroiroTechInventory.entity.Room;
import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.EmployeeRepository;
import by.GroiroTechInventory.repository.EquipmentRepository;
import by.GroiroTechInventory.repository.FloorRepository;
import by.GroiroTechInventory.repository.RoomRepository;
import by.GroiroTechInventory.repository.projection.RoomStatusCount;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;
    private final FloorRepository floorRepository;
    private final EmployeeRepository employeeRepository;
    private final EquipmentRepository equipmentRepository;

    public Page<RoomResponse> findAll(Long floorId, Pageable pageable) {
        Page<Room> rooms = floorId != null
                ? roomRepository.findByFloorId(floorId, pageable)
                : roomRepository.findAll(pageable);

        // Один агрегирующий запрос на всю страницу вместо трёх запросов
        // (IN_USE/REPAIR/STORAGE) на каждый кабинет.
        List<Long> roomIds = rooms.getContent().stream().map(Room::getId).toList();
        Map<Long, Map<EquipmentStatus, Long>> countsByRoom = loadCounts(roomIds);

        return rooms.map(room -> toResponse(room, countsByRoom.getOrDefault(room.getId(), Map.of())));
    }

    public RoomResponse findById(Long id) {
        Room room = getEntity(id);
        Map<Long, Map<EquipmentStatus, Long>> counts = loadCounts(List.of(room.getId()));
        return toResponse(room, counts.getOrDefault(room.getId(), Map.of()));
    }

    @Transactional
    public RoomResponse create(RoomRequest request) {
        Room room = Room.builder()
                .floor(getFloor(request.floorId()))
                .number(request.number())
                .name(request.name())
                .roomType(request.roomType())
                .employees(resolveEmployees(request.employeeIds()))
                .build();
        Room saved = roomRepository.save(room);
        // У нового кабинета оборудования ещё нет — считать не нужно.
        return toResponse(saved, Map.of());
    }

    @Transactional
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = getEntity(id);
        room.setFloor(getFloor(request.floorId()));
        room.setNumber(request.number());
        room.setName(request.name());
        room.setRoomType(request.roomType());
        room.setEmployees(resolveEmployees(request.employeeIds()));

        Map<Long, Map<EquipmentStatus, Long>> counts = loadCounts(List.of(room.getId()));
        return toResponse(room, counts.getOrDefault(room.getId(), Map.of()));
    }

    @Transactional
    public void delete(Long id) {
        roomRepository.delete(getEntity(id));
    }

    private Room getEntity(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Кабинет не найден: id=" + id));
    }

    private Floor getFloor(Long floorId) {
        return floorRepository.findById(floorId)
                .orElseThrow(() -> new NotFoundException("Этаж не найден: id=" + floorId));
    }

    private Set<Employee> resolveEmployees(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        return new HashSet<>(employeeRepository.findAllById(ids));
    }

    private Map<Long, Map<EquipmentStatus, Long>> loadCounts(List<Long> roomIds) {
        if (roomIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Map<EquipmentStatus, Long>> result = new HashMap<>();
        for (RoomStatusCount row : equipmentRepository.countGroupedByRoomAndStatusForRooms(roomIds)) {
            result.computeIfAbsent(row.getRoomId(), id -> new HashMap<>())
                    .put(row.getStatus(), row.getCnt());
        }
        return result;
    }

    private RoomResponse toResponse(Room room, Map<EquipmentStatus, Long> counts) {
        Floor floor = room.getFloor();

        long inUse = counts.getOrDefault(EquipmentStatus.IN_USE, 0L);
        long inRepair = counts.getOrDefault(EquipmentStatus.REPAIR, 0L);
        long inStorage = counts.getOrDefault(EquipmentStatus.STORAGE, 0L);
        long total = inUse + inRepair + inStorage;

        String mapStatus = RoomStatusCalculator.resolve(total, inRepair);

        List<RoomResponse.EmployeeRef> employeeRefs = room.getEmployees().stream()
                .map(e -> new RoomResponse.EmployeeRef(e.getId(), e.getFullName(), e.getPosition()))
                .sorted((a, b) -> a.fullName().compareTo(b.fullName()))
                .toList();

        return new RoomResponse(
                room.getId(),
                floor != null ? floor.getId() : null,
                floor != null ? floor.getNumber() : null,
                room.getNumber(),
                room.getName(),
                room.getRoomType(),
                employeeRefs,
                (int) total,
                (int) inRepair,
                (int) inStorage,
                mapStatus
        );
    }
}