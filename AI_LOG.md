# AI Usage Log (AI_LOG)

[English](AI_LOG.md) · **Português (Brasil)**

Record here how the team used artificial intelligence in the project. The use of AI is allowed and encouraged as long as it is documented: this file is a required deliverable and serves as the script for the “AI in practice” section of the presentation.

Project documentation must be written in **English** (the main version is [`AI_LOG.md`](AI_LOG.md)), with a **Portuguese version** alongside it. Keep both versions aligned.

Keep this file at the **root** of the repository. Include the tools used and, for every relevant use, the main prompt, what the AI generated, what the team reused and what was corrected or rejected — and why.

Never commit API keys, passwords or any other secrets. These values belong in `.env` (outside the repository) and in GitHub Secrets.

Copy the template below whenever you need a new entry.

## Tools

- Gemini
- Claude

## Entry Template

```markdown
### [date] — [task or section]
- **Main prompt:**
- **What the AI generated:**
- **What the team kept:**
- **What the team corrected or rejected, and why:**
```

## Log

### 24/11/2026 — JWT Authentication (example)

- **Main prompt:** "Generate a JWT authentication middleware in Node.js/Express, with handling for expired tokens and an example protected route."
- **What the AI generated:** A middleware and an example route, with an outdated dependency and no environment variable validation.
- **What the team kept:** The middleware structure and the token verification flow.
- **What the team corrected or rejected, and why:** We updated the library, moved the secret to an environment variable and added tests. The example route was rewritten to fit our user model.

### [24/11] — [Idea Development]

- **Main prompt:** "Analyze the initial diagram of our intelligent tutoring MVP with AI triage for Senac students. Point out flaws in the workflow and suggest practical usability improvements so we avoid creating an overly basic system and actually solve the problem of repeated questions."
- **What the AI generated:** An analysis of the initial flowchart highlighting positive points (role separation and feedback cycle) and logical flaws (ambiguity in the `IF = PRESENTS` condition, absence of the tutor role and lack of a knowledge base). To evolve the MVP, it suggested real-time pre-triage with duplicate and urgency detection, an intelligent queue for tutors, indexing of resolved questions and a confirmation button ("Resolved?").
- **What the team kept:** Since this was essentially an analysis of the initial project, we used its suggestions to improve the concept and explore it further.
- **What the team corrected or rejected, and why:** Since these were only suggestions for improving the idea's development, we subsequently refined the prompt so the AI could better understand the project context and work more efficiently.

### [24/11] — [Workflow and Business Rules Refinement]

- **Main prompt:** "Detail how the system should work as a question forum (in the style of Brainly) with AI triage to find previously answered correlations, escalation to a human queue if unresolved, a community answer system with a consistency badge, teacher validation approval and free profile selection (student/teacher) at login."
- **What the AI generated:** A validation of the forum's conceptual architecture and practical recommendations for MVP design and scope: justify free profile selection at login to facilitate testing, visually differentiate answer statuses (teacher, community with badge and evaluated), structure correlation search by combining tags and semantic similarity, define clear states in the question lifecycle and organize the interface around four pillars (filterable feed, preview of similar questions while typing, triage/approval panel and profile with badges).
- **What the team kept:** The verified profile idea and the question lifecycle structure were useful throughout the project's development.
- **What the team corrected or rejected, and why:** The screen organization was changed slightly to make it more practical and easier for the team to structure.

### [24/11] — [Diagram Evolution and Initial Modeling]

- **Main prompt:** "Send a screenshot of the updated system workflow ('I made a few improvements, what do you think?') with the first data blocks and triage stages to validate the evolution of the architecture."
- **What the AI generated:** An evaluation of the refined diagram highlighting initial coupling with data attributes (`USER`, `question_box` and `answers`), clarity in the AI correlation stage and completion of the answer-base cycle. It also suggested adjustments to the `ELSE` flow to exit the AI filter, refinement of entity fields and keys, and the path for community answers from other students.
- **What the team kept:** The suggestion for improving the workflow and for a starting point.
- **What the team corrected or rejected, and why:** We avoided making the diagram overly complex and losing its essential purpose, as that could distract from the project's main objective.

### [24/11] — [Stack Definition and AI Automation]

- **Main prompt:** "Present the agreed stack (HTML, CSS and JS on the front end, SQLite for the database and Java + Python for AI automation) and ask whether it is practical to keep everything in Java."
- **What the AI generated:** An analysis comparing Java + Python with concentrating everything in Java on the back end, noting that using Java alone reduces operational and environment complexity in the MVP while maintaining practicality through an AI API. It also detailed when Python would still make sense, how to structure the AI service in Java and practical SQLite considerations.
- **What the team kept:** Its suggestion to use Java to maximize the application's potential.
- **What the team corrected or rejected, and why:** We rejected Python because it would make an already large task more complex, and since not everyone was familiar with that language, we chose to focus our back end exclusively on Java.

