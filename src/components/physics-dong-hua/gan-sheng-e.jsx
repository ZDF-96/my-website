 'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Activity,
  Magnet,
  Waves,
  Ruler,
  CircleDot,
  Eye,
} from 'lucide-react';

/**
 * ============================================================================
 * 感生电场与感生电动势仿真实验室 (大学物理教材级严谨版 - 最终性能与抗锯齿优化)
 * GanSheng-E Laboratory - Powered by Maxwell-Faraday Equations
 * ============================================================================
 */

const COLORS = {
  bg: '#020617',
  panel: '#0f172a',
  border: '#334155',
  cyan: '#22d3ee',
  blue: '#38bdf8',
  orange: '#fb923c',
  purple: '#a78bfa',
  green: '#34d399',
  red: '#fb7185',
  white: '#f8fafc',
  text: '#cbd5e1',
  muted: '#64748b',
};

/* ============================================================================
 * 物理常数与单位换算
 * ============================================================================
 * 建立像素坐标与国际单位制（SI）的严格映射：
 * 规定 100 像素 = 0.10 米 (Scale: 1 px = 0.001 m)
 * 这样面积单位为 px² 时可折算为 m²，使得 |ε| = S_phys * |dB/dt| 严格等于伏特 (V)。
 */
const PX_TO_METER = 0.001; 

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 弦几何计算（返回像素几何与物理几何）
 */
function chordGeometry(R_px, h_px) {
  const safeH = clamp(h_px, 0, R_px - 1);
  const half_px = Math.sqrt(Math.max(0, R_px * R_px - safeH * safeH));
  const l_px = 2 * half_px;
  const area_px = 0.5 * l_px * safeH;

  // 转换至 SI 单位 (m, m², m)
  const R_m = R_px * PX_TO_METER;
  const h_m = safeH * PX_TO_METER;
  const l_m = l_px * PX_TO_METER;
  const area_m2 = area_px * (PX_TO_METER ** 2);

  return { half_px, l_px, area_px, R_m, h_m, l_m, area_m2 };
}

/**
 * 感生电场严格解析式 (V/m)
 */
function analyticalE(r_px, R_px, dBdt_val) {
  const r_m = r_px * PX_TO_METER;
  const R_m = R_px * PX_TO_METER;
  const rate = Math.abs(dBdt_val);

  if (r_m <= R_m) {
    return 0.5 * r_m * rate;
  }
  return (R_m * R_m * rate) / (2 * r_m);
}

