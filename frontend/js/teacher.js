const API_URL = 'http://localhost:8080/api/questions';
const feed = document.getElementById('feed');
const message = document.getElementById('message');

const SHARED_RATINGS_KEY = 'sm_shared_ratings_v1';

let allQuestions = [];
const activeFilters = {
    query: '',
    status: '',
    subject: '',
    topic: '',
    difficulty: ''
};

const primaryUser = localStorage.getItem('user');
const rawUser = primaryUser || localStorage.getItem('loggedUser');
const currentUser = rawUser ? JSON.parse(rawUser) : null;
if (currentUser?.name) {
    document.getElementById('teacher-name').textContent = currentUser.name;
}

const filterBar = document.createElement('div');
filterBar.id = 'teacher-filter-bar';
filterBar.style.display = 'flex';
filterBar.style.flexWrap = 'wrap';
filterBar.style.gap = '8px';
filterBar.style.alignItems = 'center';
filterBar.style.marginBottom = '14px';

const searchInput = document.createElement('input');
searchInput.type = 'search';
searchInput.id = 'teacher-search-input';
searchInput.placeholder = 'Buscar pergunta ou resposta...';
searchInput.setAttribute('aria-label', 'Buscar pergunta ou resposta');

const statusSelect = document.createElement('select');
statusSelect.id = 'teacher-filter-status';
statusSelect.setAttribute('aria-label', 'Filtrar por status');

const subjectSelect = document.createElement('select');
subjectSelect.id = 'teacher-filter-subject';
subjectSelect.setAttribute('aria-label', 'Filtrar por matéria');

const topicSelect = document.createElement('select');
topicSelect.id = 'teacher-filter-topic';
topicSelect.setAttribute('aria-label', 'Filtrar por conteúdo');

const difficultySelect = document.createElement('select');
difficultySelect.id = 'teacher-filter-difficulty';
difficultySelect.setAttribute('aria-label', 'Filtrar por dificuldade');

const clearFiltersBtn = document.createElement('button');
clearFiltersBtn.type = 'button';
clearFiltersBtn.textContent = 'Limpar filtros';
clearFiltersBtn.style.padding = '6px 12px';
clearFiltersBtn.style.borderRadius = '999px';
clearFiltersBtn.style.border = '1px solid rgba(128,128,128,0.35)';
clearFiltersBtn.style.background = 'rgba(128,128,128,0.12)';
clearFiltersBtn.style.color = 'var(--text-main, #111)';
clearFiltersBtn.style.fontWeight = '600';
clearFiltersBtn.style.cursor = 'pointer';

const filterCounter = document.createElement('span');
filterCounter.id = 'teacher-filter-counter';
filterCounter.style.fontSize = '0.85rem';
filterCounter.style.opacity = '0.8';
filterCounter.style.marginLeft = 'auto';

[searchInput, statusSelect, subjectSelect, topicSelect, difficultySelect].forEach(el => {
    el.style.padding = '6px 12px';
    el.style.borderRadius = '999px';
    el.style.border = '1px solid rgba(128,128,128,0.35)';
    el.style.background = 'var(--surface, #fff)';
    el.style.color = 'var(--text-main, #111)';
    el.style.fontSize = '0.88rem';
});

[statusSelect, subjectSelect, topicSelect, difficultySelect].forEach(sel => {
    sel.style.cursor = 'pointer';
});

searchInput.style.minWidth = '200px';

filterBar.append(
    searchInput,
    statusSelect,
    subjectSelect,
    topicSelect,
    difficultySelect,
    clearFiltersBtn,
    filterCounter
);

if (feed && feed.parentElement) {
    feed.parentElement.insertBefore(filterBar, feed);
}

