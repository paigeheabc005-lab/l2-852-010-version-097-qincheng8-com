(function () {
    var hlsCallbacks = [];
    var hlsLoading = false;

    function each(selector, root, callback) {
        Array.prototype.forEach.call((root || document).querySelectorAll(selector), callback);
    }

    function loadHls(callback) {
        if (window.Hls) {
            callback();
            return;
        }
        hlsCallbacks.push(callback);
        if (hlsLoading) {
            return;
        }
        hlsLoading = true;
        var script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
        script.onload = function () {
            var callbacks = hlsCallbacks.slice();
            hlsCallbacks = [];
            callbacks.forEach(function (fn) {
                fn();
            });
        };
        script.onerror = function () {
            var callbacks = hlsCallbacks.slice();
            hlsCallbacks = [];
            callbacks.forEach(function (fn) {
                fn();
            });
        };
        document.head.appendChild(script);
    }

    function playVideo(video) {
        var play = video.play();
        if (play && typeof play.catch === "function") {
            play.catch(function () {});
        }
    }

    window.initializePlayer = function (videoId, coverId, sourceUrl) {
        var video = document.getElementById(videoId);
        var cover = document.getElementById(coverId);
        if (!video || !cover || !sourceUrl) {
            return;
        }
        var ready = false;
        var pendingPlay = false;
        var hlsInstance = null;

        function bindVideo() {
            if (ready) {
                return;
            }
            ready = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = sourceUrl;
                video.addEventListener("loadedmetadata", function () {
                    if (pendingPlay) {
                        playVideo(video);
                    }
                }, { once: true });
                return;
            }
            loadHls(function () {
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false,
                        backBufferLength: 90
                    });
                    hlsInstance.loadSource(sourceUrl);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        if (pendingPlay) {
                            playVideo(video);
                        }
                    });
                } else {
                    video.src = sourceUrl;
                    video.addEventListener("loadedmetadata", function () {
                        if (pendingPlay) {
                            playVideo(video);
                        }
                    }, { once: true });
                }
            });
        }

        function start() {
            pendingPlay = true;
            cover.classList.add("is-hidden");
            video.controls = true;
            bindVideo();
            setTimeout(function () {
                if (pendingPlay) {
                    playVideo(video);
                }
            }, 350);
        }

        cover.addEventListener("click", start);
        video.addEventListener("click", function () {
            if (video.paused) {
                start();
            }
        });
        video.addEventListener("play", function () {
            pendingPlay = false;
            cover.classList.add("is-hidden");
        });
        window.addEventListener("pagehide", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };

    function setupMobileMenu() {
        var toggle = document.querySelector("[data-mobile-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function setupFilters() {
        each("[data-filter-input]", document, function (input) {
            var section = input.closest("section") || document;
            var scope = section.querySelector("[data-filter-scope]");
            if (!scope) {
                return;
            }
            input.addEventListener("input", function () {
                var query = normalize(input.value);
                each(".movie-card, .rank-item", scope, function (item) {
                    var text = normalize(item.textContent + " " + item.getAttribute("data-title") + " " + item.getAttribute("data-region") + " " + item.getAttribute("data-genre") + " " + item.getAttribute("data-year"));
                    item.classList.toggle("hidden-by-filter", query && text.indexOf(query) === -1);
                });
            });
        });
    }

    function setupGlobalSearch() {
        var input = document.querySelector("[data-global-search]");
        var panel = document.querySelector("[data-search-panel]");
        var form = document.querySelector("[data-global-search-form]");
        var index = window.SearchIndex || [];
        if (!input || !panel || !index.length) {
            return;
        }

        function render(query) {
            query = normalize(query);
            panel.innerHTML = "";
            if (!query) {
                panel.classList.remove("is-open");
                return;
            }
            var hits = index.filter(function (item) {
                return normalize(item.title + " " + item.region + " " + item.type + " " + item.year + " " + item.genre + " " + item.tags).indexOf(query) !== -1;
            }).slice(0, 8);
            if (!hits.length) {
                panel.classList.add("is-open");
                panel.innerHTML = "<div class=\"search-result\"><div></div><small>没有找到匹配影片</small></div>";
                return;
            }
            hits.forEach(function (item) {
                var link = document.createElement("a");
                link.className = "search-result";
                link.href = item.url;
                link.innerHTML = "<img src=\"" + item.cover + "\" alt=\"" + item.title.replace(/\"/g, "&quot;") + "\"><span><strong>" + item.title + "</strong><small>" + item.year + " · " + item.region + " · " + item.genre + "</small></span>";
                panel.appendChild(link);
            });
            panel.classList.add("is-open");
        }

        input.addEventListener("input", function () {
            render(input.value);
        });
        input.addEventListener("focus", function () {
            render(input.value);
        });
        document.addEventListener("click", function (event) {
            if (!panel.contains(event.target) && event.target !== input) {
                panel.classList.remove("is-open");
            }
        });
        if (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                render(input.value);
            });
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        setupMobileMenu();
        setupHero();
        setupFilters();
        setupGlobalSearch();
    });
}());
