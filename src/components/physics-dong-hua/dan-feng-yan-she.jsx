  'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function SingleSlitDiffractionSim() {
  const patternCanvasRef = useRef(null);
  const graphCanvasRef = useRef(null);

  // 物理参数状态
  const [wavelength, setWavelength] = useState(550); // 波长 λ (nm)
  const [slitWidth, setSlitWidth] = useState(0.12); // 缝宽 a (mm)
  const [focalLength, setFocalLength] = useState(1.0); // 焦距/屏距 f (m)

  // 光谱波长转 RGB 核心算法 (复用你的物理学近似算法)
  const wavelengthToRGB = (wl) => {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) { r = -(wl - 440) / (440 - 380); b = 1; }
    else if (wl >= 440 && wl < 490) { g = (wl - 440) / (490 - 440); b = 1; }
    else if (wl >= 490 && wl < 510) { g = 1; b = -(wl - 510) / (510 - 490); }
    else if (wl >= 510 && wl < 580) { r = (wl - 510) / (580 - 510); g = 1; }
    else if (wl >= 580 && wl < 645) { r = 1; g = -(wl - 645) / (645 - 580); }
    else if (wl >= 645 && wl <= 780) { r = 1; }
    
    let factor = wl >= 380 && wl < 420 ? 0.3 + 0.7 * (wl - 380) / (420 - 380) :
                 wl >= 420 && wl < 700 ? 1.0 :
                 wl >= 700 && wl <= 780 ? 0.3 + 0.7 * (780 - wl) / (780 - 700) : 0;
                 
    return [Math.round(r * factor * 255), Math.round(g * factor * 255), Math.round(b * factor * 255)];
  };

  useEffect(() => {
    const pCanvas = patternCanvasRef.current;
    const gCanvas = graphCanvasRef.current;
    if (!pCanvas || !gCanvas) return;
    
    const pCtx = pCanvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    if (!pCtx || !gCtx) return;

    const width = pCanvas.width;
    const pHeight = pCanvas.height;
    const gHeight = gCanvas.height;
    const centerX = width / 2;

    // 物理量国际单位转换
    const lambda_m = wavelength * 1e-9;
    const a_m = slitWidth * 1e-3;
    const f_m = focalLength;
    
    // 定义屏幕可视范围：假设画布宽度代表 40 mm 的实际物理屏幕宽度
    const screenWidth_m = 0.04; 
    const m_per_px = screenWidth_m / width;

    // 获取颜色
    const [r, g, b] = wavelengthToRGB(wavelength);
    const colorStyle = `rgb(${r}, ${g}, ${b})`;

    // --- 1. 渲染衍射条纹 (2D Pattern) ---
    const imgData = pCtx.createImageData(width, pHeight);
    const data = imgData.data;

    // 预计算光强数组
    const intensities = new Float32Array(width);
    
    for (let x = 0; x < width; x++) {
      const y_m = (x - centerX) * m_per_px; // 屏幕上的坐标 y
      // 核心相位参量公式: α = π * a * sinθ / λ ≈ π * a * y / (λ * f)
      const alpha = (Math.PI * a_m * y_m) / (lambda_m * f_m);
      
      // 光强公式: I = I0 * sinc^2(α)
      let intensity = 0;
      if (alpha === 0) {
        intensity = 1.0; // 极限情况，中央极大值
      } else {
        intensity = Math.pow(Math.sin(alpha) / alpha, 2);
      }
      
      // 加入非线性视觉亮度补偿（为了让人眼看清次级亮纹，适当提亮暗部。实际实验中人眼或CCD也有类似宽动态范围）
      const visualIntensity = Math.pow(intensity, 0.45); 
      intensities[x] = intensity; // 保存真实光强供图表使用

      for (let y = 0; y < pHeight; y++) {
        const index = (y * width + x) * 4;
        data[index] = r * visualIntensity;
        data[index + 1] = g * visualIntensity;
        data[index + 2] = b * visualIntensity;
        data[index + 3] = 255;
      }
    }
    pCtx.putImageData(imgData, 0, 0);

    // --- 2. 渲染光强分布曲线 (1D Graph) ---
    gCtx.clearRect(0, 0, width, gHeight);
    
    // 绘制背景网格
    gCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    gCtx.lineWidth = 1;
    gCtx.beginPath();
    for (let i = 0; i <= 10; i++) {
        gCtx.moveTo(0, i * (gHeight/10)); gCtx.lineTo(width, i * (gHeight/10));
        gCtx.moveTo(i * (width/10), 0); gCtx.lineTo(i * (width/10), gHeight);
    }
    gCtx.stroke();

    // 绘制理论暗纹基准线 (严格等间距)
    gCtx.beginPath();
    gCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    gCtx.setLineDash([4, 4]);
    for(let k = -5; k <= 5; k++) {
      if(k === 0) continue;
      const yDark_m = k * (f_m * lambda_m) / a_m;
      const xDark_px = centerX + (yDark_m / m_per_px);
      if(xDark_px >= 0 && xDark_px <= width) {
        gCtx.moveTo(xDark_px, 0);
        gCtx.lineTo(xDark_px, gHeight);
      }
    }
    gCtx.stroke();
    gCtx.setLineDash([]);

    // 绘制衍射包络曲线 (Sinc^2)
    gCtx.beginPath();
    gCtx.strokeStyle = colorStyle;
    gCtx.lineWidth = 2.5;
    gCtx.shadowBlur = 10;
    gCtx.shadowColor = colorStyle;
    
    for (let x = 0; x < width; x++) {
      // 在图表上做一点对数化处理以展示次极大，否则高度太低看不清
      // 使用带补偿的高度映射：展示强度 = I^0.6
      const plotIntensity = Math.pow(intensities[x], 0.6); 
      const plotY = gHeight - (plotIntensity * (gHeight * 0.85)); // 留出顶部 15% 边距
      if (x === 0) gCtx.moveTo(x, plotY);
      else gCtx.lineTo(x, plotY);
    }
    gCtx.stroke();
    gCtx.shadowBlur = 0; // 重置阴影

  }, [wavelength, slitWidth, focalLength]);

  // 计算理论上的条纹物理宽度用于展示
  const centralWidth_mm = ((2 * focalLength * (wavelength * 1e-9)) / (slitWidth * 1e-3)) * 1000;
  const secondaryWidth_mm = centralWidth_mm / 2;
  const [r, g, b] = wavelengthToRGB(wavelength);
  const accentColor = `rgb(${r}, ${g}, ${b})`;

  return (
    <div className="w-full my-12 p-6 md:p-8 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl font-sans text-slate-200">
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
        <div className="w-3 h-8 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ backgroundColor: accentColor }}></div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-wide">单缝夫琅禾费衍射实验室</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左侧：干涉图样与曲线渲染区 */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-4">
          <div className="bg-black/60 rounded-2xl border border-white/5 p-4 relative overflow-hidden flex flex-col justify-center items-center h-40">
            <div className="absolute top-3 left-4 text-xs text-white/40 font-mono z-10 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}></span>
               屏幕观测图样 (Pattern)
            </div>
            <canvas ref={patternCanvasRef} width={800} height={120} className="w-full h-full object-fill rounded-lg shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] opacity-90 mix-blend-screen" />
          </div>

          <div className="bg-black/60 rounded-2xl border border-white/5 p-4 relative overflow-hidden flex flex-col justify-center items-center h-64">
            <div className="absolute top-3 left-4 text-xs text-white/40 font-mono z-10">光强分布解析 (I-y 曲线)</div>
            <div className="absolute top-3 right-4 text-[10px] text-white/30 font-mono flex items-center gap-2">
                <span className="w-3 h-[1px] bg-white/50 block border-b border-dashed"></span>
                虚线: 等间距暗纹
            </div>
            <canvas ref={graphCanvasRef} width={800} height={200} className="w-full h-full object-fill" />
            <div className="absolute bottom-3 right-4 text-xs text-white/40 font-mono italic">
              I = I₀ sinc²(α)
            </div>
          </div>
        </div>

        {/* 右侧：超感参数控制台 */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-6 p-6 bg-[#0a0f1c] rounded-2xl border border-slate-800/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* 背景光晕 */}
          <div className="absolute top-0 right-0 w-64 h-64 blur-3xl opacity-10 pointer-events-none rounded-full" style={{ backgroundColor: accentColor }}></div>
          
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Control Panel</h3>
          
          <div className="space-y-6 relative z-10">
            {/* 波长控制 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-gray-400">单色光源波长 (λ)</label>
                <div className="px-3 py-1 rounded bg-black/50 border border-white/10 font-mono text-white transition-colors duration-300" style={{ color: accentColor }}>
                  {wavelength} <span className="text-xs opacity-70">nm</span>
                </div>
              </div>
              <input type="range" min="380" max="780" step="1" value={wavelength} 
                onChange={(e) => setWavelength(Number(e.target.value))} 
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: accentColor }}
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>380nm (紫)</span>
                <span>780nm (红)</span>
              </div>
            </div>

            {/* 缝宽控制 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-gray-400">狭缝宽度 (a)</label>
                <div className="px-3 py-1 rounded bg-black/50 border border-white/10 font-mono text-cyan-400">
                  {slitWidth.toFixed(2)} <span className="text-xs opacity-70">mm</span>
                </div>
              </div>
              <input type="range" min="0.05" max="0.30" step="0.01" value={slitWidth} 
                onChange={(e) => setSlitWidth(Number(e.target.value))} 
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* 屏距控制 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-gray-400">透镜焦距/屏距 (f)</label>
                <div className="px-3 py-1 rounded bg-black/50 border border-white/10 font-mono text-emerald-400">
                  {focalLength.toFixed(1)} <span className="text-xs opacity-70">m</span>
                </div>
              </div>
              <input type="range" min="0.5" max="3.0" step="0.1" value={focalLength} 
                onChange={(e) => setFocalLength(Number(e.target.value))} 
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* 物理状态验证面板 */}
          <div className="mt-auto pt-6 border-t border-white/5 relative z-10">
            <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">中央明纹宽度 (Δy₀)</span>
                <span className="font-mono font-bold text-white text-lg">{centralWidth_mm.toFixed(2)} mm</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">次级明纹宽度 (Δy)</span>
                <span className="font-mono font-bold text-white text-lg">{secondaryWidth_mm.toFixed(2)} mm</span>
              </div>
              <div className="text-[11px] text-indigo-300 mt-2 text-center bg-indigo-900/30 py-1.5 rounded-md border border-indigo-500/20">
                严格遵循 Δy₀ = 2fλ/a (主极大宽度为次极大两倍)
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}