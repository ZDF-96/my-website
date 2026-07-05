 "use client";

import React, { useState, useEffect, useRef } from 'react';

export default function CentripetalAccelerationSimulation() {
  const canvasRef = useRef(null);
  
  // theta: 控制时间间隔 \Delta t (即位置 B 的角度)
  const [theta, setTheta] = useState(0.8);
  // dv: 控制非匀速运动的速度变化大小 \Delta v (切向增量)
  const [dv, setDv] = useState(40); 
  
  // 物理常量设置
  const R = 120; // 轨迹半径
  const Va = 100; // 初速度大小 v (恒定为 100)
  const Vb = Va + dv; // 末速度大小 v'
  const omega = Va / R; // 初始角速度 (用于估算 dt)
  
  const cx = 180; // 圆心 x
  const cy = 250; // 圆心 y
  const vectorOriginX = 520; // 矢量平移图原点 A'
  const vectorOriginY = 250; 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 绘制背景网格 ---
    ctx.strokeStyle = '#1e293b'; 
    ctx.lineWidth = 1;
    for(let i = 0; i <= canvas.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for(let j = 0; j <= canvas.height; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    // 辅助绘图函数
    const drawArrow = (fromX, fromY, toX, toY, color, label = '', dashed = false, glow = true, offsetLabel = {x: 10, y: 10}) => {
      const headlen = 10;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      
      ctx.beginPath();
      ctx.setLineDash(dashed ? [4, 4] : []);
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      
      if (glow) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
      }
      ctx.stroke();
      
      // 箭头头部
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 7), toY - headlen * Math.sin(angle + Math.PI / 7));
      ctx.lineTo(toX, toY);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.shadowBlur = 0;

      if (label) {
        ctx.fillStyle = color;
        ctx.font = 'italic 16px "Times New Roman", serif';
        ctx.fillText(label, toX + offsetLabel.x, toY + offsetLabel.y);
      }
    };

    // --- 1. 左侧物理轨迹图 (非匀速圆周运动) ---
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 圆心 O
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.font = '16px sans-serif';
    ctx.fillText('O', cx - 20, cy + 20);

    // 点 A (初位置)
    const ax = cx;
    const ay = cy - R;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath(); ctx.arc(ax, ay, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('A (t)', ax - 40, ay - 10);
    drawArrow(cx, cy, ax, ay, 'rgba(148, 163, 184, 0.4)', '', true, false);

    // 点 B (末位置)
    const bx = cx + R * Math.cos(-Math.PI / 2 + theta);
    const by = cy + R * Math.sin(-Math.PI / 2 + theta);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(bx, by, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('B (t+Δt)', bx + 15, by - 10);
    drawArrow(cx, cy, bx, by, 'rgba(148, 163, 184, 0.4)', '', true, false);

    // 绘制真实速度矢量 v 和 v'
    drawArrow(ax, ay, ax + Va, ay, '#f43f5e', 'v');
    const vbAngle = -Math.PI / 2 + theta + Math.PI / 2; // 切线方向
    drawArrow(bx, by, bx + Vb * Math.cos(vbAngle), by + Vb * Math.sin(vbAngle), '#38bdf8', "v'");


    // --- 2. 右侧矢量平移分解图 (严格对应讲义的 A, C, D 标记) ---
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(vectorOriginX, vectorOriginY, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.font = 'italic 18px "Times New Roman", serif';
    ctx.fillText("A", vectorOriginX - 20, vectorOriginY + 20);

    // 点 D (初速度 v 的终点)
    const dx = vectorOriginX + Va;
    const dy = vectorOriginY;
    drawArrow(vectorOriginX, vectorOriginY, dx, dy, '#f43f5e', 'D (v)', false, true, {x: 5, y: -10});

    // 终点 E (末速度 v' 的终点)
    const ex = vectorOriginX + Vb * Math.cos(theta);
    const ey = vectorOriginY + Vb * Math.sin(theta);
    drawArrow(vectorOriginX, vectorOriginY, ex, ey, '#38bdf8', "v'", false, true, {x: 10, y: 15});

    // 点 C (在 v' 方向上截取等于 v 的长度)
    const cx_point = vectorOriginX + Va * Math.cos(theta);
    const cy_point = vectorOriginY + Va * Math.sin(theta);
    
    // 标记点 C
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath(); ctx.arc(cx_point, cy_point, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillText("C", cx_point - 10, cy_point - 10);

    // 绘制 \Delta_2 v (线段 DC，法向增量)
    drawArrow(dx, dy, cx_point, cy_point, '#10b981', 'Δ₂v', false, true, {x: -15, y: 25});

    // 绘制 \Delta_1 v (线段 CE，切向增量)
    if (Math.abs(dv) > 1) {
      drawArrow(cx_point, cy_point, ex, ey, '#fbbf24', 'Δ₁v', false, true, {x: 10, y: -5});
    }

    // 绘制总的 \Delta v (线段 DE)
    drawArrow(dx, dy, ex, ey, '#a855f7', 'Δv', true, false, {x: 15, y: 0});

    // 标注夹角 Δθ
    ctx.beginPath();
    ctx.arc(vectorOriginX, vectorOriginY, 40, 0, theta);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Δθ', vectorOriginX + 50, vectorOriginY + 15 + theta * 12);

  }, [theta, dv]); 

  // 物理计算面板数据
  const dt = theta / omega; 
  
  // ===================== 法向数据 =====================
  // 讲义中的 |Δ2v| = 2 * v * sin(Δθ/2) (等腰三角形底边)
  const delta2V = 2 * Va * Math.sin(theta / 2); 
  const normalAcc = delta2V / dt; // 估算法向加速度
  const theoreticalAn = (Va * Va) / R; // 理论向心加速度 (极限值)

  // ===================== 切向数据 =====================
  // 讲义中的 |Δ1v| = v' - v
  const delta1V = dv;
  const tangentialAcc = delta1V / dt; // 估算平均切向加速度

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl shadow-2xl border border-slate-800 font-sans text-slate-200">
      <div className="mb-8 border-b border-slate-700 pb-4">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">
          向心加速度推导 <span className="text-emerald-400 font-light">非匀速曲线运动</span>
        </h2>
        <p className="text-slate-400 text-sm">
          根据讲义推导：在末速度 v' 上截取 AC = v。总速度增量 Δv (紫虚线) 被完美分解为法向增量 Δ₂v (绿) 和切向增量 Δ₁v (黄)。
        </p>
      </div>

      <div className="relative w-full overflow-hidden bg-slate-950 rounded-xl border border-slate-800 mb-8 shadow-inner">
        <canvas ref={canvasRef} width={840} height={420} className="w-full h-auto block" />
        <div className="absolute top-4 right-6 text-slate-700/50 font-mono text-sm pointer-events-none select-none">
          WU TAO PHYSICS ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 滑块控制面板 */}
        <div className="flex flex-col justify-center space-y-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
          
          {/* 控制 1: 时间/角度趋向于 0 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 font-medium text-sm">时间间隔缩放 (<span className="italic">Δt → 0</span>)</span>
              <span className="text-sky-400 font-mono text-sm bg-sky-400/10 px-2 py-1 rounded">
                Δθ = {theta.toFixed(2)} rad
              </span>
            </div>
            <input
              type="range" min="0.01" max="1.5" step="0.01" value={theta}
              onChange={(e) => setTheta(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* 控制 2: 切向速度变化 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 font-medium text-sm">
                切向速度增量 (<span className="text-amber-400 italic font-bold">Δ₁v</span>)
              </span>
              <span className={`font-mono text-sm px-2 py-1 rounded ${dv >= 0 ? 'text-amber-400 bg-amber-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                {dv >= 0 ? '+' : ''}{dv} m/s
              </span>
            </div>
            <input
              type="range" min="-60" max="80" step="1" value={dv}
              onChange={(e) => setDv(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              * 滑动上方滑块模拟加速/减速，观察黄色矢量 <span className="text-amber-400 font-bold">Δ₁v</span> 的变化。
            </p>
          </div>
        </div>

        {/* 实时数据计算面板 */}
        <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-700 font-mono text-sm shadow-inner overflow-hidden flex flex-col justify-between">
          <div className="text-slate-400 border-b border-slate-800 pb-2 mb-3 font-bold tracking-widest text-xs uppercase flex items-center">
            <div className="w-2 h-2 rounded-full bg-purple-500 mr-2 animate-pulse"></div>
            极限逼近数据监控
          </div>
          
          <div className="flex justify-between items-center text-slate-300 mb-2">
            <span>初速度 |v| (AD)</span>
            <span>{Va.toFixed(1)} m/s</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>末速度 |v'| (AE)</span>
            <span>{Vb.toFixed(1)} m/s</span>
          </div>
          
          {/* 法向加速度对比区域 - 高亮显示极限过程 */}
          <div className="mt-4 pt-4 border-t border-slate-800/50 bg-emerald-950/20 -mx-6 px-6 py-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300">法向增量 <span className="text-emerald-400 font-bold">|Δ₂v|</span></span>
              <span className="text-emerald-400">{delta2V.toFixed(2)} m/s</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300/80 mb-1">
              <span>↳ 估算法向加速度 (|Δ₂v|/Δt)</span>
              <span>{normalAcc.toFixed(2)} m/s²</span>
            </div>
            <div className="flex justify-between items-center text-white font-bold border-l-2 border-emerald-500 pl-2 ml-1">
              <span>理论向心加速度 (v²/R)</span>
              <span>{theoreticalAn.toFixed(2)} m/s²</span>
            </div>
          </div>

          {/* 切向加速度区域 */}
          <div className="mt-2 pt-2 -mx-6 px-6 pb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300">切向增量 <span className="text-amber-400 font-bold">|Δ₁v|</span></span>
              <span className="text-amber-400">{Math.abs(delta1V).toFixed(2)} m/s</span>
            </div>
            <div className="flex justify-between items-center text-amber-300/80">
              <span>↳ 平均切向加速度 (|Δ₁v|/Δt)</span>
              <span>{Math.abs(tangentialAcc).toFixed(2)} m/s²</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}