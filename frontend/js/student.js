const API_URL = 'http://localhost:8080/api/questions';
const ANSWERS_API_URL = 'http://localhost:8080/api/answers';

const feed = document.getElementById('feed');
const searchForm = document.getElementById('form-search');
const questionForm = document.getElementById('form-question');

const expandedQuestionIds = new Set();
const legacyRatings = new Map();
let latestItems = [];

const activeFilters = {
  query: '',
  subject: '',
  topic: '',
  difficulty: ''
};

/* -------------------------------------------------------------------------- */
/*  Usuário logado                                                            */
/* -------------------------------------------------------------------------- */

function resolveLoggedUser() {
  const raw =
    localStorage.getItem('user') ||
    localStorage.getItem('loggedUser') ||
    sessionStorage.getItem('user') ||
    sessionStorage.getItem('loggedUser');

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'password' in parsed) {
      delete parsed.password;
      localStorage.setItem('loggedUser', JSON.stringify(parsed));
    }
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

let loggedUser = resolveLoggedUser();

if (loggedUser?.email) {
  const btnUser = document.getElementById('btn-user');
  if (btnUser) btnUser.title = `${loggedUser.name ?? ''} (${loggedUser.email})`;
}

function getAccountKey(user) {
  const rawId = user?.id ?? user?.userId ?? user?.email ?? user?.name;
  return rawId ? String(rawId).trim().toLowerCase() : 'guest';
}

/* -------------------------------------------------------------------------- */
/*  Votos e avaliações (localStorage)                                         */
/* -------------------------------------------------------------------------- */

const sharedRatingsKey = 'sm_shared_ratings_v1';

function getVotedStorageKey(user) {
  return `sm_voted_answers_${getAccountKey(user)}`;
}

function loadVotedSet(user) {
  try {
    const list = JSON.parse(localStorage.getItem(getVotedStorageKey(user)) || '[]');
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
}

function getSharedRatingsStore() {
  try {
    return JSON.parse(localStorage.getItem(sharedRatingsKey) || '{}');
  } catch {
    return {};
  }
}

function saveSharedRating(targetKey, score) {
  const store = getSharedRatingsStore();
  const current = store[targetKey] || { ratingCount: 0, ratingSum: 0, helpfulCount: 0 };

  store[targetKey] = {
    ratingCount: current.ratingCount + 1,
    ratingSum: current.ratingSum + Number(score),
    helpfulCount: current.helpfulCount
  };

  localStorage.setItem(sharedRatingsKey, JSON.stringify(store));
}

function getSharedRating(targetKey) {
  const store = getSharedRatingsStore();
  return store[targetKey] || null;
}

function getAnswerVoteKey(ans) {
  if (ans?.id != null) return `answer_${ans.id}`;
  if (ans?.questionId != null) return `question_${ans.questionId}`;
  return null;
}

function hasAccountVoted(ans) {
  const key = getAnswerVoteKey(ans);
  if (!key) return false;
  return loadVotedSet(resolveLoggedUser()).has(String(key));
}

function markAccountVoted(ans) {
  const key = getAnswerVoteKey(ans);
  if (!key) return;

  const user = resolveLoggedUser();
  const set = loadVotedSet(user);
  set.add(String(key));
  localStorage.setItem(getVotedStorageKey(user), JSON.stringify([...set]));
}

/* -------------------------------------------------------------------------- */
/*  Elementos de interface criados dinamicamente                              */
/* -------------------------------------------------------------------------- */

const triageBox = document.createElement('div');
triageBox.id = 'triage-feedback';
triageBox.className = 'triage-feedback-box';
triageBox.hidden = true;
questionForm.appendChild(triageBox);

// Barra de filtros acima do feed
const filterBar = document.createElement('div');
filterBar.id = 'ai-filter-bar';
filterBar.className = 'ai-filter-bar';
Object.assign(filterBar.style, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'center',
  marginBottom: '14px'
});

const subjectSelect = document.createElement('select');
subjectSelect.id = 'filter-subject';
subjectSelect.setAttribute('aria-label', 'Filtrar por matéria');

const topicSelect = document.createElement('select');
topicSelect.id = 'filter-topic';
topicSelect.setAttribute('aria-label', 'Filtrar por conteúdo');

const difficultySelect = document.createElement('select');
difficultySelect.id = 'filter-difficulty';
difficultySelect.setAttribute('aria-label', 'Filtrar por dificuldade');

const filterCounter = document.createElement('span');
filterCounter.id = 'filter-counter';
Object.assign(filterCounter.style, {
  fontSize: '0.85rem',
  opacity: '0.8',
  marginLeft: 'auto'
});

const clearFiltersBtn = document.createElement('button');
clearFiltersBtn.type = 'button';
clearFiltersBtn.textContent = 'Limpar filtros';
Object.assign(clearFiltersBtn.style, {
  padding: '6px 12px',
  borderRadius: '999px',
  border: '1px solid rgba(128,128,128,0.35)',
  background: 'rgba(128,128,128,0.12)',
  color: 'var(--text-main, #111)',
  fontWeight: '600',
  cursor: 'pointer'
});

