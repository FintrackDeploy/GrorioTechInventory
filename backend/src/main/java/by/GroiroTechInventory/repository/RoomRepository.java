package by.GroiroTechInventory.repository;

import by.GroiroTechInventory.entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    @EntityGraph(attributePaths = {"floor", "employees"})
    List<Room> findByFloorId(Long floorId);

    @EntityGraph(attributePaths = {"floor", "employees"})
    Page<Room> findByFloorId(Long floorId, Pageable pageable);

    @EntityGraph(attributePaths = {"floor", "employees"})
    Page<Room> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"floor", "employees"})
    Optional<Room> findById(Long id);
}