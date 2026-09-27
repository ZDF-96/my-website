'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * ============================================================================
 * 多质点系动力学：质心、动量与能量定理 (V12.0 · 完美定稿版)
 * ----------------------------------------------------------------------------
 * 【排版】彻底解决 Flexbox 导致的导航栏文本溢出截断问题，全端自适应响应。
 * 【视觉】强化高对比度 UI，核心物理变量加入亚像素抗锯齿与辉光效果。
 * 【物理】严苛的边界防入侵 Clipping Mask 保护，确保教学演示中的视觉纯净度。
 * ============================================================================
 */

export default function ZhiXinFaSimulation() {
  const canvasRef = useRef(null);

  const [activeTab, setActiveTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [massRatio, setMassRatio] = useState(0.4);
  const [gradForce, setGradForce] = useState(0.25);
  const [rodAngle, setRodAngle] = useState(35);

  const M2_M = 2.0, M2_m = 1.0, M2_v0 = 80;
  const M2_L_free = 110, M2_bW_world = 40;
  const M2_omega = 1.35;
  const M2_tSep = Math.PI / M2_omega;
  const M2_tReset = M2_tSep + 1.0;

  const M3_m1 = 2.0, M3_m2 = 1.0, M3_v1 = 70, M3_v2 = -50;
  const M3_tColl = 1.6;
  const M3_tReset = 3.8;

  const physics = useRef({
    time: 0,
    isDragging: false,
    pointerX: 0,
    pointerY: 0,
    personRelPos: 0,
    targetRelPos: 0,
    mod2Time: 0,
    mod3Time: 0,
    activeTab: 0,
    isPlaying: false,
    massRatio: 0.4,
    gradForce: 0.25,
    rodAngle: 35,
    centerAnchorY: 300,
  });

  useEffect(() => { physics.current.activeTab = activeTab; }, [activeTab]);
  useEffect(() => { physics.current.isPlaying = isPlaying; }, [isPlaying]);
  useEffect(() => { physics.current.massRatio = massRatio; }, [massRatio]);
  useEffect(() => { physics.current.gradForce = gradForce; }, [gradForce]);
  useEffect(() => { physics.current.rodAngle = rodAngle; }, [rodAngle]);

  const resetSimulation = useCallback(() => {
    physics.current.mod2Time = 0;
    physics.current.mod3Time = 0;
    physics.current.personRelPos = 0;
    physics.current.targetRelPos = 0;
    setIsPlaying(false);
  }, []);

  const getWalkLength = useCallback((w) => Math.min(340, w * 0.7), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    let animationId;
    let lastTime = performance.now();

    const resizeCanvas = () => {
      const w = Math.max(300, canvas.clientWidth);
      const h = Math.max(480, canvas.clientHeight);
      const dpr = window.devicePixelRatio || 2; 
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // 开启亚像素抗锯齿以保证连线极其平滑
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    };
    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const updatePhysics = (dtMs) => {
      const state = physics.current;
      const dt = Math.max(0.001, Math.min(dtMs / 1000, 0.04));
      state.time += dt;

      if (state.activeTab === 0) {
        if (state.isDragging) {
          const w = canvas.clientWidth;
          const L_walk = getWalkLength(w);
          const cx = w / 2;
          const mouseOffset = state.pointerX - cx;
          const factor = 1 / (1 + state.massRatio);
          const computedRel = (mouseOffset / factor) + (L_walk / 2);
          state.targetRelPos = Math.max(0, Math.min(L_walk, computedRel));
        }
        state.personRelPos += (state.targetRelPos - state.personRelPos) * Math.min(1, 16 * dt);
      }

      if (state.activeTab === 1 && state.isPlaying) {
        state.mod2Time += dt;
        if (state.mod2Time > M2_tReset) state.mod2Time = 0;
      }

      if (state.activeTab === 2 && state.isPlaying) {
        state.mod3Time += dt;
        if (state.mod3Time > M3_tReset) state.mod3Time = 0;
      }
    };

    // =========================================================================
    // 核心绘图函数库
    // =========================================================================
    const drawGrid = (w, h) => {
      ctx.fillStyle = '#020617'; 
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)'; 
      ctx.lineWidth = 1;
      const step = 50;
      ctx.beginPath();
      for (let x = 0; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    };

    const drawCard = (x, y, w, h, radius, title) => {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
      
      ctx.shadowColor = 'transparent'; // 重置阴影防止污染内层
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      
      if (title) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 15px ui-monospace, monospace'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(title, x + 16, y + 20, w - 32);
        
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 36); 
        ctx.lineTo(x + w - 12, y + 36);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawVector = (x, y, dx, dy, color, label, isLabelBelow = false) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5; 
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
        ctx.lineTo(-9, -5);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-9, 5);
        ctx.closePath();
        ctx.fill();
        ctx.rotate(-angle);
        ctx.translate(-(x + dx), -(y + dy));
      }
      if (label) {
        // 给重要矢量增加细微的发光感
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.font = 'italic bold 14px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = isLabelBelow ? 'top' : 'bottom';
        ctx.fillText(label, x + dx, y + dy + (isLabelBelow ? 8 : -8));
      }
      ctx.restore();
    };

    const drawCMSymbol = (x, y, radius = 7, color = '#f43f5e') => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, radius, 0, Math.PI / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, radius, Math.PI, Math.PI * 1.5);
      ctx.fill();
      ctx.restore();
    };

    const drawStickman = (x, deckY, isWalking, color = '#38bdf8') => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5; 
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const headR = 8, headCenterY = deckY - 44, neckY = deckY - 36, pelvisY = deckY - 18;
      ctx.beginPath();
      ctx.arc(x, headCenterY, headR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, neckY);
      ctx.lineTo(x, pelvisY);
      ctx.stroke();
      const stride = isWalking ? 10 : 4;
      ctx.beginPath();
      ctx.moveTo(x, pelvisY);
      ctx.lineTo(x - stride, deckY);
      ctx.moveTo(x, pelvisY);
      ctx.lineTo(x + stride, deckY);
      ctx.stroke();
      const arm = isWalking ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(x, neckY + 4);
      ctx.lineTo(x + arm, neckY + 16);
      ctx.moveTo(x, neckY + 4);
      ctx.lineTo(x - arm, neckY + 16);
      ctx.stroke();
      ctx.restore();
    };

    // =========================================================================
    // 模块 1：人船模型
    // =========================================================================
    const renderModule1 = (w, h) => {
      const { massRatio: mr } = physics.current;
      const state = physics.current;
      const cx = w / 2;
      const cy = Math.max(290, h * 0.55);

      const L_boat = getWalkLength(w);
      const s_rel = state.personRelPos;

      const x_M0 = (mr / (1 + mr)) * (L_boat / 2);
      const delta_x_M = - (mr / (1 + mr)) * s_rel;
      const delta_x_m = delta_x_M + s_rel;
      const currentBoatCenter = cx + x_M0 + delta_x_M;
      const currentPersonPos = currentBoatCenter - (L_boat / 2) + s_rel;
      const initPersonX = cx + x_M0 - (L_boat / 2);
      const initBoatCenter = cx + x_M0;
      const deckY = cy - 12; 

      const cardH = 165; 
      const topY = 14;
      const cardW = Math.min(560, w - 28);
      drawCard(14, topY, cardW, cardH, 8, '人船模型 · 质心绝对静止验证 (加入残影追踪辅助线)');

      ctx.save();
      ctx.textBaseline = 'top'; 
      ctx.font = '13px ui-monospace, monospace'; 
      ctx.fillStyle = '#cbd5e1'; 
      ctx.fillText(`相对位移 sᵣₑₗ = ${s_rel.toFixed(1)} px  质量比 m/M = ${mr.toFixed(2)}`, 28, topY + 50);

      const mom_m = mr * delta_x_m;
      const mom_M = 1.0 * delta_x_M;
      const midBar = 28 + (cardW - 56) / 2;
      const scaleBar = (cardW - 70) / (2 * (L_boat * 0.8));

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`m·Δx_m = +${mom_m.toFixed(1)}`, 28, topY + 76);
      ctx.fillRect(midBar, topY + 78, Math.max(0, mom_m * scaleBar), 10);

      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`M·Δx_M = ${mom_M.toFixed(1)}`, 28, topY + 102);
      ctx.fillRect(midBar + Math.min(0, mom_M * scaleBar), topY + 104, Math.abs(mom_M * scaleBar), 10);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.fillText(`系统动量守恒：m·Δx_m + M·Δx_M = ${(mom_m + mom_M).toFixed(3)} ≡ 0`, 28, topY + 130);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, topY + cardH + 10, w, h - (topY + cardH + 10));
      ctx.clip();

      ctx.save();
      ctx.strokeStyle = '#0369a1'; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(20, cy + 20);
      ctx.lineTo(w - 20, cy + 20);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 95);
      ctx.lineTo(cx, cy + 95);
      ctx.stroke();
      ctx.setLineDash([]);
      drawCMSymbol(cx, cy - 95, 8, '#f43f5e');
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('X_c ≡ 0 (质心地面绝对静止)', cx, cy - 110);
      ctx.restore();

      ctx.save();
      ctx.translate(initBoatCenter, cy);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(-L_boat / 2, -12);
      ctx.lineTo(L_boat / 2, -12);
      ctx.lineTo(L_boat / 2 - 26, 22);
      ctx.lineTo(-L_boat / 2 + 26, 22);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.fill();
      ctx.restore();
      
      drawStickman(initPersonX, deckY, false, 'rgba(148, 163, 184, 0.5)');

      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(initPersonX, deckY);
      ctx.lineTo(initPersonX, cy - 70);
      ctx.moveTo(currentPersonPos, deckY);
      ctx.lineTo(currentPersonPos, cy - 70);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(initBoatCenter, cy + 12);
      ctx.lineTo(initBoatCenter, cy + 65);
      ctx.moveTo(currentBoatCenter, cy + 12);
      ctx.lineTo(currentBoatCenter, cy + 65);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(currentBoatCenter, cy);
      const bgGrad = ctx.createLinearGradient(0, -12, 0, 24);
      bgGrad.addColorStop(0, '#334155');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-L_boat / 2, -12);
      ctx.lineTo(L_boat / 2, -12);
      ctx.lineTo(L_boat / 2 - 26, 22);
      ctx.lineTo(-L_boat / 2 + 26, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'italic bold 18px serif';
      ctx.textAlign = 'center';
      ctx.fillText('M', 0, 10);
      ctx.restore();

      const isWalking = state.isDragging || Math.abs(state.targetRelPos - state.personRelPos) > 0.5;
      drawStickman(currentPersonPos, deckY, isWalking, '#38bdf8');

      const drawDim = (x1, x2, y, text, color) => {
        if (Math.abs(x2 - x1) < 2) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        const dir = x2 > x1 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x2, y);
        ctx.lineTo(x2 - dir * 7, y - 4);
        ctx.lineTo(x2 - dir * 7, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.font = '12px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, (x1 + x2) / 2, y - 8);
        ctx.restore();
      };

      drawDim(initPersonX, currentPersonPos, cy - 70, `Δx_m = +${delta_x_m.toFixed(1)}`, '#38bdf8');
      drawDim(initBoatCenter, currentBoatCenter, cy + 65, `Δx_M = ${delta_x_M.toFixed(1)}`, '#fbbf24');
      ctx.restore();
    };

    // =========================================================================
    // 模块 2：柯尼希定理
    // =========================================================================
    const renderModule2 = (w, h) => {
      const state = physics.current;
      const M = M2_M, m = M2_m, v0 = M2_v0, mu = (M * m) / (M + m);
      const omega = M2_omega, t = state.mod2Time, L_free = M2_L_free, bW_world = M2_bW_world;
      const tSep = M2_tSep, isSeparated = t >= tSep;
      const vc = (M * v0) / (M + m), deltaMax = v0 / omega;
      const vB_sep = ((M - m) / (M + m)) * v0, vA_sep = ((2 * M) / (M + m)) * v0;

      let deltaX, vB, vA, Ek_rel, Ep;
      if (!isSeparated) {
        deltaX = deltaMax * Math.sin(omega * t);
        const vRel = deltaMax * omega * Math.cos(omega * t);
        vB = vc + (v0 - vc) * Math.cos(omega * t);
        vA = vc - vc * Math.cos(omega * t);
        Ek_rel = 0.5 * mu * vRel * vRel;
        Ep = 0.5 * mu * (deltaMax * omega) * (deltaMax * omega) - Ek_rel;
      } else {
        deltaX = 0; vB = vB_sep; vA = vA_sep;
        Ek_rel = 0.5 * mu * (vB - vA) * (vB - vA); Ep = 0;
      }
      const Ek_c = 0.5 * (M + m) * vc * vc;

      const topH = 145; 
      const topY = 12;
      const cardW = Math.min(400, (w - 36) / 2);
      drawCard(14, topY, cardW, topH, 8, '柯尼希动能定理与能量守恒 (LaTeX 例 3)');
      
      ctx.save();
      ctx.textBaseline = 'top'; 
      ctx.font = '13px ui-monospace, monospace'; 
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`质心平动动能 E_k,c = ${Ek_c.toFixed(1)} J (严格恒定)`, 26, topY + 52);
      ctx.fillText(`相对运动动能 E_k,rel = ${Ek_rel.toFixed(1)} J`, 26, topY + 78);
      ctx.fillText(`弹簧弹性势能 E_p = ${Math.max(0, Ep).toFixed(1)} J`, 26, topY + 104);
      ctx.restore();

      const rx = 14 + cardW + 8;
      const rw = Math.min(cardW, w - rx - 14);
      if (rw > 140) {
        drawCard(rx, topY, rw, topH, 8, '接触状态实时监视器');
        ctx.save();
        ctx.textBaseline = 'top';
        ctx.font = 'bold 13px ui-monospace, monospace';
        ctx.fillStyle = isSeparated ? '#34d399' : '#fbbf24';
        ctx.fillText(isSeparated ? '● 回复原长后已分离' : '● 正在接触挤压与弹性恢复', rx + 20, topY + 50);
        
        ctx.shadowColor = isSeparated ? '#34d399' : '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.font = 'bold 18px ui-monospace, monospace'; 
        ctx.fillText(`Δx = ${deltaX.toFixed(1)} px`, rx + 20, topY + 76);
        ctx.shadowColor = 'transparent';

        ctx.font = '13px ui-monospace, monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`v_B=${vB.toFixed(0)} px/s | v_A=${vA.toFixed(0)} px/s`, rx + 20, topY + 106);
        ctx.restore();
      }

      const sceneY = topY + topH + 12; 
      const graphH = Math.min(160, Math.max(130, h * 0.25));
      const sceneH = Math.max(180, h - sceneY - graphH - 18); 
      
      drawCard(14, sceneY, w - 28, sceneH, 8, '物理演化：B 撞击 A 左端固连的轻弹簧 → 压缩 → 回复原长后脱离');
      ctx.save();
      ctx.beginPath();
      ctx.rect(14, sceneY + 40, w - 28, sceneH - 40);
      ctx.clip(); 

      const cy = sceneY + sceneH * 0.58;
      const cx = w / 2;
      const scale = Math.min(1, (w - 60) / 680);
      const bW = bW_world * scale;

      const xC = -100 + vc * t;
      let xM, xm;
      if (!isSeparated) {
        const clearance = L_free - deltaX;
        const totalDist = clearance + bW_world;
        xM = xC - (m / (M + m)) * totalDist;
        xm = xC + (M / (M + m)) * totalDist;
      } else {
        const dtAfter = t - tSep;
        xM = (xC - vc * dtAfter - (m / (M + m)) * (L_free + bW_world)) + vB_sep * dtAfter;
        xm = (xC - vc * dtAfter + (M / (M + m)) * (L_free + bW_world)) + vA_sep * dtAfter;
      }

      const screenXC = cx + xC * scale;
      const screenXM = cx + xM * scale;
      const screenXm = cx + xm * scale;

      ctx.save();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(24, cy + 24);
      ctx.lineTo(w - 24, cy + 24);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(screenXC, cy - 50);
      ctx.lineTo(screenXC, cy + 24);
      ctx.stroke();
      ctx.setLineDash([]);
      drawCMSymbol(screenXC, cy - 50, 7, '#f43f5e');
      ctx.fillStyle = '#f43f5e';
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`质心 C(t)`, screenXC, cy - 62);
      ctx.restore();

      const spRight = screenXm - bW / 2;
      const spLeft = isSeparated ? (spRight - L_free * scale) : (screenXM + bW / 2);
      const coils = 12;
      const spLen = Math.max(12, spRight - spLeft);

      ctx.save();
      ctx.strokeStyle = isSeparated ? '#64748b' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(spLeft, cy);
      const step = spLen / coils;
      for (let i = 0; i < coils; i++) {
        ctx.lineTo(spLeft + step * (i + 0.25), cy - 8);
        ctx.lineTo(spLeft + step * (i + 0.75), cy + 8);
      }
      ctx.lineTo(spRight, cy);
      ctx.stroke();

      ctx.fillStyle = isSeparated ? '#94a3b8' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(spLeft, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (isSeparated && (spLeft - (screenXM + bW / 2)) > 4) {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenXM + bW / 2 + 3, cy);
        ctx.lineTo(spLeft - 3, cy);
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.font = '12px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('已脱离', (screenXM + bW / 2 + spLeft) / 2, cy - 16);
      }
      ctx.restore();

      const renderBlock = (x, label, color) => {
        ctx.save();
        ctx.fillStyle = '#0f172a'; 
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x - bW / 2, cy - bW / 2, bW, bW, 6); 
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = 'bold 16px serif'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, cy);
        ctx.restore();
      };

      renderBlock(screenXM, 'B', '#fbbf24');
      renderBlock(screenXm, 'A', '#38bdf8');
      drawVector(screenXM, cy - bW / 2 - 16, vB * 0.35 * scale, 0, '#fbbf24', `v_B=${vB.toFixed(0)}`);
      drawVector(screenXm, cy - bW / 2 - 16, vA * 0.35 * scale, 0, '#38bdf8', `v_A=${vA.toFixed(0)}`);
      ctx.restore(); 

      const gy = sceneY + sceneH + 10;
      drawCard(14, gy, w - 28, graphH, 8, '弹簧形变量 Δx(t) [压缩为正，回复原长后彻底脱离拉平归零]');
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(14, gy + 40, w - 28, graphH - 40);
      ctx.clip(); 

      const ox = 56, oy = gy + graphH - 30, gw = w - ox - 46, gh = graphH - 60;
      ctx.save();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy);
      ctx.lineTo(ox + gw - 8, oy - 4); ctx.moveTo(ox + gw, oy); ctx.lineTo(ox + gw - 8, oy + 4);
      ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`+${deltaMax.toFixed(0)}px`, ox - 6, oy - gh + 10);
      ctx.fillText('0 (脱离)', ox - 6, oy + 4);

      const totalPlotT = M2_tReset;
      const sepX = ox + (tSep / totalPlotT) * gw;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5; 
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const points = 160; 
      for (let i = 0; i <= points; i++) {
        const simT = (i / points) * totalPlotT;
        const px = ox + (simT / totalPlotT) * gw;
        const dVal = simT <= tSep ? deltaMax * Math.sin(omega * simT) : 0;
        const py = oy - (dVal / deltaMax) * (gh * 0.88);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.strokeStyle = '#10b981';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sepX, oy); ctx.lineTo(sepX, oy - gh);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#10b981';
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillText('分离点(t=2t₀)', sepX + 6, oy - gh + 16);

      const curX = ox + (Math.min(t, totalPlotT) / totalPlotT) * gw;
      const curY = oy - (deltaX / deltaMax) * (gh * 0.88);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore(); 
    };

    // =========================================================================
    // 模块 3：碰撞双参考系
    // =========================================================================
    const renderModule3 = (w, h) => {
      const state = physics.current;
      const t = state.mod3Time;
      const tColl = M3_tColl;
      const m1 = M3_m1, m2 = M3_m2, v1 = M3_v1, v2 = M3_v2;
      const vc = (m1 * v1 + m2 * v2) / (m1 + m2);
      const u1 = v1 - vc, u2 = v2 - vc;
      const v1Post = 2 * vc - v1, v2Post = 2 * vc - v2;
      const isPost = t > tColl;

      const topH = 130; 
      const topY = 12;
      const cardW = Math.min(380, (w - 36) / 2);
      drawCard(14, topY, cardW, topH, 8, '地面参考系 K (实验系)');
      ctx.save();
      ctx.textBaseline = 'top'; 
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`质心速度 v_c = ${vc.toFixed(1)} px/s (恒定向右)`, 26, topY + 48);
      ctx.fillText(`碰撞前: v₁=${v1}, v₂=${v2}`, 26, topY + 74);
      ctx.fillText(`碰撞后: v₁'=${v1Post.toFixed(1)}, v₂'=${v2Post.toFixed(1)}`, 26, topY + 100);
      ctx.restore();

      const rx = 14 + cardW + 8;
      const rw = Math.min(cardW, w - rx - 14);
      if (rw > 140) {
        drawCard(rx, topY, rw, topH, 8, '质心平动参考系 K\'');
        ctx.save();
        ctx.textBaseline = 'top'; 
        ctx.font = '13px ui-monospace, monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`质心在 K' 中严格静止: x'_c ≡ 0`, rx + 20, topY + 48);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`总动量恒为 0: m₁u₁ + m₂u₂ ≡ 0`, rx + 20, topY + 74);
        ctx.fillText(`对心弹性反弹: u' = -u`, rx + 20, topY + 100);
        ctx.restore();
      }

      const availableH = h - (topY + topH + 12) - 18;
      const panelH = Math.max(160, availableH / 2);

      // ==== 面板① ====
      const y1 = topY + topH + 12;
      drawCard(14, y1, w - 28, panelH, 8, '① 地面参考系 K：真实空间运动');
      ctx.save();
      ctx.beginPath();
      ctx.rect(14, y1 + 40, w - 28, panelH - 40);
      ctx.clip(); 

      const cy1 = y1 + panelH * 0.6;
      const scale = Math.min(1, (w - 60) / 600);
      const x1 = isPost ? (v1Post * (t - tColl)) : (v1 * (t - tColl));
      const x2 = isPost ? (v2Post * (t - tColl)) : (v2 * (t - tColl));
      const xC = vc * (t - tColl);
      const cx = w / 2;

      const p1X = cx + x1 * scale - 18; 
      const p2X = cx + x2 * scale + 18;
      const cX = cx + xC * scale;

      ctx.save();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(28, cy1 + 22);
      ctx.lineTo(w - 28, cy1 + 22);
      ctx.stroke();

      drawCMSymbol(cX, cy1 + 34, 7, '#f43f5e');
      ctx.strokeStyle = '#f43f5e';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cX, cy1 - 38);
      ctx.lineTo(cX, cy1 + 34);
      ctx.stroke();
      ctx.setLineDash([]);
      drawVector(cX, cy1 + 34, vc * 0.4 * scale, 0, '#f43f5e', `v_c`, true);
      ctx.restore();

      const drawBody = (x, color, label, vVal) => {
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x - 18, cy1 - 18, 36, 36, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = 'italic bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, cy1);
        drawVector(x, cy1 - 32, vVal * 0.35 * scale, 0, color, `${vVal.toFixed(0)}`);
        ctx.restore();
      };
      drawBody(p1X, '#38bdf8', 'm₁', isPost ? v1Post : v1);
      drawBody(p2X, '#fbbf24', 'm₂', isPost ? v2Post : v2);
      
      if (Math.abs(t - tColl) < 0.05) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath(); ctx.arc(cx, cy1, 30, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore(); 

      // ==== 面板② ====
      const y2 = y1 + panelH + 10;
      drawCard(14, y2, w - 28, panelH, 8, '② 质心参考系 K\'：以质心为原点，大小相等、动量抵消的反向反弹');
      ctx.save(); 
      ctx.beginPath();
      ctx.rect(14, y2 + 40, w - 28, panelH - 40);
      ctx.clip(); 

      const cy2 = y2 + panelH * 0.6;
      const u1Curr = isPost ? -u1 : u1;
      const u2Curr = isPost ? -u2 : u2;
      const p1X_rel = cx + (u1Curr * (t - tColl)) * scale - 18;
      const p2X_rel = cx + (u2Curr * (t - tColl)) * scale + 18;

      ctx.save(); 
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(28, cy2 + 22);
      ctx.lineTo(w - 28, cy2 + 22);
      ctx.stroke();

      drawCMSymbol(cx, cy2 + 34, 7, '#38bdf8');
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy2 - 38);
      ctx.lineTo(cx, cy2 + 34);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('x\'_c ≡ 0', cx, cy2 + 50);
      ctx.restore(); 

      const drawRelBody = (x, color, label, uVal) => {
        ctx.save(); 
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x - 18, cy2 - 18, 36, 36, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = 'italic bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, cy2);
        drawVector(x, cy2 - 32, uVal * 0.35 * scale, 0, color, `u=${uVal.toFixed(0)}`);
        ctx.restore();
      };
      
      drawRelBody(p1X_rel, '#38bdf8', 'm₁', u1Curr);
      drawRelBody(p2X_rel, '#fbbf24', 'm₂', u2Curr);

      if (Math.abs(t - tColl) < 0.05) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath(); ctx.arc(cx, cy2, 30, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore(); 
    };

    // =========================================================================
    // 模块 4：质心 vs 重心
    // =========================================================================
    const renderModule4 = (w, h) => {
      const { gradForce: gf, rodAngle: ra } = physics.current;
      const cx = w / 2;
      const cy = Math.max(320, h * 0.62); 
      physics.current.centerAnchorY = cy;

      const topH = 160; 
      const topY = 14;
      const cardW = Math.min(580, w - 28);
      drawCard(14, topY, cardW, topH, 8, 'Poinsot 力系简化：连续体力矩中心与重心漂移');
      ctx.save();
      ctx.textBaseline = 'top'; 
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('质心 r_c = (∑ m_i·r_i) / M ≡ 0 (由物体自身质量分布唯一决定)', 28, topY + 52);
      ctx.fillText('重心 r_G = (∑ m_i·g(r_i)·r_i) / (∑ m_i·g(r_i)) (受外引力场分布调制)', 28, topY + 80);
      ctx.fillStyle = gf > 0 ? '#f43f5e' : '#38bdf8';
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.fillText(
        gf > 0
          ? '【梯度引力场】下部场强显著大于上部，等效合力作用点 G 向强场区滑移！'
          : '【均匀引力场】各处 g 严格恒定，合力作用点与几何质心精确重合。',
        28, topY + 112
      );
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, topY + topH + 10, w, h - (topY + topH + 10));
      ctx.clip();

      ctx.save();
      ctx.translate(cx, cy);

      const rad = (ra * Math.PI) / 180;
      const spacing = Math.min(46, (w - 80) / 10);
      const points = [-3, -2, -1, 0, 1, 2, 3];
      const g0 = 30; 

      ctx.save();
      ctx.rotate(rad);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-3.4 * spacing, -15, 6.8 * spacing, 30, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      let sumG = 0, sumMom = 0;
      points.forEach(i => {
        const d = i * spacing;
        const x = d * Math.cos(rad);
        const y = d * Math.sin(rad);
        const gLocal = g0 + gf * y * 1.2;
        sumG += gLocal;
        sumMom += d * gLocal;

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        drawVector(x, y, 0, gLocal * 1.2, 'rgba(148, 163, 184, 0.8)', '');
      });

      const s_G = sumMom / sumG;
      const x_G = s_G * Math.cos(rad);
      const y_G = s_G * Math.sin(rad);

      drawCMSymbol(0, 0, 9, '#38bdf8');
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px serif';
      ctx.fillText('C', -24, -10);

      if (Math.abs(s_G) > 0.5) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x_G, y_G);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(x_G, y_G, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 16px serif';
      ctx.fillText('G', x_G + 14, y_G + 14);

      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.fillStyle = gf > 0 ? '#f43f5e' : '#38bdf8';
      ctx.textAlign = 'left';
      ctx.fillText(gf > 0 ? `重心偏移量 Δr = ${Math.abs(s_G).toFixed(1)} px` : 'r_G ≡ r_c', x_G + 14, y_G - 10);

      ctx.restore();
      ctx.restore(); 
    };

    const render = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      updatePhysics(dt);

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      
      ctx.clearRect(0, 0, w, h);
      drawGrid(w, h);

      const tab = physics.current.activeTab;
      if (tab === 0) renderModule1(w, h);
      else if (tab === 1) renderModule2(w, h);
      else if (tab === 2) renderModule3(w, h);
      else if (tab === 3) renderModule4(w, h);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [getWalkLength]);

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    physics.current.isDragging = true;
    const rect = canvas.getBoundingClientRect();
    physics.current.pointerX = e.clientX - rect.left;
    physics.current.pointerY = e.clientY - rect.top;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!physics.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    physics.current.pointerX = mouseX;
    physics.current.pointerY = mouseY;

    if (activeTab === 3) {
      const cx = rect.width / 2;
      const cy = physics.current.centerAnchorY || (rect.height / 2);
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      else if (angle < -90) angle += 180;
      angle = Math.max(-80, Math.min(80, angle));
      physics.current.rodAngle = angle;
      setRodAngle(angle);
    }
  };

  const handlePointerUp = (e) => {
    physics.current.isDragging = false;
    try {
      if (e.pointerId != null && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  const tabs = [
    '1. 人船模型 (例 2)',
    '2. 柯尼希定理 (例 3)',
    '3. 碰撞双系 (例 1)',
    '4. 质心 vs 重心 (Poinsot)'
  ];

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#020617] border border-slate-800 rounded-2xl shadow-2xl select-none font-sans flex flex-col my-4">
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 font-mono tracking-wide">
            多质点系动力学 · 仿真平台
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            Rigorous Classical Mechanics Simulation · V12.0 Final
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-full self-start sm:self-auto shadow-inner">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <span className="text-xs font-mono text-slate-300 font-semibold tracking-wider">ENGINE ACTIVE</span>
        </div>
      </div>

      {/* 核心修复区：shrink-0 与 md:flex-1 组合彻底告别溢出吞字 */}
      <div className="flex bg-slate-900/40 border-b border-slate-800 overflow-x-auto scrollbar-none">
        {tabs.map((title, index) => (
          <button
            key={title}
            onClick={() => { setActiveTab(index); resetSimulation(); }}
            className={`shrink-0 md:flex-1 min-w-max py-4 px-6 text-sm md:text-base font-semibold tracking-wider transition-all border-b-2 whitespace-nowrap
              ${activeTab === index
                ? 'border-sky-500 text-sky-400 bg-slate-800/60 shadow-[inset_0_-2px_12px_rgba(14,165,233,0.15)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
          >
            {title}
          </button>
        ))}
      </div>

      <div className="relative w-full h-[650px] md:h-[720px] bg-[#020617] overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full touch-none ${(activeTab === 0 || activeTab === 3) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
        {activeTab === 0 && (
          <div className="flex flex-wrap items-center gap-4 text-sm w-full justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono text-slate-300 font-semibold text-sm md:text-base">质量比 m/M: {massRatio.toFixed(2)}</span>
              <input
                type="range" min="0.1" max="2.0" step="0.05"
                value={massRatio}
                onChange={(e) => setMassRatio(parseFloat(e.target.value))}
                className="w-32 md:w-56 accent-sky-500 cursor-pointer"
              />
            </div>
            <span className="text-sky-400 font-bold tracking-wide">💡 提示：在画布上按住并左右拖动火柴人</span>
          </div>
        )}

        {(activeTab === 1 || activeTab === 2) && (
          <div className="flex items-center gap-3 w-full justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-6 py-2 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500 text-sky-200 text-sm font-mono font-bold rounded-lg transition-all shadow-lg"
              >
                {isPlaying ? '■ 暂停' : '▶ 播放'}
              </button>
              <button
                onClick={resetSimulation}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-sm font-mono font-bold rounded-lg transition-all"
              >
                重置
              </button>
            </div>
            <span className="text-slate-400 text-sm font-mono hidden md:block tracking-wide">
              {activeTab === 1
                ? '特性：半周期回复原长后弹簧停止伸展，A 以更大速度飞离脱开'
                : '特性：质心参考系中动量严格为零，碰撞前后大小相等'}
            </span>
          </div>
        )}

        {activeTab === 3 && (
          <div className="flex flex-wrap items-center gap-4 text-sm w-full justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono text-slate-300 font-bold">外引力场分布:</span>
              <button
                onClick={() => setGradForce(0)}
                className={`px-4 py-1.5 rounded-md text-sm font-mono font-bold border transition-all ${gradForce === 0 ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-md' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}
              >
                均匀引力场
              </button>
              <button
                onClick={() => setGradForce(0.25)}
                className={`px-4 py-1.5 rounded-md text-sm font-mono font-bold border transition-all ${gradForce > 0 ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}
              >
                线性梯度场
              </button>
            </div>
            <span className="text-sky-400 font-bold tracking-wide">💡 提示：在画布内直接拖拽刚体绕质心旋转</span>
          </div>
        )}
      </div>
    </div>
  );
}