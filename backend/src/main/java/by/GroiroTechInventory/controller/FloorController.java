package by.GroiroTechInventory.controller;

import by.GroiroTechInventory.dto.floor.FloorRequest;
import by.GroiroTechInventory.dto.floor.FloorResponse;
import by.GroiroTechInventory.service.FloorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/floors")
@RequiredArgsConstructor
public class FloorController {

    private final FloorService floorService;

    @GetMapping
    public List<FloorResponse> findAll() {
        return floorService.findAll();
    }

    @GetMapping("/{id}")
    public FloorResponse findById(@PathVariable Long id) {
        return floorService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FloorResponse> create(@Valid @RequestBody FloorRequest request) {
        return ResponseEntity.ok(floorService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public FloorResponse update(@PathVariable Long id, @Valid @RequestBody FloorRequest request) {
        return floorService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        floorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}