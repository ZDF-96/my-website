'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Activity, Network, BookOpen, Play, Pause, RotateCcw } from 'lucide-react';

/* ============================================================================
 * 数学与通用工具函数
 * ========================================================================== */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/* ============================================================================
 * 物理引擎内核 (全耦合二元微分方程组)
 * ========================================================================== */

function computeSelfInductanceStep(state, params, isClosed, dt) {
  const { L, r_L, R_B, E } = params;
  let { iL, iB } = state;

  if (isClosed) {
    iB = E / R_B;
    const tauOn = L / Math.max(r_L, 0.05);
    const targetIL = E / Math.max(r_L, 0.05);
    const diL = ((targetIL - iL) / tauOn) * dt;
    iL += diL;
    return { iL, iB, iTotal: iL + iB, dIdt: (targetIL - iL) / tauOn, emf: -L * ((targetIL - iL) / tauOn), energy: 0.5 * L * iL * iL };
  } else {
    const Rloop = r_L + R_B;
    const tauOff = L / Math.max(Rloop, 0.1);
    const diL = (-iL / tauOff) * dt;
    iL += diL;
    if (Math.abs(iL) < 1e-5) iL = 0;
    iB = -iL; 
    return { iL, iB, iTotal: 0, dIdt: -iL / tauOff, emf: -L * (-iL / tauOff), energy: 0.5 * L * iL * iL };
  }
}

function computeMutualStep(state, params, isClosed, dt) {
  const { L1, L2, k, R1, R2, E } = params;
  const M = k * Math.sqrt(L1 * L2);
  let { i1, i2 } = state;
  let di1 = 0, di2 = 0;

  if (isClosed) {
    const D = Math.max(L1 * L2 - M * M, 1e-6);
    const rhs1 = E - R1 * i1;
    const rhs2 = -R2 * i2;
    di1 = (L2 * rhs1 - M * rhs2) / D;
    di2 = (-M * rhs1 + L1 * rhs2) / D;
    i1 += di1 * dt;
    i2 += di2 * dt;
  } else {
    const tauArc = 0.015; 
    di1 = -i1 / tauArc;
    i1 += di1 * dt;
    if (Math.abs(i1) < 1e-5) { i1 = 0; di1 = 0; }
    di2 = (-R2 * i2 - M * di1) / L2;
    i2 += di2 * dt;
    if (Math.abs(i2) < 1e-5) i2 = 0;
  }
  
  const selfEmf1 = -L1 * di1;
  const mutEmf1 = -M * di2; 
  const selfEmf2 = -L2 * di2; 
  const mutEmf2 = -M * di1;   
  
  const emf1 = selfEmf1 + mutEmf1;
  const emf2 = selfEmf2 + mutEmf2;

  return { 
    i1, i2, di1, di2, 
    emf1, emf2, selfEmf2, mutEmf2, 
    M, flux: M * i1, dFluxDt: M * di1 
  };
}

/* ============================================================================
 * 科研级 Canvas 引擎 (严格图层隔离与抗锯齿优化)
 * ========================================================================== */

function prepareCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 0;
  return ctx;
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
  ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
  ctx.stroke();
}

