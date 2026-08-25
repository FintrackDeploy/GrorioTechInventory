package by.GroiroTechInventory.repository;

import by.GroiroTechInventory.entity.Equipment;
import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.repository.projection.InventoryNumberCount;
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

    // Комплект техники по одному инвентарному номеру (POINT: теперь номер
    // не уникален — под ним может быть несколько единиц техники).
    @EntityGraph(attributePaths = {"room", "responsibleEmployee"})
    List<Equipment> findAllByInventoryNumberOrderByTypeAsc(String inventoryNumber);

    long countByInventoryNumber(String inventoryNumber);

    // Подсказки инвентарных номеров для автокомплита в форме.
    @Query("""
        SELECT DISTINCT e.inventoryNumber
        FROM Equipment e
        WHERE LOWER(e.inventoryNumber) LIKE LOWER(CONCAT('%', :q, '%'))
        ORDER BY e.inventoryNumber
        """)
    List<String> findDistinctInventoryNumbers(@Param("q") String q);

    // Сколько единиц техники под каждым инвентарным номером из набора —
    // используется, чтобы проставить groupSize странице списка одним
    // запросом вместо N+1.
    @Query("""
        SELECT e.inventoryNumber AS inventoryNumber, COUNT(e) AS cnt
        FROM Equipment e
        WHERE e.inventoryNumber IN :numbers
        GROUP BY e.inventoryNumber
        """)
    List<InventoryNumberCount> countByInventoryNumbers(@Param("numbers") List<String> numbers);

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

    @Query("""
        SELECT e.room.id AS roomId, e.status AS status, COUNT(e) AS cnt
        FROM Equipment e
        WHERE e.room IS NOT NULL
        GROUP BY e.room.id, e.status
        """)
    List<RoomStatusCount> countGroupedByRoomAndStatus();

    @Query("""
        SELECT e.room.id AS roomId, e.status AS status, COUNT(e) AS cnt
        FROM Equipment e
        WHERE e.room.id IN :roomIds
        GROUP BY e.room.id, e.status
        """)
    List<RoomStatusCount> countGroupedByRoomAndStatusForRooms(@Param("roomIds") List<Long> roomIds);
}