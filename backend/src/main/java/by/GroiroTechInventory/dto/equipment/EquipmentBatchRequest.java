package by.GroiroTechInventory.dto.equipment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

// Создание комплекта: несколько единиц техники одним инвентарным номером
// за один запрос. inventoryNumber в каждом item игнорируется сервисом и
// принудительно выставляется общим — см. EquipmentService.createBatch.
public record EquipmentBatchRequest(
        @NotBlank(message = "Инвентарный номер обязателен") String inventoryNumber,
        @NotEmpty(message = "Добавьте хотя бы одну единицу техники")
        @Valid
        List<EquipmentRequest> items
) {
}