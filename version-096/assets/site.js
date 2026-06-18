(function () {
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var mainNav = document.querySelector("[data-main-nav]");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", function () {
      mainNav.classList.toggle("is-open");
    });
  }

  var carousel = document.querySelector("[data-hero-carousel]");

  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
    var index = 0;

    function showSlide(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }
  }

  var filterForm = document.querySelector("[data-card-filter]");

  if (filterForm) {
    var input = filterForm.querySelector("[data-filter-input]");
    var yearSelect = filterForm.querySelector("[data-filter-year]");
    var regionSelect = filterForm.querySelector("[data-filter-region]");
    var typeSelect = filterForm.querySelector("[data-filter-type]");
    var count = filterForm.querySelector("[data-filter-count]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    var empty = document.querySelector("[data-filter-empty]");

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function applyFilter() {
      var keyword = normalize(input ? input.value : "");
      var year = yearSelect ? yearSelect.value : "";
      var region = regionSelect ? regionSelect.value : "";
      var type = typeSelect ? typeSelect.value : "";
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year")
        ].join(" "));
        var matched = true;

        if (keyword && haystack.indexOf(keyword) === -1) {
          matched = false;
        }
        if (year && card.getAttribute("data-year") !== year) {
          matched = false;
        }
        if (region && card.getAttribute("data-region") !== region) {
          matched = false;
        }
        if (type && card.getAttribute("data-type") !== type) {
          matched = false;
        }

        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = String(visible);
      }
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    [input, yearSelect, regionSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilter);
        control.addEventListener("change", applyFilter);
      }
    });

    applyFilter();
  }

  var searchResults = document.querySelector("[data-search-results]");

  if (searchResults && window.SEARCH_INDEX) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    var searchInput = document.querySelector("[data-search-input]");
    var searchTitle = document.querySelector("[data-search-title]");
    var searchEmpty = document.querySelector("[data-search-empty]");

    if (searchInput) {
      searchInput.value = query;
    }

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function renderCard(movie) {
      return "" +
        "<a class=\"movie-card\" href=\"" + escapeHtml(movie.url) + "\">" +
        "<span class=\"poster-wrap\">" +
        "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">" +
        "<span class=\"movie-type-badge\">" + escapeHtml(movie.type) + "</span>" +
        "<span class=\"movie-duration\">" + escapeHtml(movie.duration) + "</span>" +
        "</span>" +
        "<span class=\"movie-card-body\">" +
        "<strong>" + escapeHtml(movie.title) + "</strong>" +
        "<em>" + escapeHtml(movie.oneLine) + "</em>" +
        "<span class=\"movie-meta-line\">" + escapeHtml(movie.year) + " · " + escapeHtml(movie.region) + " · " + escapeHtml(movie.genre) + "</span>" +
        "<span class=\"tag-row\"><span>" + escapeHtml(movie.category) + "</span></span>" +
        "</span>" +
        "</a>";
    }

    var normalizedQuery = query.toLowerCase().trim();
    var results = [];

    if (normalizedQuery) {
      results = window.SEARCH_INDEX.filter(function (movie) {
        return [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.tags,
          movie.oneLine,
          movie.category
        ].join(" ").toLowerCase().indexOf(normalizedQuery) !== -1;
      });
    }

    if (searchTitle) {
      searchTitle.textContent = normalizedQuery ? "找到 " + results.length + " 条结果" : "请输入关键词";
    }

    searchResults.innerHTML = results.slice(0, 200).map(renderCard).join("");

    if (searchEmpty) {
      searchEmpty.hidden = !normalizedQuery || results.length > 0;
    }
  }
}());
