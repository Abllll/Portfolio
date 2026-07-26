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

  function updateGuide() {
    ticking = false;
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

    var marker = active.querySelector(".dot-nav__marker");
    var y = active.offsetTop + active.offsetHeight / 2;
    var x = marker ? active.offsetLeft + marker.offsetLeft + marker.offsetWidth / 2 : active.offsetLeft;
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
    var illustrationDot = nav.querySelector('.dot-nav__dot[data-dot-kind="illustration"]');
    var entrance = markerPosition(illustrationDot);
    var navRect = nav.getBoundingClientRect();
    var detail = event.detail || {};
    var startX = (typeof detail.x === "number" ? detail.x : window.innerWidth) - navRect.left;
    var startY = (typeof detail.y === "number" ? detail.y : window.innerHeight) - navRect.top;

    nav.classList.add("is-visible", "is-handoff");
    guide.classList.add("is-visible", "is-walking", "is-handoff");
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
      requestUpdate();
    }, 900);
  });

  var observer = new MutationObserver(requestUpdate);
  Array.prototype.forEach.call(nav.querySelectorAll(".dot-nav__dot"), function (dot) {
    observer.observe(dot, { attributes: true, attributeFilter: ["class"] });
  });

  updateGuide();
})();
