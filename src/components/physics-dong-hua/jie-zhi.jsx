 'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* ============================================================================
   通用工具函数
============================================================================ */
// 背景文本绘制（兼容所有浏览器，手动绘制圆角矩形）
const drawTextWithBg = (ctx, text, x, y, textColor = '#fff', bgColor = 'rgba(15,23,42,0.75)', fontSize = 14, align = 'left') => {
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;
  const padX = 8, padY = 5;
  let rx = x;
  if (align === 'center') rx = x - textWidth / 2;
  else if (align === 'right') rx = x - textWidth;

  const rectX = rx - padX;
  const rectY = y - textHeight + 2;
  const rectW = textWidth + padX * 2;
  const rectH = textHeight + padY * 2;
  const radius = 4;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.moveTo(rectX + radius, rectY);
  ctx.lineTo(rectX + rectW - radius, rectY);
  ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius);
  ctx.lineTo(rectX + rectW, rectY + rectH - radius);
  ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH);
  ctx.lineTo(rectX + radius, rectY + rectH);
  ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius);
  ctx.lineTo(rectX, rectY + radius);
  ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
};

// 绘制带实心三角箭头的矢量
const drawVector = (ctx, x, y, length, angle, color, lineWidth = 2, label = '') => {
  if (Math.abs(length) < 0.5) return;
  const absLen = Math.abs(length);
  const dir = length < 0 ? angle + Math.PI : angle;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(absLen - 4, 0);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(absLen, 0);
  ctx.lineTo(absLen - 10, -5);
  ctx.lineTo(absLen - 10, 5);
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.rotate(-dir);
    drawTextWithBg(ctx, label, 5, -14, color, 'rgba(15,23,42,0.85)', 12, 'left');
  }
  ctx.restore();
};

