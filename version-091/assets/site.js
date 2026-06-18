(function () {
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));

  function initMobileMenu() {
    const toggle = qs('[data-menu-toggle]');
    const menu = qs('[data-mobile-menu]');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
    });

    qsa('[data-menu-close]', menu).forEach(btn => {
      btn.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initHeroCarousel() {
    const hero = qs('[data-hero-carousel]');
    if (!hero) return;
    const slides = qsa('.hero-slide', hero);
    const dots = qsa('[data-hero-dot]', hero);
    const prev = qs('[data-hero-prev]', hero);
    const next = qs('[data-hero-next]', hero);
    if (slides.length < 2) return;

    let index = 0;
    let timer = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, idx) => slide.classList.toggle('active', idx === index));
      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === index));
    }

    function start() {
      stop();
      timer = window.setInterval(() => show(index + 1), 5200);
    }
    function stop() {
      if (timer) window.clearInterval(timer);
    }

    prev && prev.addEventListener('click', () => { show(index - 1); start(); });
    next && next.addEventListener('click', () => { show(index + 1); start(); });
    dots.forEach((dot, idx) => dot.addEventListener('click', () => { show(idx); start(); }));

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);

    show(0);
    start();
  }

  function initPlayer() {
    const video = qs('[data-player-video]');
    if (!video) return;
    const overlay = qs('[data-play-overlay]');
    const src = video.getAttribute('data-src');
    const poster = video.getAttribute('poster');
    if (poster) video.setAttribute('poster', poster);

    if (!src) return;

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (_, data) {
        console.warn('HLS error', data);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      video.src = src;
    }

    async function playVideo() {
      try {
        await video.play();
        if (overlay) overlay.style.display = 'none';
      } catch (err) {
        console.warn(err);
      }
    }

    if (overlay) {
      overlay.addEventListener('click', playVideo);
    }
    video.addEventListener('play', () => {
      if (overlay) overlay.style.display = 'none';
    });
    video.addEventListener('pause', () => {
      if (overlay) overlay.style.display = 'flex';
    });
  }

  function dataMatches(movie, q, region, type, year) {
    const hay = [
      movie.title,
      movie.region,
      movie.type,
      movie.year,
      movie.genre,
      (movie.tags || []).join(' '),
      movie.one_line,
      movie.summary,
      movie.review
    ].join(' ').toLowerCase();
    const okQ = !q || hay.includes(q.toLowerCase());
    const okRegion = !region || region === 'all' || movie.region === region;
    const okType = !type || type === 'all' || movie.type.includes(type) || movie.genre.includes(type);
    const okYear = !year || year === 'all' || String(movie.year) === String(year);
    return okQ && okRegion && okType && okYear;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function movieCard(movie, rank) {
    const tags = (movie.tags || []).slice(0, 3).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join('');
    const rankBadge = rank ? `<span class="badge">NO.${String(rank).padStart(2,'0')}</span>` : '';
    return `
      <article class="movie-card">
        <a class="movie-poster" href="${movie.slug}">
          <div class="movie-badges">${rankBadge}${tags}</div>
          <img src="./${movie.cover}" alt="${escapeHtml(movie.title)}">
        </a>
        <div class="movie-body">
          <h3 class="movie-title"><a href="${movie.slug}">${escapeHtml(movie.title)}</a></h3>
          <div class="movie-meta">
            <span>${escapeHtml(movie.year)}</span>
            <span>${escapeHtml(movie.region)}</span>
            <span>${escapeHtml(movie.type)}</span>
          </div>
          <p class="movie-text">${escapeHtml(movie.one_line || movie.description || movie.summary || '')}</p>
          <div class="movie-actions">
            <a class="primary" href="${movie.slug}">立即观看</a>
            <a class="secondary" href="${movie.slug}#story">查看简介</a>
          </div>
        </div>
      </article>
    `;
  }

  function initSearchPage() {
    const container = qs('[data-search-results]');
    if (!container) return;
    const input = qs('[data-search-input]');
    const regionSel = qs('[data-search-region]');
    const typeSel = qs('[data-search-type]');
    const yearSel = qs('[data-search-year]');
    const meta = qs('[data-search-meta]');
    const movies = Array.isArray(window.MOVIE_DATA) ? window.MOVIE_DATA : [];
    if (!movies.length) return;

    const params = new URLSearchParams(window.location.search);
    if (input && params.get('q')) input.value = params.get('q');

    function render() {
      const q = input ? input.value.trim() : '';
      const region = regionSel ? regionSel.value : 'all';
      const type = typeSel ? typeSel.value : 'all';
      const year = yearSel ? yearSel.value : 'all';
      const filtered = movies.filter(m => dataMatches(m, q, region, type, year))
        .sort((a, b) => b.views - a.views)
        .slice(0, 240);

      if (meta) {
        meta.textContent = `共找到 ${filtered.length} 部影片`;
      }
      container.innerHTML = filtered.map((m, idx) => movieCard(m, idx + 1)).join('');
    }

    [input, regionSel, typeSel, yearSel].forEach(el => {
      if (!el) return;
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    render();
  }

  function initAnchors() {
    qsa('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const target = qs(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHeroCarousel();
    initPlayer();
    initSearchPage();
    initAnchors();
  });
})();
