package service;

import java.text.Normalizer;
import java.util.Locale;

public class SubjectClassifierHelper {

    public static String normalize(String text) {
        if (text == null) return "";
        String lower = text.toLowerCase(Locale.ROOT).trim();
        String decomposed = Normalizer.normalize(lower, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }

    public static String inferSubjectFallback(String content) {
        String norm = normalize(content);
        if (norm.isBlank()) return "Geral";

        // 1. Programação e Desenvolvimento
        if (norm.matches(".*\\b(java|spring|jpa|hibernate|sql|select|insert|update|delete|join|postgres|mysql|sqlite|html|css|javascript|typescript|node|python|api|rest|json|git|bug|erro|codigo|classe|metodo|loop|array|variavel|funcao)\\b.*")) {
            return "Programação";
        }

        // 2. Ciências da Natureza (Física, Química, Biologia)
        if (norm.matches(".*\\b(fisica|velocidade|aceleracao|forca|energia|gravidade|cinematica|dinamica|optica|eletricidade|circuito|quimica|atomo|molecula|reacao|ph|mol|biologia|celula|dna|genetica|evolucao|ecologia)\\b.*")) {
            return "Ciências da Natureza";
        }

        // 3. Humanas e Linguagens
        if (norm.matches(".*\\b(historia|guerra|revolucao|imperio|republica|idade media|geografia|clima|relevo|mapa|populacao|urbanizacao|gramatica|crase|sintaxe|verbo|redacao|literatura|poema|interpretacao)\\b.*")) {
            return "Humanas e Linguagens";
        }

        // 4. Matemática (mais específico para não engolir frases soltas)
        boolean hasMathSymbol = norm.matches(".*(\\^|²|³|=).*") || norm.matches(".*\\b\\d+\\s*[+\\-*/]\\s*\\d+\\b.*");
        boolean hasMathWord = norm.matches(".*\\b(matematica|equacao|equacoes|funcao|funcoes|potencia|potenciacao|raiz|porcentagem|fracao|fracoes|geometria|triangulo|area|perimetro|volume|matriz|logaritmo|probabilidade|estatistica|media|moda|mediana)\\b.*");
        if (hasMathSymbol || hasMathWord) {
            return "Matemática";
        }

        return "Geral";
    }
}