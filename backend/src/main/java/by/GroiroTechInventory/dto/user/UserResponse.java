package by.GroiroTechInventory.dto.user;

import by.GroiroTechInventory.enums.Role;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String fullName,
        String email,
        Role role,
        Boolean isActive,
        LocalDateTime createdAt
) {
}
