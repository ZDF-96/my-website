 'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* =========================================
   波长 → HSL 色相（用于光波模式颜色）
========================================= */
function wavelengthToColor(wavelengthNm) {
  const wl = Math.max(380, Math.min(780, wavelengthNm));
  let r, g, b;
  if (wl < 440) {
    r = (440 - wl) / (440 - 380); g = 0.0; b = 1.0;
  } else if (wl < 490) {
    r = 0.0; g = (wl - 440) / (490 - 440); b = 1.0;
  } else if (wl < 510) {
    r = 0.0; g = 1.0; b = (510 - wl) / (510 - 490);
  } else if (wl < 580) {
    r = (wl - 510) / (580 - 510); g = 1.0; b = 0.0;
  } else if (wl < 645) {
    r = 1.0; g = (645 - wl) / (645 - 580); b = 0.0;
  } else {
    r = 1.0; g = 0.0; b = 0.0;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export default function DopplerLaboratory() {
  const [mode, setMode] = useState('sound');
  const [waveSpeed, setWaveSpeed] = useState(150);
  const [frequency, setFrequency] = useState(8);
  const [sourceVel, setSourceVel] = useState(50);
  const [observerVel, setObserverVel] = useState(0);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const animState = useRef({
    mode: 'sound',
    v: 150, nu: 8, vs: 50, vo: 0,
    srcX: 0, obsX: 0,
    waves: [],
    lastEmitTime: 0,
    time: 0,
  });

  // 同步参数到 useRef
  useEffect(() => {
    animState.current.mode = mode;
    animState.current.v = waveSpeed;
    animState.current.nu = frequency;
    animState.current.vs = sourceVel;
    animState.current.vo = observerVel;
  }, [mode, waveSpeed, frequency, sourceVel, observerVel]);

  // 模式切换时自动调整波速和频率范围
  useEffect(() => {
    if (mode === 'light') {
      if (waveSpeed < 1000) setWaveSpeed(3000);
      if (frequency < 100) setFrequency(500);
    } else {
      if (waveSpeed > 300) setWaveSpeed(150);
      if (frequency > 100) setFrequency(8);
    }
  }, [mode]);

  // UI 层计算（用于公式面板）
  const isShockwave = mode === 'sound' && Math.abs(sourceVel) >= waveSpeed;
  const isLightExtreme = mode === 'light' && Math.abs(sourceVel) >= waveSpeed;

  let observedFreqUI = null;
  if (mode === 'sound') {
    if (isShockwave) observedFreqUI = Infinity;
    else {
      const denom = waveSpeed - sourceVel;
      observedFreqUI = denom !== 0 ? frequency * (waveSpeed - observerVel) / denom : Infinity;
    }
  } else {
    const beta = sourceVel / waveSpeed;
    if (Math.abs(beta) >= 1) observedFreqUI = Infinity;
    else observedFreqUI = frequency * Math.sqrt((1 + beta) / (1 - beta));
  }

  // 动画循环
  const startAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = animState.current;

    let lastTimestamp = performance.now();
    const fixedDt = 1 / 120;
    let accumulator = 0;
    let animationFrameId;

    const render = (timestamp) => {
      animationFrameId = requestAnimationFrame(render);
      let dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      accumulator += dt;
      while (accumulator >= fixedDt) {
        update(fixedDt);
        accumulator -= fixedDt;
      }
      draw();
    };

    const update = (dt) => {
      const { nu, vs, vo, waves, time } = state;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      state.time += dt;

      let srcX = state.srcX + vs * dt;
      let obsX = state.obsX + vo * dt;
      const wrapLimit = width / 2 + 50;
      if (srcX > width + wrapLimit) srcX = -wrapLimit;
      if (srcX < -wrapLimit) srcX = width + wrapLimit;
      if (obsX > width + wrapLimit) obsX = -wrapLimit;
      if (obsX < -wrapLimit) obsX = width + wrapLimit;
      state.srcX = srcX;
      state.obsX = obsX;

      const emitInterval = 1 / nu;
      if (time - state.lastEmitTime >= emitInterval) {
        waves.push({ x: srcX, y: height / 2, emitTime: time });
        state.lastEmitTime = time;
      }
      if (waves.length > 300) waves.splice(0, waves.length - 300);
    };

    const draw = () => {
      const { v, nu, vs, vo, waves, time, mode, srcX, obsX } = state;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // 实时计算观测频率
      let currentObsFreq = null;
      if (mode === 'sound') {
        if (Math.abs(vs) >= v) currentObsFreq = Infinity;
        else currentObsFreq = nu * (v - vo) / (v - vs);
      } else {
        const beta = vs / v;
        if (Math.abs(beta) >= 1) currentObsFreq = Infinity;
        else currentObsFreq = nu * Math.sqrt((1 + beta) / (1 - beta));
      }

      // 观察者颜色
      let obsColor = '#10b981';
      if (mode === 'light' && currentObsFreq !== Infinity && currentObsFreq !== null) {
        const lambdaNm = (3e8 / (currentObsFreq * 1e12)) * 1e9;
        obsColor = wavelengthToColor(lambdaNm);
      }

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // 星空
      for (let i = 0; i < 80; i++) {
        const x = (i * 137.5) % width;
        const y = (i * 83.3) % height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
      }

      // 网格
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // 波纹
      ctx.globalCompositeOperation = 'screen';
      const maxRadius = Math.max(width, height) * 1.4;
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        const radius = v * (time - w.emitTime);
        if (radius > maxRadius) { waves.splice(i, 1); continue; }
        if (radius <= 0) continue;
        const opacity = Math.max(0, 1 - radius / maxRadius);
        ctx.beginPath();
        ctx.arc(w.x, w.y, radius, 0, Math.PI * 2);

        if (mode === 'sound') {
          ctx.strokeStyle = Math.abs(vs) >= v ? `rgba(239,68,68,${opacity})` : `rgba(34,211,238,${opacity})`;
        } else {
          const beta = vs / v;
          if (beta > 0) ctx.strokeStyle = `rgba(59,130,246,${opacity})`;
          else if (beta < 0) ctx.strokeStyle = `rgba(239,68,68,${opacity})`;
          else ctx.strokeStyle = `rgba(148,163,184,${opacity})`;
        }

        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = mode === 'sound' ? '#22d3ee' : '#3b82f6';
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // 马赫锥
      if (mode === 'sound' && Math.abs(vs) > v) {
        const theta = Math.asin(v / Math.abs(vs));
        const coneLength = Math.min(width, height) * 0.8;
        ctx.beginPath();
        ctx.moveTo(srcX, height / 2);
        ctx.lineTo(srcX - coneLength * Math.cos(theta), height / 2 - coneLength * Math.sin(theta));
        ctx.lineTo(srcX - coneLength * Math.cos(theta), height / 2 + coneLength * Math.sin(theta));
        ctx.closePath();
        const grad = ctx.createLinearGradient(srcX, height / 2, srcX - coneLength, height / 2);
        grad.addColorStop(0, 'rgba(239,68,68,0.35)');
        grad.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // 观察者
      ctx.beginPath();
      ctx.arc(obsX, height / 2, 10, 0, Math.PI * 2);
      ctx.fillStyle = obsColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 观察者光晕
      ctx.beginPath();
      ctx.arc(obsX, height / 2, 20, 0, Math.PI * 2);
      const hslaColor = obsColor.startsWith('hsl') ? obsColor.replace('hsl', 'hsla').slice(0, -1) + ', 0.3)' : 'rgba(16,185,129,0.3)';
      ctx.strokeStyle = hslaColor;
      ctx.stroke();

      // 波源
      ctx.beginPath();
      ctx.arc(srcX, height / 2, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(srcX, height / 2, 20, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239,68,68,0.3)';
      ctx.stroke();

      // HUD 信息面板 (使用 Unicode prime \u2032 避免逗号)
      const panelX = 20, panelY = 20, panelW = 330, panelH = 150;
      ctx.fillStyle = 'rgba(15,23,42,0.8)';
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('多普勒物理实验室', panelX + 20, panelY + 30);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#38bdf8';
      const modeText = mode === 'sound' ? '声波 (经典)' : '光波 (相对论)';
      ctx.fillText(`模式：${modeText}`, panelX + 20, panelY + 55);
      const freqUnit = mode === 'light' ? 'THz' : 'Hz';
      ctx.fillText(`波源频率 ν：${nu.toFixed(1)} ${freqUnit}`, panelX + 20, panelY + 75);

      const isExtreme = (mode === 'sound' && Math.abs(vs) >= v) || (mode === 'light' && Math.abs(vs) >= v);
      const obsDisplay = isExtreme ? '∞' : (nu * (v - vo) / (v - vs)).toFixed(2);
      ctx.fillText(`观测频率 ν\u2032：${obsDisplay} ${freqUnit}`, panelX + 20, panelY + 95);
      const waveLen = mode === 'light' && currentObsFreq !== Infinity
        ? (3e8 / (currentObsFreq * 1e12) * 1e9).toFixed(0) + ' nm'
        : (v / nu).toFixed(2) + ' m';
      ctx.fillText(`接收波长 λ\u2032：${waveLen}`, panelX + 20, panelY + 115);
      if (mode === 'light' && currentObsFreq !== Infinity) {
        ctx.fillText(`观测器色相：${obsColor}`, panelX + 20, panelY + 135);
      }

      // 观察者头顶悬浮频率 (使用 prime)
      const floatText = isExtreme
        ? (mode === 'sound' ? '⚡ 激波 (奇异点)' : '⚡ 光速极限')
        : `ν\u2032 = ${currentObsFreq?.toFixed(1)} ${freqUnit}`;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(floatText).width;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(obsX - tw / 2 - 10, height / 2 - 40, tw + 20, 24);
      ctx.fillStyle = isExtreme ? '#ef4444' : '#06b6d4';
      ctx.fillText(floatText, obsX, height / 2 - 23);
      ctx.textAlign = 'start';
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // 画布尺寸自适应
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width, h = 500;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // 初始化位置
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = animState.current;
    const width = canvas.clientWidth;
    if (width > 0) {
      state.srcX = width * 0.25;
      state.obsX = width * 0.75;
      state.waves = [];
      state.lastEmitTime = state.time;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = animState.current;
    const width = canvas.clientWidth;
    if (width > 0) {
      state.srcX = width * 0.25;
      state.obsX = width * 0.75;
      state.waves = [];
      state.lastEmitTime = state.time;
    }
  }, [canvasRef.current?.clientWidth]);

  useEffect(() => {
    const cleanup = startAnimation();
    return cleanup;
  }, [startAnimation]);

  const maxSpeed = mode === 'light' ? 5000 : 300;

  return (
    <div ref={containerRef} style={{
      background: '#020617', border: '1px solid #1e293b', borderRadius: '16px',
      overflow: 'hidden', boxShadow: '0 0 40px rgba(0,0,0,0.5)',
      margin: '30px 0', fontFamily: 'system-ui, sans-serif'
    }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '500px' }} />

      <div style={{
        padding: '24px', background: 'linear-gradient(to bottom, #0f172a, #020617)',
        color: '#e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1' }}>模拟模式</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setMode('sound')} style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              border: mode === 'sound' ? '1px solid #22d3ee' : '1px solid #334155',
              background: mode === 'sound' ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.03)',
              color: mode === 'sound' ? '#22d3ee' : '#cbd5e1',
              cursor: 'pointer', fontWeight: 'bold'
            }}>🔊 声波</button>
            <button onClick={() => setMode('light')} style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              border: mode === 'light' ? '1px solid #fbbf24' : '1px solid #334155',
              background: mode === 'light' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)',
              color: mode === 'light' ? '#fbbf24' : '#cbd5e1',
              cursor: 'pointer', fontWeight: 'bold'
            }}>💡 光波</button>
          </div>
        </div>

        <SliderControl label={<>波速 <i>v</i></>} unit="m/s"
          min={50} max={maxSpeed} value={waveSpeed} onChange={setWaveSpeed} />
        <SliderControl label={<>频率 <i>ν</i></>} unit={mode === 'light' ? 'THz' : 'Hz'}
          min={mode === 'light' ? 300 : 2} max={mode === 'light' ? 800 : 25}
          value={frequency} onChange={setFrequency} />
        <SliderControl label={<>波源速度 <i>v</i><sub>源</sub></>} unit="m/s" min={-300} max={300} value={sourceVel} onChange={setSourceVel} />
        <SliderControl label={<>观察者速度 <i>v</i><sub>观</sub></>} unit="m/s" min={-300} max={300} value={observerVel} onChange={setObserverVel} />
      </div>

      <FormulaPanel mode={mode} waveSpeed={waveSpeed} observerVel={observerVel} sourceVel={sourceVel}
        frequency={frequency} observedFreq={observedFreqUI} isInvalid={isShockwave || isLightExtreme} />
    </div>
  );
}

