"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BookOpen,
  Gauge,
  Lightbulb,
  Magnet,
  Pause,
  Play,
  Power,
  RotateCcw,
  Zap,
  ZapOff,
} from "lucide-react";

/*
 * ============================================================================
 * R-L 电路暂态实验室 · 大学物理教材级交互版 (深色极客增强版 V3)
 * ----------------------------------------------------------------------------
 * 核心升级：
 * 1. 动态等离子电弧：根据高频暂态电流和真实物理时间 (t) 生成剧烈扭动、带光晕的闪电电弧。
 * 2. 拓扑级视觉重构：彻底解决元器件重叠，绘制绝对标准的平行板寄生电容与拉弧断口。
 * 3. 字体与排版优化：超高压警报、幽灵电源、开关状态的标签位置完美避让导线。
 * ============================================================================
 */

const COLORS = {
  ink: "#e2e8f0",      // 元器件主线条与文字
  muted: "#94a3b8",    // 次要标注
  wire: "#334155",     // 未通电导线
  blue: "#3b82f6",     // 蓝
  cyan: "#06b6d4",     // 青
  red: "#ef4444",      // 红
  orange: "#f97316",   // 橙
  purple: "#8b5cf6",   // 紫
  green: "#10b981",    // 绿
  yellow: "#eab308",   // 黄
  paper: "#020617",    // 画布极深背景
  panel: "#0f172a",    // 面板背景
  border: "#1e293b",   // 边框
};

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const fmt = (x, n = 2) => Number.isFinite(x) ? x.toFixed(n) : "—";
const fmtSI = (x, unit = "") => {
  if (!Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  if (ax >= 1e6) return `${fmt(x / 1e6, 2)} M${unit}`;
  if (ax >= 1e3) return `${fmt(x / 1e3, 2)} k${unit}`;
  if (ax < 1e-3 && ax > 0) return `${fmt(x * 1e6, 2)} μ${unit}`;
  if (ax < 1 && ax > 0) return `${fmt(x * 1e3, 2)} m${unit}`;
  return `${fmt(x, 2)} ${unit}`;
};

// 物理时间引擎
function useAnimationClock(running, duration, speed = 1) {
  const [t, setT] = useState(0);
  const raf = useRef(null);
  const last = useRef(null);

  useEffect(() => {
    if (!running) return;
    last.current = null;

    const tick = (now) => {
      if (last.current == null) last.current = now;
      const dt = Math.min(0.05, (now - last.current) / 1000);
      last.current = now;

      setT((old) => {
        const next = old + dt * speed;
        return Math.min(duration, next);
      });

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      last.current = null;
    };
  }, [running, duration, speed]);

  return [t, setT];
}

const styles = `
  @keyframes currentFlow {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: -40; }
  }
  .rl-lab * { box-sizing:border-box; }
  .rl-lab input[type=range] { accent-color:#3b82f6; }
  .math { font-family: "Cambria Math","STIX Two Math","Times New Roman",serif; }
  .tabular { font-variant-numeric: tabular-nums; }
`;

function Panel({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl ${className}`}>
      {children}
    </section>
  );
}

function Stat({ label, value, unit, color = COLORS.blue, note }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-800/40 p-5">
      <div className="text-xs font-semibold tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="tabular text-3xl font-bold" style={{ color }}>{value}</span>
        <span className="text-sm font-semibold text-slate-400">{unit}</span>
      </div>
      {note && <div className="mt-1.5 text-xs text-slate-500">{note}</div>}
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <label className="block rounded-xl border border-slate-800/80 bg-slate-800/40 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="tabular rounded-md bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-100 shadow-sm">
          {fmt(value, step < 0.1 ? 2 : step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input
        className="w-full cursor-pointer"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Button({ children, onClick, primary = false, danger = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold tracking-wide transition-all shadow-lg
        ${disabled ? "cursor-not-allowed opacity-40" : "active:scale-[.97] hover:shadow-xl"}
        ${danger
          ? "border-red-500/50 bg-red-600 text-white hover:bg-red-500"
          : primary
            ? "border-blue-500/50 bg-blue-600 text-white hover:bg-blue-500"
            : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"}`}
    >
      {children}
    </button>
  );
}

function Equation({ children }) {
  return (
    <div className="math rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-5 text-center text-xl text-slate-200 shadow-inner">
      {children}
    </div>
  );
}

/* ----------------------------- SVG 基元 (深色适配) ----------------------------------- */

function Wire({ x1, y1, x2, y2, active = false, color = COLORS.blue, reverse = false }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={COLORS.wire} strokeWidth="4" strokeLinecap="round" />
      {active && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray="10 16"
          style={{
            animation: `${reverse ? "currentFlow 0.8s linear infinite reverse" : "currentFlow 0.8s linear infinite"}`,
            filter: `drop-shadow(0 0 6px ${color})`
          }}
        />
      )}
    </g>
  );
}

function Battery({ x, y, scale = 1, label = "E", opacity = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      <line x1="-8" y1="-22" x2="-8" y2="22" stroke={COLORS.ink} strokeWidth="4" />
      <line x1="8" y1="-13" x2="8" y2="13" stroke={COLORS.ink} strokeWidth="4" />
      <text x="-19" y="-29" fill={COLORS.ink} className="math" fontSize="15" fontStyle="italic" fontWeight="700">{label}</text>
      <text x="-22" y="8" fill={COLORS.ink} fontSize="18" fontWeight="700">+</text>
      <text x="13" y="8" fill={COLORS.ink} fontSize="18" fontWeight="700">−</text>
    </g>
  );
}

function Resistor({ x, y, width = 72, label = "R" }) {
  const pts = [`${x},${y}`];
  const dx = width / 6;
  for (let i = 0; i < 6; i++) {
    pts.push(`${x + dx * (i + .5)},${y + (i % 2 ? 13 : -13)}`);
  }
  pts.push(`${x + width},${y}`);
  return (
    <g>
      <polyline points={pts.join(" ")} fill="none" stroke={COLORS.ink} strokeWidth="3.5" strokeLinejoin="round" />
      <text x={x + width / 2} y={y - 22} fill={COLORS.ink} textAnchor="middle"
        className="math" fontSize="15" fontStyle="italic" fontWeight="700">{label}</text>
    </g>
  );
}

