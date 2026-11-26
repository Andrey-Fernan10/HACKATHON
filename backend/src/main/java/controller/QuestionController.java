package controller;

import model.Question;
import model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import repository.QuestionRepository;
import repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(
        origins = "*",
        allowedHeaders = "*",
        methods = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.DELETE,
                RequestMethod.OPTIONS
        }
)
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    public QuestionController(QuestionRepository questionRepository, UserRepository userRepository) {
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<QuestionResponse> list(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "Query", required = false) String queryUpper
    ) {
        String term = (query != null && !query.isBlank()) ? query.trim() : queryUpper;
        List<Question> questions = (term != null && !term.isBlank())
                ? questionRepository.findByContentContainingIgnoreCaseOrderByCreatedAtDesc(term.trim())
                : questionRepository.findAllByOrderByCreatedAtDesc();

        return questions.stream().map(QuestionResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        String content = body.get("content") != null ? body.get("content").toString().trim() : "";
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Conteúdo obrigatório"));
        }

        User author = null;
        if (body.get("authorId") != null) {
            try {
                Long authorId = Long.valueOf(body.get("authorId").toString());
                author = userRepository.findById(authorId).orElse(null);
            } catch (NumberFormatException ignored) {
            }
        }

        if (author == null && body.get("authorEmail") != null) {
            author = userRepository.findByEmail(body.get("authorEmail").toString().trim()).orElse(null);
        }

        Question saved = questionRepository.save(new Question(content, author));
        return ResponseEntity.ok(QuestionResponse.from(saved));
    }

    @PutMapping("/{id}/answer")
    public ResponseEntity<?> answer(@PathVariable Long id, @RequestBody AnswerRequest request) {
        if (request == null || request.answer() == null || request.answer().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "A resposta é obrigatória."));
        }

        String answer = request.answer().trim();
        if (answer.length() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("message", "A resposta deve ter no máximo 2000 caracteres."));
        }

        Question question = questionRepository.findById(id).orElse(null);
        if (question == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Pergunta não encontrada."));
        }

        question.setAnswer(answer);
        question.setStatus("Respondida");
        Question saved = questionRepository.save(question);
        return ResponseEntity.ok(QuestionResponse.from(saved));
    }

    public record QuestionResponse(
            Long id,
            String content,
            String answer,
            String status,
            LocalDateTime createdAt,
            AuthorResponse author
    ) {
        static QuestionResponse from(Question question) {
            AuthorResponse author = question.getAuthor() == null
                    ? null
                    : new AuthorResponse(question.getAuthor().getId(), question.getAuthor().getName());
            return new QuestionResponse(
                    question.getId(),
                    question.getContent(),
                    question.getAnswer(),
                    question.getStatus(),
                    question.getCreatedAt(),
                    author
            );
        }
    }

    public record AnswerRequest(String answer) {
    }

    public record AuthorResponse(Long id, String name) {
    }
}