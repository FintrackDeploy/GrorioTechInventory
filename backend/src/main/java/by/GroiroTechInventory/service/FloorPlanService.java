package by.GroiroTechInventory.service;

import by.GroiroTechInventory.dto.floorplan.FloorPlanResponse;
import by.GroiroTechInventory.entity.Floor;
import by.GroiroTechInventory.entity.FloorPlan;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.FloorPlanRepository;
import by.GroiroTechInventory.repository.FloorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FloorPlanService {

    private final FloorPlanRepository floorPlanRepository;
    private final FloorRepository floorRepository;

    @Value("${app.upload-dir:uploads/floor-plans}")
    private String uploadDir;

    public FloorPlanResponse getPlanByFloorId(Long floorId) {
        FloorPlan plan = floorPlanRepository.findByFloorId(floorId)
                .orElseThrow(() -> new NotFoundException("План этажа не найден: floorId=" + floorId));
        return toFloorPlanResponse(plan);
    }

    @Transactional
    public FloorPlanResponse uploadPlan(Long floorId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Файл не передан или пуст");
        }

        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new NotFoundException("Этаж не найден: id=" + floorId));

        BufferedImage img = ImageIO.read(file.getInputStream());
        if (img == null) {
            throw new IllegalArgumentException("Файл не является изображением");
        }

        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);

        String filename = "floor-" + floorId + "-" + UUID.randomUUID() + getExtension(file.getOriginalFilename());
        Path target = dir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        FloorPlan plan = floorPlanRepository.findByFloorId(floorId)
                .orElse(FloorPlan.builder().floor(floor).build());

        if (plan.getImagePath() != null) {
            try {
                Path old = Paths.get(plan.getImagePath());
                if (!old.isAbsolute()) {
                    old = dir.resolve(old.getFileName());
                }
                Files.deleteIfExists(old);
            } catch (IOException ignored) {}
        }

        plan.setImagePath(filename);
        plan.setOriginalWidth(img.getWidth());
        plan.setOriginalHeight(img.getHeight());

        return toFloorPlanResponse(floorPlanRepository.save(plan));
    }

    // Возвращаем ОТНОСИТЕЛЬНЫЙ путь ("/uploads/floor-plans/xxx.jpg"), а не
    // абсолютный URL с хостом. Это принципиально: и nginx.conf (прод), и
    // vite.config.ts (dev) уже проксируют /uploads/** на бэкенд, поэтому
    // браузер сам подставит текущий хост/IP, с которого открыт сайт —
    // localhost, IP в локалке, домен и т.п. Раньше здесь был baseUrl
    // (app.base-url / APP_BASE_URL), из-за чего при заходе с другого ПК
    // картинка ссылалась на "localhost:8080" этого другого ПК и не грузилась.
    private String buildImageUrl(String imagePath) {
        if (imagePath == null) return null;
        String filename = Paths.get(imagePath).getFileName().toString();
        return "/uploads/floor-plans/" + filename;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        String ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        if (!List.of(".jpg", ".jpeg", ".png", ".webp", ".gif").contains(ext)) {
            return ".jpg";
        }
        return ext;
    }

    private FloorPlanResponse toFloorPlanResponse(FloorPlan plan) {
        return new FloorPlanResponse(
                plan.getId(),
                plan.getFloor().getId(),
                plan.getFloor().getNumber(),
                buildImageUrl(plan.getImagePath()),
                plan.getOriginalWidth(),
                plan.getOriginalHeight(),
                plan.getUpdatedAt()
        );
    }
}