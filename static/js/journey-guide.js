(function () {
  "use strict";

  var guide = document.getElementById("journey-guide");
  var tag = document.getElementById("journey-guide-tag");
  var nav = document.getElementById("dot-nav");
  if (!guide || !nav) return;

  var ticking = false;
  var idleTimer = null;
  var lastY = null;
  var lastKind = "illustration";
  var handoffTimer = null;

  function markerPosition(dot) {
    var marker = dot && dot.querySelector(".dot-nav__marker");
    return {
      x: marker ? dot.offsetLeft + marker.offsetLeft + marker.offsetWidth / 2 : (dot ? dot.offsetLeft : 0),
      y: dot ? dot.offsetTop + dot.offsetHeight / 2 : 0
    };
  }

  function readingPosition() {
    var ordered = [
      nav.querySelector('.dot-nav__dot[data-dot-kind="illustration"]'),
      nav.querySelector('.dot-nav__dot[data-dot-target="bonheur"]'),
      nav.querySelector('.dot-nav__dot[data-dot-target="project-2"]'),
      nav.querySelector('.dot-nav__dot[data-dot-target="project-3"]')
    ].filter(Boolean);

    var stops = ordered.map(function (dot) {
      var target = document.getElementById(dot.getAttribute("data-dot-target"));
      var position = markerPosition(dot);
      var isIllustration = dot.getAttribute("data-dot-kind") === "illustration";
      if (isIllustration) target = document.getElementById("ep-spacer") || target;
      var documentTop = target
        ? target.getBoundingClientRect().top + window.scrollY
        : window.scrollY;
      var scrollAtEntry = target
        ? documentTop + target.offsetHeight - window.innerHeight
        : window.scrollY;
      /* The sticky illustration spacer is taller than one viewport. Its
         project handoff happens at the spacer's upper boundary, not at
         the bottom of its full scroll range. */
      if (isIllustration && target) {
        scrollAtEntry = documentTop - window.innerHeight;
      }
      return { scroll: scrollAtEntry, x: position.x, y: position.y };
    });

    if (stops.length < 4) return stops[0] || { x: 0, y: 0 };

    /* Once the forest handoff reaches Bonheur, use one global scroll ratio
       through the whole case-study journey. Dividing speed independently
       by each section's very different height made the first Bonheur wheel
       step disproportionately large. */
    var bonheur = stops[1];
    var berber = stops[3];
    var totalScroll = bonheur.scroll - berber.scroll;
    var progress = totalScroll > 0
      ? (bonheur.scroll - window.scrollY) / totalScroll
      : 1;
    progress = Math.max(0, Math.min(1, progress));

    var routeProgress = progress * 2;
    var segment = Math.min(1, Math.floor(routeProgress));
    var localProgress = routeProgress - segment;
    var from = stops[1 + segment];
    var to = stops[2 + segment];
    return {
      x: from.x + (to.x - from.x) * localProgress,
      y: from.y + (to.y - from.y) * localProgress
    };
  }

  function updateGuide() {
    ticking = false;
    if (guide.classList.contains("is-handoff")) return;
    var active = nav.querySelector(".dot-nav__dot.is-active");
    if (!active) {
      guide.classList.remove("is-visible");
      return;
    }

    var isIllustration = active.getAttribute("data-dot-kind") === "illustration";
    if (isIllustration) {
      /* The handoff begins while the illustration is technically still
         the active section. Do not let that transient state hide the
         navigation copy that is walking out of the forest. */
      if (guide.classList.contains("is-handoff")) return;
      guide.classList.remove("is-visible");
      lastKind = "illustration";
      return;
    }
    guide.classList.add("is-visible");

    var reading = readingPosition();
    var x = reading.x;
    var y = reading.y;
    if (lastKind === "illustration") {
      var illustrationDot = nav.querySelector('.dot-nav__dot[data-dot-kind="illustration"]');
      var entrance = markerPosition(illustrationDot);
      guide.style.setProperty("--journey-nav-x", entrance.x.toFixed(2) + "px");
      guide.style.setProperty("--journey-nav-y", entrance.y.toFixed(2) + "px");
      guide.getBoundingClientRect();
      window.requestAnimationFrame(function () {
        guide.style.setProperty("--journey-nav-x", x.toFixed(2) + "px");
        guide.style.setProperty("--journey-nav-y", y.toFixed(2) + "px");
        guide.classList.add("is-walking");
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(function () {
          guide.classList.remove("is-walking");
        }, 820);
      });
    } else {
      guide.style.setProperty("--journey-nav-x", x.toFixed(2) + "px");
      guide.style.setProperty("--journey-nav-y", y.toFixed(2) + "px");
    }
    var activeLabel = active.querySelector(".dot-nav__label");
    if (tag && activeLabel) tag.textContent = activeLabel.textContent.trim();

    if (lastY !== null && Math.abs(y - lastY) > 1) {
      guide.classList.add("is-walking");
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(function () {
        guide.classList.remove("is-walking");
      }, 520);
    }
    lastY = y;
    lastKind = active.getAttribute("data-dot-kind");
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateGuide);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  window.addEventListener("explorer:handoff", function (event) {
    var bonheurDot = nav.querySelector('.dot-nav__dot[data-dot-target="bonheur"]');
    var illustrationDot = nav.querySelector('.dot-nav__dot[data-dot-kind="illustration"]');
    var entrance = markerPosition(bonheurDot || illustrationDot);
    var navRect = nav.getBoundingClientRect();
    var detail = event.detail || {};
    var startX = (typeof detail.x === "number" ? detail.x : window.innerWidth) - navRect.left;
    var startY = (typeof detail.y === "number" ? detail.y : window.innerHeight) - navRect.top;
    var startSize = typeof detail.size === "number" ? detail.size : 72;

    nav.classList.add("is-visible", "is-handoff");
    guide.classList.add("is-visible", "is-walking", "is-handoff");
    guide.style.setProperty("--journey-handoff-size", startSize.toFixed(2) + "px");
    guide.style.setProperty("--journey-nav-x", startX.toFixed(2) + "px");
    guide.style.setProperty("--journey-nav-y", startY.toFixed(2) + "px");
    guide.getBoundingClientRect();

    window.requestAnimationFrame(function () {
      guide.style.setProperty("--journey-nav-x", entrance.x.toFixed(2) + "px");
      guide.style.setProperty("--journey-nav-y", entrance.y.toFixed(2) + "px");
    });

    window.clearTimeout(handoffTimer);
    handoffTimer = window.setTimeout(function () {
      nav.classList.remove("is-handoff");
      guide.classList.remove("is-handoff");
      lastKind = "bonheur";
      lastY = entrance.y;
      requestUpdate();
    }, 900);
  });

  var observer = new MutationObserver(requestUpdate);
  Array.prototype.forEach.call(nav.querySelectorAll(".dot-nav__dot"), function (dot) {
    observer.observe(dot, { attributes: true, attributeFilter: ["class"] });
  });

  updateGuide();
})();
