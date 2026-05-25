/* app.js — 02-prd */
(function () {
  "use strict";

  const API_BASE = "/2_PRD/api/search";

  // ─── Estado de paginação ─────────────────────────────────────────────────────
  let currentQuery = "";
  let currentPage = 1;
  let hasNextPage = false;

  // ─── Elementos do DOM ────────────────────────────────────────────────────────
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  const resultsGrid = document.getElementById("resultsGrid");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");
  const errorMsg = document.getElementById("errorMsg");
  const parsedInfo = document.getElementById("parsedInfo");
  const resultsHeader = document.getElementById("resultsHeader");
  const totalCount = document.getElementById("totalCount");
  const confidenceFill = document.getElementById("confidenceFill");
  const confidenceValue = document.getElementById("confidenceValue");
  const confidenceBar = document.getElementById("confidenceBar");
  const pagination = document.getElementById("pagination");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const pageInfo = document.getElementById("pageInfo");
  const chips = document.querySelectorAll(".chip");

  // ─── Chips de sugestão ──────────────────────────────────────────────────────
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.q;
      startSearch(chip.dataset.q);
    });
  });

  // ─── Submit ─────────────────────────────────────────────────────────────────
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) startSearch(q);
  });

  // ─── Paginação ───────────────────────────────────────────────────────────────
  btnPrev.addEventListener("click", () => {
    if (currentPage > 1) doSearch(currentQuery, currentPage - 1);
  });

  btnNext.addEventListener("click", () => {
    if (hasNextPage) doSearch(currentQuery, currentPage + 1);
  });

  // ─── Iniciar nova busca (reseta para página 1) ───────────────────────────────
  function startSearch(q) {
    currentQuery = q;
    doSearch(q, 1);
  }

  // ─── Busca principal ─────────────────────────────────────────────────────────
  async function doSearch(q, page) {
    setLoading(true);

    try {
      const url = `${API_BASE}?q=${encodeURIComponent(q)}&page=${page}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Erro ${res.status}`);
      }

      setLoading(false);

      if (!data.results || data.results.length === 0) {
        showEmpty();
        hideParsed();
        hideResultsHeader();
        hidePagination();
        return;
      }

      currentPage = data.page;
      hasNextPage = data.has_next_page;

      renderParsed(data.parsed);
      renderResultsHeader(data.total, data.confidence, data.page, data.limit);
      renderResults(data.results);
      renderPagination(data.page, data.has_next_page, data.total, data.limit);
    } catch (err) {
      setLoading(false);
      showError(err.message || "Não foi possível conectar ao servidor.");
      hidePagination();
      hideResultsHeader();
    }
  }

  // ─── Estados ────────────────────────────────────────────────────────────────
  function setLoading(isLoading) {
    loadingState.hidden = !isLoading;
    emptyState.hidden = true;
    errorState.hidden = true;
    if (isLoading) {
      resultsGrid.innerHTML = "";
      parsedInfo.hidden = true;
      resultsHeader.hidden = true;
      pagination.hidden = true;
    }
  }

  function showEmpty() {
    emptyState.hidden = false;
    resultsGrid.innerHTML = "";
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorState.hidden = false;
    resultsGrid.innerHTML = "";
    parsedInfo.hidden = true;
    resultsHeader.hidden = true;
  }

  function hideParsed() {
    parsedInfo.hidden = true;
  }

  function hideResultsHeader() {
    resultsHeader.hidden = true;
  }

  function hidePagination() {
    pagination.hidden = true;
  }

  // ─── Parsed info ────────────────────────────────────────────────────────────
  function renderParsed({ genres, yearRange, keyword }) {
    const parts = [];

    if (genres && genres.length > 0) {
      parts.push(
        `<strong>Gêneros:</strong> ` +
          genres.map((g) => `<span class="parsed-tag">${escapeHtml(g)}</span>`).join(" ")
      );
    }

    if (yearRange) {
      parts.push(
        `<strong>Época:</strong> <span class="parsed-tag">${yearRange.from}–${yearRange.to}</span>`
      );
    }

    if (keyword) {
      parts.push(
        `<strong>Palavras-chave:</strong> <span class="parsed-tag">${escapeHtml(keyword)}</span>`
      );
    }

    if (parts.length === 0) {
      parsedInfo.hidden = true;
      return;
    }

    parsedInfo.innerHTML = `<span>🔍 Entendi:</span> ${parts.join(" &nbsp;·&nbsp; ")}`;
    parsedInfo.hidden = false;
  }

  // ─── Results header (total + confidence) ─────────────────────────────────────
  function renderResultsHeader(total, confidence, page, limit) {
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    totalCount.textContent = `${total.toLocaleString("pt-BR")} ${total === 1 ? "filme" : "filmes"} encontrados`;

    if (total > limit) {
      totalCount.textContent += ` · mostrando ${start}–${end}`;
    }

    const pct = Math.round(confidence * 100);
    confidenceFill.style.width = `${pct}%`;
    confidenceValue.textContent = `${pct}%`;
    confidenceBar.setAttribute("aria-valuenow", pct);

    resultsHeader.hidden = false;
  }

  // ─── Renderizar resultados ──────────────────────────────────────────────────
  function renderResults(movies) {
    resultsGrid.innerHTML = "";
    movies.forEach((movie, idx) => {
      const card = buildCard(movie, (currentPage - 1) * 10 + idx + 1);
      resultsGrid.appendChild(card);
    });
  }

  function buildCard(movie, rank) {
    const card = document.createElement("a");
    card.className = "movie-card";
    card.href = `https://www.imdb.com/title/${movie.tconst}/`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("role", "listitem");

    const ptTitle = getPtTitle(movie);
    const showPt = ptTitle && ptTitle.toLowerCase() !== movie.primary_title.toLowerCase();

    const genres = Array.isArray(movie.genres) ? movie.genres : [];
    const genreBadges = genres
      .slice(0, 3)
      .map((g) => `<span class="genre-badge">${escapeHtml(g)}</span>`)
      .join("");

    const ratingHtml = movie.average_rating
      ? `<span class="rating-value">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
           </svg>
           ${parseFloat(movie.average_rating).toFixed(1)}
         </span>
         <span class="rating-votes">${formatVotes(movie.num_votes)} votos</span>`
      : `<span class="no-rating">Sem avaliação</span>`;

    const relevancePct = movie.relevance_score != null
      ? Math.round(parseFloat(movie.relevance_score) * 100)
      : null;

    const relevanceHtml = relevancePct != null
      ? `<div class="relevance-wrap">
           <span class="relevance-label">Relevância</span>
           <div class="relevance-track">
             <div class="relevance-fill" style="width:${relevancePct}%"></div>
           </div>
           <span class="relevance-pct">${relevancePct}%</span>
         </div>`
      : "";

    card.innerHTML = `
      <span class="card-rank">#${rank}${relevanceHtml}</span>
      <div class="card-rating">${ratingHtml}</div>
      <div>
        <div class="card-title">${escapeHtml(movie.primary_title)}</div>
        ${showPt ? `<div class="card-title-pt">${escapeHtml(ptTitle)}</div>` : ""}
      </div>
      <div class="card-meta">
        ${movie.start_year ? `<span class="card-year">${movie.start_year}</span>` : ""}
        ${genreBadges}
        ${movie.runtime_minutes ? `<span class="card-year">${movie.runtime_minutes} min</span>` : ""}
      </div>
    `;

    return card;
  }

  // ─── Paginação ───────────────────────────────────────────────────────────────
  function renderPagination(page, hasNext, total, limit) {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
      pagination.hidden = true;
      return;
    }

    btnPrev.disabled = page <= 1;
    btnNext.disabled = !hasNext;
    pageInfo.textContent = `${page} / ${totalPages}`;
    pagination.hidden = false;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function getPtTitle(movie) {
    if (!Array.isArray(movie.pt_titles) || movie.pt_titles.length === 0) return null;
    return movie.pt_titles[0];
  }

  function formatVotes(n) {
    if (!n) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
