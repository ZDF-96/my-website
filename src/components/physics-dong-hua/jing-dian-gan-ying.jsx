'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * ============================================================================
 * 导体的静电平衡、静电屏蔽与电容器全章节仿真平台 (V15.0 · 全动态零遮挡终极版)
 * ----------------------------------------------------------------------------
 * 【根治遮挡】全模块双舱/多舱硬件级 ctx.clip() 裁剪 + 胶囊铭牌避让算法，杜绝文字穿线。
 * 【全真动画】60FPS 实时物理粒子流：电子迁移弛豫、空腔轨道巡航、接地电子流、偶极子热运动、
 *             尖端电风/灭弧等离子体、RC自动循环充放电、串并联网络支路电子分流与板间动态电场。
 * ============================================================================
 */

const LOGICAL_W = 920;
const LOGICAL_H = 600;
const MODULE3_PLATE_WIDTH = 280;
const MODULE3_MAX_SLAB_INSERTION = 0.72;

export default function JingDianGanYingSimulation() {
  const canvasRef = useRef(null);

  const [activeTab, setActiveTab] = useState(0);

  // 模块 0：静电平衡与 E(x)-φ(x)
  const [extE0, setExtE0] = useState(10.0);
  const [phi0, setPhi0] = useState(4.0);
  const [isGrounded0, setIsGrounded0] = useState(false);
  const [mod0Sub, setMod0Sub] = useState(0); // 0: 图1.2三层对照, 1: 图1.4/1.5尖端曲率与高斯面

  // 模块 1：空腔静电屏蔽全动态沙盘
  const [cavityQ, setCavityQ] = useState(1); // 1: +q, 0: 无, -1: -q
  const [shellGrounded, setShellGrounded] = useState(false);
  const [shieldExtField, setShieldExtField] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(true);

  // 模块 2：平行板电容器决定式与四表面电荷定理 (独立板块)
  const [mod2Sub, setMod2Sub] = useState(0); // 0: 电容决定式 C=εrε0S/d, 1: 四表面电荷q1~q4与三区域场强叠加
  const [capS, setCapS] = useState(1.0);
  const [capD, setCapD] = useState(1.0);
  const [capEr, setCapEr] = useState(1.0);
  const [plateQA, setPlateQA] = useState(12.0);
  const [plateQB, setPlateQB] = useState(-12.0);

  // 模块 3：电介质极化微观机制与动态四步分析法
  const [capConstraint, setCapConstraint] = useState(0); // 0: 恒压 U=12V, 1: 恒电量 Q=12μC
  const [dynD, setDynD] = useState(1.0);
  const [slabX, setSlabX] = useState(0.48);
  const [thermalT, setThermalT] = useState(0.35);

  // 模块 4：尖端电晕雪崩 vs 触头电弧
  const [dischargeMode, setDischargeMode] = useState(0); // 0: 尖端电晕(图1.6), 1: 触头拉弧(图1.7)
  const [tipField, setTipField] = useState(4.5);
  const [arcGap, setArcGap] = useState(18);

  // 模块 5：RC 充放电回路与串并联网络
  const [mod5Sub, setMod5Sub] = useState(0); // 0: 图3.1/3.2 RC充放电回路, 1: 图6.1串联, 2: 图6.2并联
  const [rcSwitch, setRcSwitch] = useState(1);
  const [rcRes, setRcRes] = useState(2.0);
  const [rcAutoCycle, setRcAutoCycle] = useState(true);
  const [netC1, setNetC1] = useState(3.0);
  const [netU, setNetU] = useState(12.0);

  const physics = useRef({
    time: 0,
    isDragging: false,
    pointerX: 0,
    pointerY: 0,
    activeTab: 0,

    // 模块 0
    relaxEta: 1.0,
    extE0: 10.0,
    phi0: 4.0,
    isGrounded0: false,
    mod0Sub: 0,

    // 模块 1 (静电屏蔽动态参量)
    cavityQ: 1,
    shellGrounded: false,
    shieldExtField: false,
    autoOrbit: true,
    eccX: 34,
    eccY: 0,
    targetEccX: 34,
    targetEccY: 0,
    outerNeutralizeRatio: 0,
    groundWirePulse: 0,

    // 模块 2 (平行板决定式与四表面)
    mod2Sub: 0,
    capS: 1.0,
    capD: 1.0,
    capEr: 1.0,
    plateQA: 12.0,
    plateQB: -12.0,

    // 模块 3 (电介质极化与动态四步法)
    capConstraint: 0,
    dynD: 1.0,
    slabX: 0.48,
    targetSlabX: 0.48,
    thermalT: 0.35,
    dropOffsetY: 0,
    dropVelY: 0,

    // 模块 4 (电晕与电弧)
    dischargeMode: 0,
    tipField: 4.5,
    arcGap: 18,
    targetArcGap: 18,

    // 模块 5 (RC 与串并联)
    mod5Sub: 0,
    rcSwitch: 1,
    rcRes: 2.0,
    rcAutoCycle: true,
    rcProgress: 0.25,
    netC1: 3.0,
    netU: 12.0,
  });

  useEffect(() => { physics.current.activeTab = activeTab; }, [activeTab]);
  useEffect(() => { physics.current.extE0 = extE0; }, [extE0]);
  useEffect(() => { physics.current.phi0 = phi0; }, [phi0]);
  useEffect(() => { physics.current.isGrounded0 = isGrounded0; }, [isGrounded0]);
  useEffect(() => { physics.current.mod0Sub = mod0Sub; }, [mod0Sub]);
  useEffect(() => { physics.current.cavityQ = cavityQ; }, [cavityQ]);
  useEffect(() => {
    physics.current.shellGrounded = shellGrounded;
    physics.current.groundWirePulse = 1.0;
  }, [shellGrounded]);
  useEffect(() => { physics.current.shieldExtField = shieldExtField; }, [shieldExtField]);
  useEffect(() => { physics.current.autoOrbit = autoOrbit; }, [autoOrbit]);
  useEffect(() => { physics.current.mod2Sub = mod2Sub; }, [mod2Sub]);
  useEffect(() => { physics.current.capS = capS; }, [capS]);
  useEffect(() => { physics.current.capD = capD; }, [capD]);
  useEffect(() => { physics.current.capEr = capEr; }, [capEr]);
  useEffect(() => { physics.current.plateQA = plateQA; }, [plateQA]);
  useEffect(() => { physics.current.plateQB = plateQB; }, [plateQB]);
  useEffect(() => { physics.current.capConstraint = capConstraint; }, [capConstraint]);
  useEffect(() => { physics.current.dynD = dynD; }, [dynD]);
  useEffect(() => {
    physics.current.slabX = slabX;
    physics.current.targetSlabX = slabX;
  }, [slabX]);
  useEffect(() => { physics.current.thermalT = thermalT; }, [thermalT]);
  useEffect(() => { physics.current.dischargeMode = dischargeMode; }, [dischargeMode]);
  useEffect(() => { physics.current.tipField = tipField; }, [tipField]);
  useEffect(() => {
    physics.current.arcGap = arcGap;
    physics.current.targetArcGap = arcGap;
  }, [arcGap]);
  useEffect(() => { physics.current.mod5Sub = mod5Sub; }, [mod5Sub]);
  useEffect(() => { physics.current.rcSwitch = rcSwitch; }, [rcSwitch]);
  useEffect(() => { physics.current.rcRes = rcRes; }, [rcRes]);
  useEffect(() => { physics.current.rcAutoCycle = rcAutoCycle; }, [rcAutoCycle]);
  useEffect(() => { physics.current.netC1 = netC1; }, [netC1]);
  useEffect(() => { physics.current.netU = netU; }, [netU]);

  const replayRelaxation = useCallback(() => {
    physics.current.relaxEta = 0.0;
  }, []);

  const triggerRC = useCallback((pos) => {
    setRcAutoCycle(false);
    physics.current.rcAutoCycle = false;
    setRcSwitch(pos);
    physics.current.rcSwitch = pos;
    physics.current.rcProgress = pos === 1 ? 0.02 : 0.98;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    let animationId;
    let lastTime = performance.now();

    const resizeCanvas = () => {
      const w = Math.max(320, canvas.clientWidth);
      const h = Math.max(420, canvas.clientHeight);
      const dpr = window.devicePixelRatio || 2;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform((w * dpr) / LOGICAL_W, 0, 0, (h * dpr) / LOGICAL_H, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    };
    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const updatePhysics = (dtMs) => {
      const s = physics.current;
      const dt = Math.max(0.001, Math.min(dtMs / 1000, 0.04));
      s.time += dt;

      if (s.relaxEta < 1.0) {
        s.relaxEta = Math.min(1.0, s.relaxEta + dt * 0.55);
      }

      if (s.activeTab === 1) {
        if (s.autoOrbit && !s.isDragging && s.cavityQ !== 0) {
          const orbitR = 35;
          s.targetEccX = orbitR * Math.cos(s.time * 1.35);
          s.targetEccY = orbitR * Math.sin(s.time * 1.35);
        }
        s.eccX += (s.targetEccX - s.eccX) * Math.min(1, 14 * dt);
        s.eccY += (s.targetEccY - s.eccY) * Math.min(1, 14 * dt);

        const targetNeutral = s.shellGrounded ? 1.0 : 0.0;
        s.outerNeutralizeRatio += (targetNeutral - s.outerNeutralizeRatio) * Math.min(1, 5.5 * dt);
        if (s.groundWirePulse > 0) {
          s.groundWirePulse = Math.max(0, s.groundWirePulse - dt * 0.7);
        }
      }

      if (s.activeTab === 3) {
        s.slabX += (s.targetSlabX - s.slabX) * Math.min(1, 14 * dt);
        const erEff = 1 + (3.0 - 1) * s.slabX;
        const C = erEff / s.dynD;
        const U = s.capConstraint === 0 ? 12.0 : 12.0 / C;
        const E = U / s.dynD;
        const F_net = E - 12.0;
        if (Math.abs(F_net) < 0.08) {
          s.dropVelY *= 0.85;
          s.dropOffsetY *= 0.9;
        } else {
          s.dropVelY = (s.dropVelY + F_net * 14 * dt) * 0.95;
          s.dropOffsetY = Math.max(-28, Math.min(28, s.dropOffsetY + s.dropVelY * dt));
        }
      }

      if (s.activeTab === 4) {
        s.arcGap += (s.targetArcGap - s.arcGap) * Math.min(1, 15 * dt);
      }

      if (s.activeTab === 5 && s.mod5Sub === 0) {
        const target = s.rcSwitch === 1 ? 1.0 : 0.0;
        const rate = 1.25 / Math.max(0.8, s.rcRes);
        s.rcProgress += (target - s.rcProgress) * Math.min(1, rate * dt);

        if (s.rcAutoCycle) {
          if (s.rcSwitch === 1 && s.rcProgress > 0.965) {
            s.rcSwitch = 2;
            setRcSwitch(2);
          } else if (s.rcSwitch === 2 && s.rcProgress < 0.035) {
            s.rcSwitch = 1;
            setRcSwitch(1);
          }
        }
      }
    };

    // =========================================================================
    // 硬件级防遮挡绘图核心组件库 (强制重置 textAlign='left' + 独立 Clipping 遮罩)
    // =========================================================================
    const drawGrid = () => {
      ctx.save();
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= LOGICAL_W; x += 46) { ctx.moveTo(x, 0); ctx.lineTo(x, LOGICAL_H); }
      for (let y = 0; y <= LOGICAL_H; y += 46) { ctx.moveTo(0, y); ctx.lineTo(LOGICAL_W, y); }
      ctx.stroke();
      ctx.restore();
    };

    /**
     * 绘制胶囊文字铭牌（自带深色半透明底衬与边框，彻底防止任何文字与背景线条交叉重叠）
     */
    const drawPillLabel = (cx, cy, text, textColor = '#f8fafc', borderColor = '#334155', fontSize = 11.5) => {
      ctx.save();
      ctx.font = `bold ${fontSize}px ui-monospace, monospace`;
      const padX = 8;
      const w = ctx.measureText(text).width + padX * 2;
      const h = fontSize + 9;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, cy + 0.5);
      ctx.restore();
    };

    /**
     * 绘制顶部数据监控卡片 (内置硬件级 ctx.clip() 与强制左对齐，绝不泄漏或越界)
     */
    const drawHudCard = (x, y, w, h, title, lines = [], customDraw = null) => {
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
      ctx.clip();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.fillText(title, x + 14, y + 18, w - 28);

      ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 34);
      ctx.lineTo(x + w - 10, y + 34);
      ctx.stroke();

      lines.forEach((item, idx) => {
        const ly = y + 52 + idx * 25;
        ctx.fillStyle = item.color || '#cbd5e1';
        ctx.font = `${item.bold ? 'bold ' : ''}12px ui-monospace, monospace`;
        ctx.fillText(item.text, x + 14, ly, w - 28);
      });

      if (customDraw) customDraw(x, y, w, h);
      ctx.restore();
    };

    /**
     * 绘制主实验分舱面板 (标题栏与内容区严格分离，内容区独立 Clipping 裁剪)
     */
    const drawPanel = (x, y, w, h, title, contentFn) => {
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.fillText(title, x + 14, y + 18, w - 28);

      ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 34);
      ctx.lineTo(x + w - 10, y + 34);
      ctx.stroke();

      ctx.beginPath();
      ctx.rect(x + 2, y + 36, w - 4, h - 38);
      ctx.clip();

      if (contentFn) {
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        contentFn(x, y + 36, w, h - 38);
        ctx.restore();
      }
      ctx.restore();
    };

    const drawVector = (x, y, dx, dy, color, label = '', labelPos = 'top') => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.3;
      const len = Math.hypot(dx, dy);
      if (len > 3) {
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();

        ctx.translate(x + dx, y + dy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -4.2);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-8, 4.2);
        ctx.closePath();
        ctx.fill();
        ctx.rotate(-angle);
        ctx.translate(-(x + dx), -(y + dy));
      }
      if (label) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.font = 'bold 11.5px ui-monospace, monospace';
        if (labelPos === 'right') {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, x + dx + 6, y + dy);
        } else if (labelPos === 'left') {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, x + dx - 6, y + dy);
        } else if (labelPos === 'bottom') {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(label, x + dx, y + dy + 6);
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(label, x + dx, y + dy - 5);
        }
      }
      ctx.restore();
    };

    const drawAnimatedFieldLine = (x1, y1, x2, y2, color, phaseOffset = 0) => {
      drawVector(x1, y1, x2 - x1, y2 - y1, color, '');
      const p = ((physics.current.time * 1.15 + phaseOffset) % 1 + 1) % 1;
      const qx = x1 + (x2 - x1) * p;
      const qy = y1 + (y2 - y1) * p;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(qx, qy, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawChargeBadge = (x, y, sign, color, radius = 6.5) => {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.round(radius * 1.5)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sign, x, y + 0.5);
      ctx.restore();
    };

    const drawGroundSymbol = (x, y, color = '#38bdf8') => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 14);
      ctx.moveTo(x - 12, y + 14);
      ctx.lineTo(x + 12, y + 14);
      ctx.moveTo(x - 7, y + 20);
      ctx.lineTo(x + 7, y + 20);
      ctx.moveTo(x - 3, y + 26);
      ctx.lineTo(x + 3, y + 26);
      ctx.stroke();
      ctx.restore();
    };

    // =========================================================================
    // 模块 0：导体的静电平衡与 E(x) - φ(x) 空间分布 (图 1.1 ~ 1.5)
    // =========================================================================
    const renderModule0 = () => {
      const s = physics.current;
      const E0 = s.extE0;
      const eta = s.relaxEta;
      const E_prime = E0 * eta;
      const E_in = E0 - E_prime;
      const actualPhi0 = s.isGrounded0 ? 0 : s.phi0;

      drawHudCard(16, 12, 436, 124, '静电感应弛豫与微积分关系 E_x = -dφ/dx', [
        { text: `外加电场 E₀ = +${E0.toFixed(1)} V/m  |  感应场 E' = -${E_prime.toFixed(1)} V/m`, color: '#cbd5e1' },
        { text: `内部净场强 E_in = E₀ + E' = ${E_in.toFixed(2)} V/m`, color: '#38bdf8', bold: true },
        {
          text: E_in < 0.05 ? '● 已达静电平衡：导体内部场强处处为零 (等势体)' : `● 自由电子逆场向左迁移弛豫中 (${(eta * 100).toFixed(0)}%)...`,
          color: E_in < 0.05 ? '#34d399' : '#fbbf24',
          bold: true,
        },
      ]);

      drawHudCard(468, 12, 436, 124, '易混概念辨析：“场强为零”绝不等于“电势为零”', [
        { text: `导体等势平台电势 φ₀ = ${actualPhi0 >= 0 ? '+' : ''}${actualPhi0.toFixed(1)} V`, color: '#38bdf8', bold: true },
        { text: '• E_in = 0 仅代表电势斜率 -dφ/dx = 0 (水平平台)', color: '#cbd5e1' },
        { text: '• 鼠标上下拖动下方画面可自由平移等势平台高度 φ₀', color: '#fbbf24', bold: true },
      ]);

      if (s.mod0Sub === 0) {
        drawPanel(16, 146, 888, 440, '图 1.1 & 1.2：实心导体内自由电子迁移弛豫与 E(x) — φ(x) 贯穿对照', () => {
          const x1 = 310, x2 = 610, condW = 300, cx = 460;

          ctx.fillStyle = 'rgba(51, 65, 85, 0.22)';
          ctx.fillRect(x1, 184, condW, 394);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(x1, 184); ctx.lineTo(x1, 576);
          ctx.moveTo(x2, 184); ctx.lineTo(x2, 576);
          ctx.stroke();
          ctx.setLineDash([]);

          // 第一层：实心金属导体与微观电子漂移 (cy = 238)
          const cy = 238, condH = 64;
          [-20, 0, 20].forEach((dy, idx) => {
            drawAnimatedFieldLine(90, cy + dy, x1 - 6, cy + dy, '#2dd4bf', idx * 0.3);
            drawAnimatedFieldLine(x2 + 6, cy + dy, 830, cy + dy, '#2dd4bf', idx * 0.3);
          });
          drawPillLabel(195, cy - 36, `外电场 E₀ = ${E0.toFixed(0)} V/m`, '#2dd4bf', '#115e59', 11);

          const grad = ctx.createLinearGradient(0, cy - condH / 2, 0, cy + condH / 2);
          grad.addColorStop(0, '#334155');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x1, cy - condH / 2, condW, condH, 6);
          ctx.fill();
          ctx.stroke();

          for (let i = 0; i < 5; i++) {
            const lx = x1 + 54 + i * 48;
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
            ctx.beginPath(); ctx.arc(lx, cy, 5.5, 0, Math.PI * 2); ctx.stroke();
            const ex = lx - eta * 22 + Math.cos(s.time * 8 + i * 2) * 3;
            const ey = cy + Math.sin(s.time * 10 + i * 3) * 4;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath(); ctx.arc(ex, ey, 2.8, 0, Math.PI * 2); ctx.fill();
          }

          const vecLen = (E0 / 16) * 90;
          const vecPrimeLen = (E_prime / 16) * 90;
          drawVector(cx - 48, cy - 15, vecLen, 0, '#38bdf8', 'E₀', 'right');
          if (E_prime > 0.2) {
            drawVector(cx + 48, cy + 15, -vecPrimeLen, 0, '#f43f5e', "E'", 'left');
          }

          const nPairs = Math.max(1, Math.round((E_prime / 16) * 4));
          for (let i = 0; i < nPairs; i++) {
            const py = cy - 20 + ((i + 0.5) / nPairs) * 40;
            drawChargeBadge(x1 + 11, py, '−', '#38bdf8', 5.5);
            drawChargeBadge(x2 - 11, py, '+', '#f43f5e', 5.5);
          }
          if (s.isGrounded0) drawGroundSymbol(x2 - 18, cy + condH / 2);

          // 第二层：场强分布 E(x) - x (yE = 392)
          const yE = 392;
          const hE0 = (E0 / 16) * 56;
          const hEin = (E_in / 16) * 56;

          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(75, yE); ctx.lineTo(845, yE);
          ctx.moveTo(90, yE + 10); ctx.lineTo(90, yE - 78);
          ctx.stroke();
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 12px ui-monospace, monospace';
          ctx.fillText('E(x)', 48, yE - 64);

          ctx.fillStyle = 'rgba(244, 63, 94, 0.16)';
          ctx.fillRect(90, yE - hE0, x1 - 90, hE0);
          ctx.fillRect(x2, yE - hE0, 830 - x2, hE0);

          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(90, yE - hE0); ctx.lineTo(x1, yE - hE0);
          ctx.moveTo(x1, yE - hEin); ctx.lineTo(x2, yE - hEin);
          ctx.moveTo(x2, yE - hE0); ctx.lineTo(830, yE - hE0);
          ctx.stroke();

          [x1, x2].forEach((bx) => {
            ctx.fillStyle = '#020617'; ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(bx, yE - hE0, 3.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath(); ctx.arc(bx, yE - hEin, 3.8, 0, Math.PI * 2); ctx.fill();
          });

          drawPillLabel(cx, yE - hEin - 16, `内部场强 E_in = ${E_in.toFixed(2)} V/m`, '#f43f5e', '#881337', 11);

          // 第三层：电势分布 φ(x) - x (零势线 yPhi0 = 502)
          const yPhi0 = 502;
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(75, yPhi0); ctx.lineTo(845, yPhi0); ctx.stroke();
          ctx.setLineDash([]);

          ctx.strokeStyle = '#475569';
          ctx.beginPath(); ctx.moveTo(90, 568); ctx.lineTo(90, 425); ctx.stroke();
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 12px ui-monospace, monospace';
          ctx.fillText('φ(x)', 48, 438);
          ctx.fillText('φ=0', 52, yPhi0);

          const phiMidY = Math.max(466, Math.min(534, yPhi0 - actualPhi0 * 3.1));
          const slopeOut = E0 * 1.85;
          const slopeIn = E_in * 1.85;
          const yX1 = phiMidY - slopeIn * 0.5;
          const yX2 = phiMidY + slopeIn * 0.5;

          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 5;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(105, yX1 - slopeOut);
          ctx.lineTo(x1, yX1);
          ctx.lineTo(x2, yX2);
          ctx.lineTo(815, yX2 + slopeOut);
          ctx.stroke();
          ctx.restore();

          // 动态扫描光点沿 φ(x) 曲线巡航
          const scanU = (s.time * 0.38) % 1;
          const scanX = 105 + scanU * 710;
          let scanY = phiMidY;
          if (scanX < x1) scanY = yX1 - slopeOut * ((x1 - scanX) / (x1 - 105));
          else if (scanX > x2) scanY = yX2 + slopeOut * ((scanX - x2) / (815 - x2));
          else scanY = yX1 + (yX2 - yX1) * ((scanX - x1) / (x2 - x1));
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(scanX, scanY, 3.8, 0, Math.PI * 2); ctx.fill();
          ctx.restore();

          drawPillLabel(cx, Math.min(yX1, yX2) - 16, `等势平台 φ₀ = ${actualPhi0.toFixed(1)}V (斜率 -dφ/dx = ${E_in.toFixed(1)})`, '#38bdf8', '#0369a1', 11);
          drawPillLabel(x1, 566, 'x₁', '#cbd5e1', '#334155', 11);
          drawPillLabel(x2, 566, 'x₂', '#cbd5e1', '#334155', 11);
        });
      } else {
        drawPanel(16, 146, 534, 440, '图 1.5：孤立带电导体表面电荷分布与曲率半径关系', () => {
          const cy = 375, xL = 210, xR = 385;
          const grad = ctx.createLinearGradient(0, cy - 75, 0, cy + 75);
          grad.addColorStop(0, '#334155');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(xL, cy, 76, Math.PI * 0.36, Math.PI * 1.64);
          ctx.arc(xR, cy, 24, -Math.PI * 0.36, Math.PI * 0.36);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.save();
          ctx.textAlign = 'center';
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 12.5px ui-monospace, monospace';
          ctx.fillText('等势体 E_in = 0', xL + 36, cy - 10);
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('σ₂/σ₁ = R₁/R₂ ≫ 1', xL + 36, cy + 12);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText('左端平缓 R₁ 大 ⇒ |σ₁| 与 E_n1 较小  |  右端尖锐 R₂ 小 ⇒ |σ₂| 与 E_n2 极大', 283, 555);
          ctx.restore();

          [125, 152, 180, 208, 235].forEach((deg, idx) => {
            const rad = (deg * Math.PI) / 180;
            const sx = xL + 76 * Math.cos(rad), sy = cy - 76 * Math.sin(rad);
            drawAnimatedFieldLine(sx, sy, sx + 36 * Math.cos(rad), sy - 36 * Math.sin(rad), '#38bdf8', idx * 0.2);
            drawChargeBadge(xL + 63 * Math.cos(rad), cy - 63 * Math.sin(rad), '+', '#38bdf8', 5.5);
          });

          [-55, -36, -18, 0, 18, 36, 55].forEach((deg, idx) => {
            const rad = (deg * Math.PI) / 180;
            const sx = xR + 24 * Math.cos(rad), sy = cy - 24 * Math.sin(rad);
            const len = 68 + E0 * 2.0;
            drawAnimatedFieldLine(sx, sy, sx + len * Math.cos(rad), sy - len * Math.sin(rad), '#f43f5e', idx * 0.15);
            drawChargeBadge(xR + 14 * Math.cos(rad), cy - 14 * Math.sin(rad), '+', '#f43f5e', 5);
          });
        });

        drawPanel(566, 146, 338, 440, '图 1.4：扁圆柱高斯面推导 E_n = σ/ε₀', () => {
          const px = 735, py = 385;
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.fillRect(595, py, 280, 115);
          ctx.strokeRect(595, py, 280, 115);

          ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
          ctx.strokeStyle = '#10b981';
          ctx.setLineDash([4, 3]);
          ctx.fillRect(px - 66, py - 54, 132, 100);
          ctx.strokeRect(px - 66, py - 54, 132, 100);
          ctx.setLineDash([]);

          [-40, 0, 40].forEach((dx, idx) => {
            drawAnimatedFieldLine(px + dx, py - 12, px + dx, py - 115, '#2dd4bf', idx * 0.28);
          });

          for (let i = -2; i <= 2; i++) {
            drawChargeBadge(px + i * 24, py, '+', '#f43f5e', 6);
          }

          drawPillLabel(px, 232, '上底面通量 Φ_E = E_n·ΔS', '#2dd4bf', '#115e59', 11.5);
          drawPillLabel(px, py + 76, '导体内部 E_in = 0 (Φ_底 = 0)', '#94a3b8', '#334155', 11.5);
          drawPillLabel(px, 548, '高斯定理：E_n = σ / ε₀', '#fbbf24', '#78350f', 12);
        });
      }
    };

    // =========================================================================
    // 模块 1：空腔静电屏蔽全动态沙盘 (左舱：动态空腔沙盘 + 右舱：径向场强 E(r) 曲线)
    // =========================================================================
    const renderModule1 = () => {
      const s = physics.current;
      const qIn = s.cavityQ;
      const qWallIn = -qIn;
      const neutralRatio = s.outerNeutralizeRatio;

      drawHudCard(16, 12, 436, 124, '高斯定理严密证明 (高斯面 S 选在导体肉质内部)', [
        { text: '导体肉质内处处 E_肉质 ≡ 0  ⇒  电通量 Φ_E = ∮ E·dS ≡ 0', color: '#cbd5e1' },
        { text: `腔内电荷 q_腔 = ${qIn > 0 ? '+q' : qIn < 0 ? '-q' : '0'}  |  内壁感应 q_内壁 = ${qWallIn > 0 ? '+q' : qWallIn < 0 ? '-q' : '0'}`, color: '#38bdf8' },
        { text: '高斯面必然推论：q_腔 + q_内壁 = 0  ⇒  q_内壁 ≡ -q_腔', color: '#34d399', bold: true },
      ]);

      drawHudCard(468, 12, 436, 124, '唯一性定理与内外静电解耦实时监视器', [
        {
          text: s.shellGrounded ? '● 金属壳已接地 (φ_壳 = 0)：大地电子涌入中和外壁电荷' : '● 金属壳未接地 (孤立)：外壁感应出等量均匀电荷',
          color: s.shellGrounded ? '#34d399' : '#fbbf24',
          bold: true,
        },
        { text: '• 腔内 +q 巡航时：内壁 -q 潮汐滑移，弯曲场线实时重构', color: '#cbd5e1' },
        { text: '• 静电解耦：导体肉质 E=0 隔绝内外，外壁分布恒定对称！', color: '#38bdf8', bold: true },
      ]);

      // 左舱：无遮挡全动态空腔静电屏蔽沙盘 (x: 16..565)
      drawPanel(16, 146, 550, 440, '图 1.3 & 2.1：空腔静电屏蔽动态物理过程 (轨道巡航 + 接地电子流)', () => {
        const cx = 272, cy = 372;
        const R_in = 78, R_gauss = 101, R_out = 124;

        // 接地线置于右下 42° 方向，彻底避开水平与正交场线
        const gAng = (42 * Math.PI) / 180;
        const wireStartX = cx + R_out * Math.cos(gAng);
        const wireStartY = cy + R_out * Math.sin(gAng);
        const wireTurnX = 504;
        const wireEndY = 502;

        // 1. 外部空间动态电场流
        if (s.shieldExtField) {
          [-84, -42, 0, 42, 84].forEach((dy, idx) => {
            drawAnimatedFieldLine(36, cy + dy, cx - R_out - 6, cy + dy * 0.7, '#2dd4bf', idx * 0.2);
            const rightEndY = idx === 4 ? cy + dy - 16 : cy + dy;
            drawAnimatedFieldLine(cx + R_out + 6, cy + dy * 0.7, 535, rightEndY, '#2dd4bf', idx * 0.2);
          });
          [145, 162, 180, 198, 215].forEach((deg) => {
            const rad = (deg * Math.PI) / 180;
            drawChargeBadge(cx + (R_out - 8) * Math.cos(rad), cy + (R_out - 8) * Math.sin(rad), '−', '#38bdf8', 5);
          });
          [-35, -18, 0, 18, 32].forEach((deg) => {
            const rad = (deg * Math.PI) / 180;
            drawChargeBadge(cx + (R_out - 8) * Math.cos(rad), cy + (R_out - 8) * Math.sin(rad), '+', '#f43f5e', 5);
          });
        } else if (qIn !== 0 && neutralRatio < 0.96) {
          ctx.save();
          ctx.globalAlpha = 1 - neutralRatio;
          for (let i = 0; i < 12; i++) {
            if (i === 1) continue; // 避让 30°~45° 接地线通道
            const rad = (i * 30 * Math.PI) / 180;
            const rStart = qIn > 0 ? R_out + 4 : R_out + 50;
            const rEnd = qIn > 0 ? R_out + 50 : R_out + 4;
            drawAnimatedFieldLine(
              cx + rStart * Math.cos(rad),
              cy + rStart * Math.sin(rad),
              cx + rEnd * Math.cos(rad),
              cy + rEnd * Math.sin(rad),
              '#2dd4bf',
              i * 0.08
            );
          }
          ctx.restore();
        }

        // 2. 金属球壳环形实体
        const shellGrad = ctx.createRadialGradient(cx, cy, R_in, cx, cy, R_out);
        shellGrad.addColorStop(0, '#1e293b');
        shellGrad.addColorStop(0.5, '#334155');
        shellGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = shellGrad;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(cx, cy, R_out, 0, Math.PI * 2);
        ctx.arc(cx, cy, R_in, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.stroke();

        // 3. 导体肉质内绿色虚线高斯面 S
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, R_gauss, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4. 空腔内部动态巡航点电荷 + 实时正交弯曲场线
        if (qIn === 0) {
          // 动态零场激光雷达扫描波，直观体现外电场被屏蔽
          const scanR = ((s.time * 42) % (R_in - 12)) + 8;
          ctx.save();
          ctx.strokeStyle = `rgba(52, 211, 153, ${0.55 * (1 - scanR / R_in)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, scanR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          drawPillLabel(cx, cy - 12, 'q_腔 = 0 ⇒ σ_内壁 ≡ 0', '#34d399', '#065f46', 11.5);
          drawPillLabel(cx, cy + 14, 'E_腔 ≡ 0.00 V/m (外场完全屏蔽)', '#38bdf8', '#0369a1', 11.5);
        } else {
          const qx = cx + s.eccX;
          const qy = cy + s.eccY;
          const eccDist = Math.hypot(s.eccX, s.eccY);
          const eccAng = Math.atan2(s.eccY, s.eccX);
          const dNorm = Math.min(0.68, eccDist / R_in);

          if (s.autoOrbit) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
            ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
          }

          for (let i = 0; i < 12; i++) {
            const emitAng = (i * 30 * Math.PI) / 180;
            const wallAng = emitAng - dNorm * 0.48 * Math.sin(emitAng - eccAng);

            const sx = qx + 13 * Math.cos(emitAng);
            const sy = qy + 13 * Math.sin(emitAng);
            const wx = cx + (R_in - 3) * Math.cos(wallAng);
            const wy = cy + (R_in - 3) * Math.sin(wallAng);

            const c1x = qx + 34 * Math.cos(emitAng);
            const c1y = qy + 34 * Math.sin(emitAng);
            const c2x = cx + (R_in - 26) * Math.cos(wallAng);
            const c2y = cy + (R_in - 26) * Math.sin(wallAng);

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(c1x, c1y, c2x, c2y, wx, wy);
            ctx.stroke();

            const u = ((s.time * 1.4 + i * 0.08) % 1 + 1) % 1;
            const tBez = qIn > 0 ? u : 1 - u;
            const mt = 1 - tBez;
            const px = mt * mt * mt * sx + 3 * mt * mt * tBez * c1x + 3 * mt * tBez * tBez * c2x + tBez * tBez * tBez * wx;
            const py = mt * mt * mt * sy + 3 * mt * mt * tBez * c1y + 3 * mt * tBez * tBez * c2y + tBez * tBez * tBez * wy;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI * 2); ctx.fill();

            drawChargeBadge(
              cx + (R_in + 8) * Math.cos(wallAng),
              cy + (R_in + 8) * Math.sin(wallAng),
              qWallIn > 0 ? '+' : '−',
              qWallIn > 0 ? '#f43f5e' : '#38bdf8',
              5
            );
          }

          ctx.save();
          ctx.fillStyle = qIn > 0 ? '#f43f5e' : '#38bdf8';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(qx, qy, 12.5, 0, Math.PI * 2); ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(qIn > 0 ? '+q' : '-q', qx, qy);
          ctx.restore();
        }

        // 5. 外壁均匀电荷与右下接地线电子流中和动画
        if (!s.shieldExtField && qIn !== 0 && neutralRatio < 0.96) {
          ctx.save();
          ctx.globalAlpha = 1 - neutralRatio;
          for (let i = 0; i < 12; i++) {
            const rad = ((i * 30 + 15) * Math.PI) / 180;
            drawChargeBadge(
              cx + (R_out - 8) * Math.cos(rad),
              cy + (R_out - 8) * Math.sin(rad),
              qIn > 0 ? '+' : '−',
              qIn > 0 ? '#f43f5e' : '#38bdf8',
              5
            );
          }
          ctx.restore();
        }

        ctx.strokeStyle = s.shellGrounded ? '#38bdf8' : '#475569';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(wireStartX, wireStartY);
        ctx.lineTo(wireTurnX, wireStartY);
        ctx.lineTo(wireTurnX, wireEndY);
        ctx.stroke();
        drawGroundSymbol(wireTurnX, wireEndY, s.shellGrounded ? '#38bdf8' : '#475569');

        if (s.shellGrounded || s.groundWirePulse > 0.05) {
          const seg1 = wireTurnX - wireStartX;
          const seg2 = wireEndY - wireStartY;
          const totalLen = seg1 + seg2;
          for (let i = 0; i < 3; i++) {
            const p = (s.time * 1.55 + i * 0.33) % 1;
            const dist = (1 - p) * totalLen;
            const ex = dist < seg1 ? wireStartX + dist : wireTurnX;
            const ey = dist < seg1 ? wireStartY : wireStartY + (dist - seg1);
            drawChargeBadge(ex, ey, 'e⁻', '#38bdf8', 5.8);
          }
        }
      });

      // 右舱：实时径向场强分布曲线 E(r) - r (x: 580..904)
      drawPanel(580, 146, 324, 440, '球壳内外径向场强分布 E(r) 实时图像', () => {
        const ox = 618, oy = 475, gw = 258, gh = 235;
        const r1X = ox + 85, r2X = ox + 155;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.fillRect(r1X, oy - gh, r2X - r1X, gh);
        ctx.strokeStyle = '#10b981';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(r1X, oy); ctx.lineTo(r1X, oy - gh);
        ctx.moveTo(r2X, oy); ctx.lineTo(r2X, oy - gh);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy);
        ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh);
        ctx.stroke();

        // 计算腔内偏心调制因子（体现腔内巡航对内壁局部场强的动态影响，而壳外绝对不变）
        const eccBoost = 1 + 0.22 * (s.eccX / 36);

        // 1. 腔内场强曲线 (r < R1)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        if (qIn === 0) {
          ctx.moveTo(ox + 6, oy);
          ctx.lineTo(r1X, oy);
        } else {
          for (let x = ox + 15; x <= r1X; x += 3) {
            const u = (x - ox) / 85;
            const py = oy - Math.min(gh - 10, (28 * eccBoost) / (u * u));
            if (x === ox + 15) ctx.moveTo(x, py); else ctx.lineTo(x, py);
          }
        }
        ctx.stroke();

        // 2. 导体肉质区 E ≡ 0 (R1 <= r <= R2)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(r1X, oy);
        ctx.lineTo(r2X, oy);
        ctx.stroke();

        // 3. 壳外区域 (r > R2)
        const outAmp = s.shieldExtField ? 1.0 : (1 - neutralRatio) * (qIn !== 0 ? 1 : 0);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let x = r2X; x <= ox + gw - 8; x += 3) {
          const u = (x - ox) / 155;
          const py = s.shieldExtField
            ? oy - 95
            : oy - outAmp * (85 / (u * u));
          if (x === r2X) ctx.moveTo(x, py); else ctx.lineTo(x, py);
        }
        ctx.stroke();

        // 动态径向探针光点沿 r 轴扫描
        const scanU = (s.time * 0.42) % 1;
        const scanX = ox + 18 + scanU * (gw - 28);
        let scanY = oy;
        if (scanX < r1X && qIn !== 0) {
          const u = (scanX - ox) / 85;
          scanY = oy - Math.min(gh - 10, (28 * eccBoost) / (u * u));
        } else if (scanX > r2X) {
          const u = (scanX - ox) / 155;
          scanY = s.shieldExtField ? oy - 95 : oy - outAmp * (85 / (u * u));
        }
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(scanX, scanY, 3.8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 11.5px ui-monospace, monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('腔内', (ox + r1X) / 2, oy + 18);
        ctx.fillStyle = '#10b981';
        ctx.fillText('肉质E≡0', (r1X + r2X) / 2, oy + 18);
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('壳外', (r2X + ox + gw) / 2, oy + 18);

        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(
          s.shieldExtField
            ? '外场被球壳屏蔽：腔内与肉质 E ≡ 0'
            : s.shellGrounded
            ? '接地后壳外红色曲线归零 (E_外 ≡ 0)'
            : '腔内巡航改变内壁场，但壳外曲线恒定不变!',
          742,
          538
        );
        ctx.restore();
      });
    };

    // =========================================================================
    // 模块 2：平行板电容器决定式 C=εrε0S/d 与四表面电荷分布原理 (图 4.1 ~ 4.3)
    // =========================================================================
    const renderModule2 = () => {
      const s = physics.current;
      const C_ratio = (s.capEr * s.capS) / s.capD;
      const Q_fixed = 12.0;
      const U_val = Q_fixed / C_ratio;
      const E_val = U_val / s.capD;
      const sigma_ratio = 1 / s.capS;

      const q1 = (s.plateQA + s.plateQB) / 2;
      const q4 = q1;
      const q2 = (s.plateQA - s.plateQB) / 2;
      const q3 = -q2;

      if (s.mod2Sub === 0) {
        drawHudCard(16, 12, 436, 124, '平行板电容器决定式 C = ε_r ε_0 S / d', [
          { text: `正对面积 S = ${s.capS.toFixed(2)} S₀  |  极板间距 d = ${s.capD.toFixed(2)} d₀`, color: '#cbd5e1' },
          { text: `相对介电常数 ε_r = ${s.capEr.toFixed(1)}  |  面电荷密度 σ = ${sigma_ratio.toFixed(2)} σ₀`, color: '#cbd5e1' },
          { text: `当前电容 C = (ε_r S / d) C₀ = ${C_ratio.toFixed(2)} C₀`, color: '#34d399', bold: true },
        ]);

        drawHudCard(468, 12, 436, 124, '匀强场叠加原理 E = E_+ + E_- = σ / (ε_r ε₀)', [
          { text: '• 单块无限大带电平板激发场强：E_单 = σ / (2ε₀)', color: '#cbd5e1' },
          { text: '• 板外两侧 E_+ 与 E_- 反向抵消：E_外 ≡ 0', color: '#cbd5e1' },
          { text: `• 板间区域同向叠加：E_板间 = ${E_val.toFixed(1)} V/m`, color: '#38bdf8', bold: true },
        ]);

        drawPanel(16, 146, 550, 440, '图 4.1：平行板电容器三维几何参数 (S, d, ε_r) 与匀强场流演示', () => {
          const cx = 290, cy = 382;
          const overlapW = s.capS * 240;
          const plateW = 290;
          const gapH = s.capD * 125;
          const yTop = cy - gapH / 2;
          const yBot = cy + gapH / 2;
          const xLeft = cx - overlapW / 2;
          const xRight = cx + overlapW / 2;
          const upperPlateX = xRight - plateW;
          const lowerPlateX = xLeft;

          drawPillLabel(cx, 208, `有效正对面积 S = ${s.capS.toFixed(2)} S₀  |  板间距 d = ${s.capD.toFixed(2)} d₀`, '#fbbf24', '#78350f', 11.5);

          if (s.capEr > 1.05) {
            ctx.fillStyle = `rgba(20, 184, 166, ${0.14 + (s.capEr - 1) * 0.08})`;
            ctx.strokeStyle = '#2dd4bf';
            ctx.lineWidth = 1.8;
            ctx.fillRect(xLeft, yTop + 16, overlapW, gapH - 32);
            ctx.strokeRect(xLeft, yTop + 16, overlapW, gapH - 32);

            // 电介质内部动态偶极子微振动
            for (let i = 0; i < 4; i++) {
              const dx = xLeft + ((i + 0.5) / 4) * overlapW;
              const wob = Math.sin(s.time * 6 + i) * 2;
              drawChargeBadge(dx + wob, cy - 8, '−', '#38bdf8', 4.2);
              drawChargeBadge(dx - wob, cy + 8, '+', '#f43f5e', 4.2);
            }
          }

          const nCols = Math.max(4, Math.round(s.capS * 8));
          for (let i = 0; i < nCols; i++) {
            const lx = xLeft + ((i + 0.5) / nCols) * overlapW;
            drawAnimatedFieldLine(lx, yTop + 18, lx, yBot - 18, '#2dd4bf', i * 0.14);
          }

          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.roundRect(upperPlateX, yTop, plateW, 15, 4); ctx.fill(); ctx.stroke();

          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath(); ctx.roundRect(lowerPlateX, yBot - 15, plateW, 15, 4); ctx.fill(); ctx.stroke();

          for (let i = 0; i < nCols; i++) {
            const qx = xLeft + ((i + 0.5) / nCols) * overlapW;
            drawChargeBadge(qx, yTop + 7.5, '+', '#f43f5e', 5);
            drawChargeBadge(qx, yBot - 7.5, '−', '#38bdf8', 5);
          }

          drawPillLabel(cx, 552, '电荷均匀分布于相对内表面，外表面 σ_外 ≡ 0', '#cbd5e1', '#334155', 11.5);
        });

        drawPanel(580, 146, 324, 440, '平行板电容参量实时对比柱状图', () => {
          const bars = [
            { label: '电容 C', val: C_ratio, max: 4.5, color: '#34d399', unit: `${C_ratio.toFixed(2)}C₀` },
            { label: '面密度 σ', val: sigma_ratio, max: 2.2, color: '#fbbf24', unit: `${sigma_ratio.toFixed(2)}σ₀` },
            { label: '场强 E', val: E_val / 12, max: 2.2, color: '#f43f5e', unit: `${E_val.toFixed(1)}V/m` },
            { label: '电压 U', val: U_val / 12, max: 2.2, color: '#38bdf8', unit: `${U_val.toFixed(1)}V` },
          ];
          const baseBarY = 515, maxBarH = 235;
          ctx.save();
          ctx.textAlign = 'center';
          bars.forEach((b, idx) => {
            const bx = 610 + idx * 72;
            const pulse = 1 + 0.018 * Math.sin(s.time * 4 + idx);
            const bh = Math.min(maxBarH, Math.max(14, (b.val / b.max) * maxBarH * pulse));
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.roundRect(bx, baseBarY - bh, 42, bh, 5);
            ctx.fill();
            ctx.font = 'bold 11px ui-monospace, monospace';
            ctx.fillText(b.unit, bx + 21, baseBarY - bh - 12);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(b.label, bx + 21, baseBarY + 20);
          });
          ctx.restore();
        });
      } else {
        const isCap = Math.abs(s.plateQA + s.plateQB) < 0.1;
        drawHudCard(16, 12, 436, 124, '图 4.2：两平行金属板四表面电荷分布普适通解', [
          { text: `上板总电量 Q_A = ${s.plateQA.toFixed(1)} μC  |  下板总电量 Q_B = ${s.plateQB.toFixed(1)} μC`, color: '#cbd5e1' },
          { text: `外表面公有电荷: q₁ = q₄ = (Q_A + Q_B)/2 = ${q1.toFixed(2)} μC`, color: '#fbbf24' },
          { text: `内表面配对电荷: q₂ = -q₃ = (Q_A - Q_B)/2 = ${q2.toFixed(2)} μC`, color: '#38bdf8', bold: true },
        ]);

        drawHudCard(468, 12, 436, 124, '第一性原理证明：高斯定理 + 内部场强叠加', [
          {
            text: isCap ? '● 等量异号特例 (Q_A=-Q_B)：外表面 q₁=q₄=0，电荷全在内表面!' : '● 一般带电状态：两外表面带同种等量电荷 q₁ = q₄',
            color: isCap ? '#34d399' : '#fbbf24',
            bold: true,
          },
          { text: '• 柱形高斯面 S_高斯 穿过两极板肉质内部 ⇒ q₂ + q₃ = 0', color: '#cbd5e1' },
          { text: '• 极板肉质内部 P 点合场强 E_P = 0 ⇒ q₁ = q₄', color: '#cbd5e1' },
        ]);

        drawPanel(16, 146, 550, 440, '图 4.2：四表面电荷分布 (q₁~q₄) 与柱形高斯面 S_高斯', () => {
          const cx = 290, pW = 340, pL = cx - pW / 2;
          const yA1 = 268, yA2 = 316;
          const yB1 = 428, yB2 = 476;

          // 若外表面带电 (q1 = q4 != 0)，绘制板外两侧动态电场线
          if (Math.abs(q1) > 0.3) {
            [-120, 0, 120].forEach((dx, idx) => {
              if (q1 > 0) {
                drawAnimatedFieldLine(cx + dx, yA1 - 4, cx + dx, 206, '#fbbf24', idx * 0.25);
                drawAnimatedFieldLine(cx + dx, yB2 + 4, cx + dx, 540, '#fbbf24', idx * 0.25);
              } else {
                drawAnimatedFieldLine(cx + dx, 206, cx + dx, yA1 - 4, '#fbbf24', idx * 0.25);
                drawAnimatedFieldLine(cx + dx, 540, cx + dx, yB2 + 4, '#fbbf24', idx * 0.25);
              }
            });
          }

          // 板间动态电场线 (q2 -> q3)
          if (Math.abs(q2) > 0.2) {
            [-135, -80, 80, 135].forEach((dx, idx) => {
              const sy = q2 > 0 ? yA2 + 4 : yB1 - 4;
              const ey = q2 > 0 ? yB1 - 4 : yA2 + 4;
              drawAnimatedFieldLine(cx + dx, sy, cx + dx, ey, '#2dd4bf', idx * 0.22);
            });
          }

          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.roundRect(pL, yA1, pW, 48, 4); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.roundRect(pL, yB1, pW, 48, 4); ctx.fill(); ctx.stroke();

          // 四表面电荷徽章
          if (Math.abs(q1) > 0.3) {
            [-130, -65, 65, 130].forEach((dx) => {
              drawChargeBadge(cx + dx, yA1 + 8, q1 > 0 ? '+' : '−', '#fbbf24', 5);
              drawChargeBadge(cx + dx, yB2 - 8, q4 > 0 ? '+' : '−', '#fbbf24', 5);
            });
          }
          if (Math.abs(q2) > 0.3) {
            [-130, -65, 65, 130].forEach((dx) => {
              drawChargeBadge(cx + dx, yA2 - 8, q2 > 0 ? '+' : '−', '#f43f5e', 5);
              drawChargeBadge(cx + dx, yB1 + 8, q3 > 0 ? '+' : '−', '#38bdf8', 5);
            });
          }

          // 柱形高斯面 S_高斯
          ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
          ctx.strokeStyle = '#10b981';
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 2;
          ctx.fillRect(cx - 102, 292, 204, 160);
          ctx.strokeRect(cx - 102, 292, 204, 160);
          ctx.setLineDash([]);

          drawPillLabel(cx, yA1 - 22, `上外表面 1: q₁ = ${q1.toFixed(1)} μC`, '#fbbf24', '#78350f', 11);
          drawPillLabel(cx, yA2 + 20, `上内表面 2: q₂ = ${q2.toFixed(1)} μC`, '#f43f5e', '#881337', 11);
          drawPillLabel(cx, 372, '高斯面 S_高斯 (q₂ + q₃ ≡ 0)', '#34d399', '#065f46', 11);
          drawPillLabel(cx, yB1 - 20, `下内表面 3: q₃ = ${q3.toFixed(1)} μC`, '#38bdf8', '#0369a1', 11);
          drawPillLabel(cx, yB2 + 22, `下外表面 4: q₄ = ${q4.toFixed(1)} μC`, '#fbbf24', '#78350f', 11);
        });

        drawPanel(580, 146, 324, 440, '图 4.3：空间三区域 (I, II, III) 矢量叠加', () => {
          const regions = [
            { title: '区域 I (上板外侧): 反向抵消 E_I = 0', y: 245, dirPos: -1, dirNeg: 1, net: 0 },
            { title: '区域 II (两板之间): 同向叠加 E_II = σ/ε₀', y: 375, dirPos: 1, dirNeg: 1, net: 1 },
            { title: '区域 III (下板外侧): 反向抵消 E_III = 0', y: 505, dirPos: 1, dirNeg: -1, net: 0 },
          ];
          regions.forEach((reg, idx) => {
            ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
            ctx.strokeStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(594, reg.y - 54, 296, 108, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 11.5px ui-monospace, monospace';
            ctx.fillText(reg.title, 606, reg.y - 36, 272);

            drawVector(638, reg.y + 8, 0, reg.dirPos * 24, '#f43f5e', 'E_+', 'right');
            drawVector(725, reg.y + 8, 0, reg.dirNeg * 24, '#38bdf8', 'E_-', 'right');
            if (reg.net !== 0) {
              drawAnimatedFieldLine(815, reg.y - 16, 815, reg.y + 34, '#34d399', idx * 0.25);
              ctx.fillStyle = '#34d399';
              ctx.font = 'bold 11px ui-monospace, monospace';
              ctx.fillText('E_合', 826, reg.y + 8);
            } else {
              drawPillLabel(832, reg.y + 8, 'E_合 = 0', '#94a3b8', '#475569', 11);
            }
          });
        });
      }
    };

    // =========================================================================
    // 模块 3：电介质极化微观机制与电容器动态四步法 (图 5.1 ~ 5.3 & 图 6.3)
    // =========================================================================
    const renderModule3 = () => {
      const s = physics.current;
      const isConstU = s.capConstraint === 0;
      const erEff = 1 + (3.0 - 1) * s.slabX;
      const C = erEff / s.dynD;
      const U = isConstU ? 12.0 : 12.0 / C;
      const Q = isConstU ? C * U : 12.0;
      const E = U / s.dynD;
      const E_depol = s.slabX > 0.02 ? E * 2.0 : 0;
      const phiP = E * 0.45;
      const WE = 0.5 * Q * U;
      const deltaWE = WE - 72.0;
      const W_source = isConstU ? 12.0 * (Q - 12.0) : 0;
      const W_mech = W_source - deltaWE;

      drawHudCard(16, 12, 436, 124, '平行板电容器动态“四步标准分析法”看板', [
        { text: `① 约束不变量: ${isConstU ? '恒接电源 U ≡ 12.0 V' : '断电孤立 Q ≡ 12.0 μC'}`, color: '#cbd5e1' },
        { text: `② 决定式 C = ${C.toFixed(2)} C₀  |  ③ 极板电量 Q = ${Q.toFixed(1)} μC`, color: '#cbd5e1' },
        {
          text: !isConstU && s.slabX < 0.02 ? `④ 黄金推论: 断电恒 Q 时 E ≡ ${E.toFixed(1)} V/m (与 d 无关!)` : `④ 板间合场强 E = U/d = ${E.toFixed(2)} V/m  |  U = ${U.toFixed(2)} V`,
          color: '#38bdf8',
          bold: true,
        },
      ]);

      drawHudCard(468, 12, 436, 124, '固定点 P 电势、油滴动力学与能量流向 (图 5.3 & 6.3)', [
        { text: `P 点电势 φ_P = +E·d_PB = +${phiP.toFixed(2)} V  |  电势能 E_p = -${phiP.toFixed(2)} μJ`, color: '#34d399', bold: true },
        { text: `电容器储能 W_E = ½QU = ${WE.toFixed(1)} μJ (增量 ΔW_E = ${deltaWE >= 0 ? '+' : ''}${deltaWE.toFixed(1)})`, color: '#cbd5e1' },
        { text: `电源做功 W_源 = ${W_source.toFixed(1)} μJ  |  边缘场吸入功 W_机 = ${W_mech.toFixed(1)} μJ`, color: '#fbbf24', bold: true },
      ]);

      drawPanel(16, 146, 540, 440, '图 5.2 & 6.3：可拖拽电介质板、退极化场 E\' 与带电油滴平衡', () => {
        const cx = 306, plateW = MODULE3_PLATE_WIDTH, pL = cx - plateW / 2, pR = cx + plateW / 2;
        const plateB_Y = 485;
        const gapPx = s.dynD * 140;
        const plateA_Y = plateB_Y - gapPx;
        const px = pL + 44; // 油滴固定 x = 210

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(62, plateB_Y + 8); ctx.lineTo(62, plateA_Y - 8);
        ctx.lineTo(100, plateA_Y - 8);
        ctx.moveTo(135, plateA_Y - 8); ctx.lineTo(pL, plateA_Y - 8);
        ctx.moveTo(62, plateB_Y + 8); ctx.lineTo(pL, plateB_Y + 8);
        ctx.stroke();

        ctx.strokeStyle = isConstU ? '#34d399' : '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(100, plateA_Y - 8);
        ctx.lineTo(isConstU ? 135 : 129, isConstU ? plateA_Y - 8 : plateA_Y - 26);
        ctx.stroke();

        // 避开油滴 (px = 210) 所在通道绘制动态场强线
        [92, 138, 184, 230, 266].forEach((offsetX, i) => {
          const lx = pL + offsetX;
          drawAnimatedFieldLine(lx, plateA_Y + 6, lx, plateB_Y - 6, 'rgba(45, 212, 191, 0.72)', i * 0.18);
        });

        // 电介质板从右侧插入，总宽度控制在 210px 以内，确保右端永不越过左舱边界
        if (s.slabX > 0.02) {
          const insW = s.slabX * plateW;
          const slabLeft = pR - insW;
          const slabTotalW = Math.min(210, 536 - slabLeft);
          ctx.fillStyle = 'rgba(13, 148, 136, 0.25)';
          ctx.strokeStyle = '#2dd4bf';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(slabLeft, plateA_Y + 8, slabTotalW, gapPx - 16, 4);
          ctx.fill();
          ctx.stroke();

          if (insW > 60) {
            const vecX = Math.max(pL + 135, slabLeft + insW * 0.48);
            drawVector(vecX, plateB_Y - 20, 0, -(gapPx - 44), '#f43f5e', '');
            drawPillLabel(vecX, (plateA_Y + plateB_Y) / 2, "退极化场 E'", '#f43f5e', '#881337', 10.5);
          }
          if (s.slabX < 0.7) {
            drawVector(slabLeft + 38, plateA_Y - 22, -42, 0, '#38bdf8', '边缘吸力 F_吸', 'top');
          }
        }

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.roundRect(pL, plateA_Y - 14, plateW, 14, 3); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath(); ctx.roundRect(pL, plateB_Y, plateW, 14, 3); ctx.fill(); ctx.stroke();
        drawGroundSymbol(pL + 22, plateB_Y + 14);

        const py = plateB_Y - 0.45 * 140;
        const microHover = Math.sin(s.time * 4.5) * 1.8;
        const dropY = py - s.dropOffsetY + microHover;
        drawVector(px, dropY, 0, -Math.min(48, E * 2.5), '#f43f5e', 'qE', 'left');
        drawVector(px, dropY, 0, 30, '#fbbf24', 'mg', 'left');
        drawChargeBadge(px, dropY, '−q', '#38bdf8', 8.5);

        drawPillLabel(286, 555, `探针 P 点：φ_P = +${phiP.toFixed(2)} V (油滴受力 qE 与 mg 动态平衡)`, '#34d399', '#065f46', 11.5);
      });

      drawPanel(570, 146, 334, 440, '图 5.1：电介质微观偶极子极化放大镜', () => {
        // 背景外场 E0 与退极化场 E' 动态流线
        [612, 737, 862].forEach((lx, i) => {
          drawAnimatedFieldLine(lx - 14, 224, lx - 14, 446, 'rgba(56, 189, 248, 0.45)', i * 0.3);
          if (E_depol > 0.2) {
            drawAnimatedFieldLine(lx + 14, 446, lx + 14, 224, 'rgba(244, 63, 94, 0.45)', i * 0.3);
          }
        });

        const alignRatio = Math.min(1, E / 14);
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const dx = 640 + c * 95;
            const dy = 258 + r * 76;
            const thermalJitter = Math.sin(s.time * 8 + r * 2.3 + c * 1.7) * s.thermalT * 1.4;
            const baseAngle = (1 - alignRatio) * ((r + c) % 2 === 0 ? 0.8 : -0.9);
            const ang = -Math.PI / 2 + baseAngle + thermalJitter;

            ctx.save();
            ctx.translate(dx, dy);
            ctx.rotate(ang);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.strokeStyle = '#2dd4bf';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            drawChargeBadge(11, 0, '−', '#38bdf8', 5.5);
            drawChargeBadge(-11, 0, '+', '#f43f5e', 5.5);
            ctx.restore();
          }
        }
        drawPillLabel(737, 204, "上表面暴露负束缚电荷层 -σ'", '#38bdf8', '#0369a1', 11.5);
        drawPillLabel(737, 474, "下表面暴露正束缚电荷层 +σ'", '#f43f5e', '#881337', 11.5);
        drawPillLabel(737, 548, `内部激发退极化场 E' = ${E_depol.toFixed(1)} V/m`, '#fbbf24', '#78350f', 11.5);
      });
    };

    // =========================================================================
    // 模块 4：尖端电晕放电 (汤森雪崩与电风) vs 开关触头拉弧 (图 1.6 & 图 1.7)
    // =========================================================================
    const renderModule4 = () => {
      const s = physics.current;
      const t = s.time;
      const isCorona = s.dischargeMode === 0;
      const E_tip = s.tipField;
      const isBreakdown = E_tip >= 3.0;
      const gap = s.arcGap;
      const isArcing = gap >= 2 && gap <= 48;

      drawHudCard(
        16,
        12,
        436,
        124,
        isCorona ? '图 1.6：尖端电晕放电 (汤森电子雪崩四步过程)' : '图 1.7：开关触头分离拉弧 (热电离等离子体)',
        isCorona
          ? [
              { text: '① 强场加速种子电子：碰撞电离 e⁻ + M⁰ → 2e⁻ + M⁺', color: '#cbd5e1' },
              { text: '② 异号电子涌入尖端中和正电 (晶格正离子绝不飞出!)', color: '#cbd5e1' },
              { text: '③ 同号正离子 M⁺ 被排斥向外形成吹偏烛火的“离子电风”', color: '#38bdf8', bold: true },
            ]
          : [
              { text: '① 触头分离瞬间接触面积骤减 ⇒ 焦耳热飙升使金属汽化', color: '#cbd5e1' },
              { text: '② 极小气隙强场击穿 + 高温热电离 ⇒ 自持等离子体电弧', color: '#cbd5e1' },
              { text: '③ 工程灭弧：利用金属灭弧罩栅片分割、拉长并冷却电弧', color: '#fbbf24', bold: true },
            ]
      );

      drawHudCard(
        468,
        12,
        436,
        124,
        '气体击穿与等离子体状态实时监视器',
        isCorona
          ? [
              {
                text: isBreakdown ? '⚡ 已突破空气击穿场强 3.0 MV/m (电晕与电风激活)' : '● 未达空气击穿场强 (仅存在静电力线，无电晕电风)',
                color: isBreakdown ? '#f43f5e' : '#34d399',
                bold: true,
              },
              { text: `当前尖端表面场强 E_tip = ${E_tip.toFixed(1)} MV/m`, color: '#fbbf24', bold: true },
              { text: '工程防范：高压金具均压环打磨光滑圆润以增大曲率半径 R', color: '#cbd5e1' },
            ]
          : [
              {
                text: isArcing ? '🔥 3000~10000℃ 高温等离子体电弧持续燃烧中' : gap < 2 ? '● 触头闭合导通 (无气隙电弧)' : '● 电弧已被拉长分割进入灭弧栅片冷却熄灭',
                color: isArcing ? '#f43f5e' : '#34d399',
                bold: true,
              },
              { text: `当前触头分离间距 d = ${gap.toFixed(0)} mm`, color: '#fbbf24', bold: true },
              { text: '工程应用：电焊机、电弧炉冶炼特种钢、真空断路器灭弧', color: '#cbd5e1' },
            ]
      );

      drawPanel(
        16,
        146,
        550,
        440,
        isCorona ? '尖端电晕雪崩与“离子电风”吹偏烛火沙盘' : '开关触头分离等离子体电弧与灭弧栅片 (可左右拖拽触头)',
        () => {
          const cy = 385;
          if (isCorona) {
            const tipX = 180;
            const rcPx = isBreakdown ? tipX + (E_tip - 2.5) * 50 : tipX;
            const candleX = 480;

            if (isBreakdown) {
              const coronaGrad = ctx.createRadialGradient(tipX, cy, 8, tipX, cy, rcPx - tipX + 28);
              coronaGrad.addColorStop(0, 'rgba(167, 139, 250, 0.5)');
              coronaGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.2)');
              coronaGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
              ctx.fillStyle = coronaGrad;
              ctx.beginPath();
              ctx.arc(tipX, cy, rcPx - tipX + 28, -Math.PI * 0.45, Math.PI * 0.45);
              ctx.lineTo(tipX, cy);
              ctx.closePath();
              ctx.fill();

              for (let i = 0; i < 4; i++) {
                const p = (t * 1.5 + i * 0.25) % 1;
                const ex = rcPx - p * (rcPx - tipX - 22);
                const ey = cy + (i - 1.5) * 20 * (1 - p * 0.6);
                const fadeAtTip = Math.max(0, Math.min(1, (1 - p) / 0.12));
                if (fadeAtTip > 0.04) {
                  ctx.save();
                  ctx.globalAlpha = fadeAtTip;
                  drawChargeBadge(ex, ey, 'e⁻', '#38bdf8', 6.5);
                  ctx.restore();
                }
              }
              for (let i = 0; i < 5; i++) {
                const p = (t * 1.15 + i * 0.2) % 1;
                const mx = rcPx + p * (candleX - 54 - rcPx);
                const my = cy + ((i % 3) - 1) * 32 + Math.sin(p * 6 + i) * 5;
                drawChargeBadge(mx, my, 'M⁺', '#f43f5e', 7.5);
                drawVector(mx + 9, my, 18, 0, '#f43f5e', '');
              }
            } else {
              // 未击穿时仍展示尖端发散的动态电场流线
              [-36, -18, 0, 18, 36].forEach((deg, idx) => {
                const rad = (deg * Math.PI) / 180;
                drawAnimatedFieldLine(
                  tipX + 12 * Math.cos(rad),
                  cy + 12 * Math.sin(rad),
                  tipX + 95 * Math.cos(rad),
                  cy + 95 * Math.sin(rad),
                  '#38bdf8',
                  idx * 0.2
                );
              });
            }

            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(35, cy - 46);
            ctx.lineTo(tipX - 16, cy - 12);
            ctx.quadraticCurveTo(tipX + 14, cy, tipX - 16, cy + 12);
            ctx.lineTo(35, cy + 46);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            [-16, 0, 16].forEach((dy, idx) => drawChargeBadge(tipX - 16 - idx * 4, cy + dy * 0.45, '+', '#f43f5e', 5));

            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#94a3b8';
            ctx.fillRect(candleX - 11, cy + 12, 22, 65);
            ctx.strokeRect(candleX - 11, cy + 12, 22, 65);

            const bend = isBreakdown
              ? (E_tip - 2.5) * 14 + Math.sin(t * 14) * 4
              : Math.sin(t * 7) * 2.2;
            ctx.save();
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(candleX, cy + 10);
            ctx.quadraticCurveTo(candleX - 12, cy - 18, candleX + bend, cy - 42);
            ctx.quadraticCurveTo(candleX + 12, cy - 18, candleX, cy + 10);
            ctx.fill();
            ctx.restore();

            drawPillLabel(candleX, cy - 60, isBreakdown ? '烛火被电风吹偏!' : '烛火竖直微晃', '#fbbf24', '#78350f', 11.5);
          } else {
            const leftX = 195;
            const rightX = leftX + gap * 3.0;

            for (let i = 0; i < 5; i++) {
              const gx = leftX + 12 + i * 32;
              ctx.fillStyle = '#334155';
              ctx.strokeStyle = '#64748b';
              ctx.fillRect(gx, 210, 8, 50);
              ctx.strokeRect(gx, 210, 8, 50);

              // 当 gap > 48 电弧进入栅片冷却时，显示栅片间上升消散的等离子体余晖
              if (gap > 48 && i < 4) {
                const pWisp = (t * 1.8 + i * 0.25) % 1;
                ctx.save();
                ctx.fillStyle = `rgba(251, 191, 36, ${0.65 * (1 - pWisp)})`;
                ctx.beginPath();
                ctx.arc(gx + 20, 255 - pWisp * 38, 4.5 * (1 - pWisp * 0.5), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }

            drawPillLabel(leftX + 80, 282, '金属灭弧罩栅片 (拉长分割并冷却电弧)', '#cbd5e1', '#334155', 11.5);

            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.roundRect(leftX - 140, cy - 28, 140, 56, 6); ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#fbbf24';
            ctx.beginPath(); ctx.roundRect(rightX, cy - 28, 140, 56, 6); ctx.fill(); ctx.stroke();

            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 13px ui-monospace, monospace';
            ctx.fillText('静触头', leftX - 70, cy);
            ctx.fillStyle = '#fbbf24';
            ctx.fillText('动触头 (拖拽)', rightX + 70, cy);
            ctx.restore();

            if (isArcing) {
              const midX = (leftX + rightX) / 2;
              const archY = cy - 20 - gap * 0.65 + Math.sin(t * 25) * 8;
              ctx.save();
              ctx.lineCap = 'round';
              ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
              ctx.shadowColor = '#f43f5e';
              ctx.shadowBlur = 18;
              ctx.lineWidth = 22;
              ctx.beginPath(); ctx.moveTo(leftX, cy); ctx.quadraticCurveTo(midX, archY, rightX, cy); ctx.stroke();
              ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 9; ctx.stroke();
              ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
              ctx.restore();
            } else if (gap < 2) {
              // 闭合导通电子流
              for (let k = 0; k < 4; k++) {
                const u = (t * 1.6 + k * 0.25) % 1;
                drawChargeBadge(leftX - 120 + u * 240, cy, 'e⁻', '#34d399', 5.5);
              }
            }
          }
        }
      );

      drawPanel(
        580,
        146,
        324,
        440,
        isCorona ? '尖端空间场强衰减曲线 E(r)' : '触头拉弧电流 I_arc(d) 与灭弧阈值曲线',
        () => {
          const ox = 615, oy = 520, gw = 255, gh = 280;
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy);
          ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh);
          ctx.stroke();

          if (isCorona) {
            const yBd = oy - (3.0 / 6.5) * gh;
            ctx.strokeStyle = '#f43f5e';
            ctx.setLineDash([5, 4]);
            ctx.beginPath(); ctx.moveTo(ox, yBd); ctx.lineTo(ox + gw, yBd); ctx.stroke();
            ctx.setLineDash([]);
            drawPillLabel(ox + 150, yBd - 14, 'E_击穿 = 3.0 MV/m', '#f43f5e', '#881337', 11);

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            for (let i = 0; i <= 80; i++) {
              const u = i / 80;
              const px = ox + u * gw;
              const eVal = E_tip / Math.pow(1 + u * 2.1, 1.6);
              const py = oy - (eVal / 6.5) * gh;
              if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();

            const scanU = (t * 0.45) % 1;
            const sx = ox + scanU * gw;
            const sy = oy - (E_tip / Math.pow(1 + scanU * 2.1, 1.6) / 6.5) * gh;
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(sx, sy, 3.8, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          } else {
            // 触头拉弧电流随间距 d 的特性曲线
            const quenchX = ox + (48 / 60) * gw;
            ctx.strokeStyle = '#34d399';
            ctx.setLineDash([5, 4]);
            ctx.beginPath(); ctx.moveTo(quenchX, oy); ctx.lineTo(quenchX, oy - gh); ctx.stroke();
            ctx.setLineDash([]);
            drawPillLabel(quenchX - 38, oy - gh + 18, '灭弧阈值 48mm', '#34d399', '#065f46', 10.5);

            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) {
              const px = ox + (i / 60) * gw;
              const curRatio = i <= 48 ? Math.max(0.15, 1 - Math.pow(i / 52, 1.8)) : 0;
              const py = oy - curRatio * (gh - 35);
              if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();

            const curX = ox + (gap / 60) * gw;
            const curRatio = gap <= 48 ? Math.max(0.15, 1 - Math.pow(gap / 52, 1.8)) : 0;
            const curY = oy - curRatio * (gh - 35) + (isArcing ? Math.sin(t * 24) * 3 : 0);
            ctx.save();
            ctx.fillStyle = isArcing ? '#f43f5e' : '#34d399';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(curX, curY, 5.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
        }
      );
    };

    // =========================================================================
    // 模块 5：RC 充放电动态电路 (图 3.1/3.2) 与串并联网络 (图 6.1/6.2)
    // =========================================================================
    const renderModule5 = () => {
      const s = physics.current;
      const sub = s.mod5Sub;

      if (sub === 0) {
        const p = s.rcProgress;
        const U0 = 12.0, Q0 = 24.0;
        const WE = 0.5 * Q0 * U0 * p * p;
        const Q_heat = 0.5 * Q0 * U0 * p * (2 - p);
        const iNow = s.rcSwitch === 1 ? (1 - p) : -p;

        drawHudCard(16, 12, 436, 124, '图 3.1：RC 充放电微观电子迁移与电流计偏转', [
          { text: '• 充电 (S→1)：外电路自由电子从上板抽向电源正极', color: '#cbd5e1' },
          { text: '• 放电 (S→2)：下板过剩电子经电阻 R 流向上板中和', color: '#cbd5e1' },
          { text: `• 极板瞬时电压 u_C = ${(p * 12).toFixed(1)} V  |  电量 q = ${(p * 24).toFixed(1)} μC`, color: '#34d399', bold: true },
        ]);

        drawHudCard(468, 12, 436, 124, '图 3.2：恒压充电 50% 能量损耗定理', [
          { text: `电源输出总功 W_源 = q·U = ${(WE + Q_heat).toFixed(1)} μJ (完整矩形面积)`, color: '#cbd5e1' },
          { text: `储存电场能 W_E = ∫u dq = ½CU² = ${WE.toFixed(1)} μJ (下半三角)`, color: '#38bdf8' },
          { text: `回路焦耳热 Q_热 = ½CU² = ${Q_heat.toFixed(1)} μJ (恒占 50%, 与 R 无关!)`, color: '#fbbf24', bold: true },
        ]);

        drawPanel(16, 146, 500, 440, '图 3.1：双掷开关充放电实验电路 (外电路电子环流 + 板间动态场)', () => {
          const yTop = 285, yBot = 505, xCap = 435;
          const capPlateTop = 360, capPlateBot = 416;

          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(75, 248); ctx.lineTo(75, 345);
          ctx.moveTo(75, 365); ctx.lineTo(75, yBot);
          ctx.moveTo(75, 248); ctx.lineTo(152, 248);
          ctx.moveTo(152, 324); ctx.lineTo(152, yBot);
          ctx.moveTo(205, yTop); ctx.lineTo(246, yTop);
          ctx.moveTo(312, yTop); ctx.lineTo(350, yTop);
          ctx.moveTo(400, yTop); ctx.lineTo(xCap, yTop); ctx.lineTo(xCap, capPlateTop);
          ctx.moveTo(xCap, capPlateBot); ctx.lineTo(xCap, yBot); ctx.lineTo(75, yBot);
          ctx.stroke();

          // 直流电源 E
          ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(58, 345); ctx.lineTo(92, 345); ctx.stroke();
          ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4.5;
          ctx.beginPath(); ctx.moveTo(64, 365); ctx.lineTo(86, 365); ctx.stroke();
          drawPillLabel(75, 400, 'E=12V', '#f8fafc', '#334155', 10.5);

          // 单刀双掷开关 S
          ctx.strokeStyle = s.rcSwitch === 1 ? '#f43f5e' : '#34d399';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(205, yTop);
          ctx.lineTo(152, s.rcSwitch === 1 ? 248 : 324);
          ctx.stroke();
          drawPillLabel(152, 224, '1(充电)', '#f43f5e', '#881337', 10.5);
          drawPillLabel(116, 324, '2(放电)', '#34d399', '#065f46', 10.5);

          // 电阻 R
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.fillRect(246, yTop - 12, 66, 24);
          ctx.strokeRect(246, yTop - 12, 66, 24);
          ctx.save();
          ctx.textAlign = 'center';
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 11.5px ui-monospace, monospace';
          ctx.fillText(`R=${s.rcRes.toFixed(0)}Ω`, 279, yTop);

          // 灵敏电流计 G
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath(); ctx.arc(375, yTop, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          const needleAng = -Math.PI / 2 + iNow * 1.15;
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(375, yTop + 8);
          ctx.lineTo(375 + 18 * Math.cos(needleAng), yTop + 8 + 18 * Math.sin(needleAng));
          ctx.stroke();
          ctx.restore();
          drawPillLabel(375, yTop + 40, '电流计 G', '#38bdf8', '#0369a1', 10.5);

          // 平行板电容器 C 与板间动态电场线
          if (p > 0.06) {
            [-28, 0, 28].forEach((dx, idx) => {
              drawAnimatedFieldLine(xCap + dx, capPlateTop + 5, xCap + dx, capPlateBot - 5, '#2dd4bf', idx * 0.25);
            });
          }
          ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 4.2;
          ctx.beginPath(); ctx.moveTo(xCap - 42, capPlateTop); ctx.lineTo(xCap + 42, capPlateTop); ctx.stroke();
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath(); ctx.moveTo(xCap - 42, capPlateBot); ctx.lineTo(xCap + 42, capPlateBot); ctx.stroke();

          const nCharge = Math.max(0, Math.round(p * 4));
          for (let i = 0; i < nCharge; i++) {
            const qx = xCap - 30 + (i / Math.max(1, nCharge - 1)) * 60;
            drawChargeBadge(nCharge === 1 ? xCap : qx, capPlateTop - 9, '+', '#f43f5e', 4.8);
            drawChargeBadge(nCharge === 1 ? xCap : qx, capPlateBot + 9, '−', '#38bdf8', 4.8);
          }
          drawPillLabel(xCap, capPlateBot + 34, `u_C = ${(p * 12).toFixed(1)}V`, '#34d399', '#065f46', 11);

          // 外电路上支路与底部支路电子环流
          if (Math.abs(iNow) > 0.025) {
            const speed = (iNow >= 0 ? 1 : -1) * Math.max(0.45, Math.abs(iNow) * 1.8);
            for (let k = 0; k < 4; k++) {
              const u = ((s.time * speed + k * 0.25) % 1 + 1) % 1;
              const botX = 165 + u * (xCap - 175);
              drawChargeBadge(botX, yBot, 'e⁻', '#38bdf8', 5.5);
            }
          }
        });

        drawPanel(530, 146, 374, 440, '图 3.2：u(q)—q 图像与 50% 能量分配', () => {
          const ox = 582, oy = 512, gw = 262, gh = 262;
          const curW = gw * p, curH = gh * p;

          ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
          ctx.beginPath();
          ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.lineTo(ox + curW, oy - curH);
          ctx.closePath(); ctx.fill();

          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.beginPath();
          ctx.moveTo(ox, oy); ctx.lineTo(ox + curW, oy); ctx.lineTo(ox + curW, oy - curH);
          ctx.closePath(); ctx.fill();

          // 微元积分条 u·dq
          ctx.fillStyle = 'rgba(52, 211, 153, 0.45)';
          ctx.fillRect(Math.max(ox, ox + curW - 8), oy - curH, 8, curH);

          ctx.strokeStyle = '#475569';
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(ox, oy - gh, gw, gh);
          ctx.setLineDash([]);

          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(ox, oy); ctx.lineTo(ox + gw + 18, oy);
          ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh - 18);
          ctx.stroke();

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + curW, oy - curH); ctx.stroke();

          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(ox + curW, oy - curH, 4.8, 0, Math.PI * 2); ctx.fill();
          ctx.restore();

          drawPillLabel(ox + 122, oy - gh + 24, '上半三角: Q_热 = ½QU (50%)', '#fbbf24', '#78350f', 11);
          drawPillLabel(ox + 148, oy - 22, '下半三角: W_E = ½QU (50%)', '#38bdf8', '#0369a1', 11);
        });
      } else {
        const isSeries = sub === 1;
        const C1 = s.netC1, C2 = 6.0, C3 = 6.0, U = s.netU;
        const Ceq = isSeries ? 1 / (1 / C1 + 1 / C2 + 1 / C3) : C1 + C2 + C3;
        const Q1 = isSeries ? Ceq * U : C1 * U;
        const Q2 = isSeries ? Ceq * U : C2 * U;
        const Q3 = isSeries ? Ceq * U : C3 * U;
        const U1 = Q1 / C1, U2 = Q2 / C2, U3 = Q3 / C3;
        const totalWE = 0.5 * Ceq * U * U;

        // 顶部双监控卡片：完整展示 C1、C2、C3 全部实时参数，彻底解决截图中 C3 缺失问题
        drawHudCard(
          16,
          12,
          436,
          124,
          isSeries ? '图 6.1：电容器串联网络 — 孤立节点电荷守恒' : '图 6.2：电容器并联网络 — 等势节点共压与扩容',
          isSeries
            ? [
                { text: `等效电容 C_eq = ${Ceq.toFixed(2)} μF  |  总电压 U = ${U.toFixed(1)} V`, color: '#34d399', bold: true },
                { text: `孤立节点守恒: -q₁ + q₂ ≡ 0 ⇒ Q₁=Q₂=Q₃ = ${Q1.toFixed(1)} μC`, color: '#38bdf8', bold: true },
                { text: '反比分压规律: U₁ : U₂ : U₃ = (1/C₁) : (1/C₂) : (1/C₃)', color: '#cbd5e1' },
              ]
            : [
                { text: `并联扩容公式: C_eq = C₁+C₂+C₃ = ${Ceq.toFixed(2)} μF`, color: '#34d399', bold: true },
                { text: `公共等势节点 A/B: U₁ = U₂ = U₃ = U = ${U.toFixed(1)} V`, color: '#38bdf8', bold: true },
                { text: '并联相当于增大平行板有效正对面积 S (Q_i ∝ C_i)', color: '#fbbf24' },
              ]
        );

        drawHudCard(
          468,
          12,
          436,
          124,
          '三支路实时参量 (C₁ / C₂ / C₃) 与工程耐压监视器',
          [
            {
              text: `C₁(${C1.toFixed(1)}μF): U₁=${U1.toFixed(2)}V, Q₁=${Q1.toFixed(1)}μC | C₂(6.0μF): U₂=${U2.toFixed(2)}V, Q₂=${Q2.toFixed(1)}μC`,
              color: '#cbd5e1',
            },
            {
              text: `C₃(6.0μF): U₃=${U3.toFixed(2)}V, Q₃=${Q3.toFixed(1)}μC | 总电量 Q_总=${(isSeries ? Q1 : Q1 + Q2 + Q3).toFixed(1)}μC`,
              color: '#38bdf8',
              bold: true,
            },
            {
              text:
                isSeries && U1 > 7.5
                  ? `⚠ 耐压击穿预警: C₁ 分压 U₁=${U1.toFixed(2)}V > 7.5V (小电容分压过高!)`
                  : `● 系统总储能 W_E = ½ C_eq U² = ${totalWE.toFixed(1)} μJ (各电容安全运行)`,
              color: isSeries && U1 > 7.5 ? '#f43f5e' : '#34d399',
              bold: true,
            },
          ]
        );

        const caps = [
          { name: 'C₁', c: C1, q: Q1, u: U1 },
          { name: 'C₂', c: C2, q: Q2, u: U2 },
          { name: 'C₃', c: C3, q: Q3, u: U3 },
        ];

        // 左舱：无遮挡全动态串/并联电路拓扑图 (x: 16..576)
        drawPanel(
          16,
          146,
          560,
          440,
          isSeries ? '图 6.1：串联孤立节点静电感应与板间动态电场' : '图 6.2：并联等势母线、支路电子分流与板间动态电场',
          () => {
            if (isSeries) {
              const cy = 318;
              const xs = [138, 296, 454];
              const halfGap = 16;
              const yBot = 515;

              // 闭合回路连线（完整无断点）
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(58, yBot);
              ctx.lineTo(58, cy);
              ctx.lineTo(xs[0] - halfGap, cy);
              ctx.moveTo(xs[0] + halfGap, cy);
              ctx.lineTo(xs[1] - halfGap, cy);
              ctx.moveTo(xs[1] + halfGap, cy);
              ctx.lineTo(xs[2] - halfGap, cy);
              ctx.moveTo(xs[2] + halfGap, cy);
              ctx.lineTo(534, cy);
              ctx.lineTo(534, yBot);
              ctx.lineTo(312, yBot);
              ctx.moveTo(280, yBot);
              ctx.lineTo(58, yBot);
              ctx.stroke();

              // 底部直流电压源 U
              ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3.2;
              ctx.beginPath(); ctx.moveTo(280, yBot - 16); ctx.lineTo(280, yBot + 16); ctx.stroke();
              ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4.8;
              ctx.beginPath(); ctx.moveTo(312, yBot - 10); ctx.lineTo(312, yBot + 10); ctx.stroke();
              drawPillLabel(296, yBot + 32, `总电压源 U = ${U.toFixed(1)} V`, '#f8fafc', '#334155', 11);

              // 两个孤立导体节点高斯框 + 内部自由电子向左感应迁移真动画
              [0, 1].forEach((nodeIdx) => {
                const boxL = xs[nodeIdx] + halfGap - 6;
                const boxR = xs[nodeIdx + 1] - halfGap + 6;
                ctx.fillStyle = 'rgba(16, 185, 129, 0.09)';
                ctx.strokeStyle = '#10b981';
                ctx.setLineDash([5, 4]);
                ctx.lineWidth = 1.8;
                ctx.fillRect(boxL, cy - 48, boxR - boxL, 96);
                ctx.strokeRect(boxL, cy - 48, boxR - boxL, 96);
                ctx.setLineDash([]);

                drawPillLabel(
                  (boxL + boxR) / 2,
                  cy - 64,
                  `孤立节点${nodeIdx + 1}: q_净=0`,
                  '#34d399',
                  '#065f46',
                  10.5
                );

                // 节点内电子逆电场向左迁移
                const pMove = (s.time * 0.95 + nodeIdx * 0.4) % 1;
                const ex = boxR - 18 - pMove * (boxR - boxL - 36);
                drawChargeBadge(ex, cy, 'e⁻', '#38bdf8', 5.8);
              });

              // 三个串联电容器实体、板间动态电场线与独立铭牌
              caps.forEach((item, idx) => {
                const x = xs[idx];
                const overV = item.u > 7.5;

                // 板间动态水平电场线
                [-20, 0, 20].forEach((dy, lineIdx) => {
                  drawAnimatedFieldLine(
                    x - halfGap + 3,
                    cy + dy,
                    x + halfGap - 3,
                    cy + dy,
                    overV ? '#f43f5e' : '#2dd4bf',
                    lineIdx * 0.28 + idx * 0.15
                  );
                });

                ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 4.5;
                ctx.beginPath(); ctx.moveTo(x - halfGap, cy - 34); ctx.lineTo(x - halfGap, cy + 34); ctx.stroke();
                ctx.strokeStyle = '#38bdf8';
                ctx.beginPath(); ctx.moveTo(x + halfGap, cy - 34); ctx.lineTo(x + halfGap, cy + 34); ctx.stroke();

                drawChargeBadge(x - halfGap - 8, cy - 22, '+', '#f43f5e', 4.8);
                drawChargeBadge(x + halfGap + 8, cy - 22, '−', '#38bdf8', 4.8);

                if (overV) {
                  // 超压电火花闪烁预警
                  ctx.save();
                  ctx.strokeStyle = '#fbbf24';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.moveTo(x - 8, cy - 8);
                  ctx.lineTo(x + 4, cy);
                  ctx.lineTo(x - 4, cy + 8);
                  ctx.stroke();
                  ctx.restore();
                }

                drawPillLabel(x, cy + 72, `${item.name} (${item.c.toFixed(1)}μF)`, '#f8fafc', '#334155', 11.5);
                drawPillLabel(x, cy + 98, `Q = ${item.q.toFixed(1)} μC`, '#38bdf8', '#0369a1', 11);
                drawPillLabel(
                  x,
                  cy + 124,
                  `U_${idx + 1} = ${item.u.toFixed(2)}V${overV ? ' ⚠' : ''}`,
                  overV ? '#f43f5e' : '#fbbf24',
                  overV ? '#881337' : '#78350f',
                  11
                );
              });
            } else {
              // ===============================================================
              // 图 6.2：电容器并联网络 (零遮挡胶囊铭牌 + 干支路电子分流 + 板间动态电场)
              // ===============================================================
              const xL = 128, xR = 468, cx = 298;
              const plateL = cx - 26, plateR = cx + 26;
              const ys = [242, 354, 466];
              const ySupply = 536;

              // 1. 底部电源支路连接左右等势母线
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(xL, ys[2]); ctx.lineTo(xL, ySupply); ctx.lineTo(282, ySupply);
              ctx.moveTo(314, ySupply); ctx.lineTo(xR, ySupply); ctx.lineTo(xR, ys[2]);
              ctx.stroke();

              ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3.2;
              ctx.beginPath(); ctx.moveTo(282, ySupply - 14); ctx.lineTo(282, ySupply + 14); ctx.stroke();
              ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4.8;
              ctx.beginPath(); ctx.moveTo(314, ySupply - 9); ctx.lineTo(314, ySupply + 9); ctx.stroke();
              drawPillLabel(cx, ySupply + 24, `公共恒压源 U = ${U.toFixed(1)} V`, '#f8fafc', '#334155', 11);

              // 2. 左右公共等势母线 (Node A & Node B)
              ctx.strokeStyle = '#f43f5e';
              ctx.lineWidth = 3.2;
              ctx.beginPath(); ctx.moveTo(xL, ys[0]); ctx.lineTo(xL, ys[2]); ctx.stroke();

              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 3.2;
              ctx.beginPath(); ctx.moveTo(xR, ys[0]); ctx.lineTo(xR, ys[2]); ctx.stroke();

              drawPillLabel(xL - 36, ys[1], '节点A(+U)', '#f43f5e', '#881337', 10.5);
              drawPillLabel(xR + 38, ys[1], '节点B(0V)', '#38bdf8', '#0369a1', 10.5);

              // 3. 三条并联支路、板间动态匀强电场、极板电荷与正上方独立胶囊铭牌（绝不触碰右侧蓝色母线！）
              caps.forEach((item, idx) => {
                const y = ys[idx];

                // 支路水平导线
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(xL, y); ctx.lineTo(plateL, y);
                ctx.moveTo(plateR, y); ctx.lineTo(xR, y);
                ctx.stroke();

                // 板间动态电场线 (由左正极板指向右负极板)
                [-14, 0, 14].forEach((dy, lIdx) => {
                  drawAnimatedFieldLine(plateL + 4, y + dy, plateR - 4, y + dy, '#2dd4bf', lIdx * 0.3 + idx * 0.2);
                });

                // 电容器极板
                ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 4.5;
                ctx.beginPath(); ctx.moveTo(plateL, y - 24); ctx.lineTo(plateL, y + 24); ctx.stroke();
                ctx.strokeStyle = '#38bdf8';
                ctx.beginPath(); ctx.moveTo(plateR, y - 24); ctx.lineTo(plateR, y + 24); ctx.stroke();

                // 极板电荷数量随电量 Q_i 动态变化
                const nBadges = Math.max(1, Math.min(4, Math.round(item.c / 2.2)));
                for (let b = 0; b < nBadges; b++) {
                  const by = nBadges === 1 ? y : y - 15 + (b / (nBadges - 1)) * 30;
                  drawChargeBadge(plateL - 8, by, '+', '#f43f5e', 4.6);
                  drawChargeBadge(plateR + 8, by, '−', '#38bdf8', 4.6);
                }

                // 支路电子分流动态粒子 (速度正比于支路电容 C_i)
                const branchSpeed = 0.65 + item.c * 0.12;
                for (let k = 0; k < 2; k++) {
                  const p = (s.time * branchSpeed + k * 0.5 + idx * 0.2) % 1;
                  const exR = xR - 12 - p * (xR - plateR - 26);
                  const exL = plateL - 14 - p * (plateL - xL - 26);
                  drawChargeBadge(exR, y, 'e⁻', '#38bdf8', 5.2);
                  drawChargeBadge(exL, y, 'e⁻', '#38bdf8', 5.2);
                }

                // 独立悬浮在电容器正上方的胶囊铭牌（位于 x=298，远离 xR=468 母线 80px 以上，彻底零遮挡！）
                drawPillLabel(
                  cx,
                  y - 38,
                  `${item.name} (${item.c.toFixed(1)}μF)  |  Q_${idx + 1} = ${item.q.toFixed(1)} μC  |  U = ${item.u.toFixed(1)} V`,
                  '#f8fafc',
                  '#38bdf8',
                  11
                );
              });
            }
          }
        );

        // 右舱：串/并联各支路电量 Q_i 与电压 U_i 实时动态柱状图 (x: 590..904)
        drawPanel(
          590,
          146,
          314,
          440,
          isSeries ? '串联等电量 Q 与反比分压 U_i 对比' : '并联共电压 U 与正比储电 Q_i 对比',
          () => {
            const baseBarY = 508, maxBarH = 230;
            const pulse = 1 + 0.02 * Math.sin(s.time * 4.5);

            ctx.save();
            ctx.textAlign = 'center';
            caps.forEach((item, idx) => {
              const groupX = 626 + idx * 92;

              // 左柱：电量 Q_i (蓝色)
              const qH = Math.min(maxBarH, Math.max(14, (item.q / 120) * maxBarH * pulse));
              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.roundRect(groupX, baseBarY - qH, 26, qH, 4);
              ctx.fill();
              ctx.font = 'bold 10.5px ui-monospace, monospace';
              ctx.fillText(`${item.q.toFixed(0)}μC`, groupX + 13, baseBarY - qH - 10);

              // 右柱：电压 U_i (琥珀色/超压红色)
              const overV = isSeries && item.u > 7.5;
              const uH = Math.min(maxBarH, Math.max(14, (item.u / 18) * maxBarH * pulse));
              ctx.fillStyle = overV ? '#f43f5e' : '#fbbf24';
              ctx.beginPath();
              ctx.roundRect(groupX + 32, baseBarY - uH, 26, uH, 4);
              ctx.fill();
              ctx.fillText(`${item.u.toFixed(1)}V`, groupX + 45, baseBarY - uH - 24);

              ctx.fillStyle = '#f8fafc';
              ctx.font = 'bold 12px ui-monospace, monospace';
              ctx.fillText(`${item.name}(${item.c.toFixed(1)})`, groupX + 29, baseBarY + 20);
            });
            ctx.restore();

            drawPillLabel(747, 212, '蓝柱: 电量 Q_i (μC)  |  黄柱: 电压 U_i (V)', '#cbd5e1', '#334155', 10.5);
            drawPillLabel(
              747,
              558,
              isSeries ? '串联特征：Q₁=Q₂=Q₃，电容越小分压越高' : '并联特征：U₁=U₂=U₃，电容越大储电越多',
              '#34d399',
              '#065f46',
              10.5
            );
          }
        );
      }
    };

    const render = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      updatePhysics(dt);

      drawGrid();

      const tab = physics.current.activeTab;
      if (tab === 0) renderModule0();
      else if (tab === 1) renderModule1();
      else if (tab === 2) renderModule2();
      else if (tab === 3) renderModule3();
      else if (tab === 4) renderModule4();
      else if (tab === 5) renderModule5();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    physics.current.isDragging = true;
    const rect = canvas.getBoundingClientRect();
    physics.current.pointerX = ((e.clientX - rect.left) / rect.width) * LOGICAL_W;
    physics.current.pointerY = ((e.clientY - rect.top) / rect.height) * LOGICAL_H;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const handlePointerMove = (e) => {
    if (!physics.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * LOGICAL_W;
    const my = ((e.clientY - rect.top) / rect.height) * LOGICAL_H;
    const s = physics.current;

    if (s.activeTab === 0 && !s.isGrounded0) {
      const dy = s.pointerY - my;
      const nextPhi = Math.max(-6, Math.min(10, s.phi0 + dy * 0.06));
      s.phi0 = nextPhi;
      setPhi0(nextPhi);
    } else if (s.activeTab === 1 && s.cavityQ !== 0) {
      setAutoOrbit(false);
      s.autoOrbit = false;
      const dx = mx - 272;
      const dy = my - 372;
      const dist = Math.hypot(dx, dy);
      const maxR = 44;
      s.targetEccX = dist > maxR ? (dx / dist) * maxR : dx;
      s.targetEccY = dist > maxR ? (dy / dist) * maxR : dy;
    } else if (s.activeTab === 3) {
      const pRight = 306 + MODULE3_PLATE_WIDTH / 2;
      const ratio = Math.max(
        0,
        Math.min(MODULE3_MAX_SLAB_INSERTION, (pRight - mx) / MODULE3_PLATE_WIDTH)
      );
      s.targetSlabX = ratio;
      setSlabX(Number(ratio.toFixed(2)));
    } else if (s.activeTab === 4 && s.dischargeMode === 1) {
      const newGap = Math.max(0, Math.min(60, (mx - 195) / 3.0));
      s.targetArcGap = newGap;
      setArcGap(Math.round(newGap));
    }

    s.pointerX = mx;
    s.pointerY = my;
  };

  const handlePointerUp = (e) => {
    physics.current.isDragging = false;
    try {
      if (e.pointerId != null && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
  };

  const tabs = [
    { id: 0, title: '1. 静电平衡与电势', sub: '弛豫电子流 · 等势平台' },
    { id: 1, title: '2. 空腔静电屏蔽', sub: '轨道巡航 · 接地电子中和' },
    { id: 2, title: '3. 平行板电容器', sub: '决定式 S/d/εr · 四表面定理' },
    { id: 3, title: '4. 电介质极化与动态', sub: '偶极子热运动 · 四步分析法' },
    { id: 4, title: '5. 尖端电晕 vs 电弧', sub: '汤森雪崩 · 电风吹偏烛火' },
    { id: 5, title: '6. RC 充放电与串并联', sub: '支路电子分流 · 50%热损耗' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#020617] border border-slate-800 rounded-2xl shadow-2xl select-none font-sans flex flex-col my-6 overflow-hidden">
      {/* 顶部标题栏 */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 font-mono tracking-wide">
            静电场、导体屏蔽与电容器 · 全章节交互实验室
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 font-mono">
            Hardware-Clipped Zero-Occlusion Engine · V15.0 All-Dynamic Edition
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-full self-start sm:self-auto shadow-inner">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <span className="text-xs font-mono text-slate-300 font-semibold tracking-wider">60FPS REALTIME</span>
        </div>
      </div>

      {/* 六大板块全可见网格导航栏 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-slate-900/50 border-b border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-3 px-3 text-left transition-all border-b-2 border-r border-slate-800/60 cursor-pointer ${
              activeTab === t.id
                ? 'border-b-sky-500 text-sky-400 bg-slate-800/70 shadow-[inset_0_-2px_12px_rgba(14,165,233,0.18)]'
                : 'border-b-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <div className="text-xs md:text-sm font-bold tracking-wide truncate">{t.title}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{t.sub}</div>
          </button>
        ))}
      </div>

      {/* 黄金比例自适应 Canvas 视口 */}
      <div className="relative w-full aspect-[920/600] bg-[#020617] overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* 底部交互控制栏 */}
      <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
        {activeTab === 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={replayRelaxation}
                className="px-3.5 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500 text-sky-200 font-mono font-bold rounded-lg cursor-pointer"
              >
                ▶ 重放电子迁移弛豫过程
              </button>
              <button
                onClick={() => setMod0Sub(mod0Sub === 0 ? 1 : 0)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-mono font-bold rounded-lg cursor-pointer"
              >
                {mod0Sub === 0 ? '切换：图 1.4/1.5 尖端曲率与高斯面' : '切换：图 1.2 三层贯穿对照图'}
              </button>
              <button
                onClick={() => setIsGrounded0(!isGrounded0)}
                className={`px-3.5 py-1.5 rounded-lg font-mono font-bold border cursor-pointer ${
                  isGrounded0 ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                {isGrounded0 ? '● 已接地 (φ₀=0)' : '○ 导体接地'}
              </button>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-300">外场 E₀: {extE0.toFixed(0)}</span>
                <input
                  type="range" min="4" max="16" step="1"
                  value={extE0}
                  onChange={(e) => setExtE0(parseFloat(e.target.value))}
                  className="w-24 accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
            <span className="text-sky-400 font-bold">💡 上下拖动画面可直接平移等势体平台 φ₀</span>
          </div>
        )}

        {activeTab === 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAutoOrbit(!autoOrbit)}
                className={`px-3.5 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  autoOrbit ? 'bg-sky-950 border-sky-500 text-sky-300' : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
              >
                {autoOrbit ? '● 腔内+q自动轨道巡航中' : '▶ 开启腔内+q自动巡航'}
              </button>
              <button
                onClick={() => { setCavityQ(0); setShieldExtField(true); setShellGrounded(false); }}
                className="px-3 py-1.5 rounded-md font-mono font-bold border bg-slate-800/60 border-slate-600 text-slate-200 hover:border-sky-500 cursor-pointer"
              >
                场景(a) 屏蔽外场 (q_腔=0)
              </button>
              <button
                onClick={() => { setCavityQ(1); setShieldExtField(false); setShellGrounded(false); }}
                className="px-3 py-1.5 rounded-md font-mono font-bold border bg-slate-800/60 border-slate-600 text-slate-200 hover:border-sky-500 cursor-pointer"
              >
                场景(b) 腔内+q 未接地
              </button>
              <button
                onClick={() => { setCavityQ(1); setShieldExtField(false); setShellGrounded(true); }}
                className="px-3 py-1.5 rounded-md font-mono font-bold border bg-emerald-950/80 border-emerald-500 text-emerald-300 cursor-pointer"
              >
                ⚡ 场景(c) 接地全屏蔽 (电子中和流)
              </button>
            </div>
            <span className="text-sky-400 font-bold">💡 可直接按住左图空腔内的 +q 任意拖拽</span>
          </div>
        )}

        {activeTab === 2 && (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setMod2Sub(0)}
                className={`px-3.5 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  mod2Sub === 0 ? 'bg-sky-950 border-sky-500 text-sky-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                图 4.1 电容决定式 C=εrε0S/d
              </button>
              <button
                onClick={() => setMod2Sub(1)}
                className={`px-3.5 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  mod2Sub === 1 ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                图 4.2 & 4.3 四表面电荷定理与场强叠加
              </button>

              {mod2Sub === 0 ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-300">面积 S: {capS.toFixed(2)}</span>
                    <input type="range" min="0.5" max="1.2" step="0.05" value={capS} onChange={(e) => setCapS(parseFloat(e.target.value))} className="w-20 accent-amber-400 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-300">间距 d: {capD.toFixed(2)}</span>
                    <input type="range" min="0.6" max="1.4" step="0.05" value={capD} onChange={(e) => setCapD(parseFloat(e.target.value))} className="w-20 accent-emerald-400 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-300">介电 ε_r: {capEr.toFixed(1)}</span>
                    <input type="range" min="1.0" max="4.0" step="0.5" value={capEr} onChange={(e) => setCapEr(parseFloat(e.target.value))} className="w-20 accent-sky-400 cursor-pointer" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-300">上板 Q_A: {plateQA.toFixed(0)}μC</span>
                    <input type="range" min="-16" max="20" step="2" value={plateQA} onChange={(e) => setPlateQA(parseFloat(e.target.value))} className="w-24 accent-rose-500 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-300">下板 Q_B: {plateQB.toFixed(0)}μC</span>
                    <input type="range" min="-16" max="20" step="2" value={plateQB} onChange={(e) => setPlateQB(parseFloat(e.target.value))} className="w-24 accent-sky-500 cursor-pointer" />
                  </div>
                  <button
                    onClick={() => { setPlateQA(12); setPlateQB(-12); }}
                    className="px-3 py-1 rounded bg-emerald-800/60 border border-emerald-500 text-emerald-200 font-mono font-bold cursor-pointer"
                  >
                    设为等量异号 (+Q / -Q)
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setCapConstraint(0)}
                className={`px-3.5 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  capConstraint === 0 ? 'bg-sky-950 border-sky-500 text-sky-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                情形 B：恒压源 (U不变)
              </button>
              <button
                onClick={() => setCapConstraint(1)}
                className={`px-3.5 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  capConstraint === 1 ? 'bg-rose-950 border-rose-500 text-rose-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                情形 A：断电孤立 (Q不变)
              </button>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-300">间距 d: {dynD.toFixed(2)}</span>
                <input type="range" min="0.65" max="1.35" step="0.05" value={dynD} onChange={(e) => setDynD(parseFloat(e.target.value))} className="w-24 accent-sky-500 cursor-pointer" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-300">热运动干扰:</span>
                <input type="range" min="0.05" max="0.85" step="0.05" value={thermalT} onChange={(e) => setThermalT(parseFloat(e.target.value))} className="w-20 accent-amber-400 cursor-pointer" />
              </div>
            </div>
            <span className="text-sky-400 font-bold">💡 左右拖动青色电介质板插入或拔出（自动避开油滴探针）</span>
          </div>
        )}

        {activeTab === 4 && (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setDischargeMode(0)}
                className={`px-3.5 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  dischargeMode === 0 ? 'bg-sky-950 border-sky-500 text-sky-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                图 1.6 尖端电晕与离子电风
              </button>
              <button
                onClick={() => setDischargeMode(1)}
                className={`px-3.5 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  dischargeMode === 1 ? 'bg-rose-950 border-rose-500 text-rose-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                图 1.7 开关触头拉弧
              </button>
              {dischargeMode === 0 ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-300">尖端场强: {tipField.toFixed(1)} MV/m</span>
                  <input type="range" min="1.5" max="6.0" step="0.3" value={tipField} onChange={(e) => setTipField(parseFloat(e.target.value))} className="w-32 accent-rose-500 cursor-pointer" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-300">触头间距: {arcGap} mm</span>
                  <input type="range" min="0" max="60" step="1" value={arcGap} onChange={(e) => setArcGap(parseInt(e.target.value, 10))} className="w-32 accent-rose-500 cursor-pointer" />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 5 && (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setMod5Sub(0)}
                className={`px-3 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  mod5Sub === 0 ? 'bg-sky-950 border-sky-500 text-sky-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                图 3.1/3.2 RC充放电与50%热损耗
              </button>
              <button
                onClick={() => setMod5Sub(1)}
                className={`px-3 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  mod5Sub === 1 ? 'bg-sky-950 border-sky-500 text-sky-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                图 6.1 电容器串联
              </button>
              <button
                onClick={() => setMod5Sub(2)}
                className={`px-3 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                  mod5Sub === 2 ? 'bg-sky-950 border-sky-500 text-sky-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                图 6.2 电容器并联
              </button>

              {mod5Sub === 0 ? (
                <>
                  <button
                    onClick={() => setRcAutoCycle(!rcAutoCycle)}
                    className={`px-3 py-1.5 rounded-md font-mono font-bold border cursor-pointer ${
                      rcAutoCycle ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-600 text-slate-300'
                    }`}
                  >
                    {rcAutoCycle ? '● 自动循环充放电中' : '▶ 开启自动循环'}
                  </button>
                  <button
                    onClick={() => triggerRC(1)}
                    className="px-3 py-1.5 bg-rose-600/30 border border-rose-500 text-rose-200 font-mono font-bold rounded-md cursor-pointer"
                  >
                    ⚡ 拨向 1：充电
                  </button>
                  <button
                    onClick={() => triggerRC(2)}
                    className="px-3 py-1.5 bg-emerald-600/30 border border-emerald-500 text-emerald-200 font-mono font-bold rounded-md cursor-pointer"
                  >
                    ⚡ 拨向 2：放电
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-300">电阻 R: {rcRes.toFixed(1)}Ω</span>
                    <input type="range" min="1.0" max="4.0" step="0.5" value={rcRes} onChange={(e) => setRcRes(parseFloat(e.target.value))} className="w-20 accent-sky-500 cursor-pointer" />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">调节 C₁: {netC1.toFixed(1)}μF</span>
                  <input type="range" min="1.5" max="9.0" step="0.5" value={netC1} onChange={(e) => setNetC1(parseFloat(e.target.value))} className="w-24 accent-sky-500 cursor-pointer" />
                  <span className="font-mono text-slate-300">总电压 U: {netU.toFixed(0)}V</span>
                  <input type="range" min="6" max="18" step="1" value={netU} onChange={(e) => setNetU(parseFloat(e.target.value))} className="w-24 accent-rose-500 cursor-pointer" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}