package controller;

import model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import repository.UserRepository;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.name() == null || request.name().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()
                || request.role() == null || request.role().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nome, email, senha e perfil são obrigatórios."));
        }

        String email = request.email().trim();
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Já existe uma conta com este email."));
        }

        if (!request.role().equals("Student") && !request.role().equals("Teacher")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Perfil inválido."));
        }

        User user = userRepository.save(new User(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                request.role()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email e senha são obrigatórios."));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.email().trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não encontrado."));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Senha inválida."));
        }

        return ResponseEntity.ok(new AuthenticatedUser(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        ));
    }

    public record RegisterRequest(String name, String email, String password, String role) {}
    public record LoginRequest(String email, String password) {}
    public record AuthenticatedUser(Long id, String name, String email, String role) {}
}