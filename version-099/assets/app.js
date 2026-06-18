(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function getMovies() {
    return Array.isArray(window.SITE_MOVIES) ? window.SITE_MOVIES : [];
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initMenu() {
    const button = qs("[data-menu-button]");
    const nav = qs(".site-nav");
    if (!button || !nav) return;
    button.addEventListener("click", function () {
      const visible = nav.style.display === "flex";
      nav.style.display = visible ? "none" : "flex";
      nav.style.flexDirection = "column";
      nav.style.position = "absolute";
      nav.style.top = "74px";
      nav.style.left = "12px";
      nav.style.right = "12px";
      nav.style.padding = "12px";
      nav.style.background = "rgba(6,10,24,.95)";
      nav.style.border = "1px solid rgba(255,255,255,.08)";
      nav.style.borderRadius = "18px";
      nav.style.boxShadow = "0 20px 50px rgba(0,0,0,.35)";
    });
  }

  function initHero() {
    const frame = qs(".hero-frame");
    if (!frame) return;
    const slides = qsa(".hero-slide", frame);
    const indicators = qs("[data-hero-indicators]");
    if (!slides.length || !indicators) return;

    indicators.innerHTML = slides
      .map((_, idx) => `<button type="button" aria-label="切换第 ${idx + 1} 张"></button>`)
      .join("");

    const dots = qsa("button", indicators);
    let current = 0;

    function show(idx) {
      current = (idx + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === current);
      });
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener("click", () => show(idx));
    });

    show(0);
    window.setInterval(() => show(current + 1), 5000);
  }

  function createCard(movie) {
    const tags = (movie.tags || []).slice(0, 3).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
    return `
      <a class="movie-card" href="movie-${String(movie.id).padStart(4, "0")}.html">
        <div class="movie-poster">
          <img src="${escapeAttr(movie.cover)}" alt="${escapeAttr(movie.title)}" loading="lazy">
          <div class="movie-badge">${escapeHtml(movie.year)}</div>
        </div>
        <div class="movie-body">
          <h3>${escapeHtml(movie.title)}</h3>
          <div class="movie-meta">${escapeHtml(movie.region)} · ${escapeHtml(movie.type)} · ${escapeHtml(movie.genre)}</div>
          <p>${escapeHtml(movie.one_line || "")}</p>
          <div class="tag-row">${tags}</div>
        </div>
      </a>
    `;
  }

  function createRank(movie, rank) {
    return `
      <a class="rank-card" href="movie-${String(movie.id).padStart(4, "0")}.html">
        <div class="rank-num">${String(rank).padStart(2, "0")}</div>
        <img src="${escapeAttr(movie.cover)}" alt="${escapeAttr(movie.title)}" loading="lazy">
        <div class="rank-info">
          <h4>${escapeHtml(movie.title)}</h4>
          <p>${escapeHtml(movie.year)} · ${escapeHtml(movie.region)} · ${escapeHtml(movie.type)}</p>
        </div>
      </a>
    `;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll("`", "&#96;");
  }

  function initSearchPage() {
    const input = qs("[data-search-input]");
    const region = qs("[data-filter-region]");
    const type = qs("[data-filter-type]");
    const sortBy = qs("[data-sort-by]");
    const results = qs("[data-search-results]");
    const count = qs("[data-result-count]");
    const pageInfo = qs("[data-page-info]");
    const prev = qs("[data-prev-page]");
    const next = qs("[data-next-page]");
    if (!results || !count) return;

    const movies = getMovies();
    const url = new URL(window.location.href);
    if (input && url.searchParams.get("region")) region && (region.value = url.searchParams.get("region"));
    if (input && url.searchParams.get("type")) type && (type.value = url.searchParams.get("type"));
    if (input && url.searchParams.get("genre")) {
      input.value = url.searchParams.get("genre");
    }

    let filtered = movies.slice();
    let page = 1;
    const pageSize = 48;

    function apply() {
      const keyword = normalize(input ? input.value : "");
      const regionValue = normalize(region ? region.value : "");
      const typeValue = normalize(type ? type.value : "");
      const sortValue = sortBy ? sortBy.value : "default";

      filtered = movies.filter((movie) => {
        const hay = [
          movie.title,
          movie.region,
          movie.type,
          movie.genre,
          movie.one_line,
          movie.summary,
          movie.review,
          ...(movie.tags || []),
        ].join(" ").toLowerCase();

        const okKeyword = !keyword || hay.includes(keyword);
        const okRegion = !regionValue || normalize(movie.region) === regionValue;
        const okType = !typeValue || normalize(movie.type) === typeValue;
        return okKeyword && okRegion && okType;
      });

      if (sortValue === "year-desc") {
        filtered.sort((a, b) => parseInt(b.year, 10) - parseInt(a.year, 10));
      } else if (sortValue === "year-asc") {
        filtered.sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10));
      } else if (sortValue === "title") {
        filtered.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));
      }

      page = 1;
      render();
    }

    function render() {
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      page = Math.min(page, totalPages);
      const start = (page - 1) * pageSize;
      const slice = filtered.slice(start, start + pageSize);
      results.innerHTML = slice.map(createCard).join("") || `<div class="story-block">未找到匹配的影片。</div>`;
      count.textContent = String(total);
      if (pageInfo) pageInfo.textContent = `${page} / ${totalPages}`;
      if (prev) prev.disabled = page <= 1;
      if (next) next.disabled = page >= totalPages;
    }

    const onChange = debounce(apply, 120);
    [input, region, type, sortBy].forEach((el) => {
      if (el) el.addEventListener(el.tagName === "INPUT" ? "input" : "change", onChange);
    });

    if (prev) prev.addEventListener("click", () => {
      if (page > 1) {
        page -= 1;
        render();
        window.scrollTo({ top: results.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
      }
    });
    if (next) next.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (page < totalPages) {
        page += 1;
        render();
        window.scrollTo({ top: results.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
      }
    });

    apply();
  }

  function initDetailPlayer() {
    const video = qs(".movie-video");
    if (!video) return;
    const src = video.getAttribute("data-hls-src") || "";
    if (!src) return;

    function fail(msg) {
      const fb = qs(".video-fallback");
      if (fb) fb.textContent = msg;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (_, data) {
        if (data && data.fatal) {
          fail("播放器加载失败，请检查网络或播放源是否可访问。");
        }
      });
    } else {
      video.src = src;
      fail("当前浏览器不支持 HLS.js，已尝试使用原生播放。");
    }
  }

  function initRankingPreview() {
    const list = qs(".ranking-list");
    if (!list) return;
    // purely presentational
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initHero();
    initSearchPage();
    initDetailPlayer();
    initRankingPreview();
  });
})();
