import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden font-sans bg-transparent text-white selection:bg-cyan-500/30">

      {/* 🌌 极简暗黑渐变遮罩，压暗底层动画，凸显文字 */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-br from-black/80 via-black/40 to-black/90" />

      {/* 🌟 核心内容容器 */}
      <main className="relative z-[10] w-full max-w-7xl mx-auto px-6 py-12 md:py-24">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

          {/* ========================================== */}
          {/* 左侧：文字信息区 (大留白、档案式排版) */}
          {/* ========================================== */}
          {/* 优化点1：减小了大模块之间的间距 space-y-16 -> space-y-10 */}
          <div className="lg:col-span-7 flex flex-col space-y-10">
            
            {/* 1. 标题区 (左对齐，极具冲击力) */}
            <header className="space-y-5">
              <div className="flex items-center gap-4 text-cyan-400 font-mono text-xs tracking-[0.4em] uppercase opacity-80">
                <span className="w-8 h-[1px] bg-cyan-400" />
                QUANTUM COLLIDER SYSTEM
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.15em] leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-cyan-200/50">
                格物致理<br />
                <span className="text-4xl md:text-5xl lg:text-6xl opacity-90">琢玉成器</span>
              </h1>
              
              <p className="text-white/40 text-sm tracking-widest font-light">
                TEACHING & RESEARCH DOSSIER // PERSONAL PROFILE
              </p>
            </header>

            {/* 2. 基本信息区 (色彩层级优化，拒绝单调) */}
            {/* 优化点2：减小列表项间距 space-y-5 -> space-y-3 */}
            <section className="space-y-3 pt-4">
              {[
                { zh: '姓名', en: 'NAME', val: '吴　涛' },
                { zh: '籍贯', en: 'ORIGIN', val: '云南曲靖' },
                { zh: '政治面貌', en: 'STATUS', val: '中共党员' },
                { zh: '职业', en: 'OCCUPATION', val: '高中物理教师' },
                { zh: '最高学历', en: 'EDUCATION', val: '华中师范大学 · 硕士' },
              ].map((item, index) => (
                <div 
                  key={index} 
                  // 优化点3：减小底部内边距 pb-3 -> pb-2，弱化边框颜色 border-white/10 -> border-white/5
                  className="group flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/5 pb-2 hover:border-cyan-500/40 transition-all duration-500"
                >
                  {/* 左侧 Label：中文半透明白，英文微弱青色点缀 */}
                  <div className="flex items-center gap-3 mb-1 sm:mb-0">
                    <span className="text-white/50 text-sm tracking-[0.2em] font-light group-hover:text-cyan-400 transition-colors">
                      {item.zh}
                    </span>
                    <span className="text-cyan-500/30 text-[10px] font-mono tracking-widest group-hover:text-cyan-400/50 transition-colors">
                      // {item.en}
                    </span>
                  </div>
                  
                  {/* 右侧 Value：改用淡青色白(cyan-50)与细体(font-light)，统一科技感 */}
                  <span className="text-cyan-50 text-base tracking-[0.15em] font-light group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] transition-all duration-500">
                    {item.val}
                  </span>
                </div>
              ))}
            </section>

            {/* 3. 详情与兴趣区 (极简线条风格) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-white/10">
              
              {/* 研究兴趣 */}
              <div className="space-y-5">
                <h3 className="text-sm text-cyan-400 tracking-[0.2em] font-mono flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rotate-45 shadow-[0_0_8px_#22d3ee]" />
                  研究兴趣
                </h3>
                <ul className="space-y-3 text-white/70 text-sm tracking-wider font-light leading-relaxed">
                  <li className="flex items-start gap-3 group">
                    <span className="text-cyan-500/50 mt-1 text-[10px] font-mono group-hover:text-cyan-400 transition-colors">01</span>
                    <span className="group-hover:text-cyan-50 transition-colors">中医文化与哲学</span>
                  </li>
                  <li className="flex items-start gap-3 group">
                    <span className="text-cyan-500/50 mt-1 text-[10px] font-mono group-hover:text-cyan-400 transition-colors">02</span>
                    <span className="group-hover:text-cyan-50 transition-colors">易经与自然规律</span>
                  </li>
                  <li className="flex items-start gap-3 group">
                    <span className="text-cyan-500/50 mt-1 text-[10px] font-mono group-hover:text-cyan-400 transition-colors">03</span>
                    <span className="group-hover:text-cyan-50 transition-colors">物理教育与思维建构</span>
                  </li>
                </ul>
              </div>

              {/* 关于本站 */}
              <div className="space-y-5">
                <h3 className="text-sm text-cyan-400 tracking-[0.2em] font-mono flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rotate-45 shadow-[0_0_8px_#22d3ee]" />
                  系统说明
                </h3>
                <p className="text-white/60 text-sm tracking-wider font-light leading-loose text-justify">
                  本站节点用于整理前沿教学资料、核心课件与科研笔记。致力于构建一个开放、严谨的物理教学与学术思想交流场域。
                </p>
              </div>

            </section>

          </div>

          {/* ========================================== */}
          {/* 右侧：图像区 (全彩肖像、保留科技感框架) */}
          {/* ========================================== */}
          <div className="lg:col-span-5 relative w-full flex justify-center lg:justify-end lg:sticky lg:top-24 mt-12 lg:mt-0">
            
            <div className="group relative w-full max-w-[380px] aspect-[3/4] p-1 cursor-pointer">
              
              {/* 四角瞄准标记 */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/40 z-20 transition-all duration-500 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:border-cyan-300 group-hover:shadow-[-4px_-4px_12px_rgba(34,211,238,0.2)]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/40 z-20 transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:border-cyan-300 group-hover:shadow-[4px_-4px_12px_rgba(34,211,238,0.2)]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/40 z-20 transition-all duration-500 group-hover:-translate-x-1 group-hover:translate-y-1 group-hover:border-cyan-300 group-hover:shadow-[-4px_4px_12px_rgba(34,211,238,0.2)]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/40 z-20 transition-all duration-500 group-hover:translate-x-1 group-hover:translate-y-1 group-hover:border-cyan-300 group-hover:shadow-[4px_4px_12px_rgba(34,211,238,0.2)]" />

              <div className="absolute inset-0 bg-cyan-500/5 blur-3xl z-0 transition-opacity duration-500 group-hover:bg-cyan-500/15" />

              <div className="relative w-full h-full overflow-hidden z-10 border border-white/5 group-hover:border-cyan-400/20 transition-colors duration-500">
                
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none z-20 opacity-30 mix-blend-screen" />
                
                <img
                  src="/avatar.jpg"
                  alt="吴涛老师头像"
                  className="w-full h-full object-cover transition-transform duration-700 scale-105 group-hover:scale-100 opacity-90 group-hover:opacity-100"
                />
                
                <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-30">
                  <div className="text-cyan-400/90 font-mono text-xs tracking-widest uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">ID: WU_TAO_01</div>
                  <div className="text-white/30 text-[10px] font-mono mt-1.5 tracking-widest">AUTHORIZATION: LEVEL 5</div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ========================================== */}
        {/* 底部区：极简联络信息 */}
        {/* ========================================== */}
        <footer className="mt-20 pt-6 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-white/40 tracking-[0.2em] font-mono">
          <div className="font-light">
            © {new Date().getFullYear()} 沾益区第三中学 // 物理教研
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 font-light">
            <span className="hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-2">
              <span className="w-1 h-1 bg-white/20 rounded-full" /> QQ: 3300272081
            </span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-2">
              <span className="w-1 h-1 bg-white/20 rounded-full" /> MAIL: pengyy168888@gmail.com
            </span>
          </div>
        </footer>

      </main>
    </div>
  );
}