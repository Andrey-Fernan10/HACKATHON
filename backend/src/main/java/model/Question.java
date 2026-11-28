package model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false)
    private String status = "Pendente";

    @Column(length = 2000)
    private String answer;

    @Column(length = 120)
    private String subject;

    @Column(length = 180)
    private String topic;

    @Column(length = 60)
    private String difficulty;

    @Column(name = "triage_vague")
    private Boolean triageVague;

    @Column(name = "rewritten_question", length = 1000)
    private String rewrittenQuestion;

    @Column(name = "duplicate_question_id")
    private Long duplicateQuestionId;

    @Column(name = "suggested_existing_answer", length = 2000)
    private String suggestedExistingAnswer;

    @Column(name = "draft_answer_for_monitor", length = 2000)
    private String draftAnswerForMonitor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Answer> answers = new ArrayList<>();

    public Question() {
    }

    public Question(String content, User author) {
        this.content = content;
        this.author = author;
        this.status = "Pendente";
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = "Pendente";
        }
    }

    public void addAnswer(Answer ans) {
        ans.setQuestion(this);
        this.answers.add(ans);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public Boolean getTriageVague() {
        return triageVague;
    }

    public void setTriageVague(Boolean triageVague) {
        this.triageVague = triageVague;
    }

    public String getRewrittenQuestion() {
        return rewrittenQuestion;
    }

    public void setRewrittenQuestion(String rewrittenQuestion) {
        this.rewrittenQuestion = rewrittenQuestion;
    }

    public Long getDuplicateQuestionId() {
        return duplicateQuestionId;
    }

    public void setDuplicateQuestionId(Long duplicateQuestionId) {
        this.duplicateQuestionId = duplicateQuestionId;
    }

    public String getSuggestedExistingAnswer() {
        return suggestedExistingAnswer;
    }

    public void setSuggestedExistingAnswer(String suggestedExistingAnswer) {
        this.suggestedExistingAnswer = suggestedExistingAnswer;
    }

    public String getDraftAnswerForMonitor() {
        return draftAnswerForMonitor;
    }

    public void setDraftAnswerForMonitor(String draftAnswerForMonitor) {
        this.draftAnswerForMonitor = draftAnswerForMonitor;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<Answer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<Answer> answers) {
        this.answers = answers;
    }
}