function text(ctx, value, x, y, { font = '13px "Times New Roman", serif', color = '#94a3b8', align = 'left', base = 'middle', style = 'normal', weight = 'normal' } = {}) {
  ctx.save();
  ctx.font = `${style} ${weight} ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(value, Math.round(x), Math.round(y));
  ctx.restore();
}

function drawDCPower(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#0b1120'; ctx.fillRect(x - 18, y - 10, 36, 20); 
  ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.lineCap = 'butt';
  line(ctx, x - 15, y - 6, x + 15, y - 6); 
  ctx.lineWidth = 4; ctx.strokeStyle = '#64748b';
  line(ctx, x - 8, y + 6, x + 8, y + 6);   
  ctx.restore();
}

function drawSwitchKnife(ctx, x, y, isClosed) {
  ctx.save();
  ctx.fillStyle = '#0b1120'; ctx.fillRect(x - 5, y - 25, 46, 30);
  ctx.fillStyle = '#64748b';
  ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 36, y, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isClosed ? '#06b6d4' : '#f59e0b';
  ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y);
  isClosed ? ctx.lineTo(x + 36, y) : ctx.lineTo(x + 28, y - 20);
  ctx.stroke();
  ctx.restore();
}

function drawIlluminatedLamp(ctx, x, y, current, ratedCurrent) {
  ctx.save();
  const r = 16;
  const ratio = Math.abs(current) / Math.max(ratedCurrent, 0.05);
  const intensity = Math.min(Math.pow(ratio, 0.4), 1.5); 
  
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4);

  if (intensity > 0.05) {
    ctx.fillStyle = `rgba(234, 179, 8, ${Math.min(0.15 + intensity * 0.7, 1)})`;
    ctx.strokeStyle = '#fde047';
  } else {
    ctx.fillStyle = '#0b1120'; 
    ctx.strokeStyle = '#475569';
  }

  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.strokeStyle = intensity > 0.05 ? '#fef08a' : '#475569';
  const offset = r * 0.65;
  ctx.beginPath();
  ctx.moveTo(x - offset, y - offset); ctx.lineTo(x + offset, y + offset);
  ctx.moveTo(x - offset, y + offset); ctx.lineTo(x + offset, y - offset);
  ctx.stroke();
  ctx.restore();
}

function drawInductorAcademic(ctx, x, yTop, yBottom) {
  ctx.save();
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(x - 14, yTop - 2, 28, (yBottom - yTop) + 4);
  ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  const loops = 5; 
  const loopH = (yBottom - yTop) / loops;
  for (let i = 0; i < loops; i++) {
    ctx.beginPath(); 
    ctx.arc(x, yTop + i * loopH + loopH / 2, loopH / 2, -Math.PI / 2, Math.PI / 2); 
    ctx.stroke();
  }
  ctx.restore();
}

function drawWrappedCoil(ctx, x, yTop, yBottom, loops, color) {
  ctx.save();
  const loopH = (yBottom - yTop) / loops;
  const w = 42; 
  
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(x - w / 2 - 1, yTop - 2, w + 2, (yBottom - yTop) + 4);

  ctx.strokeStyle = color; 
  ctx.lineWidth = 2.5; 
  ctx.lineCap = 'round'; 
  ctx.lineJoin = 'round';
  
  for (let i = 0; i < loops; i++) {
    const y = yTop + i * loopH;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + loopH * 0.1);
    ctx.bezierCurveTo(x + w * 0.8, y, x + w * 0.8, y + loopH * 0.8, x - w / 2, y + loopH * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGalvanometer(ctx, x, y, current, maxRefCurrent) {
  ctx.save();
  const r = 22;
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4);

  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  line(ctx, x, y - r + 3, x, y - r + 8);

  const def = Math.max(-1, Math.min(1, current / Math.max(maxRefCurrent * 0.4, 0.1)));
  const angle = def * Math.PI / 3.4;
  ctx.strokeStyle = Math.abs(current) > 0.01 ? '#f59e0b' : '#64748b';
  ctx.lineWidth = 2.5;
  
  ctx.beginPath(); ctx.moveTo(x, y + 4);
  ctx.lineTo(x + Math.sin(angle) * (r - 4), y + 4 - Math.cos(angle) * (r - 4));
  ctx.stroke();
  
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath(); ctx.arc(x, y + 4, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCurrentFlow(ctx, pathPoints, intensity, color) {
  if (!pathPoints || pathPoints.length < 2 || Math.abs(intensity) < 0.01) return;

  const speed = 80; 
  const dashLen = 12;
  const gapLen = 12;
  const offset = -(performance.now() / 1000) * speed;

  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = 'butt';
  ctx.setLineDash([dashLen, gapLen]); ctx.lineDashOffset = offset;

  ctx.beginPath();
  ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
  let totalLen = 0;
  const segments = [];
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i][0], pathPoints[i][1]);
    const dx = pathPoints[i][0] - pathPoints[i-1][0];
    const dy = pathPoints[i][1] - pathPoints[i-1][1];
    const len = Math.hypot(dx, dy);
    segments.push({ p1: pathPoints[i-1], p2: pathPoints[i], dx, dy, len, acc: totalLen });
    totalLen += len;
  }
  ctx.stroke();

  ctx.setLineDash([]);
  const arrowSpacing = 70;
  let arrowOffset = (-(offset) % arrowSpacing);
  if (arrowOffset < 0) arrowOffset += arrowSpacing;

  ctx.fillStyle = color;
  for (let dist = arrowOffset; dist < totalLen; dist += arrowSpacing) {
    const seg = segments.find(s => dist >= s.acc && dist < s.acc + s.len);
    if (seg && seg.len > 0) {
       const ratio = (dist - seg.acc) / seg.len;
       const x = seg.p1[0] + seg.dx * ratio;
       const y = seg.p1[1] + seg.dy * ratio;
       const angle = Math.atan2(seg.dy, seg.dx);

       ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
       ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-5, 5); ctx.lineTo(-3, 0); ctx.lineTo(-5, -5);
       ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  ctx.restore();
}

/* ============================================================================
 * 场景渲染
 * ========================================================================== */

function drawSelfDualCircuit(ctx, w, h, isClosed, iL, iB, p) {
  ctx.fillStyle = '#0b1120'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(148,163,184,0.03)'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) line(ctx, x, 0, x, h);
  for (let y = 0; y < h; y += 40) line(ctx, 0, y, w, y);

  const cx = Math.round(w / 2), cy = Math.round(h / 2);
  const busTop = cy - 100, busBottom = cy + 100;
  const xL = cx - 160, xM = cx - 10, xR = cx + 140;
  const swX = xL + 40;

  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2.5; ctx.lineCap = 'butt';
  line(ctx, xL, busBottom, xR, busBottom); 
  line(ctx, xL, busTop, xL, cy - 14); line(ctx, xL, cy + 14, xL, busBottom);
  line(ctx, xL, busTop, swX, busTop); line(ctx, swX + 36, busTop, xM, busTop); line(ctx, xM, busTop, xR, busTop); 
  line(ctx, xM, busTop, xM, busBottom); line(ctx, xR, busTop, xR, busBottom);

  const pathL_closed = [[xL, cy], [xL, busTop], [swX, busTop], [xM, busTop], [xM, busBottom], [xL, busBottom], [xL, cy]];
  const pathB_closed = [[xL, cy], [xL, busTop], [swX, busTop], [xM, busTop], [xR, busTop], [xR, busBottom], [xM, busBottom], [xL, busBottom], [xL, cy]];
  const path_break = [[xM, cy-10], [xM, busBottom], [xR, busBottom], [xR, busTop], [xM, busTop], [xM, cy-50]];

  if (isClosed) {
    if (Math.abs(iL) > 0.01) drawCurrentFlow(ctx, pathL_closed, Math.abs(iL), '#0ea5e9'); 
    if (Math.abs(iB) > 0.01) drawCurrentFlow(ctx, pathB_closed, Math.abs(iB), '#f59e0b'); 
  } else if (Math.abs(iL) > 0.005) {
    drawCurrentFlow(ctx, path_break, Math.abs(iL), '#f43f5e'); 
  }

  drawDCPower(ctx, xL, cy); 
  drawSwitchKnife(ctx, swX, busTop, isClosed);
  drawInductorAcademic(ctx, xM, cy - 50, cy - 10);
  drawIlluminatedLamp(ctx, xM, cy + 35, iL, p.E/p.r_L); 
  drawIlluminatedLamp(ctx, xR, cy, iB, p.E/p.R_B);

  ctx.fillStyle = '#94a3b8';
  [ [xM, busTop], [xM, busBottom], [xR, busTop], [xR, busBottom] ].forEach(([px, py]) => {
    ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
  });

  text(ctx, 'E', xL - 25, cy, { font: '16px "Times New Roman", serif', style: 'italic', color: '#e2e8f0', align: 'right' });
  text(ctx, 'S', swX + 18, busTop - 24, { font: '16px "Times New Roman", serif', style: 'italic', color: '#e2e8f0', align: 'center' });
  text(ctx, 'L', xM + 18, cy - 30, { font: '16px "Times New Roman", serif', style: 'italic', color: '#06b6d4' });
  text(ctx, 'A₁', xM + 26, cy + 35, { font: '16px "Times New Roman", serif', style: 'italic', color: '#e2e8f0' });
  text(ctx, `r_L = ${p.r_L.toFixed(1)} Ω`, xM + 26, cy + 55, { font: '12px "Times New Roman", serif', color: '#64748b' });
  text(ctx, 'A₂', xR + 26, cy, { font: '16px "Times New Roman", serif', style: 'italic', color: '#e2e8f0' });
  text(ctx, `R_B = ${p.R_B.toFixed(1)} Ω`, xR + 26, cy + 25, { font: '12px "Times New Roman", serif', color: '#64748b' });

  if (!isClosed && Math.abs(iL) > 0.005 && p.r_L < p.R_B && Math.abs(iB) > p.E / p.R_B * 1.05) {
    text(ctx, '⚡ A₂ 电流反向突变并闪亮', cx + 60, busTop - 20, { font: '14px sans-serif', weight: 'bold', color: '#f59e0b', align: 'center' });
  }
}

function drawMutualIronCircuit(ctx, w, h, isClosed, physState, p) {
  const { i1, i2, flux, dFluxDt, M } = physState;
  
  ctx.fillStyle = '#0b1120'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(148,163,184,0.03)'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) line(ctx, x, 0, x, h);
  for (let y = 0; y < h; y += 40) line(ctx, 0, y, w, y);

  const cx = Math.round(w / 2), cy = Math.round(h / 2) - 15;
  const busTop = cy - 100, busBottom = cy + 100;
  const xL = cx - 180, xR = cx + 180;
  const xCL = cx - 75, xCR = cx + 75; 
  const swX = xL + 30;

  ctx.save();
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 36; ctx.lineJoin = 'miter';
  ctx.beginPath(); ctx.rect(cx - 75, cy - 75, 150, 150); ctx.stroke();
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 30; 
  ctx.beginPath(); ctx.rect(cx - 75, cy - 75, 150, 150); ctx.stroke();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 26; 
  ctx.beginPath(); ctx.rect(cx - 75, cy - 75, 150, 150); ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2.5; ctx.lineCap = 'butt';
  line(ctx, xL, busBottom, xCL, busBottom);
  line(ctx, xL, busTop, swX, busTop); line(ctx, swX + 36, busTop, xCL, busTop);
  line(ctx, xL, busTop, xL, cy - 14); line(ctx, xL, cy + 14, xL, busBottom);
  line(ctx, xCL, busTop, xCL, cy - 45); line(ctx, xCL, cy + 45, xCL, busBottom);
  line(ctx, xCR, busTop, xR, busTop); line(ctx, xCR, busBottom, xR, busBottom);
  line(ctx, xCR, busTop, xCR, cy - 45); line(ctx, xCR, cy + 45, xCR, busBottom);
  line(ctx, xR, busTop, xR, cy - 26); line(ctx, xR, cy + 26, xR, busBottom);

  const fluxScale = Math.abs(flux) / Math.max(p.E / p.R1 * M, 0.05);
  if (fluxScale > 0.02) {
    const fluxPath = i1 >= 0 
      ? [[cx-75, cy+75], [cx-75, cy-75], [cx+75, cy-75], [cx+75, cy+75], [cx-75, cy+75]] 
      : [[cx-75, cy-75], [cx-75, cy+75], [cx+75, cy+75], [cx+75, cy-75], [cx-75, cy-75]];
    drawCurrentFlow(ctx, fluxPath, fluxScale, '#fde047');
  }

  const path1 = [[xL, cy], [xL, busTop], [swX, busTop], [swX+36, busTop], [xCL, busTop], [xCL, busBottom], [xL, busBottom], [xL, cy]];
  if (isClosed && Math.abs(i1) > 0.01) drawCurrentFlow(ctx, path1, Math.abs(i1), '#0ea5e9');

  if (Math.abs(i2) > 0.005) {
    const path2 = i2 > 0 
      ? [[xCR, busBottom], [xR, busBottom], [xR, busTop], [xCR, busTop], [xCR, busBottom]]
      : [[xCR, busTop], [xR, busTop], [xR, busBottom], [xCR, busBottom], [xCR, busTop]]; 
    drawCurrentFlow(ctx, path2, Math.abs(i2), '#f59e0b');
  }

  drawDCPower(ctx, xL, cy);
  drawSwitchKnife(ctx, swX, busTop, isClosed);
  drawWrappedCoil(ctx, xCL, cy - 45, cy + 45, 6, '#0ea5e9');
  drawWrappedCoil(ctx, xCR, cy - 45, cy + 45, 6, '#f59e0b');
  drawGalvanometer(ctx, xR, cy, i2, p.E / p.R1);

  ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.arc(xCL, busTop + 18, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(xCR, busTop + 18, 3.5, 0, Math.PI*2); ctx.fill();

  text(ctx, 'E', xL - 25, cy, { font: '16px "Times New Roman", serif', style: 'italic', color: '#e2e8f0', align: 'right' });
  text(ctx, 'S', swX + 18, busTop - 24, { font: '16px "Times New Roman", serif', style: 'italic', color: '#e2e8f0', align: 'center' });
  text(ctx, 'L₁', xCL - 30, cy, { font: '16px "Times New Roman", serif', style: 'italic', color: '#0ea5e9', align: 'right' });
  text(ctx, 'L₂', xCR + 30, cy, { font: '16px "Times New Roman", serif', style: 'italic', color: '#f59e0b', align: 'left' });
  text(ctx, 'G', xR + 32, cy, { font: '16px "Times New Roman", serif', style: 'italic', weight: 'bold', color: '#e2e8f0' });

  if (Math.abs(dFluxDt) > 1) {
    text(ctx, `dΦ/dt = ${(Math.abs(dFluxDt)).toFixed(1)} Wb/s`, cx, cy - 14, { align: 'center', color: '#f43f5e', font: '15px "Times New Roman", serif', weight: 'bold' });
    text(ctx, `ε₂ = -dΦ/dt`, cx, cy + 14, { align: 'center', color: '#f43f5e', font: '16px "Times New Roman", serif', weight: 'bold' });
  } else {
    text(ctx, 'Φ₂₁ = M·I₁', cx, cy - 12, { align: 'center', color: '#fde047', font: '16px "Times New Roman", serif', style: 'italic' });
    text(ctx, `M = k√(L₁L₂)`, cx, cy + 12, { align: 'center', color: '#94a3b8', font: '15px "Times New Roman", serif', style: 'italic' });
  }
}

/* ============================================================================
 * 示波器 UI (抗锯齿优化)
 * ========================================================================== */

function drawOscilloscopeGrid(ctx, x0, x1, y0, y1) {
  ctx.save();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) line(ctx, x0 + ((x1 - x0) * i) / 10, y0, x0 + ((x1 - x0) * i) / 10, y1);
  for (let i = 0; i <= 8; i++) line(ctx, x0, y0 + ((y1 - y0) * i) / 8, x1, y0 + ((y1 - y0) * i) / 8);
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
  line(ctx, x0, y1, x1, y1); line(ctx, x0, y0, x0, y1);
  ctx.restore();
}

function drawChannelWaveform(ctx, data, key, color, x0, x1, tMin, tMax, zeroY, amplitude, yMax) {
  if (data.length < 2) return;
  const timeSpan = Math.max(tMax - tMin, 1e-6);
  
  ctx.save();
  ctx.beginPath();
  let firstX = null, lastX = null;

  data.forEach((pt, i) => {
    // 真实时间映射，避免帧率波动导致的锯齿
    const x = x0 + ((pt.t - tMin) / timeSpan) * (x1 - x0);
    const y = zeroY - (pt[key] / yMax) * amplitude;
    if (i === 0) { ctx.moveTo(x, y); firstX = x; } else { ctx.lineTo(x, y); }
    lastX = x;
  });
  
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.stroke();

  if (firstX !== null) {
    ctx.lineTo(lastX, zeroY); ctx.lineTo(firstX, zeroY);
    const rgb = color.match(/\w\w/g).map(x => parseInt(x, 16));
    const grad = ctx.createLinearGradient(0, zeroY - amplitude, 0, zeroY + amplitude);
    grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.2)`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.fill();
  }
  ctx.restore();
}

