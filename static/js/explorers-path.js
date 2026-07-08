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

  // The path's own centerline, extracted from the real path artwork
  // (layer/IMG_6583.PNG) — percent-of-canvas coordinates on the shared
  // canvas every layer uses, ordered near (index 0, toward the viewer)
  // to far (last index, deeper into the forest). She's only ever placed
  // somewhere on this line — never free-roaming off the path.
  var PATH = [
    { x: 41.92, y: 99.76 }, { x: 44.17, y: 96.17 }, { x: 44.81, y: 92.47 },
    { x: 47.43, y: 89.44 }, { x: 50.76, y: 86.33 }, { x: 52.78, y: 82.86 },
    { x: 54.27, y: 79.02 }, { x: 53.6, y: 75.03 }, { x: 50.9, y: 71.58 },
    { x: 46.9, y: 68.88 }, { x: 42.85, y: 66.23 }, { x: 40.39, y: 62.69 },
    { x: 40.79, y: 58.71 }, { x: 42.35, y: 55.13 }, { x: 45.4, y: 52.82 },
    { x: 48.97, y: 50.06 }, { x: 52.97, y: 47.38 }, { x: 57.41, y: 45.16 },
    { x: 61.76, y: 42.82 }, { x: 65.86, y: 40.24 }, { x: 70.33, y: 38.01 },
    { x: 74.7, y: 35.71 }, { x: 79.21, y: 33.54 }, { x: 83.85, y: 31.57 },
    { x: 88.43, y: 29.45 }, { x: 92.33, y: 26.75 }, { x: 96.11, y: 23.96 },
    { x: 99.06, y: 20.72 },
  ];
  // Where she's actually drawn (girl.webp's own figure, same canvas) —
  // the reference point every translate is measured from, since the
  // layer renders her there "for free" with no transform at all.
  var NATURAL_X_PCT = 57.53;
  var NATURAL_Y_PCT = 47.23;
  var START_PROGRESS = 17; // closest PATH index to her drawn spot

  // .ep-viewport's aspect-ratio matches the canvas exactly, and the girl's
  // own layer (unlike the background layers) has no oversize margin — see
  // #ep-layer-girl in explorers-path.css — so canvas percent maps straight
  // to viewport percent with no scale-and-offset math needed.
  function canvasPctToScreen(xPct, yPct, rect) {
    return {
      x: (xPct / 100) * rect.width,
      y: (yPct / 100) * rect.height,
    };
  }

  function samplePath(progress) {
    var clamped = Math.max(0, Math.min(PATH.length - 1, progress));
    var i0 = Math.floor(clamped);
    var i1 = Math.min(PATH.length - 1, i0 + 1);
    var frac = clamped - i0;
    var p0 = PATH[i0];
    var p1 = PATH[i1];
    return { x: p0.x + (p1.x - p0.x) * frac, y: p0.y + (p1.y - p0.y) * frac };
  }

  // Girl's own walk state — she moves along PATH only. "progress" is a
  // float index into PATH (0 = nearest the viewer, PATH.length-1 =
  // furthest into the forest); "lateral" is a small bounded wobble
  // perpendicular to the path so A/D still does something without ever
  // sending her off the drawn trail.
  var MAX_PROGRESS_SPEED = 0.09; // PATH indices per frame
  var PROGRESS_ACCEL = 0.09; // fraction of max speed gained per frame while held
  var PROGRESS_FRICTION = 0.85;
  var MAX_LATERAL_SPEED = 0.05;
  var LATERAL_ACCEL = 0.09;
  var LATERAL_FRICTION = 0.85;
  var LATERAL_RANGE_PX = 16; // how far off the centerline A/D can wobble
  var FORWARD_SCALE_BOOST = 0.16; // walking "into the distance" shrinks her a touch

  var progress = START_PROGRESS;
  var progressVel = 0;
  var lateral = 0; // -1..1
  var lateralVel = 0;

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
    var rect = viewport.getBoundingClientRect();

    mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * LOOK_EASE;
    mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * LOOK_EASE;

    // Background: mouse-look parallax only, no keyboard influence.
    backgroundLayers.forEach(function (layer) {
      var factor = parseFloat(layer.getAttribute("data-factor")) || 0;
      var dx = -mouseCurrent.x * factor;
      var dy = -mouseCurrent.y * factor;
      layer.style.transform = "translate(" + dx + "px," + dy + "px)";
    });

    // Girl: walk along PATH only. W/S move her forward/back along the
    // centerline (accelerate/decay with friction, same feel as before);
    // A/D are a small perpendicular wobble, not free lateral roaming —
    // she never leaves the drawn trail.
    var wantProgress = 0;
    if (keys.forward) wantProgress += 1;
    if (keys.backward) wantProgress -= 1;
    progressVel += wantProgress * MAX_PROGRESS_SPEED * PROGRESS_ACCEL;
    progressVel *= PROGRESS_FRICTION;
    progressVel = Math.max(-MAX_PROGRESS_SPEED, Math.min(MAX_PROGRESS_SPEED, progressVel));
    progress = Math.max(0, Math.min(PATH.length - 1, progress + progressVel));

    var wantLateral = 0;
    if (keys.left) wantLateral -= 1;
    if (keys.right) wantLateral += 1;
    lateralVel += wantLateral * MAX_LATERAL_SPEED * LATERAL_ACCEL;
    lateralVel *= LATERAL_FRICTION;
    lateralVel = Math.max(-MAX_LATERAL_SPEED, Math.min(MAX_LATERAL_SPEED, lateralVel));
    lateral = Math.max(-1, Math.min(1, lateral + lateralVel));

    var isMoving = Math.abs(progressVel) > 0.002 || Math.abs(lateralVel) > 0.002;
    var bob = 0;
    if (isMoving) {
      walkPhase += WALK_BOB_SPEED;
      bob = Math.abs(Math.sin(walkPhase)) * -WALK_BOB_HEIGHT;
    }

    var jump = jumpOffset();
    var lookDx = -mouseCurrent.x * GIRL_LOOK_FACTOR;
    var lookDy = -mouseCurrent.y * GIRL_LOOK_FACTOR;

    var naturalScreen = canvasPctToScreen(NATURAL_X_PCT, NATURAL_Y_PCT, rect);
    var pathPoint = samplePath(progress);
    var pathScreen = canvasPctToScreen(pathPoint.x, pathPoint.y, rect);

    // Tangent direction of the path near `progress`, so the lateral
    // wobble sits perpendicular to wherever the trail is curving, not
    // always flat left/right.
    var ahead = samplePath(Math.min(PATH.length - 1, progress + 0.6));
    var behind = samplePath(Math.max(0, progress - 0.6));
    var aheadScreen = canvasPctToScreen(ahead.x, ahead.y, rect);
    var behindScreen = canvasPctToScreen(behind.x, behind.y, rect);
    var tdx = aheadScreen.x - behindScreen.x;
    var tdy = aheadScreen.y - behindScreen.y;
    var tlen = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
    var perpX = -tdy / tlen;
    var perpY = tdx / tlen;

    var pathOffsetX = pathScreen.x - naturalScreen.x + perpX * lateral * LATERAL_RANGE_PX;
    var pathOffsetY = pathScreen.y - naturalScreen.y + perpY * lateral * LATERAL_RANGE_PX;

    // Further into the forest (higher progress) reads as walking into
    // the distance, so she shrinks a touch; walking back toward index 0
    // (nearest the viewer) grows her back up.
    var depthFrac = (progress - START_PROGRESS) / (PATH.length - 1);
    var scale = 1 - depthFrac * FORWARD_SCALE_BOOST;

    var totalX = pathOffsetX + lookDx;
    var totalY = pathOffsetY + lookDy + bob + jump;

    girlLayer.style.transform =
      "translate(" + totalX + "px," + totalY + "px) scale(" + scale + ")";

    var girlScreenX = naturalScreen.x + totalX;
    var girlScreenY = naturalScreen.y + totalY;
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
