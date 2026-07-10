 "use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

// --- Constants & Config ---
const LOGICAL_WIDTH = 750;
const LOGICAL_HEIGHT = 450;
const BASE_SCALE = 15;
const G = 9.8;
const UI_UPDATE_INTERVAL_MS = 50; // 降低 UI 更新频率至 50ms (20fps) 足以满足文本显示，减少重绘压力

// Colors
const COLORS = {
  bg: "#101626",
  axis: "#7dd3fc",
  fieldX: "rgba(56,189,248,0.20)",
  trajHighlight: "#f87171",
  trajBase: "rgba(248,113,113,0.45)",
  circle: "rgba(187, 186, 220, 0.37)",
  particle: "#ef4444",
  vecD: "#4ade80",
  vecR: "#a21caf",
  vecTot: "#eab308",
  textMuted: "#a5b4fc",
  textHighlight: "#bae6fd"
};

// --- Pure Physics & Math Functions ---
function calcPhysics(m, q, B, v0) {
  const vd = (m * G) / (q * B);
  const omega = (q * B) / m;
  const R = (vd - v0) / omega;
  const period = (2 * Math.PI) / omega;
  return { vd, omega, R, period };
}

function getSpeedAtTime({ vd, omega, R }, t) {
  const vx = vd - R * omega * Math.cos(omega * t);
  const vy = R * omega * Math.sin(omega * t);
  return Math.hypot(vx, vy);
}

function sampleTrajPoints(vd, R, omega, period, tMax = 1.9 * period) {
  const dt = Math.max(0.008, period / 240);
  const pts = [];
  for (let t = 0; t <= tMax + 1e-9; t += dt) {
    pts.push({
      t,
      x: vd * t - R * Math.sin(omega * t),
      y: R * (1 - Math.cos(omega * t)),
    });
  }
  return pts;
}

function calcBoundingFromPoints(points) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX: isFinite(minX) ? minX : 0,
    maxX: isFinite(maxX) ? maxX : 0,
    minY: isFinite(minY) ? minY : 0,
    maxY: isFinite(maxY) ? maxY : 0,
    centerX: isFinite(minX) ? (minX + maxX) / 2 : 0,
    centerY: isFinite(minY) ? (minY + maxY) / 2 : 0,
    spreadX: Math.max(1e-6, isFinite(maxX) ? maxX - minX : 1),
    spreadY: Math.max(1e-6, isFinite(maxY) ? maxY - minY : 1),
  };
}

// --- Canvas Drawing Helpers ---
function drawArrow(ctx, fromX, fromY, vx, vy, color, label) {
  const scale = 4;
  const tox = fromX + vx * scale;
  const toy = fromY + vy * scale;
  const len = Math.hypot(vx, vy) * scale;
  
  if (len < 3) return;
  
  const angle = Math.atan2(vy, vx);
  
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(tox, toy);
  ctx.lineTo(tox - 11 * Math.cos(angle - Math.PI / 7), toy - 11 * Math.sin(angle - Math.PI / 7));
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox - 11 * Math.cos(angle + Math.PI / 7), toy - 11 * Math.sin(angle + Math.PI / 7));
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.1;
  ctx.shadowColor = "#fff8";
  ctx.shadowBlur = 1.5;
  ctx.stroke();
  
  ctx.font = `bold 15px monospace`;
  ctx.shadowColor = "transparent";
  ctx.fillStyle = color;
  ctx.fillText(label, tox + 11 * Math.cos(angle) - 10, toy + 11 * Math.sin(angle) + 7);
  ctx.restore();
}

