 'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldAlert, Zap, CheckCircle, KeyRound, Loader2, Sparkles, UserX, HeartHandshake } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState('password'); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  
  // 爱发电自动化专属状态
  const [orderId, setOrderId] = useState(null);
  const [payStatus, setPayStatus] = useState('idle'); // idle, waiting, success
  
  const [hasUsedFree, setHasUsedFree] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stamp = localStorage.getItem('physics_universe_free_used');
      if (stamp === 'true') {
        setHasUsedFree(true);
      }
    }
  }, []);

  // 1. 管理员登录
  const handleLogin = (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      if (password === '472926') { 
        grantAccess(30); 
      } else {
        setError(true);
        setIsVerifying(false);
        setTimeout(() => setError(false), 500);
        setPassword('');
      }
    }, 800);
  };

  // 2. 发起爱发电赞助并跳转
  const handleInitiateAfdian = (e) => {
    e.preventDefault();
    
    // 生成一个带时间戳的唯一订单号，传给爱发电
    const newOrderId = 'AFD_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setOrderId(newOrderId);
    setPayStatus('waiting'); 

    // 👇 把这里的 YOUR_USER_ID 换成你的爱发电开发者 ID (比如 'a1b2c3d4e5f6')
    const afdianUserId = '474fbf8e6a5e11f19e7052540025c377'; 
    const afdianUrl = `https://afdian.net/order/create?user_id=${afdianUserId}&custom_order_id=${newOrderId}`;

    // 在新窗口打开爱发电
    window.open(afdianUrl, '_blank');
  };

  // 3. 核心：高能轮询监听数据库状态
  useEffect(() => {
    let interval;
    if (mode === 'pay' && orderId && payStatus === 'waiting') {
      interval = setInterval(async () => {
        try {
          // 向你的后端发起真实查询
          const res = await fetch(`/api/pay/check?orderId=${orderId}`);
          const data = await res.json();
          
          if (data.paid) {
            clearInterval(interval);
            setPayStatus('success');
            setPaySuccess(true);
            // 收到钱，延迟 1.5 秒后给用户发放 30 天超级通行证并跳入主页！
            setTimeout(() => {
              grantAccess(30); 
            }, 1500);
          }
        } catch (err) {
          console.error("对账链路异常:", err);
        }
      }, 3000); // 每 3 秒自动去问一次数据库
    }
    return () => clearInterval(interval);
  }, [orderId, mode, payStatus]);

  // 4. 免费体验逻辑
  const handleFreeAccess = () => {
    if (hasUsedFree) return;
    setIsVerifying(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('physics_universe_free_used', 'true');
      }
      setIsVerifying(false);
      setPaySuccess(true);
      setTimeout(() => {
        grantAccess(1); 
      }, 1000);
    }, 1500);
  };

  const grantAccess = (days = 1) => {
    const maxAge = days * 86400; 
    document.cookie = `physics_auth=granted; path=/; max-age=${maxAge}`;
    router.push('/');
    router.refresh();
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
            {mode === 'password' ? <Lock className="text-cyan-400 w-8 h-8" /> : mode === 'pay' ? <HeartHandshake className="text-purple-400 w-8 h-8" /> : <Sparkles className="text-cyan-400 w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest">物理讲义+仿真网站</h1>
          <p className="text-xs text-cyan-400/50 mt-2 uppercase tracking-[0.3em] font-mono">Quantum Firewall Protocol</p>
        </div>

        <div className="grid grid-cols-3 bg-black/50 p-1 mb-8 rounded-xl border border-white/5 shadow-inner text-center">
          <button onClick={() => { setMode('password'); setError(false); }} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'password' ? 'bg-white/10 text-cyan-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            管理员
          </button>
          <button onClick={() => { setMode('pay'); setError(false); }} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'pay' ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            赞助解锁
          </button>
          <button onClick={() => { setMode('free'); setError(false); }} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'free' ? 'bg-white/10 text-cyan-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            新客免费
          </button>
        </div>

        <div className="min-h-[220px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* 模式一：密码登录 */}
            {mode === 'password' && (
              <motion.form key="pwd" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} onSubmit={handleLogin} className="space-y-6 w-full">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="w-5 h-5 text-cyan-500/50" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入管理员密码..."
                    disabled={isVerifying}
                    className={`w-full bg-black/40 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'} rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 font-mono tracking-widest`}
                  />
                  {error && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-red-400 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>未授权的密码序列</span>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={isVerifying || !password} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium transition-all duration-300 disabled:opacity-40">
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>直接验证登入</span>}
                </button>
              </motion.form>
            )}

            {/* 模式二：爱发电赞助全自动放行 */}
            {mode === 'pay' && (
              <motion.div key="pay" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center space-y-6 w-full">
                
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-widest">赞助创作者</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                    网站由个人独立维护。赞助（5元）即可获取本站 <span className="text-purple-400 font-bold">30天全功能通行证</span>，您的支持是物理宇宙运转的能量。
                  </p>
                </div>

                <div className="w-full h-14">
                  {payStatus === 'idle' && (
                    <button onClick={handleInitiateAfdian} className="w-full h-full flex items-center justify-center gap-2 px-6 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                      <Zap className="w-4 h-4 text-purple-400" /> <span>前往「爱发电」赞助并解锁</span>
                    </button>
                  )}

                  {payStatus === 'waiting' && (
                    <button disabled className="w-full h-full flex flex-col items-center justify-center bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-cyan-400/80 font-mono text-xs shadow-inner shadow-cyan-500/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> <span>正在监听付款对账链路...</span>
                      </div>
                      <span className="text-[9px] text-gray-500/80 tracking-wide">请在新页面完成支付，切勿关闭本窗口</span>
                    </button>
                  )}

                  {payStatus === 'success' && (
                    <button disabled className="w-full h-full flex items-center justify-center gap-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 font-medium shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                      <CheckCircle className="w-5 h-5" /> <span>赞助收到，空间节点已跃迁</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* 模式三：新客免费 */}
            {mode === 'free' && (
              <motion.div key="free" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="flex flex-col items-center space-y-6 w-full text-center">
                {hasUsedFree ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      <UserX className="text-red-400 w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-red-400 tracking-wider">系统拒绝访问</h3>
                      <p className="text-xs text-gray-400 max-w-[280px] leading-relaxed mx-auto">
                        检测到本设备的专属密钥已被标记。新客免费登入额度仅限一次，请前往赞助选项支持本站运行。
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white tracking-widest">初次链路探测</h3>
                      <p className="text-xs text-cyan-400/70">欢迎来到物理宇宙。系统将为您提供单次（24小时）体验通行证。</p>
                    </div>
                    <button onClick={handleFreeAccess} disabled={isVerifying || paySuccess} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium transition-all duration-300 disabled:opacity-50">
                      {isVerifying ? <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> 通行证下发中...</span> : paySuccess ? <span className="text-green-400 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> 授权通过，正在跃迁</span> : <span>激活新客免费通行证</span>}
                    </button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}