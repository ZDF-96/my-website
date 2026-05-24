import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// 引入你的交互模拟器 (确保路径正确)
import InterferenceSimulator from '@/components/physics-dong-hua/InterferenceSimulator';
import NewtonRingsSimulator from '@/components/physics-dong-hua/niu-dun-huan-donghua';

export default async function NotePage({ params }) {
  const { slug } = await params;

  try {
    const filePath = path.join(process.cwd(), 'ke-jian-notes', `${slug}.md`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    let displayDate = "未知日期";
    if (data.date) {
      if (data.date instanceof Date) {
        displayDate = data.date.toLocaleDateString('zh-CN');
      } else {
        displayDate = String(data.date);
      }
    }

    return (
      <div className="relative min-h-screen bg-[#030305] text-white font-sans">
        
        {/* 🌌 动态背景：调用你的 beijing.html */}
        <iframe 
          src="/beijing.html" 
          className="fixed inset-0 w-full h-full border-none z-0 pointer-events-none opacity-80"
          title="Background Animation"
        />

        <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
          
          {/* 🔙 返回按钮 */}
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-300 mb-8 font-mono text-sm transition-colors"
          >
            &larr; 返回主页
          </a>
          
          {/* 📝 文章面板：半透明磨砂质感 */}
          <article className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-14 rounded-3xl shadow-2xl">
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {data.title || '未命名笔记'}
            </h1>
            
            <p className="text-cyan-300/60 font-mono text-sm mb-10 pb-6 border-b border-white/10">
              发布日期: {displayDate}
            </p>
            
            {/* 🎨 免安装排版魔法：利用原生 CSS 美化内容 */}
            <div className="
              text-[#E5E7EB] leading-loose text-lg tracking-wide
              [&>p]:mb-6 [&>p]:indent-8
              [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-cyan-50 [&>h2]:mt-12 [&>h2]:mb-6
              [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-cyan-200 [&>h3]:mt-10 [&>h3]:mb-4
              [&>blockquote]:border-l-4 [&>blockquote]:border-cyan-500 [&>blockquote]:bg-cyan-900/20 [&>blockquote]:p-5 [&>blockquote]:my-8 [&>blockquote]:rounded-r-lg [&>blockquote>p]:indent-0 [&>blockquote>p]:mb-0
              [&>ul]:list-disc [&>ul]:pl-8 [&>ul]:mb-6
              [&>ol]:list-decimal [&>ol]:pl-8 [&>ol]:mb-6
            ">
              <ReactMarkdown 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
              >
                {content}
              </ReactMarkdown>
            </div>

            {/* 🔬 智能物理实验室闸口：根据 slug 自动加载对应的模拟器 */}
            <div className="mt-16 border-t border-white/10 pt-10 pb-10">
               {slug === 'guang-de-gan-she' && <InterferenceSimulator />}
               {slug === 'niudunhuan' && <NewtonRingsSimulator />}
            </div>

          </article>
        </main>
      </div>
    );

  } catch (error) {
    return (
      <div className="relative min-h-screen bg-[#030305] flex items-center justify-center text-white font-sans">
        <div className="relative z-10 text-center bg-black/40 backdrop-blur-xl border border-white/10 p-12 rounded-3xl">
          <h1 className="text-2xl font-bold mb-4">找不到这篇笔记 😢</h1>
          <p className="text-gray-400 mb-6 text-sm">未能找到对应的 Markdown 文件</p>
          <a href="/" className="px-6 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full transition-colors hover:bg-cyan-500/40">
            返回主页
          </a>
        </div>
      </div>
    );
  }
}