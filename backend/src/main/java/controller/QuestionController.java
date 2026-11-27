package controller;

import dto.QuestionTriageResult;
import model.Answer;
import model.Question;
import model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import repository.QuestionRepository;
import repository.UserRepository;
import service.QuestionTriageService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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

    private static final Logger LOGGER = LoggerFactory.getLogger(QuestionController.class);

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final QuestionTriageService questionTriageService;

    public QuestionController(
            QuestionRepository questionRepository,
            UserRepository userRepository,
            QuestionTriageService questionTriageService
    ) {
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.questionTriageService = questionTriageService;
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
    public ResponseEntity<?> create(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Conteúdo obrigatório"));
        }

        String content = body.get("content") != null ? body.get("content").toString().trim() : "";
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Conteúdo obrigatório"));
        }
        if (content.length() > 1000) {
            return ResponseEntity.badRequest().body(Map.of("error", "A pergunta deve ter no máximo 1000 caracteres."));
        }

        User author = resolveAuthor(body);
        Question saved = questionRepository.save(new Question(content, author));
        try {
            QuestionTriageResult triage = triageQuestion(saved);
            return ResponseEntity.ok(QuestionResponse.from(saved, triage));
        } catch (QuestionTriageService.TriageException ex) {
            LOGGER.warn("Triagem indisponível para a pergunta {}.", saved.getId(), ex);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", "Pergunta salva, mas a triagem não está disponível. Tente novamente mais tarde.",
                    "questionId", saved.getId()
            ));
        }
    }

    @PostMapping("/{id}/answers")
    public ResponseEntity<?> addAnswer(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        String content = body == null || body.get("content") == null
                ? ""
                : body.get("content").toString().trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "A resposta é obrigatória."));
        }
        if (content.length() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("message", "A resposta deve ter no máximo 2000 caracteres."));
        }

        Question question = questionRepository.findById(id).orElse(null);
        if (question == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Pergunta não encontrada."));
        }

        question.addAnswer(new Answer(question, resolveAuthor(body), content));
        question.setStatus("Respondida");
        Question saved = questionRepository.save(question);
        return ResponseEntity.ok(QuestionResponse.from(saved));
    }

    @PostMapping("/{id}/triage")
    public ResponseEntity<?> triage(@PathVariable Long id) {
        Question question = questionRepository.findById(id).orElse(null);
        if (question == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Pergunta não encontrada."));
        }

        try {
            return ResponseEntity.ok(triageQuestion(question));
        } catch (QuestionTriageService.TriageException ex) {
            LOGGER.warn("Triagem indisponível para a pergunta {}.", question.getId(), ex);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", "A triagem não está disponível. Tente novamente mais tarde."
            ));
        }
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
            String subject,
            String topic,
            String difficulty,
            LocalDateTime createdAt,
            AuthorResponse author,
            List<AnswerResponse> answers,
            QuestionTriageResult triage
    ) {
        static QuestionResponse from(Question question) {
            return from(question, storedTriage(question));
        }

        static QuestionResponse from(Question question, QuestionTriageResult triage) {
            AuthorResponse author = question.getAuthor() == null
                    ? null
                    : new AuthorResponse(question.getAuthor().getId(), question.getAuthor().getName());
            List<AnswerResponse> answers = question.getAnswers() == null
                    ? List.of()
                    : question.getAnswers().stream().map(AnswerResponse::from).toList();
            return new QuestionResponse(
                    question.getId(),
                    question.getContent(),
                    question.getAnswer(),
                    question.getStatus(),
                    question.getSubject(),
                    question.getTopic(),
                    question.getDifficulty(),
                    question.getCreatedAt(),
                    author,
                    answers,
                    triage
            );
        }
    }

    private QuestionTriageResult triageQuestion(Question question) {
        List<Question> answeredQuestions = questionRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(existing -> !Objects.equals(existing.getId(), question.getId()))
                .filter(existing -> "Respondida".equalsIgnoreCase(existing.getStatus()))
                .filter(this::hasAnswer)
                .limit(10)
                .toList();

        QuestionTriageResult triage = questionTriageService.triage(question.getContent(), answeredQuestions);
        question.setSubject(triage.subject());
        question.setTopic(triage.topic());
        question.setDifficulty(triage.difficulty());
        question.setTriageVague(triage.isVague());
        question.setRewrittenQuestion(triage.rewrittenQuestion());
        question.setDuplicateQuestionId(triage.duplicateQuestionId());
        question.setSuggestedExistingAnswer(triage.suggestedExistingAnswer());
        question.setDraftAnswerForMonitor(triage.draftAnswerForMonitor());
        questionRepository.save(question);
        return triage;
    }

    private boolean hasAnswer(Question question) {
        if (question.getAnswer() != null && !question.getAnswer().isBlank()) {
            return true;
        }
        return question.getAnswers() != null && question.getAnswers().stream()
                .anyMatch(answer -> answer.getContent() != null && !answer.getContent().isBlank());
    }

    private static QuestionTriageResult storedTriage(Question question) {
        if (question.getSubject() == null && question.getTopic() == null && question.getDifficulty() == null
                && question.getTriageVague() == null && question.getRewrittenQuestion() == null
                && question.getDuplicateQuestionId() == null && question.getSuggestedExistingAnswer() == null
                && question.getDraftAnswerForMonitor() == null) {
            return null;
        }
        return new QuestionTriageResult(
                question.getSubject(),
                question.getTopic(),
                question.getDifficulty(),
                Boolean.TRUE.equals(question.getTriageVague()),
                question.getRewrittenQuestion(),
                question.getDuplicateQuestionId(),
                question.getSuggestedExistingAnswer(),
                question.getDraftAnswerForMonitor()
        );
    }

    private User resolveAuthor(Map<String, Object> body) {
        if (body.get("authorId") != null) {
            try {
                Long authorId = Long.valueOf(body.get("authorId").toString());
                User author = userRepository.findById(authorId).orElse(null);
                if (author != null) {
                    return author;
                }
            } catch (NumberFormatException ignored) {
            }
        }

        if (body.get("authorEmail") != null) {
            return userRepository.findByEmail(body.get("authorEmail").toString().trim()).orElse(null);
        }
        return null;
    }

    public record AnswerRequest(String answer) {
    }

    public record AnswerResponse(
            Long id,
            String content,
            int helpfulCount,
            int ratingSum,
            int ratingCount,
            AuthorResponse author
    ) {
        static AnswerResponse from(Answer answer) {
            AuthorResponse author = answer.getAuthor() == null
                    ? null
                    : new AuthorResponse(answer.getAuthor().getId(), answer.getAuthor().getName());
            return new AnswerResponse(
                    answer.getId(),
                    answer.getContent(),
                    answer.getHelpfulCount(),
                    answer.getRatingSum(),
                    answer.getRatingCount(),
                    author
            );
        }
    }

    public record AuthorResponse(Long id, String name) {
    }
}