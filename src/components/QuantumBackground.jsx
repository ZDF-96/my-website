'use client';

import { useEffect, useRef } from 'react';

export default function QuantumBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    let width = 0, height = 0;
    let drawCx = 0, drawCy = 0;
    let targetCx = 0, targetCy = 0;
    let time = 0;
    let pulses = [];
    let burstParticles = [];
    let mouseGlow = 0; // 恢复鼠标辉光
    const MAX_BURST = 300;

    const CONFIG = {
      particleCount: 400, // 增加粒子数量以配合纠缠连线
      baseRadius: 200,
      colors: [
        { r: 34, g: 211, b: 238 }, { r: 99, g: 102, b: 241 }, { r: 168, g: 85, b: 247 },
        { r: 255, g: 70, b: 180 }, { r: 45, g: 212, b: 191 }, { r: 255, g: 180, b: 60 }
      ]
    };

    let particles = [];
    let rings = [];

    // 高效计算距离平方（优化性能）
    function distSq(x1, y1, x2, y2) {
      const dx = x1 - x2;
      const dy = y1 - y2;
      return dx * dx + dy * dy;
    }

    class FluidParticle {
      constructor() { this.reset(true); }
      reset(init) {
        if (init && width > 0 && height > 0) {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
        } else {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * CONFIG.baseRadius * 0.8;
          this.x = drawCx + Math.cos(a) * r;
          this.y = drawCy + Math.sin(a) * r;
        }
        this.z = Math.random() * 2.5 + 0.4;
        this.speed = (Math.random() * 0.35 + 0.06) / this.z;
        this.size = (Math.random() * 0.7 + 0.1) / this.z;
        this.life = 0;
        this.maxLife = Math.random() * 550 + 280;
        this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
        this.noiseScale = Math.random() * 0.0025 + 0.0006;
        this.noiseOffset = Math.random() * 1000;
        this.history = [];
      }
      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 60 / this.z) this.history.shift();
        
        const nx = Math.cos(this.y * this.noiseScale + time * 0.00035 + this.noiseOffset);
        const ny = Math.sin(this.x * this.noiseScale + time * 0.00035 + this.noiseOffset);
        this.x += nx * this.speed * 2.8;
        this.y += ny * this.speed * 2.8;

        const dx = targetCx - this.x, dy = targetCy - this.y;
        if (distSq(this.x, this.y, targetCx, targetCy) > 1) { 
          const f = 0.00025 / this.z; 
          this.x += dx * f; 
          this.y += dy * f; 
        }

        for (const p of pulses) {
          const pdx = this.x - p.x, pdy = this.y - p.y;
          const pdistSq = pdx * pdx + pdy * pdy;
          const radiusSq = p.radius * p.radius;
          const innerRadiusSq = Math.pow(Math.max(0, p.radius - 120), 2);

          if (pdistSq < radiusSq && pdistSq > innerRadiusSq) {
            const pdist = Math.sqrt(pdistSq);
            const force = (1 - pdist / p.radius) * p.strength / this.z;
            this.x += (pdx / pdist) * force; this.y += (pdy / pdist) * force;
          }
        }
        this.life++;
        if (this.life > this.maxLife || this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) {
          this.reset(false);
        }
      }
      draw() {
        let opacity = 1;
        const ratio = 0.28;
        if (this.life < this.maxLife * ratio) opacity = this.life / (this.maxLife * ratio);
        else if (this.life > this.maxLife * (1 - ratio)) opacity = (this.maxLife - this.life) / (this.maxLife * ratio);
        opacity *= (0.55 / this.z);
        if (opacity < 0.006) return;

        if (this.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(this.history[0].x, this.history[0].y);
          for (let i = 1; i < this.history.length; i++) {
            const xc = (this.history[i].x + this.history[i - 1].x) / 2;
            const yc = (this.history[i].y + this.history[i - 1].y) / 2;
            ctx.quadraticCurveTo(this.history[i - 1].x, this.history[i - 1].y, xc, yc);
          }
          ctx.lineTo(this.x, this.y);
          ctx.strokeStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${opacity})`;
          ctx.lineWidth = this.size * 1.6;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${opacity * 0.25})`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
        ctx.fill();
      }
    }

    class BurstParticle {
      constructor(x, y, color) {
        this.x = x; this.y = y;
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 10 + 4;
        this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
        this.life = 0;
        this.maxLife = Math.random() * 70 + 50;
        this.size = Math.random() * 2.2 + 0.8;
        this.color = color || CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
        this.history = [];
      }
      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 6) this.history.shift();
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.97; this.vy *= 0.97;
        this.life++;
        return this.life < this.maxLife && this.x > -200 && this.x < width + 200 && this.y > -200 && this.y < height + 200;
      }
      draw() {
        const opacity = (1 - this.life / this.maxLife) * 0.9;
        if (this.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(this.history[0].x, this.history[0].y);
          for (let i = 1; i < this.history.length; i++) ctx.lineTo(this.history[i].x, this.history[i].y);
          ctx.strokeStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${opacity * 0.5})`;
          ctx.lineWidth = this.size * 0.6;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${opacity})`;
        ctx.fill();
      }
    }

    class Ring {
      constructor(ratio) {
        this.maxR = 0;
        this.r = 0;
        this.ratio = ratio;
        this.speed = 0.12 + Math.random() * 0.08;
      }
      update() {
        if (!this.maxR) return;
        this.r += this.speed;
        if (this.r > this.maxR) { this.r = 0; this.speed = Math.random() * 0.15 + 0.06; }
      }
      draw() {
        if (!this.maxR || this.r <= 0) return;
        const op = Math.max(0, (1 - this.r / this.maxR) * 0.04);
        if (op < 0.002) return;
        ctx.beginPath();
        ctx.arc(drawCx, drawCy, this.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34,211,238,${op})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    function initParticles() {
      particles = Array.from({ length: CONFIG.particleCount }, () => new FluidParticle());
      rings = [0, 0.2, 0.4, 0.6, 0.8].map(r => new Ring(r));
    }

    function drawAmbientCore() {
      const pulse1 = Math.sin(time * 0.008) * 30 + 240;
      const pulse2 = Math.cos(time * 0.011) * 25 + 180;
      
      const gradCore = ctx.createRadialGradient(drawCx, drawCy, 0, drawCx, drawCy, pulse1 * 0.3);
      gradCore.addColorStop(0, 'rgba(255,255,255,0.15)');
      gradCore.addColorStop(0.4, 'rgba(168,85,247,0.08)');
      gradCore.addColorStop(1, 'rgba(1,2,5,0)');
      ctx.fillStyle = gradCore;
      ctx.beginPath(); ctx.arc(drawCx, drawCy, pulse1 * 0.3, 0, Math.PI * 2); ctx.fill();

      const gradMid = ctx.createRadialGradient(drawCx, drawCy, pulse1 * 0.2, drawCx, drawCy, pulse1 * 0.7);
      gradMid.addColorStop(0, 'rgba(99,102,241,0.1)');
      gradMid.addColorStop(0.5, 'rgba(34,211,238,0.05)');
      gradMid.addColorStop(1, 'rgba(1,2,5,0)');
      ctx.fillStyle = gradMid;
      ctx.beginPath(); ctx.arc(drawCx, drawCy, pulse1 * 0.7, 0, Math.PI * 2); ctx.fill();
    }

    // ✨ 恢复：鼠标底部的幽幽辉光
    function drawMouseGlow() {
      if (mouseGlow < 0.01) return;
      const grad = ctx.createRadialGradient(targetCx, targetCy, 0, targetCx, targetCy, 180);
      grad.addColorStop(0, `rgba(34, 211, 238, ${mouseGlow * 0.1})`);
      grad.addColorStop(0.4, `rgba(168, 85, 247, ${mouseGlow * 0.05})`);
      grad.addColorStop(1, 'rgba(1, 2, 5, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(targetCx, targetCy, 180, 0, Math.PI * 2); ctx.fill();
    }

    // ✨ 恢复：粒子之间的神经网络量子纠缠连线
    function drawEntanglementLines() {
      const maxDistSq = 250 * 250;
      const minDistSq = 20 * 20;
      const checkCount = Math.min(particles.length, 120); 

      for (let i = 0; i < checkCount; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < checkCount; j++) {
          const p2 = particles[j];
          const dSq = distSq(p1.x, p1.y, p2.x, p2.y);
          if (dSq < maxDistSq && dSq > minDistSq) {
            const d = Math.sqrt(dSq);
            const opacity = (1 - d / 250) * 0.04;
            if (opacity < 0.005) continue;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        }
      }
    }

    function updateSize() {
      width = window.innerWidth;
      height = window.innerHeight;
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      if (drawCx === 0) {
        drawCx = width / 2;
        drawCy = height / 2;
        targetCx = drawCx;
        targetCy = drawCy;
      }

      rings.forEach(ring => {
        ring.maxR = Math.max(width, height) * 0.85;
        if (ring.r === 0) ring.r = ring.ratio * ring.maxR;
      });

      if (particles.length === 0) initParticles();
    }

    let animFrame;
    function animate() {
      if (width === 0 || height === 0) {
        updateSize();
        animFrame = requestAnimationFrame(animate);
        return;
      }

      time++;
      ctx.fillStyle = 'rgba(1,2,6,0.15)'; // 半透明清理，形成拖影
      ctx.fillRect(0, 0, width, height);
      
      drawAmbientCore();
      drawMouseGlow(); // 渲染鼠标辉光

      ctx.globalCompositeOperation = 'screen';
      
      drawEntanglementLines(); // 渲染纠缠网络

      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].radius += 10;
        pulses[i].strength *= 0.93;
        if (pulses[i].strength < 0.03) pulses.splice(i, 1);
        else {
          ctx.beginPath();
          ctx.arc(pulses[i].x, pulses[i].y, pulses[i].radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34,211,238,${pulses[i].strength * 0.05})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      for (let i = burstParticles.length - 1; i >= 0; i--) {
        if (!burstParticles[i].update()) burstParticles.splice(i, 1);
        else burstParticles[i].draw();
      }

      if (Math.random() < 0.015 && burstParticles.length < MAX_BURST * 0.5) {
        const bx = drawCx + (Math.random() - 0.5) * width * 0.6;
        const by = drawCy + (Math.random() - 0.5) * height * 0.6;
        const col = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
        for (let i = 0; i < 20; i++) burstParticles.push(new BurstParticle(bx, by, col));
      }

      rings.forEach(r => { r.update(); r.draw(); });
      particles.forEach(p => { p.update(); p.draw(); });

      ctx.globalCompositeOperation = 'source-over';
      
      mouseGlow = mouseGlow + (0 - mouseGlow) * 0.03; // 辉光平滑消散
      drawCx += (targetCx - drawCx) * 0.02;
      drawCy += (targetCy - drawCy) * 0.02;

      animFrame = requestAnimationFrame(animate);
    }

    const handleMouseMove = (e) => {
      targetCx = e.clientX;
      targetCy = e.clientY;
      mouseGlow = Math.min(mouseGlow + 0.08, 1);
    };

    const handleClick = (e) => {
      const x = e.clientX, y = e.clientY;
      pulses.push({ x, y, radius: 5, strength: 6 });
      const mainColor = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      for (let i = 0; i < 150 && burstParticles.length < MAX_BURST; i++) {
        burstParticles.push(new BurstParticle(x, y, mainColor));
      }
      mouseGlow = 1;
    };

    window.addEventListener('resize', updateSize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    updateSize();
    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#010206]">
      {/* ✨ 恢复：底部的彩色动态星际迷雾动画 */}
      <style>{`
        @keyframes fogDrift {
          0%   { transform: translate3d(-4%, -2%, 0) scale(1); }
          25%  { transform: translate3d(2%, 1.5%, 0) scale(1.05); }
          50%  { transform: translate3d(-1.5%, 2.5%, 0) scale(1.08); }
          75%  { transform: translate3d(3%, -1%, 0) scale(1.04); }
          100% { transform: translate3d(-2%, -2.5%, 0) scale(1.1); }
        }
        .animate-fog {
          animation: fogDrift 28s ease-in-out infinite alternate;
          will-change: transform;
        }
      `}</style>

      <div 
        className="absolute z-[1] animate-fog blur-[100px] pointer-events-none"
        style={{
          inset: '-25%',
          background: `
            radial-gradient(circle at 25% 30%, rgba(80, 140, 255, 0.07), transparent 35%),
            radial-gradient(circle at 75% 50%, rgba(160, 90, 255, 0.06), transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.04), transparent 55%),
            radial-gradient(circle at 85% 20%, rgba(255, 60, 180, 0.04), transparent 30%),
            radial-gradient(circle at 15% 75%, rgba(45, 212, 191, 0.05), transparent 35%)
          `
        }}
      />

      {/* 核心粒子画布 */}
      <canvas ref={canvasRef} className="absolute inset-0 z-[2] block w-full h-full" style={{ filter: 'contrast(1.15) brightness(1.05)' }} />
      
      {/* 边缘暗角 */}
      <div className="absolute inset-0 z-[3] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(3,6,18,0.22) 0%, rgba(3,6,18,0.04) 40%, transparent 68%), radial-gradient(circle at 10% 15%, rgba(0,0,0,0.85) 0%, transparent 50%), radial-gradient(circle at 90% 85%, rgba(0,0,0,0.85) 0%, transparent 50%)' }} />
      
      {/* 电影级噪点 */}
      <div className="absolute inset-0 z-[4] pointer-events-none opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, mixBlendMode: 'overlay' }} />
    </div>
  );
}