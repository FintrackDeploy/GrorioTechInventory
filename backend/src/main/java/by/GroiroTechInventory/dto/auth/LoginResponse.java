package by.GroiroTechInventory.dto.auth;

public record LoginResponse(
        String token,
        Long id,
        String username,
        String fullName,
        String role
) {
}