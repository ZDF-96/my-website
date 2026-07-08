'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

/* ==========================================
   共享内核：高帧率渲染引擎与教科书级图元
   ========================================== */
const useAnimationFrame = (callback) => {
  const requestRef = useRef()
  const previousTimeRef = useRef()
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = Math.min(0.1, (time - previousTimeRef.current) / 1000)
        savedCallback.current(deltaTime, time)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [])
}

const useRetinaCanvas = (canvasRef) => {
  const setup = useCallback((ctx) => {
    const canvas = canvasRef.current
    if (!canvas) return { width: 0, height: 0, dpr: 1 }
    const dpr = Math.max(1, Math.min(3, typeof window !== 'undefined' ? window.devicePixelRatio : 1))
    const rect = canvas.getBoundingClientRect()
    const width = rect.width, height = rect.height
    if (canvas.__dpr !== dpr || canvas.__cssW !== width || canvas.__cssH !== height) {
      canvas.__dpr = dpr; canvas.__cssW = width; canvas.__cssH = height
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { width, height, dpr }
  }, [canvasRef])
  return setup
}

// 智能矢量绘制：带底衬和象限自动避让
const drawVector = (ctx, x, y, dx, dy, color, label = '', bgLabel = false, offsetLabel = 12) => {
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 0.1) return
  const angle = Math.atan2(dy, dx)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(len, 0)
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.stroke()
  
  ctx.beginPath()
  ctx.moveTo(len + 2, 0)
  ctx.lineTo(len - 8, -5)
  ctx.lineTo(len - 8, 5)
  ctx.fillStyle = color
  ctx.fill()
  
  if (label) {
    ctx.rotate(-angle)
    ctx.font = 'italic 700 15px "Times New Roman", serif'
    const textWidth = ctx.measureText(label).width
    const isLeft = Math.cos(angle) < 0
    const isTop = Math.sin(angle) < 0
    const lx = dx + (isLeft ? -textWidth - offsetLabel : offsetLabel)
    const ly = dy + (isTop ? -offsetLabel : offsetLabel + 10)
    
    if (bgLabel) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
      ctx.beginPath()
      ctx.roundRect(lx - 4, ly - 14, textWidth + 8, 18, 4)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.fillStyle = color
    ctx.fillText(label, lx, ly)
  }
  ctx.restore()
}

// 氛围感星空生成器
const createStars = (count, width, height) => {
  return Array.from({ length: count }).map(() => ({
    x: (Math.random() - 0.5) * width * 1.5,
    y: (Math.random() - 0.5) * height * 1.5,
    r: Math.random() * 1.2 + 0.3,
    alpha: Math.random() * 0.8 + 0.2,
    phase: Math.random() * Math.PI * 2
  }))
}

// 质感地球渲染
const drawDetailedEarth = (ctx, radius, rotation) => {
  if (radius < 0.5) return 
  const halo = ctx.createRadialGradient(0, 0, radius * 0.95, 0, 0, radius * 1.4)
  halo.addColorStop(0, 'rgba(56, 189, 248, 0.6)')
  halo.addColorStop(0.4, 'rgba(56, 189, 248, 0.15)')
  halo.addColorStop(1, 'transparent')
  ctx.beginPath(); ctx.arc(0, 0, radius * 1.4, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill()

  ctx.save()
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.clip()
  
  const oceanGrad = ctx.createRadialGradient(-radius*0.3, -radius*0.3, 0, 0, 0, radius)
  oceanGrad.addColorStop(0, '#1e3a8a'); oceanGrad.addColorStop(1, '#020617')
  ctx.fillStyle = oceanGrad; ctx.fillRect(-radius, -radius, radius * 2, radius * 2)
  
  if (radius > 15) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1
    for(let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * Math.sqrt(1 - (i/4)**2), 0, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(0, 0, radius * Math.sqrt(1 - (i/4)**2), radius, 0, 0, Math.PI*2); ctx.stroke()
    }
  }
  
  ctx.rotate(rotation)
  ctx.fillStyle = 'rgba(21, 128, 61, 0.7)'
  ctx.beginPath()
  ctx.ellipse(radius * 0.2, -radius * 0.3, radius * 0.7, radius * 0.4, Math.PI / 6, 0, Math.PI * 2)
  ctx.ellipse(-radius * 0.4, radius * 0.4, radius * 0.4, radius * 0.5, -Math.PI / 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.rotate(-rotation)

  const shadow = ctx.createLinearGradient(-radius, -radius, radius, radius)
  shadow.addColorStop(0, 'rgba(255,255,255,0.1)'); shadow.addColorStop(0.5, 'transparent'); shadow.addColorStop(1, 'rgba(0,0,0,0.95)')
  ctx.fillStyle = shadow; ctx.fillRect(-radius, -radius, radius * 2, radius * 2)
  ctx.restore()

  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)'; ctx.lineWidth = Math.max(0.5, radius * 0.02); ctx.stroke()
}

