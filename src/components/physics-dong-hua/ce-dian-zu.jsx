 'use client';
import React, { useState, useMemo } from 'react';

/* ============================================================================
   组件：精致滑块（🛡️ 终极防重叠版：引入 flex-wrap，遇挤压自动换行）
============================================================================ */
const Slider = ({ label, value, onChange, min, max, step = 1, unit = '' }) => (
  <div className="bg-slate-800/40 border border-slate-700/50 p-4 sm:p-5 rounded-2xl hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all duration-300 flex flex-col justify-center">
    {/* 🚀 flex-wrap 是核心：空间不够时，右侧数值会自动掉到下一行，绝对不会重叠 */}
    <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
      <span className="text-slate-300 font-medium text-sm shrink-0">
        {label}
      </span>
      <div className="bg-cyan-950/60 px-3 py-1 rounded-md border border-cyan-500/30 shrink-0 inline-flex items-baseline gap-1 shadow-inner">
        <span className="text-cyan-400 font-mono font-bold text-sm">{value.toFixed(1)}</span>
        <span className="text-cyan-500/60 text-[10px]">{unit}</span>
      </div>
    </div>
    
    {/* 滑动条本体 */}
    <div className="relative flex items-center w-full">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
      />
    </div>
  </div>
);

/* ============================================================================
   SVG: 内接法 - 原始完整电路
============================================================================ */
const InnerOriginalSVG = ({ E, r, ra }) => (
  <svg viewBox="0 0 300 200" className="w-full h-auto max-w-[340px]">
    <rect x="30" y="115" width="240" height="70" rx="10" fill="rgba(244,63,94,0.04)" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 4" />
    <text x="40" y="132" fill="#f87171" fontSize="11" fontWeight="bold">等效黑盒 (真实电源 + 电流表)</text>
    <path d="M 60 40 L 60 160 M 240 40 L 240 100 M 240 146 L 240 160" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="60" cy="40" r="3" fill="#64748b" />
    <circle cx="240" cy="40" r="3" fill="#64748b" />
    <circle cx="60" cy="100" r="3" fill="#e2e8f0" />
    <circle cx="240" cy="100" r="3" fill="#e2e8f0" />
    <circle cx="60" cy="160" r="3" fill="#64748b" />
    <circle cx="240" cy="160" r="3" fill="#64748b" />
    <text x="45" y="93" fill="#f1f5f9" fontSize="14" fontWeight="bold" fontFamily="monospace">a</text>
    <text x="245" y="93" fill="#f1f5f9" fontSize="14" fontWeight="bold" fontFamily="monospace">b</text>
    <line x1="60" y1="40" x2="134" y2="40" stroke="#64748b" strokeWidth="2" />
    <line x1="166" y1="40" x2="240" y2="40" stroke="#64748b" strokeWidth="2" />
    <circle cx="150" cy="40" r="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
    <text x="143" y="45" fill="#38bdf8" fontSize="14" fontWeight="bold">V</text>
    <line x1="60" y1="100" x2="120" y2="100" stroke="#64748b" strokeWidth="2" />
    <rect x="120" y="90" width="60" height="20" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" rx="3" />
    <text x="147" y="127" fill="#94a3b8" fontSize="14" fontWeight="bold">R</text>
    <path d="M 140 75 L 140 90 M 140 75 L 180 75 L 180 100 L 240 100" stroke="#64748b" strokeWidth="2" fill="none" strokeLinejoin="round" />
    <polygon points="136,83 144,83 140,90" fill="#64748b" />
    <line x1="60" y1="160" x2="105" y2="160" stroke="#64748b" strokeWidth="2" />
    <line x1="105" y1="145" x2="105" y2="175" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
    <line x1="115" y1="152" x2="115" y2="168" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
    <line x1="115" y1="160" x2="160" y2="160" stroke="#64748b" strokeWidth="2" />
    <text x="100" y="190" fill="#4ade80" fontSize="12" fontFamily="monospace" fontWeight="bold">E={E}V, r={r}Ω</text>
    <path d="M 160 160 L 165 160 L 175 150 M 175 160 L 240 160" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="165" cy="160" r="2" fill="#e2e8f0" />
    <circle cx="175" cy="160" r="2" fill="#e2e8f0" />
    <text x="175" y="192" fill="#e2e8f0" fontSize="12" fontWeight="bold">S</text>
    <circle cx="240" cy="130" r="16" fill="#0f172a" stroke="#f43f5e" strokeWidth="2.5" />
    <text x="233" y="135" fill="#f43f5e" fontSize="14" fontWeight="bold">A</text>
    {/* Hydration fix */}
    <text x="260" y="138" fill="#f43f5e" fontSize="11" fontFamily="monospace">
      R<tspan baselineShift="sub" fontSize="9">A</tspan>={ra}Ω
    </text>
  </svg>
);

