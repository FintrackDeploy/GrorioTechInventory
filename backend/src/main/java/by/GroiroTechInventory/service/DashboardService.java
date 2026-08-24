package by.GroiroTechInventory.service;

import by.GroiroTechInventory.dto.dashboard.DashboardSummaryResponse;
import by.GroiroTechInventory.entity.Room;
import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.enums.WorkStatus;
import by.GroiroTechInventory.repository.EquipmentRepository;
import by.GroiroTechInventory.repository.FloorRepository;
import by.GroiroTechInventory.repository.RoomRepository;
import by.GroiroTechInventory.repository.WorkLogRepository;
import by.GroiroTechInventory.repository.projection.RoomStatusCount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final EquipmentRepository equipmentRepository;
    private final WorkLogRepository workLogRepository;

    public DashboardSummaryResponse getSummary() {
        long totalFloors = floorRepository.count();

        // id всех кабинетов — нужен, чтобы кабинеты без единой записи
        // оборудования тоже посчитались как EMPTY, а не выпали из сводки.
        List<Long> roomIds = roomRepository.findAll().stream().map(Room::getId).toList();

        // Один агрегирующий запрос вместо N+1 (по 3 запроса на кабинет,
        // как это раньше делали RoomService/FloorPlanService для карты этажа).
        Map<Long, Map<EquipmentStatus, Long>> countsByRoom = new HashMap<>();
        for (RoomStatusCount row : equipmentRepository.countGroupedByRoomAndStatus()) {
            countsByRoom
                    .computeIfAbsent(row.getRoomId(), id -> new HashMap<>())
                    .put(row.getStatus(), row.getCnt());
        }

        long roomsOk = 0;
        long roomsWarning = 0;
        long roomsCritical = 0;
        long roomsEmpty = 0;

        for (Long roomId : roomIds) {
            Map<EquipmentStatus, Long> counts = countsByRoom.getOrDefault(roomId, Map.of());
            long inUse = counts.getOrDefault(EquipmentStatus.IN_USE, 0L);
            long inRepair = counts.getOrDefault(EquipmentStatus.REPAIR, 0L);
            long inStorage = counts.getOrDefault(EquipmentStatus.STORAGE, 0L);
            long total = inUse + inRepair + inStorage;

            // Единая формула — см. RoomStatusCalculator. Раньше была
            // продублирована вручную в трёх сервисах.
            switch (RoomStatusCalculator.resolve(total, inRepair)) {
                case "EMPTY" -> roomsEmpty++;
                case "OK" -> roomsOk++;
                case "CRITICAL" -> roomsCritical++;
                default -> roomsWarning++;
            }
        }

        long totalEquipment = equipmentRepository.count();
        long equipmentInUse = equipmentRepository.countByStatus(EquipmentStatus.IN_USE);
        long equipmentRepair = equipmentRepository.countByStatus(EquipmentStatus.REPAIR);
        long equipmentStorage = equipmentRepository.countByStatus(EquipmentStatus.STORAGE);
        long equipmentWrittenOff = equipmentRepository.countByStatus(EquipmentStatus.WRITTEN_OFF);

        long openWorkLogs = workLogRepository.countByStatus(WorkStatus.OPEN);
        long inProgressWorkLogs = workLogRepository.countByStatus(WorkStatus.IN_PROGRESS);

        return new DashboardSummaryResponse(
                totalFloors,
                roomIds.size(),
                roomsOk,
                roomsWarning,
                roomsCritical,
                roomsEmpty,
                totalEquipment,
                equipmentInUse,
                equipmentRepair,
                equipmentStorage,
                equipmentWrittenOff,
                openWorkLogs,
                inProgressWorkLogs
        );
    }
}