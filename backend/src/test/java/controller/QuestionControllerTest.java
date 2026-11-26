package controller;

import model.Question;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import repository.QuestionRepository;
import repository.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class QuestionControllerTest {

    @Test
    void answeringQuestionPersistsAnswerAndReturnsUpdatedQuestion() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        QuestionController controller = new QuestionController(questionRepository, userRepository);
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
        verify(questionRepository).save(question);
    }

    @Test
    void rejectsBlankAnswersWithoutUpdatingQuestion() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        QuestionController controller = new QuestionController(questionRepository, mock(UserRepository.class));

        ResponseEntity<?> response = controller.answer(42L, new QuestionController.AnswerRequest("   "));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }
}