### [25/11] — [Coding Begins: Java `User` Entity]

- **Main prompt:** "Show the first Java draft of the `User` class (with private fields, constructor and getters/setters) as the start of the implementation and ask for an evaluation."
- **What the AI generated:** A review of the `User` class highlighting encapsulation and the initial constructor, suggesting immediate adjustments (adding `id`, a `Role` enum and considering `password` handling), identifying what to postpone to avoid blocking the MVP (a formal Builder pattern and contributor badge) and presenting an updated example of the class.
- **What the team kept:** The improved code generated by the AI.
- **What the team corrected or rejected, and why:** We rejected some of the suggestions included with the code for preference reasons.

### [25/11] — [CI Configuration with GitHub Actions for Java]

- **Main prompt:** "Request step-by-step instructions for creating an initial GitHub Actions workflow that runs for pull requests and pushes to main, adapting the build for the Java back end."
- **What the AI generated:** A step-by-step guide to create `.github/workflows/ci.yml`, configure checkout and Java 17 (Temurin), compile and test with Maven (or `javac` for standalone files), push through Git and monitor execution in the Actions tab.
- **What the team kept:** The tutorial for creating the `.yml` file and a better understanding of how it worked.
- **What the team corrected or rejected, and why:** We fixed the `pom.xml` later because it was not considered necessary at that moment.

### [26/11] — [Repository Folder Structure Review]

- **Main prompt:** "Show a screenshot of the current project folder structure in VS Code to evaluate the organization of folders, documentation, CI and Java code."
- **What the AI generated:** An analysis of the `HACKATHON` folder structure highlighting strengths (CI workflow at the root, bilingual documentation and initial separation of the Java back end) and areas for attention (organization of the `main` folder alongside `model`, the `ci.yml` file had not yet been committed to Git and several other MVP layers/folders were missing, such as repositories, the AI service and the front end).
- **What the team kept:** Its analysis of the base structures for the back end and the project's overall potential.
- **What the team corrected or rejected, and why:** The suggested front-end folders were created following a chosen structure.

### [26/11] — [Front-End Begins: Registration Screen]

- **Main prompt:** "Show the beginning of the front end with the registration HTML and ask for an evaluation and next steps to integrate it with the `User` class in Java."
- **What the AI generated:** An analysis of the initial HTML pointing out the button's direct redirect and the mismatch between radio values and the Java `Role` enum, along with a structured `registro.html` using `<form>`, a `registro.js` using `fetch` to send JSON data and the next step of exposing the route in the Java back end.
- **What the team kept:** The main code sent by the AI after its review.
- **What the team corrected or rejected, and why:** Some suggestions were rejected because they were too advanced for a short-term project.

### [26/11] — [Redirect by Profile at Login]

- **Main prompt:** "Send the initial `login.html` code and ask how to redirect to `student.html` or `teacher.html` according to the user's registration profile."
- **What the AI generated:** A solution for redirecting by profile (`Student` or `Teacher`) through both the back-end response and a temporary `localStorage` fallback for testing before the server started, including adjustments to `login.html`, saving `role` in `registro.js` and redirect logic in `login.js`.
- **What the team kept:** The generated code was reused in full.
- **What the team corrected or rejected, and why:** We adapted several things because we were not yet using Spring Boot.

### [26/11] — [Spring Boot Installation and Configuration]

- **Main prompt:** "Ask whether Spring Boot needs to be installed in the project to use its annotations and resources and request a configuration guide."
- **What the AI generated:** A step-by-step guide to generate the Spring Boot project base (with Spring Web and Spring Data JPA), add SQLite dependencies (`sqlite-jdbc` and an Hibernate dialect), organize the packages inside `backend/` and adjust `ci.yml` for Maven/Gradle builds.
- **What the team kept:** We reused the Spring Boot installation and configuration tutorial.
- **What the team corrected or rejected, and why:** We adapted the folder style and structure order to match the organization already used in our project.

### [26/11] — [Maven Organization and Project Execution]

- **Main prompt:** "Request guidance on Maven organization (including controllers and the back-end structure) and resolve the `mvn` command-not-found error when running the project."
- **What the AI generated:** An explanation of the `bash: mvn: command not found` error (missing global Maven or Maven outside the `PATH`), suggesting use of `./mvnw` or running directly in VS Code, along with instructions for installing Maven and configuring `PATH`.
- **What the team kept:** We reused the project organization and execution tutorial.
- **What the team corrected or rejected, and why:** We corrected why `mvn` was not working properly in the environment and adapted it directly in the code.

### [date] — [Spring Boot Adjustment and API JSON Response]

