'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Activity, Crosshair, Zap, Timer, FastForward, Target } from 'lucide-react';

const PhotogateSimulator = () => {
  const canvasRef = useRef(null);
  const liveVRef = useRef(null);
  const liveDtRef = useRef(null);

  const [bladeWidth, setBladeWidth] = useState(40);
  const [acceleration, setAcceleration] = useState(2.0);
  const [playbackRate, setPlaybackRate] = useState(0.1);

  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [beamBroken, setBeamBroken] = useState(false);

  const [results, setResults] = useState({
    vEnter: 0, vCenter: 0, vExit: 0, vAvg: 0, deltaT: 0, error: 0,
  });

  const reqRef = useRef(null);
  const playbackRateRef = useRef(playbackRate);
  const state = useRef({ x: 100, hasSettled: false, simTime: 0, lastFrameTime: 0 });

  const scale = 400;
  const startX = 100;
  const gateX = 600;
  const logicDistToGate = (gateX - startX) / scale;

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  const calculateTheory = useCallback(() => {
    const dLogic = bladeWidth / 1000;
    const distEnter = Math.max(0, logicDistToGate - dLogic / 2);
    const distCenter = logicDistToGate;
    const distExit = logicDistToGate + dLogic / 2;

    const tEnter = Math.sqrt((2 * distEnter) / acceleration);
    const tCenter = Math.sqrt((2 * distCenter) / acceleration);
    const tExit = Math.sqrt((2 * distExit) / acceleration);

    const vEnter = acceleration * tEnter;
    const vCenter = acceleration * tCenter;
    const vExit = acceleration * tExit;

    const deltaT = tExit - tEnter;
    const vAvg = deltaT > 0 ? dLogic / deltaT : 0;
    const err = vCenter > 0 ? Math.abs(vCenter - vAvg) / vCenter * 100 : 0;

    return { vEnter, vCenter, vExit, vAvg, deltaT, err, tEnter, tExit };
  }, [acceleration, bladeWidth, logicDistToGate]);

  const drawCanvas = useCallback((carX, isBroken) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, 800, 320);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 320);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(800, i);
      ctx.stroke();
    }

    ctx.fillStyle = '#1a2333';
    ctx.fillRect(20, 230, 760, 12);
    ctx.strokeStyle = '#2d3b4f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 230);
    ctx.lineTo(780, 230);
    ctx.stroke();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px "Courier New", monospace';
    for (let i = 60; i <= 740; i += 40) {
      const isMajor = (i - 100) % 200 === 0;
      ctx.fillRect(i, 242, 2, isMajor ? 12 : 6);
      if (isMajor && i >= 100) {
        ctx.fillText(((i - 100) / scale).toFixed(1) + 'm', i - 12, 270);
      }
    }

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(gateX - 25, 110, 50, 120);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(gateX - 15, 120, 30, 100);

    ctx.beginPath();
    ctx.arc(gateX, 100, 6, 0, Math.PI * 2);
    ctx.fillStyle = isBroken ? '#e11d48' : '#06b6d4';
    ctx.fill();

    if (!isBroken) {
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(gateX - 2, 110, 4, 110);
    } else {
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(gateX - 2, 110, 4, 25);
      ctx.fillRect(gateX - 2, 200, 4, 20);
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('PHOTOGATE', gateX - 45, 85);

    ctx.fillStyle = '#334155';
    ctx.fillRect(carX - 45, 195, 90, 25);
    ctx.fillStyle = '#475569';
    ctx.fillRect(carX - 35, 185, 70, 10);
    
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(carX - 25, 222, 7, 0, Math.PI * 2);
    ctx.arc(carX + 25, 222, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(carX - 25, 222, 3, 0, Math.PI * 2);
    ctx.arc(carX + 25, 222, 3, 0, Math.PI * 2);
    ctx.fill();

    const visualBladeWidth = (bladeWidth / 1000) * scale;
    ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
    ctx.fillRect(carX - visualBladeWidth / 2, 135, Math.max(visualBladeWidth, 2), 50);
  }, [bladeWidth]);

  const resetSim = useCallback(() => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    state.current = { x: startX, hasSettled: false, simTime: 0, lastFrameTime: 0 };
    setIsRunning(false);
    setIsFinished(false);
    setBeamBroken(false);

    if (liveVRef.current) liveVRef.current.innerText = '0.000000';
    if (liveDtRef.current) liveDtRef.current.innerText = '0.000000';

    const theory = calculateTheory();
    setResults({
      vEnter: theory.vEnter, vCenter: theory.vCenter, vExit: theory.vExit,
      vAvg: 0, deltaT: 0, error: 0,
    });
    drawCanvas(startX, false);
  }, [calculateTheory, drawCanvas]);

  useEffect(() => {
    resetSim();
  }, [resetSim]);

  const startSimulation = () => {
    setIsRunning(true);
    setBeamBroken(false);
    const theory = calculateTheory();

    state.current.simTime = 0;
    state.current.lastFrameTime = performance.now();

    const update = (now) => {
      const dt = (now - state.current.lastFrameTime) / 1000;
      state.current.lastFrameTime = now;
      state.current.simTime += dt * playbackRateRef.current;

      const time = state.current.simTime;
      const currentX = startX + 0.5 * acceleration * time * time * scale;
      state.current.x = currentX;

      if (liveVRef.current) liveVRef.current.innerText = (acceleration * time).toFixed(6);

      const currentlyBroken = time >= theory.tEnter && time <= theory.tExit;

      setBeamBroken((prev) => {
        if (prev !== currentlyBroken) return currentlyBroken;
        return prev;
      });

      if (currentlyBroken && liveDtRef.current) {
        liveDtRef.current.innerText = (time - theory.tEnter).toFixed(6);
      } else if (time > theory.tExit && !state.current.hasSettled) {
        if (liveDtRef.current) liveDtRef.current.innerText = theory.deltaT.toFixed(6);
        setResults((prev) => ({
          ...prev, vAvg: theory.vAvg, deltaT: theory.deltaT, error: theory.err
        }));
        state.current.hasSettled = true;
      }

      drawCanvas(currentX, currentlyBroken);

      if (time > theory.tExit + 0.5 || currentX > 850) {
        setIsRunning(false);
        setIsFinished(true);
        return;
      }
      reqRef.current = requestAnimationFrame(update);
    };
    reqRef.current = requestAnimationFrame(update);
  };

  return (
    <div className="w-full my-12 p-6 md:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] font-sans text-slate-200 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-700/50 pb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-600/20 flex items-center justify-center border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)] backdrop-blur-sm shrink-0">
            <Target className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-rose-400 to-orange-300 drop-shadow-[0_2px_10px_rgba(244,63,94,0.3)]">
              单光电门：极限思想测速推演
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-[0.3em] font-mono mt-2">
              v_avg (d/Δt) <span className="text-rose-400 mx-1">≠</span> v_center (真值)
            </p>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">系统状态</div>
          <div className={`text-sm font-mono mt-1 ${isRunning ? 'text-emerald-400' : isFinished ? 'text-orange-400' : 'text-slate-400'}`}>
            {isRunning ? '模拟运行中...' : isFinished ? '数据已定格' : '待机准备'}
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10 mb-10">
        <div className="col-span-1 xl:col-span-4 flex flex-col gap-6">
          <div className="p-6 bg-slate-900/70 border border-slate-700/50 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl space-y-7">
            <div>
              <label className="flex justify-between items-center text-xs font-bold text-slate-300 mb-4">
                <span className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-rose-400" />
                  挡光片宽度
                </span>
                <span className="text-rose-300 font-mono text-sm bg-black/50 px-3 py-1 rounded-lg border border-rose-500/20 shadow-inner">
                  {bladeWidth.toFixed(1)} mm
                </span>
              </label>
              <input
                type="range"
                min="2"
                max="150"
                step="1"
                value={bladeWidth}
                onChange={(e) => setBladeWidth(Number(e.target.value))}
                disabled={isRunning}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-rose-500 disabled:opacity-40
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(244,63,94,0.7)]"
              />
            </div>

            <div>
              <label className="flex justify-between items-center text-xs font-bold text-slate-300 mb-4">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  小车加速度
                </span>
                <span className="text-cyan-300 font-mono text-sm bg-black/50 px-3 py-1 rounded-lg border border-cyan-500/20 shadow-inner">
                  {acceleration.toFixed(1)} m/s²
                </span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={acceleration}
                onChange={(e) => setAcceleration(Number(e.target.value))}
                disabled={isRunning}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.7)]"
              />
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <label className="flex justify-between items-center text-xs font-bold text-slate-300 mb-4">
                <span className="flex items-center gap-2">
                  <FastForward className="w-4 h-4 text-purple-400" />
                  物理时间流速
                </span>
                <span className="text-purple-300 font-mono text-sm bg-black/50 px-3 py-1 rounded-lg border border-purple-500/20 shadow-inner">
                  {playbackRate.toFixed(2)}x
                </span>
              </label>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-purple-400
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(168,85,247,0.7)]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={startSimulation}
                disabled={isRunning || isFinished}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-rose-600/30 to-rose-500/20 text-rose-200 border border-rose-500/40 rounded-2xl hover:from-rose-500/40 hover:to-rose-400/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all duration-300 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none backdrop-blur-sm"
              >
                <Play className="w-5 h-5" />
                释放小车
              </button>
              <button
                onClick={resetSim}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-800/80 text-slate-300 border border-slate-700 rounded-2xl hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all duration-300 text-sm font-bold backdrop-blur-sm"
              >
                <RotateCcw className="w-5 h-5" />
                极板归位
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 xl:col-span-8 bg-gradient-to-b from-[#0a0f1e] to-[#050810] rounded-3xl border border-slate-700/50 p-3 relative shadow-[inset_0_4px_30px_rgba(0,0,0,0.7),0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-between backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 mix-blend-overlay z-0" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(255,255,255,0.05) 50%)', backgroundSize: '100% 4px' }} />
          <canvas ref={canvasRef} width={800} height={320} className="w-full h-auto rounded-2xl block relative z-10" />

          <div className="relative z-10 px-4 sm:px-6 py-4 bg-black/70 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-2 backdrop-blur-xl rounded-b-2xl">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-emerald-400 flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">传感器</span>实时速度
            </span>
            <span className="text-xl sm:text-3xl font-mono font-black text-emerald-300 tracking-wider tabular-nums drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
              <span ref={liveVRef}>0.000000</span>
              <span className="text-sm sm:text-base text-emerald-500 ml-2">m/s</span>
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-slate-900/70 border border-slate-700/50 rounded-3xl p-5 sm:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
        <div className="text-xs font-bold tracking-[0.2em] text-slate-400 mb-6 uppercase flex items-center gap-3 border-b border-slate-700/50 pb-4">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          三点瞬时对比 VS 遮光平均速度
        </div>

        {/* 关键修改区：调整断点，在 1280px 以下强制保持双列以预留宽度，调整内边距和字号，启用 tracking-tighter 收缩字间距 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <div className="group relative z-10 bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-2xl p-4 xl:p-6 flex flex-col items-center text-center transition-all duration-300 hover:border-slate-500/50 hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.5)] w-full overflow-hidden">
            <span className="text-[11px] text-slate-400 mb-3 font-bold tracking-wider relative z-10">① 入光瞬时</span>
            <span className="text-2xl 2xl:text-3xl font-mono font-bold text-slate-200 mb-1 tabular-nums tracking-tighter relative z-10">{results.vEnter.toFixed(6)}</span>
            <span className="text-[10px] text-slate-500 font-mono relative z-10">v_enter</span>
          </div>

          <div className="relative z-10 bg-gradient-to-b from-rose-500/10 to-rose-900/10 border border-rose-500/30 rounded-2xl p-4 xl:p-6 flex flex-col items-center text-center overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-all duration-300 hover:border-rose-400/50 w-full">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 blur-2xl rounded-full pointer-events-none z-0" />
            <span className="text-[11px] text-rose-300 mb-3 font-bold tracking-wider relative z-10">⏱ 遮光平均速度</span>
            <span className={`text-2xl 2xl:text-3xl font-mono font-black mb-1 tabular-nums tracking-tighter relative z-10 ${results.vAvg > 0 ? 'text-rose-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]' : beamBroken ? 'text-rose-300 animate-pulse' : 'text-slate-600'}`}>
              {results.vAvg > 0 ? results.vAvg.toFixed(6) : (beamBroken ? (bladeWidth / 1000 / Math.max(parseFloat(liveDtRef.current?.innerText || 0), 0.000001)).toFixed(6) : '0.000000')}
            </span>
            <span className="text-[11px] text-rose-300/70 font-mono flex items-center gap-1.5 font-bold relative z-10">
              <Timer className="w-3.5 h-3.5" />
              Δt = <span ref={liveDtRef}>0.000000</span> s
            </span>
          </div>

          <div className="relative z-10 bg-gradient-to-b from-cyan-500/10 to-cyan-900/10 border border-cyan-500/30 rounded-2xl p-4 xl:p-6 flex flex-col items-center text-center overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all duration-300 hover:border-cyan-400/50 w-full">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none z-0" />
            <span className="text-[11px] text-cyan-300 mb-3 font-bold tracking-wider relative z-10">🎯 位移中点瞬时</span>
            <span className="text-2xl 2xl:text-3xl font-mono font-black text-cyan-300 mb-1 tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] relative z-10">{results.vCenter.toFixed(6)}</span>
            <span className="text-[10px] text-cyan-400/70 font-mono font-bold relative z-10">v_center (真值)</span>
          </div>

          <div className="group relative z-10 bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-2xl p-4 xl:p-6 flex flex-col items-center text-center transition-all duration-300 hover:border-slate-500/50 hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.5)] w-full overflow-hidden">
            <span className="text-[11px] text-slate-400 mb-3 font-bold tracking-wider relative z-10">③ 出光瞬时</span>
            <span className="text-2xl 2xl:text-3xl font-mono font-bold text-slate-200 mb-1 tabular-nums tracking-tighter relative z-10">{results.vExit.toFixed(6)}</span>
            <span className="text-[10px] text-slate-500 font-mono relative z-10">v_exit</span>
          </div>
        </div>

        {results.error > 0 && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 sm:px-6 py-4 w-full">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
              <span className="text-[11px] sm:text-sm text-slate-300">
                平均与靶心速度系统误差：
                <span className="font-mono font-bold text-orange-300 ml-2">{results.error.toFixed(4)}%</span>
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 sm:ml-auto">挡光片宽度越窄，极限越逼近真值</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotogateSimulator;