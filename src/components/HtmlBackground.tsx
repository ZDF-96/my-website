"use client"; // 声明这是一个客户端组件

export default function HtmlBackground() {
  return (
    <iframe
      src="/beijing.html"
      // 使用 Tailwind CSS 将 iframe 固定在整个屏幕的最底层
      className="fixed top-0 left-0 w-full h-full -z-10 border-none pointer-events-none"
      title="dynamic-beijing-background"
    />
  );
}