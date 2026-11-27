const API_URL = 'http://localhost:8080/api/questions';
const feed = document.getElementById('feed');
const message = document.getElementById('message');

const SHARED_RATINGS_KEY = 'sm_shared_ratings_v1';

const primaryUser = localStorage.getItem('user');
const rawUser = primaryUser || localStorage.getItem('loggedUser');
const currentUser = rawUser ? JSON.parse(rawUser) : null;
if (currentUser?.name) {
    document.getElementById('teacher-name').textContent = currentUser.name;
}

function getDraftAnswer(question) {
    return question?.draftAnswerForMonitor
        ?? question?.triage?.draftAnswerForMonitor
        ?? '';
}

function getAnswersList(question) {
    if (Array.isArray(question?.answers) && question.answers.length > 0) {
        return question.answers;
    }
    if (question?.answer) {
        return [{
            id: null,
            questionId: question?.id ?? null,
            content: question.answer,
            author: { name: 'Resposta anterior' },
            helpfulCount: 0,
            ratingSum: 0,
            ratingCount: 0,
            legacySingleAnswer: true
        }];
    }
    return [];
}

function getEffectiveRatingMetrics(ans, questionId) {
    let count = ans?.ratingCount ?? 0;
    let sum = ans?.ratingSum ?? 0;
    let helpful = ans?.helpfulCount ?? 0;

    if (count === 0 && helpful === 0) {
        try {
            const store = JSON.parse(localStorage.getItem(SHARED_RATINGS_KEY) || '{}');
            const key = ans?.id != null ? `answer_${ans.id}` : `question_${questionId}`;
            const saved = store[key];
            if (saved) {
                count = saved.ratingCount ?? 0;
                sum = saved.ratingSum ?? 0;
                helpful = saved.helpfulCount ?? 0;
            }
        } catch {
            // Mantém valores padrão se o storage não puder ser lido
        }
    }

    return { count, sum, helpful };
}

function formatRating(ans, questionId) {
    const { count, sum } = getEffectiveRatingMetrics(ans, questionId);
    if (!count) return 'Sem nota';
    return `★ ${(sum / count).toFixed(1)} (${count})`;
}

function createQuestionCard(question) {
    const card = document.createElement('article');
    card.className = 'card';

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const author = document.createElement('span');
    author.textContent = `Pergunta #${question.id} • ${question.author?.name || 'Anônimo'}`;
    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = question.status || 'Pendente';
    meta.append(author, status);
    card.append(meta);

    const tags = [question.subject, question.topic, question.difficulty].filter(Boolean);
    if (tags.length > 0) {
        const triageRow = document.createElement('div');
        triageRow.className = 'card-triage';
        triageRow.style.fontSize = '0.85rem';
        triageRow.style.margin = '6px 0';
        triageRow.textContent = tags.join(' • ');
        card.append(triageRow);
    }

    const content = document.createElement('p');
    content.className = 'question-content';
    content.textContent = question.content;
    card.append(content);

    const existingAnswers = getAnswersList(question);
    if (existingAnswers.length > 0) {
        const listBox = document.createElement('div');
        listBox.className = 'previous-answers';
        listBox.style.margin = '10px 0';
        listBox.style.display = 'flex';
        listBox.style.flexDirection = 'column';
        listBox.style.gap = '6px';

        existingAnswers.forEach(ans => {
            const row = document.createElement('div');
            row.style.padding = '8px';
            row.style.borderRadius = '6px';
            row.style.border = '1px solid rgba(128,128,128,0.25)';

            const metrics = getEffectiveRatingMetrics(ans, question.id);
            const who = document.createElement('div');
            who.style.fontSize = '0.8rem';
            who.style.opacity = '0.85';
            who.textContent = `${ans.author?.name || 'Monitor/Professor'} • ${formatRating(ans, question.id)} • Útil: ${metrics.helpful}`;

            const body = document.createElement('p');
            body.style.margin = '4px 0 0 0';
            body.textContent = ans.content;

            row.append(who, body);
            listBox.appendChild(row);
        });

        card.append(listBox);
    }

    const draft = getDraftAnswer(question);
    const hasAnswers = existingAnswers.length > 0;

    const form = document.createElement('form');
    form.className = 'answer-form';
    const label = document.createElement('label');
    label.textContent = hasAnswers
        ? 'Adicionar nova resposta'
        : (draft ? 'Rascunho sugerido pela IA (revise antes de enviar)' : 'Sua resposta');

    const textarea = document.createElement('textarea');
    textarea.required = true;
    textarea.maxLength = 2000;
    textarea.value = hasAnswers ? '' : draft;
    textarea.placeholder = 'Escreva uma resposta para o estudante...';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = hasAnswers ? 'Publicar nova resposta' : 'Enviar resposta';
    form.append(label, textarea, submit);
    card.append(form);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const answerContent = textarea.value.trim();
        if (!answerContent) {
            message.textContent = 'Digite uma resposta antes de enviar.';
            return;
        }

        submit.disabled = true;
        message.textContent = 'Salvando resposta...';
        try {
            const payload = {
                content: answerContent,
                answer: answerContent,
                authorId: currentUser?.id ?? null,
                authorEmail: currentUser?.email ?? null
            };

            const response = await fetch(`${API_URL}/${question.id}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                message.textContent = response.status === 404
                    ? 'Essa pergunta não foi encontrada.'
                    : 'Não foi possível salvar a resposta.';
                return;
            }

            textarea.value = '';
            await loadQuestions();
            message.textContent = 'Resposta salva. A pergunta agora está como Respondida.';
        } catch (error) {
            message.textContent = 'Não foi possível conectar ao servidor. A resposta não foi salva.';
        } finally {
            submit.disabled = false;
        }
    });

    return card;
}

function renderQuestions(questions) {
    feed.replaceChildren();
    if (!questions.length) {
        feed.textContent = 'Ainda não há perguntas.';
        return;
    }
    questions.forEach(question => feed.append(createQuestionCard(question)));
}

async function loadQuestions() {
    message.textContent = 'Carregando perguntas...';
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            message.textContent = 'Não foi possível carregar as perguntas.';
            return;
        }
        renderQuestions(await response.json());
        message.textContent = '';
    } catch (error) {
        message.textContent = 'Não foi possível conectar ao servidor. Verifique se o back-end está ativo.';
    }
}

document.getElementById('refresh-questions').addEventListener('click', loadQuestions);
loadQuestions();