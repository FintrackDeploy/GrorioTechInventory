package by.GroiroTechInventory.dto.floor;

import jakarta.validation.constraints.NotNull;

public record FloorRequest(
        @NotNull(message = "Номер этажа обязателен") Integer number,
        String name
) {
}