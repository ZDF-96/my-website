'use client';

import React, { useEffect, useRef, useState } from 'react';

const TABS = [
  { id: 0, title: '宏观能量', sub: '机械能转化模型' },
  { id: 1, title: '微观受力', sub: '洛伦兹力正交分解' },
  { id: 2, title: '功率守恒', sub: '做功代数和恒等式' },
];

export default function ElectromagneticInductionSimulation() {
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);

  const [activeTab, setActiveTab] = useState(1);
  const [uSpeed, setUSpeed] = useState(4);
  const [resistance, setResistance] = useState(3);
  const [isMoving, setIsMoving] = useState(true);

  // 使用 ref 同步 UI 状态，供 requestAnimationFrame 内部读取，避免闭包陷阱
  const uiState = useRef({ activeTab, uSpeed, resistance, isMoving });
  useEffect(() => {
    uiState.current = { activeTab, uSpeed, resistance, isMoving };
  }, [activeTab, uSpeed, resistance, isMoving]);

  const physics = useRef({
    wireX: 180,
    time: 0,
    chargeOffset: 0,
    smoothU: 4,
    smoothR: 3,
    smoothV: 0,
    canvasWidth: 800,
    canvasHeight: 520,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationId;
    let lastTime = performance.now();

    // --- 极简科研环境：工程坐标系 ---
    const drawBackground = (targetCtx, width, height) => {
      targetCtx.fillStyle = '#080c16';
      targetCtx.fillRect(0, 0, width, height);

      // 次级坐标网格 (极细弱)
      targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      for (let x = 0; x < width; x += 20) {
        targetCtx.moveTo(x, 0); targetCtx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 20) {
        targetCtx.moveTo(0, y); targetCtx.lineTo(width, y);
      }
      targetCtx.stroke();

      // 主级坐标网格 (稍强)
      targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      targetCtx.beginPath();
      for (let x = 0; x < width; x += 100) {
        targetCtx.moveTo(x, 0); targetCtx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 100) {
        targetCtx.moveTo(0, y); targetCtx.lineTo(width, y);
      }
      targetCtx.stroke();
    };

    // --- 严谨匀强磁场阵列 ---
    const drawBField = (targetCtx, width, height) => {
      targetCtx.save();
      const spacing = 60;
      targetCtx.lineWidth = 1;
      targetCtx.strokeStyle = 'rgba(100, 116, 139, 0.35)';

      for (let x = 40; x < width - 20; x += spacing) {
        for (let y = 40; y < height - 20; y += spacing) {
          targetCtx.beginPath();
          targetCtx.arc(x, y, 4, 0, Math.PI * 2);
          targetCtx.moveTo(x - 2.5, y - 2.5); targetCtx.lineTo(x + 2.5, y + 2.5);
          targetCtx.moveTo(x - 2.5, y + 2.5); targetCtx.lineTo(x + 2.5, y - 2.5);
          targetCtx.stroke();
        }
      }

      // 磁场标签卡
      targetCtx.fillStyle = '#080c16';
      targetCtx.strokeStyle = 'rgba(255,255,255,0.1)';
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      targetCtx.roundRect(24, 20, 145, 30, 4);
      targetCtx.fill();
      targetCtx.stroke();

      targetCtx.fillStyle = '#38bdf8';
      targetCtx.font = '500 12px "JetBrains Mono", -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
      targetCtx.fillText('B ⊗ 匀强磁场', 36, 40);
      targetCtx.restore();
    };

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      physics.current.canvasWidth = rect.width;
      physics.current.canvasHeight = rect.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 缓存背景到离屏 Canvas
      bgCanvasRef.current = document.createElement('canvas');
      bgCanvasRef.current.width = canvas.width;
      bgCanvasRef.current.height = canvas.height;
      const bgCtx = bgCanvasRef.current.getContext('2d');
      if (bgCtx) {
        bgCtx.scale(dpr, dpr);
        drawBackground(bgCtx, rect.width, rect.height);
        drawBField(bgCtx, rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const updatePhysics = (dtMs) => {
      const state = physics.current;
      const { uSpeed: targetU, resistance: targetR, isMoving: currentMoving } = uiState.current;
      const dt = Math.max(0.001, Math.min(dtMs / 1000, 0.05));
      state.time += dt;

      if (currentMoving) {
        state.smoothU += (targetU - state.smoothU) * 8 * dt;
        state.smoothR += (targetR - state.smoothR) * 8 * dt;

        const targetV = (state.smoothU * 3.8) / Math.max(0.6, state.smoothR);
        state.smoothV += (targetV - state.smoothV) * 12 * dt;

        state.wireX += state.smoothU * 16 * dt;
        const limitRight = state.canvasWidth - 100;
        if (state.wireX > limitRight) state.wireX = 140;

        state.chargeOffset -= state.smoothV * 28 * dt;
        if (state.chargeOffset < -120) state.chargeOffset += 120;
      } else {
        state.smoothU += (0 - state.smoothU) * 10 * dt;
        state.smoothV += (0 - state.smoothV) * 10 * dt;
      }
    };

    // --- 动态排版支持的矢量绘制系统 ---
    const drawVector = (x, y, dx, dy, color, label, labelOffset = { x: 0, y: 0 }, align = 'left', isDashed = false) => {
      const len = Math.hypot(dx, dy);
      if (len < 2) return;

      ctx.save();
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';

      if (isDashed) {
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
      } else {
        ctx.lineWidth = 2.5;
      }

      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.setLineDash([]);

      const angle = Math.atan2(dy, dx);
      ctx.translate(x + dx, y + dy);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-9, -3.5);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-9, 3.5);
      ctx.closePath();
      ctx.fill();

      if (label) {
        ctx.rotate(-angle);
        ctx.font = '500 13px "JetBrains Mono", -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';

        // 强对比度描边防重叠
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#080c16';
        ctx.strokeText(label, labelOffset.x, labelOffset.y);
        ctx.fillStyle = color;
        ctx.fillText(label, labelOffset.x, labelOffset.y);
      }
      ctx.restore();
    };

    const drawCircuitRails = (centerY, wireHeight, wireX, state) => {
      ctx.save();
      const topY = centerY - wireHeight / 2;
      const bottomY = centerY + wireHeight / 2;
      const railLeft = 140;

      // 导轨底色
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      ctx.moveTo(wireX + 10, topY); ctx.lineTo(railLeft, topY); ctx.lineTo(railLeft, centerY - 30);
      ctx.moveTo(railLeft, centerY + 30); ctx.lineTo(railLeft, bottomY); ctx.lineTo(wireX + 10, bottomY);
      ctx.stroke();

      // 导轨高光
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 电流指示虚线
      if (state.smoothV > 0.2) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 10]);
        ctx.lineDashOffset = state.chargeOffset;
        ctx.beginPath();
        ctx.moveTo(wireX + 10, topY); ctx.lineTo(railLeft, topY); ctx.lineTo(railLeft, centerY - 30);
        ctx.moveTo(railLeft, centerY + 30); ctx.lineTo(railLeft, bottomY); ctx.lineTo(wireX + 10, bottomY);
        ctx.stroke();
        ctx.restore();
      }

      // 电阻器绘制
      const heatIntensity = Math.min(1, state.smoothV / 7.5);
      ctx.strokeStyle = heatIntensity > 0.3 ? '#ef4444' : '#64748b';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      ctx.moveTo(railLeft, centerY - 30);
      ctx.lineTo(railLeft - 12, centerY - 20);
      ctx.lineTo(railLeft + 12, centerY - 10);
      ctx.lineTo(railLeft - 12, centerY);
      ctx.lineTo(railLeft + 12, centerY + 10);
      ctx.lineTo(railLeft - 12, centerY + 20);
      ctx.lineTo(railLeft, centerY + 30);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 15px "Times New Roman", serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('R', railLeft - 22, centerY);
      ctx.restore();
    };

    const drawRod = (x, centerY, width, height) => {
      ctx.save();
      const topY = centerY - height / 2;

      const grad = ctx.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.3, '#94a3b8');
      grad.addColorStop(0.6, '#f1f5f9');
      grad.addColorStop(0.8, '#64748b');
      grad.addColorStop(1, '#0f172a');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x - width / 2, topY, width, height, 4);
      ctx.fill();

      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const drawMicroscopicCharges = (wireX, centerY, wireHeight, state) => {
      const numCharges = 5;
      const spacing = wireHeight / numCharges;
      const startY = centerY - wireHeight / 2 + spacing / 2;
      const scaleU = 8;
      const scaleV = 8;
      const { activeTab: currentTab } = uiState.current;

      ctx.save();
      for (let i = -1; i <= numCharges; i++) {
        const y = startY + i * spacing + (state.chargeOffset % spacing);
        if (y < centerY - wireHeight / 2 + 10 || y > centerY + wireHeight / 2 - 10) continue;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(wireX, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        const u = state.smoothU;
        const v = state.smoothV;

        const isCenter = Math.abs(y - centerY) < (spacing / 2);
        if (!isCenter) continue;

        if (currentTab === 0) {
          drawVector(wireX, y, u * scaleU, 0, '#0ea5e9', 'u', { x: 8, y: -10 }, 'left');
          drawVector(wireX, y, 0, -v * scaleV, '#f43f5e', 'v', { x: 8, y: -6 }, 'left');
        } else if (currentTab === 1 || currentTab === 2) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.setLineDash([3, 4]);
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(wireX + u * scaleU, y);
          ctx.lineTo(wireX + u * scaleU, y - v * scaleV);
          ctx.lineTo(wireX, y - v * scaleV);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(wireX - v * scaleV * 0.9, y);
          ctx.lineTo(wireX - v * scaleV * 0.9, y - u * scaleU * 0.9);
          ctx.lineTo(wireX, y - u * scaleU * 0.9);
          ctx.stroke();
          ctx.restore();

          drawVector(wireX, y, u * scaleU, 0, 'rgba(14, 165, 233, 0.45)', 'u', { x: 8, y: 12 }, 'left', true);
          drawVector(wireX, y, 0, -v * scaleV, 'rgba(244, 63, 94, 0.45)', 'v', { x: 8, y: -4 }, 'left', true);
          drawVector(wireX, y, u * scaleU, -v * scaleV, '#a855f7', 'V合', { x: 8, y: -4 }, 'left');

          drawVector(wireX, y, 0, -u * scaleU * 0.9, '#10b981', 'f₂ (驱动力)', { x: -8, y: 0 }, 'right');
          drawVector(wireX, y, -v * scaleV * 0.9, 0, '#f59e0b', 'f₁ (安培阻力)', { x: -8, y: -10 }, 'right');
        }
      }
      ctx.restore();
    };

    const drawMacroLabels = (wireX, centerY, wireHeight, state) => {
      const u = state.smoothU;
      const v = state.smoothV;
      const scale = 8;

      if (u > 0.1) {
        drawVector(wireX + 26, centerY - 45, u * scale, 0, '#0ea5e9', 'F_外 (拉力)', { x: 10, y: 0 }, 'left');
      }
      if (v > 0.1) {
        drawVector(wireX - 26, centerY + 45, -v * scale * 1.1, 0, '#f59e0b', 'F_安 (安培力)', { x: -10, y: 0 }, 'right');
      }
    };

    const render = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      const state = physics.current;
      const { activeTab: currentTab } = uiState.current;

      updatePhysics(dt);

      const width = state.canvasWidth;
      const height = state.canvasHeight;
      const wireHeight = height * 0.65;
      const centerY = height / 2;
      const wireWidth = 14;

      ctx.clearRect(0, 0, width, height);

      if (bgCanvasRef.current) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(bgCanvasRef.current, 0, 0);
        ctx.restore();
      }

      drawCircuitRails(centerY, wireHeight, state.wireX, state);
      drawRod(state.wireX, centerY, wireWidth, wireHeight);
      drawMicroscopicCharges(state.wireX, centerY, wireHeight, state);

      if (currentTab === 0) drawMacroLabels(state.wireX, centerY, wireHeight, state);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const currentP = ((uSpeed * 3.8) / Math.max(0.6, resistance) * uSpeed).toFixed(1);

  return (
    <div className="w-full max-w-[1080px] mx-auto bg-[#080c16] border border-slate-800/80 rounded-2xl shadow-2xl font-sans text-slate-200 overflow-hidden flex flex-col">
      
      <div className="px-6 py-4 flex items-center justify-between bg-[#0f172a] border-b border-slate-800 z-20">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-6 bg-cyan-500 rounded-sm"></div>
          <h2 className="text-[15px] font-semibold tracking-wide text-slate-100 flex items-center">
            动生电动势微观动力学推导
            <span className="ml-3 text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
              SIMULATION_V3
            </span>
          </h2>
        </div>

        <button
          onClick={() => setIsMoving(!isMoving)}
          className={`px-5 py-1.5 rounded text-[13px] font-medium transition-all duration-200 border ${
            isMoving
              ? 'bg-slate-800/50 text-rose-400 border-rose-500/30 hover:bg-slate-800'
              : 'bg-slate-800/50 text-emerald-400 border-emerald-500/30 hover:bg-slate-800'
          }`}
        >
          {isMoving ? '⏸ 暂停演算' : '▶ 恢复演算'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row w-full md:h-[520px] relative z-10">
        
        <div className="relative flex-1 h-[400px] md:h-full bg-[#080c16]">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
        </div>

        <div className="w-full md:w-[380px] shrink-0 bg-[#020617] border-t md:border-t-0 md:border-l border-slate-800 p-7 flex flex-col">
          
          <div className="flex p-1 bg-slate-900/80 rounded-lg mb-8 border border-slate-800/80">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded py-2 text-center transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50'
                }`}
              >
                <span className="block text-[13px] font-medium">{tab.title}</span>
              </button>
            ))}
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-medium text-slate-300">牵连速度 <span className="font-serif italic text-cyan-400 ml-1">u</span></span>
                <span className="font-mono text-cyan-400 text-[13px]">{uSpeed}.0 m/s</span>
              </div>
              <input
                type="range" min="1" max="8" step="1" value={uSpeed}
                onChange={(e) => setUSpeed(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-medium text-slate-300">系统总电阻 <span className="font-serif italic text-rose-400 ml-1">R</span></span>
                <span className="font-mono text-rose-400 text-[13px]">{resistance}.0 Ω</span>
              </div>
              <input
                type="range" min="1" max="8" step="1" value={resistance}
                onChange={(e) => setResistance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          <div className="h-px w-full bg-slate-800/60 mb-6"></div>

          <div className="space-y-3 flex-1">
            <h3 className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-4">功率结算矩阵</h3>

            <div className="flex justify-between items-center bg-slate-900/80 px-4 py-2.5 rounded border border-slate-800/80">
              <span className="text-[13px] text-slate-300">推力功率 <span className="font-serif italic text-emerald-400 text-[11px] ml-1">f₂·v</span></span>
              <span className="text-emerald-400 font-mono text-[14px]">+{currentP} W</span>
            </div>
            
            <div className="flex justify-between items-center bg-slate-900/80 px-4 py-2.5 rounded border border-slate-800/80 mb-4">
              <span className="text-[13px] text-slate-300">耗散功率 <span className="font-serif italic text-amber-400 text-[11px] ml-1">|f₁·u|</span></span>
              <span className="text-amber-400 font-mono text-[14px]">+{currentP} W</span>
            </div>
            
            <div className="text-[12px] text-slate-400 leading-relaxed pt-2">
              {activeTab === 0 && (
                <p>外界提供的机械能，以宏观安培力为中介，全部等量转化为系统的焦耳热耗散。</p>
              )}
              {activeTab === 1 && (
                <p>导体内部洛伦兹力正交分解：<br/><span className="text-emerald-400">f₂</span> 提供非静电力，驱动电荷形成电流；<br/><span className="text-amber-400">f₁</span> 阻碍导体运动，宏观表现为安培阻力。</p>
              )}
              {activeTab === 2 && (
                <div>
                  <div className="font-serif italic text-center text-cyan-300 bg-slate-900/80 py-2 border border-slate-800/80 rounded mb-2 shadow-inner">
                    f₁·u + f₂·v ≡ 0
                  </div>
                  <p>严格证明：洛伦兹力各分量做功的代数和恒为零。其在电磁感应中仅充当无损的能量转换杠杆。</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}