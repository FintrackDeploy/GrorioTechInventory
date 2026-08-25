package by.GroiroTechInventory.repository;

import by.GroiroTechInventory.entity.Employee;
import by.GroiroTechInventory.repository.projection.DepartmentCount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
    List<Employee> findByIsActiveTrue();
    Page<Employee> findByIsActiveTrue(Pageable pageable);
    Page<Employee> findAll(Pageable pageable);

    // Сводка по отделам для фильтра-сайдбара на странице сотрудников:
    // название отдела + сколько сотрудников в нём числится (пустые/null
    // отделы в сводку не попадают — для них фильтрации по клику не нужно).
    @Query("""
        SELECT e.department AS department, COUNT(e) AS cnt
        FROM Employee e
        WHERE e.department IS NOT NULL AND e.department <> ''
        GROUP BY e.department
        ORDER BY e.department
        """)
    List<DepartmentCount> countGroupedByDepartment();
}