"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Mail, Book, FileText, Presentation, Users, Info, ExternalLink, Sparkles } from 'lucide-react';

// ==========================================
// 数据配置
// ==========================================
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Sparkles },
  { id: 'essays', label: 'Essays', icon: FileText },
  { id: 'notes', label: 'Notes', icon: Book },
  { id: 'teaching', label: 'Teaching', icon: Users },
  { id: 'slides', label: 'Slides', icon: Presentation },
  { id: 'about', label: 'About', icon: Info },
];

const LABELS = ['理论物理', '粒子物理', '中医爱好者', '易经爱好者'];

// ==========================================
// 主页面组件
// ==========================================
export default function AcademicPortal() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="flex h-screen w-full bg-[#030305] text-white overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* 🌌 全局背景：微弱动态渐变 */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#030305] to-[#030305]" />
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* ========================================== */}
      {/* 左侧固定栏 (Sidebar) */}
      {/* ========================================== */}
      <aside className="relative z-20 w-72 h-full flex flex-col bg-white/[0.02] backdrop-blur-xl border-r border-white/5 p-6 shadow-[4px_0_24px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* 🌟 动态粒子交互背景 */}
        <QuantumParticles />

        {/* 头像与基本信息 */}
        <div className="flex flex-col items-center mt-8 space-y-4 relative z-10">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-60 transition duration-700"></div>
            <img 
              src="/avatar.jpg" 
              alt="吴涛" 
              className="relative w-28 h-28 rounded-full object-cover border-2 border-white/10 group-hover:border-cyan-400/50 transition-colors duration-500"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">吴涛</h1>
            <p className="text-sm font-mono text-cyan-500/70">WU TAO</p>
          </div>
          <p className="text-xs text-white/40 text-center leading-relaxed px-2">
            格物致理，琢玉成器
          </p>
        </div>

        {/* 动态状态栏 */}
        <div className="mt-8 bg-black/40 border border-white/5 rounded-lg p-3 flex items-start gap-3 relative z-10">
          <span className="relative flex h-2.5 w-2.5 mt-1 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <p className="text-[11px] text-white/60 font-mono leading-tight">
            探索本源 ，清静无为
          </p>
        </div>

        {/* 身份标签 */}
        <div className="mt-8 space-y-3 relative z-10">
          <h3 className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono mb-2">Research & Interests</h3>
          <div className="flex flex-wrap gap-2">
            {LABELS.map(label => (
              <span key={label} className="px-2.5 py-1 text-[10px] rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/40 transition-colors cursor-default backdrop-blur-sm">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-grow relative z-10" />

        {/* 联系方式 */}
        <div className="flex flex-col items-center gap-4 pb-4 text-white/40 relative z-10 w-full">
          <a 
            href="mailto:pengyy168888@gmail.com" 
            className="flex items-center gap-2 hover:text-cyan-400 transition-colors group"
          >
            <Mail size={15} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono tracking-wider">pengyy168888@gmail.com</span>
          </a>
          
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-cyan-400 transition-colors" title="代码仓库">
              <GitBranch size={18} className="hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* 右侧区域 (Navbar + Main Content) */}
      {/* ========================================== */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
        
        {/* 顶部导航栏 */}
        <header className="absolute top-0 w-full z-30 h-16 bg-[#030305]/60 backdrop-blur-md border-b border-white/5 flex items-center px-8 justify-between">
          <div className="flex items-center gap-2 text-cyan-500/50">
            <Sparkles size={16} />
            <span className="text-xs font-mono tracking-widest uppercase">Quantum Portal // 教研</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-4 py-2 text-sm transition-colors duration-300 flex items-center gap-2 rounded-md ${
                    isActive ? 'text-cyan-300' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={14} className={isActive ? 'opacity-100' : 'opacity-50'} />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* 动态内容展示区 */}
        <div className="flex-1 overflow-y-auto pt-16 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-10 md:p-16 max-w-5xl mx-auto w-full min-h-full flex flex-col"
            >
              {activeTab === 'home' && <HomeContent />}
              {activeTab === 'essays' && <EssaysContent />}
              {activeTab === 'notes' && <NotesContent />}
              {activeTab === 'teaching' && <TeachingContent />}
              {activeTab === 'slides' && <SlidesContent />}
              {activeTab === 'about' && <AboutContent />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 分支页面组件
// ==========================================

function HomeContent() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 mt-10">
      <div className="relative">
        <div className="absolute -inset-10 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-cyan-400 leading-tight">
          If the universe is the answer, <br />
          what is the question? <br />
          <span className="italic font-light">Nature of Reality</span>
        </h1>
      </div>
      <p className="text-lg text-white/40 tracking-widest font-mono">
        PERSONAL ACADEMIC PORTAL OF WU TAO
      </p>
      <div className="pt-8">
        <button className="group relative px-8 py-3 bg-white/5 border border-white/10 hover:border-cyan-400/50 rounded-full overflow-hidden transition-all duration-300">
          <div className="absolute inset-0 bg-cyan-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <span className="relative flex items-center gap-2 text-sm text-cyan-50 tracking-wider">
            Enter Database <ExternalLink size={14} />
          </span>
        </button>
      </div>
    </div>
  );
}

function EssaysContent() {
  const essays = [
    { title: "杨氏双缝干涉", date: "2026-05-22", tag: "Optics", slug: "interference-of-light" },
    { title: "为什么量子力学不像你想象的那样", date: "2026-04-15", tag: "Quantum", slug: "quantum-reality" },
    { title: "从路径积分到世界线：一种直觉视角的解读", date: "2026-03-02", tag: "QFT", slug: "path-integral" },
  ];
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white/90">随笔 Essays</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {essays.map((essay, i) => (
          /* 👇 这里换成了原生的 a 标签，强制刷新跳转，100% 成功 */
          <a href={`/notes/${essay.slug}`} key={i} className="block">
            <div className="group h-full p-6 bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 rounded-xl cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(34,211,238,0.1)]">
              <div className="w-full h-32 bg-black/40 rounded-lg mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded-full">{essay.tag}</span>
                <span className="text-xs font-mono text-white/30">{essay.date}</span>
              </div>
              <h3 className="text-lg text-white/80 group-hover:text-cyan-50 transition-colors">{essay.title}</h3>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function NotesContent() {
  const notes = [
    { title: 'U(3) Chiral Perturbation Theory', slug: 'u3-chiral' },
    { title: 'η-η′ mixing 唯象分析', slug: 'eta-mixing' },
    { title: '黄帝内经素问研读', slug: 'huangdi-neijing' },
    { title: '本草纲目药性归纳', slug: 'bencao-gangmu' }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white/90 border-b border-white/10 pb-4">科研与研读笔记 Notes</h2>
      <div className="space-y-2 font-mono text-sm">
        {notes.map((note, i) => (
          <a href={`/notes/${note.slug}`} key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 cursor-pointer transition-all">
            <FileText size={16} className="text-cyan-500/50" />
            <span className="text-white/70">{note.title}.md</span>
            <span className="ml-auto text-white/20 text-xs">Updated recently</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function TeachingContent() {
  const courses = [
    { title: '力学基础', slug: 'mechanics' },
    { title: '电磁学进阶', slug: 'electromagnetism' },
    { title: '波动与光学', slug: 'optics' }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white/90">高中物理教学 Teaching</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((course, i) => (
          <a href={`/notes/${course.slug}`} key={i} className="block">
            <div className="h-full aspect-square bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-400/40 transition-colors group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                 <Book size={18} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white/80">{course.title}</h3>
                <p className="text-xs text-white/40 mt-2">核心考点与动画演示</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function SlidesContent() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white/90 border-b border-white/10 pb-4">课件库 Slides</h2>
      <p className="text-white/40">The presentation decks and PDF resources will be displayed here.</p>
    </div>
  );
}

function AboutContent() {
  return (
    <div className="space-y-6 max-w-2xl text-white/70 leading-relaxed">
      <h2 className="text-3xl font-bold text-white/90 mb-8">关于我</h2>
      <p>硕士毕业于华中师范大学粒子物理研究所，师从李新强教授。硕士研究课题聚焦于 U(3) 手征微扰论框架下 η′ → ππa 衰变过程的唯象研究。</p>
      <p>现任教于云南省沾益区第三中学，致力于将前沿物理的严谨思维逻辑降维融入高中基础教育，构建理论与直觉相统一的物理课堂。同时，我也热衷于研读《黄帝内经》等经典，探索自然哲学中的普遍规律。</p>
    </div>
  );
}

// ==========================================
// 动态粒子背景组件 (Quantum Collider Particles)
// ==========================================
function QuantumParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let w: number, h: number, cx: number, cy: number;
    let targetCx: number, targetCy: number;
    let particles: any[] = [];
    let waves: any[] = [];

    const MAX_PARTICLES = 400;
    const PARTICLE_HISTORY_LEN = 12;
    const AUTO_COLLISION_RATE = 0.02;

    const setCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      w = parent.offsetWidth;
      h = parent.offsetHeight;
      canvas.width = w;
      canvas.height = h;
      cx = w / 2;
      cy = h / 2;
      targetCx = cx;
      targetCy = cy;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const handleMouseMove = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      targetCx = e.clientX - rect.left;
      targetCy = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      targetCx = w / 2;
      targetCy = h / 2;
    };
    
    const handleClick = () => {
      triggerClickCollision();
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
      parent.addEventListener('click', handleClick);
    }

    function randomRange(min: number, max: number) {
      return min + Math.random() * (max - min);
    }

    class Particle {
      x: number; y: number; angle: number; speed: number; life: number; maxLife: number; radius: number; color: string; curve: number; history: any[];
      constructor(angle: number, speed: number, color: string) {
        this.x = cx; this.y = cy; this.angle = angle; this.speed = speed; this.life = 120 + Math.random() * 60; this.maxLife = this.life; this.radius = Math.random() * 1.5 + 0.5; this.color = color; this.curve = (Math.random() - 0.5) * 0.02; this.history = [];
      }
      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > PARTICLE_HISTORY_LEN) this.history.shift();
        this.angle += this.curve; this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed; this.speed *= 0.99; this.life--;
      }
      draw() {
        if (!ctx) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        for (let i = 0; i < this.history.length; i++) {
          const p = this.history[i];
          const trailAlpha = (i / this.history.length) * alpha * 0.3;
          ctx.beginPath(); ctx.fillStyle = `rgba(${this.color}, ${trailAlpha})`;
          const trailRad = this.radius * (i / this.history.length + 0.3);
          ctx.arc(p.x, p.y, trailRad, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.fillStyle = `rgba(${this.color}, ${alpha})`; ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
      }
    }

    class Wave {
      r: number; alpha: number;
      constructor() { this.r = 5; this.alpha = 0.3; }
      update() { this.r += 4; this.alpha *= 0.95; }
      draw() {
        if (!ctx) return;
        ctx.beginPath(); ctx.arc(cx, cy, this.r, 0, Math.PI * 2); ctx.strokeStyle = `rgba(0, 255, 255, ${this.alpha})`; ctx.lineWidth = 1; ctx.stroke();
      }
    }

    function createCollision() {
      if (particles.length > MAX_PARTICLES - 50) particles.splice(0, Math.floor(particles.length * 0.2));
      waves.push(new Wave());
      const jetCount = Math.floor(randomRange(2, 5));
      for (let j = 0; j < jetCount; j++) {
        const base = (Math.PI * 2 / jetCount) * j + Math.random() * 0.5;
        const particlesPerJet = 25;
        for (let i = 0; i < particlesPerJet; i++) {
          const angle = base + (Math.random() - 0.5) * 0.4;
          const speed = randomRange(1.5, 4.5);
          const color = Math.random() > 0.5 ? '0, 255, 255' : '100, 200, 255';
          particles.push(new Particle(angle, speed, color));
        }
      }
    }

    function triggerClickCollision() {
      for (let i = 0; i < 3; i++) setTimeout(createCollision, i * 120);
    }

    setTimeout(createCollision, 200);
    setTimeout(createCollision, 500);

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      cx += (targetCx - cx) * 0.08; cy += (targetCy - cy) * 0.08;
      
      ctx.save(); ctx.beginPath(); ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)'; ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

      for (let i = waves.length - 1; i >= 0; i--) {
        waves[i].update(); waves[i].draw();
        if (waves[i].alpha < 0.01 || waves[i].r > Math.max(w, h)) waves.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); particles[i].draw();
        if (particles[i].life <= 0 || particles[i].x < -50 || particles[i].x > w + 50 || particles[i].y < -50 || particles[i].y > h + 50) particles.splice(i, 1);
      }

      if (Math.random() < AUTO_COLLISION_RATE && particles.length < MAX_PARTICLES * 0.8) createCollision();
    }

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      if (parent) { parent.removeEventListener('mousemove', handleMouseMove); parent.removeEventListener('mouseleave', handleMouseLeave); parent.removeEventListener('click', handleClick); }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" 
      style={{ opacity: 0.85, mixBlendMode: 'screen' }}
    />
  );
}