// Gobble Getaway — the turkey: run, jump, double jump, slide and hide.
// Physics live here and nowhere else.
(function (global) {
  'use strict';

  var CFG = global.GG_CONFIG;

  function Turkey() {
    this.reset();
  }

  Turkey.prototype.reset = function () {
    this.x = CFG.PLAYER.x;
    this.y = CFG.GROUND_Y;
    this.vy = 0;
    this.width = CFG.PLAYER.width;
    this.height = CFG.PLAYER.height;
    this.jumps = 0;
    this.sliding = false;
    this.slideTimer = 0;
    this.hidden = false;
    this.hideTimer = 0;
    this.invulnerable = 0;
    this.runPhase = 0;
    this.dead = false;
  };

  Turkey.prototype.groundY = function () {
    return CFG.GROUND_Y - (this.sliding ? 14 : 0);
  };

  Turkey.prototype.onGround = function () {
    return this.y >= this.groundY() - 0.5;
  };

  Turkey.prototype.jump = function () {
    if (this.hidden || this.dead) return false;
    if (this.onGround()) {
      this.vy = CFG.PLAYER.jumpVelocity;
      this.jumps = 1;
      this.sliding = false;
      return true;
    }
    if (this.jumps === 1) {
      this.vy = CFG.PLAYER.doubleJumpVelocity;
      this.jumps = 2;
      return true;
    }
    return false;
  };

  Turkey.prototype.slide = function () {
    if (this.hidden || this.dead) return false;
    if (!this.onGround()) return false;
    this.sliding = true;
    this.slideTimer = CFG.PLAYER.slideTime;
    return true;
  };

  // Duck into a haystack. The farmer loses the trail while hidden.
  Turkey.prototype.hide = function () {
    if (this.dead || this.hidden || !this.onGround()) return false;
    this.hidden = true;
    this.hideTimer = 0;
    this.sliding = false;
    return true;
  };

  Turkey.prototype.emerge = function () {
    this.hidden = false;
    this.hideTimer = 0;
  };

  Turkey.prototype.hurt = function () {
    if (this.invulnerable > 0 || this.dead) return false;
    this.invulnerable = 1.4;
    this.vy = -260;
    return true;
  };

  Turkey.prototype.update = function (dt, speed) {
    if (this.dead) return;
    this.runPhase += dt * (this.onGround() ? speed / 22 : 4);
    if (this.invulnerable > 0) this.invulnerable -= dt;
    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.sliding = false;
    }
    if (this.hidden) this.hideTimer += dt;
    if (!this.onGround() || this.vy < 0) {
      this.vy += CFG.PLAYER.gravity * dt;
      this.y += this.vy * dt;
      if (this.y >= this.groundY()) {
        this.y = this.groundY();
        this.vy = 0;
        this.jumps = 0;
      }
    }
  };

  // Collision box, shrinking while sliding.
  Turkey.prototype.box = function () {
    if (this.sliding) {
      return { x: this.x - 22, y: this.y - 26, w: 48, h: 28 };
    }
    return { x: this.x - 20, y: this.y - 56, w: 44, h: 58 };
  };

  global.GG_TURKEY = Turkey;
})(typeof window !== 'undefined' ? window : globalThis);
