 'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, CheckCircle, KeyRound, Loader2, Sparkles, UserX, HeartHandshake, Terminal } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState('paid'); // 默认展示付费模块
  const [inputValue, setInputValue] = useState(''); 
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [hasUsedFree, setHasUsedFree] = useState(false);
  
  // ✅ 已修复：删除了重复声明的 router，保留唯一实例
  const router = useRouter();

  // 🌟 页面加载时自动检测，如果是“过期”才来到这个页面的，就弹窗提醒！
  useEffect(() => {
    const expireTime = localStorage.getItem('physics_vip_expire');
    // 如果本地存了过期时间，并且当前时间已经超过了那个时间
    if (expireTime && Date.now() > parseInt(expireTime)) {
      alert("⏳ 您的 30 天专属通行证已到期！\n\n感谢您过去一个月的支持，请重新验证最新暗号或再次赞助以恢复访问权限。");
      // 提醒完就清除记录，防止每次刷新页面都无限弹窗
      localStorage.removeItem('physics_vip_expire'); 
    }
  }, []);

  const grantAccess = (days) => {
    // 1. 设置负责物理拦截的 Cookie（浏览器自动控制寿命）
    const maxAge = days * 86400; 
    document.cookie = `physics_auth=granted; path=/; max-age=${maxAge}`;
    
    // 2. 🌟 在本地浏览器备忘录里，悄悄记下具体的“过期时间戳”
    const expireTimestamp = Date.now() + days * 86400 * 1000;
    localStorage.setItem('physics_vip_expire', expireTimestamp);

    router.push('/');
    router.refresh();
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setInputValue('');
    setError(false);
  };

  // 🛡️ 模块一：站长专属登录
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);

    setTimeout(() => {
      // ⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️
      // 👑 【站长后台密码修改处】 👑
      // 想要修改你的管理员密码，就改下面双引号里的数字
      const adminPassword = "472926"; 
      // ⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️
      
      if (inputValue === adminPassword) {
        setPaySuccess(true);
        setTimeout(() => grantAccess(3650), 800); // 站长直给 10 年
      } else {
        setError(true);
        setErrorMsg("最高权限指令错误，拒绝访问");
        setIsVerifying(false);
      }
    }, 500);
  };

  // 💎 模块二：付费用户登录 (极简固定暗号)
  const handlePaidLogin = (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);

    setTimeout(() => {
      // ⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️
      // 💰 【付费用户暗号修改处】 💰
      // 当你觉得旧暗号泄露太多，需要更换新暗号时，修改下面双引号里的内容：
      // (注意：改完这里后，一定要记得去爱发电后台，把【自动回复】里的文字也同步改掉！)
      const currentVipPassword = "PHYSICS-VIP-6688"; 
      // ⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️
      
      if (inputValue === currentVipPassword) {
        setPaySuccess(true);
        setTimeout(() => grantAccess(30), 800); // 付费用户给 30 天
      } else {
        setError(true);
        setErrorMsg("密钥不正确或已失效，请检查");
        setIsVerifying(false);
      }
    }, 500);
  };

  // 🎁 模块三：新客免费体验 (调用 Vercel KV / Upstash)
  const handleFreeAccess = async () => {
    if (hasUsedFree) return;
    setIsVerifying(true);
    setError(false);

    try {
      const res = await fetch('/api/free-trial', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPaySuccess(true);
        setTimeout(() => grantAccess(1), 1000); // 免费体验给 1 天
      } else {
        setIsVerifying(false);
        setHasUsedFree(true); 
      }
    } catch (err) {
      setIsVerifying(false);
      alert("探测网络异常，请稍后再试。");
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] mx-4 p-8 sm:p-10 rounded-3xl bg-white/[0.03] border border-white/[0.08] shadow-[0_0_80px_rgba(34,211,238,0.06)] backdrop-blur-2xl"
      >
        {/* 顶部动态 Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-5 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            {mode === 'admin' ? <Terminal className="text-cyan-400 w-8 h-8" /> : mode === 'paid' ? <HeartHandshake className="text-purple-400 w-8 h-8" /> : <Sparkles className="text-cyan-400 w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest">个人物理讲义+仿真网站</h1>
        </div>

        {/* 三模块切换器 */}
        <div className="grid grid-cols-3 bg-black/50 p-1 mb-8 rounded-xl border border-white/5 shadow-inner text-center">
          <button onClick={() => switchMode('admin')} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'admin' ? 'bg-white/10 text-cyan-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            管理员登录
          </button>
          <button onClick={() => switchMode('paid')} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'paid' ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            赞助解锁
          </button>
          <button onClick={() => switchMode('free')} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'free' ? 'bg-white/10 text-cyan-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            新客免费
          </button>
        </div>

        <div className="min-h-[260px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* 模块一：管理员登录 */}
            {mode === 'admin' && (
              <motion.form key="admin" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} onSubmit={handleAdminLogin} className="space-y-6 w-full">
                <div className="text-center mb-4">
                  <p className="text-xs text-cyan-400/70 tracking-widest">Administrator Access</p>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Terminal className="w-5 h-5 text-cyan-500/50" />
                  </div>
                  <input
                    type="password"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="请输入管理员密码..."
                    disabled={isVerifying || paySuccess}
                    className={`w-full bg-black/40 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'} rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 font-mono tracking-widest text-sm`}
                  />
                  {error && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-red-400 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={isVerifying || paySuccess || !inputValue} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium transition-all duration-300 disabled:opacity-40">
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : paySuccess ? <CheckCircle className="w-5 h-5 text-green-400" /> : <span>验证指令并登入</span>}
                </button>
              </motion.form>
            )}

            {/* 模块二：付费用户验证 */}
            {mode === 'paid' && (
              <motion.form key="paid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onSubmit={handlePaidLogin} className="flex flex-col items-center space-y-5 w-full">
                
                <button onClick={() => window.open('https://ifdian.net/a/wutaophys', '_blank')} type="button" className="w-full py-4 flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <Zap className="w-4 h-4 text-purple-400" /> <span>获取专属密码 (前往爱发电)</span>
                </button>

                <div className="relative group w-full mt-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="w-5 h-5 text-cyan-500/50" />
                  </div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="请输入爱发电私信中的暗号..."
                    disabled={isVerifying || paySuccess}
                    className={`w-full bg-black/40 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'} rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 font-mono tracking-widest text-sm`}
                  />
                  {error && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-red-400 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isVerifying || paySuccess || !inputValue} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium transition-all duration-300 disabled:opacity-40">
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : paySuccess ? <CheckCircle className="w-5 h-5 text-green-400" /> : <span>验证暗号并解锁 30 天</span>}
                </button>
              </motion.form>
            )}

            {/* 模块三：新客免费体验 */}
            {mode === 'free' && (
              <motion.div key="free" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="flex flex-col items-center space-y-6 w-full text-center mt-4">
                {hasUsedFree ? (
                   <div className="space-y-2 text-red-400 flex flex-col items-center"><UserX className="w-6 h-6 mb-2"/>IP 体验额度已耗尽</div>
                ) : (
                  <button onClick={handleFreeAccess} disabled={isVerifying} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium hover:brightness-110 transition-all duration-300">
                    {isVerifying ? <Loader2 className="animate-spin w-5 h-5"/> : <span>绑定当前 IP 激活单日体验</span>}
                  </button>
                )}
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}