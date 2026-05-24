'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// 辅助函数：根据波长计算色相 (400nm -> 240° 紫色/蓝, 550nm -> 120° 绿, 700nm -> 0° 红)
const wavelengthToHue = (wavelength) => {
  let hue = ((700 - wavelength) / 300) * 240; // 700nm->0, 400nm->240
  hue = Math.min(240, Math.max(0, hue));
  return hue;
};

const NewtonRingsLab = () => {
  const [wavelength, setWavelength] = useState(550); // nm
  const [radius, setRadius] = useState(2.0); // m

  const canvasRef = useRef(null);
  const profileCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // 辅助函数：hsl 转 rgb
  const hslToRgb = (h, s, l) => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  // 绘制牛顿环图案
  const drawNewtonRings = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadiusPx = Math.min(centerX, centerY);

    const lambda = wavelength * 1e-9;
    const R = radius;

    const maxOrder = 14;
    const maxPhysicalRadius = Math.sqrt(maxOrder * R * lambda);
    const scale = maxRadiusPx / maxPhysicalRadius;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const hue = wavelengthToHue(wavelength);
    const saturation = 85;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const rPx = Math.hypot(dx, dy);
        const idx = (y * width + x) * 4;

        if (rPx > maxRadiusPx) {
          data[idx] = 10; data[idx+1] = 15; data[idx+2] = 30; data[idx+3] = 255;
          continue;
        }
        const rMeters = rPx / scale;
        let intensity = Math.pow(Math.sin(Math.PI * rMeters * rMeters / (R * lambda)), 2);
        intensity = Math.pow(intensity, 0.8);

        const lightness = 30 + intensity * 65;
        const rgb = hslToRgb(hue / 360, saturation / 100, lightness / 100);
        
        data[idx] = rgb.r;
        data[idx+1] = rgb.g;
        data[idx+2] = rgb.b;
        data[idx+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [wavelength, radius]);

  // 绘制强度分布曲线
  const drawIntensityProfile = useCallback(() => {
    const canvas = profileCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, width, height);
    
    const lambda = wavelength * 1e-9;
    const R = radius;
    const maxOrder = 14;
    const maxR_mm = Math.sqrt(maxOrder * R * lambda) * 1000;
    
    const margin = { left: 50, right: 30, top: 20, bottom: 30 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    ctx.strokeStyle = '#88aaff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();
    
    ctx.fillStyle = `hsl(${wavelengthToHue(wavelength)}, 100%, 65%)`;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const r_mm = (i / 200) * maxR_mm;
      const intensity = Math.pow(Math.sin(Math.PI * (r_mm/1000) * (r_mm/1000) / (R * lambda)), 2);
      const x = margin.left + (i / 200) * plotWidth;
      const y = height - margin.bottom - intensity * plotHeight;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [wavelength, radius]);

  useEffect(() => {
    drawNewtonRings();
    drawIntensityProfile();
  }, [drawNewtonRings, drawIntensityProfile]);

  return (
    <div className="newton-rings-lab" style={{ background: '#0b1120', minHeight: '100vh', padding: '2rem 1rem', color: '#eef5ff' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem' }}>牛顿环干涉实验室</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <div ref={containerRef} style={{ background: '#0c1626', padding: '1rem', borderRadius: '2rem' }}>
            <canvas ref={canvasRef} width={480} height={480} style={{ width: '100%', height: 'auto', background: '#02040c' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="range" min="400" max="700" value={wavelength} onChange={(e) => setWavelength(Number(e.target.value))} />
            <input type="range" min="0.8" max="5.0" step="0.01" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
            <canvas ref={profileCanvasRef} width={480} height={220} style={{ width: '100%', height: 'auto', background: '#03060e' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewtonRingsLab;