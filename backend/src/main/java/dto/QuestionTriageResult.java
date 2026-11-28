package dto;

public record QuestionTriageResult(
    String subject,
    String topic,
    String difficulty,
    boolean isVague,
    String rewrittenQuestion,
    Long duplicateQuestionId,
    String suggestedExistingAnswer,
    String draftAnswerForMonitor
) {}