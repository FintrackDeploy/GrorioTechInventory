package by.GroiroTechInventory.dto.equipment;

// Подсказка при вводе инвентарного номера в форме: уже существующий номер
// вместе со сводкой, чтобы новую единицу техники можно было "докинуть"
// в уже существующий комплект с теми же кабинетом/ответственным.
public record InventoryGroupSuggestion(
        String inventoryNumber,
        long itemsCount,
        Long roomId,
        String roomNumber,
        Long responsibleEmployeeId,
        String responsibleEmployeeName
) {
}