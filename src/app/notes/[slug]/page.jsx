import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
// 【新增】引入数学公式解析插件
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
// 【关键新增】引入 KaTeX 样式表，否则数学公式会失去排版变成纯文本堆叠
import 'katex/dist/katex.min.css';

// 这是一个服务器端组件，Next.js 会在后台自动运行这些代码
export default async function NotePage({ params }) {
  // 【关键修改】在 Next.js 新版本中，必须使用 await 解析 params
  const { slug } = await params;

  try {
    // 1. 定位你的 markdown 文件：
    const filePath = path.join(process.cwd(), 'ke-jian-notes', `${slug}.md`);

    // 2. 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // 3. 使用 gray-matter 解析顶部的标题/日期 (data) 和文章正文 (content)
    const { data, content } = matter(fileContent);

    // 4. 将内容渲染为网页
    return (
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        {/* 显示文章标题 */}
        <h1 style={{ fontSize: '2.5rem', borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
          {data.title}
        </h1>
        
        {/* 显示文章日期 */}
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          发布日期: {data.date}
        </p>
        
        {/* 【关键修改】在 ReactMarkdown 中激活数学插件 */}
        <article style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
          <ReactMarkdown 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </main>
    );

  } catch (error) {
    // 如果你在浏览器里输入了一个不存在的文章网址，就会显示这个 404 页面
    return (
      <main style={{ padding: '4rem', textAlign: 'center' }}>
        <h1>找不到这篇笔记 😢</h1>
        <p>请检查对应的 markdown 文件是否存在于 ke-jian-notes 文件夹中。</p>
      </main>
    );
  }
}