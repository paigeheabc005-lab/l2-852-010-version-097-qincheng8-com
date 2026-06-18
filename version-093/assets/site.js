(function () {
    var header = document.querySelector('[data-header]');
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-main-nav]');
    var backTop = document.querySelector('[data-back-top]');

    function onScroll() {
        if (header) {
            header.classList.toggle('is-scrolled', window.scrollY > 40);
        }
        if (backTop) {
            backTop.classList.toggle('is-visible', window.scrollY > 500);
        }
    }

    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    if (backTop) {
        backTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var hero = document.querySelector('[data-hero]');
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        }

        function play() {
            clearInterval(timer);
            timer = setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                play();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                play();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                play();
            });
        }

        show(0);
        play();
    }

    var filterRoot = document.querySelector('[data-filter-root]');
    var list = document.querySelector('[data-filter-list]');
    if (filterRoot && list) {
        var input = filterRoot.querySelector('[data-filter-input]');
        var select = filterRoot.querySelector('[data-year-select]');
        var items = Array.prototype.slice.call(list.querySelectorAll('.movie-item'));

        function normalize(value) {
            return String(value || '').toLowerCase().trim();
        }

        function applyFilter() {
            var keyword = normalize(input ? input.value : '');
            var year = select ? select.value : '';
            items.forEach(function (item) {
                var text = normalize([
                    item.getAttribute('data-title'),
                    item.getAttribute('data-region'),
                    item.getAttribute('data-genre'),
                    item.getAttribute('data-tags')
                ].join(' '));
                var itemYear = item.getAttribute('data-year') || '';
                var matchedKeyword = !keyword || text.indexOf(keyword) !== -1;
                var matchedYear = !year || itemYear === year;
                item.classList.toggle('is-hidden', !(matchedKeyword && matchedYear));
            });
        }

        if (input) {
            input.addEventListener('input', applyFilter);
        }
        if (select) {
            select.addEventListener('change', applyFilter);
        }
        applyFilter();
    }
})();