// 支持手动输入数值的滑块控件
function SliderControl({ label, unit, min, max, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1' }}>
        <span>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
            style={{
              width: '60px',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#38bdf8',
              padding: '4px 6px',
              textAlign: 'center',
              fontSize: '14px',
              fontFamily: 'monospace',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
            }}
          />
          <span style={{ width: '32px', textAlign: 'left' }}>{unit}</span>
        </div>
      </label>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ cursor: 'pointer', accentColor: '#06b6d4' }} />
    </div>
  );
}

function FormulaPanel({ mode, waveSpeed, observerVel, sourceVel, frequency, observedFreq, isInvalid }) {
  const v = waveSpeed, vo = observerVel, vs = sourceVel, nu = frequency;
  const freqUnit = mode === 'light' ? 'THz' : 'Hz';

  return (
    <div style={{ padding: '20px', background: '#0f172a', color: '#f8fafc', borderTop: '1px solid #334155', fontSize: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 理论公式 */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <strong>理论公式：</strong>
          <div style={{ display: 'flex', alignItems: 'center', fontFamily: '"Times New Roman", serif', fontStyle: 'italic', fontSize: '20px', color: mode === 'sound' ? '#38bdf8' : '#fbbf24' }}>
            {mode === 'sound' ? (
              <>
                <span>ν′ = </span>
                <Fraction numerator={<>v ± v<sub>观</sub></>} denominator={<>v ∓ v<sub>源</sub></>} color="#38bdf8" />
                <span> ν</span>
              </>
            ) : (
              <>
                <span>ν′ = ν </span>
                <span style={{ fontSize: '22px', margin: '0 4px' }}>√</span>
                <Fraction numerator="1 ± β" denominator="1 ∓ β" color="#fbbf24" />
              </>
            )}
          </div>
        </div>

        {/* 实时代入 */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <strong>实时代入（向右为正）：</strong>
          <div style={{ display: 'flex', alignItems: 'center', fontFamily: '"Times New Roman", serif', fontStyle: 'italic', fontSize: '20px', color: '#f8fafc' }}>
            {mode === 'sound' ? (
              <>
                <span>ν′ = </span>
                <Fraction numerator={`${v} - (${vo})`} denominator={`${v} - (${vs})`} color="#38bdf8" />
                <span> × {nu} {freqUnit}</span>
              </>
            ) : (
              (() => {
                const beta = vs / v;
                return (
                  <>
                    <span>ν′ = {nu} × </span>
                    <span style={{ fontSize: '22px', margin: '0 4px' }}>√</span>
                    <Fraction numerator={`1 + (${beta.toFixed(2)})`} denominator={`1 - (${beta.toFixed(2)})`} color="#fbbf24" />
                    <span> {freqUnit}</span>
                  </>
                );
              })()
            )}
            <span> = </span>
            {isInvalid ? (
              <span style={{ marginLeft: '8px', color: '#ef4444', fontWeight: 'bold', fontStyle: 'normal' }}>
                {mode === 'sound' ? '产生激波（频率无定义）' : '达到/超越光速（无定义）'}
              </span>
            ) : (
              <span style={{ marginLeft: '8px', color: '#10b981', fontWeight: 'bold', fontStyle: 'normal' }}>
                {observedFreq?.toFixed(2)} {freqUnit}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Fraction({ numerator, denominator, color = '#38bdf8' }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', margin: '0 6px', lineHeight: 1 }}>
      <span style={{ padding: '0 4px', borderBottom: `2px solid ${color}` }}>{numerator}</span>
      <span style={{ padding: '0 4px', paddingTop: '2px' }}>{denominator}</span>
    </span>
  );
}