function drawMagneticFieldX(ctx) {
  ctx.save();
  ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
  ctx.strokeStyle = COLORS.fieldX;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = -LOGICAL_WIDTH / 2; i < LOGICAL_WIDTH / 2; i += 40) {
    for (let j = -LOGICAL_HEIGHT / 2; j < LOGICAL_HEIGHT / 2; j += 40) {
      const cx = Math.floor(i) + 0.5;
      const cy = Math.floor(j) + 0.5;
      ctx.moveTo(cx - 7, cy - 7);
      ctx.lineTo(cx + 7, cy + 7);
      ctx.moveTo(cx + 7, cy - 7);
      ctx.lineTo(cx - 7, cy + 7);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawMainAxes(ctx, scale, bounding) {
  ctx.save();
  ctx.strokeStyle = COLORS.axis;
  ctx.fillStyle = COLORS.axis;
  ctx.lineWidth = 2.1;
  ctx.font = `bold 17px sans-serif`;

  // X Axis
  const rightX = bounding.maxX * scale + 30;
  ctx.beginPath();
  ctx.moveTo(bounding.minX * scale - 30, 0);
  ctx.lineTo(rightX, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rightX, 0);
  ctx.lineTo(rightX - 11, -9);
  ctx.lineTo(rightX - 11, 9);
  ctx.fill();
  ctx.fillText("x", rightX - 19, -13);

  // Y Axis
  const bottomY = bounding.maxY * scale + 35;
  ctx.beginPath();
  ctx.moveTo(0, bounding.minY * scale - 28);
  ctx.lineTo(0, bottomY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, bottomY);
  ctx.lineTo(-9, bottomY - 22);
  ctx.lineTo(9, bottomY - 22);
  ctx.fill();
  ctx.fillText("y", 8, bottomY - 10);
  
  ctx.restore();
}

// --- Main Component ---
const PeiSuFaSimulation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const lastTimeRef = useRef(performance.now());
  const lastUiUpdateRef = useRef(performance.now());

  // Params
  const [v0, setV0] = useState(0);
  const [m, setM] = useState(1);
  const [q, setQ] = useState(1);
  const [B, setB] = useState(1);
  
  // UI Force Update Trigger (to sync button state)
  const [, setTick] = useState(0);

  // UI state for telemetry
  const [uiState, setUiState] = useState({
    time: 0, speed: 0, motionType: "", vMaxFormula: "", vMinFormula: ""
  });

  // Physics Memos
  const physics = useMemo(() => calcPhysics(m, q, B, v0), [m, q, B, v0]);
  const { vd, omega, R, period } = physics;

  const fullPoints = useMemo(() => sampleTrajPoints(vd, R, omega, period, 1.9 * period), [vd, R, omega, period]);
  const bounding = useMemo(() => calcBoundingFromPoints(fullPoints), [fullPoints]);

  const fitScale = useMemo(() => {
    const sx = (LOGICAL_WIDTH * 0.78) / bounding.spreadX;
    const sy = (LOGICAL_HEIGHT * 0.75) / bounding.spreadY;
    return Math.min(BASE_SCALE, sx, sy, 90);
  }, [bounding]);

  // Actions
  const togglePlay = useCallback(() => {
    isPlayingRef.current = !isPlayingRef.current;
    lastTimeRef.current = performance.now(); // Prevent large jumps after pausing
    setTick(t => t + 1);
  }, []);

  const reset = useCallback(() => {
    isPlayingRef.current = false;
    timeRef.current = 0;
    setUiState(prev => ({ ...prev, time: 0, speed: Math.abs(v0) }));
    setTick(t => t + 1);
  }, [v0]);

  // Setup Canvas Resolution (Runs only on mount or resize)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = LOGICAL_WIDTH * dpr;
    canvas.height = LOGICAL_HEIGHT * dpr;
    canvas.style.width = `${LOGICAL_WIDTH}px`;
    canvas.style.height = `${LOGICAL_HEIGHT}px`;
    ctx.scale(dpr, dpr);
  }, []);

  // Main Draw Function
  const draw = useCallback((ctx, t) => {
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    drawMagneticFieldX(ctx);

    ctx.save();
    ctx.translate(
      LOGICAL_WIDTH / 2 - bounding.centerX * fitScale,
      LOGICAL_HEIGHT / 2 - bounding.centerY * fitScale
    );

    drawMainAxes(ctx, fitScale, bounding);

    // 1) Full base path
    if (fullPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(fullPoints[0].x * fitScale, fullPoints[0].y * fitScale);
      for (let i = 1; i < fullPoints.length; i++) {
        ctx.lineTo(fullPoints[i].x * fitScale, fullPoints[i].y * fitScale);
      }
      ctx.strokeStyle = COLORS.trajBase;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    // 2) Traveled path
    const tMax = fullPoints.length ? fullPoints[fullPoints.length - 1].t : 0;
    const tClip = Math.min(t, tMax);
    
    if (tClip > 0 && fullPoints.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(fullPoints[0].x * fitScale, fullPoints[0].y * fitScale);
      for (let i = 1; i < fullPoints.length; i++) {
        if (fullPoints[i].t > tClip) break;
        ctx.lineTo(fullPoints[i].x * fitScale, fullPoints[i].y * fitScale);
      }
      ctx.strokeStyle = COLORS.trajHighlight;
      ctx.lineWidth = 3.0;
      ctx.shadowColor = "#ef444440";
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.restore();
    }

    // Kinematics calculations
    const physCx = vd * t, physCy = R;
    const cx = physCx * fitScale, cy = physCy * fitScale;
    const pixelR = Math.abs(R * fitScale);
    
    const currentX = (physCx - R * Math.sin(omega * t)) * fitScale;
    const currentY = (physCy - R * Math.cos(omega * t)) * fitScale;

    // Reference circle
    if (pixelR > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, pixelR, 0, 2 * Math.PI);
      ctx.setLineDash([7, 7]);
      ctx.strokeStyle = COLORS.circle;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.restore();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2.6, 0, 2 * Math.PI);
    ctx.fillStyle = COLORS.circle;
    ctx.fill();

    // Connecting line (Radius)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Particle
    ctx.save();
    ctx.beginPath();
    ctx.arc(currentX, currentY, 7.6, 0, 2 * Math.PI);
    ctx.fillStyle = COLORS.particle;
    ctx.shadowColor = "#fb7185b4";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Velocity vectors
    const vRotX = -R * omega * Math.cos(omega * t);
    const vRotY = R * omega * Math.sin(omega * t);
    drawArrow(ctx, currentX, currentY, vd, 0, COLORS.vecD, "v_d");
    drawArrow(ctx, currentX, currentY, vRotX, vRotY, COLORS.vecR, "v_r");
    drawArrow(ctx, currentX, currentY, vd + vRotX, vRotY, COLORS.vecTot, "v");

    ctx.restore();
  }, [vd, omega, R, fitScale, bounding, fullPoints]);

  // Update Telemetry UI Text
  const updateUITelemetry = useCallback((now, t) => {
    if (now - lastUiUpdateRef.current < UI_UPDATE_INTERVAL_MS) return;
    
    const speed = getSpeedAtTime(physics, t);
    const strVd = vd.toFixed(2);
    const strV0 = Math.abs(v0).toFixed(2);
    let motionType = "", vMaxFormula = "", vMinFormula = "";

    if (v0 === 0) {
      motionType = "标准摆线 (v₀ = 0)";
      vMaxFormula = `vₘₐₓ = 2v_d = ${(2 * vd).toFixed(2)} m/s`;
      vMinFormula = "vₘᵢₙ = 0 m/s";
    } else if (Math.abs(v0 - vd) < 1e-12) {
      motionType = "匀速直线 (v₀ = v_d)";
      vMaxFormula = `vₘₐₓ = v_d = ${strVd} m/s`;
      vMinFormula = `vₘᵢₙ = v_d = ${strVd} m/s`;
    } else if (v0 > vd) {
      motionType = "长幅摆线 (v₀ > v_d)";
      vMaxFormula = `vₘₐₓ = v₀ = ${strV0} m/s`;
      vMinFormula = `vₘᵢₙ = v₀ - 2v_d = ${(v0 - 2 * vd).toFixed(2)} m/s`;
    } else if (v0 > 0) {
      motionType = "短幅摆线 (0 < v₀ < v_d)";
      vMaxFormula = `vₘₐₓ = 2v_d - v₀ = ${(2 * vd - v0).toFixed(2)} m/s`;
      vMinFormula = `vₘᵢₙ = v₀ = ${strV0} m/s`;
    } else {
      motionType = "次摆线 (v₀ < 0)";
      vMaxFormula = `vₘₐₓ = 2v_d + |v₀| = ${(2 * vd + Math.abs(v0)).toFixed(2)} m/s`;
      vMinFormula = `vₘᵢₙ = |v₀| = ${strV0} m/s`;
    }

    setUiState({ time: t, speed, motionType, vMaxFormula, vMinFormula });
    lastUiUpdateRef.current = now;
  }, [physics, vd, v0]);

  // Animation Loop
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    const animate = (now) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (isPlayingRef.current) {
        timeRef.current += dt;
        
        // Loop condition (Reset safely)
        const xPix = (vd * timeRef.current - R * Math.sin(omega * timeRef.current) - bounding.minX) * fitScale;
        if (xPix > LOGICAL_WIDTH * 0.99) timeRef.current = 0;
      }

      draw(ctx, timeRef.current);
      
      if (isPlayingRef.current) {
        updateUITelemetry(now, timeRef.current);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw, updateUITelemetry, vd, R, omega, bounding.minX, fitScale]);

  // Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "r") {
        reset();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, reset]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💠 配速法磁场摆线仿真</h2>

      <canvas ref={canvasRef} style={styles.canvas} />

      <div style={styles.infoPanel}>
        <div style={styles.motionType}>{uiState.motionType}</div>
        <div style={styles.dataGrid}>
          <div>t: <span>{uiState.time.toFixed(2)} s</span></div>
          <div>T: <span>{period.toFixed(3)} s</span></div>
          <div style={{ gridColumn: 'span 2' }}>
            v: <b>{uiState.speed.toFixed(3)} m/s</b>
          </div>
        </div>
        <div style={styles.formulaText}>
          公式：<b>v_d = mg⁄qB，T = 2πm⁄qB</b> | g = 9.8 m/s² <br/>
          极值: {uiState.vMaxFormula}；{uiState.vMinFormula}
        </div>
      </div>

      <div style={styles.controlsLayout}>
        <div style={styles.slidersCard}>
          {[
            { label: '初速 v₀', value: v0, setter: setV0, min: -20, max: 30, step: 1, unit: 'm/s', color: "#38bdf8" },
            { label: '质量 m', value: m, setter: setM, min: 0.5, max: 3.0, step: 0.1, unit: 'kg', color: "#2dd4bf" },
            { label: '电荷 q', value: q, setter: setQ, min: 0.5, max: 3.0, step: 0.1, unit: 'C', color: "#eab308" },
            { label: '磁场 B', value: B, setter: setB, min: 0.5, max: 3.0, step: 0.1, unit: 'T', color: "#818cf8" },
          ].map((item, idx) => (
            <div key={idx} style={styles.sliderRow}>
              <label style={{ ...styles.sliderLabel, color: item.color }}>
                {item.label}: <span>{Number(item.value).toFixed(2)} {item.unit}</span>
              </label>
              <input type="range" min={item.min} max={item.max} step={item.step} value={item.value}
                onChange={e => { item.setter(Number(e.target.value)); reset(); }}
                style={{ ...styles.rangeInput, accentColor: item.color }} />
              <input type="number" min={item.min} max={item.max} step={item.step} value={item.value}
                onChange={e => { item.setter(Number(e.target.value)); reset(); }}
                style={{ ...styles.numberInput, color: item.color }} />
            </div>
          ))}
        </div>

        <div style={styles.buttonsPanel}>
          <button onClick={togglePlay} style={{ ...styles.btnBase, backgroundColor: isPlayingRef.current ? '#eab308' : '#10b981' }}>
            {isPlayingRef.current ? '⏸ 暂停' : '▶ 启动'}
          </button>
          
          <button onClick={reset} disabled={isPlayingRef.current}
            style={{ ...styles.btnBase, backgroundColor: '#334155', cursor: isPlayingRef.current ? 'not-allowed' : 'pointer' }}>
            🔄 复原
          </button>

          <div style={styles.legendCard}>
            <div><span style={{ color: COLORS.vecD }}>■</span> <strong>v_d</strong>: 配速(重力抵消)</div>
            <div><span style={{ color: COLORS.vecR }}>■</span> <strong>v_r</strong>: 旋转分量</div>
            <div><span style={{ color: COLORS.vecTot }}>■</span> <strong>v</strong>  : 合速度</div>
            <div style={styles.shortcutText}>快捷键: Space 播放/暂停, R 复原</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Styles Object ---
