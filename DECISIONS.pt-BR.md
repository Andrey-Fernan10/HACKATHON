# Decisões do projeto

[English](DECISIONS.md) · **Português (Brasil)**

Registrem aqui as decisões importantes do time. Cada entrada deve ser curta e trazer o que foi decidido, as alternativas consideradas e o motivo da escolha.

A documentação do projeto deve ser escrita **em inglês** (a versão principal é o [`DECISIONS.md`](DECISIONS.md)), com uma **versão em português** ao lado. Mantenham as duas versões alinhadas.

Mantenham este arquivo na **raiz** do repositório. Incluam uma entrada nova para cada decisão relevante (stack, arquitetura, recorte do MVP, o que ficou de fora, caminhos que vocês tentaram e abandonaram etc.). Este arquivo serve de roteiro para o bloco de decisões da apresentação.

Copiem o modelo abaixo sempre que precisarem de uma entrada nova.

## Modelo

```markdown
## [data] — [título da decisão]
- **Decisão:**
- **Alternativas consideradas:**
- **Motivo:**
```

## 27/11/2026 — Escolha do front-end

- **Decisão:** usar HTML, CSS e JavaScript no front-end.
- **Alternativas consideradas:** React.
- **Motivo:** os membros têm mais afinidade com as linguagens escolhidas e achou que seria melhor e mais condizente com o tipo de projeto se fosse feito através da internet.

## 27/11/2026 — Escolha do back-end

- **Decisão:** usar Java com Spring Boot no back-end.
- **Alternativas consideradas:** Python com algumas extensões.
- **Motivo:** os membros têm mais afinidade com Java, mantendo Python como alternativa.

## 27/11/2026 — Escolha do banco de dados

- **Decisão:** usar SQLite como banco de dados nesta etapa.
- **Alternativas consideradas:** bancos de dados que exigem mais configuração para começar, como PostgreSQL ou Supabase.
- **Motivo:** SQLite é prático para desenvolver o projeto no prazo disponível. A equipe prevê migrar para outra solução se a evolução do sistema exigir.

## 27/11/2026 — Escolha da API de IA

- **Decisão:** usar a API Gemini.
- **Alternativas consideradas:** outras APIs de IA como chat GPT.
- **Motivo:** a API é gratuita para o uso previsto e alguns membros já têm experiência com ela.

## 27/11/2026 — Respostas às perguntas do briefing

1. **Pergunta sem responsável:** após um prazo configurado, destacar como prioritária ou sem responsável. Uma sugestão da IA pode servir de apoio provisório, sempre identificada como não validada por uma pessoa.
2. **Evitar respostas duplicadas:** ao assumir uma pergunta, marcar o responsável e o status como em atendimento, avisando os demais monitores. A reserva pode expirar se não houver conclusão dentro do prazo definido.
3. **Identificar IA e validação humana:** usar selos visuais diferentes para triagem ou sugestão da IA e resposta validada por monitor ou professor. A resposta final só é exibida após confirmação humana.
4. **Informações mínimas para triagem:** enunciado claro, disciplina ou tema e a dúvida concreta. Quando aplicável, pedir também o que o aluno tentou ou onde travou.
5. **Encontrar respostas confiáveis:** mostrar a origem e a validação humana da resposta; permitir busca e filtros por disciplina ou tema, priorizando perguntas respondidas.
