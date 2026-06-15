'use client';
import React, { useState } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  // 初始开场白也加上了 p 标签，保持格式统一
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
      // 提取出纯文本交给后端，丢弃前端专用的额外字段
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
      setMessages([...newMessages, { role: 'ai', text: '<p>网络连接失败，请稍后再试。</p>' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-[85vh] flex flex-col pt-20">
      {/* 头部标题 */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-sky-400 mb-2">全能 AI 问答专区</h1>
        {/* 这里帮你更新了文案，匹配你现在的 DeepSeek 引擎 */}
        <p className="text-gray-400">基于 DeepSeek 大模型，为你提供顶尖理科算力支持。</p>
      </div>

      {/* 聊天记录展示区 */}
      <div className="flex-1 overflow-y-auto bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-4 flex flex-col gap-4 backdrop-blur-sm">
        {messages.map((msg, i) => (
          <div key={i} className={`max-w-[85%] p-4 rounded-xl ${
            msg.role === 'user' 
              ? 'self-end bg-sky-600 text-white' 
              : 'self-start bg-slate-800 text-gray-100 border border-slate-700'
          }`}>
            {/* 核心改动：用户的提问用纯文本展示，AI 的回复用 HTML 渲染引擎展示 */}
            {msg.role === 'user' ? (
              <div className="whitespace-pre-wrap">{msg.text}</div>
            ) : (
              <div 
                className="ai-html-content flex flex-col gap-2"
                dangerouslySetInnerHTML={{ __html: msg.text }} 
              />
            )}
          </div>
        ))}
        {isLoading && <div className="text-sky-400 self-start p-4">AI 正在思考...</div>}
      </div>

      {/* 底部输入区 */}
      <div className="flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="在这里输入你的问题..."
          className="flex-1 p-4 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading}
          className="bg-sky-500 hover:bg-sky-400 text-white px-8 rounded-xl font-bold transition-colors disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}