(function () {
  "use strict";

  var viewport = document.getElementById("ep-viewport");
  var scene = document.getElementById("ep-scene");
  if (!viewport || !scene) return;

  var hotspots = Array.prototype.slice.call(viewport.querySelectorAll(".ep-hotspot"));
  var panel = document.getElementById("ep-panel");
  var panelContent = document.getElementById("ep-panel-content");
  var panelClose = document.getElementById("ep-panel-close");
  var footstepAudio = document.getElementById("ep-audio-footstep");
  var discoveryAudio = document.getElementById("ep-audio-discovery");

  var PROXIMITY_PX = 70;
  var EASE = 0.12;

  var cursorMarker = document.createElement("div");
  cursorMarker.className = "ep-cursor-marker";
  cursorMarker.setAttribute("aria-hidden", "true");
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
      scene.style.transform = "translate(" + -relX * 24 + "px, " + -relY * 24 + "px)";

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
