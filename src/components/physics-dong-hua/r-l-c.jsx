'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  GitCommit,
  GitMerge,
  Gauge,
  Network,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Waves,
  Zap,
} from 'lucide-react';

const C = {
  bgMain: '#0A0F1A',
  panel: '#111827',
  border: '#374151',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  axis: '#4B5563',
  grid: '#1F2937',
  voltage: '#38BDF8',      
  current: '#FBBF24',      
  impedance: '#34D399',    
  danger: '#F87171',       
};

const TAU = 2 * Math.PI;

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function deg(rad) { return rad * 180 / Math.PI; }
function rad(degValue) { return degValue * Math.PI / 180; }
function polar(mag, angle) { return { re: mag * Math.cos(angle), im: mag * Math.sin(angle) }; }
function add(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
function mul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
function absC(z) { return Math.hypot(z.re, z.im); }
function argC(z) { return Math.atan2(z.im, z.re); }
function fmt(v, n = 2) {
  if (!Number.isFinite(v)) return '—';
  return (Math.abs(v) < 1e-10 ? 0 : v).toFixed(n);
}

function impedance(R, LmH, CuF, f) {
  const omega = TAU * f;
  const L = LmH / 1000;
  const Cc = CuF / 1e6;
  const XL = omega * L;
  const XC = 1 / (omega * Cc);
  const X = XL - XC;
  const z = Math.hypot(R, X);
  const phi = Math.atan2(X, R);
  return { omega, XL, XC, X, z, phi, phiDeg: deg(phi) };
}

// ---------------- UI Components (带有严格防溢出保护) ----------------

function Formula({ children, block = false, muted = false, color }) {
  return (
    <div
      className={`${block ? 'block text-center my-1' : 'inline-block'} tracking-wide whitespace-normal break-words`}
      style={{
        color: color || (muted ? C.muted : C.text),
        fontFamily: '"Cambria Math", "Times New Roman", serif',
        fontSize: block ? '1.15rem' : '1.05rem',
      }}
    >
      {children}
    </div>
  );
}

function Card({ title, icon, children, className = '' }) {
  // 加入 overflow-hidden 和 min-w-0 防止内容撑破卡片
  return (
    <section className={`rounded-xl shadow-lg flex flex-col border w-full min-w-0 overflow-hidden ${className}`} style={{ borderColor: C.border, background: C.panel }}>
      {title && (
        <div className="px-5 py-3 flex items-center gap-2.5 font-semibold border-b tracking-wide shrink-0" style={{ borderColor: C.border, color: C.text }}>
          {icon || <span className="w-1.5 h-4 rounded-full" style={{ background: C.voltage }} />}
          <span>{title}</span>
        </div>
      )}
      <div className="p-4 md:p-6 flex-1 flex flex-col min-h-0 min-w-0 text-gray-200 w-full">{children}</div>
    </section>
  );
}

function ControlSlider({ label, symbol, value, min, max, step, unit, onChange, color = C.voltage }) {
  return (
    <div className="flex flex-col w-full min-w-0 shrink-0">
      <div className="flex items-center justify-between text-sm mb-2.5 gap-2">
        <span style={{ color: C.muted }} className="truncate">
          {symbol && <span className="font-serif italic mr-1.5 text-gray-300">{symbol}</span>}
          {label}
        </span>
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded shrink-0" style={{ background: '#1F2937', color: color }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-700 focus:outline-none shrink-0"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function ToggleButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 whitespace-nowrap outline-none shrink-0"
      style={{
        borderColor: active ? C.voltage : C.border,
        color: active ? '#fff' : C.muted,
        background: active ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
        boxShadow: active ? '0 0 10px rgba(56, 189, 248, 0.2)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function ActionButton({ children, onClick, primary = false }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all duration-200 text-sm whitespace-nowrap w-full sm:w-auto outline-none shrink-0"
      style={{
        border: `1px solid ${primary ? C.voltage : C.border}`,
        color: primary ? '#0A0F1A' : C.text,
        background: primary ? C.voltage : 'transparent',
        boxShadow: primary ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

// ---------------- Hooks ----------------

function useAnimationClock(playing = true, speed = 1) {
  const timeRef = useRef(0);
  const lastRef = useRef(null);
  const [, force] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      if (playing) {
        timeRef.current += dt * speed;
        force((x) => (x + 1) % 1000000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const reset = useCallback(() => {
    timeRef.current = 0;
    lastRef.current = null;
    force((x) => (x + 1) % 1000000);
  }, []);

  return { timeRef, reset };
}

function useCanvas(draw, deps = []) {
  const ref = useRef(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let raf = 0;
    let resizeObserver;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 2; 
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.dataset.dpr = String(dpr);
    };

    resize();
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }

    const render = (time) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Number(canvas.dataset.dpr || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      ctx.fillStyle = '#050914'; 
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      drawRef.current(ctx, rect.width, rect.height, time / 1000);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', resize);
    };
  }, deps);
  return ref;
}

// ---------------- Canvas Draw Engine ----------------

function DrawCircuit(ctx, x1, y1, x2, y2, color, type, scale=1) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const ux = dx / len || 1, uy = dy / len || 0;
    const px = -uy, py = ux;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if(type === 'resistor') {
        const lead = Math.min(18, len * 0.18);
        const body = len - 2 * lead;
        ctx.moveTo(x1, y1); ctx.lineTo(x1 + ux * lead, y1 + uy * lead);
        for (let i = 0; i < 6; i++) {
            const t1 = lead + body * (i + 0.5) / 6;
            const t2 = lead + body * (i + 1) / 6;
            const s = i % 2 === 0 ? 1 : -1;
            ctx.lineTo(x1 + ux * t1 + px * 6 * s, y1 + uy * t1 + py * 6 * s);
            ctx.lineTo(x1 + ux * t2, y1 + uy * t2);
        }
        ctx.lineTo(x2, y2);
    } else if (type === 'coil') {
        ctx.moveTo(x1, y1);
        for (let i = 0; i < 4; i++) {
            const a = i / 4 * len, b = (i + 0.5) / 4 * len, c = (i + 1) / 4 * len;
            ctx.quadraticCurveTo(x1 + ux * (a + (b - a) * 0.55) + px * 10, y1 + uy * (a + (b - a) * 0.55) + py * 10, x1 + ux * b, y1 + uy * b);
            ctx.quadraticCurveTo(x1 + ux * (b + (c - b) * 0.45) - px * 10, y1 + uy * (b + (c - b) * 0.45) - py * 10, x1 + ux * c, y1 + uy * c);
        }
    } else if (type === 'capacitor') {
        const m = len / 2;
        ctx.moveTo(x1, y1); ctx.lineTo(x1 + ux * (m - 5), y1 + uy * (m - 5));
        ctx.moveTo(x1 + ux * (m + 5) + px * 12, y1 + uy * (m + 5) + py * 12); ctx.lineTo(x1 + ux * (m + 5) - px * 12, y1 + uy * (m + 5) - py * 12);
        ctx.moveTo(x1 + ux * (m - 5) + px * 12, y1 + uy * (m - 5) + py * 12); ctx.lineTo(x1 + ux * (m - 5) - px * 12, y1 + uy * (m - 5) - py * 12);
        ctx.moveTo(x1 + ux * (m + 5), y1 + uy * (m + 5)); ctx.lineTo(x2, y2);
    } else if (type === 'battery') {
        ctx.moveTo(x1, y1 - 18 * scale); ctx.lineTo(x1, y1 + 18 * scale);
        ctx.moveTo(x1 + 10 * scale, y1 - 10 * scale); ctx.lineTo(x1 + 10 * scale, y1 + 10 * scale);
        Draw.text(ctx, '+', x1 - 3, y1 - 24 * scale, { color: C.voltage, font: '12px serif' });
        Draw.text(ctx, '−', x1 + 14 * scale, y1 - 12 * scale, { color: C.voltage, font: '12px serif' });
    }
    ctx.stroke();
    ctx.restore();
}

const Draw = {
  text(ctx, text, x, y, opts = {}) {
    ctx.save();
    ctx.fillStyle = opts.color || C.text;
    ctx.font = opts.font || '13px Arial, sans-serif';
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'alphabetic';
    ctx.fillText(text, x, y);
    ctx.restore();
  },
  axes(ctx, w, h, cx, cy, xLabel = 'Re', yLabel = 'Im') {
    ctx.save();
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(18, cy); ctx.lineTo(w - 18, cy); ctx.moveTo(cx, 16); ctx.lineTo(cx, h - 16); ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.beginPath(); ctx.moveTo(w - 18, cy); ctx.lineTo(w - 25, cy - 3); ctx.lineTo(w - 25, cy + 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, 16); ctx.lineTo(cx - 3, 23); ctx.lineTo(cx + 3, 23); ctx.fill();
    Draw.text(ctx, xLabel, w - 15, cy + 18, { color: C.muted, font: 'italic 12px serif', align: 'right' });
    Draw.text(ctx, yLabel, cx + 7, 15, { color: C.muted, font: 'italic 12px serif' });
    ctx.restore();
  },
  grid(ctx, x, y, w, h, nx = 6, ny = 4) {
    ctx.save();
    ctx.strokeStyle = '#1F2937'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < nx; i++) { const xx = x + w * i / nx; ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); }
    for (let j = 1; j < ny; j++) { const yy = y + h * j / ny; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); }
    ctx.stroke();
    ctx.restore();
  },
  vector(ctx, cx, cy, angle, len, color, label, width = 3) {
    const ex = cx + len * Math.cos(angle), ey = cy - len * Math.sin(angle);
    const a = Math.atan2(ey - cy, ex - cx), head = Math.max(8, Math.min(14, len * 0.15));
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.shadowBlur = 10; ctx.shadowColor = color;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex, ey);
    ctx.lineTo(ex - head * Math.cos(a - Math.PI / 6), ey - head * Math.sin(a - Math.PI / 6));
    ctx.lineTo(ex - head * Math.cos(a + Math.PI / 6), ey - head * Math.sin(a + Math.PI / 6));
    ctx.fill();
    if (label) {
      ctx.shadowBlur = 0;
      Draw.text(ctx, label, ex + 10, ey - 10, { color, font: 'italic 16px "Cambria Math", serif' });
    }
    ctx.restore();
    return { x: ex, y: ey };
  },
  angleArc(ctx, cx, cy, angle, radius = 35, label = 'φ') {
    if (Math.abs(angle) < 0.01) return;
    ctx.save();
    ctx.strokeStyle = '#6B7280'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, -angle, angle > 0); ctx.stroke();
    const mid = angle / 2;
    Draw.text(ctx, label, cx + (radius + 15) * Math.cos(mid), cy - (radius + 15) * Math.sin(mid), { color: C.text, font: 'italic 14px Georgia, serif' });
    ctx.restore();
  },
  wave(ctx, x, y, w, h, phase, amplitude, cycles, color, label, progress = null) {
    const mid = y + h / 2, amp = h * 0.4 * amplitude; 
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.shadowBlur = 8; ctx.shadowColor = color;
    ctx.beginPath();
    for (let px = 0; px <= w; px++) {
      const u = px / w, val = Math.cos(TAU * cycles * u + phase), py = mid - val * amp;
      if (px === 0) ctx.moveTo(x + px, py); else ctx.lineTo(x + px, py);
    }
    ctx.stroke();
    if (progress != null) {
      const px = x + clamp(progress, 0, 1) * w, py = mid - Math.cos(TAU * cycles * clamp(progress, 0, 1) + phase) * amp;
      ctx.shadowBlur = 0; ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.shadowBlur = 12; ctx.shadowColor = color;
      ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill();
    }
    if (label) {
      ctx.shadowBlur = 0;
      Draw.text(ctx, label, x + w - 10, y + 20, { color, font: 'italic 15px "Cambria Math", serif', align: 'right' });
    }
    ctx.restore();
  },
  resistor(ctx, x1, y1, x2, y2, color = C.muted) { DrawCircuit(ctx, x1, y1, x2, y2, color, 'resistor'); },
  coil(ctx, x1, y1, x2, y2, color = C.muted) { DrawCircuit(ctx, x1, y1, x2, y2, color, 'coil'); },
  capacitor(ctx, x1, y1, x2, y2, color = C.muted) { DrawCircuit(ctx, x1, y1, x2, y2, color, 'capacitor'); },
  battery(ctx, x, y, scale = 1) { DrawCircuit(ctx, x, y, x, y, C.voltage, 'battery', scale); },
};

