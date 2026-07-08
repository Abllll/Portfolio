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
  var footstepAudio = document.getElementById("ep-audio-footstep");
  var controlsHint = document.getElementById("ep-controls-hint");

  var PROXIMITY_PX = 70;
  var LOOK_EASE = 0.08;
  var MAX_FACTOR = 50; // matches the girl layer's weight — the strongest mover
  var ZOOM_BOOST = 0.4; // max extra scale on the closest layer at full walk-in
  var ZOOM_EASE = 0.05;
  var PAN_EASE = 0.06;
  var PAN_RANGE = 0.6; // keyboard look-pan target range, same units as mouse look (-0.5..0.5-ish)

  // Mouse look (fine, continuous)
  var mouseTarget = { x: 0, y: 0 };
  var mouseCurrent = { x: 0, y: 0 };

  // Keyboard walk state
  var keys = { forward: false, backward: false, left: false, right: false };
  var zoomTarget = 0; // -0.3 (stepped back) .. 1 (walked in)
  var zoomCurrent = 0;
  var panTarget = 0; // keyboard look-pan, additive to mouse look
  var panCurrent = 0;
  var walking = false;

  // Jump: one-shot decaying bob applied to every layer's Y
  var jumpStart = null;
  var JUMP_DURATION = 480;
  var JUMP_HEIGHT = 22;

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

  function jumpOffset() {
    if (jumpStart === null) return 0;
    var t = (performance.now() - jumpStart) / JUMP_DURATION;
    if (t >= 1) {
      jumpStart = null;
      return 0;
    }
    // simple decaying sine arc: up then back down, easing out
    return -Math.sin(t * Math.PI) * JUMP_HEIGHT * (1 - t * 0.3);
  }

  function tick() {
    mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * LOOK_EASE;
    mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * LOOK_EASE;

    var panWanted = 0;
    if (keys.left) panWanted -= PAN_RANGE;
    if (keys.right) panWanted += PAN_RANGE;
    panTarget = panWanted;
    panCurrent += (panTarget - panCurrent) * PAN_EASE;

    var zoomWanted = 0;
    if (keys.forward) zoomWanted = 1;
    else if (keys.backward) zoomWanted = -0.3;
    zoomTarget = zoomWanted;
    zoomCurrent += (zoomTarget - zoomCurrent) * ZOOM_EASE;

    var bob = jumpOffset();
    var totalPanX = mouseCurrent.x + panCurrent;

    layers.forEach(function (layer) {
      var factor = parseFloat(layer.getAttribute("data-factor")) || 0;
      var dx = -totalPanX * factor;
      var dy = -mouseCurrent.y * factor + bob;
      var scale = 1 + zoomCurrent * (factor / MAX_FACTOR) * ZOOM_BOOST;
      layer.style.transform =
        "translate(" + dx + "px," + dy + "px) scale(" + scale + ")";
    });

    var rect = viewport.getBoundingClientRect();
    updateProximity((totalPanX + 0.5) * rect.width, (mouseCurrent.y + 0.5) * rect.height);

    requestAnimationFrame(tick);
  }

  viewport.addEventListener("mousemove", function (event) {
    var rect = viewport.getBoundingClientRect();
    mouseTarget.x = (event.clientX - rect.left) / rect.width - 0.5;
    mouseTarget.y = (event.clientY - rect.top) / rect.height - 0.5;
  });

  viewport.addEventListener("mouseleave", function () {
    mouseTarget.x = 0;
    mouseTarget.y = 0;
  });

  function playFootstep() {
    // footstepAudio has the `loop` attribute, so one play() call keeps it
    // going for as long as walking stays true — no need to re-trigger per
    // frame or per keydown repeat (which Playwright/some OSes don't emit).
    if (footstepAudio && footstepAudio.paused) {
      footstepAudio.currentTime = 0;
      footstepAudio.play().catch(function () {});
    }
  }

  function stopFootstep() {
    if (footstepAudio && !footstepAudio.paused) {
      footstepAudio.pause();
      footstepAudio.currentTime = 0;
    }
  }

  var WALK_KEYS = {
    w: "forward", W: "forward", ArrowUp: "forward",
    s: "backward", S: "backward", ArrowDown: "backward",
    a: "left", A: "left", ArrowLeft: "left",
    d: "right", D: "right", ArrowRight: "right",
  };

  document.addEventListener("keydown", function (event) {
    if (event.target.closest && event.target.closest(".ep-hotspot")) return;
    if (panel && !panel.hidden) return;

    var walkDir = WALK_KEYS[event.key];
    if (walkDir) {
      event.preventDefault();
      keys[walkDir] = true;
      if (walkDir === "forward" || walkDir === "backward") {
        walking = true;
        playFootstep();
      }
      dismissControlsHint();
      return;
    }
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      jumpStart = performance.now();
      dismissControlsHint();
    }
  });

  function dismissControlsHint() {
    if (controlsHint) controlsHint.classList.add("is-dismissed");
  }

  document.addEventListener("keyup", function (event) {
    var walkDir = WALK_KEYS[event.key];
    if (walkDir) {
      keys[walkDir] = false;
      if (!keys.forward && !keys.backward) {
        walking = false;
        stopFootstep();
      }
    }
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

    // release any held walk keys so movement doesn't continue under the modal
    keys.forward = keys.backward = keys.left = keys.right = false;
    walking = false;
    stopFootstep();

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
