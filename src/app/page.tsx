 "use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Mail, Book, FileText, Presentation, Users, Info, Sparkles, ArrowRight, Orbit, BookOpen, Download, Bot, ChevronRight } from 'lucide-react';

// ==========================================
// TypeScript 接口定义
// ==========================================
interface Point {
  x: number;
  y: number;
}

interface HomeContentProps {
  onEnter: () => void;
}

interface ResourceItem {
  title: string;
  link: string;
  category: string;
}

// ==========================================
// 核心数据配置
// ==========================================
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Sparkles },
  { id: 'essays', label: 'Essays', icon: FileText },
  { id: 'notes', label: 'Notes', icon: Book },
  { id: 'teaching', label: 'Teaching', icon: Users },
  { id: 'chat', label: 'AI 答疑', icon: Bot, isLink: true, href: '/chat' },
  { id: 'slides', label: 'Slides', icon: Presentation },
  { id: 'about', label: 'About', icon: Info },
];

const LABELS = ['理论物理', '粒子物理', '中医爱好者', '易经爱好者'];

// ==========================================
// UI 通用组件库
// ==========================================
const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="flex items-center gap-4 mb-8 md:mb-10 w-full min-w-0">
    <div className="w-1.5 h-8 shrink-0 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide flex items-baseline gap-2 truncate">
      {title} <span className="text-sm md:text-lg text-white/30 font-light font-mono shrink-0">{subtitle}</span>
    </h2>
  </div>
);