- **Main prompt:** "Request help fixing the Spring Boot API's JSON response when the database did not return the expected format and validate the flow with the front end."
- **What the AI generated:** A three-stage validation guide to check the JSON at `http://localhost:8080/api/questions`, test question creation and persistence in SQLite (`smart_mentorship.db`) after reload and check other front-end routes/pages for CORS or request errors.
- **What the team kept:** We reused the testing and workflow-validation guide.
- **What the team corrected or rejected, and why:** We had to adapt almost everything because it was not working at all. We discarded further work on the API view itself, as it was only needed to check `localhost` and already worked in tests, and proceeded directly to the next stage.

### [26/11] — [Next Steps After Login and Database Integration]

- **Main prompt:** "Ask what the next steps in the project should be after login starts working and returns database data."
- **What the AI generated:** A continuation plan with three steps to connect the authenticated user session to the rest of the workflow: send the authenticated author when creating questions in SQLite, display logged-in user data in the interface and structure the teacher area (`teacher.html`) to list questions and update states/responses.
- **What the team kept:** We evaluated what already worked in the suggested list.
- **What the team corrected or rejected, and why:** During adaptation, we focused on the back end because the visual part already worked well enough to test the workflow.

### [26/11] — [Back-End Polishing and QuestionController]

- **Main prompt:** "Send the decompiled `QuestionController` code to polish the back end before moving forward with the front end."
- **What the AI generated:** A review identifying problems in the decompiled code (`access$10` in `GET` and incomplete CORS configuration for `PUT`), along with a corrected `QuestionController.java` and step-by-step instructions for inserting it into the real source code, restarting the back end with a clean build and testing answer submission in `teacher.html`.
- **What the team kept:** We reused the code and some of the suggestions.
- **What the team corrected or rejected, and why:** We adapted several code sections to maintain compatibility with the project.

### [27/11] — [Front-End Implementation and Back-End Triage Integration]

- **Main prompt:** "Present the initial front-end files (`student.html`, `student.js`, `teacher.html` and `teacher.js`) to integrate them with the API and the back-end triage data."
- **What the AI generated:** An update for `student.js` and `teacher.js` that preserved the visual structure and connected the back-end triage data: display of badges (`subject`, `topic` and `difficulty`), a feedback panel after submitting a question (with a rewrite suggestion and duplicate warning) on the student screen, pre-filling of an AI-suggested draft on the teacher screen and browser test instructions.
- **What the team kept:** The code generated by the AI for implementation in the front end.
- **What the team corrected or rejected, and why:** We implemented several ideas ourselves that we needed but that the AI did not include.

### [27/11] — [Triage Fields, Multiple Answers and Front-End Ratings]

- **Main prompt:** "Require implementation of subject, topic and difficulty, support for multiple answers to allow ratings and organization of the folders."
- **What the AI generated:** An explanation that subject, topic and difficulty depend on real classification in `QuestionTriageService.java` and controls on the student screen, as well as a detailed transition from a single answer to multiple answers with database/back-end evaluation and front-end display and interaction.
- **What the team kept:** We reused the code and some of the guidance.
- **What the team corrected or rejected, and why:** We corrected several points and adapted them to include our ideas directly in the front end, making filters and ratings work.

### [27/11] — [Bug Fixes and Specific Adjustments]

- **Main prompt:** "Report a cycle of several debugging and bug-fixing messages in the project to keep the log brief."
- **What the AI generated:** Code and specific solutions to resolve errors found during development.
- **What the team kept:** We reused the code returned by the AI that worked in the application.
- **What the team corrected or rejected, and why:** We made point corrections as errors appeared during testing.

### [27/11] — [Answer Rating Parameters and Filters]

- **Main prompt:** "Define parameters for answer ratings and system filters and document the implementation cycle."
- **What the AI generated:** Code and suggestions for structuring the rating parameters and question/answer filters.
- **What the team kept:** We reused the generated code as a starting point.
- **What the team corrected or rejected, and why:** We corrected and adapted it to meet our requirements because it contained many bugs and did not match our visual expectations.

### [27/11] — [Gemini Integration Adjustments and Model Fallback]

- **Main prompt:** "Ask for help fixing the API key and implementing Gemini for filtering and difficulty evaluation, separating subject, content and difficulty and generating a suggested answer for the teacher."
- **What the AI generated:** Code with suggestions for implementing Gemini and guidance on testing the models available with the API key directly in the code.
- **What the team kept:** We reused the generated code as the basis for the integration.
- **What the team corrected or rejected, and why:** We had to correct many points due to conceptual flaws in the initial code and requested fallback across all available models with three attempts per model because the AI's earlier approaches did not work in practice. If an error occurred in one model, it would proceed to the next model instead of blocking the system.

### [28/11] — [Final Front-End Adjustments Based on the Canva Design]

- **Main prompt:** "Send the visual design created in Canva to adjust the code to the front end's final model."
- **What the AI generated:** Front-end code built from images of the layout designed in Canva.
- **What the team kept:** We reused the code generated by the AI for the front end's final model.
- **What the team corrected or rejected, and why:** We did not adopt any additional suggestions because we had already fully defined our front end before sending it to the AI.
