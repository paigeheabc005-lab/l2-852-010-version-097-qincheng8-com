(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dots button'));
  var current = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, itemIndex) {
      slide.classList.toggle('active', itemIndex === current);
    });
    dots.forEach(function (dot, itemIndex) {
      dot.classList.toggle('active', itemIndex === current);
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      showSlide(index);
    });
  });

  if (slides.length > 1) {
    window.setInterval(function () {
      showSlide(current + 1);
    }, 5600);
  }

  var searchInput = document.querySelector('.site-search');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
  var activeRegion = 'all';
  var activeYear = 'all';

  function filterCards() {
    var value = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var visible = 0;
    cards.forEach(function (card) {
      var text = (card.getAttribute('data-search') || '').toLowerCase();
      var region = card.getAttribute('data-region') || '';
      var year = card.getAttribute('data-year') || '';
      var matchText = !value || text.indexOf(value) !== -1;
      var matchRegion = activeRegion === 'all' || region === activeRegion;
      var matchYear = activeYear === 'all' || year === activeYear;
      var show = matchText && matchRegion && matchYear;
      card.style.display = show ? '' : 'none';
      if (show) {
        visible += 1;
      }
    });
    var empty = document.querySelector('.empty-state');
    if (empty) {
      empty.style.display = visible ? 'none' : 'block';
    }
  }

  if (searchInput && cards.length) {
    searchInput.addEventListener('input', filterCards);
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-filter-region]')).forEach(function (button) {
    button.addEventListener('click', function () {
      activeRegion = button.getAttribute('data-filter-region') || 'all';
      var group = button.closest('[data-filter-group]');
      if (group) {
        Array.prototype.slice.call(group.querySelectorAll('button')).forEach(function (item) {
          item.classList.toggle('active', item === button);
        });
      }
      filterCards();
    });
  });

  Array.prototype.slice.call(document.querySelectorAll('[data-filter-year]')).forEach(function (button) {
    button.addEventListener('click', function () {
      activeYear = button.getAttribute('data-filter-year') || 'all';
      var group = button.closest('[data-filter-group]');
      if (group) {
        Array.prototype.slice.call(group.querySelectorAll('button')).forEach(function (item) {
          item.classList.toggle('active', item === button);
        });
      }
      filterCards();
    });
  });
})();
