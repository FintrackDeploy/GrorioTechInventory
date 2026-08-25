package by.GroiroTechInventory.repository.projection;

// Проекция для подсчёта, сколько единиц техники заведено под каждым
// инвентарным номером — нужно EquipmentService, чтобы одним запросом
// проставить groupSize всей странице списка (без N+1).
public interface InventoryNumberCount {
    String getInventoryNumber();
    Long getCnt();
}