/* ============================================================================
   SVG: 内接法 - 等效完整电路
============================================================================ */
const InnerEquivalentSVG = ({ E_eq, r_eq }) => (
  <svg viewBox="0 0 300 200" className="w-full h-auto max-w-[340px]">
    <rect x="30" y="130" width="240" height="55" rx="10" fill="rgba(16,185,129,0.04)" stroke="#10b981" strokeWidth="2" strokeDasharray="5 4" />
    <text x="40" y="145" fill="#34d399" fontSize="11" fontWeight="bold">理想等效电源（内阻已合并）</text>
    <path d="M 60 40 L 60 160 M 240 40 L 240 160" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="60" cy="40" r="3" fill="#64748b" />
    <circle cx="240" cy="40" r="3" fill="#64748b" />
    <circle cx="60" cy="100" r="3" fill="#e2e8f0" />
    <circle cx="240" cy="100" r="3" fill="#e2e8f0" />
    <circle cx="60" cy="160" r="3" fill="#64748b" />
    <circle cx="240" cy="160" r="3" fill="#64748b" />
    <text x="45" y="93" fill="#f1f5f9" fontSize="14" fontWeight="bold" fontFamily="monospace">a</text>
    <text x="245" y="93" fill="#f1f5f9" fontSize="14" fontWeight="bold" fontFamily="monospace">b</text>
    <line x1="60" y1="40" x2="134" y2="40" stroke="#64748b" strokeWidth="2" />
    <line x1="166" y1="40" x2="240" y2="40" stroke="#64748b" strokeWidth="2" />
    <circle cx="150" cy="40" r="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
    <text x="143" y="45" fill="#38bdf8" fontSize="14" fontWeight="bold">V</text>
    <line x1="60" y1="100" x2="120" y2="100" stroke="#64748b" strokeWidth="2" />
    <rect x="120" y="90" width="60" height="20" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" rx="3" />
    <text x="147" y="127" fill="#94a3b8" fontSize="14" fontWeight="bold">R</text>
    <path d="M 140 75 L 140 90 M 140 75 L 180 75 L 180 100 L 240 100" stroke="#64748b" strokeWidth="2" fill="none" strokeLinejoin="round" />
    <polygon points="136,83 144,83 140,90" fill="#64748b" />
    <line x1="60" y1="160" x2="90" y2="160" stroke="#64748b" strokeWidth="2" />
    <line x1="90" y1="145" x2="90" y2="175" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
    <line x1="100" y1="152" x2="100" y2="168" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
    <line x1="100" y1="160" x2="140" y2="160" stroke="#64748b" strokeWidth="2" />
    <rect x="140" y="152" width="30" height="16" fill="#0f172a" stroke="#10b981" strokeWidth="2" rx="3" />
    <line x1="170" y1="160" x2="240" y2="160" stroke="#64748b" strokeWidth="2" />
    <text x="108" y="190" fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="bold">E'={E_eq}V, r'={r_eq}Ω</text>
  </svg>
);

