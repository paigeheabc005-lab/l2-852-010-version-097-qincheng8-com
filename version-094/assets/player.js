(function () {
  var player = document.querySelector('.movie-player');

  if (!player) {
    return;
  }

  var video = player.querySelector('video');
  var cover = player.querySelector('.play-cover');
  var streamUrl = player.getAttribute('data-stream-src');
  var hlsInstance = null;
  var ready = false;

  function attachStream() {
    if (ready || !video || !streamUrl) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      ready = true;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
      ready = true;
      return;
    }

    video.src = streamUrl;
    ready = true;
  }

  function playVideo() {
    attachStream();
    player.classList.add('is-playing');
    video.setAttribute('controls', 'controls');
    var promise = video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {
        player.classList.remove('is-playing');
      });
    }
  }

  if (cover) {
    cover.addEventListener('click', playVideo);
  }

  player.addEventListener('click', function (event) {
    if (event.target === player) {
      playVideo();
    }
  });

  window.addEventListener('pagehide', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  });
})();
