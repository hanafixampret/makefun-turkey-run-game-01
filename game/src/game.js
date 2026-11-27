// Gobble Getaway — the game itself: state machine, loop, HUD, particles,
// screens. Title -> playing -> caught / escaped, with restart.
(function (global) {
  'use strict';

  var CFG = global.GG_CONFIG;
  var S = global.GG_SPRITES;

  function Game(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rng = global.GG_RNG.makeRng(1);
    this.turkey = new global.GG_TURKEY();
    this.farmer = new global.GG_FARMER();
    this.world = new global.GG_WORLD(this.rng);
    this.sound = global.GG_SOUND;
    this.state = 'title'; // title | playing | paused | caught | escaped
    this.distance = 0;
    this.score = 0;
    this.corn = 0;
    this.lives = CFG.START_LIVES;
    this.time = 0;
    this.best = 0;
    this.particles = [];
    this.floats = [];
    this.shake = 0;
    this.flash = 0;
    this.stageBanner = '';
    this.bannerTimer = 0;
    this.puddleSlow = 0;
    this.lastTs = 0;
    this.buttons = [];
    this.shotMode = null;
    this.autoPlay = null; // scripted inputs for screenshot mode
    this.demoClock = 0;
  }

  Game.prototype.reset = function (seed) {
    this.rng = global.GG_RNG.makeRng(seed || 1);
    this.turkey.reset();
    this.farmer.reset();
    this.world = new global.GG_WORLD(this.rng);
    this.distance = 0;
    this.score = 0;
    this.corn = 0;
    this.lives = CFG.START_LIVES;
    this.time = 0;
    this.particles = [];
    this.floats = [];
    this.shake = 0;
    this.flash = 0;
    this.stageBanner = 'FARMYARD';
    this.bannerTimer = 2.2;
    this.puddleSlow = 0;
    this.state = 'title';
  };

  Game.prototype.start = function () {
    this.reset(1);
    this.state = 'playing';
    this.sound.ensure();
    this.sound.gobble();
  };

  Game.prototype.startRun = function (seed) {
    this.reset(seed || 1);
    this.state = 'playing';
  };

  Game.prototype.togglePause = function () {
    if (this.state === 'playing') { this.state = 'paused'; return true; }
    if (this.state === 'paused') { this.state = 'playing'; return true; }
    return false;
  };

  Game.prototype.speed = function () {
    var stage = this.world.stageFor(this.distance);
    var s = stage.speed;
    if (this.puddleSlow > 0) s *= 0.55;
    if (this.turkey.hidden) s = 0;
    return s;
  };

  Game.prototype.addFeathers = function (x, y, n) {
    for (var i = 0; i < n; i++) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 220 - 40,
        life: 0.9, size: 3 + Math.random() * 4,
        color: ['#8a5a2b', '#c97e2e', '#f7e0a8'][i % 3]
      });
    }
  };

  Game.prototype.addFloat = function (x, y, text, color) {
    this.floats.push({ x: x, y: y, text: text, color: color, life: 1.1 });
  };

  Game.prototype.onHit = function () {
    this.lives -= 1;
    this.turkey.hurt();
    this.farmer.onStumble();
    this.shake = 0.35;
    this.flash = 0.25;
    this.sound.thud();
    this.addFeathers(this.turkey.x, this.turkey.y - 30, 14);
    this.addFloat(this.turkey.x, this.turkey.y - 70, '-1 LIFE', '#d93a2b');
    if (this.lives <= 0) this.endRun(false);
  };

  Game.prototype.endRun = function (escaped) {
    this.state = escaped ? 'escaped' : 'caught';
    this.turkey.dead = true;
    if (escaped) {
      this.score += CFG.SCORE.escapeBonus;
      this.sound.win();
    } else {
      this.sound.lose();
    }
    if (this.score > this.best) this.best = this.score;
  };

  Game.prototype.update = function (dt) {
    this.time += dt;
    if (this.state !== 'playing') return;
    if (this.shake > 0) this.shake -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    if (this.puddleSlow > 0) this.puddleSlow -= dt;

    // Scripted inputs in screenshot mode.
    if (this.autoPlay) this.autoPlay(dt, this);

    var speed = this.speed();
    var stageIdx = this.world.stageIndexFor(this.distance);
    if (stageIdx !== this.world.stageIndex) {
      this.world.stageIndex = stageIdx;
      var st = CFG.STAGES[stageIdx];
      this.stageBanner = st.name;
      this.bannerTimer = 2.2;
      this.sound.alarm();
      this.addFloat(480, 200, st.name + '!', '#fff2cf');
    }

    this.distance += (speed * dt) / 10; // 10 px = 1 metre
    this.score += speed * dt / 10 * CFG.SCORE.perMetre;
    this.turkey.update(dt, speed);
    this.world.update(dt, this.distance, speed, this.turkey);

    var hit = this.world.collide(this.turkey);
    if (hit === 'hit') this.onHit();
    else if (hit === 'puddle') { this.puddleSlow = 0.7; }
    else if (hit && hit.indexOf('pickup:') === 0) {
      var kind = hit.slice(7);
      if (kind === 'corn') {
        this.score += CFG.SCORE.corn; this.corn += 1;
        this.sound.coin();
        this.addFloat(this.turkey.x + 30, this.turkey.y - 70, '+50', '#ffd94a');
      } else if (kind === 'pie') {
        this.score += CFG.SCORE.pie;
        this.sound.coin();
        this.addFloat(this.turkey.x + 30, this.turkey.y - 70, '+150 PIE!', '#ff9d5c');
      }
    }

    // Hiding: while hidden the farmer searches and the world waits.
    if (this.turkey.hidden) {
      if (this.turkey.hideTimer > 2.2) this.turkey.emerge();
    }

    this.farmer.update(dt, this.turkey.hidden, this.distance, speed);
    if (this.farmer.caught()) this.endRun(false);
    if (this.distance >= CFG.ESCAPE_DISTANCE) this.endRun(true);

    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (var j = this.floats.length - 1; j >= 0; j--) {
      var f = this.floats[j];
      f.life -= dt; f.y -= 34 * dt;
      if (f.life <= 0) this.floats.splice(j, 1);
    }
  };

  // ---- input ----------------------------------------------------------

  Game.prototype.pressJump = function () {
    if (this.state === 'title') { this.start(); return; }
    if (this.state === 'caught' || this.state === 'escaped') { this.start(); return; }
    if (this.state !== 'playing') return;
    if (this.turkey.jump()) this.sound.jump();
  };

  Game.prototype.pressSlide = function () {
    if (this.state !== 'playing') return;
    if (this.turkey.slide()) this.sound.slide();
  };

  Game.prototype.pressHide = function () {
    if (this.state !== 'playing') return;
    var hay = this.world.nearHaystack(this.turkey);
    if (hay && this.turkey.hide()) {
      this.sound.whoosh();
      this.addFloat(this.turkey.x, this.turkey.y - 80, 'HIDDEN!', '#cfe8a8');
    }
  };

  Game.prototype.clickAt = function (x, y) {
    // Buttons first (title / end screens).
    for (var i = 0; i < this.buttons.length; i++) {
      var b = this.buttons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.sound.click();
        b.action();
        return;
      }
    }
    if (this.state === 'playing') this.pressJump();
  };

  // ---- drawing ---------------------------------------------------------

  Game.prototype.draw = function () {
    var ctx = this.ctx;
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake * 30, (Math.random() - 0.5) * this.shake * 30);
    }
    var stage = this.world.stageFor(this.distance);
    S.drawBackground(ctx, stage, this.distance, this.time);

    if (this.state === 'title') { this.drawTitle(ctx); ctx.restore(); return; }

    // World.
    var S2 = S;
    for (var i = 0; i < this.world.obstacles.length; i++) {
      var o = this.world.obstacles[i];
      if (o.kind === 'fence') S2.drawFence(ctx, o.x, o.y);
      else if (o.kind === 'pumpkin') { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.roll); S2.drawPumpkin(ctx, 0, 0, 20); ctx.restore(); }
      else if (o.kind === 'knife') {
        if (o.warn > 0) {
          ctx.fillStyle = 'rgba(217,58,43,0.35)';
          ctx.fillRect(o.x - 16, CFG.GROUND_Y - 4, 32, 4);
          ctx.fillStyle = '#d93a2b';
          ctx.font = 'bold 20px Georgia'; ctx.textAlign = 'center';
          ctx.fillText('!', o.x, CFG.GROUND_Y - 12);
        }
        if (!o.landed) S2.drawKnife(ctx, o.x, o.y + 22, 0.12);
        else S2.drawKnife(ctx, o.x, o.y + 22, 1.35);
      }
      else if (o.kind === 'oven') S2.drawOven(ctx, o.x, o.y, o.flame);
      else if (o.kind === 'puddle') {
        ctx.fillStyle = 'rgba(90,140,200,0.75)';
        ctx.beginPath(); ctx.ellipse(o.x, o.y - 2, 46, 7, 0, 0, Math.PI * 2); ctx.fill();
      }
      else if (o.kind === 'haystack') S2.drawHaystack(ctx, o.x, o.y);
    }
    for (var j = 0; j < this.world.pickups.length; j++) {
      var p = this.world.pickups[j];
      if (p.taken) continue;
      var bob = Math.sin(this.time * 4 + j) * 4;
      if (p.kind === 'corn') S2.drawCorn(ctx, p.x, p.y, bob);
      else S2.drawPie(ctx, p.x, p.y, bob);
    }
    if (this.distance > CFG.ESCAPE_DISTANCE - 60) {
      S2.drawGate(ctx, 940 - (CFG.ESCAPE_DISTANCE - this.distance) * 10, CFG.GROUND_Y);
    }

    // Farmer trails behind, off-screen left when the gap is wide.
    var fx = this.farmer.screenX(this.turkey.x);
    if (fx > -80) {
      S.drawFarmer(ctx, fx, CFG.GROUND_Y, 1, this.farmer.runPhase, this.farmer.state === 'search' ? 'search' : 'chase');
    }

    // The turkey (hidden inside a haystack: just a tuft + eyes).
    if (this.turkey.hidden) {
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath(); ctx.ellipse(this.turkey.x, CFG.GROUND_Y - 26, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d1d1d';
      ctx.beginPath(); ctx.arc(this.turkey.x - 3, CFG.GROUND_Y - 28, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(this.turkey.x + 3, CFG.GROUND_Y - 28, 1.8, 0, Math.PI * 2); ctx.fill();
    } else if (!(this.turkey.invulnerable > 0 && Math.floor(this.time * 12) % 2 === 0)) {
      S.drawTurkey(ctx, this.turkey.x, this.turkey.y, 1, this.turkey.runPhase, this.turkey.sliding, false);
    }

    for (var k = 0; k < this.particles.length; k++) {
      var pt = this.particles[k];
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 20px Georgia'; ctx.textAlign = 'center';
    for (var m = 0; m < this.floats.length; m++) {
      var fl = this.floats[m];
      ctx.globalAlpha = Math.max(0, fl.life);
      ctx.fillStyle = fl.color;
      ctx.fillText(fl.text, fl.x, fl.y);
    }
    ctx.globalAlpha = 1;

    this.drawHud(ctx);
    if (this.state === 'paused') this.drawPaused(ctx);
    if (this.state === 'caught') this.drawCaught(ctx);
    if (this.state === 'escaped') this.drawEscaped(ctx);
    if (this.bannerTimer > 0 && this.state === 'playing') {
      ctx.globalAlpha = Math.min(1, this.bannerTimer);
      ctx.font = 'bold 44px Georgia'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fff2cf';
      ctx.strokeStyle = '#5a2c12'; ctx.lineWidth = 6;
      ctx.strokeText(this.stageBanner, 480, 150);
      ctx.fillText(this.stageBanner, 480, 150);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(217,58,43,' + (this.flash * 0.9) + ')';
      ctx.fillRect(0, 0, 960, 540);
    }
  };

  Game.prototype.hudPanel = function (ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(43,26,14,0.72)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10); else ctx.rect(x, y, w, h);
    ctx.fill();
  };

  Game.prototype.drawHud = function (ctx) {
    var stage = this.world.stageFor(this.distance);
    this.hudPanel(ctx, 12, 10, 330, 66);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 15px Georgia';
    ctx.fillText('SCORE  ' + Math.floor(this.score), 26, 32);
    ctx.fillStyle = '#fff2cf';
    ctx.font = '15px Georgia';
    ctx.fillText('DIST  ' + Math.floor(this.distance) + ' m / ' + CFG.ESCAPE_DISTANCE + ' m', 26, 56);
    ctx.fillStyle = '#ffd94a';
    ctx.fillText('CORN  ' + this.corn, 26, 74 - 6 + 6);
    // Lives as feathers.
    for (var i = 0; i < CFG.START_LIVES; i++) {
      var lx = 250 + i * 30;
      ctx.fillStyle = i < this.lives ? '#e8722a' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.ellipse(lx, 30, 7, 12, -0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff2cf';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText(stage.name, 250, 58);

    // Farmer gap meter, bottom of the screen.
    this.hudPanel(ctx, 12, 500, 330, 28);
    ctx.fillStyle = '#d93a2b';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText('FARMER', 24, 519);
    var gapW = 190;
    var frac = this.farmer.gap / (CFG.FARMER.startGap + 6);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(104, 508, gapW, 12);
    ctx.fillStyle = this.farmer.gap < 9 ? '#d93a2b' : '#e8722a';
    ctx.fillRect(104, 508, gapW * frac, 12);
    ctx.fillStyle = '#fff2cf';
    ctx.font = '13px Georgia';
    ctx.fillText(Math.max(0, Math.floor(this.farmer.gap)) + 'm', 302, 519);

    if (this.farmer.spotted && this.state === 'playing') {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.time * 14);
      ctx.fillStyle = '#d93a2b';
      ctx.font = 'bold 30px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('SPOTTED! RUN!', 480, 110);
      ctx.globalAlpha = 1;
    }

    // Sound + pause hints, top right.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,242,207,0.85)';
    ctx.font = '13px Georgia';
    ctx.fillText(this.sound.muted ? 'MUTED (M)' : 'SOUND ON (M)', 948, 30);
    ctx.fillText('P = PAUSE', 948, 50);
  };

  Game.prototype.bigButton = function (ctx, x, y, w, h, label, action) {
    ctx.fillStyle = '#c94f38';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10); else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.strokeStyle = '#fff2cf'; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff2cf';
    ctx.font = 'bold 22px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 8);
    this.buttons.push({ x: x, y: y, w: w, h: h, action: action });
  };

  Game.prototype.drawTitle = function (ctx) {
    var self = this;
    this.buttons = [];
    var stage = CFG.STAGES[0];
    S.drawBackground(ctx, stage, 0, this.time);
    S.drawHaystack(ctx, 830, CFG.GROUND_Y);
    S.drawTurkey(ctx, 200, CFG.GROUND_Y, 1.6, this.time * 6, false, false);
    S.drawFarmer(ctx, 780, CFG.GROUND_Y, 1.4, this.time * 5, 'chase');
    S.drawOven(ctx, 880, CFG.GROUND_Y, 0.6);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(43,26,14,0.55)';
    ctx.fillRect(120, 60, 720, 190);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 58px Georgia';
    ctx.fillText('GOBBLE GETAWAY', 480, 125);
    ctx.fillStyle = '#fff2cf';
    ctx.font = 'italic 22px Georgia';
    ctx.fillText('The Great Thanksgiving Escape', 480, 160);
    ctx.font = '17px Georgia';
    ctx.fillText('Thanksgiving is coming. The farmer has the oven hot and', 480, 200);
    ctx.fillText('the carving knife sharp. Run 900 metres to the forest gate —', 480, 224);
    ctx.fillText('jump the fences, dodge the knives, hide in the hay.', 480, 248);

    ctx.fillStyle = '#fff2cf';
    ctx.font = '15px Georgia';
    ctx.fillText('SPACE jump (x2)  ·  DOWN slide  ·  H hide  ·  P pause', 480, 300);

    this.bigButton(ctx, 380, 330, 200, 52, '▶  START RUN', function () { self.start(); });
    ctx.fillStyle = '#fff2cf';
    ctx.font = '14px Georgia';
    ctx.fillText('Best score this session: ' + this.best, 480, 420);
  };

  Game.prototype.drawPaused = function (ctx) {
    ctx.fillStyle = 'rgba(43,26,14,0.6)';
    ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff2cf';
    ctx.font = 'bold 44px Georgia';
    ctx.fillText('PAUSED', 480, 250);
    ctx.font = '18px Georgia';
    ctx.fillText('Press P to keep running', 480, 290);
  };

  Game.prototype.endPanel = function (ctx, title, titleColor, lines) {
    var self = this;
    this.buttons = [];
    ctx.fillStyle = 'rgba(43,26,14,0.72)';
    ctx.fillRect(180, 110, 600, 300);
    ctx.textAlign = 'center';
    ctx.fillStyle = titleColor;
    ctx.font = 'bold 46px Georgia';
    ctx.fillText(title, 480, 175);
    ctx.fillStyle = '#fff2cf';
    ctx.font = '19px Georgia';
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 480, 220 + i * 28);
    }
    ctx.font = 'bold 20px Georgia';
    ctx.fillStyle = '#ffd98a';
    ctx.fillText('SCORE ' + Math.floor(this.score) + '   ·   DISTANCE ' + Math.floor(this.distance) + ' m', 480, 220 + lines.length * 28 + 12);
    this.bigButton(ctx, 380, 330, 200, 52, '↻  RUN AGAIN', function () { self.start(); });
  };

  Game.prototype.drawCaught = function (ctx) {
    S.drawFarmer(ctx, 640, CFG.GROUND_Y, 1.5, 0, 'caught');
    this.endPanel(ctx, 'CAUGHT!', '#ff6b4a', [
      'The farmer got you. The oven was already hot,',
      'the knife already sharp. Thanksgiving dinner',
      'is served — and it was you.'
    ]);
  };

  Game.prototype.drawEscaped = function (ctx) {
    ctx.fillStyle = 'rgba(47,107,47,0.35)';
    ctx.fillRect(0, 0, 960, 540);
    this.endPanel(ctx, 'ESCAPED!', '#9fe870', [
      'You made it to the forest gate, feathers intact,',
      'corn in your beak and the farmer far behind.',
      'This Thanksgiving, the turkey eats too.'
    ]);
  };

  // Main loop driver.
  Game.prototype.frame = function (ts) {
    var dt = Math.min(0.05, (ts - (this.lastTs || ts)) / 1000 || 0);
    this.lastTs = ts;
    this.update(dt);
    this.draw();
  };

  global.GG_GAME = Game;
})(typeof window !== 'undefined' ? window : globalThis);