/* ============================================================================
   SVG: 外接法 - 原始完整电路
============================================================================ */
const OuterOriginalSVG = ({ E, r, rv }) => (
  <svg viewBox="0 0 300 200" className="w-full h-auto max-w-[340px]">
    <path d="M 20 20 H 280 V 195 H 20 Z M 45 75 H 255 V 125 H 45 Z" fill="rgba(14,165,233,0.04)" fillRule="evenodd" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="5 4" />
    <text x="30" y="35" fill="#38bdf8" fontSize="11" fontWeight="bold">等效黑盒 (真实电源 + 电压表)</text>
    <path d="M 60 40 L 60 160 M 240 40 L 240 160" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="60" cy="40" r="3" fill="#e2e8f0" />
    <circle cx="240" cy="40" r="3" fill="#e2e8f0" />
    <circle cx="60" cy="100" r="3" fill="#e2e8f0" />
    <circle cx="240" cy="100" r="3" fill="#e2e8f0" />
    <circle cx="60" cy="160" r="3" fill="#64748b" />
    <circle cx="240" cy="160" r="3" fill="#64748b" />
    <text x="45" y="93" fill="#f1f5f9" fontSize="14" fontWeight="bold" fontFamily="monospace">a</text>
    <text x="245" y="93" fill="#f1f5f9" fontSize="14" fontWeight="bold" fontFamily="monospace">b</text>
    <line x1="60" y1="40" x2="134" y2="40" stroke="#64748b" strokeWidth="2" />
    <line x1="166" y1="40" x2="240" y2="40" stroke="#64748b" strokeWidth="2" />
    <circle cx="150" cy="40" r="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
    <text x="143" y="45" fill="#38bdf8" fontSize="14" fontWeight="bold">V</text>
    
    {/* Hydration fix */}
    <text x="170" y="48" fill="#38bdf8" fontSize="11" fontFamily="monospace">
      R<tspan baselineShift="sub" fontSize="9">V</tspan>={rv}Ω
    </text>

    <line x1="60" y1="100" x2="80" y2="100" stroke="#64748b" strokeWidth="2" />
    <rect x="80" y="90" width="50" height="20" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" rx="3" />
    <text x="100" y="127" fill="#94a3b8" fontSize="14" fontWeight="bold">R</text>
    <path d="M 100 75 L 100 90 M 100 75 L 130 75 L 130 100 L 184 100" stroke="#64748b" strokeWidth="2" fill="none" strokeLinejoin="round" />
    <polygon points="96,83 104,83 100,90" fill="#64748b" />
    <circle cx="200" cy="100" r="16" fill="#0f172a" stroke="#f43f5e" strokeWidth="2.5" />
    <text x="193" y="105" fill="#f43f5e" fontSize="14" fontWeight="bold">A</text>
    <line x1="217" y1="100" x2="240" y2="100" stroke="#64748b" strokeWidth="2" />
    <line x1="60" y1="160" x2="105" y2="160" stroke="#64748b" strokeWidth="2" />
    <line x1="105" y1="145" x2="105" y2="175" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
    <line x1="115" y1="152" x2="115" y2="168" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
    <line x1="115" y1="160" x2="160" y2="160" stroke="#64748b" strokeWidth="2" />
    <text x="100" y="190" fill="#4ade80" fontSize="12" fontFamily="monospace" fontWeight="bold">E={E}V, r={r}Ω</text>
    <path d="M 160 160 L 165 160 L 175 150 M 175 160 L 240 160" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="165" cy="160" r="2" fill="#e2e8f0" />
    <circle cx="175" cy="160" r="2" fill="#e2e8f0" />
    <text x="175" y="192" fill="#e2e8f0" fontSize="12" fontWeight="bold">S</text>
  </svg>
);

