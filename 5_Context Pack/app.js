'use strict';

/* ===== State ===== */
const state = {
  currentQuery: '',
  currentPage: 1,
  currentLimit: 10,
  totalResults: 0,
  isLoading: false,
};

/* ===== DOM References ===== */
const form        = document.getElementById('search-form');
const input       = document.getElementById('search-input');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');
const pageInfo    = document.getElementById('page-info');
const pagination  = document.getElementById('pagination');

/* ===== UI State Helpers ===== */
function showState(name) {
  ['idle', 'loading', 'results', 'error', 'empty'].forEach(id => {
    const el = document.getElementById('state-' + id);
    if (el) el.hidden = id !== name;
  });
}

/* ===== Format Helpers ===== */
function formatVotes(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

function formatRuntime(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return m + 'min';
  if (m === 0) return h + 'h';
  return h + 'h ' + m + 'min';
}

/* ===== Render Movie Card ===== */
function renderMovieCard(movie) {
  const template = document.getElementById('movie-card-template');
  const card = template.content.cloneNode(true).querySelector('.movie-card');

  card.querySelector('.movie-title').textContent = movie.primaryTitle;

  const yearEl    = card.querySelector('.movie-year');
  const runtimeEl = card.querySelector('.movie-runtime');
  yearEl.textContent = movie.startYear || '—';
  const rt = formatRuntime(movie.runtimeMinutes);
  if (rt) {
    runtimeEl.textContent = rt;
  } else {
    runtimeEl.remove();
  }

  const genresEl = card.querySelector('.movie-genres');
  (movie.genres || []).forEach(genre => {
    const tag = document.createElement('span');
    tag.className = 'genre-tag';
    tag.textContent = genre;
    genresEl.appendChild(tag);
  });

  card.querySelector('.rating-value').textContent = movie.averageRating.toFixed(1);
  card.querySelector('.rating-votes').textContent = '(' + formatVotes(movie.numVotes) + ')';

  const score = Math.max(0, Math.min(1, movie.relevanceScore));
  card.querySelector('.relevance-fill').style.width = Math.round(score * 100) + '%';

  return card;
}

/* ===== Render Results ===== */
function renderResults(data) {
  const { query, total, page, limit, has_next_page, confidence, results } = data;

  state.totalResults = total;

  document.getElementById('results-count').textContent =
    total.toLocaleString('pt-BR') + ' ' + (total === 1 ? 'filme' : 'filmes');
  document.getElementById('results-query').textContent = ' para "' + query + '"';

  const badge = document.getElementById('confidence-badge');
  const confText = document.getElementById('confidence-text');
  const lowWarn = document.getElementById('low-confidence-warning');

  badge.hidden = false;
  const pct = Math.round(confidence * 100);
  confText.textContent = 'Confiança: ' + pct + '%';

  lowWarn.hidden = confidence >= 0.3;

  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';
  results.forEach(movie => grid.appendChild(renderMovieCard(movie)));

  // Pagination
  const totalPages = Math.ceil(total / limit);
  if (totalPages > 1) {
    pagination.hidden = false;
    pageInfo.textContent = 'Página ' + page + ' de ' + totalPages;
    btnPrev.disabled = page <= 1;
    btnNext.disabled = !has_next_page;
  } else {
    pagination.hidden = true;
  }

  showState('results');
}

/* ===== API Call ===== */
async function fetchMovies(query, page) {
  const params = new URLSearchParams({ q: query, page: String(page), limit: '10' });
  const response = await fetch('api/search?' + params.toString());

  if (response.status === 400) {
    const body = await response.json();
    throw new Error(body.message || 'Query inválida.');
  }
  if (!response.ok) {
    throw new Error('Erro no servidor. Tente novamente.');
  }
  return response.json();
}

/* ===== Search ===== */
async function doSearch(query, page) {
  if (state.isLoading) return;
  state.isLoading = true;
  state.currentPage = page;

  const submitBtn = form.querySelector('.search-btn');
  submitBtn.disabled = true;
  showState('loading');

  try {
    const data = await fetchMovies(query, page);
    if (data.results.length === 0) {
      showState('empty');
    } else {
      renderResults(data);
    }
  } catch (err) {
    document.getElementById('error-message').textContent =
      err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.';
    showState('error');
  } finally {
    state.isLoading = false;
    submitBtn.disabled = false;
  }
}

/* ===== Event Listeners ===== */
form.addEventListener('submit', e => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  state.currentQuery = q;
  doSearch(q, 1);
});

document.querySelectorAll('.example-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const q = chip.dataset.q;
    input.value = q;
    state.currentQuery = q;
    doSearch(q, 1);
  });
});

btnPrev.addEventListener('click', () => {
  if (state.currentPage > 1) doSearch(state.currentQuery, state.currentPage - 1);
});

btnNext.addEventListener('click', () => {
  doSearch(state.currentQuery, state.currentPage + 1);
});
