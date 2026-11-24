# Theme briefing: Smart tutoring

**English** · [Português (Brasil)](BRIEFING.pt-BR.md)

**Hack with AI: Coding with Intelligence**  
Senac na Prática · Technical Program in Systems Development  
Area: campus life and community  
Immersion from 23 to 29 November · presentations on 30 November and 1 December

This briefing is the starting point for **your** theme. Read it carefully, cut an MVP that fits in one week, and record your decisions. You will turn this problem into a real product, with a front end and a back end, an organized repository, and documented use of AI. This is a collaborative immersion: the panel evaluates what the team built, decided, and learned.

## Theme and context

**Smart tutoring** — A platform that connects students who have questions with tutors, using AI to triage the questions.

On campus, a question rarely waits until the next class. It shows up in the hallway, during a break, or at night, in front of an exercise that will not close. Many students fall back on crowded chat groups, where the same question is asked again, the answer disappears in the history, and the people who could help — tutors and more advanced classmates — cannot see clearly what is urgent, what is simple, and what has already been answered.

The result is familiar: overloaded tutors, students who stop asking, and knowledge that is never recorded for the next class. You will take on this problem at Senac, in the everyday life of the Systems Development program and of other classes on campus.

## Audience and personas

- **Student with a question:** wants a reliable answer, in the scope of the course, without having to hunt for someone in a group chat.
- **Tutor or peer who supports others:** needs an organized queue, with context, so they can answer what is still open.
- **Instructor (optional view in the MVP):** may follow the topics that generate the most questions, without turning the tool into an official class gradebook.

## Goal

Ship an MVP in which a student submits a question, AI triages it (topic, difficulty, possible duplicate), and a tutor can claim, answer, and close it — with a searchable history.

## Minimum requirements (MVP)

The scope below is realistic for one week. Lock it on the first day and record in `DECISIONS.md` what is in, what is out, and why. A complete, demonstrable flow is better than a long list left half-done.

1. The student signs in in a simple way (even a basic registration is enough) and submits a question, with a course or topic and a clear text.
2. AI classifies the question (topic, approximate difficulty) and indicates whether a similar question has already been answered.
3. Tutors have a queue or list of open questions, with the triage result visible.
4. A tutor claims a question, records the answer, and updates the status (open, in progress, answered).
5. The student can follow the status of their own question and see the answer.
6. There is a search or listing of answered questions, so the team can reuse what has already been solved.

## Where AI comes in

The use of AI is allowed and encouraged — in the product and in the process — and it must appear in `AI_LOG.md`. Some concrete starting points for this theme:

- Classify the question by course, topic, and difficulty from the text.
- Detect repeated questions and suggest an existing answer, for the student or the tutor to validate.
- Suggest a draft reply for the tutor to review — never publish it automatically as if it were the final answer.
- Help the student rephrase a question when it is too vague to be triaged.

Do not publish, without your review, an AI-generated text or automatic decision as if it were already the final version.

## Optional extras

Only after the MVP is standing. These are ideas, not obligations:

- Attach an image or a code snippet to the question.
- Tutor availability hours.
- A notice when the question is claimed or answered.
- A simple view of the most frequent topics for the instructor.

## Out of scope

To protect the deadline and the focus of the product:

- Replacing classes or the official grading of assignments and exams.
- Payment or tutoring scholarships.
- A full learning-management system (grades, attendance, official course materials).
- Publishing an AI-generated reply, without human review, as if it came from the tutor.

## Questions to guide the team

Use these questions on the first day, when you define the MVP, and again before the demo:

- What happens if nobody claims the question within a reasonable time?
- How do you prevent two tutors from answering the same question at once?
- How does the interface make it clear what came from AI and what was validated by a person?
- What minimum information does a question need for triage to actually work?
- How can a student find, in the history, an answer they can trust?

## Deliverables and how the panel evaluates

This is a one-week **collaborative immersion**, with teams of 3 or 4 TDS students. The panel evaluates **your** work, on your own project — formative feedback, not a comparison with other teams.

**What must be in the repository** (at the root), in **English** (the main version) and in **Portuguese** (`.pt-BR`), with a language link at the top of each file:

- `README.md` and `README.pt-BR.md`
- `DECISIONS.md` and `DECISIONS.pt-BR.md`
- `AI_LOG.md` and `AI_LOG.pt-BR.md`

The application must have a **front end and a back end**. The back end may be **Java**, **Python**, or **Node.js** (alone or combined, as long as they are integrated). A front end is required (web, desktop, or mobile). Justify the stack in `DECISIONS.md`. Also required: a Conventional Commits history, work through reviewed Pull Requests, a protected `main` branch, and a green **GitHub Actions** pipeline (build, lint, and tests) on PRs and on `main`. Do not commit secrets. On the first day, add the instructor as a collaborator: **adrianoanschau@gmail.com**.

**Code freeze** is on Sunday, **29 November, at 23:59**. Presentations are **15 minutes + 5 minutes of questions**, on 30 November and 1 December, at Senac Canoas, Room 103. Rehearse the demo and the required outline (problem and solution, live demo, workflow, decisions, AI in practice, and CI/CD).

Evaluation is split equally between **two panels**:

- **Technical panel (50%):** code quality and architecture; Git, Conventional Commits, and PRs; CI/CD; command of the code in the Q&A.
- **Innovation and Impact panel (50%):** originality; impact (the real problem and for whom); user experience; clarity of the pitch; creative use of AI.

Anyone on the team may be asked about any part of the project. Use AI thoughtfully, record what it generated and what you corrected, and own the code you present.

Good work — and may the week be intense, collaborative, and well documented.

