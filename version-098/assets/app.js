(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function setupMobileNav() {
    var button = document.querySelector('.mobile-toggle');
    var nav = document.querySelector('.mobile-nav');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? '×' : '☰';
    });
  }

  function setupHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    start();
  }

  function setupFilters() {
    var scopes = document.querySelectorAll('[data-filter-scope]');
    scopes.forEach(function (scope) {
      var keyword = scope.querySelector('[data-filter-keyword]');
      var year = scope.querySelector('[data-filter-year]');
      var region = scope.querySelector('[data-filter-region]');
      var type = scope.querySelector('[data-filter-type]');
      var reset = scope.querySelector('[data-filter-reset]');
      var count = scope.querySelector('[data-filter-count]');
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-movie-card]'));

      function value(input) {
        return input ? input.value.trim().toLowerCase() : '';
      }

      function match(card) {
        var text = [
          card.getAttribute('data-title') || '',
          card.getAttribute('data-year') || '',
          card.getAttribute('data-region') || '',
          card.getAttribute('data-type') || '',
          card.getAttribute('data-genre') || '',
          card.getAttribute('data-tags') || ''
        ].join(' ').toLowerCase();
        var kw = value(keyword);
        var y = value(year);
        var r = value(region);
        var t = value(type);
        if (kw && text.indexOf(kw) === -1) {
          return false;
        }
        if (y && String(card.getAttribute('data-year')).toLowerCase() !== y) {
          return false;
        }
        if (r && String(card.getAttribute('data-region')).toLowerCase() !== r) {
          return false;
        }
        if (t && String(card.getAttribute('data-type')).toLowerCase() !== t) {
          return false;
        }
        return true;
      }

      function apply() {
        var visible = 0;
        cards.forEach(function (card) {
          var ok = match(card);
          card.classList.toggle('hidden-by-filter', !ok);
          if (ok) {
            visible += 1;
          }
        });
        if (count) {
          count.textContent = '正在显示 ' + visible + ' 部影片';
        }
      }

      [keyword, year, region, type].forEach(function (input) {
        if (input) {
          input.addEventListener('input', apply);
          input.addEventListener('change', apply);
        }
      });
      if (reset) {
        reset.addEventListener('click', function () {
          [keyword, year, region, type].forEach(function (input) {
            if (input) {
              input.value = '';
            }
          });
          apply();
        });
      }
    });
  }

  function setupPlayer() {
    var players = document.querySelectorAll('[data-player]');
    window.__hlsPlayers = window.__hlsPlayers || [];
    players.forEach(function (player) {
      var button = player.querySelector('[data-play-button]');
      var video = player.querySelector('video[data-hls-src]');
      var message = player.querySelector('[data-player-message]');
      if (!button || !video) {
        return;
      }
      button.addEventListener('click', function () {
        var src = video.getAttribute('data-hls-src');
        if (!src) {
          if (message) {
            message.textContent = '当前页面没有找到可用播放源。';
          }
          return;
        }
        if (video.getAttribute('data-ready') !== 'true') {
          if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            window.__hlsPlayers.push(hls);
            if (message) {
              message.textContent = 'HLS 已初始化，正在加载播放源。';
            }
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            if (message) {
              message.textContent = '浏览器正在使用原生 HLS 播放。';
            }
          } else {
            video.src = src;
            if (message) {
              message.textContent = '当前浏览器可能需要支持 HLS 的播放组件；已尝试直接载入 m3u8。';
            }
          }
          video.setAttribute('data-ready', 'true');
        }
        video.controls = true;
        player.classList.add('is-playing');
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            if (message) {
              message.textContent = '浏览器阻止了自动播放，请再次点击视频区域开始播放。';
            }
            player.classList.remove('is-playing');
          });
        }
      });
    });
  }

  function createSearchCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '' +
      '<article class="movie-card">' +
      '  <a class="poster-wrap" href="' + escapeHtml(movie.page) + '">' +
      '    <span class="fallback-title">' + escapeHtml(movie.title) + '</span>' +
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" onerror="this.style.display=\'none\';">' +
      '    <span class="poster-badge">' + escapeHtml(movie.category) + '</span>' +
      '    <span class="poster-duration">' + escapeHtml(movie.duration) + '</span>' +
      '  </a>' +
      '  <div class="movie-card-body">' +
      '    <h3><a href="' + escapeHtml(movie.page) + '">' + escapeHtml(movie.title) + '</a></h3>' +
      '    <p class="movie-desc">' + escapeHtml(movie.oneLine || '') + '</p>' +
      '    <p class="movie-meta">' + escapeHtml(movie.year + ' · ' + movie.region + ' · ' + movie.type) + '</p>' +
      '    <div class="movie-tags">' + tags + '</div>' +
      '  </div>' +
      '</article>';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupSearchPage() {
    var page = document.querySelector('[data-search-page]');
    if (!page || !window.MOVIE_INDEX) {
      return;
    }
    var form = page.querySelector('[data-search-form]');
    var input = page.querySelector('[data-search-input]');
    var sort = page.querySelector('[data-search-sort]');
    var results = page.querySelector('[data-search-results]');
    var count = page.querySelector('[data-search-count]');
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    input.value = initial;

    function haystack(movie) {
      return [movie.title, movie.year, movie.region, movie.type, movie.genre, movie.category, movie.oneLine].concat(movie.tags || []).join(' ').toLowerCase();
    }

    function render() {
      var q = input.value.trim().toLowerCase();
      var list = window.MOVIE_INDEX.filter(function (movie) {
        return !q || haystack(movie).indexOf(q) !== -1;
      });
      var sortValue = sort.value;
      if (sortValue === 'views') {
        list.sort(function (a, b) { return Number(b.views || 0) - Number(a.views || 0); });
      } else if (sortValue === 'year') {
        list.sort(function (a, b) { return String(b.year).localeCompare(String(a.year), 'zh-Hans-CN'); });
      } else if (sortValue === 'title') {
        list.sort(function (a, b) { return String(a.title).localeCompare(String(b.title), 'zh-Hans-CN'); });
      }
      results.innerHTML = list.map(createSearchCard).join('');
      if (count) {
        count.textContent = '找到 ' + list.length + ' 部影片';
      }
      var nextUrl = q ? (window.location.pathname + '?q=' + encodeURIComponent(q)) : window.location.pathname;
      window.history.replaceState(null, '', nextUrl);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      render();
    });
    input.addEventListener('input', render);
    sort.addEventListener('change', render);
    render();
  }

  ready(function () {
    setupMobileNav();
    setupHero();
    setupFilters();
    setupPlayer();
    setupSearchPage();
  });
}());