const GlassPanel = ({ children, className = "" }) => (
  <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl ${className}`}>
    {children}
  </div>
)

/* ==========================================
   模块 1：牛顿大炮（完美修复了轨迹脱离 Bug）
   ========================================== */
const NewtonCannon = () => {
  const canvasRef = useRef(null)
  const [v0, setV0] = useState(7.9)
  const [isRunning, setIsRunning] = useState(false)
  const [timeWarpLog, setTimeWarpLog] = useState(0)
  const [viewMode, setViewMode] = useState('EARTH')
  const starsRef = useRef(null)

  useEffect(() => { starsRef.current = createStars(150, 2000, 2000) }, [])
  
  const MU_E = 3.986e5, MU_S = 1.327e11
  const R_E = 6371, D_AU = 1.496e8, V_E = 29.78
  const W_E = V_E / D_AU, W_ROT = (2 * Math.PI) / 86400

  const [telemetry, setTelemetry] = useState({ r_e: 0, r_s: 0, v_e: 0, v_s: 0, E_e: 0, E_s: 0, stateInfo: '' })
  const lastUiUpdate = useRef(0)
  const setupCanvas = useRetinaCanvas(canvasRef)
  
  const simRef = useRef({ 
    t: 0, x: 0, y: 0, vx: 0, vy: 0, pathEarth: [], pathSun: [], crashed: false,
    scaleE: null, scaleS: null, initialScaleE: null, initialScaleS: null
  })

  const updateTelemetry = (x, y, vx, vy, t) => {
    const Ex = D_AU * Math.sin(W_E * t), Ey = -D_AU * Math.cos(W_E * t)
    const Evx = V_E * Math.cos(W_E * t), Evy = V_E * Math.sin(W_E * t)
    const r_e = Math.sqrt((x - Ex) ** 2 + (y - Ey) ** 2)
    const v_e = Math.sqrt((vx - Evx) ** 2 + (vy - Evy) ** 2)
    const E_e = 0.5 * v_e * v_e - MU_E / r_e
    const r_s = Math.sqrt(x * x + y * y)
    const v_s = Math.sqrt(vx * vx + vy * vy)
    const E_s = 0.5 * v_s * v_s - MU_S / r_s
    let stateInfo = r_e < R_E * 0.99 ? '💥 警告：已坠毁于地表' : E_e < 0 ? '🌍 椭圆环绕 (第一宇宙速度级别)' : E_s < 0 ? '☀️ 挣脱地球 (第二宇宙速度级别)' : '🌌 逃逸太阳系 (第三宇宙速度级别)'
    setTelemetry({
      r_e: (r_e / R_E).toFixed(2), r_s: (r_s / D_AU).toFixed(4),
      v_e: v_e.toFixed(2), v_s: v_s.toFixed(2),
      E_e: E_e.toFixed(2), E_s: E_s.toFixed(2), stateInfo
    })
  }

  const resetSim = useCallback(() => {
    const init_Sx = 0, init_Sy = -D_AU - R_E, init_Svx = V_E + v0, init_Svy = 0
    simRef.current.t = 0
    simRef.current.x = init_Sx
    simRef.current.y = init_Sy
    simRef.current.vx = init_Svx
    simRef.current.vy = init_Svy
    simRef.current.pathEarth = [{ x: 0, y: -R_E }] // 初始化写入第一个原点
    simRef.current.pathSun = [{ x: init_Sx, y: init_Sy }]
    simRef.current.crashed = false
    
    if (simRef.current.initialScaleE) simRef.current.scaleE = simRef.current.initialScaleE
    if (simRef.current.initialScaleS) simRef.current.scaleS = simRef.current.initialScaleS
    
    setIsRunning(false)
    updateTelemetry(init_Sx, init_Sy, init_Svx, init_Svy, 0)
  }, [v0])
  useEffect(() => { resetSim() }, [v0, resetSim])

  const getDeriv = (x, y, vx, vy, t) => {
    const Ex = D_AU * Math.sin(W_E * t), Ey = -D_AU * Math.cos(W_E * t)
    const re_x = x - Ex, re_y = y - Ey, re = Math.sqrt(re_x * re_x + re_y * re_y)
    const rs = Math.sqrt(x * x + y * y)
    const ax = -MU_S * x / (rs * rs * rs) - MU_E * re_x / (re * re * re)
    const ay = -MU_S * y / (rs * rs * rs) - MU_E * re_y / (re * re * re)
    return { vx, vy, ax, ay, re }
  }

  useAnimationFrame((dt, absoluteTime) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = setupCanvas(ctx)
    let { t, x, y, vx, vy, pathEarth, pathSun, crashed } = simRef.current
    
    if (isRunning && !crashed) {
      const effectiveDt = Math.min(0.05, dt) * Math.pow(10, timeWarpLog)
      const Ex_temp = D_AU * Math.sin(W_E * t)
      const Ey_temp = -D_AU * Math.cos(W_E * t)
      const r_e_current = Math.sqrt((x - Ex_temp) ** 2 + (y - Ey_temp) ** 2)
      
      let safeDt = r_e_current < R_E * 3 ? 0.5 : r_e_current < R_E * 50 ? 10 : r_e_current < 1e6 ? 500 : 5000
      let steps = Math.min(600, Math.ceil(effectiveDt / safeDt))
      const subDt = effectiveDt / steps
      
      for (let i = 0; i < steps; i++) {
        const d1 = getDeriv(x, y, vx, vy, t)
        if (d1.re < R_E * 0.99) { crashed = true; break }
        const s2x = x + 0.5 * subDt * d1.vx, s2y = y + 0.5 * subDt * d1.vy
        const d2 = getDeriv(s2x, s2y, vx + 0.5 * subDt * d1.ax, vy + 0.5 * subDt * d1.ay, t + 0.5 * subDt)
        const s3x = x + 0.5 * subDt * d2.vx, s3y = y + 0.5 * subDt * d2.vy
        const d3 = getDeriv(s3x, s3y, vx + 0.5 * subDt * d2.ax, vy + 0.5 * subDt * d2.ay, t + 0.5 * subDt)
        const s4x = x + subDt * d3.vx, s4y = y + subDt * d3.vy
        const d4 = getDeriv(s4x, s4y, vx + subDt * d3.ax, vy + subDt * d3.ay, t + subDt)
        
        x += (subDt / 6) * (d1.vx + 2 * d2.vx + 2 * d3.vx + d4.vx)
        y += (subDt / 6) * (d1.vy + 2 * d2.vy + 2 * d3.vy + d4.vy)
        vx += (subDt / 6) * (d1.ax + 2 * d2.ax + 2 * d3.ax + d4.ax)
        vy += (subDt / 6) * (d1.ay + 2 * d2.ay + 2 * d3.ay + d4.ay)
        t += subDt
        
        if (i % Math.max(1, Math.floor(steps / 10)) === 0) {
          if (d1.re < R_E * 5000) {
            // 【核心修复点】：内部轨迹写入时使用的 t 与最终渲染严格同步
            pathEarth.push({ x: x - D_AU * Math.sin(W_E * t), y: y + D_AU * Math.cos(W_E * t) })
            if (pathEarth.length > 3000) pathEarth.shift()
          }
          pathSun.push({ x, y }); if (pathSun.length > 3600) pathSun.shift()
        }
      }
      simRef.current.t = t; simRef.current.x = x; simRef.current.y = y; 
      simRef.current.vx = vx; simRef.current.vy = vy; simRef.current.crashed = crashed
      
      if (absoluteTime - lastUiUpdate.current > 100) {
        if (crashed) setIsRunning(false)
        updateTelemetry(x, y, vx, vy, t)
        lastUiUpdate.current = absoluteTime
      }
    }
    
    // 【核心修复点】：无论是否 paused，渲染坐标基准强制使用最新的系统时间 t
    const Ex = D_AU * Math.sin(W_E * t), Ey = -D_AU * Math.cos(W_E * t)
    
    // 自适应追踪无极缩放逻辑
    const minCanvasHalf = Math.min(width, height) * 0.35 
    const r_e_current = Math.sqrt((x - Ex) ** 2 + (y - Ey) ** 2)
    const r_s_current = Math.sqrt(x * x + y * y)
    
    const initScaleE = minCanvasHalf / (R_E * 3) 
    const initScaleS = minCanvasHalf / (D_AU * 1.5) 
    
    simRef.current.initialScaleE = initScaleE
    simRef.current.initialScaleS = initScaleS
    if (!simRef.current.scaleE) simRef.current.scaleE = initScaleE
    if (!simRef.current.scaleS) simRef.current.scaleS = initScaleS
    
    const targetScaleE = Math.min(initScaleE, minCanvasHalf / (r_e_current * 1.2))
    const targetScaleS = Math.min(initScaleS, minCanvasHalf / (r_s_current * 1.2))
    
    simRef.current.scaleE += (targetScaleE - simRef.current.scaleE) * 0.05
    simRef.current.scaleS += (targetScaleS - simRef.current.scaleS) * 0.05
    
    const scaleE = simRef.current.scaleE
    const scaleS = simRef.current.scaleS

    // ---------- 开始渲染画布 ----------
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, width, height)
    ctx.save(); ctx.translate(width / 2, height / 2)
    
    if (starsRef.current) {
      ctx.fillStyle = '#ffffff'
      starsRef.current.forEach(star => {
        ctx.globalAlpha = star.alpha + Math.sin(absoluteTime * 0.002 + star.phase) * 0.2
        ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill()
      })
      ctx.globalAlpha = 1
    }
    
    if (viewMode === 'EARTH') {
      const earthRenderRadius = Math.max(3, R_E * scaleE) 
      
      drawDetailedEarth(ctx, earthRenderRadius, W_ROT * t)
      
      // 【修复阴影方位】：改用 Math.atan2(Ey, Ex) 让阴影始终背向太阳
      ctx.save(); ctx.rotate(Math.atan2(Ey, Ex))
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.beginPath(); ctx.arc(0, 0, earthRenderRadius + 2, -Math.PI / 2, Math.PI / 2); ctx.fill()
      ctx.restore()

      if (earthRenderRadius > 20) {
        ctx.fillStyle = '#475569'
        ctx.beginPath()
        ctx.moveTo(-6, -earthRenderRadius); ctx.lineTo(6, -earthRenderRadius)
        ctx.lineTo(3, -earthRenderRadius - 10); ctx.lineTo(1, -earthRenderRadius - 20)
        ctx.lineTo(-1, -earthRenderRadius - 20); ctx.lineTo(-3, -earthRenderRadius - 10)
        ctx.fill()
        ctx.fillStyle = '#ef4444'; ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444'
        ctx.beginPath(); ctx.arc(0, -earthRenderRadius - 20, 2, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      }
      
      if (pathEarth.length > 1) {
        ctx.beginPath(); ctx.moveTo(pathEarth[0].x * scaleE, pathEarth[0].y * scaleE)
        for (let i = 1; i < pathEarth.length; i++) ctx.lineTo(pathEarth[i].x * scaleE, pathEarth[i].y * scaleE)
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5; ctx.stroke()
      }
      
      if (!crashed) {
        const px = (x - Ex) * scaleE, py = (y - Ey) * scaleE
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 15; ctx.shadowColor = '#38bdf8'; ctx.fill(); ctx.shadowBlur = 0
        if (!isRunning && t === 0) {
          drawVector(ctx, px, py, v0 * 8, 0, '#facc15', 'v₀', true)
        } else {
          const Evx = V_E * Math.cos(W_E * t), Evy = V_E * Math.sin(W_E * t)
          const relVx = vx - Evx, relVy = vy - Evy
          const vVecLen = Math.min(60, Math.sqrt(relVx*relVx + relVy*relVy) * 2)
          const vAngle = Math.atan2(relVy, relVx)
          drawVector(ctx, px, py, Math.cos(vAngle) * vVecLen, Math.sin(vAngle) * vVecLen, '#facc15', 'v', true)
        }
      }
      
      ctx.restore()
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'; ctx.beginPath(); ctx.roundRect(15, 15, 280, 50, 8); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke()
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 12px monospace'; ctx.fillText('◆ 自适应追踪镜头系统', 28, 33)
      ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace'
      ctx.fillText(`Scale: 1px ≈ ${(1 / scaleE).toFixed(0)} km`, 28, 52)
      
      if (initScaleE / scaleE > 1.05) {
        ctx.fillStyle = '#facc15'; ctx.fillText(`Zoom Out: ${(initScaleE / scaleE).toFixed(1)}x`, 180, 52)
      }

    } else {
      const sunCoreRadius = Math.max(4, 20 * (scaleS / initScaleS))
      const sunGlowRadius = Math.max(15, 90 * (scaleS / initScaleS))
      
      ctx.globalCompositeOperation = 'screen'
      const sunGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, sunGlowRadius)
      sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)'); sunGlow.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(0, 0, sunGlowRadius, 0, Math.PI * 2); ctx.fillStyle = sunGlow; ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath(); ctx.arc(0, 0, sunCoreRadius, 0, Math.PI * 2); ctx.fillStyle = '#f59e0b'; ctx.fill()
      
      ctx.beginPath(); ctx.arc(0, 0, D_AU * scaleS, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([])
      
      const earthRadiusS = Math.max(2, 8 * (scaleS / initScaleS))
      ctx.beginPath(); ctx.arc(Ex * scaleS, Ey * scaleS, earthRadiusS, 0, Math.PI * 2); ctx.fillStyle = '#3b82f6'; ctx.fill()
      
      if (pathSun.length > 1) {
        ctx.beginPath(); ctx.moveTo(pathSun[0].x * scaleS, pathSun[0].y * scaleS)
        for (let i = 1; i < pathSun.length; i++) ctx.lineTo(pathSun[i].x * scaleS, pathSun[i].y * scaleS)
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.stroke()
      }
      if (!crashed) {
        ctx.beginPath(); ctx.arc(x * scaleS, y * scaleS, 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill()
      }
      
      ctx.restore()
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'; ctx.beginPath(); ctx.roundRect(15, 15, 280, 50, 8); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke()
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px monospace'; ctx.fillText('◆ 星际漫游镜头系统', 28, 33)
      ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace'
      ctx.fillText(`Scale: 1px ≈ ${(1 / scaleS / D_AU).toFixed(4)} AU`, 28, 52)
      if (initScaleS / scaleS > 1.05) {
        ctx.fillStyle = '#facc15'; ctx.fillText(`Zoom Out: ${(initScaleS / scaleS).toFixed(1)}x`, 180, 52)
      }
    }
  })

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-slate-100">
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/50 bg-black h-[500px] lg:h-[650px] shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
        <GlassPanel className="flex-1 flex flex-col justify-center p-6 font-mono">
          <h3 className="text-slate-300 font-black border-b border-slate-700/60 pb-3 mb-5 flex justify-between tracking-wide">
            <span>动能与势能双系遥测</span>
            <span className="text-red-500 animate-pulse flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div>REC</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 shadow-inner">
              <div className="text-blue-400 font-black mb-4 text-sm tracking-widest">🌍 相对地球参考系</div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-400">距离中心 r: <span className="text-slate-100 font-bold">{telemetry.r_e} Rₑ</span></div>
                <div className="flex justify-between text-slate-400">相对线速度 v: <span className="text-slate-100 font-bold">{telemetry.v_e} km/s</span></div>
                <div className="flex justify-between text-slate-400 border-t border-slate-700/50 pt-3">系统机械能 Eₑ: <span className="text-amber-400 font-black">{telemetry.E_e}</span></div>
              </div>
            </div>
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 shadow-inner">
              <div className="text-amber-400 font-black mb-4 text-sm tracking-widest">☀️ 相对太阳参考系</div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-400">距离中心 r: <span className="text-slate-100 font-bold">{telemetry.r_s} AU</span></div>
                <div className="flex justify-between text-slate-400">绝对线速度 v: <span className="text-slate-100 font-bold">{telemetry.v_s} km/s</span></div>
                <div className="flex justify-between text-slate-400 border-t border-slate-700/50 pt-3">系统机械能 Eₛ: <span className="text-fuchsia-400 font-black">{telemetry.E_s}</span></div>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="w-full xl:w-[380px] shrink-0 flex flex-col justify-between p-6 font-mono">
          <div>
            <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800 mb-5">
              <button onClick={() => setViewMode('EARTH')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${viewMode === 'EARTH' ? 'bg-blue-600/90 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>地心视角</button>
              <button onClick={() => setViewMode('SUN')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${viewMode === 'SUN' ? 'bg-amber-600/90 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>日心视角</button>
            </div>
            <div className="text-sm mb-4 text-amber-400 font-bold bg-amber-900/10 p-4 rounded-xl border border-amber-900/30 text-center flex items-center justify-center min-h-[60px]">
              {telemetry.stateInfo || '高塔点火发射准备就绪...'}
            </div>
          </div>
          
          <div className="mt-auto space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-3 text-slate-400"><span>水平初速度 (v₀)</span><span className="text-amber-500 font-black">{v0.toFixed(1)} km/s</span></div>
              <input type="range" min="7.0" max="25" step="0.1" value={v0} disabled={isRunning} onChange={(e) => setV0(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer disabled:opacity-30" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-3 text-slate-400"><span>时间流逝倍率</span><span className="text-sky-400 font-black">{Math.round(Math.pow(10, timeWarpLog))}x</span></div>
              <input type="range" min="0" max="6" step="0.1" value={timeWarpLog} onChange={(e) => setTimeWarpLog(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-sky-500 cursor-pointer" />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => { resetSim(); setIsRunning(true) }} disabled={isRunning} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-blue-900/40">发射点火</button>
              <button onClick={() => setIsRunning(false)} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-600 transition-colors">终止重置</button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

/* ==========================================
   模块 2：开普勒面积定律 (保持解析学无误差版本不变)
   ========================================== */
const KeplerArea = () => {
  const canvasRef = useRef(null)
  const [eTarget, setETarget] = useState(0.65)
  const [isRunning, setIsRunning] = useState(true)
  const [showVectors, setShowVectors] = useState(true)
  const starsRef = useRef(null)
  
  const MU = 150000
  const [telemetry, setTelemetry] = useState({ r: 0, v: 0, h: 0, currentArea: 0, lastCompletedArea: 0, completedSectors: 0 })
  const lastUiUpdate = useRef(0)
  const setupCanvas = useRetinaCanvas(canvasRef)
  
  const simRef = useRef({
    x: 0, y: 0, vx: 0, vy: 0, timer: 0, 
    sectorPoints: [], sectorTimer: 0, 
    completedSectors: [], colorToggle: false, trail: []
  })

  useEffect(() => { starsRef.current = createStars(180, 2000, 2000) }, [])
  const getA_SEMI = (w, h) => Math.min(w, h) * 0.28

  const solveKepler = (M, e) => {
    let E = M
    for (let i = 0; i < 15; i++) { E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)) }
    return E
  }

  const resetSim = useCallback(() => {
    simRef.current = {
      x: 0, y: 0, vx: 0, vy: 0, timer: 0, 
      sectorPoints: [], sectorTimer: 0, 
      completedSectors: [], colorToggle: false, trail: []
    }
  }, [])
  useEffect(() => { resetSim() }, [eTarget, resetSim])

  useAnimationFrame((dt, absoluteTime) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = setupCanvas(ctx)
    
    const A_SEMI = getA_SEMI(width, height)
    const n = Math.sqrt(MU / (A_SEMI * A_SEMI * A_SEMI))
    const period = 2 * Math.PI / n
    const sweepTime = period / 8 
    
    if (isRunning) {
      const effDt = Math.min(0.02, dt)
      simRef.current.timer += effDt
      simRef.current.sectorTimer += effDt
      
      const { timer, sectorTimer } = simRef.current
      const M = (n * timer) % (2 * Math.PI)
      const E = solveKepler(M, eTarget)
      
      const b = A_SEMI * Math.sqrt(1 - eTarget * eTarget)
      const x = A_SEMI * (Math.cos(E) - eTarget), y = b * Math.sin(E)
      
      const Edot = n / (1 - eTarget * Math.cos(E))
      const vx = -A_SEMI * Math.sin(E) * Edot, vy = b * Math.cos(E) * Edot
      
      simRef.current.x = x; simRef.current.y = y; simRef.current.vx = vx; simRef.current.vy = vy
      
      const h_angular = Math.sqrt(MU * A_SEMI * (1 - eTarget * eTarget))
      const currentArea = 0.5 * h_angular * sectorTimer
      
      simRef.current.sectorPoints.push({ x, y })
      simRef.current.trail.push({ x, y })
      if (simRef.current.trail.length > 150) simRef.current.trail.shift()
      
      if (sectorTimer >= sweepTime) {
        const exactArea = 0.5 * h_angular * sweepTime
        simRef.current.completedSectors.push({ 
          points: [{ x:0, y:0 }, ...simRef.current.sectorPoints, {x, y}], 
          area: exactArea, colorIdx: simRef.current.colorToggle ? 0 : 1 
        })
        if (simRef.current.completedSectors.length > 8) simRef.current.completedSectors.shift()
        
        simRef.current.sectorPoints = [{ x, y }]
        simRef.current.sectorTimer = 0
        simRef.current.colorToggle = !simRef.current.colorToggle
      }
      
      if (absoluteTime - lastUiUpdate.current > 100) {
        setTelemetry({
          r: Math.sqrt(x * x + y * y).toFixed(1),
          v: Math.sqrt(vx * vx + vy * vy).toFixed(2),
          h: Math.abs(x * vy - y * vx).toFixed(0),
          currentArea: Math.round(currentArea),
          lastCompletedArea: Math.round(0.5 * h_angular * sweepTime),
          completedSectors: simRef.current.completedSectors.length
        })
        lastUiUpdate.current = absoluteTime
      }
    }
    
    ctx.save()
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, width, height)
    
    if (starsRef.current) {
      ctx.fillStyle = '#ffffff'
      starsRef.current.forEach(star => {
        ctx.globalAlpha = star.alpha + Math.sin(absoluteTime * 0.001 + star.phase) * 0.15
        ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill()
      })
      ctx.globalAlpha = 1
    }

    const cx = width / 2, cy = height / 2
    ctx.translate(cx, cy)
    
    const b = A_SEMI * Math.sqrt(1 - eTarget * eTarget)
    
    ctx.beginPath()
    for (let E_ref = 0; E_ref <= Math.PI * 2; E_ref += 0.02) {
      const ex = A_SEMI * (Math.cos(E_ref) - eTarget), ey = b * Math.sin(E_ref)
      if (E_ref === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey)
    }
    ctx.closePath()
    ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1.5
    ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([])
    
    simRef.current.completedSectors.forEach(sector => {
      ctx.beginPath()
      sector.points.forEach((pt, idx) => { if(idx === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y) })
      ctx.closePath()
      ctx.fillStyle = sector.colorIdx === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.2)'
      ctx.fill()
      ctx.strokeStyle = sector.colorIdx === 0 ? 'rgba(245,158,11,0.6)' : 'rgba(139,92,246,0.6)'
      ctx.lineWidth = 1.5; ctx.stroke()
      
      const mid = sector.points[Math.floor(sector.points.length / 2)]
      if (mid) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.7)'; ctx.beginPath(); ctx.roundRect(mid.x / 1.5 - 35, mid.y / 1.5 - 12, 70, 20, 4); ctx.fill()
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 12px "Times New Roman"'; ctx.textAlign = 'center'
        ctx.fillText(`ΔS = 恒定`, mid.x / 1.5, mid.y / 1.5 + 2)
      }
    })
    
    const { sectorPoints, x, y, vx, vy, trail } = simRef.current
    if (sectorPoints.length > 1) {
      ctx.beginPath(); ctx.moveTo(0, 0)
      sectorPoints.forEach(pt => ctx.lineTo(pt.x, pt.y)); ctx.lineTo(0,0); ctx.closePath()
      const currentGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, A_SEMI * 2)
      currentGrad.addColorStop(0, 'rgba(6,182,212,0.4)'); currentGrad.addColorStop(1, 'rgba(6,182,212,0.05)')
      ctx.fillStyle = currentGrad; ctx.fill()
      
      const last = sectorPoints[sectorPoints.length - 1]
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(last.x, last.y)
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5; ctx.shadowBlur = 15; ctx.shadowColor = '#38bdf8'
      ctx.stroke(); ctx.shadowBlur = 0
    }
    
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2)
    ctx.fillStyle = '#f59e0b'; ctx.shadowBlur = 25; ctx.shadowColor = 'rgba(245, 158, 11, 0.6)'; ctx.fill(); ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'italic bold 15px "Times New Roman"'; ctx.textAlign='left'; ctx.fillText('F₁ (Sun)', 20, 30)
    
    const f2_x = -2 * A_SEMI * eTarget
    ctx.beginPath(); ctx.arc(f2_x, 0, 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'; ctx.fill()
    ctx.fillText('F₂', f2_x + 8, 5)
    
    const rp = A_SEMI * (1 - eTarget), ra = A_SEMI * (1 + eTarget)
    ctx.fillStyle = '#f87171'; ctx.font = 'bold 12px "Microsoft YaHei"'; ctx.fillText('近日点', rp + 15, -15); ctx.beginPath(); ctx.arc(rp, 0, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#60a5fa'; ctx.fillText('远日点', -ra - 55, -15); ctx.beginPath(); ctx.arc(-ra, 0, 4, 0, Math.PI * 2); ctx.fill()
    
    if (showVectors) {
      drawVector(ctx, 0, 0, x, y, 'rgba(255,255,255,0.3)', 'r', true, 20)
      const vScale = 30
      drawVector(ctx, x, y, vx * vScale, vy * vScale, '#facc15', 'v', true)
    }

    if (trail.length > 2) {
      ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y)
      for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y)
      ctx.lineTo(x, y)
      const trailGrad = ctx.createLinearGradient(trail[0].x, trail[0].y, x, y)
      trailGrad.addColorStop(0, 'rgba(96,165,250,0)'); trailGrad.addColorStop(1, 'rgba(96,165,250,1)')
      ctx.strokeStyle = trailGrad; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.stroke()
    }
    
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#e0f2fe'; ctx.fill()
    ctx.shadowBlur = 15; ctx.shadowColor = '#38bdf8'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0
    
    ctx.restore()
  })

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-slate-100">
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/50 bg-black h-[500px] lg:h-[650px] shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
        <GlassPanel className="flex-1 flex flex-col justify-center p-6 font-mono">
          <h3 className="text-slate-300 font-black tracking-widest text-sm uppercase border-b border-slate-700/60 pb-3 mb-5">◆ 面积定律 - 解析学无误差轨道验证</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 shadow-inner">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-4 font-bold">🛰️ 卫星即时运动状态</div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-500">向径 r</span><span className="text-slate-100 font-bold">{telemetry.r}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">切向速度 v</span><span className="text-amber-400 font-bold">{telemetry.v}</span></div>
                <div className="flex justify-between text-sm border-t border-slate-700/50 pt-3"><span className="text-slate-500">角动量 |r×v|</span><span className="text-emerald-400 font-black">{telemetry.h} (理论恒定)</span></div>
              </div>
            </div>
            <div className="bg-emerald-950/20 p-5 rounded-xl border border-emerald-800/40 flex flex-col justify-between shadow-inner">
              <div>
                <div className="text-emerald-400 text-xs uppercase tracking-wider mb-4 font-bold">📐 掠过等时面积比较 (ΔS)</div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center"><span className="text-slate-400">当前累积扇区</span><span className="text-cyan-400 font-black text-lg">{telemetry.currentArea}</span></div>
                  <div className="flex justify-between text-sm items-center"><span className="text-slate-400">完整历史扇区</span><span className="text-amber-400 font-black text-lg">{telemetry.lastCompletedArea}</span></div>
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="w-full xl:w-[350px] shrink-0 flex flex-col justify-center p-6 font-mono">
          <h3 className="text-slate-300 font-black tracking-widest text-sm uppercase border-b border-slate-700/60 pb-3 mb-6">◆ 轨道参数控制</h3>
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-700/50 mb-6 shadow-inner">
            <div className="flex justify-between text-sm mb-4"><span className="text-slate-400">离心率 (e)</span><span className="text-sky-400 font-black">{eTarget.toFixed(2)}</span></div>
            <input type="range" min="0.05" max="0.85" step="0.01" value={eTarget} onChange={e => setETarget(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-sky-500 cursor-pointer" />
            <div className="text-[10px] text-slate-500 mt-3 text-center leading-relaxed">基于牛顿-拉弗森求解开普勒方程<br/>零截断误差，轨迹绝对闭合</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsRunning(!isRunning)} className={`flex-1 py-3.5 font-black text-sm rounded-xl transition-all shadow-lg ${isRunning ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40 hover:bg-amber-500/20' : 'bg-emerald-600/90 text-white shadow-emerald-900/40 hover:bg-emerald-500'}`}>{isRunning ? '⏸ 暂停动画' : '▶ 恢复运行'}</button>
            <button onClick={() => setShowVectors(!showVectors)} className={`px-5 py-3.5 rounded-xl border font-bold text-sm transition-colors ${showVectors ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-700/50 text-slate-500 hover:text-white hover:bg-slate-800'}`}>微元标识</button>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

/* ==========================================
   模块 3：双星系统动力学 (保持不变)
   ========================================== */
const BinaryStar = () => {
  const canvasRef = useRef(null)
  const [m1, setM1] = useState(60)
  const [m2, setM2] = useState(30)
  const setupCanvas = useRetinaCanvas(canvasRef)
  const simRef = useRef({ bodies: [], L: 350, r1: 0, r2: 0 })
  const starsRef = useRef(null)
  const G = 5000

  useEffect(() => { starsRef.current = createStars(200, 2000, 2000) }, [])

  const initSim = useCallback(() => {
    const totalMass = m1 + m2, L = 350
    const r1 = (L * m2) / totalMass, r2 = (L * m1) / totalMass
    const omega = Math.sqrt(G * totalMass / Math.pow(L, 3))
    const v1 = omega * r1, v2 = omega * r2
    simRef.current = {
      bodies: [
        { x: r1, y: 0, vx: 0, vy: v1, mass: m1, color: '#ef4444' },
        { x: -r2, y: 0, vx: 0, vy: -v2, mass: m2, color: '#3b82f6' },
      ],
      L, r1, r2, omega
    }
  }, [m1, m2])
  useEffect(() => { initSim() }, [initSim])

  useAnimationFrame((dt, absoluteTime) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = setupCanvas(ctx)
    const bodies = simRef.current.bodies
    if (!bodies || bodies.length < 2) return
    
    const { omega, r1, r2 } = simRef.current
    const timeRef = (simRef.current.time = (simRef.current.time || 0) + dt * 0.05)
    
    bodies[0].x = r1 * Math.cos(omega * timeRef); bodies[0].y = r1 * Math.sin(omega * timeRef)
    bodies[1].x = -r2 * Math.cos(omega * timeRef); bodies[1].y = -r2 * Math.sin(omega * timeRef)
    bodies[0].vx = -r1 * omega * Math.sin(omega * timeRef); bodies[0].vy = r1 * omega * Math.cos(omega * timeRef)
    bodies[1].vx = r2 * omega * Math.sin(omega * timeRef); bodies[1].vy = -r2 * omega * Math.cos(omega * timeRef)
    
    const dx = bodies[1].x - bodies[0].x, dy = bodies[1].y - bodies[0].y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const forceMag = (G * bodies[0].mass * bodies[1].mass) / (dist * dist)
    
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, width, height)
    ctx.save(); ctx.translate(width / 2, height / 2)
    
    if (starsRef.current) {
      ctx.fillStyle = '#ffffff'
      starsRef.current.forEach(star => {
        ctx.globalAlpha = star.alpha + Math.sin(absoluteTime * 0.001 + star.phase) * 0.2
        ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill()
      })
      ctx.globalAlpha = 1
    }

    const gravityWell = ctx.createRadialGradient(0, 0, 0, 0, 0, 450)
    gravityWell.addColorStop(0, 'rgba(0, 0, 0, 0.9)'); gravityWell.addColorStop(0.6, 'rgba(15, 23, 42, 0.4)'); gravityWell.addColorStop(1, 'transparent')
    ctx.beginPath(); ctx.ellipse(0, 0, 500, 450, 0, 0, Math.PI*2); ctx.fillStyle = gravityWell; ctx.fill()
    
    ctx.beginPath(); ctx.arc(0, 0, r1, 0, Math.PI*2)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 8]); ctx.stroke()
    ctx.beginPath(); ctx.arc(0, 0, r2, 0, Math.PI*2)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([])
    
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, 15); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke()
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.stroke()
    
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-50, -80); ctx.lineTo(-160, -80)
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; ctx.beginPath(); ctx.roundRect(-160, -95, 110, 26, 4); ctx.fill()
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.2)'; ctx.stroke()
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 14px "Microsoft YaHei", sans-serif'; ctx.fillText('C.M. 共同质心', -153, -77)
    
    ctx.beginPath(); ctx.moveTo(bodies[0].x, bodies[0].y); ctx.lineTo(bodies[1].x, bodies[1].y)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke()
    
    bodies.forEach((body, idx) => {
      ctx.beginPath(); ctx.arc(body.x, body.y, 15 + body.mass / 5, 0, Math.PI * 2)
      ctx.fillStyle = body.color; ctx.shadowBlur = 30; ctx.shadowColor = body.color; ctx.fill(); ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(body.x, body.y, (15 + body.mass / 5) * 0.4, 0, Math.PI * 2); ctx.fill()

      drawVector(ctx, body.x, body.y, body.vx * 30, body.vy * 30, '#10b981', `v${idx+1}`, true)
      const forceVecLen = Math.min(120, forceMag * 20)
      const angleToCenter = Math.atan2(-body.y, -body.x)
      drawVector(ctx, body.x, body.y, Math.cos(angleToCenter) * forceVecLen, Math.sin(angleToCenter) * forceVecLen, '#facc15', `F引`, true, 25)
    })
    ctx.restore()
  })

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-slate-100">
      <div className="relative w-full bg-black rounded-2xl overflow-hidden border border-slate-700/50 h-[500px] lg:h-[650px] shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
        <GlassPanel className="flex-1 flex flex-col justify-center p-6 font-mono">
          <div className="flex flex-wrap items-center gap-4 mb-6 border-b border-slate-700/60 pb-4">
            <h3 className="text-slate-300 font-black text-lg tracking-wider">双星系统：轨道杠杆定律验证 <span className="text-slate-500 font-normal italic">(m₁r₁ = m₂r₂)</span></h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col justify-center bg-slate-900/60 p-5 rounded-xl border border-red-900/40 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <span className="text-red-400 font-bold text-sm tracking-wide">🔴 红星动力矩 (m₁·r₁)</span>
                <span className="font-black text-3xl text-red-100 drop-shadow-md">{(m1 * (350 * m2 / (m1 + m2))).toFixed(0)}</span>
              </div>
              <div className="text-sm text-slate-400 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                计算公式: 质量 {m1} × 半径 {(350 * m2 / (m1 + m2)).toFixed(1)}
              </div>
            </div>
            <div className="flex flex-col justify-center bg-slate-900/60 p-5 rounded-xl border border-blue-900/40 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <span className="text-blue-400 font-bold text-sm tracking-wide">🔵 蓝星动力矩 (m₂·r₂)</span>
                <span className="font-black text-3xl text-blue-100 drop-shadow-md">{(m2 * (350 * m1 / (m1 + m2))).toFixed(0)}</span>
              </div>
              <div className="text-sm text-slate-400 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                计算公式: 质量 {m2} × 半径 {(350 * m1 / (m1 + m2)).toFixed(1)}
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="w-full xl:w-[380px] shrink-0 flex flex-col justify-center p-6 font-mono">
          <h3 className="text-slate-400 font-bold border-b border-slate-700/60 pb-3 mb-6 uppercase tracking-widest text-sm">◆ 恒星质量演化参数</h3>
          <div className="space-y-6">
            <label className="block bg-slate-950/60 p-5 rounded-xl border border-slate-700/50 shadow-inner">
              <div className="flex justify-between text-sm mb-4 text-red-400 font-bold"><span>🔴 主星质量 m₁</span> <span className="text-white text-lg">{m1} M☉</span></div>
              <input type="range" min="10" max="150" value={m1} onChange={e => setM1(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-red-500 cursor-pointer" />
            </label>
            <label className="block bg-slate-950/60 p-5 rounded-xl border border-slate-700/50 shadow-inner">
              <div className="flex justify-between text-sm mb-4 text-blue-400 font-bold"><span>🔵 伴星质量 m₂</span> <span className="text-white text-lg">{m2} M☉</span></div>
              <input type="range" min="10" max="150" value={m2} onChange={e => setM2(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer" />
            </label>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

/* ==========================================
   模块 4：三大轨道动力学辨析 (保持不变)
   ========================================== */
const SatelliteComparison = () => {
  const canvasRef = useRef(null)
  const simTimeRef = useRef(0)
  const [simSpeed, setSimSpeed] = useState(1)
  const [telemetry, setTelemetry] = useState({ v_eq: 0, v_sync: 0, v_near: 0, w_eq: 0, w_sync: 0, w_near: 0 })
  const lastUiUpdate = useRef(0)
  const setupCanvas = useRetinaCanvas(canvasRef)
  
  const R_earth = 90, R_near = R_earth + 40, R_sync = R_earth * 3.2
  const w_earth = 0.3, GM = w_earth * w_earth * Math.pow(R_sync, 3)
  const w_near = Math.sqrt(GM / Math.pow(R_near, 3))

  const drawSatellite = (ctx, x, y, angle, color) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle)
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'; ctx.fillRect(-6, -18, 12, 14); ctx.fillRect(-6, 4, 12, 14)
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1
    ctx.strokeRect(-6, -18, 12, 14); ctx.strokeRect(-6, 4, 12, 14)
    for(let i=0; i<3; i++) {
      ctx.beginPath(); ctx.moveTo(-6, -18 + i*4); ctx.lineTo(6, -18 + i*4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-6, 4 + i*4); ctx.lineTo(6, 4 + i*4); ctx.stroke()
    }
    ctx.fillStyle = color; ctx.fillRect(-10, -5, 20, 10); ctx.strokeRect(-10, -5, 20, 10)
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  useAnimationFrame((dt, absoluteTime) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = setupCanvas(ctx)
    const t = (simTimeRef.current += Math.min(0.05, dt) * simSpeed)
    
    const angleEarth = w_earth * t, angleNear = w_near * t
    const v_eq_val = w_earth * R_earth, v_sync_val = w_earth * R_sync, v_near_val = w_near * R_near
    
    if (absoluteTime - lastUiUpdate.current > 100) {
      setTelemetry({
        v_eq: v_eq_val.toFixed(1), v_sync: v_sync_val.toFixed(1), v_near: v_near_val.toFixed(1),
        w_eq: w_earth.toFixed(2), w_sync: w_earth.toFixed(2), w_near: w_near.toFixed(2)
      })
      lastUiUpdate.current = absoluteTime
    }
    
    ctx.clearRect(0, 0, width, height)
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height))
    bgGrad.addColorStop(0, '#0f172a'); bgGrad.addColorStop(1, '#020617')
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height)
    
    ctx.save(); ctx.translate(width / 2, height / 2)
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; ctx.lineWidth = 1
    for(let r = 50; r < 800; r += 50) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke() }
    
    ctx.beginPath(); ctx.arc(0, 0, R_near, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.stroke()
    ctx.beginPath(); ctx.arc(0, 0, R_sync, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)'; ctx.stroke(); ctx.setLineDash([])
    
    drawDetailedEarth(ctx, R_earth, angleEarth)
    
    ctx.save(); ctx.rotate(angleEarth)
    const eqX = R_earth, eqY = 0
    ctx.beginPath(); ctx.arc(eqX, eqY, 6, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.shadowBlur = 10; ctx.shadowColor='#ef4444'; ctx.fill(); ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; ctx.beginPath(); ctx.roundRect(eqX - 25, eqY - 12, 20, 20, 4); ctx.fill()
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; ctx.stroke()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "Times New Roman"'; ctx.fillText('A', eqX - 20, eqY + 3)
    ctx.restore() 
    
    const absEqX = R_earth * Math.cos(angleEarth), absEqY = R_earth * Math.sin(angleEarth)
    const syncX = R_sync * Math.cos(angleEarth), syncY = R_sync * Math.sin(angleEarth)
    const nearX = R_near * Math.cos(angleNear), nearY = R_near * Math.sin(angleNear)
    
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(syncX, syncY)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([])
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(nearX, nearY)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)'; ctx.lineWidth = 1; ctx.stroke()
    
    drawSatellite(ctx, syncX, syncY, angleEarth, '#facc15')
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; ctx.beginPath(); ctx.roundRect(syncX - 30, syncY - 12, 20, 20, 4); ctx.fill()
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; ctx.stroke()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "Times New Roman"'; ctx.fillText('B', syncX - 25, syncY + 3)
    
    drawSatellite(ctx, nearX, nearY, angleNear, '#10b981')
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; ctx.beginPath(); ctx.roundRect(nearX - 30, nearY - 12, 20, 20, 4); ctx.fill()
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; ctx.stroke()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "Times New Roman"'; ctx.fillText('C', nearX - 25, nearY + 3)
    
    const vRenderScale = 1.2
    drawVector(ctx, absEqX, absEqY, -Math.sin(angleEarth) * v_eq_val * vRenderScale, Math.cos(angleEarth) * v_eq_val * vRenderScale, '#ef4444', `vA`, true)
    drawVector(ctx, syncX, syncY, -Math.sin(angleEarth) * v_sync_val * vRenderScale, Math.cos(angleEarth) * v_sync_val * vRenderScale, '#facc15', `vB`, true)
    drawVector(ctx, nearX, nearY, -Math.sin(angleNear) * v_near_val * vRenderScale, Math.cos(angleNear) * v_near_val * vRenderScale, '#10b981', `vC`, true)
    
    ctx.restore()
  })

  const maxV = 100

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-slate-100">
      <div className="relative w-full bg-black rounded-2xl overflow-hidden h-[500px] lg:h-[650px] shadow-2xl border border-slate-700/50">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
        <div className="flex-1 flex flex-col justify-between">
          <h3 className="text-xl font-black text-slate-200 uppercase tracking-widest border-b-2 border-blue-600/50 pb-3 mb-5 inline-block self-start text-shadow-sm">三大轨道动力学辨析对比</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <GlassPanel className="p-5 border-t-4 border-t-emerald-500">
              <div className="font-black text-emerald-400 mb-4 flex justify-between items-center text-lg">
                <span>C: 近地卫星</span><span className="text-[10px] bg-emerald-900/40 text-emerald-300 px-2.5 py-1 rounded-sm border border-emerald-800/50 font-bold">自由环绕</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-slate-300 text-xs mb-2 font-bold"><span>线速度 v</span> <span className="font-mono text-white">{telemetry.v_near}</span></div>
                  <div className="w-full bg-slate-900 h-2 rounded overflow-hidden shadow-inner"><div className="bg-emerald-500 h-full shadow-[0_0_8px_#10b981]" style={{width: `${Math.min(100, (telemetry.v_near/maxV)*100)}%`}}></div></div>
                </div>
              </div>
            </GlassPanel>
            
            <GlassPanel className="p-5 border-t-4 border-t-amber-500">
              <div className="font-black text-amber-400 mb-4 flex justify-between items-center text-lg">
                <span>B: 同步卫星</span><span className="text-[10px] bg-amber-900/40 text-amber-300 px-2.5 py-1 rounded-sm border border-amber-800/50 font-bold">自由环绕</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-slate-300 text-xs mb-2 font-bold"><span>线速度 v</span> <span className="font-mono text-white">{telemetry.v_sync}</span></div>
                  <div className="w-full bg-slate-900 h-2 rounded overflow-hidden shadow-inner"><div className="bg-amber-500 h-full shadow-[0_0_8px_#f59e0b]" style={{width: `${Math.min(100, (telemetry.v_sync/maxV)*100)}%`}}></div></div>
                </div>
              </div>
            </GlassPanel>
            
            <GlassPanel className="p-5 border-t-4 border-t-red-500">
              <div className="font-black text-red-400 mb-4 flex justify-between items-center text-lg">
                <span>A: 赤道物体</span><span className="text-[10px] bg-red-900/40 text-red-300 px-2.5 py-1 rounded-sm border border-red-800/50 font-bold">非自由环绕</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-slate-300 text-xs mb-2 font-bold"><span>跟随速度 v</span> <span className="font-mono text-white">{telemetry.v_eq}</span></div>
                  <div className="w-full bg-slate-900 h-2 rounded overflow-hidden shadow-inner"><div className="bg-red-500 h-full shadow-[0_0_8px_#ef4444]" style={{width: `${Math.min(100, (telemetry.v_eq/maxV)*100)}%`}}></div></div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>

        <GlassPanel className="w-full xl:w-[320px] shrink-0 flex flex-col font-sans p-6">
          <h3 className="text-lg font-black text-slate-300 uppercase tracking-widest border-b border-slate-700/60 pb-3 mb-6">实验控制台</h3>
          <div className="mt-auto bg-slate-950/60 p-5 rounded-xl border border-slate-800 shadow-inner">
            <div className="flex justify-between text-sm text-slate-400 font-bold mb-5 items-center">
              <span>全局演示倍速</span>
              <span className="text-blue-400 bg-blue-900/30 font-mono font-black px-2 py-0.5 rounded border border-blue-900/50">{simSpeed.toFixed(1)}x</span>
            </div>
            <input 
              type="range" min="0.1" max="3" step="0.1" 
              value={simSpeed} onChange={(e) => setSimSpeed(parseFloat(e.target.value))} 
              className="w-full h-1.5 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer" 
            />
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