function drawLegendBox(ctx, x, y, labels) {
  const w = 110, h = labels.length * 20 + 15;
  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = 'rgba(15,23,42,0.85)'; ctx.fill();
  ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1; ctx.stroke();
  
  labels.forEach((item, i) => {
    const ly = y + 18 + i * 20;
    ctx.beginPath(); ctx.moveTo(x + 10, ly); ctx.lineTo(x + 25, ly);
    ctx.strokeStyle = item.color; ctx.lineWidth = 2.5; ctx.stroke();
    text(ctx, item.text, x + 35, ly + 4, { color: item.color, size: 11, weight: 'bold' });
  });
  ctx.restore();
}

function drawSelfGraph(ctx, w, h, data, p) {
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h);
  text(ctx, 'TRANSIENT RESPONSE', 20, 20, { font: '12px sans-serif', weight: 'bold', color: '#64748b' });
  
  if (data.length < 2) return;
  const x0 = 45, x1 = w - 25, y0 = 45, y1 = h - 30, plotH = y1 - y0;
  const tMin = data[0].t, tMax = Math.max(data[data.length-1].t, tMin + 0.001);
  const maxI = Math.max(p.E/p.r_L, p.E/p.R_B, ...data.map(d => Math.max(d.iL, Math.abs(d.iB))));
  const yMax = Math.max(maxI * 1.25, 0.5);

  drawOscilloscopeGrid(ctx, x0, x1, y0, y1);
  const zeroY = y0 + plotH * 0.65; 
  
  ctx.strokeStyle = '#475569'; ctx.setLineDash([4, 4]); line(ctx, x0, zeroY, x1, zeroY); ctx.setLineDash([]);
  
  drawChannelWaveform(ctx, data, 'iL', '#0ea5e9', x0, x1, tMin, tMax, zeroY, plotH * 0.60, yMax);
  drawChannelWaveform(ctx, data, 'iB', '#f59e0b', x0, x1, tMin, tMax, zeroY, plotH * 0.60, yMax);
  
  text(ctx, 'I / A', x0 - 8, y0 - 8, { font: '11px "Times New Roman", serif', align: 'right', color: '#94a3b8' });
  text(ctx, '0', x0 - 8, zeroY, { font: '11px "Times New Roman", serif', align: 'right', color: '#94a3b8' });
  text(ctx, 't / s', x1, zeroY + 16, { font: '11px "Times New Roman", serif', align: 'right', color: '#94a3b8' });
  
  drawLegendBox(ctx, x1 - 120, y0 + 10, [
    { text: 'I_L (Inductor)', color: '#0ea5e9' },
    { text: 'I_B (Bulb)', color: '#f59e0b' }
  ]);
}

