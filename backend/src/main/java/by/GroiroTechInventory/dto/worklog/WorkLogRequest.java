package by.GroiroTechInventory.dto.worklog;

import by.GroiroTechInventory.enums.WorkStatus;
import by.GroiroTechInventory.enums.WorkType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record WorkLogRequest(
        @NotNull(message = "Оборудование обязательно") Long equipmentId,
        @NotNull(message = "Тип работы обязателен") WorkType workType,
        String description,
        WorkStatus status,
        Long executorId,
        Long requestedById,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        Integer timeSpentMinutes,
        String usedParts
) {
}