import configuration.GeminiProperties;
import model.User;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import repository.UserRepository;

import java.util.List;

@SpringBootApplication(scanBasePackages = {"controller", "repository", "model", "service"})
@EntityScan(basePackages = {"model"})
@EnableJpaRepositories(basePackages = {"repository"})
@EnableConfigurationProperties(GeminiProperties.class)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    ApplicationRunner migratePlaintextPasswords(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            List<User> usersToMigrate = userRepository.findAll().stream()
                    .filter(user -> !isBcryptHash(user.getPassword()))
                    .toList();
            usersToMigrate.forEach(user -> user.setPassword(passwordEncoder.encode(user.getPassword())));
            userRepository.saveAll(usersToMigrate);
        };
    }

    private static boolean isBcryptHash(String password) {
        return password != null && password.matches("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");
    }
}