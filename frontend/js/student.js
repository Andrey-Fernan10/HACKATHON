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

const sharedRatingsKey = 'sm_shared_ratings_v1';

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

const triageBox = document.createElement('div');
triageBox.id = 'triage-feedback';
triageBox.className = 'triage-feedback-box';
triageBox.hidden = true;
questionForm.appendChild(triageBox);

// Barra de filtros acima do feed
const filterBar = document.createElement('div');
filterBar.id = 'ai-filter-bar';
filterBar.className = 'ai-filter-bar';
filterBar.style.display = 'flex';
filterBar.style.flexWrap = 'wrap';
filterBar.style.gap = '8px';
filterBar.style.alignItems = 'center';
filterBar.style.marginBottom = '14px';

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
filterCounter.style.fontSize = '0.85rem';
filterCounter.style.opacity = '0.8';
filterCounter.style.marginLeft = 'auto';

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

[subjectSelect, topicSelect, difficultySelect].forEach(sel => {
  sel.style.padding = '6px 12px';
  sel.style.borderRadius = '999px';
  sel.style.border = '1px solid rgba(128,128,128,0.35)';
  sel.style.background = 'var(--surface, #fff)';
  sel.style.color = 'var(--text-main, #111)';
  sel.style.fontSize = '0.88rem';
  sel.style.cursor = 'pointer';
});

filterBar.append(subjectSelect, topicSelect, difficultySelect, clearFiltersBtn, filterCounter);
if (feed && feed.parentElement) {
  feed.parentElement.insertBefore(filterBar, feed);
}

function getQuestionData(item) {
  return item?.question && typeof item.question === 'object' ? item.question : item;
}

