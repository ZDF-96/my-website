"use client";

import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. 原生 Plotly 挂载器 (适配深色主题)
// ==========================================
const NativePlotly = ({ data, layout, config, className }) => {
  const plotDivRef = useRef(null);

  useEffect(() => {
    let Plotly;
    import('plotly.js-dist-min').then((module) => {
      Plotly = module.default || module;
      if (plotDivRef.current) {
        Plotly.newPlot(plotDivRef.current, data, layout, { responsive: true, ...config });
      }
    });
    return () => { if (Plotly && plotDivRef.current) Plotly.purge(plotDivRef.current); };
  }, [data, layout, config]);

  return <div ref={plotDivRef} className={className} />;
};

// ==========================================
// 板块一：保守力做功与路径无关（微元几何动画）
// ==========================================
const PathIntegralDemo = () => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const reqRef = useRef(null);

  const O = { x: 300, y: 300 };
  
  const getPathPoint = (t) => {
    const r = 180 - 70 * t + 30 * Math.sin(t * Math.PI * 3);
    const theta = Math.PI * 1.2 - (Math.PI * 0.7) * t;
    return { x: O.x + r * Math.cos(theta), y: O.y - r * Math.sin(theta), r: r, theta: theta };
  };

  const getVectors = (t) => {
    const dt = 0.01;
    const p1 = getPathPoint(t);
    const p2 = getPathPoint(Math.min(t + dt, 1));
    
    const dl = { x: (p2.x - p1.x)*15, y: (p2.y - p1.y)*15 };
    const er = { x: Math.cos(p1.theta), y: -Math.sin(p1.theta) };
    const F = { x: er.x * 120, y: er.y * 120 }; 
    const dotProduct = dl.x * er.x + dl.y * er.y;
    const dr = { x: er.x * dotProduct, y: er.y * dotProduct };

    return { p: p1, dl, F, dr };
  };

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setProgress((prev) => {
          if (prev >= 1) { setIsPlaying(false); return 1; }
          return prev + 0.003;
        });
        reqRef.current = requestAnimationFrame(animate);
      };
      reqRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [isPlaying]);

  const { p, dl, F, dr } = getVectors(Math.min(progress, 0.99));

  let pathD = `M ${getPathPoint(0).x} ${getPathPoint(0).y}`;
  for(let i=0.02; i<=1; i+=0.02) pathD += ` L ${getPathPoint(i).x} ${getPathPoint(i).y}`;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in text-slate-300">
      <div className="flex justify-center gap-4">
        <button onClick={() => { setProgress(0); setIsPlaying(true); }} className="bg-blue-600/80 text-blue-50 font-bold px-8 py-2.5 rounded-full shadow-lg border border-blue-500/50 hover:bg-blue-500 transition-all">
          {progress >= 1 ? '重新推导' : '▶ 播放做功推导动画'}
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)} className="bg-slate-800 text-slate-300 font-bold px-8 py-2.5 rounded-full shadow-lg border border-slate-700 hover:bg-slate-700 transition-all">
          {isPlaying ? '⏸ 暂停动画' : '▶ 继续动画'}
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
        <div className="flex-1 bg-slate-900 rounded-2xl shadow-inner border border-slate-800 overflow-hidden flex items-center justify-center min-h-[450px] relative">
          <svg width="100%" height="100%" viewBox="0 0 600 450" className="max-w-full max-h-full">
            {[100, 140, 180, 220].map((r, i) => (
              <circle key={i} cx={O.x} cy={O.y} r={r} fill="none" stroke="#334155" strokeDasharray="8 8" strokeWidth="2" opacity="0.8" />
            ))}
            <circle cx={O.x} cy={O.y} r={12} fill="#ef4444" className="drop-shadow-glow" />
            <text x={O.x - 24} y={O.y + 30} fontSize="16" fontWeight="bold" fill="#fca5a5">O (+Q)</text>

            <path d={pathD} fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
            <text x={getPathPoint(0).x - 25} y={getPathPoint(0).y - 10} fontSize="20" fontWeight="bold" fill="#94a3b8">P</text>
            <text x={getPathPoint(1).x + 15} y={getPathPoint(1).y + 25} fontSize="20" fontWeight="bold" fill="#94a3b8">Q</text>

            <g>
              <line x1={O.x} y1={O.y} x2={p.x} y2={p.y} stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 6" opacity="0.6" />
              <line x1={p.x} y1={p.y} x2={p.x + dl.x} y2={p.y + dl.y} stroke="#38bdf8" strokeWidth="3" markerEnd="url(#arrowBlue)" />
              <text x={p.x + dl.x + 10} y={p.y + dl.y} fill="#38bdf8" fontSize="18" fontWeight="bold">dℓ</text>

              <line x1={p.x} y1={p.y} x2={p.x + F.x} y2={p.y + F.y} stroke="#fb7185" strokeWidth="3" markerEnd="url(#arrowRed)" />
              <text x={p.x + F.x + 10} y={p.y + F.y + 15} fill="#fb7185" fontSize="18" fontWeight="bold">F(r)</text>

              <line x1={p.x + dl.x} y1={p.y + dl.y} x2={p.x + dr.x} y2={p.y + dr.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" opacity="0.5"/>
              <line x1={p.x} y1={p.y} x2={p.x + dr.x} y2={p.y + dr.y} stroke="#34d399" strokeWidth="4" />
              <text x={p.x + dr.x/2 - 40} y={p.y + dr.y/2 + 25} fill="#34d399" fontSize="16" fontWeight="bold">dr = dℓ·cosθ</text>
              
              <circle cx={p.x} cy={p.y} r={6} fill="#38bdf8" />
            </g>

            <defs>
              <marker id="arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
              <marker id="arrowRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#fb7185" />
              </marker>
            </defs>
          </svg>
        </div>

        <div className="w-full lg:w-80 bg-slate-800/80 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col justify-center">
          <h4 className="font-bold text-xl text-blue-400 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span> 微元做功几何投影
          </h4>
          <div className="font-serif text-lg tracking-wider text-slate-300 space-y-4 bg-slate-900/80 p-5 rounded-xl border border-slate-700">
            <p className="flex items-center gap-2">dW = <span className="text-rose-400 font-bold ml-1">F</span> · <span className="text-sky-400 font-bold">dℓ</span></p>
            <p className="ml-4 text-slate-400">= F(r) · dℓ · cos(θ)</p>
            <p className="ml-4 flex items-center gap-2 border-b border-slate-700 pb-3">= F(r) · <span className="text-emerald-400 font-bold">dr</span></p>
            <p className="text-blue-300 font-bold text-xl pt-2"><span className="text-slate-400 text-base font-normal">总功:</span> <br/>W = ∫ F(r) dr</p>
          </div>
          <p className="text-sm text-slate-400 mt-6 leading-relaxed bg-blue-900/20 p-4 rounded-xl border border-blue-900/50">
            <strong className="text-blue-400">物理启示：</strong><br/>
            无论试探电荷沿何种弯曲路径移动，真正对电场力做功产生贡献的，永远只有它在径向上的有效投影。
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 板块二：2D 等势面与电势地形 (深色系适配)
// ==========================================
const Equipotential2D = () => {
  const [q1, setQ1] = useState(1);
  const [q2, setQ2] = useState(-1);
  const size = 60;
  const xRange = Array.from({length: size}, (_, i) => -5 + (i * 10) / (size-1));
  const yRange = Array.from({length: size}, (_, i) => -5 + (i * 10) / (size-1));
  const zData = [];

  for (let j = 0; j < yRange.length; j++) {
    const row = [];
    for (let i = 0; i < xRange.length; i++) {
      const r1 = Math.sqrt((xRange[i] + 2)**2 + yRange[j]**2) + 0.15;
      const r2 = Math.sqrt((xRange[i] - 2)**2 + yRange[j]**2) + 0.15;
      row.push(Math.max(-4, Math.min(4, (q1 / r1) + (q2 / r2)))); 
    }
    zData.push(row);
  }

  // 深色主题 Plotly 配置
  const darkLayout = {
    title: { text: '2D 空间电势分布与等势面', font: { size: 20, color: '#e2e8f0' } },
    xaxis: { title: 'X 轴 (m)', color: '#94a3b8', gridcolor: '#334155', zerolinecolor: '#475569' },
    yaxis: { title: 'Y 轴 (m)', scaleanchor: 'x', color: '#94a3b8', gridcolor: '#334155', zerolinecolor: '#475569' },
    margin: { l: 60, r: 20, t: 60, b: 60 },
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full animate-fade-in text-slate-300">
      <div className="flex flex-col sm:flex-row gap-8 w-full max-w-3xl bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <label className="flex flex-col flex-1 gap-3">
          <span className="font-bold text-slate-300">左侧场源电荷 (Q₁)</span>
          <div className="flex items-center gap-4">
            <input type="range" min="-5" max="5" step="0.5" value={q1} onChange={e=>setQ1(Number(e.target.value))} className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <input type="number" step="0.5" value={q1} onChange={e=>setQ1(Number(e.target.value))} className="w-20 px-2 py-1 text-center font-bold text-blue-300 bg-slate-900 border border-slate-600 rounded outline-none focus:border-blue-500" />
          </div>
        </label>
        <div className="hidden sm:block w-px bg-slate-700"></div>
        <label className="flex flex-col flex-1 gap-3">
          <span className="font-bold text-slate-300">右侧场源电荷 (Q₂)</span>
          <div className="flex items-center gap-4">
            <input type="range" min="-5" max="5" step="0.5" value={q2} onChange={e=>setQ2(Number(e.target.value))} className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-rose-500" />
            <input type="number" step="0.5" value={q2} onChange={e=>setQ2(Number(e.target.value))} className="w-20 px-2 py-1 text-center font-bold text-rose-300 bg-slate-900 border border-slate-600 rounded outline-none focus:border-rose-500" />
          </div>
        </label>
      </div>

      <div className="w-full h-[500px] border border-slate-700 rounded-2xl shadow-xl overflow-hidden bg-slate-900">
        <NativePlotly
          className="w-full h-full"
          data={[{ z: zData, x: xRange, y: yRange, type: 'contour', colorscale: 'RdBu', reversescale: true, hovertemplate: 'X: %{x:.2f} m<br>Y: %{y:.2f} m<br>电势 U: %{z:.2f} V<extra></extra>', contours: { start: -3.5, end: 3.5, size: 0.4, showlines: true, coloring: 'heatmap' }, colorbar: { title: '电势 U (V)', titleside: 'right', tickfont: {color: '#94a3b8'}, titlefont: {color: '#94a3b8'} } }]}
          layout={darkLayout}
          config={{ displayModeBar: false }}
        />
      </div>
    </div>
  );
};

// ==========================================
// 板块三：2D 解析坐标系梯度与库仑力全自由度双重验证
// ==========================================
const AnalyticGradientVerification = () => {
  // 试探电荷
  const [testX, setTestX] = useState(0);
  const [testY, setTestY] = useState(2.0);
  
  // 场源电荷1 (自由位置、电量)
  const [x1, setX1] = useState(-3.0);
  const [q1, setQ1] = useState(1);
  
  // 场源电荷2 (自由位置、电量)
  const [x2, setX2] = useState(3.0);
  const [q2, setQ2] = useState(-1);

  const k = 20;  

  const r1_sq = Math.pow(testX - x1, 2) + Math.pow(testY, 2);
  const r2_sq = Math.pow(testX - x2, 2) + Math.pow(testY, 2);
  const r1 = Math.max(Math.sqrt(r1_sq), 0.15); 
  const r2 = Math.max(Math.sqrt(r2_sq), 0.15);

  const E1x = k * q1 * (testX - x1) / Math.pow(r1, 3);
  const E1y = k * q1 * testY / Math.pow(r1, 3);
  const E2x = k * q2 * (testX - x2) / Math.pow(r2, 3);
  const E2y = k * q2 * testY / Math.pow(r2, 3);

  const Ex = E1x + E2x;
  const Ey = E1y + E2y;

  const dUdx = -k*q1*(testX-x1)/Math.pow(r1, 3) - k*q2*(testX-x2)/Math.pow(r2, 3);
  const dUdy = -k*q1*testY/Math.pow(r1, 3) - k*q2*testY/Math.pow(r2, 3);
  
  const negGradX = -dUdx;
  const negGradY = -dUdy;

  // 坐标映射
  const mapX = (x) => 400 + x * 50;
  const mapY = (y) => 250 - y * 50; 
  
  const E_mag = Math.sqrt(Ex*Ex + Ey*Ey);
  let vScale = 35; 
  if (E_mag * vScale > 100) vScale = 100 / E_mag; 

  const dE1x = E1x * vScale, dE1y = -E1y * vScale;
  const dE2x = E2x * vScale, dE2y = -E2y * vScale;
  const dEx = Ex * vScale, dEy = -Ey * vScale;

  const tX = mapX(testX);
  const tY = mapY(testY);

  const gridLinesX = Array.from({length: 15}, (_, i) => i - 7); 
  const gridLinesY = Array.from({length: 9}, (_, i) => i - 4);  

  return (
    <div className="flex flex-col items-center gap-6 w-full animate-fade-in text-slate-300">
      
      <div className="w-full bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
        <h3 className="text-xl font-bold text-sky-400 mb-6 border-b border-slate-700 pb-3 flex items-center gap-3">
          <span className="text-2xl">⚙️</span> 全自由度解析：库仑定律 vs 电势梯度
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-sm">
          
          {/* 左侧控制台 */}
          <div className="flex flex-col justify-between space-y-6 bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-inner">
            
            {/* 场源电荷 1 */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <p className="text-rose-400 font-bold mb-3">🔴 场源电荷 1 控制</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3"><span className="w-10">电量:</span><input type="range" min="-3" max="3" step="0.5" value={q1} onChange={e=>setQ1(Number(e.target.value))} className="flex-1 accent-rose-500" /><span className="w-10 text-right">{q1.toFixed(1)}</span></label>
                <label className="flex items-center gap-3"><span className="w-10">X座:</span><input type="range" min="-6" max="0" step="0.5" value={x1} onChange={e=>setX1(Number(e.target.value))} className="flex-1 accent-rose-500" /><span className="w-10 text-right">{x1.toFixed(1)}</span></label>
              </div>
            </div>

            {/* 场源电荷 2 */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <p className="text-blue-400 font-bold mb-3">🔵 场源电荷 2 控制</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3"><span className="w-10">电量:</span><input type="range" min="-3" max="3" step="0.5" value={q2} onChange={e=>setQ2(Number(e.target.value))} className="flex-1 accent-blue-500" /><span className="w-10 text-right">{q2.toFixed(1)}</span></label>
                <label className="flex items-center gap-3"><span className="w-10">X座:</span><input type="range" min="0" max="6" step="0.5" value={x2} onChange={e=>setX2(Number(e.target.value))} className="flex-1 accent-blue-500" /><span className="w-10 text-right">{x2.toFixed(1)}</span></label>
              </div>
            </div>

            {/* 试探电荷 P */}
            <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-700/30">
              <p className="text-amber-400 font-bold mb-3">🟡 试探电荷 P(x,y) 移动</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3"><span className="w-10">X座:</span><input type="range" min="-7" max="7" step="0.1" value={testX} onChange={e=>setTestX(Number(e.target.value))} className="flex-1 accent-amber-500" /><span className="w-10 text-right">{testX.toFixed(1)}</span></label>
                <label className="flex items-center gap-3"><span className="w-10">Y座:</span><input type="range" min="-4" max="4" step="0.1" value={testY} onChange={e=>setTestY(Number(e.target.value))} className="flex-1 accent-amber-500" /><span className="w-10 text-right">{testY.toFixed(1)}</span></label>
              </div>
            </div>
          </div>

          {/* 右侧实时推导验证区 */}
          <div className="space-y-5 bg-slate-900 p-6 rounded-xl border border-slate-700 overflow-y-auto custom-scrollbar">
            <div>
              <p className="text-slate-400 font-bold text-base mb-2 border-b border-slate-700 pb-1">1. 距离空间坐标系映射</p>
              <p className="text-slate-500">r₁ = √[ (x - x₁)² + y² ]</p>
              <p className="text-slate-500">r₂ = √[ (x - x₂)² + y² ]</p>
            </div>
            
            <div>
              <p className="text-slate-400 font-bold text-base mb-2 border-b border-slate-700 pb-1">2. 标量电势代数叠加</p>
              <p className="text-purple-400 font-bold bg-purple-900/20 p-2 rounded">U = kq₁/r₁ + kq₂/r₂</p>
            </div>

            <div>
              <p className="text-slate-400 font-bold text-base mb-2 border-b border-slate-700 pb-1">3. 数值验证引擎对比</p>
              
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 border-l-4 border-l-emerald-500">
                  <p className="text-emerald-400 font-bold text-xs mb-2">方法A: (-∇U) 梯度计算</p>
                  <p className="text-slate-300">-∂U/∂x = {negGradX.toFixed(4)}</p>
                  <p className="text-slate-300">-∂U/∂y = {negGradY.toFixed(4)}</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 border-l-4 border-l-sky-500">
                  <p className="text-sky-400 font-bold text-xs mb-2">方法B: 库仑电场 E 叠加</p>
                  <p className="text-slate-300">Ex = {Ex.toFixed(4)}</p>
                  <p className="text-slate-300">Ey = {Ey.toFixed(4)}</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900/30 p-3 rounded-lg border border-emerald-800 text-center">
              <span className="text-emerald-400 font-bold">🎯 E = -∇U (严格一致)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部：SVG 深色高精度视界 */}
      <div className="w-full flex justify-center bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-4 right-4 bg-slate-800/90 p-4 rounded-xl border border-slate-600 shadow-lg text-xs font-sans z-10">
          <p className="font-bold text-slate-300 border-b border-slate-600 pb-2 mb-3">场强分量与梯度验证</p>
          <p className="flex items-center gap-3 mt-2 text-slate-400"><span className="w-6 h-1 bg-[#fca5a5] rounded"></span> Q₁ 分电场</p>
          <p className="flex items-center gap-3 mt-2 text-slate-400"><span className="w-6 h-1 bg-[#93c5fd] rounded"></span> Q₂ 分电场</p>
          <p className="flex items-center gap-3 mt-3 text-emerald-400"><span className="w-6 h-1 border-b-2 border-dashed border-[#34d399]"></span> 负梯度 (-∇U)</p>
          <p className="flex items-center gap-3 mt-2 text-sky-300"><span className="w-6 h-1 bg-[#e2e8f0] rounded"></span> 总场强 (E)</p>
        </div>

        <svg width="100%" height="auto" viewBox="0 0 800 500" className="w-full max-w-[800px] h-auto block">
          
          {/* 深色网格系统 */}
          {gridLinesX.map(x => (
            <line key={`gx-${x}`} x1={mapX(x)} y1="0" x2={mapX(x)} y2="500" stroke="#1e293b" strokeWidth="1" />
          ))}
          {gridLinesY.map(y => (
            <line key={`gy-${y}`} x1="0" y1={mapY(y)} x2="800" y2={mapY(y)} stroke="#1e293b" strokeWidth="1" />
          ))}

          <line x1="0" y1="250" x2="800" y2="250" stroke="#475569" strokeWidth="1.5" />
          <line x1="400" y1="0" x2="400" y2="500" stroke="#475569" strokeWidth="1.5" />
          
          {gridLinesX.map(x => (
            x !== 0 && <g key={`xtick-${x}`}>
              <line x1={mapX(x)} y1="246" x2={mapX(x)} y2="254" stroke="#64748b" strokeWidth="1.5" />
              <text x={mapX(x)} y="270" fontSize="11" fill="#64748b" textAnchor="middle">{x}</text>
            </g>
          ))}
          {gridLinesY.map(y => (
            y !== 0 && <g key={`ytick-${y}`}>
              <line x1="396" y1={mapY(y)} x2="404" y2={mapY(y)} stroke="#64748b" strokeWidth="1.5" />
              <text x="388" y={mapY(y)+4} fontSize="11" fill="#64748b" textAnchor="end">{y}</text>
            </g>
          ))}

          <defs>
            <radialGradient id="glowRed">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="glowBlue">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
            </radialGradient>
            
            <marker id="arrowE1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#fca5a5" /></marker>
            <marker id="arrowE2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#93c5fd" /></marker>
            <marker id="arrowE" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#f8fafc" /></marker>
          </defs>

          {/* 源电荷1 (动态颜色) */}
          {q1 !== 0 && (
            <g>
              <circle cx={mapX(x1)} cy={mapY(0)} r="30" fill={q1>0?"url(#glowRed)":"url(#glowBlue)"} />
              <circle cx={mapX(x1)} cy={mapY(0)} r="6" fill={q1>0?"#ef4444":"#3b82f6"} />
              <text x={mapX(x1)} y={mapY(0)-16} fontSize="14" fontWeight="bold" fill={q1>0?"#fca5a5":"#93c5fd"} textAnchor="middle">Q₁</text>
            </g>
          )}

          {/* 源电荷2 (动态颜色) */}
          {q2 !== 0 && (
            <g>
              <circle cx={mapX(x2)} cy={mapY(0)} r="30" fill={q2>0?"url(#glowRed)":"url(#glowBlue)"} />
              <circle cx={mapX(x2)} cy={mapY(0)} r="6" fill={q2>0?"#ef4444":"#3b82f6"} />
              <text x={mapX(x2)} y={mapY(0)-16} fontSize="14" fontWeight="bold" fill={q2>0?"#fca5a5":"#93c5fd"} textAnchor="middle">Q₂</text>
            </g>
          )}

          <line x1={tX + dE1x} y1={tY + dE1y} x2={tX + dEx} y2={tY + dEy} stroke="#475569" strokeDasharray="4 4" strokeWidth="1.5" />
          <line x1={tX + dE2x} y1={tY + dE2y} x2={tX + dEx} y2={tY + dEy} stroke="#475569" strokeDasharray="4 4" strokeWidth="1.5" />

          {/* 分矢量 */}
          {q1 !== 0 && <line x1={tX} y1={tY} x2={tX + dE1x} y2={tY + dE1y} stroke="#fca5a5" strokeWidth="2" markerEnd="url(#arrowE1)" />}
          {q2 !== 0 && <line x1={tX} y1={tY} x2={tX + dE2x} y2={tY + dE2y} stroke="#93c5fd" strokeWidth="2" markerEnd="url(#arrowE2)" />}

          {/* 总矢量重合演示：绿虚线底色，白实线压顶 */}
          <line x1={tX} y1={tY} x2={tX + dEx} y2={tY + dEy} stroke="#34d399" strokeWidth="4" strokeDasharray="6 4" strokeLinecap="round" />
          <line x1={tX} y1={tY} x2={tX + dEx} y2={tY + dEy} stroke="#f8fafc" strokeWidth="1.5" markerEnd="url(#arrowE)" />

          <circle cx={tX} cy={tY} r="6" fill="#f59e0b" stroke="#fff" strokeWidth="2" className="drop-shadow-lg" />
          <text x={tX-10} y={tY-15} fontSize="14" fontWeight="bold" fill="#fcd34d" textAnchor="end">P(x,y)</text>

        </svg>
      </div>

    </div>
  );
};

// ==========================================
// 主容器 (护眼学术暗色主题架构)
// ==========================================
export default function BaoShouLiSimulation() {
  const [activeTab, setActiveTab] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const tabs = [
    { title: '📍 核心原理：路径积分', component: <PathIntegralDemo /> },
    { title: '📊 标量映射：2D 等势线', component: <Equipotential2D /> },
    { title: '📐 矢量解析：自由源验证', component: <AnalyticGradientVerification /> }
  ];

  if (!isMounted) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-[#0f172a] rounded-3xl border border-slate-800 mt-10 min-h-[700px] flex flex-col items-center justify-center gap-6 shadow-2xl">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-blue-400 font-medium tracking-widest animate-pulse text-lg">加载物理渲染引擎...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#0b1121] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden font-sans my-10">
      
      <div className="bg-gradient-to-b from-[#0f172a] to-[#0b1121] text-slate-100 p-10 text-center border-b border-slate-800">
        <h2 className="text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">
          保守力、势能与梯度 (互动数字实验室)
        </h2>
        <p className="text-slate-400 mt-4 text-lg">
          科研级学术深色主题 · 严密推演标量场偏导与矢量场解析
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 bg-[#0f172a] p-5 border-b border-slate-800">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-8 py-3.5 font-bold rounded-xl transition-all duration-300 text-sm tracking-wider ${
              activeTab === idx 
                ? 'bg-blue-600/20 text-blue-400 shadow-lg border border-blue-500/50 transform scale-105' 
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-10 min-h-[700px] flex justify-center bg-[#0b1121]">
        {tabs[activeTab].component}
      </div>

    </div>
  );
}