/* ============================================================================
   SVG: 外接法 - 等效完整电路
============================================================================ */
const OuterEquivalentSVG = ({ E_eq, r_eq }) => (
  <svg viewBox="0 0 300 200" className="w-full h-auto max-w-[340px]">
    <rect x="30" y="130" width="240" height="55" rx="10" fill="rgba(16,185,129,0.04)" stroke="#10b981" strokeWidth="2" strokeDasharray="5 4" />
    <text x="40" y="145" fill="#34d399" fontSize="11" fontWeight="bold">理想等效电源（电压表已吸收）</text>
    <path d="M 60 100 L 60 160 M 240 100 L 240 160" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="60" cy="100" r="3" fill="#e2e8f0" />
    <circle cx="240" cy="100" r="3" fill="#e2e8f0" />
    <circle cx="60" cy="160" r="3" fill="#64748b" />
    <circle cx="240" cy="160" r="3" fill="#64748b" />
    <text x="45" y="93" fill="#f1f5f9" fontSize="14" fontWeight="bold" fontFamily="monospace">a</text>
    <text x="245" y="93" fill="#f1f5f9" fontSize="14" fontWeight="bold" fontFamily="monospace">b</text>
    <line x1="60" y1="100" x2="80" y2="100" stroke="#64748b" strokeWidth="2" />
    <rect x="80" y="90" width="50" height="20" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" rx="3" />
    <text x="100" y="127" fill="#94a3b8" fontSize="14" fontWeight="bold">R</text>
    <path d="M 100 75 L 100 90 M 100 75 L 130 75 L 130 100 L 184 100" stroke="#64748b" strokeWidth="2" fill="none" strokeLinejoin="round" />
    <polygon points="96,83 104,83 100,90" fill="#64748b" />
    <circle cx="200" cy="100" r="16" fill="#0f172a" stroke="#f43f5e" strokeWidth="2.5" />
    <text x="193" y="105" fill="#f43f5e" fontSize="14" fontWeight="bold">A</text>
    <line x1="217" y1="100" x2="240" y2="100" stroke="#64748b" strokeWidth="2" />
    <line x1="60" y1="160" x2="90" y2="160" stroke="#64748b" strokeWidth="2" />
    <line x1="90" y1="145" x2="90" y2="175" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
    <line x1="100" y1="152" x2="100" y2="168" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
    <line x1="100" y1="160" x2="140" y2="160" stroke="#64748b" strokeWidth="2" />
    <rect x="140" y="152" width="30" height="16" fill="#0f172a" stroke="#10b981" strokeWidth="2" rx="3" />
    <line x1="170" y1="160" x2="240" y2="160" stroke="#64748b" strokeWidth="2" />
    <text x="108" y="190" fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="bold">E'={E_eq}V, r'={r_eq}Ω</text>
  </svg>
);

const TransformArrow = () => (
  <div className="flex flex-col items-center justify-center text-gray-500 py-4 lg:py-0 lg:px-6 shrink-0">
    <span className="text-[10px] lg:text-xs font-bold mb-2 lg:mb-1.5 text-cyan-400 whitespace-nowrap tracking-wide">戴维南等效</span>
    <svg className="w-8 h-8 rotate-90 lg:rotate-0 stroke-cyan-500 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
    </svg>
  </div>
);

