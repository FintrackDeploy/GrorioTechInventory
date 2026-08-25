package by.GroiroTechInventory.controller;

import by.GroiroTechInventory.dto.equipment.EquipmentBatchRequest;
import by.GroiroTechInventory.dto.equipment.EquipmentRequest;
import by.GroiroTechInventory.dto.equipment.EquipmentResponse;
import by.GroiroTechInventory.dto.equipment.InventoryGroupSuggestion;
import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.enums.EquipmentType;
import by.GroiroTechInventory.service.EquipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    public Page<EquipmentResponse> findAll(
            @RequestParam(required = false) EquipmentStatus status,
            @RequestParam(required = false) EquipmentType type,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return equipmentService.findAll(status, type, roomId, employeeId, q, pageable);
    }

    @GetMapping("/search")
    public List<EquipmentResponse> search(@RequestParam String q) {
        return equipmentService.search(q);
    }

    @GetMapping("/{id}")
    public EquipmentResponse findById(@PathVariable Long id) {
        return equipmentService.findById(id);
    }

    @GetMapping("/by-inventory-number/{inventoryNumber}")
    public EquipmentResponse findByInventoryNumber(@PathVariable String inventoryNumber) {
        return equipmentService.findByInventoryNumber(inventoryNumber);
    }

    // Весь комплект по инвентарному номеру (теперь номер не уникален).
    @GetMapping("/by-inventory-number/{inventoryNumber}/group")
    public List<EquipmentResponse> findGroup(@PathVariable String inventoryNumber) {
        return equipmentService.findGroupByInventoryNumber(inventoryNumber);
    }

    // Автоподсказка инвентарных номеров для формы создания/комплекта.
    @GetMapping("/inventory-numbers")
    public List<InventoryGroupSuggestion> suggestInventoryNumbers(@RequestParam String q) {
        return equipmentService.suggestInventoryNumbers(q);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<EquipmentResponse> create(@Valid @RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.create(request));
    }

    // Создание комплекта: несколько единиц техники одним инвентарным номером.
    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<List<EquipmentResponse>> createBatch(@Valid @RequestBody EquipmentBatchRequest request) {
        return ResponseEntity.ok(equipmentService.createBatch(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public EquipmentResponse update(@PathVariable Long id, @Valid @RequestBody EquipmentRequest request) {
        return equipmentService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public EquipmentResponse updateStatus(@PathVariable Long id, @RequestParam EquipmentStatus status) {
        return equipmentService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        equipmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}