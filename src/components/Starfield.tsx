"use client"; // 告诉 Next.js 这是一个需要在浏览器端运行的客户端组件

import { useEffect, useRef } from 'react';

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. 设置画布尺寸填满屏幕
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // 2. 初始化星星数据 (位置、大小、速度、透明度)
    const stars = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      speed: Math.random() * 0.3 + 0.1, // 匀速直线运动的速度
      alpha: Math.random(),
      alphaChange: (Math.random() - 0.5) * 0.02 // 控制闪烁频率
    }));

    // 3. 动画渲染循环
    let animationFrameId: number;
    const render = () => {
      // 绘制深色太空背景
      ctx.fillStyle = '#050510'; // 极深的蓝黑色
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制每一颗星星
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();

        // 运动学逻辑：缓慢向上运动
        star.y -= star.speed;
        
        // 闪烁逻辑：透明度简谐变化
        star.alpha += star.alphaChange;
        if (star.alpha <= 0.1 || star.alpha >= 1) {
          star.alphaChange = -star.alphaChange;
        }

        // 边界条件：飞出屏幕顶部后，从底部重新进入
        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // 组件卸载时清理内存
    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Tailwind CSS 定位：固定在屏幕最底层
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
}