package by.GroiroTechInventory.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Раздаёт файлы планов этажей, загруженные через FloorPlanService.uploadPlan,
 * по HTTP. Без этого конфига /uploads/floor-plans/** возвращает 404 —
 * Spring Boot по умолчанию не раздаёт файлы из произвольной директории на
 * диске, только из classpath:/static, /public и т.п.
 *
 * URL здесь ("/uploads/floor-plans/**") должен совпадать с тем, что строит
 * FloorPlanService.buildImageUrl(): baseUrl + "/uploads/floor-plans/" + filename.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:uploads/floor-plans}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        String location = "file:" + dir + "/";

        registry.addResourceHandler("/uploads/floor-plans/**")
                .addResourceLocations(location);
    }
}