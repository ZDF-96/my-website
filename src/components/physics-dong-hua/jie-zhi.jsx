'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* ============================================================================
   [模块 1] 核心数学与物理工具
============================================================================ */
const MathUtils = {
  lerp: (start, end, t) => start + (end - start) * t,
  langevin: (x) => {
    if (Math.abs(x) < 1e-4) return x / 3;
    return 1 / Math.tanh(x) - 1 / x;
  }
};

/* ============================================================================
   [模块 2] 高级绘图引擎 (带光效与圆角)
============================================================================ */
const drawTextWithBg = (ctx, text, x, y, textColor = '#fff', bgColor = 'rgba(15,23,42,0.85)', fontSize = 13, align = 'left') => {
  ctx.font = `500 ${fontSize}px system-ui, -apple-system, sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const padX = 8, padY = 6;
  
  let rx = x;
  if (align === 'center') rx = x - textWidth / 2;
  else if (align === 'right') rx = x - textWidth;

  // 绘制玻璃拟态背景
  ctx.fillStyle = bgColor;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.roundRect(rx - padX, y - fontSize, textWidth + padX * 2, fontSize + padY * 2, 6);
  ctx.fill();
  ctx.shadowBlur = 0; // 重置阴影

  ctx.fillStyle = textColor;
  ctx.textAlign = align;
  ctx.fillText(text, x, y + padY - 2);
};

const drawVector = (ctx, x, y, length, angle, color, lineWidth = 2, label = '') => {
  if (Math.abs(length) < 0.5) return;
  const absLen = Math.abs(length);
  const dir = length < 0 ? angle + Math.PI : angle;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);
  
  // 增加发光效果
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(absLen - 6, 0);
  ctx.stroke();

  // 实心箭头
  ctx.beginPath();
  ctx.moveTo(absLen, 0);
  ctx.lineTo(absLen - 12, -5);
  ctx.lineTo(absLen - 12, 5);
  ctx.fill();

  ctx.shadowBlur = 0;

  if (label) {
    ctx.rotate(-dir);
    drawTextWithBg(ctx, label, 0, -15, color, 'rgba(15,23,42,0.9)', 13, 'center');
  }
  ctx.restore();
};

/* ============================================================================
   [模块 3] UI组件：Apple Glassmorphism 滑块
============================================================================ */
const Slider = ({ label, value, onChange, min, max, step = 1, unit = '', color = 'cyan' }) => {
  const colorMap = {
    cyan:    { accent: 'accent-cyan-400', text: 'text-cyan-300', border: 'border-cyan-400/30', bg: 'bg-cyan-950/50' },
    purple:  { accent: 'accent-purple-400', text: 'text-purple-300', border: 'border-purple-400/30', bg: 'bg-purple-950/50' },
    emerald: { accent: 'accent-emerald-400', text: 'text-emerald-300', border: 'border-emerald-400/30', bg: 'bg-emerald-950/50' },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col gap-3 shadow-lg hover:bg-white/10 transition-all">
      <div className="flex justify-between items-center gap-3">
        <span className="text-slate-200 font-medium text-sm tracking-wide">{label}</span>
        <span className={`px-2.5 py-1 rounded-md text-xs font-mono border ${c.text} ${c.border} ${c.bg} shadow-inner`}>
          {value.toFixed(1)} <span className="opacity-70">{unit}</span>
        </span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        className={`w-full h-1.5 bg-slate-900/80 rounded-full appearance-none cursor-pointer ${c.accent} outline-none`} 
      />
    </div>
  );
};

/* ============================================================================
   [模块 4] Canvas 动画循环 Hook (修复开局跳变)
============================================================================ */
const useCanvas = (drawFn) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawRef = useRef(drawFn);
  const rafRef = useRef(null);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(null);

  useEffect(() => { drawRef.current = drawFn; });

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
      if (!lastTimeRef.current) lastTimeRef.current = now; // 修复第一帧dt过大
      
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
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

    rafRef.current = requestAnimationFrame(animate);
    return () => { running = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return { canvasRef, containerRef };
};

/* ============================================================================
   板块Ⅰ：介质极化 (静电场)
============================================================================ */
const PolarizationRigorousSim = () => {
  const [E_ext, setE_ext] = useState(80);
  const [chi, setChi] = useState(50);

  const dipoles = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    row: Math.floor(i / 10), col: i % 10, 
    phase: Math.random() * Math.PI * 2,
    currentAngle: Math.random() * Math.PI * 2
  })), []);

  const draw = useCallback((ctx, w, h, time) => {
    ctx.clearRect(0, 0, w, h);
    const boxW = Math.min(420, w * 0.7);
    const boxH = Math.min(240, h * 0.6);
    const sx = (w - boxW) / 2;
    const sy = (h - boxH) / 2 - 25;

    const N = 0.8;
    const chi_abs = chi / 100;
    const P_factor = chi_abs / (1 + N * chi_abs);
    const P_mag = E_ext * P_factor;
    const E_depol = P_mag * 0.4;
    const E_total = Math.max(0, E_ext - E_depol);

    // 发光背景电场线 (流光效果)
    const numLines = Math.max(1, Math.floor(E_ext / 10));
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([15, 20]);
    ctx.lineDashOffset = -time * 30; // 动画流动
    for (let i = 1; i <= numLines; i++) {
      const lineY = sy + (boxH / (numLines + 1)) * i;
      ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(w, lineY); ctx.stroke();
    }
    ctx.setLineDash([]);

    // 介质块玻璃态
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(sx, sy, boxW, boxH);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, boxW, boxH);

    // 面束缚电荷渐变
    if (P_mag > 5) {
      const alpha = Math.min(P_mag / 100, 0.7);
      const gradLeft = ctx.createLinearGradient(sx, 0, sx + 30, 0);
      gradLeft.addColorStop(0, `rgba(59,130,246,${alpha})`); gradLeft.addColorStop(1, 'rgba(59,130,246,0)');
      ctx.fillStyle = gradLeft; ctx.fillRect(sx, sy, 30, boxH);

      const gradRight = ctx.createLinearGradient(sx + boxW - 30, 0, sx + boxW, 0);
      gradRight.addColorStop(0, 'rgba(239,68,68,0)'); gradRight.addColorStop(1, `rgba(239,68,68,${alpha})`);
      ctx.fillStyle = gradRight; ctx.fillRect(sx + boxW - 30, sy, 30, boxH);

      drawTextWithBg(ctx, '−σ_p (束缚负电荷)', sx + 15, sy + boxH + 25, '#60a5fa', 'rgba(15,23,42,0.85)', 12, 'center');
      drawTextWithBg(ctx, '+σ_p (束缚正电荷)', sx + boxW - 15, sy + boxH + 25, '#f87171', 'rgba(15,23,42,0.85)', 12, 'center');
    }

    // 微观偶极子 (加入物理阻尼与平滑过渡)
    const cellW = boxW / 10, cellH = boxH / 6;
    const alignment = Math.min(P_mag / 100, 1);
    
    dipoles.forEach(d => {
      const cx = sx + d.col * cellW + cellW / 2;
      const cy = sy + d.row * cellH + cellH / 2;
      // 目标角度：完全极化时为0，未极化时随机热运动
      const targetAngle = Math.sin(time * 2 + d.phase) * (1 - alignment) * Math.PI;
      // 顺滑插值
      d.currentAngle = MathUtils.lerp(d.currentAngle, targetAngle, 0.1);

      ctx.save(); ctx.translate(cx, cy); ctx.rotate(d.currentAngle);
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
      drawVector(ctx, sx + 40, lineY, boxW - 80, 0, 'rgba(6, 182, 212, 0.9)', 2);
    }

    // 底部矢量对比
    const vy = sy + boxH + 75;
    drawVector(ctx, sx, vy, E_ext * 2, 0, '#06b6d4', 3, `E₀ = ${E_ext} V/m`);
    if (P_mag > 1) {
      drawVector(ctx, sx + E_ext * 2 + 50, vy, -E_depol * 2, 0, '#ec4899', 3, `E' = −${E_depol.toFixed(1)}`);
      drawVector(ctx, sx, vy + 40, E_total * 2, 0, '#22c55e', 3, `E = ${E_total.toFixed(1)}`);
    }
  }, [E_ext, chi, dipoles]);

  const { canvasRef, containerRef } = useCanvas(draw);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div ref={containerRef} className="relative w-full h-[450px] bg-slate-950/80 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Slider label="外加电场 (E₀)" value={E_ext} onChange={setE_ext} min={0} max={100} unit="V/m" color="cyan" />
        <Slider label="介质极化率 (χₑ)" value={chi} onChange={setChi} min={10} max={100} unit="%" color="purple" />
      </div>
    </div>
  );
};