function Inductor({ x, y, width = 112, label = "L" }) {
  const loops = 4, w = width / loops;
  return (
    <g>
      <line x1={x} y1={y} x2={x + 10} y2={y} stroke={COLORS.ink} strokeWidth="3.5" />
      {Array.from({ length: loops }).map((_, i) => (
        <path key={i}
          d={`M ${x + 10 + i * w} ${y}
              C ${x + 10 + i * w + w * .15} ${y - 30},
                ${x + 10 + i * w + w * .85} ${y - 30},
                ${x + 10 + i * w + w} ${y}`}
          fill="none" stroke={COLORS.ink} strokeWidth="3.5" strokeLinecap="round" />
      ))}
      <text x={x + width / 2} y={y - 35} fill={COLORS.ink} textAnchor="middle"
        className="math" fontSize="15" fontStyle="italic" fontWeight="700">{label}</text>
    </g>
  );
}

function Capacitor({ x, y, label }) {
  return (
    <g>
      {/* 极板 */}
      <line x1={x - 6} y1={y - 18} x2={x - 6} y2={y + 18} stroke={COLORS.cyan} strokeWidth="4.5" strokeLinecap="round" />
      <line x1={x + 6} y1={y - 18} x2={x + 6} y2={y + 18} stroke={COLORS.cyan} strokeWidth="4.5" strokeLinecap="round" />
      {label && <text x={x} y={y + 36} fill={COLORS.cyan} textAnchor="middle" fontSize="13" fontWeight="bold">
        {label}
      </text>}
    </g>
  );
}

function Switch({ x, y, closed, label = "S" }) {
  return (
    <g>
      <circle cx={x} cy={y} r="5" fill={COLORS.ink} />
      <circle cx={x + 48} cy={y} r="5" fill={COLORS.ink} />
      <line x1={x} y1={y} x2={closed ? x + 48 : x + 34} y2={closed ? y : y - 22}
        stroke={COLORS.ink} strokeWidth="4" strokeLinecap="round" style={{ transition: "all 0.2s" }} />
      <text x={x + 24} y={y - 30} fill={COLORS.ink} textAnchor="middle" className="math"
        fontSize="15" fontStyle="italic" fontWeight="700">{label}</text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, label, color = COLORS.blue, reverse = false }) {
  const id = `arr-${x1}-${y1}-${x2}-${y2}-${color.replace("#", "")}`;
  return (
    <g>
      <defs>
        <marker id={id} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={color} />
        </marker>
      </defs>
      <line
        x1={reverse ? x2 : x1} y1={reverse ? y2 : y1}
        x2={reverse ? x1 : x2} y2={reverse ? y1 : y2}
        stroke={color} strokeWidth="3" markerEnd={`url(#${id})`}
      />
      {label && (
        <text x={(x1+x2)/2} y={Math.min(y1,y2)-14} textAnchor="middle"
          className="math" fontSize="15" fontStyle="italic" fontWeight="700" fill={color}>{label}</text>
      )}
    </g>
  );
}

// 动态高能等离子电弧特效 (随物理时间剧烈扭动)
function ArcEffect({ x1, x2, y, intensity, time }) {
  if (intensity < 0.05) return null;
  const w = x2 - x1;
  const mid = (x1 + x2) / 2;

  // 根据真实时间生成极高频伪随机抖动，模拟等离子体的不规则拉弧形态
  const j1 = Math.sin(time * 40000) * 12 * intensity;
  const j2 = Math.cos(time * 65000) * 12 * intensity;
  const j3 = Math.sin(time * 85000) * 12 * intensity;
  const j4 = Math.cos(time * 95000) * 12 * intensity;

  // 生成两根互相缠绕的剧烈闪电路径
  const path1 = `M${x1},${y} L${x1 + w*0.25},${y + j1} L${mid},${y + j2} L${x1 + w*0.75},${y + j3} L${x2},${y}`;
  const path2 = `M${x1},${y} L${x1 + w*0.3},${y - j2} L${mid},${y - j1} L${x1 + w*0.7},${y - j4} L${x2},${y}`;

  return (
    <g style={{ filter: `drop-shadow(0 0 ${10 + intensity * 20}px #06b6d4)` }}>
      {/* 深蓝外晕 */}
      <path d={path1} fill="none" stroke="#0ea5e9" strokeWidth={3 + intensity * 4} opacity="0.8" strokeLinejoin="miter" />
      {/* 紫色次晕 */}
      <path d={path2} fill="none" stroke="#8b5cf6" strokeWidth={2 + intensity * 4} opacity="0.8" strokeLinejoin="miter" />
      {/* 极亮纯白内芯 */}
      <path d={path1} fill="none" stroke="#ffffff" strokeWidth={1 + intensity * 2} strokeLinejoin="miter" />
      <path d={path2} fill="none" stroke="#ffffff" strokeWidth={0.5 + intensity} strokeLinejoin="miter" />
    </g>
  );
}

