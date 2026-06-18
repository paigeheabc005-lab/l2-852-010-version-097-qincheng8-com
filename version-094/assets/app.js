(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var menuButton = document.querySelector('.menu-toggle');
  var mobilePanel = document.querySelector('.mobile-panel');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      var open = mobilePanel.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var slides = selectAll('.hero-slide');
  var dots = selectAll('.hero-dot');
  var currentSlide = 0;
  var timer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === currentSlide);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === currentSlide);
    });
  }

  function startHero() {
    if (timer || slides.length < 2) {
      return;
    }
    timer = window.setInterval(function () {
      showSlide(currentSlide + 1);
    }, 5200);
  }

  function restartHero() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    startHero();
  }

  var prev = document.querySelector('.hero-prev');
  var next = document.querySelector('.hero-next');

  if (prev) {
    prev.addEventListener('click', function () {
      showSlide(currentSlide - 1);
      restartHero();
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      showSlide(currentSlide + 1);
      restartHero();
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      showSlide(index);
      restartHero();
    });
  });

  startHero();

  var searchInput = document.querySelector('.js-search');
  var chips = selectAll('.filter-chip');
  var query = new URLSearchParams(window.location.search).get('q') || '';

  if (searchInput && query) {
    searchInput.value = query;
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function filterItems() {
    var text = normalize(searchInput ? searchInput.value : '');
    var activeChip = document.querySelector('.filter-chip.is-active');
    var chipValue = normalize(activeChip ? activeChip.getAttribute('data-filter') : '');
    var items = selectAll('.movie-card, .ranking-row');

    items.forEach(function (item) {
      var haystack = normalize([
        item.getAttribute('data-title'),
        item.getAttribute('data-tags'),
        item.getAttribute('data-genre'),
        item.getAttribute('data-region'),
        item.getAttribute('data-year'),
        item.getAttribute('data-type')
      ].join(' '));
      var textOk = !text || haystack.indexOf(text) !== -1;
      var chipOk = !chipValue || haystack.indexOf(chipValue) !== -1;
      item.classList.toggle('is-hidden', !(textOk && chipOk));
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterItems);
    filterItems();
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (item) {
        item.classList.remove('is-active');
      });
      chip.classList.add('is-active');
      filterItems();
    });
  });
})();
