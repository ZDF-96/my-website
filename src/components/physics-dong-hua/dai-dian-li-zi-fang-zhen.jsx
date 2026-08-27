'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// =================== 常量与配置 ===================
const COLORS = {
  bg: '#05070c',
  grid: 'rgba(14, 165, 233, 0.35)', 
  source: '#ffffff',
  sourceShadow: '#ffffff',
  axisLine: 'rgba(255,255,255,0.15)',
  centerLine: 'rgba(16, 185, 129, 0.4)',
  envelope: 'rgba(255, 255, 255, 0.15)', 
  centerCircle: 'rgba(255, 255, 255, 0.3)', 
  wavefront: 'rgba(255, 255, 255, 0.8)',
  wavefrontFill: 'rgba(255, 255, 255, 0.05)',
  chordLine: '#facc15', // 醒目的弦长颜色 (黄色)
};

const ParticleMagneticLab = () => {
  const [mode, setMode] = useState('scaling');
  const [velocity, setVelocity] = useState(60);
  const [bField, setBField] = useState(50);
  const [incidentAngleDeg, setIncidentAngleDeg] = useState(45); // 默认 45 度，更好地利用初始右下角空间
  const [particleType, setParticleType] = useState('proton');
  const [qmRatio, setQmRatio] = useState(1.0);
  const [viewScale, setViewScale] = useState(100); 
  
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const phaseRef = useRef(0);
  
  const originRef = useRef({ x: 0.35, y: 0.5 }); // 默认稍微偏左，留出更多偏转空间
  
  const rStatRef = useRef(null);
  const omegaStatRef = useRef(null);
  const qmStatRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (particleType === 'proton') setQmRatio(1.0);
    else if (particleType === 'alpha') setQmRatio(0.5);
    else if (particleType === 'electron') setQmRatio(-1.0);
  }, [particleType]);

  // 【修复 1】彻底解绑宽高比，让画布 100% 贴合 DOM 真实尺寸
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    const containerWidth = rect.width;
    const containerHeight = rect.height; // 直接读取真实高度，不再按比例折算
    
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { logicalWidth: containerWidth, logicalHeight: containerHeight };
  }, []);

  const drawBackground = useCallback((ctx, w, h) => {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    
    // 磁场铺满整个真实尺寸
    ctx.fillStyle = COLORS.grid;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 20; i < w; i += 40) {
      for (let j = 20; j < h; j += 40) {
        ctx.fillText('×', i, j);
      }
    }
  }, []);

  // --- 情景一：放缩圆 (完美可视化弦长、圆心、半径) ---
  const drawScalingMode = useCallback((ctx, w, h, cx, cy, R, qmRatio, incidentAngleDeg, phase) => {
    const sign = qmRatio >= 0 ? 1 : -1;
    const inAngle = (incidentAngleDeg * Math.PI) / 180;
    const centersAngle = inAngle - sign * Math.PI / 2;
    const vMultipliers = [0.4, 0.7, 1.0, 1.3, 1.6];
    const diag = Math.sqrt(w*w + h*h) * 2;

    // 入射方向基准线
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + diag * Math.cos(inAngle), cy + diag * Math.sin(inAngle));
    ctx.strokeStyle = COLORS.axisLine;
    ctx.stroke();

    const points = [];
    const currentParticleAngle = inAngle + sign * Math.PI / 2 + sign * phase;

    vMultipliers.forEach((vMult, index) => {
      const currentR = R * vMult;
      const Cx = cx + currentR * Math.cos(centersAngle);
      const Cy = cy + currentR * Math.sin(centersAngle);
      const isMax = index === vMultipliers.length - 1;
      const px = Cx + currentR * Math.cos(currentParticleAngle);
      const py = Cy + currentR * Math.sin(currentParticleAngle);
      points.push({ Cx, Cy, currentR, isMax, px, py });
    });

    // 1. 绘制轨道
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.Cx, p.Cy, p.currentR, 0, Math.PI * 2);
      ctx.strokeStyle = p.isMax ? 'rgba(244, 63, 94, 0.5)' : 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = p.isMax ? 2 : 1.5;
      ctx.stroke();
    });

    // 2. 【修复 2】绘制物理几何关系 (等腰三角形与弦长)
    if (points.length > 0) {
      const maxP = points[points.length - 1]; // 取最大的圆作图解

      // 绘制最大圆的圆心
      ctx.beginPath();
      ctx.arc(maxP.Cx, maxP.Cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.font = '12px sans-serif';
      ctx.fillText('C (圆心)', maxP.Cx - 20, maxP.Cy - 10);

      // 绘制两条半径 (构成等腰三角形)
      ctx.beginPath();
      ctx.moveTo(maxP.Cx, maxP.Cy);
      ctx.lineTo(cx, cy); // 连向原点 O
      ctx.moveTo(maxP.Cx, maxP.Cy);
      ctx.lineTo(maxP.px, maxP.py); // 连向粒子 P
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // 绘制弦长 (所有粒子共线所在的那条明亮线段)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(maxP.px, maxP.py);
      ctx.strokeStyle = COLORS.chordLine;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 标注弦长文字
      const midChordX = (cx + maxP.px) / 2;
      const midChordY = (cy + maxP.py) / 2;
      ctx.fillStyle = COLORS.chordLine;
      ctx.font = 'bold 14px sans-serif';
      
      // 添加一点偏移以免文字被线穿透
      const textOffsetX = Math.cos(currentParticleAngle + Math.PI/2) * 15;
      const textOffsetY = Math.sin(currentParticleAngle + Math.PI/2) * 15;
      ctx.fillText('弦长 L', midChordX + textOffsetX, midChordY + textOffsetY);
    }

    // 3. 绘制高亮粒子
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.px, p.py, p.isMax ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = p.isMax ? '#f43f5e' : '#22d3ee';
      ctx.shadowBlur = p.isMax ? 15 : 10;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, []);

  const drawRotatingMode = useCallback((ctx, w, h, cx, cy, R, qmRatio, phase) => {
    const sign = qmRatio >= 0 ? 1 : -1;
    
    ctx.beginPath();
    ctx.arc(cx, cy, 2 * R, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.envelope;
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.centerCircle;
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    const particleCount = 32;
    const wavefrontPoints = [];
    const orbits = [];

    for (let i = 0; i < particleCount; i++) {
      const emitAngle = (i / particleCount) * Math.PI * 2;
      const Cx = cx + R * Math.sin(emitAngle) * sign;
      const Cy = cy - R * Math.cos(emitAngle) * sign;
      const hue = (i / particleCount) * 360; 
      const isMajorOrbit = i % 4 === 0;

      const currentAngle = emitAngle + sign * Math.PI / 2 + sign * phase;
      const px = Cx + R * Math.cos(currentAngle);
      const py = Cy + R * Math.sin(currentAngle);
      
      orbits.push({ Cx, Cy, hue, isMajorOrbit, px, py });
      wavefrontPoints.push({ x: px, y: py });
    }

    orbits.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.Cx, o.Cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = o.isMajorOrbit ? `hsla(${o.hue}, 90%, 65%, 0.3)` : `hsla(${o.hue}, 80%, 55%, 0.08)`;
      ctx.lineWidth = o.isMajorOrbit ? 1.5 : 1;
      ctx.stroke();
    });

    if (wavefrontPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(wavefrontPoints[0].x, wavefrontPoints[0].y);
      for (let i = 1; i < wavefrontPoints.length; i++) {
        ctx.lineTo(wavefrontPoints[i].x, wavefrontPoints[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = COLORS.wavefront;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = COLORS.wavefrontFill;
      ctx.fill();
    }

    orbits.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.px, o.py, o.isMajorOrbit ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${o.hue}, 100%, 70%)`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let dims = updateCanvasSize();
    const ctx = canvas.getContext('2d');
    
    const resizeObserver = new ResizeObserver(() => { dims = updateCanvasSize(); });
    resizeObserver.observe(container);

    const render = () => {
      if (!dims) dims = updateCanvasSize();
      if (!dims) return;
      const { logicalWidth: w, logicalHeight: h } = dims;

      const absQm = Math.max(Math.abs(qmRatio), 0.05);
      const physicalR = velocity / (absQm * Math.max(bField, 1));
      const omega = absQm * Math.max(bField, 1);
      
      phaseRef.current += omega * 0.0015;
      const phase = phaseRef.current;

      const cx = w * originRef.current.x;
      const cy = h * originRef.current.y;
      
      const BASE_SCALE = 35 * (viewScale / 100); 
      const renderR = physicalR * BASE_SCALE;

      drawBackground(ctx, w, h);

      if (mode === 'scaling') drawScalingMode(ctx, w, h, cx, cy, renderR, qmRatio, incidentAngleDeg, phase);
      else drawRotatingMode(ctx, w, h, cx, cy, renderR, qmRatio, phase);

      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.sourceShadow;
      ctx.fillStyle = COLORS.source;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('O (粒子源)', cx + 38, cy + 15);

      if (rStatRef.current) rStatRef.current.innerText = physicalR.toFixed(2);
      if (omegaStatRef.current) omegaStatRef.current.innerText = omega.toFixed(2);
      if (qmStatRef.current) qmStatRef.current.innerText = qmRatio.toFixed(2);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(requestRef.current);
      resizeObserver.disconnect();
    };
  }, [isMounted, mode, velocity, bField, qmRatio, incidentAngleDeg, viewScale, drawBackground, drawScalingMode, drawRotatingMode, updateCanvasSize]);

  if (!isMounted) return <div className="h-[500px] bg-[#05070c] rounded-3xl animate-pulse" />;

  const handleDragUpdate = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    originRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  return (
    <div className="w-full my-8 p-6 md:p-8 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl font-sans text-slate-200">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
            洛伦兹力粒子发射源仿真
          </h2>
          <p className="text-sm text-gray-400 mt-1">100% 画布面积利用 · 动态弦长几何解析 · 自由拖拽</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[600px]">
        {/* 左侧控制台 (设置固定宽度或基础宽度) */}
        <div className="w-full lg:w-[320px] flex flex-col gap-5 shrink-0">
          <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl space-y-6 h-full">
            
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
              <div className="text-xs text-gray-400 mb-3 font-semibold tracking-wider">实时物理参量 (HUD)</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-900/50 rounded-lg p-2 border border-white/5">
                  <div className="text-[10px] text-gray-500 mb-1">半径 (R)</div>
                  <div className="font-mono text-cyan-400 text-sm" ref={rStatRef}>--</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2 border border-white/5">
                  <div className="text-[10px] text-gray-500 mb-1">角速度 (ω)</div>
                  <div className="font-mono text-purple-400 text-sm" ref={omegaStatRef}>--</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2 border border-white/5">
                  <div className="text-[10px] text-gray-500 mb-1">比荷 (q/m)</div>
                  <div className="font-mono text-emerald-400 text-sm" ref={qmStatRef}>--</div>
                </div>
              </div>
            </div>

            <hr className="border-white/5" />

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">物理模态</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setMode('scaling')}
                  className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all ${
                    mode === 'scaling' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                  }`}
                >
                  放缩圆 (多速率弦长解析)
                </button>
                <button
                  onClick={() => setMode('rotating')}
                  className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all ${
                    mode === 'rotating' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                  }`}
                >
                  旋转圆 (多方向着色)
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400 font-medium">全局视图缩放 (防溢出)</span>
                <span className="text-amber-400 font-mono">{viewScale}%</span>
              </div>
              <input type="range" min="20" max="300" value={viewScale} onChange={(e) => setViewScale(Number(e.target.value))} className="w-full accent-amber-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">入射粒子类型</label>
              <select
                value={particleType}
                onChange={(e) => setParticleType(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 text-emerald-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="proton">质子 (q/m = +1.0) - 正偏转</option>
                <option value="alpha">α粒子 (q/m = +0.5) - 大半径</option>
                <option value="electron">电子 (q/m = -1.0) - 逆向偏转</option>
                <option value="custom">自定义比荷...</option>
              </select>
            </div>

            {particleType === 'custom' && (
              <div>
                <input type="range" min="-2.0" max="2.0" step="0.05" value={qmRatio} onChange={(e) => setQmRatio(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}

            {mode === 'scaling' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400 font-medium">入射方向角度</span>
                  <span className="text-purple-400 font-mono">{incidentAngleDeg}°</span>
                </div>
                <input type="range" min="0" max="360" value={incidentAngleDeg} onChange={(e) => setIncidentAngleDeg(Number(e.target.value))} className="w-full accent-purple-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400 font-medium">发射基准速率 (v)</span>
                <span className="text-cyan-400 font-mono">{velocity}</span>
              </div>
              <input type="range" min="20" max="100" value={velocity} onChange={(e) => setVelocity(Number(e.target.value))} className="w-full accent-cyan-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400 font-medium">磁感应强度 (B)</span>
                <span className="text-blue-400 font-mono">{bField}</span>
              </div>
              <input type="range" min="20" max="100" value={bField} onChange={(e) => setBField(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
        </div>

        {/* 右侧画布区域：使用 flex-1 占据所有剩余空间，绝对填满容器高度！ */}
        <div
          ref={containerRef}
          className="flex-1 w-full bg-[#05070c] border border-slate-800 rounded-2xl overflow-hidden relative shadow-[inset_0_4px_40px_rgba(0,0,0,0.5)] cursor-move min-h-[400px]"
          onMouseDown={(e) => {
            handleDragUpdate(e);
            setIsDragging(true);
          }}
          onMouseMove={(e) => {
            if (isDragging) handleDragUpdate(e);
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {/* 画布设置为 absolute 并 inset-0 确保 100% 覆盖父元素 */}
          <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
          
          <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none opacity-80">
            <span className="bg-slate-900/90 border border-cyan-500/30 text-cyan-100 text-xs px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur-md">
              💡 提示：在画布上随意拖动 O 点，自由分配磁场偏转空间
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticleMagneticLab;