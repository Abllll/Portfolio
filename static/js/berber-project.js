// Project 03 — Berber Lab demo video.
// Deferred load + in-view play mirrors tide-project.js (nothing fetches
// on this long homepage until approached; a source behind data-src also
// avoids the collapsed 300x150 fallback box). Adds click-to-unmute on
// both the pill and the video, since a muted-autoplay clip gives the
// viewer no native affordance to turn sound on until they do.
(function () {
  var video = document.querySelector(".berber-video");
  // Placeholder path renders a <div>, not a <video> — nothing to do.
  if (!video || video.tagName !== "VIDEO") return;

  var frame = video.closest(".berber-stage__frame");
  var pill = frame ? frame.querySelector(".berber-sound") : null;
  var pillLabel = pill ? pill.querySelector(".berber-sound__label") : null;
  var source = video.querySelector("source[data-src]");
  var loaded = false;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function prepareVideo() {
    if (loaded || !source) return;
    source.src = source.dataset.src;
    source.removeAttribute("data-src");
    loaded = true;
    video.preload = "metadata";
    video.load();
  }

  function playVideo() {
    prepareVideo();
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function unmute() {
    prepareVideo();
    video.muted = false;
    video.controls = true;
    if (frame) frame.classList.add("is-playing-with-sound");
    if (pill) pill.setAttribute("aria-pressed", "true");
    if (pillLabel) pillLabel.textContent = "Sound on";
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Reduced motion: no autoplay. Show poster + controls, drop the pill.
  if (reduceMotion) {
    prepareVideo();
    video.controls = true;
    if (pill) pill.remove();
    return;
  }

  if (pill) pill.addEventListener("click", unmute);
  // Clicking the video itself also unmutes — but not once native
  // controls are live, or the click would fight the scrubber.
  video.addEventListener("click", function () {
    if (!video.controls) unmute();
  });

  if (!("IntersectionObserver" in window)) {
    playVideo();
    return;
  }

  var loadObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      prepareVideo();
      loadObserver.unobserve(entry.target);
    });
  }, { rootMargin: "100% 0px", threshold: 0 });

  var playbackObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        playVideo();
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.18 });

  loadObserver.observe(video);
  playbackObserver.observe(video);
})();
