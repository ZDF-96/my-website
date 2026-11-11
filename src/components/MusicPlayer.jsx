"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

// ============================================================
// 歌曲列表
// ============================================================
const SONGS = [
  {
    id: 'qifengle',
    title: '起风了',
    artist: '买辣椒也用券',
    src: '/bgm/bgm1.flac',
    lyrics: [
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
    ],
  },
  {
    id: 'tianliang-yiqian',
    title: '天亮以前说再见',
    artist: '曲肖冰',
    src: '/bgm/bgm2.flac',
    lyrics: [
      { time: 0.40, text: "♪ 天亮以前说再见 - 曲肖冰 ♪" },
      { time: 0.73, text: "词：康梓峰" },
      { time: 0.86, text: "曲：康梓峰" },
      { time: 0.99, text: "编曲：王柏鸿" },
      { time: 1.16, text: "录音：浔浔" },
      { time: 1.29, text: "缩混：张栩赫（Ethan）" },
      { time: 1.49, text: "和声：Kent王健" },
      { time: 1.65, text: "和声编写：Kent王健" },
      { time: 1.88, text: "制作人：浔浔" },
      { time: 2.05, text: "配唱制作人：浔浔" },
      { time: 2.28, text: "录音室：1803 Studio" },
      { time: 2.44, text: "混音室：Hot Music Studio" },
      { time: 2.64, text: "制作团队：KingStar音乐社团/柏鸿工作室" },
      { time: 3.10, text: "企划营销：梦童娱乐" },
      { time: 3.37, text: "监制：三千" },
      { time: 3.50, text: "OP：千和世纪" },
      { time: 27.46, text: "水花只能开在雨天" },
      { time: 33.38, text: "烟花要绽放在黑夜" },
      { time: 39.38, text: "雪花多舍不得冬天" },
      { time: 45.50, text: "像我舍不得和你说再见" },
      { time: 51.65, text: "谎言并不代表欺骗" },
      { time: 57.41, text: "诺言也不一定兑现" },
      { time: 63.29, text: "誓言就都留给时间" },
      { time: 69.29, text: "就请把从前留在今天" },
      { time: 76.23, text: "天亮以前说再见" },
      { time: 79.11, text: "笑着泪流满面" },
      { time: 82.06, text: "去迎接" },
      { time: 83.17, text: "应该你的" },
      { time: 85.05, text: "更好的明天" },
      { time: 88.08, text: "昙花若只一现" },
      { time: 91.09, text: "更要开的耀眼" },
      { time: 94.11, text: "别回头去拥有" },
      { time: 96.55, text: "属于你更好的世界" },
      { time: 100.12, text: "天亮以前说再见" },
      { time: 103.14, text: "让我留在今天" },
      { time: 106.16, text: "去保护" },
      { time: 107.24, text: "我和你的" },
      { time: 109.26, text: "最好的夏天" },
      { time: 112.11, text: "情丝若水三千" },
      { time: 115.11, text: "只取一瓢眷恋" },
      { time: 117.78, text: "当你来过的纪念" },
      { time: 123.49, text: "水花只能开在雨天" },
      { time: 129.34, text: "烟花要绽放在黑夜" },
      { time: 135.34, text: "雪花多舍不得冬天" },
      { time: 141.31, text: "像我舍不得和你说再见" },
      { time: 147.41, text: "谎言并不代表欺骗" },
      { time: 153.40, text: "诺言也不一定兑现" },
      { time: 159.35, text: "誓言就都留给时间" },
      { time: 165.45, text: "就请把从前留在今天" },
      { time: 172.16, text: "天亮以前说再见" },
      { time: 175.16, text: "笑着泪流满面" },
      { time: 178.20, text: "去迎接" },
      { time: 179.24, text: "应该你的" },
      { time: 181.15, text: "更好的明天" },
      { time: 184.17, text: "昙花若只一现" },
      { time: 187.08, text: "更要开的耀眼" },
      { time: 190.11, text: "别回头去拥有" },
      { time: 192.34, text: "属于你更好的世界" },
      { time: 196.15, text: "天亮以前说再见" },
      { time: 199.12, text: "让我留在今天" },
      { time: 202.13, text: "去保护" },
      { time: 203.24, text: "我和你的" },
      { time: 205.15, text: "最好的夏天" },
      { time: 208.19, text: "情丝若水三千" },
      { time: 211.15, text: "只取一瓢眷恋" },
      { time: 214.05, text: "当你来过的纪念" }
    ],
  },
  {
    id: 'unstoppable-perfect-isnt-pretty',
    title: "Unstoppable (Perfect Isn't Pretty Mix)",
    artist: 'Sia, Pusha T & Olodum',
    src: '/bgm/bgm3.flac',
    lyrics: [
      { time: 0, text: "♪ Unstoppable (Perfect Isn't Pretty Mix) ♪" },
      { time: 1.70, text: "Unstoppable (Perfect Isn't Pretty Mix - Ariel Rechtshaid Version)" },
      { time: 4.04, text: "Sia / Pusha T / Olodum" },
      { time: 5.67, text: "Written by: Sia Furler / Christopher Braide" },
      { time: 15.51, text: "Sia: I'll smile, I know what it takes to fool this town" },
      { time: 21.66, text: "I'll do it 'til the sun goes down and all through the night time" },
      { time: 28.00, text: "Oh yeah, oh yeah, I'll tell you what you wanna hear" },
      { time: 33.20, text: "Leave my sunglasses on while I shed a tear" },
      { time: 36.55, text: "It's never the right time, yeah" },
      { time: 41.73, text: "I'll put my armor on, show you how strong I am" },
      { time: 47.74, text: "I'll put my armor on, I'll show you that I am" },
      { time: 53.85, text: "I'm unstoppable" },
      { time: 56.86, text: "I'm a Porsche with no brakes" },
      { time: 59.99, text: "I'm invincible" },
      { time: 62.72, text: "Yeah, I'll win every single game" },
      { time: 66.02, text: "I'm so powerful" },
      { time: 68.70, text: "I don't need batteries to play" },
      { time: 71.99, text: "I'm unstoppable until you look the other way" },
      { time: 77.67, text: "Break down, only alone I will cry out loud" },
      { time: 81.56, text: "You'll never see what's hiding out" },
      { time: 84.67, text: "Hiding out deep down, yeah" },
      { time: 89.44, text: "I know, I've heard that to let your feelings show" },
      { time: 93.45, text: "Is the only way to make friendships grow" },
      { time: 96.53, text: "But I'm too afraid now, yeah" },
      { time: 101.78, text: "I'll put my armor on, show you how strong I am" },
      { time: 107.75, text: "I'll put my armor on, I'll show you that I am" },
      { time: 113.95, text: "I'm unstoppable" },
      { time: 116.75, text: "I'm a Porsche with no brakes" },
      { time: 119.79, text: "I'm invincible" },
      { time: 122.81, text: "I'll win every single game" },
      { time: 125.98, text: "I'm so powerful" },
      { time: 128.74, text: "I don't need batteries to play" },
      { time: 132.02, text: "I'm unstoppable until you look the other way" },
      { time: 138.78, text: "Look the other way" },
      { time: 141.77, text: "Look the other way" },
      { time: 144.60, text: "Look the other way" },
      { time: 147.35, text: "Until you look the other way" },
      { time: 149.00, text: "Pusha T: Yes" },
      { time: 149.74, text: "Pretty isn't perfect, they told me I was worthless" },
      { time: 152.49, text: "Had to dig deeper with my cleats at the surface" },
      { time: 155.46, text: "Way more than physical, this is soul searching" },
      { time: 158.53, text: "Pain from the pressure to perform equals purpose" },
      { time: 161.24, text: "No sympathy, nervous energy" },
      { time: 164.89, text: "Second place, one second, don't remember me" },
      { time: 168.67, text: "I'm not stopping 'til the end" },
      { time: 170.19, text: "Got the sun on my face and my back is to the wind, yeah" },
      { time: 173.80, text: "What don't kill you only makes you stronger, yes" },
      { time: 176.98, text: "The road to glory takes a little longer, yes" },
      { time: 179.92, text: "What don't kill you only makes you stronger, yes" },
      { time: 182.96, text: "I got the will to go a little longer" },
      { time: 186.05, text: "I got the will to go a little longer" },
      { time: 188.70, text: "Sia:" },
      { time: 189.73, text: "I'm unstoppable and I'm invincible" },
      { time: 204.33, text: "I'm unstoppable and I'm invincible" }
    ],
  },
];

