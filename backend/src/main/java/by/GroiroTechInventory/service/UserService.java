package by.GroiroTechInventory.service;

import by.GroiroTechInventory.dto.user.UserRequest;
import by.GroiroTechInventory.dto.user.UserResponse;
import by.GroiroTechInventory.entity.User;
import by.GroiroTechInventory.exception.NotFoundException;
import by.GroiroTechInventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    public UserResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Пароль обязателен при создании пользователя");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new DataIntegrityViolationException("Логин уже занят: " + request.username());
        }

        User user = User.builder()
                .username(request.username().trim())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .email(request.email())
                .role(request.role())
                .isActive(request.isActive() == null ? Boolean.TRUE : request.isActive())
                .build();

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        User user = getEntity(id);

        if (!user.getUsername().equals(request.username())
                && userRepository.existsByUsername(request.username())) {
            throw new DataIntegrityViolationException("Логин уже занят: " + request.username());
        }

        user.setUsername(request.username().trim());
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setRole(request.role());

        if (request.isActive() != null) {
            user.setIsActive(request.isActive());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        return toResponse(user);
    }

    @Transactional
    public void delete(Long id) {
        userRepository.delete(getEntity(id));
    }

    private User getEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Пользователь не найден: id=" + id));
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(
                u.getId(),
                u.getUsername(),
                u.getFullName(),
                u.getEmail(),
                u.getRole(),
                u.getIsActive(),
                u.getCreatedAt()
        );
    }
}
