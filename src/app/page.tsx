 "use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Mail, Book, FileText, Presentation, Users, Info, Sparkles, ArrowRight, Orbit, BookOpen, Download, Bot } from 'lucide-react';

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
    // ⚡️ 修复点1：使用 h-[100dvh] 解决 iOS 底部导航栏遮挡问题；在手机上使用 flex-col（上下排版），电脑上使用 md:flex-row（左右排版）
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#030305] text-white overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* 🌌 全局背景 */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#030305] to-[#030305]" />
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

      {/* ========================================== */}
      {/* 左侧固定栏 (Sidebar) -> 手机端变为顶部信息栏 */}
      {/* ========================================== */}
      {/* ⚡️ 修复点2：手机端高度最大 35vh 且允许内容内部滑动；电脑端恢复 w-72 和全高 */}
      <aside className="relative z-20 w-full md:w-72 h-auto max-h-[35vh] md:max-h-full md:h-full shrink-0 flex flex-col bg-white/[0.02] backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5 p-4 md:p-6 shadow-[4px_0_24px_rgba(0,0,0,0.5)] overflow-y-auto md:overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* 🌟 动态粒子交互背景 */}
        <QuantumParticles />

        {/* 头像与基本信息 */}
        {/* ⚡️ 修复点3：缩减手机端头像和间距，防止占用太多屏幕 */}
        <div className="flex flex-col items-center mt-2 md:mt-8 space-y-3 md:space-y-4 relative z-10">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-60 transition duration-700"></div>
            <img 
              src="/avatar.jpg" 
              alt="吴 涛" 
              className="relative w-16 h-16 md:w-28 md:h-28 rounded-full object-cover border-2 border-white/10 group-hover:border-cyan-400/50 transition-colors duration-500"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">吴 涛</h1>
            <p className="text-xs md:text-sm font-mono text-cyan-500/70">WU TAO</p>
          </div>
          <p className="text-[10px] md:text-xs text-white/40 text-center leading-relaxed px-2 hidden md:block">
            格物致理，琢玉成器
          </p>
        </div>

        {/* 身份标签 */}
        <div className="mt-4 md:mt-8 space-y-2 md:space-y-3 relative z-10">
          <h3 className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono mb-2 hidden md:block">Research & Interests</h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-1.5 md:gap-2">
            {LABELS.map(label => (
              <span key={label} className="px-2 py-1 text-[9px] md:text-[10px] rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 backdrop-blur-sm">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-grow relative z-10" />

        {/* 联系方式 */}
        <div className="flex flex-row md:flex-col justify-center items-center gap-4 py-4 md:pb-4 text-white/40 relative z-10 w-full">
          <a href="mailto:pengyy168888@gmail.com" className="flex items-center gap-2 hover:text-cyan-400 transition-colors group">
            <Mail size={14} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] md:text-xs font-mono tracking-wider hidden md:inline-block">pengyy168888@gmail.com</span>
          </a>
          <a href="https://github.com/pengyy168888" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
            <GitBranch size={16} className="hover:scale-110 transition-transform" />
          </a>
        </div>
      </aside>

      {/* ========================================== */}
      {/* 右侧区域 (Navbar + Main Content) */}
      {/* ========================================== */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
        
        <iframe 
          src="/contentbj.html" 
          className="absolute inset-0 w-full h-full border-none z-0 pointer-events-none opacity-60" 
          title="Custom Background"
          aria-hidden="true"
        />

        {/* 顶部导航栏 */}
        {/* ⚡️ 修复点4：手机端允许导航横向滚动，隐藏滚动条 */}
        <header className="absolute top-0 w-full z-30 h-14 md:h-16 bg-[#030305]/60 md:bg-[#030305]/40 backdrop-blur-md border-b border-white/5 flex items-center px-4 md:px-8 gap-4 md:justify-between overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2 text-cyan-500/50 shrink-0 hidden md:flex">
            <Sparkles size={16} />
            <span className="text-xs font-mono tracking-widest uppercase">Quantum Portal // 教研</span>
          </div>
          
          <nav className="flex items-center gap-1 shrink-0">
            {NAV_ITEMS.map((item) => {
              if (item.isLink) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative px-3 md:px-4 py-2 text-xs md:text-sm transition-all duration-300 flex items-center gap-1.5 md:gap-2 rounded-md text-cyan-300 hover:text-white hover:bg-cyan-500/20 font-bold"
                  >
                    <item.icon size={14} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </a>
                );
              }

              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3 md:px-4 py-2 text-xs md:text-sm transition-colors duration-300 flex items-center gap-1.5 md:gap-2 rounded-md ${
                    isActive ? 'text-cyan-300' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={14} className={isActive ? 'opacity-100' : 'opacity-50'} />
                  <span className="whitespace-nowrap">{item.label}</span>
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
        {/* ⚡️ 修复点5：增加内容区的内边距自适应，防止内容贴边 */}
        <div className="relative z-10 flex-1 overflow-y-auto pt-14 md:pt-16 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 md:p-10 lg:p-16 max-w-5xl mx-auto w-full min-h-full flex flex-col"
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyan-600/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center space-y-8 md:space-y-10 w-full max-w-3xl mt-[-2vh] md:mt-[-5vh]">
        
        <div className="flex items-center gap-4 text-cyan-500/40">
          <div className="h-[1px] w-12 md:w-16 bg-gradient-to-r from-transparent to-cyan-500/40" />
          <Orbit size={18} className="animate-[spin_20s_linear_infinite] opacity-50" />
          <div className="h-[1px] w-12 md:w-16 bg-gradient-to-l from-transparent to-cyan-500/40" />
        </div>

        {/* ⚡️ 修复点6：移动端文字缩小，防止被截断 */}
        <div className="text-center space-y-4 md:space-y-6 px-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-wide text-white/80 leading-[1.3]">
            If the universe is the <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-300">answer</span>, <br />
            what is the <span className="italic font-serif text-white/50 lowercase">question?</span>
          </h1>
          <p className="text-[10px] md:text-sm text-cyan-400/50 font-mono tracking-[0.2em] md:tracking-[0.4em] uppercase">
            Exploring the Nature of Reality
          </p>
        </div>

        <div className="relative py-3 md:py-4 px-6 md:px-10 border border-white/5 bg-white/[0.01] rounded-2xl backdrop-blur-sm group hover:border-cyan-500/20 transition-colors duration-700 mx-4">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl" />
          <p className="relative text-sm md:text-lg tracking-[0.4em] md:tracking-[0.6em] text-white/50 font-light ml-2 group-hover:text-cyan-100/80 transition-colors duration-700 text-center">
            判天地之美 · 析万物之理
          </p>
        </div>

        <div className="pt-4 md:pt-8">
          <button 
            onClick={onEnter} 
            className="group relative flex items-center gap-3 md:gap-4 px-6 md:px-8 py-3 bg-transparent border border-cyan-500/20 hover:border-cyan-400/60 rounded-full overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative text-[10px] md:text-xs text-cyan-50 tracking-[0.2em] uppercase font-mono">
              Initialize Sequence
            </span>
            <ArrowRight size={14} className="relative text-cyan-400 group-hover:translate-x-1.5 transition-transform duration-300" />
          </button>
        </div>

      </div>
    </div>
  );
}

function EssaysContent() {
  const essays = [
    { title: "杨氏双缝干涉", date: "2026-05-22", tag: "Optics", slug: "interference-of-light" },
    { title: "一道热力学平衡题目仿真", date: "2026-06-20", tag: ["热力学", "物理习题", "动画仿真"], slug: "sui-bi1" },
    { title: "暂时没想好写什么", date: "2026-03-02", tag: "QFT", slug: "path-integral" },
    { title: "暂时没想好写什么", date: "2026-03-02", tag: "QFT", slug: "path-integral" }
  ];
  return (
    <div className="space-y-6 md:space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white/90">随笔 Essays</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {essays.map((essay, i) => (
          <a href={`/notes/${essay.slug}`} key={i} className="block">
            <div className="group relative p-5 md:p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 hover:border-cyan-400/50 rounded-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)] backdrop-blur-md overflow-hidden flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full group-hover:bg-cyan-400/20 transition-all duration-700"></div>
              
              <div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform duration-500">
                    <FileText size={14} />
                  </span>
                  <span className="text-[10px] font-mono text-white/40 bg-black/30 border border-white/5 px-2 py-1 rounded-md">{essay.date}</span>
                </div>
                <h3 className="text-base md:text-lg font-medium text-white/80 group-hover:text-cyan-50 transition-colors leading-snug relative z-10">{essay.title}</h3>
              </div>
              
              <div className="mt-4 md:mt-6 flex items-center justify-between relative z-10">
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
    <div className="space-y-6 md:space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white/90 border-b border-white/10 pb-4">科研与研读笔记 Notes</h2>
      <div className="space-y-2 font-mono text-xs md:text-sm">
        {notes.map((note, i) => (
          <a href={`/notes/${note.slug}`} key={i} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white/[0.01] hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 cursor-pointer transition-all backdrop-blur-sm">
            <FileText size={16} className="text-cyan-500/50 shrink-0" />
            <span className="text-white/70 truncate">{note.title}.md</span>
            <span className="ml-auto text-white/20 text-[10px] md:text-xs shrink-0 hidden sm:block">Updated recently</span>
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
    { title: '测量电源内阻误差分析', slug: 'ce-dian-zu', desc: '内接法、外接法' },
    { title: '电介质的电磁性质及介质中的麦克斯韦方程组', slug: 'jie-zhi', desc: '介质中的麦克斯韦方程组' },
    { title: '保守力与非保守力-势能', slug: 'bao-shou-li', desc: '重力势能、电势能、弹簧弹性势能' },
    { title: '向心加速度的由来', slug: 'xiang-xin-a', desc: '向心加速度' },
    { title: '万有引力定律与天体运动', slug: 'tian-ti-yun-dong', desc: '天体运动' },
    { title: '欢迎投稿', slug: '待续', desc: '待续' },
    ];

  return (
    <div className="space-y-6 md:space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white/90">高中物理教学 Teaching</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {courses.map((course, i) => (
          <a href={`/notes/${course.slug}`} key={i} className="block">
            <div className="relative bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 hover:border-cyan-400/50 rounded-2xl p-5 md:p-6 flex flex-col transition-all duration-500 group cursor-pointer hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(34,211,238,0.2)] overflow-hidden min-h-[160px] md:min-h-[180px]">
              
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex items-center gap-4 mb-4 md:mb-5">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-500 shadow-inner shrink-0">
                   <Book size={18} className="md:w-5 md:h-5" />
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold text-white/90 group-hover:text-cyan-50 transition-colors tracking-wide">{course.title}</h3>
                <p className="text-xs md:text-sm text-white/40 mt-1.5 md:mt-2 leading-relaxed">{course.desc}</p>
              </div>

              <div className="mt-4 md:mt-6 flex items-center text-[10px] md:text-[11px] font-mono text-cyan-500/50 group-hover:text-cyan-400 transition-colors">
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
  const [activeMode, setActiveMode] = React.useState<'books' | 'slides'>('books');
  const [groupedData, setGroupedData] = React.useState<Record<string, any[]>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    setGroupedData({});
    
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
    <div className="space-y-6 md:space-y-8">
      <div className="border-b border-white/10 pb-4 md:pb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-4 md:mb-6">数字资源库 Digital Resources</h2>
        
        <div className="flex items-center gap-4 md:gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveMode('books')}
            className={`relative pb-2 text-sm md:text-[15px] font-medium transition-colors duration-300 whitespace-nowrap ${
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
            className={`relative pb-2 text-sm md:text-[15px] font-medium transition-colors duration-300 whitespace-nowrap ${
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

      {loading ? (
         <div className="flex flex-col items-center justify-center h-32 md:h-40 text-cyan-400/50 font-mono text-xs md:text-sm gap-3">
           <Orbit size={24} className="animate-spin text-cyan-400/70" />
           <span className="animate-pulse tracking-[0.2em] uppercase">调取数据矩阵中 Accessing Matrix...</span>
         </div>
      ) : Object.keys(groupedData).length === 0 ? (
         <div className="text-center py-10 md:py-20 text-white/20 font-mono text-xs md:text-sm border border-dashed border-white/5 rounded-2xl backdrop-blur-sm px-4">
           未探测到相关物理文件 No files detected.
         </div>
      ) : (
        <div className="space-y-8 md:space-y-10">
          {Object.entries(groupedData).map(([category, itemsList]) => (
            <div key={category} className="space-y-4 md:space-y-5">
              
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-1 md:w-1.5 h-3 md:h-4 bg-cyan-500/50 rounded-full" />
                <h3 className="text-base md:text-lg font-medium text-cyan-50 tracking-wide">{category}</h3>
                <span className="text-[10px] md:text-xs font-mono text-cyan-500/40 ml-1 md:ml-2">[{itemsList.length}]</span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent ml-2 md:ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                {itemsList.map((item, i) => (
                  <a href={encodeURI(item.link)} target="_blank" rel="noopener noreferrer" key={i} className="block group">
                    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-cyan-400/30 rounded-xl md:rounded-2xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(34,211,238,0.05)] backdrop-blur-sm">
                      
                      <div className="w-8 h-10 md:w-10 md:h-12 flex-shrink-0 bg-black/40 border border-white/10 rounded flex items-center justify-center text-cyan-500/50 group-hover:text-cyan-400 group-hover:border-cyan-400/30 transition-colors shadow-inner">
                        {item.link.match(/\.docx?$/i)
                          ? <FileText size={16} className="group-hover:scale-110 transition-transform duration-500" />
                          : item.link.match(/\.pptx?$/i)
                          ? <Presentation size={16} className="group-hover:scale-110 transition-transform duration-500" />
                          : <BookOpen size={16} className="group-hover:scale-110 transition-transform duration-500" />
                        }
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm md:text-[15px] font-medium text-white/80 group-hover:text-cyan-50 transition-colors truncate">
                          {item.title}
                        </h4>
                        <div className="mt-0.5 md:mt-1">
                          <span className="text-[9px] md:text-[10px] text-white/20 font-mono uppercase">
                            {item.link.match(/\.docx?$/i) ? 'WORD DOC' : item.link.match(/\.pptx?$/i) ? 'PPT DECK' : 'PDF DOC'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-white/[0.02] group-hover:bg-cyan-500/10 text-white/20 group-hover:text-cyan-400 transition-all duration-300">
                        <Download size={12} className="md:w-[14px] md:h-[14px]" />
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
    <div className="space-y-4 md:space-y-6 max-w-2xl text-white/70 leading-relaxed bg-white/[0.01] p-5 md:p-8 rounded-2xl border border-white/5 backdrop-blur-sm text-sm md:text-base">
      <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-4 md:mb-8">关于我</h2>
      <p>硕士毕业于华中师范大学粒子物理研究所，师从李新强教授。硕士研究课题聚焦于 U(3) 手征微扰论框架下 η′ → ππa 衰变过程的唯象研究。</p>
    </div>
  );
}

// ==========================================
// 动态粒子背景组件
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
    
    const handleClick = () => triggerClickCollision();

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
      x: number; y: number; angle: number; speed: number; life: number;
      maxLife: number; radius: number; color: string; curve: number; history: Point[];

      constructor(angle: number, speed: number, color: string) {
        this.x = cx; this.y = cy; this.angle = angle; this.speed = speed; 
        this.life = 120 + Math.random() * 60; this.maxLife = this.life; 
        this.radius = Math.random() * 1.5 + 0.5; this.color = color; 
        this.curve = (Math.random() - 0.5) * 0.02; this.history = [];
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
      r: number; alpha: number;
      constructor() { this.r = 5; this.alpha = 0.3; }
      update() { this.r += 4; this.alpha *= 0.95; }
      draw() {
        if (!ctx) return;
        ctx.beginPath(); ctx.arc(cx, cy, this.r, 0, Math.PI * 2); 
        ctx.strokeStyle = `rgba(0, 255, 255, ${this.alpha})`; ctx.lineWidth = 1; ctx.stroke();
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
        for (let i = 0; i < 25; i++) {
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
      
      ctx.save(); ctx.beginPath(); ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)'; 
      ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); 
      ctx.arc(cx, cy, 70, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

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