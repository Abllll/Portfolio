// static/js/mockup-carousel.js
// Drives which .bs-mockup-card is "active" (front/center, slot 0) in the
// Jar beat's screen-recording carousel. Each card carries a data-index
// (0-3, matching data-durations' order); this script only ever writes
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
  if (!cards.length) return;

  var durations = (carousel.dataset.durations || "")
    .split(",")
    .map(function (n) { return parseInt(n, 10) || 6000; });
  var pause = parseInt(carousel.dataset.pause, 10) || 3000;
  var count = cards.length;
  var active = 0;

  function applySlots() {
    cards.forEach(function (card) {
      var idx = parseInt(card.dataset.index, 10) || 0;
      card.dataset.slot = (idx - active + count) % count;
    });
  }

  // Waits out the current card's own clip length before advancing: after
  // the last card in the sequence (index count-1), that wait also
  // includes the extra data-pause, so the whole 4-clip cycle visibly
  // rests before looping back to the first clip.
  function advance() {
    var wait = (durations[active] || 6000) + (active === count - 1 ? pause : 0);
    window.setTimeout(function () {
      active = (active + 1) % count;
      applySlots();
      advance();
    }, wait);
  }

  applySlots();
  advance();
})();