function drawMutualGraph(ctx, w, h, data, p) {
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h);
  text(ctx, 'MUTUAL INDUCTANCE', 20, 20, { font: '12px sans-serif', weight: 'bold', color: '#64748b' });

  if (data.length < 2) return;
  const x0 = 45, x1 = w - 25, y0 = 45, y1 = h - 30, plotH = y1 - y0;
  const tMin = data[0].t, tMax = Math.max(data[data.length-1].t, tMin + 0.001);
  const maxI = Math.max(p.E/p.R1, ...data.map(d => Math.max(Math.abs(d.i1), Math.abs(d.i2))));
  const yMax = Math.max(maxI * 1.3, 0.4);

  drawOscilloscopeGrid(ctx, x0, x1, y0, y1);
  const zeroY = y0 + plotH * 0.5; 
  
  ctx.strokeStyle = '#475569'; ctx.setLineDash([4, 4]); line(ctx, x0, zeroY, x1, zeroY); ctx.setLineDash([]);

  drawChannelWaveform(ctx, data, 'i1', '#0ea5e9', x0, x1, tMin, tMax, zeroY, plotH * 0.45, yMax);
  drawChannelWaveform(ctx, data, 'i2', '#f59e0b', x0, x1, tMin, tMax, zeroY, plotH * 0.45, yMax);

  text(ctx, 'I / A', x0 - 8, y0 - 8, { font: '11px "Times New Roman", serif', align: 'right', color: '#94a3b8' });
  text(ctx, '0', x0 - 8, zeroY, { font: '11px "Times New Roman", serif', align: 'right', color: '#94a3b8' });
  text(ctx, 't / s', x1, zeroY + 16, { font: '11px "Times New Roman", serif', align: 'right', color: '#94a3b8' });

  drawLegendBox(ctx, x1 - 120, y0 + 10, [
    { text: 'I₁ (Primary)', color: '#0ea5e9' },
    { text: 'I₂ (Secondary)', color: '#f59e0b' }
  ]);
}

