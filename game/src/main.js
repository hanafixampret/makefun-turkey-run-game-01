// Gobble Getaway — bootstrap: canvas, keyboard + mouse input, the loop.
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var game = new window.GG_GAME(canvas);

  // Screenshot mode (?shot=...) before the loop starts.
  var query = window.GG_SHOTS.parseQuery();
  window.GG_SHOTS.applyShot(game, query);
  window.__game = game; // handy for play-testing from the console

  function toCanvas(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height)
    };
  }

  document.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    var k = e.key;
    if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
      e.preventDefault();
      game.sound.ensure();
      game.pressJump();
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      game.pressSlide();
    } else if (k === 'h' || k === 'H') {
      game.pressHide();
    } else if (k === 'p' || k === 'P') {
      game.togglePause();
    } else if (k === 'm' || k === 'M') {
      game.sound.toggleMute();
    } else if (k === 'Enter') {
      game.sound.ensure();
      game.pressJump();
    }
  });

  canvas.addEventListener('mousedown', function (e) {
    game.sound.ensure();
    var p = toCanvas(e);
    game.clickAt(p.x, p.y);
  });

  // Keep the loop honest: cap the step so a hidden tab cannot teleport.
  function loop(ts) {
    game.frame(ts);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