[subjectSelect, topicSelect, difficultySelect].forEach((sel) => {
  Object.assign(sel.style, {
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(128,128,128,0.35)',
    background: 'var(--surface, #fff)',
    color: 'var(--text-main, #111)',
    fontSize: '0.88rem',
    cursor: 'pointer'
  });
});

filterBar.append(subjectSelect, topicSelect, difficultySelect, clearFiltersBtn, filterCounter);

// --- CHIPS DE FILTRO GERADOS PELA IA ---
const AI_FILTERS_CACHE_KEY = 'sm_ai_filters_cache_v1';

let activeAiFilterIds = null; // Set<number> ou null quando nenhum chip IA estiver ativo
let activeAiFilterLabel = null; // label do chip selecionado (sobrevive a re-renderizações)
let aiFiltersRequest = null; // evita requisições simultâneas

const aiChipsRow = document.createElement('div');
aiChipsRow.id = 'ai-smart-chips';
Object.assign(aiChipsRow.style, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  alignItems: 'center',
  marginBottom: '12px'
});

if (feed && feed.parentElement) {
  feed.parentElement.insertBefore(aiChipsRow, feed);
}

function isValidAiFilter(f) {
  return Boolean(f) && typeof f.label === 'string' && f.label.trim() !== '' && Array.isArray(f.questionIds);
}

function readAiFiltersCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AI_FILTERS_CACHE_KEY) || 'null');
    return Array.isArray(parsed?.filters) ? parsed.filters.filter(isValidAiFilter) : [];
  } catch {
    return [];
  }
}

function writeAiFiltersCache(filters) {
  try {
    localStorage.setItem(AI_FILTERS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), filters }));
  } catch {
    // Sem espaço ou storage bloqueado: segue sem cache
  }
}

function styleAiChip(chip, isSelected) {
  Object.assign(chip.style, {
    padding: '5px 11px',
    borderRadius: '999px',
    border: '1px solid rgba(99, 102, 241, 0.45)',
    background: isSelected ? '#4338ca' : 'rgba(99, 102, 241, 0.12)',
    color: isSelected ? '#fff' : '#4338ca',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer'
  });
  chip.dataset.selected = String(isSelected);
}

function refreshAiChipStyles() {
  aiChipsRow.querySelectorAll('button').forEach((chip) => {
    styleAiChip(chip, chip.dataset.label === activeAiFilterLabel);
  });
}

function resetAiFilterSelection() {
  activeAiFilterLabel = null;
  activeAiFilterIds = null;
  refreshAiChipStyles();
}

function renderAiChips(aiFilters) {
  const hadSelection = activeAiFilterLabel !== null;
  aiChipsRow.replaceChildren();

  if (!Array.isArray(aiFilters) || aiFilters.length === 0) {
    activeAiFilterLabel = null;
    activeAiFilterIds = null;
    if (hadSelection && latestItems.length > 0) renderFilteredQuestions();
    return;
  }

  const label = document.createElement('span');
  label.textContent = 'Filtros da IA:';
  Object.assign(label.style, {
    fontSize: '0.82rem',
    fontWeight: '700',
    opacity: '0.8'
  });
  aiChipsRow.appendChild(label);

  let selectedStillExists = false;

  aiFilters.forEach((f) => {
    const isSelected = f.label === activeAiFilterLabel;
    if (isSelected) {
      selectedStillExists = true;
      activeAiFilterIds = new Set(f.questionIds.map(Number));
    }

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.dataset.label = f.label;
    chip.textContent = `${f.label} (${f.questionIds.length})`;
    styleAiChip(chip, isSelected);

    chip.addEventListener('click', () => {
      if (activeAiFilterLabel === f.label) {
        activeAiFilterLabel = null;
        activeAiFilterIds = null;
      } else {
        activeAiFilterLabel = f.label;
        activeAiFilterIds = new Set(f.questionIds.map(Number));
      }
      refreshAiChipStyles();
      renderFilteredQuestions();
    });

    aiChipsRow.appendChild(chip);
  });

  // O chip selecionado sumiu na atualização: libera o filtro
  if (!selectedStillExists) {
    activeAiFilterLabel = null;
    activeAiFilterIds = null;
  }

  if (hadSelection && latestItems.length > 0) renderFilteredQuestions();
}

// Busca os filtros no back-end em segundo plano e atualiza chips + cache
function loadAiSmartFilters() {
  if (aiFiltersRequest) return aiFiltersRequest;

  aiFiltersRequest = (async () => {
    try {
      const res = await fetch(`${API_URL}/ai-filters`, { method: 'POST' });
      if (!res.ok) return;

      const data = await res.json();
      const filters = Array.isArray(data?.filters) ? data.filters.filter(isValidAiFilter) : [];

      // Resposta vazia (ex.: IA indisponível): mantém os chips do cache
      if (filters.length === 0) return;

      writeAiFiltersCache(filters);
      renderAiChips(filters);
    } catch {
      // Mantém os chips do cache caso a IA esteja indisponível
    } finally {
      aiFiltersRequest = null;
    }
  })();

  return aiFiltersRequest;
}

if (feed && feed.parentElement) {
  feed.parentElement.insertBefore(filterBar, feed);
}

