// Gobble Getaway — the farmer. He never stops: he chases, he searches a
// haystack when the turkey hides, and he sprints for the final stretch.
// His gap (in metres behind the turkey) is the game's real health bar.
(function (global) {
  'use strict';

  var CFG = global.GG_CONFIG;

  function Farmer() {
    this.reset();
  }

  Farmer.prototype.reset = function () {
    this.gap = CFG.FARMER.startGap;
    this.state = 'chase'; // chase | search | sprint
    this.searchTimer = 0;
    this.runPhase = 0;
    this.spotted = false;
    this.spottedTimer = 0;
  };

  // Called when the turkey stumbles (hits an obstacle).
  Farmer.prototype.onStumble = function () {
    this.gap = Math.max(0, this.gap - CFG.FARMER.gainOnHit);
    this.spotted = true;
    this.spottedTimer = 1.2;
  };

  // The turkey ducked into a haystack: the farmer stops and looks around.
  Farmer.prototype.onHide = function () {
    if (this.state !== 'search') {
      this.state = 'search';
      this.searchTimer = 0;
    }
  };

  Farmer.prototype.update = function (dt, turkeyHidden, distance, speed) {
    var F = CFG.FARMER;
    this.runPhase += dt * (speed / 24);
    if (this.spottedTimer > 0) {
      this.spottedTimer -= dt;
      if (this.spottedTimer <= 0) this.spotted = false;
    }

    if (this.state === 'search') {
      this.searchTimer += dt;
      if (this.searchTimer >= F.searchTime) {
        // Gave up: the turkey slipped away while he searched.
        this.state = 'chase';
        this.gap = Math.min(F.startGap, this.gap + 9);
      }
      return;
    }

    if (turkeyHidden) { this.onHide(); return; }

    // Final stretch: the farmer smells dinner and sprints.
    var finalStretch = distance > CFG.ESCAPE_DISTANCE - 120;
    if (finalStretch && this.state !== 'sprint') this.state = 'sprint';

    if (this.state === 'sprint') {
      this.gap -= dt * 1.6;
    } else {
      // Creep forward slowly; running clean pushes him back.
      this.gap -= dt * F.gainPerSecond;
      this.gap += dt * F.recoverPerSecond * 0.6;
    }
    this.gap = Math.max(0, Math.min(F.startGap + 6, this.gap));
    if (this.gap < 9 && !this.spotted) {
      this.spotted = true;
      this.spottedTimer = 0.9;
    }
  };

  Farmer.prototype.caught = function () {
    return this.gap <= CFG.FARMER.catchGap;
  };

  // Screen x of the farmer, trailing behind the turkey.
  Farmer.prototype.screenX = function (turkeyX) {
    return turkeyX - 70 - this.gap * 9;
  };

  global.GG_FARMER = Farmer;
})(typeof window !== 'undefined' ? window : globalThis);
