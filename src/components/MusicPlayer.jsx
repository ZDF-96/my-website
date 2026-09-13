"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// 歌词数据矩阵（买辣椒也用券《起风了》修正版）
const LYRICS = [
  { time: 0, text: "♪ 起风了 - 买辣椒也用券 ♪" },
  { time: 6.91, text: "作词：米果" },
  { time: 8.53, text: "作曲：高桥优" },
  { time: 10.56, text: "编曲：池窪浩一 (Kouichi Ikekubo)" },
  { time: 20.73, text: "（未经著作人许可，不得翻唱、翻录或使用）" },
  { time: 28.86, text: "这一路上走走停停" },
  { time: 32.02, text: "顺着少年漂流的痕迹" },
  { time: 35.19, text: "迈出车站的前一刻" },
  { time: 38.25, text: "竟有些犹豫" },
  { time: 41.33, text: "不禁笑这近乡情怯" },
  { time: 44.51, text: "仍无可避免" },
  { time: 46.84, text: "而长野的天" },
  { time: 48.39, text: "依旧那么暖" },
  { time: 49.82, text: "风吹起了从前" },
  { time: 52.19, text: "从前初识这世间" },
  { time: 55.23, text: "万般流连" },
  { time: 56.92, text: "看着天边似在眼前" },
  { time: 59.77, text: "也甘愿赴汤蹈火去走它一遍" },
  { time: 64.61, text: "如今走过这世间" },
  { time: 67.67, text: "万般流连" },
  { time: 69.42, text: "翻过岁月不同侧脸" },
  { time: 72.18, text: "措不及防闯入你的笑颜" },
  { time: 78.01, text: "我曾难自拔于世界之大" },
  { time: 81.84, text: "也沉溺于其中梦话" },
  { time: 85.04, text: "不得真假 不做挣扎 不惧笑话" },
  { time: 90.52, text: "我曾将青春翻涌成她" },
  { time: 94.09, text: "也曾指尖弹出盛夏" },
  { time: 96.99, text: "心之所动 且就随缘去吧" },
  { time: 102.83, text: "逆着光行走 任风吹雨打" },
  { time: 119.24, text: "短短的路走走停停" },
  { time: 122.51, text: "也有了几分的距离" },
  { time: 125.51, text: "不知抚摸的是故事 还是段心情" },
  { time: 131.78, text: "也许期待的不过是 与时间为敌" },
  { time: 137.22, text: "再次看到你" },
  { time: 138.77, text: "微凉晨光里" },
  { time: 140.25, text: "笑得很甜蜜" },
  { time: 142.60, text: "从前初识这世间" },
  { time: 145.62, text: "万般流连" },
  { time: 147.33, text: "看着天边似在眼前" },
  { time: 150.15, text: "也甘愿赴汤蹈火去走它一遍" },
  { time: 154.98, text: "如今走过这世间" },
  { time: 158.10, text: "万般流连" },
  { time: 159.81, text: "翻过岁月不同侧脸" },
  { time: 162.56, text: "措不及防闯入你的笑颜" },
  { time: 168.42, text: "我曾难自拔于世界之大" },
  { time: 172.24, text: "也沉溺于其中梦话" },
  { time: 175.46, text: "不得真假 不做挣扎 不惧笑话" },
  { time: 180.91, text: "我曾将青春翻涌成她" },
  { time: 184.48, text: "也曾指尖弹出盛夏" },
  { time: 187.36, text: "心之所动 且就随缘去吧" },
  { time: 218.31, text: "晚风吹起你鬓间的白发" },
  { time: 222.08, text: "抚平回忆留下的疤" },
  { time: 225.33, text: "你的眼中 明暗交杂 一笑生花" },
  { time: 230.79, text: "暮色遮住你蹒跚的步伐" },
  { time: 234.60, text: "走进床头藏起的画" },
  { time: 237.80, text: "画中的你 低着头说话" },
  { time: 243.26, text: "我仍感叹于世界之大" },
  { time: 246.76, text: "也沉醉于儿时情话" },
  { time: 249.77, text: "不剩真假 不做挣扎 无谓笑话" },
  { time: 255.70, text: "我终将青春还给了她" },
  { time: 259.23, text: "连同指尖弹出的盛夏" },
  { time: 262.68, text: "心之所动 就随风去了" },
  { time: 268.02, text: "以爱之名" },
  { time: 271.50, text: "你还愿意吗" }
];

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLyric, setCurrentLyric] = useState(LYRICS[0].text);
  
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
    }
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
    
    const activeLyric = LYRICS.slice().reverse().find(lyric => currentTime >= lyric.time);
    if (activeLyric && activeLyric.text !== currentLyric) {
      setCurrentLyric(activeLyric.text);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      
      {/* 🚀 赛博全息歌词舱 */}
      <div 
        className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right ${
          isPlaying ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="relative px-5 py-2.5 rounded-2xl bg-[#030305]/80 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.15)] overflow-hidden">
          {/* 背景微弱雷达光晕 */}
          <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(34,211,238,0.08)_50%,transparent_100%)] animate-[pulse_3s_ease-in-out_infinite]" />
          
          <div className="flex items-center gap-3 relative z-10">
            {/* 动态量子脉冲点 */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_8px_#22d3ee]"></span>
            </span>
            
            {/* 渐变发光歌词本体：带有强制重绘 Key */}
            <p 
              key={currentLyric} 
              className="text-xs md:text-sm font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
            >
              {currentLyric}
            </p>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src="/bgm.mp3" 
        loop 
        preload="auto"
        onTimeUpdate={handleTimeUpdate} 
      />
      
      <button
        onClick={togglePlay}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-[#030305]/60 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 text-cyan-500/70 hover:text-cyan-300 transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
        title={isPlaying ? "暂停环境音" : "开启环境音"}
      >
        {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </div>
  );
}