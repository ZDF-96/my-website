'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

// ============================================================================
// 绘图辅助工具库：Retina 高分屏适配、教材级元件图元、动态电流粒子、矢量箭头
// ============================================================================
function setupHighDPICanvas(canvas, width, height) {
  if (!canvas) return null;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/**
 * 绘制标准欧式矩形电阻 (IEC 60617 标准)
 */
function drawResistor(
  ctx,
  x,
  y,
  angle,
  label,
  subLabel = '',
  color = '#3b82f6',
  fill = '#1e3a8a',
  labelOffset = -20
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const w = 42;
  const h = 14;
  ctx.fillStyle = fill;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 2.5);
  ctx.fill();
  ctx.stroke();

  // 逆旋转使文字始终保持水平正立
  ctx.rotate(-angle);
  const nx = -Math.sin(angle) * labelOffset;
  const ny = Math.cos(angle) * labelOffset;
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, nx, ny - (subLabel ? 6 : 0));
  if (subLabel) {
    ctx.fillStyle = '#93c5fd';
    ctx.font = '11px ui-monospace, SFMono-Regular, monospace';
    ctx.fillText(subLabel, nx, ny + 8);
  }
  ctx.restore();
}

/**
 * 绘制直流电源图元 (沿 angle 方向由负极 - 指向正极 +，即电动势方向)
 * 修复了任意旋转角度下 +/- 极性符号始终正立的坐标变换
 */
function drawBattery(ctx, x, y, angle, label, subLabel = '', labelOffset = -28, showDashedBox = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // 可选：绘制实际电源模型外围虚线框
  if (showDashedBox) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.roundRect(-22, -20, 44, 40, 5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 擦除极板间背景导线间隙
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-5, -14, 10, 28);

  // 负极短粗板 (左: -5)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-5, -8.5);
  ctx.lineTo(-5, 8.5);
  ctx.stroke();

  // 正极长细板 (右: +5，电动势方向由 -5 指向 +5)
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(5, -14.5);
  ctx.lineTo(5, 14.5);
  ctx.stroke();

  // 逆旋转回屏幕水平坐标系，确保 '+' 和 '−' 极性符号在任何角度下均不颠倒
  ctx.rotate(-angle);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const toScreen = (lx, ly) => [lx * cosA - ly * sinA, lx * sinA + ly * cosA];

  const [px, py] = toScreen(12, -10);
  const [mx, my] = toScreen(-12, -10);
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f43f5e';
  ctx.fillText('+', px, py);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('−', mx, my);

  const nx = -sinA * labelOffset;
  const ny = cosA * labelOffset;
  ctx.fillStyle = '#fda4af';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(label, nx, ny - (subLabel ? 6 : 0));
  if (subLabel) {
    ctx.fillStyle = '#fecdd3';
    ctx.font = '11px ui-monospace, SFMono-Regular, monospace';
    ctx.fillText(subLabel, nx, ny + 8);
  }
  ctx.restore();
}

/**
 * 沿折线绘制动态发光电荷粒子流 (反映实际电流方向与速率)
 */
