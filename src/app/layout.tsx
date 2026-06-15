import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 引入 KaTeX 的核心样式表，让公式排版生效
import 'katex/dist/katex.min.css'; 

// 引入背景组件
import HtmlBackground from "@/components/HtmlBackground"; 
// ⚠️ 已经删除了 AiZhuShou 的 import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "我的物理空间",
  description: "个人主页与教学课件",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} text-gray-100 min-h-screen`}>
        {/* 1. 全局 HTML 背景 */}
        <HtmlBackground /> 
        
        {/* 2. 网站主体容器 */}
        <div className="relative z-0">
          
          {/* ⚠️ 已经删除了全局挂载的 <AiZhuShou /> */}

          {/* 页面的具体内容（首页、讲义、以及咱们新建的 /chat 页面） */}
          {children}
          
        </div>
      </body>
    </html>
  );
}