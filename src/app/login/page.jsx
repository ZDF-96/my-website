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
  
  // 订单验证专属状态
  const [payStatus, setPayStatus] = useState('idle'); 
  const [afdianOrderNo, setAfdianOrderNo] = useState(''); 
  
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
      // 站长专属密码
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

  // 2. 发起跳转
  const handleInitiateAfdian = (e) => {
    e.preventDefault();
    const myHomePage = 'https://ifdian.net/a/wutaophys'; 
    window.open(myHomePage, '_blank');
    setPayStatus('input'); // 点击后立刻切换到输入订单号的状态
  };

  // 3. 去后端验证订单号
  const handleVerifyOrder = async () => {
    if (!afdianOrderNo.trim()) return;
    setPayStatus('verifying');

    try {
      const res = await fetch(`/api/afdian/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ out_trade_no: afdianOrderNo.trim() })
      });
      
      const data = await res.json();
      
      // 如果后端查单成功
      if (res.ok && data.success) {
        setPayStatus('success');
        setPaySuccess(true);
        setTimeout(() => {
          grantAccess(30); // 授权30天
        }, 1500);
      } else {
        alert(data.message || "未找到该订单或未支付，请检查订单号是否填写正确！");
        setPayStatus('input'); 
      }
    } catch (err) {
      console.error("验证链路异常:", err);
      alert("网络通信异常，请检查后端 API 是否正确创建。");
      setPayStatus('input');
    }
  };

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
            订单解锁
          </button>
          <button onClick={() => { setMode('free'); setError(false); }} className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'free' ? 'bg-white/10 text-cyan-300 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            新客免费
          </button>
        </div>

        <div className="min-h-[220px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
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
                    placeholder="输入站长专属密码..."
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

            {mode === 'pay' && (
              <motion.div key="pay" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center space-y-6 w-full">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-widest">赞助创作者</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                    赞助即可获取本站 <span className="text-purple-400 font-bold">30天全功能通行证</span>。
                  </p>
                </div>

                <div className="w-full">
                  {payStatus === 'idle' && (
                    <button onClick={handleInitiateAfdian} className="w-full py-4 flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                      <Zap className="w-4 h-4 text-purple-400" /> <span>前往「爱发电」赞助并获取订单号</span>
                    </button>
                  )}

                  {(payStatus === 'input' || payStatus === 'verifying') && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 w-full">
                      <div className="text-xs text-center text-cyan-400/80 mb-1">
                        付款后，将收到的<span className="text-white font-bold mx-1">发电订单号</span>填入：
                      </div>
                      <input
                        type="text"
                        value={afdianOrderNo}
                        onChange={(e) => setAfdianOrderNo(e.target.value)}
                        placeholder="在此粘贴订单号..."
                        disabled={payStatus === 'verifying'}
                        className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all duration-300 font-mono text-sm text-center tracking-wider"
                      />
                      <button
                        onClick={handleVerifyOrder}
                        disabled={payStatus === 'verifying' || !afdianOrderNo}
                        className="w-full py-4 flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-xl text-purple-300 font-medium transition-all duration-300 disabled:opacity-40"
                      >
                        {payStatus === 'verifying' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>验证订单并激活</span>}
                      </button>
                      
                      <button
                        onClick={() => {
                          setPayStatus('idle');
                          setAfdianOrderNo('');
                        }}
                        disabled={payStatus === 'verifying'}
                        className="w-full py-2 flex items-center justify-center text-gray-500 hover:text-gray-300 text-xs transition-colors duration-300 disabled:opacity-40"
                      >
                        未完成付款？点击返回上一步
                      </button>
                    </motion.div>
                  )}

                  {payStatus === 'success' && (
                    <button disabled className="w-full py-4 flex items-center justify-center gap-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 font-medium shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                      <CheckCircle className="w-5 h-5" /> <span>验证成功，空间节点已跃迁</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

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
                      <p className="text-xs text-cyan-400/70">欢迎来到物理宇宙。系统将为您提供单次体验通行证。</p>
                    </div>
                    <button onClick={handleFreeAccess} disabled={isVerifying || paySuccess} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium transition-all duration-300 disabled:opacity-50">
                      {isVerifying ? <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> 下发中...</span> : paySuccess ? <span className="text-green-400 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> 正在跃迁</span> : <span>激活新客免费</span>}
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