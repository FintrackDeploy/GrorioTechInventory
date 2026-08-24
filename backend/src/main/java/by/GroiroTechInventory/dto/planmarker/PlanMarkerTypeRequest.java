package by.GroiroTechInventory.dto.planmarker;

import by.GroiroTechInventory.enums.MarkerKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlanMarkerTypeRequest(
        @NotBlank(message = "Название типа обязательно") String name,
        @NotBlank(message = "Цвет обязателен") String color,
        @NotNull(message = "Вид маркера обязателен") MarkerKind kind
) {}