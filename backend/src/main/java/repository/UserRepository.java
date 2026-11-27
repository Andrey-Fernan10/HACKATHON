package repository;

import model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
// Pesquisa pelo email normalmente
    Optional<User> findByEmail(String email);

// Pesquisa ignorando as letras maiúsculas e minúsculas 
    Optional<User> findByEmailIgnoreCase(String email);
}
