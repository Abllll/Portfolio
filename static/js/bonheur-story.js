// static/js/bonheur-story.js
// Toggles .is-visible on each beat as it scrolls into view, and keeps the
// persistent #bs-motif element's data-motif in sync with the beat currently
// in view. Loaded only on /work/bonheur/ (see layouts/work/bonheur-story.html).
(function () {
  "use strict";

  var motif = document.getElementById("bs-motif");
  var beats = document.querySelectorAll(".bs-beat");

  if (!motif || !beats.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        var nextMotif = entry.target.getAttribute("data-motif");
        if (nextMotif) {
          motif.setAttribute("data-motif", nextMotif);
        }
      });
    },
    { threshold: 0.5 }
  );

  beats.forEach(function (beat) {
    observer.observe(beat);
  });
})();

// Drives --bs-intro-progress (0-1) from how far the user has scrolled
// through #bs-intro. All visual behavior lives in bonheur-story.css as
// calc()/clamp() expressions reading this one property -- this script only
// computes and writes the number.
(function () {
  "use strict";

  var intro = document.getElementById("bs-intro");
  if (!intro) return;

  var tagline = document.querySelector(".bs-intro-tagline");
  var taglineFlickered = false;

  var ticking = false;

  function updateProgress() {
    ticking = false;
    var rect = intro.getBoundingClientRect();
    var scrollableDistance = rect.height - window.innerHeight;
    var progress = scrollableDistance > 0 ? (0 - rect.top) / scrollableDistance : 1;
    progress = Math.min(1, Math.max(0, progress));
    document.documentElement.style.setProperty("--bs-intro-progress", progress.toFixed(4));

    if (!taglineFlickered && tagline && progress >= 0.4) {
      taglineFlickered = true;
      tagline.classList.add("bs-intro-tagline--flicker");
    }
  }

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  updateProgress();
})();

// Deterministic 2D simplex noise (public-domain Gustavson algorithm), ported
// verbatim from the real Bonheur app's src/simplexNoise.js -- drives the
// living-light backdrop's mist-blob drift below. Skipped entirely under
// prefers-reduced-motion (the blobs are display:none anyway per the CSS, so
// this just avoids wasted per-frame work).
(function () {
  "use strict";

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var intro = document.getElementById("bs-intro");
  var blobs = document.querySelectorAll(".bs-intro-mist");
  if (!intro || !blobs.length) return;

  var bonWord = document.querySelector(".bs-intro-word--bon");
  var heurWord = document.querySelector(".bs-intro-word--heur");

  var GRAD2 = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [1, 0], [-1, 0],
    [0, 1], [0, -1], [0, 1], [0, -1],
  ];

  var PERM_BASE = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];

  var PERM = new Uint8Array(512);
  var PERM_MOD12 = new Uint8Array(512);
  for (var pi = 0; pi < 512; pi += 1) {
    PERM[pi] = PERM_BASE[pi & 255];
    PERM_MOD12[pi] = PERM[pi] % 12;
  }

  var F2 = 0.5 * (Math.sqrt(3) - 1);
  var G2 = (3 - Math.sqrt(3)) / 6;

  function dot2(g, x, y) { return g[0] * x + g[1] * y; }

  function simplex2(xin, yin) {
    var s = (xin + yin) * F2;
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var t = (i + j) * G2;
    var x0 = xin - (i - t);
    var y0 = yin - (j - t);

    var i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

    var x1 = x0 - i1 + G2;
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2;
    var y2 = y0 - 1 + 2 * G2;

    var ii = i & 255;
    var jj = j & 255;
    var gi0 = PERM_MOD12[ii + PERM[jj]];
    var gi1 = PERM_MOD12[ii + i1 + PERM[jj + j1]];
    var gi2 = PERM_MOD12[ii + 1 + PERM[jj + 1]];

    var n0 = 0, n1 = 0, n2 = 0;
    var t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot2(GRAD2[gi0], x0, y0); }
    var t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot2(GRAD2[gi1], x1, y1); }
    var t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot2(GRAD2[gi2], x2, y2); }

    return 70 * (n0 + n1 + n2);
  }

  var seeds = [11.3, 47.9, 83.1];
  var t = 0;

  function frame() {
    var rect = intro.getBoundingClientRect();
    var inView = rect.bottom > 0 && rect.top < window.innerHeight;
    if (inView) {
      t += 0.006;
      for (var i = 0; i < blobs.length; i += 1) {
        var seed = seeds[i % seeds.length];
        var nx = simplex2(t, seed);
        var ny = simplex2(t + 100, seed);
        var breathe = 0.3 + simplex2(t, seed + 5.7) * 0.05;
        blobs[i].style.setProperty("--bs-mist-x", (nx * 24).toFixed(2) + "px");
        blobs[i].style.setProperty("--bs-mist-y", (ny * 24).toFixed(2) + "px");
        blobs[i].style.setProperty("--bs-mist-breathe", Math.max(0.06, breathe).toFixed(3));
      }
      if (bonWord) {
        bonWord.style.setProperty("--bs-word-wobble-x", (simplex2(t, 200.1) * 5).toFixed(2) + "px");
        bonWord.style.setProperty("--bs-word-wobble-y", (simplex2(t, 300.7) * 5).toFixed(2) + "px");
      }
      if (heurWord) {
        heurWord.style.setProperty("--bs-word-wobble-x", (simplex2(t, 400.3) * 5).toFixed(2) + "px");
        heurWord.style.setProperty("--bs-word-wobble-y", (simplex2(t, 500.9) * 5).toFixed(2) + "px");
      }
    }
    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
})();
