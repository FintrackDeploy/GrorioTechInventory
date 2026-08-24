package by.GroiroTechInventory.repository.projection;

import by.GroiroTechInventory.enums.EquipmentStatus;

/**
 * Проекция для агрегирующего запроса "количество оборудования по кабинету
 * и статусу" — используется DashboardService, чтобы посчитать mapStatus
 * каждого кабинета одним запросом вместо N+1 (как делают RoomService и
 * FloorPlanService по отдельности для каждого кабинета).
 */
public interface RoomStatusCount {
    Long getRoomId();
    EquipmentStatus getStatus();
    Long getCnt();
}