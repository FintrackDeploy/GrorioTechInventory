package by.GroiroTechInventory.dto.worklog;

import by.GroiroTechInventory.enums.WorkStatus;
import by.GroiroTechInventory.enums.WorkType;

import java.time.LocalDateTime;

public record WorkLogResponse(
        Long id,
        Long equipmentId,
        String equipmentInventoryNumber,
        WorkType workType,
        String description,
        WorkStatus status,
        Long executorId,
        String executorName,
        Long requestedById,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        Integer timeSpentMinutes,
        String usedParts,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}