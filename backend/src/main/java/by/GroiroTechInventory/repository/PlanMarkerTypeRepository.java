package by.GroiroTechInventory.repository;

import by.GroiroTechInventory.entity.PlanMarkerType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanMarkerTypeRepository extends JpaRepository<PlanMarkerType, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    List<PlanMarkerType> findAllByOrderByNameAsc();
}