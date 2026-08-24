package by.GroiroTechInventory.dto.planmarker;

import by.GroiroTechInventory.enums.MarkerKind;

public record PlanMarkerTypeResponse(
        Long id,
        String name,
        String color,
        MarkerKind kind
) {}