(() => {
    const qs = (selector, root = document) => root.querySelector(selector);
    const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const menuButton = qs('[data-menu-toggle]');
    const mobilePanel = qs('[data-mobile-panel]');
    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', () => {
            mobilePanel.classList.toggle('is-open');
        });
    }

    const searchButton = qs('[data-search-toggle]');
    const headerSearch = qs('[data-header-search]');
    if (searchButton && headerSearch) {
        searchButton.addEventListener('click', () => {
            headerSearch.classList.toggle('is-open');
            const input = qs('input', headerSearch);
            if (input && headerSearch.classList.contains('is-open')) {
                input.focus();
            }
        });
    }

    const hero = qs('[data-hero]');
    if (hero) {
        const slides = qsa('[data-hero-slide]', hero);
        const dots = qsa('[data-hero-dot]', hero);
        let current = 0;
        const setSlide = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
            dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
        };
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => setSlide(index));
        });
        if (slides.length > 1) {
            setInterval(() => setSlide(current + 1), 5600);
        }
    }

    const grid = qs('.js-filter-grid');
    const liveSearch = qs('.js-live-search');
    const filterButtons = qsa('.js-filter-button');
    const cards = grid ? qsa('.movie-card', grid) : [];
    let activeFilter = 'all';

    const params = new URLSearchParams(window.location.search);
    const presetQuery = params.get('q');
    if (liveSearch && presetQuery) {
        liveSearch.value = presetQuery;
    }

    const applyFilters = () => {
        if (!grid) {
            return;
        }
        const query = liveSearch ? liveSearch.value.trim().toLowerCase() : '';
        cards.forEach((card) => {
            const haystack = (card.getAttribute('data-search') || '').toLowerCase();
            const region = card.getAttribute('data-region') || '';
            const matchedText = !query || haystack.includes(query);
            const matchedFilter = activeFilter === 'all' || region === activeFilter;
            card.classList.toggle('is-hidden-card', !(matchedText && matchedFilter));
        });
    };

    if (liveSearch && grid) {
        liveSearch.addEventListener('input', applyFilters);
        applyFilters();
    }

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeFilter = button.getAttribute('data-filter') || 'all';
            filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
            applyFilters();
        });
    });

    const loadHls = () => new Promise((resolve) => {
        if (window.Hls) {
            resolve(window.Hls);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js';
        script.onload = () => resolve(window.Hls);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
    });

    qsa('.js-player-card').forEach((card) => {
        const video = qs('.js-player', card);
        const cover = qs('.js-play-cover', card);
        if (!video || !cover) {
            return;
        }
        let prepared = false;
        let hlsInstance = null;
        const stream = video.getAttribute('data-stream');
        const prepare = async () => {
            if (!stream) {
                return;
            }
            if (!prepared) {
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = stream;
                } else {
                    const Hls = await loadHls();
                    if (Hls && Hls.isSupported()) {
                        hlsInstance = new Hls({ lowLatencyMode: true });
                        hlsInstance.loadSource(stream);
                        hlsInstance.attachMedia(video);
                    } else {
                        video.src = stream;
                    }
                }
                prepared = true;
            }
            cover.classList.add('is-hidden');
            try {
                await video.play();
            } catch (error) {
                video.controls = true;
            }
        };
        cover.addEventListener('click', prepare);
        video.addEventListener('click', () => {
            if (!prepared) {
                prepare();
            }
        });
        window.addEventListener('beforeunload', () => {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
})();