export default function MusicPlayer() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentSong = SONGS[currentSongIndex];
  const [currentLyric, setCurrentLyric] = useState(currentSong.lyrics[0]?.text || "");

  // 绑定音频实例（保留初始值 null，兼容 JSX 与 TSX）
  const audioRef = useRef(null);

  // 初始化默认音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
    }
  }, []);

  // 切换曲目时重置首句歌词，并在播放状态下自动续播
  useEffect(() => {
    setCurrentLyric(currentSong.lyrics[0]?.text || `♪ ${currentSong.title} - ${currentSong.artist} ♪`);
    if (isPlaying && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentSongIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Audio playback failed:", err);
      });
    }
  };

  const prevSong = () => {
    setCurrentSongIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length);
  };

  const nextSong = () => {
    setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
  };

  // 监听播放进度，动态匹配当前时间轴对应的歌词
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
    const lyrics = currentSong.lyrics;

    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        if (lyrics[i].text !== currentLyric) {
          setCurrentLyric(lyrics[i].text);
        }
        break;
      }
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 select-none">
      {/* 全息悬浮歌词面板 */}
      <div
        className={`transition-all duration-700 ease-out ${
          isPlaying
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="px-4 py-2.5 rounded-2xl bg-[#030305]/75 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_25px_rgba(34,211,238,0.15)] flex flex-col items-end gap-1 max-w-xs sm:max-w-md">
          {/* 顶部曲目状态栏 */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="truncate max-w-[200px]">
              {currentSong.title} · {currentSong.artist}
            </span>
          </div>

          {/* 渐变发光动态歌词 */}
          <p
            key={currentLyric}
            className="text-xs md:text-sm font-mono font-medium bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent tracking-wider text-right drop-shadow-[0_0_8px_rgba(34,211,238,0.35)] transition-all duration-300"
          >
            {currentLyric}
          </p>
        </div>
      </div>

      {/* 原生音频引擎：一曲结束自动切换下一首 */}
      <audio
        ref={audioRef}
        src={currentSong.src}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextSong}
      />

      {/* 胶囊控制舱：上一首 / 播放暂停 / 下一首 */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#030305]/60 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.6)]">
        <button
          onClick={prevSong}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all duration-200"
          title="上一曲"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={togglePlay}
          className={`w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 ${
            isPlaying
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/30'
          }`}
          title={isPlaying ? "暂停音乐" : "播放音乐"}
        >
          {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          onClick={nextSong}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all duration-200"
          title="下一曲"
        >
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  );
}