// 动态示波器轴线
function Axis({ x, y, w, h, xMax, yLabel, xLabel, points = [], color = COLORS.blue, zero = false }) {
  const px = (v) => x + (v / xMax) * w;
  const py = (v) => y + h / 2 - v * (h / 2 - 8);
  const d = points.length
    ? points.map((p, i) => `${i ? "L" : "M"} ${px(p.x)} ${py(p.y)}`).join(" ")
    : "";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="none" stroke={COLORS.border} strokeWidth="2" />
      <line x1={x} y1={y+h/2} x2={x+w} y2={y+h/2} stroke="#334155" strokeWidth="1.5" />
      {zero && <text x={x-8} y={y+h/2+4} textAnchor="end" fontSize="12" fill={COLORS.muted}>0</text>}
      <line x1={x} y1={y+h} x2={x+w} y2={y+h} stroke="#475569" strokeWidth="2" />
      <line x1={x} y1={y} x2={x} y2={y+h} stroke="#475569" strokeWidth="2" />
      
      {/* 示波器轨迹线段 */}
      {d && <path d={d} fill="none" stroke={color} strokeWidth="3" style={{ filter: `drop-shadow(0 2px 8px ${color}99)` }} />}
      
      {/* 示波器动态高亮探头 */}
      {points.length > 0 && (
        <circle cx={px(points[points.length-1].x)} cy={py(points[points.length-1].y)}
          r="4.5" fill="#fff" stroke={color} strokeWidth="2.5"
          style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      )}
      
      <text x={x+w-5} y={y+h-10} textAnchor="end" className="math" fontSize="13" fill={COLORS.muted}>{xLabel}</text>
      <text x={x+8} y={y+18} className="math" fontSize="13" fill={COLORS.muted}>{yLabel}</text>
    </g>
  );
}

// 通栏自适应高分辨率外框
function CircuitFrame({ children }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]">
      <svg viewBox="0 0 760 280" className="w-full h-auto min-h-[220px] lg:min-h-[320px]" preserveAspectRatio="xMidYMid meet">
        {children}
      </svg>
    </div>
  );
}

/* ----------------------------- 模块 1：接通暂态 ------------------------------------- */

function ChargeModule() {
  const [R, setR] = useState(10);
  const [L, setL] = useState(2);
  const [E, setE] = useState(12);
  const [running, setRunning] = useState(false);

  const tau = L / R;
  const Iinf = E / R;
  const duration = 5 * tau;
  const [t, setT] = useAnimationClock(running, duration, 1);

  const i = Iinf * (1 - Math.exp(-t / tau));
  const uL = E * Math.exp(-t / tau);
  const uR = i * R;
  const energyL = .5 * L * i * i;
  const heat = E * i * t > 0 ? E * (Iinf * (t + tau * Math.exp(-t/tau) - tau)) - energyL : 0;
  const frac = clamp(i / Iinf, 0, 1);

  const reset = () => { setRunning(false); setT(0); };
  
  const activeCurve = useMemo(() => {
    if (t === 0) return [];
    const pts = [];
    const steps = 100;
    for (let j = 0; j <= steps; j++) {
      const currT = t * (j / steps);
      pts.push({ x: currT / tau, y: 2 * ((1 - Math.exp(-currT / tau)) - 0.5) });
    }
    return pts;
  }, [t, tau]);

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="mb-8">
          <CircuitFrame>
            <Wire x1={180} y1={220} x2={180} y2={100} active={frac>.01} />
            <Wire x1={180} y1={100} x2={240} y2={100} active={frac>.01} />
            <Wire x1={288} y1={100} x2={340} y2={100} active={frac>.01} />
            <Wire x1={412} y1={100} x2={460} y2={100} active={frac>.01} />
            <Wire x1={572} y1={100} x2={580} y2={100} active={frac>.01} />
            <Wire x1={580} y1={100} x2={580} y2={220} active={frac>.01} />
            <Wire x1={580} y1={220} x2={400} y2={220} active={frac>.01} />
            <Wire x1={360} y1={220} x2={180} y2={220} active={frac>.01} />
            <Switch x={240} y={100} closed={t > 0} />
            <Resistor x={340} y={100} width={72} />
            <Inductor x={460} y={100} width={112} />
            <Battery x={380} y={220} scale={1.15} />
            {frac > .02 && <Arrow x1={285} y1={70} x2={335} y2={70} label={`i = ${fmt(i,2)} A`} />}
            <text x="380" y="260" textAnchor="middle" fontSize="14" fill={COLORS.muted}>
              闭合 S 后，电流连续建立；L 中的反电动势阻碍电流变化
            </text>
          </CircuitFrame>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button primary onClick={() => { if (t >= duration) setT(0); setRunning(v=>!v); }}>
              {running ? <><Pause size={19}/>暂停</> : <><Play size={19}/> {t>0 ? "继续" : "闭合开关 S"}</>}
            </Button>
            <Button onClick={reset}><RotateCcw size={19}/>重置参数</Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
              <Zap size={24} className="text-blue-500"/> RL 接通暂态
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-400">
              回路满足方程 <span className="math mx-1 text-slate-200">L di/dt + Ri = E</span>。
              因电感内部磁通不能突变，即具有电流的连续性约束 <span className="math text-slate-200">i(0⁺)=i(0⁻)</span>，
              因此接通瞬间电路如同断路，电流从零开始随时间呈指数规律逼近稳态值。
            </p>
          </div>
          <div className="space-y-4">
            <Slider label="电阻 R" value={R} min={2} max={30} step={1} unit="Ω" onChange={(v)=>{setR(v);reset();}}/>
            <Slider label="电感 L" value={L} min={0.2} max={6} step={0.1} unit="H" onChange={(v)=>{setL(v);reset();}}/>
            <Slider label="电动势 E" value={E} min={2} max={24} step={1} unit="V" onChange={(v)=>{setE(v);reset();}}/>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Stat label="时间常数 τ" value={fmt(tau,3)} unit="s" color={COLORS.purple} note="τ = L/R"/>
          <Stat label="瞬时电流 i" value={fmt(i,3)} unit="A" color={COLORS.blue}/>
          <Stat label="电感电压 uL" value={fmt(uL,3)} unit="V" color={COLORS.red}/>
          <Stat label="电阻电压 uR" value={fmt(uR,3)} unit="V" color={COLORS.green}/>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 pl-1 text-sm font-semibold tracking-wide text-slate-400">实时电流示波器</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-inner">
              <svg viewBox="0 0 520 210" className="w-full h-auto">
                <Axis x={45} y={15} w={455} h={175} xMax={5} yLabel="i/I∞" xLabel="t/τ" points={activeCurve} color={COLORS.blue}/>
                <line x1="45" x2="500" y1="102.5" y2="102.5" stroke="#334155" strokeWidth="1.5" strokeDasharray="5 5"/>
                <text x="490" y="96" textAnchor="end" fontSize="12" fill={COLORS.muted}>稳态渐近线</text>
              </svg>
            </div>
          </div>
          <div>
            <div className="mb-3 pl-1 text-sm font-semibold tracking-wide text-slate-400">实时能量流转向</div>
            <div className="h-[calc(100%-1.75rem)] rounded-xl border border-slate-800 bg-slate-800/30 p-6 text-base leading-8 text-slate-300">
              <div><span className="math text-slate-100 mr-2">W<sub>L</sub> = ½Li²</span> (电感磁场储能)</div>
              <div><span className="math text-slate-100 mr-2">P<sub>R</sub> = i²R</span> (电阻瞬时焦耳热功率)</div>
              <div className="mt-2 text-sm text-slate-500">外源输入总能量等于储能与耗散之和：</div>
              <div className="math text-blue-400 mb-4">Eit = W<sub>L</sub>(t) + Q<sub>R</sub>(t)</div>
              <div className="grid grid-cols-2 gap-4">
                <Stat label="当前磁场能 W_L" value={fmt(energyL,3)} unit="J" color={COLORS.purple}/>
                <Stat label="累积焦耳热 Q_R" value={fmt(Math.max(0,heat),3)} unit="J" color={COLORS.orange}/>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Equation>
        <span className="math">
          i(t)=I<sub>∞</sub>(1−e<sup>−t/τ</sup>), 
          I<sub>∞</sub>=E/R, τ=L/R
        </span>
      </Equation>
    </div>
  );
}

