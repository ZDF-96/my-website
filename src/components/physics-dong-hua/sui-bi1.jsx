"use client";

import React, { useState } from 'react';

export default function SuiBi1Animation() {
  // 状态机：0 - 初始，1 - 漏气平衡，2 - 充气恢复
  const [step, setStep] = useState(0);

  // 物理参数映射
  const leftWidth = 80;
  const rightWidth = 120;
  const cylinderHeight = 220;
  const leftX = 100;
  const rightX = 260;
  const topY = 100;

  // 活塞位置计算
  const piston1Y = step === 0 ? topY : step === 1 ? topY + 60 : topY;
  const piston2Y = step === 0 ? topY + cylinderHeight / 2 - 5 : topY + cylinderHeight - 10;

  // 压强标签状态
  const pC = step === 0 ? "2 p₀" : step === 1 ? "被压缩" : "2.5 p₀";
  const pB = step === 0 ? "p₀" : "1.5 p₀ (混合)";
  const pA = step === 0 ? "2 p₀" : "";

  return (
    <div className="flex flex-col items-center my-8 p-6 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <h3 className="text-xl font-bold mb-6 text-slate-800 tracking-wide">汽缸热力学平衡仿真</h3>
      
      {/* 动画主视区 */}
      <svg width="500" height="380" viewBox="0 0 500 380" className="bg-slate-50/50 rounded-xl">
        <defs>
          <style>
            {`
              .physics-anim {
                /* 使用带有微小回弹的物理阻尼曲线 */
                transition: all 1.2s cubic-bezier(0.34, 1.26, 0.64, 1);
              }
              .gas-anim {
                transition: all 1.2s ease-in-out;
              }
              .flow-arrow {
                animation: flowIn 1s infinite linear;
              }
              @keyframes flowIn {
                0% { transform: translateY(10px); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateY(-10px); opacity: 0; }
              }
            `}
          </style>

          {/* 玻璃圆柱体高光渐变 */}
          <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="15%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#f1f5f9" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.5" />
          </linearGradient>

          {/* 金属活塞渐变 */}
          <linearGradient id="metal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* 顶部连通细管外壳 */}
        <path d={`M ${leftX + leftWidth/2 - 10} ${topY} L ${leftX + leftWidth/2 - 10} ${topY - 20} L ${rightX + rightWidth/2 + 10} ${topY - 20} L ${rightX + rightWidth/2 + 10} ${topY}`} fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* 细管内部气体 */}
        <path d={`M ${leftX + leftWidth/2 - 6} ${topY} L ${leftX + leftWidth/2 - 6} ${topY - 16} L ${rightX + rightWidth/2 + 6} ${topY - 16} L ${rightX + rightWidth/2 + 6} ${topY}`} fill={step > 0 ? "#c7d2fe" : "#bbf7d0"} className="gas-anim" opacity="0.7" />

        {/* --- 气体渲染 --- */}
        {/* 气体C */}
        <rect x={leftX + 2} y={piston1Y + 10} width={leftWidth - 4} height={topY + cylinderHeight - (piston1Y + 10)} fill="#fce7f3" className="gas-anim" opacity={step === 1 ? "0.9" : "0.7"} />
        <text x={leftX + leftWidth/2} y={topY + cylinderHeight - 40} textAnchor="middle" fill="#be185d" className="font-bold text-lg">C</text>
        <text x={leftX + leftWidth/2} y={topY + cylinderHeight - 20} textAnchor="middle" fill="#be185d" className="text-sm font-medium">{pC}</text>

        {/* 气体B / 混合气体M */}
        <rect x={rightX + 2} y={topY + 2} width={rightWidth - 4} height={piston2Y - topY - 2} fill={step > 0 ? "#c7d2fe" : "#bbf7d0"} opacity="0.7" className="gas-anim" />
        <text x={rightX + rightWidth/2} y={topY + 50} textAnchor="middle" fill={step > 0 ? "#4338ca" : "#15803d"} className="gas-anim font-bold text-lg">
          {step > 0 ? "混合气体 M" : "气体 B"}
        </text>
        <text x={rightX + rightWidth/2} y={topY + 75} textAnchor="middle" fill={step > 0 ? "#4338ca" : "#15803d"} className="text-sm font-medium">{pB}</text>

        {/* 气体A (漏气后消失) */}
        <rect x={rightX + 2} y={piston2Y + 10} width={rightWidth - 4} height={Math.max(0, topY + cylinderHeight - (piston2Y + 10))} fill="#c7d2fe" opacity={step === 0 ? 0.7 : 0} className="gas-anim" />
        {step === 0 && (
          <>
            <text x={rightX + rightWidth/2} y={topY + cylinderHeight - 40} textAnchor="middle" fill="#4338ca" className="font-bold text-lg gas-anim">A</text>
            <text x={rightX + rightWidth/2} y={topY + cylinderHeight - 20} textAnchor="middle" fill="#4338ca" className="text-sm font-medium gas-anim">{pA}</text>
          </>
        )}

        {/* --- 气缸与活塞渲染 --- */}
        {/* 气缸外壳 (带玻璃高光) */}
        <rect x={leftX} y={topY} width={leftWidth} height={cylinderHeight} fill="url(#glass-grad)" stroke="#475569" strokeWidth="3" rx="4" />
        <rect x={rightX} y={topY} width={rightWidth} height={cylinderHeight} fill="url(#glass-grad)" stroke="#475569" strokeWidth="3" rx="4" />

        {/* 活塞I (左侧) */}
        <g className="physics-anim" style={{ transform: `translateY(${piston1Y - topY}px)` }}>
          <rect x={leftX + 1} y={topY + 1} width={leftWidth - 2} height={12} fill="url(#metal-grad)" rx="2" stroke="#334155" strokeWidth="1" />
          <text x={leftX - 35} y={topY + 12} className="text-sm font-bold text-slate-700">活塞 I</text>
          <line x1={leftX - 8} y1={topY + 6} x2={leftX} y2={topY + 6} stroke="#94a3b8" strokeWidth="2" />
        </g>

        {/* 活塞II (右侧) */}
        <g className="physics-anim" style={{ transform: `translateY(${piston2Y - topY - cylinderHeight / 2 + 5}px)` }}>
          <rect x={rightX + 1} y={topY + cylinderHeight / 2 - 4} width={rightWidth - 2} height={12} fill="url(#metal-grad)" rx="2" stroke="#334155" strokeWidth="1" />
          {/* 漏气孔示意 */}
          <circle cx={rightX + rightWidth/2} cy={topY + cylinderHeight / 2 + 2} r="3" fill={step === 1 ? "#ef4444" : "#1e293b"} className="gas-anim" />
          <text x={rightX + rightWidth + 12} y={topY + cylinderHeight / 2 + 6} className="text-sm font-bold text-slate-700">活塞 II</text>
          <line x1={rightX + rightWidth} y1={topY + cylinderHeight / 2} x2={rightX + rightWidth + 8} y2={topY + cylinderHeight / 2} stroke="#94a3b8" strokeWidth="2" />
        </g>

        {/* 阀门K (带旋转动画和进气提示) */}
        <g className="physics-anim" style={{ transform: `translate(${leftX - 16}px, ${topY + cylinderHeight - 20}px)` }}>
          <rect x="-10" y="-8" width="10" height="16" fill={step === 2 ? "#10b981" : "#ef4444"} rx="2" className="physics-anim" />
          {/* 阀门把手 */}
          <line x1="-15" y1="0" x2="-5" y2="0" stroke="#fff" strokeWidth="2" style={{ transform: step === 2 ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'all 0.5s ease' }} />
          <text x="-40" y="4" className="text-xs font-bold text-slate-600">阀门K</text>
        </g>
        
        {/* 充气动画箭头 */}
        {step === 2 && (
          <g fill="#10b981" className="flow-arrow" transform={`translate(${leftX - 8}, ${topY + cylinderHeight - 20})`}>
            <polygon points="0,0 8,-5 8,5" />
          </g>
        )}
      </svg>

      {/* 控制面板 */}
      <div className="flex flex-wrap justify-center gap-4 mt-8 w-full max-w-lg">
        {[
          { id: 0, label: '1. 初始状态', desc: '活塞受力平衡' },
          { id: 1, label: '2. 活塞 II 漏气', desc: '气体 A、B 混合' },
          { id: 2, label: '3. 阀门 K 充气', desc: '活塞 I 恢复原位' }
        ].map((btn) => (
          <button 
            key={btn.id}
            onClick={() => setStep(btn.id)} 
            className={`group relative flex flex-col items-center px-6 py-3 rounded-xl shadow-sm transition-all duration-300 border-2
              ${step === btn.id 
                ? 'bg-blue-600 border-blue-600 text-white shadow-md transform -translate-y-0.5' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
              }`}
          >
            <span className="font-bold">{btn.label}</span>
            <span className={`text-xs mt-1 transition-colors ${step === btn.id ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-400'}`}>
              {btn.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}