/* ============================================================================
   UI：滑块组件
============================================================================ */
const Slider = ({ label, value, onChange, min, max, step = 1, unit = '', color = 'cyan' }) => {
  const colorMap = {
    cyan:    { accent: 'accent-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-950/40' },
    purple:  { accent: 'accent-purple-500', text: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-950/40' },
    rose:    { accent: 'accent-rose-500', text: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-950/40' },
    emerald: { accent: 'accent-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-950/40' },
  };
  const c = colorMap[color] || colorMap.cyan;
  return (
    <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl flex flex-col gap-3 hover:border-slate-600/60 transition-colors">
      <div className="flex justify-between items-center gap-3">
        <span className="text-slate-200 font-medium text-sm">{label}</span>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono border ${c.text} ${c.border} ${c.bg}`}>
          {value.toFixed(1)} <span className="opacity-60">{unit}</span>
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`w-full h-2 bg-slate-900/80 rounded-lg appearance-none cursor-pointer ${c.accent}`} />
    </div>
  );
};

/* ============================================================================
   自定义 Hook：Canvas 动画管理（稳定依赖版本）
============================================================================ */
const useCanvas = (drawFn) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawRef = useRef(drawFn);
  const rafRef = useRef(null);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  // 每次渲染更新最新绘制函数
  useEffect(() => {
    drawRef.current = drawFn;
  });

  const updateSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  }, []);

  useEffect(() => {
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let running = true;

    const animate = (now) => {
      if (!running) return;
      const dt = lastTimeRef.current ? Math.min((now - lastTimeRef.current) / 1000, 0.1) : 0.016;
      lastTimeRef.current = now;
      timeRef.current += dt;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0) {
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawRef.current(ctx, w, h, timeRef.current, dt);
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);
    return () => { running = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []); // 空依赖数组，动画循环永不重建

  return { canvasRef, containerRef };
};

/* ============================================================================
   板块一：介质极化与退极化场（自洽求解）
============================================================================ */
const PolarizationRigorousSim = () => {
  const [E_ext, setE_ext] = useState(80);
  const [chi, setChi] = useState(50);

  const dipoles = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    row: Math.floor(i / 10), col: i % 10, phase: Math.random() * Math.PI * 2,
  })), []);

  const draw = useCallback((ctx, w, h, time) => {
    ctx.clearRect(0, 0, w, h);
    const boxW = Math.min(420, w * 0.7);
    const boxH = Math.min(240, h * 0.6);
    const sx = (w - boxW) / 2;
    const sy = (h - boxH) / 2 - 25;

    // 退极化因子 N = 0.8（薄板近似），自洽极化强度 P = ε0 * χe * E0 / (1 + N * χe)
    const N = 0.8;
    const chi_abs = chi / 100;
    const P_factor = chi_abs / (1 + N * chi_abs);
    const P_mag = E_ext * P_factor;
    const E_depol = P_mag * 0.4;
    const E_total = E_ext - E_depol;

    // 背景电场线
    const numLines = Math.max(1, Math.floor(E_ext / 10));
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 12]);
    for (let i = 1; i <= numLines; i++) {
      const lineY = sy + (boxH / (numLines + 1)) * i;
      ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(w, lineY); ctx.stroke();
    }
    ctx.setLineDash([]);

    // 介质块
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(sx, sy, boxW, boxH);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, boxW, boxH);

    // 面束缚电荷渐变
    if (P_mag > 5) {
      const alpha = Math.min(P_mag / 100, 0.7);
      const gradLeft = ctx.createLinearGradient(sx, 0, sx + 30, 0);
      gradLeft.addColorStop(0, `rgba(59,130,246,${alpha})`);
      gradLeft.addColorStop(1, 'rgba(59,130,246,0)');
      ctx.fillStyle = gradLeft;
      ctx.fillRect(sx, sy, 30, boxH);

      const gradRight = ctx.createLinearGradient(sx + boxW - 30, 0, sx + boxW, 0);
      gradRight.addColorStop(0, 'rgba(239,68,68,0)');
      gradRight.addColorStop(1, `rgba(239,68,68,${alpha})`);
      ctx.fillStyle = gradRight;
      ctx.fillRect(sx + boxW - 30, sy, 30, boxH);

      drawTextWithBg(ctx, '−σ_p 束缚负电荷', sx + 15, sy + boxH + 22, '#60a5fa', 'rgba(15,23,42,0.85)', 12, 'center');
      drawTextWithBg(ctx, '+σ_p 束缚正电荷', sx + boxW - 15, sy + boxH + 22, '#f87171', 'rgba(15,23,42,0.85)', 12, 'center');
    }

    // 微观偶极子
    const cellW = boxW / 10, cellH = boxH / 6;
    dipoles.forEach(d => {
      const cx = sx + d.col * cellW + cellW / 2;
      const cy = sy + d.row * cellH + cellH / 2;
      const align = Math.min(P_mag / 100, 1);
      const jitter = Math.sin(time * 3 + d.phase) * (1 - align) * 0.8;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(jitter);
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(-8, 0, 4, 0, Math.PI * 2); ctx.fillStyle = '#3b82f6'; ctx.fill();
      ctx.beginPath(); ctx.arc(8, 0, 4, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
      ctx.restore();
    });

    // 内部净电场
    const numInner = Math.max(0, Math.floor(E_total / 10));
    for (let i = 1; i <= numInner; i++) {
      const lineY = sy + (boxH / (numInner + 1)) * i;
      drawVector(ctx, sx + 30, lineY, boxW - 60, 0, 'rgba(6, 182, 212, 0.8)', 2);
    }

    // 底部矢量对比
    const vy = sy + boxH + 65;
    drawVector(ctx, sx, vy, E_ext * 2, 0, '#06b6d4', 3, `E₀ = ${E_ext} V/m`);
    if (P_mag > 1) {
      drawVector(ctx, sx + E_ext * 2 + 40, vy, -E_depol * 2, 0, '#ec4899', 3, `E' = −${E_depol.toFixed(1)}`);
      drawVector(ctx, sx, vy + 35, E_total * 2, 0, '#22c55e', 3, `E = ${E_total.toFixed(1)}`);
    }
  }, [E_ext, chi, dipoles]);

  const { canvasRef, containerRef } = useCanvas(draw);

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} className="relative w-full h-[420px] bg-slate-950 rounded-xl border border-slate-700/60 shadow-inner overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Slider label="外加电场 E₀" value={E_ext} onChange={setE_ext} min={0} max={100} unit="V/m" color="cyan" />
        <Slider label="极化率 χₑ" value={chi} onChange={setChi} min={10} max={100} unit="%" color="purple" />
      </div>
    </div>
  );
};

