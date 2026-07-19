// static/js/mockup-carousel.js
// Drives which .bs-mockup-card is "active" (front/center, slot 0) in the
// Jar beat's screen-recording carousel. Each card carries a data-index
// (matching data-durations' order); this script only ever writes
// each card's data-slot attribute -- static/css/bonheur-story.css alone
// decides how each slot actually looks (size/position/opacity). Cards
// never reload or restart -- they're GIFs, already looping continuously
// via their own embedded loop count, so "playing in the background" is
// free; this only changes which one is enlarged up front.
(function () {
  "use strict";

  var carousel = document.querySelector(".bs-mockup-carousel");
  if (!carousel) return;

  var cards = Array.prototype.slice.call(carousel.querySelectorAll(".bs-mockup-card"));
  var copyItems = Array.prototype.slice.call(document.querySelectorAll(".bs-mockup-copy-item"));
  if (!cards.length) return;

  var durations = (carousel.dataset.durations || "")
    .split(",")
    .map(function (n) { return parseInt(n, 10) || 6000; });
  var pause = parseInt(carousel.dataset.pause, 10) || 3000;
  var count = cards.length;
  var active = 0;
  var advanceTimer = null;
  var dragStartX = null;
  var draggedCard = null;
  var DRAG_THRESHOLD = 45;
  var MAX_ACTIVE_DRAG = 220;

  function applySlots() {
    cards.forEach(function (card) {
      var idx = parseInt(card.dataset.index, 10) || 0;
      card.dataset.slot = (idx - active + count) % count;
    });
    copyItems.forEach(function (copy) {
      copy.classList.toggle("is-active", parseInt(copy.dataset.copyIndex, 10) === active);
    });
  }

  // Waits out the current card's own clip length before advancing: after
  // the last card in the sequence (index count-1), that wait also
  // includes the extra data-pause, so the whole 4-clip cycle visibly
  // rests before looping back to the first clip.
  function scheduleAdvance() {
    if (advanceTimer !== null) window.clearTimeout(advanceTimer);
    var wait = (durations[active] || 6000) + (active === count - 1 ? pause : 0);
    advanceTimer = window.setTimeout(function () {
      active = (active + 1) % count;
      applySlots();
      scheduleAdvance();
    }, wait);
  }

  function moveBy(direction) {
    active = (active + direction + count) % count;
    applySlots();
    scheduleAdvance();
  }

  carousel.addEventListener("pointerdown", function (event) {
    var card = event.target.closest(".bs-mockup-card");
    if (!card || card.dataset.slot !== "0") return;
    event.preventDefault();
    dragStartX = event.clientX;
    draggedCard = card;
    carousel.classList.add("is-dragging");
    carousel.setPointerCapture(event.pointerId);
    if (advanceTimer !== null) window.clearTimeout(advanceTimer);
  });

  carousel.addEventListener("pointermove", function (event) {
    if (dragStartX === null || !draggedCard) return;
    event.preventDefault();
    var distance = Math.max(-MAX_ACTIVE_DRAG, Math.min(MAX_ACTIVE_DRAG, event.clientX - dragStartX));
    draggedCard.style.setProperty("--bs-active-drag-x", distance.toFixed(1) + "px");
  });

  carousel.addEventListener("pointerup", function (event) {
    if (dragStartX === null) return;
    var distance = event.clientX - dragStartX;
    dragStartX = null;
    if (draggedCard) draggedCard.style.setProperty("--bs-active-drag-x", "0px");
    draggedCard = null;
    carousel.classList.remove("is-dragging");
    if (Math.abs(distance) >= DRAG_THRESHOLD) {
      moveBy(distance < 0 ? 1 : -1);
    } else {
      scheduleAdvance();
    }
  });

  carousel.addEventListener("pointercancel", function () {
    dragStartX = null;
    if (draggedCard) draggedCard.style.setProperty("--bs-active-drag-x", "0px");
    draggedCard = null;
    carousel.classList.remove("is-dragging");
    scheduleAdvance();
  });

  applySlots();
  scheduleAdvance();
})();
