package service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import configuration.GeminiProperties;
import dto.QuestionTriageResult;
import model.Answer;
import model.Question;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class QuestionTriageService {

    private static final String GEMINI_ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";
    private static final String SYSTEM_PROMPT = """
            Você é o assistente de triagem pedagógica do Smart Mentorship.
            Analise a pergunta e responda somente com JSON válido, sem markdown nem texto extra.
            Use os exemplos respondidos apenas para identificar possíveis duplicatas.
            Preencha subject, topic e difficulty (Básico, Intermediário ou Avançado).
            Se a pergunta for vaga, marque isVague como true e sugira uma versão clara em rewrittenQuestion.
            Se houver uma pergunta realmente semelhante, informe seu id em duplicateQuestionId e resuma a resposta em suggestedExistingAnswer.
            Escreva um rascunho objetivo em draftAnswerForMonitor.
            Retorne exatamente estas propriedades:
            {
              "subject": "string",
              "topic": "string",
              "difficulty": "Básico | Intermediário | Avançado",
              "isVague": false,
              "rewrittenQuestion": null,
              "duplicateQuestionId": null,
              "suggestedExistingAnswer": null,
              "draftAnswerForMonitor": "string"
            }
            """;
    private static final Set<String> DIFFICULTIES = Set.of("Básico", "Intermediário", "Avançado");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GeminiProperties geminiProperties;

    public QuestionTriageService(GeminiProperties geminiProperties) {
        this.geminiProperties = geminiProperties;
    }

    public QuestionTriageResult triage(String content, List<Question> existingQuestions) {
        String question = content == null ? "" : content.trim();
        if (question.isEmpty()) {
            throw new TriageException("A pergunta não pode estar vazia.");
        }

        String apiKey = geminiProperties.api() == null ? null : geminiProperties.api().key();
        String model = geminiProperties.model();
        if (apiKey == null || apiKey.isBlank() || model == null || model.isBlank()) {
            throw new TriageException("A configuração da API Gemini está incompleta.");
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "systemInstruction", Map.of(
                            "parts", List.of(Map.of("text", SYSTEM_PROMPT))
                    ),
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", List.of(Map.of("text", buildUserPrompt(question, existingQuestions)))
                    )),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "temperature", 0.2
                    )
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_ENDPOINT.formatted(model)))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new TriageException("A API Gemini respondeu com HTTP " + response.statusCode() + ".");
            }
            return parseResponse(response.body());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new TriageException("A solicitação de triagem foi interrompida.", ex);
        } catch (IOException | IllegalArgumentException ex) {
            throw new TriageException("Não foi possível concluir a triagem com a API Gemini.", ex);
        }
    }

    private String buildUserPrompt(String question, List<Question> existingQuestions) {
        String examples = existingQuestions == null
                ? ""
                : existingQuestions.stream()
                        .limit(10)
                        .map(this::formatExistingQuestion)
                        .reduce((first, second) -> first + "\n\n" + second)
                        .orElse("");

        return "Pergunta do estudante:\n" + question
                + "\n\nPerguntas respondidas para comparação:\n"
                + (examples.isBlank() ? "Nenhuma." : examples);
    }

    private String formatExistingQuestion(Question question) {
        String answer = question.getAnswer();
        if ((answer == null || answer.isBlank()) && question.getAnswers() != null) {
            answer = question.getAnswers().stream()
                    .map(Answer::getContent)
                    .filter(content -> content != null && !content.isBlank())
                    .findFirst()
                    .orElse("");
        }
        return "ID: " + question.getId()
                + "\nPergunta: " + question.getContent()
                + "\nResposta: " + answer;
    }

    private QuestionTriageResult parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
            if (!parts.isArray()) {
                throw new TriageException("A API Gemini não retornou o conteúdo esperado.");
            }

            StringBuilder generatedText = new StringBuilder();
            for (JsonNode part : parts) {
                if (part.path("text").isTextual()) {
                    generatedText.append(part.path("text").asText());
                }
            }
            if (generatedText.isEmpty()) {
                throw new TriageException("A API Gemini retornou uma resposta vazia.");
            }

            JsonNode triage = objectMapper.readTree(cleanJson(generatedText.toString()));
            String subject = requiredText(triage, "subject", 120);
            String topic = requiredText(triage, "topic", 180);
            String difficulty = requiredText(triage, "difficulty", 60);
            if (!DIFFICULTIES.contains(difficulty)) {
                throw new TriageException("A triagem retornou uma dificuldade inválida.");
            }

            JsonNode vagueNode = triage.path("isVague");
            if (!vagueNode.isBoolean()) {
                throw new TriageException("A triagem não informou se a pergunta é vaga.");
            }
            boolean isVague = vagueNode.asBoolean();
            String rewrittenQuestion = optionalText(triage, "rewrittenQuestion", 1000);
            if (isVague && rewrittenQuestion == null) {
                throw new TriageException("A triagem marcou a pergunta como vaga sem sugerir uma reformulação.");
            }

            JsonNode duplicateNode = triage.path("duplicateQuestionId");
            Long duplicateQuestionId;
            if (duplicateNode.isNull()) {
                duplicateQuestionId = null;
            } else if (duplicateNode.isIntegralNumber() && duplicateNode.canConvertToLong()) {
                duplicateQuestionId = duplicateNode.asLong();
            } else {
                throw new TriageException("A triagem retornou um identificador de duplicata inválido.");
            }

            return new QuestionTriageResult(
                    subject,
                    topic,
                    difficulty,
                    isVague,
                    rewrittenQuestion,
                    duplicateQuestionId,
                    optionalText(triage, "suggestedExistingAnswer", 2000),
                    requiredText(triage, "draftAnswerForMonitor", 2000)
            );
        } catch (JsonProcessingException ex) {
            throw new TriageException("A API Gemini não retornou um JSON de triagem válido.", ex);
        }
    }

    private String cleanJson(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            int firstLineBreak = cleaned.indexOf('\n');
            if (firstLineBreak >= 0) {
                cleaned = cleaned.substring(firstLineBreak + 1);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
        }
        return cleaned.trim();
    }

    private String requiredText(JsonNode node, String field, int maxLength) {
        String value = optionalText(node, field, maxLength);
        if (value == null) {
            throw new TriageException("A triagem não retornou o campo obrigatório " + field + ".");
        }
        return value;
    }

    private String optionalText(JsonNode node, String field, int maxLength) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        if (!value.isTextual()) {
            throw new TriageException("O campo " + field + " da triagem deve ser texto.");
        }
        String text = value.asText().trim();
        if (text.isEmpty()) {
            return null;
        }
        if (text.length() > maxLength) {
            throw new TriageException("O campo " + field + " da triagem excede o limite permitido.");
        }
        return text;
    }

    public static class TriageException extends RuntimeException {
        public TriageException(String message) {
            super(message);
        }

        public TriageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