/* ============================================================================
   板块二：磁化抵消
============================================================================ */
const MagnetizationBoundarySim = () => {
  const [B_ext, setB_ext] = useState(80);

  const draw = useCallback((ctx, w, h, time) => {
    ctx.clearRect(0, 0, w, h);
    const rows = 5, cols = 8, cell = 52;
    const sx = (w - cols * cell) / 2;
    const sy = (h - rows * cell) / 2 - 5;
    const align = Math.min(B_ext / 100, 1);

    // 背景磁场符号
    if (B_ext > 5) {
      const spacing = 50 - align * 15;
      const alpha = 0.1 + align * 0.25;
      for (let x = (time * 15) % spacing; x < w; x += spacing) {
        for (let y = spacing / 2; y < h; y += spacing) {
          ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4);
          ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4);
          ctx.stroke();
        }
      }
    }

    drawTextWithBg(ctx, `B₀ = ${B_ext.toFixed(0)} T  (⊗ 垂直向里)`, 20, 30, '#c084fc', 'rgba(15,23,42,0.85)', 15);

    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.fillRect(sx, sy, cols * cell, rows * cell);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, cols * cell, rows * cell);

    // 微观电流环
    const speed = 1 + align * 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = sx + c * cell + cell / 2;
        const cy = sy + r * cell + cell / 2;
        ctx.save(); ctx.translate(cx, cy);
        ctx.rotate(align < 0.1 ? r * 1.5 + c * 2.2 + time : time * speed);
        ctx.beginPath(); ctx.arc(0, 0, cell / 2 - 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.15 + align * 0.25})`; ctx.lineWidth = 1; ctx.stroke();
        const radius = cell / 2 - 5;
        ctx.beginPath(); ctx.arc(radius, 0, 3, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
        drawVector(ctx, 0, -radius, 8, 0, `rgba(239,68,68,${0.3 + align * 0.7})`, 1.5);
        ctx.restore();
      }
    }

    // 内部抵消标记
    if (align > 0.3) {
      ctx.strokeStyle = `rgba(244, 63, 94, ${align})`;
      ctx.lineWidth = 2.5;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c < cols - 1) {
            const px = sx + c * cell + cell, py = sy + r * cell + cell / 2;
            ctx.beginPath(); ctx.moveTo(px - 4, py - 4); ctx.lineTo(px + 4, py + 4);
            ctx.moveTo(px + 4, py - 4); ctx.lineTo(px - 4, py + 4); ctx.stroke();
          }
          if (r < rows - 1) {
            const px = sx + c * cell + cell / 2, py = sy + r * cell + cell;
            ctx.beginPath(); ctx.moveTo(px - 4, py - 4); ctx.lineTo(px + 4, py + 4);
            ctx.moveTo(px + 4, py - 4); ctx.lineTo(px - 4, py + 4); ctx.stroke();
          }
        }
      }
      drawTextWithBg(ctx, '内部相邻环流相互抵消', sx + cols * cell / 2, sy + rows * cell + 25, '#f43f5e', 'rgba(15,23,42,0.85)', 13, 'center');
    }

    // 边界磁化电流
    if (align > 0.1) {
      ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + align * 0.6})`;
      ctx.lineWidth = 2 + align * 3;
      ctx.strokeRect(sx, sy, cols * cell, rows * cell);
      ctx.shadowBlur = 0;
      drawTextWithBg(ctx, 'J_M  宏观表面磁化电流', sx + cols * cell / 2, sy - 15, '#c084fc', 'rgba(15,23,42,0.85)', 14, 'center');
    }
  }, [B_ext]);

  const { canvasRef, containerRef } = useCanvas(draw);

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} className="relative w-full h-[420px] bg-slate-950 rounded-xl border border-slate-700/60 shadow-inner overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      <Slider label="外加磁场 B₀" value={B_ext} onChange={setB_ext} min={0} max={100} unit="T" color="purple" />
    </div>
  );
};