/* ----------------------------- 模块 2：短接放电 ------------------------------------- */

function DischargeModule() {
  const [R, setR] = useState(10);
  const [L, setL] = useState(2);
  const [I0, setI0] = useState(3);
  const [running, setRunning] = useState(false);

  const tau = L / R;
  const duration = 5 * tau;
  const [t, setT] = useAnimationClock(running, duration, 1);
  const i = I0 * Math.exp(-t/tau);
  const WL = .5 * L * i*i;
  const Q = .5 * L * (I0*I0 - i*i);
  const P = i*i*R;

  const activeCurve = useMemo(() => {
    if (t === 0) return [];
    const pts = [];
    const steps = 100;
    for (let j = 0; j <= steps; j++) {
      const currT = t * (j / steps);
      pts.push({ x: currT / tau, y: 2 * (Math.exp(-currT / tau) - 0.5) });
    }
    return pts;
  }, [t, tau]);

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="mb-8">
          <CircuitFrame>
            {/* 紧凑化布局：X=200 到 X=560，Y=100 到 Y=200 */}
            <Wire x1={200} y1={200} x2={200} y2={100} active={i>.02} color={COLORS.purple}/>
            <Wire x1={200} y1={100} x2={250} y2={100} active={i>.02} color={COLORS.purple}/>
            <Resistor x={250} y={100} width={72}/>
            <Wire x1={322} y1={100} x2={390} y2={100} active={i>.02} color={COLORS.purple}/>
            <Inductor x={390} y={100} width={112}/>
            <Wire x1={502} y1={100} x2={560} y2={100} active={i>.02} color={COLORS.purple}/>
            <Wire x1={560} y1={100} x2={560} y2={200} active={i>.02} color={COLORS.purple}/>
            {/* 贯通的底部短接实线 */}
            <Wire x1={560} y1={200} x2={200} y2={200} active={i>.02} color={COLORS.purple}/>
            
            {/* 物理级严密的幽灵电池和脱开标记 */}
            <g opacity="0.25">
              <line x1={380} y1={200} x2={380} y2={230} stroke={COLORS.ink} strokeWidth="3" strokeDasharray="4 4"/>
              <Battery x={380} y={235} scale={0.9} label="E" />
            </g>
            <text x="380" y="270" textAnchor="middle" fontSize="15" fontWeight="bold" fill={COLORS.red}>
              ❌ 主电源已被移除
            </text>

            {i>.03 && <Arrow x1={270} y1={70} x2={320} y2={70} label={`i = ${fmt(i,2)} A`} color={COLORS.purple}/>}
            <text x="380" y="55" textAnchor="middle" fontSize="14" fill={COLORS.muted}>
              闭合短路后，电感线圈中原有的磁场能释放，驱动回路继续维持电流
            </text>
          </CircuitFrame>
          <div className="mt-6 flex justify-center gap-4">
            <Button primary onClick={()=>{if(t>=duration)setT(0);setRunning(v=>!v);}}>
              {running?<><Pause size={19}/>暂停</>:<><Play size={19}/> {t>0?"继续":"开始放电"}</>}
            </Button>
            <Button onClick={()=>{setRunning(false);setT(0);}}><RotateCcw size={19}/>重置参数</Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
              <Magnet size={24} className="text-purple-500"/> RL 零输入响应
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-400">
              外部电源撤去并使回路短接后，根据基尔霍夫电压定律（KVL）得
              <span className="math mx-1 text-slate-200">L di/dt + Ri = 0</span>。
              电感由于自感现象，产生与原电流方向相同的感应电动势。电流不能突变，只能按时间常数呈指数级平滑衰减，最终磁场能悉数转化为电阻内能。
            </p>
          </div>
          <div className="space-y-4">
            <Slider label="放电电阻 R" value={R} min={2} max={30} step={1} unit="Ω" onChange={(v)=>{setR(v);setT(0);}}/>
            <Slider label="电感 L" value={L} min={0.2} max={6} step={0.1} unit="H" onChange={(v)=>{setL(v);setT(0);}}/>
            <Slider label="初始满载电流 I₀" value={I0} min={0.5} max={6} step={0.1} unit="A" onChange={(v)=>{setI0(v);setT(0);}}/>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Stat label="衰减常数 τ" value={fmt(tau,3)} unit="s" color={COLORS.purple}/>
          <Stat label="剩余磁场能 W_L" value={fmt(WL,3)} unit="J" color={COLORS.purple}/>
          <Stat label="已耗散热量 Q_R" value={fmt(Q,3)} unit="J" color={COLORS.orange}/>
          <Stat label="瞬时焦耳耗散功率" value={fmt(P,3)} unit="W" color={COLORS.red}/>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 pl-1 text-sm font-semibold tracking-wide text-slate-400">放电电流实时曲线</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-inner">
              <svg viewBox="0 0 520 210" className="w-full h-auto">
                <Axis x={45} y={15} w={455} h={175} xMax={5} yLabel="i/I₀" xLabel="t/τ" points={activeCurve} color={COLORS.purple}/>
              </svg>
            </div>
          </div>
          <div>
            <div className="mb-3 pl-1 text-sm font-semibold tracking-wide text-slate-400">严密的能量守恒</div>
            <div className="h-[calc(100%-1.75rem)] flex flex-col justify-center rounded-xl border border-slate-800 bg-slate-800/30 p-8">
              <div className="text-center math text-3xl font-bold text-slate-100 tracking-wide drop-shadow-md">
                ½LI<sub>0</sub><sup>2</sup> = W<sub>L</sub>(t) + Q<sub>R</sub>(t)
              </div>
              <p className="mt-6 text-base leading-7 text-slate-400 text-center">
                随着时间 <span className="math text-slate-200">t→∞</span>，
                电流 <span className="math text-slate-200">i→0</span>。此时
                电感残存场能 <span className="math text-slate-200">W<sub>L</sub>→0</span>，而累计热量
                <span className="math text-slate-200">Q<sub>R</sub></span> 恰好等于初始的系统总储能。
              </p>
            </div>
          </div>
        </div>
      </Panel>
      <Equation>
        <span className="math">
          i(t)=I<sub>0</sub>e<sup>−t/τ</sup>, τ=L/R, 
          W<sub>L</sub>=½Li<sup>2</sup>
        </span>
      </Equation>
    </div>
  );
}

