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

    if ("IntersectionObserver" in window && sectionEls.length) {
      var activeObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              setActiveDot(entry.target.id);
            }
          });
        },
        { threshold: 0.5 }
      );
      sectionEls.forEach(function (pair) {
        activeObserver.observe(pair.el);
      });
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
