'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';

import {
  Loader2,
  Fingerprint,
  Lock,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Terminal,
  Activity,
  CircleCheck,
  CircleX,
  Cpu,
  ScanLine,
  KeyRound,
  Command,
} from 'lucide-react';

/* ============================================================================
 * 量子访问终端 · 管理员登录页 v3.1 FINAL
 * ----------------------------------------------------------------------------
 * 本次定稿打磨要点：
 *   ① 卡片加入内层高光描边、分层阴影、永不熄灭的背光核心
 *   ② 输入框新增聚焦扫描线、CapsLock 检测提示
 *   ③ 状态点改为脉冲链，状态文字平滑过渡
 *   ④ 成功态触发同心环扩散 + 徽章切换动画
 *   ⑤ 底部新增键盘快捷键提示条
 *   ⑥ 全量 SSR 安全、减少动效兼容、Esc/Enter 键盘交互
 * ==========================================================================*/

/* ─────────────────────── 漂浮粒子 ─────────────────────── */
function Particles() {
  const reduceMotion = useReducedMotion();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const list = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 12 + Math.random() * 18,
      delay: -Math.random() * 18,
      cyan: Math.random() > 0.35,
    }));
    setParticles(list);
  }, []);

  if (reduceMotion) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: p.cyan
                ? 'rgba(34,211,238,.55)'
                : 'rgba(167,139,250,.45)',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.cyan
              ? 'rgba(34,211,238,.7)'
              : 'rgba(167,139,250,.6)',
            boxShadow: p.cyan
              ? '0 0 9px rgba(34,211,238,.75)'
              : '0 0 9px rgba(167,139,250,.65)',
          }}
          animate={{
            y: [0, -55, 0],
            opacity: [0.05, 0.8, 0.05],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────── 量子轨道 ─────────────────────── */
function QuantumOrbits() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative w-[760px] h-[760px] rounded-full border border-cyan-400/[0.055]"
          animate={reduceMotion ? {} : { rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,.95)]" />
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-violet-400/[0.055]"
          animate={reduceMotion ? {} : { rotate: -360 }}
          transition={{ duration: 72, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-300 shadow-[0_0_12px_rgba(167,139,250,.9)]" />
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-cyan-300/[0.035]"
          animate={reduceMotion ? {} : { rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────── 四角瞄准标记 ─────────────────────── */
function CornerMarks() {
  return (
    <>
      <span className="absolute -top-3 -left-3 w-8 h-8 border-t border-l border-cyan-300/50 rounded-tl-lg" />
      <span className="absolute -top-3 -right-3 w-8 h-8 border-t border-r border-cyan-300/50 rounded-tr-lg" />
      <span className="absolute -bottom-3 -left-3 w-8 h-8 border-b border-l border-cyan-300/50 rounded-bl-lg" />
      <span className="absolute -bottom-3 -right-3 w-8 h-8 border-b border-r border-cyan-300/50 rounded-br-lg" />
    </>
  );
}

/* ─────────────────────── 状态脉冲链 ─────────────────────── */
function StatusPulseChain({ status, reduceMotion }) {
  const tone =
    status === 'success'
      ? { bg: 'bg-emerald-400', glow: 'shadow-[0_0_8px_rgba(52,211,153,.8)]' }
      : status === 'error'
      ? { bg: 'bg-red-400', glow: 'shadow-[0_0_8px_rgba(248,113,113,.8)]' }
      : status === 'verifying'
      ? { bg: 'bg-amber-300', glow: 'shadow-[0_0_8px_rgba(252,211,77,.7)]' }
      : { bg: 'bg-white/25', glow: '' };

  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`w-1 h-1 rounded-full ${tone.bg} ${tone.glow}`}
          animate={
            reduceMotion
              ? {}
              : status === 'verifying'
              ? { opacity: [0.25, 1, 0.25] }
              : { opacity: 1 }
          }
          transition={
            status === 'verifying'
              ? { duration: 1, repeat: Infinity, delay: i * 0.18 }
              : {}
          }
        />
      ))}
    </div>
  );
}

/* ============================================================================
 * 主组件
 * ==========================================================================*/
export default function LoginPage() {
  const router = useRouter();
  const inputRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [capsLock, setCapsLock] = useState(false);

  const isVerifying = status === 'verifying';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  /* ── 自动聚焦 ── */
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 450);
    return () => clearTimeout(timer);
  }, []);

  /* ── CapsLock 检测 ── */
  useEffect(() => {
    const check = (e) => {
      if (typeof e.getModifierState === 'function') {
        setCapsLock(e.getModifierState('CapsLock'));
      }
    };
    window.addEventListener('keydown', check);
    window.addEventListener('keyup', check);
    return () => {
      window.removeEventListener('keydown', check);
      window.removeEventListener('keyup', check);
    };
  }, []);

  /* ── 授予访问权 ── */
  const grantAccess = useCallback(
    (days = 360) => {
      const maxAge = days * 86400;
      document.cookie = `physics_auth=granted; path=/; max-age=${maxAge}`;
      const expireTimestamp = Date.now() + days * 86400 * 1000;
      localStorage.setItem('physics_vip_expire', expireTimestamp);
      router.replace('/');
      router.refresh();
    },
    [router]
  );

  /* ── 提交 ── */
  const handleLogin = useCallback(
    (event) => {
      event.preventDefault();
      const cleanPassword = password.trim();
      if (!cleanPassword || isVerifying || isSuccess) return;

      setStatus('verifying');
      setErrorMessage('');

      setTimeout(() => {
        const adminPassword = '369458';

        if (cleanPassword === adminPassword) {
          setStatus('success');
          setTimeout(() => grantAccess(360), 900);
        } else {
          setAttempts((v) => v + 1);
          setStatus('error');
          setErrorMessage('访问被拒绝 · 密码序列未匹配');
          setPassword('');
          setTimeout(() => {
            setStatus('idle');
            inputRef.current?.focus();
          }, 1300);
        }
      }, 700);
    },
    [password, isVerifying, isSuccess, grantAccess]
  );

  /* ── ESC 重置 ── */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPassword('');
        setErrorMessage('');
        setStatus('idle');
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const statusText = {
    idle: '等待身份验证',
    verifying: '正在建立安全通道',
    success: '身份验证成功',
    error: '身份验证失败',
  }[status];

  const statusTone =
    isSuccess
      ? 'text-emerald-300/70'
      : isError
      ? 'text-red-300/70'
      : isVerifying
      ? 'text-amber-200/70'
      : 'text-white/35';

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#05070b] text-white flex items-center justify-center px-4 py-10">
      {/* ═══════════════ 背景层 ═══════════════ */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#0c2030_0%,#070a10_42%,#040509_100%)]" />
        <div className="absolute left-[8%] top-[10%] w-[420px] h-[420px] rounded-full bg-cyan-500/[0.06] blur-[140px]" />
        <div className="absolute right-[6%] bottom-[8%] w-[440px] h-[440px] rounded-full bg-violet-500/[0.055] blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,211,238,.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,.12) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            maskImage:
              'radial-gradient(ellipse 65% 65% at center, black 20%, transparent 90%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 65% 65% at center, black 20%, transparent 90%)',
          }}
        />

        <QuantumOrbits />
        <Particles />

        {/* 扫描线噪点 */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(255,255,255,.7) 0px, rgba(255,255,255,.7) 1px, transparent 1px, transparent 5px)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,.82)_100%)]" />
      </div>

      {/* ═══════════════ 主卡片 ═══════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 30, scale: 0.97, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{
          duration: reduceMotion ? 0 : 0.8,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <CornerMarks />

        <div
          className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#080b11]/85 backdrop-blur-2xl"
          style={{
            boxShadow:
              '0 30px 100px rgba(0,0,0,.65), 0 0 0 1px rgba(34,211,238,.04) inset, 0 1px 0 rgba(255,255,255,.04) inset',
          }}
        >
          {/* 顶部高光边 */}
          <div className="absolute top-0 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          {/* 永不熄灭的背光核心 */}
          <motion.div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-cyan-400/[0.08] blur-[80px] pointer-events-none"
            animate={
              reduceMotion
                ? {}
                : { opacity: [0.55, 0.85, 0.55], scale: [1, 1.05, 1] }
            }
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative p-7 sm:p-9">
            {/* ── 卡片头部 ── */}
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.9)]"
                  animate={reduceMotion ? {} : { opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="font-mono text-[10px] tracking-[0.32em] text-white/45">
                  QUANTUM ACCESS
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-white/25">
                <Terminal className="w-3 h-3" />
                <span>AUTH-02</span>
              </div>
            </header>

            {/* ── 中心徽章 ── */}
            <div className="flex flex-col items-center mb-9">
              <div className="relative w-[108px] h-[108px] mb-6">
                <div className="absolute inset-0 rounded-full bg-cyan-400/[0.16] blur-2xl" />
                <div className="absolute inset-0 rounded-full border border-cyan-300/[0.18]" />

                <motion.div
                  className="absolute inset-[-5px] rounded-full border-t border-cyan-300/70"
                  animate={reduceMotion ? {} : { rotate: 360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-[7px] rounded-full border-b border-violet-300/40"
                  animate={reduceMotion ? {} : { rotate: -360 }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                />

                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-8 h-px bg-cyan-300/70" />
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-8 h-px bg-cyan-300/30" />

                {/* 成功态同心环扩散 */}
                <AnimatePresence>
                  {isSuccess &&
                    !reduceMotion &&
                    [0, 1].map((i) => (
                      <motion.span
                        key={`ring-${i}`}
                        className="absolute inset-4 rounded-2xl border border-emerald-300/50"
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={{ scale: 2.4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 1.6,
                          delay: i * 0.25,
                          repeat: Infinity,
                          repeatDelay: 0.4,
                          ease: 'easeOut',
                        }}
                      />
                    ))}
                </AnimatePresence>

                <motion.div
                  className="absolute inset-4 rounded-2xl border border-white/[0.10] bg-gradient-to-br from-white/[0.10] to-white/[0.025] flex items-center justify-center shadow-inner"
                  animate={reduceMotion ? {} : { y: [0, -3, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <AnimatePresence mode="wait">
                    {isSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 15 }}
                      >
                        <ShieldCheck className="w-10 h-10 text-emerald-300 drop-shadow-[0_0_14px_rgba(52,211,153,.8)]" />
                      </motion.div>
                    ) : isError ? (
                      <motion.div key="error" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CircleX className="w-10 h-10 text-red-300 drop-shadow-[0_0_14px_rgba(248,113,113,.7)]" />
                      </motion.div>
                    ) : (
                      <motion.div key="fingerprint" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Fingerprint className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,.7)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              <h1 className="text-[25px] font-semibold tracking-wide text-white">
                管理员身份验证
              </h1>
              <p className="mt-2 text-[9px] font-mono tracking-[0.42em] text-white/30">
                SYSTEM LEVEL AUTHORIZATION
              </p>
            </div>

            {/* ── 状态条 ── */}
            <div className="mb-6 flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/[0.055] bg-white/[0.018]">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-300/60" />
                <span className="text-[9px] font-mono tracking-wider text-white/35">
                  AUTHENTICATION NODE
                </span>
              </div>
              <span className="text-[9px] font-mono text-cyan-300/50">
                ONLINE
              </span>
            </div>

            {/* ── 表单 ── */}
            <form onSubmit={handleLogin}>
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="admin-password"
                  className="text-[9px] font-mono tracking-[0.24em] text-white/35"
                >
                  ACCESS CREDENTIAL
                </label>
                <AnimatePresence>
                  {capsLock && (
                    <motion.span
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 4 }}
                      className="text-[9px] font-mono text-amber-300/75 tracking-wider"
                    >
                      ⚠ CAPS LOCK
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                animate={isError ? { x: [-7, 7, -5, 5, -2, 2, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className="relative group"
              >
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-10 transition-colors duration-300 ${
                    isError
                      ? 'text-red-400/80'
                      : isSuccess
                      ? 'text-emerald-400/80'
                      : 'text-white/25 group-focus-within:text-cyan-300/80'
                  }`}
                />

                <input
                  ref={inputRef}
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  disabled={isVerifying || isSuccess}
                  maxLength={128}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (isError) {
                      setStatus('idle');
                      setErrorMessage('');
                    }
                  }}
                  placeholder="ENTER PASSWORD"
                  className={`w-full h-[58px] pl-11 pr-12 rounded-xl border bg-white/[0.025] text-center text-[15px] font-mono tracking-[0.25em] text-white outline-none transition-all duration-300 placeholder:text-white/[0.16] focus:bg-cyan-400/[0.035] ${
                    isError
                      ? 'border-red-400/45 focus:border-red-400/70'
                      : isSuccess
                      ? 'border-emerald-400/40'
                      : 'border-white/[0.08] focus:border-cyan-400/50'
                  } disabled:opacity-60`}
                />

                {/* 聚焦扫描线 */}
                <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden rounded-b-xl pointer-events-none">
                  <motion.div
                    className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent"
                    animate={
                      reduceMotion
                        ? { x: '100%' }
                        : { x: ['-100%', '400%'] }
                    }
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                <div className="absolute inset-0 rounded-xl border border-cyan-300/0 group-focus-within:border-cyan-300/[0.08] pointer-events-none transition-all duration-500" />

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isVerifying || isSuccess}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/20 hover:text-cyan-300/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </motion.div>

              {/* ── 反馈区 ── */}
              <div className="min-h-[26px] mt-3">
                <AnimatePresence mode="wait">
                  {isError && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center justify-center gap-2 text-[10px] font-mono text-red-300/80"
                    >
                      <CircleX className="w-3.5 h-3.5" />
                      <span>{errorMessage || '访问被拒绝'}</span>
                    </motion.div>
                  )}
                  {isSuccess && (
                    <motion.div
                      key="ok"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 text-[10px] font-mono text-emerald-300/80"
                    >
                      <CircleCheck className="w-3.5 h-3.5" />
                      <span>SECURE SESSION ESTABLISHED · 360D PASS</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── 提交按钮 ── */}
              <button
                type="submit"
                disabled={!password.trim() || isVerifying || isSuccess}
                className="relative w-full h-[56px] mt-2 overflow-hidden rounded-xl font-semibold text-sm tracking-wider text-slate-950 transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed group"
              >
                <div
                  className={`absolute inset-0 transition-all duration-500 ${
                    isSuccess
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-300'
                      : isError
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                      : 'bg-gradient-to-r from-cyan-400 to-cyan-300 group-hover:from-cyan-300 group-hover:to-cyan-200'
                  }`}
                />

                {!reduceMotion && !isSuccess && (
                  <motion.div
                    className="absolute inset-y-0 w-20 bg-white/20 blur-xl"
                    animate={{ x: ['-100%', '600%'] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />

                <div className="relative flex items-center justify-center gap-2">
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在验证...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>身份验证通过</span>
                    </>
                  ) : (
                    <>
                      <span>建立安全连接</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* ── 底部状态区 ── */}
            <div className="mt-7 pt-5 border-t border-white/[0.055]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <StatusPulseChain status={status} reduceMotion={reduceMotion} />
                  <span className={`text-[9px] font-mono tracking-wider transition-colors duration-300 ${statusTone}`}>
                    {statusText}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[9px] font-mono text-white/20">
                  <span>ATTEMPTS {String(attempts).padStart(2, '0')}</span>
                  <span>TLS</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-5 text-[8px] font-mono tracking-[0.22em] text-white/[0.16]">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" />
                  SECURE NODE
                </span>
                <span className="flex items-center gap-1.5">
                  <ScanLine className="w-3 h-3" />
                  ENCRYPTED
                </span>
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3" />
                  RSA-2048
                </span>
              </div>
            </div>

            {/* ── 键盘提示 ── */}
            <div className="mt-5 flex items-center justify-center gap-3 text-[8px] font-mono tracking-[0.22em] text-white/[0.14]">
              <span className="flex items-center gap-1">
                <Command className="w-2.5 h-2.5" />
                <span>ENTER</span>
                <span className="text-white/25">提交</span>
              </span>
              <span className="text-white/10">·</span>
              <span className="flex items-center gap-1">
                <span className="px-1 border border-white/15 rounded-[3px] text-[7px]">ESC</span>
                <span className="text-white/25">重置</span>
              </span>
            </div>
          </div>

          {/* ── 底部流光 ── */}
          <motion.div
            className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"
            animate={
              reduceMotion
                ? { width: '35%', left: '32.5%' }
                : {
                    width: ['15%', '55%', '15%'],
                    left: ['42.5%', '22.5%', '42.5%'],
                  }
            }
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* ── 卡片外底部标签 ── */}
        <div className="mt-5 flex items-center justify-center gap-3 text-[8px] font-mono tracking-[0.25em] text-white/[0.18]">
          <span>PHYSICS UNIVERSE</span>
          <span>•</span>
          <span>ADMIN TERMINAL</span>
          <span>•</span>
          <span>v3.1</span>
        </div>
      </motion.section>
    </main>
  );
}