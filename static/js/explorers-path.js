(function () {
  "use strict";

  var viewport = document.getElementById("ep-viewport");
  var girlLayer = document.getElementById("ep-layer-girl");
  if (!viewport || !girlLayer) return;

  // Background layers parallax with the mouse only — WASD is reserved for
  // moving the girl herself, not the camera/world (she's a real character
  // on her own layer, not a stand-in for cursor position).
  var backgroundLayers = Array.prototype.slice
    .call(viewport.querySelectorAll("[data-factor]"))
    .filter(function (el) {
      return el !== girlLayer;
    });
  var hotspots = Array.prototype.slice.call(viewport.querySelectorAll(".ep-hotspot"));
  var panel = document.getElementById("ep-panel");
  var panelContent = document.getElementById("ep-panel-content");
  var panelClose = document.getElementById("ep-panel-close");
  var discoveryAudio = document.getElementById("ep-audio-discovery");
  var footstepAudio = document.getElementById("ep-audio-footstep");
  var controlsHint = document.getElementById("ep-controls-hint");

  var PROXIMITY_PX = 70;
  var LOOK_EASE = 0.08;
  var GIRL_LOOK_FACTOR = 4; // she still rides the ground plane's subtle mouse parallax

  // Girl's own walk state — real translation, not a world-zoom illusion.
  var MOVE_RANGE_X = 110; // px either side of her drawn spot
  var MOVE_RANGE_Y_FWD = 130; // px "forward" (up-screen, further up the path)
  var MOVE_RANGE_Y_BACK = 70; // px "back" (down-screen, toward the viewer)
  var ACCEL = 0.09;
  var FRICTION = 0.85;
  var MAX_SPEED = 3.2; // px per frame
  var FORWARD_SCALE_BOOST = 0.16; // walking "into the distance" shrinks her a touch

  var girlPos = { x: 0, y: 0 };
  var girlVel = { x: 0, y: 0 };

  // Mouse look (fine, continuous, background only)
  var mouseTarget = { x: 0, y: 0 };
  var mouseCurrent = { x: 0, y: 0 };

  // Keyboard walk state
  var keys = { forward: false, backward: false, left: false, right: false };
  var walking = false;

  // Walking bob: small continuous bounce while she's actually moving.
  var walkPhase = 0;
  var WALK_BOB_HEIGHT = 4;
  var WALK_BOB_SPEED = 0.35;

  // Jump: one-shot decaying bob, applied on top of everything else.
  var jumpStart = null;
  var JUMP_DURATION = 420;
  var JUMP_HEIGHT = 26;

  var visited = {};
  var lastFocusedHotspot = null;

  function hotspotPosition(hotspot) {
    var rect = viewport.getBoundingClientRect();
    return {
      x: (parseFloat(hotspot.style.left) / 100) * rect.width,
      y: (parseFloat(hotspot.style.top) / 100) * rect.height,
    };
  }

  function updateProximity(girlScreenX, girlScreenY) {
    hotspots.forEach(function (hotspot) {
      var pos = hotspotPosition(hotspot);
      var dx = girlScreenX - pos.x;
      var dy = girlScreenY - pos.y;
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
    return -Math.sin(t * Math.PI) * JUMP_HEIGHT;
  }

  function tick() {
    mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * LOOK_EASE;
    mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * LOOK_EASE;

    // Background: mouse-look parallax only, no keyboard influence.
    backgroundLayers.forEach(function (layer) {
      var factor = parseFloat(layer.getAttribute("data-factor")) || 0;
      var dx = -mouseCurrent.x * factor;
      var dy = -mouseCurrent.y * factor;
      layer.style.transform = "translate(" + dx + "px," + dy + "px)";
    });

    // Girl: real WASD-driven walking, accelerate/decelerate with friction.
    var ax = 0;
    var ay = 0;
    if (keys.left) ax -= 1;
    if (keys.right) ax += 1;
    if (keys.forward) ay -= 1;
    if (keys.backward) ay += 1;

    if (ax !== 0 || ay !== 0) {
      var len = Math.sqrt(ax * ax + ay * ay);
      girlVel.x += (ax / len) * MAX_SPEED * ACCEL;
      girlVel.y += (ay / len) * MAX_SPEED * ACCEL;
    }
    girlVel.x *= FRICTION;
    girlVel.y *= FRICTION;
    girlVel.x = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, girlVel.x));
    girlVel.y = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, girlVel.y));

    girlPos.x = Math.max(-MOVE_RANGE_X, Math.min(MOVE_RANGE_X, girlPos.x + girlVel.x));
    girlPos.y = Math.max(-MOVE_RANGE_Y_FWD, Math.min(MOVE_RANGE_Y_BACK, girlPos.y + girlVel.y));

    var isMoving = Math.abs(girlVel.x) > 0.05 || Math.abs(girlVel.y) > 0.05;
    var bob = 0;
    if (isMoving) {
      walkPhase += WALK_BOB_SPEED;
      bob = Math.abs(Math.sin(walkPhase)) * -WALK_BOB_HEIGHT;
    }

    var jump = jumpOffset();
    var lookDx = -mouseCurrent.x * GIRL_LOOK_FACTOR;
    var lookDy = -mouseCurrent.y * GIRL_LOOK_FACTOR;

    // Walking further "forward" (negative y = further up the path) reads as
    // walking into the distance, so she shrinks a touch; stepping back
    // (positive y, toward the viewer) grows her back up slightly.
    var scale = 1;
    if (girlPos.y < 0) {
      scale = 1 - (-girlPos.y / MOVE_RANGE_Y_FWD) * FORWARD_SCALE_BOOST;
    } else if (girlPos.y > 0) {
      scale = 1 + (girlPos.y / MOVE_RANGE_Y_BACK) * (FORWARD_SCALE_BOOST * 0.5);
    }

    var totalX = girlPos.x + lookDx;
    var totalY = girlPos.y + lookDy + bob + jump;

    girlLayer.style.transform =
      "translate(" + totalX + "px," + totalY + "px) scale(" + scale + ")";

    var rect = viewport.getBoundingClientRect();
    var girlScreenX = rect.width / 2 + totalX;
    var girlScreenY = rect.height / 2 + totalY;
    updateProximity(girlScreenX, girlScreenY);

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

  function dismissControlsHint() {
    if (controlsHint) controlsHint.classList.add("is-dismissed");
  }

  document.addEventListener("keydown", function (event) {
    if (event.target.closest && event.target.closest(".ep-hotspot")) return;
    if (panel && !panel.hidden) return;

    var walkDir = WALK_KEYS[event.key];
    if (walkDir) {
      event.preventDefault();
      keys[walkDir] = true;
      if (!walking) {
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

  document.addEventListener("keyup", function (event) {
    var walkDir = WALK_KEYS[event.key];
    if (walkDir) {
      keys[walkDir] = false;
      if (!keys.forward && !keys.backward && !keys.left && !keys.right) {
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
