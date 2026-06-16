"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Mail, Book, FileText, Presentation, Users, Info, ExternalLink, Sparkles, ArrowRight, Orbit, BookOpen, Download,Bot } from 'lucide-react';

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

// ==========================================
// 数据配置
// ==========================================
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Sparkles },
  { id: 'essays', label: 'Essays', icon: FileText },
  { id: 'notes', label: 'Notes', icon: Book },
  { id: 'teaching', label: 'Teaching', icon: Users },
  // 🌟 下面这一行是新增的 AI 答疑入口
  { id: 'chat', label: 'AI 答疑', icon: Bot, isLink: true, href: '/chat' },
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
      {/* 🌌 全局背景：保留极弱的噪点质感 */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#030305] to-[#030305]" />
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

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
              alt="吴 涛" 
              className="relative w-28 h-28 rounded-full object-cover border-2 border-white/10 group-hover:border-cyan-400/50 transition-colors duration-500"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">吴 涛</h1>
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
            <a href="https://github.com/pengyy168888" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors" title="代码仓库">
              <GitBranch size={18} className="hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* 右侧区域 (Navbar + Main Content) */}
      {/* ========================================== */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
        
        {/* 🌌 嵌入自定义 HTML 动态背景 */}
        <iframe 
          src="/contentbj.html" 
          className="absolute inset-0 w-full h-full border-none z-0 pointer-events-none opacity-60" 
          title="Custom Background"
          aria-hidden="true"
        />

        {/* 顶部导航栏 */}
        <header className="absolute top-0 w-full z-30 h-16 bg-[#030305]/40 backdrop-blur-md border-b border-white/5 flex items-center px-8 justify-between">
          <div className="flex items-center gap-2 text-cyan-500/50">
            <Sparkles size={16} />
            <span className="text-xs font-mono tracking-widest uppercase">Quantum Portal // 教研</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              // 🌟 1. 如果是外链（比如咱们的 AI 答疑页面）
              if (item.isLink) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank" 
                    rel="noopener noreferrer"
                    // 给 AI 答疑加了一点特殊的发光特效，让它更醒目
                    className="relative px-4 py-2 text-sm transition-all duration-300 flex items-center gap-2 rounded-md text-cyan-300 hover:text-white hover:bg-cyan-500/20 font-bold hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  >
                    <item.icon size={14} className="opacity-100" />
                    {item.label}
                  </a>
                );
              }

              // 🌟 2. 网站内部其他普通的 Tab 切换
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
        <div className="relative z-10 flex-1 overflow-y-auto pt-16 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-10 md:p-16 max-w-5xl mx-auto w-full min-h-full flex flex-col"
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
// 分支页面组件
// ==========================================

function HomeContent({ onEnter }: HomeContentProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full w-full relative selection:bg-cyan-500/20">
      {/* 🌌 背景柔和微光 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* 🌟 核心排版区 */}
      <div className="relative z-10 flex flex-col items-center space-y-10 w-full max-w-3xl mt-[-5vh]">
        
        {/* 顶部极简装饰 */}
        <div className="flex items-center gap-4 text-cyan-500/40">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-cyan-500/40" />
          <Orbit size={18} className="animate-[spin_20s_linear_infinite] opacity-50" />
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-cyan-500/40" />
        </div>

        {/* 核心英文名言 (杂志级错落排版) */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-white/80 leading-[1.3]">
            If the universe is the <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-300">answer</span>, <br />
            what is the <span className="italic font-serif text-white/50 lowercase">question?</span>
          </h1>
          <p className="text-xs md:text-sm text-cyan-400/50 font-mono tracking-[0.4em] uppercase">
            Exploring the Nature of Reality
          </p>
        </div>

        {/* 中文哲学意境 (庄子《知北游》) */}
        <div className="relative py-4 px-10 border border-white/5 bg-white/[0.01] rounded-2xl backdrop-blur-sm group hover:border-cyan-500/20 transition-colors duration-700">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl" />
          <p className="relative text-lg tracking-[0.6em] text-white/50 font-light ml-2 group-hover:text-cyan-100/80 transition-colors duration-700">
            判天地之美 · 析万物之理
          </p>
        </div>

        {/* 极简高级按钮 */}
        <div className="pt-8">
          <button 
            onClick={onEnter} 
            className="group relative flex items-center gap-4 px-8 py-3.5 bg-transparent border border-cyan-500/20 hover:border-cyan-400/60 rounded-full overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative text-xs text-cyan-50 tracking-[0.2em] uppercase font-mono">
              Initialize Sequence
            </span>
            <ArrowRight size={15} className="relative text-cyan-400 group-hover:translate-x-1.5 transition-transform duration-300" />
          </button>
        </div>

      </div>
    </div>
  );
}

