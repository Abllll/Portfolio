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
    // Set on the root, not tideLanding itself -- the motion deck (a
    // sibling, not a descendant) needs to read this too, to fade itself
    // out as the landing fades in. A sticky-positioned deck frame has no
    // natural exit fade of its own (see .tide-motion-deck__stage's own
    // comment), so without this the last frame was still fully opaque
    // when the landing's video/text faded in underneath it -- both
    // visible at once, reading as overlapping/ghosted content.
    document.documentElement.style.setProperty("--tide-arrival", progress.toFixed(4));
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
        transform = "translate3d(0," + (34 + stackDepth * 2.4) + "vh," + (-130 - stackDepth * 34) + "px) rotateX(-9deg) scale(" + (0.84 - stackDepth * 0.025) + ")";
        // Fully hidden, not just dimmed -- these desaturated, pushed-back
        // stacked frames used to stay partially visible (opacity floor
        // 0.3), which against the deck's pale gradient backdrop read as
        // faint frosted/ghosted rectangles rather than a depth cue. Only
        // the active frame and its immediate transitioning neighbor (the
        // "else" branch below) should ever be on screen.
        opacity = Math.max(0, 0.5 - stackDepth * 0.5);
        frame.style.zIndex = String(30 - index);
      } else if (delta > 0.45) {
        var behindDepth = Math.min(4, delta);
        transform = "translate3d(0," + (-behindDepth * 7) + "vh," + (-behindDepth * 42) + "px) scale(" + (1 - behindDepth * 0.022) + ")";
        opacity = Math.max(0, 0.5 - behindDepth * 0.5);
        frame.style.zIndex = String(70 - index);
      } else {
        var activeY = delta < 0 ? -delta * 58 : -delta * 7;
        var activeScale = 1 - Math.abs(delta) * 0.08;
        transform = "translate3d(0," + activeY + "vh,0) scale(" + activeScale + ")";
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
