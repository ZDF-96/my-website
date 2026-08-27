'use client'
import React, { useState, useEffect, useRef, useCallback, memo } from 'react'

/* ==========================================
   1. 数学常数与底层高精度工具
   ========================================== */
const PI2 = Math.PI * 2
const HALF_PI = Math.PI / 2

const useAnimationFrame = (callback) => {
  const requestRef = useRef()
  const previousTimeRef = useRef()
  const savedCallback = useRef(callback)

  useEffect(() => { savedCallback.current = callback }, [callback])

  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = Math.min(0.05, (time - previousTimeRef.current) / 1000)
        savedCallback.current(deltaTime, time / 1000)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [])
}

const useRetinaCanvas = (canvasRef) => {
  return useCallback((ctx) => {
    const canvas = canvasRef.current
    if (!canvas) return { width: 0, height: 0, dpr: 1 }
    const dpr = Math.max(1, Math.min(3, typeof window !== 'undefined' ? window.devicePixelRatio : 1))
    const rect = canvas.getBoundingClientRect()
    const width = rect.width, height = rect.height
    if (canvas.__dpr !== dpr || canvas.__cssW !== width || canvas.__cssH !== height) {
      canvas.__dpr = dpr
      canvas.__cssW = width
      canvas.__cssH = height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { width, height, dpr }
  }, [canvasRef])
}

// 深空星空背景生成器
const useStarfield = (starCount = 180) => {
  const starsRef = useRef([])
  useEffect(() => {
    starsRef.current = Array.from({ length: starCount }, () => ({
      x: Math.random(), y: Math.random(),
      size: Math.random() * 1.3 + 0.3,
      speed: Math.random() * 1.5 + 0.5,
      phase: Math.random() * PI2
    }))
  }, [starCount])

  return useCallback((ctx, width, height, time) => {
    ctx.fillStyle = '#02040a'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    starsRef.current.forEach(s => {
      const alpha = 0.15 + 0.7 * Math.abs(Math.sin(time * s.speed + s.phase))
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(s.x * width, s.y * height, s.size, 0, PI2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0
  }, [])
}

// 教材级标准物理矢量绘制：带法向/切向虚线投影、分量标签及背景板
const drawTextbookVector = (ctx, x, y, vx, vy, color, label = '', options = {}) => {
  const { lineWidth = 2, arrowSize = 7, showBackdrop = true, fontSize = 13, align = 'auto' } = options
  const len = Math.hypot(vx, vy)
  if (len < 1) return

  const angle = Math.atan2(vy, vx)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  // 箭身
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(len, 0)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.shadowBlur = 8; ctx.shadowColor = color
  ctx.stroke()
  ctx.shadowBlur = 0

  // 箭头
  ctx.beginPath()
  ctx.moveTo(len + 1, 0)
  ctx.lineTo(len - arrowSize, -arrowSize * 0.55)
  ctx.lineTo(len - arrowSize, arrowSize * 0.55)
  ctx.fillStyle = color
  ctx.fill()

  // 标注文档
  if (label) {
    ctx.rotate(-angle)
    ctx.font = `italic bold ${fontSize}px "Cambria Math", "Times New Roman", serif`
    const metrics = ctx.measureText(label)
    const textWidth = metrics.width
    
    let lx = vx * 1.05 + 6
    let ly = vy * 1.05 + 4
    if (align === 'center') {
      lx = vx * 0.5 - textWidth / 2
      ly = vy * 0.5 - 6
    }

    if (showBackdrop) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.88)'
      ctx.beginPath()
      ctx.roundRect(lx - 4, ly - fontSize, textWidth + 8, fontSize + 5, 3)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
    ctx.fillStyle = color
    ctx.fillText(label, lx, ly)
  }
  ctx.restore()
}

// 渐变衰减的坐标网格
const drawTextbookGrid = (ctx, width, height, scale, unitStr = 'km', center = { x: 0, y: 0 }) => {
  ctx.save()
  const maxR = Math.hypot(width, height) / 2
  const gridGrad = ctx.createRadialGradient(center.x, center.y, maxR * 0.2, center.x, center.y, maxR)
  gridGrad.addColorStop(0, 'rgba(148, 163, 184, 0.12)')
  gridGrad.addColorStop(1, 'rgba(148, 163, 184, 0)')

  ctx.strokeStyle = gridGrad
  ctx.lineWidth = 1

  const stepPixel = 60
  for (let r = stepPixel; r < maxR; r += stepPixel) {
    ctx.beginPath()
    ctx.arc(center.x, center.y, r, 0, PI2)
    ctx.stroke()
  }

  // 绘制比例尺 (Scale Bar)
  const barPixel = 100
  const physicalDist = barPixel / scale
  const barX = 24, barY = height - 24
  
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(barX, barY - 4); ctx.lineTo(barX, barY); ctx.lineTo(barX + barPixel, barY); ctx.lineTo(barX + barPixel, barY - 4)
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px "JetBrains Mono", monospace'
  ctx.fillText(`0`, barX - 3, barY - 7)
  ctx.fillText(`${physicalDist >= 1e4 ? physicalDist.toExponential(2) : physicalDist.toFixed(1)} ${unitStr}`, barX + barPixel - 35, barY - 7)
  ctx.restore()
}

// 带有大气散射与晨昏圈的次世代地球
const drawDetailedEarth = (ctx, radius, rotation, sunAngle = 0) => {
  if (radius < 0.5) return
  ctx.save()

  // 大气层外发光
  const halo = ctx.createRadialGradient(0, 0, radius * 0.95, 0, 0, radius * 1.5)
  halo.addColorStop(0, 'rgba(56, 189, 248, 0.45)')
  halo.addColorStop(0.4, 'rgba(56, 189, 248, 0.12)')
  halo.addColorStop(1, 'transparent')
  ctx.beginPath(); ctx.arc(0, 0, radius * 1.5, 0, PI2); ctx.fillStyle = halo; ctx.fill()

  ctx.beginPath(); ctx.arc(0, 0, radius, 0, PI2); ctx.clip()

  const oceanGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius * 1.2)
  oceanGrad.addColorStop(0, '#1e40af'); oceanGrad.addColorStop(1, '#020617')
  ctx.fillStyle = oceanGrad; ctx.fillRect(-radius, -radius, radius * 2, radius * 2)

  // 经纬线
  if (radius > 15) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * Math.sqrt(Math.max(0, 1 - (i / 4) ** 2)), 0, 0, PI2); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(0, 0, radius * Math.sqrt(Math.max(0, 1 - (i / 4) ** 2)), radius, 0, 0, PI2); ctx.stroke()
    }
  }

  // 大陆板块
  ctx.rotate(rotation)
  ctx.fillStyle = 'rgba(34, 197, 94, 0.65)'
  ctx.beginPath()
  ctx.ellipse(radius * 0.2, -radius * 0.3, radius * 0.65, radius * 0.35, Math.PI / 6, 0, PI2)
  ctx.ellipse(-radius * 0.35, radius * 0.35, radius * 0.45, radius * 0.45, -Math.PI / 8, 0, PI2)
  ctx.fill()
  ctx.rotate(-rotation)

  // 晨昏线阴影
  ctx.rotate(sunAngle)
  const termGrad = ctx.createLinearGradient(0, -radius, 0, radius)
  termGrad.addColorStop(0, 'rgba(0,0,0,0)')
  termGrad.addColorStop(0.5, 'rgba(0,0,0,0.55)')
  termGrad.addColorStop(1, 'rgba(0,0,0,0.95)')
  ctx.fillStyle = termGrad
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2)
  ctx.rotate(-sunAngle)

  ctx.restore()

  ctx.beginPath(); ctx.arc(0, 0, radius, 0, PI2)
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)'; ctx.lineWidth = Math.max(0.75, radius * 0.02); ctx.stroke()
}

