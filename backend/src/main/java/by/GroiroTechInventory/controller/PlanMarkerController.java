package by.GroiroTechInventory.controller;

import by.GroiroTechInventory.dto.planmarker.PlanMarkerRequest;
import by.GroiroTechInventory.dto.planmarker.PlanMarkerResponse;
import by.GroiroTechInventory.service.PlanMarkerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlanMarkerController {

    private final PlanMarkerService markerService;

    @GetMapping("/floors/{floorId}/markers")
    public List<PlanMarkerResponse> findByFloor(@PathVariable Long floorId) {
        return markerService.findByFloor(floorId);
    }

    @PostMapping("/floors/{floorId}/markers")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<PlanMarkerResponse> create(@PathVariable Long floorId,
                                                     @Valid @RequestBody PlanMarkerRequest request) {
        return ResponseEntity.ok(markerService.create(floorId, request));
    }

    @PutMapping("/markers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public PlanMarkerResponse update(@PathVariable Long id, @Valid @RequestBody PlanMarkerRequest request) {
        return markerService.update(id, request);
    }

    @DeleteMapping("/markers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        markerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}