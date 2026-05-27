'use client';

import React, { useState } from 'react';

export default function TheveninSimulator() {
  const [Vs, setVs] = useState(24);
  const [R1, setR1] = useState(4);
  const [R2, setR2] = useState(12);
  const [RL, setRL] = useState(8);
  const [step, setStep] = useState(1);

  // 计算物理量
  const Uoc = (Vs * R2) / (R1 + R2); // 开路电压
  const Rth = (R1 * R2) / (R1 + R2); // 等效内阻
  
  // 原始电路的负载电流
  const R_parallel = (R2 * RL) / (R2 + RL);
  const I_total = Vs / (R1 + R_parallel);
  const IL_original = I_total * (R2 / (R2 + RL));
  
  // 等效电路的负载电流
  const IL_thevenin = Uoc / (Rth + RL);

  // 颜色定义
  const colorOrig = "#22d3ee"; // 青色：原始网络
  const colorTh = "#facc15";   // 黄色：戴维南等效参数
  const colorLoad = "#a3e635"; // 绿色：负载

  // 渲染规范且美观的 SVG 电路图
  const renderCircuit = () => {
    return (
      <svg viewBox="0 0 650 280" className="w-full h-full drop-shadow-[0_0_12px_rgba(34,211,238,0.2)]">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill={colorLoad} />
          </marker>
        </defs>

        <g strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          
          {/* ================= 接线端子 A, B 及固定导线 ================= */}
          <line x1="300" y1="60" x2="395" y2="60" stroke={colorOrig} />
          <line x1="300" y1="200" x2="395" y2="200" stroke={colorOrig} />
          {/* 标准空心端子 */}
          <circle cx="400" cy="60" r="5" fill="#030712" stroke={colorOrig} />
          <text x="400" y="40" fill={colorOrig} fontSize="16" stroke="none" textAnchor="middle" fontWeight="bold">A</text>
          <circle cx="400" cy="200" r="5" fill="#030712" stroke={colorOrig} />
          <text x="400" y="225" fill={colorOrig} fontSize="16" stroke="none" textAnchor="middle" fontWeight="bold">B</text>

          {/* ================= 步骤 1, 2, 3: 原始网络 N1 ================= */}
          {step !== 4 && (
            <g stroke={colorOrig}>
              {/* 导线 */}
              <path d="M100,150 L100,200 L300,200" />
              <path d="M100,110 L100,60 L170,60" />
              <path d="M230,60 L300,60" />
              <path d="M300,60 L300,100" />
              <path d="M300,160 L300,200" />

              {/* R1 规范矩形 */}
              <rect x="170" y="45" width="60" height="30" fill="rgba(34,211,238,0.1)" />
              <text x="200" y="30" fill={colorOrig} fontSize="16" stroke="none" textAnchor="middle">R1</text>

              {/* R2 规范矩形 */}
              <rect x="285" y="100" width="30" height="60" fill="rgba(34,211,238,0.1)" />
              <text x="265" y="135" fill={colorOrig} fontSize="16" stroke="none" textAnchor="middle">R2</text>
            </g>
          )}

          {/* 电源 Vs (仅在步骤 1 和 2 显示) */}
          {step !== 3 && step !== 4 && (
            <g stroke={colorOrig}>
              <circle cx="100" cy="130" r="20" fill="rgba(34,211,238,0.1)" />
              <text x="100" y="124" fill={colorOrig} fontSize="14" stroke="none" textAnchor="middle" fontWeight="bold">+</text>
              <text x="100" y="146" fill={colorOrig} fontSize="14" stroke="none" textAnchor="middle" fontWeight="bold">-</text>
              <text x="65" y="135" fill={colorOrig} fontSize="16" stroke="none" textAnchor="middle">Vs</text>
            </g>
          )}

          {/* 步骤 3: 电源短路 */}
          {step === 3 && (
            <line x1="100" y1="110" x2="100" y2="150" strokeDasharray="5,5" stroke={colorTh} />
          )}

          {/* ================= 步骤 4: 戴维南等效网络 ================= */}
          {step === 4 && (
            <g stroke={colorTh}>
              {/* 导线 */}
              <path d="M100,150 L100,200 L300,200" />
              <path d="M100,110 L100,60 L170,60" />
              <path d="M230,60 L300,60" />

              {/* Vth 规范电源 */}
              <circle cx="100" cy="130" r="20" fill="rgba(250,204,21,0.1)" />
              <text x="100" y="124" fill={colorTh} fontSize="14" stroke="none" textAnchor="middle" fontWeight="bold">+</text>
              <text x="100" y="146" fill={colorTh} fontSize="14" stroke="none" textAnchor="middle" fontWeight="bold">-</text>
              <text x="60" y="135" fill={colorTh} fontSize="16" stroke="none" textAnchor="middle">Vth</text>

              {/* Rth 规范矩形 */}
              <rect x="170" y="45" width="60" height="30" fill="rgba(250,204,21,0.1)" />
              <text x="200" y="30" fill={colorTh} fontSize="16" stroke="none" textAnchor="middle">Rth</text>
            </g>
          )}

          {/* ================= 负载 / 测量仪器 ================= */}
          {/* 步骤 1, 4: 接入负载 RL */}
          {(step === 1 || step === 4) && (
            <g stroke={colorLoad}>
              {/* 负载连线 */}
              <path d="M405,60 L500,60 L500,100" />
              <path d="M405,200 L500,200 L500,160" />
              
              {/* RL 规范矩形 */}
              <rect x="485" y="100" width="30" height="60" fill="rgba(163,230,53,0.1)" />
              <text x="540" y="135" fill={colorLoad} fontSize="16" stroke="none" textAnchor="middle">RL</text>

              {/* 电流指示箭头 */}
              <line x1="420" y1="40" x2="470" y2="40" markerEnd="url(#arrow)" />
              <text x="445" y="30" fill={colorLoad} fontSize="14" stroke="none" textAnchor="middle">
                IL = {step === 1 ? IL_original.toFixed(2) : IL_thevenin.toFixed(2)}A
              </text>
            </g>
          )}

          {/* 步骤 2: 测开路电压 */}
          {step === 2 && (
            <g stroke={colorTh}>
              <path d="M405,60 L500,60 L500,110" strokeDasharray="4,4" />
              <path d="M405,200 L500,200 L500,150" strokeDasharray="4,4" />
              <circle cx="500" cy="130" r="20" fill="#030712" />
              <text x="500" y="136" fill={colorTh} fontSize="18" stroke="none" textAnchor="middle">V</text>
              <text x="545" y="135" fill={colorTh} fontSize="16" stroke="none" textAnchor="start">Uoc = {Uoc.toFixed(2)} V</text>
            </g>
          )}

          {/* 步骤 3: 测除源电阻 */}
          {step === 3 && (
            <g stroke={colorTh}>
              <path d="M405,60 L500,60 L500,110" strokeDasharray="4,4" />
              <path d="M405,200 L500,200 L500,150" strokeDasharray="4,4" />
              <circle cx="500" cy="130" r="20" fill="#030712" />
              <text x="500" y="136" fill={colorTh} fontSize="18" stroke="none" textAnchor="middle">Ω</text>
              <text x="545" y="135" fill={colorTh} fontSize="16" stroke="none" textAnchor="start">Rth = {Rth.toFixed(2)} Ω</text>
            </g>
          )}
        </g>
      </svg>
    );
  };

  return (
    <div className="mt-12 bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 md:p-10 text-white font-sans shadow-2xl">
      <h2 className="text-3xl font-bold text-cyan-300 mb-2">🔌 戴维南定理：步骤推演与仿真</h2>
      <p className="text-gray-400 mb-8 text-sm">调节参数并点击下方步骤，观察黑盒网络是如何被等效化简的。</p>

      {/* 参数调节区 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 bg-white/5 p-6 rounded-2xl border border-white/10">
        <Slider label="电源 Vs (V)" val={Vs} setter={setVs} min={10} max={40} color="accent-cyan-500" />
        <Slider label="内阻 R1 (Ω)" val={R1} setter={setR1} min={1} max={20} color="accent-cyan-500" />
        <Slider label="内阻 R2 (Ω)" val={R2} setter={setR2} min={1} max={20} color="accent-cyan-500" />
        <Slider label="负载 RL (Ω)" val={RL} setter={setRL} min={1} max={20} color="accent-green-500" />
      </div>

      {/* 步骤导航 */}
      <div className="flex flex-wrap gap-3 mb-6 justify-center">
        {[
          { id: 1, label: '1. 原始电路' },
          { id: 2, label: '2. 拔掉负载 (求 Uoc)' },
          { id: 3, label: '3. 电源置零 (求 Rth)' },
          { id: 4, label: '4. 戴维南等效' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setStep(btn.id)}
            className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
              step === btn.id
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* 电路可视化区域 */}
      <div className="bg-[#030712] rounded-2xl p-6 border border-cyan-900/50 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
        {/* 背景辅助网格 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none" />
        
        {renderCircuit()}
      </div>

      {/* 步骤物理解释 */}
      <div className="mt-6 bg-cyan-950/30 border-l-4 border-cyan-400 p-4 rounded-r-lg">
        {step === 1 && <p className="text-cyan-100"><strong className="text-cyan-300">步骤 1：</strong> 这是完整的初始电路。A、B 两端左侧是一个有源二端网络，右侧接上了负载 RL。当前流过负载的电流为 <strong>{IL_original.toFixed(3)} A</strong>。</p>}
        {step === 2 && <p className="text-yellow-100"><strong className="text-yellow-400">步骤 2：求开路电压 (Uoc)。</strong> 将负载 RL 拔掉，此时 A、B 两端断开。用理想电压表测量的电压即为 Uoc。由于右侧断路，电流只能在左侧 R1、R2 环路中流动，根据分压原理：Uoc = Vs × R2 / (R1 + R2) = <strong>{Uoc.toFixed(3)} V</strong>。</p>}
        {step === 3 && <p className="text-yellow-100"><strong className="text-yellow-400">步骤 3：求除源电阻 (Rth)。</strong> 保持负载断开，将内部所有电源“杀死”（恒压源短路变导线）。此时从 A、B 看进去，R1 和 R2 变成了并联关系。Rth = (R1 × R2) / (R1 + R2) = <strong>{Rth.toFixed(3)} Ω</strong>。</p>}
        {step === 4 && <p className="text-green-100"><strong className="text-green-400">步骤 4：戴维南等效。</strong> 将原本复杂的黑盒替换为 Uoc 和 Rth 的串联组合，重新接上负载 RL。重新计算电流 IL = Uoc / (Rth + RL) = <strong>{IL_thevenin.toFixed(3)} A</strong>。可以发现它与步骤 1 的结果完美吻合！</p>}
      </div>
    </div>
  );
}

// 辅助滑块组件
function Slider({ label, val, setter, min, max, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1 text-xs text-gray-300">
        <span>{label}</span>
        <span className="font-mono text-cyan-200">{val}</span>
      </div>
      <input
        type="range" min={min} max={max} step="0.1" value={val}
        onChange={(e) => setter(Number(e.target.value))}
        className={`w-full ${color}`}
      />
    </div>
  );
}