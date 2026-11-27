// Gobble Getaway — screenshot mode. ?shot=start|play|caught|escaped&seed=N
// puts the game in a fixed, deterministic state so the maker's screenshots
// are real renders of this code. Also drives scripted play for the play shot.
(function (global) {
  'use strict';

  var CFG = global.GG_CONFIG;

  function parseQuery() {
    var out = {};
    var q = window.location.search.replace(/^\?/, '');
    if (!q) return out;
    var parts = q.split('&');
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split('=');
      out[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    }
    return out;
  }

  // Scripted turkey for the play shot. Jumps are timed, not spaced: the
  // turkey jumps when the obstacle is ~0.47 s away (one jump's flight).
  // The double jump is reserved for a DIFFERENT obstacle than the one the
  // first jump is clearing — spending both hops on one hazard is what
  // used to get the turkey killed by the next one.
  function makeAutoPlay(seed) {
    var jumpTimer = 0.4;
    var hidOnce = false;
    var jumpTarget = null;
    return function (dt, game) {
      jumpTimer -= dt;
      var turkey = game.turkey;
      var world = game.world;
      var speed = game.speed();
      if (turkey.onGround()) jumpTarget = null;
      for (var i = 0; i < world.obstacles.length; i++) {
        var o = world.obstacles[i];
        var dist = o.x - turkey.x;
        if (dist < 0 || dist > 320) continue;
        var t = dist / Math.max(1, speed); // seconds until the turkey arrives
        if (o.kind === 'fence' || o.kind === 'pumpkin' || o.kind === 'knife' || o.kind === 'oven') {
          if (o.kind === 'knife' && !(o.warn <= 0 || o.landed)) continue;
          if (t < 0.42 && turkey.onGround() && jumpTimer <= 0) {
            if (turkey.jump()) { game.sound.jump(); jumpTimer = 0.2; jumpTarget = o; return; }
          }
          // Second hop, only for a new obstacle the current jump will NOT
          // clear: predict the turkey's feet at the END of the collision
          // window (when its tail has passed the hazard) and hop only when
          // they would dip into the hazard.
          if (t < 0.35 && turkey.jumps === 1 && o !== jumpTarget) {
            var heights = { fence: 40, pumpkin: 30, knife: 44, oven: 52 };
            var need = heights[o.kind] || 40;
            if (o.kind === 'oven') need = 52 + 40 * o.flame;
            var rear = { fence: 46, pumpkin: 44, knife: 29, oven: 54 }[o.kind] || 40;
            var tEnd = (dist + rear) / Math.max(1, speed);
            var yArr = turkey.y + turkey.vy * tEnd + 0.5 * CFG.PLAYER.gravity * tEnd * tEnd;
            if (CFG.GROUND_Y - yArr < need + 20) {
              if (turkey.jump()) { game.sound.jump(); jumpTimer = 0.2; jumpTarget = o; return; }
            }
          }
        } else if (o.kind === 'haystack') {
          if (!hidOnce && dist < 90 && dist > 0 && game.farmer.gap < 15) {
            hidOnce = true;
            game.pressHide();
            jumpTimer = 1.4;
            return;
          }
        }
      }
      // Corn overhead: hop for it now and then.
      if (turkey.onGround() && jumpTimer <= 0 && game.rng.chance(0.02)) {
        if (turkey.jump()) { game.sound.jump(); jumpTimer = 1.2; }
      }
    };
  }

  // Apply a shot mode to a fresh game. Returns true when a mode was set.
  function applyShot(game, query) {
    var shot = query.shot;
    if (!shot) return false;
    var seed = parseInt(query.seed || '7', 10) || 7;
    game.shotMode = shot;

    if (shot === 'start') {
      game.reset(seed);
      game.state = 'title';
      return true;
    }
    if (shot === 'play') {
      var stage = parseInt(query.stage || '0', 10) || 0;
      game.startRun(seed);
      game.autoPlay = makeAutoPlay(seed);
      // Fast-forward into the requested stage so the shot shows it.
      var target = stage === 2 ? 640 : stage === 1 ? 340 : 150;
      var guard = 0;
      while (game.distance < target && guard < 6000 && game.state === 'playing') {
        game.update(1 / 60);
        guard++;
      }
      return true;
    }
    if (shot === 'caught') {
      game.startRun(seed);
      game.autoPlay = makeAutoPlay(seed);
      var g2 = 0;
      while (game.distance < 420 && g2 < 6000 && game.state === 'playing') {
        game.update(1 / 60);
        g2++;
      }
      // Force the caught ending with a lively score behind it.
      if (game.state === 'playing') {
        game.lives = 1;
        game.onHit();
      }
      return true;
    }
    if (shot === 'escaped') {
      game.startRun(seed);
      game.distance = CFG.ESCAPE_DISTANCE - 5;
      game.score = 12340;
      game.corn = 23;
      game.endRun(true);
      return true;
    }
    return false;
  }

  global.GG_SHOTS = { parseQuery: parseQuery, applyShot: applyShot };
})(typeof window !== 'undefined' ? window : globalThis);
