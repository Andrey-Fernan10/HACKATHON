# Project decisions

**English** · [Português (Brasil)](DECISIONS.pt-BR.md)

Record the team's important decisions here. Each entry should be short and state what was decided, the alternatives considered and the reason for the choice.

Project documentation must be written in **English** (this file is the main version), with a **Portuguese version** alongside (`DECISIONS.pt-BR.md`). Keep both versions in sync.

Keep this file at the **root** of the repository. Add a new entry for every relevant decision (stack, architecture, MVP scope, what was left out, paths you tried and abandoned, etc.). This file is a script for the decisions segment of the presentation.

Copy the template below whenever you need a new entry.

## Template

```markdown
## [date] — [decision title]
- **Decision:**
- **Alternatives considered:**
- **Rationale:**
```

## 23//11/2026 — Front-end choice

- **Decision:** use HTML, CSS, and JavaScript for the front end.
- **Alternatives considered:** React.
- **Rationale:** team members are more familiar with the selected languages and felt a web-based project would be better suited to the project's needs.

## 23/11/2026 — Back-end choice

- **Decision:** use Java with Spring Boot for the back end.
- **Alternatives considered:** Python with some extensions.
- **Rationale:** team members are more familiar with Java, while keeping Python as an alternative.

## 23/11/2026 — Database choice

- **Decision:** use SQLite as the database at this stage.
- **Alternatives considered:** databases that require more setup to get started, such as PostgreSQL or Supabase.
- **Rationale:** SQLite is practical for developing the project within the available time. The team expects to migrate to another solution if the system's evolution requires it.

## 27/11/2026 — AI API choice

- **Decision:** use the Gemini API.
- **Alternatives considered:** other AI APIs, such as ChatGPT.
- **Rationale:** the API is free for the intended use, and some team members have prior experience with it.

## 27/11/2026 — Answers to the briefing questions

1. **Question without an owner:** after a configured time limit, flag it as a priority or unassigned. An AI suggestion may provide temporary support, but must be clearly marked as not validated by a person.
2. **Prevent duplicate answers:** when a tutor claims a question, mark it as in progress with its owner and notify other tutors. The claim may expire if the answer is not completed within the defined time limit.
3. **Distinguish AI from human validation:** use separate visual labels for AI triage or suggestions and answers validated by a tutor or instructor. Show an answer as final only after human confirmation.
4. **Minimum information for triage:** a clear prompt, course or topic, and the specific question. When applicable, also ask what the student has tried or where they got stuck.
5. **Find trustworthy answers:** show the answer's source and human-validation status; allow search and filters by course or topic, prioritizing answered questions.
