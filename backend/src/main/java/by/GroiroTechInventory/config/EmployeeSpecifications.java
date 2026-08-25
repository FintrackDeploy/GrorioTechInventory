package by.GroiroTechInventory.config;

import by.GroiroTechInventory.entity.Employee;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public final class EmployeeSpecifications {

    private EmployeeSpecifications() {}

    public static Specification<Employee> withFilters(boolean onlyActive, String department) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (onlyActive) {
                predicates.add(cb.isTrue(root.get("isActive")));
            }
            if (department != null && !department.isBlank()) {
                predicates.add(cb.equal(root.get("department"), department));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}