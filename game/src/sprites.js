// Gobble Getaway — every picture is drawn in code. No image files, no
// network: the turkey, the farmer, the farm and the kitchen are all canvas.
(function (global) {
  'use strict';

  var P = global.GG_CONFIG.PALETTE;

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }

  function circle(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // The hero: Tom the turkey, mid-stride. runPhase drives the legs.
  function drawTurkey(ctx, x, y, scale, runPhase, sliding, hiding) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (sliding) ctx.translate(0, 14);
    var legSwing = Math.sin(runPhase) * 10;

    // Fan tail.
    ctx.fillStyle = P.turkeyTail;
    for (var i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(-16, -18);
      ctx.rotate(i * 0.38);
      ctx.beginPath(); ctx.ellipse(0, -20, 7, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = i % 2 === 0 ? P.turkeyTail : P.turkeyDark;
      ctx.restore();
    }
    ctx.fillStyle = P.turkeyDark;
    ctx.beginPath(); ctx.ellipse(-14, -16, 6, 18, 0, 0, Math.PI * 2); ctx.fill();

    // Legs.
    ctx.strokeStyle = '#e8a33d'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, 8); ctx.lineTo(-4 + legSwing, 24);
    ctx.moveTo(6, 8); ctx.lineTo(6 - legSwing, 24);
    ctx.stroke();

    // Body.
    ctx.fillStyle = P.turkeyBody;
    ellipse(ctx, 0, -6, 20, 17);
    ctx.fillStyle = P.turkeyLight;
    ellipse(ctx, 4, -2, 13, 11);

    // Wing.
    ctx.fillStyle = P.turkeyDark;
    ctx.beginPath(); ctx.ellipse(-2, -8, 11, 7, -0.4, 0, Math.PI * 2); ctx.fill();

    // Head + beak + wattle + eye.
    ctx.fillStyle = P.turkeyBody;
    circle(ctx, 16, -30, 10);
    ctx.fillStyle = P.beak;
    ctx.beginPath(); ctx.moveTo(24, -32); ctx.lineTo(34, -29); ctx.lineTo(24, -26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.wattle;
    ellipse(ctx, 22, -21, 3, 6);
    ctx.fillStyle = '#1d1d1d';
    circle(ctx, 19, -33, 2);
    // Panic feather on top.
    ctx.strokeStyle = P.turkeyDark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14, -39); ctx.quadraticCurveTo(10, -48, 16, -50); ctx.stroke();
    ctx.restore();
  }

  // The farmer: overalls, plaid shirt, straw hat, pitchfork. mood changes
  // his face: 'chase' (grim), 'search' (squinting), 'caught' (triumphant).
  function drawFarmer(ctx, x, y, scale, runPhase, mood) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    var legSwing = Math.sin(runPhase) * 9;

    // Legs (overalls).
    ctx.strokeStyle = P.farmerOveralls; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, -6); ctx.lineTo(-5 + legSwing, 22);
    ctx.moveTo(5, -6); ctx.lineTo(5 - legSwing, 22);
    ctx.stroke();

    // Torso: plaid shirt + overalls bib.
    ctx.fillStyle = P.farmerShirt;
    ctx.fillRect(-13, -38, 26, 34);
    ctx.strokeStyle = '#7e2a1e'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, -28); ctx.lineTo(13, -28);
    ctx.moveTo(-13, -16); ctx.lineTo(13, -16);
    ctx.moveTo(-4, -38); ctx.lineTo(-4, -4);
    ctx.moveTo(5, -38); ctx.lineTo(5, -4);
    ctx.stroke();
    ctx.fillStyle = P.farmerOveralls;
    ctx.fillRect(-9, -24, 18, 20);

    // Arm + pitchfork.
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(12, -32); ctx.lineTo(24, -52); ctx.stroke();
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(24, -52); ctx.lineTo(20, -62);
    ctx.moveTo(24, -52); ctx.lineTo(24, -63);
    ctx.moveTo(24, -52); ctx.lineTo(28, -62);
    ctx.stroke();

    // Head.
    ctx.fillStyle = '#f0c08a';
    circle(ctx, 0, -46, 11);
    // Straw hat.
    ctx.fillStyle = P.farmerHat;
    ellipse(ctx, 0, -52, 17, 5);
    ctx.fillRect(-9, -62, 18, 11);
    // Face by mood.
    ctx.fillStyle = '#1d1d1d';
    if (mood === 'search') {
      ctx.fillRect(-7, -49, 5, 2); ctx.fillRect(3, -49, 5, 2);
    } else {
      circle(ctx, -4, -48, 1.8); circle(ctx, 4, -48, 1.8);
    }
    ctx.strokeStyle = '#7e2a1e'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (mood === 'caught') {
      ctx.arc(0, -42, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    } else {
      ctx.moveTo(-5, -39); ctx.lineTo(5, -39);
    }
    ctx.stroke();
    // Beard stubble.
    ctx.fillStyle = '#b98a5e';
    ellipse(ctx, 0, -38, 8, 4);
    ctx.restore();
  }

  function drawFence(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(-26, -34, 6, 34);
    ctx.fillRect(20, -34, 6, 34);
    ctx.fillRect(-30, -30, 60, 6);
    ctx.fillRect(-30, -16, 60, 6);
    ctx.fillStyle = '#a9713d';
    ctx.fillRect(-30, -30, 60, 2);
    ctx.restore();
  }

  function drawPumpkin(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#e8722a';
    ellipse(ctx, 0, 0, r, r * 0.82);
    ctx.strokeStyle = '#b34d12'; ctx.lineWidth = 2;
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.ellipse(i * r * 0.45, 0, r * 0.32, r * 0.82, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#5d7a33';
    ctx.fillRect(-2, -r - 4, 4, 8);
    ctx.restore();
  }

  function drawKnife(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = P.knifeBlade;
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(7, 6); ctx.lineTo(0, 12); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.knifeHandle;
    ctx.fillRect(-5, 10, 10, 14);
    ctx.restore();
  }

  function drawHaystack(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = P.hay;
    ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-30, -44, 0, -48); ctx.quadraticCurveTo(30, -44, 34, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c99a2e'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -12); ctx.quadraticCurveTo(0, -22, 20, -12);
    ctx.moveTo(-14, -28); ctx.quadraticCurveTo(0, -36, 14, -28);
    ctx.stroke();
    ctx.restore();
  }

  // Kitchen oven: a squat range with a glowing door. flame 0..1 = jet height.
  function drawOven(ctx, x, y, flame) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = P.ovenBody;
    ctx.fillRect(-34, -52, 68, 52);
    ctx.fillStyle = '#33333a';
    ctx.fillRect(-28, -46, 56, 30);
    ctx.fillStyle = P.ovenGlow;
    ctx.globalAlpha = 0.35 + 0.65 * flame;
    ctx.beginPath(); ctx.ellipse(0, -31, 20, 10 + 8 * flame, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#dfe6ea';
    ctx.fillRect(-28, -12, 56, 4);
    for (var i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(-20 + i * 13, -8, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    if (flame > 0.25) {
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.moveTo(-12, -52);
      ctx.quadraticCurveTo(-8, -52 - 34 * flame, 0, -52 - 44 * flame);
      ctx.quadraticCurveTo(8, -52 - 34 * flame, 12, -52);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff5a1f';
      ctx.beginPath();
      ctx.moveTo(-6, -52);
      ctx.quadraticCurveTo(-3, -52 - 22 * flame, 0, -52 - 28 * flame);
      ctx.quadraticCurveTo(3, -52 - 22 * flame, 6, -52);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawCorn(ctx, x, y, bob) {
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.fillStyle = P.corn;
    ellipse(ctx, 0, 0, 8, 13);
    ctx.fillStyle = '#e8b800';
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 4, -10); ctx.lineTo(i * 4, 10); ctx.stroke();
    }
    ctx.strokeStyle = '#e8b800'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, -6); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(-6, 6); ctx.lineTo(6, 6); ctx.stroke();
    ctx.restore();
  }

  function drawPie(ctx, x, y, bob) {
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.fillStyle = '#d97b2f';
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(8, -12); ctx.lineTo(-8, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7e0a8';
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(11, -4); ctx.lineTo(-11, -4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Freedom gate at the end of the run: a wooden arch into the forest.
  function drawGate(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#6b4420';
    ctx.fillRect(-46, -120, 12, 120);
    ctx.fillRect(34, -120, 12, 120);
    ctx.fillRect(-46, -128, 92, 12);
    ctx.fillStyle = '#2f6b2f';
    ctx.beginPath(); ctx.arc(0, -128, 16, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 15px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('FREEDOM', 0, -140);
    ctx.restore();
  }

  // Parallax background per stage: sky, sun, clouds, hills, then stage props.
  function drawBackground(ctx, stage, dist, time) {
    var sky = stage.sky;
    var grad = ctx.createLinearGradient(0, 0, 0, 540);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(1, sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 960, 540);

    // Sun.
    ctx.fillStyle = '#ffe9a8';
    circle(ctx, 830, 80, 34);
    ctx.fillStyle = '#fff6cf';
    circle(ctx, 830, 80, 26);

    // Drifting clouds.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (var i = 0; i < 4; i++) {
      var cx = ((i * 260 - dist * 12 + time * 6) % 1100 + 1100) % 1100 - 70;
      var cy = 50 + i * 34;
      ellipse(ctx, cx, cy, 46, 16);
      ellipse(ctx, cx + 30, cy + 6, 34, 13);
    }

    // Hills.
    ctx.fillStyle = stage.grass;
    ctx.beginPath();
    ctx.moveTo(0, 400);
    for (var hx = 0; hx <= 960; hx += 60) {
      ctx.lineTo(hx, 400 + Math.sin((hx + dist * 20) * 0.008) * 14);
    }
    ctx.lineTo(960, 540); ctx.lineTo(0, 540); ctx.closePath(); ctx.fill();

    // Ground.
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, 470, 960, 70);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 470, 960, 6);

    // Stage dressing.
    if (stage.name === 'FARMYARD' || stage.name === 'THE BARN') {
      // Distant barn + fence posts scrolling by.
      ctx.fillStyle = '#8a3a22';
      var bx = 700 - ((dist * 30) % 1200);
      ctx.fillRect(bx, 330, 130, 140);
      ctx.fillStyle = '#6b2a18';
      ctx.beginPath(); ctx.moveTo(bx - 12, 332); ctx.lineTo(bx + 65, 272); ctx.lineTo(bx + 142, 332); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f7e0a8';
      ctx.fillRect(bx + 52, 400, 26, 70);
      ctx.fillStyle = '#5a3a22';
      for (var fx = 0; fx < 960; fx += 120) {
        var px = fx - ((dist * 60) % 120);
        ctx.fillRect(px, 430, 8, 40);
      }
      ctx.fillRect(0, 438, 960, 5);
    } else {
      // Kitchen: checkered floor line + hanging pans.
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (var tx = 0; tx < 960; tx += 80) {
        ctx.fillRect(tx - ((dist * 60) % 80), 470, 40, 70);
      }
      ctx.fillStyle = '#3a3a42';
      for (var p = 0; p < 3; p++) {
        var panX = 150 + p * 320 - ((dist * 20) % 320);
        ctx.fillRect(panX, 60, 4, 26);
        circle(ctx, panX + 2, 108, 20);
      }
    }
  }

  global.GG_SPRITES = {
    drawTurkey: drawTurkey,
    drawFarmer: drawFarmer,
    drawFence: drawFence,
    drawPumpkin: drawPumpkin,
    drawKnife: drawKnife,
    drawHaystack: drawHaystack,
    drawOven: drawOven,
    drawCorn: drawCorn,
    drawPie: drawPie,
    drawGate: drawGate,
    drawBackground: drawBackground,
    ellipse: ellipse,
    circle: circle
  };
})(typeof window !== 'undefined' ? window : globalThis);
