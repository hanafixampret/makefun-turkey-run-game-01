// Gobble Getaway — the world: what spawns, where it sits, what it does
// when the turkey meets it. Stages change the hazard mix as you run.
(function (global) {
  'use strict';

  var CFG = global.GG_CONFIG;

  function World(rng) {
    this.rng = rng;
    this.reset();
  }

  World.prototype.reset = function () {
    this.obstacles = []; // {kind, x, y, w, h, ...}
    this.pickups = [];   // {kind, x, y, taken}
    this.nextSpawnAt = 26; // first hazard ~26 m in, not a long empty runway
    this.stageIndex = 0;
    this.stageAnnounced = -1;
    this.knifeFall = null;
  };

  World.prototype.stageFor = function (distance) {
    var stages = CFG.STAGES;
    for (var i = stages.length - 1; i >= 0; i--) {
      if (distance >= stages[i].from) return stages[i];
    }
    return stages[0];
  };

  World.prototype.stageIndexFor = function (distance) {
    var stages = CFG.STAGES;
    for (var i = stages.length - 1; i >= 0; i--) {
      if (distance >= stages[i].from) return i;
    }
    return 0;
  };

  // Spawn one hazard or pickup just off the right edge.
  World.prototype.spawn = function (distance, speed) {
    var stage = this.stageFor(distance);
    var x = 1000;
    var kind = this.rng.pick(stage.hazards);
    var gap = this.rng.range(stage.spawnGap[0], stage.spawnGap[1]);
    this.nextSpawnAt = distance + gap / 10;

    if (kind === 'fence') {
      this.obstacles.push({ kind: 'fence', x: x, y: CFG.GROUND_Y, w: 52, h: 40, passed: false });
    } else if (kind === 'pumpkin') {
      this.obstacles.push({ kind: 'pumpkin', x: x, y: CFG.GROUND_Y, w: 44, h: 34, roll: 0, passed: false });
    } else if (kind === 'knife') {
      // A carving knife falls from above onto a marked spot: jump over it.
      var lx = x + this.rng.range(0, 120);
      this.obstacles.push({ kind: 'knife', x: lx, y: -30, w: 22, h: 44, vy: 0, landed: false, warn: 0.7, passed: false });
    } else if (kind === 'oven') {
      this.obstacles.push({ kind: 'oven', x: x, y: CFG.GROUND_Y, w: 68, h: 52, flame: 0, cycle: this.rng.range(0, 1.6), passed: false });
    } else if (kind === 'puddle') {
      this.obstacles.push({ kind: 'puddle', x: x, y: CFG.GROUND_Y, w: 90, h: 10, passed: false });
    }

    // Corn trails and the occasional pie, floating above the path.
    if (this.rng.chance(0.55)) {
      var n = this.rng.int(2, 4);
      for (var i = 0; i < n; i++) {
        this.pickups.push({ kind: 'corn', x: x + 40 + i * 42, y: CFG.GROUND_Y - 90 - this.rng.range(0, 40), taken: false });
      }
    }
    if (this.rng.chance(0.16)) {
      this.pickups.push({ kind: 'pie', x: x + 200, y: CFG.GROUND_Y - 120, taken: false });
    }
    // A haystack to hide in, now and then, before the kitchen.
    if (distance < 600 && this.rng.chance(0.22)) {
      this.obstacles.push({ kind: 'haystack', x: x + 260, y: CFG.GROUND_Y, w: 68, h: 48, passed: false });
    }
  };

  World.prototype.update = function (dt, distance, speed, turkey) {
    var stage = this.stageFor(distance);
    var dx = speed * dt;
    if (distance >= this.nextSpawnAt) this.spawn(distance, speed);

    for (var i = this.obstacles.length - 1; i >= 0; i--) {
      var o = this.obstacles[i];
      o.x -= dx;
      if (o.kind === 'pumpkin') o.roll += dt * 9;
      if (o.kind === 'knife' && !o.landed) {
        if (o.warn > 0) { o.warn -= dt; }
        else {
          o.vy += 2600 * dt;
          o.y += o.vy * dt;
          if (o.y >= CFG.GROUND_Y - 44) { o.y = CFG.GROUND_Y - 44; o.landed = true; }
        }
      }
      if (o.kind === 'oven') {
        o.cycle += dt;
        var ph = o.cycle % 2.4;
        o.flame = ph < 1.2 ? Math.min(1, ph * 3) : Math.max(0, 1 - (ph - 1.2) * 2);
      }
      if (o.x < -120) this.obstacles.splice(i, 1);
    }
    for (var j = this.pickups.length - 1; j >= 0; j--) {
      this.pickups[j].x -= dx;
      if (this.pickups[j].x < -40) this.pickups.splice(j, 1);
    }
  };

  function boxesOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Returns 'hit' | 'puddle' | 'hide-spot' | null, and marks pickups taken.
  World.prototype.collide = function (turkey) {
    var tb = turkey.box();
    var result = null;
    for (var i = 0; i < this.obstacles.length; i++) {
      var o = this.obstacles[i];
      var ob;
      if (o.kind === 'fence') ob = { x: o.x - 26, y: o.y - 40, w: 52, h: 40 };
      else if (o.kind === 'pumpkin') ob = { x: o.x - 20, y: o.y - 30, w: 40, h: 32 };
      else if (o.kind === 'knife') ob = { x: o.x - 9, y: o.y, w: 18, h: 44 };
      else if (o.kind === 'oven') {
        if (o.flame > 0.25) ob = { x: o.x - 30, y: o.y - 52 - 40 * o.flame, w: 60, h: 52 + 40 * o.flame };
        else ob = { x: o.x - 30, y: o.y - 52, w: 60, h: 52 };
      }
      else if (o.kind === 'puddle') ob = { x: o.x - 45, y: o.y - 8, w: 90, h: 10 };
      else if (o.kind === 'haystack') continue; // shelter, not a hazard
      else continue;
      if (boxesOverlap(tb, ob)) {
        if (o.kind === 'puddle') { result = result || 'puddle'; continue; }
        if (!o.passed) { o.passed = true; result = 'hit'; }
      }
    }
    for (var j = 0; j < this.pickups.length; j++) {
      var p = this.pickups[j];
      if (!p.taken && boxesOverlap(tb, { x: p.x - 14, y: p.y - 14, w: 28, h: 28 })) {
        p.taken = true;
        result = result || 'pickup:' + p.kind;
      }
    }
    return result;
  };

  // Nearest haystack the turkey could duck into right now.
  World.prototype.nearHaystack = function (turkey) {
    for (var i = 0; i < this.obstacles.length; i++) {
      var o = this.obstacles[i];
      if (o.kind === 'haystack' && Math.abs(o.x - turkey.x) < 70) return o;
    }
    return null;
  };

  global.GG_WORLD = World;
})(typeof window !== 'undefined' ? window : globalThis);
