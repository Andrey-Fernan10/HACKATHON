package controller;

import model.Answer;
import model.Question;
import model.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import repository.AnswerRepository;
import repository.AnswerRatingRepository;
import repository.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;

class AnswerControllerTest {

    @Test
    void ratingAnswerPersistsScore() {
        AnswerRepository answerRepository = mock(AnswerRepository.class);
        AnswerRatingRepository answerRatingRepository = mock(AnswerRatingRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AnswerController controller = new AnswerController(answerRepository, answerRatingRepository, userRepository);
        Question question = new Question("Como estudar?", null);
        question.setId(12L);
        User user = new User("Estudante", "estudante@example.com", "password", User.Role.Student);
        user.setId(4L);
        Answer answer = new Answer(question, null, "Faça um plano de estudos.");
        answer.setId(7L);
        when(answerRepository.findById(7L)).thenReturn(Optional.of(answer));
        when(answerRepository.save(answer)).thenReturn(answer);
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(answerRatingRepository.existsByQuestion_IdAndUser_Id(12L, 4L)).thenReturn(false);

        ResponseEntity<?> response = controller.rate(7L, new AnswerController.RatingRequest(5, 4L, null));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(5, answer.getRatingSum());
        assertEquals(1, answer.getRatingCount());
        verify(answerRepository).save(answer);
        verify(answerRatingRepository).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsRatingsOutsideOneToFive() {
        AnswerRepository answerRepository = mock(AnswerRepository.class);
        AnswerRatingRepository answerRatingRepository = mock(AnswerRatingRepository.class);
        AnswerController controller = new AnswerController(
                answerRepository,
                answerRatingRepository,
                mock(UserRepository.class)
        );

        ResponseEntity<?> response = controller.rate(7L, new AnswerController.RatingRequest(0, 4L, null));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(answerRepository, answerRatingRepository);
    }

    @Test
    void reportsMissingAnswerWhenRating() {
        AnswerRepository answerRepository = mock(AnswerRepository.class);
        AnswerController controller = new AnswerController(
                answerRepository,
                mock(AnswerRatingRepository.class),
                mock(UserRepository.class)
        );
        when(answerRepository.findById(7L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.rate(7L, new AnswerController.RatingRequest(4, 4L, null));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void preventsSameUserFromRatingAnotherAnswerInSameQuestion() {
        AnswerRepository answerRepository = mock(AnswerRepository.class);
        AnswerRatingRepository answerRatingRepository = mock(AnswerRatingRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AnswerController controller = new AnswerController(answerRepository, answerRatingRepository, userRepository);
        Question question = new Question("Como estudar?", null);
        question.setId(12L);
        User user = new User("Estudante", "estudante@example.com", "password", User.Role.Student);
        user.setId(4L);
        Answer anotherAnswer = new Answer(question, null, "Revise todos os dias.");
        anotherAnswer.setId(8L);
        when(answerRepository.findById(8L)).thenReturn(Optional.of(anotherAnswer));
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(answerRatingRepository.existsByQuestion_IdAndUser_Id(12L, 4L)).thenReturn(true);

        ResponseEntity<?> response = controller.rate(8L, new AnswerController.RatingRequest(3, 4L, null));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        org.mockito.Mockito.verify(answerRepository).findById(8L);
        org.mockito.Mockito.verify(answerRepository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.verify(answerRatingRepository).existsByQuestion_IdAndUser_Id(12L, 4L);
        org.mockito.Mockito.verify(answerRatingRepository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any());
    }
}
