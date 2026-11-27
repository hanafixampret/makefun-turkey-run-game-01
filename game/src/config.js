// Gobble Getaway — tuning, stages and palette. One place for every number
// the rest of the game reads, so the feel can be tuned without touching logic.
(function (global) {
  'use strict';

  var GROUND_Y = 470;
  var CANVAS_W = 960;
  var CANVAS_H = 540;
  var ESCAPE_DISTANCE = 900; // metres to the freedom gate
  var START_LIVES = 3;

  // Stages the turkey runs through: farmyard, barn, kitchen, then freedom.
  var STAGES = [
    {
      name: 'FARMYARD',
      from: 0, to: 300,
      speed: 250,
      sky: ['#ffd98a', '#f7b95c'],
      ground: '#a9713d', grass: '#7fae4c',
      hazards: ['fence', 'pumpkin', 'knife'],
      spawnGap: [170, 300]
    },
    {
      name: 'THE BARN',
      from: 300, to: 600,
      speed: 290,
      sky: ['#e8a35c', '#c97e3f'],
      ground: '#8a5a2e', grass: '#6f8f3e',
      hazards: ['fence', 'pumpkin', 'knife', 'puddle'],
      spawnGap: [170, 280]
    },
    {
      name: 'THE KITCHEN',
      from: 600, to: 900,
      speed: 330,
      sky: ['#d97b4f', '#a84f35'],
      ground: '#7d4a2c', grass: '#5d7a33',
      hazards: ['fence', 'knife', 'oven', 'puddle'],
      spawnGap: [160, 260]
    }
  ];

  var PLAYER = {
    x: 200,
    width: 54,
    height: 62,
    jumpVelocity: -700,
    doubleJumpVelocity: -620,
    gravity: 1900,
    slideTime: 0.55
  };

  var FARMER = {
    startGap: 26,      // metres behind the turkey at the start
    catchGap: 0,       // gap at or below this means caught
    gainOnHit: 5,      // metres the farmer gains when the turkey stumbles
    gainPerSecond: 0.55, // slow creep: dawdling gets you eaten
    recoverPerSecond: 1.6, // metres regained while running clean
    searchTime: 2.6    // seconds the farmer searches a haystack
  };

  var SCORE = {
    perMetre: 1,
    corn: 50,
    pie: 150,
    escapeBonus: 500
  };

  // Autumn palette shared by every sprite.
  var PALETTE = {
    turkeyBody: '#8a5a2b',
    turkeyDark: '#6b4420',
    turkeyLight: '#b98a4e',
    turkeyTail: '#c97e2e',
    wattle: '#d93a2b',
    beak: '#f2a541',
    farmerShirt: '#c94f38',
    farmerOveralls: '#3f6db3',
    farmerHat: '#e8c85a',
    knifeBlade: '#dfe6ea',
    knifeHandle: '#5a3a22',
    ovenBody: '#4a4a52',
    ovenGlow: '#ff7b2f',
    corn: '#ffd94a',
    hay: '#e0b64f'
  };

  global.GG_CONFIG = {
    GROUND_Y: GROUND_Y,
    CANVAS_W: CANVAS_W,
    CANVAS_H: CANVAS_H,
    ESCAPE_DISTANCE: ESCAPE_DISTANCE,
    START_LIVES: START_LIVES,
    STAGES: STAGES,
    PLAYER: PLAYER,
    FARMER: FARMER,
    SCORE: SCORE,
    PALETTE: PALETTE
  };
})(typeof window !== 'undefined' ? window : globalThis);
