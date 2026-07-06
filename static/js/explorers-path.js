(function () {
  "use strict";

  var viewport = document.getElementById("ep-viewport");
  var sceneNear = document.getElementById("ep-scene-near");
  var sceneFar = document.getElementById("ep-scene-far");
  if (!viewport || !sceneNear) return;

  var hotspots = Array.prototype.slice.call(viewport.querySelectorAll(".ep-hotspot"));
  var panel = document.getElementById("ep-panel");
  var panelContent = document.getElementById("ep-panel-content");
  var panelClose = document.getElementById("ep-panel-close");
  var footstepAudio = document.getElementById("ep-audio-footstep");
  var discoveryAudio = document.getElementById("ep-audio-discovery");

  var PROXIMITY_PX = 70;
  var EASE = 0.12;

  // Placeholder explorer sprite: a small drawn figure, standing in for
  // Amber's real hand-illustrated sprite until she exports it as its own
  // layer. Swap the innerHTML for a real <img> once that art exists.
  var cursorMarker = document.createElement("div");
  cursorMarker.className = "ep-cursor-marker";
  cursorMarker.setAttribute("aria-hidden", "true");
  cursorMarker.innerHTML =
    '<svg viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">' +
    '<ellipse cx="14" cy="37" rx="8" ry="2.5" fill="rgba(67,53,49,0.28)" />' +
    '<path d="M14 10 C9 10 7 15 8 22 L6 34 L11 34 L12.5 24 L14 24 L15.5 34 L20 34 L18 22 ' +
    'C19 15 19 10 14 10 Z" fill="var(--color-walnut)" />' +
    '<circle cx="14" cy="6" r="5" fill="var(--color-walnut)" />' +
    '<circle cx="17.5" cy="16" r="3" fill="var(--color-accent)" />' +
    "</svg>";
  viewport.appendChild(cursorMarker);

  var targetX = null;
  var targetY = null;
  var markerX = 0;
  var markerY = 0;
  var visited = {};
  var lastFocusedHotspot = null;
  var footstepIdleTimer = null;

  function hotspotPosition(hotspot) {
    var rect = viewport.getBoundingClientRect();
    return {
      x: (parseFloat(hotspot.style.left) / 100) * rect.width,
      y: (parseFloat(hotspot.style.top) / 100) * rect.height,
    };
  }

  function updateProximity() {
    hotspots.forEach(function (hotspot) {
      var pos = hotspotPosition(hotspot);
      var dx = markerX - pos.x;
      var dy = markerY - pos.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      hotspot.classList.toggle("is-near", distance < PROXIMITY_PX);
    });
  }

  function tick() {
    if (targetX !== null) {
      markerX += (targetX - markerX) * EASE;
      markerY += (targetY - markerY) * EASE;
      cursorMarker.style.transform = "translate(" + markerX + "px, " + markerY + "px)";

      var rect = viewport.getBoundingClientRect();
      var relX = markerX / rect.width - 0.5; // -0.5 .. 0.5
      var relY = markerY / rect.height - 0.5;

      // Two-layer parallax: the far (blurred/zoomed) layer reads as more
      // distant, so it shifts less than the near (sharp) layer — the
      // difference in travel distance is what sells the depth.
      sceneNear.style.transform = "translate(" + -relX * 26 + "px, " + -relY * 26 + "px)";
      if (sceneFar) {
        sceneFar.style.transform = "translate(" + -relX * 10 + "px, " + -relY * 10 + "px)";
      }

      updateProximity();
    }
    requestAnimationFrame(tick);
  }

  function playFootstep() {
    if (footstepAudio && footstepAudio.paused) {
      footstepAudio.currentTime = 0;
      footstepAudio.play().catch(function () {});
    }
    if (footstepIdleTimer) clearTimeout(footstepIdleTimer);
    footstepIdleTimer = setTimeout(stopFootstep, 200);
  }

  function stopFootstep() {
    if (footstepAudio && !footstepAudio.paused) {
      footstepAudio.pause();
      footstepAudio.currentTime = 0;
    }
  }

  viewport.addEventListener("mousemove", function (event) {
    var rect = viewport.getBoundingClientRect();
    targetX = event.clientX - rect.left;
    targetY = event.clientY - rect.top;
    cursorMarker.classList.add("is-visible");
    playFootstep();
  });

  viewport.addEventListener("mouseleave", function () {
    cursorMarker.classList.remove("is-visible");
    stopFootstep();
  });

  function openPanel(hotspotId) {
    var entry = document.getElementById("panel-" + hotspotId);
    if (!entry || !panel || !panelContent) return;

    Array.prototype.forEach.call(
      panelContent.querySelectorAll(".ep-panel-entry"),
      function (el) {
        el.hidden = el.id !== "panel-" + hotspotId;
      }
    );

    panel.hidden = false;
    panel.setAttribute("aria-labelledby", "ep-panel-title-" + hotspotId);
    lastFocusedHotspot = document.getElementById("hotspot-" + hotspotId);
    if (panelClose) panelClose.focus();

    if (!visited[hotspotId] && discoveryAudio) {
      visited[hotspotId] = true;
      discoveryAudio.currentTime = 0;
      discoveryAudio.play().catch(function () {});
    }
  }

  function closePanel() {
    if (!panel) return;
    panel.hidden = true;
    if (lastFocusedHotspot) {
      lastFocusedHotspot.focus();
      lastFocusedHotspot = null;
    }
  }

  hotspots.forEach(function (hotspot) {
    hotspot.addEventListener("click", function () {
      openPanel(hotspot.getAttribute("data-hotspot-id"));
    });
  });

  if (panelClose) {
    panelClose.addEventListener("click", closePanel);
  }

  document.addEventListener("keydown", function (event) {
    if (panel && !panel.hidden && event.key === "Escape") {
      closePanel();
    }
  });

  requestAnimationFrame(tick);
})();
