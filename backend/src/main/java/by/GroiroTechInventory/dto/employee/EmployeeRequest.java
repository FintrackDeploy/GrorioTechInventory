package by.GroiroTechInventory.dto.employee;

import jakarta.validation.constraints.NotBlank;

public record EmployeeRequest(
        @NotBlank(message = "ФИО обязательно") String fullName,
        String position,
        String department,
        String internalPhone,
        String email,
        Boolean isActive
) {
}