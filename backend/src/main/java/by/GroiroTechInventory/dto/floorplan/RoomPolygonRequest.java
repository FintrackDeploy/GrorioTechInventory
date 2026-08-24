package by.GroiroTechInventory.dto.floorplan;

import jakarta.validation.constraints.NotBlank;

public record RoomPolygonRequest(
        @NotBlank(message = "Точки полигона обязательны") String points,
        Double labelX,
        Double labelY
) {}