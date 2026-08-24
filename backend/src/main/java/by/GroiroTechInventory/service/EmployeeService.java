package by.GroiroTechInventory.service;

import by.GroiroTechInventory.dto.employee.EmployeeRequest;
import by.GroiroTechInventory.dto.employee.EmployeeResponse;
import by.GroiroTechInventory.entity.Employee;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public Page<EmployeeResponse> findAll(boolean onlyActive, Pageable pageable) {
        Page<Employee> employees = onlyActive
                ? employeeRepository.findByIsActiveTrue(pageable)
                : employeeRepository.findAll(pageable);
        return employees.map(this::toResponse);
    }

    public EmployeeResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        Employee employee = Employee.builder()
                .fullName(request.fullName())
                .position(request.position())
                .department(request.department())
                .internalPhone(request.internalPhone())
                .email(request.email())
                .isActive(request.isActive() == null ? Boolean.TRUE : request.isActive())
                .build();
        return toResponse(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee employee = getEntity(id);
        employee.setFullName(request.fullName());
        employee.setPosition(request.position());
        employee.setDepartment(request.department());
        employee.setInternalPhone(request.internalPhone());
        employee.setEmail(request.email());
        if (request.isActive() != null) {
            employee.setIsActive(request.isActive());
        }
        return toResponse(employee);
    }

    @Transactional
    public void delete(Long id) {
        employeeRepository.delete(getEntity(id));
    }

    private Employee getEntity(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Сотрудник не найден: id=" + id));
    }

    private EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getFullName(),
                employee.getPosition(),
                employee.getDepartment(),
                employee.getInternalPhone(),
                employee.getEmail(),
                employee.getIsActive()
        );
    }
}
