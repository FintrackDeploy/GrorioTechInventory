package by.GroiroTechInventory.config;

import by.GroiroTechInventory.entity.Equipment;
import by.GroiroTechInventory.enums.EquipmentStatus;
import by.GroiroTechInventory.enums.EquipmentType;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public final class EquipmentSpecifications {

    private EquipmentSpecifications() {}

    public static Specification<Equipment> withFilters(EquipmentStatus status,
                                                       EquipmentType type,
                                                       Long roomId,
                                                       Long employeeId,
                                                       String q) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (roomId != null) {
                predicates.add(cb.equal(root.get("room").get("id"), roomId));
            }
            if (employeeId != null) {
                predicates.add(cb.equal(root.get("responsibleEmployee").get("id"), employeeId));
            }
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("inventoryNumber")), pattern),
                        cb.like(cb.lower(root.get("ipAddress")), pattern),
                        cb.like(cb.lower(root.get("macAddress")), pattern),
                        cb.like(cb.lower(root.get("cpu")), pattern),
                        cb.like(cb.lower(root.get("os")), pattern),
                        cb.like(cb.lower(root.get("notes")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}