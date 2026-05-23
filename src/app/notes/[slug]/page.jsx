import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// 【新增】引入你的交互模拟器
import InterferenceSimulator from '@/components/physics-dong-hua/InterferenceSimulator';

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
      <main 
        className="min-h-screen bg-[#050508] p-6 md:p-12"
        style={{ fontFamily: 'sans-serif' }}
      >
        <div className="max-w-3xl mx-auto">
          {/* 标题部分：纯白高亮 */}
          <h1 className="text-4xl md:text-5xl font-bold text-white border-b border-white/10 pb-6 mb-4">
            {data.title}
          </h1>
          
          {/* 日期部分：浅灰 */}
          <p className="text-indigo-300/60 font-mono text-sm mb-10">
            发布日期: {displayDate}
          </p>
          
          {/* 正文部分：浅灰文字，青色高亮 */}
          <article 
            className="prose prose-invert prose-lg max-w-none" 
            style={{ 
              lineHeight: '1.8', 
              fontSize: '1.1rem', 
              color: '#E5E7EB' 
            }}
          >
            <ReactMarkdown 
              remarkPlugins={[remarkMath]} 
              rehypePlugins={[rehypeKatex]}
            >
              {content}
            </ReactMarkdown>
          </article>

          {/* 直接把按钮挂载在文章最底下，去掉了原本的文件名限制 */}
          <div className="mt-16 border-t border-white/10 pt-10 pb-20">
             <InterferenceSimulator />
          </div>

        </div>
      </main>
    );

  } catch (error) {
    return (
      <main className="min-h-screen bg-[#050508] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">找不到这篇笔记 😢</h1>
          <p className="text-white/50">请检查对应的 markdown 文件是否存在于 ke-jian-notes 文件夹中。</p>
        </div>
      </main>
    );
  }
}