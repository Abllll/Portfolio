// static/js/bonheur-story.js
// Toggles .is-visible on each beat as it scrolls into view, and keeps the
// persistent #bs-motif element's data-motif in sync with the beat currently
// in view. Loaded only on /work/bonheur/ (see layouts/work/bonheur-story.html).
(function () {
  "use strict";

  var motif = document.getElementById("bs-motif");
  var beats = document.querySelectorAll(".bs-beat");

  if (!motif || !beats.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        var nextMotif = entry.target.getAttribute("data-motif");
        if (nextMotif) {
          motif.setAttribute("data-motif", nextMotif);
        }
      });
    },
    { threshold: 0.5 }
  );

  beats.forEach(function (beat) {
    observer.observe(beat);
  });
})();

// Drives --bs-intro-progress (0-1) from how far the user has scrolled
// through #bs-intro. All visual behavior lives in bonheur-story.css as
// calc()/clamp() expressions reading this one property -- this script only
// computes and writes the number.
(function () {
  "use strict";

  var intro = document.getElementById("bs-intro");
  if (!intro) return;

  var tagline = document.querySelector(".bs-intro-tagline");
  var taglineFlickered = false;

  var ticking = false;

  function updateProgress() {
    ticking = false;
    var rect = intro.getBoundingClientRect();
    var scrollableDistance = rect.height - window.innerHeight;
    var progress = scrollableDistance > 0 ? (0 - rect.top) / scrollableDistance : 1;
    progress = Math.min(1, Math.max(0, progress));
    document.documentElement.style.setProperty("--bs-intro-progress", progress.toFixed(4));

    if (!taglineFlickered && tagline && progress >= 0.4) {
      taglineFlickered = true;
      tagline.classList.add("bs-intro-tagline--flicker");
    }
  }

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  updateProgress();
})();
