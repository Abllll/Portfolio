(function () {
  "use strict";

  var viewport = document.getElementById("ep-viewport");
  var world = document.getElementById("ep-world");
  if (!viewport || !world) return;

  var chapters = Array.prototype.slice.call(world.querySelectorAll(".ep-chapter"));
  var hotspots = Array.prototype.slice.call(world.querySelectorAll(".ep-hotspot"));
  var panel = document.getElementById("ep-panel");
  var panelContent = document.getElementById("ep-panel-content");
  var panelClose = document.getElementById("ep-panel-close");
  var footstepAudio = document.getElementById("ep-audio-footstep");
  var discoveryAudio = document.getElementById("ep-audio-discovery");

  var NUM_CHAPTERS = chapters.length;
  var STEP_PX = 8;
  var PROXIMITY_PX = 70;

  var position = 0; // px, 0 .. (worldWidth - viewportWidth)
  var viewportWidth = viewport.clientWidth;
  var worldWidth = viewportWidth * NUM_CHAPTERS;
  var heldKeys = { left: false, right: false };
  var rafId = null;
  var visited = {};
  var lastFocusedHotspot = null;

  function layoutWorld() {
    viewportWidth = viewport.clientWidth;
    worldWidth = viewportWidth * NUM_CHAPTERS;
    world.style.width = worldWidth + "px";
    chapters.forEach(function (chapter) {
      chapter.style.width = viewportWidth + "px";
    });
    position = Math.min(position, worldWidth - viewportWidth);
    applyPosition();
  }

  function applyPosition() {
    world.style.transform = "translateX(-" + position + "px)";
    updateProximity();
  }

  function hotspotWorldX(hotspot) {
    var chapter = hotspot.closest(".ep-chapter");
    var chapterIndex = chapters.indexOf(chapter);
    var xPercent = parseFloat(hotspot.style.left) || 0;
    return chapterIndex * viewportWidth + (xPercent / 100) * viewportWidth;
  }

  function updateProximity() {
    var explorerWorldX = position + viewportWidth / 2;
    hotspots.forEach(function (hotspot) {
      var dx = Math.abs(hotspotWorldX(hotspot) - explorerWorldX);
      hotspot.classList.toggle("is-near", dx < PROXIMITY_PX);
    });
  }

  function step() {
    var delta = 0;
    if (heldKeys.left) delta -= STEP_PX;
    if (heldKeys.right) delta += STEP_PX;
    if (delta !== 0) {
      position = Math.max(0, Math.min(worldWidth - viewportWidth, position + delta));
      applyPosition();
      playFootstep();
      rafId = requestAnimationFrame(step);
    } else {
      stopFootstep();
      rafId = null;
    }
  }

  function startMoving() {
    if (rafId === null) {
      rafId = requestAnimationFrame(step);
    }
  }

  function playFootstep() {
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
    if (panel && !panel.hidden) {
      if (event.key === "Escape") closePanel();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      heldKeys.left = true;
      startMoving();
    } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      heldKeys.right = true;
      startMoving();
    }
  });

  document.addEventListener("keyup", function (event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      heldKeys.left = false;
    } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      heldKeys.right = false;
    }
  });

  viewport.addEventListener("click", function (event) {
    if (event.target.closest(".ep-hotspot")) return;
    var rect = viewport.getBoundingClientRect();
    var clickX = event.clientX - rect.left;
    heldKeys.left = clickX < viewportWidth / 2;
    heldKeys.right = clickX >= viewportWidth / 2;
    startMoving();
    setTimeout(function () {
      heldKeys.left = false;
      heldKeys.right = false;
    }, 400);
  });

  window.addEventListener("resize", layoutWorld);
  layoutWorld();
})();