const styles = {
  container: { fontFamily: 'sans-serif', maxWidth: 920, margin: '0 auto', padding: 24, borderRadius: 16, background: COLORS.bg, color: '#e0f2ff', boxShadow: '0 8px 30px #0a213065' },
  title: { textAlign: 'center', color: '#7dd3fc', marginBottom: 12, letterSpacing: 1.5, fontSize: 25, fontWeight: "bold" },
  canvas: { background: COLORS.bg, border: '2px solid #334155', borderRadius: 9, display: 'block', margin: '0 auto', boxShadow: '0 3px 12px #062235bf' },
  infoPanel: { marginTop: 16, padding: 16, borderRadius: 8, background: '#0f1e31c7', borderLeft: '4px solid #818cf8', color: "#e0e7ef", fontSize: 16, boxShadow: '0 1px 4.5px #316b901c' },
  motionType: { color: '#facc15', fontWeight: 700, marginBottom: 8 },
  dataGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: 15, color: '#bae6fd' },
  formulaText: { marginTop: 10, color: "#a5b4fc", letterSpacing: 1.1, fontSize: 14, lineHeight: 1.5 },
  controlsLayout: { marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 },
  slidersCard: { display: 'flex', flexDirection: 'column', gap: 16, background: '#23293ab4', padding: 20, borderRadius: 8, borderLeft: '3.5px solid #67e8f9', boxShadow: '0 1px 4px #0a223bcc' },
  sliderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sliderLabel: { fontWeight: 'bold', fontFamily: 'monospace', flex: 1, '& span': { color: '#f9fafb', fontFamily: 'sans-serif', fontWeight: 600 } },
  rangeInput: { width: 120, background: '#334155', borderRadius: 5 },
  numberInput: { width: 60, marginLeft: 8, background: '#1e293b', border: '1.5px solid #64748b', borderRadius: 6, fontFamily: 'monospace', fontSize: 15, fontWeight: 600, textAlign: 'center', padding: 2 },
  buttonsPanel: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 },
  btnBase: { padding: '13px 0', color: 'white', border: 'none', borderRadius: 7, fontSize: 18, fontWeight: 'bold', transition: 'background 0.3s' },
  legendCard: { padding: 12, border: '1px solid #334155', borderRadius: 7, fontSize: 14, background: '#181e2b', color: '#a5b4fc', display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'monospace' },
  shortcutText: { color: '#64748b', fontSize: 12, marginTop: 4 }
};

export default PeiSuFaSimulation;