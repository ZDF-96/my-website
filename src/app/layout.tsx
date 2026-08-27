 import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 引入 KaTeX 核心样式表，确保数学公式正确渲染
import "katex/dist/katex.min.css"; 

// 引入全局背景组件
import HtmlBackground from "@/components/HtmlBackground"; 

const inter = Inter({ subsets: ["latin"] });

// 配置视口参数，确保移动端 1:1 渲染与完美适配
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // 限制最大缩放比例，防止用户双击屏幕意外破坏排版
};

// 配置站点全局元数据
export const metadata: Metadata = {
  title: "我的物理空间",
  description: "个人主页与物理教学课件",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} text-gray-100 min-h-screen`}>
        {/* 1. 全局背景层 */}
        <HtmlBackground /> 

        {/* 2. 网站主体内容容器（涵盖首页、讲义及 AI 问答等子页面） */}
        <div className="relative z-0">
          {children}
        </div>
      </body>
    </html>
  );
}