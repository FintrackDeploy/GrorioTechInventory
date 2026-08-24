package by.GroiroTechInventory.service;

import by.GroiroTechInventory.dto.worklog.WorkLogRequest;
import by.GroiroTechInventory.dto.worklog.WorkLogResponse;
import by.GroiroTechInventory.entity.Equipment;
import by.GroiroTechInventory.entity.User;
import by.GroiroTechInventory.entity.WorkLog;
import by.GroiroTechInventory.enums.WorkStatus;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.EquipmentRepository;
import by.GroiroTechInventory.repository.UserRepository;
import by.GroiroTechInventory.repository.WorkLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkLogService {

    private final WorkLogRepository workLogRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    public Page<WorkLogResponse> findAll(Long equipmentId, WorkStatus status, Pageable pageable) {
        Page<WorkLog> page;
        if (equipmentId != null) {
            page = workLogRepository.findByEquipmentId(equipmentId, pageable);
        } else if (status != null) {
            page = workLogRepository.findByStatus(status, pageable);
        } else {
            page = workLogRepository.findAll(pageable);
        }
        return page.map(this::toResponse);
    }

    public WorkLogResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public WorkLogResponse create(WorkLogRequest request) {
        WorkLog workLog = WorkLog.builder()
                .equipment(getEquipment(request.equipmentId()))
                .workType(request.workType())
                .description(request.description())
                .status(request.status() == null ? WorkStatus.OPEN : request.status())
                .executor(resolveExecutor(request.executorId()))
                .requestedById(request.requestedById())
                .startedAt(request.startedAt())
                .finishedAt(request.finishedAt())
                .timeSpentMinutes(request.timeSpentMinutes())
                .usedParts(request.usedParts())
                .build();
        return toResponse(workLogRepository.save(workLog));
    }

    @Transactional
    public WorkLogResponse update(Long id, WorkLogRequest request) {
        WorkLog workLog = getEntity(id);
        workLog.setEquipment(getEquipment(request.equipmentId()));
        workLog.setWorkType(request.workType());
        workLog.setDescription(request.description());
        if (request.status() != null) {
            workLog.setStatus(request.status());
        }
        workLog.setExecutor(resolveExecutor(request.executorId()));
        workLog.setRequestedById(request.requestedById());
        workLog.setStartedAt(request.startedAt());
        workLog.setFinishedAt(request.finishedAt());
        workLog.setTimeSpentMinutes(request.timeSpentMinutes());
        workLog.setUsedParts(request.usedParts());
        return toResponse(workLog);
    }

    @Transactional
    public WorkLogResponse updateStatus(Long id, WorkStatus status) {
        WorkLog workLog = getEntity(id);
        workLog.setStatus(status);
        return toResponse(workLog);
    }

    @Transactional
    public void delete(Long id) {
        workLogRepository.delete(getEntity(id));
    }

    private WorkLog getEntity(Long id) {
        return workLogRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Заявка не найдена: id=" + id));
    }

    private Equipment getEquipment(Long equipmentId) {
        return equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new NotFoundException("Оборудование не найдено: id=" + equipmentId));
    }

    private User resolveExecutor(Long executorId) {
        if (executorId == null) {
            return null;
        }
        return userRepository.findById(executorId)
                .orElseThrow(() -> new NotFoundException("Исполнитель не найден: id=" + executorId));
    }

    private WorkLogResponse toResponse(WorkLog w) {
        User executor = w.getExecutor();
        Equipment eq = w.getEquipment();
        return new WorkLogResponse(
                w.getId(),
                eq != null ? eq.getId() : null,
                eq != null ? eq.getInventoryNumber() : null,
                w.getWorkType(),
                w.getDescription(),
                w.getStatus(),
                executor != null ? executor.getId() : null,
                executor != null ? executor.getFullName() : null,
                w.getRequestedById(),
                w.getStartedAt(),
                w.getFinishedAt(),
                w.getTimeSpentMinutes(),
                w.getUsedParts(),
                w.getCreatedAt(),
                w.getUpdatedAt()
        );
    }
}
