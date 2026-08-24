package by.GroiroTechInventory.controller;

import by.GroiroTechInventory.dto.dashboard.DashboardSummaryResponse;
import by.GroiroTechInventory.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // Доступен любой аутентифицированной роли (как и сам дашборд на фронте) —
    // отдельного @PreAuthorize не требуется, действует общее правило
    // .anyRequest().authenticated() из SecurityConfig.
    @GetMapping("/summary")
    public DashboardSummaryResponse getSummary() {
        return dashboardService.getSummary();
    }
}