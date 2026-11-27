// Gobble Getaway — all sound is synthesized with WebAudio. No audio files,
// no network, nothing to load: every gobble, ding and alarm is an oscillator.
(function (global) {
  'use strict';

  function SoundBank() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  SoundBank.prototype.ensure = function () {
    if (!this.ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.25;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  SoundBank.prototype.toggleMute = function () {
    this.muted = !this.muted;
    return this.muted;
  };

  // One short oscillator blip: frequency slides from f0 to f1.
  SoundBank.prototype.blip = function (type, f0, f1, dur, vol, delay) {
    if (!this.ctx || this.muted) return;
    var t0 = this.ctx.currentTime + (delay || 0);
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    gain.gain.setValueAtTime(vol || 0.5, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain); gain.connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  };

  SoundBank.prototype.gobble = function () {
    // Three quick descending clucks: the turkey's signature.
    this.blip('square', 520, 300, 0.09, 0.35, 0);
    this.blip('square', 460, 260, 0.09, 0.35, 0.11);
    this.blip('square', 400, 220, 0.12, 0.35, 0.22);
  };

  SoundBank.prototype.jump = function () { this.blip('sine', 300, 620, 0.16, 0.4, 0); };
  SoundBank.prototype.slide = function () { this.blip('sawtooth', 220, 90, 0.18, 0.25, 0); };
  SoundBank.prototype.coin = function () {
    this.blip('sine', 880, 880, 0.07, 0.4, 0);
    this.blip('sine', 1320, 1320, 0.12, 0.4, 0.07);
  };
  SoundBank.prototype.thud = function () {
    this.blip('sine', 160, 50, 0.25, 0.7, 0);
    this.blip('sawtooth', 120, 60, 0.2, 0.3, 0);
  };
  SoundBank.prototype.alarm = function () {
    this.blip('square', 700, 700, 0.1, 0.3, 0);
    this.blip('square', 520, 520, 0.1, 0.3, 0.12);
    this.blip('square', 700, 700, 0.1, 0.3, 0.24);
  };
  SoundBank.prototype.whoosh = function () { this.blip('sawtooth', 900, 200, 0.22, 0.2, 0); };
  SoundBank.prototype.win = function () {
    var notes = [523, 659, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
      this.blip('triangle', notes[i], notes[i], 0.22, 0.45, i * 0.14);
    }
  };
  SoundBank.prototype.lose = function () {
    var notes = [392, 330, 262, 196];
    for (var i = 0; i < notes.length; i++) {
      this.blip('triangle', notes[i], notes[i] * 0.9, 0.28, 0.4, i * 0.18);
    }
  };
  SoundBank.prototype.click = function () { this.blip('sine', 600, 600, 0.05, 0.3, 0); };

  global.GG_SOUND = new SoundBank();
})(typeof window !== 'undefined' ? window : globalThis);
