 'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ============================================================================
   工具函数
============================================================================ */
const hsl = (h, s, l, a = 1) => `hsla(${h}, ${s}%, ${l}%, ${a})`;

// 通用滑块组件
const Slider = ({ label, value, onChange, min, max, step = 1, unit = '' }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-cyan-400 font-mono font-bold">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-gray-850 rounded-lg appearance-none cursor-pointer accent-cyan-400"
    />
  </div>
);

/* ============================================================================
   视图组件 A: 2D 截面画布（高性能历史缓冲区版）
============================================================================ */
const Canvas2DView = ({ Ex, Ey, phaseDiff, randomNoise }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 500, h: 500 });
  const trailRef = useRef([]);

  useEffect(() => {
    trailRef.current = [];
  }, [Ex, Ey, phaseDiff]);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width } = container.getBoundingClientRect();
    const size = Math.min(width, 500);
    sizeRef.current = { w: size, h: size };
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const render = () => {
      const { w, h } = sizeRef.current;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) * 0.35;

      timeRef.current += 0.04;
      const t = timeRef.current;

      const noiseFactor = randomNoise > 0 ? (Math.sin(t * 37.5 + 1.2) * 0.5 + 0.5) * randomNoise : 0;
      const ampX = Ex * (randomNoise > 0 ? 1 + noiseFactor * 0.4 : 1);
      const ampY = Ey * (randomNoise > 0 ? 1 + (Math.cos(t * 53.1 + 2.3) * 0.5 + 0.5) * randomNoise * 0.4 : 1);
      const phase = (phaseDiff + noiseFactor * 180) * Math.PI / 180;

      const curX = ampX * Math.cos(t);
      const curY = ampY * Math.cos(t + phase);
      const xPix = cx + curX * scale;
      const yPix = cy - curY * scale;

      trailRef.current.push({ x: xPix, y: yPix });
      if (trailRef.current.length > 100) {
        trailRef.current.shift();
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - Ex * scale, cy - Ey * scale, Ex * scale * 2, Ey * scale * 2);

      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const idealPhase = (phaseDiff * Math.PI) / 180;
      for (let ang = 0; ang <= Math.PI * 2 + 0.1; ang += 0.05) {
        const ix = cx + Ex * Math.cos(ang) * scale;
        const iy = cy - Ey * Math.cos(ang + idealPhase) * scale;
        if (ang === 0) ctx.moveTo(ix, iy); else ctx.lineTo(ix, iy);
      }
      ctx.stroke();

      const len = trailRef.current.length;
      if (len > 1) {
        ctx.lineWidth = 2.5;
        for (let i = 0; i < len - 1; i++) {
          const p1 = trailRef.current[i];
          const p2 = trailRef.current[i + 1];
          const alpha = (i / len) * 0.9;
          ctx.strokeStyle = hsl(190, 95, 60, alpha);
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }
      }

      ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(xPix, cy); ctx.stroke();

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, yPix); ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(xPix, cy); ctx.lineTo(xPix, yPix);
      ctx.moveTo(cx, yPix); ctx.lineTo(xPix, yPix);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(xPix, yPix); ctx.stroke();

      ctx.fillStyle = hsl(190, 100, 70);
      ctx.shadowBlur = 12; ctx.shadowColor = hsl(190, 100, 70);
      ctx.beginPath(); ctx.arc(xPix, yPix, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [Ex, Ey, phaseDiff, randomNoise, updateSize]);

  return (
    <div ref={containerRef} className="relative w-full max-w-[500px] mx-auto aspect-square">
      <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
      <div className="relative bg-[#050505] rounded-xl p-2 shadow-2xl border border-white/10 h-full">
        <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 font-mono text-xs font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">E_x</span>
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-emerald-400 font-mono text-xs font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">E_y</span>
        <div className="absolute top-4 left-4 px-2 py-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded text-[10px] text-gray-300 font-mono">
          2D 截面投影波形
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   视图组件 B: 3D 空间画布（全功能虚拟光屏接收器）
============================================================================ */
const Canvas3DView = ({ Ex, Ey, phaseDiff, randomNoise }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 600, h: 500 });
  const anglesRef = useRef({ x: -0.3, y: -0.5 });
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const project = useCallback((x, y, z, w, h) => {
    const { x: ax, y: ay } = anglesRef.current;
    const cosX = Math.cos(ax), sinX = Math.sin(ax);
    const cosY = Math.cos(ay), sinY = Math.sin(ay);
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    let x2 = x * cosY + z1 * sinY;
    let z2 = -x * sinY + z1 * cosY;
    const fov = 600, dist = 550;
    const factor = fov / (dist + z2);
    return { x: w / 2 + x2 * factor, y: h / 2 - y1 * factor, depth: z2 };
  }, []);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = Math.min(width * 0.83, 500);
    sizeRef.current = { w: width, h: height };
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const render = () => {
      const { w, h } = sizeRef.current;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#03050a';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }

      const zStart = -200, zEnd = 200, zStep = 4;
      const scale = Math.min(w, h) * 0.12;

      const maxAmp = Math.max(Ex, Ey, 1.2) * 1.5 * scale;
      const pTL = project(-maxAmp, maxAmp, zEnd, w, h);
      const pTR = project(maxAmp, maxAmp, zEnd, w, h);
      const pBR = project(maxAmp, -maxAmp, zEnd, w, h);
      const pBL = project(-maxAmp, -maxAmp, zEnd, w, h);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.beginPath();
      ctx.moveTo(pTL.x, pTL.y); ctx.lineTo(pTR.x, pTR.y);
      ctx.lineTo(pBR.x, pBR.y); ctx.lineTo(pBL.x, pBL.y);
      ctx.closePath(); ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1; ctx.stroke();

      const pX1 = project(-maxAmp, 0, zEnd, w, h); const pX2 = project(maxAmp, 0, zEnd, w, h);
      const pY1 = project(0, -maxAmp, zEnd, w, h); const pY2 = project(0, maxAmp, zEnd, w, h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath(); ctx.moveTo(pX1.x, pX1.y); ctx.lineTo(pX2.x, pX2.y); ctx.moveTo(pY1.x, pY1.y); ctx.lineTo(pY2.x, pY2.y); ctx.stroke();

      const pStart = project(0, 0, zStart, w, h);
      const pEnd = project(0, 0, zEnd + 50, w, h);
      ctx.beginPath(); ctx.moveTo(pStart.x, pStart.y); ctx.lineTo(pEnd.x, pEnd.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();

      timeRef.current += 0.04;
      const t = timeRef.current;

      const helixPoints = [];
      let prevX = null, prevY = null, prevComp = null;

      for (let z = zStart; z <= zEnd; z += zStep) {
        const kZ = (z - zStart) * 0.055;
        const currentPhase = t - kZ;
        const noise = randomNoise > 0 ? (Math.sin(currentPhase * 12) - 0.5) * randomNoise : 0;
        const ph = (phaseDiff + noise * 180) * Math.PI / 180;
        
        const xVal = Ex * Math.cos(currentPhase) * scale;
        const yVal = Ey * Math.cos(currentPhase + ph) * scale;

        const ptX = project(xVal, 0, z, w, h);
        const ptY = project(0, yVal, z, w, h);
        const ptComp = project(xVal, yVal, z, w, h);

        helixPoints.push({ z, x: xVal, y: yVal, ptX, ptY, ptComp });

        if (prevX) {
          ctx.beginPath(); ctx.moveTo(prevX.x, prevX.y); ctx.lineTo(ptX.x, ptX.y);
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        if (prevY) {
          ctx.beginPath(); ctx.moveTo(prevY.x, prevY.y); ctx.lineTo(ptY.x, ptY.y);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        if (prevComp) {
          ctx.beginPath(); ctx.moveTo(prevComp.x, prevComp.y); ctx.lineTo(ptComp.x, ptComp.y);
          ctx.strokeStyle = hsl(190, 90, 65, 0.85); ctx.lineWidth = 2.5; ctx.stroke();
        }
        prevX = ptX; prevY = ptY; prevComp = ptComp;
      }

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      const idealPhase = (phaseDiff * Math.PI) / 180;
      for (let ang = 0; ang <= Math.PI * 2 + 0.1; ang += 0.08) {
        const ix = Ex * Math.cos(ang) * scale;
        const iy = Ey * Math.cos(ang + idealPhase) * scale;
        const pt = project(ix, iy, zEnd, w, h);
        if (ang === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      const glideZ = zStart + ((t * 22) % (zEnd - zStart));
      let closest = helixPoints[0];
      let minDist = Math.abs(glideZ - closest.z);
      for (const pt of helixPoints) {
        const dist = Math.abs(glideZ - pt.z);
        if (dist < minDist) { minDist = dist; closest = pt; }
      }
      const vecCenter = project(0, 0, closest.z, w, h);
      const vecTip = project(closest.x, closest.y, closest.z, w, h);
      ctx.beginPath(); ctx.moveTo(vecCenter.x, vecCenter.y); ctx.lineTo(vecTip.x, vecTip.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(vecTip.x, vecTip.y, 4, 0, Math.PI * 2); ctx.fill();

      const endPt = helixPoints[helixPoints.length - 1];
      if (endPt) {
        const scrCenter = project(0, 0, zEnd, w, h);
        ctx.beginPath(); ctx.moveTo(scrCenter.x, scrCenter.y); ctx.lineTo(endPt.ptComp.x, endPt.ptComp.y);
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2.5; ctx.stroke(); 

        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee';
        ctx.beginPath(); ctx.arc(endPt.ptComp.x, endPt.ptComp.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px monospace';
      ctx.fillText('模拟接收屏', pTR.x + 8, pTR.y + 12);

      ctx.restore();
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [Ex, Ey, phaseDiff, randomNoise, project, updateSize]);

  const handleMouseDown = (e) => { dragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    anglesRef.current.y += (e.clientX - lastMouse.current.x) * 0.007;
    anglesRef.current.x += (e.clientY - lastMouse.current.y) * 0.007;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => { dragging.current = false; };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const handleTouchMove = (e) => {
    if (!dragging.current || e.touches.length !== 1) return;
    anglesRef.current.y += (e.touches[0].clientX - lastMouse.current.x) * 0.008;
    anglesRef.current.x += (e.touches[0].clientY - lastMouse.current.y) * 0.008;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[600px] mx-auto cursor-grab active:cursor-grabbing select-none h-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl"></div>
      <div className="relative bg-[#03050a] rounded-xl p-2 shadow-2xl border border-white/10 h-full">
        <canvas ref={canvasRef} className="w-full h-full block rounded-lg" />
        <div className="absolute top-4 left-4 px-2 py-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded text-[10px] text-gray-300 font-mono">
          🖱️ 鼠标拖拽 / 📱 触屏手势 旋转全景
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   模块 3: 偏振光调制与制备系统
============================================================================ */
const EllipticalPolarizationLab = () => {
  const [experimentPath, setExperimentPath] = useState('linear-path');
  const [inputAngle, setInputAngle] = useState(30);
  const [waveplatePhase, setWaveplatePhase] = useState(90);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const timeRef = useRef(0);
  const animRef = useRef(null);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = Math.min(width * 0.52, 400);
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      timeRef.current += 0.05;
      const t = timeRef.current;
      ctx.clearRect(0, 0, w, h);

      const posSource = w * 0.15;
      const posPolarizer = w * 0.38;
      const posWaveplate = w * 0.62;
      const posDetector = w * 0.85;
      const cy = h / 2;

      const alphaRad = (inputAngle * Math.PI) / 180;
      const delayRad = (waveplatePhase * Math.PI) / 180;

      let eInputX = 0, eInputY = 0, eMidX = 0, eMidY = 0, eOutX = 0, eOutY = 0;

      if (experimentPath === 'linear-path') {
        eInputX = Math.cos(alphaRad) * Math.cos(t);
        eInputY = Math.sin(alphaRad) * Math.cos(t);
        eMidX = eInputX; eMidY = eInputY;
        eOutX = Math.cos(alphaRad) * Math.cos(t - delayRad);
        eOutY = Math.sin(alphaRad) * Math.cos(t);
      } else {
        const randX = Math.sin(t * 1.9) * 1.5;
        const randY = Math.cos(t * 2.5) * 1.5;
        eInputX = 0.7 * Math.cos(t + randX);
        eInputY = 0.7 * Math.cos(t + randY);
        const cosA = Math.cos(alphaRad), sinA = Math.sin(alphaRad);
        const midAmp = eInputX * cosA + eInputY * sinA;
        eMidX = midAmp * cosA;
        eMidY = midAmp * sinA;
        eOutX = Math.cos(alphaRad) * 0.9 * Math.cos(t - delayRad);
        eOutY = Math.sin(alphaRad) * 0.9 * Math.cos(t);
      }

      const drawSpot = (x, y, ex, ey, color, label, showTrajectory = false, ampX = 1, ampY = 1, phase = 0) => {
        const r = 38;
        ctx.fillStyle = 'rgba(9, 13, 24, 0.9)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();

        if (showTrajectory) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(34,211,238,0.3)'; ctx.lineWidth = 1.5;
          for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
            const tx = ampX * Math.cos(angle - phase) * r;
            const ty = ampY * Math.cos(angle) * r;
            if (angle === 0) ctx.moveTo(x + tx, y - ty); else ctx.lineTo(x + tx, y - ty);
          }
          ctx.closePath(); ctx.stroke();
        }

        ctx.strokeStyle = color; ctx.lineWidth = 2.5;
        ctx.shadowBlur = 8; ctx.shadowColor = color;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ex * r, y - ey * r); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + ex * r, y - ey * r, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(156, 163, 175, 0.9)'; ctx.font = '11px monospace'; ctx.fillText(label, x - 35, y + r + 18);
      };

      drawSpot(posSource, cy, eInputX, eInputY, experimentPath === 'linear-path' ? '#f43f5e' : '#64748b',
        experimentPath === 'linear-path' ? '1. 入射线偏振' : '1. 入射自然光');

      if (experimentPath === 'natural-path') {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
        ctx.strokeRect(posPolarizer - 10, cy - 50, 20, 100);
        drawSpot(posPolarizer, cy, eMidX, eMidY, '#e11d48', '2. 起偏线性光');
      }

      ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2;
      ctx.strokeRect(posWaveplate - 12, cy - 55, 24, 110);
      ctx.fillStyle = 'rgba(234,179,8,0.1)'; ctx.fillRect(posWaveplate - 12, cy - 55, 24, 110);

      const ampX = Math.cos(alphaRad), ampY = Math.sin(alphaRad);
      drawSpot(posDetector, cy, eOutX, eOutY, '#38bdf8', '3. 合成出射偏振', true, ampX, ampY, delayRad);

      ctx.restore();
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [experimentPath, inputAngle, waveplatePhase, updateSize]);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 border-b border-white/10 pb-4 gap-4">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">波片变换与椭圆偏振制备</h3>
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          <button onClick={() => { setExperimentPath('linear-path'); setInputAngle(30); }} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${experimentPath === 'linear-path' ? 'bg-sky-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>偏振调制系统</button>
          <button onClick={() => { setExperimentPath('natural-path'); setInputAngle(45); }} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${experimentPath === 'natural-path' ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>双级起偏系统</button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-4/12 space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-6">
            <Slider label={experimentPath === 'linear-path' ? '入射偏振面角度 (α)' : '偏振片透光轴角度 (α)'} value={inputAngle} onChange={setInputAngle} min={1} max={89} unit="°" />
            <Slider label="波片相位延迟量 (Δφ)" value={waveplatePhase} onChange={setWaveplatePhase} min={0} max={180} unit="°" />
          </div>
        </div>
        <div ref={containerRef} className="w-full lg:w-8/12 bg-[#05070f] border border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} className="w-full block" />
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   模块 4: 晶体双折射效应模拟器 (重构优化版，清晰区分 o光 和 e光)
============================================================================ */
const BirefringenceSimulator = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [incidentAngle, setIncidentAngle] = useState(15);
  const [opticAxisAngle, setOpticAxisAngle] = useState(40);
  const [polAngle, setPolAngle] = useState(45);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = Math.min(width * 0.58, 450);
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      
      const cx = w / 2, sy = h * 0.3, by = h * 0.85;

      const iRad = (incidentAngle * Math.PI) / 180;
      const aRad = (opticAxisAngle * Math.PI) / 180;
      const pRad = (polAngle * Math.PI) / 180;
      
      const iE = Math.pow(Math.cos(pRad), 2);
      const iO = Math.pow(Math.sin(pRad), 2);
      
      // 为了视觉表现，人为放大折射率差异造成的劈裂角
      const no = 1.658, ne = 1.486;
      const to = Math.asin(Math.sin(iRad) / no);
      // 放大劈裂倍数，确保在小画布上清晰可见
      const splitExaggeration = 2.5; 
      const te = to + (no - ne) * splitExaggeration * Math.sin(2 * (to - aRad));

      // 绘制晶体
      const crystalWidth = w * 0.7;
      const grad = ctx.createLinearGradient(cx - crystalWidth/2, sy, cx + crystalWidth/2, by);
      grad.addColorStop(0, 'rgba(30, 41, 59, 0.8)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - crystalWidth/2, sy, crystalWidth, by - sy);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - crystalWidth/2, sy, crystalWidth, by - sy);

      // 绘制光轴辅助线
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
      for (let offset = -w*0.35; offset <= w*0.35; offset += 60) {
        ctx.moveTo(cx + offset - 80 * Math.sin(aRad), sy);
        ctx.lineTo(cx + offset + (by - sy) * Math.tan(aRad) + 80 * Math.sin(aRad), by);
      }
      ctx.stroke();
      ctx.restore();

      // 入射光
      const inX = cx - 140 * Math.sin(iRad), inY = sy - 140 * Math.cos(iRad);
      ctx.beginPath(); ctx.moveTo(inX, inY); ctx.lineTo(cx, sy);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; 
      ctx.shadowBlur = 8; ctx.shadowColor = '#ffffff';
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#ffffff'; ctx.font = '12px sans-serif';
      ctx.fillText(`线偏振入射光`, inX - 20, inY - 10);

      const lenCrystal = by - sy;
      
      // --- o光 (寻常光) 渲染 ---
      const oX = cx + lenCrystal * Math.tan(to);
      const alphaO = Math.max(iO, 0.2); // 保证底色可见
      ctx.beginPath(); ctx.moveTo(cx, sy); ctx.lineTo(oX, by);
      ctx.strokeStyle = `rgba(56, 189, 248, ${alphaO})`; ctx.lineWidth = 3; 
      ctx.shadowBlur = iO > 0.1 ? 10 : 0; ctx.shadowColor = '#38bdf8';
      ctx.stroke(); ctx.shadowBlur = 0;

      // o光 出射
      ctx.beginPath(); ctx.moveTo(oX, by); ctx.lineTo(oX + 50 * Math.sin(iRad), by + 50 * Math.cos(iRad));
      ctx.strokeStyle = `rgba(56, 189, 248, ${alphaO})`; ctx.stroke();

      // o光 振动方向标识 (垂直屏幕向外 - 画圆点)
      ctx.fillStyle = `rgba(56, 189, 248, ${alphaO})`;
      for (let r = 0.2; r <= 0.8; r += 0.2) {
        const dotX = cx + r * (oX - cx);
        const dotY = sy + r * (by - sy);
        ctx.beginPath(); ctx.arc(dotX, dotY, 2.5, 0, Math.PI*2); ctx.fill();
      }

      // --- e光 (非常光) 渲染 ---
      const eX = cx + lenCrystal * Math.tan(te);
      const alphaE = Math.max(iE, 0.2); // 保证底色可见
      ctx.beginPath(); ctx.moveTo(cx, sy); ctx.lineTo(eX, by);
      ctx.strokeStyle = `rgba(244, 63, 94, ${alphaE})`; ctx.lineWidth = 3; 
      ctx.shadowBlur = iE > 0.1 ? 10 : 0; ctx.shadowColor = '#f43f5e';
      ctx.stroke(); ctx.shadowBlur = 0;

      // e光 出射
      ctx.beginPath(); ctx.moveTo(eX, by); ctx.lineTo(eX + 50 * Math.sin(iRad), by + 50 * Math.cos(iRad));
      ctx.strokeStyle = `rgba(244, 63, 94, ${alphaE})`; ctx.stroke();

      // e光 振动方向标识 (主截面内振动 - 画垂直于射线的短横线)
      ctx.strokeStyle = `rgba(244, 63, 94, ${alphaE})`; ctx.lineWidth = 2;
      const angleE = Math.atan2(by - sy, eX - cx);
      for (let r = 0.2; r <= 0.8; r += 0.2) {
        const crossX = cx + r * (eX - cx);
        const crossY = sy + r * (by - sy);
        const dx = 6 * Math.sin(angleE);
        const dy = 6 * Math.cos(angleE);
        ctx.beginPath(); ctx.moveTo(crossX - dx, crossY + dy); ctx.lineTo(crossX + dx, crossY - dy); ctx.stroke();
      }

      // 文本信息标签
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`o光(寻常光): ${(iO * 100).toFixed(0)}%`, oX - 45, by + 55);
      
      ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`e光(非常光): ${(iE * 100).toFixed(0)}%`, eX - 45, by + 75);

      ctx.restore();
    };
    draw();
  }, [incidentAngle, opticAxisAngle, polAngle, updateSize]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      <div className="w-full lg:w-4/12 space-y-6">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">双折射与晶体分束模拟</h3>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-5">
          <Slider label="入射光偏振角 (α)" value={polAngle} onChange={setPolAngle} min={0} max={90} unit="°" />
          <Slider label="光束入射角 (θi)" value={incidentAngle} onChange={setIncidentAngle} min={0} max={60} unit="°" />
          <Slider label="晶体光轴夹角" value={opticAxisAngle} onChange={setOpticAxisAngle} min={0} max={90} unit="°" />
        </div>
        <div className="text-sm text-gray-300 bg-white/5 p-4 rounded-xl border border-white/10 leading-relaxed shadow-inner">
          <strong>物理要点：</strong>线偏振光入射至各向异性晶体时，将分解为振动方向相互垂直的 <span className="text-sky-400 font-bold">o光(圆点标示)</span> 与 <span className="text-rose-400 font-bold">e光(短线标示)</span>。界面几何偏折已作适度放大处理以便于观察。
        </div>
      </div>
      <div ref={containerRef} className="w-full lg:w-8/12 bg-[#0a0f1c] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} className="w-full block" />
      </div>
    </div>
  );
};

/* ============================================================================
   模块 5: 偏振态实验检验仪（修复报错并优化 UI 表现）
============================================================================ */
const PolarizationInspector = () => {
  const [sourceType, setSourceType] = useState('natural');
  const [polAngle, setPolAngle] = useState(0);
  const [hasWaveplate, setHasWaveplate] = useState(false);
  const [wpAngle, setWpAngle] = useState(0);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const stokesParams = {
    'natural':    [1, 0, 0, 0],
    'circular':   [1, 0, 0, 1],
    'linear':     [1, 1, 0, 0],
    'elliptical': [1, 0.6, 0, 0.7],
    'partial':    [1, 0.5, 0, 0]
  };

  const getIntensity = (theta_p, has_wp, theta_w) => {
    let S = stokesParams[sourceType];
    let S0 = S[0], S1 = S[1], S2 = S[2], S3 = S[3];
    if (has_wp) {
      const tw = theta_w * Math.PI / 180;
      const Cw = Math.cos(2 * tw), Sw = Math.sin(2 * tw);
      const nS1 = S1 * Cw * Cw + S2 * Cw * Sw - S3 * Sw;
      const nS2 = S1 * Cw * Sw + S2 * Sw * Sw + S3 * Cw;
      S1 = nS1; S2 = nS2;
    }
    const tp = theta_p * Math.PI / 180;
    const Cp = Math.cos(2 * tp), Sp = Math.sin(2 * tp);
    return 0.5 * (S0 + S1 * Cp + S2 * Sp);
  };

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = Math.min(width * 0.72, 420);
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.55, cy = h / 2;
      const radius = Math.min(w, h) * 0.38;

      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
      for (let r = 0.25; r <= 1; r += 0.25) {
        ctx.beginPath(); ctx.arc(cx, cy, radius * r, 0, Math.PI * 2); ctx.stroke();
      }
      
      // 修复了原来这里的 stroke() 报错问题
      ctx.beginPath(); ctx.moveTo(cx - radius - 15, cy); ctx.lineTo(cx + radius + 15, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - radius - 15); ctx.lineTo(cx, cy + radius + 15); ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px monospace';
      ctx.fillText('0°', cx + radius + 5, cy + 4);
      ctx.fillText('180°', cx - radius - 28, cy + 4);
      ctx.fillText('90°', cx - 10, cy - radius - 8);
      ctx.fillText('270°', cx - 12, cy + radius + 15);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
      ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
      ctx.lineWidth = 2.5;
      for (let angle = 0; angle <= 360; angle++) {
        const I = getIntensity(angle, hasWaveplate, wpAngle);
        const rad = angle * Math.PI / 180;
        const x = cx + I * radius * Math.cos(rad);
        const y = cy - I * radius * Math.sin(rad);
        if (angle === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill(); 
      ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee';
      ctx.stroke(); ctx.shadowBlur = 0;

      const currentI = getIntensity(polAngle, hasWaveplate, wpAngle);
      const pRad = polAngle * Math.PI / 180;
      const px = cx + currentI * radius * Math.cos(pRad);
      const py = cy - currentI * radius * Math.sin(pRad);

      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.moveTo(cx - radius * Math.cos(pRad), cy + radius * Math.sin(pRad)); ctx.lineTo(px, py); ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px font-mono, monospace';
      ctx.fillText(`透射探测率: ${(currentI * 100).toFixed(1)}%`, 20, 45);
      if (currentI < 0.005) {
        ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('🔴 测定状态: 彻底消光', 20, 75);
      }

      ctx.restore();
    };
    draw();
  }, [sourceType, polAngle, hasWaveplate, wpAngle, updateSize]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      <div className="w-full lg:w-5/12 space-y-5">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">光偏振态检验判定仪</h3>
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-6 shadow-lg">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">步骤 0: 设定待测盲盒光源</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg p-2.5 outline-none font-medium focus:border-fuchsia-500 transition-colors"
              value={sourceType}
              onChange={(e) => { setSourceType(e.target.value); setHasWaveplate(false); }}
            >
              <option value="natural">未知光源 A (自然光)</option>
              <option value="partial">未知光源 B (部分偏振光)</option>
              <option value="linear">未知光源 C (线偏振光)</option>
              <option value="circular">未知光源 D (圆偏振光)</option>
              <option value="elliptical">未知光源 E (椭圆偏振光)</option>
            </select>
          </div>
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <label className="relative flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={hasWaveplate} onChange={(e) => setHasWaveplate(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-fuchsia-500 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                <span className="ml-3 text-sm font-bold text-white">步骤 1: 串联插入 1/4 波片</span>
              </label>
            </div>
            <div className={`transition-all duration-300 ${hasWaveplate ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
              <Slider label="1/4 波片光轴转角" value={wpAngle} onChange={setWpAngle} min={0} max={180} unit="°" />
            </div>
          </div>
          <div className="pt-4 border-t border-white/5">
            <Slider label="步骤 2: 旋转后端检偏器方位角" value={polAngle} onChange={setPolAngle} min={0} max={360} unit="°" />
          </div>
        </div>
      </div>
      <div ref={containerRef} className="w-full lg:w-7/12 bg-[#04060b] border border-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full block" />
      </div>
    </div>
  );
};

/* ============================================================================
   主入口组件
============================================================================ */
export default function PolarizationOpticsLab() {
  const [activeTab, setActiveTab] = useState('biref'); // 默认展示修改的模块，方便你测试
  const [mode, setMode] = useState('linear');
  const [Ex, setEx] = useState(1.0);
  const [Ey, setEy] = useState(1.0);
  const [phaseDiff, setPhaseDiff] = useState(0);
  const [randomNoise, setRandomNoise] = useState(0);

  const presets = {
    linear: { Ex: 1, Ey: 1, phaseDiff: 0, noise: 0 },
    circular: { Ex: 1, Ey: 1, phaseDiff: 90, noise: 0 },
    elliptical: { Ex: 1, Ey: 0.5, phaseDiff: 45, noise: 0 },
    partial: { Ex: 1, Ey: 0.6, phaseDiff: 30, noise: 0.55 },
  };

  const applyPreset = (key) => {
    const p = presets[key];
    setEx(p.Ex); setEy(p.Ey); setPhaseDiff(p.phaseDiff); setRandomNoise(p.noise);
    setMode(key);
  };

  const updateEx = (v) => { setEx(v); setMode('custom'); };
  const updateEy = (v) => { setEy(v); setMode('custom'); };
  const updatePhase = (v) => { setPhaseDiff(v); setMode('custom'); };

  const analyze = () => {
    if (randomNoise > 0) return { type: '部分偏振光', desc: '各向同性存在随机热涨落相位非相干性。' };
    if (Ex === 0 || Ey === 0) return { type: '线偏振光', desc: '平面简谐单轴振动电场分量。' };
    if (phaseDiff % 180 === 0) return { type: '线偏振光', desc: '正弦相位差为 0 或 整数倍 π 导致单线偏振。' };
    if (Math.abs(Ex - Ey) < 0.01 && Math.abs(phaseDiff % 180) === 90) return { type: '圆偏振光', desc: '等幅且电矢量正交正切相位差为固定 ±90°。' };
    return { type: '椭圆偏振光', desc: '各向异性波动合成最普遍的通用状态。' };
  };
  const polarization = analyze();

  const isSynthesis = activeTab === 'synth2d' || activeTab === 'synth3d';

  return (
    <div className="relative p-5 md:p-8 bg-slate-950 rounded-3xl shadow-2xl border border-white/10 text-gray-200 my-8 overflow-hidden max-w-6xl mx-auto">
      <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-center mb-8 relative z-10">
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-full flex-wrap justify-center gap-1">
          <button onClick={() => setActiveTab('synth2d')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'synth2d' ? 'bg-cyan-400 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>2D 截面合成</button>
          <button onClick={() => setActiveTab('synth3d')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'synth3d' ? 'bg-purple-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>3D 空间波形</button>
          <button onClick={() => setActiveTab('elliptical')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'elliptical' ? 'bg-emerald-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>偏振光制备</button>
          <button onClick={() => setActiveTab('inspector')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'inspector' ? 'bg-fuchsia-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>状态检验仪</button>
          <button onClick={() => setActiveTab('biref')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'biref' ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>晶体双折射</button>
        </div>
      </div>

      <div className="relative z-10">
        {isSynthesis && (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-5/12 space-y-6">
              <div>
                <h3 className="text-xl font-black text-white mb-3">物理参数控制台</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(presets).map(key => (
                    <button key={key} onClick={() => applyPreset(key)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === key ? 'bg-cyan-400 text-black font-extrabold' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                      {key === 'linear' ? '线偏振' : key === 'circular' ? '圆偏振' : key === 'elliptical' ? '椭圆偏振' : '部分偏振'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <Slider label="X轴分量振幅 (E_x)" value={Ex} onChange={updateEx} min={0} max={2} step={0.1} />
                <Slider label="Y轴分量振幅 (E_y)" value={Ey} onChange={updateEy} min={0} max={2} step={0.1} />
                <Slider label="固有相位差 (Δφ)" value={phaseDiff} onChange={updatePhase} min={-180} max={180} step={5} unit="°" />
              </div>
              <div className="p-4 bg-slate-900/60 border-l-4 border-cyan-400 rounded-xl">
                <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">波形分析结果</div>
                <div className="text-lg font-black text-white mt-0.5">{polarization.type}</div>
                <div className="text-xs text-gray-400 mt-1 leading-relaxed">{polarization.desc}</div>
              </div>
            </div>
            <div className="w-full lg:w-7/12 flex items-center justify-center">
              {activeTab === 'synth2d' ? (
                <Canvas2DView Ex={Ex} Ey={Ey} phaseDiff={phaseDiff} randomNoise={randomNoise} />
              ) : (
                <Canvas3DView Ex={Ex} Ey={Ey} phaseDiff={phaseDiff} randomNoise={randomNoise} />
              )}
            </div>
          </div>
        )}
        {activeTab === 'elliptical' && <EllipticalPolarizationLab />}
        {activeTab === 'inspector' && <PolarizationInspector />}
        {activeTab === 'biref' && <BirefringenceSimulator />}
      </div>
    </div>
  );
}