/* ----------------------------- 模块 3：开断过电压 ------------------------------------- */

function BreakModule() {
  const [L, setL] = useState(2);
  const [I0, setI0] = useState(3);
  const [C, setC] = useState(50); // pF
  const [Rs, setRs] = useState(20); // Ω
  const [running, setRunning] = useState(false);

  const Cp = C * 1e-12;
  const omega0 = 1 / Math.sqrt(L * Cp);
  const f0 = omega0 / (2*Math.PI);
  const alpha = Rs / (2*L);
  const wd = Math.sqrt(Math.max(0, omega0*omega0 - alpha*alpha));
  const duration = Math.min(2e-5, 10 / Math.max(wd, 1));
  const [t, setT] = useAnimationClock(running, duration, 1);

  const tt = t;
  const i = wd > 0
    ? I0*Math.exp(-alpha*tt)*(Math.cos(wd*tt) - alpha/wd*Math.sin(wd*tt))
    : I0*Math.exp(-alpha*tt);
  const uC = -L * (
    wd > 0
      ? I0*Math.exp(-alpha*tt)*(
          -alpha*(Math.cos(wd*tt)-alpha/wd*Math.sin(wd*tt))
          -wd*Math.sin(wd*tt)-alpha*Math.cos(wd*tt)
        )
      : -alpha*I0*Math.exp(-alpha*tt)
  );
  const energy = .5*L*i*i + .5*Cp*uC*uC;

  const activeCurve = useMemo(() => {
    if (t === 0) return [];
    const pts = [];
    const steps = 150;
    for (let j = 0; j <= steps; j++) {
      const currT = t * (j / steps);
      const val = wd > 0
        ? I0 * Math.exp(-alpha * currT) * (Math.cos(wd * currT) - alpha / wd * Math.sin(wd * currT))
        : I0 * Math.exp(-alpha * currT);
      pts.push({ x: currT * 1e6, y: val / Math.max(I0, 1) });
    }
    return pts;
  }, [t, wd, alpha, I0]);

  const reset = () => { setRunning(false); setT(0); };

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="mb-8">
          <CircuitFrame>
            {/* 紧凑化绝对居中布局：X=180 到 580，Y=90 到 210 */}
            <Wire x1={180} y1={210} x2={180} y2={90}/>
            <Wire x1={180} y1={90} x2={220} y2={90}/>
            
            {/* 断口触点 Terminal */}
            <circle cx="220" cy="90" r="4.5" fill={COLORS.ink} />
            <circle cx="280" cy="90" r="4.5" fill={COLORS.ink} />
            
            {/* 闭合时的开关实线 */}
            {t === 0 && <line x1="220" y1="90" x2="280" y2="90" stroke={COLORS.ink} strokeWidth="4" />}

            {/* 真正的动态等离子电弧特效 */}
            {t > 0 && <ArcEffect x1={220} x2={280} y={90} intensity={Math.abs(i) / I0} time={t} />}
            
            <text x="250" y="60" textAnchor="middle" fontSize="15" fill={COLORS.red} fontWeight="bold" 
              style={{ opacity: clamp(Math.abs(i)/I0 + 0.2, 0.2, 1) }}>拉弧击穿区</text>
            
            {/* 标准寄生电容绘制与完美的文本避让 */}
            <Wire x1={220} y1={90} x2={220} y2={130} color={COLORS.cyan}/>
            <Wire x1={220} y1={130} x2={244} y2={130} color={COLORS.cyan}/>
            <Wire x1={280} y1={90} x2={280} y2={130} color={COLORS.cyan}/>
            <Wire x1={280} y1={130} x2={256} y2={130} color={COLORS.cyan}/>
            <Capacitor x={250} y={130} label="寄生电容 Cs" />
            
            <Wire x1={280} y1={90} x2={390} y2={90}/>
            <Inductor x={390} y={90} width={112} label="L"/>
            <Wire x1={502} y1={90} x2={580} y2={90}/>
            <Wire x1={580} y1={90} x2={580} y2={210}/>
            <Wire x1={580} y1={210} x2={402} y2={210}/>
            <Battery x={380} y={210} scale={1.15} label="E"/>
            <Wire x1={358} y1={210} x2={180} y2={210}/>
            
            {/* 中央留白区的超高压警报 */}
            {Math.abs(uC)>1 && (
              <text x="420" y="160" textAnchor="middle" fontSize="22" fontWeight="900" fill={COLORS.red} 
                style={{ filter: "drop-shadow(0 0 10px rgba(239,68,68,0.9))" }}>
                |u| ≈ {fmtSI(Math.abs(uC),"V")}
              </text>
            )}
            
            <text x="380" y="265" textAnchor="middle" fontSize="14" fill={COLORS.muted}>
              现实中不存在绝对断路，微观寄生 C 提供了放电通道，引起了恐怖的高频高压振荡
            </text>
          </CircuitFrame>
          <div className="mt-6 flex justify-center gap-4">
            <Button danger onClick={()=>{if(t>=duration)setT(0);setRunning(v=>!v);}}>
              {running?<><Pause size={19}/>暂停抓拍</>:<><Power size={19}/> {t>0?"继续播放":"瞬间暴力切断"}</>}
            </Button>
            <Button onClick={reset}><RotateCcw size={19}/>重置</Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
              <ZapOff size={24} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"/> 开断过电压与高频振荡
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-400">
              理想纯电感方程表明 <span className="math text-slate-200">u = L|di/dt|</span>，即断电耗时越短，反冲电压越高。
              但在真实物理世界中，开关触点间存在<strong className="text-cyan-400 px-1">寄生电容</strong>。因此，能量并没有瞬间消失，而是在寄生 <span className="math text-slate-200">LC</span> 间爆发了极高频阻尼振荡，从而在断口处产生万伏级的破坏性击穿电压。
            </p>
          </div>
          <div className="space-y-4">
            <Slider label="大型电感 L" value={L} min={0.5} max={10} step={0.5} unit="H" onChange={(v)=>{setL(v);setT(0);}}/>
            <Slider label="切断前工作电流 I₀" value={I0} min={0.5} max={10} step={0.5} unit="A" onChange={(v)=>{setI0(v);setT(0);}}/>
            <Slider label="微观寄生电容 Cₛ" value={C} min={10} max={200} step={10} unit="pF" onChange={(v)=>{setC(v);setT(0);}}/>
            <Slider label="寄生损耗 Rₛ" value={Rs} min={1} max={100} step={1} unit="Ω" onChange={(v)=>{setRs(v);setT(0);}}/>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Stat label="LC 固有振荡频率 f₀" value={fmtSI(f0,"Hz").replace(" Hz","")} unit="Hz" color={COLORS.cyan} note="数十万次/秒"/>
          <Stat label="系统阻尼衰减系数 α" value={fmt(alpha,0)} unit="s⁻¹" color={COLORS.orange}/>
          <Stat label="断口处瞬时峰值高压" value={fmtSI(Math.abs(uC),"V").replace(" V","")} unit="V" color={COLORS.red} note="极易击穿空气拉弧"/>
          <Stat label="剩余系统总能量" value={fmt(energy,4)} unit="J" color={COLORS.purple}/>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 pl-1 text-sm font-semibold tracking-wide text-slate-400">微秒级 (μs) 高频暂态电流示波器</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-inner">
              <svg viewBox="0 0 520 210" className="w-full h-auto">
                <Axis x={45} y={15} w={455} h={175} xMax={duration*1e6} yLabel="i/I₀" xLabel="t/μs" points={activeCurve} color={COLORS.red} zero/>
              </svg>
            </div>
          </div>
          <div>
            <div className="mb-3 pl-1 text-sm font-semibold tracking-wide text-slate-400">大学教材模型与工程真相</div>
            <div className="h-[calc(100%-1.75rem)] rounded-xl border border-red-900/40 bg-red-950/20 p-6 text-base text-red-200">
              <ul className="list-disc space-y-3 pl-5 leading-7">
                <li>由于 <span className="math">W = ½LI²</span> 能量巨大且无处释放，它会强制向寄生电容灌注电荷。</li>
                <li>极小的电容瞬间被充至千伏甚至数万伏高压。此时断口极易发生<strong className="text-white">电弧放电(Arcing)</strong>，造成触点烧结甚至火灾。</li>
                <li><strong>工程应对策略</strong>：工业中绝不会直接硬切断大电感，必须并联 RC 吸收支路、反向续流二极管或压敏电阻（MOV），人为提供安全的能量泄放通道。</li>
              </ul>
            </div>
          </div>
        </div>
      </Panel>
      <Equation>
        <span className="math">
          ω<sub>0</sub>=1/√(LC<sub>s</sub>), 
          α=R<sub>s</sub>/(2L), 
          ω<sub>d</sub>=√(ω<sub>0</sub><sup>2</sup>−α<sup>2</sup>)
        </span>
      </Equation>
    </div>
  );
}

