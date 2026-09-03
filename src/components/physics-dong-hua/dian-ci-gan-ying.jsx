'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * ============================================================================
 * 法拉第电磁感应实验室 PRO (Ultimate Edition)
 * Faraday Electromagnetic Induction Laboratory
 * ============================================================================
 */

export default function FaradayLawSimulation() {
  const canvasRef = useRef(null);

  const [activeTab, setActiveTab] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  const physics = useRef({
    magnetX: 120,
    targetX: 120,
    velocity: 0,
    
    flux: 0,
    dFluxDt: 0,
    emf: 0,
    
    coilX: 550,
    coilR: 60,
    fluxMax: 120, 
    
    time: 0,
    history: [],
    
    isDragging: false,
    pointerX: 120,
    
    needleAngle: 0,
    needleVelocity: 0,
    
    currentIntensity: 0,
    fieldFlowOffset: 0, 
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); 
    
    let animationId;
    let lastTime = performance.now();

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // =========================================================================
    // 物理引擎核心 
    // =========================================================================
    const updatePhysics = (dtMs) => {
      const state = physics.current;
      let dt = Math.max(0.001, Math.min(dtMs / 1000, 0.05)); 
      state.time += dt;
      state.fieldFlowOffset += dt * 30; 

      if (state.isDragging) {
        state.targetX = Math.max(90, Math.min(state.pointerX, 780));
      }

      const previousX = state.magnetX;
      const dampingForce = Math.abs(state.dFluxDt) * 0.015; 
      const baseSpeed = state.isDragging ? 25 : 8;
      const followSpeed = Math.max(3, baseSpeed - dampingForce); 
      
      state.magnetX += (state.targetX - state.magnetX) * Math.min(1, followSpeed * dt);
      
      const rawVelocity = (state.magnetX - previousX) / dt;
      state.velocity += (Math.max(-3000, Math.min(3000, rawVelocity)) - state.velocity) * (state.isDragging ? 0.6 : 0.2);

      state.coilX = activeTab === 2 ? 350 : 550;

      const dx = state.magnetX - state.coilX;
      const R = state.coilR;
      const C = state.fluxMax * Math.pow(R, 3);
      const distSq = dx * dx + R * R;
      
      state.flux = C / Math.pow(distSq, 1.5);

      const dFluxDx = -3 * dx * C / Math.pow(distSq, 2.5);
      state.dFluxDt = dFluxDx * state.velocity;
      state.emf = -state.dFluxDt * 0.08;

      const targetCurrent = Math.min(Math.abs(state.emf) / 12, 1);
      state.currentIntensity += (targetCurrent - state.currentIntensity) * 0.15;

      const targetAngle = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, state.emf * 0.045));
      const spring = 180;  
      const damping = 16;  
      state.needleVelocity += ((targetAngle - state.needleAngle) * spring - state.needleVelocity * damping) * dt;
      state.needleAngle += state.needleVelocity * dt;

      state.history.push({ t: state.time, flux: state.flux, emf: state.emf });
      if (state.history.length > (activeTab === 2 ? 400 : 50)) state.history.shift();
    };

    // =========================================================================
    // 渲染系统 
    // =========================================================================
    const drawBackground = (state, width, height) => {
      ctx.fillStyle = '#020617'; 
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.05)';
      ctx.lineWidth = 1;
      const grid = 40;
      ctx.beginPath();
      for (let x = (state.time * 10) % grid; x < width; x += grid) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += grid) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
      }
      ctx.stroke();

      const ambientGlow = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width*0.8);
      ambientGlow.addColorStop(0, 'rgba(8, 145, 178, 0.08)');
      ambientGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    };

    const drawMagnet = (x, y) => {
      ctx.save();
      const w = 150, h = 50, r = 8;
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;

      const gradS = ctx.createLinearGradient(x - w/2, y - h/2, x, y + h/2);
      gradS.addColorStop(0, '#3b82f6'); gradS.addColorStop(0.5, '#2563eb'); gradS.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = gradS;
      ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w/2, h, [r, 0, 0, r]); ctx.fill();

      const gradN = ctx.createLinearGradient(x, y - h/2, x + w/2, y + h/2);
      gradN.addColorStop(0, '#ef4444'); gradN.addColorStop(0.5, '#dc2626'); gradN.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = gradN;
      ctx.beginPath(); ctx.roundRect(x, y - h/2, w/2, h, [0, r, r, 0]); ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath(); ctx.roundRect(x - w/2 + 2, y - h/2 + 2, w - 4, h*0.35, r-2); ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y - h/2); ctx.lineTo(x, y + h/2); ctx.stroke();
      
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '900 24px "SF Pro Display", sans-serif';
      
      ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 10; ctx.fillStyle = '#ffffff';
      ctx.fillText('S', x - w/4, y + 2);
      
      ctx.shadowColor = '#f87171'; ctx.shadowBlur = 10;
      ctx.fillText('N', x + w/4, y + 2);

      ctx.restore();
    };

    const drawAnimatedMagneticField = (x, y) => {
      ctx.save();
      const state = physics.current;
      const alpha = 0.35;
      
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.setLineDash([15, 10]);
      ctx.lineDashOffset = -state.fieldFlowOffset; 

      const drawHUDChevron = (cx, cy, angle, rgbColor) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.setLineDash([]); 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(-6, -6);
        ctx.lineTo(2, 0);
        ctx.lineTo(-6, 6);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(${rgbColor}, 0.9)`;
        ctx.shadowColor = `rgba(${rgbColor}, 1)`;
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-13, -6);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-13, 6);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(${rgbColor}, 0.3)`;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.restore();
      };

      const spreads = [35, 70, 115, 170];
      
      spreads.forEach((spread) => {
        [-1, 1].forEach((dir) => {
          const grad = ctx.createLinearGradient(x, y, x + 200, y + dir*spread);
          grad.addColorStop(0, `rgba(239,68,68,${alpha})`);
          grad.addColorStop(1, `rgba(59,130,246,${alpha/2})`);
          ctx.strokeStyle = grad;

          ctx.beginPath();
          ctx.moveTo(x + 75, y);
          ctx.bezierCurveTo(
            x + 160, y + dir * spread * 1.2,
            x - 160, y + dir * spread * 1.2,
            x - 75, y
          );
          ctx.stroke();

          const apexX = x; 
          const apexY = y + dir * spread * 0.9;
          drawHUDChevron(apexX, apexY, Math.PI, '217, 70, 239'); 
        });
      });

      ctx.strokeStyle = `rgba(239,68,68,${alpha})`;
      ctx.beginPath(); ctx.moveTo(x + 76, y); ctx.lineTo(x + 300, y); ctx.stroke();
      drawHUDChevron(x + 180, y, 0, '239, 68, 68'); 

      ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
      ctx.beginPath(); ctx.moveTo(x - 76, y); ctx.lineTo(x - 300, y); ctx.stroke();
      drawHUDChevron(x - 180, y, 0, '59, 130, 246'); 

      ctx.restore();
    };

    const drawCoil3D = (x, y, isFront) => {
      const state = physics.current;
      const intensity = state.currentIntensity;
      const emf = state.emf;
      const turns = 7;
      
      ctx.save();
      
      if (isFront && intensity > 0.05) {
        ctx.shadowColor = emf > 0 ? '#06b6d4' : '#f43f5e'; 
        ctx.shadowBlur = 10 + intensity * 30;
      }

      for (let i = -Math.floor(turns/2); i <= Math.floor(turns/2); i++) {
        const offset = i * 14;
        
        const grad = ctx.createLinearGradient(x + offset, y - 80, x + offset, y + 80);
        if (isFront) {
          grad.addColorStop(0, '#fcd34d'); grad.addColorStop(0.5, '#d97706'); grad.addColorStop(1, '#92400e');
        } else {
          grad.addColorStop(0, '#78350f'); grad.addColorStop(1, '#451a03');
        }
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 5;
        
        ctx.beginPath();
        ctx.ellipse(x + offset, y, 28, 80, 0, -Math.PI / 2, Math.PI / 2, !isFront);
        ctx.stroke();

        if (isFront && intensity > 0.1) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x + offset, y, 28, 80, 0, -Math.PI / 2, Math.PI / 2, false);
          ctx.stroke();
        }
      }

      if (isFront && intensity > 0.1) {
        const dir = emf > 0 ? 1 : -1;
        const arrowColor = emf > 0 ? '#06b6d4' : '#f43f5e';
        const arrowY = y + dir * 50;

        ctx.shadowColor = arrowColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = arrowColor;
        
        ctx.beginPath();
        ctx.moveTo(x + 28, arrowY);
        ctx.lineTo(x + 18, arrowY - dir * 12);
        ctx.lineTo(x + 38, arrowY - dir * 12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    };

    const drawHUDGalvanometer = (x, y, angle) => {
      const gy = y + 160;
      ctx.save();

      ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x - 42, y + 80); ctx.lineTo(x - 42, gy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 42, y + 80); ctx.lineTo(x + 42, gy); ctx.stroke();

      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
      const bgGrad = ctx.createLinearGradient(x, gy - 70, x, gy + 70);
      bgGrad.addColorStop(0, '#1e293b'); bgGrad.addColorStop(1, '#020617');
      
      ctx.fillStyle = bgGrad;
      ctx.beginPath(); ctx.arc(x, gy, 70, 0, Math.PI * 2); ctx.fill();
      
      ctx.lineWidth = 2; ctx.strokeStyle = '#475569'; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, gy, 62, 0, Math.PI * 2); 
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 6; ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 20; i++) {
        const a = Math.PI + (Math.PI * i) / 20;
        const r1 = i % 5 === 0 ? 45 : 52;
        const r2 = 58;
        ctx.strokeStyle = i === 10 ? '#38bdf8' : (i < 10 ? '#f43f5e' : '#06b6d4');
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r1, gy + Math.sin(a) * r1);
        ctx.lineTo(x + Math.cos(a) * r2, gy + Math.sin(a) * r2);
        ctx.stroke();
      }

      ctx.fillStyle = '#94a3b8'; ctx.font = '12px "SF Pro Display", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('-', x - 50, gy - 10);
      ctx.fillText('0', x, gy - 50);
      ctx.fillText('+', x + 50, gy - 10);
      ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 16px sans-serif';
      ctx.fillText('µA', x, gy + 25);

      ctx.translate(x, gy);
      ctx.rotate(angle);
      
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(0, -55); ctx.lineTo(3, 5); ctx.closePath(); ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    };

    const drawOscilloscope = (state, width, height) => {
      const padX = 20, padY = 20;
      const gX = width - 420;
      const gW = 380, gH = 200;
      const gY1 = padY, gY2 = padY + gH + 20;

      const drawScopeFrame = (x, y, w, h, title, color) => {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
          ctx.moveTo(x, y + h*i/4); ctx.lineTo(x+w, y + h*i/4);
        }
        for (let i = 1; i < 6; i++) {
          ctx.moveTo(x + w*i/6, y); ctx.lineTo(x + w*i/6, y+h);
        }
        ctx.stroke();

        ctx.shadowColor = color; ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x + 20, y + 25, 4, 0, Math.PI*2); ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(title, x + 32, y + 25);
        ctx.restore();
      };

      drawScopeFrame(gX, gY1, gW, gH, '磁通量 Φ(t) 实时曲线', '#06b6d4');
      drawScopeFrame(gX, gY2, gW, gH, '感应电动势 ε(t) = -dΦ/dt', '#f43f5e');

      if (state.history.length < 2) return;

      const currentT = state.history[state.history.length - 1].t;
      const windowTime = 4; 

      const renderWaveform = (yOffset, h, valueExtractor, maxVal, color, isBipolar) => {
        ctx.save();
        ctx.beginPath(); ctx.rect(gX, yOffset + 40, gW, h - 40); ctx.clip();
        
        ctx.beginPath();
        let firstX = null, lastX = null;

        state.history.forEach((pt) => {
          const x = gX + gW - ((currentT - pt.t) / windowTime) * gW;
          if (x < gX) return;
          
          let norm = pt[valueExtractor] / maxVal;
          if (isBipolar) norm = Math.max(-1, Math.min(1, norm)); 
          else norm = Math.max(0, Math.min(1, norm));

          const y = isBipolar 
            ? yOffset + 40 + (h - 40)/2 - norm * ((h-40)/2 - 10)
            : yOffset + h - 10 - norm * (h - 50);

          if (firstX === null) { ctx.moveTo(x, y); firstX = x; } 
          else { ctx.lineTo(x, y); }
          lastX = x;
        });

        ctx.strokeStyle = color; ctx.lineWidth = 2.5;
        ctx.shadowColor = color; ctx.shadowBlur = 10;
        ctx.stroke();

        if (firstX !== null && lastX !== null) {
          ctx.shadowColor = 'transparent';
          const baseY = isBipolar ? yOffset + 40 + (h-40)/2 : yOffset + h - 10;
          ctx.lineTo(lastX, baseY); ctx.lineTo(firstX, baseY);
          
          const fillAlpha = isBipolar ? 0.15 : 0.25;
          const grad = ctx.createLinearGradient(0, yOffset + 40, 0, yOffset + h);
          grad.addColorStop(0, color.replace(')', `, ${fillAlpha})`).replace('rgb', 'rgba'));
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = grad;
          ctx.fill();
        }
        
        if (lastX) {
          ctx.beginPath();
          ctx.arc(lastX, isBipolar ? yOffset + 40 + (h - 40)/2 - Math.max(-1, Math.min(1, state[valueExtractor]/maxVal)) * ((h-40)/2 - 10) : yOffset + h - 10 - Math.max(0, Math.min(1, state[valueExtractor]/maxVal)) * (h - 50), 4, 0, Math.PI*2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 12;
          ctx.fill();
        }
        ctx.restore();
      };

      renderWaveform(gY1, gH, 'flux', state.fluxMax, 'rgb(6, 182, 212)', false);
      renderWaveform(gY2, gH, 'emf', 100, 'rgb(244, 63, 94)', true);
    };

    // 重构 HUD 布局：水平展开，放置于顶部安全区，彻底解决遮挡问题
    const drawHUDPanel = (state, width) => {
      ctx.save();
      const isMobile = width < 700;
      const w = isMobile ? Math.max(width - 40, 300) : 720;
      const h = isMobile ? 100 : 60;
      const x = (width - w) / 2;
      const y = 20;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
      
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.roundRect(x, y + 15, 4, h - 30, 2); ctx.fill();

      ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 15px "SF Pro Display", sans-serif';
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText('实时物理数据', x + 15, isMobile ? y + 25 : y + 30);
      
      ctx.font = '13px "Roboto Mono", monospace';
      
      if (isMobile) {
        ctx.fillStyle = '#64748b'; ctx.fillText('速度(v):', x + 15, y + 55);
        ctx.fillStyle = '#38bdf8'; ctx.fillText(`${Math.abs(state.velocity).toFixed(0)} px/s`, x + 75, y + 55);
        
        ctx.fillStyle = '#64748b'; ctx.fillText('磁通量(Φ):', x + 160, y + 55);
        ctx.fillStyle = '#06b6d4'; ctx.fillText(`${state.flux.toFixed(2)} Wb`, x + 235, y + 55);

        ctx.fillStyle = '#64748b'; ctx.fillText('感应电动势(ε):', x + 15, y + 80);
        ctx.fillStyle = Math.abs(state.emf) > 5 ? '#f43f5e' : '#94a3b8'; 
        ctx.fillText(`${Math.abs(state.emf).toFixed(2)} V`, x + 115, y + 80);
      } else {
        const drawDataRow = (offsetX, label, val, unit, color) => {
          ctx.fillStyle = '#64748b'; ctx.fillText(label, x + 130 + offsetX, y + 30);
          ctx.fillStyle = color; ctx.fillText(`${val} ${unit}`, x + 130 + offsetX + ctx.measureText(label).width + 5, y + 30);
        };
        drawDataRow(0, '磁铁运动速度 (v):', Math.abs(state.velocity).toFixed(0), 'px/s', '#38bdf8');
        drawDataRow(210, '线圈磁通量 (Φ):', state.flux.toFixed(2), 'Wb', '#06b6d4');
        drawDataRow(400, '感应电动势 (ε):', Math.abs(state.emf).toFixed(2), 'V', Math.abs(state.emf) > 5 ? '#f43f5e' : '#94a3b8');
      }

      ctx.restore();
    };

    // =========================================================================
    // 渲染主循环 
    // =========================================================================
    const render = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      const state = physics.current;

      updatePhysics(dt);

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      
      // 【核心优化】：将基准Y轴(cy)下调至 250，为顶部的 HUD 留出安全的防遮挡净空区
      const cy = activeTab === 2 ? 180 : 250; 

      ctx.clearRect(0, 0, width, height);
      drawBackground(state, width, height);

      drawAnimatedMagneticField(state.magnetX, cy);
      drawCoil3D(state.coilX, cy, false);
      drawMagnet(state.magnetX, cy);
      drawCoil3D(state.coilX, cy, true);

      if (activeTab === 0) {
        drawHUDGalvanometer(state.coilX, cy, state.needleAngle);
        drawHUDPanel(state, width);
      } else if (activeTab === 1) {
        drawHUDGalvanometer(state.coilX, cy, state.needleAngle);
        
        ctx.save();
        const isMobile = width < 700;
        const w = isMobile ? Math.max(width - 40, 300) : 600;
        const h = isMobile ? 80 : 60;
        const x = (width - w) / 2;
        const y = 20;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('楞次定律实时分析', x + 20, isMobile ? y + 25 : y + 30);
        
        ctx.fillStyle = '#cbd5e1'; ctx.font = '14px sans-serif';
        const msg = Math.abs(state.dFluxDt) < 1 ? '系统处于稳定状态，无明显电磁感应' : (state.dFluxDt > 0 ? '磁通量 Φ 增加 → 产生阻碍其增加的反向磁场' : '磁通量 Φ 减小 → 产生阻碍其减小的同向磁场');
        const subMsg = Math.abs(state.dFluxDt) < 1 ? '' : (state.dFluxDt > 0 ? '【增反】' : '【减同】');
        
        if (isMobile) {
            ctx.fillText(msg, x + 20, y + 55);
            ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 14px sans-serif';
            ctx.fillText(subMsg, x + 20 + ctx.measureText(msg).width + 5, y + 55);
        } else {
            ctx.fillText(msg, x + 160, y + 30);
            ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 14px sans-serif';
            ctx.fillText(subMsg, x + 160 + ctx.measureText(msg).width + 5, y + 30);
        }
        ctx.restore();

      } else if (activeTab === 2) {
        drawOscilloscope(state, width, height);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resizeCanvas); };
  }, [activeTab]);

  // ==========================================================================
  // 交互逻辑
  // ==========================================================================
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    physics.current.isDragging = true;
    physics.current.pointerX = e.clientX - rect.left;
    setIsMoving(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!physics.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    physics.current.pointerX = e.clientX - canvas.getBoundingClientRect().left;
  };

  const handlePointerUp = (e) => {
    physics.current.isDragging = false;
    setIsMoving(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  const tabs = ['1. 产生条件', '2. 楞次定律', '3. 法拉第定律'];

  return (
    <div className="w-full max-w-6xl mx-auto overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-cyan-900/20 select-none font-sans flex flex-col">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-wider text-slate-100 uppercase">
              Faraday Engine Pro
            </h2>
            <p className="mt-1 text-[10px] md:text-xs tracking-[0.25em] text-cyan-500 font-mono">
              电磁感应现象与法拉第定律仿真引擎 V2.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/80">
          <span className={`relative flex h-3 w-3`}>
            {isMoving && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isMoving ? 'bg-rose-500' : 'bg-slate-600'}`}></span>
          </span>
          <span className="text-xs font-mono text-slate-400 font-semibold tracking-widest">
            {isMoving ? '磁通量变化中 (ACTIVE)' : '系统待机 (IDLE)'}
          </span>
        </div>
      </div>

      <div className="p-3 bg-slate-950 flex flex-wrap gap-3">
        {tabs.map((title, index) => (
          <button
            key={title}
            onClick={() => setActiveTab(index)}
            className={`
              flex-1 rounded-xl py-3 text-xs md:text-sm font-bold tracking-wide transition-all duration-300 border
              ${activeTab === index
                ? (index === 1 ? 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]')
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
              }
            `}
          >
            {title}
          </button>
        ))}
      </div>

      <div className="relative w-full h-[520px] bg-[#020617] touch-none cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        
        {!isMoving && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="px-6 py-2 rounded-full border border-slate-700 bg-slate-900/60 backdrop-blur text-xs tracking-widest text-slate-400 animate-pulse">
              [ 左右拖动磁铁 模拟闭合回路磁通量变化 ]
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-950 border-t border-slate-800 divide-y md:divide-y-0 md:divide-x divide-slate-800">
        <div className="p-5 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 font-mono tracking-widest mb-1">模块 01</span>
          <h3 className="text-sm font-bold text-slate-300">产生条件：磁通量必须变化</h3>
          <p className="text-xs text-slate-500 mt-2">只有当闭合回路中的磁通量发生改变时，才会激发感应电流。静止时不产生电流。</p>
        </div>
        <div className="p-5 flex flex-col justify-center">
          <span className="text-[10px] text-rose-500/70 font-mono tracking-widest mb-1">模块 02</span>
          <h3 className="text-sm font-bold text-rose-400">楞次定律：阻碍变化</h3>
          <p className="text-xs text-slate-500 mt-2">感应电流产生的磁场，总是阻碍引起感应电流的磁通量变化 (即"增反减同")。</p>
        </div>
        <div className="p-5 flex flex-col justify-center bg-cyan-950/10">
          <span className="text-[10px] text-cyan-500/70 font-mono tracking-widest mb-1">模块 03</span>
          <h3 className="text-sm font-bold text-cyan-400">法拉第定律：定量计算</h3>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>感应电动势与磁通量变化率成正比。</span>
            <span className="font-serif italic font-bold text-lg text-cyan-300 ml-2 border border-cyan-800 px-2 py-0.5 rounded">ε = -dΦ/dt</span>
          </p>
        </div>
      </div>
    </div>
  );
}