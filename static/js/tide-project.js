(function () {
  "use strict";

  var videos = Array.prototype.slice.call(document.querySelectorAll(".tide-deferred-video"));
  if (!videos.length) return;

  function prepareVideo(video) {
    if (video.dataset.tideLoaded === "true") return;
    var source = video.querySelector("source[data-src]");
    if (!source) return;
    source.src = source.dataset.src;
    source.removeAttribute("data-src");
    video.dataset.tideLoaded = "true";
    video.load();
  }

  function playVideo(video) {
    prepareVideo(video);
    var promise = video.play();
    if (promise && promise.catch) promise.catch(function () {});
  }

  var deck = document.querySelector(".tide-motion-deck");
  var tideLanding = document.querySelector(".tide-landing");
  var deckFrames = deck
    ? Array.prototype.slice.call(deck.querySelectorAll(".tide-motion-frame")).reverse()
    : [];
  var deckTicking = false;
  var activeDeckIndex = -1;

  function updateTideArrival() {
    if (!tideLanding) return;
    var rect = tideLanding.getBoundingClientRect();
    var progress = Math.max(0, Math.min(1, rect.bottom / window.innerHeight));
    tideLanding.style.setProperty("--tide-arrival", progress.toFixed(4));
  }

  function updateTidalDeck() {
    deckTicking = false;
    if (!deck || !deckFrames.length) return;

    var rect = deck.getBoundingClientRect();
    var travel = Math.max(1, rect.height - window.innerHeight);
    var conventionalProgress = Math.max(0, Math.min(1, -rect.top / travel));
    var tideProgress = 1 - conventionalProgress;
    var position = tideProgress * (deckFrames.length - 1);
    var nextActiveIndex = Math.max(0, Math.min(deckFrames.length - 1, Math.round(position)));
    var deckVisible = rect.bottom > 0 && rect.top < window.innerHeight;

    deckFrames.forEach(function (frame, index) {
      var delta = index - position;
      var video = frame.querySelector("video");
      var transform;
      var opacity;

      frame.classList.toggle("is-active", index === nextActiveIndex);
      frame.classList.toggle("is-tide-stacked", delta < -0.45);
      frame.classList.toggle("is-tide-behind", delta > 0.45);
      frame.classList.toggle("is-past", delta < -0.45);
      frame.classList.toggle("is-upcoming", delta > 0.45);

      if (delta < -0.45) {
        var stackDepth = Math.min(4, position - index);
        transform = "translate3d(0," + (66 + stackDepth * 2.2) + "vh," + (-180 - stackDepth * 34) + "px) rotateX(-10deg) scale(" + (0.82 - stackDepth * 0.025) + ")";
        opacity = Math.max(0.18, 0.58 - stackDepth * 0.1);
        frame.style.zIndex = String(30 - index);
      } else if (delta > 0.45) {
        var behindDepth = Math.min(4, delta);
        transform = "translate3d(0," + (-behindDepth * 1.6) + "vh," + (-behindDepth * 58) + "px) rotateX(" + (behindDepth * 1.4) + "deg) scale(" + (1 - behindDepth * 0.035) + ")";
        opacity = Math.max(0.28, 0.78 - behindDepth * 0.12);
        frame.style.zIndex = String(70 - index);
      } else {
        var activeY = delta < 0 ? -delta * 70 : -delta * 3;
        var activeScale = 1 - Math.abs(delta) * 0.11;
        transform = "translate3d(0," + activeY + "vh,0) rotateX(" + (Math.max(0, -delta) * -7) + "deg) scale(" + activeScale + ")";
        opacity = 1;
        frame.style.zIndex = "100";
      }

      frame.style.transform = transform;
      frame.style.opacity = String(opacity);

      if (video && index !== nextActiveIndex) video.pause();
    });

    if (!deckVisible) {
      activeDeckIndex = -1;
      return;
    }

    if (nextActiveIndex !== activeDeckIndex) {
      activeDeckIndex = nextActiveIndex;
      var activeVideo = deckFrames[activeDeckIndex].querySelector("video");
      if (activeVideo) {
        playVideo(activeVideo);
        activeVideo.currentTime = 0;
      }
      var approachingFrame = deckFrames[Math.min(deckFrames.length - 1, activeDeckIndex + 1)];
      var approachingVideo = approachingFrame ? approachingFrame.querySelector("video") : null;
      if (approachingVideo) prepareVideo(approachingVideo);
    }
  }

  function requestDeckUpdate() {
    if (deckTicking) return;
    deckTicking = true;
    window.requestAnimationFrame(function () {
      updateTidalDeck();
      updateTideArrival();
    });
  }

  if (!("IntersectionObserver" in window)) {
    videos.forEach(playVideo);
    return;
  }

  var loadObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      prepareVideo(entry.target);
      loadObserver.unobserve(entry.target);
    });
  }, {
    rootMargin: "100% 0px",
    threshold: 0,
  });

  var playbackObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.target.closest(".tide-motion-deck")) return;
      if (entry.isIntersecting) {
        playVideo(entry.target);
      } else {
        entry.target.pause();
      }
    });
  }, {
    threshold: 0.18,
  });

  videos.forEach(function (video) {
    if (video.closest(".tide-motion-deck")) return;
    loadObserver.observe(video);
    playbackObserver.observe(video);
  });

  if (deckFrames.length) {
    window.addEventListener("scroll", requestDeckUpdate, { passive: true });
    window.addEventListener("resize", requestDeckUpdate);
    updateTidalDeck();
  }
  updateTideArrival();
})();
