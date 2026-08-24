package by.GroiroTechInventory.dto.employee;

public record EmployeeResponse(
        Long id,
        String fullName,
        String position,
        String department,
        String internalPhone,
        String email,
        Boolean isActive
) {
}