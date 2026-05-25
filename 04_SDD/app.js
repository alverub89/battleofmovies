'use strict';

const API_URL = '/4_SDD/search';

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
  query: '',
  page:  1,
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const els = {
  form:           document.getElementById('searchForm'),
  input:          document.getElementById('searchInput'),
  loading:        document.getElementById('loading'),
  errorBox:       document.getElementById('errorBox'),
  resultsSection: document.getElementById('resultsSection'),
  resultsHeader:  document.getElementById('resultsHeader'),
  confAlert:      document.getElementById('confidenceAlert'),
  confMsg:        document.getElementById('confidenceMsg'),
  resultsList:    document.getElementById('resultsList'),
  pagination:     document.getElementById('pagination'),
  btnPrev:        document.getElementById('btnPrev'),
  btnNext:        document.getElementById('btnNext'),
  pageInfo:       document.getElementById('pageInfo'),
  emptyState:     document.getElementById('emptyState'),
};

// ─── Event Listeners ──────────────────────────────────────────────────────────
els.form.addEventListener('submit', e => {
  e.preventDefault();
  const q = els.input.value.trim();
  if (q) {
    state.query = q;
    state.page  = 1;
    doSearch();
  }
});

document.getElementById('suggestions').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const q = chip.dataset.q;
  els.input.value = q;
  state.query     = q;
  state.page      = 1;
  doSearch();
});

els.btnPrev.addEventListener('click', () => {
  if (state.page > 1) {
    state.page--;
    doSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

els.btnNext.addEventListener('click', () => {
  state.page++;
  doSearch();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── Search ───────────────────────────────────────────────────────────────────
async function doSearch() {
  showLoading(true);
  showError(null);
  showResults(false);

  const url = `${API_URL}?q=${encodeURIComponent(state.query)}&page=${state.page}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      showLoading(false);
      showError(data.message || data.error || 'Ocorreu um erro. Tente novamente.');
      return;
    }

    renderResults(data);
  } catch (_) {
    showError('Erro de conexão. Verifique sua internet e tente novamente.');
  } finally {
    showLoading(false);
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function renderResults(data) {
  const { results, total, page, limit, has_next_page, confidence } = data;
  const totalPages = Math.ceil(total / limit) || 1;

  // Cabeçalho de resultados
  if (total === 0) {
    els.resultsHeader.textContent = 'Nenhum resultado encontrado.';
  } else {
    const from = (page - 1) * limit + 1;
    const to   = Math.min(page * limit, total);
    els.resultsHeader.textContent =
      `${total.toLocaleString('pt-BR')} resultado${total !== 1 ? 's' : ''} ` +
      `para "${esc(state.query)}" — exibindo ${from}–${to}`;
  }

  // Alerta de confiança baixa (US-03: confidence < 0.3)
  if (confidence < 0.3) {
    els.confMsg.textContent =
      'Sua busca foi muito vaga. Exibindo os filmes mais bem avaliados da base.';
    els.confAlert.classList.remove('hidden');
  } else {
    els.confAlert.classList.add('hidden');
  }

  // Lista de resultados
  if (results.length === 0) {
    els.resultsList.innerHTML =
      `<li class="no-results"><strong>🎞️</strong>Nenhum resultado encontrado para sua busca.</li>`;
  } else {
    els.resultsList.innerHTML = results.map(movieCard).join('');
  }

  // Paginação
  if (totalPages > 1) {
    els.btnPrev.disabled = page <= 1;
    els.btnNext.disabled = !has_next_page;
    els.pageInfo.textContent = `Página ${page} de ${totalPages}`;
    els.pagination.classList.remove('hidden');
  } else {
    els.pagination.classList.add('hidden');
  }

  showResults(true);
}

function movieCard(m) {
  const {
    primaryTitle, startYear, genres, runtimeMinutes,
    averageRating, numVotes, relevanceScore,
  } = m;

  const genreList  = (genres || []).slice(0, 3);
  const votesLabel = formatVotes(numVotes);
  const stars      = buildStars(averageRating);
  const relPct     = Math.round((relevanceScore || 0) * 100);
  const relWidth   = Math.max(4, relPct);

  const yearBadge    = startYear ? `<span class="badge badge-year">${startYear}</span>` : '';
  const genreBadges  = genreList.map(g => `<span class="badge badge-genre">${esc(g)}</span>`).join('');
  const runtimeBadge = runtimeMinutes ? `<span class="badge badge-runtime">${runtimeMinutes} min</span>` : '';

  return `
    <li class="movie-card">
      <div class="movie-main">
        <h3 class="movie-title" title="${esc(primaryTitle)}">${esc(primaryTitle)}</h3>
        <div class="movie-badges">
          ${yearBadge}${genreBadges}${runtimeBadge}
        </div>
      </div>
      <div class="movie-scores">
        <div class="rating">
          <span class="rating-stars" aria-hidden="true">${stars}</span>
          <span class="rating-num">${averageRating.toFixed(1)}</span>
          <span class="rating-votes">${votesLabel}</span>
        </div>
        <div class="relevance-wrap" title="Relevância: ${relPct}%">
          <span class="relevance-label">${relPct}%</span>
          <div class="relevance-bar" role="progressbar" aria-valuenow="${relPct}" aria-valuemin="0" aria-valuemax="100">
            <div class="relevance-fill" style="width:${relWidth}%"></div>
          </div>
        </div>
      </div>
    </li>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildStars(rating) {
  const full  = Math.round(rating / 2);
  const empty = 5 - full;
  return '★'.repeat(full) + '☆'.repeat(empty);
}

function formatVotes(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function showLoading(visible) {
  els.loading.classList.toggle('hidden', !visible);
}

function showResults(visible) {
  els.resultsSection.classList.toggle('hidden', !visible);
  els.emptyState.classList.toggle('hidden', visible);
}

function showError(msg) {
  if (msg) {
    els.errorBox.textContent = msg;
    els.errorBox.classList.remove('hidden');
  } else {
    els.errorBox.classList.add('hidden');
  }
}
