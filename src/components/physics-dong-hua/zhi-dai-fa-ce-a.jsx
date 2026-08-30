'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, RotateCcw, Activity, Ruler, Calculator, Timer, Zap,
  Power, AlertTriangle, BookOpen, ZoomIn, Plug, Info, MoveRight
} from 'lucide-react';

const TextbookTapeTimer = () => {
  const canvasRef = useRef(null);
  const liveTRef = useRef(null);
  const liveVRef = useRef(null);

  const [acceleration, setAcceleration] = useState(1.25);
  const [initialVelocity, setInitialVelocity] = useState(0.20);

  const [isPowered, setIsPowered] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const [results, setResults] = useState({
    points: [], x_intervals: [], v2: 0, a_calc: 0, allPoints: []
  });

  const reqRef = useRef(null);
  const state = useRef({ simTime: 0, lastFrameTime: 0 });

  // 物理比例：1m = 500px
  const scale = 500;
  const timerX = 150;
  const boardY = 220;
  const pulleyX = 1080;

  const calculateTheoreticalPoints = useCallback(() => {
    const T = 0.1; // 计数周期
    const points = [];
    const x_intervals = [];
    const allPoints = [];

    for (let i = 0; i <= 30; i++) {
      const t = i * 0.02;
      const x_m = initialVelocity * t + 0.5 * acceleration * t * t;
      allPoints.push(x_m * 100); // 转换为 cm
    }

    for (let i = 0; i <= 6; i++) {
      points.push(allPoints[i * 5].toFixed(2));
    }

    for (let i = 0; i < 6; i++) {
      const dx = (parseFloat(points[i + 1]) - parseFloat(points[i])).toFixed(2);
      x_intervals.push(dx);
    }

    const v2 = ((parseFloat(x_intervals[1]) + parseFloat(x_intervals[2])) * 0.01 / (2 * T)).toFixed(3);
    const s_last3 = parseFloat(x_intervals[3]) + parseFloat(x_intervals[4]) + parseFloat(x_intervals[5]);
    const s_first3 = parseFloat(x_intervals[0]) + parseFloat(x_intervals[1]) + parseFloat(x_intervals[2]);
    const a_calc = ((s_last3 - s_first3) * 0.01 / (9 * T * T)).toFixed(2);

    return { points, x_intervals, v2, a_calc, allPoints };
  }, [acceleration, initialVelocity]);

  const drawCanvas = useCallback((currentTime, animRunning = isRunning, animPowered = isPowered) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = 1200;
    const height = 400;
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = `${width} / ${height}`;

    // 背景：深色实验桌与墙壁
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, width, height);

    // 墙壁渐变
    const wallGrad = ctx.createLinearGradient(0, 0, 0, boardY);
    wallGrad.addColorStop(0, '#1e293b');
    wallGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, boardY);

    // 实验桌
    const tableGrad = ctx.createLinearGradient(0, boardY + 40, 0, height);
    tableGrad.addColorStop(0, '#1e293b');
    tableGrad.addColorStop(1, '#020617');
    ctx.fillStyle = tableGrad;
    ctx.fillRect(0, boardY + 40, width, height - boardY - 40);

    // 木板（一端垫高）
    const woodGrad = ctx.createLinearGradient(0, boardY, 0, boardY + 20);
    woodGrad.addColorStop(0, '#c2652b');
    woodGrad.addColorStop(1, '#7a3610');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(50, boardY, pulleyX - 50, 20);

    // 垫木
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.moveTo(70, boardY + 20);
    ctx.lineTo(100, boardY + 20);
    ctx.lineTo(95, boardY + 40);
    ctx.lineTo(75, boardY + 40);
    ctx.fill();

    const currentDist = initialVelocity * currentTime + 0.5 * acceleration * currentTime * currentTime;
    const carX = timerX + 70 + currentDist * scale;

    // 滑轮与细线钩码
    const pulleyRadius = 22;
    // 修正：使滑轮顶端与小车连接点水平，保证绳子水平
    const pulleyCenterY = boardY - 15 + pulleyRadius; 
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(pulleyX - 15, boardY, 30, 20, 2);
    ctx.fill();

    // 细线（水平段）
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(carX + 110, boardY - 15);
    ctx.lineTo(pulleyX, pulleyCenterY - pulleyRadius);
    const weightY = pulleyCenterY + 40 + currentDist * scale;
    ctx.moveTo(pulleyX + pulleyRadius, pulleyCenterY);
    ctx.lineTo(pulleyX + pulleyRadius, weightY);
    ctx.stroke();

    // 钩码
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(pulleyX + pulleyRadius - 10, weightY, 20, 30);
    ctx.fillStyle = '#475569';
    ctx.fillRect(pulleyX + pulleyRadius - 12, weightY + 12, 24, 2);

    // 滑轮本体
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(pulleyX, pulleyCenterY, pulleyRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pulleyX, pulleyCenterY, 3, 0, Math.PI * 2);
    ctx.fill();

    // 纸带
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(timerX - 30, boardY - 12, carX - timerX + 30, 20);
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.strokeRect(timerX - 30, boardY - 12, carX - timerX + 30, 20);

    // 打点
    const dotOrigin = timerX + 40;
    const totalTicks = Math.floor(currentTime / 0.02);
    for (let i = 0; i <= totalTicks; i++) {
      const t_i = i * 0.02;
      const dist_at_ti = initialVelocity * t_i + 0.5 * acceleration * t_i * t_i;
      const dotScreenX = dotOrigin + (currentDist - dist_at_ti) * scale;

      if (dotScreenX > timerX + 10) {
        const isCounting = i % 5 === 0;
        ctx.fillStyle = isCounting ? '#0f172a' : 'rgba(15, 23, 42, 0.4)';
        ctx.beginPath();
        const jitter = animRunning && !isCounting ? (Math.random() - 0.5) * 0.5 : 0;
        ctx.arc(dotScreenX + jitter, boardY - 2, isCounting ? 3.5 : 1.8, 0, Math.PI * 2);
        ctx.fill();

        if (isCounting) {
          ctx.fillStyle = '#0ea5e9';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(i / 5, dotScreenX - 4, boardY - 18);
        }
      }
    }

    // 电磁打点计时器
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(timerX, boardY - 50, 75, 50, 4);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 接线柱
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(timerX + 15, boardY - 42, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(timerX + 15, boardY - 28, 5, 0, Math.PI * 2);
    ctx.fill();

    // 线圈磁铁
    ctx.fillStyle = '#b45309';
    ctx.fillRect(timerX + 30, boardY - 45, 25, 20);
    ctx.fillStyle = '#334155';
    ctx.fillRect(timerX + 38, boardY - 50, 9, 28);

    // 限位孔
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(timerX + 5, boardY - 16, 6, 24);
    ctx.fillRect(timerX + 65, boardY - 16, 6, 24);

    // 振片与振针
    let pinYOffset = 0;
    if (animPowered) {
      const activeTime = animRunning ? currentTime : (performance.now() / 1000);
      pinYOffset = -Math.cos(activeTime * 50 * Math.PI * 2) * 2.5;
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(timerX + 35, boardY - 30);
    ctx.lineTo(dotOrigin + 5, boardY - 22 + pinYOffset);
    ctx.lineTo(dotOrigin - 5, boardY - 22 + pinYOffset);
    ctx.fill();

    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(dotOrigin - 1, boardY - 22 + pinYOffset);
    ctx.lineTo(dotOrigin + 1, boardY - 22 + pinYOffset);
    ctx.lineTo(dotOrigin, boardY - 6 + pinYOffset);
    ctx.fill();

    // 复写纸
    ctx.fillStyle = 'rgba(30, 58, 138, 0.9)';
    ctx.beginPath();
    ctx.ellipse(dotOrigin, boardY - 4, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(dotOrigin, boardY - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 实验小车
    const carGrad = ctx.createLinearGradient(carX, boardY - 40, carX, boardY);
    carGrad.addColorStop(0, '#e2e8f0');
    carGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = carGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.roundRect(carX, boardY - 40, 110, 32, 4);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#64748b';
    ctx.fillRect(carX + 20, boardY - 35, 70, 8);

    // 纸带夹
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(carX - 5, boardY - 15, 10, 10, 2);
    ctx.fill();

    // 车轮
    const wheelRadius = 12;
    const rotationAngle = (currentDist * scale) / wheelRadius;
    const drawWheel = (cx, cy) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotationAngle);
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(0, 0, wheelRadius - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-wheelRadius + 3, 0);
      ctx.lineTo(wheelRadius - 3, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -wheelRadius + 3);
      ctx.lineTo(0, wheelRadius - 3);
      ctx.stroke();
      ctx.restore();
    };

    drawWheel(carX + 25, boardY - 8);
    drawWheel(carX + 85, boardY - 8);

    // 碰撞警示
    if (carX + 110 > pulleyX - 10 && animRunning) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ 严重错误：小车撞击滑轮，损坏器材！', width / 2, height / 2);
      ctx.textAlign = 'left';
    }
  }, [acceleration, initialVelocity, isPowered, isRunning]);

  const resetSim = useCallback(() => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    state.current = { simTime: 0, lastFrameTime: 0 };
    setIsRunning(false);
    setIsFinished(false);
    setIsPowered(false);
    setShowWarning(false);

    if (liveTRef.current) liveTRef.current.innerText = '0.000';
    if (liveVRef.current) liveVRef.current.innerText = initialVelocity.toFixed(3);

    setResults({ points: [], x_intervals: [], v2: 0, a_calc: 0, allPoints: [] });
    drawCanvas(0, false, false);
  }, [initialVelocity, drawCanvas]);

  useEffect(() => {
    resetSim();
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    drawCanvas(state.current.simTime);
  }, [drawCanvas]);

  const handleRelease = () => {
    if (!isPowered) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 2500);
      return;
    }

    setShowWarning(false);
    setIsRunning(true);
    state.current.simTime = 0;
    state.current.lastFrameTime = performance.now();

    const update = (now) => {
      const dt = (now - state.current.lastFrameTime) / 1000;
      state.current.lastFrameTime = now;
      state.current.simTime += dt * 0.15; // 仿真回放速度

      const time = state.current.simTime;
      const currentV = initialVelocity + acceleration * time;

      if (liveTRef.current) liveTRef.current.innerText = time.toFixed(3);
      if (liveVRef.current) liveVRef.current.innerText = currentV.toFixed(3);

      drawCanvas(time, true, true);

      const currentDist = initialVelocity * time + 0.5 * acceleration * time * time;
      const carFrontX = timerX + 70 + currentDist * scale + 110;

      if (time >= 0.65 || carFrontX >= pulleyX - 5) {
        setIsRunning(false);
        setIsFinished(true);
        setIsPowered(false);
        setResults(calculateTheoreticalPoints());
        return;
      }
      reqRef.current = requestAnimationFrame(update);
    };
    reqRef.current = requestAnimationFrame(update);
  };

  // 生成刻度尺
  const renderTextbookRuler = () => {
    if (!results.allPoints || results.allPoints.length === 0) return null;
    const Z = 50;
    const maxCm = Math.ceil(results.allPoints[results.allPoints.length - 1]) + 2;
    const rulerLines = [];

    for (let cm = -1; cm <= maxCm; cm++) {
      for (let mm = 0; mm < 10; mm++) {
        const val = cm + mm * 0.1;
        const px = (val + 1) * Z;
        if (px < 0) continue;

        const isMajor = mm === 0;
        const isMid = mm === 5;
        const height = isMajor ? 24 : (isMid ? 14 : 8);

        rulerLines.push(
          <line
            key={`${cm}-${mm}`}
            x1={px}
            y1={120}
            x2={px}
            y2={120 + height}
            stroke={isMajor ? '#e2e8f0' : '#64748b'}
            strokeWidth={isMajor ? 2 : 1}
          />
        );
        if (isMajor && val >= 0) {
          rulerLines.push(
            <text
              key={`text-${cm}`}
              x={px}
              y={160}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="14"
              fontWeight="bold"
            >
              {val}
            </text>
          );
        }
      }
    }
    return rulerLines;
  };

  return (
    <div className="w-full max-w-7xl mx-auto my-8 p-6 lg:p-8 bg-slate-950/95 rounded-[2.5rem] border border-slate-800 shadow-2xl font-sans text-slate-200 backdrop-blur-sm">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <BookOpen className="w-7 h-7 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            探究小车速度随时间变化的规律（电磁打点计时器）
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2 flex-wrap">
            <Info className="w-4 h-4 text-cyan-400" />
            教材规范：仪器需接
            <strong className="text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">~8V 交流电源</strong>
            ，打点频率
            <strong className="text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">50Hz</strong>
            （周期 T₀ = 0.02s）
          </p>
        </div>
      </div>

      {/* 实验台视口 */}
      <div className="relative w-full bg-[#020617] rounded-3xl border border-slate-700 overflow-hidden shadow-inner mb-8">
        <canvas ref={canvasRef} className="w-full h-auto object-cover block" />

        {/* 数据悬浮窗 */}
        <div className="absolute top-5 right-5 bg-black/80 backdrop-blur-xl border border-slate-700/80 p-4 rounded-2xl flex gap-8 shadow-2xl pointer-events-none z-10">
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Timer className="w-4 h-4" /> 运动时间 (s)
            </div>
            <div className="text-3xl font-mono text-cyan-400 font-black" ref={liveTRef}>
              0.000
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Activity className="w-4 h-4" /> 瞬时速度 (m/s)
            </div>
            <div className="text-3xl font-mono text-rose-400 font-black" ref={liveVRef}>
              {initialVelocity.toFixed(3)}
            </div>
          </div>
        </div>

        {/* 警告弹窗 */}
        {showWarning && (
          <div className="absolute inset-0 flex items-center justify-center bg-rose-950/60 backdrop-blur-sm z-20">
            <div className="bg-slate-900 border-2 border-rose-500 p-8 rounded-3xl shadow-2xl flex items-center gap-6 animate-bounce">
              <AlertTriangle className="w-12 h-12 text-rose-500 animate-pulse" />
              <div>
                <div className="text-rose-400 font-black text-2xl mb-2">违反教科书操作规程！</div>
                <div className="text-slate-300 text-lg">
                  “实验时，应先接通电源，待打点稳定后，再释放小车。”
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 参数与控制区 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl">
        {/* 参数滑块 */}
        <div className="md:col-span-6 flex flex-col gap-8 justify-center">
          <div>
            <label className="flex justify-between items-center text-sm font-bold text-slate-300 mb-4">
              <span className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" /> 小车初速度 v₀ (m/s)
              </span>
              <span className="text-cyan-300 font-mono bg-black/60 px-3 py-1 rounded-lg border border-slate-700">
                {initialVelocity.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.01"
              value={initialVelocity}
              onChange={(e) => setInitialVelocity(Number(e.target.value))}
              disabled={isRunning || isPowered}
              className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.7)]"
            />
          </div>

          <div>
            <label className="flex justify-between items-center text-sm font-bold text-slate-300 mb-4">
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-400" /> 砝码牵引加速度 a (m/s²)
              </span>
              <span className="text-rose-300 font-mono bg-black/60 px-3 py-1 rounded-lg border border-slate-700">
                {acceleration.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.05"
              value={acceleration}
              onChange={(e) => setAcceleration(Number(e.target.value))}
              disabled={isRunning || isPowered}
              className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-rose-500 disabled:opacity-40
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(244,63,94,0.7)]"
            />
          </div>
        </div>

        {/* 分隔线 */}
        <div className="hidden md:block md:col-span-1 border-l border-slate-800" />

        {/* 操作按钮 */}
        <div className="md:col-span-5 flex flex-col justify-center gap-5">
          <div className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-1">
            <Plug className="w-4 h-4" /> 规范实验操作步骤：
          </div>

          <button
            onClick={() => setIsPowered(!isPowered)}
            disabled={isRunning || isFinished}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all duration-300 text-lg font-black border-2 disabled:opacity-50 ${
              isPowered
                ? 'bg-rose-900/40 text-rose-400 border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:border-slate-400'
            }`}
          >
            <Power className="w-6 h-6" />
            {isPowered ? '电源已接通（点击断开）' : '步骤一：接通电源'}
          </button>

          <div className="flex gap-4">
            <button
              onClick={handleRelease}
              disabled={isRunning || isFinished}
              className={`flex-[3] flex items-center justify-center gap-3 py-4 rounded-2xl transition-all duration-300 text-lg font-black disabled:opacity-50 border-2 ${
                isPowered
                  ? 'bg-indigo-600 border-indigo-400 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                  : 'bg-indigo-950/30 text-indigo-400/30 border-indigo-900/50 cursor-not-allowed'
              }`}
            >
              <Play className="w-6 h-6" />
              步骤二：释放小车
            </button>

            <button
              onClick={resetSim}
              className="flex-1 flex items-center justify-center p-4 bg-slate-800 text-slate-400 border-2 border-slate-600 rounded-2xl hover:text-white hover:bg-slate-700 hover:border-slate-400 transition-all"
              title="重装纸带，复位小车"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* 结果展示（仿真结束后显示） */}
      <div
        className={`transition-all duration-1000 overflow-hidden ${
          isFinished ? 'opacity-100 mt-8 max-h-[2000px]' : 'max-h-0 opacity-0'
        }`}
      >
        {/* 纸带读数视图 */}
        <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl mb-8 p-6 shadow-2xl">
          <div className="text-lg font-black text-indigo-400 flex items-center gap-2 mb-2">
            <ZoomIn className="w-6 h-6" /> 纸带读数视图（左右滑动刻度尺）
          </div>
          <div className="text-sm text-slate-400 mb-6 border-l-4 border-indigo-500 pl-3">
            教材提示：舍弃开头密集点迹，选取点迹清晰的点 0 为起点。每隔 4 个点取 1 个计数点，
            <strong>故相邻计数点时间间隔 T = 5 × 0.02s = 0.1s</strong>。
          </div>

          <div className="overflow-x-auto pb-4 cursor-ew-resize bg-[#020617] rounded-xl border border-slate-700 shadow-inner">
            {results.allPoints.length > 0 && (
              <svg
                width={(Math.ceil(results.allPoints[results.allPoints.length - 1]) + 3) * 50}
                height="190"
                className="min-w-full"
              >
                {/* 纸带 */}
                <rect x="0" y="30" width="100%" height="70" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />

                {/* 刻度尺背景 */}
                <rect x="0" y="120" width="100%" height="70" fill="#1e293b" />
                {renderTextbookRuler()}
                <text x="20" y="160" fill="#cbd5e1" fontSize="14" fontWeight="bold">
                  cm
                </text>

                {/* 打点标记 */}
                {results.allPoints.map((cm, i) => {
                  const px = (cm + 1) * 50;
                  const isCounting = i % 5 === 0;
                  return (
                    <g key={i}>
                      <circle cx={px} cy={65} r={isCounting ? 4 : 2} fill={isCounting ? '#0f172a' : '#64748b'} />
                      {isCounting && (
                        <text x={px} y={20} textAnchor="middle" fill="#4338ca" fontSize="16" fontWeight="bold">
                          {i / 5}
                        </text>
                      )}
                      {isCounting && (
                        <line x1={px} y1={75} x2={px} y2={120} stroke="#4338ca" strokeWidth="1" strokeDasharray="4 4" />
                      )}
                    </g>
                  );
                })}

                {/* 位移区间标注 */}
                {results.allPoints.map((cm, i) => {
                  if (i % 5 === 0 && i < 30) {
                    const pxStart = (cm + 1) * 50;
                    const pxEnd = (results.allPoints[i + 5] + 1) * 50;
                    const mid = (pxStart + pxEnd) / 2;
                    return (
                      <g key={`interval-${i}`}>
                        <line x1={pxStart} y1={90} x2={pxStart} y2={110} stroke="#ef4444" strokeWidth="1.5" />
                        <line x1={pxEnd} y1={90} x2={pxEnd} y2={110} stroke="#ef4444" strokeWidth="1.5" />
                        <line x1={pxStart} y1={100} x2={pxEnd} y2={100} stroke="#ef4444" strokeWidth="1.5" />
                        <text x={mid} y={90} textAnchor="middle" fill="#ef4444" fontSize="16" fontWeight="bold" fontStyle="italic">
                          x<tspan dy="5" fontSize="12">{i / 5 + 1}</tspan>
                        </text>
                      </g>
                    );
                  }
                  return null;
                })}
              </svg>
            )}
          </div>
        </div>

        {/* 数据处理板 */}
        <div className="border border-slate-700 rounded-3xl bg-slate-900 p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-xl font-black text-slate-200 flex items-center gap-2 mb-6">
            <Calculator className="w-6 h-6 text-indigo-400" /> 实验数据记录与推导计算
          </div>

          {/* 数据表格 */}
          <div className="overflow-x-auto pb-4 mb-8">
            <table className="w-full min-w-[700px] text-center text-base border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-300">
                  <th className="py-4 border border-slate-700 w-48 font-bold">计数点</th>
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <th key={i} className="py-4 border border-slate-700 font-mono text-lg">
                      {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#0f172a] text-slate-300 hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 border border-slate-700 font-bold text-left px-4">坐标 d (cm)</td>
                  {results.points.length > 0 ? (
                    results.points.map((p, i) => (
                      <td key={i} className="py-4 border border-slate-700 font-mono text-cyan-300">
                        {p}
                      </td>
                    ))
                  ) : (
                    <td colSpan="7" className="py-4 border border-slate-700 text-slate-500">
                      --
                    </td>
                  )}
                </tr>
                <tr className="bg-[#0f172a] text-slate-300 hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 border border-slate-700 font-bold text-left px-4">位移 xₙ (cm)</td>
                  <td className="py-4 border border-slate-700 text-slate-500">-</td>
                  {results.x_intervals.length > 0 ? (
                    results.x_intervals.map((x, i) => (
                      <td key={i} className="py-4 border border-slate-700 font-mono text-rose-400">
                        {`x${i + 1}`}
                        <br />
                        {x}
                      </td>
                    ))
                  ) : (
                    <td colSpan="6" className="py-4 border border-slate-700 text-slate-500">
                      --
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          {/* 计算卡片 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative shadow-inner">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 rounded-l-2xl"></div>
              <div className="text-base text-cyan-400 font-bold flex items-center gap-2 mb-4">
                瞬时速度计算（以点 2 为例）
              </div>
              <div className="text-slate-400 text-sm mb-4">
                依据：某段时间内的平均速度等于中间时刻的瞬时速度。
              </div>
              <div className="font-mono text-slate-200 text-lg leading-loose bg-[#020617] p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400">公式：</span>
                {`v₂ = (x₂ + x₃) / (2T)`}
                <br />
                <span className="text-slate-400">代入：</span>
                {`v₂ = (${results.x_intervals[1] || '?'} + ${results.x_intervals[2] || '?'}) × 10⁻² / (2 × 0.1)`}
                <br />
                <div className="text-cyan-400 text-2xl font-black mt-3 border-t border-slate-800 pt-3">
                  {`v₂ = ${results.v2} m/s`}
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative shadow-inner">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 rounded-l-2xl"></div>
              <div className="text-base text-rose-400 font-bold flex items-center gap-2 mb-4">
                逐差法求加速度 a
              </div>
              <div className="text-slate-400 text-sm mb-4">
                依据：将数据分为前后两组，利用 Δx = aT² 减小偶然误差。
              </div>
              <div className="font-mono text-slate-200 text-lg leading-loose bg-[#020617] p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400">公式：</span>
                {`a = [(x₄+x₅+x₆) - (x₁+x₂+x₃)] / (9T²)`}
                <br />
                <span className="text-slate-400">代入：</span>
                {`a = [(${results.x_intervals[3] || '?'}+${results.x_intervals[4] || '?'}+${results.x_intervals[5] || '?'}) - (${results.x_intervals[0] || '?'}+${results.x_intervals[1] || '?'}+${results.x_intervals[2] || '?'})] / (9 × 0.1²) × 10⁻²`}
                <br />
                <div className="text-rose-400 text-2xl font-black mt-3 border-t border-slate-800 pt-3">
                  {`a = ${results.a_calc} m/s²`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextbookTapeTimer;