 'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldAlert, Zap, CheckCircle, KeyRound, Loader2, Sparkles, UserX, HeartHandshake } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState('verify'); // 默认模式改为查单号
  const [inputValue, setInputValue] = useState(''); // 存用户输入的单号
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [hasUsedFree, setHasUsedFree] = useState(false);
  
  const router = useRouter();

  // ⚡️ 核心：发送单号给后端查账 -> 拿密码 -> 放行
  const handleVerifyOrder = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);
    
    // 站长专属后门：如果你直接输入这个密码，不查爱发电直接放行
    if (inputValue === '472926') {
      grantAccess(30);
      return;
    }

    try {
      // 规范地向后端发送 JSON
      const res = await fetch('/api/afdian/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: inputValue }) 
      });
      
      const data = await res.json();

      if (data.success) {
        // 查账成功！弹出密码并放行
        setPaySuccess(true);
        alert(`🎉 核验成功！\n\n今日专属防刷密钥为：【 ${data.dynamicPassword} 】\n\n系统已为您自动放行，即将跃迁进入物理宇宙！`);
        setTimeout(() => grantAccess(30), 1000); 
      } else {
        // 查无此单或报错
        setError(true);
        setErrorMsg(data.message);
        setIsVerifying(false);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setErrorMsg("网络请求失败，请检查连接");
      setIsVerifying(false);
    }
  };

  const grantAccess = (days = 1) => {
    const maxAge = days * 86400; 
    document.cookie = `physics_auth=granted; path=/; max-age=${maxAge}`;
    router.push('/');
    router.refresh();
  };

  const handleInitiateAfdian = (e) => {
    e.preventDefault();
    window.open('https://ifdian.net/a/wutaophys', '_blank');
  };

  // Upstash 免费体验逻辑保留
  const handleFreeAccess = async () => {
    if (hasUsedFree) return;
    setIsVerifying(true);
    try {
      const res = await fetch('/api/free-trial', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPaySuccess(true);
        setTimeout(() => grantAccess(1), 1000);
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
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-5 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            {mode === 'verify' ? <Lock className="text-cyan-400 w-8 h-8" /> : mode === 'pay' ? <HeartHandshake className="text-purple-400 w-8 h-8" /> : <Sparkles className="text-cyan-400 w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest">物理宇宙网关</h1>
        </div>

        <div className="grid grid-cols-3 bg-black/50 p-1 mb-8 rounded-xl border border-white/5 shadow-inner text-center">
          <button onClick={() => { setMode('verify'); setError(false); }} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'verify' ? 'bg-white/10 text-cyan-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            单号核验
          </button>
          <button onClick={() => { setMode('pay'); setError(false); }} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'pay' ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            赞助获取
          </button>
          <button onClick={() => { setMode('free'); setError(false); }} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'free' ? 'bg-white/10 text-cyan-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            新客免费
          </button>
        </div>

        <div className="min-h-[220px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* 模式一：输入付款单号核验 */}
            {mode === 'verify' && (
              <motion.form key="verify" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} onSubmit={handleVerifyOrder} className="space-y-6 w-full">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="w-5 h-5 text-cyan-500/50" />
                  </div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="请输入爱发电付款单号..."
                    disabled={isVerifying || paySuccess}
                    className={`w-full bg-black/40 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'} rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 font-mono tracking-widest text-sm`}
                  />
                  {error && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-red-400 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{errorMsg || "未找到订单，请核对单号"}</span>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={isVerifying || paySuccess || !inputValue} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium transition-all duration-300 disabled:opacity-40">
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : paySuccess ? <CheckCircle className="w-5 h-5 text-green-400" /> : <span>核实单号并获取密码</span>}
                </button>
              </motion.form>
            )}

            {/* 模式二和三保持不变 */}
            {mode === 'pay' && (
              <motion.div key="pay" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center space-y-6 w-full">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-widest">赞助获取通行证</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                    赞助获取本站 <span className="text-purple-400 font-bold">30天全功能通行证</span>。完成后请复制付款单号前往左侧验证。
                  </p>
                </div>
                <button onClick={handleInitiateAfdian} className="w-full py-4 flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <Zap className="w-4 h-4 text-purple-400" /> <span>前往「爱发电」赞助</span>
                </button>
              </motion.div>
            )}

            {mode === 'free' && (
              <motion.div key="free" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="flex flex-col items-center space-y-6 w-full text-center">
                {hasUsedFree ? (
                   <div className="space-y-2 text-red-400"><UserX className="w-6 h-6 mx-auto mb-2"/>免费额度已耗尽</div>
                ) : (
                  <button onClick={handleFreeAccess} disabled={isVerifying} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium">
                    {isVerifying ? <Loader2 className="animate-spin w-5 h-5"/> : <span>绑定 IP 激活体验</span>}
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