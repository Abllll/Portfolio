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
    // The markup ships preload="none" so nothing fetches before this
    // point -- but left at "none", load() may not even pull metadata,
    // and a video without known dimensions keeps its collapsed 300x150
    // fallback box (the stray-bar problem all over again, just delayed).
    // "metadata" fetches only the few-KB header: real dimensions, no
    // frames, until playVideo() actually plays it.
    video.preload = "metadata";
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
    // Measured from the landing's TOP edge, not its bottom. The landing
    // sits *below* the 600vh deck in the document, so while the deck is
    // the thing on screen the landing's bottom is thousands of px down --
    // a bottom-based ratio saturates at 1 for the deck's entire scroll
    // range, and since .tide-motion-deck__stage is opacity:calc(1 - this),
    // that pinned the whole stage at opacity 0 and the deck never painted
    // at all. Top-based, the value is 0 while the landing is still below
    // the fold (deck fully visible) and only ramps to 1 across the one
    // viewport-height window in which the landing actually moves in --
    // which is the handoff this was always meant to describe.
    var progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / window.innerHeight));
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
        // Visible again (was floored to 0 briefly -- that killed the
        // whole card-stack depth effect, not just the washed-out look
        // that was the actual complaint). The real fix for these mostly-
        // white gif frames reading as frosted haze is the much stronger
        // brightness/saturation drop on .is-tide-stacked itself (see
        // home-sections.css) -- opacity alone was never the problem.
        opacity = Math.max(0.28, 0.68 - stackDepth * 0.09);
        frame.style.zIndex = String(30 - index);
      } else if (delta > 0.45) {
        var behindDepth = Math.min(4, delta);
        transform = "translate3d(0," + (-behindDepth * 7) + "vh," + (-behindDepth * 42) + "px) scale(" + (1 - behindDepth * 0.022) + ")";
        opacity = Math.max(0.32, 0.8 - behindDepth * 0.1);
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

    // Attach every deck video's source the first time the deck is on
    // screen -- not just active + approaching. CSS hides any deck media
    // that hasn't loaded (see .tide-motion-frame__media:not([data-tide-
    // loaded]) in home-sections.css, added because sourceless <video>
    // elements collapse into stray grey bars), so background cards in
    // the depth stack need their sources early or they'd simply be
    // missing from the stack. Loading is metadata-light (preload="none"
    // until play), and this runs once thanks to prepareVideo's own
    // dataset guard.
    deckFrames.forEach(function (frame) {
      var frameVideo = frame.querySelector("video");
      if (frameVideo) prepareVideo(frameVideo);
    });

    if (nextActiveIndex !== activeDeckIndex) {
      activeDeckIndex = nextActiveIndex;
      var activeFrame = deckFrames[activeDeckIndex];
      var activeVideo = activeFrame.querySelector("video");
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