/* ============================================================================
 * React UI 框架
 * ========================================================================== */

export default function ZiGanHuGanSimulation() {
  const [activeModule, setActiveModule] = useState('self');
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col space-y-4 font-sans select-none bg-[#020617] p-4 rounded-xl border border-slate-800 shadow-2xl">
      <div className="flex w-full items-center gap-4 rounded-lg bg-[#0f172a] p-1.5 border border-slate-800">
        <button onClick={() => setActiveModule('self')} className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${activeModule === 'self' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
          <Activity size={16} /> MODULE 01 : 自感并联拓扑
        </button>
        <button onClick={() => setActiveModule('mutual')} className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${activeModule === 'mutual' ? 'bg-slate-800 text-orange-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
          <Network size={16} /> MODULE 02 : 变压器耦合与完整微分图景
        </button>
      </div>
      {activeModule === 'self' ? <SelfInductanceApp /> : <MutualInductanceApp />}
    </div>
  );
}

function SelfInductanceApp() {
  const [isSwitchClosed, setIsSwitchClosed] = useState(false);
  const [params, setParams] = useState({ L: 3.5, r_L: 1.5, R_B: 12.0, E: 12.0 });
  const [uiData, setUiData] = useState({ iL: 0, iB: 0, dIdt: 0, emf: 0, energy: 0 });
  
  const stateRef = useRef({ iL: 0, iB: 0 });
  const circuitCanvasRef = useRef(null), graphCanvasRef = useRef(null);
  const animationRef = useRef(null), lastFrameRef = useRef(null), lastHudUpdateRef = useRef(0);
  const historyRef = useRef([]);

  useEffect(() => {
    let acc = 0; const fixedDt = 0.002;
    const renderLoop = (timestamp) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      acc += Math.min((timestamp - lastFrameRef.current) / 1000, 0.04);
      lastFrameRef.current = timestamp;
      
      let phys = null;
      while (acc >= fixedDt) {
        phys = computeSelfInductanceStep(stateRef.current, params, isSwitchClosed, fixedDt);
        stateRef.current = { iL: phys.iL, iB: phys.iB };
        acc -= fixedDt;
      }

      if (phys) {
        historyRef.current.push({ t: performance.now()/1000, iL: phys.iL, iB: phys.iB });
        if (historyRef.current.length > 400) historyRef.current.shift();
        
        // 性能节流：60ms 刷新一次 React UI，杜绝卡顿
        if (timestamp - lastHudUpdateRef.current > 60) {
          setUiData(phys);
          lastHudUpdateRef.current = timestamp;
        }
      }
      
      const cCtx = prepareCanvas(circuitCanvasRef.current);
      cCtx.clearRect(0, 0, circuitCanvasRef.current.width, circuitCanvasRef.current.height);
      drawSelfDualCircuit(cCtx, circuitCanvasRef.current.clientWidth, circuitCanvasRef.current.clientHeight, isSwitchClosed, stateRef.current.iL, stateRef.current.iB, params);
      
      const gCtx = prepareCanvas(graphCanvasRef.current);
      gCtx.clearRect(0, 0, graphCanvasRef.current.width, graphCanvasRef.current.height);
      drawSelfGraph(gCtx, graphCanvasRef.current.clientWidth, graphCanvasRef.current.clientHeight, historyRef.current, params);

      animationRef.current = requestAnimationFrame(renderLoop);
    };
    animationRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isSwitchClosed, params]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#0b1120]">
      <div className="grid min-h-[480px] grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <canvas ref={circuitCanvasRef} className="block w-full h-full border-b lg:border-b-0 lg:border-r border-slate-800" style={{ height: '480px' }} />
        <canvas ref={graphCanvasRef} className="block w-full h-full bg-[#0f172a]" style={{ height: '480px' }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-slate-800 bg-[#0f172a]">
        <DataCell label="CH1: I_L (CYAN)" value={`${uiData.iL.toFixed(3)} A`} color="text-cyan-400" />
        <DataCell label="CH2: I_B (YELLOW)" value={`${uiData.iB.toFixed(3)} A`} color="text-amber-400" />
        <DataCell label="INDUCED EMF" value={`${Math.abs(uiData.emf).toFixed(2)} V`} color="text-emerald-400" />
        <DataCell label="MAGNETIC ENERGY" value={`${uiData.energy.toFixed(4)} J`} color="text-purple-400" />
      </div>
      <div className="border-t border-slate-800 bg-[#0b1120] px-6 py-5 flex flex-col md:flex-row gap-6 items-center">
        <button onClick={() => setIsSwitchClosed(!isSwitchClosed)} className={`w-full md:w-48 px-6 py-3 rounded-md text-sm font-bold border transition-colors ${isSwitchClosed ? 'bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/20'}`}>
          {isSwitchClosed ? '■ 断开开关 S' : '▶ 闭合开关 S'}
        </button>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
          <ParameterSlider label="自感系数 L" value={params.L} min={0.5} max={8} step={0.1} unit="H" onChange={v=>setParams({...params,L:v})} />
          <ParameterSlider label="线圈内阻 r_L" value={params.r_L} min={0.5} max={8} step={0.1} unit="Ω" onChange={v=>setParams({...params,r_L:v})} />
          <ParameterSlider label="灯泡电阻 R_B" value={params.R_B} min={2} max={25} step={0.5} unit="Ω" onChange={v=>setParams({...params,R_B:v})} />
          <ParameterSlider label="电源电压 E" value={params.E} min={3} max={24} step={1} unit="V" onChange={v=>setParams({...params,E:v})} />
        </div>
      </div>
    </div>
  );
}

function MutualInductanceApp() {
  const [isSwitchClosed, setIsSwitchClosed] = useState(false);
  const [params, setParams] = useState({ L1: 1.5, L2: 4.5, k: 0.85, R1: 4.0, R2: 16.0, E: 12.0 });
  const [uiData, setUiData] = useState({ i1: 0, i2: 0, emf1: 0, emf2: 0, selfEmf2: 0, mutEmf2: 0, flux: 0, dFluxDt: 0 });
  
  // 核心修复：将 flux/dFluxDt 存入 stateRef 避免受制于 UI 节流导致的动画卡顿
  const stateRef = useRef({ i1: 0, i2: 0, flux: 0, dFluxDt: 0 });
  const circuitCanvasRef = useRef(null), graphCanvasRef = useRef(null);
  const animationRef = useRef(null), lastFrameRef = useRef(null), lastHudUpdateRef = useRef(0);
  const historyRef = useRef([]);

  useEffect(() => {
    let acc = 0; const fixedDt = 0.0008;
    const renderLoop = (timestamp) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      acc += Math.min((timestamp - lastFrameRef.current) / 1000, 0.04);
      lastFrameRef.current = timestamp;
      
      let phys = null;
      while (acc >= fixedDt) {
        phys = computeMutualStep(stateRef.current, params, isSwitchClosed, fixedDt);
        stateRef.current = { i1: phys.i1, i2: phys.i2, flux: phys.flux, dFluxDt: phys.dFluxDt };
        acc -= fixedDt;
      }

      if (phys) {
        historyRef.current.push({ t: performance.now()/1000, i1: phys.i1, i2: phys.i2 });
        if (historyRef.current.length > 400) historyRef.current.shift();
        
        if (timestamp - lastHudUpdateRef.current > 60) {
          setUiData(phys);
          lastHudUpdateRef.current = timestamp;
        }
      }

      const drawPhysState = phys || {
        i1: stateRef.current.i1,
        i2: stateRef.current.i2,
        flux: stateRef.current.flux, 
        dFluxDt: stateRef.current.dFluxDt,
        M: params.k * Math.sqrt(params.L1 * params.L2)
      };
      
      const cCtx = prepareCanvas(circuitCanvasRef.current);
      cCtx.clearRect(0, 0, circuitCanvasRef.current.width, circuitCanvasRef.current.height);
      drawMutualIronCircuit(cCtx, circuitCanvasRef.current.clientWidth, circuitCanvasRef.current.clientHeight, isSwitchClosed, drawPhysState, params);
      
      const gCtx = prepareCanvas(graphCanvasRef.current);
      gCtx.clearRect(0, 0, graphCanvasRef.current.width, graphCanvasRef.current.height);
      drawMutualGraph(gCtx, graphCanvasRef.current.clientWidth, graphCanvasRef.current.clientHeight, historyRef.current, params);
      
      animationRef.current = requestAnimationFrame(renderLoop);
    };
    animationRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isSwitchClosed, params]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#0b1120]">
      <div className="grid min-h-[480px] grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <canvas ref={circuitCanvasRef} className="block w-full h-full border-b lg:border-b-0 lg:border-r border-slate-800" style={{ height: '480px' }} />
        <canvas ref={graphCanvasRef} className="block w-full h-full bg-[#0f172a]" style={{ height: '480px' }} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 border-t border-slate-800 bg-[#0f172a]">
        <DataCell label="原边电流 I₁" value={`${uiData.i1.toFixed(3)} A`} color="text-cyan-400" />
        <DataCell label="互感分量 -M·di₁/dt" value={`${(uiData.mutEmf2).toFixed(2)} V`} color="text-amber-500" />
        <DataCell label="自感分量 -L₂·di₂/dt" value={`${(uiData.selfEmf2).toFixed(2)} V`} color="text-pink-400" />
        <DataCell label="总感应电动势 ε₂" value={`${(uiData.emf2).toFixed(2)} V`} color="text-rose-400" />
        <DataCell label="副边电流 I₂" value={`${uiData.i2.toFixed(3)} A`} color="text-orange-400" />
      </div>

      <div className="border-t border-slate-800 bg-[#0b1120] px-6 py-5">
        <div className="mb-6 flex flex-col md:flex-row gap-6 items-center">
          <button onClick={() => setIsSwitchClosed(!isSwitchClosed)} className={`w-full md:w-48 px-6 py-3 rounded-md text-sm font-bold border transition-colors ${isSwitchClosed ? 'bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700' : 'bg-orange-500/10 text-orange-400 border-orange-500/40 hover:bg-orange-500/20'}`}>
            {isSwitchClosed ? '■ 断开原边 S' : '▶ 闭合原边 S'}
          </button>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
            <ParameterSlider label="原边自感 L₁" value={params.L1} min={0.5} max={5} step={0.1} unit="H" onChange={v=>setParams({...params,L1:v})} />
            <ParameterSlider label="副边自感 L₂" value={params.L2} min={1} max={10} step={0.5} unit="H" onChange={v=>setParams({...params,L2:v})} />
            <ParameterSlider label="耦合系数 k" value={params.k} min={0.2} max={0.98} step={0.02} unit="" onChange={v=>setParams({...params,k:v})} />
            <ParameterSlider label="副边负载 R₂" value={params.R2} min={5} max={80} step={5} unit="Ω" onChange={v=>setParams({...params,R2:v})} />
          </div>
        </div>

        <div className="rounded-md border border-slate-800 bg-[#0f172a]/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-cyan-400" />
            <span className="text-sm font-bold text-slate-200">物理机制深度解析：自感与互感的动态博弈</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            在真实的互感过程中，副边产生的感应电流 I₂ 并非被动接受原边磁通量变化。当 I₂ 发生变化时，它必然会在其自身线圈 L₂ 中激发自感电动势 (-L₂·di₂/dt)。<br/>
            在暂态闭合或断开瞬间，原边强加给副边的互感电动势 (-M·di₁/dt) 试图建立电流，而副边自感 (-L₂·di₂/dt) 坚决阻碍这一变化。两者相互叠加构成了副边的总感应电动势：ε₂ = -M·di₁/dt - L₂·di₂/dt。<br/>
            同时，副边激发的磁通量也会“反推”回原边，在原边线圈中叠加一个附加互感电动势 ε₁(mut) = -M·di₂/dt。全矩阵耦合才是电磁感应的真实图景。
          </p>
        </div>
      </div>
    </div>
  );
}

function DataCell({ label, value, color }) {
  return (
    <div className="flex flex-col justify-center min-h-[64px] border-b md:border-b-0 md:border-r border-slate-800 px-5 py-2 last:border-0">
      <div className="text-[10px] font-bold tracking-widest text-slate-500 font-sans">{label}</div>
      <div className={`text-sm font-mono font-bold ${color} mt-1.5 transition-colors duration-200`}>{value}</div>
    </div>
  );
}

function ParameterSlider({ label, value, min, max, step, unit, onChange }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-[11px] font-bold tracking-wide text-slate-400">{label}</span>
        <span className="text-[12px] font-mono text-cyan-400">{value.toFixed(step<0.1?2:1)}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-500" />
    </div>
  );
}