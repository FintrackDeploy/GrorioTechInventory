package by.GroiroTechInventory.controller;

import by.GroiroTechInventory.dto.floorplan.FloorPlanResponse;
import by.GroiroTechInventory.service.FloorPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FloorPlanController {

    private final FloorPlanService floorPlanService;

    // Получить мета-информацию о плане (URL картинки + размеры)
    @GetMapping("/floors/{floorId}/plan")
    public FloorPlanResponse getPlan(@PathVariable Long floorId) {
        return floorPlanService.getPlanByFloorId(floorId);
    }

    // Загрузить/заменить фото плана (только ADMIN)
    @PostMapping(value = "/floors/{floorId}/plan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FloorPlanResponse> uploadPlan(
            @PathVariable Long floorId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(floorPlanService.uploadPlan(floorId, file));
    }
}