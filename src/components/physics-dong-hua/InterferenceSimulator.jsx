 'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function InterferenceSimulator() {
  const [isOpen, setIsOpen] = useState(false);

  const [wavelength, setWavelength] = useState(550);
  const [slitSeparation, setSlitSeparation] = useState(0.15);
  const [screenDistance, setScreenDistance] = useState(1.5);

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

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ==========================================
    // 💡 高清屏幕模糊修复核心代码
    // ==========================================
    const dpr = window.devicePixelRatio || 1; // 获取屏幕像素比
    const logicalWidth = 800;  // 我们逻辑上的画布宽度
    const logicalHeight = 350; // 我们逻辑上的画布高度

    // 将内部画布尺寸等比例放大
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    
    // 把画笔（上下文）等比例放大，这样后面的计算代码 1px 就等于屏幕真实的 dpr 像素
    ctx.scale(dpr, dpr);
    // ==========================================

    // 后续所有的长宽计算，统一使用逻辑尺寸，而不是 canvas.width
    const width = logicalWidth;
    const height = logicalHeight;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const wl_m = wavelength * 1e-9;
    const d_m = slitSeparation * 1e-3;
    const r0_m = screenDistance;

    const viewWidth_m = 0.016; 

    const fringeHeight = 160;
    const graphOffsetY = 220;
    const graphMaxHeight = 100;

    const color = wavelengthToRGB(wavelength);

    ctx.beginPath();
    
    // 渲染精度提升：由于加了 dpr，这里的循环现在能渲染出极致细腻的渐变
    for (let x = 0; x < width; x++) {
      const y_m = ((x / width) - 0.5) * viewWidth_m;
      const phaseDiff = (2 * Math.PI * d_m * y_m) / (wl_m * r0_m);
      const intensity = Math.pow(Math.cos(phaseDiff / 2), 2);

      const r = Math.round(color.r * intensity);
      const g = Math.round(color.g * intensity);
      const b = Math.round(color.b * intensity);
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      // 这里宽度使用 1.5 是为了避免缩放后相邻像素间出现极细的黑线
      ctx.fillRect(x, 20, 1.5, fringeHeight);

      const graphY = graphOffsetY + graphMaxHeight * (1 - intensity);
      if (x === 0) {
        ctx.moveTo(x, graphY);
      } else {
        ctx.lineTo(x, graphY);
      }
    }

    ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, graphOffsetY + graphMaxHeight);
    ctx.lineTo(width, graphOffsetY + graphMaxHeight);
    ctx.stroke();

    ctx.lineTo(width, graphOffsetY + graphMaxHeight);
    ctx.lineTo(0, graphOffsetY + graphMaxHeight);
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`;
    ctx.fill();

    // 绘制文字
    ctx.fillStyle = '#94a3b8';
    // 更清晰的字体设置
    ctx.font = '500 13px system-ui, -apple-system, sans-serif'; 
    ctx.fillText('观测屏干涉条纹实况 (Viewing Screen)', 15, 35);
    ctx.fillText('相对光强分布曲线 (Intensity Profile)', 15, graphOffsetY - 10);
    
    const deltaY_mm = ((wl_m * r0_m) / d_m) * 1000;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px monospace'; // 等宽字体更适合显示公式
    ctx.fillText(`理论条纹间距 Δy = ${deltaY_mm.toFixed(3)} mm`, width - 260, graphOffsetY - 10);

  }, [wavelength, slitSeparation, screenDistance, isOpen]);

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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.7)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(56, 189, 248, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
          }}
        >
          <span>⚛️</span> 点击开启：杨氏双缝干涉在线虚拟实验室
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '12px',
      padding: '1.5rem',
      color: '#f8fafc',
      maxWidth: '850px',
      margin: '2rem auto',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 1.5rem 0', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚛️</span> 杨氏双缝干涉在线虚拟实验室
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          style={{
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#f43f5e',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
        >
          关闭实验室 ✕
        </button>
      </div>

      <div style={{ background: '#0f172a', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <canvas 
          ref={canvasRef} 
          /* 这里设置的是展示比例，内部已经通过 dpr 撑开了真实的渲染分辨率 */
          style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '800 / 350' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem', background: '#0f172a', padding: '1.25rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8' }}>
            <span>光波长 (λ)</span>
            <span style={{ color: '#f43f5e', fontWeight: 'bold' }}>{wavelength} nm</span>
          </div>
          <input 
            type="range" min="400" max="700" step="1"
            value={wavelength} 
            onChange={(e) => setWavelength(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#f43f5e' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>400nm (紫)</span><span>700nm (红)</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8' }}>
            <span>双缝间距 (d)</span>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{slitSeparation.toFixed(2)} mm</span>
          </div>
          <input 
            type="range" min="0.08" max="0.30" step="0.01"
            value={slitSeparation} 
            onChange={(e) => setSlitSeparation(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>0.08 mm</span><span>0.30 mm</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8' }}>
            <span>屏距 (r₀)</span>
            <span style={{ color: '#34d399', fontWeight: 'bold' }}>{screenDistance.toFixed(1)} m</span>
          </div>
          <input 
            type="range" min="0.5" max="3.0" step="0.1"
            value={screenDistance} 
            onChange={(e) => setScreenDistance(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#34d399' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>0.5 m</span><span>3.0 m</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
        💡 提示：滑动控制杆改变参数，条纹宽度将严格遵循物理规律演变。条纹间距公式已经完美映射至画布渲染中。
      </div>
    </div>
  );
}