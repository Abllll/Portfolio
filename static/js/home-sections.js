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

  // Tide is a scrolling water deck: the nearest scene crests in front,
  // the next scene approaches from above, and completed scenes recede.
  var tideFrames = Array.prototype.slice.call(document.querySelectorAll(".tide-motion-frame"));
  if (tideFrames.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      tideFrames.forEach(function (frame) {
        frame.classList.add("is-active");
      });
    } else {
      var tideTicking = false;

      function updateTideFrames() {
        tideTicking = false;
        var crest = window.innerHeight * 0.52;
        var activeIndex = 0;
        var nearestDistance = Infinity;

        tideFrames.forEach(function (frame, index) {
          var rect = frame.getBoundingClientRect();
          var distance = Math.abs(rect.top + rect.height * 0.5 - crest);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            activeIndex = index;
          }
        });

        tideFrames.forEach(function (frame, index) {
          var rect = frame.getBoundingClientRect();
          var proximity = Math.max(0, 1 - Math.abs(rect.top + rect.height * 0.5 - crest) / (window.innerHeight * 0.9));
          frame.style.setProperty("--tide-swell", proximity.toFixed(3));
          frame.style.setProperty("--tide-backdrop-y", ((1 - proximity) * 6).toFixed(2) + "vh");
          frame.style.setProperty("--tide-backdrop-scale", (0.94 + proximity * 0.08).toFixed(3));
          frame.style.setProperty("--tide-swell-y", ((1 - proximity) * 18).toFixed(2) + "%");
          frame.style.setProperty("--tide-swell-scale", (0.8 + proximity * 0.35).toFixed(3));
          frame.style.setProperty("--tide-swell-opacity", (0.18 + proximity * 0.55).toFixed(3));
          frame.classList.toggle("is-active", index === activeIndex);
          frame.classList.toggle("is-upcoming", index < activeIndex);
          frame.classList.toggle("is-past", index > activeIndex);
        });
      }

      window.addEventListener("scroll", function () {
        if (tideTicking) return;
        tideTicking = true;
        window.requestAnimationFrame(updateTideFrames);
      }, { passive: true });
      window.addEventListener("resize", updateTideFrames);
      updateTideFrames();

      tideFrames.forEach(function (frame) {
        frame.addEventListener("pointermove", function (event) {
          var rect = frame.getBoundingClientRect();
          var x = (event.clientX - rect.left) / rect.width - 0.5;
          var y = (event.clientY - rect.top) / rect.height - 0.5;
          frame.style.setProperty("--tide-pointer-x", (x * 9).toFixed(2) + "px");
          frame.style.setProperty("--tide-pointer-y", (y * 7).toFixed(2) + "px");
        });
        frame.addEventListener("pointerleave", function () {
          frame.style.setProperty("--tide-pointer-x", "0px");
          frame.style.setProperty("--tide-pointer-y", "0px");
        });
      });
    }
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