function normalizeText(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function inferMetaFromText(text) {
    const clean = String(text || '').trim();
    const lower = normalizeText(clean);

    if (!clean) {
        return { subject: 'Geral', topic: 'Sem conteúdo', difficulty: 'Básico' };
    }

    // 1. Programação e Tecnologia
    if (
        /\b(programacao|codigo|algoritmo|logica|java|spring|jpa|hibernate|sql|select|insert|update|delete|join|banco de dados|bd|html|css|javascript|js|typescript|ts|python|c\+\+|csharp|c#|php|node|react|angular|vue|api|rest|json|xml|git|github|docker|linux|terminal|bug|erro|exception|stacktrace|array|vetor|lista|loop|for|while|if|else|funcao|metodo|classe|objeto|variavel|ponteiros|recursao)\b/.test(
            lower
        )
    ) {
        let topic = 'Lógica e algoritmos';
        if (/\b(sql|select|insert|update|delete|join|banco de dados|bd|postgres|mysql|sqlite|mongodb)\b/.test(lower)) {
            topic = 'Banco de dados';
        } else if (/\b(java|spring|jpa|hibernate|api|rest|backend|servidor)\b/.test(lower)) {
            topic = 'Java e backend';
        } else if (/\b(html|css|javascript|js|typescript|react|frontend|dom|tela|botao)\b/.test(lower)) {
            topic = 'Desenvolvimento web';
        } else if (/\b(git|github|docker|linux|terminal|deploy)\b/.test(lower)) {
            topic = 'Ferramentas e ambiente';
        } else if (/\b(array|vetor|lista|pilha|fila|arvore|grafo|ordenacao|busca)\b/.test(lower)) {
            topic = 'Estruturas de dados';
        }

        const difficulty = /\b(recursao|arvore|grafo|concorrencia|thread|deadlock|jpa|hibernate|docker|complexidade|assintotica)\b/.test(
            lower
        )
            ? 'Avançado'
            : clean.length <= 24
                ? 'Básico'
                : 'Intermediário';

        return { subject: 'Programação', topic, difficulty };
    }

    // 2. Matemática
    if (
        /[²³⁴⁵⁶⁷⁸⁹]|\^|=|\b(matematica|conta|calcular|calculo|soma|somar|subtracao|subtrair|multiplicacao|multiplicar|divisao|dividir|potencia|potenciacao|raiz|equacao|equacoes|inequacao|funcao|funcoes|porcentagem|porcento|fracao|fracoes|razao|proporcao|regra de tres|geometria|triangulo|quadrado|retangulo|circulo|area|perimetro|volume|pitagoras|seno|cosseno|tangente|matriz|logaritmo|probabilidade|estatistica|media|mediana|moda|fatorial|combinatoria)\b/.test(
            lower
        ) ||
        /^\s*\d+\s*[\+\-\*\/]\s*\d+/.test(lower)
    ) {
        let topic = 'Operações básicas';
        if (/[²³⁴⁵⁶⁷⁸⁹]|\^|\b(potencia|potenciacao|raiz)\b/.test(lower)) topic = 'Potenciação e radiciação';
        else if (/\b(equacao|equacoes|inequacao|x\s*=|2x|3x)\b/.test(lower)) topic = 'Equações';
        else if (/\b(funcao|funcoes|f\(x\)|grafico)\b/.test(lower)) topic = 'Funções';
        else if (/\b(porcentagem|porcento|fracao|fracoes|razao|proporcao|regra de tres)\b/.test(lower)) {
            topic = 'Frações, razão e porcentagem';
        } else if (/\b(geometria|triangulo|quadrado|retangulo|circulo|area|perimetro|volume|pitagoras)\b/.test(lower)) {
            topic = 'Geometria';
        } else if (/\b(probabilidade|estatistica|media|mediana|moda|combinatoria)\b/.test(lower)) {
            topic = 'Estatística e probabilidade';
        }

        const difficulty = /\b(integral|derivada|limite|logaritmo|matriz|combinatoria|trigonometria)\b/.test(lower)
            ? 'Avançado'
            : clean.length <= 25 && !/\b(equacao|equacoes|funcao|funcoes)\b/.test(lower)
                ? 'Básico'
                : 'Intermediário';

        return { subject: 'Matemática', topic, difficulty };
    }

    // 3. Física
    if (
        /\b(fisica|velocidade|aceleracao|forca|peso|massa|energia|trabalho|potencia mecanica|gravidade|gravacao|cinematica|dinamica|newton|atrito|impulso|quantidade de movimento|eletricidade|corrente|tensao|resistencia|ohm|circuito|magnetismo|ima|campo magnetico|optica|lente|espelho|reflexao|refracao|termologia|temperatura|calor|dilatacao|onda|som|frequencia)\b/.test(
            lower
        )
    ) {
        let topic = 'Mecânica e movimento';
        if (/\b(eletricidade|corrente|tensao|resistencia|ohm|circuito|magnetismo|ima)\b/.test(lower)) {
            topic = 'Eletricidade e magnetismo';
        } else if (/\b(optica|lente|espelho|reflexao|refracao|onda|som|frequencia)\b/.test(lower)) {
            topic = 'Ondas e óptica';
        } else if (/\b(termologia|temperatura|calor|dilatacao|termodinamica)\b/.test(lower)) {
            topic = 'Termologia';
        }

        const difficulty = /\b(eletromagnetismo|termodinamica|refracao|impulso|torque)\b/.test(lower)
            ? 'Avançado'
            : 'Intermediário';

        return { subject: 'Física', topic, difficulty };
    }

    // 4. Química
    if (
        /\b(quimica|atomo|atomos|molecula|moleculas|elemento|elementos|tabela periodica|ligacao|ionica|covalente|reacao|reacoes|estequiometria|mol|molaridade|solucao|solucoes|acido|base|sal|oxido|ph|oxidacao|reducao|eletroquimica|organica|hidrocarboneto|alcool|funcao organica|radioatividade|uranio|decomposicao|meia-vida|isotopo)\b/.test(
            lower
        )
    ) {
        let topic = 'Química geral e átomos';
        if (/\b(reacao|reacoes|estequiometria|mol|molaridade|solucao|acido|base|ph)\b/.test(lower)) {
            topic = 'Reações e soluções';
        } else if (/\b(organica|hidrocarboneto|alcool|cadeia carbonica|funcao organica)\b/.test(lower)) {
            topic = 'Química orgânica';
        } else if (/\b(radioatividade|uranio|decomposicao|meia-vida|isotopo|nuclear)\b/.test(lower)) {
            topic = 'Radioatividade e nuclear';
        }

        return { subject: 'Química', topic, difficulty: 'Intermediário' };
    }

    // 5. Biologia
    if (
        /\b(biologia|celula|celulas|mitose|meiose|dna|rna|gene|genes|genetica|heranca|mutacao|evolucao|selecao natural|darwin|ecologia|ecossistema|cadeia alimentar|bioma|flora|fauna|anatomia|fisiologia|sistema nervoso|digestorio|respiratorio|circulatorio|fotossintese|respiracao celular|bacteria|virus|fungo|protozoario|botanica|zoologia)\b/.test(
            lower
        )
    ) {
        let topic = 'Biologia celular e genética';
        if (/\b(ecologia|ecossistema|cadeia alimentar|bioma|meio ambiente|sustentabilidade)\b/.test(lower)) {
            topic = 'Ecologia e meio ambiente';
        } else if (/\b(anatomia|fisiologia|sistema|corpo humano|saude|imunologia)\b/.test(lower)) {
            topic = 'Fisiologia e corpo humano';
        } else if (/\b(evolucao|selecao natural|darwin|taxonomia|filogenia)\b/.test(lower)) {
            topic = 'Evolução e biodiversidade';
        }

        return { subject: 'Biologia', topic, difficulty: 'Intermediário' };
    }

    // 6. História
    if (
        /\b(historia|historica|historico|napoleao|imperio|imperios|guerra|guerras|revolucao|revolucoes|idade media|feudalismo|renascimento|iluminismo|idade antiga|roma|grecia|egito|brasil colonia|brasil imperio|republica|ditadura|escravidao|abolicao|independencia|proclamacao|idade contemporanea|guerra fria|nazismo|fascismo)\b/.test(
            lower
        )
    ) {
        let topic = 'História geral';
        if (/\b(brasil|colonia|imperio do brasil|republica velha|era vargas|ditadura militar|escravidao|quilombo)\b/.test(lower)) {
            topic = 'História do Brasil';
        } else if (/\b(guerra|revolucao|feudalismo|renascimento|iluminismo|roma|grecia|napoleao)\b/.test(lower)) {
            topic = 'História mundial';
        }

        return { subject: 'História', topic, difficulty: 'Intermediário' };
    }

    // 7. Geografia
    if (
        /\b(geografia|geografico|relevo|planalto|planicie|depressao|clima|climatico|chuva|temperatura media|vegetacao|bioma|amazonia|cerrado|caatinga|pantanal|pampa|mata atlantica|cartografia|mapa|escala|latitude|longitude|coordenadas|populacao|demografia|urbanizacao|exodo rural|migracao|globalizacao|geopolitica|fronteira|bacia hidrografica|rio|solo|erosao)\b/.test(
            lower
        )
    ) {
        let topic = 'Geografia física';
        if (/\b(populacao|demografia|urbanizacao|migracao|globalizacao|geopolitica|industria|comercio)\b/.test(lower)) {
            topic = 'Geografia humana e geopolítica';
        } else if (/\b(mapa|escala|latitude|longitude|coordenadas|projecao|cartografia)\b/.test(lower)) {
            topic = 'Cartografia';
        }

        return { subject: 'Geografia', topic, difficulty: 'Intermediário' };
    }

    // 8. Língua Portuguesa e Literatura
    if (
        /\b(portugues|gramatica|crase|pontuacao|virgula|acentuacao|ortografia|sintaxe|sujeito|predicado|objeto direto|objeto indireto|verbo|conjugacao|substantivo|adjetivo|pronome|conjunção|conjuncao|preposicao|concordancia|regencia|redacao|dissertacao|argumentacao|literatura|romantismo|realismo|modernismo|barroco|arcadismo|parnasianismo|simbolismo|poema|poesia|conto|cronica|figura de linguagem|metafora|ironia|antitese|interpretacao de texto)\b/.test(
            lower
        )
    ) {
        let topic = 'Gramática e sintaxe';
        if (/\b(redacao|dissertacao|argumentacao|coesao|coerencia|texto)\b/.test(lower)) {
            topic = 'Redação e produção textual';
        } else if (/\b(literatura|romantismo|realismo|modernismo|barroco|poema|figura de linguagem|metafora)\b/.test(lower)) {
            topic = 'Literatura e figuras de linguagem';
        }

        return { subject: 'Português', topic, difficulty: 'Intermediário' };
    }

    // 9. Inglês
    if (
        /\b(ingles|english|grammar|verb to be|simple present|simple past|present continuous|future|vocabulary|vocabulario|traducao|translate|meaning of|what does .* mean|how do you say)\b/.test(
            lower
        )
    ) {
        return { subject: 'Inglês', topic: 'Gramática e vocabulário', difficulty: 'Básico' };
    }

    return {
        subject: 'Geral',
        topic: 'Dúvida geral',
        difficulty: clean.length <= 20 ? 'Básico' : 'Intermediário'
    };
}

function getTriageInfo(question) {
    const rawTriage = question?.triage || null;
    const inferred = inferMetaFromText(question?.content ?? '');

    const rawSubject = rawTriage?.subject ?? question?.subject;
    const rawTopic = rawTriage?.topic ?? question?.topic;
    const rawDifficulty = rawTriage?.difficulty ?? question?.difficulty;

    const hasExplicitSubject = rawSubject && String(rawSubject).trim() && normalizeText(rawSubject) !== 'geral';
    const hasExplicitTopic =
        rawTopic && String(rawTopic).trim() && !['duvida geral', 'geral'].includes(normalizeText(rawTopic));
    const hasExplicitDifficulty = rawDifficulty && String(rawDifficulty).trim();

    return {
        subject: hasExplicitSubject ? String(rawSubject).trim() : inferred.subject,
        topic: hasExplicitTopic ? String(rawTopic).trim() : inferred.topic,
        difficulty: hasExplicitDifficulty ? String(rawDifficulty).trim() : inferred.difficulty
    };
}

function populateSelectOptions(selectEl, placeholder, values, selectedValue) {
    selectEl.replaceChildren();
    const def = document.createElement('option');
    def.value = '';
    def.textContent = placeholder;
    selectEl.appendChild(def);

    values.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        if (val.toLowerCase() === String(selectedValue || '').toLowerCase()) {
            opt.selected = true;
        }
        selectEl.appendChild(opt);
    });
}

