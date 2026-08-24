package by.GroiroTechInventory.repository;

import by.GroiroTechInventory.entity.Equipment;
import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.repository.projection.RoomStatusCount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long>, JpaSpecificationExecutor<Equipment> {

    @EntityGraph(attributePaths = {"room", "responsibleEmployee"})
    Optional<Equipment> findById(Long id);

    @EntityGraph(attributePaths = {"room", "responsibleEmployee"})
    Optional<Equipment> findByInventoryNumber(String inventoryNumber);

    @EntityGraph(attributePaths = {"room", "responsibleEmployee"})
    Page<Equipment> findAll(Specification<Equipment> spec, Pageable pageable);

    int countByRoomIdAndStatus(Long roomId, EquipmentStatus status);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.status = :status")
    long countByStatus(@Param("status") EquipmentStatus status);

    @Query("""
        SELECT e FROM Equipment e
        LEFT JOIN FETCH e.room
        LEFT JOIN FETCH e.responsibleEmployee
        WHERE LOWER(e.inventoryNumber) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(e.ipAddress)       LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(e.macAddress)      LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(e.cpu)             LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(e.os)              LIKE LOWER(CONCAT('%', :q, '%'))
        """)
    List<Equipment> search(@Param("q") String query);

    // Используется DashboardService — статистика по ВСЕМ кабинетам одним запросом.
    @Query("""
        SELECT e.room.id AS roomId, e.status AS status, COUNT(e) AS cnt
        FROM Equipment e
        WHERE e.room IS NOT NULL
        GROUP BY e.room.id, e.status
        """)
    List<RoomStatusCount> countGroupedByRoomAndStatus();

    // Используется RoomService/FloorPlanService — статистика только по
    // переданному набору кабинетов (страница списка или этаж), без
    // сканирования всей таблицы оборудования и без N+1 по одному запросу
    // на кабинет.
    @Query("""
        SELECT e.room.id AS roomId, e.status AS status, COUNT(e) AS cnt
        FROM Equipment e
        WHERE e.room.id IN :roomIds
        GROUP BY e.room.id, e.status
        """)
    List<RoomStatusCount> countGroupedByRoomAndStatusForRooms(@Param("roomIds") List<Long> roomIds);
}