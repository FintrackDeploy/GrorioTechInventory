package by.GroiroTechInventory.repository;

import by.GroiroTechInventory.entity.PlanMarker;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanMarkerRepository extends JpaRepository<PlanMarker, Long> {

    @EntityGraph(attributePaths = {"markerType"})
    List<PlanMarker> findByFloorIdOrderById(Long floorId);
}