function EssaysContent() {
  const essays = [
    { title: "杨氏双缝干涉", date: "2026-05-22", tag: "Optics", slug: "interference-of-light" },
    { title: "暂时没想好写什么", date: "2026-04-15", tag: "Quantum", slug: "quantum-reality" },
    { title: "暂时没想好写什么", date: "2026-03-02", tag: "QFT", slug: "path-integral" },
  ];
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white/90">随笔 Essays</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {essays.map((essay, i) => (
          <a href={`/notes/${essay.slug}`} key={i} className="block">
            {/* ✨ 优化后的卡片设计：更紧凑、背景悬浮光晕、去掉大黑块 */}
            <div className="group relative p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 hover:border-cyan-400/50 rounded-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)] backdrop-blur-md overflow-hidden flex flex-col justify-between min-h-[160px]">
              {/* 悬浮微光 */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full group-hover:bg-cyan-400/20 transition-all duration-700"></div>
              
              <div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform duration-500">
                    <FileText size={14} />
                  </span>
                  <span className="text-[10px] font-mono text-white/40 bg-black/30 border border-white/5 px-2 py-1 rounded-md">{essay.date}</span>
                </div>
                <h3 className="text-lg font-medium text-white/80 group-hover:text-cyan-50 transition-colors leading-snug relative z-10">{essay.title}</h3>
              </div>
              
              <div className="mt-6 flex items-center justify-between relative z-10">
                <span className="text-[10px] font-mono text-cyan-400 border border-cyan-400/30 px-2.5 py-1 rounded-full">{essay.tag}</span>
                <ArrowRight size={14} className="text-white/20 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" />
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
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white/90 border-b border-white/10 pb-4">科研与研读笔记 Notes</h2>
      <div className="space-y-2 font-mono text-sm">
        {notes.map((note, i) => (
          <a href={`/notes/${note.slug}`} key={i} className="flex items-center gap-4 p-4 bg-white/[0.01] hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 cursor-pointer transition-all backdrop-blur-sm">
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
    { title: '简谐运动', slug: 'jian-xie-yun-dong', desc: '简谐运动；简谐波' },
    { title: '光的衍射', slug: 'guang-de-yan-she', desc: '光的衍射：菲涅尔圆孔、圆屏衍射' },
    { title: '戴维南定理', slug: 'dai-wei-nan-dingli', desc: '复杂电路的等效简化' },
    { title: '波动与光学', slug: 'niudunhuan', desc: '等厚干涉：牛顿环模拟' },
    { title: '光的偏振', slug: 'guang-de-pian-zhen', desc: '光的偏振：线偏振光，圆偏振光...' },
     { title: '麦克斯韦方程组', slug: 'maxwell-equation', desc: 'maxwell-equation' },
    { title: '暂时没想好', slug: 'nothing', desc: '暂时没想好' }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white/90">高中物理教学 Teaching</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courses.map((course, i) => (
          <a href={`/notes/${course.slug}`} key={i} className="block">
            {/* ✨ 优化后的卡片设计：去掉强制正方形、增强层次感、增加贯穿引导线 */}
            <div className="relative bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 hover:border-cyan-400/50 rounded-2xl p-6 flex flex-col transition-all duration-500 group cursor-pointer hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(34,211,238,0.2)] overflow-hidden min-h-[180px]">
              
              {/* 顶部悬浮亮线 */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-500 shadow-inner">
                   <Book size={20} />
                </div>
                {/* 分割引导线 */}
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white/90 group-hover:text-cyan-50 transition-colors tracking-wide">{course.title}</h3>
                <p className="text-sm text-white/40 mt-2 leading-relaxed">{course.desc}</p>
              </div>

              {/* 底部交互指引 */}
              <div className="mt-6 flex items-center text-[11px] font-mono text-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                <span>START MODULE</span>
                <span className="ml-2 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">→</span>
              </div>

            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function SlidesContent() {
  // 核心状态：记录当前查看的是 'books' 还是 'slides'
  const [activeMode, setActiveMode] = React.useState<'books' | 'slides'>('books');
  const [groupedData, setGroupedData] = React.useState<Record<string, any[]>>({});
  const [loading, setLoading] = React.useState(true);

  // 当切换模式时，自动向对应的后端 API 发送请求
  React.useEffect(() => {
    setLoading(true);
    setGroupedData({}); // 清空旧数据展现重新扫描的效果
    
    fetch(`/api/${activeMode}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const groups: Record<string, any[]> = {};
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
        console.error(err);
        setLoading(false);
      });
  }, [activeMode]);

  return (
    <div className="space-y-8">
      {/* 头部标题与双子菜单切换器 */}
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-bold text-white/90 mb-6">数字资源库 Digital Resources</h2>
        
        {/* 丝滑的科幻切换面板 */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveMode('books')}
            className={`relative pb-2 text-[15px] font-medium transition-colors duration-300 ${
              activeMode === 'books' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
            }`}
          >
            📚 典藏书库 (Books)
            {activeMode === 'books' && (
              <motion.div layoutId="resource-subnav" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            )}
          </button>

          <button
            onClick={() => setActiveMode('slides')}
            className={`relative pb-2 text-[15px] font-medium transition-colors duration-300 ${
              activeMode === 'slides' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
            }`}
          >
            📽️ 教学课件 (Slides)
            {activeMode === 'slides' && (
              <motion.div layoutId="resource-subnav" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            )}
          </button>
        </div>
      </div>

      {/* 动态加载动画 */}
      {loading ? (
         <div className="flex flex-col items-center justify-center h-40 text-cyan-400/50 font-mono text-sm gap-3">
           <Orbit size={24} className="animate-spin text-cyan-400/70" />
           <span className="animate-pulse tracking-[0.2em] uppercase">调取数据矩阵中 Accessing Matrix...</span>
         </div>
      ) : Object.keys(groupedData).length === 0 ? (
         <div className="text-center py-20 text-white/20 font-mono text-sm border border-dashed border-white/5 rounded-2xl backdrop-blur-sm">
           未探测到相关物理文件 No files detected in this sector.
         </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedData).map(([category, itemsList]) => (
            <div key={category} className="space-y-5">
              
              {/* 分类小标题 */}
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-4 bg-cyan-500/50 rounded-full" />
                <h3 className="text-lg font-medium text-cyan-50 tracking-wide">{category}</h3>
                <span className="text-xs font-mono text-cyan-500/40 ml-2">[{itemsList.length} items]</span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent ml-4" />
              </div>

              {/* 资源卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {itemsList.map((item, i) => (
                  <a href={encodeURI(item.link)} target="_blank" rel="noopener noreferrer" key={i} className="block group">
                    <div className="flex items-center gap-4 p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-cyan-400/30 rounded-2xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(34,211,238,0.05)] backdrop-blur-sm">
                      
                      {/* ✅ 升级点：智能动态识别图标 */}
                      <div className="w-10 h-12 flex-shrink-0 bg-black/40 border border-white/10 rounded flex items-center justify-center text-cyan-500/50 group-hover:text-cyan-400 group-hover:border-cyan-400/30 transition-colors shadow-inner">
                        {item.link.match(/\.docx?$/i)
                          ? <FileText size={18} className="group-hover:scale-110 transition-transform duration-500" />
                          : item.link.match(/\.pptx?$/i)
                          ? <Presentation size={18} className="group-hover:scale-110 transition-transform duration-500" />
                          : <BookOpen size={18} className="group-hover:scale-110 transition-transform duration-500" />
                        }
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-medium text-white/80 group-hover:text-cyan-50 transition-colors truncate">
                          {item.title}
                        </h4>
                        <div className="mt-1">
                          {/* 自动识别是 PDF 还是 PPT 还是 WORD */}
                          <span className="text-[10px] text-white/20 font-mono uppercase">
                            {item.link.match(/\.docx?$/i) ? 'WORD DOC' : item.link.match(/\.pptx?$/i) ? 'PPT DECK' : 'PDF DOC'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-white/[0.02] group-hover:bg-cyan-500/10 text-white/20 group-hover:text-cyan-400 transition-all duration-300">
                        <Download size={14} />
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
    <div className="space-y-6 max-w-2xl text-white/70 leading-relaxed bg-white/[0.01] p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
      <h2 className="text-3xl font-bold text-white/90 mb-8">关于我</h2>
      
      <p>硕士毕业于华中师范大学粒子物理研究所，师从李新强教授。硕士研究课题聚焦于 U(3) 手征微扰论框架下 η′ → ππa 衰变过程的唯象研究。</p>
      
      {/* <p>现任教于云南省沾益区第三中学，致力于将前沿物理的严谨思维逻辑降维融入高中基础教育，构建理论与直觉相统一的物理课堂。同时，我也热衷于研读《黄帝内经》等经典，探索自然哲学中的普遍规律。</p> 
      */}
      
    </div>
  );
}
// ==========================================
// 动态粒子背景组件 (Quantum Collider Particles)
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

    const handleMouseMove = (e: MouseEvent) => {
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
      parent.addEventListener('mousemove', handleMouseMove as EventListener);
      parent.addEventListener('mouseleave', handleMouseLeave);
      parent.addEventListener('click', handleClick);
    }

    function randomRange(min: number, max: number): number {
      return min + Math.random() * (max - min);
    }

    class Particle {
      x: number;
      y: number;
      angle: number;
      speed: number;
      life: number;
      maxLife: number;
      radius: number;
      color: string;
      curve: number;
      history: Point[];

      constructor(angle: number, speed: number, color: string) {
        this.x = cx; 
        this.y = cy; 
        this.angle = angle; 
        this.speed = speed; 
        this.life = 120 + Math.random() * 60; 
        this.maxLife = this.life; 
        this.radius = Math.random() * 1.5 + 0.5; 
        this.color = color; 
        this.curve = (Math.random() - 0.5) * 0.02; 
        this.history = [];
      }

      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > PARTICLE_HISTORY_LEN) this.history.shift();
        this.angle += this.curve; 
        this.x += Math.cos(this.angle) * this.speed; 
        this.y += Math.sin(this.angle) * this.speed; 
        this.speed *= 0.99; 
        this.life--;
      }

      draw() {
        if (!ctx) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        for (let i = 0; i < this.history.length; i++) {
          const p = this.history[i];
          const trailAlpha = (i / this.history.length) * alpha * 0.3;
          ctx.beginPath(); 
          ctx.fillStyle = `rgba(${this.color}, ${trailAlpha})`;
          const trailRad = this.radius * (i / this.history.length + 0.3);
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
      r: number;
      alpha: number;

      constructor() { 
        this.r = 5; 
        this.alpha = 0.3; 
      }
      update() { 
        this.r += 4; 
        this.alpha *= 0.95; 
      }
      draw() {
        if (!ctx) return;
        ctx.beginPath(); 
        ctx.arc(cx, cy, this.r, 0, Math.PI * 2); 
        ctx.strokeStyle = `rgba(0, 255, 255, ${this.alpha})`; 
        ctx.lineWidth = 1; 
        ctx.stroke();
      }
    }

    let particles: Particle[] = [];
    let waves: Wave[] = [];

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
      cx += (targetCx - cx) * 0.08; 
      cy += (targetCy - cy) * 0.08;
      
      ctx.save(); 
      ctx.beginPath(); 
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)'; 
      ctx.arc(cx, cy, 30, 0, Math.PI * 2); 
      ctx.stroke(); 
      ctx.beginPath(); 
      ctx.arc(cx, cy, 70, 0, Math.PI * 2); 
      ctx.stroke(); 
      ctx.restore();

      for (let i = waves.length - 1; i >= 0; i--) {
        waves[i].update(); 
        waves[i].draw();
        if (waves[i].alpha < 0.01 || waves[i].r > Math.max(w, h)) waves.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); 
        particles[i].draw();
        if (particles[i].life <= 0 || particles[i].x < -50 || particles[i].x > w + 50 || particles[i].y < -50 || particles[i].y > h + 50) particles.splice(i, 1);
      }

      if (Math.random() < AUTO_COLLISION_RATE && particles.length < MAX_PARTICLES * 0.8) createCollision();
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

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" 
      style={{ opacity: 0.85, mixBlendMode: 'screen' }}
    />
  );
}