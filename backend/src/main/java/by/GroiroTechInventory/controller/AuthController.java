package by.GroiroTechInventory.controller;

import by.GroiroTechInventory.dto.auth.LoginRequest;
import by.GroiroTechInventory.dto.auth.LoginResponse;
import by.GroiroTechInventory.security.JwtService;
import by.GroiroTechInventory.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtService.generateToken(principal);

        LoginResponse response = new LoginResponse(
                token,
                principal.getUser().getId(),
                principal.getUsername(),
                principal.getUser().getFullName(),
                principal.getUser().getRole().name()
        );

        return ResponseEntity.ok(response);
    }
}