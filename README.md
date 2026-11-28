# Smart Mentorship

English · [Português (Brasil)](README.pt-BR.md)

Fill out this README and keep it up to date. It is part of the deliverable and must remain at the root of the repository, together with DECISIONS.md and AI_LOG.md (and the Portuguese versions: README.pt-BR.md, DECISIONS.pt-BR.md, and AI_LOG.pt-BR.md).

Project documentation must be written in English (the main version is [README.md](README.md)), with a Portuguese version alongside it. Keep both versions aligned.

Create, inside the repository, the folders for each part of the project you develop (for example, /backend, /frontend, /docs). The organization is up to the team — describe it in the [Folder Structure](#folder-structure) section.

On day one, add the instructor as a collaborator on the repository with the email **adrianoanschau@gmail.com**.

## Team

- Cohort: TDS — mixed classes 6570, 6756, and 6863
- Tech Lead: Luísa Lopes
- Presentation Lead: Andrey Fernandes
- Members:
  - Luisa — luisalopes11
  - João Vitor — GHuser26-dev
  - Andrey — Andrey-Fernan10
  - Murilo — murilomachadofelix

## Theme / Domain

Smart mentorship — campus and community life

## Problem

Our application aims to address the difficulty students may face when trying to find and access academic mentorship tailored to their study needs.
This application targets primarily students who need academic support and want to find help from teaching assistants or mentors in specific subjects.

## Solution

Smart Mentorship is an application built to connect students with mentors and instructors, allowing students to find support according to their needs and subjects. The platform aims to make academic follow-up more organized and accessible, facilitating access to and management of mentorship information, supported by the Gemini API for question triage and smart filter generation (`POST /api/questions/ai-filters`), model fallback, multiple retries per model, and `localStorage` caching for filters.

MVPs – Smart Mentorship
1. User authentication:
  - User login.
  - Role identification (Instructor or Student).
  - Registration with name, email, and password.
2. Question management:
  - Students can submit questions.
  - Storage of question text.
  - Identification of the student who submitted the question.
3. AI smart filter:
  - Analysis of incoming questions.
  - Identification of related questions by correlation.
  - Routing/grouping of questions based on analysis results.
4. Instructor area:
  - Viewing the student question queue.
  - Accessing received questions.
  - Ability to answer questions.
5. Answer system:
  - Storage of answer text.
  - Linking the answer to the corresponding question.
  - Recording answer evaluation (`good_response`, initially false).
6. Answered questions view:
  - Displaying questions that already have answers.
  - Showing their corresponding answers to students.

## Stack

Languages and tools used:
  Front-End:
- JavaScript (HTML and CSS integrated under `src/main/resources/static`)

  Back-End:
- Java (Spring Boot, `HttpClient`, Spring JPA);
- Gemini API integration (`QuestionTriageService`) for triage and smart filters

The project will be developed initially for the web (served as a single service by the back-end, with static assets in `src/main/resources/static`).

## Folder Structure

Describe the repository organization. Adjust the example below to match the team's choice.

```text
/
├── README.md
├── README.pt-BR.md
├── DECISIONS.md
├── DECISIONS.pt-BR.md
├── AI_LOG.md
├── AI_LOG.pt-BR.md
├── .env.example
├── backend/
│   ├── pom.xml
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   │           ├── application.properties
│   │           └── static/
└── docs/
```
## How to Run

### Prerequisites

Back-End:
  - Java JDK 17
  - Apache Maven
  - Spring Boot 3.3.5
  - SQLite
  - Environment variables / .env with GEMINI_API_KEY (and optional GEMINI_MODEL)

Front-End:
  - Up-to-date Web Browser

Development tools:
  - Visual Studio Code
  - Git

### Back-end

# commands to install dependencies and start the back-end

### Back-end

```bash
# Spring Boot and SQLite dependencies come from pom.xml and are downloaded automatically by Maven;
cd backend && .\mvnw.cmd clean spring-boot:run
```

### Front-end


# commands to install dependencies and start the front-end


## CI/CD

GitHub Actions pipeline configured to run build, lint, and tests on pull requests and pushes to the main branch (update according to active workflows in the repository).

## Deploy

Automated deployment has not been configured yet.

## Links

- Repository:
- Deploy (if any):
- **https://github.com/Andrey-Fernan10/HACKATHON.git**