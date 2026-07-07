(function () {
  "use strict";

  var viewport = document.getElementById("ep-viewport");
  if (!viewport) return;

  var layers = Array.prototype.slice.call(viewport.querySelectorAll("[data-factor]"));
  var hotspots = Array.prototype.slice.call(viewport.querySelectorAll(".ep-hotspot"));
  var panel = document.getElementById("ep-panel");
  var panelContent = document.getElementById("ep-panel-content");
  var panelClose = document.getElementById("ep-panel-close");
  var discoveryAudio = document.getElementById("ep-audio-discovery");

  var PROXIMITY_PX = 70;
  var EASE = 0.08;

  var target = { x: 0, y: 0 };
  var current = { x: 0, y: 0 };
  var visited = {};
  var lastFocusedHotspot = null;

  function hotspotPosition(hotspot) {
    var rect = viewport.getBoundingClientRect();
    return {
      x: (parseFloat(hotspot.style.left) / 100) * rect.width,
      y: (parseFloat(hotspot.style.top) / 100) * rect.height,
    };
  }

  function updateProximity(pointerX, pointerY) {
    hotspots.forEach(function (hotspot) {
      var pos = hotspotPosition(hotspot);
      var dx = pointerX - pos.x;
      var dy = pointerY - pos.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      hotspot.classList.toggle("is-near", distance < PROXIMITY_PX);
    });
  }

  function tick() {
    current.x += (target.x - current.x) * EASE;
    current.y += (target.y - current.y) * EASE;

    layers.forEach(function (layer) {
      var factor = parseFloat(layer.getAttribute("data-factor")) || 0;
      var dx = -current.x * factor;
      var dy = -current.y * factor;
      layer.style.transform = "translate(" + dx + "px," + dy + "px)";
    });

    var rect = viewport.getBoundingClientRect();
    updateProximity((current.x + 0.5) * rect.width, (current.y + 0.5) * rect.height);

    requestAnimationFrame(tick);
  }

  viewport.addEventListener("mousemove", function (event) {
    var rect = viewport.getBoundingClientRect();
    target.x = (event.clientX - rect.left) / rect.width - 0.5;
    target.y = (event.clientY - rect.top) / rect.height - 0.5;
  });

  viewport.addEventListener("mouseleave", function () {
    target.x = 0;
    target.y = 0;
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