/* ----------------------------- 模块 4：白炽灯实验 ------------------------------------- */

function BulbModule() {
  const [E, setE] = useState(12);
  const [R1, setR1] = useState(1);
  const [R2, setR2] = useState(20);
  const [L, setL] = useState(3);
  const [opened, setOpened] = useState(false);
  const [running, setRunning] = useState(false);

  const I1 = E / R1;
  const I2steady = E / R2;
  const tau = L / (R1 + R2);
  const duration = 5 * tau;
  const [t, setT] = useAnimationClock(running, duration, 1);

  const i1 = opened ? I1 * Math.exp(-t/tau) : I1;
  const i2 = opened ? -I1 * Math.exp(-t/tau) : I2steady;
  const Psteady = I2steady**2 * R2;
  const Pflash = i2**2 * R2;
  const brightness = clamp(Pflash / Math.max(Psteady,1e-9), 0, 8);

  const activeCurve = useMemo(() => {
    if (!opened) return [];
    if (t === 0) return [];
    const pts = [];
    const steps = 100;
    for (let j = 0; j <= steps; j++) {
      const currT = t * (j / steps);
      const i2_val = -I1 * Math.exp(-currT / tau);
      pts.push({ x: currT / tau, y: 2 * (Math.abs(i2_val) / Math.max(I1, 1) - 0.5) });
    }
    return pts;
  }, [t, tau, opened, I1]);

  const trigger = () => {
    if(!opened){
      setOpened(true);
      setT(0);
      setRunning(true);
    } else {
      setOpened(false);
      setRunning(false);
      setT(0);
    }
  };

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="mb-8">
          <CircuitFrame>
            {/* 紧凑化布局：Y轴压缩为 70 -> 140 -> 210，X轴 220 到 540 */}
            <Wire x1={220} y1={70} x2={344} y2={70} active={Math.abs(i2)>0.01} color={i2<0?COLORS.red:COLORS.yellow} reverse={i2<0}/>
            <Wire x1={416} y1={70} x2={540} y2={70} active={Math.abs(i2)>0.01} color={i2<0?COLORS.red:COLORS.yellow} reverse={i2<0}/>
            <Wire x1={220} y1={140} x2={270} y2={140} active={Math.abs(i1)>0.01}/>
            <Wire x1={342} y1={140} x2={400} y2={140} active={Math.abs(i1)>0.01}/>
            <Wire x1={512} y1={140} x2={540} y2={140} active={Math.abs(i1)>0.01}/>
            <Wire x1={220} y1={210} x2={220} y2={140} active={Math.abs(i1)>0.01}/>
            <Wire x1={220} y1={140} x2={220} y2={70} active={Math.abs(i1)>0.01}/>
            <Wire x1={540} y1={70} x2={540} y2={140} active={Math.abs(i1)>0.01}/>
            <Wire x1={540} y1={140} x2={540} y2={210} active={Math.abs(i1)>0.01}/>
            
            {!opened && <>
              <Wire x1={320} y1={210} x2={220} y2={210} active={true} color={COLORS.green}/>
              <Wire x1={430} y1={210} x2={350} y2={210} active={true} color={COLORS.green}/>
              <Wire x1={540} y1={210} x2={478} y2={210} active={true} color={COLORS.green}/>
            </>}
            {opened && <>
              <line x1={320} y1={210} x2={220} y2={210} stroke={COLORS.wire} strokeWidth="4"/>
              <line x1={430} y1={210} x2={350} y2={210} stroke={COLORS.wire} strokeWidth="4"/>
              <line x1={540} y1={210} x2={478} y2={210} stroke={COLORS.wire} strokeWidth="4"/>
            </>}
            
            {/* 白炽灯渲染特效 */}
            <circle cx="380" cy="70" r="35"
              fill={`rgba(250,204,21,${opened?clamp(.1+brightness*.15,0.1,1):.15})`}
              stroke={brightness>2?"#fef08a":COLORS.ink} strokeWidth="3"
              style={{ filter: brightness > 2 ? `drop-shadow(0 0 ${clamp(brightness*6, 10, 40)}px #eab308)` : 'none', transition: 'all 0.1s' }}
            />
            <path d="M360 91 Q380 35 400 91" fill="none" stroke={brightness>2?"#fff":COLORS.ink} strokeWidth="3.5" style={{ transition: 'all 0.1s' }}/>
            <text x="380" y="125" textAnchor="middle" fontSize="15" fontWeight="900" fill={COLORS.ink}>灯泡 R₂</text>
            
            <Resistor x={270} y={140} width={72} label="R₁"/>
            <Inductor x={400} y={140} width={112} label="L"/>
            <Battery x={320} y={210} scale={1.1} label="E"/>
            <Switch x={430} y={210} closed={!opened}/>
            
            <Arrow x1={235} y1={115} x2={295} y2={115} label={`i₁ = ${fmt(Math.abs(i1),2)} A`} color={COLORS.blue}/>
            <Arrow x1={320} y1={40} x2={260} y2={40}
              label={`i₂ = ${fmt(Math.abs(i2),2)} A`} color={i2<0?COLORS.red:COLORS.yellow} reverse={i2>=0}/>
            
            {opened && <text x="380" y="265" textAnchor="middle" fontSize="15" fontWeight="bold" fill={COLORS.red}>
              切断主源！电感迫使灯泡支路电流剧烈反向激增
            </text>}
          </CircuitFrame>
          <div className="mt-6 flex justify-center gap-4">
            <Button danger={!opened} primary={opened} onClick={trigger}>
              {opened ? <><RotateCcw size={19}/>接通电源 (恢复稳态)</> : <><Power size={19}/>断开总闸 (触发闪耀)</>}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
              <Lightbulb size={24} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"/> 经典“闪亮”突变实验
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-400">
              这是一个极具视觉冲击力的演示实验。理解它的钥匙在于<strong className="text-white px-1">电感电流连续条件</strong>与拓扑结构。
              断开主干路的一瞬间，原先在线圈中流淌的巨大电流无处可去，只能被强行压入灯泡支路，并在那里形成一个全新的放电回路。由于正方向定义问题，其代数表现为 <span className="math mx-1 text-slate-200">i₂(0⁺) = −I₁</span>。
            </p>
          </div>
          <div className="space-y-4">
            <Slider label="主直流电源 E" value={E} min={4} max={24} step={1} unit="V" onChange={(v)=>{setE(v);setT(0);}}/>
            <Slider label="线圈内阻(低阻) R₁" value={R1} min={0.2} max={5} step={0.1} unit="Ω" onChange={(v)=>{setR1(v);setT(0);}}/>
            <Slider label="大型空心电感 L" value={L} min={0.5} max={8} step={0.5} unit="H" onChange={(v)=>{setL(v);setT(0);}}/>
            <Slider label="灯泡冷态电阻 R₂" value={R2} min={5} max={40} step={1} unit="Ω" onChange={(v)=>{setR2(v);setT(0);}}/>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Stat label="断开前线圈电流 I₁" value={fmt(I1,2)} unit="A" color={COLORS.blue}/>
          <Stat label="原稳态灯泡微光功率" value={fmt(Psteady,2)} unit="W" color={COLORS.yellow}/>
          <Stat label="断口突变电流极值 |i₂|" value={fmt(Math.abs(i2),2)} unit="A" color={COLORS.red}/>
          <Stat label="功率暴击倍数 (亮度)" value={fmt(Pflash/Math.max(Psteady,1e-9),1)} unit="倍" color={COLORS.orange}/>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 pl-1 text-sm font-semibold tracking-wide text-slate-400">灯泡反向电流幅值脉冲</div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-inner relative">
              {!opened && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 backdrop-blur-[2px] rounded-xl font-bold text-slate-400 tracking-wider">
                  等待切断电源触发脉冲...
                </div>
              )}
              <svg viewBox="0 0 520 210" className="w-full h-auto">
                <Axis x={45} y={15} w={455} h={175} xMax={5} yLabel="|i₂|/I₁" xLabel="t/τ" points={activeCurve} color={COLORS.red}/>
              </svg>
            </div>
          </div>
          <div>
            <div className="mb-3 pl-1 text-sm font-semibold tracking-wide text-slate-400">极值原理剖析</div>
            <div className="h-[calc(100%-1.75rem)] rounded-xl border border-yellow-900/30 bg-yellow-900/10 p-6 text-base leading-8 text-yellow-100/80">
              <div className="font-bold text-yellow-400 mb-3 text-lg">“灯闪亮”的硬性触发条件是什么？</div>
              <ul className="list-disc space-y-2 pl-5">
                <li>由于线圈内阻极小 (<span className="math text-yellow-200">R₁</span> 很低)，稳态时它吸纳了极其巨大的电流 <span className="math text-yellow-200">I₁ = E/R₁</span>。</li>
                <li>相比之下，高阻灯泡 (<span className="math text-yellow-200">R₂</span>) 正常分到的电流极少，处于暗淡发光状态。</li>
                <li>断开总闸瞬间，线圈将它携带的巨大电流 <span className="math text-yellow-200">I₁</span> 强行压过高阻 <span className="math text-yellow-200">R₂</span>。</li>
                <li>由此爆发的瞬时极值功率 <span className="math text-yellow-200">P = I₁² R₂</span> 将远超原先的 <span className="math text-yellow-200">E²/R₂</span>。这就是刺眼“闪亮”的物理本源！</li>
              </ul>
            </div>
          </div>
        </div>
      </Panel>

      <Equation>
        <span className="math">
          i₂(0⁺)=−I₁, |i₂(t)|=I₁e<sup>−t/τ</sup>, 
          τ=L/(R₁+R₂)
        </span>
      </Equation>
    </div>
  );
}

