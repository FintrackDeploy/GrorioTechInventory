package by.GroiroTechInventory.controller;

import by.GroiroTechInventory.dto.planmarker.PlanMarkerTypeRequest;
import by.GroiroTechInventory.dto.planmarker.PlanMarkerTypeResponse;
import by.GroiroTechInventory.service.PlanMarkerTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marker-types")
@RequiredArgsConstructor
public class PlanMarkerTypeController {

    private final PlanMarkerTypeService markerTypeService;

    @GetMapping
    public List<PlanMarkerTypeResponse> findAll() {
        return markerTypeService.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<PlanMarkerTypeResponse> create(@Valid @RequestBody PlanMarkerTypeRequest request) {
        return ResponseEntity.ok(markerTypeService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public PlanMarkerTypeResponse update(@PathVariable Long id, @Valid @RequestBody PlanMarkerTypeRequest request) {
        return markerTypeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        markerTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}