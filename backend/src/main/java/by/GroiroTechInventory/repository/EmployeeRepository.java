package by.GroiroTechInventory.repository;

import by.GroiroTechInventory.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByIsActiveTrue();
    Page<Employee> findByIsActiveTrue(Pageable pageable);
    Page<Employee> findAll(Pageable pageable);
}
