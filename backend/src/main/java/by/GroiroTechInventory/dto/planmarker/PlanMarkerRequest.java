package by.GroiroTechInventory.dto.planmarker;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlanMarkerRequest(
        @NotNull(message = "Тип маркера обязателен") Long markerTypeId,
        @NotBlank(message = "Координаты обязательны") String points,
        String label
) {}