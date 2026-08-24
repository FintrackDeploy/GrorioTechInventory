package by.GroiroTechInventory.dto.dashboard;

public record DashboardSummaryResponse(
        long totalFloors,
        long totalRooms,
        long roomsOk,
        long roomsWarning,
        long roomsCritical,
        long roomsEmpty,
        long totalEquipment,
        long equipmentInUse,
        long equipmentRepair,
        long equipmentStorage,
        long equipmentWrittenOff,
        long openWorkLogs,
        long inProgressWorkLogs
) {
}