package controller;

import model.Answer;
import model.AnswerRating;
import model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import repository.AnswerRepository;
import repository.AnswerRatingRepository;
import repository.UserRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/answers")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.POST, RequestMethod.OPTIONS})
public class AnswerController {

    private final AnswerRepository answerRepository;
    private final AnswerRatingRepository answerRatingRepository;
    private final UserRepository userRepository;

    public AnswerController(
            AnswerRepository answerRepository,
            AnswerRatingRepository answerRatingRepository,
            UserRepository userRepository
    ) {
        this.answerRepository = answerRepository;
        this.answerRatingRepository = answerRatingRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/{id}/rating")
    @Transactional
    public ResponseEntity<?> rate(@PathVariable Long id, @RequestBody(required = false) RatingRequest request) {
        if (request == null || request.score() == null || request.score() < 1 || request.score() > 5) {
            return ResponseEntity.badRequest().body(Map.of("message", "A avaliação deve ser entre 1 e 5 estrelas."));
        }

        Answer answer = answerRepository.findById(id).orElse(null);
        if (answer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Resposta não encontrada."));
        }

        User user = resolveUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Entre na sua conta para avaliar uma resposta."));
        }

        Long questionId = answer.getQuestion().getId();
        if (answerRatingRepository.existsByQuestion_IdAndUser_Id(questionId, user.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Esta conta já avaliou uma resposta desta pergunta."));
        }

        AnswerRating rating = new AnswerRating();
        rating.setAnswer(answer);
        rating.setQuestion(answer.getQuestion());
        rating.setUser(user);
        rating.setScore(request.score());
        answerRatingRepository.save(rating);

        answer.addRating(request.score());
        Answer saved = answerRepository.save(answer);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "ratingSum", saved.getRatingSum(),
                "ratingCount", saved.getRatingCount()
        ));
    }

    private User resolveUser(RatingRequest request) {
        if (request.userId() != null) {
            User user = userRepository.findById(request.userId()).orElse(null);
            if (user != null) {
                return user;
            }
        }
        if (request.userEmail() != null && !request.userEmail().isBlank()) {
            return userRepository.findByEmail(request.userEmail().trim()).orElse(null);
        }
        return null;
    }

    public record RatingRequest(Integer score, Long userId, String userEmail) {
    }
}
