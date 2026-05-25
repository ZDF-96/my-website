 'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

/* =========================================
   波长 -> 色相
========================================= */
const wavelengthToHue = (wavelength) => {
  return ((700 - wavelength) / 300) * 240;
};

/* =========================================
   HSL -> RGB
========================================= */
const hslToRgb = (h, s, l) => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

export default function NewtonRingsSimulator() {
  const [wavelength, setWavelength] = useState(550);
  const [radius, setRadius] = useState(2);
  const [probeX, setProbeX] = useState(0);

  const ringsCanvasRef = useRef(null);
  const profileCanvasRef = useRef(null);
  const sideCanvasRef = useRef(null);

  const draggingRef = useRef(false);

  const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const lambda = wavelength * 1e-9;
  const maxOrder = 14;

  /* 环纹表格 */
  const ringData = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const k = i + 1;
      return {
        k,
        dark: (Math.sqrt(k * radius * lambda) * 1000).toFixed(3),
        bright: (Math.sqrt((k - 0.5) * radius * lambda) * 1000).toFixed(3),
      };
    });
  }, [radius, lambda]);

  /* Canvas 上下文获取 */
  const getCanvasContext = (canvas, width, height) => {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return ctx;
  };

  /* =========================================
     绘制牛顿环 ( I = sin²(2πd/λ) )
  ========================================= */
  const drawRings = useCallback(() => {
    const canvas = ringsCanvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = width;
    const ctx = getCanvasContext(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const maxRadiusMeters = Math.sqrt(maxOrder * radius * lambda);
    const scale = (width * 0.42) / maxRadiusMeters;
    const hue = wavelengthToHue(wavelength);

    const image = ctx.createImageData(width, height);
    const data = image.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const rMeters = r / scale;
        const d = (rMeters * rMeters) / (2 * radius);
        let I = Math.pow(Math.sin(2 * Math.PI * d / lambda), 2);
        const fade = Math.exp(-Math.pow(r / (width * 0.43), 6));
        const coherence = Math.exp(-r * 0.002);
        I *= fade * coherence;
        I = 0.04 + I * 0.96;
        I = Math.pow(I, 0.72);

        const rgb = hslToRgb(hue / 360, 0.95, I * 0.82);
        const idx = (y * width + x) * 4;
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    // 探针圆
    const probeScale = width / 520;
    const probeRadiusPx = Math.abs(probeX) * probeScale;
    ctx.beginPath();
    ctx.arc(cx, cy, probeRadiusPx, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,80,80,0.95)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255,80,80,0.9)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + probeRadiusPx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,80,80,1)';
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255,80,80,1)';
    ctx.fill();
  }, [wavelength, radius, probeX, lambda]);

  /* =========================================
     绘制光强曲线
  ========================================= */
  const drawProfile = useCallback(() => {
    const canvas = profileCanvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = 200;
    const ctx = getCanvasContext(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const maxRadiusMeters = Math.sqrt(maxOrder * radius * lambda);
    const scale = (width * 0.42) / maxRadiusMeters;
    const hue = wavelengthToHue(wavelength);

    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const rMeters = Math.abs(x - cx) / scale;
      const d = (rMeters * rMeters) / (2 * radius);
      let I = Math.pow(Math.sin(2 * Math.PI * d / lambda), 2);
      I = Math.pow(I, 0.72);
      const y = height - 30 - I * 140;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsl(${hue},100%,70%)`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = `hsl(${hue},100%,70%)`;
    ctx.stroke();

    // 探针位置
    const probeScale = width / 520;
    const probeCanvasX = cx + probeX * probeScale;
    const rMetersProbe = (Math.abs(probeX) / 520) * (width / scale);
    const dProbe = (rMetersProbe * rMetersProbe) / (2 * radius);
    const intensityProbe = Math.pow(Math.sin(2 * Math.PI * dProbe / lambda), 2);
    const probeY = height - 30 - Math.pow(intensityProbe, 0.72) * 140;

    ctx.beginPath();
    ctx.arc(probeCanvasX, probeY, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,80,80,1)';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255,80,80,1)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(probeCanvasX, height);
    ctx.lineTo(probeCanvasX, probeY);
    ctx.strokeStyle = 'rgba(255,80,80,0.5)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.stroke();
  }, [wavelength, radius, probeX, lambda]);

  /* =========================================
     绘制侧视图 (美化版，优质交互)
  ========================================= */
  const drawSideView = useCallback(() => {
    const canvas = sideCanvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = 220;
    const ctx = getCanvasContext(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const baseY = 150; // 平板上表面
    const lensWidth = width * 0.35;
    const depth = 55 + (5 - radius) * 7;

    // ---- 平板玻璃 (更立体) ----
    const plateThickness = 12;
    const plateTop = baseY;
    const plateBottom = baseY + plateThickness;

    // 平板主体渐变
    const plateGrad = ctx.createLinearGradient(0, plateTop, 0, plateBottom);
    plateGrad.addColorStop(0, '#1e293b');
    plateGrad.addColorStop(0.4, '#334155');
    plateGrad.addColorStop(0.6, '#0f172a');
    plateGrad.addColorStop(1, '#020617');
    ctx.fillStyle = plateGrad;
    ctx.fillRect(cx - width * 0.45, plateTop, width * 0.9, plateThickness);

    // 平板上表面高光线
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.45, plateTop);
    ctx.lineTo(cx + width * 0.45, plateTop);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 平板下表面暗线
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.45, plateBottom);
    ctx.lineTo(cx + width * 0.45, plateBottom);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ---- 透镜 (下表面中心接触平板) ----
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - lensWidth, baseY - depth);
    // 二次贝塞尔曲线，控制点位于下方，使得中心正好在 baseY
    ctx.quadraticCurveTo(cx, baseY + depth * 0.3, cx + lensWidth, baseY - depth);
    ctx.lineTo(cx + lensWidth, 25);
    ctx.lineTo(cx - lensWidth, 25);
    ctx.closePath();
    ctx.clip();

    // 透镜内部填充
    const lensGrad = ctx.createRadialGradient(cx - lensWidth * 0.2, baseY - depth * 0.3, 10, cx, baseY - depth * 0.1, lensWidth * 1.3);
    lensGrad.addColorStop(0, 'rgba(34,211,238,0.08)');
    lensGrad.addColorStop(0.4, 'rgba(34,211,238,0.22)');
    lensGrad.addColorStop(0.8, 'rgba(8,145,178,0.45)');
    lensGrad.addColorStop(1, 'rgba(4,47,67,0.8)');
    ctx.fillStyle = lensGrad;
    ctx.fillRect(cx - lensWidth - 10, 20, lensWidth * 2 + 20, height);

    // 透镜边缘描边
    ctx.beginPath();
    ctx.moveTo(cx - lensWidth, baseY - depth);
    ctx.quadraticCurveTo(cx, baseY + depth * 0.3, cx + lensWidth, baseY - depth);
    ctx.lineTo(cx + lensWidth, 25);
    ctx.lineTo(cx - lensWidth, 25);
    ctx.closePath();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(34,211,238,0.6)';
    ctx.stroke();

    // 透镜下表面高光弧线
    ctx.beginPath();
    ctx.moveTo(cx - lensWidth, baseY - depth);
    ctx.quadraticCurveTo(cx, baseY + depth * 0.3, cx + lensWidth, baseY - depth);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(34,211,238,0.9)';
    ctx.stroke();

    // 接触点发光
    ctx.beginPath();
    ctx.arc(cx, baseY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#22d3ee';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#22d3ee';
    ctx.fill();

    ctx.restore();

    // ---- 可拖动的红点 (探针) ----
    const probeScale = width / 520;
    const px = cx + probeX * probeScale;
    // 红点所在透镜下表面 y 坐标 (二次曲线)
    const t = Math.min(1, Math.max(-1, (probeX * probeScale) / lensWidth));
    const py = baseY - depth * (1 - t * t);

    // 红色光晕
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,80,80,0.25)';
    ctx.fill();

    // 主红点
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4040';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff4040';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 到平板的虚线
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, baseY);
    ctx.strokeStyle = 'rgba(255,80,80,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]); // 重置
  }, [radius, probeX]);

  /* =========================================
     鼠标/触摸交互 (点击 + 拖动)
  ========================================= */
  const updateProbeFromClientX = useCallback((clientX) => {
    const canvas = sideCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let x = clientX - rect.left - rect.width / 2;
    const maxX = rect.width / 2 - 10;
    x = Math.max(-maxX, Math.min(maxX, x));
    const mappedX = x * (520 / rect.width);
    setProbeX(mappedX);
  }, []);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    updateProbeFromClientX(e.clientX);
  }, [updateProbeFromClientX]);

  const handleMouseMove = useCallback((e) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    updateProbeFromClientX(e.clientX);
  }, [updateProbeFromClientX]);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    const touch = e.touches[0];
    if (touch) updateProbeFromClientX(touch.clientX);
  }, [updateProbeFromClientX]);

  const handleTouchMove = useCallback((e) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) updateProbeFromClientX(touch.clientX);
  }, [updateProbeFromClientX]);

  const handleTouchEnd = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // 全局监听 mouseup/touchend 以处理在 canvas 外释放的情况
  useEffect(() => {
    const handleGlobalUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  /* =========================================
     重绘
  ========================================= */
  useEffect(() => {
    drawRings();
    drawProfile();
    drawSideView();
  }, [drawRings, drawProfile, drawSideView]);

  useEffect(() => {
    const handleResize = () => {
      drawRings();
      drawProfile();
      drawSideView();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawRings, drawProfile, drawSideView]);

  /* =========================================
     探针物理量
  ========================================= */
  const maxRadiusMetersBase = Math.sqrt(maxOrder * radius * lambda);
  const scaleBase = (520 * 0.42) / maxRadiusMetersBase;
  const probeRadiusMeters = Math.abs(probeX) / scaleBase;
  const thickness = (probeRadiusMeters * probeRadiusMeters) / (2 * radius);
  const delta = 4 * Math.PI * thickness / lambda;
  const intensity = Math.pow(Math.sin(delta / 2), 2);
  const interferenceType = intensity > 0.5 ? '相长干涉（亮纹）' : '相消干涉（暗纹）';

  // 光程差 2d，以波长倍数和纳米显示
  const twoD = 2 * thickness;
  const twoD_nm = twoD * 1e9;
  const twoD_in_lambda = twoD / lambda;

  return (
    <div className="w-full rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 p-4 md:p-8 shadow-2xl overflow-hidden">
      <h2 className="mb-8 text-3xl font-bold text-white">牛顿环干涉实验室</h2>

      <div className="mb-8 space-y-6">
        <div>
          <div className="mb-2 flex justify-between text-sm text-slate-300">
            <span>波长</span>
            <span>{wavelength} nm</span>
          </div>
          <input
            type="range"
            min="400"
            max="700"
            value={wavelength}
            onChange={(e) => setWavelength(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
        <div>
          <div className="mb-2 flex justify-between text-sm text-slate-300">
            <span>曲率半径</span>
            <span>{radius.toFixed(1)} m</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* 侧视图 */}
        <div className="min-w-0">
          <div className="mb-3 text-center text-sm text-slate-300">
            空气膜侧视图（点击或拖动红点）
          </div>
          <canvas
            ref={sideCanvasRef}
            className="w-full rounded-2xl border border-slate-700 bg-black/30 cursor-pointer touch-none"
            style={{ height: '220px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* 牛顿环 */}
        <div className="min-w-0">
          <div className="mb-3 text-center text-sm text-slate-300">
            牛顿环干涉图样
          </div>
          <canvas
            ref={ringsCanvasRef}
            className="w-full rounded-2xl border border-slate-700 bg-black aspect-square"
          />
        </div>

        {/* 强度曲线 */}
        <div className="min-w-0">
          <div className="mb-3 text-center text-sm text-slate-300">
            光强分布曲线
          </div>
          <canvas
            ref={profileCanvasRef}
            className="w-full rounded-2xl border border-slate-700 bg-black/30"
            style={{ height: '200px' }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5">
          <div className="mb-3 text-lg font-semibold text-cyan-300">当前探针信息</div>
          <div className="space-y-2 text-sm text-cyan-100">
            <div>半径位置：{(probeRadiusMeters * 1000).toFixed(3)} mm</div>
            <div>膜厚 d：{(thickness * 1e9).toFixed(3)} nm</div>
            <div>
              光程差 2d：{twoD_in_lambda.toFixed(2)} λ ({twoD_nm.toFixed(1)} nm)
            </div>
            <div>光强 I：{intensity.toFixed(3)}</div>
            <div className="font-semibold text-cyan-300">{interferenceType}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
          <div className="mb-3 text-lg font-semibold text-white">前五级环纹半径</div>
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr>
                <th>级次</th>
                <th>暗纹 (mm)</th>
                <th>亮纹 (mm)</th>
              </tr>
            </thead>
            <tbody>
              {ringData.map((r) => (
                <tr key={r.k} className="border-t border-slate-800 text-center text-slate-300">
                  <td className="py-2">{r.k}</td>
                  <td>{r.dark}</td>
                  <td>{r.bright}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}