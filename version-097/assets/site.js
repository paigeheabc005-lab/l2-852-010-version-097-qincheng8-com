(function() {
  var navToggle = document.querySelector('[data-nav-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function() {
      mobileNav.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    var showSlide = function(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    };

    var startHero = function() {
      timer = window.setInterval(function() {
        showSlide(current + 1);
      }, 5000);
    };

    var resetHero = function() {
      if (timer) {
        window.clearInterval(timer);
      }
      startHero();
    };

    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        showSlide(Number(dot.getAttribute('data-hero-dot')));
        resetHero();
      });
    });

    if (prev) {
      prev.addEventListener('click', function() {
        showSlide(current - 1);
        resetHero();
      });
    }

    if (next) {
      next.addEventListener('click', function() {
        showSlide(current + 1);
        resetHero();
      });
    }

    startHero();
  }

  var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));

  scopes.forEach(function(scope) {
    var grid = document.querySelector('[data-filter-grid]');
    var empty = document.querySelector('[data-filter-empty]');
    var searchInput = scope.querySelector('[data-filter-search]');
    var yearSelect = scope.querySelector('[data-filter-year]');
    var regionSelect = scope.querySelector('[data-filter-region]');
    var typeSelect = scope.querySelector('[data-filter-type]');

    if (!grid) {
      return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-movie-card]'));

    var applyFilters = function() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var year = yearSelect ? yearSelect.value : '';
      var region = regionSelect ? regionSelect.value : '';
      var type = typeSelect ? typeSelect.value : '';
      var visible = 0;

      cards.forEach(function(card) {
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags')
        ].join(' ').toLowerCase();
        var matched = true;

        if (query && haystack.indexOf(query) === -1) {
          matched = false;
        }

        if (year && card.getAttribute('data-year') !== year) {
          matched = false;
        }

        if (region && card.getAttribute('data-region') !== region) {
          matched = false;
        }

        if (type && card.getAttribute('data-type') !== type) {
          matched = false;
        }

        card.hidden = !matched;

        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    };

    [searchInput, yearSelect, regionSelect, typeSelect].forEach(function(control) {
      if (control) {
        control.addEventListener('input', applyFilters);
        control.addEventListener('change', applyFilters);
      }
    });

    var params = new URLSearchParams(window.location.search);
    var queryValue = params.get('q');

    if (queryValue && searchInput) {
      searchInput.value = queryValue;
      applyFilters();
    }
  });

  var players = Array.prototype.slice.call(document.querySelectorAll('.player-card'));

  players.forEach(function(card) {
    var video = card.querySelector('.js-player');
    var button = card.querySelector('.js-play-button');
    var hls = null;

    if (!video) {
      return;
    }

    var prepare = function() {
      if (video.getAttribute('data-ready') === '1') {
        return;
      }

      var source = video.getAttribute('data-video');

      if (!source) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }

      video.setAttribute('data-ready', '1');
    };

    var start = function() {
      prepare();
      if (button) {
        button.classList.add('is-hidden');
      }
      var playResult = video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(function() {
          if (button) {
            button.classList.remove('is-hidden');
          }
        });
      }
    };

    if (button) {
      button.addEventListener('click', start);
    }

    video.addEventListener('click', function() {
      if (video.paused) {
        start();
      }
    });

    video.addEventListener('play', function() {
      if (button) {
        button.classList.add('is-hidden');
      }
    });

    video.addEventListener('ended', function() {
      if (button) {
        button.classList.remove('is-hidden');
      }
    });

    window.addEventListener('beforeunload', function() {
      if (hls) {
        hls.destroy();
      }
    });
  });
})();