/* ==========================================
   主控室 (顶级 UI 容器)
   ========================================== */
export default function TianTiYunDongSimulation() {
  const [activeTab, setActiveTab] = useState(0)
  const tabs = [
    { name: '卫星发射', component: <NewtonCannon /> },
    { name: '开普勒面积定律', component: <KeplerArea /> },
    { name: '双星系统杠杆定律', component: <BinaryStar /> },
    { name: '三大轨道动力学辨析', component: <SatelliteComparison /> },
  ]
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#020617] min-h-screen rounded-2xl shadow-2xl font-sans text-slate-100 selection:bg-blue-600/50 overflow-hidden">
      <div className="relative mb-10 pb-6 border-b border-slate-800/80">
        {/* 光晕背景 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-gradient-to-r from-blue-600/30 via-sky-500/20 to-emerald-400/20 blur-[120px] rounded-full pointer-events-none" />
        
        <h1 className="relative text-3xl md:text-5xl font-black text-center tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-300">
          天体运动仿真实验室
        </h1>
        <p className="text-center text-slate-400 mt-3 text-sm md:text-base">交互式物理可视化 • 基于牛顿力学与开普勒定律</p>
      </div>

      <div className="flex justify-center gap-3 md:gap-4 mb-12 flex-wrap relative z-10">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-6 py-3.5 md:px-9 md:py-4 rounded-2xl font-bold text-sm md:text-base transition-all duration-300 backdrop-blur-md border active:scale-95 ${
              activeTab === idx
                ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(59,130,246,0.5)] border-blue-400 scale-105'
                : 'bg-slate-900/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-slate-700/70 hover:border-slate-600'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="w-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="w-full">
          {tabs[activeTab].component}
        </div>
      </div>
    </div>
  )
}
