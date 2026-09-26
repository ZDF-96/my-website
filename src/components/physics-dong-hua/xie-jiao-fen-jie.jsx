'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ============================================================================
 * 运动学进阶 · 位移斜交分解实验室 (V4.0 Final Edition)
 * ----------------------------------------------------------------------------
 * 终极定稿特性：
 *   ① 纯净排版：采用标准 Unicode 物理字符 (v₀, ½gt², θ)，彻底消除渲染歧义
 *   ② 极值高亮：达成极值条件时，动态填充直角符号并施加辉光，视觉反馈更强
 *   ③ 拟态 UI：全面升级 Glassmorphism 面板质感，优化字距与排版
 *   ④ 性能满血：锁定 2x-3x DPR 硬件级超采样，Auto-Framing 动态包围盒零瑕疵
 * ============================================================================
 */

const C = {
  bg:        '#020617',
  panel:     'rgba(15, 23, 42, 0.88)',
  border:    'rgba(51, 65, 85, 0.8)',
  cyan:      '#06b6d4',
  cyanSoft:  'rgba(6, 182, 212, 0.35)',
  cyanGlow:  'rgba(6, 182, 212, 0.65)',
  rose:      '#f43f5e',
  amber:     '#fbbf24',
  amberGlow: 'rgba(251, 191, 36, 0.4)',
  emerald:   '#10b981',
  violet:    '#a78bfa',
  slate:     '#94a3b8',
  slateDark: '#475569',
  text:      '#f8fafc',
  textDim:   '#94a3b8',
};

const G = 9.8;
const CANVAS_H = 680;
const INFO_W = 285;

// ============================================================
// Canvas 渲染核心引擎
// ============================================================
if (typeof window !== 'undefined' && typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    this.moveTo(x + r[0], y);
    this.lineTo(x + w - r[1], y);
    this.arcTo(x + w, y, x + w, y + r[1], r[1]);
    this.lineTo(x + w, y + h - r[2]);
    this.arcTo(x + w, y + h, x + w, y + h - r[2], r[2]);
    this.lineTo(x + r[3], y + h);
    this.arcTo(x, y + h, x, y + h - r[3], r[3]);
    this.lineTo(x, y + r[0]);
    this.arcTo(x, y + r[0], y, r[0]);
    this.closePath();
    return this;
  };
}

const initCanvas = (canvas) => {
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width));
  const cssH = Math.max(1, Math.round(rect.height));
  
  const rawDpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const dpr = Math.min(Math.max(rawDpr, 2.0), 3.0);

  const pw = Math.round(cssW * dpr);
  const ph = Math.round(cssH * dpr);

  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { ctx, W: cssW, H: cssH, dpr };
};

const buildBg = (W, H, dpr) => {
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr);
  c.height = Math.round(H * dpr);
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  g.fillStyle = C.bg;
  g.fillRect(0, 0, W, H);

  g.strokeStyle = 'rgba(14, 165, 233, 0.05)';
  g.lineWidth = 1;
  const step = 40;
  g.beginPath();
  for (let x = step; x < W; x += step) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); }
  for (let y = step; y < H; y += step) { g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); }
  g.stroke();

  const glow = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  glow.addColorStop(0, 'rgba(8, 145, 178, 0.09)');
  glow.addColorStop(1, 'rgba(8, 145, 178, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  return c;
};

const drawRightAngle = (ctx, vx, vy, ax, ay, bx, by, size = 12, color = C.amber, filled = false) => {
  const d1 = Math.hypot(ax - vx, ay - vy);
  const d2 = Math.hypot(bx - vx, by - vy);
  if (d1 < 1 || d2 < 1) return;
  const u1x = (ax - vx) / d1, u1y = (ay - vy) / d1;
  const u2x = (bx - vx) / d2, u2y = (by - vy) / d2;
  const p1x = vx + u1x * size, p1y = vy + u1y * size;
  const p2x = vx + (u1x + u2x) * size, p2y = vy + (u1y + u2y) * size;
  const p3x = vx + u2x * size, p3y = vy + u2y * size;
  
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(vx, vy);
  ctx.lineTo(p1x, p1y);
  ctx.lineTo(p2x, p2y);
  ctx.lineTo(p3x, p3y);
  ctx.closePath();
  
  if (filled) {
    ctx.fillStyle = C.amberGlow;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.lineTo(p3x, p3y);
    ctx.stroke();
  }
  ctx.restore();
};

