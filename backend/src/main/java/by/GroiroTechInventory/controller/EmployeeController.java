package by.GroiroTechInventory.controller;

import by.GroiroTechInventory.dto.employee.DepartmentSummaryResponse;
import by.GroiroTechInventory.dto.employee.EmployeeRequest;
import by.GroiroTechInventory.dto.employee.EmployeeResponse;
import by.GroiroTechInventory.service.EmployeeService;
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
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public Page<EmployeeResponse> findAll(
            @RequestParam(defaultValue = "false") boolean onlyActive,
            @RequestParam(required = false) String department,
            @PageableDefault(size = 50, sort = "fullName") Pageable pageable) {
        return employeeService.findAll(onlyActive, department, pageable);
    }

    // Сводка по отделам — для сайдбара-фильтра на странице сотрудников.
    @GetMapping("/departments")
    public List<DepartmentSummaryResponse> findDepartments() {
        return employeeService.findDepartments();
    }

    @GetMapping("/{id}")
    public EmployeeResponse findById(@PathVariable Long id) {
        return employeeService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EmployeeResponse update(@PathVariable Long id, @Valid @RequestBody EmployeeRequest request) {
        return employeeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}