// ---------------- Modules (重构抗挤压布局) ----------------

function ModuleIdeal() {
  const [comp, setComp] = useState('R');
  const [f, setF] = useState(1);
  const [amp, setAmp] = useState(80);
  const [playing, setPlaying] = useState(true);
  const { timeRef, reset } = useAnimationClock(playing, 0.8);

  const data = {
    R: { title: '电阻', phase: 0, formula1: 'uᵣ(t) = R i(t)', formula2: 'U̇ᵣ = R İ', conclusion: '同相' },
    L: { title: '电感', phase: Math.PI / 2, formula1: 'uₗ(t) = L di/dt', formula2: 'U̇ₗ = jωL İ', conclusion: '电压超前 90°' },
    C: { title: '电容', phase: -Math.PI / 2, formula1: 'i𝚌(t) = C du𝚌/dt', formula2: 'U̇𝚌 = İ/(jωC)', conclusion: '电压滞后 90°' },
  }[comp];

  const canvas = useCanvas((ctx, w, h) => {
    const leftW = Math.min(w * 0.35, 450), rightX = leftW + 20, rightW = w - rightX - 20;
    const cy = h * 0.5, cx = leftW * 0.5;
    const maxVecLen = Math.min(cx - 30, cy - 30);
    const scale = maxVecLen / 100;
    const lenI = amp * 0.75 * scale, lenU = amp * scale, theta = TAU * f * timeRef.current, waveH = h * 0.7;

    Draw.axes(ctx, leftW, h, cx, cy);
    Draw.text(ctx, '相量域', cx, 25, { color: C.text, font: '600 15px Arial', align: 'center' });
    Draw.vector(ctx, cx, cy, theta, lenI, C.current, 'İ');
    Draw.vector(ctx, cx, cy, theta + data.phase, lenU, C.voltage, 'U̇');
    Draw.angleArc(ctx, cx, cy, data.phase, 45, data.phase === 0 ? '' : '90°');

    ctx.save(); ctx.translate(rightX, 0);
    Draw.grid(ctx, 0, h * 0.15, rightW, waveH, 8, 6);
    const base = h * 0.5;
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(rightW, base); ctx.stroke();

    const phaseI = theta, phaseU = theta + data.phase, px = clamp((timeRef.current * f) % 1, 0, 1);
    Draw.wave(ctx, 0, h * 0.15, rightW, waveH, phaseI, (amp * 0.75)/100, 1.0, C.current, 'i(t)', px);
    Draw.wave(ctx, 0, h * 0.15, rightW, waveH, phaseU, amp/100, 1.0, C.voltage, 'u(t)', px);

    const markerX = px * rightW;
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.moveTo(markerX, h * 0.15); ctx.lineTo(markerX, h * 0.15 + waveH); ctx.stroke();
    ctx.setLineDash([]);
    Draw.text(ctx, 't', rightW - 10, base + 25, { color: C.muted, font: 'italic 14px serif', align: 'right' });
    
    ctx.fillStyle = '#111827'; ctx.fillRect(15, h * 0.15 + 10, 140, 50);
    ctx.strokeStyle = '#374151'; ctx.strokeRect(15, h * 0.15 + 10, 140, 50);
    Draw.text(ctx, `i(t) ∝ ${fmt(Math.cos(phaseI), 2)}`, 25, h * 0.15 + 30, { color: C.current, font: '14px monospace' });
    Draw.text(ctx, `u(t) ∝ ${fmt(Math.cos(phaseU), 2)}`, 25, h * 0.15 + 50, { color: C.voltage, font: '14px monospace' });
    ctx.restore();
  }, [comp, f, amp, playing]);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 h-full">
      <Card title={`联动显示 - 理想${data.title}`} icon={<Waves size={18} color={C.voltage} />}>
        <div className="h-[350px] md:h-[450px] xl:h-[500px] w-full rounded-xl border border-gray-800 overflow-hidden bg-black/40 shadow-inner">
          <canvas ref={canvas} className="w-full h-full block" />
        </div>
      </Card>
      
      <Card title="参数控制台" icon={<SlidersHorizontal size={18} color={C.impedance} />}>
        {/* 外层使用 min-w-0 保证不撑破卡片 */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full min-w-0 items-start lg:items-stretch">
          
          {/* 左侧：操作按钮组 (允许折行 flex-wrap) */}
          <div className="flex flex-row flex-wrap lg:flex-col gap-3 justify-center items-center w-full lg:w-[220px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-700 pb-5 lg:pb-0 lg:pr-6">
            <div className="flex flex-wrap gap-3 justify-center">
              {['R', 'L', 'C'].map((x) => (
                <ToggleButton key={x} active={comp === x} onClick={() => setComp(x)}>{x} 元件</ToggleButton>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-1 lg:mt-3 w-full">
              <ActionButton primary onClick={() => setPlaying(!playing)}>
                {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? '暂停' : '播放'}
              </ActionButton>
              <ActionButton onClick={reset}><RotateCcw size={16} />重置</ActionButton>
            </div>
          </div>
          
          {/* 右侧：滑块与公式 (强力限制宽度) */}
          <div className="flex-1 w-full min-w-0 flex flex-col justify-center gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              <ControlSlider label="信号频率" symbol="f" value={f} min={0.2} max={2} step={0.1} unit="Hz" onChange={setF} color={C.impedance} />
              <ControlSlider label="显示幅度" symbol="Xₘ" value={amp} min={40} max={100} step={1} unit="" onChange={setAmp} color={C.voltage} />
            </div>
            
            {/* 公式展示区：使用 flex-wrap 保证窄屏下优雅换行，绝不溢出 */}
            <div className="w-full flex flex-wrap justify-center items-center bg-gray-900/60 p-4 rounded-lg border border-gray-800 gap-3 sm:gap-6 min-w-0">
              <Formula color={C.voltage}>{data.formula1}</Formula>
              <div className="hidden sm:block w-px h-5 bg-gray-700 shrink-0"></div>
              <Formula color={C.voltage}>{data.formula2}</Formula>
              <div className="hidden sm:block w-px h-5 bg-gray-700 shrink-0"></div>
              <div className="font-bold text-sm tracking-widest px-4 py-2 rounded bg-green-900/30 shrink-0" style={{ color: C.impedance, border: `1px solid ${C.impedance}` }}>
                {data.conclusion}
              </div>
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
}

function ModuleRotating() {
  const [playing, setPlaying] = useState(true);
  const [amp, setAmp] = useState(100);
  const [phase, setPhase] = useState(30);
  const [f, setF] = useState(0.45);
  const [speed, setSpeed] = useState(1);
  const { timeRef, reset } = useAnimationClock(playing, speed);

  const canvas = useCanvas((ctx, w, h) => {
    const cx = Math.min(w * 0.3, h * 0.5 + 20), cy = h * 0.5;
    const radius = Math.min(amp * (Math.min(w,h)/300), h * 0.35, cx - 20); 
    const rightX = cx + radius + 30, rightW = w - rightX - 20;
    
    const theta = TAU * f * timeRef.current + rad(phase);
    const projectionIm = Math.sin(theta);
    const px = cx + radius * Math.cos(theta), py = cy - radius * Math.sin(theta);

    Draw.axes(ctx, rightX - 10, h, cx, cy);
    ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU); ctx.stroke(); ctx.restore();

    Draw.vector(ctx, cx, cy, theta, radius, C.voltage, 'Ẋ');

    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(rightX, py); ctx.stroke();
    ctx.setLineDash([]);

    ctx.save(); ctx.translate(rightX, 0);
    Draw.grid(ctx, 0, h * 0.15, rightW, h * 0.7, 8, 6);
    const mid = h * 0.5;
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(rightW, mid); ctx.stroke();

    const phase0 = rad(phase) - Math.PI / 2, progress = (f * timeRef.current) % 1;
    Draw.wave(ctx, 0, h * 0.15, rightW, h * 0.7, phase0, (radius/(h*0.35)), 1.0, C.voltage, 'x(t)', progress);
    
    ctx.fillStyle = C.current; ctx.shadowBlur = 12; ctx.shadowColor = C.current;
    ctx.beginPath(); ctx.arc(progress * rightW, py, 6, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    Draw.text(ctx, 't', rightW - 10, mid + 25, { color: C.muted, font: 'italic 14px serif', align: 'right' });
    ctx.restore();

    ctx.fillStyle = '#111827'; ctx.fillRect(15, 15, 260, 60);
    ctx.strokeStyle = '#374151'; ctx.strokeRect(15, 15, 260, 60);
    Draw.text(ctx, `θ = ${fmt(deg(theta % TAU), 1)}°`, 25, 36, { color: C.text, font: '600 15px monospace' });
    Draw.text(ctx, `Im[Ẋ] = Xₘ sin(ωt + α) = ${fmt(100 * projectionIm, 1)}`, 25, 60, { color: C.voltage, font: '14px monospace' });
  }, [amp, phase, f, playing, speed]);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 h-full">
      <Card title="旋转相量 → 正弦量投影" icon={<RotateCcw size={18} color={C.voltage} />}>
        <div className="h-[350px] md:h-[450px] xl:h-[500px] w-full rounded-xl border border-gray-800 overflow-hidden bg-black/40 shadow-inner">
          <canvas ref={canvas} className="w-full h-full block" />
        </div>
      </Card>
      
      <Card title="控制台" icon={<SlidersHorizontal size={18} color={C.current} />}>
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 w-full min-w-0 items-start lg:items-stretch">
          <div className="flex flex-wrap lg:flex-col gap-4 justify-center items-center w-full lg:w-[160px] border-b lg:border-b-0 lg:border-r border-gray-700 pb-5 lg:pb-0 lg:pr-6 shrink-0">
            <ActionButton primary onClick={() => setPlaying(!playing)}>
              {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? '暂停' : '播放'}
            </ActionButton>
            <ActionButton onClick={reset}><RotateCcw size={16} />重置动画</ActionButton>
          </div>
          {/* 将最大列数限制为 3，防止挤压 */}
          <div className="flex-1 w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-6">
            <ControlSlider label="峰值振幅" symbol="Xₘ" value={amp} min={40} max={150} step={1} unit="" onChange={setAmp} />
            <ControlSlider label="初相位" symbol="α" value={phase} min={-180} max={180} step={1} unit="°" onChange={setPhase} color={C.impedance} />
            <ControlSlider label="信号频率" symbol="f" value={f} min={0.1} max={1} step={0.05} unit="Hz" onChange={setF} color={C.current}/>
            <ControlSlider label="动画速度" symbol="s" value={speed} min={0.25} max={2} step={0.25} unit="×" onChange={setSpeed} color={C.danger}/>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ModuleOperations() {
  const [mode, setMode] = useState('add');
  const [a, setA] = useState(80), [b, setB] = useState(60);
  const [aDeg, setADeg] = useState(30), [bDeg, setBDeg] = useState(-45);
  const [omega, setOmega] = useState(4);

  const A = polar(a, rad(aDeg)), B = polar(b, rad(bDeg)), S = add(A, B);
  const deriv = mul({ re: 0, im: omega }, A), integ = mul({ re: 0, im: -1 / omega }, A);
  const result = mode === 'add' ? S : mode === 'diff' ? deriv : integ;

  const canvas = useCanvas((ctx, w, h) => {
    const cx = w * 0.5, cy = h * 0.5;
    const maxVal = mode === 'add' ? Math.max(a, b, absC(S)) : mode === 'diff' ? Math.max(a, absC(deriv)) : Math.max(a, absC(integ));
    const scale = (Math.min(w, h) * 0.35) / (maxVal || 1);
    
    Draw.axes(ctx, w, h, cx, cy);

    if (mode === 'add') {
      const av = { x: A.re * scale, y: A.im * scale }, bv = { x: B.re * scale, y: B.im * scale };
      Draw.vector(ctx, cx, cy, rad(aDeg), a * scale, C.voltage, 'Ẋ');
      Draw.vector(ctx, cx + av.x, cy - av.y, rad(bDeg), b * scale, C.current, 'Ẏ');
      Draw.vector(ctx, cx, cy, argC(S), absC(S) * scale, C.danger, 'Ż', 3.5);
      
      ctx.setLineDash([5, 5]); ctx.strokeStyle = C.muted;
      ctx.beginPath(); ctx.moveTo(cx + av.x, cy - av.y); ctx.lineTo(cx + av.x + bv.x, cy - av.y - bv.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + bv.x, cy - bv.y); ctx.lineTo(cx + av.x + bv.x, cy - av.y - bv.y); ctx.stroke();
      ctx.setLineDash([]);
      Draw.vector(ctx, cx, cy, rad(bDeg), b * scale, 'rgba(251, 191, 36, 0.4)', ''); 
    } else if (mode === 'diff') {
      Draw.vector(ctx, cx, cy, rad(aDeg), a * scale, C.voltage, 'Ẋ');
      Draw.vector(ctx, cx, cy, argC(deriv), absC(deriv) * scale, C.danger, 'jωẊ', 3.5);
      Draw.angleArc(ctx, cx, cy, Math.PI / 2, 45, '+90°');
    } else if (mode === 'int') {
      Draw.vector(ctx, cx, cy, rad(aDeg), a * scale, C.voltage, 'Ẋ');
      Draw.vector(ctx, cx, cy, argC(integ), absC(integ) * scale, C.impedance, 'Ẋ/(jω)', 3.5);
      Draw.angleArc(ctx, cx, cy, -Math.PI / 2, 45, '−90°');
    }
  }, [mode, a, b, aDeg, bDeg, omega]);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 h-full">
      <Card title="相量复平面几何运算" icon={<GitMerge size={18} color={C.current} />}>
         <div className="h-[350px] md:h-[450px] xl:h-[500px] w-full rounded-xl border border-gray-800 overflow-hidden bg-black/40 shadow-inner">
          <canvas ref={canvas} className="w-full h-full block" />
        </div>
      </Card>

      <Card title="参数控制台">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 w-full min-w-0 items-start lg:items-stretch">
          <div className="flex flex-col gap-4 w-full lg:w-[240px] border-b lg:border-b-0 lg:border-r border-gray-800 pb-5 lg:pb-0 lg:pr-6 shrink-0 justify-center">
             <div className="flex flex-wrap gap-2 justify-center">
              <ToggleButton active={mode === 'add'} onClick={() => setMode('add')}>相加</ToggleButton>
              <ToggleButton active={mode === 'diff'} onClick={() => setMode('diff')}>微分</ToggleButton>
              <ToggleButton active={mode === 'int'} onClick={() => setMode('int')}>积分</ToggleButton>
            </div>
            <div className="p-4 rounded-lg bg-gray-900/60 border border-gray-800 lg:mt-2 text-center w-full min-w-0">
              <div className="text-gray-400 mb-2 text-xs">结果极坐标表示</div>
              <div className="font-mono font-bold text-xl truncate" style={{ color: mode==='add'?C.danger:mode==='diff'?C.danger:C.impedance }}>
                {fmt(absC(result), 1)} ∠ {fmt(deg(argC(result)), 1)}°
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-w-0 flex flex-col justify-center">
             {mode === 'add' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                <ControlSlider label="X 幅值" symbol="X" value={a} min={20} max={150} step={1} unit="" onChange={setA} />
                <ControlSlider label="X 初相" symbol="αₓ" value={aDeg} min={-180} max={180} step={1} unit="°" onChange={setADeg} />
                <ControlSlider label="Y 幅值" symbol="Y" value={b} min={20} max={150} step={1} unit="" onChange={setB} color={C.current}/>
                <ControlSlider label="Y 初相" symbol="αᵧ" value={bDeg} min={-180} max={180} step={1} unit="°" onChange={setBDeg} color={C.current}/>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                <ControlSlider label="X 幅值" symbol="X" value={a} min={20} max={150} step={1} unit="" onChange={setA} />
                <ControlSlider label="X 初相" symbol="α" value={aDeg} min={-180} max={180} step={1} unit="°" onChange={setADeg} />
                <ControlSlider label="角频率" symbol="ω" value={omega} min={1} max={12} step={0.5} unit="rad/s" onChange={setOmega} color={C.impedance}/>
                <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-center p-4 rounded-lg bg-gray-900/50 border border-gray-800 mt-2">
                   {mode === 'diff' ? <Formula>微分操作等效于乘 jω</Formula> : <Formula>积分操作等效于除以 jω</Formula>}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ModuleImpedance() {
  const [R, setR] = useState(50), [L, setL] = useState(100), [Ccap, setCcap] = useState(200), [f, setF] = useState(50);
  const d = impedance(R, L, Ccap, f);

  const canvas = useCanvas((ctx, w, h) => {
    const cx = w * 0.4, cy = h * 0.6;
    const maxVal = Math.max(R, Math.abs(d.X), d.z, 1), scale = Math.min(w * 0.45, h * 0.45) / maxVal;

    Draw.axes(ctx, w, h, cx, cy, 'R (Ω)', 'jX (Ω)');
    Draw.vector(ctx, cx, cy, 0, R * scale, C.text, 'R', 3);
    
    const endX = cx + R * scale;
    ctx.save();
    ctx.strokeStyle = C.current; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = C.current;
    ctx.beginPath(); ctx.moveTo(endX, cy); ctx.lineTo(endX, cy - d.X * scale); ctx.stroke();
    Draw.text(ctx, 'jX', endX + 15, cy - (d.X * scale)/2, { color: C.current, font: 'italic 16px "Cambria Math", serif' });
    ctx.restore();
    
    Draw.vector(ctx, cx, cy, d.phi, d.z * scale, C.impedance, 'Z', 4);
    Draw.angleArc(ctx, cx, cy, d.phi, 50, 'φ');

    ctx.fillStyle = '#111827'; ctx.fillRect(20, 20, 160, 70);
    ctx.strokeStyle = '#374151'; ctx.strokeRect(20, 20, 160, 70);
    Draw.text(ctx, `Z = R + jX`, 35, 45, { color: C.impedance, font: 'italic 600 18px "Cambria Math", serif' });
    Draw.text(ctx, `|Z| = ${fmt(d.z, 2)} Ω`, 35, 75, { color: C.text, font: '15px monospace' });
  }, [R, L, Ccap, f]);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 h-full">
      <Card title="复阻抗三角形可视化" icon={<GitCommit size={18} color={C.impedance} />}>
        <div className="h-[350px] md:h-[450px] xl:h-[500px] w-full bg-black/40 rounded-xl border border-gray-800 overflow-hidden shadow-inner">
          <canvas ref={canvas} className="w-full h-full block" />
        </div>
      </Card>

      <Card title="RLC 参数控制">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 w-full min-w-0">
          <div className="flex-1 w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-6 border-b lg:border-b-0 lg:border-r border-gray-800 pb-5 lg:pb-0 lg:pr-8">
            <ControlSlider label="电阻" symbol="R" value={R} min={1} max={150} step={1} unit="Ω" onChange={setR} color={C.text}/>
            <ControlSlider label="电感" symbol="L" value={L} min={10} max={300} step={1} unit="mH" onChange={setL} color={C.voltage} />
            <ControlSlider label="电容" symbol="C" value={Ccap} min={10} max={500} step={1} unit="μF" onChange={setCcap} color={C.current} />
            <ControlSlider label="频率" symbol="f" value={f} min={10} max={200} step={1} unit="Hz" onChange={setF} color={C.impedance} />
          </div>
          
          <div className="w-full lg:w-[320px] bg-gray-900/60 p-5 rounded-lg border border-gray-800 shrink-0 flex flex-col justify-center">
             <div className="grid grid-cols-2 gap-y-3 text-sm font-mono text-gray-300">
              <div>Xₗ: <b className="text-blue-400">{fmt(d.XL, 1)} Ω</b></div>
              <div>X𝚌: <b className="text-yellow-400">{fmt(d.XC, 1)} Ω</b></div>
              <div>X: <b className="text-gray-100">{fmt(d.X, 1)} Ω</b></div>
              <div>φ: <b className="text-green-400">{fmt(d.phiDeg, 1)}°</b></div>
            </div>
            <div className="mt-5 p-3 rounded-lg text-center font-bold tracking-wider text-sm" 
                 style={{ background: Math.abs(d.X) < 0.05 ? 'rgba(255,255,255,0.1)' : (d.X > 0 ? 'rgba(56,189,248,0.1)' : 'rgba(251,191,36,0.1)'),
                          color: Math.abs(d.X) < 0.05 ? C.text : (d.X > 0 ? C.voltage : C.current) }}>
              {Math.abs(d.X) < 0.05 ? '纯阻性：φ = 0°' : d.X > 0 ? '感性：电压超前电流' : '容性：电压滞后电流'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ModuleSeries() {
  const [mode, setMode] = useState('RLC');
  const [R, setR] = useState(50), [L, setL] = useState(150), [Ccap, setCcap] = useState(80), [f, setF] = useState(50);
  const XL = TAU * f * (L / 1000), XC = 1 / (TAU * f * (Ccap / 1e6)), X = mode === 'RL' ? XL : mode === 'RC' ? -XC : XL - XC;
  const z = Math.hypot(R, X), phi = Math.atan2(X, R);

  const canvas = useCanvas((ctx, w, h) => {
    const cx = w * 0.45, cy = h * 0.5;
    const maxVal = Math.max(R, Math.abs(X), z, 1);
    const scale = (Math.min(w, h) * 0.35) / maxVal;
    
    Draw.axes(ctx, w, h, cx, cy, 'Re (参考电流 İ)', 'Im');

    Draw.vector(ctx, cx, cy, 0, R * scale, C.text, 'U̇ᵣ', 3);
    if (mode === 'RL') Draw.vector(ctx, cx + R * scale, cy, Math.PI / 2, XL * scale, C.voltage, 'U̇ₗ', 3);
    if (mode === 'RC') Draw.vector(ctx, cx + R * scale, cy, -Math.PI / 2, XC * scale, C.current, 'U̇𝚌', 3);
    if (mode === 'RLC') {
      Draw.vector(ctx, cx + R * scale, cy, Math.PI / 2, XL * scale, C.voltage, 'U̇ₗ', 3);
      Draw.vector(ctx, cx + R * scale, cy - XL * scale, -Math.PI / 2, XC * scale, C.current, 'U̇𝚌', 3);
    }
    Draw.vector(ctx, cx, cy, phi, z * scale, C.impedance, 'U̇_total', 4);
    Draw.angleArc(ctx, cx, cy, phi, 50, 'φ');

    ctx.fillStyle = '#111827'; ctx.fillRect(20, 20, 220, 85);
    ctx.strokeStyle = '#374151'; ctx.strokeRect(20, 20, 220, 85);
    Draw.text(ctx, `Z = ${fmt(R, 1)} ${X >= 0 ? '+' : '−'} j${fmt(Math.abs(X), 1)} Ω`, 35, 45, { color: C.impedance, font: '15px monospace' });
    Draw.text(ctx, `|Z| = ${fmt(z, 2)} Ω`, 35, 70, { color: C.text, font: '15px monospace' });
    Draw.text(ctx, `φ = ${fmt(deg(phi), 2)}°`, 35, 90, { color: C.text, font: '15px monospace' });
  }, [mode, R, L, Ccap, f]);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 h-full">
      <Card title="串联 RLC 电压相量合成" icon={<Network size={18} color={C.voltage} />}>
        <div className="h-[350px] md:h-[450px] xl:h-[500px] w-full bg-black/40 rounded-xl border border-gray-800 overflow-hidden shadow-inner">
          <canvas ref={canvas} className="w-full h-full block" />
        </div>
      </Card>
      
      <Card title="参数控制台">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 w-full min-w-0 items-start lg:items-stretch">
           <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-[240px] border-b lg:border-b-0 lg:border-r border-gray-800 pb-5 lg:pb-0 lg:pr-6 shrink-0 justify-center">
              <div className="flex flex-wrap gap-2 justify-center w-full">
                {['RL', 'RC', 'RLC'].map((x) => (
                  <ToggleButton key={x} active={mode === x} onClick={() => setMode(x)}>{x} 串联</ToggleButton>
                ))}
              </div>
              <div className="p-4 rounded-lg bg-gray-900/60 border border-gray-800 text-center w-full flex items-center justify-center min-w-0">
                <Formula color={C.voltage}>U̇ = U̇ᵣ + U̇ₗ + U̇𝚌</Formula>
              </div>
           </div>

           <div className="flex-1 w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-6">
            <ControlSlider label="电阻" symbol="R" value={R} min={5} max={150} step={1} unit="Ω" onChange={setR} color={C.text}/>
            <ControlSlider label="电感" symbol="L" value={L} min={10} max={300} step={1} unit="mH" onChange={setL} color={C.voltage} />
            <ControlSlider label="电容" symbol="C" value={Ccap} min={10} max={500} step={1} unit="μF" onChange={setCcap} color={C.current} />
            <ControlSlider label="频率" symbol="f" value={f} min={10} max={200} step={1} unit="Hz" onChange={setF} color={C.impedance} />
           </div>
        </div>
      </Card>
    </div>
  );
}

function ModuleResonance() {
  const [R, setR] = useState(20), [L, setL] = useState(50), [Ccap, setCcap] = useState(50), [f, setF] = useState(100);
  const U = 100, Lh = L / 1000, Cf = Ccap / 1e6, f0 = 1 / (TAU * Math.sqrt(Lh * Cf));
  const currentAt = useCallback((freq) => {
    const ww = TAU * Math.max(freq, 0.001);
    return U / Math.hypot(R, ww * Lh - 1 / (ww * Cf));
  }, [R, Lh, Cf]);
  const I = currentAt(f);

  const canvas = useCanvas((ctx, w, h) => {
    const x0 = 60, y0 = 40, gw = w - 90, gh = h - 90, maxF = Math.max(300, f0 * 2.2), maxI = U / R;
    Draw.grid(ctx, x0, y0, gw, gh, 8, 6);

    ctx.save(); ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + gh); ctx.lineTo(x0 + gw, y0 + gh); ctx.stroke();
    ctx.restore();

    ctx.save(); ctx.strokeStyle = C.current; ctx.lineWidth = 3.5; ctx.shadowBlur = 15; ctx.shadowColor = C.current;
    ctx.beginPath();
    for (let px = 0; px <= gw; px+=2) {
      const ff = Math.max(0.1, px / gw * maxF), yy = currentAt(ff), py = y0 + gh - (yy / maxI) * gh * 0.9;
      if (px === 0) ctx.moveTo(x0 + px, py); else ctx.lineTo(x0 + px, py);
    }
    ctx.stroke(); ctx.restore();

    const f0x = x0 + clamp(f0 / maxF, 0, 1) * gw;
    ctx.setLineDash([5, 5]); ctx.strokeStyle = C.voltage; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(f0x, y0); ctx.lineTo(f0x, y0 + gh); ctx.stroke(); ctx.setLineDash([]);
    
    ctx.fillStyle = C.panel; ctx.fillRect(f0x - 60, y0 - 25, 120, 20);
    Draw.text(ctx, `谐振 f₀ = ${fmt(f0, 1)} Hz`, f0x, y0 - 10, { color: C.voltage, font: '14px monospace', align: 'center' });

    const fx = x0 + clamp(f / maxF, 0, 1) * gw, fy = y0 + gh - (I / maxI) * gh * 0.9;
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = C.current;
    ctx.beginPath(); ctx.arc(fx, fy, 6, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;

    Draw.text(ctx, 'I / A', 20, y0 + 5, { color: C.muted, font: 'italic 15px serif' });
    Draw.text(ctx, 'f / Hz', x0 + gw + 10, y0 + gh + 20, { color: C.muted, font: 'italic 15px serif' });
  }, [R, L, Ccap, f, f0, currentAt]);

  const omega = TAU * f, XL = omega * Lh, XC = 1 / (omega * Cf), phi = Math.atan2(XL - XC, R);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 h-full">
      <Card title="RLC 串联电流幅频特性 (Resonance Curve)" icon={<SlidersHorizontal size={18} color={C.current} />}>
        <div className="h-[350px] md:h-[450px] xl:h-[500px] w-full bg-black/40 rounded-xl border border-gray-800 overflow-hidden shadow-inner">
          <canvas ref={canvas} className="w-full h-full block" />
        </div>
      </Card>
      
      <Card title="电路参数控制台">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 w-full min-w-0">
          <div className="flex-1 w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 border-b lg:border-b-0 lg:border-r border-gray-800 pb-5 lg:pb-0 lg:pr-8">
            <ControlSlider label="工作频率" symbol="f" value={f} min={10} max={300} step={1} unit="Hz" onChange={setF} color={C.voltage} />
            <ControlSlider label="电阻" symbol="R" value={R} min={5} max={100} step={1} unit="Ω" onChange={setR} color={C.text} />
            <ControlSlider label="电感" symbol="L" value={L} min={10} max={100} step={1} unit="mH" onChange={setL} color={C.voltage} />
            <ControlSlider label="电容" symbol="C" value={Ccap} min={10} max={100} step={1} unit="μF" onChange={setCcap} color={C.current} />
          </div>
          
          <div className="w-full lg:w-[300px] flex flex-col justify-center gap-4 shrink-0 min-w-0">
             <div className="flex justify-between items-center bg-gray-900/60 p-4 rounded-lg border border-gray-800">
               <Formula color={C.impedance}>f₀ = 1/(2π√LC)</Formula>
               <div className="font-mono text-green-400 font-bold text-xl">{fmt(f0, 1)} Hz</div>
             </div>
             
             <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono text-gray-300">
              <div className="p-2.5 rounded bg-gray-800">Xₗ={fmt(XL, 1)}</div>
              <div className="p-2.5 rounded bg-gray-800">X𝚌={fmt(XC, 1)}</div>
              <div className="p-2.5 rounded bg-gray-800">φ={fmt(deg(phi), 1)}°</div>
            </div>

             <div className="p-3 rounded-lg text-center font-bold text-sm tracking-wide" 
                  style={{ background: Math.abs(f - f0) < 1.5 ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)', color: Math.abs(f - f0) < 1.5 ? C.impedance : C.text }}>
                {Math.abs(f - f0) < 1.5 ? '串联谐振：Xₗ = X𝚌，Z = R' : f < f0 ? '容性区：X𝚌 > Xₗ' : '感性区：Xₗ > X𝚌'}
             </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ModuleUnified() {
  const [R, setR] = useState(20), [L, setL] = useState(100), [Ccap, setCcap] = useState(80), [f, setF] = useState(50);
  const [playing, setPlaying] = useState(true), [U] = useState(10);
  const { timeRef, reset } = useAnimationClock(playing, 0.6);
  const d = impedance(R, L, Ccap, f), I = U / d.z, phaseI = 0, phaseU = d.phi;

  const canvas = useCanvas((ctx, w, h) => {
    const gap = 20, top = 50, panelW = (w - gap * 2) / 3, panelH = h - top - 20, theta = TAU * f * timeRef.current;
    
    // Panel 1: Circuit
    ctx.save(); ctx.translate(0, top);
    const y = panelH * 0.5, x0 = 10, x1 = panelW - 10;
    
    const compW = (panelW - 60) / 3; 
    ctx.strokeStyle = C.text; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 15, y); ctx.stroke();
    Draw.battery(ctx, x0 + 20, y, 1.0);
    ctx.beginPath(); ctx.moveTo(x0 + 25, y); ctx.lineTo(x0 + 35, y); ctx.stroke();
    
    Draw.resistor(ctx, x0 + 35, y, x0 + 35 + compW*0.8, y);
    Draw.coil(ctx, x0 + 35 + compW, y, x0 + 35 + compW*1.8, y);
    Draw.capacitor(ctx, x0 + 35 + compW*2, y, x0 + 35 + compW*2.8, y);
    ctx.beginPath(); ctx.moveTo(x0 + 35 + compW*2.8, y); ctx.lineTo(x1, y); ctx.stroke();
    
    Draw.text(ctx, 'R', x0 + 35 + compW*0.4, y - 20, { color: C.text, font: 'italic 16px serif', align: 'center' });
    Draw.text(ctx, 'L', x0 + 35 + compW*1.4, y - 20, { color: C.text, font: 'italic 16px serif', align: 'center' });
    Draw.text(ctx, 'C', x0 + 35 + compW*2.4, y - 20, { color: C.text, font: 'italic 16px serif', align: 'center' });
    Draw.text(ctx, '物理拓扑结构', panelW / 2, -20, { color: C.muted, font: '600 14px Arial', align: 'center' });
    ctx.restore();

    // Panel 2: Waveform
    ctx.save(); ctx.translate(panelW + gap, top);
    Draw.text(ctx, '时域波形演化', panelW / 2, -20, { color: C.muted, font: '600 14px Arial', align: 'center' });
    Draw.grid(ctx, 10, 20, panelW - 20, panelH - 40, 6, 4);
    const mid = panelH * 0.5;
    ctx.strokeStyle = C.axis; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(10, mid); ctx.lineTo(panelW - 10, mid); ctx.stroke();
    Draw.wave(ctx, 10, 20, panelW - 20, panelH - 40, theta, 1, 1.0, C.current, 'i', (f * timeRef.current) % 1);
    Draw.wave(ctx, 10, 20, panelW - 20, panelH - 40, theta + phaseU, 1, 1.0, C.voltage, 'u', (f * timeRef.current) % 1);
    ctx.restore();

    // Panel 3: Phasor
    ctx.save(); ctx.translate(2 * (panelW + gap), top);
    Draw.text(ctx, '相量域投影', panelW / 2, -20, { color: C.muted, font: '600 14px Arial', align: 'center' });
    const pcx = panelW / 2, pcy = panelH * 0.5, scale = Math.min(panelW * 0.4, panelH * 0.4) / Math.max(U, 1);
    Draw.axes(ctx, panelW, panelH, pcx, pcy);
    Draw.vector(ctx, pcx, pcy, theta, I * scale, C.current, 'İ', 3);
    Draw.vector(ctx, pcx, pcy, theta + phaseU, U * scale, C.voltage, 'U̇', 3);
    Draw.angleArc(ctx, pcx, pcy, phaseU, 40, 'φ');
    ctx.restore();

    ctx.strokeStyle = C.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(panelW + gap/2, 20); ctx.lineTo(panelW + gap/2, h - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2*panelW + 1.5*gap, 20); ctx.lineTo(2*panelW + 1.5*gap, h - 20); ctx.stroke();

  }, [R, L, Ccap, f, U, playing]);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 h-full">
      <Card title="时域 — 相量域 — 阻抗域 三维联动" icon={<Network size={18} color={C.voltage} />}>
        <div className="h-[250px] md:h-[400px] xl:h-[500px] w-full bg-black/40 rounded-xl border border-gray-800 overflow-hidden shadow-inner">
          <canvas ref={canvas} className="w-full h-full block" />
        </div>
      </Card>
      <Card title="全局参数控制台">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 w-full min-w-0">
           <div className="flex flex-wrap sm:flex-row lg:flex-col gap-4 w-full lg:w-[150px] justify-center items-center border-b lg:border-b-0 lg:border-r border-gray-800 pb-5 lg:pb-0 lg:pr-6 shrink-0">
            <ActionButton primary onClick={() => setPlaying(!playing)}>
              {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? '暂停' : '播放'}
            </ActionButton>
            <ActionButton onClick={reset}><RotateCcw size={16} />重置</ActionButton>
          </div>
          <div className="flex-1 w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            <ControlSlider label="R" symbol="" value={R} min={5} max={100} step={1} unit="Ω" onChange={setR} color={C.text}/>
            <ControlSlider label="L" symbol="" value={L} min={10} max={300} step={1} unit="mH" onChange={setL} />
            <ControlSlider label="C" symbol="" value={Ccap} min={10} max={500} step={1} unit="μF" onChange={setCcap} color={C.current} />
            <ControlSlider label="f" symbol="" value={f} min={10} max={200} step={1} unit="Hz" onChange={setF} color={C.impedance} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ModuleMaxwell() {
  const [R1, setR1] = useState(100), [L1, setL1] = useState(50), [R2, setR2] = useState(100);
  const [R3, setR3] = useState(100), [R4, setR4] = useState(200), [C4, setC4] = useState(5);

  const targetR = R2 * R3 / R4, targetL_mH = R2 * R3 * (C4 / 1e6) * 1000;
  const error = Math.abs(R1 - targetR) / Math.max(targetR, 1) + Math.abs(L1 - targetL_mH) / Math.max(targetL_mH, 0.001);
  const status = error < 0.015 ? '电桥平衡' : error < 0.10 ? '接近平衡' : '严重失衡';

  const canvas = useCanvas((ctx, w, h) => {
    const cx = w * 0.5, cy = h * 0.5;
    // 严格的安全盒计算：限制 bridgeR 以确保不超越画布边界
    const bridgeR = Math.min(w, h) * 0.25; 
    const top = cy - bridgeR, bottom = cy + bridgeR, left = cx - bridgeR, right = cx + bridgeR;
    
    ctx.save(); ctx.strokeStyle = C.axis; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(left, cy); ctx.lineTo(cx, bottom); ctx.lineTo(right, cy); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, cy); ctx.lineTo(right, cy); ctx.stroke();
    ctx.restore();

    const offset = bridgeR * 0.5;
    Draw.resistor(ctx, cx - offset, top + offset, left + offset, cy - offset);
    Draw.resistor(ctx, cx + offset, top + offset, right - offset, cy - offset);
    Draw.resistor(ctx, left + offset, cy + offset, cx - offset, bottom - offset);
    Draw.resistor(ctx, right - offset, cy + offset, cx + offset, bottom - offset);

    Draw.text(ctx, 'Z₁ = R₁ + jωL₁', left - 15, cy - bridgeR*0.5, { color: C.voltage, font: '14px serif', align: 'right' });
    Draw.text(ctx, 'Z₂ = R₂', right + 15, cy - bridgeR*0.5, { color: C.text, font: '14px serif', align: 'left' });
    Draw.text(ctx, 'Z₃ = R₃', left - 15, cy + bridgeR*0.5, { color: C.text, font: '14px serif', align: 'right' });
    Draw.text(ctx, 'Z₄ = R₄ ∥ C₄', right + 15, cy + bridgeR*0.5, { color: C.current, font: '14px serif', align: 'left' });

    ctx.fillStyle = C.panel; ctx.strokeStyle = C.voltage; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TAU); ctx.fill(); ctx.stroke();
    Draw.text(ctx, 'G', cx, cy + 6, { color: C.voltage, font: 'italic 18px Georgia', align: 'center' });

    const gy = 40;
    ctx.strokeStyle = C.border; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx - 50, gy); ctx.lineTo(cx + 50, gy); ctx.stroke();
    ctx.fillStyle = error < 0.015 ? C.impedance : C.danger;
    const pointerX = cx + (clamp(error / 0.5, 0, 1) * 50); 
    ctx.beginPath(); ctx.arc(pointerX, gy, 7, 0, TAU); ctx.fill();
    Draw.text(ctx, '检流计偏转', cx - 60, gy + 4, { color: C.muted, font: '13px Arial', align: 'right' });
  }, [R1, L1, R2, R3, R4, C4, error]);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 h-full">
      <Card title="Maxwell LC 交流电桥" icon={<GitCommit size={18} color={C.voltage} />}>
        <div className="h-[450px] lg:h-[550px] w-full bg-black/40 rounded-xl border border-gray-800 overflow-hidden shadow-inner relative">
          <canvas ref={canvas} className="w-full h-full block" />
          
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 flex flex-col sm:flex-row md:flex-col gap-3 pointer-events-none">
             <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-700 backdrop-blur-sm">
                <Formula block color={C.voltage}>R₁ = R₂R₃/R₄</Formula>
                <div className="text-center text-sm font-mono text-gray-300 mt-1">目标 {fmt(targetR, 1)} Ω · 当前 {R1} Ω</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-700 backdrop-blur-sm">
                <Formula block color={C.current}>L₁ = R₂R₃C₄</Formula>
                <div className="text-center text-sm font-mono text-gray-300 mt-1">目标 {fmt(targetL_mH, 1)} mH · 当前 {L1} mH</div>
              </div>
          </div>
        </div>
      </Card>

      <Card title="电桥调节面板">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 w-full min-w-0">
           <div className="w-full lg:w-[150px] xl:w-[180px] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-800 pb-5 lg:pb-0 lg:pr-6 shrink-0">
              <div className="p-4 rounded-lg text-center font-bold tracking-widest text-lg w-full h-full flex items-center justify-center min-h-[80px]" 
                   style={{ color: status === '电桥平衡' ? C.impedance : C.danger, background: status === '电桥平衡' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
                {status}
              </div>
           </div>

           {/* Grid 严格限制为最大 3 列，小屏 1-2 列，坚决杜绝溢出 */}
           <div className="flex-1 w-full min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              <ControlSlider label="已知桥臂 R₂" symbol="R₂" value={R2} min={20} max={500} step={10} unit="Ω" onChange={setR2} color={C.text}/>
              <ControlSlider label="已知桥臂 R₃" symbol="R₃" value={R3} min={20} max={500} step={10} unit="Ω" onChange={setR3} color={C.text}/>
              <ControlSlider label="待测电阻 R₁" symbol="R₁" value={R1} min={10} max={300} step={1} unit="Ω" onChange={setR1} color={C.voltage}/>
              
              <div className="col-span-1 md:col-span-2 lg:col-span-3 h-px bg-gray-800 my-1 hidden md:block"></div>
              
              <ControlSlider label="可调桥臂 R₄" symbol="R₄" value={R4} min={20} max={1000} step={5} unit="Ω" onChange={setR4} color={C.current}/>
              <ControlSlider label="可调桥臂 C₄" symbol="C₄" value={C4} min={1} max={20} step={0.1} unit="μF" onChange={setC4} color={C.current}/>
              <ControlSlider label="待测电感 L₁" symbol="L₁" value={L1} min={1} max={150} step={1} unit="mH" onChange={setL1} color={C.voltage}/>
           </div>
        </div>
      </Card>
    </div>
  );
}

// ---------------- 主入口 ----------------

export default function RLCPhasorLab() {
  const [active, setActive] = useState(1);

  const modules = useMemo(() => [
    { id: 1, title: '理想元件与相位', icon: <Activity size={17} />, component: ModuleIdeal },
    { id: 2, title: '旋转相量投影', icon: <RotateCcw size={17} />, component: ModuleRotating },
    { id: 3, title: '相量几何运算', icon: <GitMerge size={17} />, component: ModuleOperations },
    { id: 4, title: '复阻抗三角形', icon: <GitCommit size={17} />, component: ModuleImpedance },
    { id: 5, title: 'RLC 串联相量', icon: <Network size={17} />, component: ModuleSeries },
    { id: 6, title: '幅频特性与谐振', icon: <SlidersHorizontal size={17} />, component: ModuleResonance },
    { id: 7, title: '三维联动分析', icon: <Waves size={17} />, component: ModuleUnified },
    { id: 8, title: 'Maxwell 电桥', icon: <Zap size={17} />, component: ModuleMaxwell },
  ], []);

  const Current = modules.find((m) => m.id === active)?.component || ModuleIdeal;

  return (
    <div className="w-full min-h-screen font-sans p-4 md:p-6 box-border flex flex-col min-w-0" style={{ background: C.bgMain, color: C.text }}>
      
      {/* 顶部标题 */}
      <header className="border rounded-xl shadow-2xl px-6 py-5 mb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shrink-0 min-w-0" style={{ borderColor: C.border, background: C.panel }}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            <span className="w-2 h-8 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.8)] shrink-0" style={{ background: C.voltage }} />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white truncate">
              正弦交流电路与相量分析
            </h1>
          </div>
          <p className="text-sm mt-2 ml-6 text-gray-400 truncate">
            复数法、相量法、复阻抗与 RLC 电路的可视化教学仿真
          </p>
        </div>
        <div className="px-5 py-3 rounded-xl border shrink-0 text-center" style={{ background: 'rgba(56, 189, 248, 0.05)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
          <span className="font-serif text-xl tracking-wider whitespace-nowrap" style={{ color: C.voltage }}>
            e<sup>jπ</sup> + 1 = 0
          </span>
        </div>
      </header>

      {/* 顶部吸顶导航栏 */}
      <nav 
        className="w-full shrink-0 border rounded-xl shadow-lg p-2 md:p-3 sticky top-4 z-20 mb-6 backdrop-blur-xl transition-all min-w-0 overflow-hidden" 
        style={{ borderColor: C.border, background: 'rgba(17, 24, 39, 0.85)' }}
      >
        <div className="flex flex-row items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <div className="hidden lg:flex items-center px-4 text-xs font-bold tracking-widest text-gray-500 uppercase whitespace-nowrap border-r border-gray-700 pr-6 mr-3 h-8 shrink-0">
            实验模块
          </div>
          {modules.map((m) => {
            const selected = active === m.id;
            return (
              <button
                key={m.id} onClick={() => setActive(m.id)}
                className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-300 whitespace-nowrap outline-none"
                style={{
                  background: selected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: selected ? '#fff' : C.muted,
                  borderColor: selected ? 'rgba(56, 189, 248, 0.4)' : 'transparent',
                  boxShadow: selected ? '0 0 12px rgba(56, 189, 248, 0.15)' : 'none'
                }}
              >
                <span style={{ color: selected ? C.voltage : C.axis, transition: 'color 0.3s' }}>{m.icon}</span>
                <span>{m.title}</span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* 核心工作区：加入严格限制 w-full min-w-0 */}
      <main className="w-full flex-1 flex flex-col min-w-0 pb-10">
        <Current />
      </main>

    </div>
  );
}