// ==========================================
// 主布局组件
// ==========================================
export default function AcademicPortal() {
  const [activeTab, setActiveTab] = useState('home');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    // 强制使用 fixed inset-0 锁定屏幕四周，从物理层面杜绝页面级水平滑动
    <div className="flex flex-col md:flex-row fixed inset-0 w-full h-full bg-[#030305] text-white overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* 🌌 全局背景 */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/15 via-[#030305] to-[#030305]" />
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

      {/* ========================================== */}
      {/* 左侧信息栏 */}
      {/* ========================================== */}
      <aside className="relative z-20 w-full md:w-72 h-auto max-h-[35vh] md:max-h-full md:h-full shrink-0 flex flex-col bg-[#050508]/60 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-white/[0.05] p-4 md:p-8 shadow-[4px_0_30px_rgba(0,0,0,0.6)] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-w-0">
        
        <QuantumParticles />

        <div className="flex flex-col items-center mt-2 md:mt-6 space-y-3 md:space-y-5 relative z-10 w-full min-w-0">
          <div className="relative group cursor-pointer p-1 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full blur-[10px] opacity-40 group-hover:opacity-80 transition duration-700 animate-pulse" />
            <img 
              src="/avatar.jpg" 
              alt="吴 涛" 
              className="relative w-14 h-14 md:w-28 md:h-28 rounded-full object-cover border-2 border-[#050508] group-hover:border-cyan-400/50 transition-colors duration-500 z-10"
            />
          </div>
          <div className="text-center space-y-1 md:space-y-1.5 w-full min-w-0">
            <h1 className="text-lg md:text-2xl font-bold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 truncate">
              吴 涛
            </h1>
            <p className="text-[10px] md:text-xs font-mono text-cyan-400/80 tracking-widest truncate">WU TAO</p>
          </div>
          <p className="text-[10px] md:text-xs text-white/40 text-center leading-relaxed px-2 hidden md:block font-light tracking-wide w-full truncate">
            格物致理 · 琢玉成器
          </p>
        </div>

        <div className="mt-4 md:mt-10 space-y-2 md:space-y-4 relative z-10 w-full min-w-0">
          <h3 className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-mono mb-2 hidden md:block text-center md:text-left truncate">Research Area</h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-1.5 md:gap-2 w-full">
            {LABELS.map(label => (
              <span key={label} className="px-2.5 md:px-3 py-1 md:py-1.5 text-[9px] md:text-[10px] rounded-md bg-white/[0.03] border border-white/[0.05] text-cyan-200/80 hover:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all cursor-default whitespace-nowrap">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-grow relative z-10" />

        <div className="flex flex-row md:flex-col justify-center items-center gap-2 md:gap-4 py-3 md:pb-0 text-white/50 relative z-10 w-full min-w-0">
          <a href="mailto:pengyy168888@gmail.com" className="flex items-center gap-2 hover:text-cyan-400 transition-colors group bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.02] hover:border-cyan-500/20 px-3 py-1.5 md:py-2 rounded-full flex-1 md:w-full min-w-0 justify-center md:justify-start overflow-hidden">
            <Mail size={12} className="group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-[9px] md:text-xs font-mono tracking-wider hidden sm:block truncate">pengyy168888@gmail.com</span>
            <span className="text-[9px] font-mono sm:hidden truncate">Email Me</span>
          </a>
          <a href="https://github.com/pengyy168888" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-cyan-400 transition-colors group bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.02] hover:border-cyan-500/20 px-3 py-1.5 md:py-2 rounded-full shrink-0 md:w-full justify-center md:justify-start">
            <GitBranch size={12} className="group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-[9px] md:text-xs font-mono tracking-wider truncate">GitHub</span>
          </a>
        </div>
      </aside>

      {/* ========================================== */}
      {/* 右侧主内容区 */}
      {/* ========================================== */}
      <main className="relative z-10 flex-1 min-w-0 w-full flex flex-col h-full overflow-hidden">
        
        <iframe 
          src="/contentbj.html" 
          className="absolute inset-0 w-full h-full border-none z-0 pointer-events-none opacity-50" 
          title="Custom Background"
          aria-hidden="true"
        />

        {/* ⚡️ 终极修复 2：取消绝对定位，采用自然堆叠，并将导航条的单行横向滑动改为 flex-wrap 折行展示！ */}
        <header className="relative z-30 shrink-0 w-full bg-[#030305]/60 md:bg-[#030305]/40 backdrop-blur-xl border-b border-white/[0.05] flex flex-col md:flex-row items-center">
          
          <div className="hidden md:flex items-center gap-3 shrink-0 pl-8 pr-6 border-r border-white/[0.05] h-16">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse shrink-0" />
            <span className="text-xs font-mono tracking-widest uppercase text-white/60 whitespace-nowrap">Quantum Portal</span>
          </div>

          <nav className="w-full md:flex-1 flex flex-wrap items-center justify-center md:justify-start gap-1.5 md:gap-2 p-3 md:p-0 md:px-6 md:h-16">
            {NAV_ITEMS.map((item) => {
              if (item.isLink) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative shrink-0 px-3 py-1.5 md:px-4 md:py-2 text-[11px] md:text-sm transition-all duration-300 flex items-center gap-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-cyan-500/20 font-medium border border-transparent hover:border-cyan-500/30 bg-white/[0.02] md:bg-transparent"
                  >
                    <item.icon size={13} className="shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </a>
                );
              }

              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative shrink-0 px-3 py-1.5 md:px-4 md:py-2 text-[11px] md:text-sm transition-all duration-300 flex items-center gap-1.5 rounded-lg group ${
                    isActive ? 'text-cyan-300 bg-cyan-500/10 md:bg-transparent' : 'text-white/50 hover:text-white/90 bg-white/[0.02] md:bg-transparent hover:bg-white/[0.05]'
                  }`}
                >
                  <item.icon size={13} className={`shrink-0 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 transition-opacity'}`} />
                  <span className="font-medium tracking-wide whitespace-nowrap">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] rounded-t-full hidden md:block"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* 动态内容渲染区 */}
        {/* ⚡️ 彻底移除 pt-14 这种硬编码上内边距，让内容自然填满剩余空间 */}
        <div 
          ref={scrollContainerRef}
          className="relative z-10 flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} 
              className="p-4 sm:p-6 md:p-10 lg:p-16 max-w-5xl mx-auto w-full min-h-full flex flex-col overflow-x-hidden"
            >
              {activeTab === 'home' && <HomeContent onEnter={() => setActiveTab('notes')} />}
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
// 分支页面组件 (Sub-Pages)
// ==========================================

function HomeContent({ onEnter }: HomeContentProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full w-full relative selection:bg-cyan-500/20 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[300px] md:w-[600px] h-[250px] sm:h-[300px] md:h-[600px] bg-gradient-to-br from-cyan-600/10 to-blue-600/10 blur-[80px] md:blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center space-y-8 md:space-y-12 w-full max-w-4xl mt-[-5vh] px-2 md:px-0">
        
        <div className="flex items-center gap-4 md:gap-6 text-cyan-500/40 w-full justify-center">
          <div className="h-[1px] flex-1 max-w-[64px] md:max-w-[96px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <div className="relative shrink-0">
             <Orbit size={20} className="animate-[spin_15s_linear_infinite] text-cyan-400/80" />
             <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full" />
          </div>
          <div className="h-[1px] flex-1 max-w-[64px] md:max-w-[96px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </div>

        <div className="text-center space-y-4 md:space-y-6 w-full break-words">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-light tracking-wide text-white/90 leading-[1.3] md:leading-[1.3] w-full">
            If the universe is the <br className="sm:hidden" />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-100 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] inline-block">answer</span>, <br className="hidden sm:block" />
            what is the <span className="italic font-serif text-white/40 lowercase">question?</span>
          </h1>
          <p className="text-[9px] sm:text-[10px] md:text-sm text-cyan-300/50 font-mono tracking-[0.2em] md:tracking-[0.5em] uppercase w-full">
            Exploring the Nature of Reality
          </p>
        </div>

        <div className="relative py-4 md:py-5 px-6 md:px-12 border border-white/[0.05] bg-white/[0.01] rounded-2xl backdrop-blur-md group hover:border-cyan-500/30 transition-all duration-700 shadow-2xl hover:shadow-[0_0_40px_rgba(34,211,238,0.1)] w-full max-w-[90%] md:max-w-[80%]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-2xl" />
          <p className="relative text-sm sm:text-base md:text-lg tracking-[0.3em] md:tracking-[0.8em] text-white/50 font-light ml-1 md:ml-3 group-hover:text-cyan-50 transition-colors duration-700 text-center flex-wrap">
            判天地之美 · 析万物之理
          </p>
        </div>

        <div className="pt-4 md:pt-8 pb-10">
          <button 
            onClick={onEnter} 
            className="group relative flex items-center gap-4 px-8 md:px-10 py-3 md:py-4 bg-transparent border border-cyan-500/30 hover:border-cyan-400/80 rounded-full overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)] shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative text-[10px] md:text-xs text-cyan-50 tracking-[0.2em] uppercase font-mono">
              Initialize Sequence
            </span>
            <ArrowRight size={16} className="relative text-cyan-400 group-hover:translate-x-2 transition-transform duration-500 ease-out shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EssaysContent() {
  const essays = [
    { title: "杨氏双缝干涉", date: "2026-05-22", tag: "Optics", slug: "interference-of-light" },
    { title: "一道热力学平衡题目仿真", date: "2026-06-20", tag: ["热力学", "仿真"], slug: "sui-bi1" },
    { title: "路径积分的初步探讨", date: "2026-03-02", tag: "QFT", slug: "path-integral" },
    { title: "未命名草稿", date: "2026-03-02", tag: "QFT", slug: "draft" }
  ];

  return (
    <div className="w-full min-w-0">
      <SectionHeader title="随笔" subtitle="Essays" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        {essays.map((essay, i) => (
          <a href={`/notes/${essay.slug}`} key={i} className="block group w-full min-w-0">
            <div className="relative p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] group-hover:border-cyan-400/40 rounded-2xl transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_40px_-15px_rgba(34,211,238,0.3)] backdrop-blur-md overflow-hidden flex flex-col justify-between min-h-[140px] md:min-h-[170px] w-full">
              
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-cyan-500/0 group-hover:bg-cyan-500/10 blur-[40px] rounded-full transition-all duration-700" />
              
              <div className="relative z-10 min-w-0 w-full">
                <div className="flex justify-between items-start mb-4 md:mb-5 w-full">
                  <span className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/[0.05] group-hover:bg-cyan-500/20 text-white/40 group-hover:text-cyan-300 transition-all duration-500 border border-white/[0.05] group-hover:border-cyan-400/30 shrink-0">
                    <FileText size={14} className="md:w-4 md:h-4" />
                  </span>
                  <span className="text-[10px] font-mono text-white/30 group-hover:text-cyan-200/50 transition-colors bg-[#030305]/50 border border-white/[0.05] px-2.5 py-1 rounded-md shrink-0">{essay.date}</span>
                </div>
                <h3 className="text-base md:text-lg font-medium text-white/70 group-hover:text-white transition-colors leading-snug w-full truncate">{essay.title}</h3>
              </div>

              <div className="mt-4 md:mt-6 flex items-center justify-between relative z-10 w-full">
                <span className="text-[10px] font-mono text-cyan-400/70 border border-cyan-400/20 bg-cyan-500/5 px-3 py-1 rounded-full group-hover:bg-cyan-500/10 transition-colors shrink-0">
                  {Array.isArray(essay.tag) ? essay.tag[0] : essay.tag}
                </span>
                <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors shrink-0">
                  <ArrowRight size={12} className="text-white/30 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
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
    <div className="w-full min-w-0">
      <SectionHeader title="科研与研读笔记" subtitle="Notes" />
      <div className="space-y-3 font-mono text-xs md:text-sm lg:text-base w-full min-w-0">
        {notes.map((note, i) => (
          <a href={`/notes/${note.slug}`} key={i} className="flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-white/[0.015] hover:bg-white/[0.04] rounded-xl border border-white/[0.05] hover:border-cyan-400/30 cursor-pointer transition-all duration-300 backdrop-blur-sm group hover:shadow-[0_4px_20px_rgba(34,211,238,0.05)] w-full min-w-0">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/[0.03] flex items-center justify-center group-hover:bg-cyan-500/10 border border-transparent group-hover:border-cyan-500/20 transition-colors shrink-0">
               <FileText size={14} className="md:w-4 md:h-4 text-white/30 group-hover:text-cyan-400 transition-colors" />
            </div>
            <span className="text-white/60 group-hover:text-cyan-50 transition-colors truncate flex-1 min-w-0">{note.title}.md</span>
            
            <div className="ml-auto flex items-center gap-2 md:gap-3 shrink-0">
               <span className="text-white/20 text-[9px] md:text-xs shrink-0 hidden sm:block group-hover:text-cyan-400/40 transition-colors">
                 Updated recently
               </span>
               <ChevronRight size={14} className="md:w-4 md:h-4 text-white/10 group-hover:text-cyan-400/60 group-hover:translate-x-1 transition-all" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function TeachingContent() {
  const courses = [
    { title: '简谐运动', slug: 'jian-xie-yun-dong', desc: '简谐运动；简谐波' },
    { title: '光的衍射', slug: 'guang-de-yan-she', desc: '光的衍射：菲涅尔圆孔、圆屏衍射' },
    { title: '戴维南定理', slug: 'dai-wei-nan-dingli', desc: '复杂电路的等效简化' },
    { title: '波动与光学', slug: 'niudunhuan', desc: '等厚干涉：牛顿环模拟' },
    { title: '光的偏振', slug: 'guang-de-pian-zhen', desc: '光的偏振：线偏振光，圆偏振光...' },
    { title: '麦克斯韦方程组', slug: 'maxwell-equation', desc: '经典电磁学核心方程' },
    { title: '测量电源内阻误差分析', slug: 'ce-dian-zu', desc: '内接法、外接法' },
    { title: '电介质的电磁性质', slug: 'jie-zhi', desc: '介质中的麦克斯韦方程组' },
    { title: '向心加速度的由来', slug: 'xiang-xin-a', desc: '圆周运动与向心加速度' },
    { title: '万有引力定律与天体运动', slug: 'tian-ti-yun-dong', desc: '天体运动学规律' },
    { title: '单缝夫琅禾费衍射', slug: 'dan-feng-yan-she', desc: '原理与实验观测' },
    { title: '带电粒子在磁场中的运动仿真', slug: 'dai-dian-li-zi-fang-zhen', desc: '带电粒子在磁场中的偏转' },
  ];

  return (
    <div className="w-full min-w-0">
      <SectionHeader title="高中物理教学" subtitle="Teaching Modules" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 w-full min-w-0">
        {courses.map((course, i) => (
          <a href={`/notes/${course.slug}`} key={i} className="block group w-full min-w-0">
            <div className="relative bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/40 rounded-2xl p-5 md:p-6 flex flex-col transition-all duration-500 cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(34,211,238,0.15)] overflow-hidden min-h-[150px] md:min-h-[170px] w-full">
              
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5 relative z-10 w-full">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#030305]/50 border border-white/[0.05] group-hover:border-cyan-400/30 flex items-center justify-center text-white/30 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all duration-500 shadow-inner shrink-0">
                  <Book size={16} className="md:w-5 md:h-5" />
                </div>
                <div className="h-[1px] flex-1 min-w-0 bg-gradient-to-r from-white/[0.05] group-hover:from-cyan-500/30 to-transparent transition-colors duration-500" />
              </div>

              <div className="flex-1 relative z-10 min-w-0 w-full">
                <h3 className="text-base md:text-lg font-medium text-white/80 group-hover:text-white transition-colors tracking-wide truncate w-full">{course.title}</h3>
                <p className="text-xs md:text-sm text-white/40 mt-1.5 md:mt-2 leading-relaxed line-clamp-2 font-light w-full">{course.desc}</p>
              </div>

              <div className="mt-4 md:mt-5 flex items-center text-[10px] md:text-[11px] font-mono text-white/20 group-hover:text-cyan-400 transition-colors relative z-10 shrink-0">
                <span className="tracking-widest">START MODULE</span>
                <ArrowRight size={12} className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out shrink-0" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function SlidesContent() {
  const [activeMode, setActiveMode] = React.useState<'books' | 'slides'>('books');
  const [groupedData, setGroupedData] = React.useState<Record<string, ResourceItem[]>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    setGroupedData({});

    fetch(`/api/${activeMode}`)
      .then((res) => res.json())
      .then((data: ResourceItem[]) => {
        if (Array.isArray(data)) {
          const groups: Record<string, ResourceItem[]> = {};
          data.forEach(item => {
            const cat = (item.category.toLowerCase() === 'books' || item.category.toLowerCase() === 'slides')
                ? '默认归档' 
                : item.category;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
          });
          setGroupedData(groups);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch resources:", err);
        setLoading(false);
      });
  }, [activeMode]);

  return (
    <div className="w-full min-w-0">
      <SectionHeader title="数字资源库" subtitle="Digital Resources" />
      
      <div className="mb-6 md:mb-10 w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="bg-white/[0.02] p-1.5 rounded-xl inline-flex flex-nowrap border border-white/[0.05] backdrop-blur-sm shadow-inner min-w-max">
           <button
              onClick={() => setActiveMode('books')}
              className={`relative px-5 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-lg transition-all duration-300 shrink-0 ${
                activeMode === 'books' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {activeMode === 'books' && (
                <motion.div layoutId="resource-toggle" className="absolute inset-0 bg-cyan-500/20 border border-cyan-400/30 rounded-lg" />
              )}
              <span className="relative z-10 flex items-center gap-2"><BookOpen size={14} /> 典藏书库</span>
            </button>

            <button
              onClick={() => setActiveMode('slides')}
              className={`relative px-5 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-lg transition-all duration-300 shrink-0 ${
                activeMode === 'slides' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {activeMode === 'slides' && (
                <motion.div layoutId="resource-toggle" className="absolute inset-0 bg-cyan-500/20 border border-cyan-400/30 rounded-lg" />
              )}
              <span className="relative z-10 flex items-center gap-2"><Presentation size={14} /> 教学课件</span>
            </button>
        </div>
      </div>

      {loading ? (
         <div className="flex flex-col items-center justify-center h-40 md:h-64 text-cyan-400/50 font-mono text-xs md:text-sm gap-4 bg-white/[0.01] rounded-2xl border border-white/[0.05] w-full min-w-0">
           <Orbit size={28} className="animate-spin text-cyan-400/60" />
           <span className="animate-pulse tracking-[0.2em] uppercase">Accessing Matrix...</span>
         </div>
      ) : Object.keys(groupedData).length === 0 ? (
         <div className="flex items-center justify-center h-40 md:h-64 text-white/30 font-mono text-xs md:text-sm border border-dashed border-white/10 rounded-2xl bg-white/[0.01] w-full min-w-0">
           未探测到相关物理文件 No files detected.
         </div>
      ) : (
        <div className="space-y-8 md:space-y-12 w-full min-w-0">
          {Object.entries(groupedData).map(([category, itemsList]) => (
            <div key={category} className="space-y-4 md:space-y-5 w-full min-w-0">
              
              <div className="flex items-center gap-3 w-full min-w-0">
                <div className="w-1.5 h-4 bg-cyan-500/50 rounded-full shrink-0" />
                <h3 className="text-base md:text-lg font-medium text-white/90 tracking-wide truncate">{category}</h3>
                <span className="text-[10px] md:text-xs font-mono text-white/20 bg-white/[0.05] px-2 py-0.5 rounded-md shrink-0">{itemsList.length}</span>
                <div className="flex-1 min-w-0 h-[1px] bg-gradient-to-r from-white/[0.05] to-transparent ml-2 md:ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full min-w-0">
                {itemsList.map((item, i) => (
                  <a href={encodeURI(item.link)} target="_blank" rel="noopener noreferrer" key={i} className="block group w-full min-w-0">
                    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white/[0.015] hover:bg-white/[0.03] border border-white/[0.05] hover:border-cyan-400/40 rounded-2xl transition-all duration-300 hover:shadow-[0_4px_20px_rgba(34,211,238,0.05)] backdrop-blur-sm w-full min-w-0">
                      
                      <div className="w-10 h-12 flex-shrink-0 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-center text-white/30 group-hover:text-cyan-400 group-hover:border-cyan-400/30 group-hover:bg-cyan-500/10 transition-all shrink-0">
                        {item.link.match(/\.docx?$/i) ? <FileText size={16} /> : item.link.match(/\.pptx?$/i) ? <Presentation size={16} /> : <BookOpen size={16} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm md:text-[15px] font-medium text-white/70 group-hover:text-white transition-colors truncate w-full">
                          {item.title}
                        </h4>
                        <div className="mt-1">
                          <span className="text-[9px] md:text-[10px] text-white/30 font-mono uppercase tracking-wider">
                            {item.link.match(/\.docx?$/i) ? 'WORD DOC' : item.link.match(/\.pptx?$/i) ? 'PPT DECK' : 'PDF DOC'}
                          </span>
                        </div>
                      </div>

                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white/[0.03] group-hover:bg-cyan-400 text-white/30 group-hover:text-[#030305] transition-all duration-300 shrink-0">
                        <Download size={14} className="group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AboutContent() {
  return (
    <div className="w-full min-w-0">
      <SectionHeader title="关于我" subtitle="About Me" />
      
      <div className="w-full max-w-3xl bg-white/[0.02] p-6 md:p-10 rounded-3xl border border-white/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden min-w-0">
        
        <div className="absolute top-0 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-gradient-to-bl from-cyan-500/10 to-blue-600/5 blur-[60px] md:blur-[80px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="relative z-10 space-y-6 md:space-y-8 w-full min-w-0">
          
          <div className="w-full break-words">
            <h3 className="text-lg md:text-2xl font-medium text-white mb-2 leading-snug">物理学硕士 <span className="text-cyan-500/40">/</span> 中学物理教师 <span className="text-cyan-500/40">/</span> 编程爱好者</h3>
            <p className="font-mono text-xs md:text-sm text-cyan-400/60 uppercase tracking-widest">Master of Physics & Educator</p>
          </div>
          
          <div className="h-[1px] w-full bg-gradient-to-r from-white/[0.08] to-transparent" />
          
          <div className="space-y-5 md:space-y-6 text-white/60 leading-relaxed md:leading-loose text-sm md:text-base font-light w-full">
            <p className="flex items-start gap-3 w-full">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="flex-1 min-w-0 break-words">毕业于 <strong className="text-white font-medium">华中师范大学 粒子物理研究所</strong>，师从李新强教授。</span>
            </p>
            
            <p className="flex items-start gap-3 w-full">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="flex-1 min-w-0 break-words">我的硕士研究课题聚焦于 <span className="font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 whitespace-normal">U(3)</span> 手征微扰论框架下 <span className="font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 whitespace-normal">η′ → ππa</span> 衰变过程的唯象研究。</span>
            </p>

            <p className="flex items-start gap-3 w-full">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="flex-1 min-w-0 break-words">热衷于运用现代信息技术（Next.js, React, 物理仿真引擎等）赋能传统的物理教学与知识分享。同时，我也是中医经典（如《黄帝内经》）与《易经》的研读者，追求科学的严谨与传统哲学的融合。</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// 动态粒子交互背景组件
// ==========================================
function QuantumParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let w: number, h: number, cx: number, cy: number;
    let targetCx: number, targetCy: number;

    const MAX_PARTICLES = 200; 
    const PARTICLE_HISTORY_LEN = 10;
    const AUTO_COLLISION_RATE = 0.01; 

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

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetCx = e.clientX - rect.left;
      targetCy = e.clientY - rect.top;
    };
    const handleMouseLeave = () => { targetCx = w / 2; targetCy = h / 2; };
    const handleClick = () => triggerClickCollision();

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove as EventListener);
      parent.addEventListener('mouseleave', handleMouseLeave);
      parent.addEventListener('click', handleClick);
    }

    function randomRange(min: number, max: number): number { return min + Math.random() * (max - min); }

    class Particle {
      x: number; y: number; angle: number; speed: number; life: number;
      maxLife: number; radius: number; color: string; curve: number; history: Point[];

      constructor(angle: number, speed: number, color: string) {
        this.x = cx; this.y = cy; this.angle = angle; this.speed = speed; 
        this.life = 100 + Math.random() * 50; this.maxLife = this.life; 
        this.radius = Math.random() * 1.5 + 0.5; this.color = color; 
        this.curve = (Math.random() - 0.5) * 0.02; this.history = [];
      }

      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > PARTICLE_HISTORY_LEN) this.history.shift();
        this.angle += this.curve; 
        this.x += Math.cos(this.angle) * this.speed; 
        this.y += Math.sin(this.angle) * this.speed; 
        this.speed *= 0.98; 
        this.life--;
      }

      draw() {
        if (!ctx) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        for (let i = 0; i < this.history.length; i++) {
          const p = this.history[i];
          const trailAlpha = (i / this.history.length) * alpha * 0.4;
          ctx.beginPath(); 
          ctx.fillStyle = `rgba(${this.color}, ${trailAlpha})`;
          const trailRad = this.radius * (i / this.history.length + 0.2);
          ctx.arc(p.x, p.y, trailRad, 0, Math.PI * 2); 
          ctx.fill();
        }
        ctx.beginPath(); 
        ctx.fillStyle = `rgba(${this.color}, ${alpha})`; 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        ctx.fill();
      }
    }

    class Wave {
      r: number; alpha: number;
      constructor() { this.r = 2; this.alpha = 0.5; }
      update() { this.r += 3; this.alpha *= 0.93; }
      draw() {
        if (!ctx) return;
        ctx.beginPath(); ctx.arc(cx, cy, this.r, 0, Math.PI * 2); 
        ctx.strokeStyle = `rgba(34, 211, 238, ${this.alpha})`; 
        ctx.lineWidth = 1; ctx.stroke();
      }
    }

    let particles: Particle[] = [];
    let waves: Wave[] = [];

    function createCollision() {
      if (particles.length > MAX_PARTICLES - 30) particles.splice(0, Math.floor(particles.length * 0.2));
      waves.push(new Wave());
      const jetCount = Math.floor(randomRange(2, 4));
      for (let j = 0; j < jetCount; j++) {
        const base = (Math.PI * 2 / jetCount) * j + Math.random() * 0.5;
        for (let i = 0; i < 15; i++) {
          const angle = base + (Math.random() - 0.5) * 0.4;
          const speed = randomRange(1.5, 4.0);
          const color = Math.random() > 0.5 ? '34, 211, 238' : '59, 130, 246'; 
          particles.push(new Particle(angle, speed, color));
        }
      }
    }

    function triggerClickCollision() { for (let i = 0; i < 3; i++) setTimeout(createCollision, i * 100); }

    setTimeout(createCollision, 300);

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      cx += (targetCx - cx) * 0.05; cy += (targetCy - cy) * 0.05;

      ctx.save(); 
      ctx.beginPath(); ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)'; ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.stroke(); 
      ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.stroke(); 
      ctx.restore();

      for (let i = waves.length - 1; i >= 0; i--) {
        waves[i].update(); waves[i].draw();
        if (waves[i].alpha < 0.01 || waves[i].r > Math.max(w, h)) waves.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); particles[i].draw();
        if (particles[i].life <= 0 || particles[i].x < -50 || particles[i].x > w + 50 || particles[i].y < -50 || particles[i].y > h + 50) particles.splice(i, 1);
      }

      if (Math.random() < AUTO_COLLISION_RATE && particles.length < MAX_PARTICLES * 0.7) createCollision();
    }

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      if (parent) { 
        parent.removeEventListener('mousemove', handleMouseMove as EventListener); 
        parent.removeEventListener('mouseleave', handleMouseLeave); 
        parent.removeEventListener('click', handleClick); 
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-screen opacity-80" />;
}