function drawParticlesAlongPolyline(ctx, points, phase, currentAmp, color = '#38bdf8', spacing = 36) {
  if (Math.abs(currentAmp) < 1e-4) return;
  const segs = [];
  let totalLen = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    const dy = points[i + 1][1] - points[i][1];
    const len = Math.hypot(dx, dy);
    segs.push({ x0: points[i][0], y0: points[i][1], dx, dy, len, start: totalLen });
    totalLen += len;
  }
  if (totalLen <= 0) return;

  const count = Math.max(2, Math.floor(totalLen / spacing));
  const step = totalLen / count;
  const dir = currentAmp >= 0 ? 1 : -1;
  const shift = ((phase * dir) % step + step) % step;

  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 7;
  for (let k = 0; k < count; k++) {
    const d = (k * step + shift) % totalLen;
    for (let s = 0; s < segs.length; s++) {
      const seg = segs[s];
      if (d >= seg.start && d <= seg.start + seg.len) {
        const t = (d - seg.start) / (seg.len || 1);
        const px = seg.x0 + seg.dx * t;
        const py = seg.y0 + seg.dy * t;
        ctx.beginPath();
        ctx.arc(px, py, 3.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }
  ctx.restore();
}

/**
 * 绘制支路电流参考方向箭头 (若实际电流反向则高亮琥珀色警示)
 */
function drawRefArrow(ctx, x, y, angle, label, isReversed = false, labelDy = -13) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const col = isReversed ? '#f59e0b' : '#f43f5e';
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, 0);
  ctx.lineTo(11, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(6.5, -4.2);
  ctx.lineTo(6.5, 4.2);
  ctx.closePath();
  ctx.fill();

  ctx.rotate(-angle);
  ctx.font = 'bold 11.5px ui-monospace, SFMono-Regular, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, labelDy);
  ctx.restore();
}

/**
 * 绘制带半透明胶囊背景的清晰文本标签（防止 3D 棱交叉处文字重叠）
 */
function drawPillText(ctx, text, x, y, textColor = '#f8fafc', bgColor = 'rgba(15, 23, 42, 0.85)', borderColor = '#334155') {
  ctx.save();
  ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
  const metrics = ctx.measureText(text);
  const pw = metrics.width + 10;
  const ph = 17;
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

// ============================================================================
// 主组件：基尔霍夫定律与复杂直流网络交互式实验室 (大学教材级精修版)
// ============================================================================
export default function KirchhoffLawSimulation() {
  const [activeTab, setActiveTab] = useState('dualMesh');

  // --------------------------------------------------------------------------
  // 模块 1 状态：双网孔多电源电路（对应例题 1 / 图 1.4）
  // --------------------------------------------------------------------------
  const [m1, setM1] = useState({
    E1: 3.0,
    E2: 1.2,
    r1: 0.5,
    r2: 0.5,
    R1: 1.0,
    R2: 5.0,
    R3: 4.5,
    R4: 9.0,
  });

  const m1Calc = useMemo(() => {
    const RL = m1.R2 + m1.R3 + m1.r1;
    const RR = m1.R2 + m1.R3 + m1.r2;
    const RM = m1.R1 + m1.R4;
    const a11 = RL + RM;
    const a12 = RM;
    const a21 = RM;
    const a22 = RR + RM;
    const det = a11 * a22 - a12 * a21;
    const det1 = m1.E1 * a22 - m1.E2 * a12;
    const det2 = a11 * m1.E2 - a21 * m1.E1;
    const I1 = det1 / det; // A
    const I2 = det2 / det; // A
    const IM = I1 + I2;    // A
    const UAC = IM * RM;   // V

    // 弥尔曼公式直接核验
    const G_L = 1 / RL;
    const G_R = 1 / RR;
    const G_M = 1 / RM;
    const UAC_millman = (m1.E1 * G_L + m1.E2 * G_R) / (G_L + G_R + G_M);

    // 功率平衡核验 (特勒根定理)
    const P_src1 = m1.E1 * I1; // W
    const P_src2 = m1.E2 * I2; // W (若 < 0 表示电源 E2 吸收电能被反充)
    const P_total_src = P_src1 + P_src2;
    const P_joule = I1 * I1 * RL + I2 * I2 * RR + IM * IM * RM;

    return {
      RL, RR, RM, a11, a12, a21, a22, det, det1, det2,
      I1, I2, IM, UAC, UAC_millman,
      P_src1, P_src2, P_total_src, P_joule,
    };
  }, [m1]);

  // --------------------------------------------------------------------------
  // 模块 2 状态：非平衡惠斯通电桥与测温传感器（对应例题 2 / 图 1.5 & 练习 3）
  // --------------------------------------------------------------------------
  const [m2, setM2] = useState({
    E: 14.0,
    R1: 1.0,
    R2: 3.0,
    R3: 2.0,
    R4: 1.0,
    RG: 1.0,
    sensorMode: false,
    R0: 2.0,
    delta: 0.15, // R_t = R0 * (1 + delta)
  });

  const m2Calc = useMemo(() => {
    const R1 = m2.sensorMode ? m2.R0 : m2.R1;
    const R2 = m2.sensorMode ? m2.R0 : m2.R2;
    const R3 = m2.sensorMode ? m2.R0 : m2.R3;
    const R4 = m2.sensorMode ? +(m2.R0 * (1 + m2.delta)).toFixed(4) : m2.R4;
    const RG = m2.RG;
    const E = m2.E;

    // 克拉默法则三阶行列式按第三列零元拉普拉斯降阶公式
    const detG = (R2 * R3 - R1 * R4) * E;
    const det = RG * (R1 + R2) * (R3 + R4) + R1 * R2 * (R3 + R4) + R3 * R4 * (R1 + R2);
    const det1 = E * (R2 * (R3 + R4 + RG) + R4 * RG);
    const det2 = E * (R1 * (R3 + R4 + RG) + R3 * RG);

    const IG = detG / det;
    const I1 = det1 / det;
    const I2 = det2 / det;
    const I3 = I1 - IG;
    const I4 = I2 + IG;
    const Itotal = I1 + I2;
    const Req = Itotal > 1e-9 ? E / Itotal : Infinity;

    // 节点电位 (以 VC = 0 为基准，VA = E)
    const VA = E;
    const VC = 0;
    const VB = VA - I1 * R1;
    const VD = VA - I2 * R2;

    // 平衡点阻值 R4* 与微扰相对偏离度 delta_eff
    const R4_bal = (R2 * R3) / R1;
    const delta_eff = (R4 - R4_bal) / R4_bal;

    // 平衡点处的一阶泰勒线性微扰响应
    const den_bal =
      RG * (R1 + R2) * (R3 + R4_bal) +
      R1 * R2 * (R3 + R4_bal) +
      R3 * R4_bal * (R1 + R2);
    const IG_linear = (-R1 * R4_bal * E * delta_eff) / den_bal;
    const relError = Math.abs(IG) > 1e-6 ? Math.abs((IG - IG_linear) / IG) * 100 : 0;

    return {
      R1, R2, R3, R4, RG, E,
      detG, det, det1, det2,
      IG, I1, I2, I3, I4, Itotal, Req,
      VA, VB, VC, VD,
      R4_bal, delta_eff, IG_linear, relError,
    };
  }, [m2]);

  // --------------------------------------------------------------------------
  // 模块 3 状态：正立方体十二电阻框架 3D 对称性（对应例题 3 / 图 1.6）
  // --------------------------------------------------------------------------
  const [m3, setM3] = useState({
    mode: 'bodyDiag', // 'bodyDiag' (A-G', 5/6 R) | 'faceDiag' (A-C, 3/4 R) | 'edge' (A-B, 7/12 R)
    R: 12.0,
    I: 6.0,
    showSymmetry: true,
    yaw: -0.52,
    pitch: 0.36,
  });

  // --------------------------------------------------------------------------
  // 模块 4 状态：广义 KCL 与麦克斯韦位移电流（对应图 1.3 & 练习 4）
  // --------------------------------------------------------------------------
  const [m4, setM4] = useState({
    E: 12.0,      // V
    R1: 2.0,      // kOhm
    R2: 4.0,      // kOhm
    C: 5.0,       // uF
    uC: 4.0,      // 当前瞬时电容电压 V (默认定格在练习 4 的 4.0 V)
    autoPlay: true,
    gaussianMode: 'singlePlate', // 'singlePlate' (S = S1 U S2) | 'supernode' (S')
  });

  const m4Calc = useMemo(() => {
    const Uth = m4.E * (m4.R2 / (m4.R1 + m4.R2)); // 戴维南开路稳态电压 V
    const Rth = (m4.R1 * m4.R2) / (m4.R1 + m4.R2); // 戴维南等效内阻 kOhm
    const tau = Rth * m4.C; // 时间常数 ms (kOhm * uF = ms)
    const uC = Math.min(m4.uC, Uth);
    const I1 = (m4.E - uC) / m4.R1; // mA
    const I2 = uC / m4.R2;          // mA
    const Ic = I1 - I2;             // mA (极板引线传导电流)
    const Id = Ic;                  // mA (极板间麦克斯韦位移电流)
    const duCdt = (Id / m4.C) * 1000; // V/s (mA / uF = 1000 V/s)
    const q = m4.C * uC;            // 极板带电量 uC
    const Ic0 = m4.E / m4.R1;       // t=0+ 初始最大充电电流 mA
    return { Uth, Rth, tau, uC, I1, I2, Ic, Id, duCdt, q, Ic0 };
  }, [m4]);

  const canvasRef = useRef(null);
  const phaseRef = useRef({ p1: 0, p2: 0, p3: 0, p4: 0 });
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });

  // --------------------------------------------------------------------------
  // 模块 4 自动充电暂态演化计时器
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'displacement' || !m4.autoPlay) return;
    let rafId;
    let lastTime = performance.now();
    const tick = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setM4((prev) => {
        const Uth = prev.E * (prev.R2 / (prev.R1 + prev.R2));
        let nextU = prev.uC + dt * (Uth * 0.22);
        if (nextU >= Uth * 0.992) nextU = 0;
        return { ...prev, uC: +nextU.toFixed(2) };
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeTab, m4.autoPlay]);

  // --------------------------------------------------------------------------
  // 主 Canvas 渲染引擎
  // --------------------------------------------------------------------------
  useEffect(() => {
    let animationFrameId;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = setupHighDPICanvas(canvas, 860, 470);
      if (!ctx) return;

      // 背景与精密坐标网格
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 860, 470);
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 860; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 470);
        ctx.stroke();
      }
      for (let y = 0; y <= 470; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(860, y);
        ctx.stroke();
      }

      // ======================================================================
      // 渲染模块 1：双网孔多电源电路 (例题 1 / 图 1.4)
      // ======================================================================
      if (activeTab === 'dualMesh') {
        phaseRef.current.p1 += 0.85;
        const p = phaseRef.current.p1;

        const Ax = 250, Ay = 75;
        const Cx = 250, Cy = 385;
        const Lx = 72, Rx = 428;

        // 主电路导线
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Cx, Cy);
        ctx.lineTo(Lx, Cy);
        ctx.lineTo(Lx, Ay);
        ctx.lineTo(Ax, Ay);
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Cx, Cy);
        ctx.moveTo(Cx, Cy);
        ctx.lineTo(Rx, Cy);
        ctx.lineTo(Rx, Ay);
        ctx.lineTo(Ax, Ay);
        ctx.stroke();

        // 动态电流粒子 (方向严格反映实际电流流向，速率正比于电流幅值)
        drawParticlesAlongPolyline(
          ctx,
          [[Cx, Cy], [Lx, Cy], [Lx, Ay], [Ax, Ay]],
          p * Math.min(3.2, Math.max(0.35, Math.abs(m1Calc.I1) * 10)),
          m1Calc.I1,
          '#38bdf8',
          38
        );
        drawParticlesAlongPolyline(
          ctx,
          [[Ax, Ay], [Cx, Cy]],
          p * Math.min(3.2, Math.max(0.35, Math.abs(m1Calc.IM) * 10)),
          m1Calc.IM,
          '#34d399',
          38
        );
        drawParticlesAlongPolyline(
          ctx,
          [[Cx, Cy], [Rx, Cy], [Rx, Ay], [Ax, Ay]],
          p * Math.min(3.2, Math.max(0.35, Math.abs(m1Calc.I2) * 10)),
          m1Calc.I2,
          m1Calc.I2 < 0 ? '#fbbf24' : '#38bdf8',
          38
        );

        // 左支路元件：R3 (下竖), 实际电源 (E1, r1), R2 (上横)
        drawResistor(ctx, Lx, 295, -Math.PI / 2, 'R₃', `${m1.R3.toFixed(1)}Ω`, '#60a5fa', '#1e3a8a', -28);
        drawBattery(ctx, Lx, 165, -Math.PI / 2, `ℰ₁=${m1.E1.toFixed(1)}V`, `r₁=${m1.r1.toFixed(1)}Ω`, -38, true);
        drawResistor(ctx, 155, Ay, 0, 'R₂', `${m1.R2.toFixed(1)}Ω`, '#60a5fa', '#1e3a8a', -22);

        // 中支路元件：R1 (上), R4 (下)
        drawResistor(ctx, Ax, 162, Math.PI / 2, 'R₁', `${m1.R1.toFixed(1)}Ω`, '#34d399', '#064e3b', -28);
        drawResistor(ctx, Ax, 298, Math.PI / 2, 'R₄', `${m1.R4.toFixed(1)}Ω`, '#34d399', '#064e3b', -28);

        // 右支路元件：R3 (下竖), 实际电源 (E2, r2), R2 (上横)
        drawResistor(ctx, Rx, 295, -Math.PI / 2, 'R₃', `${m1.R3.toFixed(1)}Ω`, '#60a5fa', '#1e3a8a', 28);
        drawBattery(ctx, Rx, 165, -Math.PI / 2, `ℰ₂=${m1.E2.toFixed(1)}V`, `r₂=${m1.r2.toFixed(1)}Ω`, 38, true);
        drawResistor(ctx, 345, Ay, 0, 'R₂', `${m1.R2.toFixed(1)}Ω`, '#60a5fa', '#1e3a8a', -22);

        // 支路参考方向箭头 (固定参考方向，若计算值为负则高亮橙色)
        drawRefArrow(ctx, 210, Ay + 18, 0, `I₁=${(m1Calc.I1 * 1000).toFixed(0)}mA`, m1Calc.I1 < 0, 14);
        drawRefArrow(ctx, 290, Ay + 18, Math.PI, `I₂=${(m1Calc.I2 * 1000).toFixed(0)}mA`, m1Calc.I2 < 0, 14);
        drawRefArrow(ctx, Ax + 22, 230, Math.PI / 2, `I_M=${(m1Calc.IM * 1000).toFixed(0)}mA`, m1Calc.IM < 0, -14);

        // 网孔绕行方向标记 (回路 I 顺时针 ACBA，回路 II 逆时针 ACDEA)
        ctx.save();
        ctx.strokeStyle = '#2dd4bf';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(160, 230, 28, -Math.PI * 0.65, Math.PI * 0.65, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(340, 230, 28, -Math.PI * 0.35, -Math.PI * 1.65, true);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#2dd4bf';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('回路 I', 160, 224);
        ctx.fillText('(顺时针)', 160, 238);
        ctx.fillText('回路 II', 340, 224);
        ctx.fillText('(逆时针)', 340, 238);
        ctx.restore();

        // 节点标注
        const drawNode = (x, y, name, dx, dy, isPrimary = false) => {
          ctx.fillStyle = isPrimary ? '#f43f5e' : '#94a3b8';
          ctx.beginPath();
          ctx.arc(x, y, isPrimary ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isPrimary ? '#f8fafc' : '#cbd5e1';
          ctx.font = isPrimary ? 'bold 12.5px sans-serif' : 'bold 11.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(name, x + dx, y + dy);
        };
        drawNode(Ax, Ay, `节点 A (${m1Calc.UAC.toFixed(2)}V)`, 0, -15, true);
        drawNode(Cx, Cy, '基准节点 C (0.00V)', 0, 20, true);
        drawNode(Lx, 230, 'B', -15, 4);
        drawNode(Rx, 345, 'D', 15, 4);
        drawNode(Rx, 112, 'E', 15, 4);

        // 右侧面板：自适应量程 KVL 闭合回路电势升降图 + 功率平衡核验 (x: 495..842)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(495, 18, 348, 434, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('KVL 回路电势升降追踪 (以 V_C = 0V 为基准)', 512, 42);

        // 计算左右网孔各特征位置电势
        const vAfterR3_L = -m1Calc.I1 * m1.R3;
        const vAfterE1_L = vAfterR3_L + m1.E1 - m1Calc.I1 * m1.r1;
        const vNodeA = m1Calc.UAC;

        const vAfterR3_R = -m1Calc.I2 * m1.R3;
        const vAfterE2_R = vAfterR3_R + m1.E2 - m1Calc.I2 * m1.r2;

        // 动态计算包络，彻底防止高电压下折线冲出顶部
        const allVoltages = [0, vAfterR3_L, vAfterE1_L, vNodeA, vAfterR3_R, vAfterE2_R];
        const vMax = Math.max(...allVoltages, 1.5);
        const vMin = Math.min(...allVoltages, -0.8);
        const vSpan = Math.max(2.0, vMax - vMin);

        const plotTop = 64;
        const plotBottom = 236;
        const plotH = plotBottom - plotTop;
        const scaleY = (plotH * 0.82) / vSpan;
        const plotY0 = plotTop + plotH * 0.1 + vMax * scaleY;
        const plotX0 = 542;
        const plotW = 280;

        // 绘图区背景框与零电势基准线
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(512, plotTop - 6, 316, plotH + 30, 6);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#475569';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(plotX0, plotY0);
        ctx.lineTo(plotX0 + plotW, plotY0);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10.5px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('0.0V', plotX0 - 6, plotY0 + 3);
        ctx.fillText(`${vMax.toFixed(1)}V`, plotX0 - 6, plotY0 - vMax * scaleY + 4);

        const xCoords = [plotX0, plotX0 + 68, plotX0 + 140, plotX0 + 210, plotX0 + 280];
        const ptsL = [
          [xCoords[0], plotY0],
          [xCoords[1], plotY0 - vAfterR3_L * scaleY],
          [xCoords[2], plotY0 - vAfterE1_L * scaleY],
          [xCoords[3], plotY0 - vNodeA * scaleY],
          [xCoords[4], plotY0],
        ];
        const ptsR = [
          [xCoords[0], plotY0],
          [xCoords[1], plotY0 - vAfterR3_R * scaleY],
          [xCoords[2], plotY0 - vAfterE2_R * scaleY],
          [xCoords[3], plotY0 - vNodeA * scaleY],
          [xCoords[4], plotY0],
        ];

        // 绘制左回路电势轨迹 (青蓝色)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ptsL.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
        ptsL.forEach(([x, y]) => {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // 绘制右回路电势轨迹 (琥珀色)
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ptsR.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
        ptsR.forEach(([x, y]) => {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // 横轴阶段名称
        const stageNames = ['节点C', '过R₃后', '过电源后', '节点A', '回节点C'];
        stageNames.forEach((st, idx) => {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(st, xCoords[idx], plotBottom + 16);
        });

        // 图例
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(516, 272, 14, 3);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`左支路 C→B→A→C (峰点 ${vAfterE1_L.toFixed(2)}V)`, 536, 277);

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(516, 292, 14, 3);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`右支路 C→D→E→A→C (峰点 ${vAfterE2_R.toFixed(2)}V)`, 536, 297);

        // 物理状态与功率平衡诊断卡片
        const isChargingE2 = m1Calc.I2 < 0;
        ctx.fillStyle = isChargingE2 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';
        ctx.strokeStyle = isChargingE2 ? '#f59e0b' : '#10b981';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(512, 310, 316, 128, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isChargingE2 ? '#fcd34d' : '#6ee7b7';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(
          isChargingE2
            ? `⚡ 倒灌反充判据：U_AC (${m1Calc.UAC.toFixed(2)}V) > ℰ₂ (${m1.E2.toFixed(2)}V)`
            : `✓ 联合放电态：U_AC (${m1Calc.UAC.toFixed(2)}V) < min(ℰ₁, ℰ₂)`,
          524,
          330
        );
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '11.5px sans-serif';
        ctx.fillText(
          isChargingE2
            ? `I₂ = ${(m1Calc.I2 * 1000).toFixed(1)} mA < 0，右支路实际电流由 A→E→D→C`
            : `I₁ > 0 且 I₂ > 0，两侧电源同时向中间支路供能，实际`,
          524,
          350
        );
        ctx.fillText(
          isChargingE2
            ? `倒灌入正极，电源 ℰ₂ 处于被充电状态（吸收电能）！`
            : `电流方向与参考箭头完全一致。`,
          524,
          368
        );

        // 特勒根功率守恒核验
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath();
        ctx.moveTo(524, 380);
        ctx.lineTo(816, 380);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
        ctx.fillText(
          `功率核验: P_E1=${(m1Calc.P_src1 * 1000).toFixed(1)}mW, P_E2=${(m1Calc.P_src2 * 1000).toFixed(1)}mW`,
          524,
          398
        );
        ctx.fillStyle = '#a7f3d0';
        ctx.fillText(
          `∑ℰkIk = ${(m1Calc.P_total_src * 1000).toFixed(1)}mW ≡ ∑Im²Rm = ${(m1Calc.P_joule * 1000).toFixed(1)}mW`,
          524,
          418
        );
      }

      // ======================================================================
      // 渲染模块 2：非平衡惠斯通电桥与测温传感器 (例题 2 / 图 1.5 & 练习 3)
      // ======================================================================
      if (activeTab === 'bridge') {
        phaseRef.current.p2 += 0.85;
        const p = phaseRef.current.p2;

        const Ax = 78, Ay = 205;
        const Bx = 262, By = 68;
        const Cx = 446, Cy = 205;
        const Dx = 262, Dy = 342;
        const Ey = 415;

        // 外部电源干路与桥臂导线
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Ax, Ey);
        ctx.lineTo(Cx, Ey);
        ctx.lineTo(Cx, Cy);
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Bx, By);
        ctx.lineTo(Cx, Cy);
        ctx.lineTo(Dx, Dy);
        ctx.closePath();
        ctx.moveTo(Bx, By);
        ctx.lineTo(Dx, Dy);
        ctx.stroke();

        // 动态粒子流
        const sp = 4.2;
        drawParticlesAlongPolyline(ctx, [[Ax, Ay], [Bx, By]], p * Math.min(3.5, Math.abs(m2Calc.I1) * sp), m2Calc.I1, '#38bdf8', 34);
        drawParticlesAlongPolyline(ctx, [[Bx, By], [Cx, Cy]], p * Math.min(3.5, Math.abs(m2Calc.I3) * sp), m2Calc.I3, '#38bdf8', 34);
        drawParticlesAlongPolyline(ctx, [[Ax, Ay], [Dx, Dy]], p * Math.min(3.5, Math.abs(m2Calc.I2) * sp), m2Calc.I2, '#60a5fa', 34);
        drawParticlesAlongPolyline(ctx, [[Dx, Dy], [Cx, Cy]], p * Math.min(3.5, Math.abs(m2Calc.I4) * sp), m2Calc.I4, '#60a5fa', 34);
        drawParticlesAlongPolyline(ctx, [[Bx, By], [Dx, Dy]], p * Math.min(3.5, Math.abs(m2Calc.IG) * sp * 1.3), m2Calc.IG, '#2dd4bf', 28);
        drawParticlesAlongPolyline(ctx, [[Cx, Cy], [Cx, Ey], [Ax, Ey], [Ax, Ay]], p * Math.min(3.5, Math.abs(m2Calc.Itotal) * sp * 0.65), m2Calc.Itotal, '#f43f5e', 42);

        // 四个桥臂电阻与原位支路电流标注
        const ang = Math.atan2(Ay - By, Bx - Ax);
        drawResistor(ctx, (Ax + Bx) / 2, (Ay + By) / 2, -ang, `R₁=${m2Calc.R1}Ω`, `I₁=${m2Calc.I1.toFixed(2)}A`, '#60a5fa', '#1e3a8a', -26);
        drawResistor(ctx, (Bx + Cx) / 2, (By + Cy) / 2, ang, `R₃=${m2Calc.R3}Ω`, `I₃=${m2Calc.I3.toFixed(2)}A`, '#60a5fa', '#1e3a8a', -26);
        drawResistor(ctx, (Ax + Dx) / 2, (Ay + Dy) / 2, ang, `R₂=${m2Calc.R2}Ω`, `I₂=${m2Calc.I2.toFixed(2)}A`, '#60a5fa', '#1e3a8a', 26);
        drawResistor(
          ctx,
          (Dx + Cx) / 2,
          (Dy + Cy) / 2,
          -ang,
          m2.sensorMode ? `R_t=${m2Calc.R4.toFixed(2)}Ω` : `R₄=${m2Calc.R4}Ω`,
          `I₄=${m2Calc.I4.toFixed(2)}A`,
          m2.sensorMode ? '#f43f5e' : '#60a5fa',
          m2.sensorMode ? '#881337' : '#1e3a8a',
          26
        );

        // 底部恒压源 E (正极朝左接节点 A)
        drawBattery(ctx, 262, Ey, Math.PI, `ℰ=${m2Calc.E.toFixed(1)}V`, `干路 I=${m2Calc.Itotal.toFixed(2)}A`, 26);

        // 桥路中央检流计 G
        const Gx = 262, Gy = 205;
        const isBalanced = Math.abs(m2Calc.IG) < 1e-4;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = isBalanced ? '#10b981' : '#2dd4bf';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(Gx, Gy, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 检流计指针偏转
        const maxDeflect = 0.78;
        const needleAngle = Math.max(-maxDeflect, Math.min(maxDeflect, m2Calc.IG * 0.32));
        ctx.save();
        ctx.translate(Gx, Gy + 6);
        ctx.rotate(needleAngle);
        ctx.strokeStyle = isBalanced ? '#10b981' : '#f43f5e';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(0, -22);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#2dd4bf';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('G', Gx, Gy + 18);
        drawRefArrow(ctx, Gx - 22, Gy - 42, Math.PI / 2, '', m2Calc.IG < 0);
        drawPillText(
          ctx,
          `I_G = ${m2Calc.IG.toFixed(3)}A`,
          Gx + 66,
          Gy - 8,
          isBalanced ? '#34d399' : '#5eead4'
        );
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(`R_G = ${m2Calc.RG}Ω`, Gx + 62, Gy + 12);

        // 四个桥顶点标注
        const drawBridgeNode = (x, y, label, sub, dx, dy) => {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 12.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, x + dx, y + dy);
          ctx.fillStyle = '#93c5fd';
          ctx.font = '11px monospace';
          ctx.fillText(sub, x + dx, y + dy + 13);
        };
        drawBridgeNode(Ax, Ay, 'A', `${m2Calc.VA.toFixed(1)}V`, -24, -6);
        drawBridgeNode(Bx, By, 'B', `${m2Calc.VB.toFixed(2)}V`, 0, -25);
        drawBridgeNode(Cx, Cy, 'C', `${m2Calc.VC.toFixed(1)}V`, 24, -6);
        drawBridgeNode(Dx, Dy, 'D', `${m2Calc.VD.toFixed(2)}V`, 0, 18);

        // 右侧面板：节点电位差对比 + 全量程自适应 I_G(δ) 响应曲线 (x: 495..842)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(495, 18, 348, 434, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('B、D 桥臂节点电位对比与平衡判据', 512, 42);

        // B、D 电位柱状对比
        const barBaseY = 168, maxBarH = 88;
        const hB = Math.max(4, (m2Calc.VB / Math.max(0.1, m2Calc.E)) * maxBarH);
        const hD = Math.max(4, (m2Calc.VD / Math.max(0.1, m2Calc.E)) * maxBarH);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(535, barBaseY - hB, 44, hB);
        ctx.fillStyle = '#818cf8';
        ctx.fillRect(620, barBaseY - hD, 44, hD);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${m2Calc.VB.toFixed(2)}V`, 557, barBaseY - hB - 7);
        ctx.fillText(`${m2Calc.VD.toFixed(2)}V`, 642, barBaseY - hD - 7);
        ctx.fillText('V_B', 557, barBaseY + 15);
        ctx.fillText('V_D', 642, barBaseY + 15);

        // 标注 U_BD 电势差与平衡状态卡片
        ctx.fillStyle = isBalanced ? 'rgba(16, 185, 129, 0.16)' : 'rgba(244, 63, 94, 0.14)';
        ctx.strokeStyle = isBalanced ? '#10b981' : '#f43f5e';
        ctx.beginPath();
        ctx.roundRect(688, 72, 138, 96, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isBalanced ? '#34d399' : '#fda4af';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(isBalanced ? '✓ 电桥严格平衡' : '⚡ 非平衡偏转态', 757, 94);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '11px monospace';
        ctx.fillText(`U_BD = ${(m2Calc.VB - m2Calc.VD).toFixed(2)}V`, 757, 115);
        ctx.fillText(`Δ_G = ${m2Calc.detG.toFixed(1)}`, 757, 134);
        ctx.fillText(`Δ   = ${m2Calc.det.toFixed(1)}`, 757, 152);

        // 下半部：全量程自适应 I_G(δ) 精确非线性曲线 vs 平衡点一阶切线近似
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('检流计电流 I_G(δ) 精确解(实线) vs 线性近似(虚线)', 512, 212);

        const gx0 = 532, gy0 = 315, gw = 290, gh = 76;
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(512, 224, 316, 182, 6);
        ctx.fill();
        ctx.stroke();

        // 坐标轴十字线 (原点位于平衡点 δ = 0, I_G = 0)
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx0, gy0);
        ctx.lineTo(gx0 + gw, gy0);
        ctx.moveTo(gx0 + gw / 2, gy0 - gh);
        ctx.lineTo(gx0 + gw / 2, gy0 + gh);
        ctx.stroke();

        // 动态选择横轴范围 deltaMax，确保当前工作点 delta_eff 永远落在图内
        const rBal = m2Calc.R4_bal;
        const deltaSpan = Math.max(0.95, Math.min(1.5, Math.abs(m2Calc.delta_eff) * 1.15));

        const evalExactIG = (d) => {
          const r4Test = Math.max(0.05, rBal * (1 + d));
          const num = (m2Calc.R2 * m2Calc.R3 - m2Calc.R1 * r4Test) * m2Calc.E;
          const den =
            m2Calc.RG * (m2Calc.R1 + m2Calc.R2) * (m2Calc.R3 + r4Test) +
            m2Calc.R1 * m2Calc.R2 * (m2Calc.R3 + r4Test) +
            m2Calc.R3 * r4Test * (m2Calc.R1 + m2Calc.R2);
          return num / den;
        };

        const den0 =
          m2Calc.RG * (m2Calc.R1 + m2Calc.R2) * (m2Calc.R3 + rBal) +
          m2Calc.R1 * m2Calc.R2 * (m2Calc.R3 + rBal) +
          m2Calc.R3 * rBal * (m2Calc.R1 + m2Calc.R2);
        const evalLinearIG = (d) => (-m2Calc.R1 * rBal * m2Calc.E * d) / den0;

        // 动态计算纵轴最大电流，使曲线优雅铺满且绝不越界截断
        const igMaxRef = Math.max(
          0.5,
          Math.abs(evalExactIG(-deltaSpan * 0.92)),
          Math.abs(m2Calc.IG) * 1.15
        );
        const yScale = (gh * 0.88) / igMaxRef;

        // 1. 绘制精确解析解曲线 I_G(δ)
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const d = -deltaSpan + (i / 80) * (2 * deltaSpan);
          const igVal = evalExactIG(d);
          const px = gx0 + (i / 80) * gw;
          const py = gy0 - Math.max(-gh, Math.min(gh, igVal * yScale));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // 2. 绘制平衡点一阶泰勒线性近似直线
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const d = -deltaSpan + (i / 80) * (2 * deltaSpan);
          const igLin = evalLinearIG(d);
          const px = gx0 + (i / 80) * gw;
          const py = gy0 - Math.max(-gh, Math.min(gh, igLin * yScale));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. 绘制当前真实工作点红点 (严格落在青色精确曲线上)与线性近似对比点
        const normX = (m2Calc.delta_eff + deltaSpan) / (2 * deltaSpan);
        const curPx = gx0 + Math.max(0, Math.min(1, normX)) * gw;
        const curPyExact = gy0 - Math.max(-gh, Math.min(gh, m2Calc.IG * yScale));
        const curPyLin = gy0 - Math.max(-gh, Math.min(gh, m2Calc.IG_linear * yScale));

        // 误差竖线连接精确点与线性点
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(curPx, curPyExact);
        ctx.lineTo(curPx, curPyLin);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(curPx, curPyLin, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(curPx, curPyExact, 5.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `平衡点 R₄*=${rBal.toFixed(2)}Ω | 当前 δ=${(m2Calc.delta_eff * 100).toFixed(1)}% (线性近似误差 ${m2Calc.relError.toFixed(1)}%)`,
          gx0 + gw / 2,
          422
        );
      }

      // ======================================================================
      // 渲染模块 3：正立方体十二电阻框架 3D 对称性 + 等势缩并图 (例题 3 / 图 1.6)
      // ======================================================================
      if (activeTab === 'cube') {
        phaseRef.current.p3 += 0.85;
        const p = phaseRef.current.p3;

        const rawVerts = {
          A: [-1, 1, -1],
          B: [1, 1, -1],
          C: [1, -1, -1],
          D: [-1, -1, -1],
          Ap: [-1, 1, 1],
          Bp: [1, 1, 1],
          Gp: [1, -1, 1],
          Dp: [-1, -1, 1],
        };

        const cy = Math.cos(m3.yaw), sy = Math.sin(m3.yaw);
        const cp = Math.cos(m3.pitch), sp = Math.sin(m3.pitch);
        const project = ([x, y, z]) => {
          const x1 = x * cy - z * sy;
          const z1 = x * sy + z * cy;
          const y2 = y * cp - z1 * sp;
          const z2 = y * sp + z1 * cp;
          const scale = 108 * (1 + z2 * 0.12);
          return { x: 248 + x1 * scale, y: 230 - y2 * scale, z: z2 };
        };

        const pv = {};
        Object.keys(rawVerts).forEach((k) => {
          pv[k] = project(rawVerts[k]);
        });

        let edges = [];
        let outNode = 'Gp';
        let eqFracText = '5/6 R';
        let eqRatio = 5 / 6;

        if (m3.mode === 'bodyDiag') {
          outNode = 'Gp';
          eqFracText = '5/6 R';
          eqRatio = 5 / 6;
          edges = [
            ['A', 'B', 1 / 3, 'I/3'],
            ['A', 'D', 1 / 3, 'I/3'],
            ['A', 'Ap', 1 / 3, 'I/3'],
            ['B', 'C', 1 / 6, 'I/6'],
            ['B', 'Bp', 1 / 6, 'I/6'],
            ['D', 'C', 1 / 6, 'I/6'],
            ['D', 'Dp', 1 / 6, 'I/6'],
            ['Ap', 'Bp', 1 / 6, 'I/6'],
            ['Ap', 'Dp', 1 / 6, 'I/6'],
            ['C', 'Gp', 1 / 3, 'I/3'],
            ['Bp', 'Gp', 1 / 3, 'I/3'],
            ['Dp', 'Gp', 1 / 3, 'I/3'],
          ];
        } else if (m3.mode === 'faceDiag') {
          outNode = 'C';
          eqFracText = '3/4 R';
          eqRatio = 3 / 4;
          edges = [
            ['A', 'B', 3 / 8, '3I/8'],
            ['B', 'C', 3 / 8, '3I/8'],
            ['A', 'D', 3 / 8, '3I/8'],
            ['D', 'C', 3 / 8, '3I/8'],
            ['A', 'Ap', 1 / 4, 'I/4'],
            ['Ap', 'Bp', 1 / 8, 'I/8'],
            ['Ap', 'Dp', 1 / 8, 'I/8'],
            ['Bp', 'Gp', 1 / 8, 'I/8'],
            ['Dp', 'Gp', 1 / 8, 'I/8'],
            ['Gp', 'C', 1 / 4, 'I/4'],
            ['B', 'Bp', 0, '0 (无流)'],
            ['D', 'Dp', 0, '0 (无流)'],
          ];
        } else {
          outNode = 'B';
          eqFracText = '7/12 R';
          eqRatio = 7 / 12;
          edges = [
            ['A', 'B', 7 / 12, 'I₁=7I/12'],
            ['A', 'D', 5 / 24, 'I₂=5I/24'],
            ['A', 'Ap', 5 / 24, 'I₂=5I/24'],
            ['D', 'C', 1 / 6, 'I₃=I/6'],
            ['Ap', 'Bp', 1 / 6, 'I₃=I/6'],
            ['D', 'Dp', 1 / 24, 'I/24'],
            ['Ap', 'Dp', 1 / 24, 'I/24'],
            ['Dp', 'Gp', 1 / 12, 'I/12'],
            ['Gp', 'C', 1 / 24, 'I/24'],
            ['Gp', 'Bp', 1 / 24, 'I/24'],
            ['C', 'B', 5 / 24, '5I/24'],
            ['Bp', 'B', 5 / 24, '5I/24'],
          ];
        }

        // 面对角模式下绘制中垂等势对称面 BDD'B'
        if (m3.showSymmetry && m3.mode === 'faceDiag') {
          ctx.save();
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(pv.B.x, pv.B.y);
          ctx.lineTo(pv.Bp.x, pv.Bp.y);
          ctx.lineTo(pv.Dp.x, pv.Dp.y);
          ctx.lineTo(pv.D.x, pv.D.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // 按 Z 深度从后往前画家算法排序
        const sortedEdges = [...edges].sort((a, b) => {
          const za = (pv[a[0]].z + pv[a[1]].z) / 2;
          const zb = (pv[b[0]].z + pv[b[1]].z) / 2;
          return za - zb;
        });

        sortedEdges.forEach(([u, v, frac, fracLabel]) => {
          const p1 = pv[u];
          const p2 = pv[v];
          const isZero = Math.abs(frac) < 1e-5;
          const zAvg = (p1.z + p2.z) / 2;
          const depthAlpha = Math.max(0.45, Math.min(1, 0.75 + zAvg * 0.25));

          ctx.save();
          ctx.globalAlpha = depthAlpha;
          ctx.strokeStyle = isZero ? '#475569' : frac >= 0.3 ? '#38bdf8' : '#818cf8';
          ctx.lineWidth = isZero ? 2 : 3;
          if (isZero) ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // 棱中央电阻块
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);

          ctx.save();
          ctx.translate(mx, my);
          ctx.rotate(ang);
          ctx.fillStyle = isZero ? '#1e293b' : '#1e3a8a';
          ctx.strokeStyle = isZero ? '#64748b' : '#60a5fa';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-13, -4.5, 26, 9, 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          if (!isZero) {
            drawParticlesAlongPolyline(
              ctx,
              [[p1.x, p1.y], [p2.x, p2.y]],
              p * (0.6 + frac * 4.2),
              frac,
              frac >= 0.3 ? '#38bdf8' : '#a5b4fc',
              36
            );
          }

          // 使用带胶囊底衬的清晰标签，沿法向微移防止遮挡电阻图元
          const nx = -Math.sin(ang) * 14;
          const ny = Math.cos(ang) * 14;
          drawPillText(
            ctx,
            fracLabel,
            mx + nx,
            my + ny,
            isZero ? '#fbbf24' : '#f1f5f9',
            'rgba(9, 13, 22, 0.85)',
            isZero ? '#b45309' : '#334155'
          );
          ctx.restore();
        });

        // 绘制 8 个顶点与等势色标
        const dispNames = { A: 'A', B: 'B', C: 'C', D: 'D', Ap: "A'", Bp: "B'", Gp: "G'", Dp: "D'" };
        Object.keys(pv).forEach((k) => {
          const pt = pv[k];
          const isIn = k === 'A';
          const isOut = k === outNode;
          let dotColor = '#3b82f6';
          if (isIn) dotColor = '#f43f5e';
          else if (isOut) dotColor = '#10b981';
          else if (m3.showSymmetry) {
            if (m3.mode === 'bodyDiag' && (k === 'B' || k === 'D' || k === 'Ap')) dotColor = '#f59e0b';
            if (m3.mode === 'bodyDiag' && (k === 'C' || k === 'Bp' || k === 'Dp')) dotColor = '#a855f7';
            if (m3.mode === 'faceDiag' && (k === 'B' || k === 'Bp' || k === 'D' || k === 'Dp')) dotColor = '#f59e0b';
            if (m3.mode === 'faceDiag' && (k === 'Ap' || k === 'Gp')) dotColor = '#a855f7';
            if (m3.mode === 'edge' && (k === 'D' || k === 'Ap')) dotColor = '#f59e0b';
            if (m3.mode === 'edge' && (k === 'C' || k === 'Bp')) dotColor = '#a855f7';
          }

          if (m3.showSymmetry && !isIn && !isOut) {
            ctx.fillStyle = dotColor + '38';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 13, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = dotColor;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isIn || isOut ? 6.8 : 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(dispNames[k], pt.x - 14, pt.y - 10);
        });

        drawPillText(ctx, `输入 I=${m3.I.toFixed(1)}A → A`, pv.A.x - 56, pv.A.y + 2, '#fda4af', 'rgba(136,19,55,0.8)', '#f43f5e');
        drawPillText(ctx, `${dispNames[outNode]} → 输出 I`, pv[outNode].x + 52, pv[outNode].y + 2, '#6ee7b7', 'rgba(6,78,59,0.8)', '#10b981');

        ctx.fillStyle = '#64748b';
        ctx.font = '11.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('交互提示：按住鼠标左键拖拽左侧立方体可 360° 旋转空间视角', 22, 448);

        // 右侧面板：等势点缩并等效平面图 + KCL/KVL 严格推导 (x: 495..842)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(495, 18, 348, 434, 8);
        ctx.fill();
        ctx.stroke();

        const reqNum = eqRatio * m3.R;
        const uTotal = reqNum * m3.I;
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13.5px sans-serif';
        ctx.fillText(`等势节点缩并等效模型：R_eq = ${eqFracText}`, 512, 42);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`R_eq = ${reqNum.toFixed(2)} Ω  |  端电压 U = ${uTotal.toFixed(2)} V`, 512, 62);

        // 绘制等势节点缩并示意框 (y: 74..168)
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(512, 72, 316, 94, 6);
        ctx.fill();
        ctx.stroke();

        if (m3.mode === 'bodyDiag') {
          // 绘制 4 层等势节点串联缩并图: A --(R/3)-- {B,D,A'} --(R/6)-- {C,B',D'} --(R/3)-- G'
          const nodesX = [538, 626, 714, 802];
          const nodeColors = ['#f43f5e', '#f59e0b', '#a855f7', '#10b981'];
          const nodeLabels = ['A', "{B,D,A'}", "{C,B',D'}", "G'"];
          const stageRes = ['3并: R/3', '6并: R/6', '3并: R/3'];

          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(nodesX[0], 118);
          ctx.lineTo(nodesX[3], 118);
          ctx.stroke();

          for (let i = 0; i < 3; i++) {
            const rx = (nodesX[i] + nodesX[i + 1]) / 2;
            drawResistor(ctx, rx, 118, 0, stageRes[i], `${((i === 1 ? 1 / 6 : 1 / 3) * m3.R).toFixed(1)}Ω`, '#38bdf8', '#1e3a8a', -19);
          }
          nodesX.forEach((nx, i) => {
            ctx.fillStyle = nodeColors[i];
            ctx.beginPath();
            ctx.arc(nx, 118, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(nodeLabels[i], nx, 148);
          });
        } else if (m3.mode === 'faceDiag') {
          // 面对角线: 拆去无流支路 BB', DD' 后上下并联 R || 3R = 3/4 R
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(545, 118);
          ctx.lineTo(585, 95);
          ctx.lineTo(755, 95);
          ctx.lineTo(795, 118);
          ctx.moveTo(545, 118);
          ctx.lineTo(585, 142);
          ctx.lineTo(755, 142);
          ctx.lineTo(795, 118);
          ctx.stroke();
          drawResistor(ctx, 670, 95, 0, '上层支路: 3R', `I_上 = I/4`, '#818cf8', '#1e1b4b', -15);
          drawResistor(ctx, 670, 142, 0, '下层2R∥2R: R', `I_下 = 3I/4`, '#38bdf8', '#1e3a8a', 16);
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(545, 118, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(795, 118, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('A', 532, 122);
          ctx.fillText('C', 808, 122);
        } else {
          // 同棱顶点 A-B: 主棱 R 与其余 11 棱等效网络 (7/5 R) 并联 -> 7/12 R
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(545, 118);
          ctx.lineTo(585, 95);
          ctx.lineTo(755, 95);
          ctx.lineTo(795, 118);
          ctx.moveTo(545, 118);
          ctx.lineTo(585, 142);
          ctx.lineTo(755, 142);
          ctx.lineTo(795, 118);
          ctx.stroke();
          drawResistor(ctx, 670, 95, 0, '直连棱 AB: R', `I₁ = 7I/12`, '#38bdf8', '#1e3a8a', -15);
          drawResistor(ctx, 670, 142, 0, '其余11棱: 7R/5', `2I₂ = 5I/12`, '#a855f7', '#3b0764', 16);
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(545, 118, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(795, 118, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('A', 532, 122);
          ctx.fillText('B', 808, 122);
        }

        // 下半部推导步骤
        const lines =
          m3.mode === 'bodyDiag'
            ? [
                "【(1) 体对角顶点 A ↔ G'：三重旋转对称 C₃】",
                "• 绕体对角轴 AG' 旋转 120° 网络拓扑不变：",
                "  第一邻接层 {B, D, A'} 严格等势 (橙色节点)",
                "  第二邻接层 {C, B', D'} 严格等势 (紫色节点)",
                "• 节点 A 的 KCL：输入电流三等分",
                `  I_AB = I_AD = I_AA' = I/3 = ${(m3.I / 3).toFixed(2)} A`,
                "• 节点 B 处向 BC 与 BB' 二等分：",
                `  中间层 6 条棱电流均为 I/6 = ${(m3.I / 6).toFixed(2)} A`,
                "• 沿路径 A → B → C → G' 累加电势降：",
                "  U_AG' = (I/3 + I/6 + I/3)R = (5/6)IR",
              ]
            : m3.mode === 'faceDiag'
            ? [
                '【(2) 面对角顶点 A ↔ C：平面反对称与无流支路】',
                "• 考察中垂面 BDD'B'：面内四点到 A、C 拓扑距离",
                '  完全相等，故 V_B = V_B\' = V_D = V_D\' = (V_A+V_C)/2',
                "• 竖直棱 BB' 与 DD' 两端等势：",
                "  I_BB' = I_DD' = 0 (可从网络中直接拆去或短接)",
                '• 拆去无流支路后，上下两层独立并联：',
                '  下层：ABC (2R) ∥ ADC (2R) = R',
                "  上层：A → A' → (B'∥D') → G' → C = R + R + R = 3R",
                '• 总等效电阻：R_AC = R ∥ 3R = 3/4 R',
                `  总电压 U_AC = (3/4)IR = ${uTotal.toFixed(2)} V`,
              ]
            : [
                '【(3) 同棱相邻顶点 A ↔ B：镜像对称 + 网孔 KVL】',
                "• 关于对角面 ABG'D' 镜像对称：V_D = V_A'，V_C = V_B'",
                "• 设直连棱 I_AB = I₁，侧棱 I_AD = I_AA' = I₂，",
                "  平行棱 I_DC = I_A'B' = I₃，则 I_DD' = I_A'D' = I₂ - I₃",
                "• 后侧网孔 A'-D'-G'-B'-A' 列写 KVL：",
                '  (I₂-I₃)R + 2(I₂-I₃)R + (I₂-I₃)R = I₃R ⇒ I₃ = (4/5)I₂',
                "• 上侧网孔 A-A'-B'-B-A 列写 KVL：",
                '  I₂R + I₃R + I₂R = I₁R ⇒ I₁ = (14/5)I₂',
                '• 节点 A 的 KCL：I = I₁ + 2I₂ = (24/5)I₂',
                '  解得 I₁ = (7/12)I ⇒ U_AB = I₁R = (7/12)IR',
              ];

        ctx.textAlign = 'left';
        lines.forEach((line, idx) => {
          ctx.fillStyle = idx === 0 ? '#fbbf24' : '#e2e8f0';
          ctx.font = idx === 0 ? 'bold 12px sans-serif' : '11.5px sans-serif';
          ctx.fillText(line, 514, 192 + idx * 25);
        });
      }

      // ======================================================================
      // 渲染模块 4：广义 KCL 与麦克斯韦位移电流 (图 1.3 & 练习 4)
      // ======================================================================
      if (activeTab === 'displacement') {
        phaseRef.current.p4 += 0.85;
        const p = phaseRef.current.p4;

        // 1. 左上方绘制原位 T 型 RC 电路拓扑图 (对应练习 4, y: 18..148)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(20, 18, 458, 132, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('练习 4 原位拓扑：T 型 RC 网络与节点 A 电流分流', 34, 38);

        const txL = 70, txM = 235, txR = 400, tyT = 62, tyB = 132;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(txL, tyB);
        ctx.lineTo(txL, tyT);
        ctx.lineTo(txR, tyT);
        ctx.lineTo(txR, tyB);
        ctx.lineTo(txL, tyB);
        ctx.moveTo(txM, tyT);
        ctx.lineTo(txM, tyB);
        ctx.stroke();

        drawParticlesAlongPolyline(ctx, [[txL, tyB], [txL, tyT], [txM, tyT]], p * m4Calc.I1 * 0.8, m4Calc.I1, '#38bdf8', 28);
        drawParticlesAlongPolyline(ctx, [[txM, tyT], [txR, tyT], [txR, tyB]], p * m4Calc.I2 * 0.8, m4Calc.I2, '#34d399', 28);
        drawParticlesAlongPolyline(ctx, [[txM, tyT], [txM, tyB]], p * m4Calc.Ic * 0.9, m4Calc.Ic, '#f43f5e', 24);

        drawBattery(ctx, txL, (tyT + tyB) / 2, -Math.PI / 2, `ℰ=${m4.E}V`, '', -28);
        drawResistor(ctx, (txL + txM) / 2, tyT, 0, `R₁=${m4.R1}kΩ`, `I₁=${m4Calc.I1.toFixed(2)}mA`, '#38bdf8', '#1e3a8a', -16);
        drawResistor(ctx, (txM + txR) / 2, tyT, 0, `R₂=${m4.R2}kΩ`, `I₂=${m4Calc.I2.toFixed(2)}mA`, '#34d399', '#064e3b', -16);

        // 中支路微型电容器符号
        ctx.fillStyle = '#090d16';
        ctx.fillRect(txM - 12, (tyT + tyB) / 2 - 5, 24, 10);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(txM - 11, (tyT + tyB) / 2 - 5);
        ctx.lineTo(txM + 11, (tyT + tyB) / 2 - 5);
        ctx.moveTo(txM - 11, (tyT + tyB) / 2 + 5);
        ctx.lineTo(txM + 11, (tyT + tyB) / 2 + 5);
        ctx.stroke();
        ctx.fillStyle = '#fda4af';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`C=${m4.C}μF (I_c=${m4Calc.Ic.toFixed(2)}mA)`, txM + 16, (tyT + tyB) / 2 + 4);

        // 节点 A 红点
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(txM, tyT, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`A (${m4Calc.uC.toFixed(1)}V)`, txM, tyT - 10);

        // 2. 左下方绘制图 1.3 平行板电容器极板间隙与高斯闭合面放大视图 (y: 162..452)
        const cx = 248, cy = 312;
        const plateLX = cx - 50, plateRX = cx + 50;

        // 整体超节点闭合面 S' (包裹整个电容器)
        const isSuper = m4.gaussianMode === 'supernode';
        ctx.save();
        ctx.strokeStyle = isSuper ? '#38bdf8' : 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = isSuper ? 2.4 : 1.4;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.roundRect(cx - 165, cy - 108, 330, 214, 12);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = isSuper ? '#38bdf8' : '#64748b';
        ctx.font = 'bold 11.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("广义超节点闭合面 S' (包裹双极板：内部净电荷 q_in = +q - q ≡ 0)", cx, cy - 116);

        // 左右外部引线与传导电流粒子
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(35, cy);
        ctx.lineTo(plateLX, cy);
        ctx.moveTo(plateRX, cy);
        ctx.lineTo(462, cy);
        ctx.stroke();

        drawParticlesAlongPolyline(ctx, [[35, cy], [plateLX, cy]], p * m4Calc.Ic * 1.1, m4Calc.Ic, '#f43f5e', 28);
        drawParticlesAlongPolyline(ctx, [[plateRX, cy], [462, cy]], p * m4Calc.Ic * 1.1, m4Calc.Ic, '#f43f5e', 28);

        // 极板间时变电位移场 D(t) 与位移电流密度 J_d = ∂D/∂t 矢量线
        const arrowAlpha = Math.min(1, 0.22 + (m4Calc.Id / Math.max(0.5, m4Calc.Ic0)) * 0.78);
        for (let yOff = -60; yOff <= 60; yOff += 30) {
          ctx.strokeStyle = `rgba(45, 212, 191, ${arrowAlpha})`;
          ctx.fillStyle = `rgba(45, 212, 191, ${arrowAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(plateLX + 10, cy + yOff);
          ctx.lineTo(plateRX - 12, cy + yOff);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(plateRX - 8, cy + yOff);
          ctx.lineTo(plateRX - 16, cy + yOff - 4);
          ctx.lineTo(plateRX - 16, cy + yOff + 4);
          ctx.closePath();
          ctx.fill();
        }

        drawParticlesAlongPolyline(
          ctx,
          [[plateLX + 8, cy - 30], [plateRX - 8, cy - 30]],
          p * m4Calc.Id * 1.1,
          m4Calc.Id,
          '#2dd4bf',
          26
        );
        drawParticlesAlongPolyline(
          ctx,
          [[plateLX + 8, cy + 30], [plateRX - 8, cy + 30]],
          p * m4Calc.Id * 1.1,
          m4Calc.Id,
          '#2dd4bf',
          26
        );

        drawPillText(ctx, 'J_d = ∂D/∂t', cx, cy, '#5eead4', 'rgba(9, 13, 22, 0.88)', '#0d9488');

        // 电容器左右极板与随 u_C 变化的极板内表面电荷符号 ±σ(t)
        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.fillRect(plateLX - 10, cy - 76, 10, 152);
        ctx.strokeRect(plateLX - 10, cy - 76, 10, 152);
        ctx.fillRect(plateRX, cy - 76, 10, 152);
        ctx.strokeRect(plateRX, cy - 76, 10, 152);

        // 动态面电荷符号数量
        const chargeCount = Math.max(1, Math.round((m4Calc.uC / Math.max(0.1, m4Calc.Uth)) * 5));
        ctx.font = 'bold 11px monospace';
        for (let k = 0; k < chargeCount; k++) {
          const yPos = cy - 56 + (k / Math.max(1, chargeCount - 1 || 1)) * 112;
          ctx.fillStyle = '#fda4af';
          ctx.fillText('+', plateLX + 5, chargeCount === 1 ? cy : yPos);
          ctx.fillStyle = '#93c5fd';
          ctx.fillText('−', plateRX - 6, chargeCount === 1 ? cy : yPos);
        }

        ctx.fillStyle = '#fda4af';
        ctx.font = 'bold 11.5px monospace';
        ctx.fillText(`+q = +${m4Calc.q.toFixed(1)}μC`, plateLX - 26, cy - 86);
        ctx.fillStyle = '#93c5fd';
        ctx.fillText(`-q = -${m4Calc.q.toFixed(1)}μC`, plateRX + 26, cy - 86);

        // 包围左极板的闭合高斯面 S = S1 U S2 (对应教材图 1.3)
        const sActive = m4.gaussianMode === 'singlePlate';
        ctx.save();
        ctx.lineWidth = sActive ? 2.5 : 1.4;
        ctx.setLineDash([5, 4]);
        // 左半曲面 S1 (红色虚线弧)
        ctx.strokeStyle = sActive ? '#f43f5e' : 'rgba(244, 63, 94, 0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 114, 92, 0, Math.PI / 2, (Math.PI * 3) / 2, false);
        ctx.stroke();

        // 右侧极板间隙截面 S2 (青色虚线截线)
        ctx.strokeStyle = sActive ? '#2dd4bf' : 'rgba(45, 212, 191, 0.35)';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 92);
        ctx.lineTo(cx, cy + 92);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 11.5px sans-serif';
        ctx.fillText('曲面 S₁ (穿入传导电流 I_c)', cx - 72, cy + 105);
        ctx.fillStyle = '#2dd4bf';
        ctx.fillText('曲面 S₂ (穿出位移电流 I_d)', cx + 74, cy + 105);

        ctx.fillStyle = '#fda4af';
        ctx.font = 'bold 11.5px monospace';
        ctx.fillText(`I_c=${m4Calc.Ic.toFixed(2)}mA`, 85, cy - 14);
        ctx.fillText(`I_c=${m4Calc.Ic.toFixed(2)}mA`, 412, cy - 14);

        // 3. 右侧面板：RC 暂态实时波形与全电流连续性定理数值核验 (x: 495..842)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(495, 18, 348, 434, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`戴维南等效暂态曲线 (τ = R_th·C = ${m4Calc.tau.toFixed(2)} ms)`, 512, 42);

        const px0 = 540, py0 = 212, pw = 272, ph = 136;
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(512, 54, 316, 182, 6);
        ctx.fill();
        ctx.stroke();

        // 坐标轴
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px0, py0 - ph);
        ctx.lineTo(px0, py0);
        ctx.lineTo(px0 + pw, py0);
        ctx.stroke();

        // 横轴时间常数刻度 0, τ, 2τ, 3τ, 4τ
        for (let k = 0; k <= 4; k++) {
          const tx = px0 + (k / 4) * pw;
          ctx.fillStyle = '#64748b';
          ctx.font = '10.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(k === 0 ? '0' : `${k}τ`, tx, py0 + 15);
        }

        // 曲线 1：电容电压 u_C(t) 指数上升曲线 (归一化到稳态电压 Uth)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const tNorm = (i / 60) * 4;
          const uVal = m4Calc.Uth * (1 - Math.exp(-tNorm));
          const x = px0 + (i / 60) * pw;
          const y = py0 - (uVal / Math.max(0.1, m4Calc.Uth)) * (ph * 0.86);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 曲线 2：麦克斯韦位移电流 I_d(t) 指数衰减曲线 (归一化到初始充电电流 Ic0)
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const tNorm = (i / 60) * 4;
          const idVal = m4Calc.Ic0 * Math.exp(-tNorm);
          const x = px0 + (i / 60) * pw;
          const y = py0 - (idVal / Math.max(0.1, m4Calc.Ic0)) * (ph * 0.86);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 当前瞬时工作点竖线与双曲线特征圆点
        const ratioU = Math.min(0.981, Math.max(0, m4Calc.uC / Math.max(0.01, m4Calc.Uth)));
        const curTNorm = -Math.log(1 - ratioU);
        const markerX = px0 + Math.min(1, curTNorm / 4) * pw;
        const markerYu = py0 - ratioU * (ph * 0.86);
        const markerYid = py0 - (m4Calc.Id / Math.max(0.01, m4Calc.Ic0)) * (ph * 0.86);

        ctx.strokeStyle = '#f43f5e';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(markerX, py0 - ph);
        ctx.lineTo(markerX, py0);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(markerX, markerYu, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2dd4bf';
        ctx.beginPath();
        ctx.arc(markerX, markerYid, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#38bdf8';
        ctx.font = '11px sans-serif';
        ctx.fillText(`蓝线: u_C(t) [稳态 U_th = ${m4Calc.Uth.toFixed(2)}V]`, px0 + 10, py0 - ph + 16);
        ctx.fillStyle = '#2dd4bf';
        ctx.fillText(`青线: I_d(t) = I_c(t) [初值 ${m4Calc.Ic0.toFixed(2)}mA]`, px0 + 10, py0 - ph + 32);

        // 下半部：全电流连续性定理实时数值卡片
        const cardData = [
          ['左支路干路电流 I₁ = (ℰ - u_C)/R₁', `${m4Calc.I1.toFixed(2)} mA`, '#38bdf8'],
          ['右支路分流电流 I₂ = u_C / R₂', `${m4Calc.I2.toFixed(2)} mA`, '#34d399'],
          ['穿入 S₁ 传导电流 I_c = I₁ - I₂', `${m4Calc.Ic.toFixed(2)} mA`, '#fda4af'],
          ['穿出 S₂ 位移电流 I_d = dΨ_D/dt', `${m4Calc.Id.toFixed(2)} mA`, '#2dd4bf'],
          ['极板电压变化率 du_C/dt = I_d / C', `${m4Calc.duCdt.toFixed(0)} V/s`, '#fbbf24'],
        ];

        cardData.forEach(([k, v, col], idx) => {
          const y = 264 + idx * 36;
          ctx.fillStyle = 'rgba(30, 41, 59, 0.72)';
          ctx.beginPath();
          ctx.roundRect(512, y - 17, 316, 28, 5);
          ctx.fill();

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '11.5px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(k, 522, y + 1);

          ctx.fillStyle = col;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(v, 818, y + 1);
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeTab, m1, m1Calc, m2, m2Calc, m3, m4, m4Calc]);

  // --------------------------------------------------------------------------
  // 模块 3 鼠标拖拽 3D 旋转事件处理
  // --------------------------------------------------------------------------
  const handlePointerDown = (e) => {
    if (activeTab !== 'cube') return;
    dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (activeTab !== 'cube' || !dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    setM3((prev) => ({
      ...prev,
      yaw: prev.yaw + dx * 0.01,
      pitch: Math.max(-1.1, Math.min(1.1, prev.pitch + dy * 0.01)),
    }));
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-6 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      {/* 顶部标题与四大模块导航栏 */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            基尔霍夫定律与复杂直流网络交互仿真实验室
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            涵盖 KCL/KVL 场论根源、克拉默行列式降阶速算、非平衡电桥微扰测温与正立方体等势缩并对称性
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'dualMesh', label: '1. 双网孔与弥尔曼 (例1)' },
            { id: 'bridge', label: '2. 非平衡电桥与测温 (例2/练3)' },
            { id: 'cube', label: '3. 立方体12电阻 3D (例3)' },
            { id: 'displacement', label: '4. 广义KCL与位移电流 (图1.3/练4)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 核心高分屏 Canvas 仿真视图 */}
      <div className="relative bg-[#090d16] border-b border-slate-800 flex justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ width: '100%', maxWidth: '860px', height: 'auto', aspectRatio: '860 / 470' }}
          className={activeTab === 'cube' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        />
      </div>

      {/* 底部参数控制台与克拉默行列式/公式实时推导区 */}
      <div className="p-5 bg-slate-900/60">
        {/* ==================== 模块 1 控制台 ==================== */}
        {activeTab === 'dualMesh' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  双网孔电源与支路电阻全参数调节
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setM1({ E1: 3.0, E2: 1.2, r1: 0.5, r2: 0.5, R1: 1.0, R2: 5.0, R3: 4.5, R4: 9.0 })
                    }
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-slate-700"
                  >
                    还原例题 1 参数 (I₂ = -20mA 反充)
                  </button>
                  <button
                    onClick={() =>
                      setM1({ E1: 3.0, E2: 1.5, r1: 0.5, r2: 0.5, R1: 1.0, R2: 5.0, R3: 4.5, R4: 9.0 })
                    }
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700"
                  >
                    临界空载点 (ℰ₂ = 1.5V, I₂ = 0)
                  </button>
                  <button
                    onClick={() =>
                      setM1({ E1: 3.0, E2: 2.4, r1: 0.5, r2: 0.5, R1: 1.0, R2: 5.0, R3: 4.5, R4: 9.0 })
                    }
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700"
                  >
                    设 ℰ₂ = 2.4V (I₂ &gt; 0 联合放电)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { key: 'E1', label: '左电源 ℰ₁ (V)', min: 0.5, max: 6.0, step: 0.1 },
                  { key: 'E2', label: '右电源 ℰ₂ (V)', min: 0.2, max: 6.0, step: 0.1 },
                  { key: 'r1', label: '内阻 r₁=r₂ (Ω)', min: 0.1, max: 2.5, step: 0.1, syncR2: true },
                  { key: 'R2', label: '支路 R₂ (Ω)', min: 1.0, max: 10.0, step: 0.5 },
                  { key: 'R3', label: '支路 R₃ (Ω)', min: 1.0, max: 10.0, step: 0.5 },
                  { key: 'R4', label: '中支路 R₄ (Ω)', min: 1.0, max: 15.0, step: 0.5 },
                ].map((item) => (
                  <div key={item.key} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-mono text-teal-300 font-bold">{m1[item.key].toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={m1[item.key]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (item.syncR2) setM1({ ...m1, r1: val, r2: val });
                        else setM1({ ...m1, [item.key]: val });
                      }}
                      className="w-full accent-teal-400 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-between font-mono text-xs">
              <div className="text-amber-400 font-sans font-bold mb-1.5">
                二阶克拉默法则 (Cramer&apos;s Rule) 与弥尔曼定理双路径核验：
              </div>
              <div className="space-y-1.5 text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  回路方程：{m1Calc.a11.toFixed(1)}I₁ + {m1Calc.a12.toFixed(1)}I₂ = {m1.E1.toFixed(1)} &nbsp;|&nbsp;{' '}
                  {m1Calc.a21.toFixed(1)}I₁ + {m1Calc.a22.toFixed(1)}I₂ = {m1.E2.toFixed(1)}
                </div>
                <div>
                  行列式值：Δ = {m1Calc.det.toFixed(1)}，Δ₁ = {m1Calc.det1.toFixed(1)}，Δ₂ = {m1Calc.det2.toFixed(1)}
                </div>
                <div className="text-teal-300 font-bold pt-0.5">
                  克拉默解：I₁ = Δ₁/Δ = {(m1Calc.I1 * 1000).toFixed(1)} mA &nbsp;|&nbsp; I₂ = Δ₂/Δ ={' '}
                  {(m1Calc.I2 * 1000).toFixed(1)} mA
                </div>
                <div className="text-sky-300">
                  弥尔曼核验：U_AC = (ℰ₁/R_L + ℰ₂/R_R)/(∑G) = {m1Calc.UAC_millman.toFixed(3)} V
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 模块 2 控制台 ==================== */}
        {activeTab === 'bridge' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  非平衡电桥参数与热敏电阻测温微扰模式
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      setM2({
                        ...m2,
                        sensorMode: false,
                        E: 14.0,
                        R1: 1.0,
                        R2: 3.0,
                        R3: 2.0,
                        R4: 1.0,
                        RG: 1.0,
                      })
                    }
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-slate-700"
                  >
                    例题 2 预设 (I_G = 70/29 A ≈ 2.41A)
                  </button>
                  <button
                    onClick={() =>
                      setM2({
                        ...m2,
                        sensorMode: false,
                        E: 14.0,
                        R1: 1.0,
                        R2: 3.0,
                        R3: 2.0,
                        R4: 6.0,
                        RG: 1.0,
                      })
                    }
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700"
                  >
                    一键平衡 (R₁R₄ = R₂R₃)
                  </button>
                  <button
                    onClick={() => setM2({ ...m2, sensorMode: !m2.sensorMode })}
                    className={`px-2.5 py-1 text-xs rounded border font-semibold ${
                      m2.sensorMode
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-800 text-rose-300 border-slate-700'
                    }`}
                  >
                    {m2.sensorMode ? '✓ 已开启练习 3 测温微扰模式' : '切换至练习 3 测温微扰模式'}
                  </button>
                </div>
              </div>

              {!m2.sensorMode ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                  {[
                    { key: 'R1', label: '桥臂 R₁ (Ω)', min: 0.5, max: 6.0, step: 0.5 },
                    { key: 'R2', label: '桥臂 R₂ (Ω)', min: 0.5, max: 6.0, step: 0.5 },
                    { key: 'R3', label: '桥臂 R₃ (Ω)', min: 0.5, max: 6.0, step: 0.5 },
                    { key: 'R4', label: '桥臂 R₄ (Ω)', min: 0.5, max: 8.0, step: 0.5 },
                    { key: 'RG', label: '检流计 R_G', min: 0.5, max: 5.0, step: 0.5 },
                  ].map((item) => (
                    <div key={item.key} className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="font-mono text-teal-300 font-bold">{m2[item.key]}</span>
                      </div>
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        step={item.step}
                        value={m2[item.key]}
                        onChange={(e) => setM2({ ...m2, [item.key]: parseFloat(e.target.value) })}
                        className="w-full accent-teal-400 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">对称基准电阻 R₀ (Ω)</span>
                      <span className="font-mono text-teal-300 font-bold">{m2.R0.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={10.0}
                      step={0.5}
                      value={m2.R0}
                      onChange={(e) => setM2({ ...m2, R0: parseFloat(e.target.value) })}
                      className="w-full accent-teal-400"
                    />
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-rose-900/60 sm:col-span-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-rose-300 font-semibold">
                        温度相对微扰量 δ = (R_t - R₀)/R₀
                      </span>
                      <span className="font-mono text-rose-300 font-bold">
                        δ = {(m2.delta * 100).toFixed(1)}% &nbsp;(R_t = {m2Calc.R4.toFixed(2)} Ω)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-0.5}
                      max={0.5}
                      step={0.01}
                      value={m2.delta}
                      onChange={(e) => setM2({ ...m2, delta: parseFloat(e.target.value) })}
                      className="w-full accent-rose-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-slate-900/90 p-4 rounded-xl border border-slate-800 font-mono text-xs flex flex-col justify-between">
              <div className="text-amber-400 font-sans font-bold mb-1">
                三阶克拉默法则按零元列拉普拉斯降阶结果：
              </div>
              <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                <div>
                  分子行列式：Δ_G = (R₂R₃ - R₁R₄)ℰ = {m2Calc.detG.toFixed(2)}
                </div>
                <div>
                  分母行列式：Δ = {m2Calc.det.toFixed(2)} &nbsp;|&nbsp; Δ₁ = {m2Calc.det1.toFixed(1)}, Δ₂ ={' '}
                  {m2Calc.det2.toFixed(1)}
                </div>
                <div className="text-teal-300 font-bold pt-0.5">
                  精确解析解：I_G = Δ_G / Δ = {m2Calc.IG.toFixed(4)} A &nbsp;(R_eq = {m2Calc.Req.toFixed(3)} Ω)
                </div>
                <div className="text-rose-300">
                  一阶线性近似：I_G,lin = {m2Calc.IG_linear.toFixed(4)} A &nbsp;(非线性失真 {m2Calc.relError.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 模块 3 控制台 ==================== */}
        {activeTab === 'cube' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  选择正立方体接入端点拓扑模式 (对应例题 3 三问)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setM3({ ...m3, yaw: -0.52, pitch: 0.36 })}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                  >
                    重置教材标准视角
                  </button>
                  <button
                    onClick={() => setM3({ ...m3, showSymmetry: !m3.showSymmetry })}
                    className={`px-2.5 py-1 text-xs rounded border font-semibold ${
                      m3.showSymmetry
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {m3.showSymmetry ? '✓ 已高亮等势点与对称面' : '显示等势点与对称面'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'bodyDiag', title: "(1) 体对角顶点 A ↔ G'", sub: '三重旋转对称：R_eq = 5/6 R' },
                  { id: 'faceDiag', title: '(2) 面对角顶点 A ↔ C', sub: '无流支路拆解：R_eq = 3/4 R' },
                  { id: 'edge', title: '(3) 同棱相邻顶点 A ↔ B', sub: '镜像对称+KVL：R_eq = 7/12 R' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setM3({ ...m3, mode: btn.id })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      m3.mode === btn.id
                        ? 'bg-teal-500/15 border-teal-400 text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-teal-300">{btn.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">{btn.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">单根棱电阻 R (Ω)</span>
                  <span className="font-mono text-teal-300 font-bold">{m3.R.toFixed(1)} Ω</span>
                </div>
                <input
                  type="range"
                  min={3.0}
                  max={24.0}
                  step={1.0}
                  value={m3.R}
                  onChange={(e) => setM3({ ...m3, R: parseFloat(e.target.value) })}
                  className="w-full accent-teal-400"
                />
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">总注入电流 I (A)</span>
                  <span className="font-mono text-rose-300 font-bold">{m3.I.toFixed(1)} A</span>
                </div>
                <input
                  type="range"
                  min={1.2}
                  max={12.0}
                  step={0.6}
                  value={m3.I}
                  onChange={(e) => setM3({ ...m3, I: parseFloat(e.target.value) })}
                  className="w-full accent-rose-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== 模块 4 控制台 ==================== */}
        {activeTab === 'displacement' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  麦克斯韦位移电流与高斯面选取控制 (对应图 1.3 与综合训练第 4 题)
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setM4({ ...m4, E: 12.0, R1: 2.0, R2: 4.0, C: 5.0, uC: 4.0, autoPlay: false })
                    }
                    className="px-2.5 py-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/40 font-semibold"
                  >
                    ★ 一键定格练习 4 瞬时 (u_C = 4.0V, du_C/dt = 600V/s)
                  </button>
                  <button
                    onClick={() => setM4({ ...m4, autoPlay: !m4.autoPlay })}
                    className={`px-3 py-1 text-xs rounded border font-semibold ${
                      m4.autoPlay
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-teal-500 text-slate-950 border-teal-400'
                    }`}
                  >
                    {m4.autoPlay ? '⏸ 暂停暂态演化' : '▶ 自动演示充电过程'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 sm:col-span-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">
                      手动拖动瞬时电容电压 u_C(t) [0 → 稳态 U_th = {m4Calc.Uth.toFixed(1)}V]
                    </span>
                    <span className="font-mono text-sky-300 font-bold">u_C = {m4Calc.uC.toFixed(2)} V</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={m4Calc.Uth}
                    step={0.05}
                    value={m4Calc.uC}
                    onChange={(e) => setM4({ ...m4, autoPlay: false, uC: parseFloat(e.target.value) })}
                    className="w-full accent-sky-400"
                  />
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <span className="text-xs text-slate-400">切换闭合高斯面选取方式：</span>
                  <div className="flex gap-1.5 mt-1">
                    <button
                      onClick={() => setM4({ ...m4, gaussianMode: 'singlePlate' })}
                      className={`flex-1 py-1 rounded text-xs font-semibold ${
                        m4.gaussianMode === 'singlePlate'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      单极板 S₁∪S₂
                    </button>
                    <button
                      onClick={() => setM4({ ...m4, gaussianMode: 'supernode' })}
                      className={`flex-1 py-1 rounded text-xs font-semibold ${
                        m4.gaussianMode === 'supernode'
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      超节点 S&apos;
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { key: 'R1', label: '电阻 R₁ (kΩ)', min: 1.0, max: 6.0, step: 0.5 },
                  { key: 'R2', label: '电阻 R₂ (kΩ)', min: 1.0, max: 8.0, step: 0.5 },
                  { key: 'C', label: '电容 C (μF)', min: 1.0, max: 10.0, step: 0.5 },
                ].map((item) => (
                  <div key={item.key} className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-mono text-teal-300 font-bold">{m4[item.key].toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={m4[item.key]}
                      onChange={(e) => setM4({ ...m4, [item.key]: parseFloat(e.target.value) })}
                      className="w-full accent-teal-400 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs flex flex-col justify-between">
              <div className="text-teal-400 font-bold mb-1">全电流连续性定理 (广义 KCL) 物理结论：</div>
              <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                {m4.gaussianMode === 'singlePlate'
                  ? `选取闭合面 S = S₁ ∪ S₂ 包围左极板：穿入 S₁ 的传导电流 I_c = ${m4Calc.Ic.toFixed(
                      2
                    )} mA 与穿出极板间隙 S₂ 的麦克斯韦位移电流 I_d = dΨ_D/dt = ${m4Calc.Id.toFixed(
                      2
                    )} mA 严格相等 (-I_c + I_d = 0)，全电流在空间处处连续！`
                  : `选取外部大闭合面 S' 将整个电容器作为“广义超节点”包裹在内：内部两极板总净电荷 q_in = (+${m4Calc.q.toFixed(
                      1
                    )}μC) + (-${m4Calc.q.toFixed(1)}μC) ≡ 0，流入与流出引线的传导电流直接相等！`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}