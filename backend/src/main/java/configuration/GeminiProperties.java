package configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gemini")
public record GeminiProperties(Api api, String model) {
    public record Api(String key) {
    }
}
