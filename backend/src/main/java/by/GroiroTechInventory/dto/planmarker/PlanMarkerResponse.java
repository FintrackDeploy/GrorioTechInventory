package by.GroiroTechInventory.dto.planmarker;

import by.GroiroTechInventory.enums.MarkerKind;

public record PlanMarkerResponse(
        Long id,
        Long floorId,
        Long markerTypeId,
        String markerTypeName,
        String markerTypeColor,
        MarkerKind kind,
        String points,
        String label
) {}