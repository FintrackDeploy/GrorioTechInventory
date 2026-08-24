package by.GroiroTechInventory.service;

/**
 * Единое правило расчёта статуса кабинета по количеству оборудования и
 * оборудования в ремонте. Раньше эта формула была продублирована в
 * RoomService, FloorPlanService и DashboardService — держали её синхронной
 * вручную. Теперь все три места вызывают этот класс.
 */
public final class RoomStatusCalculator {

    private RoomStatusCalculator() {}

    public static String resolve(long total, long inRepair) {
        if (total == 0) {
            return "EMPTY";
        }
        if (inRepair == 0) {
            return "OK";
        }
        if ((double) inRepair / total >= 0.5) {
            return "CRITICAL";
        }
        return "WARNING";
    }
}