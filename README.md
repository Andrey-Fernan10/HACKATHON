# Smart tutoring 

*English* · [Português (Brasil)](README.pt-BR.md)

Fill in this README and keep it up to date. It is part of the delivery and must remain at the *root* of the repository, together with DECISIONS.md and AI_LOG.md (and their Portuguese versions: README.pt-BR.md, DECISIONS.pt-BR.md and AI_LOG.pt-BR.md).

Project documentation must be written in *English* (this file is the main version), with a *Portuguese version* alongside. Keep both versions in sync.

Create, inside the repository, the *folders for each part of the project* you will develop (for example, /backend, /frontend, /docs). How you organize them is the team's choice — describe it in [Folder structure](#folder-structure).

On the first day, add the instructor as a repository collaborator, using the email **adrianoanschau@gmail.com*.

## Team

- *Class:* TDS — mixed groups 6570, 6756, and 6863
- *Tech Lead:*
- *Presentation lead:*
- *Members:*
  - Luisa — luisalopes11
  - João Vitor — GHuser26-dev
  - Andrey — Andrey-Fernan10
  - Murilo — murilomachadofelix

## Theme / area

Smart tutoring (Monitoria inteligente) — campus life and community

## Problem

Our application aims to address the difficulties students may face in locating and accessing tutoring sessions tailored to their academic needs. 
The application is primarily designed for students who require study support and wish to find assistance from tutors for specific subjects.

## Solution

Smart tutoring (Monitoria inteligente) is an application developed to facilitate connections between students and tutors, allowing students to find available tutoring sessions based on their specific needs and subjects. The platform aims to make the academic support process more organized and accessible, simplifying how information related to tutoring sessions is accessed and managed.

MVPs – Smart tutoring (Monitoria inteligente)
1. User authentication:
  - User login.
  - Profile identification (Teacher or Student).
  - Registration (name, email, and password).
2. Question management:
  - Students can submit questions.
  - Storage of question text.
  - Identification of the student who submitted the question.
3. AI-powered intelligent filtering:
  - Analysis of incoming questions.
  - Identification of related questions based on correlation.
  - Routing of questions based on the analysis results.
4. Teacher dashboard:
  - View of the student question inbox.
  - Access to received questions.
  - Ability to respond to questions.
5. Response system:
  - Storage of response text.
  - Linking of the response to the corresponding question.
  - Recording of response evaluation (good_response, initially set to false).
6. Viewing answered questions:
  - Display of questions that have already been answered.
  - Presentation of the corresponding answers to students.

## Stack

Languages ​​used:
  Front-End: 
    - JavaScript

  Back-End: 
    - Java; 
    - Python for AI integration
  
The project will initially be developed exclusively for web and desktop.

## Folder structure

Describe how the repository is organized. Adjust the example below to the team's choice.

text
/
├── README.md
├── README.pt-BR.md
├── DECISIONS.md
├── DECISIONS.pt-BR.md
├── AI_LOG.md
├── AI_LOG.pt-BR.md
├── backend/
├── frontend/
└── docs/


## How to run

### Prerequisites

Back-End: 
  - Java JDK 17
  - Apache Maven
  - Spring Boot 3.3.5
  - SQLite

Front-End: 
  - Update web browser

Development tools:
  - Visual Studio Code
  - Git

### Back-end

bash
# commands to install dependencies and start the back-end


### Front-end

bash
# commands to install dependencies and start the front-end


## CI/CD

(describe the GitHub Actions pipeline: what runs on each PR and on each push to main — at a minimum, build, lint and tests)

## Deploy

(where the application is published, if applicable; or note that automatic deploy has not been set up yet)

## Links

- **Repository:**
- **Deploy (if any):**
- **https://github.com/Andrey-Fernan10/HACKATHON.git**