/* ============================================================================
   板块 1: 戴维南等效分析
============================================================================ */
const TheveninView = ({ stats }) => (
  <div className="w-full flex flex-col gap-12 lg:gap-16">
    {/* 内接法 */}
    <div className="bg-slate-900/30 border border-slate-700/40 backdrop-blur-md rounded-3xl p-6 lg:p-10 shadow-2xl shadow-rose-500/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-5">
        <h3 className="text-xl lg:text-2xl font-black text-rose-400 flex items-center gap-3">
          <span className="bg-rose-500/15 px-4 py-1.5 rounded-xl text-sm border border-rose-500/30 backdrop-blur-sm">内接法</span>
          等效黑盒构造
        </h3>
        {/* flex-wrap 防止测得数据重叠挤压 */}
        <div className="flex flex-wrap gap-3 sm:gap-4 font-mono text-sm w-full md:w-auto">
          <div className="bg-slate-950/70 px-4 py-2 rounded-xl border border-white/5 flex items-center shrink-0">
            <span className="text-slate-400 mr-2 flex items-baseline">E<span className="text-[10px] ml-0.5">测</span></span>
            <span className="text-rose-400 font-bold text-lg">{stats.E_inner.toFixed(2)} V</span>
          </div>
          <div className="bg-slate-950/70 px-4 py-2 rounded-xl border border-white/5 flex items-center shrink-0">
            <span className="text-slate-400 mr-2 flex items-baseline">r<span className="text-[10px] ml-0.5">测</span></span>
            <span className="text-rose-400 font-bold text-lg">{stats.r_inner.toFixed(2)} Ω</span>
          </div>
        </div>
      </div>
      <div className="w-full bg-[#03050a] rounded-2xl p-6 lg:p-10 border border-white/5 flex flex-col lg:flex-row items-center justify-evenly gap-6">
        <InnerOriginalSVG E={stats.E.toFixed(1)} r={stats.r.toFixed(1)} ra={stats.ra.toFixed(1)} />
        <TransformArrow />
        <InnerEquivalentSVG E_eq={stats.E_inner.toFixed(2)} r_eq={stats.r_inner.toFixed(2)} />
      </div>
    </div>
    
    {/* 外接法 */}
    <div className="bg-slate-900/30 border border-slate-700/40 backdrop-blur-md rounded-3xl p-6 lg:p-10 shadow-2xl shadow-sky-500/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-5">
        <h3 className="text-xl lg:text-2xl font-black text-sky-400 flex items-center gap-3">
          <span className="bg-sky-500/15 px-4 py-1.5 rounded-xl text-sm border border-sky-500/30 backdrop-blur-sm">外接法</span>
          等效黑盒构造
        </h3>
        {/* flex-wrap 防止测得数据重叠挤压 */}
        <div className="flex flex-wrap gap-3 sm:gap-4 font-mono text-sm w-full md:w-auto">
          <div className="bg-slate-950/70 px-4 py-2 rounded-xl border border-white/5 flex items-center shrink-0">
            <span className="text-slate-400 mr-2 flex items-baseline">E<span className="text-[10px] ml-0.5">测</span></span>
            <span className="text-sky-400 font-bold text-lg">{stats.E_outer.toFixed(2)} V</span>
          </div>
          <div className="bg-slate-950/70 px-4 py-2 rounded-xl border border-white/5 flex items-center shrink-0">
            <span className="text-slate-400 mr-2 flex items-baseline">r<span className="text-[10px] ml-0.5">测</span></span>
            <span className="text-sky-400 font-bold text-lg">{stats.r_outer.toFixed(2)} Ω</span>
          </div>
        </div>
      </div>
      <div className="w-full bg-[#03050a] rounded-2xl p-6 lg:p-10 border border-white/5 flex flex-col lg:flex-row items-center justify-evenly gap-6">
        <OuterOriginalSVG E={stats.E.toFixed(1)} r={stats.r.toFixed(1)} rv={stats.rv.toFixed(0)} />
        <TransformArrow />
        <OuterEquivalentSVG E_eq={stats.E_outer.toFixed(2)} r_eq={stats.r_outer.toFixed(2)} />
      </div>
    </div>
  </div>
);

