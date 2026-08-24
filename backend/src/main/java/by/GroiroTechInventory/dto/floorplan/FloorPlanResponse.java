package by.GroiroTechInventory.dto.floorplan;

import java.time.LocalDateTime;

public record FloorPlanResponse(
        Long id,
        Long floorId,
        Integer floorNumber,
        String imageUrl,        // публичный URL, не путь на диске
        Integer originalWidth,
        Integer originalHeight,
        LocalDateTime updatedAt
) {}