/* -------------------------------------------------------------------------- */
/*  Utilitários de texto e dados                                              */
/* -------------------------------------------------------------------------- */

function getQuestionData(item) {
  return item?.question && typeof item.question === 'object' ? item.question : item;
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/* -------------------------------------------------------------------------- */
/*  Inferência de matéria / conteúdo / dificuldade                            */
/* -------------------------------------------------------------------------- */

const RE_PROGRAMMING =
  /\b(programacao|codigo|algoritmo|logica|java|spring|jpa|hibernate|sql|select|insert|update|delete|join|banco de dados|bd|html|css|javascript|js|typescript|ts|python|c\+\+|csharp|c#|php|node|react|angular|vue|api|rest|json|xml|git|github|docker|linux|terminal|bug|erro|exception|stacktrace|array|vetor|lista|loop|for|while|if|else|funcao|metodo|classe|objeto|variavel|ponteiros|recursao)\b/;

const RE_MATH =
  /[²³⁴⁵⁶⁷⁸⁹]|\^|=|\b(matematica|conta|calcular|calculo|soma|somar|subtracao|subtrair|multiplicacao|multiplicar|divisao|dividir|potencia|potenciacao|raiz|equacao|equacoes|inequacao|funcao|funcoes|porcentagem|porcento|fracao|fracoes|razao|proporcao|regra de tres|geometria|triangulo|quadrado|retangulo|circulo|area|perimetro|volume|pitagoras|seno|cosseno|tangente|matriz|logaritmo|probabilidade|estatistica|media|mediana|moda|fatorial|combinatoria)\b/;

const RE_PHYSICS =
  /\b(fisica|velocidade|aceleracao|forca|peso|massa|energia|trabalho|potencia mecanica|gravidade|gravacao|cinematica|dinamica|newton|atrito|impulso|quantidade de movimento|eletricidade|corrente|tensao|resistencia|ohm|circuito|magnetismo|ima|campo magnetico|optica|lente|espelho|reflexao|refracao|termologia|temperatura|calor|dilatacao|onda|som|frequencia)\b/;

const RE_CHEMISTRY =
  /\b(quimica|atomo|atomos|molecula|moleculas|elemento|elementos|tabela periodica|ligacao|ionica|covalente|reacao|reacoes|estequiometria|mol|molaridade|solucao|solucoes|acido|base|sal|oxido|ph|oxidacao|reducao|eletroquimica|organica|hidrocarboneto|alcool|funcao organica|radioatividade|uranio|decomposicao|meia-vida|isotopo)\b/;

const RE_BIOLOGY =
  /\b(biologia|celula|celulas|mitose|meiose|dna|rna|gene|genes|genetica|heranca|mutacao|evolucao|selecao natural|darwin|ecologia|ecossistema|cadeia alimentar|bioma|flora|fauna|anatomia|fisiologia|sistema nervoso|digestorio|respiratorio|circulatorio|fotossintese|respiracao celular|bacteria|virus|fungo|protozoario|botanica|zoologia)\b/;

const RE_HISTORY =
  /\b(historia|historica|historico|napoleao|imperio|imperios|guerra|guerras|revolucao|revolucoes|idade media|feudalismo|renascimento|iluminismo|idade antiga|roma|grecia|egito|brasil colonia|brasil imperio|republica|ditadura|escravidao|abolicao|independencia|proclamacao|idade contemporanea|guerra fria|nazismo|fascismo)\b/;

const RE_GEOGRAPHY =
  /\b(geografia|geografico|relevo|planalto|planicie|depressao|clima|climatico|chuva|temperatura media|vegetacao|bioma|amazonia|cerrado|caatinga|pantanal|pampa|mata atlantica|cartografia|mapa|escala|latitude|longitude|coordenadas|populacao|demografia|urbanizacao|exodo rural|migracao|globalizacao|geopolitica|fronteira|bacia hidrografica|rio|solo|erosao)\b/;

const RE_PORTUGUESE =
  /\b(portugues|gramatica|crase|pontuacao|virgula|acentuacao|ortografia|sintaxe|sujeito|predicado|objeto direto|objeto indireto|verbo|conjugacao|substantivo|adjetivo|pronome|conjunção|conjuncao|preposicao|concordancia|regencia|redacao|dissertacao|argumentacao|literatura|romantismo|realismo|modernismo|barroco|arcadismo|parnasianismo|simbolismo|poema|poesia|conto|cronica|figura de linguagem|metafora|ironia|antitese|interpretacao de texto)\b/;

const RE_ENGLISH =
  /\b(ingles|english|grammar|verb to be|simple present|simple past|present continuous|future|vocabulary|vocabulario|traducao|translate|meaning of|what does .* mean|how do you say)\b/;

function inferMetaFromText(text) {
  const clean = String(text || '').trim();
  const lower = normalizeText(clean);

  if (!clean) {
    return { subject: 'Geral', topic: 'Sem conteúdo', difficulty: 'Básico' };
  }

  // 1. Programação e Tecnologia
  if (RE_PROGRAMMING.test(lower)) {
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

    const isAdvanced =
      /\b(recursao|arvore|grafo|concorrencia|thread|deadlock|jpa|hibernate|docker|complexidade|assintotica)\b/.test(
        lower
      );

    let difficulty;
    if (isAdvanced) difficulty = 'Avançado';
    else if (clean.length <= 24) difficulty = 'Básico';
    else difficulty = 'Intermediário';

    return { subject: 'Programação', topic, difficulty };
  }

  // 2. Matemática
  if (RE_MATH.test(lower) || /^\s*\d+\s*[\+\-\*\/]\s*\d+/.test(lower)) {
    let topic = 'Operações básicas';

    if (/[²³⁴⁵⁶⁷⁸⁹]|\^|\b(potencia|potenciacao|raiz)\b/.test(lower)) {
      topic = 'Potenciação e radiciação';
    } else if (/\b(equacao|equacoes|inequacao|x\s*=|2x|3x)\b/.test(lower)) {
      topic = 'Equações';
    } else if (/\b(funcao|funcoes|f\(x\)|grafico)\b/.test(lower)) {
      topic = 'Funções';
    } else if (/\b(porcentagem|porcento|fracao|fracoes|razao|proporcao|regra de tres)\b/.test(lower)) {
      topic = 'Frações, razão e porcentagem';
    } else if (/\b(geometria|triangulo|quadrado|retangulo|circulo|area|perimetro|volume|pitagoras)\b/.test(lower)) {
      topic = 'Geometria';
    } else if (/\b(probabilidade|estatistica|media|mediana|moda|combinatoria)\b/.test(lower)) {
      topic = 'Estatística e probabilidade';
    }

    const isAdvanced = /\b(integral|derivada|limite|logaritmo|matriz|combinatoria|trigonometria)\b/.test(lower);
    const isShortAndSimple = clean.length <= 25 && !/\b(equacao|equacoes|funcao|funcoes)\b/.test(lower);

    let difficulty;
    if (isAdvanced) difficulty = 'Avançado';
    else if (isShortAndSimple) difficulty = 'Básico';
    else difficulty = 'Intermediário';

    return { subject: 'Matemática', topic, difficulty };
  }

  // 3. Física
  if (RE_PHYSICS.test(lower)) {
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
  if (RE_CHEMISTRY.test(lower)) {
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
  if (RE_BIOLOGY.test(lower)) {
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
  if (RE_HISTORY.test(lower)) {
    let topic = 'História geral';

    if (
      /\b(brasil|colonia|imperio do brasil|republica velha|era vargas|ditadura militar|escravidao|quilombo)\b/.test(
        lower
      )
    ) {
      topic = 'História do Brasil';
    } else if (/\b(guerra|revolucao|feudalismo|renascimento|iluminismo|roma|grecia|napoleao)\b/.test(lower)) {
      topic = 'História mundial';
    }

    return { subject: 'História', topic, difficulty: 'Intermediário' };
  }

  // 7. Geografia
  if (RE_GEOGRAPHY.test(lower)) {
    let topic = 'Geografia física';

    if (/\b(populacao|demografia|urbanizacao|migracao|globalizacao|geopolitica|industria|comercio)\b/.test(lower)) {
      topic = 'Geografia humana e geopolítica';
    } else if (/\b(mapa|escala|latitude|longitude|coordenadas|projecao|cartografia)\b/.test(lower)) {
      topic = 'Cartografia';
    }

    return { subject: 'Geografia', topic, difficulty: 'Intermediário' };
  }

  // 8. Língua Portuguesa e Literatura
  if (RE_PORTUGUESE.test(lower)) {
    let topic = 'Gramática e sintaxe';

    if (/\b(redacao|dissertacao|argumentacao|coesao|coerencia|texto)\b/.test(lower)) {
      topic = 'Redação e produção textual';
    } else if (
      /\b(literatura|romantismo|realismo|modernismo|barroco|poema|figura de linguagem|metafora)\b/.test(lower)
    ) {
      topic = 'Literatura e figuras de linguagem';
    }

    return { subject: 'Português', topic, difficulty: 'Intermediário' };
  }

  // 9. Inglês
  if (RE_ENGLISH.test(lower)) {
    return { subject: 'Inglês', topic: 'Gramática e vocabulário', difficulty: 'Básico' };
  }

  return {
    subject: 'Geral',
    topic: 'Dúvida geral',
    difficulty: clean.length <= 20 ? 'Básico' : 'Intermediário'
  };
}

function getTriageData(payload) {
  const q = getQuestionData(payload);
  const rawTriage = payload?.triage || q?.triage || null;
  const questionText = q?.content ?? q?.questionText ?? '';
  const inferred = inferMetaFromText(questionText);

  const rawSubject = rawTriage?.subject ?? q?.subject;
  const rawTopic = rawTriage?.topic ?? q?.topic;
  const rawDifficulty = rawTriage?.difficulty ?? q?.difficulty;

  const hasExplicitSubject = rawSubject && String(rawSubject).trim() && normalizeText(rawSubject) !== 'geral';
  const hasExplicitTopic =
    rawTopic && String(rawTopic).trim() && !['duvida geral', 'geral'].includes(normalizeText(rawTopic));
  const hasExplicitDifficulty = rawDifficulty && String(rawDifficulty).trim();

  return {
    subject: hasExplicitSubject ? String(rawSubject).trim() : inferred.subject,
    topic: hasExplicitTopic ? String(rawTopic).trim() : inferred.topic,
    difficulty: hasExplicitDifficulty ? String(rawDifficulty).trim() : inferred.difficulty,
    isVague: Boolean(rawTriage?.isVague ?? rawTriage?.vague ?? q?.triageVague ?? false),
    rewrittenQuestion: rawTriage?.rewrittenQuestion ?? rawTriage?.rewritten ?? q?.rewrittenQuestion ?? null,
    duplicateQuestionId: rawTriage?.duplicateQuestionId ?? q?.duplicateQuestionId ?? null,
    suggestedExistingAnswer: rawTriage?.suggestedExistingAnswer ?? q?.suggestedExistingAnswer ?? null
  };
}

/* -------------------------------------------------------------------------- */
/*  Filtros                                                                   */
/* -------------------------------------------------------------------------- */

function populateSelectOptions(selectEl, placeholder, values, selectedValue) {
  selectEl.replaceChildren();

  const def = document.createElement('option');
  def.value = '';
  def.textContent = placeholder;
  selectEl.appendChild(def);

  values.forEach((val) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    if (val.toLowerCase() === String(selectedValue || '').toLowerCase()) {
      opt.selected = true;
    }
    selectEl.appendChild(opt);
  });
}

function updateFilterOptions(items) {
  const subjects = new Set();
  const topics = new Set();
  const difficulties = new Set();

  items.forEach((rawItem) => {
    const info = getTriageData(rawItem);
    if (info.subject) subjects.add(info.subject);
    if (info.topic) topics.add(info.topic);
    if (info.difficulty) difficulties.add(info.difficulty);
  });

  populateSelectOptions(subjectSelect, 'Matéria: Todas', [...subjects].sort(), activeFilters.subject);
  populateSelectOptions(topicSelect, 'Conteúdo: Todos', [...topics].sort(), activeFilters.topic);
  populateSelectOptions(difficultySelect, 'Dificuldade: Todas', [...difficulties].sort(), activeFilters.difficulty);
}

function matchesActiveFilters(rawItem) {
  const q = getQuestionData(rawItem);
  const info = getTriageData(rawItem);

  if (activeAiFilterIds && !activeAiFilterIds.has(Number(q?.id))) {
    return false;
  }

  if (activeFilters.subject && String(info.subject || '').toLowerCase() !== activeFilters.subject.toLowerCase()) {
    return false;
  }
  if (activeFilters.topic && String(info.topic || '').toLowerCase() !== activeFilters.topic.toLowerCase()) {
    return false;
  }
  if (
    activeFilters.difficulty &&
    String(info.difficulty || '').toLowerCase() !== activeFilters.difficulty.toLowerCase()
  ) {
    return false;
  }

  if (activeFilters.query) {
    const needle = normalizeText(activeFilters.query);
    const questionText = normalizeText(q?.content ?? q?.questionText ?? '');
    const answersText = Array.isArray(q?.answers)
      ? normalizeText(q.answers.map((a) => String(a?.content || '')).join(' '))
      : normalizeText(q?.answer || '');
    const metaText = normalizeText(`${info.subject || ''} ${info.topic || ''} ${info.difficulty || ''}`);

    if (!questionText.includes(needle) && !answersText.includes(needle) && !metaText.includes(needle)) {
      return false;
    }
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/*  Avaliação e ordenação de respostas                                        */
/* -------------------------------------------------------------------------- */

function getEffectiveRating(ans) {
  const backendRating = {
    ratingCount: ans?.ratingCount ?? 0,
    ratingSum: ans?.ratingSum ?? 0,
    helpfulCount: ans?.helpfulCount ?? 0
  };

  if (backendRating.ratingCount > 0 || backendRating.helpfulCount > 0) {
    return backendRating;
  }

  const key = getAnswerVoteKey(ans);
  if (key) {
    const shared = getSharedRating(key);
    if (shared && (shared.ratingCount > 0 || shared.helpfulCount > 0)) {
      return shared;
    }
  }

  if (ans?.legacySingleAnswer && ans?.questionId != null && legacyRatings.has(ans.questionId)) {
    return legacyRatings.get(ans.questionId);
  }

  return backendRating;
}

function hasAnyRating(ans) {
  const r = getEffectiveRating(ans);
  return r.ratingCount > 0 || r.helpfulCount > 0;
}

function getRatingScore(ans) {
  const r = getEffectiveRating(ans);
  const avg = r.ratingCount > 0 ? r.ratingSum / r.ratingCount : 0;
  return { avg, count: r.ratingCount, helpful: r.helpfulCount };
}

function compareAnswersByQuality(a, b) {
  const sa = getRatingScore(a);
  const sb = getRatingScore(b);

  if (sb.avg !== sa.avg) return sb.avg - sa.avg;
  if (sb.helpful !== sa.helpful) return sb.helpful - sa.helpful;
  if (sb.count !== sa.count) return sb.count - sa.count;
  return (a?.id ?? 0) - (b?.id ?? 0);
}

function getAnswersList(q) {
  if (Array.isArray(q?.answers) && q.answers.length > 0) {
    return q.answers.map((a) => ({ ...a, questionId: a.questionId ?? q?.id ?? null }));
  }

  if (q?.answer) {
    return [
      {
        id: null,
        questionId: q?.id ?? null,
        content: q.answer,
        author: { name: 'Professor/Monitor' },
        helpfulCount: 0,
        ratingSum: 0,
        ratingCount: 0,
        legacySingleAnswer: true
      }
    ];
  }

  return [];
}

function pickHighlightedAnswer(answers) {
  if (!Array.isArray(answers) || answers.length === 0) return null;

  const ratedAnswers = answers.filter(hasAnyRating);
  if (ratedAnswers.length > 0) {
    return [...ratedAnswers].sort(compareAnswersByQuality)[0];
  }

  return answers[0];
}

function formatRatingSummary(ans) {
  const { avg, count, helpful } = getRatingScore(ans);
  const avgText = count > 0 ? `★ ${avg.toFixed(1)} (${count} ${count === 1 ? 'nota' : 'notas'})` : 'Sem notas';
  const helpfulText = helpful > 0 ? ` • ${helpful} ${helpful === 1 ? 'útil' : 'úteis'}` : '';
  return `${avgText}${helpfulText}`;
}

function applyLocalLegacyRating(questionId, score) {
  if (questionId == null) return;

  const current = legacyRatings.get(questionId) || { ratingCount: 0, ratingSum: 0, helpfulCount: 0 };
  legacyRatings.set(questionId, {
    ratingCount: current.ratingCount + 1,
    ratingSum: current.ratingSum + Number(score),
    helpfulCount: current.helpfulCount
  });
}

async function handleRateAnswer(ans, score, containerEl) {
  loggedUser = resolveLoggedUser();

  if (!loggedUser?.id && !loggedUser?.email) {
    alert('Faça login na sua conta para avaliar uma resposta.');
    return;
  }

  if (hasAccountVoted(ans)) {
    alert('Sua conta já avaliou esta resposta.');
    return;
  }

  const numericScore = Number(score);
  const buttons = containerEl.querySelectorAll('button');
  buttons.forEach((btn) => {
    btn.disabled = true;
  });

  const ratingBody = JSON.stringify({
    score: numericScore,
    userId: loggedUser?.id ?? null,
    userEmail: loggedUser?.email ?? null
  });

  try {
    if (ans.id != null) {
      const res = await fetch(`${ANSWERS_API_URL}/${ans.id}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ratingBody
      });

      if (res.status === 409) {
        markAccountVoted(ans);
        alert('Sua conta já avaliou esta resposta.');
        await loadQuestions(activeFilters.query);
        return;
      }

      if (res.ok) {
        markAccountVoted(ans);
        saveSharedRating(`answer_${ans.id}`, numericScore);
        await loadQuestions(activeFilters.query);
      } else {
        alert('Não foi possível registrar a avaliação.');
      }
      return;
    }

    if (ans.questionId != null) {
      try {
        const res = await fetch(`${API_URL}/${ans.questionId}/rating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: ratingBody
        });

        if (res.status === 409) {
          markAccountVoted(ans);
          alert('Sua conta já avaliou esta resposta.');
          return;
        }

        if (res.ok) {
          markAccountVoted(ans);
          saveSharedRating(`question_${ans.questionId}`, numericScore);
          await loadQuestions(activeFilters.query);
          return;
        }
      } catch {
        // Fallback visual caso a rota da pergunta ainda não exista
      }

      markAccountVoted(ans);
      saveSharedRating(`question_${ans.questionId}`, numericScore);
      applyLocalLegacyRating(ans.questionId, numericScore);
      renderFilteredQuestions();
    }
  } catch {
    alert('Erro de conexão ao enviar avaliação.');
  } finally {
    const blocked = hasAccountVoted(ans);
    buttons.forEach((btn) => {
      btn.disabled = blocked;
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Renderização                                                              */
/* -------------------------------------------------------------------------- */

function renderTriageFeedback(payload) {
  const info = getTriageData(payload);
  const parts = [];

  if (info.subject) parts.push(`Matéria: ${info.subject}`);
  if (info.topic) parts.push(`Conteúdo: ${info.topic}`);
  if (info.difficulty) parts.push(`Dificuldade: ${info.difficulty}`);

  triageBox.replaceChildren();
  let hasContent = false;

  if (parts.length > 0) {
    const summary = document.createElement('p');
    summary.style.fontWeight = '700';
    summary.textContent = `Classificação: ${parts.join(' • ')}`;
    triageBox.appendChild(summary);
    hasContent = true;
  }

  if (info.isVague && info.rewrittenQuestion) {
    const vagueNote = document.createElement('p');
    vagueNote.textContent = 'Sua pergunta parece curta ou vaga. Sugestão mais clara:';

    const suggestion = document.createElement('p');
    suggestion.style.fontStyle = 'italic';
    suggestion.textContent = info.rewrittenQuestion;

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'triage-apply-btn';
    applyBtn.textContent = 'Usar sugestão no campo';
    applyBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const field = document.getElementById('question-text');
      field.value = info.rewrittenQuestion;
      field.focus();
    });

    triageBox.append(vagueNote, suggestion, applyBtn);
    hasContent = true;
  }

  if (info.duplicateQuestionId) {
    const dup = document.createElement('p');
    dup.textContent =
      `Possível pergunta parecida (#${info.duplicateQuestionId}).` +
      (info.suggestedExistingAnswer ? ` Resposta já registrada: ${info.suggestedExistingAnswer}` : '');
    triageBox.appendChild(dup);
    hasContent = true;
  }

  triageBox.hidden = !hasContent;
}

function createMetaPill(labelText, bgColor, textColor) {
  const pill = document.createElement('span');
  pill.textContent = labelText;
  Object.assign(pill.style, {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 9px',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: '600',
    background: bgColor,
    color: textColor,
    whiteSpace: 'nowrap'
  });
  return pill;
}

function createAnswerElement(ans, isFeatured) {
  const item = document.createElement('div');
  item.className = isFeatured ? 'answer-item is-featured' : 'answer-item';

  const main = document.createElement('div');
  main.className = 'answer-main';

  const authorLine = document.createElement('div');
  authorLine.className = 'answer-author-line';

  const authorName = document.createElement('span');
  authorName.textContent = ans.author?.name || 'Monitor/Professor';
  authorLine.appendChild(authorName);

  if (isFeatured && hasAnyRating(ans)) {
    const badge = document.createElement('span');
    badge.className = 'featured-tag';
    badge.textContent = 'Mais bem avaliada';
    authorLine.appendChild(badge);
  }

  const text = document.createElement('p');
  text.className = 'answer-text';
  text.textContent = ans.content;

  main.append(authorLine, text);
  item.appendChild(main);

  if (ans.id != null || ans.legacySingleAnswer) {
    const helpfulBox = document.createElement('aside');
    helpfulBox.className = 'answer-helpful-box';
    helpfulBox.addEventListener('click', (event) => event.stopPropagation());

    const prompt = document.createElement('span');
    prompt.className = 'answer-helpful-prompt';
    prompt.textContent = 'Essa resposta foi útil?';

    const starsRow = document.createElement('div');
    starsRow.className = 'star-rating-row';
    starsRow.setAttribute('role', 'group');
    starsRow.setAttribute('aria-label', 'Avaliar resposta de 1 a 5 estrelas');

    const alreadyVoted = hasAccountVoted(ans);

    for (let score = 1; score <= 5; score++) {
      const label = `Avaliar com ${score} ${score === 1 ? 'estrela' : 'estrelas'}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'star-score-btn';
      btn.textContent = '★'.repeat(score);
      btn.disabled = alreadyVoted;
      btn.setAttribute('aria-label', label);
      btn.title = alreadyVoted ? 'Sua conta já avaliou esta resposta' : label;
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        handleRateAnswer(ans, score, starsRow);
      });
      starsRow.appendChild(btn);
    }

    const summary = document.createElement('span');
    summary.className = 'answer-score-summary';
    summary.textContent = alreadyVoted ? `${formatRatingSummary(ans)} • Você já votou` : formatRatingSummary(ans);

    helpfulBox.append(prompt, starsRow, summary);
    item.appendChild(helpfulBox);
  }

  return item;
}

function renderAnswersSection(q, isExpanded) {
  const allAnswers = getAnswersList(q);
  if (allAnswers.length === 0) return null;

  const wrapper = document.createElement('div');
  wrapper.className = 'card-answers';

  const header = document.createElement('div');
  header.className = 'card-answers-header';

  const highlighted = pickHighlightedAnswer(allAnswers);

  const title = document.createElement('strong');
  title.style.color = 'var(--text-main)';

  if (isExpanded) {
    title.textContent = `Discussão • ${allAnswers.length} ${allAnswers.length === 1 ? 'resposta' : 'respostas'}`;
  } else if (hasAnyRating(highlighted)) {
    title.textContent = 'Resposta destaque (mais bem avaliada)';
  } else {
    title.textContent = 'Primeira resposta';
  }

  const hint = document.createElement('span');
  if (allAnswers.length > 1) {
    hint.textContent = isExpanded
      ? 'Clique na pergunta para recolher'
      : `Clique na pergunta para ver todas (${allAnswers.length})`;
  } else {
    hint.textContent = isExpanded ? 'Clique na pergunta para recolher' : 'Clique na pergunta para abrir o tópico';
  }

  header.append(title, hint);
  wrapper.appendChild(header);

  const answersToShow = isExpanded ? [...allAnswers].sort(compareAnswersByQuality) : [highlighted];

  answersToShow.forEach((ans) => {
    const isFeatured = highlighted != null && ans === highlighted;
    wrapper.appendChild(createAnswerElement(ans, isFeatured));
  });

  return wrapper;
}

function toggleQuestionThread(questionId) {
  if (questionId == null) return;

  if (expandedQuestionIds.has(questionId)) {
    expandedQuestionIds.delete(questionId);
  } else {
    expandedQuestionIds.add(questionId);
  }

  renderFilteredQuestions();
}

function renderFilteredQuestions() {
  const filtered = latestItems.filter(matchesActiveFilters);
  filterCounter.textContent = `${filtered.length} de ${latestItems.length} ${
    latestItems.length === 1 ? 'pergunta' : 'perguntas'
  }`;

  if (filtered.length === 0) {
    feed.replaceChildren();

    const emptyCard = document.createElement('div');
    emptyCard.className = 'card';
    emptyCard.textContent = 'Nenhuma pergunta encontrada com os filtros selecionados.';
    feed.appendChild(emptyCard);
    return;
  }

  renderQuestions(filtered);
}

function renderQuestions(items) {
  const list = Array.isArray(items) ? items : [];

  if (list.length === 0) {
    feed.innerHTML = '';
    return;
  }

  feed.replaceChildren();

  list.forEach((rawItem) => {
    const q = getQuestionData(rawItem);
    const info = getTriageData(rawItem);
    const isExpanded = q.id != null && expandedQuestionIds.has(q.id);

    const card = document.createElement('article');
    card.className = isExpanded ? 'card is-expanded' : 'card';
    card.setAttribute('aria-expanded', String(isExpanded));
    card.addEventListener('click', () => {
      toggleQuestionThread(q.id);
    });

    const headerRow = document.createElement('div');
    headerRow.className = 'card-header-row';
    Object.assign(headerRow.style, {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px'
    });

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.textContent = `#${q.id ?? '-'} • ${q.status ?? 'Pendente'} • ${q.author?.name || 'Anônimo'}`;

    const rightControls = document.createElement('div');
    Object.assign(rightControls.style, {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '6px'
    });

    if (info.subject) {
      rightControls.appendChild(createMetaPill(`Matéria: ${info.subject}`, 'rgba(59, 130, 246, 0.14)', '#1d4ed8'));
    }
    if (info.topic) {
      rightControls.appendChild(createMetaPill(`Conteúdo: ${info.topic}`, 'rgba(16, 185, 129, 0.14)', '#047857'));
    }
    if (info.difficulty) {
      rightControls.appendChild(
        createMetaPill(`Dificuldade: ${info.difficulty}`, 'rgba(245, 158, 11, 0.16)', '#b45309')
      );
    }

    const togglePill = document.createElement('span');
    togglePill.className = 'thread-toggle-pill';
    togglePill.textContent = isExpanded ? 'Fechar tópico ▲' : 'Abrir tópico ▼';
    rightControls.appendChild(togglePill);

    headerRow.append(meta, rightControls);
    card.appendChild(headerRow);

    const content = document.createElement('div');
    content.className = 'card-question-text';
    content.textContent = q.content ?? q.questionText ?? '';
    card.appendChild(content);

    const answersSection = renderAnswersSection(q, isExpanded);
    if (answersSection) {
      card.appendChild(answersSection);
    }

    feed.appendChild(card);
  });
}

/* -------------------------------------------------------------------------- */
/*  Carregamento de dados                                                     */
/* -------------------------------------------------------------------------- */

async function loadQuestions(query = '') {
  activeFilters.query = query || '';

  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      latestItems = await res.json();
      updateFilterOptions(latestItems);
      renderFilteredQuestions();
    }
  } catch {
    renderFilteredQuestions();
  }
}

/* -------------------------------------------------------------------------- */
/*  Eventos                                                                   */
/* -------------------------------------------------------------------------- */

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
  resetAiFilterSelection();
  activeFilters.query = '';
  activeFilters.subject = '';
  activeFilters.topic = '';
  activeFilters.difficulty = '';

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  updateFilterOptions(latestItems);
  renderFilteredQuestions();
});

const searchInputEl = document.getElementById('search-input');
if (searchInputEl) {
  searchInputEl.addEventListener('input', () => {
    activeFilters.query = searchInputEl.value.trim();
    renderFilteredQuestions();
  });
}

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('search-input')?.value.trim() || '';
  activeFilters.query = query;
  renderFilteredQuestions();
});

questionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loggedUser = resolveLoggedUser();

  const textarea = document.getElementById('question-text');
  const content = textarea.value.trim();
  if (!content) return;

  const payload = {
    content,
    authorId: loggedUser?.id ?? null,
    authorEmail: loggedUser?.email ?? null
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));

      if (res.status === 503 && error.questionId != null) {
        textarea.value = '';
        triageBox.replaceChildren();

        const notice = document.createElement('p');
        notice.textContent = error.message || 'Pergunta salva, mas a triagem está indisponível.';
        triageBox.appendChild(notice);
        triageBox.hidden = false;

        await loadQuestions(activeFilters.query);
        return;
      }

      alert(error.message || 'Erro ao enviar pergunta.');
      return;
    }

    const createdData = await res.json();
    renderTriageFeedback(createdData);
    textarea.value = '';
    await loadQuestions(activeFilters.query);
  } catch {
    alert('Back-end indisponível no momento. Pergunta não salva no banco.');
  }
});

// --- INICIALIZAÇÃO ---
// 1) Mostra na hora os chips da última visita (cache); 2) busca perguntas e filtros em paralelo.
renderAiChips(readAiFiltersCache());
loadQuestions();
loadAiSmartFilters();