function inferMetaFromText(text) {
  const clean = String(text || '').trim();
  const lower = clean.toLowerCase();

  if (/[²³⁴⁵⁶⁷⁸⁹]|\^|\b(soma|subtracao|subtração|multiplicacao|multiplicação|divisao|divisão|potencia|potência|raiz|equacao|equação|funcao|função|porcentagem|fracao|fração|matematica|matemática)\b/.test(lower) || /^\s*\d+\s*[\+\-\*\/]\s*\d+/.test(lower)) {
    let topic = 'Operações básicas';
    if (/[²³⁴⁵⁶⁷⁸⁹]|\^|\b(potencia|potência)\b/.test(lower)) topic = 'Potenciação';
    else if (/\b(equacao|equação)\b/.test(lower)) topic = 'Equações';
    else if (/\b(funcao|função)\b/.test(lower)) topic = 'Funções';
    else if (/\b(porcentagem|fracao|fração)\b/.test(lower)) topic = 'Frações e porcentagem';

    const difficulty = clean.length <= 25 && !/\b(equacao|equação|funcao|função|integral|derivada|logaritmo)\b/.test(lower)
      ? 'Básico'
      : 'Intermediário';

    return { subject: 'Matemática', topic, difficulty };
  }

  if (/\b(java|spring|jpa|sql|banco|html|css|js|javascript|python|codigo|código|array|lista|loop|funcao|função|api|endpoint|erro)\b/.test(lower)) {
    let topic = 'Lógica e código';
    if (/\b(sql|banco|tabela|select|join|postgres|mysql|sqlite)\b/.test(lower)) topic = 'Banco de dados';
    else if (/\b(java|spring|jpa|objeto|classe)\b/.test(lower)) topic = 'Java e backend';
    else if (/\b(html|css|js|javascript|dom|frontend)\b/.test(lower)) topic = 'Web frontend';

    return { subject: 'Programação', topic, difficulty: 'Intermediário' };
  }

  if (/\b(velocidade|forca|força|energia|aceleracao|aceleração|magnetismo|circuito|fisica|física|quimica|química|reacao|reação|atomo|átomo|biologia|celula|célula)\b/.test(lower)) {
    return { subject: 'Ciências da Natureza', topic: 'Conceitos fundamentais', difficulty: 'Intermediário' };
  }

  return {
    subject: 'Geral',
    topic: clean.length > 0 ? 'Dúvida geral' : 'Sem conteúdo',
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

  return {
    subject: rawSubject && String(rawSubject).trim() ? String(rawSubject).trim() : inferred.subject,
    topic: rawTopic && String(rawTopic).trim() ? String(rawTopic).trim() : inferred.topic,
    difficulty: rawDifficulty && String(rawDifficulty).trim() ? String(rawDifficulty).trim() : inferred.difficulty,
    isVague: Boolean(rawTriage?.isVague ?? rawTriage?.vague ?? false),
    rewrittenQuestion: rawTriage?.rewrittenQuestion ?? rawTriage?.rewritten ?? null,
    duplicateQuestionId: rawTriage?.duplicateQuestionId ?? null,
    suggestedExistingAnswer: rawTriage?.suggestedExistingAnswer ?? null
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

function updateFilterOptions(items) {
  const subjects = new Set();
  const topics = new Set();
  const difficulties = new Set();

  items.forEach(rawItem => {
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

  if (activeFilters.subject && String(info.subject || '').toLowerCase() !== activeFilters.subject.toLowerCase()) {
    return false;
  }
  if (activeFilters.topic && String(info.topic || '').toLowerCase() !== activeFilters.topic.toLowerCase()) {
    return false;
  }
  if (activeFilters.difficulty && String(info.difficulty || '').toLowerCase() !== activeFilters.difficulty.toLowerCase()) {
    return false;
  }

  if (activeFilters.query) {
    const needle = activeFilters.query.toLowerCase();
    const questionText = String(q?.content ?? q?.questionText ?? '').toLowerCase();
    const answersText = Array.isArray(q?.answers)
      ? q.answers.map(a => String(a?.content || '')).join(' ').toLowerCase()
      : String(q?.answer || '').toLowerCase();
    const metaText = `${info.subject || ''} ${info.topic || ''} ${info.difficulty || ''}`.toLowerCase();

    if (!questionText.includes(needle) && !answersText.includes(needle) && !metaText.includes(needle)) {
      return false;
    }
  }

  return true;
}

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
    return q.answers.map(a => ({ ...a, questionId: a.questionId ?? q?.id ?? null }));
  }
  if (q?.answer) {
    return [{
      id: null,
      questionId: q?.id ?? null,
      content: q.answer,
      author: { name: 'Professor/Monitor' },
      helpfulCount: 0,
      ratingSum: 0,
      ratingCount: 0,
      legacySingleAnswer: true
    }];
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
  buttons.forEach(btn => {
    btn.disabled = true;
  });

  try {
    if (ans.id != null) {
      const res = await fetch(`${ANSWERS_API_URL}/${ans.id}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: numericScore,
          userId: loggedUser?.id ?? null,
          userEmail: loggedUser?.email ?? null
        })
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
          body: JSON.stringify({
            score: numericScore,
            userId: loggedUser?.id ?? null,
            userEmail: loggedUser?.email ?? null
          })
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
    buttons.forEach(btn => {
      btn.disabled = blocked;
    });
  }
}

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
      document.getElementById('question-text').value = info.rewrittenQuestion;
      document.getElementById('question-text').focus();
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
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'star-score-btn';
      btn.textContent = '★'.repeat(score);
      btn.disabled = alreadyVoted;
      btn.setAttribute('aria-label', `Avaliar com ${score} ${score === 1 ? 'estrela' : 'estrelas'}`);
      btn.title = alreadyVoted
        ? 'Sua conta já avaliou esta resposta'
        : `Avaliar com ${score} ${score === 1 ? 'estrela' : 'estrelas'}`;
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        handleRateAnswer(ans, score, starsRow);
      });
      starsRow.appendChild(btn);
    }

    const summary = document.createElement('span');
    summary.className = 'answer-score-summary';
    summary.textContent = alreadyVoted
      ? `${formatRatingSummary(ans)} • Você já votou`
      : formatRatingSummary(ans);

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
  hint.textContent = allAnswers.length > 1
    ? (isExpanded ? 'Clique na pergunta para recolher' : `Clique na pergunta para ver todas (${allAnswers.length})`)
    : (isExpanded ? 'Clique na pergunta para recolher' : 'Clique na pergunta para abrir o tópico');

  header.append(title, hint);
  wrapper.appendChild(header);

  const answersToShow = isExpanded
    ? [...allAnswers].sort(compareAnswersByQuality)
    : [highlighted];

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
  filterCounter.textContent = `${filtered.length} de ${latestItems.length} ${latestItems.length === 1 ? 'pergunta' : 'perguntas'}`;

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

    // Linha superior visual: #id • status • autor à esquerda, e pills de matéria/conteúdo/dificuldade + botão de tópico à direita
    const headerRow = document.createElement('div');
    headerRow.className = 'card-header-row';
    headerRow.style.display = 'flex';
    headerRow.style.flexWrap = 'wrap';
    headerRow.style.alignItems = 'center';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.gap = '8px';

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.textContent = `#${q.id ?? '-'} • ${q.status ?? 'Pendente'} • ${q.author?.name || 'Anônimo'}`;

    const rightControls = document.createElement('div');
    rightControls.style.display = 'flex';
    rightControls.style.flexWrap = 'wrap';
    rightControls.style.alignItems = 'center';
    rightControls.style.gap = '6px';

    if (info.subject) {
      rightControls.appendChild(
        createMetaPill(`Matéria: ${info.subject}`, 'rgba(59, 130, 246, 0.14)', '#1d4ed8')
      );
    }
    if (info.topic) {
      rightControls.appendChild(
        createMetaPill(`Conteúdo: ${info.topic}`, 'rgba(16, 185, 129, 0.14)', '#047857')
      );
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

loadQuestions();