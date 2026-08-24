package by.GroiroTechInventory.controller;

import by.GroiroTechInventory.dto.worklog.WorkLogRequest;
import by.GroiroTechInventory.dto.worklog.WorkLogResponse;
import by.GroiroTechInventory.enums.WorkStatus;
import by.GroiroTechInventory.service.WorkLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/work-logs")
@RequiredArgsConstructor
public class WorkLogController {

    private final WorkLogService workLogService;

    @GetMapping
    public Page<WorkLogResponse> findAll(
            @RequestParam(required = false) Long equipmentId,
            @RequestParam(required = false) WorkStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return workLogService.findAll(equipmentId, status, pageable);
    }

    @GetMapping("/{id}")
    public WorkLogResponse findById(@PathVariable Long id) {
        return workLogService.findById(id);
    }

    @PostMapping
    public ResponseEntity<WorkLogResponse> create(@Valid @RequestBody WorkLogRequest request) {
        return ResponseEntity.ok(workLogService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public WorkLogResponse update(@PathVariable Long id, @Valid @RequestBody WorkLogRequest request) {
        return workLogService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public WorkLogResponse updateStatus(@PathVariable Long id, @RequestParam WorkStatus status) {
        return workLogService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        workLogService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
