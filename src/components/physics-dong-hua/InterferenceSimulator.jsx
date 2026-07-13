 'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function InterferenceSimulator() {
  const [isOpen, setIsOpen] = useState(false);

  const [wavelength, setWavelength] = useState(550);
  const [slitSeparation, setSlitSeparation] = useState(0.15);
  const [screenDistance, setScreenDistance] = useState(1.5);
  
  // 💡 新增：记录鼠标在画布上的逻辑 X 坐标（对应光屏物理 y 轴）
  const [mouseX, setMouseX] = useState(null);

  const canvasRef = useRef(null);

  const wavelengthToRGB = (wl) => {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) { r = -(wl - 440) / (440 - 380); g = 0; b = 1; } 
    else if (wl >= 440 && wl < 490) { r = 0; g = (wl - 440) / (490 - 440); b = 1; } 
    else if (wl >= 490 && wl < 510) { r = 0; g = 1; b = -(wl - 510) / (510 - 490); } 
    else if (wl >= 510 && wl < 580) { r = (wl - 510) / (580 - 510); g = 1; b = 0; } 
    else if (wl >= 580 && wl < 645) { r = 1; g = -(wl - 645) / (645 - 580); b = 0; } 
    else if (wl >= 645 && wl <= 780) { r = 1; g = 0; b = 0; }
    
    let factor = 1.0;
    if (wl >= 380 && wl < 420) factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);
    else if (wl >= 700 && wl <= 780) factor = 0.3 + 0.7 * (780 - wl) / (780 - 700);
    
    return {
      r: Math.round(r * factor * 255),
      g: Math.round(g * factor * 255),
      b: Math.round(b * factor * 255),
    };
  };

  // 处理鼠标在画布上的移动
  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    // 映射到 800 的逻辑宽度
    const scaleX = 800 / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    
    // 只在合理范围内触发交互
    if (x >= 0 && x <= 800) {
      setMouseX(x);
    } else {
      setMouseX(null);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1; 
    const logicalWidth = 800;  
    const logicalHeight = 550; 

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = logicalWidth;
    const height = logicalHeight;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const wl_m = wavelength * 1e-9;
    const d_m = slitSeparation * 1e-3;
    const r0_m = screenDistance;
    const viewWidth_m = 0.016; 
    
    const color = wavelengthToRGB(wavelength);
    const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`;
    const colorSemi = `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`;
    const colorFaint = `rgba(${color.r}, ${color.g}, ${color.b}, 0.05)`;

    // ==========================================
    // 模块 1：俯视装置图
    // ==========================================
    const apparatusY = 100; 
    const slitWallX = 180;
    const screenX = 720;
    const visualSlitD = slitSeparation * 150; 
    const visualScreenHeight = 180;

    // 1. 激光器与主光束
    ctx.fillStyle = '#334155';
    ctx.fillRect(20, apparatusY - 20, 60, 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('激光器', 30, apparatusY + 5);
    ctx.fillStyle = colorSemi;
    ctx.fillRect(80, apparatusY - 10, 100, 20);

    // 2. 双缝挡板
    ctx.fillStyle = '#64748b';
    ctx.fillRect(slitWallX, apparatusY - 80, 5, 160); 
    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(slitWallX, apparatusY - visualSlitD/2 - 2, 5, 4);
    ctx.fillRect(slitWallX, apparatusY + visualSlitD/2 - 2, 5, 4);

    // 3. 观测屏(俯视)与发散包络
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(screenX, apparatusY - visualScreenHeight/2, 8, visualScreenHeight);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('观测屏(俯视)', screenX - 25, apparatusY - visualScreenHeight/2 - 10);

    ctx.beginPath();
    ctx.moveTo(slitWallX + 5, apparatusY - visualSlitD/2);
    ctx.lineTo(screenX, apparatusY - visualScreenHeight/2);
    ctx.lineTo(screenX, apparatusY + visualScreenHeight/2);
    ctx.lineTo(slitWallX + 5, apparatusY + visualSlitD/2);
    ctx.fillStyle = colorFaint;
    ctx.fill();

    // ==========================================
    // 模块 2：光屏正视图与图谱
    // ==========================================
    const fringeOffsetY = 240;
    const fringeHeight = 140;
    const graphOffsetY = 420;
    const graphMaxHeight = 100;

    ctx.beginPath();
    ctx.moveTo(20, 210);
    ctx.lineTo(width - 20, 210);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const y_m = ((x / width) - 0.5) * viewWidth_m;
      const phaseDiff = (2 * Math.PI * d_m * y_m) / (wl_m * r0_m);
      const intensity = Math.pow(Math.cos(phaseDiff / 2), 2);

      const r = Math.round(color.r * intensity);
      const g = Math.round(color.g * intensity);
      const b = Math.round(color.b * intensity);
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, fringeOffsetY, 1.5, fringeHeight);

      const graphY = graphOffsetY + graphMaxHeight * (1 - intensity);
      if (x === 0) ctx.moveTo(x, graphY);
      else ctx.lineTo(x, graphY);
    }

    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.lineTo(width, graphOffsetY + graphMaxHeight);
    ctx.lineTo(0, graphOffsetY + graphMaxHeight);
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, graphOffsetY + graphMaxHeight);
    ctx.lineTo(width, graphOffsetY + graphMaxHeight);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px system-ui, -apple-system, sans-serif'; 
    ctx.fillText('光屏正视图 (屏幕水平轴即为物理实验中的 y 坐标)', 15, fringeOffsetY - 10);
    ctx.fillText('相对光强分布曲线 I / I₀', 15, graphOffsetY - 10);
    
    // ==========================================
    // 💡 模块 3：交互逻辑 (精准一一对应)
    // ==========================================
    if (mouseX !== null) {
      // 1. 计算当前鼠标位置对应的物理 y 坐标和强度
      const targetY_m = ((mouseX / width) - 0.5) * viewWidth_m;
      const targetPhase = (2 * Math.PI * d_m * targetY_m) / (wl_m * r0_m);
      const targetIntensity = Math.pow(Math.cos(targetPhase / 2), 2);
      
      // ---------- A. 在上帝视角中绘制特定的光线路径 ----------
      // 映射 y_m 到俯视图的 Y 坐标
      const topViewTargetY = apparatusY + (targetY_m / viewWidth_m) * visualScreenHeight;
      
      ctx.beginPath();
      // 从 S1 出发
      ctx.moveTo(slitWallX + 5, apparatusY - visualSlitD/2);
      ctx.lineTo(screenX, topViewTargetY);
      // 从 S2 出发
      ctx.moveTo(slitWallX + 5, apparatusY + visualSlitD/2);
      ctx.lineTo(screenX, topViewTargetY);
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]); // 虚线表示特定光束
      ctx.stroke();
      ctx.setLineDash([]); // 恢复实线
      
      // 在光屏俯视图上画一个指示光斑
      ctx.beginPath();
      ctx.arc(screenX, topViewTargetY, 4, 0, Math.PI * 2);
      ctx.fillStyle = colorStr;
      ctx.fill();

      // ---------- B. 在条纹和波形上绘制指示器 ----------
      // 贯穿条纹与图谱的垂直辅助线
      ctx.beginPath();
      ctx.moveTo(mouseX, fringeOffsetY);
      ctx.lineTo(mouseX, graphOffsetY + graphMaxHeight);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 在曲线上标记当前点
      const graphY = graphOffsetY + graphMaxHeight * (1 - targetIntensity);
      ctx.beginPath();
      ctx.arc(mouseX, graphY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // ---------- C. 悬浮数据面板 (Tooltip) ----------
      const tooltipW = 160;
      const tooltipH = 80;
      // 避免悬浮框超出边界
      const tooltipX = mouseX + tooltipW + 15 > width ? mouseX - tooltipW - 15 : mouseX + 15;
      const tooltipY = Math.min(graphY - 40, graphOffsetY + graphMaxHeight - tooltipH);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipW, tooltipH, 6);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`y = ${(targetY_m * 1000).toFixed(3)} mm`, tooltipX + 10, tooltipY + 22);
      
      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px sans-serif';
      // 计算光程差 (Δ = d * y / r0)
      const pathDiff_nm = ((d_m * targetY_m) / r0_m) * 1e9;
      ctx.fillText(`光程差 Δ: ${pathDiff_nm.toFixed(1)} nm`, tooltipX + 10, tooltipY + 44);
      
      const isMax = targetIntensity > 0.95;
      const isMin = targetIntensity < 0.05;
      let statusStr = '';
      if (isMax) statusStr = '(亮纹)';
      else if (isMin) statusStr = '(暗纹)';

      ctx.fillText(`相对光强: ${(targetIntensity * 100).toFixed(1)}% ${statusStr}`, tooltipX + 10, tooltipY + 66);
    } else {
      // 默认上帝视角示意光线 (未 hover 时)
      ctx.beginPath();
      ctx.moveTo(slitWallX + 5, apparatusY - visualSlitD/2);
      ctx.lineTo(screenX, apparatusY);
      ctx.moveTo(slitWallX + 5, apparatusY + visualSlitD/2);
      ctx.lineTo(screenX, apparatusY);
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const deltaY_mm = ((wl_m * r0_m) / d_m) * 1000;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px monospace'; 
    ctx.fillText(`条纹间距 Δy = ${deltaY_mm.toFixed(3)} mm`, width - 230, graphOffsetY - 10);

  // 依赖数组加上 mouseX，实现丝滑重绘跟随
  }, [wavelength, slitSeparation, screenDistance, isOpen, mouseX]);

  if (!isOpen) {
    return (
      <div style={{ maxWidth: '850px', margin: '2rem auto', textAlign: 'center' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            letterSpacing: '0.05em'
          }}
        >
          <span>⚛️</span> 点击开启：杨氏双缝干涉虚拟实验室
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.5rem', color: '#f8fafc', maxWidth: '850px', margin: '2rem auto', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 1.5rem 0', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚛️</span> 杨氏双缝干涉在线虚拟实验室
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
        >关闭 ✕</button>
      </div>

      <div style={{ background: '#0f172a', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem', position: 'relative' }}>
        <canvas 
          ref={canvasRef} 
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMouseX(null)}
          style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '800 / 550', cursor: 'crosshair' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem', background: '#0f172a', padding: '1.25rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8' }}>
            <span>光波长 (λ)</span><span style={{ color: '#f43f5e', fontWeight: 'bold' }}>{wavelength} nm</span>
          </div>
          <input type="range" min="400" max="700" step="1" value={wavelength} onChange={(e) => setWavelength(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: '#f43f5e' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8' }}>
            <span>双缝间距 (d)</span><span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{slitSeparation.toFixed(2)} mm</span>
          </div>
          <input type="range" min="0.08" max="0.30" step="0.01" value={slitSeparation} onChange={(e) => setSlitSeparation(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8' }}>
            <span>屏距 (r₀)</span><span style={{ color: '#34d399', fontWeight: 'bold' }}>{screenDistance.toFixed(1)} m</span>
          </div>
          <input type="range" min="0.5" max="3.0" step="0.1" value={screenDistance} onChange={(e) => setScreenDistance(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: '#34d399' }} />
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
        💡 提示：将鼠标悬停在画板的干涉条纹上，即可观测特定 $y$ 坐标下的物理量，以及上帝视角中对应的光线路径。
      </div>
    </div>
  );
}