const arrow = (ctx, x1, y1, x2, y2, color, lw = 2.2, head = 10, glow = 0) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const dist = Math.hypot(x2 - x1, y2 - y1);
  if (dist < 1) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glow > 0) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  const bx = x2 - head * 0.75 * Math.cos(a);
  const by = y2 - head * 0.75 * Math.sin(a);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - Math.PI / 7), y2 - head * Math.sin(a - Math.PI / 7));
  ctx.lineTo(x2 - head * Math.cos(a + Math.PI / 7), y2 - head * Math.sin(a + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const dashLine = (ctx, x1, y1, x2, y2, color, lw = 1.8, pattern = [6, 5]) => {
  ctx.save();
  ctx.setLineDash(pattern);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
};

const dot = (ctx, x, y, r, color, glow = 4) => {
  ctx.save();
  if (glow > 0) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const text = (ctx, t, x, y, color, font = 'bold 13.5px system-ui, -apple-system, sans-serif', align = 'left', baseline = 'middle') => {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(t, x, y);
  ctx.restore();
};

const hudLabel = (ctx, title, sub, maxW) => {
  ctx.save();
  ctx.font = '12px system-ui, sans-serif';
  const subW = sub ? ctx.measureText(sub).width : 0;
  let w = Math.max(280, subW + 64);
  if (maxW) w = Math.min(w, maxW);
  const h = sub ? 62 : 46;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = C.panel;
  ctx.beginPath();
  ctx.roundRect(20, 20, w, h, 10);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = C.cyanGlow;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = C.cyan;
  ctx.beginPath();
  ctx.roundRect(20, 20, 4, h, [10, 0, 0, 10]);
  ctx.fill();
  ctx.fillStyle = C.text;
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 38, sub ? 34 : 23);
  if (sub) {
    ctx.fillStyle = C.textDim;
    ctx.font = '12px system-ui, monospace';
    let displaySub = sub;
    const availW = w - 50;
    if (subW > availW) {
      while (displaySub.length > 4 && ctx.measureText(displaySub + '…').width > availW) {
        displaySub = displaySub.slice(0, -2);
      }
      displaySub += '…';
    }
    ctx.fillText(displaySub, 38, 55);
  }
  ctx.restore();
};

const infoCard = (ctx, W, y, lines) => {
  const padX = 18, padY = 16, lineH = 24;
  const h = lines.length * lineH + padY * 2 - 8;
  const w = INFO_W;
  const x = Math.max(20, W - w - 24);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = C.panel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = C.amber;
  ctx.beginPath();
  ctx.roundRect(x, y, 4, h, [10, 0, 0, 10]);
  ctx.fill();
  lines.forEach((l, i) => {
    ctx.fillStyle = l.color || C.text;
    ctx.font = l.bold ? 'bold 13px system-ui, -apple-system, sans-serif' : '12.5px system-ui, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(l.text, x + padX, y + padY + i * lineH + 10);
  });
  ctx.restore();
};

// ============================================================
// UI 交互组件
// ============================================================
const ControlSlider = ({ label, symbol, value, min, max, step, onChange, unit = '', accent = C.cyan }) => (
  <div className="flex items-center gap-3 flex-1 min-w-[200px] select-none">
    <span className="text-[11px] font-mono tracking-wider text-slate-400 whitespace-nowrap uppercase">
      {label} <span style={{ color: accent, fontWeight: 'bold' }}>{symbol}</span>
    </span>
    <input
      type="range"
      min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-1.5 rounded-full appearance-none bg-slate-800 cursor-pointer outline-none hover:bg-slate-700 transition-colors"
      style={{ accentColor: accent }}
    />
    <span className="w-16 text-right font-mono text-[13px] tabular-nums font-semibold" style={{ color: accent }}>
      {Number(value).toFixed(1)}<span className="text-[10px] text-slate-500 ml-0.5">{unit}</span>
    </span>
  </div>
);

const DarkBtn = ({ onClick, children, accent = C.cyan, filled = false }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 select-none ${filled ? 'hover:scale-105 active:scale-95' : 'hover:bg-slate-800 active:scale-95'}`}
    style={{
      background: filled ? accent : 'rgba(15, 23, 42, 0.6)',
      color: filled ? '#020617' : accent,
      border: `1px solid ${accent}${filled ? '00' : '55'}`,
      boxShadow: filled ? `0 4px 15px ${accent}44` : 'none',
    }}
  >
    {children}
  </button>
);

const HintBadge = ({ show, children, accent = C.cyan }) => {
  if (!show) return null;
  return (
    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: 24 }}>
      <div
        className="px-6 py-2.5 rounded-full backdrop-blur-md text-xs tracking-[0.3em] font-mono font-bold animate-pulse shadow-lg"
        style={{
          border: `1px solid ${accent}66`,
          background: 'rgba(2, 6, 23, 0.85)',
          color: accent,
          boxShadow: `0 0 20px ${accent}22`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================================
// 场景一：猎人与猴子
// ============================================================
function HunterMonkeyScene() {
  const canvasRef = useRef(null);
  const [v0, setV0] = useState(28);
  const [isPlaying, setIsPlaying] = useState(false);
  const params = useRef({ v0: 28, t: 0, playing: false });
  useEffect(() => { params.current.v0 = v0; }, [v0]);
  const L = 40, Hh = 30;
  const theta = Math.atan2(Hh, L);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let ctx = null, W = 0, H = 0, bg = null;
    let lastTime = performance.now();

    const resize = () => {
      const r = initCanvas(canvas);
      ctx = r.ctx; W = r.W; H = r.H;
      bg = buildBg(W, H, r.dpr);
    };
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      resize();
    });
    ro.observe(canvas);
    resize();

    const draw = () => {
      if (!ctx || !bg) return;
      const { v0: currV0, t } = params.current;
      const tEnd = Hh / (currV0 * Math.sin(theta));

      ctx.drawImage(bg, 0, 0, W, H);

      const padL = Math.min(90, W * 0.12);
      const padR = Math.min(220, W * 0.24);
      const padT = 120, padB = 70;
      const scale = Math.min((W - padL - padR) / L, (H - padT - padB) / Hh);
      const ox = padL, oy = H - padB;
      const treeX = ox + L * scale, treeTopY = oy - Hh * scale;

      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
      ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(treeX, oy); ctx.lineTo(treeX, treeTopY); ctx.stroke();
      ctx.restore();

      drawRightAngle(ctx, treeX, oy, treeX - 30, oy, treeX, treeTopY, 11, 'rgba(148, 163, 184, 0.6)');

      dashLine(ctx, ox, oy, treeX, treeTopY, C.cyanSoft, 1.8, [6, 6]);

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const s = (tEnd * i) / steps;
        const px = ox + currV0 * Math.cos(theta) * s * scale;
        const py = oy - (currV0 * Math.sin(theta) * s - 0.5 * G * s * s) * scale;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      const tt = Math.min(t, tEnd);
      const mx = treeX, my = oy - (Hh - 0.5 * G * tt * tt) * scale;
      const bx = ox + currV0 * Math.cos(theta) * tt * scale;
      const by = oy - (currV0 * Math.sin(theta) * tt - 0.5 * G * tt * tt) * scale;

      if (tt > 0.02 && tt < tEnd - 0.001) {
        arrow(ctx, mx, my, bx, by, C.emerald, 2.2, 9, 2);
        text(ctx, '相对匀速 v₀t', (mx + bx) / 2 - 12, (my + by) / 2 - 16, C.emerald, 'bold 13px system-ui', 'right');
      }

      dot(ctx, mx, my, 10, C.rose, 6);
      text(ctx, '🐒', mx, my + 1, C.text, '17px sans-serif', 'center');
      dot(ctx, bx, by, 5.5, C.cyan, 6);

      if (t >= tEnd - 0.01 && t < tEnd + 0.6) {
        const prog = Math.max(0, Math.min(1, (t - tEnd + 0.01) / 0.5));
        ctx.save();
        ctx.strokeStyle = `rgba(251, 191, 36, ${1 - prog})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = C.amber;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(mx, my, 14 + prog * 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const hudMaxW = Math.max(280, W - INFO_W - 60);
      hudLabel(ctx, '场景 01 · 猎人与猴子', `时间 = ${t.toFixed(2)} s  |  初速 v₀ = ${currV0.toFixed(1)} m/s`, hudMaxW);
      if (t >= tEnd - 0.01) {
        infoCard(ctx, W, 24, [
          { text: '✓ 命中目标 TARGET HIT', color: C.amber, bold: true },
          { text: `飞行时间 t = ${tEnd.toFixed(3)} s`, color: C.text },
          { text: `水平距离 x = ${L.toFixed(1)} m`, color: C.text },
          { text: '非惯性系：子弹相对匀速', color: C.emerald },
        ]);
      }
    };

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (params.current.playing) {
        params.current.t += dt;
        const currTEnd = Hh / (params.current.v0 * Math.sin(theta));
        if (params.current.t >= currTEnd + 0.6) {
          params.current.t = currTEnd + 0.6;
          params.current.playing = false;
          setIsPlaying(false);
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  const handleFire = () => { params.current.t = 0; params.current.playing = true; setIsPlaying(true); };
  const handleReset = () => { params.current.t = 0; params.current.playing = false; setIsPlaying(false); };

  return (
    <div className="w-full bg-[#020617] touch-none">
      <div className="relative w-full overflow-hidden" style={{ height: CANVAS_H }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <HintBadge show={!isPlaying} accent={C.cyan}>[ 点击发射按钮启动演算 ]</HintBadge>
      </div>
      <div className="flex flex-wrap items-center gap-5 border-t border-slate-800 bg-slate-950/95 px-6 py-4">
        <ControlSlider label="初速度" symbol="v₀" value={v0} min={18} max={45} step={0.5} onChange={(v) => { setV0(v); handleReset(); }} unit="m/s" accent={C.cyan} />
        <div className="flex gap-3">
          <DarkBtn onClick={handleReset}>重置</DarkBtn>
          <DarkBtn onClick={handleFire} filled>发射</DarkBtn>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 场景二：固定高度斜抛最远射程
// ============================================================
function MaxRangeScene() {
  const canvasRef = useRef(null);
  const [v0, setV0] = useState(20);
  const [angleDeg, setAngleDeg] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);

  const simData = useRef({ v0: 20, angleDeg: 30, t: 0, playing: false });
  useEffect(() => { 
    simData.current.v0 = v0;
    simData.current.angleDeg = angleDeg; 
  }, [v0, angleDeg]);

  const h = 15;
  const optimalDeg = Math.atan(v0 / Math.sqrt(v0 * v0 + 2 * G * h)) * 180 / Math.PI;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let ctx = null, W = 0, H = 0, bg = null;
    let lastTime = performance.now();

    const resize = () => {
      const r = initCanvas(canvas);
      ctx = r.ctx; W = r.W; H = r.H;
      bg = buildBg(W, H, r.dpr);
    };
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      resize();
    });
    ro.observe(canvas);
    resize();

    const draw = () => {
      if (!ctx || !bg) return;
      ctx.drawImage(bg, 0, 0, W, H);

      const { v0: currV0, angleDeg: currAngleDeg, t: simTime } = simData.current;
      
      const currentOptimalDeg = Math.atan(currV0 / Math.sqrt(currV0 * currV0 + 2 * G * h)) * 180 / Math.PI;
      const angle = currAngleDeg * Math.PI / 180;
      const isOptimal = Math.abs(currAngleDeg - currentOptimalDeg) < 1.2;

      const v0y = currV0 * Math.sin(angle);
      const v0x = currV0 * Math.cos(angle);
      const a = -0.5 * G, b = v0y, c = h;
      const tLand = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      const xLand = v0x * tLand;
      const xMaxOpt = (currV0 / G) * Math.sqrt(currV0 * currV0 + 2 * G * h);

      const peakParabola = h + (v0y > 0 ? (v0y * v0y) / (2 * G) : 0);
      const peakVector = h + v0y * tLand;
      const highestY = Math.max(h, peakParabola, peakVector);
      const lowestY = Math.min(0, h - 0.5 * G * tLand * tLand);

      const padL = 100;
      const padR = Math.min(300, W * 0.30);
      const padT = 150;
      const padB = 80;
      const availW = W - padL - padR;
      const availH = H - padT - padB;

      const reqW = Math.max(xMaxOpt * 1.12, xLand * 1.12, 55);
      const reqH = (highestY - lowestY);

      const scale = Math.min(availW / reqW, availH / Math.max(reqH * 1.06, 35));
      const ox = padL;
      const oy = padT + highestY * scale;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.fillRect(0, oy, W, H - oy);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();

      ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(ox - 12, oy - h * scale, 24, h * scale, 3);
      ctx.fill(); ctx.stroke();
      ctx.restore();

      drawRightAngle(ctx, ox, oy, ox + 35, oy, ox, oy - 35, 11, 'rgba(148, 163, 184, 0.55)');

      const dimX = ox - 28;
      const topY = oy - h * scale;
      ctx.save();
      ctx.strokeStyle = C.slate;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(dimX - 6, topY); ctx.lineTo(dimX + 6, topY);
      ctx.moveTo(dimX - 6, oy);   ctx.lineTo(dimX + 6, oy);
      ctx.moveTo(dimX, topY);     ctx.lineTo(dimX, oy);
      ctx.stroke();
      arrow(ctx, dimX, (topY + oy) / 2 - 4, dimX, topY, C.slate, 1.2, 5);
      arrow(ctx, dimX, (topY + oy) / 2 + 4, dimX, oy, C.slate, 1.2, 5);
      text(ctx, `h = ${h}m`, dimX - 10, (topY + oy) / 2, C.text, 'bold 12px system-ui', 'right');
      ctx.restore();

      dashLine(ctx, ox + xMaxOpt * scale, oy, ox + xMaxOpt * scale, oy - 24, 'rgba(148, 163, 184, 0.5)', 1.4, [4, 4]);

      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ox, oy - h * scale);
      const steps = 90;
      for (let i = 1; i <= steps; i++) {
        const s = (tLand * i) / steps;
        ctx.lineTo(
          ox + currV0 * Math.cos(angle) * s * scale,
          oy - (h + currV0 * Math.sin(angle) * s - 0.5 * G * s * s) * scale
        );
      }
      ctx.stroke();
      ctx.restore();

      const tt = Math.min(simTime, tLand);

      if (simTime > 0) {
        const startX = ox;
        const startY = oy - h * scale;

        const qx_curr = startX + currV0 * Math.cos(angle) * tt * scale;
        const qy_curr = startY - currV0 * Math.sin(angle) * tt * scale;
        const px_curr = qx_curr;
        const py_curr = qy_curr + 0.5 * G * tt * tt * scale;
        const fallX = startX;
        const fallY = startY + 0.5 * G * tt * tt * scale;

        dashLine(ctx, startX, startY, qx_curr, qy_curr, C.cyanSoft, 1.8, [4, 4]);
        arrow(ctx, startX, startY, fallX, fallY, C.rose, 2.4, 9, 2);
        arrow(ctx, fallX, fallY, px_curr, py_curr, C.emerald, 2.8, 10, 4);
        arrow(ctx, qx_curr, qy_curr, px_curr, py_curr, C.amber, 2.4, 9, 2);

        dot(ctx, fallX, fallY, 4.5, C.rose, 6);
        text(ctx, "O'", fallX - 16, fallY + 16, C.rose, 'bold 14px system-ui', 'right');
        dot(ctx, px_curr, py_curr, 5.5, C.cyan, 6);

        if (tt > 0.1) {
          text(ctx, "相对匀速 v₀t", (fallX + px_curr) / 2, (fallY + py_curr) / 2 - 16, C.emerald, 'bold 13.5px system-ui', 'center');
          text(ctx, "½gt²", fallX - 14, (startY + fallY) / 2, C.rose, 'bold 13.5px system-ui', 'right');
        }
      }

      if (simTime >= tLand) {
        const qx = currV0 * Math.cos(angle) * tLand, qy = h + currV0 * Math.sin(angle) * tLand;
        const qPx = ox + qx * scale, qPy = oy - qy * scale, pPx = ox + xLand * scale;

        arrow(ctx, ox, oy - h * scale, qPx, qPy, C.cyan, 2.6, 10, 2);
        arrow(ctx, qPx, qPy, pPx, oy, C.rose, 2.6, 10, 2);

        const mx = ox + (qx / 2) * scale;
        const my = oy - (h + currV0 * Math.sin(angle) * tLand / 2) * scale;
        dot(ctx, mx, my, 5, C.violet, 6);
        dashLine(ctx, mx, my, pPx, oy, C.violet, 2.2, [6, 4]);

        if (isOptimal) {
          drawRightAngle(ctx, mx, my, qPx, qPy, pPx, oy, 14, C.amber, true);
          text(ctx, 'MP ⊥ OQ (垂直平分)', (mx + pPx) / 2 - 16, (my + oy) / 2 - 12, C.amber, 'bold 14px system-ui', 'right');
        } else {
          text(ctx, '中线 MP', (mx + pPx) / 2 - 14, (my + oy) / 2 - 10, C.violet, 'italic bold 13.5px serif', 'right');
        }

        dot(ctx, ox, oy - h * scale, 5, C.cyan, 6);
        text(ctx, 'O', ox - 20, oy - h * scale - 14, C.cyan, 'bold 15px serif', 'center');
        dot(ctx, pPx, oy, 6, C.rose, 6);
        text(ctx, 'P', pPx + 10, oy + 20, C.rose, 'bold 15px serif', 'left');
        dot(ctx, qPx, qPy, 5, C.cyan, 6);
        text(ctx, 'Q', qPx + 12, qPy - 14, C.cyan, 'bold 15px serif', 'left');
      }

      if (isOptimal) {
        infoCard(ctx, W, 24, [
          { text: '★ 达成极值几何条件', color: C.amber, bold: true },
          { text: '末速度 ⊥ 初速度 (vₜ ⊥ v₀)', color: C.emerald },
          { text: 'MP ⊥ OQ (中垂线垂直)', color: C.violet },
          { text: '最佳角解析式：', color: C.textDim },
          { text: 'tan θ = v₀ / √(v₀² + 2gh)', color: C.cyan, bold: true },
          { text: `最佳角度 θ = ${currentOptimalDeg.toFixed(1)}°`, color: C.amber, bold: true },
        ]);
      } else {
        infoCard(ctx, W, 24, [
          { text: '● 几何参数状态', color: C.cyan, bold: true },
          { text: `当前初速 v₀ = ${currV0.toFixed(1)} m/s`, color: C.text },
          { text: `当前抛角 θ = ${currAngleDeg.toFixed(1)}°`, color: C.text },
          { text: `落点射程 x = ${xLand.toFixed(2)} m`, color: C.text },
          { text: '最佳角解析式：', color: C.textDim },
          { text: 'tan θ = v₀ / √(v₀² + 2gh)', color: C.cyan },
          { text: `目标最优 θ = ${currentOptimalDeg.toFixed(1)}°`, color: C.rose },
        ]);
      }

      const showTime = simTime > 0 && simTime < tLand + 0.1 ? `时间 = ${tt.toFixed(2)} s` : `射程 = ${xLand.toFixed(2)} m`;
      const msg = isOptimal ? '★ 最优极值' : `差距 ${(xMaxOpt - xLand).toFixed(2)} m`;
      const hudMaxW = Math.max(280, W - INFO_W - 60);
      hudLabel(ctx, '场景 02 · 最远射程几何', `v₀ = ${currV0.toFixed(1)} m/s  |  θ = ${currAngleDeg.toFixed(1)}°  |  ${showTime}  |  ${msg}`, hudMaxW);
    };

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (simData.current.playing) {
        simData.current.t += dt;
        const angle = simData.current.angleDeg * Math.PI / 180;
        const currV0 = simData.current.v0;
        const a = -0.5 * G, b = currV0 * Math.sin(angle), c = h;
        const tLand = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
        if (simData.current.t >= tLand + 0.5) {
          simData.current.t = tLand + 0.5;
          simData.current.playing = false;
          setIsPlaying(false);
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  const handleFire = () => { simData.current.t = 0; simData.current.playing = true; setIsPlaying(true); };
  const handleReset = () => { simData.current.t = 0; simData.current.playing = false; setIsPlaying(false); };

  return (
    <div className="w-full bg-[#020617] touch-none">
      <div className="relative w-full overflow-hidden" style={{ height: CANVAS_H }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <HintBadge show={!isPlaying && simData.current.t === 0} accent={C.emerald}>
          [ 点击动态演算观察平动非惯性系 ]
        </HintBadge>
      </div>
      <div className="flex flex-wrap items-center gap-5 border-t border-slate-800 bg-slate-950/95 px-6 py-4">
        <ControlSlider label="初速度" symbol="v₀" value={v0} min={10} max={40} step={0.5} onChange={(v) => { setV0(v); handleReset(); }} unit="m/s" accent={C.cyan} />
        <ControlSlider label="抛射角" symbol="θ" value={angleDeg} min={10} max={80} step={0.5} onChange={(v) => { setAngleDeg(v); handleReset(); }} unit="°" accent={C.rose} />
        <div className="flex gap-3">
          <DarkBtn onClick={handleReset}>重置</DarkBtn>
          <DarkBtn onClick={handleFire} filled accent={C.emerald}>动态演算</DarkBtn>
          <DarkBtn onClick={() => { setAngleDeg(optimalDeg); handleReset(); }} filled accent={C.amber}>
            跳至最优 {optimalDeg.toFixed(1)}°
          </DarkBtn>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 场景三：山沟救援物资
// ============================================================
function ValleyScene() {
  const canvasRef = useRef(null);
  const [v0, setV0] = useState(12);
  const [angleDeg, setAngleDeg] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);

  const R = 30;
  const v0Max = Math.sqrt(2 * G * R) * 0.92;

  const simData = useRef({
    v0: 12, angleDeg: 30, t: 0, playing: false, cachedHit: null,
  });

  const findLandingExact = useCallback((v0v, thetaDeg) => {
    const th = thetaDeg * Math.PI / 180;
    const v0x = v0v * Math.cos(th), v0y = v0v * Math.sin(th);
    let t = 0.05, dt = 0.05;
    while (t < 10) {
      const x = v0x * t, y = v0y * t - 0.5 * G * t * t;
      if (x > 0 && y < 0 && x * x + y * y >= R * R) {
        let tL = t - dt, tR = t;
        for (let i = 0; i < 12; i++) {
          const tm = (tL + tR) / 2;
          const xm = v0x * tm, ym = v0y * tm - 0.5 * G * tm * tm;
          if (xm * xm + ym * ym >= R * R) tR = tm; else tL = tm;
        }
        return { t: tR, x: v0x * tR, y: v0y * tR - 0.5 * G * tR * tR };
      }
      t += dt;
    }
    return null;
  }, []);

  useEffect(() => {
    simData.current.v0 = v0;
    simData.current.angleDeg = angleDeg;
    simData.current.cachedHit = findLandingExact(v0, angleDeg);
  }, [v0, angleDeg, findLandingExact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let ctx = null, W = 0, H = 0, bg = null;
    let lastTime = performance.now();

    const resize = () => {
      const r = initCanvas(canvas);
      ctx = r.ctx; W = r.W; H = r.H;
      bg = buildBg(W, H, r.dpr);
    };
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      resize();
    });
    ro.observe(canvas);
    resize();

    const draw = () => {
      if (!ctx || !bg) return;
      ctx.drawImage(bg, 0, 0, W, H);

      const { v0: currV0, angleDeg: currAngleDeg, t: simTime, cachedHit } = simData.current;

      const padL = 100;
      const padR = Math.min(300, W * 0.30);
      const padT = 150;
      const padB = 80;
      const availW = W - padL - padR;
      const availH = H - padT - padB;

      let reqH = R * 1.2;
      let highestY = 0;
      let reqW = R * 1.15;

      if (cachedHit) {
        const v0y = currV0 * Math.sin(currAngleDeg * Math.PI / 180);
        const v0x = currV0 * Math.cos(currAngleDeg * Math.PI / 180);

        const peakParabola = v0y > 0 ? (v0y * v0y) / (2 * G) : 0;
        const peakVector = v0y * cachedHit.t;
        highestY = Math.max(0, peakParabola, peakVector);

        const lowestY = Math.min(-R, -0.5 * G * cachedHit.t * cachedHit.t);
        reqH = highestY - lowestY;
        reqW = Math.max(R * 1.12, v0x * cachedHit.t * 1.12);
      }

      const scale = Math.min(availW / reqW, availH / Math.max(reqH * 1.06, R));
      const ox = padL;
      const oy = padT + highestY * scale;

      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + R * scale); ctx.stroke();
      ctx.beginPath(); ctx.arc(ox, oy, R * scale, 0, Math.PI / 2); ctx.stroke();
      ctx.restore();

      drawRightAngle(ctx, ox, oy, ox + 35, oy, ox, oy + 35, 11, 'rgba(148, 163, 184, 0.55)');

      dashLine(ctx, ox - 30, oy, ox + availW + 10, oy, 'rgba(148, 163, 184, 0.35)', 1.6, [5, 5]);
      dot(ctx, ox, oy, 5, C.cyan, 6);
      text(ctx, 'O', ox - 20, oy - 14, C.cyan, 'bold 15px serif', 'center');

      const hudMaxW = Math.max(280, W - INFO_W - 60);

      if (!cachedHit) {
        hudLabel(ctx, '场景 03 · 山沟救援物资', '无法到达圆弧 · 请调整参数', hudMaxW);
        return;
      }

      const { t: tHit, x, y } = cachedHit;
      const th = currAngleDeg * Math.PI / 180;
      const tt = Math.min(simTime, tHit);

      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      const steps = 64;
      for (let i = 1; i <= steps; i++) {
        const s = (tHit * i) / steps;
        ctx.lineTo(
          ox + currV0 * Math.cos(th) * s * scale,
          oy - (currV0 * Math.sin(th) * s - 0.5 * G * s * s) * scale
        );
      }
      ctx.stroke();
      ctx.restore();

      if (simTime > 0) {
        const qx_curr = ox + currV0 * Math.cos(th) * tt * scale;
        const qy_curr = oy - currV0 * Math.sin(th) * tt * scale;
        const px_curr = qx_curr;
        const py_curr = oy - (currV0 * Math.sin(th) * tt - 0.5 * G * tt * tt) * scale;
        const fallX = ox;
        const fallY = oy + 0.5 * G * tt * tt * scale;

        dashLine(ctx, ox, oy, qx_curr, qy_curr, C.cyanSoft, 1.8, [4, 4]);
        arrow(ctx, ox, oy, fallX, fallY, C.rose, 2.4, 9, 2);
        arrow(ctx, fallX, fallY, px_curr, py_curr, C.emerald, 2.8, 10, 4);
        arrow(ctx, qx_curr, qy_curr, px_curr, py_curr, C.amber, 2.4, 9, 2);

        dot(ctx, fallX, fallY, 4.5, C.rose, 6);
        text(ctx, "O'", fallX - 16, fallY + 16, C.rose, 'bold 14px system-ui', 'right');
        dot(ctx, px_curr, py_curr, 5.5, C.cyan, 6);

        if (tt > 0.1) {
          text(ctx, "相对匀速 v₀t", (fallX + px_curr) / 2, (fallY + py_curr) / 2 - 16, C.emerald, 'bold 13.5px system-ui', 'center');
          text(ctx, "½gt²", fallX - 14, (oy + fallY) / 2, C.rose, 'bold 13.5px system-ui', 'right');
        }
      }

      const vtx = currV0 * Math.cos(th), vty = currV0 * Math.sin(th) - G * tHit;
      const vt = Math.hypot(vtx, vty);
      const thetaOpt = Math.atan(currV0 / Math.sqrt(Math.max(2 * G * R - currV0 * currV0, 0.01))) * 180 / Math.PI;
      const isOptimal = Math.abs(currAngleDeg - thetaOpt) < 1.5;

      if (simTime >= tHit) {
        const px = ox + x * scale, py = oy - y * scale;
        const qx = currV0 * Math.cos(th) * tHit, qy = currV0 * Math.sin(th) * tHit;

        arrow(ctx, ox, oy, px, py, C.cyan, 2.6, 10, 2);
        arrow(ctx, ox + qx * scale, oy - qy * scale, px, py, C.rose, 2.6, 10, 2);

        const mx = ox + (qx / 2) * scale, my = oy - (qy / 2) * scale;
        dot(ctx, mx, my, 5, C.violet, 6);
        dashLine(ctx, mx, my, px, py, C.violet, 2.2, [6, 4]);

        if (isOptimal) {
          drawRightAngle(ctx, mx, my, ox, oy, px, py, 14, C.amber, true);
          text(ctx, 'PM ⊥ OQ', mx + 12, my - 14, C.amber, 'bold 14px system-ui', 'left');
        } else {
          text(ctx, 'M', mx + 10, my - 12, C.violet, 'bold 15px serif', 'left');
        }

        dot(ctx, px, py, 6, C.cyan, 6);
        text(ctx, 'P', px + 16, py + 16, C.cyan, 'bold 16px serif', 'left');
        dot(ctx, ox + qx * scale, oy - qy * scale, 5, C.cyan, 6);
        text(ctx, 'Q', ox + qx * scale + 14, oy - qy * scale - 14, C.cyan, 'bold 15px serif', 'left');
      }

      if (isOptimal) {
        infoCard(ctx, W, 24, [
          { text: '★ 极值：等腰三角形成立', color: C.amber, bold: true },
          { text: '等腰降维：OP = QP = R', color: C.emerald },
          { text: 'PM ⊥ OQ (中垂线垂直)', color: C.violet },
          { text: '最佳角解析式：', color: C.textDim },
          { text: 'tan θ = v₀ / √(2gR - v₀²)', color: C.cyan, bold: true },
          { text: `最佳角度 θ = ${thetaOpt.toFixed(1)}°`, color: C.amber, bold: true },
        ]);
      } else {
        infoCard(ctx, W, 24, [
          { text: '● 几何参数状态', color: C.cyan, bold: true },
          { text: `OP = ${Math.hypot(x, y).toFixed(2)} m`, color: C.cyan },
          { text: `QP = ${Math.hypot(currV0 * Math.cos(th) * tHit - x, currV0 * Math.sin(th) * tHit - y).toFixed(2)} m`, color: C.rose },
          { text: '最佳角解析式：', color: C.textDim },
          { text: 'tan θ = v₀ / √(2gR - v₀²)', color: C.cyan },
          { text: `目标最优 θ = ${thetaOpt.toFixed(1)}°`, color: C.rose },
        ]);
      }

      const showTime = simTime > 0 && simTime < tHit + 0.1 ? `时间 = ${tt.toFixed(2)} s` : `末速度 = ${vt.toFixed(2)} m/s`;
      hudLabel(ctx, '场景 03 · 山沟救援物资', `初速 v₀ = ${currV0.toFixed(1)}  抛角 θ = ${currAngleDeg.toFixed(1)}°  ${showTime}`, hudMaxW);
    };

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (simData.current.playing) {
        simData.current.t += dt;
        const hit = simData.current.cachedHit;
        if (hit && simData.current.t >= hit.t + 0.5) {
          simData.current.t = hit.t + 0.5;
          simData.current.playing = false;
          setIsPlaying(false);
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [findLandingExact]);

  const thetaOpt = Math.atan(v0 / Math.sqrt(Math.max(2 * G * R - v0 * v0, 0.01))) * 180 / Math.PI;

  const handleFire = () => { simData.current.t = 0; simData.current.playing = true; setIsPlaying(true); };
  const handleReset = () => { simData.current.t = 0; simData.current.playing = false; setIsPlaying(false); };

  return (
    <div className="w-full bg-[#020617] touch-none">
      <div className="relative w-full overflow-hidden" style={{ height: CANVAS_H }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <HintBadge show={!isPlaying && simData.current.t === 0} accent={C.emerald}>
          [ 点击动态演算观察平动非惯性系 ]
        </HintBadge>
      </div>
      <div className="flex flex-wrap items-center gap-5 border-t border-slate-800 bg-slate-950/95 px-6 py-4">
        <ControlSlider label="初速度" symbol="v₀" value={v0} min={5} max={v0Max} step={0.2} onChange={(v) => { setV0(v); handleReset(); }} unit="m/s" accent={C.cyan} />
        <ControlSlider label="抛射角" symbol="θ" value={angleDeg} min={-20} max={70} step={0.5} onChange={(v) => { setAngleDeg(v); handleReset(); }} unit="°" accent={C.rose} />
        <div className="flex gap-3">
          <DarkBtn onClick={handleReset}>重置</DarkBtn>
          <DarkBtn onClick={handleFire} filled accent={C.emerald}>动态演算</DarkBtn>
          <DarkBtn onClick={() => { setAngleDeg(thetaOpt); handleReset(); }} filled accent={C.amber}>
            跳至最优 {thetaOpt.toFixed(1)}°
          </DarkBtn>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 主容器及导航
// ============================================================
export default function KinematicsLab() {
  const [tab, setTab] = useState(0);

  const tabs = [
    {
      title: '01 · 猎人与猴子', badge: '核心基础', accent: C.cyan,
      desc: {
        tag: '模块 01',
        title: '非惯性系同步下落',
        body: '抛体与自由落体在竖直方向共享同一个重力加速度，牵连位移 ½gt² 完全同步。',
        formula: 'y_p(t) - y_m(t) = 0',
      },
      comp: <HunterMonkeyScene />,
    },
    {
      title: '02 · 最远射程几何', badge: '极值定理', accent: C.rose,
      desc: {
        tag: '模块 02',
        title: '末速度垂直判据',
        body: '非惯性系相对初速度方向匀速直线运动。最远射程时末速度垂直初速度，MP 垂直平分 OQ。',
        formula: 'tan θ = v₀ / √(v₀² + 2gh)',
      },
      comp: <MaxRangeScene />,
    },
    {
      title: '03 · 山沟救援物资', badge: '高阶应用', accent: C.amber,
      desc: {
        tag: '模块 03',
        title: '等腰三角形降维',
        body: '落到圆弧上末速率最小时，位移几何图退化为等腰三角形 OP = QP = R，PM 垂直 OQ。',
        formula: 'tan θ = v₀ / √(2gR - v₀²)',
      },
      comp: <ValleyScene />,
    },
  ];

  const cur = tabs[tab];

  return (
    <div className="w-full max-w-6xl mx-auto overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-cyan-900/20 select-none font-sans flex flex-col">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-11 rounded-full transition-colors duration-500" style={{ background: cur.accent, boxShadow: `0 0 15px ${cur.accent}99` }} />
          <div>
            <h2 className="text-xl md:text-[22px] font-black tracking-wider text-slate-100 uppercase">Kinematics Decomposition Lab</h2>
            <p className="mt-1 text-[10px] md:text-xs tracking-[0.25em] text-cyan-500 font-mono font-semibold">运动学进阶 · 位移斜交分解仿真引擎 V4.0 Final</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/80 shadow-inner">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: cur.accent }} />
            <span className="relative inline-flex rounded-full h-3 w-3 transition-colors duration-500" style={{ background: cur.accent }} />
          </span>
          <span className="text-xs font-mono text-slate-300 font-bold tracking-widest">{cur.badge} 模式激活</span>
        </div>
      </div>

      <div className="p-3.5 bg-slate-950 flex flex-wrap gap-3">
        {tabs.map((t, i) => (
          <button
            key={t.title}
            onClick={() => setTab(i)}
            className={`flex-1 rounded-xl py-3.5 text-xs md:text-sm font-bold tracking-wide transition-all duration-300 border ${tab === i ? 'bg-slate-900 text-slate-50' : 'bg-slate-900/40 text-slate-500 border-slate-800/80 hover:bg-slate-800 hover:text-slate-300 hover:border-slate-700'}`}
            style={tab === i ? { borderColor: `${t.accent}99`, boxShadow: `0 4px 20px ${t.accent}25`, color: t.accent } : {}}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className="relative border-b border-slate-800">{cur.comp}</div>

      <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-950 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
        {tabs.map((t, i) => (
          <div key={t.title} className={`p-6 flex flex-col justify-center transition-colors duration-500 ${tab === i ? 'bg-slate-900/50' : ''}`}>
            <span className="text-[11px] font-mono font-bold tracking-widest mb-1.5" style={{ color: tab === i ? t.accent : C.textDim }}>{t.desc.tag}</span>
            <h3 className="text-sm md:text-[15px] font-bold mb-2.5 tracking-wide" style={{ color: tab === i ? t.accent : '#e2e8f0' }}>{t.desc.title}</h3>
            <p className="text-xs md:text-[13px] text-slate-400 leading-relaxed mb-4">{t.desc.body}</p>
            <div className="mt-auto flex items-center">
              <span className="font-mono font-bold text-xs px-3 py-1.5 rounded-md border tracking-wider transition-colors duration-500" style={{ color: tab === i ? t.accent : C.textDim, borderColor: tab === i ? `${t.accent}55` : 'rgba(51, 65, 85, 0.5)', background: tab === i ? `${t.accent}11` : 'transparent' }}>
                {t.desc.formula}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}