/* ============================================================================
   板块Ⅱ：介质磁化 (加入流动的宏观磁化电流)
============================================================================ */
const MagnetizationBoundarySim = () => {
  const [B_ext, setB_ext] = useState(80);

  const draw = useCallback((ctx, w, h, time) => {
    ctx.clearRect(0, 0, w, h);
    const rows = 5, cols = 8, cell = 52;
    const sx = (w - cols * cell) / 2;
    const sy = (h - rows * cell) / 2 - 10;
    const align = Math.min(B_ext / 100, 1);

    // 背景磁场符号阵列
    if (B_ext > 5) {
      const spacing = 50 - align * 15;
      const alpha = 0.1 + align * 0.2;
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

    drawTextWithBg(ctx, `B₀ = ${B_ext.toFixed(0)} T (⊗ 垂直向里)`, 20, 30, '#c084fc', 'rgba(15,23,42,0.85)', 14);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(sx, sy, cols * cell, rows * cell);

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
        ctx.beginPath(); ctx.arc(radius, 0, 3, 0, Math.PI * 2); 
        ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 4; ctx.fill();
        
        drawVector(ctx, 0, -radius, 8, 0, `rgba(239,68,68,${0.3 + align * 0.7})`, 1.5);
        ctx.restore();
      }
    }

    // 内部红十字抵消
    if (align > 0.3) {
      ctx.strokeStyle = `rgba(244, 63, 94, ${align})`;
      ctx.lineWidth = 2;
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
      drawTextWithBg(ctx, '内部相邻环流相互抵消', sx + cols * cell / 2, sy + rows * cell + 30, '#f43f5e', 'rgba(15,23,42,0.85)', 13, 'center');
    }

    // 边界动态流动磁化电流 J_M
    if (align > 0.1) {
      ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.5 + align * 0.5})`;
      ctx.lineWidth = 3 + align * 2;
      
      // 让边框变成流动的虚线来模拟电流流转
      ctx.setLineDash([12, 16]);
      ctx.lineDashOffset = -time * 80 * (1 + align); // 顺时针流动
      ctx.strokeRect(sx, sy, cols * cell, rows * cell);
      
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      
      // 绘制一个静态的内衬边框保持结构
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, cols * cell, rows * cell);

      drawTextWithBg(ctx, 'J_M 宏观表面磁化电流 (流动)', sx + cols * cell / 2, sy - 18, '#c084fc', 'rgba(15,23,42,0.85)', 14, 'center');
    }
  }, [B_ext]);

  const { canvasRef, containerRef } = useCanvas(draw);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div ref={containerRef} className="relative w-full h-[450px] bg-slate-950/80 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      <Slider label="外加磁场 (B₀)" value={B_ext} onChange={setB_ext} min={0} max={100} unit="T" color="purple" />
    </div>
  );
};

/* ============================================================================
   板块Ⅲ：极化电流起源 (加入示波器扫描线)
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

    // 左侧微观介质阵列
    const visX = 25, visY = 40, visW = w * 0.45, visH = Math.min(260, h * 0.6);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(visX, visY, visW, visH);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.strokeRect(visX, visY, visW, visH);

    const eY = visY + visH + 45;
    drawVector(ctx, visX + visW / 2, eY, E_t, 0, '#06b6d4', 4, `E(t) = ${Math.round(E_t)}`);

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const cx = visX + (c + 0.5) * (visW / 5);
        const cy = visY + (r + 0.5) * (visH / 3);
        
        // 原子核
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
        
        // 电子云
        const e_cx = cx + displacement;
        ctx.beginPath(); ctx.arc(e_cx, cy, 7, 0, Math.PI * 2); 
        ctx.fillStyle = 'rgba(59, 130, 246, 0.7)'; 
        ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 8;
        ctx.fill(); ctx.shadowBlur = 0;
        
        drawVector(ctx, e_cx, cy + 15, velocity * 0.4, 0, '#f59e0b', 2);
      }
    }

    drawVector(ctx, visX + visW / 2, visY - 20, Jp, 0, '#f43f5e', 4, 'J_p 极化电流');
    drawTextWithBg(ctx, 'v 电子瞬时速度', visX + 10, visY + 20, '#f59e0b', 'rgba(15,23,42,0.85)', 12);

    // 右侧科技感示波器
    const graphX = visX + visW + 30, graphY = 40, graphW = w - graphX - 30, graphH = visH;
    
    ctx.fillStyle = 'rgba(10, 15, 28, 0.8)';
    ctx.fillRect(graphX, graphY, graphW, graphH);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.strokeRect(graphX, graphY, graphW, graphH);
    
    // 示波器网格
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let i=1; i<4; i++) {
        ctx.beginPath(); ctx.moveTo(graphX, graphY + i*graphH/4); ctx.lineTo(graphX+graphW, graphY + i*graphH/4); ctx.stroke();
    }
    // 中轴线
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.moveTo(graphX, graphY + graphH / 2); ctx.lineTo(graphX + graphW, graphY + graphH / 2); ctx.stroke();

    const drawWave = (func, color, label, yOff) => {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.shadowColor = color; ctx.shadowBlur = 5;
      for (let x = 0; x < graphW; x++) {
        const tHist = time - (graphW - x) * 0.008;
        const y = graphY + graphH / 2 - func(tHist);
        if (x === 0) ctx.moveTo(graphX + x, y); else ctx.lineTo(graphX + x, y);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
      drawTextWithBg(ctx, label, graphX + 10, graphY + yOff, color, 'rgba(10,15,28,0.9)', 13);
    };

    drawWave((t) => E0 * Math.sin(omega * t), '#06b6d4', 'E(t) ∝ sin(ωt)', 25);
    const maxJ = E0 * omega * 0.7;
    drawWave((t) => maxJ * Math.cos(omega * t), '#f43f5e', 'J_p(t) ∝ cos(ωt)', 60);

    // 扫描线光柱
    const scanX = graphX + graphW - ((time * 125) % graphW); // 从右向左扫描匹配时间轴
    const grad = ctx.createLinearGradient(scanX, graphY, scanX + 20, graphY);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(scanX, graphY, 20, graphH);
    ctx.fillStyle = '#fff';
    ctx.fillRect(scanX, graphY, 2, graphH);

    // 底部数学推导面板
    const formulaY = visY + visH + 85;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath(); ctx.roundRect(visX, formulaY, w - visX * 2, 60, 8); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.stroke();
    drawTextWithBg(ctx, '位移 x(t) ∝ −E₀ sin(ωt)   →   电流 J_p(t) = ∂P/∂t ∝ ωE₀ cos(ωt)   (相位超前 90°)', w / 2, formulaY + 35, '#f43f5e', 'transparent', 14, 'center');
  }, [freq, E0]);

  const { canvasRef, containerRef } = useCanvas(draw);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div ref={containerRef} className="relative w-full h-[500px] bg-slate-950/80 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Slider label="交变场频率 (ω)" value={freq} onChange={setFreq} min={0.5} max={3} step={0.1} unit="Hz" color="emerald" />
        <Slider label="外场振幅 (E₀)" value={E0} onChange={setE0} min={20} max={120} unit="V/m" color="cyan" />
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
    <div className="w-full bg-[#050B14] p-6 md:p-8 border border-slate-700/60 rounded-[2rem] shadow-2xl font-sans text-slate-200">
      <div className="mb-8 pb-5 border-b border-slate-800 flex flex-col xl:flex-row gap-5 justify-between items-start xl:items-end">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent tracking-wide">
            Maxwell's Equations in Matter
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            宏观与微观尺度的电磁响应仿真引擎
          </p>
        </div>
        
        {/* Apple Segmented Control Style Tabs */}
        <div className="flex bg-slate-900/80 border border-slate-700/50 p-1.5 rounded-xl shadow-inner">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === t.id 
                ? 'bg-slate-700 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
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