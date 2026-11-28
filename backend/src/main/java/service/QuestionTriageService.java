package service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import configuration.GeminiProperties;
import dto.QuestionTriageResult;
import model.Answer;
import model.Question;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class QuestionTriageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(QuestionTriageService.class);
    private static final String GEMINI_ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";
    private static final List<String> MODELOS_GEMINI = List.of(
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash"
    );

    // Falha rápida: poucas tentativas por modelo e timeouts curtos para passar logo ao próximo modelo.
    private static final int MAX_TENTATIVAS = 2;
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    // Tempo total máximo gasto percorrendo modelos/tentativas em uma única chamada.
    private static final Duration TOTAL_BUDGET = Duration.ofSeconds(25);

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
    private static final String FILTER_SYSTEM_PROMPT = """
            Você é o organizador de filtros pedagógicos da plataforma Smart Mentorship.
            Receba a lista de perguntas e crie filtros úteis e claros para alunos e professores navegarem pelos conteúdos.
            Responda APENAS com um JSON válido, sem markdown (sem ```json) e sem texto extra.

            Regras:
            1. Agrupe perguntas semelhantes por matéria, conteúdo ou tema em até 6 filtros concisos e sem duplicatas.
            2. Cada item de "filters" deve ter:
               - "label": nome curto do filtro (ex.: "SQL e Banco de Dados", "Funções", "História do Brasil")
               - "category": "subject" | "topic" | "theme"
               - "questionIds": lista com os IDs das perguntas que se encaixam nesse filtro.
            3. Inclua apenas filtros que tenham pelo menos 1 pergunta.

            Formato exato de saída:
            {
              "filters": [
                {
                  "label": "string",
                  "category": "subject",
                  "questionIds": [1, 2]
                }
              ]
            }
            """;
    private static final String FILTER_LIST_HEADER = "Perguntas cadastradas:\n";
    private static final Set<String> DIFFICULTIES = Set.of("Básico", "Intermediário", "Avançado");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(CONNECT_TIMEOUT)
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GeminiProperties geminiProperties;

    // Último resultado dos filtros inteligentes (signature = lista de perguntas usada no prompt).
    private record CachedFilters(String signature, List<Map<String, Object>> filters) {
    }

    private volatile CachedFilters filtersCache;
    private final AtomicBoolean filtersRefreshing = new AtomicBoolean(false);

    public QuestionTriageService(GeminiProperties geminiProperties) {
        this.geminiProperties = geminiProperties;
    }

    public QuestionTriageResult triage(String content, List<Question> existingQuestions) {
        String question = content == null ? "" : content.trim();
        if (question.isEmpty()) {
            throw new TriageException("A pergunta não pode estar vazia.");
        }

        String responseBody = sendGeminiWithFallback(
                SYSTEM_PROMPT,
                buildUserPrompt(question, existingQuestions),
                0.2
        );
        return parseResponse(responseBody);
    }

    /**
     * Retorna os filtros inteligentes sem bloquear sem necessidade:
     * - mesma lista de perguntas do último cálculo: devolve o cache na hora;
     * - lista mudou e há cache: devolve o cache atual e recalcula em segundo plano;
     * - sem cache (primeira chamada): calcula de forma síncrona.
     */
    public List<Map<String, Object>> generateSmartFilters(List<Question> questions) {
        if (questions == null || questions.isEmpty()) {
            return List.of();
        }

        String listText = buildQuestionsList(questions);
        if (listText == null) {
            return List.of();
        }

        CachedFilters cached = filtersCache;
        if (cached != null) {
            if (!cached.signature().equals(listText)) {
                refreshFiltersAsync(listText);
            }
            return cached.filters();
        }

        return refreshFilters(listText);
    }

    private String buildQuestionsList(List<Question> questions) {
        StringBuilder listText = new StringBuilder(FILTER_LIST_HEADER);
        for (Question q : questions) {
            if (q != null && q.getId() != null) {
                listText.append("- ID ")
                        .append(q.getId())
                        .append(": ")
                        .append(q.getContent() == null ? "" : q.getContent().trim())
                        .append("\n");
            }
        }
        return listText.length() == FILTER_LIST_HEADER.length() ? null : listText.toString();
    }

    private void refreshFiltersAsync(String listText) {
        if (!filtersRefreshing.compareAndSet(false, true)) {
            return;
        }
        CompletableFuture.runAsync(() -> {
            try {
                refreshFilters(listText);
            } finally {
                filtersRefreshing.set(false);
            }
        });
    }

    private List<Map<String, Object>> refreshFilters(String listText) {
        try {
            String rawJson = callAiForFilters(FILTER_SYSTEM_PROMPT, listText);
            List<Map<String, Object>> result = parseFilters(rawJson);
            if (!result.isEmpty()) {
                filtersCache = new CachedFilters(listText, result);
            }
            return result;
        } catch (Exception e) {
            LOGGER.warn("Erro ao gerar filtros inteligentes.", e);
            return List.of();
        }
    }

    private List<Map<String, Object>> parseFilters(String rawJson) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(cleanJson(rawJson));
        JsonNode filtersNode = root.path("filters");
        List<Map<String, Object>> result = new ArrayList<>();

        if (!filtersNode.isArray()) {
            return result;
        }

        for (JsonNode f : filtersNode) {
            String label = f.path("label").asText("").trim();
            String category = f.path("category").asText("topic").trim();
            if (category.isEmpty()) {
                category = "topic";
            }

            List<Long> ids = new ArrayList<>();
            if (f.path("questionIds").isArray()) {
                for (JsonNode idNode : f.path("questionIds")) {
                    if (idNode.isIntegralNumber() && idNode.canConvertToLong()) {
                        long idVal = idNode.asLong();
                        if (!ids.contains(idVal)) {
                            ids.add(idVal);
                        }
                    }
                }
            }

            if (!label.isEmpty() && !ids.isEmpty() && result.size() < 6) {
                result.add(Map.of(
                        "label", label,
                        "category", category,
                        "questionIds", ids
                ));
            }
        }
        return result;
    }

    private String callAiForFilters(String systemPrompt, String userPrompt) {
        String geminiResponse = sendGeminiWithFallback(systemPrompt, userPrompt, 0.3);
        return extractGeneratedText(geminiResponse);
    }

    private String sendGeminiWithFallback(String systemInstruction, String userPrompt, double temperature) {
        String apiKey = geminiProperties.api() == null ? null : geminiProperties.api().key();
        if (apiKey == null || apiKey.isBlank()) {
            throw new TriageException("A configuração da API Gemini está incompleta.");
        }

        List<String> candidates = new ArrayList<>();
        String configuredModel = geminiProperties.model();
        if (configuredModel != null && !configuredModel.isBlank()) {
            candidates.add(configuredModel.trim());
        }
        for (String model : MODELOS_GEMINI) {
            if (!candidates.contains(model)) {
                candidates.add(model);
            }
        }

        long deadline = System.nanoTime() + TOTAL_BUDGET.toNanos();
        TriageException lastException = null;

        for (String model : candidates) {
            for (int attempt = 1; attempt <= MAX_TENTATIVAS; attempt++) {
                if (System.nanoTime() > deadline) {
                    LOGGER.warn("Tempo total de {}s esgotado ao chamar a API Gemini.", TOTAL_BUDGET.toSeconds());
                    throw lastException != null
                            ? lastException
                            : new TriageException("Tempo esgotado ao chamar a API Gemini.");
                }

                try {
                    return sendGeminiRequest(model, apiKey, systemInstruction, userPrompt, temperature);
                } catch (TriageException ex) {
                    lastException = ex;
                    LOGGER.warn("Falha ao chamar o modelo {} (tentativa {}/{}): {}",
                            model, attempt, MAX_TENTATIVAS, ex.getMessage());

                    if (Thread.currentThread().isInterrupted()) {
                        throw ex;
                    }
                    if (!ex.isRetryable()) {
                        // Erro 4xx ou timeout: repetir no mesmo modelo não ajuda, vai para o próximo.
                        break;
                    }
                }
            }
        }

        throw lastException != null
                ? lastException
                : new TriageException("Todos os modelos Gemini falharam.");
    }

    private String sendGeminiRequest(
            String model,
            String apiKey,
            String systemInstruction,
            String userPrompt,
            double temperature
    ) {
        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "systemInstruction", Map.of(
                            "parts", List.of(Map.of("text", systemInstruction))
                    ),
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", List.of(Map.of("text", userPrompt))
                    )),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "temperature", temperature
                    )
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_ENDPOINT.formatted(model)))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                // 5xx pode ser instabilidade passageira (vale repetir); 4xx/429 não melhora repetindo.
                throw new TriageException("A API Gemini respondeu com HTTP " + status + ".", status >= 500);
            }
            return response.body();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new TriageException("A solicitação de triagem foi interrompida.", ex, false);
        } catch (HttpTimeoutException ex) {
            throw new TriageException("A API Gemini excedeu o tempo limite com o modelo " + model + ".", ex, false);
        } catch (IOException | IllegalArgumentException ex) {
            throw new TriageException("Não foi possível concluir a solicitação com a API Gemini.", ex);
        }
    }

    private String extractGeneratedText(String responseBody) {
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
            return generatedText.toString();
        } catch (JsonProcessingException ex) {
            throw new TriageException("A resposta da API Gemini não é um JSON válido.", ex);
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
            JsonNode triage = objectMapper.readTree(cleanJson(extractGeneratedText(responseBody)));
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
        private final boolean retryable;

        public TriageException(String message) {
            this(message, null, true);
        }

        public TriageException(String message, Throwable cause) {
            this(message, cause, true);
        }

        public TriageException(String message, boolean retryable) {
            this(message, null, retryable);
        }

        public TriageException(String message, Throwable cause, boolean retryable) {
            super(message, cause);
            this.retryable = retryable;
        }

        /** Indica se vale tentar novamente no mesmo modelo. */
        public boolean isRetryable() {
            return retryable;
        }
    }
}
