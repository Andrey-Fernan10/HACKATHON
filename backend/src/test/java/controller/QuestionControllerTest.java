package controller;

import dto.QuestionTriageResult;
import model.Question;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import repository.QuestionRepository;
import repository.UserRepository;
import service.QuestionTriageService;

import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class QuestionControllerTest {

    @Test
    void answeringQuestionPersistsAnswerAndReturnsUpdatedQuestion() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        QuestionTriageService questionTriageService = mock(QuestionTriageService.class);
        QuestionController controller = new QuestionController(
                questionRepository,
                userRepository,
                questionTriageService
        );
        Question question = new Question("Como estudar?", null);
        question.setId(42L);
        when(questionRepository.findById(42L)).thenReturn(Optional.of(question));
        when(questionRepository.save(question)).thenReturn(question);

        ResponseEntity<?> response = controller.answer(
                42L,
                new QuestionController.AnswerRequest("  Faça um plano de estudos.  ")
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        QuestionController.QuestionResponse body =
                assertInstanceOf(QuestionController.QuestionResponse.class, response.getBody());
        assertEquals("Faça um plano de estudos.", body.answer());
        assertEquals("Respondida", body.status());
        assertNull(body.subject());
        assertNull(body.topic());
        assertNull(body.difficulty());
        verify(questionRepository).save(question);
    }

    @Test
    void rejectsBlankAnswersWithoutUpdatingQuestion() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        QuestionTriageService questionTriageService = mock(QuestionTriageService.class);
        QuestionController controller = new QuestionController(
                questionRepository,
                mock(UserRepository.class),
                questionTriageService
        );

        ResponseEntity<?> response = controller.answer(42L, new QuestionController.AnswerRequest("   "));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void addingAnswerReturnsItInQuestionAndMarksQuestionAnswered() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        QuestionController controller = new QuestionController(
                questionRepository,
                userRepository,
                mock(QuestionTriageService.class)
        );
        Question question = new Question("Como estudar?", null);
        question.setId(42L);
        when(questionRepository.findById(42L)).thenReturn(Optional.of(question));
        when(questionRepository.save(question)).thenReturn(question);

        ResponseEntity<?> response = controller.addAnswer(
                42L,
                java.util.Map.of("content", "Faça um plano de estudos.")
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        QuestionController.QuestionResponse body =
                assertInstanceOf(QuestionController.QuestionResponse.class, response.getBody());
        assertEquals("Respondida", body.status());
        assertEquals(1, body.answers().size());
        assertEquals("Faça um plano de estudos.", body.answers().get(0).content());
        verify(questionRepository).save(question);
    }

    @Test
    void rejectsBlankNewAnswerWithoutUpdatingQuestion() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        QuestionController controller = new QuestionController(
                questionRepository,
                mock(UserRepository.class),
                mock(QuestionTriageService.class)
        );

        ResponseEntity<?> response = controller.addAnswer(42L, java.util.Map.of("content", "  "));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void createsQuestionWithPersistedTriage() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        QuestionTriageService triageService = mock(QuestionTriageService.class);
        QuestionController controller = new QuestionController(
                questionRepository,
                mock(UserRepository.class),
                triageService
        );
        QuestionTriageResult triage = new QuestionTriageResult(
                "Programação",
                "Java",
                "Intermediário",
                true,
                "Como declarar uma variável em Java?",
                null,
                null,
                "Explique a declaração de variáveis."
        );
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question question = invocation.getArgument(0);
            question.setId(42L);
            return question;
        });
        when(questionRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(triageService.triage(eq("Como Java?"), anyList())).thenReturn(triage);

        ResponseEntity<?> response = controller.create(java.util.Map.of("content", "Como Java?"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        QuestionController.QuestionResponse body =
                assertInstanceOf(QuestionController.QuestionResponse.class, response.getBody());
        assertEquals(triage, body.triage());
        assertEquals("Programação", body.subject());
        verify(questionRepository, times(2)).save(any(Question.class));
    }

    @Test
    void reportsTriageFailureAfterSavingQuestion() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        QuestionTriageService triageService = mock(QuestionTriageService.class);
        QuestionController controller = new QuestionController(
                questionRepository,
                mock(UserRepository.class),
                triageService
        );
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question question = invocation.getArgument(0);
            question.setId(42L);
            return question;
        });
        when(questionRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(triageService.triage(eq("Como Java?"), anyList()))
                .thenThrow(new QuestionTriageService.TriageException("Gemini indisponível."));

        ResponseEntity<?> response = controller.create(java.util.Map.of("content", "Como Java?"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        verify(questionRepository).save(any(Question.class));
    }
}