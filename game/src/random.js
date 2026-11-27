// Gobble Getaway — seeded random numbers, so screenshot mode can replay
// the exact same run every time (deterministic shots, fair replays).
(function (global) {
  'use strict';

  // mulberry32: small, fast, deterministic.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seed) {
    var next = mulberry32(seed || 1);
    return {
      next: next,
      range: function (min, max) { return min + next() * (max - min); },
      int: function (min, max) { return Math.floor(min + next() * (max - min + 1)); },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      chance: function (p) { return next() < p; }
    };
  }

  global.GG_RNG = { makeRng: makeRng };
})(typeof window !== 'undefined' ? window : globalThis);