function updateFilterOptions(questions) {
    const statuses = new Set(['Pendente', 'Respondida']);
    const subjects = new Set();
    const topics = new Set();
    const difficulties = new Set();

    questions.forEach(q => {
        if (q?.status) statuses.add(String(q.status).trim());
        const info = getTriageInfo(q);
        if (info.subject) subjects.add(info.subject);
        if (info.topic) topics.add(info.topic);
        if (info.difficulty) difficulties.add(info.difficulty);
    });

    populateSelectOptions(statusSelect, 'Status: Todos', [...statuses], activeFilters.status);
    populateSelectOptions(subjectSelect, 'Matéria: Todas', [...subjects].sort(), activeFilters.subject);
    populateSelectOptions(topicSelect, 'Conteúdo: Todos', [...topics].sort(), activeFilters.topic);
    populateSelectOptions(difficultySelect, 'Dificuldade: Todas', [...difficulties].sort(), activeFilters.difficulty);
}

function matchesActiveFilters(question) {
    const info = getTriageInfo(question);

    if (activeFilters.status && normalizeText(question?.status || 'Pendente') !== normalizeText(activeFilters.status)) {
        return false;
    }
    if (activeFilters.subject && normalizeText(info.subject) !== normalizeText(activeFilters.subject)) {
        return false;
    }
    if (activeFilters.topic && normalizeText(info.topic) !== normalizeText(activeFilters.topic)) {
        return false;
    }
    if (activeFilters.difficulty && normalizeText(info.difficulty) !== normalizeText(activeFilters.difficulty)) {
        return false;
    }

    if (activeFilters.query) {
        const needle = normalizeText(activeFilters.query);
        const contentText = normalizeText(question?.content || '');
        const authorText = normalizeText(question?.author?.name || '');
        const answersText = Array.isArray(question?.answers)
            ? normalizeText(question.answers.map(a => String(a?.content || '')).join(' '))
            : normalizeText(question?.answer || '');
        const metaText = normalizeText(`${info.subject} ${info.topic} ${info.difficulty}`);

        if (
            !contentText.includes(needle) &&
            !authorText.includes(needle) &&
            !answersText.includes(needle) &&
            !metaText.includes(needle)
        ) {
            return false;
        }
    }

    return true;
}