/* ============================================================================
 * Canvas 绘图工具
 * ========================================================================== */

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawArrow(ctx, x1, y1, x2, y2, color, width = 2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 8;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawText(ctx, text, x, y, options = {}) {
  const {
    color = COLORS.text,
    size = 14,
    weight = '400',
    align = 'left',
    baseline = 'alphabetic',
    family = 'system-ui, -apple-system, sans-serif',
    style = 'normal'
  } = options;
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${style} ${weight} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ============================================================================
 * 核心物理场景绘制
 * ========================================================================== */

function drawSolenoidBoundary(ctx, cx, cy, R) {
  ctx.save();
  ctx.shadowColor = 'rgba(34,211,238,0.25)';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(148,163,184,0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, R + 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  drawText(ctx, '螺线管边界 C', cx + R + 12, cy - 10, {
    color: COLORS.cyan,
    size: 13,
    weight: '600',
  });
  ctx.restore();
}

function drawMagneticField(ctx, cx, cy, R, fieldDir) {
  ctx.save();
  const spacing = 32;
  const alpha = 0.55;

  for (let x = -R + 15; x <= R - 15; x += spacing) {
    for (let y = -R + 15; y <= R - 15; y += spacing) {
      if (x * x + y * y > (R - 14) ** 2) continue;
      const px = cx + x;
      const py = cy + y;
      
      ctx.strokeStyle = fieldDir < 0 ? `rgba(56,189,248,${alpha})` : `rgba(251,113,133,${alpha})`;
      ctx.lineWidth = 1.8;

      if (fieldDir < 0) {
        ctx.beginPath();
        ctx.moveTo(px - 5, py - 5);
        ctx.lineTo(px + 5, py + 5);
        ctx.moveTo(px + 5, py - 5);
        ctx.lineTo(px - 5, py + 5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawVortexField(ctx, cx, cy, R, dBdtVector, flowOffset, showOutside = true) {
  ctx.save();
  const ccw = dBdtVector < 0; 
  const radii = showOutside ? [R * 0.4, R * 0.7, R, R * 1.3, R * 1.6] : [R * 0.4, R * 0.7, R];
  const absRate = Math.abs(dBdtVector);

  radii.forEach((r) => {
    const isInside = r <= R;
    const eMag = analyticalE(r, R, absRate);
    const alpha = clamp(0.2 + eMag * 15, 0.15, 0.85);
    
    ctx.strokeStyle = isInside ? `rgba(34,211,238,${alpha})` : `rgba(56,189,248,${alpha})`;
    ctx.lineWidth = clamp(1.2 + eMag * 18, 1, 3.5);
    ctx.setLineDash([12, 10]);
    ctx.lineDashOffset = ccw ? flowOffset : -flowOffset;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  const arrowR = R * 0.85;
  const arrowCount = 4;
  for (let i = 0; i < arrowCount; i++) {
    const angle = i * (Math.PI * 2 / arrowCount) + flowOffset * 0.02 * (ccw ? 1 : -1);
    const a2 = angle + (ccw ? 0.22 : -0.22);
    drawArrow(
      ctx,
      cx + arrowR * Math.cos(angle),
      cy + arrowR * Math.sin(angle),
      cx + arrowR * Math.cos(a2),
      cy + arrowR * Math.sin(a2),
      COLORS.orange,
      2.2
    );
  }
  ctx.restore();
}

function drawIntegrationLoop(ctx, cx, cy, radius, fieldDirection) {
  ctx.save();
  ctx.strokeStyle = COLORS.purple;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const isCCW = fieldDirection > 0;
  const baseAngle = -Math.PI / 4; 
  const startAngle = isCCW ? baseAngle + 0.15 : baseAngle - 0.15;
  const endAngle = isCCW ? baseAngle - 0.05 : baseAngle + 0.05;

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);

  drawArrow(ctx, x1, y1, x2, y2, COLORS.purple, 2.5);

  const textX = cx + radius * Math.cos(baseAngle) + 15;
  const textY = cy + radius * Math.sin(baseAngle) - 20;

  drawText(ctx, '积分回路 L', textX, textY, { color: COLORS.purple, size: 14, weight: '600' });
  drawText(ctx, 'dl (右手螺旋正向)', textX, textY + 22, { color: COLORS.purple, size: 12, weight: '700', family: 'serif', style: 'italic' });

  ctx.restore();
}

function drawChordModel(ctx, cx, cy, R, h, dBdtVector, flowOffset, uiParams) {
  const { showTriangle, showMicro } = uiParams;
  ctx.save();
  const { half_px } = chordGeometry(R, h);
  const M = { x: cx - half_px, y: cy + h };
  const N = { x: cx + half_px, y: cy + h };

  if (showTriangle) {
    ctx.fillStyle = 'rgba(167,139,250,0.06)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(M.x, M.y);
    ctx.lineTo(N.x, N.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(167,139,250,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(M.x, M.y);
    ctx.moveTo(cx, cy);
    ctx.lineTo(N.x, N.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    drawText(ctx, '数学辅助路径 (非实际导线)', cx + 15, cy + h * 0.4, { color: COLORS.purple, size: 11, style: 'italic' });
  }

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy + h);
  ctx.stroke();
  drawText(ctx, `h`, cx + 8, cy + h / 2, { color: COLORS.text, size: 14, family: 'serif', style: 'italic' });

  ctx.shadowColor = 'rgba(251,146,60,0.5)';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(M.x, M.y);
  ctx.lineTo(N.x, N.y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  drawText(ctx, 'M', M.x - 20, M.y + 6, { color: COLORS.white, size: 16, weight: '700' });
  drawText(ctx, 'N', N.x + 10, N.y + 6, { color: COLORS.white, size: 16, weight: '700' });

  if (showMicro) {
    const P = { x: cx - half_px * 0.3, y: cy + h };
    const dx = 40;
    
    drawArrow(ctx, P.x, P.y, P.x + dx, P.y, COLORS.red, 2.5);
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.arc(P.x, P.y, 4, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, 'dl', P.x + dx + 8, P.y + 4, { color: COLORS.red, size: 14, family: 'serif', style: 'italic' });

    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(P.x, P.y);
    ctx.stroke();
    
    const rx = P.x - cx;
    const ry = P.y - cy;
    const r = Math.sqrt(rx * rx + ry * ry);
    
    const ccw = dBdtVector < 0;
    const sign = ccw ? 1 : -1;
    const eX = -(ry / r) * sign;
    const eY = (rx / r) * sign;
    const arrowLength = 50;
    
    drawArrow(ctx, P.x, P.y, P.x + eX * arrowLength, P.y + eY * arrowLength, COLORS.cyan, 2.5);
    drawText(ctx, 'E', P.x + eX * (arrowLength + 16), P.y + eY * (arrowLength + 16), { color: COLORS.cyan, size: 15, weight: '700', family: 'serif', style: 'italic' });
  }
  ctx.restore();
}

function drawOscilloscope(ctx, x, y, w, h, history) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = 'rgba(15,23,42,0.95)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const paddingX = 55;
  const paddingY = 45;
  const left = x + paddingX;
  const right = x + w - paddingX;
  const top = y + paddingY;
  const bottom = y + h - paddingY;
  const mid = (top + bottom) / 2;

  ctx.strokeStyle = 'rgba(148,163,184,0.15)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    if (i === 2.5) continue;
    const gy = lerp(top, bottom, i / 5);
    ctx.beginPath();
    ctx.moveTo(left, gy);
    ctx.lineTo(right, gy);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(148,163,184,0.5)';
  ctx.lineWidth = 1.5;
  drawArrow(ctx, left, mid, right + 15, mid, 'rgba(148,163,184,0.7)', 1.5);
  drawArrow(ctx, left, bottom, left, top - 15, 'rgba(148,163,184,0.7)', 1.5);

  drawText(ctx, '0', left - 10, mid + 4, { color: COLORS.muted, size: 12, align: 'right' });
  drawText(ctx, 't', right + 20, mid + 16, { color: COLORS.muted, size: 14, family: 'serif', style: 'italic' });
  drawText(ctx, '幅值', left - 10, top - 18, { color: COLORS.muted, size: 12, align: 'center' });

  const legendW = 90;
  const legendH = 55;
  const legendX = right - legendW;
  const legendY = top - 10;
  
  roundRect(ctx, legendX, legendY, legendW, legendH, 6);
  ctx.fillStyle = 'rgba(15,23,42,0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148,163,184,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(legendX + 10, legendY + 18);
  ctx.lineTo(legendX + 25, legendY + 18);
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  drawText(ctx, '∂B/∂t', legendX + 35, legendY + 22, { color: COLORS.blue, size: 11, weight: '600' });

  ctx.beginPath();
  ctx.moveTo(legendX + 10, legendY + 38);
  ctx.lineTo(legendX + 25, legendY + 38);
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  drawText(ctx, 'ε(t)', legendX + 35, legendY + 42, { color: COLORS.orange, size: 11, weight: '600' });

  if (history.length > 1) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round'; // 增加端点圆滑属性
    
    // 基于真实物理时间映射 X 轴坐标，消除因动画帧率波动引起的锯齿与抖动
    const oldestT = history[0].t;
    const newestT = history[history.length - 1].t;
    const timeSpan = newestT - oldestT || 1;
    
    ctx.beginPath();
    history.forEach((point, i) => {
      const px = left + ((point.t - oldestT) / timeSpan) * (right - left);
      const py = mid - clamp(point.dBdtVector / 2.2, -1, 1) * (bottom - top) * 0.45;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    history.forEach((point, i) => {
      const px = left + ((point.t - oldestT) / timeSpan) * (right - left);
      const py = mid - clamp(point.emf / 0.05, -1, 1) * (bottom - top) * 0.45;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  ctx.restore();
}

/* ============================================================================
 * 主组件
 * ========================================================================== */

export default function GanShengESimulation() {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const lastTimeRef = useRef(0);

  const [activeTab, setActiveTab] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [R, setR] = useState(120);
  const [chordH, setChordH] = useState(65);
  const [dBdtAmplitude, setDBdtAmplitude] = useState(1.2);
  const [fieldDirection, setFieldDirection] = useState(-1);
  
  const [showB, setShowB] = useState(true);
  const [showE, setShowE] = useState(true);
  const [showLoop, setShowLoop] = useState(true);
  const [showTriangle, setShowTriangle] = useState(true);
  const [showMicro, setShowMicro] = useState(true);

  // 初始化显示数据
  const [displayVals, setDisplayVals] = useState({ dBdtVector: 0, emf: 0 });

  const physics = useRef({
    time: 0,
    dBdtVector: 0,
    flowOffset: 0,
    history: [],
    lastHudUpdate: 0, // 节流控制标志
  });

  const uiRef = useRef({
    activeTab, R, chordH, dBdtAmplitude, fieldDirection, showB, showE, showLoop, showTriangle, showMicro
  });

  useEffect(() => {
    uiRef.current = { activeTab, R, chordH, dBdtAmplitude, fieldDirection, showB, showE, showLoop, showTriangle, showMicro };
  }, [activeTab, R, chordH, dBdtAmplitude, fieldDirection, showB, showE, showLoop, showTriangle, showMicro]);

  useEffect(() => {
    setChordH((value) => clamp(value, 10, R - 10));
  }, [R]);

  const getFieldStatusText = (dir, val) => {
    const isInside = dir < 0;
    const isEnhancing = val >= 0;
    if (isInside) {
      return isEnhancing ? '纸内磁场增强 (∂Bz/∂t > 0)' : '纸内磁场减弱 (∂Bz/∂t < 0)';
    } else {
      return isEnhancing ? '纸外磁场增强 (∂Bz/∂t > 0)' : '纸外磁场减弱 (∂Bz/∂t < 0)';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = 0; let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);

    // 传入 now 以支持基于系统时间的节流
    const updatePhysics = (dt, now) => {
      const p = physics.current;
      const ui = uiRef.current;

      if (isAnimating) {
        p.time += dt;
        const rawRate = Math.sin(p.time * 0.9) * Math.abs(ui.dBdtAmplitude);
        p.dBdtVector = ui.fieldDirection * rawRate;
        p.flowOffset += p.dBdtVector * dt * 45; 
      }

      const geom = chordGeometry(ui.R, ui.chordH);
      const emf = geom.area_m2 * Math.abs(p.dBdtVector);

      if (isAnimating) {
        p.history.push({ t: p.time, dBdtVector: p.dBdtVector, emf });
        if (p.history.length > 260) p.history.shift();
      }

      // [核心性能修复] - 使用系统时间节流，限制 React State 更新频率 (约 16fps)
      if (!p.lastHudUpdate || now - p.lastHudUpdate > 60) {
        setDisplayVals({ dBdtVector: p.dBdtVector, emf });
        p.lastHudUpdate = now;
      }
    };

    const render = (now) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = clamp((now - lastTimeRef.current) / 1000, 0.001, 0.05);
      lastTimeRef.current = now;

      updatePhysics(dt, now);

      ctx.clearRect(0, 0, width, height);
      
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(148,163,184,0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = 0; y < height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

      const ui = uiRef.current;
      const p = physics.current;
      
      if (ui.activeTab === 0 || ui.activeTab === 1) {
        const cx = width * 0.5;
        const cy = height * 0.5;
        const desktop = width >= 900;
        const visualR = desktop ? Math.min(ui.R, height * 0.28) : Math.min(ui.R, width * 0.27);

        drawSolenoidBoundary(ctx, cx, cy, visualR);
        if (ui.showB) drawMagneticField(ctx, cx, cy, visualR, ui.fieldDirection);
        if (ui.showE) drawVortexField(ctx, cx, cy, visualR, p.dBdtVector, p.flowOffset, ui.activeTab === 0);
        if (ui.showLoop && ui.activeTab === 0) drawIntegrationLoop(ctx, cx, cy, visualR * 1.15, ui.fieldDirection); 
        if (ui.activeTab === 1) drawChordModel(ctx, cx, cy, visualR, ui.chordH, p.dBdtVector, p.flowOffset, ui);
      }

      if (ui.activeTab === 2) {
        const oscW = Math.min(width * 0.85, 800);
        const oscH = Math.min(height * 0.75, 450);
        const oscX = (width - oscW) / 2;
        const oscY = Math.max(20, (height - oscH) / 2 - 20);

        drawOscilloscope(ctx, oscX, oscY, oscW, oscH, p.history);
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(requestRef.current);
      observer.disconnect();
    };
  }, [isAnimating]); 

  const reset = () => {
    // 动态初始化同步重置状态
    const defaultR = 120;
    const defaultH = 65;
    const geom = chordGeometry(defaultR, defaultH);
    const initialRate = 0; 
    
    physics.current = { time: 0, dBdtVector: initialRate, flowOffset: 0, history: [], lastHudUpdate: 0 };
    setR(defaultR);
    setChordH(defaultH);
    setDBdtAmplitude(1.2);
    setFieldDirection(-1);
    setIsAnimating(true);
    
    setDisplayVals({ dBdtVector: initialRate, emf: geom.area_m2 * Math.abs(initialRate) });
  };

  const geom = chordGeometry(R, clamp(chordH, 10, R - 10));

  return (
    <div className="w-full max-w-[1200px] mx-auto rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl shadow-cyan-950/20 text-slate-200 font-sans select-none flex flex-col">
      
      <header className="px-6 py-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center">
            <Waves className="text-cyan-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">感生电动势与感生电场</h2>
            <p className="mt-1 text-xs text-cyan-500/80 tracking-widest uppercase font-mono">
              Maxwell-Faraday Equation Virtual Lab
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsAnimating(!isAnimating)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-sm font-semibold transition-colors">
            {isAnimating ? <><Pause size={16} /> 暂停</> : <><Play size={16} /> 演化</>}
          </button>
          <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
            <RotateCcw size={16} /> 重置
          </button>
        </div>
      </header>

      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[ { t: '感生电场全空间分布', i: Waves }, { t: '非闭合导线电动势', i: Ruler }, { t: '电磁演化示波器', i: Activity } ].map((item, idx) => {
            const Icon = item.i;
            return (
              <button key={idx} onClick={() => setActiveTab(idx)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === idx ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300' : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}>
                <Icon size={16} /> {item.t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] flex-1">
        
        <aside className="border-r border-slate-800 p-6 space-y-8 bg-slate-950/50 z-10 relative">
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-5">
              <Magnet className="text-cyan-400" size={16} /> 系统参数
            </div>
            <div className="space-y-5">
              <Slider label="螺线管半径 R" value={R} min={80} max={180} step={1} unit="px" onChange={setR} />
              <Slider label="磁场变化率幅值" value={dBdtAmplitude} min={0.1} max={2.5} step={0.1} unit="T/s" onChange={setDBdtAmplitude} />
              {activeTab === 1 && (
                <Slider label="导线弦心距 h" value={chordH} min={10} max={R - 10} step={1} unit="px" onChange={setChordH} />
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-5">
              <CircleDot className="text-cyan-400" size={16} /> 磁场方向
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setFieldDirection(-1)} className={`py-2 rounded border text-sm font-medium ${fieldDirection === -1 ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 text-slate-400'}`}>⊗ 纸内</button>
              <button onClick={() => setFieldDirection(1)} className={`py-2 rounded border text-sm font-medium ${fieldDirection === 1 ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' : 'border-slate-700 text-slate-400'}`}>⊙ 纸外</button>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-4">
              <Eye className="text-cyan-400" size={16} /> 显示控制
            </div>
            <div className="space-y-1">
              <Toggle label="磁场分布 B" checked={showB} onChange={setShowB} />
              <Toggle label="涡旋电场线 E" checked={showE} onChange={setShowE} />
              {activeTab === 0 && (
                <Toggle label="积分回路 L" checked={showLoop} onChange={setShowLoop} />
              )}
              {activeTab === 1 && (
                <>
                  <Toggle label="数学辅助三角形" checked={showTriangle} onChange={setShowTriangle} />
                  <Toggle label="电场微元分析 P" checked={showMicro} onChange={setShowMicro} />
                </>
              )}
            </div>
          </section>
        </aside>

        <div className="flex flex-col min-w-0">
          
          <div className="w-full bg-slate-900/60 border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="text-slate-400">∂Bz/∂t：</span>
              <span className="text-blue-400 font-mono font-bold">{displayVals.dBdtVector.toFixed(2)} T/s</span>
            </div>
            
            {activeTab === 1 && (
              <>
                <div>
                  <span className="text-slate-400">面积 S：</span>
                  <span className="text-purple-400 font-mono font-bold">{geom.area_m2.toExponential(2)} m²</span>
                </div>
                <div>
                  <span className="text-slate-400">电动势 |ε|：</span>
                  <span className="text-orange-400 font-mono font-bold">{displayVals.emf.toFixed(4)} V</span>
                </div>
              </>
            )}
            
            <div>
              <span className="font-semibold px-3 py-1 rounded bg-slate-950 border text-cyan-300 border-cyan-500/30">
                {getFieldStatusText(fieldDirection, displayVals.dBdtVector)}
              </span>
            </div>
          </div>

          <main className="relative bg-slate-950 flex-1 w-full min-h-[500px] md:min-h-[600px] overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
          </main>
          
        </div>
      </div>

      <footer className="grid grid-cols-1 md:grid-cols-3 border-t border-slate-800 bg-slate-900/30 mt-auto">
        <InfoCard label="物理核心" title="涡旋电场非保守性" text="感生电场的电场线呈现闭合环状，无法定义标量电势。静电场力做功与路径无关，而感生电场力沿闭合路径做功不为零。" color="cyan" />
        <InfoCard label="麦克斯韦方程" title="∇ × E = −∂B/∂t" text="变化的磁场在其周围空间激发涡旋电场，不论该空间是否存在闭合导线。数学辅助路径仅用于应用法拉第积分定律。" color="purple" />
        <InfoCard label="微积分统一性" title="严格国际单位制 (SI)" text="将像素坐标折算为物理米制尺度后，面积 m² 乘以变化率 T/s 严格输出国际标准伏特 (V)，确保演示具备大学物理讲义级的严谨性。" color="orange" />
      </footer>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-mono text-cyan-400 font-medium">{Number(value).toFixed(step < 1 ? 1 : 0)} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} className="w-full flex items-center justify-between py-2 group">
      <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
      <div className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-cyan-500/70' : 'bg-slate-700'}`}>
        <div className={`absolute top-0.5 w-[14px] h-[14px] rounded-full bg-white transition-all ${checked ? 'left-[17px]' : 'left-0.5'}`} />
      </div>
    </button>
  );
}

function InfoCard({ label, title, text, color }) {
  const colors = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };
  return (
    <div className="p-6 border-r border-slate-800 last:border-r-0">
      <div className={`text-[10px] font-mono tracking-widest uppercase mb-2 ${colors[color]}`}>{label}</div>
      <h3 className="text-sm font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-500">{text}</p>
    </div>
  );
}