/* ============================================================================
   板块 2: 误差分析与 U-I 图像
============================================================================ */
const ErrorGraphView = ({ stats }) => {
  const width = 800;
  const height = 450;
  const padding = 60;
  
  const maxI = Math.max(
    stats.E / stats.r,
    stats.E_inner / stats.r_inner,
    stats.E_outer / stats.r_outer
  ) * 1.25;
  const maxU = stats.E * 1.25;
  
  const mapX = (I) => padding + (I / maxI) * (width - padding * 2);
  const mapY = (U) => height - padding - (U / maxU) * (height - padding * 2);

  const formatError = (val) => (val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1));

  return (
    <div className="w-full flex flex-col gap-10">
      <div className="relative bg-[#020617] border border-slate-700/40 rounded-3xl overflow-hidden shadow-2xl w-full">
        <div className="flex flex-wrap items-center gap-4 md:gap-6 px-6 py-4 bg-slate-900/70 backdrop-blur-md border-b border-slate-800 text-xs md:text-sm font-mono">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-5 h-0 border-t-2 border-emerald-400 border-dashed"></div>
            <span className="text-emerald-400 font-semibold">真实电源</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-5 h-1 bg-rose-500 rounded-full"></div>
            <span className="text-rose-400 font-semibold">内接法（E不变）</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-5 h-1 bg-sky-500 rounded-full"></div>
            <span className="text-sky-400 font-semibold">外接法（平移）</span>
          </div>
        </div>
        <div className="p-4 md:p-8">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
              </marker>
            </defs>
            
            <g stroke="rgba(148,163,184,0.08)" strokeWidth="1">
              {[...Array(6)].map((_, i) => (
                <line key={`hx-${i}`} x1={padding} y1={mapY((i / 5) * maxU)} x2={width - padding} y2={mapY((i / 5) * maxU)} />
              ))}
              {[...Array(8)].map((_, i) => (
                <line key={`vx-${i}`} x1={mapX((i / 7) * maxI)} y1={padding} x2={mapX((i / 7) * maxI)} y2={height - padding} />
              ))}
            </g>

            <line x1={padding} y1={padding - 10} x2={padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" markerStart="url(#arrow)" />
            <line x1={padding} y1={height - padding} x2={width - padding + 15} y2={height - padding} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrow)" />
            
            <text x={width - padding + 25} y={height - padding + 5} fontSize="14" fill="#94a3b8" fontFamily="monospace" fontWeight="bold">I (A)</text>
            <text x={padding} y={padding - 20} fontSize="14" fill="#94a3b8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">U (V)</text>
            
            <line
              x1={mapX(0)} y1={mapY(stats.E)}
              x2={mapX(stats.E / stats.r)} y2={mapY(0)}
              stroke="#4ade80" strokeWidth="3" strokeDasharray="6 5" filter="url(#glow)" strokeLinecap="round"
            />
            <line
              x1={mapX(0)} y1={mapY(stats.E_outer)}
              x2={mapX(stats.E_outer / stats.r_outer)} y2={mapY(0)}
              stroke="#0ea5e9" strokeWidth="3.5" filter="url(#glow)" strokeLinecap="round"
            />
            <line
              x1={mapX(0)} y1={mapY(stats.E_inner)}
              x2={mapX(stats.E_inner / stats.r_inner)} y2={mapY(0)}
              stroke="#f43f5e" strokeWidth="3.5" filter="url(#glow)" strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-2xl rounded-full"></div>
          <div className="text-rose-400 text-xs font-bold mb-5 uppercase tracking-[0.2em] relative z-10">内接法系统相对误差</div>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end border-b border-rose-500/10 pb-3">
              <span className="text-slate-300 text-base">电动势 E</span>
              <span className="text-rose-300 font-mono font-bold text-xl">0.0 %</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-slate-300 text-base">内阻 r</span>
              <span className="text-rose-500 font-mono font-black text-4xl tracking-tighter">
                {formatError(stats.err_r_inner)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-2xl rounded-full"></div>
          <div className="text-sky-400 text-xs font-bold mb-5 uppercase tracking-[0.2em] relative z-10">外接法系统相对误差</div>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end border-b border-sky-500/10 pb-3">
              <span className="text-slate-300 text-base">电动势 E</span>
              <span className="text-sky-400 font-mono font-bold text-xl">
                {formatError(stats.err_E_outer)} %
              </span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-slate-300 text-base">内阻 r</span>
              <span className="text-sky-400 font-mono font-black text-4xl tracking-tighter">
                {formatError(stats.err_r_outer)} %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   主入口组件
============================================================================ */
export default function EmfInternalResistanceLab() {
  const [activeTab, setActiveTab] = useState('thevenin');
  
  const [eTrue, setETrue] = useState(1.5);
  const [rTrue, setRTrue] = useState(1.0);
  const [rA, setRA] = useState(0.5);
  const [rV, setRV] = useState(50);
  
  const stats = useMemo(() => {
    const E = parseFloat(eTrue);
    const r = parseFloat(rTrue);
    const ra = parseFloat(rA);
    const rv = parseFloat(rV);
    
    const E_inner = E;
    const r_inner = r + ra;
    const E_outer = E * (rv / (rv + r));
    const r_outer = r * (rv / (rv + r));
    
    return {
      E, r, ra, rv,
      E_inner, r_inner,
      E_outer, r_outer,
      err_r_inner: ((r_inner - r) / r) * 100,
      err_E_outer: ((E_outer - E) / E) * 100,
      err_r_outer: ((r_outer - r) / r) * 100,
    };
  }, [eTrue, rTrue, rA, rV]);

  return (
    <div className="relative p-5 sm:p-8 md:p-12 bg-gradient-to-br from-[#020617] via-[#0a0f1c] to-[#020617] rounded-[2rem] md:rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.7)] border border-slate-800/60 text-gray-200 my-10 overflow-hidden max-w-[1400px] mx-auto font-sans w-full">
      {/* 环境光 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/3 bg-rose-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10 w-full mb-12">
        <h3 className="text-2xl md:text-3xl font-black text-white mb-6 flex items-center justify-center md:justify-start gap-3">
          <span className="text-cyan-400 text-4xl drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">⚡</span>
          全局参数中控台
        </h3>
        {/* 🚀 更保守的 Grid 断点：小屏1列，宽屏（1024px+）才允许2列，巨大屏（1536px+）才给4列 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4 md:gap-6">
          <Slider label="真实电动势 E真" value={eTrue} onChange={setETrue} min={1.0} max={3.0} step={0.1} unit="V" />
          <Slider label="真实内阻 r真" value={rTrue} onChange={setRTrue} min={0.1} max={5.0} step={0.1} unit="Ω" />
          <Slider label="电流表内阻 RA" value={rA} onChange={setRA} min={0.1} max={5.0} step={0.1} unit="Ω" />
          <Slider label="电压表内阻 RV" value={rV} onChange={setRV} min={10} max={3000} step={10} unit="Ω" />
        </div>
      </div>
      
      {/* 视图切换 */}
      <div className="flex justify-center mb-12 relative z-10 w-full">
        <div className="flex flex-col sm:flex-row p-1.5 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-full w-full sm:w-auto gap-2 shadow-2xl">
          <button
            onClick={() => setActiveTab('thevenin')}
            className={`px-6 py-3 rounded-xl sm:rounded-full text-sm font-bold transition-all duration-300 w-full sm:w-auto ${
              activeTab === 'thevenin'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.6)]'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            戴维南等效（电路转化）
          </button>
          <button
            onClick={() => setActiveTab('error')}
            className={`px-6 py-3 rounded-xl sm:rounded-full text-sm font-bold transition-all duration-300 w-full sm:w-auto ${
              activeTab === 'error'
                ? 'bg-purple-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            U‑I 图像与相对误差
          </button>
        </div>
      </div>
      
      {/* 内容区 */}
      <div className="relative z-10 w-full transition-opacity duration-300 ease-in-out">
        {activeTab === 'thevenin' ? <TheveninView stats={stats} /> : <ErrorGraphView stats={stats} />}
      </div>
    </div>
  );
}