// 发光恒星渲染
const drawGlowingStar = (ctx, x, y, radius, colorInner, colorOuter, time = 0) => {
  const pulse = 1 + 0.03 * Math.sin(time * 3)
  const r = radius * pulse
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3)
  grad.addColorStop(0, colorInner)
  grad.addColorStop(0.3, colorInner)
  grad.addColorStop(0.6, colorOuter)
  grad.addColorStop(1, 'transparent')
  
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.beginPath(); ctx.arc(x, y, r * 3, 0, PI2)
  ctx.fillStyle = grad; ctx.fill()
  ctx.restore()
  
  ctx.beginPath(); ctx.arc(x, y, radius * 0.85, 0, PI2)
  ctx.fillStyle = '#ffffff'; ctx.fill()
}

const GlassPanel = memo(({ children, className = "" }) => (
  <div className={`bg-slate-950/70 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] ${className}`}>
    {children}
  </div>
))
GlassPanel.displayName = 'GlassPanel'

/* =========================================================================
   模块 1：牛顿大炮（带轨道根数解析与逃逸临界线对比）
   ========================================================================= */
const NewtonCannon = () => {
  const canvasRef = useRef(null)
  const [v0, setV0] = useState(7.9)
  const [isRunning, setIsRunning] = useState(false)
  const [timeWarpLog, setTimeWarpLog] = useState(0)
  const [viewMode, setViewMode] = useState('EARTH')

  const MU_E = 3.986e5, MU_S = 1.327e11
  const R_E = 6371, D_AU = 1.496e8, V_E = 29.78
  const W_E = V_E / D_AU, W_ROT = PI2 / 86400

  const [telemetry, setTelemetry] = useState({ 
    r_e: 0, r_s: 0, v_e: 0, v_s: 0, E_e: 0, E_s: 0, 
    semiA: 0, eccentricity: 0, stateInfo: '', trajectoryType: ''
  })
  const lastUiUpdate = useRef(0)
  const setupCanvas = useRetinaCanvas(canvasRef)
  const drawBgStars = useStarfield(200)

  const simRef = useRef({
    t: 0, x: 0, y: 0, vx: 0, vy: 0, pathEarth: [], pathSun: [], crashed: false,
    scaleE: null, scaleS: null, initialScaleE: null, initialScaleS: null
  })

  const updateTelemetry = (x, y, vx, vy, t) => {
    const Ex = D_AU * Math.sin(W_E * t), Ey = -D_AU * Math.cos(W_E * t)
    const Evx = V_E * Math.cos(W_E * t), Evy = V_E * Math.sin(W_E * t)
    const rel_x = x - Ex, rel_y = y - Ey
    const r_e = Math.hypot(rel_x, rel_y)
    const v_e = Math.hypot(vx - Evx, vy - Evy)
    const E_e = 0.5 * v_e * v_e - MU_E / r_e

    const h_vec = rel_x * (vy - Evy) - rel_y * (vx - Evx)
    const a = E_e < 0 ? -MU_E / (2 * E_e) : Infinity
    const e = Math.sqrt(Math.max(0, 1 + (2 * E_e * h_vec * h_vec) / (MU_E * MU_E)))

    const r_s = Math.hypot(x, y), v_s = Math.hypot(vx, vy)
    const E_s = 0.5 * v_s * v_s - MU_S / r_s

    let stateInfo = '', trajectoryType = ''
    if (r_e < R_E * 0.99) {
      stateInfo = '弹道再入：与地表相撞 (r < R_E)'; trajectoryType = '亚轨道弹道 (Suborbital)'
    } else if (E_e < -1e-4) {
      stateInfo = e < 0.05 ? '第一宇宙速度：圆周环绕' : '椭圆束缚轨道 (Keplerian Ellipse)'
      trajectoryType = `封闭椭圆 (e = ${e.toFixed(3)})`
    } else if (Math.abs(E_e) <= 1e-4) {
      stateInfo = '第二宇宙速度临界：抛物线逃逸'; trajectoryType = '抛物线 (Parabolic)'
    } else if (E_s < 0) {
      stateInfo = '双曲线脱离地心，转入绕日轨道'; trajectoryType = '绕日人造行星轨道'
    } else {
      stateInfo = '第三宇宙速度：飞离太阳系'; trajectoryType = '双曲线太阳系逃逸'
    }

    setTelemetry({
      r_e: (r_e / R_E).toFixed(2), r_s: (r_s / D_AU).toFixed(4),
      v_e: v_e.toFixed(2), v_s: v_s.toFixed(2), E_e: E_e.toFixed(2), E_s: E_s.toFixed(2),
      semiA: a === Infinity ? '∞' : (a / R_E).toFixed(2), eccentricity: e.toFixed(3),
      stateInfo, trajectoryType
    })
  }

  const resetSim = useCallback(() => {
    const init_Sx = 0, init_Sy = -D_AU - R_E, init_Svx = V_E + v0, init_Svy = 0
    simRef.current.t = 0; simRef.current.x = init_Sx; simRef.current.y = init_Sy
    simRef.current.vx = init_Svx; simRef.current.vy = init_Svy
    simRef.current.pathEarth = [{ x: 0, y: -R_E }]
    simRef.current.pathSun = [{ x: init_Sx, y: init_Sy }]
    simRef.current.crashed = false
    setIsRunning(false)
    updateTelemetry(init_Sx, init_Sy, init_Svx, init_Svy, 0)
  }, [v0])

  useEffect(() => { resetSim() }, [v0, resetSim])

  const outDeriv = { ax: 0, ay: 0, re: 0 }
  const computeAccel = (x, y, t) => {
    const Ex = D_AU * Math.sin(W_E * t), Ey = -D_AU * Math.cos(W_E * t)
    const re_x = x - Ex, re_y = y - Ey, re = Math.hypot(re_x, re_y)
    const rs = Math.hypot(x, y)
    const r3s = rs * rs * rs, r3e = re * re * re
    outDeriv.ax = -MU_S * x / r3s - MU_E * re_x / r3e
    outDeriv.ay = -MU_S * y / r3s - MU_E * re_y / r3e
    outDeriv.re = re
  }

  useAnimationFrame((dt, absTime) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = setupCanvas(ctx)
    let { t, x, y, vx, vy, pathEarth, pathSun, crashed } = simRef.current

    drawBgStars(ctx, width, height, absTime)

    if (isRunning && !crashed) {
      const effectiveDt = Math.min(0.05, dt) * Math.pow(10, timeWarpLog)
      const Ex_temp = D_AU * Math.sin(W_E * t), Ey_temp = -D_AU * Math.cos(W_E * t)
      const r_e_current = Math.hypot(x - Ex_temp, y - Ey_temp)

      let safeDt = r_e_current < R_E * 3 ? 0.5 : r_e_current < R_E * 50 ? 10 : r_e_current < 1e6 ? 500 : 5000
      let steps = Math.min(600, Math.ceil(effectiveDt / safeDt))
      const subDt = effectiveDt / steps, halfSubDt = subDt * 0.5

      for (let i = 0; i < steps; i++) {
        computeAccel(x, y, t)
        if (outDeriv.re < R_E * 0.99) { crashed = true; break }
        const ax1 = outDeriv.ax, ay1 = outDeriv.ay, vx1 = vx, vy1 = vy

        computeAccel(x + halfSubDt * vx1, y + halfSubDt * vy1, t + halfSubDt)
        const ax2 = outDeriv.ax, ay2 = outDeriv.ay
        const vx2 = vx + halfSubDt * ax1, vy2 = vy + halfSubDt * ay1

        computeAccel(x + halfSubDt * vx2, y + halfSubDt * vy2, t + halfSubDt)
        const ax3 = outDeriv.ax, ay3 = outDeriv.ay
        const vx3 = vx + halfSubDt * ax2, vy3 = vy + halfSubDt * ay2

        computeAccel(x + subDt * vx3, y + subDt * vy3, t + subDt)
        const ax4 = outDeriv.ax, ay4 = outDeriv.ay
        const vx4 = vx + subDt * ax3, vy4 = vy + subDt * ay3

        x += (subDt / 6) * (vx1 + 2 * vx2 + 2 * vx3 + vx4)
        y += (subDt / 6) * (vy1 + 2 * vy2 + 2 * vy3 + vy4)
        vx += (subDt / 6) * (ax1 + 2 * ax2 + 2 * ax3 + ax4)
        vy += (subDt / 6) * (ay1 + 2 * ay2 + 2 * ay3 + ay4)
        t += subDt

        if (i % Math.max(1, Math.floor(steps / 10)) === 0) {
          if (outDeriv.re < R_E * 5000) {
            pathEarth.push({ x: x - D_AU * Math.sin(W_E * t), y: y + D_AU * Math.cos(W_E * t) })
            if (pathEarth.length > 3000) pathEarth.splice(0, pathEarth.length - 3000)
          }
          pathSun.push({ x, y })
          if (pathSun.length > 3600) pathSun.splice(0, pathSun.length - 3600)
        }
      }
      simRef.current.t = t; simRef.current.x = x; simRef.current.y = y
      simRef.current.vx = vx; simRef.current.vy = vy; simRef.current.crashed = crashed

      if (absTime * 1000 - lastUiUpdate.current > 100) {
        if (crashed) setIsRunning(false)
        updateTelemetry(x, y, vx, vy, t)
        lastUiUpdate.current = absTime * 1000
      }
    }

    const Ex = D_AU * Math.sin(W_E * t), Ey = -D_AU * Math.cos(W_E * t)
    const minCanvasHalf = Math.min(width, height) * 0.36
    const r_e_current = Math.hypot(x - Ex, y - Ey)
    const r_s_current = Math.hypot(x, y)

    const initScaleE = minCanvasHalf / (R_E * 3.5)
    const initScaleS = minCanvasHalf / (D_AU * 1.6)

    if (!simRef.current.scaleE) simRef.current.scaleE = simRef.current.initialScaleE = initScaleE
    if (!simRef.current.scaleS) simRef.current.scaleS = simRef.current.initialScaleS = initScaleS

    const targetScaleE = Math.min(initScaleE, minCanvasHalf / (r_e_current * 1.25))
    const targetScaleS = Math.min(initScaleS, minCanvasHalf / (r_s_current * 1.25))

    simRef.current.scaleE += (targetScaleE - simRef.current.scaleE) * 0.05
    simRef.current.scaleS += (targetScaleS - simRef.current.scaleS) * 0.05

    const { scaleE, scaleS } = simRef.current
    const sunAngle = Math.atan2(Ey, Ex)

    if (viewMode === 'EARTH') {
      drawTextbookGrid(ctx, width, height, scaleE, 'km', { x: width / 2, y: height / 2 })
      ctx.save(); ctx.translate(width / 2, height / 2)

      const earthRenderRadius = Math.max(3, R_E * scaleE)
      drawDetailedEarth(ctx, earthRenderRadius, W_ROT * t, sunAngle)

      ctx.beginPath(); ctx.arc(0, 0, (R_E + 50) * scaleE, 0, PI2)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'
      ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([])

      if (pathEarth.length > 1) {
        ctx.beginPath(); ctx.moveTo(pathEarth[0].x * scaleE, pathEarth[0].y * scaleE)
        for (let i = 1; i < pathEarth.length; i++) ctx.lineTo(pathEarth[i].x * scaleE, pathEarth[i].y * scaleE)
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5
        ctx.shadowBlur = 10; ctx.shadowColor = '#0ea5e9'; ctx.stroke(); ctx.shadowBlur = 0
      }

      if (!crashed) {
        const px = (x - Ex) * scaleE, py = (y - Ey) * scaleE
        ctx.beginPath(); ctx.arc(px, py, 5, 0, PI2)
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 12; ctx.shadowColor = '#38bdf8'; ctx.fill(); ctx.shadowBlur = 0

        const Evx = V_E * Math.cos(W_E * t), Evy = V_E * Math.sin(W_E * t)
        const relVx = vx - Evx, relVy = vy - Evy
        const vLen = Math.min(80, Math.hypot(relVx, relVy) * 3)
        const vAngle = Math.atan2(relVy, relVx)
        drawTextbookVector(ctx, px, py, Math.cos(vAngle) * vLen, Math.sin(vAngle) * vLen, '#facc15', 'v', { lineWidth: 2 })

        const gLen = Math.min(60, (MU_E / (r_e_current * r_e_current)) * 4000)
        const gAngle = Math.atan2(-py, -px)
        drawTextbookVector(ctx, px, py, Math.cos(gAngle) * gLen, Math.sin(gAngle) * gLen, '#f87171', 'a_g', { lineWidth: 1.8 })
      }
      ctx.restore()
    } else {
      drawTextbookGrid(ctx, width, height, scaleS * D_AU, 'AU', { x: width / 2, y: height / 2 })
      ctx.save(); ctx.translate(width / 2, height / 2)

      const sunRadius = Math.max(6, 20 * (scaleS / initScaleS))
      drawGlowingStar(ctx, 0, 0, sunRadius, '#fef08a', '#f59e0b', absTime)

      ctx.beginPath(); ctx.arc(0, 0, D_AU * scaleS, 0, PI2)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([])

      drawDetailedEarth(ctx, Math.max(3, 8 * (scaleS / initScaleS)), W_ROT * t, Math.atan2(-Ey, -Ex))

      if (pathSun.length > 1) {
        ctx.beginPath(); ctx.moveTo(pathSun[0].x * scaleS, pathSun[0].y * scaleS)
        for (let i = 1; i < pathSun.length; i++) ctx.lineTo(pathSun[i].x * scaleS, pathSun[i].y * scaleS)
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.8
        ctx.shadowBlur = 8; ctx.shadowColor = '#d97706'; ctx.stroke(); ctx.shadowBlur = 0
      }

      if (!crashed) {
        ctx.beginPath(); ctx.arc(x * scaleS, y * scaleS, 4, 0, PI2); ctx.fillStyle = '#ffffff'; ctx.fill()
      }
      ctx.restore()
    }
  })

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-slate-100">
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-black h-[520px] lg:h-[660px] shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
          <span className="text-xs font-mono text-sky-200/80 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded border border-slate-700/80">
            动力学积分器: 经典 4 阶 Runge-Kutta (自适应步长)
          </span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
        <GlassPanel className="flex-1 flex flex-col justify-center p-6 font-mono">
          <h3 className="text-slate-300 font-bold border-b border-slate-700/60 pb-3 mb-5 flex justify-between items-center text-sm tracking-wider">
            <span>双参考系动力学遥测 (Orbital Telemetry)</span>
            <span className="text-xs text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/50">{telemetry.trajectoryType}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-700/50">
              <div className="text-blue-400 font-bold mb-3 text-sm flex justify-between">
                <span>🌍 地心参考系 (ECI Frame)</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">地心距 r: <span className="text-slate-100 font-bold">{telemetry.r_e} R_E</span></div>
                <div className="flex justify-between text-slate-400">地心速度 v: <span className="text-slate-100 font-bold">{telemetry.v_e} km/s</span></div>
                <div className="flex justify-between text-slate-400">轨道半长轴 a: <span className="text-slate-100 font-bold">{telemetry.semiA} R_E</span></div>
                <div className="flex justify-between text-slate-400">偏心率 e: <span className="text-amber-400 font-bold">{telemetry.eccentricity}</span></div>
                <div className="flex justify-between text-slate-400 border-t border-slate-700/50 pt-2">
                  比机械能 ε_e: <span className={Number(telemetry.E_e) < 0 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{telemetry.E_e} km²/s²</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-700/50">
              <div className="text-amber-400 font-bold mb-3 text-sm flex justify-between">
                <span>☀️ 日心参考系 (Heliocentric)</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">日心距 r: <span className="text-slate-100 font-bold">{telemetry.r_s} AU</span></div>
                <div className="flex justify-between text-slate-400">绝对速度 v: <span className="text-slate-100 font-bold">{telemetry.v_s} km/s</span></div>
                <div className="flex justify-between text-slate-400 border-t border-slate-700/50 pt-2">
                  日心机械能 ε_s: <span className={Number(telemetry.E_s) < 0 ? "text-cyan-400 font-bold" : "text-fuchsia-400 font-bold"}>{telemetry.E_s} km²/s²</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2 rounded">
                  {telemetry.stateInfo || '等待点火...'}
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="w-full xl:w-[380px] shrink-0 flex flex-col justify-between p-6 font-mono">
          <div>
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800 mb-5">
              <button onClick={() => setViewMode('EARTH')} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${viewMode === 'EARTH' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>地心视角</button>
              <button onClick={() => setViewMode('SUN')} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${viewMode === 'SUN' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>日心视角</button>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs mb-2 text-slate-300">
                <span>发射初速度 (v₀)</span>
                <span className="text-amber-400 font-bold">{v0.toFixed(2)} km/s</span>
              </div>
              <input type="range" min="7.0" max="22.0" step="0.05" value={v0} disabled={isRunning} onChange={(e) => setV0(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer" />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>v₁ = 7.91</span><span>v₂ = 11.18</span><span>v₃ = 16.67</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2 text-slate-300">
                <span>仿真时间倍率</span>
                <span className="text-sky-400 font-bold">{Math.round(Math.pow(10, timeWarpLog))}x</span>
              </div>
              <input type="range" min="0" max="5.5" step="0.1" value={timeWarpLog} onChange={(e) => setTimeWarpLog(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-sky-500 cursor-pointer" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { resetSim(); setIsRunning(true) }} disabled={isRunning} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors shadow-lg shadow-blue-900/40">发射点火</button>
              <button onClick={() => setIsRunning(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-600 transition-colors">终止重置</button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

/* =========================================================================
   模块 2：开普勒面积定律（含有效势能曲线与正交动力学分解）
   ========================================================================= */
const KeplerArea = () => {
  const canvasRef = useRef(null)
  const potentialCanvasRef = useRef(null)
  const [eTarget, setETarget] = useState(0.60)
  const [isRunning, setIsRunning] = useState(true)
  const [showDecomposition, setShowDecomposition] = useState(true)

  const MU = 160000
  const [telemetry, setTelemetry] = useState({ r: 0, v: 0, h: 0, a_t: 0, a_n: 0, currentArea: 0, exactSectorArea: 0 })
  const lastUiUpdate = useRef(0)
  const setupCanvas = useRetinaCanvas(canvasRef)
  const setupPotCanvas = useRetinaCanvas(potentialCanvasRef)
  const drawBgStars = useStarfield(150)

  const simRef = useRef({
    timer: 0, sectorTimer: 0,
    sectorPoints: [], completedSectors: [], colorToggle: false, trail: []
  })

  const getA_SEMI = (w, h) => Math.min(w, h) * 0.28

  const solveKepler = (M, e) => {
    let E = M
    for (let i = 0; i < 15; i++) {
      E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    }
    return E
  }

  const resetSim = useCallback(() => {
    simRef.current = {
      timer: 0, sectorTimer: 0,
      sectorPoints: [], completedSectors: [], colorToggle: false, trail: []
    }
  }, [])
  useEffect(() => { resetSim() }, [eTarget, resetSim])

  useAnimationFrame((dt, absoluteTime) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = setupCanvas(ctx)

    drawBgStars(ctx, width, height, absoluteTime)

    const A_SEMI = getA_SEMI(width, height)
    const n = Math.sqrt(MU / (A_SEMI * A_SEMI * A_SEMI))
    const period = PI2 / n
    const sweepTime = period / 8

    let currentX = 0, currentY = 0, currentVx = 0, currentVy = 0
    const h_angular = Math.sqrt(MU * A_SEMI * (1 - eTarget * eTarget))

    if (isRunning) {
      const effDt = Math.min(0.02, dt)
      simRef.current.timer += effDt
      simRef.current.sectorTimer += effDt

      const { timer, sectorTimer } = simRef.current
      const M = (n * timer) % PI2
      const E = solveKepler(M, eTarget)

      const b = A_SEMI * Math.sqrt(1 - eTarget * eTarget)
      currentX = A_SEMI * (Math.cos(E) - eTarget)
      currentY = b * Math.sin(E)

      const Edot = n / (1 - eTarget * Math.cos(E))
      currentVx = -A_SEMI * Math.sin(E) * Edot
      currentVy = b * Math.cos(E) * Edot

      simRef.current.sectorPoints.push({ x: currentX, y: currentY })
      simRef.current.trail.push({ x: currentX, y: currentY })
      if (simRef.current.trail.length > 200) simRef.current.trail.shift()

      if (sectorTimer >= sweepTime) {
        simRef.current.completedSectors.push({
          points: [{ x: 0, y: 0 }, ...simRef.current.sectorPoints, { x: currentX, y: currentY }],
          area: 0.5 * h_angular * sweepTime,
          colorIdx: simRef.current.colorToggle ? 0 : 1
        })
        if (simRef.current.completedSectors.length > 8) simRef.current.completedSectors.shift()

        simRef.current.sectorPoints = [{ x: currentX, y: currentY }]
        simRef.current.sectorTimer = 0
        simRef.current.colorToggle = !simRef.current.colorToggle
      }

      if (absoluteTime * 1000 - lastUiUpdate.current > 80) {
        const rVal = Math.hypot(currentX, currentY)
        const vVal = Math.hypot(currentVx, currentVy)
        
        const ax = -MU * currentX / Math.pow(rVal, 3)
        const ay = -MU * currentY / Math.pow(rVal, 3)
        const a_tangent = (ax * currentVx + ay * currentVy) / (vVal || 1)
        const a_normal = Math.abs(ax * currentVy - ay * currentVx) / (vVal || 1)

        setTelemetry({
          r: rVal.toFixed(1), v: vVal.toFixed(2), h: h_angular.toFixed(0),
          a_t: a_tangent.toFixed(2), a_n: a_normal.toFixed(2),
          currentArea: (0.5 * h_angular * sectorTimer).toFixed(0),
          exactSectorArea: (0.5 * h_angular * sweepTime).toFixed(0)
        })
        lastUiUpdate.current = absoluteTime * 1000
      }
    }

    drawTextbookGrid(ctx, width, height, 1, 'px', { x: width / 2, y: height / 2 })

    ctx.save(); ctx.translate(width / 2, height / 2)
    const b = A_SEMI * Math.sqrt(1 - eTarget * eTarget)

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
    ctx.lineWidth = 1; ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(-A_SEMI * (1 + eTarget) - 20, 0); ctx.lineTo(A_SEMI * (1 - eTarget) + 20, 0); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(-A_SEMI * eTarget, -b - 15); ctx.lineTo(-A_SEMI * eTarget, b + 15); ctx.stroke()
    ctx.setLineDash([])

    ctx.beginPath()
    for (let theta = 0; theta <= PI2; theta += 0.03) {
      const ex = A_SEMI * (Math.cos(theta) - eTarget), ey = b * Math.sin(theta)
      if (theta === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey)
    }
    ctx.closePath()
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'; ctx.lineWidth = 1.5; ctx.stroke()

    simRef.current.completedSectors.forEach((sector) => {
      ctx.beginPath()
      sector.points.forEach((pt, idx) => { if (idx === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y) })
      ctx.closePath()
      ctx.fillStyle = sector.colorIdx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)'
      ctx.fill()
      ctx.strokeStyle = sector.colorIdx === 0 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.6)'
      ctx.lineWidth = 1.2; ctx.stroke()
    })

    const { sectorPoints } = simRef.current
    if (sectorPoints.length > 1) {
      ctx.beginPath(); ctx.moveTo(0, 0)
      sectorPoints.forEach((pt) => ctx.lineTo(pt.x, pt.y))
      ctx.lineTo(0, 0); ctx.closePath()
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)'; ctx.fill()
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5; ctx.stroke()
    }

    drawGlowingStar(ctx, 0, 0, 14, '#fef08a', '#f59e0b', absoluteTime)
    ctx.fillStyle = '#ffffff'; ctx.font = 'italic bold 13px "Times New Roman"'; ctx.fillText('F₁ (Sun)', 18, -12)

    const f2_x = -2 * A_SEMI * eTarget
    ctx.beginPath(); ctx.arc(f2_x, 0, 3.5, 0, PI2); ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.fill()
    ctx.fillText('F₂', f2_x - 14, -8)

    if (isRunning) {
      const vScale = 22
      drawTextbookVector(ctx, currentX, currentY, currentVx * vScale, currentVy * vScale, '#facc15', 'v', { lineWidth: 2 })

      if (showDecomposition) {
        const rLen = Math.hypot(currentX, currentY)
        const a_mag = (MU / (rLen * rLen)) * 0.4
        const a_ang = Math.atan2(-currentY, -currentX)
        const ax = Math.cos(a_ang) * a_mag, ay = Math.sin(a_ang) * a_mag
        drawTextbookVector(ctx, currentX, currentY, ax, ay, '#ef4444', 'a', { lineWidth: 1.8 })

        const vAng = Math.atan2(currentVy, currentVx)
        const at_mag = (ax * currentVx + ay * currentVy) / Math.hypot(currentVx, currentVy)
        const at_x = Math.cos(vAng) * at_mag, at_y = Math.sin(vAng) * at_mag
        drawTextbookVector(ctx, currentX, currentY, at_x, at_y, '#38bdf8', 'a_t', { lineWidth: 1.2, showBackdrop: false })

        const an_x = ax - at_x, an_y = ay - at_y
        drawTextbookVector(ctx, currentX, currentY, an_x, an_y, '#10b981', 'a_n', { lineWidth: 1.2, showBackdrop: false })
      }

      ctx.beginPath(); ctx.arc(currentX, currentY, 6, 0, PI2)
      ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 12; ctx.shadowColor = '#38bdf8'; ctx.fill(); ctx.shadowBlur = 0
    }
    ctx.restore()

    const potCanvas = potentialCanvasRef.current
    if (potCanvas) {
      const potCtx = potCanvas.getContext('2d')
      const { width: pw, height: ph } = setupPotCanvas(potCtx)
      potCtx.clearRect(0, 0, pw, ph)

      const padding = 28
      const graphW = pw - padding * 2, graphH = ph - padding * 2
      
      potCtx.strokeStyle = 'rgba(148, 163, 184, 0.2)'; potCtx.lineWidth = 1
      potCtx.beginPath()
      potCtx.moveTo(padding, padding); potCtx.lineTo(padding, ph - padding); potCtx.lineTo(pw - padding, ph - padding)
      potCtx.stroke()

      const rp = A_SEMI * (1 - eTarget), ra = A_SEMI * (1 + eTarget)
      const E_total = -MU / (2 * A_SEMI)

      potCtx.beginPath()
      potCtx.strokeStyle = '#38bdf8'; potCtx.lineWidth = 1.8
      for (let px = 5; px < graphW; px += 2) {
        const r_val = (px / graphW) * (ra * 1.4) + 20
        const V_eff = -MU / r_val + (h_angular * h_angular) / (2 * r_val * r_val)
        const py = ph - padding - ((V_eff - (E_total * 2.5)) / (-E_total * 3)) * graphH
        if (px === 5) potCtx.moveTo(padding + px, Math.max(padding, Math.min(ph - padding, py)))
        else potCtx.lineTo(padding + px, Math.max(padding, Math.min(ph - padding, py)))
      }
      potCtx.stroke()

      const eY = ph - padding - ((E_total - (E_total * 2.5)) / (-E_total * 3)) * graphH
      potCtx.strokeStyle = '#facc15'; potCtx.lineWidth = 1.2; potCtx.setLineDash([4, 4])
      potCtx.beginPath(); potCtx.moveTo(padding, eY); potCtx.lineTo(pw - padding, eY); potCtx.stroke(); potCtx.setLineDash([])

      const currR = Math.hypot(currentX, currentY)
      const currPX = padding + ((currR - 20) / (ra * 1.4)) * graphW
      potCtx.beginPath(); potCtx.arc(currPX, eY, 4, 0, PI2); potCtx.fillStyle = '#ffffff'; potCtx.fill()

      potCtx.fillStyle = '#94a3b8'; potCtx.font = '10px monospace'
      potCtx.fillText('V_eff(r)', padding + 6, padding + 12)
    }
  })

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-slate-100">
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-black h-[520px] lg:h-[660px] shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute top-4 right-4 w-[280px] h-[160px] bg-slate-950/85 border border-slate-800 rounded-xl p-2.5 hidden sm:block">
          <div className="text-[11px] font-bold text-slate-400 mb-1 flex justify-between">
            <span>有效势能井 V_eff(r)</span>
            <span className="text-amber-400 font-mono">E = const</span>
          </div>
          <canvas ref={potentialCanvasRef} className="w-full h-[120px] block" />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
        <GlassPanel className="flex-1 flex flex-col justify-center p-6 font-mono">
          <h3 className="text-slate-300 font-bold text-sm tracking-wider border-b border-slate-700/60 pb-3 mb-5">
            ◆ 理论力学动力学参量分解 (Kepler Area Law & Mechanics)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-700/50">
              <div className="text-slate-400 text-xs font-bold mb-3 uppercase tracking-wider">矢量动力学分解 (Frenet-Serret)</div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">向径模长 r:</span><span className="text-white font-bold">{telemetry.r} px</span></div>
                <div className="flex justify-between"><span className="text-slate-400">瞬时速度 v:</span><span className="text-amber-400 font-bold">{telemetry.v} px/s</span></div>
                <div className="flex justify-between"><span className="text-slate-400">切向加速度 a_t:</span><span className="text-sky-400 font-bold">{telemetry.a_t}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">法向加速度 a_n:</span><span className="text-emerald-400 font-bold">{telemetry.a_n}</span></div>
                <div className="flex justify-between border-t border-slate-700/50 pt-2"><span className="text-slate-400">比角动量 h = |r×v|:</span><span className="text-emerald-400 font-bold">{telemetry.h} (严格守恒)</span></div>
              </div>
            </div>

            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-700/50">
              <div className="text-emerald-400 text-xs font-bold mb-3 uppercase tracking-wider">等时面积元积分量 (dA/dt = h/2)</div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">当前扇区累积面积:</span><span className="text-cyan-300 font-bold">{telemetry.currentArea} px²</span></div>
                <div className="flex justify-between"><span className="text-slate-400">单周期 1/8 理论面积:</span><span className="text-amber-400 font-bold">{telemetry.exactSectorArea} px²</span></div>
                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800 mt-3 leading-relaxed">
                  大学力学推论：由于中心引力始终沿径向，对力心力矩为零，角动量守恒导出面积速度恒定。
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="w-full xl:w-[350px] shrink-0 flex flex-col justify-center p-6 font-mono">
          <h3 className="text-slate-300 font-bold text-sm tracking-wider border-b border-slate-700/60 pb-3 mb-5">轨道形态控制</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-2">
                <span>偏心率 e (Eccentricity)</span>
                <span className="text-sky-400 font-bold">{eTarget.toFixed(2)}</span>
              </div>
              <input type="range" min="0.05" max="0.85" step="0.01" value={eTarget} onChange={(e) => setETarget(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-sky-500 cursor-pointer" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsRunning(!isRunning)} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${isRunning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-600 text-white'}`}>
                {isRunning ? '⏸ 暂停' : '▶ 继续'}
              </button>
              <button onClick={() => setShowDecomposition(!showDecomposition)} className={`px-4 py-3 text-xs font-bold rounded-xl border transition-colors ${showDecomposition ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-700/50 text-slate-500'}`}>
                矢量分解
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

/* =========================================================================
   模块 3：双星系统动力学（质心坐标系、洛希等位势线及动力矩平衡）
   ========================================================================= */
const BinaryStar = () => {
  const canvasRef = useRef(null)
  const [m1, setM1] = useState(70)
  const [m2, setM2] = useState(35)
  const [showPotentialContours, setShowPotentialContours] = useState(true)
  const setupCanvas = useRetinaCanvas(canvasRef)
  const drawBgStars = useStarfield(180)
  const simRef = useRef({ time: 0, L: 340 })
  const G = 6000

  const initData = useCallback(() => {
    const totalMass = m1 + m2, L = 340
    const r1 = (L * m2) / totalMass, r2 = (L * m1) / totalMass
    const omega = Math.sqrt(G * totalMass / Math.pow(L, 3))
    return { totalMass, L, r1, r2, omega }
  }, [m1, m2])

  useAnimationFrame((dt, absTime) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = setupCanvas(ctx)
    const { L, r1, r2, omega, totalMass } = initData()

    drawBgStars(ctx, width, height, absTime)

    simRef.current.time += dt * 0.4
    const angle = omega * simRef.current.time

    const p1 = { x: r1 * Math.cos(angle), y: r1 * Math.sin(angle) }
    const p2 = { x: -r2 * Math.cos(angle), y: -r2 * Math.sin(angle) }

    drawTextbookGrid(ctx, width, height, 1, 'AU', { x: width / 2, y: height / 2 })

    ctx.save(); ctx.translate(width / 2, height / 2)

    if (showPotentialContours) {
      ctx.save(); ctx.rotate(angle)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)'; ctx.lineWidth = 1
      for (let c of [1.6, 2.0, 2.5, 3.2]) {
        ctx.beginPath()
        for (let th = 0; th <= PI2; th += 0.05) {
          const rx = Math.cos(th) * (L * 0.6 * c)
          const ry = Math.sin(th) * (L * 0.45 * c)
          if (th === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry)
        }
        ctx.stroke()
      }
      const l1_x = r1 - L * (m2 / (3 * totalMass)) ** (1 / 3) * (r1 > r2 ? -1 : 1)
      ctx.beginPath(); ctx.arc(l1_x, 0, 3, 0, PI2); ctx.fillStyle = '#facc15'; ctx.fill()
      ctx.font = '10px monospace'; ctx.fillText('L₁', l1_x - 5, -8)
      ctx.restore()
    }

    ctx.beginPath(); ctx.arc(0, 0, r1, 0, PI2); ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke()
    ctx.beginPath(); ctx.arc(0, 0, r2, 0, PI2); ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)'; ctx.stroke(); ctx.setLineDash([])

    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 1.2; ctx.stroke()

    ctx.beginPath(); ctx.arc(0, 0, 5, 0, PI2); ctx.fillStyle = '#facc15'; ctx.fill()
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px "Times New Roman"'; ctx.fillText('C.M. (质心)', 10, 16)

    const R1 = Math.max(12, 14 + m1 / 7)
    const R2 = Math.max(10, 12 + m2 / 7)
    drawGlowingStar(ctx, p1.x, p1.y, R1, '#fca5a5', '#ef4444', absTime)
    drawGlowingStar(ctx, p2.x, p2.y, R2, '#bfdbfe', '#3b82f6', absTime + 1.5)

    const vScale = 15
    drawTextbookVector(ctx, p1.x, p1.y, -Math.sin(angle) * omega * r1 * vScale, Math.cos(angle) * omega * r1 * vScale, '#10b981', 'v₁')
    drawTextbookVector(ctx, p2.x, p2.y, Math.sin(angle) * omega * r2 * vScale, -Math.cos(angle) * omega * r2 * vScale, '#10b981', 'v₂')

    const forceLen = 45
    const fAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
    drawTextbookVector(ctx, p1.x, p1.y, Math.cos(fAngle) * forceLen, Math.sin(fAngle) * forceLen, '#facc15', 'F₁₂')
    drawTextbookVector(ctx, p2.x, p2.y, -Math.cos(fAngle) * forceLen, -Math.sin(fAngle) * forceLen, '#facc15', 'F₂₁')

    ctx.restore()
  })

  const { r1, r2, omega } = initData()

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-slate-100">
      <div className="relative w-full bg-black rounded-2xl overflow-hidden border border-slate-700/60 h-[520px] lg:h-[660px] shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
        <GlassPanel className="flex-1 flex flex-col justify-center p-6 font-mono">
          <h3 className="text-slate-300 font-bold text-sm tracking-wider border-b border-slate-700/60 pb-3 mb-5">
            双星系统：引力杠杆与开普勒第三定律修正
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900/40 p-5 rounded-xl border border-red-900/40">
              <div className="flex justify-between items-center mb-3">
                <span className="text-red-400 font-bold text-xs">🔴 主星动量矩 (m₁·r₁)</span>
                <span className="font-bold text-xl text-red-200">{(m1 * r1).toFixed(0)}</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div>质量: {m1} M☉ | 轨道半径: {r1.toFixed(1)} AU</div>
                <div>线速度 v₁: {(omega * r1).toFixed(2)} km/s</div>
              </div>
            </div>

            <div className="bg-slate-900/40 p-5 rounded-xl border border-blue-900/40">
              <div className="flex justify-between items-center mb-3">
                <span className="text-blue-400 font-bold text-xs">🔵 伴星动量矩 (m₂·r₂)</span>
                <span className="font-bold text-xl text-blue-200">{(m2 * r2).toFixed(0)}</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div>质量: {m2} M☉ | 轨道半径: {r2.toFixed(1)} AU</div>
                <div>线速度 v₂: {(omega * r2).toFixed(2)} km/s</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-4 bg-slate-950/60 p-3 rounded border border-slate-800">
            开三修正公式: T² = 4π²L³ / [G(m₁+m₂)]，两星角速度 ω 完全相同，向心力源于彼此间的相互万有引力 (牛顿第三定律)。
          </div>
        </GlassPanel>

        <GlassPanel className="w-full xl:w-[360px] shrink-0 flex flex-col justify-center p-6 font-mono">
          <h3 className="text-slate-300 font-bold text-sm tracking-wider border-b border-slate-700/60 pb-3 mb-5">恒星质量调节</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs text-red-400 mb-2 font-bold">
                <span>主星质量 m₁</span><span>{m1} M☉</span>
              </div>
              <input type="range" min="15" max="120" value={m1} onChange={(e) => setM1(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-red-500 cursor-pointer" />
            </div>

            <div>
              <div className="flex justify-between text-xs text-blue-400 mb-2 font-bold">
                <span>伴星质量 m₂</span><span>{m2} M☉</span>
              </div>
              <input type="range" min="15" max="120" value={m2} onChange={(e) => setM2(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer" />
            </div>

            <button onClick={() => setShowPotentialContours(!showPotentialContours)} className={`w-full py-3 text-xs font-bold rounded-xl border transition-colors ${showPotentialContours ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-700/50 text-slate-500'}`}>
              Roche 等位线 / L₁ 点切换
            </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

/* =========================================================================
   模块 4：三大轨道动力学辨析（近地 / 同步 / 地面三者向心力本质辨析）
   ========================================================================= */
const SatelliteComparison = () => {
  const canvasRef = useRef(null)
  const simTimeRef = useRef(0)
  const [simSpeed, setSimSpeed] = useState(1)
  const setupCanvas = useRetinaCanvas(canvasRef)
  const drawBgStars = useStarfield(180)

  const R_earth = 85, R_near = R_earth + 35, R_sync = R_earth * 3.0
  const w_earth = 0.35, GM = w_earth * w_earth * Math.pow(R_sync, 3)
  const w_near = Math.sqrt(GM / Math.pow(R_near, 3))

  const drawSatellite = (ctx, x, y, angle, color) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle)
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'; ctx.fillRect(-5, -15, 10, 12); ctx.fillRect(-5, 3, 10, 12)
    ctx.strokeStyle = '#94a3b8'; ctx.strokeRect(-5, -15, 10, 12); ctx.strokeRect(-5, 3, 10, 12)
    ctx.fillStyle = color; ctx.fillRect(-8, -4, 16, 8); ctx.strokeRect(-8, -4, 16, 8)
    ctx.restore()
  }

  useAnimationFrame((dt, absTime) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = setupCanvas(ctx)
    const t = (simTimeRef.current += dt * simSpeed)

    drawBgStars(ctx, width, height, absTime)

    const angleEarth = w_earth * t, angleNear = w_near * t
    const v_eq = w_earth * R_earth, v_sync = w_earth * R_sync, v_near = w_near * R_near

    drawTextbookGrid(ctx, width, height, 1, 'km', { x: width / 2, y: height / 2 })

    ctx.save(); ctx.translate(width / 2, height / 2)

    ctx.beginPath(); ctx.arc(0, 0, R_near, 0, PI2); ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke()
    ctx.beginPath(); ctx.arc(0, 0, R_sync, 0, PI2); ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'; ctx.stroke(); ctx.setLineDash([])

    drawDetailedEarth(ctx, R_earth, angleEarth, Math.atan2(Math.sin(angleEarth), Math.cos(angleEarth)))

    const absEqX = R_earth * Math.cos(angleEarth), absEqY = R_earth * Math.sin(angleEarth)
    ctx.beginPath(); ctx.arc(absEqX, absEqY, 5, 0, PI2); ctx.fillStyle = '#ef4444'; ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px "Times New Roman"'; ctx.fillText('A (赤道表面)', absEqX + 8, absEqY + 4)

    const syncX = R_sync * Math.cos(angleEarth), syncY = R_sync * Math.sin(angleEarth)
    drawSatellite(ctx, syncX, syncY, angleEarth, '#facc15')
    ctx.fillText('B (地球同步)', syncX + 12, syncY + 4)

    const nearX = R_near * Math.cos(angleNear), nearY = R_near * Math.sin(angleNear)
    drawSatellite(ctx, nearX, nearY, angleNear, '#10b981')
    ctx.fillText('C (近地环绕)', nearX + 12, nearY + 4)

    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(syncX, syncY)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)'; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([])

    const vScale = 1.2
    drawTextbookVector(ctx, absEqX, absEqY, -Math.sin(angleEarth) * v_eq * vScale, Math.cos(angleEarth) * v_eq * vScale, '#ef4444', 'v_A')
    drawTextbookVector(ctx, syncX, syncY, -Math.sin(angleEarth) * v_sync * vScale, Math.cos(angleEarth) * v_sync * vScale, '#facc15', 'v_B')
    drawTextbookVector(ctx, nearX, nearY, -Math.sin(angleNear) * v_near * vScale, Math.cos(angleNear) * v_near * vScale, '#10b981', 'v_C')

    ctx.restore()
  })

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-slate-100">
      <div className="relative w-full bg-black rounded-2xl overflow-hidden h-[520px] lg:h-[660px] shadow-2xl border border-slate-700/60">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
          <GlassPanel className="p-5 border-t-4 border-t-emerald-500">
            <div className="font-bold text-emerald-400 mb-3 text-sm flex justify-between">
              <span>C: 近地卫星 (Near-Earth)</span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div>向心力源: <span className="text-white font-bold">100% 万有引力</span></div>
              <div>线速度关系: <span className="text-emerald-400 font-bold">v_C &gt; v_B &gt; v_A</span></div>
              <div>角速度关系: <span className="text-emerald-400 font-bold">ω_C &gt; ω_B = ω_A</span></div>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">速度第一宇宙速度上限 (7.9 km/s)</div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5 border-t-4 border-t-amber-500">
            <div className="font-bold text-amber-400 mb-3 text-sm flex justify-between">
              <span>B: 同步卫星 (Geostationary)</span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div>向心力源: <span className="text-white font-bold">100% 万有引力</span></div>
              <div>周期: <span className="text-amber-400 font-bold">T_B = 24h (相对静止)</span></div>
              <div>向心加速度: <span className="text-amber-400 font-bold">a_n = GM/r²</span></div>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">定点赤道上空约 36000 km</div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5 border-t-4 border-t-red-500">
            <div className="font-bold text-red-400 mb-3 text-sm flex justify-between">
              <span>A: 赤道表面物体 (Surface)</span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div>向心力源: <span className="text-red-400 font-bold">引力与支持力合力</span></div>
              <div>约束条件: <span className="text-slate-100 font-bold">随地球自转刚体同轴</span></div>
              <div>向心加速度: <span className="text-red-400 font-bold">a_A = ω²R &lt; a_B</span></div>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">非天体自由环绕运动</div>
            </div>
          </GlassPanel>
        </div>

        <GlassPanel className="w-full xl:w-[280px] shrink-0 flex flex-col justify-center font-mono p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/60 pb-3 mb-4">演示调控</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">运行倍速:</span>
              <span className="text-blue-400 font-bold">{simSpeed.toFixed(1)}x</span>
            </div>
            <input type="range" min="0.2" max="2.5" step="0.1" value={simSpeed} onChange={(e) => setSimSpeed(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer" />
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

/* =========================================================================
   主控室容器
   ========================================================================= */
export default function TianTiYunDongSimulation() {
  const [activeTab, setActiveTab] = useState(0)
  const tabs = [
    { name: '牛顿大炮与逃逸动力学', component: <NewtonCannon /> },
    { name: '开普勒面积定律与有效势', component: <KeplerArea /> },
    { name: '双星系统与引力杠杆', component: <BinaryStar /> },
    { name: '三大轨道向心动力学辨析', component: <SatelliteComparison /> },
  ]

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#02040a] min-h-screen rounded-2xl shadow-2xl font-sans text-slate-100 selection:bg-blue-600/50 overflow-hidden border border-slate-800">
      <div className="relative mb-8 pb-6 border-b border-slate-800/80 text-center">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-300">
          天体力学与轨道动力学教材仿真系统 2.0
        </h1>
        <p className="text-slate-400 mt-2 text-xs md:text-sm font-mono">
          Rigorous Orbital Mechanics & Cinematic Deep Space Visualization
        </p>
      </div>

      <div className="flex justify-center gap-2 md:gap-4 mb-8 flex-wrap">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-5 py-3 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 border ${
              activeTab === idx
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-105'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="w-full">{tabs[activeTab].component}</div>
    </div>
  )
}