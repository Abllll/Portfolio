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
