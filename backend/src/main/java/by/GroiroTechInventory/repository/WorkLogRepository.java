package by.GroiroTechInventory.repository;

import by.GroiroTechInventory.entity.WorkLog;
import by.GroiroTechInventory.enums.WorkStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface WorkLogRepository extends JpaRepository<WorkLog, Long>, JpaSpecificationExecutor<WorkLog> {

    @EntityGraph(attributePaths = {"equipment", "executor"})
    Page<WorkLog> findByEquipmentId(Long equipmentId, Pageable pageable);

    @EntityGraph(attributePaths = {"equipment", "executor"})
    Page<WorkLog> findByStatus(WorkStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"equipment", "executor"})
    Page<WorkLog> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"equipment", "executor"})
    java.util.Optional<WorkLog> findById(Long id);

    // Используется DashboardController: счётчик активных заявок без загрузки
    // самих записей.
    long countByStatus(WorkStatus status);
}