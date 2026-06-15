'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Bot } from 'lucide-react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: '<p>你好！我是《物理世界》的专属 AI。请随时提问！（少问点，每次回答都在烧钱！）</p>' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = newMessages.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      const data = await res.json();
      setMessages([...newMessages, { role: 'ai', text: data.reply || data.error }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'ai', text: '<p>量子链路断开，请稍后再试。</p>' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#030305] text-white overflow-hidden font-sans flex flex-col selection:bg-cyan-500/30">
      
      {/* 🌌 1. 注入全站统一的自定义 HTML 动态背景（像素级同步讲义视觉） */}
      <iframe 
        src="/beijing.html" 
        className="absolute inset-0 w-full h-full border-none z-0 pointer-events-none opacity-60" 
        title="Custom Background"
        aria-hidden="true"
      />

      {/* header 2. 复制主页完全平级的磨砂玻璃顶栏 header */}
      <header className="relative w-full z-30 h-16 bg-[#030305]/40 backdrop-blur-md border-b border-white/5 flex items-center px-8 justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-cyan-500/50">
          <Sparkles size={16} />
          <span className="text-xs font-mono tracking-widest uppercase">Quantum Portal // AI 答疑</span>
        </div>
        {/* （右侧的菜单按钮已移除，因为返回按钮放到了下方主体区域左侧） */}
      </header>

      {/* 💬 3. 聊天内容主体容器 */}
      <div className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col overflow-hidden pt-10">
        
        {/* ✨ 完美还原极简返回按钮：靠左、无框、纯文字 ✨ */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-300 mb-8 font-mono text-sm transition-colors self-start"
        >
          &larr; 返回主页
        </Link>

        {/* 标题区 */}
        <div className="text-center mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold text-sky-400 mb-2 flex items-center justify-center gap-2">
            <Bot size={28} className="text-sky-400 animate-pulse" />
            全能 AI 问答专区
          </h1>
          <p className="text-gray-400 text-sm">基于 DeepSeek 大模型，为你提供顶尖理科算力支持。</p>
        </div>

        {/* 聊天记录展示区 */}
        <div className="flex-1 overflow-y-auto bg-slate-900/40 border border-white/5 rounded-xl p-4 mb-4 flex flex-col gap-4 backdrop-blur-md scroll-smooth">
          {messages.map((msg, i) => (
            <div key={i} className={`max-w-[85%] p-4 rounded-xl shadow-lg ${
              msg.role === 'user' 
                ? 'self-end bg-sky-600/90 text-white border border-sky-500/30' 
                : 'self-start bg-slate-800/60 text-gray-100 border border-white/5'
            }`}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.text}</div>
              ) : (
                <div 
                  className="ai-html-content flex flex-col gap-2 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: msg.text }} 
                />
              )}
            </div>
          ))}
          {isLoading && <div className="text-sky-400 self-start p-4 font-mono text-sm animate-pulse">AI 正在调用量子矩阵思考中...</div>}
        </div>

        {/* 底部输入区 */}
        <div className="flex gap-2 flex-shrink-0 pb-2">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="输入你的物理难题或想法..."
            className="flex-1 p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-500/60 transition-colors backdrop-blur-sm placeholder:text-white/20 text-sm"
          />
          <button 
            onClick={sendMessage} 
            disabled={isLoading}
            className="bg-cyan-600/80 hover:bg-cyan-500 border border-cyan-400/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] text-white px-8 rounded-xl font-bold transition-all disabled:opacity-50 text-sm tracking-widest"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}