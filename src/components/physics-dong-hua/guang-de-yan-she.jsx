'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { besselj } from 'bessel'; 

// ✅ 极致采样配置
const POINTS = 1000; // 1D 曲线上有 1000 个采样点，曲线极其顺滑
const R_MAX = 4.0; // 视场 4.0mm
const CANVAS_RESOLUTION = 1600; // ✅ 物理像素分辨率 1600x1600 (4x SSAA 极清画质)

const FresnelDiffractionLab = () => {
  const [mode, setMode] = useState('aperture'); 
  const [wavelength, setWavelength] = useState(500); // nm
  const [radius, setRadius] = useState(0.5); // mm
  const [distance, setDistance] = useState(1000); // mm

  const canvas2DRef = useRef(null);
  const canvas1DRef = useRef(null);

  // 严格复数积分计算
  const intensityProfile = useMemo(() => {
    const lambda = wavelength * 1e-6; 
    const k_wave = (2 * Math.PI) / lambda;
    const a = radius;
    const z = distance;

    let profile = [];
    let maxI = 0;
    const prefactor = k_wave / z;

    for (let i = 0; i < POINTS; i++) {
      const rho = (i / (POINTS - 1)) * R_MAX;
      let reInt = 0, imInt = 0;
      
      // ✅ 提高积分步数到 1000，完美应对高菲涅耳数下的剧烈震荡
      const steps = 1000; 
      const dr = a / steps;
      for (let j = 0; j < steps; j++) {
        const r = (j + 0.5) * dr;
        const phase = (k_wave / (2 * z)) * (r * r);
        const j0 = besselj((k_wave * r * rho) / z, 0);
        reInt += Math.cos(phase) * j0 * r * dr;
        imInt += Math.sin(phase) * j0 * r * dr;
      }

      const rhoPhase = (k_wave / (2 * z)) * (rho * rho);
      const cosRho = Math.cos(rhoPhase);
      const sinRho = Math.sin(rhoPhase);
      const ap_re = prefactor * (imInt * cosRho + reInt * sinRho);
      const ap_im = prefactor * (imInt * sinRho - reInt * cosRho);

      let I = 0;
      if (mode === 'aperture') {
        I = ap_re * ap_re + ap_im * ap_im;
      } else if (mode === 'obstacle') {
        const ob_re = cosRho - ap_re;
        const ob_im = sinRho - ap_im;
        I = ob_re * ob_re + ob_im * ob_im;
      }

      profile.push(I);
      if (I > maxI) maxI = I;
    }

    return profile.map(v => (mode === 'aperture' && maxI > 0 ? v / maxI : v));
  }, [mode, wavelength, radius, distance]);

  // 高画质 Canvas 渲染
  useEffect(() => {
    const canvas2D = canvas2DRef.current;
    const canvas1D = canvas1DRef.current;
    if (!canvas2D || !canvas1D) return;

    const ctx2D = canvas2D.getContext('2d');
    const ctx1D = canvas1D.getContext('2d');
    
    const width2D = canvas2D.width;
    const height2D = canvas2D.height;

    // --- 绘制 2D 超高清图样 ---
    const imgData = ctx2D.createImageData(width2D, height2D);
    const cx = width2D / 2;
    const cy = height2D / 2;

    for (let y = 0; y < height2D; y++) {
      for (let x = 0; x < width2D; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const rPix = Math.sqrt(dx * dx + dy * dy);
        const rRatio = rPix / (width2D / 2);

        if (rRatio <= 1.0) {
          // 精确的双线性插值寻址
          const indexFloat = rRatio * (POINTS - 1);
          const i1 = Math.floor(indexFloat);
          const i2 = Math.min(i1 + 1, POINTS - 1);
          const weight = indexFloat - i1;
          
          const rawVal = intensityProfile[i1] * (1 - weight) + intensityProfile[i2] * weight;
          
          // ✅ Gamma = 0.9，稍微提亮暗部，让干涉条纹更明显
          const val = Math.pow(rawVal, 0.9); 

          let r = 0, g = 0, b = 0;
          if (wavelength < 550) { b = 255 * val; g = 200 * val; r = 0; }
          else if (wavelength < 600) { g = 255 * val; b = 0; r = 255 * val; }
          else { r = 255 * val; g = 0; b = 0; }

          const idx = (y * width2D + x) * 4;
          imgData.data[idx] = r;
          imgData.data[idx + 1] = g;
          imgData.data[idx + 2] = b;
          imgData.data[idx + 3] = 255; 
        } else {
          const idx = (y * width2D + x) * 4;
          imgData.data[idx] = 0; imgData.data[idx+1] = 0; imgData.data[idx+2] = 0; imgData.data[idx+3] = 255;
        }
      }
    }
    ctx2D.putImageData(imgData, 0, 0);

    const rGeoPix = (radius / R_MAX) * (width2D / 2);
    if (rGeoPix < width2D / 2) {
      ctx2D.beginPath();
      ctx2D.arc(cx, cy, rGeoPix, 0, 2 * Math.PI);
      ctx2D.strokeStyle = 'rgba(255, 255, 255, 0.5)'; 
      // 虚线间距调大，适应高分辨率
      ctx2D.setLineDash([20, 20]); 
      ctx2D.lineWidth = 4; 
      ctx2D.stroke();
      ctx2D.setLineDash([]);
    }

    // --- 绘制 1D 极客风曲线 ---
    const cw = canvas1D.width;  
    const ch = canvas1D.height; 
    ctx1D.clearRect(0, 0, cw, ch);
    
    const r1DX = (radius / R_MAX) * cw;
    if (r1DX < cw) {
        ctx1D.beginPath();
        ctx1D.moveTo(r1DX, 0);
        ctx1D.lineTo(r1DX, ch);
        ctx1D.strokeStyle = 'rgba(103, 232, 249, 0.6)'; 
        ctx1D.setLineDash([8, 8]);
        ctx1D.lineWidth = 2;
        ctx1D.stroke();
        ctx1D.setLineDash([]);
        
        ctx1D.fillStyle = '#67e8f9';
        ctx1D.font = '22px monospace'; 
        ctx1D.fillText(`a = ${radius.toFixed(2)} mm`, r1DX + 12, 30);
    }

    ctx1D.beginPath();
    ctx1D.strokeStyle = '#f43f5e'; 
    ctx1D.lineWidth = 4; 
    // 平滑处理曲线连接点
    ctx1D.lineJoin = 'round';
    ctx1D.lineCap = 'round';

    const plotMaxY = mode === 'aperture' ? 1.0 : Math.max(1.5, ...intensityProfile);
    let gradient = ctx1D.createLinearGradient(0, ch, 0, 0);
    gradient.addColorStop(0, 'rgba(244, 63, 94, 0)');
    gradient.addColorStop(1, 'rgba(244, 63, 94, 0.5)');

    ctx1D.moveTo(0, ch);
    for (let i = 0; i < POINTS; i++) {
      const x = (i / POINTS) * cw;
      const y = ch - (intensityProfile[i] / plotMaxY) * ch * 0.85 - 4;
      ctx1D.lineTo(x, y);
    }
    ctx1D.lineTo(cw, ch);
    
    ctx1D.fillStyle = gradient;
    ctx1D.fill();
    ctx1D.stroke(); 

  }, [intensityProfile, wavelength, mode, radius]);

  const fresnelNumber = (radius * radius) / (wavelength * 1e-6 * distance);
  const k_zones = Math.round(fresnelNumber);

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 md:p-8 bg-black/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 font-sans my-12 text-gray-200 relative overflow-hidden group">
      
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>

      <div className="w-full lg:w-5/12 space-y-8 relative z-10">
        <div>
            <h3 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-1">
            菲涅耳衍射实验室
            </h3>
            <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">Fresnel Diffraction Simulator</p>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl">
          <button
            className={`flex-1 py-2.5 text-sm font-bold tracking-wider rounded-lg transition-all duration-300 ${mode === 'aperture' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setMode('aperture')}
          >圆孔衍射</button>
          <button
            className={`flex-1 py-2.5 text-sm font-bold tracking-wider rounded-lg transition-all duration-300 ${mode === 'obstacle' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setMode('obstacle')}
          >圆屏衍射</button>
        </div>

        <div className="space-y-6">
          <div className="group/slider">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300 group-hover/slider:text-cyan-400 transition-colors">入射波长 λ</label>
              <div className="flex items-center gap-1 bg-black/40 border border-gray-700 rounded-md px-2 py-1">
                <input type="number" min="380" max="780" step="1" value={wavelength} onChange={(e) => setWavelength(Math.max(380, Math.min(780, Number(e.target.value))))}
                  className="w-12 text-right bg-transparent text-sm text-cyan-400 font-mono focus:outline-none" />
                <span className="text-xs text-gray-500">nm</span>
              </div>
            </div>
            <input type="range" min="400" max="700" step="10" value={wavelength} onChange={(e) => setWavelength(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
          </div>

          <div className="group/slider">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300 group-hover/slider:text-cyan-400 transition-colors">
                {mode === 'aperture' ? '圆孔半径 a' : '圆屏半径 a'}
              </label>
              <div className="flex items-center gap-1 bg-black/40 border border-gray-700 rounded-md px-2 py-1">
                <input type="number" min="0.01" max="4.0" step="0.01" value={radius} onChange={(e) => setRadius(Math.max(0.01, Math.min(4.0, Number(e.target.value))))}
                  className="w-12 text-right bg-transparent text-sm text-cyan-400 font-mono focus:outline-none" />
                <span className="text-xs text-gray-500">mm</span>
              </div>
            </div>
            <input type="range" min="0.1" max="4.0" step="0.01" value={radius} onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
          </div>

          <div className="group/slider">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300 group-hover/slider:text-cyan-400 transition-colors">观测距离 z</label>
              <div className="flex items-center gap-1 bg-black/40 border border-gray-700 rounded-md px-2 py-1">
                <input type="number" min="10" max="10000" step="1" value={distance} onChange={(e) => setDistance(Math.max(10, Math.min(10000, Number(e.target.value))))}
                  className="w-16 text-right bg-transparent text-sm text-cyan-400 font-mono focus:outline-none" />
                <span className="text-xs text-gray-500">mm</span>
              </div>
            </div>
            <input type="range" min="100" max="3000" step="10" value={distance} onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
          </div>
        </div>

        <div className="mt-8 p-5 bg-black/50 border border-cyan-900/50 rounded-xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <div className="flex justify-between items-end">
                <h4 className="text-xs font-mono text-cyan-500 tracking-wider">SYSTEM LOG // 物理演算</h4>
                <span className="text-xs font-mono text-gray-500">k = a² / (λz)</span>
            </div>
            <div className="text-3xl font-mono font-light text-white">
                 k ≈ <span className="font-bold text-cyan-400">{fresnelNumber.toFixed(2)}</span>
            </div>
            
            <div className="text-sm pt-2 border-t border-white/10 text-gray-300 leading-relaxed font-light">
                {mode === 'aperture' ? (
                    <p>
                        波面已暴露出 <span className="text-cyan-400 font-bold">{fresnelNumber.toFixed(1)}</span> 个半波带。<br/>
                        {k_zones % 2 !== 0 
                            ? <span className="text-emerald-400">▶ 接近奇数：中心次波干涉相长，形成高光亮斑。</span> 
                            : <span className="text-rose-400">▶ 接近偶数：相邻次波完全相消，中心陷入暗斑。</span>}
                    </p>
                ) : (
                    <p>
                        圆屏截断了前 <span className="text-cyan-400 font-bold">{fresnelNumber.toFixed(1)}</span> 个半波带。<br/>
                        <span className="text-purple-400">▶ 巴比涅原理：屏后阴影中心发生完美的干涉叠加，永续存在泊松亮斑。</span>
                    </p>
                )}
            </div>
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex flex-col items-center gap-6 justify-center relative z-10">
        
        <div className="relative p-1 rounded-2xl bg-gradient-to-b from-gray-700 to-gray-900 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 ring-inset"></div>
            <div className="bg-[#050505] p-2 rounded-xl">
                {/* ✅ 1600x1600 终极超采样抗锯齿 */}
                <canvas ref={canvas2DRef} width={CANVAS_RESOLUTION} height={CANVAS_RESOLUTION} className="rounded-lg max-w-full h-auto aspect-square" style={{ maxWidth: '420px' }} />
            </div>
            
            <div className="absolute top-5 left-5 px-2 py-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded text-[10px] text-gray-300 font-mono uppercase tracking-widest pointer-events-none">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
                二维衍射图场
            </div>
        </div>

        <div className="w-full max-w-[420px] bg-[#0a0a0a] p-4 rounded-xl shadow-lg border border-gray-800 relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-mono text-cyan-500 tracking-wider">光强包络 I(ρ)</span>
            <span className="text-[10px] text-gray-600 font-mono">ρ ∈ [0, {R_MAX}mm]</span>
          </div>
          <div className="relative w-full h-auto bg-grid-white/[0.02]">
             <canvas ref={canvas1DRef} width={800} height={240} className="w-full h-auto rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FresnelDiffractionLab;