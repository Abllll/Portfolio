(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealGroups = Array.prototype.slice.call(document.querySelectorAll(".reveal-group"));
  var dotNav = document.getElementById("dot-nav");
  var introSection = document.getElementById("intro");
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

  if (dotNav && introSection && "IntersectionObserver" in window) {
    var navVisibilityObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            dotNav.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.3 }
    );
    navVisibilityObserver.observe(introSection);
  }

  if (dots.length) {
    var sectionEls = dots
      .map(function (dot) {
        var id = dot.getAttribute("data-dot-target");
        return { dot: dot, el: document.getElementById(id) };
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
