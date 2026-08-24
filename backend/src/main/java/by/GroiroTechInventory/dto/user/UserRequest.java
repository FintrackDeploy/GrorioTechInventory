package by.GroiroTechInventory.dto.user;

import by.GroiroTechInventory.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotBlank(message = "Логин обязателен") String username,
        @Size(min = 6, message = "Пароль должен быть не короче 6 символов") String password,
        @NotBlank(message = "ФИО обязательно") String fullName,
        String email,
        @NotNull(message = "Роль обязательна") Role role,
        Boolean isActive
) {
}
