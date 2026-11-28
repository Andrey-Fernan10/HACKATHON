package repository;

import model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByContentContainingIgnoreCaseOrderByCreatedAtDesc(String content);
    List<Question> findAllByOrderByCreatedAtDesc();
}