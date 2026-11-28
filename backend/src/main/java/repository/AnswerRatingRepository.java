package repository;

import model.AnswerRating;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRatingRepository extends JpaRepository<AnswerRating, Long> {
    boolean existsByQuestion_IdAndUser_Id(Long questionId, Long userId);
}
