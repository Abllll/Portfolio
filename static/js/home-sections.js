(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealGroups = Array.prototype.slice.call(document.querySelectorAll(".reveal-group"));
  var dotNav = document.getElementById("dot-nav");
  var dots = dotNav ? Array.prototype.slice.call(dotNav.querySelectorAll(".dot-nav__dot")) : [];

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealGroups.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else if (revealGroups.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    revealGroups.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  if (dots.length) {
    var sectionEls = dots
      .map(function (dot) {
        var id = dot.getAttribute("data-dot-target");
        return { dot: dot, el: document.getElementById(id), isIllustration: dot.getAttribute("data-dot-kind") === "illustration" };
      })
      .filter(function (pair) {
        return pair.el;
      });

    function setActiveDot(id) {
      dots.forEach(function (dot) {
        dot.classList.toggle("is-active", dot.getAttribute("data-dot-target") === id);
      });
    }

    // IntersectionObserver's threshold is a ratio of intersecting area to
    // the *target's own* area -- unreachable for a section far taller
    // than the viewport (Bonheur's beats add up to several thousand
    // pixels), so a ratio-based observer would never mark it active for
    // most of its own scroll range. Instead, track which section's box
    // contains the viewport's vertical center -- correct regardless of
    // how tall any individual section is.
    var illustrationEl = null;
    sectionEls.forEach(function (pair) {
      if (pair.isIllustration) illustrationEl = pair.el;
    });

    if (sectionEls.length) {
      var activeTicking = false;

      function updateActiveDot() {
        activeTicking = false;
        var centerY = window.innerHeight / 2;
        for (var i = 0; i < sectionEls.length; i++) {
          var rect = sectionEls[i].el.getBoundingClientRect();
          if (rect.top <= centerY && rect.bottom > centerY) {
            setActiveDot(sectionEls[i].el.id);
            break;
          }
        }

        // Dot-nav visibility is checked directly against the
        // illustration's own rect (its #ep-viewport is position:sticky,
        // so its rect reports top~0/bottom~100vh for its entire pinned
        // duration) rather than reusing the loop above -- #intro sits
        // between the illustration and the rest of the tracked sections
        // but isn't itself one of the 5 dots, so relying on "which
        // tracked section is centered" left a dead zone while scrolling
        // through #intro where dot-nav visibility never got
        // re-evaluated at all.
        if (illustrationEl) {
          var illustrationRect = illustrationEl.getBoundingClientRect();
          var illustrationActive = illustrationRect.top <= centerY && illustrationRect.bottom > centerY;
          if (dotNav) dotNav.classList.toggle("is-visible", !illustrationActive);

          // The illustration's own onboarding hint (#ep-controls-hint,
          // fixed-position) only dismisses itself on real wheel/touch/
          // key input (see explorers-path.js) -- input that never fires
          // for a dot-nav click's scrollIntoView() or any other
          // programmatic navigation away from the illustration. Without
          // this, the hint can be left showing (or, depending on
          // whatever else is painted at that scroll position, hidden
          // behind it inconsistently by sheer z-index luck) on top of
          // whatever section the user actually landed on.
          if (!illustrationActive) {
            var hint = document.getElementById("ep-controls-hint");
            if (hint) hint.classList.add("is-dismissed");
          }
        }
      }

      window.addEventListener(
        "scroll",
        function () {
          if (activeTicking) return;
          activeTicking = true;
          window.requestAnimationFrame(updateActiveDot);
        },
        { passive: true }
      );
      window.addEventListener("resize", updateActiveDot);
      updateActiveDot();
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function (event) {
        var id = dot.getAttribute("data-dot-target");
        var target = document.getElementById(id);
        if (!target) {
          return;
        }
        event.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  }
})();