function createMetaPill(labelText, bgColor, textColor) {
    const pill = document.createElement('span');
    pill.textContent = labelText;
    pill.style.display = 'inline-flex';
    pill.style.alignItems = 'center';
    pill.style.padding = '3px 9px';
    pill.style.borderRadius = '999px';
    pill.style.fontSize = '0.78rem';
    pill.style.fontWeight = '600';
    pill.style.background = bgColor;
    pill.style.color = textColor;
    pill.style.whiteSpace = 'nowrap';
    return pill;
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
    const info = getTriageInfo(question);
    const card = document.createElement('article');
    card.className = 'card';

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.style.display = 'flex';
    meta.style.flexWrap = 'wrap';
    meta.style.alignItems = 'center';
    meta.style.justifyContent = 'space-between';
    meta.style.gap = '8px';

    const author = document.createElement('span');
    author.textContent = `Pergunta #${question.id} • ${question.author?.name || 'Anônimo'}`;

    const badgesWrap = document.createElement('div');
    badgesWrap.style.display = 'flex';
    badgesWrap.style.flexWrap = 'wrap';
    badgesWrap.style.alignItems = 'center';
    badgesWrap.style.gap = '6px';

    badgesWrap.append(
        createMetaPill(`Matéria: ${info.subject}`, 'rgba(59, 130, 246, 0.14)', '#1d4ed8'),
        createMetaPill(`Conteúdo: ${info.topic}`, 'rgba(16, 185, 129, 0.14)', '#047857'),
        createMetaPill(`Dificuldade: ${info.difficulty}`, 'rgba(245, 158, 11, 0.16)', '#b45309')
    );

    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = question.status || 'Pendente';
    badgesWrap.appendChild(status);

    meta.append(author, badgesWrap);
    card.append(meta);

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

function renderFilteredQuestions() {
    const filtered = allQuestions.filter(matchesActiveFilters);
    filterCounter.textContent = `${filtered.length} de ${allQuestions.length} ${allQuestions.length === 1 ? 'pergunta' : 'perguntas'}`;
    renderQuestions(filtered);
}

function renderQuestions(questions) {
    feed.replaceChildren();
    if (!questions.length) {
        feed.textContent = allQuestions.length
            ? 'Nenhuma pergunta encontrada com os filtros selecionados.'
            : 'Ainda não há perguntas.';
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
        allQuestions = await response.json();
        updateFilterOptions(allQuestions);
        renderFilteredQuestions();
        message.textContent = '';
    } catch (error) {
        message.textContent = 'Não foi possível conectar ao servidor. Verifique se o back-end está ativo.';
    }
}

searchInput.addEventListener('input', () => {
    activeFilters.query = searchInput.value.trim();
    renderFilteredQuestions();
});

statusSelect.addEventListener('change', () => {
    activeFilters.status = statusSelect.value;
    renderFilteredQuestions();
});

subjectSelect.addEventListener('change', () => {
    activeFilters.subject = subjectSelect.value;
    renderFilteredQuestions();
});

topicSelect.addEventListener('change', () => {
    activeFilters.topic = topicSelect.value;
    renderFilteredQuestions();
});

difficultySelect.addEventListener('change', () => {
    activeFilters.difficulty = difficultySelect.value;
    renderFilteredQuestions();
});

clearFiltersBtn.addEventListener('click', () => {
    activeFilters.query = '';
    activeFilters.status = '';
    activeFilters.subject = '';
    activeFilters.topic = '';
    activeFilters.difficulty = '';
    searchInput.value = '';
    updateFilterOptions(allQuestions);
    renderFilteredQuestions();
});

document.getElementById('refresh-questions').addEventListener('click', loadQuestions);
loadQuestions();