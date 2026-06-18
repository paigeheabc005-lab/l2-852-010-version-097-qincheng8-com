(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
            return;
        }
        callback();
    }

    function setup(shell) {
        var video = shell.querySelector('video');
        var overlay = shell.querySelector('.player-overlay');
        if (!video || !overlay) {
            return;
        }
        var sourceTag = video.querySelector('source');
        var source = sourceTag ? sourceTag.getAttribute('src') : '';
        var attached = false;

        function attach() {
            if (!source || attached) {
                return;
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                attached = true;
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(source);
                hls.attachMedia(video);
                video._hls = hls;
                attached = true;
                return;
            }
            video.src = source;
            attached = true;
        }

        function start() {
            attach();
            shell.classList.add('is-playing');
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {
                    shell.classList.remove('is-playing');
                });
            }
        }

        overlay.addEventListener('click', start);
        video.addEventListener('click', function () {
            if (video.paused) {
                start();
            }
        });
        video.addEventListener('play', function () {
            shell.classList.add('is-playing');
        });
    }

    ready(function () {
        Array.prototype.slice.call(document.querySelectorAll('.player-shell')).forEach(setup);
    });
})();