/* ----------------------------- 主页面 ------------------------------------- */

const TABS = [
  {id:"charge",title:"接通暂态",sub:"零状态响应",icon:Zap},
  {id:"discharge",title:"短接放电",sub:"零输入响应",icon:Magnet},
  {id:"break",title:"开断过电压",sub:"寄生 LC 瞬态",icon:ZapOff},
  {id:"bulb",title:"白炽灯实验",sub:"电流连续与闪耀",icon:Lightbulb},
];

export default function RLTransientLab() {
  const [tab,setTab]=useState("charge");

  const content = {
    charge:<ChargeModule/>,
    discharge:<DischargeModule/>,
    break:<BreakModule/>,
    bulb:<BulbModule/>,
  }[tab];

  return (
    <main className="rl-lab min-h-screen bg-[#020617] text-slate-200 pb-12">
      <style>{styles}</style>

      {/* 极简高级深色页头 */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-5 py-10 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-black tracking-[0.25em] text-blue-500 uppercase">
            <Activity size={16}/> University Physics · Dynamic Simulator
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white lg:text-5xl drop-shadow-sm">
            R-L 电路暂态控制室
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-400">
            深度耦合基尔霍夫定律与感生涡流边界条件。全景式解构电感充能、磁场坍缩耗散、拉弧高频击穿以及经典灯泡突变实验。参数、电路和微分推演全链路物理级映射。
          </p>
        </div>
      </header>

      {/* 悬浮级深色导航 */}
      <nav className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-xl shadow-2xl">
        <div className="mx-auto max-w-[1400px] overflow-x-auto px-5 lg:px-8">
          <div className="flex min-w-max gap-3 py-4">
            {TABS.map(({id,title,sub,icon:Icon})=>{
              const active = id===tab;
              return (
                <button key={id} onClick={()=>setTab(id)}
                  className={`flex items-center gap-4 rounded-xl border px-5 py-3 text-left transition-all duration-300
                  ${active?"border-blue-500/50 bg-blue-900/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]":"border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/60"}`}>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-inner transition-colors duration-300 ${active?"bg-blue-950/80 text-blue-400":"bg-slate-800/80"}`}>
                    <Icon size={20}/>
                  </span>
                  <span>
                    <span className={`block text-sm font-bold tracking-wide ${active?"text-slate-100":"text-slate-300"}`}>{title}</span>
                    <span className="block text-xs font-medium opacity-60 mt-0.5">{sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 核心工作区 */}
      <div className="mx-auto max-w-[1400px] px-5 py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-900/50 bg-blue-950/30 px-3.5 py-1.5 text-blue-400">
            <BookOpen size={14}/> 理论教科书深度对接
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-900/50 bg-purple-950/30 px-3.5 py-1.5 text-purple-400">
            <Gauge size={14}/> 实时微分方程解算引擎
          </span>
          <span className="ml-2 uppercase tracking-wider text-slate-500">
            System Module // {TABS.find(x=>x.id===tab)?.id.toUpperCase()}
          </span>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {content}
        </div>
      </div>
    </main>
  );
}