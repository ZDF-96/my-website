 import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. 引入你刚刚写好的 HTML 背景组件
import HtmlBackground from "@/components/HtmlBackground"; 

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
        {/* 2. 放置 HTML 背景（确保它在 children 外部且位于最底层） */}
        <HtmlBackground /> 
        
        {/* 网站主体内容 */}
        <div className="relative z-0">
          {children}
        </div>
      </body>
    </html>
  );
}