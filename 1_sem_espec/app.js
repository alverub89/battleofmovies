/* app.js — 01-sem-espec */
(function () {
  "use strict";

  const API_BASE = "/01-sem-espec/api/search";

  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  const resultsGrid = document.getElementById("resultsGrid");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");
  const errorMsg = document.getElementById("errorMsg");
  const parsedInfo = document.getElementById("parsedInfo");
  const chips = document.querySelectorAll(".chip");

  // ─── Chips de sugestão ──────────────────────────────────────────────────────
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.q;
      doSearch(chip.dataset.q);
    });
  });

  // ─── Submit ─────────────────────────────────────────────────────────────────
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) doSearch(q);
  });

  // ─── Busca ──────────────────────────────────────────────────────────────────
  async function doSearch(q) {
    setLoading(true);

    try {
      const url = `${API_BASE}?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }

      const data = await res.json();

      setLoading(false);

      if (!data.results || data.results.length === 0) {
        showEmpty();
        hideParsed();
        return;
      }

      renderParsed(data.parsed);
      renderResults(data.results);
    } catch (err) {
      setLoading(false);
      showError(err.message || "Não foi possível conectar ao servidor.");
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
  }

  function hideParsed() {
    parsedInfo.hidden = true;
  }

  // ─── Parsed info ────────────────────────────────────────────────────────────
  function renderParsed({ genres, yearRange, keyword }) {
    const parts = [];

    if (genres && genres.length > 0) {
      parts.push(
        `<strong>Gêneros:</strong> ` +
          genres.map((g) => `<span class="parsed-tag">${g}</span>`).join(" ")
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

    parsedInfo.innerHTML = `<span>🔍 Entendi:</span> ${parts.join(
      " &nbsp;·&nbsp; "
    )}`;
    parsedInfo.hidden = false;
  }

  // ─── Renderizar resultados ──────────────────────────────────────────────────
  function renderResults(movies) {
    resultsGrid.innerHTML = "";

    movies.forEach((movie, idx) => {
      const card = buildCard(movie, idx + 1);
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

    // Título PT-BR
    const ptTitle = getPtTitle(movie);
    const showPt =
      ptTitle &&
      ptTitle.toLowerCase() !== movie.primary_title.toLowerCase();

    // Gêneros
    const genres = Array.isArray(movie.genres) ? movie.genres : [];
    const genreBadges = genres
      .slice(0, 3)
      .map((g) => `<span class="genre-badge">${escapeHtml(g)}</span>`)
      .join("");

    // Rating
    const ratingHtml = movie.average_rating
      ? `<span class="rating-value">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="${"#fbbf24"}" stroke="none">
             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
           </svg>
           ${parseFloat(movie.average_rating).toFixed(1)}
         </span>
         <span class="rating-votes">${formatVotes(movie.num_votes)} votos</span>`
      : `<span class="no-rating">Sem avaliação</span>`;

    card.innerHTML = `
      <span class="card-rank">#${rank}</span>
      <div class="card-rating">${ratingHtml}</div>
      <div>
        <div class="card-title">${escapeHtml(movie.primary_title)}</div>
        ${showPt ? `<div class="card-title-pt">${escapeHtml(ptTitle)}</div>` : ""}
      </div>
      <div class="card-meta">
        ${movie.start_year ? `<span class="card-year">${movie.start_year}</span>` : ""}
        ${genreBadges}
      </div>
    `;

    return card;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function getPtTitle(movie) {
    if (!Array.isArray(movie.pt_titles) || movie.pt_titles.length === 0) return null;
    // Preferir título em português do Brasil
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
