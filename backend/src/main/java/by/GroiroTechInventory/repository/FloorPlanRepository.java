package by.GroiroTechInventory.repository;

import by.GroiroTechInventory.entity.FloorPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FloorPlanRepository extends JpaRepository<FloorPlan, Long> {
    Optional<FloorPlan> findByFloorId(Long floorId);
    boolean existsByFloorId(Long floorId);
}