/* ============================================================================
   板块三：极化电流起源
============================================================================ */
const PolarizationCurrentSim = () => {
  const [freq, setFreq] = useState(1);
  const [E0, setE0] = useState(100);

  const draw = useCallback((ctx, w, h, time) => {
    ctx.clearRect(0, 0, w, h);
    const omega = freq * Math.PI;
    const E_t = E0 * Math.sin(omega * time);
    const x_max = 25;
    const displacement = -(E_t / 100) * x_max;
    const velocity = -(E0 / 100) * x_max * omega * Math.cos(omega * time);
    const Jp = -velocity * 1.5;

    // 左侧微观
    const visX = 25, visY = 35, visW = w * 0.45, visH = Math.min(280, h * 0.6);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.fillRect(visX, visY, visW, visH);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.strokeRect(visX, visY, visW, visH);

    const eY = visY + visH + 35;
    drawVector(ctx, visX + visW / 2, eY, E_t, 0, '#06b6d4', 4, `E(t) = ${Math.round(E_t)}`);

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const cx = visX + (c + 0.5) * (visW / 5);
        const cy = visY + (r + 0.5) * (visH / 3);
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
        const e_cx = cx + displacement;
        ctx.beginPath(); ctx.arc(e_cx, cy, 7, 0, Math.PI * 2); ctx.fillStyle = 'rgba(59, 130, 246, 0.7)'; ctx.fill();
        drawVector(ctx, e_cx, cy + 13, velocity * 0.35, 0, '#f59e0b', 1.8);
      }
    }

    drawVector(ctx, visX + visW / 2, visY - 15, Jp, 0, '#f43f5e', 4, 'J_p 极化电流');
    drawTextWithBg(ctx, 'v 电子云瞬时速度', visX + 10, visY + 18, '#f59e0b', 'rgba(15,23,42,0.8)', 12);

    // 右侧示波器
    const graphX = visX + visW + 25, graphY = 35, graphW = w - graphX - 25, graphH = visH;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(graphX, graphY, graphW, graphH);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.strokeRect(graphX, graphY, graphW, graphH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.moveTo(graphX, graphY + graphH / 2); ctx.lineTo(graphX + graphW, graphY + graphH / 2); ctx.stroke();

    const drawWave = (func, color, label, yOff) => {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let x = 0; x < graphW; x++) {
        const tHist = time - (graphW - x) * 0.008;
        const y = graphY + graphH / 2 - func(tHist);
        if (x === 0) ctx.moveTo(graphX + x, y); else ctx.lineTo(graphX + x, y);
      }
      ctx.stroke();
      drawTextWithBg(ctx, label, graphX + 10, graphY + yOff, color, 'rgba(15,23,42,0.9)', 13);
    };

    drawWave((t) => E0 * Math.sin(omega * t), '#06b6d4', 'E(t)  ∝ sin(ωt)', 20);
    const maxJ = E0 * omega * 0.7;
    drawWave((t) => maxJ * Math.cos(omega * t), '#f43f5e', 'J_p(t)  ∝ cos(ωt)', 50);

    // 底部公式
    const formulaY = visY + visH + 85;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(visX, formulaY, w - visX * 2, 60);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.strokeRect(visX, formulaY, w - visX * 2, 60);
    drawTextWithBg(ctx, 'x(t) ∝ −E₀ sin(ωt)   →   J_p(t) = ∂P/∂t ∝ ωE₀ cos(ωt)   (相位超前 90°)', w / 2, formulaY + 35, '#f43f5e', 'transparent', 14, 'center');
  }, [freq, E0]);

  const { canvasRef, containerRef } = useCanvas(draw);

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} className="relative w-full h-[460px] bg-slate-950 rounded-xl border border-slate-700/60 shadow-inner overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Slider label="交变频率 ω" value={freq} onChange={setFreq} min={0.5} max={3} step={0.1} unit="Hz" color="emerald" />
        <Slider label="电场振幅 E₀" value={E0} onChange={setE0} min={20} max={120} unit="V/m" color="cyan" />
      </div>
    </div>
  );
};

/* ============================================================================
   主装配器
============================================================================ */
export default function ElectrodynamicsRigorousLab() {
  const [activeTab, setActiveTab] = useState(1);
  const tabs = [
    { id: 1, title: 'Ⅰ. 介质极化 (静电场)' },
    { id: 2, title: 'Ⅱ. 介质磁化 (静磁场)' },
    { id: 3, title: 'Ⅲ. 极化电流 (交变场)' },
  ];

  return (
    <div className="w-full bg-[#0B1120] p-5 md:p-7 border border-slate-700/60 rounded-2xl shadow-2xl font-sans text-slate-200">
      <div className="mb-6 pb-4 border-b border-slate-700/40 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-end">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
            电动力学仿真：介质中的麦克斯韦方程
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1.5">
            直观展现电介质与磁介质在宏观与微观尺度下的电磁响应规律
          </p>
        </div>
        <div className="flex bg-slate-800/60 border border-slate-600/40 p-1 rounded-lg">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                activeTab === t.id ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full">
        {activeTab === 1 && <PolarizationRigorousSim />}
        {activeTab === 2 && <MagnetizationBoundarySim />}
        {activeTab === 3 && <PolarizationCurrentSim />}
      </div>
    </div>
  );
}