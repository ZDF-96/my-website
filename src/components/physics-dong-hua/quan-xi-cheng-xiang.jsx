"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

/**
 * 全息成像交互式物理仿真（大学教材定稿级 · 画质优化版）
 */

export default function QuanXiChengXiangSim() {
  const [stage, setStage] = useState("reconstruct");
  const [reconMode, setReconMode] = useState("original");

  const [thetaR, setThetaR] = useState(28);
  const [deltaThetaO, setDeltaThetaO] = useState(7);
  const [beamRatioK, setBeamRatioK] = useState(5);
  const [wavelength, setWavelength] = useState(632.8);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showApparatus, setShowApparatus] = useState(false);

  const [showZeroOrder, setShowZeroOrder] = useState(true);
  const [showVirtualImg, setShowVirtualImg] = useState(true);
  const [showRealImg, setShowRealImg] = useState(true);
  const [showWavefronts, setShowWavefronts] = useState(true);
  const [showDepthMarkers, setShowDepthMarkers] = useState(true);

  const mainCanvasRef = useRef(null);
  const subCanvasRef = useRef(null);
  const phaseRef = useRef(0);
  const animFrameRef = useRef(null);
  const [resizeTick, setResizeTick] = useState(0);

  useEffect(() => {
    const handleResize = () => setResizeTick((t) => t + 1);
    window.addEventListener("resize", handleResize);

    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => setResizeTick((t) => t + 1));
      if (mainCanvasRef.current) observer.observe(mainCanvasRef.current);
      if (subCanvasRef.current) observer.observe(subCanvasRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, []);

  const physicsData = useMemo(() => {
    const rad = Math.PI / 180;

    const sinThetaR = Math.sin(thetaR * rad);
    const sinDeltaO = Math.sin(deltaThetaO * rad);

    const lambdaMM = wavelength * 1e-6;

    const fc = sinThetaR / lambdaMM;
    const bandwidthB = sinDeltaO / lambdaMM;
    const gratingPeriodUm = fc > 1 ? 1000 / fc : Infinity;

    const rawSinMinus1 = 2 * sinThetaR;
    const isEvanescent = rawSinMinus1 > 1.0;
    const clampedSinMinus1 = Math.min(0.985, rawSinMinus1);
    const thetaMinus1 = Math.asin(clampedSinMinus1) / rad;

    const visibility = (2 * Math.sqrt(beamRatioK)) / (beamRatioK + 1);
    const haloRatio = 1 / beamRatioK;
    const isNonlinearK = beamRatioK < 2.2;

    const virtualUpper = deltaThetaO;
    const haloLower = thetaR - 2 * deltaThetaO;
    const gapAngle = haloLower - virtualUpper;

    let status = "separated";
    let statusTitle = "严格无混叠分离 (满足利思离轴条件 θ_R ≥ 3Δθ_O)";
    let statusDesc =
      "0级自相关晕光与+1级虚像视场完全分离，沿主光轴可观察到高信噪比的三维正视虚像。";
    let statusColor = "#10b981";

    if (thetaR < 0.5) {
      status = "in-line";
      statusTitle = "盖博同轴全息构型 (Gabor In-Line, θ_R ≈ 0°)";
      statusDesc =
        "参考光与物光共轴，0级直透光、自相关晕光、正视虚像与共轭实像四波同轴混叠（孪生像干扰）。";
      statusColor = "#ef4444";
    } else if (thetaR < deltaThetaO) {
      status = "severe-overlap";
      statusTitle = "严重零级串扰 (θ_R < Δθ_O)";
      statusDesc =
        "参考光倾角小于物光半视场角，强烈的0级直透光直接刺入虚像中心视场，无法正常观察。";
      statusColor = "#ef4444";
    } else if (thetaR < 3 * deltaThetaO - 0.05) {
      status = "halo-overlap";
      statusTitle = "自相关晕光混叠 (Δθ_O ≤ θ_R < 3Δθ_O)";
      statusDesc = `0级直透光已偏离主轴，但自相关晕光U₂下边界（${haloLower.toFixed(
        1
      )}°）侵入+1级虚像视场上边界（+${virtualUpper.toFixed(
        1
      )}°），边缘存在散斑噪声。`;
      statusColor = "#f59e0b";
    } else if (isNonlinearK) {
      status = "nonlinear-k";
      statusTitle = "角谱已分离 · 但光束比 K 偏小（非线性截断与晕光增强）";
      statusDesc = `角谱已满足分离条件，但 K = ${beamRatioK.toFixed(
        1
      )} 使条纹衬比度 V = ${(visibility * 100).toFixed(
        0
      )}% 过大，曝光摆幅超出干板 t-E 曲线线性区，且自相关晕光占比（1/K = ${(
        haloRatio * 100
      ).toFixed(0)}%）偏高。`;
      statusColor = "#f59e0b";
    }

    return {
      fc,
      bandwidthB,
      gratingPeriodUm,
      rawSinMinus1,
      isEvanescent,
      thetaMinus1,
      visibility,
      haloRatio,
      isNonlinearK,
      virtualUpper,
      haloLower,
      gapAngle,
      status,
      statusTitle,
      statusDesc,
      statusColor,
    };
  }, [thetaR, deltaThetaO, beamRatioK, wavelength]);

  const waveColor = useMemo(() => {
    if (wavelength >= 600) {
      return {
        name: "He-Ne 红光 (632.8 nm)",
        main: "#f43f5e",
        rgb: "244, 63, 94",
        halo: "251, 146, 60",
      };
    }
    if (wavelength >= 500) {
      return {
        name: "Nd:YAG 倍频绿光 (532 nm)",
        main: "#10b981",
        rgb: "16, 185, 129",
        halo: "250, 204, 21",
      };
    }
    return {
      name: "DPSS 蓝光 (473 nm)",
      main: "#3b82f6",
      rgb: "59, 130, 246",
      halo: "168, 85, 247",
    };
  }, [wavelength]);

  const applyPreset = (type) => {
    if (type === "gabor") {
      setThetaR(0);
      setDeltaThetaO(7);
      setBeamRatioK(5);
      setReconMode("original");
    } else if (type === "critical") {
      setThetaR(21);
      setDeltaThetaO(7);
      setBeamRatioK(5);
      setReconMode("original");
    } else if (type === "leith") {
      setThetaR(28);
      setDeltaThetaO(7);
      setBeamRatioK(5);
      setReconMode("original");
    } else if (type === "nonlinear") {
      setThetaR(26);
      setDeltaThetaO(7);
      setBeamRatioK(1.2);
      setReconMode("original");
    }
  };

  // ==================== 主画布渲染 ====================
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let disposed = false;

    const renderMain = () => {
      if (disposed) return;

      if (isPlaying) {
        phaseRef.current = (phaseRef.current + 0.04) % (Math.PI * 2);
      }

      const phase = phaseRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      if (W <= 0 || H <= 0) {
        animFrameRef.current = requestAnimationFrame(renderMain);
        return;
      }

      if (
        canvas.width !== Math.round(W * dpr) ||
        canvas.height !== Math.round(H * dpr)
      ) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // ============ 光学暗室背景（径向暗角）============
      const bgGrad = ctx.createRadialGradient(
        W * 0.45,
        H * 0.48,
        0,
        W * 0.45,
        H * 0.48,
        Math.max(W, H) * 0.78
      );
      bgGrad.addColorStop(0, "#0a1327");
      bgGrad.addColorStop(0.5, "#060b17");
      bgGrad.addColorStop(1, "#02040a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ============ 双层精细网格 ============
      for (let x = 0; x < W; x += 36) {
        const isMajor = (x / 36) % 5 === 0;
        ctx.strokeStyle = isMajor
          ? "rgba(148,163,184,0.075)"
          : "rgba(148,163,184,0.028)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 36) {
        const isMajor = (y / 36) % 5 === 0;
        ctx.strokeStyle = isMajor
          ? "rgba(148,163,184,0.075)"
          : "rgba(148,163,184,0.028)";
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(W, y + 0.5);
        ctx.stroke();
      }

      const plateX = W * 0.41;
      const centerY = H * 0.49;
      const plateHalfH = H * 0.35;

      const objDist = Math.min(W * 0.21, 205);
      const objX = plateX - objDist;

      const rad = Math.PI / 180;
      const objHalfH = Math.max(24, Math.tan(deltaThetaO * rad) * objDist);

      // 顶部空间分区
      drawPillBadge(
        ctx,
        "物方空间 (z < 0)",
        20,
        22,
        "#94a3b8",
        "rgba(15,23,42,0.88)",
        "rgba(148,163,184,0.25)",
        "left"
      );
      drawPillBadge(
        ctx,
        "像方透射空间 (z > 0)",
        plateX + 22,
        22,
        "#94a3b8",
        "rgba(15,23,42,0.88)",
        "rgba(148,163,184,0.25)",
        "left"
      );

      // 主光轴 z 轴（渐隐虚线）
      ctx.save();
      const axisGrad = ctx.createLinearGradient(20, 0, W - 20, 0);
      axisGrad.addColorStop(0, "rgba(148,163,184,0.04)");
      axisGrad.addColorStop(0.15, "rgba(148,163,184,0.28)");
      axisGrad.addColorStop(0.85, "rgba(148,163,184,0.28)");
      axisGrad.addColorStop(1, "rgba(148,163,184,0.04)");
      ctx.strokeStyle = axisGrad;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, centerY + 0.5);
      ctx.lineTo(W - 20, centerY + 0.5);
      ctx.stroke();
      ctx.restore();

      // ============ 入射参考光 R 或再现照明光 C ============
      const isConj = stage === "reconstruct" && reconMode === "conjugate";
      const illumAngleDeg = isConj ? -thetaR : thetaR;
      const refAngleRad = illumAngleDeg * rad;

      const beamSpan = plateHalfH * 0.7;
      const refLen = W * 0.34;
      const dxRef = Math.cos(refAngleRad) * refLen;
      const dyRef = -Math.sin(refAngleRad) * refLen;

      ctx.save();
      // 光束填充
      const refGrad = ctx.createLinearGradient(
        plateX - dxRef,
        centerY - dyRef,
        plateX,
        centerY
      );
      refGrad.addColorStop(0, `rgba(${waveColor.rgb},0.01)`);
      refGrad.addColorStop(1, `rgba(${waveColor.rgb},0.19)`);
      ctx.fillStyle = refGrad;

      ctx.beginPath();
      ctx.moveTo(plateX - dxRef, centerY - beamSpan - dyRef);
      ctx.lineTo(plateX, centerY - beamSpan);
      ctx.lineTo(plateX, centerY + beamSpan);
      ctx.lineTo(plateX - dxRef, centerY + beamSpan - dyRef);
      ctx.closePath();
      ctx.fill();

      // 波前相位线（渐隐描边）
      if (showWavefronts) {
        const waveStep = 36;
        const offset = (phase / (Math.PI * 2)) * waveStep;
        const dirX = Math.cos(refAngleRad);
        const dirY = -Math.sin(refAngleRad);
        const perpX = Math.sin(refAngleRad);
        const perpY = Math.cos(refAngleRad);

        for (let d = offset; d < refLen * 0.88; d += waveStep) {
          const distance = refLen * 0.88 - d;
          const cx = plateX - dirX * distance;
          const cy = centerY - dirY * distance;
          const halfW = beamSpan * Math.cos(refAngleRad) * 0.85;

          // 波前线亮度渐变
          const tNorm = d / (refLen * 0.88);
          const lineAlpha = 0.12 + 0.28 * (1 - tNorm);
          ctx.strokeStyle = `rgba(${waveColor.rgb},${lineAlpha})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(cx - perpX * halfW, cy - perpY * halfW);
          ctx.lineTo(cx + perpX * halfW, cy + perpY * halfW);
          ctx.stroke();
        }
      }

      // 参考光主光线 · 三层发光
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // 外晕
      ctx.strokeStyle = `rgba(${waveColor.rgb},0.14)`;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(plateX - dxRef * 0.86, centerY - dyRef * 0.86);
      ctx.lineTo(plateX, centerY);
      ctx.stroke();
      // 中层
      ctx.strokeStyle = `rgba(${waveColor.rgb},0.4)`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(plateX - dxRef * 0.86, centerY - dyRef * 0.86);
      ctx.lineTo(plateX, centerY);
      ctx.stroke();
      ctx.restore();
      // 核心亮线
      ctx.strokeStyle = waveColor.main;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(plateX - dxRef * 0.86, centerY - dyRef * 0.86);
      ctx.lineTo(plateX, centerY);
      ctx.stroke();

      // 离轴倾角圆弧与标注
      if (thetaR >= 1) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        if (!isConj) {
          ctx.arc(plateX, centerY, 44, Math.PI - refAngleRad, Math.PI);
        } else {
          ctx.arc(plateX, centerY, 44, Math.PI, Math.PI - refAngleRad);
        }
        ctx.stroke();

        const arcLabelX = plateX - 56;
        const arcLabelY = !isConj
          ? Math.max(centerY + 42, centerY + Math.sin(thetaR * rad * 0.5) * 64)
          : Math.min(centerY - 42, centerY - Math.sin(thetaR * rad * 0.5) * 64);

        drawPillBadge(
          ctx,
          isConj ? `θ_C = -${thetaR}°` : `θ_R = ${thetaR}°`,
          arcLabelX,
          arcLabelY,
          "#fbbf24",
          "rgba(15,23,42,0.92)",
          "rgba(251,191,36,0.45)",
          "center"
        );
      }

      const rayAnchorX = plateX - dxRef * 0.65;
      const rayAnchorY = centerY - dyRef * 0.65;
      const safeBeamLabelX = Math.max(105, Math.min(plateX - 115, rayAnchorX));
      const safeBeamLabelY = !isConj
        ? Math.min(H - 24, Math.max(centerY + 115, rayAnchorY + 26))
        : Math.max(54, Math.min(centerY - 122, rayAnchorY - 26));

      if (Math.abs(safeBeamLabelY - rayAnchorY) > 28) {
        ctx.strokeStyle = `rgba(${waveColor.rgb},0.55)`;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(safeBeamLabelX, safeBeamLabelY);
        ctx.lineTo(rayAnchorX, rayAnchorY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      drawPillBadge(
        ctx,
        stage === "record"
          ? "平面参考光 R(x,y)"
          : isConj
          ? "共轭照明光 C = R*(x,y)"
          : "再现照明光 C = R(x,y)",
        safeBeamLabelX,
        safeBeamLabelY,
        waveColor.main,
        "rgba(15,23,42,0.92)",
        `rgba(${waveColor.rgb},0.45)`,
        "center"
      );
      ctx.restore();

      // ==================== 记录阶段 ====================
      if (stage === "record") {
        ctx.save();

        // 物光散射光锥
        const objGrad = ctx.createLinearGradient(
          objX,
          centerY,
          plateX,
          centerY
        );
        objGrad.addColorStop(0, "rgba(56,189,248,0.32)");
        objGrad.addColorStop(1, "rgba(56,189,248,0.05)");
        ctx.fillStyle = objGrad;

        ctx.beginPath();
        ctx.moveTo(objX, centerY - objHalfH);
        ctx.lineTo(plateX, centerY - plateHalfH * 0.75);
        ctx.lineTo(plateX, centerY + plateHalfH * 0.75);
        ctx.lineTo(objX, centerY + objHalfH);
        ctx.closePath();
        ctx.fill();

        // 物光锥外发光
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const objGlowGrad = ctx.createLinearGradient(
          objX,
          centerY,
          plateX,
          centerY
        );
        objGlowGrad.addColorStop(0, "rgba(56,189,248,0.12)");
        objGlowGrad.addColorStop(1, "rgba(56,189,248,0)");
        ctx.fillStyle = objGlowGrad;
        ctx.beginPath();
        ctx.moveTo(objX, centerY - objHalfH * 1.1);
        ctx.lineTo(plateX, centerY - plateHalfH * 0.82);
        ctx.lineTo(plateX, centerY + plateHalfH * 0.82);
        ctx.lineTo(objX, centerY + objHalfH * 1.1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if (showWavefronts) {
          ctx.strokeStyle = "rgba(56,189,248,0.42)";
          ctx.lineWidth = 1.2;

          const stepR = 34;
          const offR = (phase / (Math.PI * 2)) * stepR;
          const maxSpread = Math.atan2(plateHalfH * 0.72, objDist);

          for (let r = offR + 22; r < objDist; r += stepR) {
            const tNorm = r / objDist;
            ctx.strokeStyle = `rgba(56,189,248,${0.18 + 0.3 * (1 - tNorm)})`;
            ctx.beginPath();
            ctx.arc(objX, centerY, r, -maxSpread, maxSpread);
            ctx.stroke();
          }
        }

        draw3DBunny(
          ctx,
          objX,
          centerY,
          objHalfH,
          false,
          false,
          showDepthMarkers,
          `三维实物：小兔子 (±Δθ_O = ±${deltaThetaO}°)`
        );

        const cardX = plateX + 36;
        const cardY = centerY - 106;
        const cardW = Math.min(365, W - plateX - 54);

        // 卡片渐变背景
        const cardGrad = ctx.createLinearGradient(
          cardX,
          cardY,
          cardX,
          cardY + 212
        );
        cardGrad.addColorStop(0, "rgba(15,23,42,0.94)");
        cardGrad.addColorStop(1, "rgba(8,12,24,0.94)");
        ctx.fillStyle = cardGrad;
        ctx.strokeStyle = "rgba(56,189,248,0.42)";
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, cardX, cardY, cardW, 212, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("第一步：两束相干波前干涉编码", cardX + 18, cardY + 28);

        ctx.font = "12px monospace";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(
          "I(x,y) = |O + R|² = I_R + I_O + O·R* + O*·R",
          cardX + 18,
          cardY + 54
        );

        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(
          `• 条纹包络调幅 (编码物光振幅 O₀)：V = ${(
            physicsData.visibility * 100
          ).toFixed(0)}%`,
          cardX + 18,
          cardY + 84
        );

        ctx.fillStyle = "#fbbf24";
        ctx.fillText(
          `• 条纹疏密调相 (编码物光相位 φ_O)：f_c = ${physicsData.fc.toFixed(
            0
          )} l/mm`,
          cardX + 18,
          cardY + 110
        );

        ctx.fillStyle = "#a78bfa";
        ctx.fillText(
          `• 空间载波条纹周期：Λ = ${
            Number.isFinite(physicsData.gratingPeriodUm)
              ? `${physicsData.gratingPeriodUm.toFixed(2)} μm`
              : "∞ (同轴)"
          }`,
          cardX + 18,
          cardY + 136
        );

        ctx.fillStyle = physicsData.isNonlinearK ? "#fb923c" : "#10b981";
        ctx.fillText(
          `• H-D 特性曲线工作点：K = ${beamRatioK.toFixed(1)} (${
            physicsData.isNonlinearK ? "进入非线性区" : "处于理想线性区"
          })`,
          cardX + 18,
          cardY + 162
        );

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px sans-serif";
        ctx.fillText(
          "提示：点击顶部「第二步：衍射再现」观察四波解调与实/虚像分离",
          cardX + 18,
          cardY + 192
        );

        ctx.restore();
      }

      // ==================== 衍射再现阶段 ====================
      if (stage === "reconstruct") {
        const rightSpanX = W - plateX - 32;

        if (!isConj) {
          // ============ (A) C = R ============
          if (showZeroOrder) {
            ctx.save();

            const haloUpperRad = (thetaR + 2 * deltaThetaO) * rad;
            const haloLowerRad = (thetaR - 2 * deltaThetaO) * rad;
            const haloLen = rightSpanX * 0.9;

            const haloAlpha = Math.min(
              0.38,
              Math.max(0.1, 0.55 / Math.sqrt(beamRatioK))
            );

            const haloGrad = ctx.createLinearGradient(
              plateX,
              centerY,
              plateX + Math.cos(refAngleRad) * haloLen,
              centerY - Math.sin(refAngleRad) * haloLen
            );
            haloGrad.addColorStop(0, `rgba(${waveColor.halo},${haloAlpha})`);
            haloGrad.addColorStop(1, `rgba(${waveColor.halo},0.01)`);
            ctx.fillStyle = haloGrad;

            ctx.beginPath();
            ctx.moveTo(plateX, centerY - 8);
            ctx.lineTo(
              plateX + Math.cos(haloUpperRad) * haloLen,
              centerY - Math.sin(haloUpperRad) * haloLen
            );
            ctx.lineTo(
              plateX + Math.cos(haloLowerRad) * haloLen,
              centerY - Math.sin(haloLowerRad) * haloLen
            );
            ctx.lineTo(plateX, centerY + 8);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle =
              physicsData.gapAngle >= 0
                ? "rgba(251,146,60,0.85)"
                : "rgba(239,68,68,0.95)";
            ctx.setLineDash([5, 4]);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(plateX, centerY);
            ctx.lineTo(
              plateX + Math.cos(haloLowerRad) * haloLen,
              centerY - Math.sin(haloLowerRad) * haloLen
            );
            ctx.stroke();
            ctx.setLineDash([]);

            // 0级中心光束三层发光
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = `rgba(${waveColor.rgb},0.16)`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(plateX, centerY);
            ctx.lineTo(
              plateX + Math.cos(refAngleRad) * haloLen,
              centerY - Math.sin(refAngleRad) * haloLen
            );
            ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = waveColor.main;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(plateX, centerY);
            ctx.lineTo(
              plateX + Math.cos(refAngleRad) * haloLen,
              centerY - Math.sin(refAngleRad) * haloLen
            );
            ctx.stroke();

            const u1Dist = haloLen * 0.56;
            const rawU1X = plateX + Math.cos(refAngleRad) * u1Dist;
            const rawU1Y = centerY - Math.sin(refAngleRad) * u1Dist;
            const safeU1X = Math.max(plateX + 165, Math.min(W - 150, rawU1X));
            const safeU1Y = Math.max(52, Math.min(centerY - 64, rawU1Y - 14));

            if (Math.abs(safeU1Y - rawU1Y) > 22) {
              ctx.strokeStyle = "rgba(251,146,60,0.55)";
              ctx.setLineDash([3, 3]);
              ctx.lineWidth = 1.1;
              ctx.beginPath();
              ctx.moveTo(safeU1X, safeU1Y);
              ctx.lineTo(rawU1X, rawU1Y);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            drawPillBadge(
              ctx,
              "U₁ + U₂：0级直透与自相关晕光",
              safeU1X,
              safeU1Y,
              "#fb923c",
              "rgba(15,23,42,0.92)",
              "rgba(251,146,60,0.45)",
              "center"
            );

            ctx.restore();
          }

          if (showVirtualImg) {
            ctx.save();

            // 物方反向延长虚光线
            ctx.strokeStyle = "rgba(56,189,248,0.30)";
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(objX, centerY);
            ctx.lineTo(
              plateX,
              centerY - Math.tan(deltaThetaO * rad) * objDist
            );
            ctx.moveTo(objX, centerY);
            ctx.lineTo(
              plateX,
              centerY + Math.tan(deltaThetaO * rad) * objDist
            );
            ctx.stroke();
            ctx.setLineDash([]);

            const u3HalfY1 =
              Math.tan(deltaThetaO * rad) * (objDist + rightSpanX);
            const u3Grad = ctx.createLinearGradient(
              plateX,
              centerY,
              plateX + rightSpanX,
              centerY
            );
            u3Grad.addColorStop(0, "rgba(56,189,248,0.22)");
            u3Grad.addColorStop(1, "rgba(56,189,248,0.02)");
            ctx.fillStyle = u3Grad;

            const plateEmitHalf =
              Math.tan(deltaThetaO * rad) * objDist * 0.45;

            ctx.beginPath();
            ctx.moveTo(plateX, centerY - plateEmitHalf);
            ctx.lineTo(plateX + rightSpanX, centerY - u3HalfY1);
            ctx.lineTo(plateX + rightSpanX, centerY + u3HalfY1);
            ctx.lineTo(plateX, centerY + plateEmitHalf);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "rgba(56,189,248,0.82)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(plateX, centerY - plateEmitHalf);
            ctx.lineTo(plateX + rightSpanX, centerY - u3HalfY1);
            ctx.moveTo(plateX, centerY + plateEmitHalf);
            ctx.lineTo(plateX + rightSpanX, centerY + u3HalfY1);
            ctx.stroke();

            if (showWavefronts) {
              ctx.lineWidth = 1.1;
              const stepR = 36;
              const offR = (phase / (Math.PI * 2)) * stepR;

              for (
                let r = objDist + offR;
                r < objDist + rightSpanX - 35;
                r += stepR
              ) {
                const tNorm = (r - objDist) / rightSpanX;
                ctx.strokeStyle = `rgba(56,189,248,${
                  0.4 * (1 - tNorm * 0.7)
                })`;
                ctx.beginPath();
                ctx.arc(
                  objX,
                  centerY,
                  r,
                  -deltaThetaO * rad * 0.92,
                  deltaThetaO * rad * 0.92
                );
                ctx.stroke();
              }
            }

            drawPillBadge(
              ctx,
              `U₃ 虚像波视场 (±${deltaThetaO}°)`,
              W - 125,
              centerY - 26,
              "#38bdf8",
              "rgba(15,23,42,0.9)",
              "rgba(56,189,248,0.45)",
              "center"
            );

            ctx.restore();
          }

          // 角度隔离裕量 / 混叠警告
          if (showZeroOrder && showVirtualImg) {
            ctx.save();
            if (physicsData.gapAngle < 0) {
              const oUpper = Math.min(
                deltaThetaO * rad,
                (thetaR + 2 * deltaThetaO) * rad
              );
              const oLower = Math.max(
                -deltaThetaO * rad,
                (thetaR - 2 * deltaThetaO) * rad
              );

              if (oUpper > oLower) {
                const warnGrad = ctx.createRadialGradient(
                  plateX,
                  centerY,
                  0,
                  plateX,
                  centerY,
                  rightSpanX * 0.52
                );
                warnGrad.addColorStop(0, "rgba(239,68,68,0.32)");
                warnGrad.addColorStop(1, "rgba(239,68,68,0.04)");
                ctx.fillStyle = warnGrad;
                ctx.beginPath();
                ctx.moveTo(plateX, centerY);
                ctx.arc(
                  plateX,
                  centerY,
                  rightSpanX * 0.52,
                  -oUpper,
                  -oLower
                );
                ctx.closePath();
                ctx.fill();

                drawPillBadge(
                  ctx,
                  `视场混叠 (${Math.abs(physicsData.gapAngle).toFixed(1)}°)`,
                  plateX + 115,
                  centerY - 18,
                  "#fca5a5",
                  "rgba(127,29,29,0.92)",
                  "rgba(248,113,113,0.65)",
                  "center"
                );
              }
            } else {
              const gLower = deltaThetaO * rad;
              const gUpper = (thetaR - 2 * deltaThetaO) * rad;
              if (gUpper > gLower + 0.01) {
                ctx.fillStyle = "rgba(16,185,129,0.15)";
                ctx.strokeStyle = "rgba(16,185,129,0.75)";
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(plateX, centerY);
                ctx.arc(plateX, centerY, 112, -gUpper, -gLower);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                const midG = (gUpper + gLower) / 2;
                const badgeX = plateX + Math.cos(midG) * 148;
                const badgeY = Math.max(
                  centerY - 36,
                  centerY - Math.sin(midG) * 148
                );
                drawPillBadge(
                  ctx,
                  `无混叠裕量 +${physicsData.gapAngle.toFixed(1)}°`,
                  badgeX,
                  badgeY,
                  "#34d399",
                  "rgba(15,23,42,0.92)",
                  "rgba(16,185,129,0.45)",
                  "center"
                );
              }
            }
            ctx.restore();
          }

          // -1级共轭赝视实像
          if (showRealImg) {
            ctx.save();

            const bunnyScale = Math.max(
              0.55,
              Math.min(0.88, (objHalfH * 0.78) / 48)
            );
            const displayAngleRad =
              Math.min(31, Math.max(thetaR * 1.05, 16)) * rad;
            const realDist = Math.min(objDist * 1.02, rightSpanX * 0.56);

            const realImgX =
              plateX + Math.cos(displayAngleRad) * realDist;
            const minSafeY = centerY + 68 * bunnyScale + 42;
            const maxSafeY = H - (56 * bunnyScale + 28);
            const realImgY = Math.max(
              minSafeY,
              Math.min(
                maxSafeY,
                centerY + Math.sin(displayAngleRad) * realDist
              )
            );

            const u4Grad = ctx.createLinearGradient(
              plateX,
              centerY,
              realImgX,
              realImgY
            );
            u4Grad.addColorStop(0, "rgba(192,132,252,0.06)");
            u4Grad.addColorStop(
              1,
              physicsData.isEvanescent
                ? "rgba(192,132,252,0.15)"
                : "rgba(192,132,252,0.32)"
            );
            ctx.fillStyle = u4Grad;

            ctx.beginPath();
            ctx.moveTo(plateX, centerY - plateHalfH * 0.22);
            ctx.lineTo(realImgX, realImgY - objHalfH * 0.42);
            ctx.lineTo(realImgX, realImgY + objHalfH * 0.42);
            ctx.lineTo(plateX, centerY + plateHalfH * 0.46);
            ctx.closePath();
            ctx.fill();

            if (showWavefronts && !physicsData.isEvanescent) {
              ctx.lineWidth = 1.1;
              const stepR = 34;
              const invOff =
                ((Math.PI * 2 - phase) / (Math.PI * 2)) * stepR;
              const baseAngle = Math.atan2(
                centerY - realImgY,
                plateX - realImgX
              );

              for (
                let r = invOff + 24;
                r < realDist * 0.88;
                r += stepR
              ) {
                const tNorm = r / (realDist * 0.88);
                ctx.strokeStyle = `rgba(192,132,252,${
                  0.5 * (1 - tNorm * 0.5)
                })`;
                ctx.beginPath();
                ctx.arc(
                  realImgX,
                  realImgY,
                  r,
                  baseAngle - 0.28,
                  baseAngle + 0.28
                );
                ctx.stroke();
              }
            }

            ctx.save();
            if (physicsData.isEvanescent) ctx.globalAlpha = 0.55;
            draw3DBunny(
              ctx,
              realImgX,
              realImgY,
              objHalfH * 0.78,
              false,
              true,
              showDepthMarkers,
              physicsData.isEvanescent
                ? "-1级实像 (θ_R>30° 同侧倏逝波截止)"
                : `-1级赝视实像 (U₄ ∝ O*, θ_-1=${physicsData.thetaMinus1.toFixed(
                    1
                  )}°)`
            );
            ctx.restore();

            ctx.restore();
          }

          // 物方顶层 +1 级正视虚像小兔子
          if (showVirtualImg) {
            draw3DBunny(
              ctx,
              objX,
              centerY,
              objHalfH,
              true,
              false,
              showDepthMarkers,
              "+1级正视虚像 (U₃ ∝ O)：纵深正常"
            );
          }

          drawObserverEye(ctx, W - 22, centerY, "观察者人眼");
        } else {
          // ============ (B) C = R* 共轭再现 ============
          if (showZeroOrder) {
            ctx.save();
            const conjAngleRad = -thetaR * rad;
            const haloUpperRad = (-thetaR + 2 * deltaThetaO) * rad;
            const haloLowerRad = (-thetaR - 2 * deltaThetaO) * rad;
            const haloLen = rightSpanX * 0.86;

            const haloGrad = ctx.createLinearGradient(
              plateX,
              centerY,
              plateX + Math.cos(conjAngleRad) * haloLen,
              centerY - Math.sin(conjAngleRad) * haloLen
            );
            haloGrad.addColorStop(0, `rgba(${waveColor.halo},0.30)`);
            haloGrad.addColorStop(1, `rgba(${waveColor.halo},0.01)`);
            ctx.fillStyle = haloGrad;

            ctx.beginPath();
            ctx.moveTo(plateX, centerY - 8);
            ctx.lineTo(
              plateX + Math.cos(haloUpperRad) * haloLen,
              centerY - Math.sin(haloUpperRad) * haloLen
            );
            ctx.lineTo(
              plateX + Math.cos(haloLowerRad) * haloLen,
              centerY - Math.sin(haloLowerRad) * haloLen
            );
            ctx.lineTo(plateX, centerY + 8);
            ctx.closePath();
            ctx.fill();

            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = `rgba(${waveColor.rgb},0.16)`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(plateX, centerY);
            ctx.lineTo(
              plateX + Math.cos(conjAngleRad) * haloLen,
              centerY - Math.sin(conjAngleRad) * haloLen
            );
            ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = waveColor.main;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(plateX, centerY);
            ctx.lineTo(
              plateX + Math.cos(conjAngleRad) * haloLen,
              centerY - Math.sin(conjAngleRad) * haloLen
            );
            ctx.stroke();

            drawPillBadge(
              ctx,
              "U₁ + U₂：0级直透与晕光",
              plateX + Math.cos(conjAngleRad) * (haloLen * 0.52),
              Math.min(
                H - 24,
                Math.max(
                  centerY + 115,
                  centerY - Math.sin(conjAngleRad) * (haloLen * 0.52) + 16
                )
              ),
              "#fb923c",
              "rgba(15,23,42,0.92)",
              "rgba(251,146,60,0.45)",
              "center"
            );
            ctx.restore();
          }

          if (showRealImg) {
            ctx.save();
            const axisRealX = plateX + objDist * 1.1;
            const axisRealY = centerY;

            const u4Grad = ctx.createLinearGradient(
              plateX,
              centerY,
              axisRealX,
              axisRealY
            );
            u4Grad.addColorStop(0, "rgba(192,132,252,0.12)");
            u4Grad.addColorStop(1, "rgba(192,132,252,0.38)");
            ctx.fillStyle = u4Grad;

            ctx.beginPath();
            ctx.moveTo(plateX, centerY - plateHalfH * 0.62);
            ctx.lineTo(axisRealX, axisRealY - objHalfH);
            ctx.lineTo(axisRealX, axisRealY + objHalfH);
            ctx.lineTo(plateX, centerY + plateHalfH * 0.62);
            ctx.closePath();
            ctx.fill();

            if (showWavefronts) {
              ctx.lineWidth = 1.2;
              const stepR = 34;
              const invOff =
                ((Math.PI * 2 - phase) / (Math.PI * 2)) * stepR;
              const maxSpread = Math.atan2(
                plateHalfH * 0.6,
                objDist * 1.1
              );

              for (let r = invOff + 22; r < objDist * 1.05; r += stepR) {
                const tNorm = r / (objDist * 1.05);
                ctx.strokeStyle = `rgba(192,132,252,${
                  0.55 * (1 - tNorm * 0.5)
                })`;
                ctx.beginPath();
                ctx.arc(
                  axisRealX,
                  axisRealY,
                  r,
                  Math.PI - maxSpread,
                  Math.PI + maxSpread
                );
                ctx.stroke();
              }
            }

            ctx.strokeStyle = "rgba(216,180,254,0.65)";
            ctx.setLineDash([4, 3]);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(axisRealX, axisRealY - objHalfH - 22);
            ctx.lineTo(axisRealX, axisRealY + objHalfH + 22);
            ctx.stroke();
            ctx.setLineDash([]);

            draw3DBunny(
              ctx,
              axisRealX,
              axisRealY,
              objHalfH,
              false,
              true,
              showDepthMarkers,
              "轴上 -1 级赝视实像 (U₄ = |R|²O*, z = +z₀ 实像屏承接)"
            );

            drawObserverEye(ctx, W - 22, centerY, "观察者人眼");
            ctx.restore();
          }
        }
      }

      // ==================== 全息干板 H ====================
      ctx.save();
      // 金属质感底座渐变
      const plateGrad = ctx.createLinearGradient(
        plateX - 6,
        0,
        plateX + 6,
        0
      );
      plateGrad.addColorStop(0, "#0a1322");
      plateGrad.addColorStop(0.25, "#273548");
      plateGrad.addColorStop(0.5, "#4a5b74");
      plateGrad.addColorStop(0.75, "#273548");
      plateGrad.addColorStop(1, "#0a1322");
      ctx.fillStyle = plateGrad;
      ctx.strokeStyle = "#7c8da8";
      ctx.lineWidth = 1.4;

      ctx.fillRect(plateX - 5, centerY - plateHalfH, 10, plateHalfH * 2);
      ctx.strokeRect(plateX - 5, centerY - plateHalfH, 10, plateHalfH * 2);

      // 条纹发光
      ctx.save();
      ctx.shadowColor = `rgba(56,189,248,${0.4 + 0.45 * physicsData.visibility})`;
      ctx.shadowBlur = 5;
      const visualPeriod = Math.max(4, 22 - thetaR * 0.42);
      for (
        let y = centerY - plateHalfH + 3;
        y < centerY + plateHalfH - 3;
        y += visualPeriod
      ) {
        ctx.fillStyle = `rgba(56,189,248,${
          0.22 + 0.72 * physicsData.visibility
        })`;
        ctx.fillRect(plateX - 4, y, 8, visualPeriod * 0.48);
      }
      ctx.restore();

      // 干板顶部高光
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plateX - 5, centerY - plateHalfH + 0.5);
      ctx.lineTo(plateX + 5, centerY - plateHalfH + 0.5);
      ctx.stroke();

      drawPillBadge(
        ctx,
        "全息干板 H (z = 0)",
        plateX,
        centerY - plateHalfH - 16,
        "#f8fafc",
        "rgba(15,23,42,0.94)",
        "rgba(100,116,139,0.55)",
        "center"
      );
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(renderMain);
    };

    animFrameRef.current = requestAnimationFrame(renderMain);

    return () => {
      disposed = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    stage,
    reconMode,
    thetaR,
    deltaThetaO,
    beamRatioK,
    wavelength,
    isPlaying,
    showZeroOrder,
    showVirtualImg,
    showRealImg,
    showWavefronts,
    showDepthMarkers,
    physicsData,
    waveColor,
    resizeTick,
  ]);

  // ==================== 副画布：三联物理监测仪 ====================
  useEffect(() => {
    const canvas = subCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    const W = rect.width;
    const H = rect.height;
    if (!W || !H) return;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 副画布背景渐变
    const subBg = ctx.createLinearGradient(0, 0, 0, H);
    subBg.addColorStop(0, "#0b1220");
    subBg.addColorStop(1, "#060a14");
    ctx.fillStyle = subBg;
    ctx.fillRect(0, 0, W, H);

    const split1 = W * 0.36;
    const split2 = W * 0.7;

    // 面板分割线（渐变）
    const dividerGrad = ctx.createLinearGradient(0, 12, 0, H - 12);
    dividerGrad.addColorStop(0, "rgba(30,41,59,0)");
    dividerGrad.addColorStop(0.5, "rgba(51,65,85,0.9)");
    dividerGrad.addColorStop(1, "rgba(30,41,59,0)");
    ctx.strokeStyle = dividerGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(split1, 12);
    ctx.lineTo(split1, H - 12);
    ctx.moveTo(split2, 12);
    ctx.lineTo(split2, H - 12);
    ctx.stroke();

    // ---------------- 面板 ①：空间频谱 ----------------
    const specLeft = 20;
    const specRight = split1 - 18;
    const specMidX = (specLeft + specRight) / 2;
    const specBaseY = H - 38;
    const specMaxH = H - 78;

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("① 空间频谱 |ℱ{t(x,y)}| (频域分离)", specLeft, 20);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(specLeft, specBaseY);
    ctx.lineTo(specRight, specBaseY);
    ctx.moveTo(specMidX, specBaseY + 4);
    ctx.lineTo(specMidX, 32);
    ctx.stroke();

    const degToPx = (specRight - specLeft) / 96;
    const bPx = deltaThetaO * degToPx;
    const fcPx = thetaR * degToPx;

    const haloPeakH = Math.min(
      specMaxH * 0.65,
      specMaxH * (0.2 + 0.55 / Math.sqrt(beamRatioK))
    );

    // 0级基带
    ctx.save();
    if (!showZeroOrder && stage === "reconstruct") ctx.globalAlpha = 0.25;
    ctx.shadowColor = "rgba(251,146,60,0.6)";
    ctx.shadowBlur = 10;

    const haloFillGrad = ctx.createLinearGradient(
      0,
      specBaseY - haloPeakH,
      0,
      specBaseY
    );
    haloFillGrad.addColorStop(0, "rgba(251,146,60,0.42)");
    haloFillGrad.addColorStop(1, "rgba(251,146,60,0.08)");
    ctx.fillStyle = haloFillGrad;
    ctx.strokeStyle = "#fb923c";
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.moveTo(specMidX - 2 * bPx, specBaseY);
    ctx.quadraticCurveTo(
      specMidX - bPx * 0.6,
      specBaseY - haloPeakH * 0.85,
      specMidX,
      specBaseY - haloPeakH
    );
    ctx.quadraticCurveTo(
      specMidX + bPx * 0.6,
      specBaseY - haloPeakH * 0.85,
      specMidX + 2 * bPx,
      specBaseY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 中心峰
    ctx.save();
    if (!showZeroOrder && stage === "reconstruct") ctx.globalAlpha = 0.25;
    ctx.shadowColor = waveColor.main;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = waveColor.main;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(specMidX, specBaseY);
    ctx.lineTo(specMidX, specBaseY - specMaxH * 0.9);
    ctx.stroke();
    ctx.restore();

    // +1级边带
    const sidebandH = specMaxH * 0.55 * physicsData.visibility;
    ctx.save();
    if (!showVirtualImg && stage === "reconstruct") ctx.globalAlpha = 0.25;
    ctx.shadowColor = "rgba(56,189,248,0.65)";
    ctx.shadowBlur = 9;

    const sbPlusGrad = ctx.createLinearGradient(
      0,
      specBaseY - sidebandH * 1.35,
      0,
      specBaseY
    );
    sbPlusGrad.addColorStop(0, "rgba(56,189,248,0.45)");
    sbPlusGrad.addColorStop(1, "rgba(56,189,248,0.06)");
    ctx.fillStyle = sbPlusGrad;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(specMidX + fcPx - bPx, specBaseY);
    ctx.quadraticCurveTo(
      specMidX + fcPx,
      specBaseY - sidebandH * 1.35,
      specMidX + fcPx + bPx,
      specBaseY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // -1级边带
    ctx.save();
    if (!showRealImg && stage === "reconstruct") ctx.globalAlpha = 0.25;
    ctx.shadowColor = "rgba(192,132,252,0.65)";
    ctx.shadowBlur = 9;

    const sbMinusGrad = ctx.createLinearGradient(
      0,
      specBaseY - sidebandH * 1.35,
      0,
      specBaseY
    );
    sbMinusGrad.addColorStop(0, "rgba(192,132,252,0.42)");
    sbMinusGrad.addColorStop(1, "rgba(192,132,252,0.06)");
    ctx.fillStyle = sbMinusGrad;
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(specMidX - fcPx - bPx, specBaseY);
    ctx.quadraticCurveTo(
      specMidX - fcPx,
      specBaseY - sidebandH * 1.35,
      specMidX - fcPx + bPx,
      specBaseY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 频谱混叠交叠区
    if (physicsData.gapAngle < 0) {
      const overlapStart = specMidX + Math.max(-2 * bPx, fcPx - bPx);
      const overlapEnd = specMidX + Math.min(2 * bPx, fcPx + bPx);
      if (overlapEnd > overlapStart) {
        ctx.fillStyle = "rgba(239,68,68,0.4)";
        ctx.fillRect(
          overlapStart,
          specBaseY - Math.min(haloPeakH, sidebandH) * 0.75,
          overlapEnd - overlapStart,
          Math.min(haloPeakH, sidebandH) * 0.75
        );
      }
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("0", specMidX, specBaseY + 13);

    ctx.fillStyle = "#fb923c";
    ctx.fillText("+2B", specMidX + 2 * bPx, specBaseY + 13);
    ctx.fillText("-2B", specMidX - 2 * bPx, specBaseY + 13);

    if (thetaR >= 5) {
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("+f_c(U₃)", specMidX + fcPx, specBaseY + 26);
      ctx.fillStyle = "#c084fc";
      ctx.fillText("-f_c(U₄)", specMidX - fcPx, specBaseY + 26);
    }

    // ---------------- 面板 ②：干板局部干涉光强 ----------------
    const fringeAxisX = split1 + 46;
    const fringeRight = split2 - 18;
    const fringeW = Math.max(40, fringeRight - fringeAxisX);
    const fringeMidY = H * 0.53;
    const fringeAmpH = (H - 76) * 0.39;

    ctx.textAlign = "left";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(
      `② 干板微观干涉光强 I(y) (V=${physicsData.visibility.toFixed(2)})`,
      split1 + 16,
      20
    );

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fringeAxisX, 32);
    ctx.lineTo(fringeAxisX, H - 30);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText("I₀", fringeAxisX - 5, fringeMidY - 2);
    ctx.font = "9px sans-serif";
    ctx.fillText("(偏置)", fringeAxisX - 4, fringeMidY + 10);

    ctx.strokeStyle = "rgba(148,163,184,0.26)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(fringeAxisX, fringeMidY);
    ctx.lineTo(fringeRight, fringeMidY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 干涉条纹曲线（发光）
    ctx.save();
    ctx.shadowColor = "rgba(56,189,248,0.7)";
    ctx.shadowBlur = 6;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();

    const carrierFreq = Math.max(2, thetaR * 0.48);
    for (let px = 0; px <= fringeW; px++) {
      const u = px / fringeW;
      const envO = 0.65 + 0.35 * Math.sin(u * Math.PI * 2.5);
      const phaseO = (deltaThetaO / 8) * 3.0 * Math.sin(u * Math.PI * 2);
      const cosVal = Math.cos(u * carrierFreq * Math.PI * 2 - phaseO);

      const modY =
        fringeMidY -
        envO * physicsData.visibility * fringeAmpH * cosVal -
        (1 / beamRatioK) * 5 * envO * envO;

      if (px === 0) {
        ctx.moveTo(fringeAxisX + px, modY);
      } else {
        ctx.lineTo(fringeAxisX + px, modY);
      }
    }
    ctx.stroke();
    ctx.restore();

    // 包络虚线
    ctx.strokeStyle = "rgba(251,191,36,0.68)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;

    for (const sign of [1, -1]) {
      ctx.beginPath();
      for (let px = 0; px <= fringeW; px += 2) {
        const u = px / fringeW;
        const envO = 0.65 + 0.35 * Math.sin(u * Math.PI * 2.5);
        const envY =
          fringeMidY -
          sign * envO * physicsData.visibility * fringeAmpH -
          (1 / beamRatioK) * 5 * envO * envO;

        if (px === 0) {
          ctx.moveTo(fringeAxisX + px, envY);
        } else {
          ctx.lineTo(fringeAxisX + px, envY);
        }
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.textAlign = "left";
    ctx.fillStyle = "#fbbf24";
    ctx.font = "10px sans-serif";
    ctx.fillText(
      "黄色包络反演振幅 O₀  |  蓝色条纹疏密反演相位 φ_O",
      split1 + 16,
      H - 12
    );

    // ---------------- 面板 ③：干板 t-E 特性曲线 ----------------
    const hdLeft = split2 + 34;
    const hdRight = W - 18;
    const hdW = Math.max(40, hdRight - hdLeft);
    const hdTop = 34;
    const hdBottom = H - 34;
    const hdH = hdBottom - hdTop;

    ctx.textAlign = "left";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(
      `③ 干板 t-E 特性曲线 (K=${beamRatioK.toFixed(1)})`,
      split2 + 16,
      20
    );

    // 坐标轴
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hdLeft, hdTop);
    ctx.lineTo(hdLeft, hdBottom);
    ctx.lineTo(hdRight, hdBottom);
    ctx.stroke();

    // 横向刻度网格
    for (let i = 0; i <= 4; i++) {
      const gy = hdTop + (hdH / 4) * i;
      ctx.strokeStyle = "rgba(148,163,184,0.09)";
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hdLeft, gy);
      ctx.lineTo(hdRight, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    ctx.fillText("t", hdLeft - 5, hdTop + 8);
    ctx.textAlign = "center";
    ctx.fillText("曝光量 E", hdLeft + hdW / 2, hdBottom + 12);

    // 线性工作区
    const linX1 = hdLeft + hdW * 0.24;
    const linX2 = hdLeft + hdW * 0.76;
    const linGrad = ctx.createLinearGradient(linX1, 0, linX2, 0);
    linGrad.addColorStop(0, "rgba(16,185,129,0.03)");
    linGrad.addColorStop(0.5, "rgba(16,185,129,0.12)");
    linGrad.addColorStop(1, "rgba(16,185,129,0.03)");
    ctx.fillStyle = linGrad;
    ctx.fillRect(linX1, hdTop + 4, linX2 - linX1, hdH - 4);

    const evalT = (u) => 1 / (1 + Math.exp((u - 0.5) * 8.5));

    // t(E) 曲线本体
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let px = 0; px <= hdW; px += 2) {
      const u = px / hdW;
      const tVal = evalT(u);
      const py = hdBottom - tVal * (hdH - 10) - 4;
      if (px === 0) ctx.moveTo(hdLeft + px, py);
      else ctx.lineTo(hdLeft + px, py);
    }
    ctx.stroke();

    // 曝光摆幅
    const swingHalf = 0.36 * physicsData.visibility;
    const uMin = Math.max(0.04, 0.5 - swingHalf);
    const uMax = Math.min(0.96, 0.5 + swingHalf);

    ctx.save();
    ctx.shadowColor = physicsData.isNonlinearK
      ? "rgba(245,158,11,0.75)"
      : "rgba(16,185,129,0.75)";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = physicsData.isNonlinearK ? "#f59e0b" : "#10b981";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    for (let px = Math.round(uMin * hdW); px <= Math.round(uMax * hdW); px++) {
      const u = px / hdW;
      const tVal = evalT(u);
      const py = hdBottom - tVal * (hdH - 10) - 4;
      if (px === Math.round(uMin * hdW)) ctx.moveTo(hdLeft + px, py);
      else ctx.lineTo(hdLeft + px, py);
    }
    ctx.stroke();
    ctx.restore();

    // 工作点 Q
    const qX = hdLeft + hdW * 0.5;
    const qY = hdBottom - 0.5 * (hdH - 10) - 4;
    ctx.save();
    ctx.shadowColor = "rgba(255,255,255,0.6)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(qX, qY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = physicsData.isNonlinearK ? "#fb923c" : "#34d399";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(
      physicsData.isNonlinearK
        ? "状态：摆幅过大进入非线性区 (产生高阶鬼影)"
        : "状态：摆幅位于线性区 t(E) ≈ t₀ - β·ΔE",
      split2 + 16,
      H - 12
    );
  }, [
    stage,
    thetaR,
    deltaThetaO,
    beamRatioK,
    wavelength,
    showZeroOrder,
    showVirtualImg,
    showRealImg,
    physicsData,
    waveColor,
    resizeTick,
  ]);

  // ==================== 组件整体视图 ====================
  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans my-6">
      {/* 顶部标题与阶段切换 */}
      <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
              波动光学 · 全息术
            </span>
            <h3 className="text-lg font-bold tracking-wide text-white">
              全息成像交互仿真：三维波前记录与衍射再现
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            干涉调幅调相编码 · 四波透射分解 · 正视虚像与赝视实像纵深反转 · 离轴无混叠判据 (θ_R ≥ 3Δθ_O)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setStage("record")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              stage === "record"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            第一步：干涉记录
          </button>

          <button
            onClick={() => setStage("reconstruct")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              stage === "reconstruct"
                ? "bg-sky-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            第二步：衍射再现
          </button>

          <button
            onClick={() => setShowApparatus(!showApparatus)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              showApparatus
                ? "bg-slate-800 text-sky-300 border-sky-500/40"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            {showApparatus ? "收起实验光路图" : "查看实验光路图"}
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            {isPlaying ? "⏸ 暂停" : "▶ 播放"}
          </button>
        </div>
      </div>

      {showApparatus && (
        <ExperimentSetup
          stage={stage}
          waveColor={waveColor}
          thetaR={thetaR}
        />
      )}

      {/* 诊断横幅 */}
      <div
        className="px-6 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs"
        style={{ backgroundColor: `${physicsData.statusColor}15` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: physicsData.statusColor }}
          />
          <span
            className="font-bold shrink-0"
            style={{ color: physicsData.statusColor }}
          >
            {physicsData.statusTitle}：
          </span>
          <span className="text-slate-300">{physicsData.statusDesc}</span>
        </div>

        <div className="font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 shrink-0">
          临界角 3Δθ_O = {(3 * deltaThetaO).toFixed(1)}° {" | "}
          角谱裕量 ={" "}
          <span
            className={
              physicsData.gapAngle >= 0 ? "text-emerald-400" : "text-rose-400"
            }
          >
            {physicsData.gapAngle >= 0
              ? `+${physicsData.gapAngle.toFixed(1)}°`
              : `${physicsData.gapAngle.toFixed(1)}°`}
          </span>
        </div>
      </div>

      {/* 控制工具栏 */}
      <div className="px-6 py-2.5 bg-slate-900/65 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1">经典构型:</span>
          <button
            onClick={() => applyPreset("gabor")}
            className="px-2.5 py-1 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition"
          >
            盖博同轴 (0°)
          </button>
          <button
            onClick={() => applyPreset("critical")}
            className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition"
          >
            临界分离 (3Δθ_O)
          </button>
          <button
            onClick={() => applyPreset("leith")}
            className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition"
          >
            利思离轴 (28°)
          </button>
          <button
            onClick={() => applyPreset("nonlinear")}
            className="px-2.5 py-1 rounded-md bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition"
          >
            强晕光/非线性 (K=1.2)
          </button>

          {stage === "reconstruct" && (
            <div className="flex items-center gap-1 pl-2 ml-1 border-l border-slate-700">
              <button
                onClick={() => setReconMode("original")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  reconMode === "original"
                    ? "bg-sky-500/25 text-sky-300 border border-sky-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                C = R (看正视虚像)
              </button>
              <button
                onClick={() => setReconMode("conjugate")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  reconMode === "conjugate"
                    ? "bg-purple-500/25 text-purple-300 border border-purple-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                C = R* (轴上实像)
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {stage === "reconstruct" && (
            <>
              <label className="flex items-center gap-1.5 cursor-pointer text-orange-300">
                <input
                  type="checkbox"
                  checked={showZeroOrder}
                  onChange={(e) => setShowZeroOrder(e.target.checked)}
                />
                0级(U₁+U₂)
              </label>

              {reconMode === "original" && (
                <label className="flex items-center gap-1.5 cursor-pointer text-sky-300">
                  <input
                    type="checkbox"
                    checked={showVirtualImg}
                    onChange={(e) => setShowVirtualImg(e.target.checked)}
                  />
                  +1级虚像(U₃)
                </label>
              )}

              <label className="flex items-center gap-1.5 cursor-pointer text-purple-300">
                <input
                  type="checkbox"
                  checked={showRealImg}
                  onChange={(e) => setShowRealImg(e.target.checked)}
                />
                -1级实像(U₄)
              </label>
            </>
          )}

          <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300">
            <input
              type="checkbox"
              checked={showDepthMarkers}
              onChange={(e) => setShowDepthMarkers(e.target.checked)}
            />
            纵深标尺(d_A/d_B)
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showWavefronts}
              onChange={(e) => setShowWavefronts(e.target.checked)}
            />
            波前相位线
          </label>
        </div>
      </div>

      {/* 主画布 */}
      <div className="relative w-full h-[465px] bg-slate-950">
        <canvas ref={mainCanvasRef} className="w-full h-full block" />
      </div>

      {/* 副画布 */}
      <div className="w-full h-[200px] border-t border-slate-800 bg-slate-950">
        <canvas ref={subCanvasRef} className="w-full h-full block" />
      </div>

      {/* 底部参数面板 */}
      <div className="p-6 bg-slate-900/95 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ParameterCard
            title="参考光离轴倾角 θ_R"
            value={`${thetaR}°`}
            sub={`空间载波频率 f_c = ${physicsData.fc.toFixed(0)} lines/mm`}
            color="amber"
          >
            <input
              type="range"
              min="0"
              max="42"
              step="0.5"
              value={thetaR}
              onChange={(e) => setThetaR(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </ParameterCard>

          <ParameterCard
            title="物体半视场张角 Δθ_O"
            value={`±${deltaThetaO}°`}
            sub={`无混叠临界倾角 3Δθ_O = ${(3 * deltaThetaO).toFixed(1)}°`}
            color="sky"
          >
            <input
              type="range"
              min="2"
              max="12"
              step="0.5"
              value={deltaThetaO}
              onChange={(e) => setDeltaThetaO(parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
          </ParameterCard>

          <ParameterCard
            title="参考/物光光束比 K = I_R / I_O"
            value={`K = ${beamRatioK.toFixed(1)}`}
            sub={`晕光占比 1/K = ${(physicsData.haloRatio * 100).toFixed(0)}%`}
            color="emerald"
          >
            <input
              type="range"
              min="1"
              max="12"
              step="0.2"
              value={beamRatioK}
              onChange={(e) => setBeamRatioK(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </ParameterCard>

          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-rose-400">
                相干激光波长 λ
              </span>
              <span className="text-[11px] text-slate-400">
                {waveColor.name}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {[
                { wl: 632.8, label: "632.8 nm" },
                { wl: 532, label: "532 nm" },
                { wl: 473, label: "473 nm" },
              ].map((item) => (
                <button
                  key={item.wl}
                  onClick={() => setWavelength(item.wl)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono border transition ${
                    wavelength === item.wl
                      ? "border-slate-500 bg-slate-800 text-white font-bold"
                      : "border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-950/90 p-4 rounded-xl border border-slate-800/80">
          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
            <span>空间频谱与衍射参量实时核算</span>
            <span className="text-[11px] font-mono text-slate-400">
              Λ ={" "}
              {Number.isFinite(physicsData.gratingPeriodUm)
                ? `${physicsData.gratingPeriodUm.toFixed(2)} μm`
                : "∞"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <Metric
              label="空间载波频率 f_c"
              value={`${physicsData.fc.toFixed(0)} lines/mm`}
              color="text-amber-400"
            />
            <Metric
              label="物光空间带宽 B"
              value={`${physicsData.bandwidthB.toFixed(0)} lines/mm`}
              color="text-sky-400"
            />
            <Metric
              label="干涉条纹衬比度 V"
              value={`${(physicsData.visibility * 100).toFixed(0)}%`}
              color="text-emerald-400"
            />
            <Metric
              label="-1级偏转角 θ_-1"
              value={
                physicsData.isEvanescent
                  ? "倏逝波截止 (>90°)"
                  : `${physicsData.thetaMinus1.toFixed(1)}°`
              }
              color="text-purple-400"
            />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed space-y-1">
            <p>
              <strong className="text-slate-200">透射四波分解：</strong>
              U_t = U₁(0级直透) + U₂(自相关晕光) + U₃(+1级正视虚像) +
              U₄(-1级赝视实像)。
            </p>
            <p>
              <strong className="text-slate-200">赝视深度反转机制：</strong>
              物点距干板距离 d_A &lt; d_B；共轭波 O* 在干板右侧对称距离
              z&apos;_A = +d_A、z&apos;_B = +d_B 处聚焦，使右侧观察者看到
              B&apos;(尾)在前、A&apos;(鼻)在后的深度反转实像。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// 圆角矩形与毛玻璃胶囊标签（含投影 + 高光）
// ======================================================

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawPillBadge(
  ctx,
  text,
  x,
  y,
  textColor = "#f8fafc",
  bgColor = "rgba(15,23,42,0.90)",
  borderColor = "rgba(148,163,184,0.35)",
  align = "center"
) {
  ctx.save();
  ctx.font = "600 11px system-ui, -apple-system, sans-serif";
  const metrics = ctx.measureText(text);
  const padX = 9;
  const boxW = metrics.width + padX * 2;
  const boxH = 22;

  let startX = x - boxW / 2;
  if (align === "left") startX = x;
  if (align === "right") startX = x - boxW;
  const startY = y - boxH / 2;

  // 投影
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1.5;

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;

  drawRoundedRect(ctx, startX, startY, boxW, boxH, 7);
  ctx.fill();

  // 关闭阴影后描边
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.stroke();

  // 顶部高光线
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX + 5, startY + 0.5);
  ctx.lineTo(startX + boxW - 5, startY + 0.5);
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, startX + boxW / 2, startY + boxH / 2 + 0.5);
  ctx.restore();
}

// ======================================================
// 参数卡片与指标
// ======================================================

function ParameterCard({ title, value, sub, color, children }) {
  const colorMap = {
    amber: "text-amber-400",
    sky: "text-sky-400",
    emerald: "text-emerald-400",
  };

  return (
    <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800/80">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className={`font-semibold ${colorMap[color]}`}>{title}</span>
        <span className="font-mono font-bold text-sm text-white">{value}</span>
      </div>
      {sub && <div className="text-[11px] text-slate-500 mb-2">{sub}</div>}
      {children}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/60">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`text-sm font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

// ======================================================
// 实验光学平台与光路示意图（含滤镜光晕）
// ======================================================

function ExperimentSetup({ stage, waveColor, thetaR }) {
  const [selected, setSelected] = useState("laser");

  const devices = {
    laser: {
      title: "单频相干激光器 (Laser)",
      desc: "提供高时间相干性与高空间相干性的单色激光束。必须保证参考光与物光的光程差小于激光器的相干长度。",
      role: "相干光源",
    },
    filter: {
      title: "显微物镜-针孔空间滤波器",
      desc: "由显微物镜与焦面微米针孔组成，滤除激光束中的衍射杂斑与高频空间噪声，输出洁净的球面波。",
      role: "光束净化",
    },
    lens: {
      title: "准直透镜 (Collimating Lens)",
      desc: "将空间滤波器发出的洁净发散球面波准直为大口径平行平面波，为后续分束提供均匀波前。",
      role: "波前准直",
    },
    splitter: {
      title: "可变分束器 (Beam Splitter)",
      desc: "将准直激光分为参考光路 R 与物光路 O，并可调节两束光的光强比 K = I_R / I_O，使曝光量落在干板 t-E 曲线线性区。",
      role: "分束与光强比调节",
    },
    mirrorR: {
      title: "参考光反射镜 M1",
      desc: `引导参考光 R 以设定的离轴角 θ_R（当前 ${thetaR}°）斜入射至全息干板，引入空间载波频率 f_c = sinθ_R / λ。`,
      role: "空间载波引入",
    },
    mirrorO: {
      title: "物光反射镜 M2 与挡光快门",
      desc: "记录阶段将激光引导至三维小兔子；再现阶段关闭挡光快门切断物光并移走原物体，仅保留参考光照明全息图。",
      role: "物光照明/再现遮断",
    },
    object: {
      title: "三维漫反射物体：小兔子",
      desc: "激光照射小兔子表面产生携带三维表面深度（相位 φ_O）与明暗（振幅 O₀）信息的复杂散射球面波前 O(x,y)。",
      role: "波前信息源",
    },
    plate: {
      title: "银盐全息干板 H",
      desc: "记录阶段曝光显影后将干涉强度 I=|O+R|² 转化为透过率 t(x,y) 的空间光栅；再现阶段作为复杂衍射屏恢复物光波前。",
      role: "波前编码与衍射再现",
    },
  };

  const device = devices[selected];

  return (
    <div className="border-b border-slate-800 bg-[#080e1a]">
      <div className="px-5 pt-3.5 pb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">
            离轴全息实验光学平台光路图
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            点击光学元件查看物理职能 · 再现阶段自动落入物光快门并透视虚像
          </div>
        </div>

        <span
          className={`text-xs px-3 py-1 rounded-full border ${
            stage === "record"
              ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
              : "text-sky-300 border-sky-500/30 bg-sky-500/10"
          }`}
        >
          {stage === "record"
            ? "当前状态：双光束相干记录 (物光开启)"
            : "当前状态：单光束衍射再现 (物光快门关闭)"}
        </span>
      </div>

      <div className="px-3 md:px-5">
        <svg
          viewBox="0 0 920 335"
          className="w-full h-auto block"
          role="img"
          aria-label="全息实验装置光路示意图"
        >
          <defs>
            <linearGradient id="referenceBeam" x1="0" x2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.75" />
            </linearGradient>
            <filter
              id="componentShadow"
              x="-25%"
              y="-25%"
              width="150%"
              height="150%"
            >
              <feDropShadow
                dx="0"
                dy="2.5"
                stdDeviation="3"
                floodColor="#000"
                floodOpacity="0.55"
              />
            </filter>
            <filter
              id="beamGlow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            x="25"
            y="292"
            width="870"
            height="12"
            rx="3"
            fill="#263449"
            stroke="#64748b"
          />
          {Array.from({ length: 22 }, (_, i) => (
            <circle
              key={i}
              cx={42 + i * 39}
              cy="298"
              r="2"
              fill="#94a3b8"
              opacity="0.6"
            />
          ))}

          {/* 激光器 */}
          <g
            onClick={() => setSelected("laser")}
            className="cursor-pointer"
            filter="url(#componentShadow)"
          >
            <rect
              x="35"
              y="156"
              width="78"
              height="48"
              rx="7"
              fill="#1e293b"
              stroke={selected === "laser" ? "#fbbf24" : "#64748b"}
              strokeWidth="2"
            />
            <rect
              x="42"
              y="165"
              width="15"
              height="30"
              rx="3"
              fill={waveColor.main}
              filter="url(#beamGlow)"
            />
            <text
              x="76"
              y="184"
              textAnchor="middle"
              fill="#fff"
              fontSize="11"
              fontWeight="bold"
            >
              LASER
            </text>
            <text
              x="74"
              y="222"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="12"
            >
              相干激光器
            </text>
          </g>

          <path
            d="M113 180 L162 180"
            stroke={waveColor.main}
            strokeWidth="3"
            fill="none"
            className="apparatus-beam"
            filter="url(#beamGlow)"
          />

          <g
            onClick={() => setSelected("filter")}
            className="cursor-pointer"
            filter="url(#componentShadow)"
          >
            <circle
              cx="180"
              cy="180"
              r="17"
              fill="#1e293b"
              stroke={selected === "filter" ? "#fbbf24" : "#94a3b8"}
              strokeWidth="2"
            />
            <circle cx="180" cy="180" r="4" fill="#fbbf24" />
            <text
              x="180"
              y="222"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="12"
            >
              空间滤波器
            </text>
          </g>

          <path
            d="M197 180 L255 180"
            stroke={waveColor.main}
            strokeWidth="3"
            fill="none"
            className="apparatus-beam"
            filter="url(#beamGlow)"
          />

          <g
            onClick={() => setSelected("lens")}
            className="cursor-pointer"
            filter="url(#componentShadow)"
          >
            <path
              d="M260 146 Q280 180 260 214 Q250 180 260 146"
              fill="#38bdf8"
              fillOpacity="0.22"
              stroke={selected === "lens" ? "#fbbf24" : "#38bdf8"}
              strokeWidth="2"
            />
            <text
              x="260"
              y="236"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="12"
            >
              准直透镜
            </text>
          </g>

          <path
            d="M270 180 L352 180"
            stroke={waveColor.main}
            strokeWidth="3.5"
            fill="none"
            className="apparatus-beam"
            filter="url(#beamGlow)"
          />

          <g
            onClick={() => setSelected("splitter")}
            className="cursor-pointer"
            filter="url(#componentShadow)"
          >
            <rect
              x="345"
              y="165"
              width="30"
              height="30"
              transform="rotate(45 360 180)"
              fill="#64748b"
              fillOpacity="0.25"
              stroke={selected === "splitter" ? "#fbbf24" : "#cbd5e1"}
              strokeWidth="2"
            />
            <path
              d="M350 190 L370 170"
              stroke="#e2e8f0"
              strokeWidth="2"
            />
            <text
              x="360"
              y="236"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="12"
            >
              分束器 BS
            </text>
          </g>

          <g>
            <path
              d="M360 180 L480 72 L695 72 L755 135"
              stroke="#fbbf24"
              strokeWidth="3"
              fill="none"
              className="apparatus-beam"
              filter="url(#beamGlow)"
            />
            <path
              d="M360 180 L480 72 L695 72 L755 135"
              stroke="url(#referenceBeam)"
              strokeWidth="12"
              fill="none"
              opacity="0.24"
            />

            <g
              onClick={() => setSelected("mirrorR")}
              className="cursor-pointer"
              filter="url(#componentShadow)"
            >
              <rect
                x="465"
                y="57"
                width="30"
                height="7"
                rx="2"
                transform="rotate(-35 480 60)"
                fill="#94a3b8"
                stroke={selected === "mirrorR" ? "#fbbf24" : "#e2e8f0"}
                strokeWidth="1.5"
              />
              <text
                x="480"
                y="42"
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="12"
              >
                M1 参考镜
              </text>
            </g>

            <text
              x="590"
              y="58"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="12"
              fontWeight="bold"
            >
              {stage === "record"
                ? `参考光路 R (θ_R = ${thetaR}°)`
                : `再现照明光路 C = R (θ_R = ${thetaR}°)`}
            </text>
          </g>

          {stage === "reconstruct" && (
            <g filter="url(#componentShadow)">
              <rect
                x="392"
                y="206"
                width="26"
                height="8"
                rx="2"
                transform="rotate(-42 405 210)"
                fill="#ef4444"
                stroke="#fca5a5"
                strokeWidth="1.5"
              />
              <text
                x="408"
                y="198"
                textAnchor="middle"
                fill="#f87171"
                fontSize="11"
                fontWeight="bold"
              >
                挡光快门关闭
              </text>
            </g>
          )}

          <g opacity={stage === "record" ? 1 : 0.25}>
            <path
              d="M360 180 L445 268 L535 268"
              stroke="#38bdf8"
              strokeWidth="3"
              fill="none"
              className={stage === "record" ? "apparatus-beam" : ""}
              filter="url(#beamGlow)"
            />

            <g
              onClick={() => setSelected("mirrorO")}
              className="cursor-pointer"
              filter="url(#componentShadow)"
            >
              <rect
                x="432"
                y="259"
                width="30"
                height="7"
                rx="2"
                transform="rotate(45 447 262)"
                fill="#94a3b8"
                stroke={selected === "mirrorO" ? "#fbbf24" : "#e2e8f0"}
                strokeWidth="1.5"
              />
              <text
                x="445"
                y="246"
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="12"
              >
                M2 物光镜
              </text>
            </g>

            <g
              onClick={() => setSelected("object")}
              className="cursor-pointer"
              strokeDasharray={stage === "reconstruct" ? "4 3" : "none"}
              filter="url(#componentShadow)"
            >
              <ellipse
                cx="575"
                cy="256"
                rx="30"
                ry="19"
                fill="#e2e8f0"
                fillOpacity="0.8"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <ellipse
                cx="585"
                cy="238"
                rx="15"
                ry="14"
                fill="#f8fafc"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <ellipse
                cx="577"
                cy="217"
                rx="5"
                ry="18"
                fill="#f9a8d4"
                stroke="#e2e8f0"
              />
              <ellipse
                cx="590"
                cy="217"
                rx="5"
                ry="18"
                fill="#f9a8d4"
                stroke="#e2e8f0"
              />
              <circle cx="591" cy="235" r="2" fill="#172033" />
              <text
                x="575"
                y="288"
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="12"
              >
                {stage === "record" ? "三维小兔子实物" : "原位置正视虚像"}
              </text>
            </g>

            <path
              d="M605 256 L755 196"
              stroke="#38bdf8"
              strokeWidth="3"
              fill="none"
              className={stage === "record" ? "apparatus-beam" : ""}
              filter="url(#beamGlow)"
            />
            <path
              d="M605 256 L755 196"
              stroke="#38bdf8"
              strokeWidth="12"
              opacity="0.12"
              fill="none"
            />
            <text
              x="675"
              y="244"
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="12"
            >
              物光波前 O(x,y)
            </text>
          </g>

          <g
            onClick={() => setSelected("plate")}
            className="cursor-pointer"
            filter="url(#componentShadow)"
          >
            <rect
              x="750"
              y="100"
              width="12"
              height="155"
              rx="2"
              fill="#64748b"
              fillOpacity="0.25"
              stroke={selected === "plate" ? "#fbbf24" : "#cbd5e1"}
              strokeWidth="2"
            />
            {Array.from({ length: 18 }, (_, i) => (
              <line
                key={i}
                x1="752"
                x2="760"
                y1={106 + i * 8}
                y2={106 + i * 8}
                stroke="#38bdf8"
                strokeWidth="1.4"
                opacity="0.8"
              />
            ))}
            <text
              x="756"
              y="88"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="12"
              fontWeight="bold"
            >
              全息干板 H
            </text>
          </g>

          {stage === "reconstruct" && (
            <g>
              <path
                d="M762 178 L875 112"
                stroke="#38bdf8"
                strokeWidth="2.5"
                fill="none"
                className="apparatus-beam"
                filter="url(#beamGlow)"
              />
              <path
                d="M762 178 L875 182"
                stroke="#fbbf24"
                strokeWidth="2.5"
                fill="none"
                className="apparatus-beam"
                filter="url(#beamGlow)"
              />
              <path
                d="M762 178 L875 248"
                stroke="#c084fc"
                strokeWidth="2.5"
                fill="none"
                className="apparatus-beam"
                filter="url(#beamGlow)"
              />

              <text
                x="882"
                y="108"
                textAnchor="end"
                fill="#38bdf8"
                fontSize="11"
                fontWeight="bold"
              >
                +1级 (U₃ 虚像波)
              </text>
              <text
                x="882"
                y="198"
                textAnchor="end"
                fill="#fbbf24"
                fontSize="11"
                fontWeight="bold"
              >
                0级 (U₁+U₂)
              </text>
              <text
                x="882"
                y="264"
                textAnchor="end"
                fill="#c084fc"
                fontSize="11"
                fontWeight="bold"
              >
                -1级 (U₄ 实像波)
              </text>
            </g>
          )}

          <text
            x="460"
            y="324"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
          >
            {stage === "record"
              ? "记录阶段：物光 O 与参考光 R 在干板 H 处相干叠加，将振幅与相位冻结为微观干涉条纹"
              : "再现阶段：物光遮断，参考光照射全息干板 H，衍射恢复出 +1 级三维虚像与 -1 级共轭实像"}
          </text>
        </svg>
      </div>

      <div className="px-5 pb-3.5">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold text-sky-300">
              {device.title}
            </div>
            <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">
              {device.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
            {device.desc}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {Object.entries(devices).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`px-2.5 py-1 rounded-md text-[10px] border transition ${
                  selected === key
                    ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600"
                }`}
              >
                {item.title.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .apparatus-beam {
          stroke-dasharray: 9 7;
          animation: apparatusFlow 1.5s linear infinite;
        }
        @keyframes apparatusFlow {
          to {
            stroke-dashoffset: -32;
          }
        }
      `}</style>
    </div>
  );
}

// ======================================================
// 三维立体小兔子绘制函数（含彩色光晕 + 消光背衬双层）
// ======================================================

function draw3DBunny(
  ctx,
  x,
  y,
  halfH,
  isVirtual = false,
  isPseudoscopic = false,
  showDepthMarkers = true,
  titleText = ""
) {
  ctx.save();

  const s = Math.max(0.55, Math.min(0.88, halfH / 48));
  ctx.translate(x, y);

  const glowColor = isPseudoscopic ? "192,132,252" : "125,211,252";

  // 外层彩色光晕（提升立体分离感）
  const outerGlow = ctx.createRadialGradient(
    0,
    -6 * s,
    22 * s,
    0,
    -6 * s,
    88 * s
  );
  outerGlow.addColorStop(0, `rgba(${glowColor},0)`);
  outerGlow.addColorStop(0.55, `rgba(${glowColor},0.12)`);
  outerGlow.addColorStop(1, `rgba(${glowColor},0)`);
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(0, -6 * s, 88 * s, 0, Math.PI * 2);
  ctx.fill();

  // 内层消光背衬
  const backdrop = ctx.createRadialGradient(
    0,
    -6 * s,
    12 * s,
    0,
    -6 * s,
    72 * s
  );
  backdrop.addColorStop(0, "rgba(5, 8, 17, 0.88)");
  backdrop.addColorStop(0.7, "rgba(5, 8, 17, 0.58)");
  backdrop.addColorStop(1, "rgba(5, 8, 17, 0)");
  ctx.fillStyle = backdrop;
  ctx.beginPath();
  ctx.arc(0, -6 * s, 72 * s, 0, Math.PI * 2);
  ctx.fill();

  const dirX = isPseudoscopic ? -1 : 1;

  // 绘制兔子几何
  ctx.save();
  ctx.scale(dirX * s, s);

  const fur = isPseudoscopic ? "#c4a7e8" : "#e8edf5";
  const furLight = isPseudoscopic ? "#e9d9ff" : "#ffffff";
  const furDark = isPseudoscopic ? "#7e5bef" : "#9aa9bd";
  const innerEar = isPseudoscopic ? "#d08acb" : "#f3a8bd";
  const outline = isPseudoscopic ? "#c084fc" : "#7dd3fc";

  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.5;

  if (isVirtual) {
    ctx.setLineDash([4, 3]);
  }

  // 底部投影
  ctx.save();
  ctx.setLineDash([]);
  const shadow = ctx.createRadialGradient(-2, 37, 2, 0, 37, 39);
  shadow.addColorStop(0, "rgba(15,23,42,0.55)");
  shadow.addColorStop(1, "rgba(15,23,42,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, 38, 40, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  function drawEar(ex, ey, angle, scale = 1) {
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(angle);
    ctx.scale(scale, 1);

    const earGrad = ctx.createLinearGradient(-8, -48, 8, 5);
    earGrad.addColorStop(0, furLight);
    earGrad.addColorStop(0.55, fur);
    earGrad.addColorStop(1, furDark);
    ctx.fillStyle = earGrad;

    ctx.beginPath();
    ctx.moveTo(-8, 5);
    ctx.bezierCurveTo(-13, -15, -12, -46, -4, -57);
    ctx.bezierCurveTo(2, -65, 11, -48, 11, -28);
    ctx.bezierCurveTo(12, -12, 10, -1, 6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = innerEar;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(-4, -1);
    ctx.bezierCurveTo(-8, -20, -7, -44, -3, -51);
    ctx.bezierCurveTo(3, -43, 6, -18, 5, -2);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawEar(-8, -31, -0.2, 0.86);

  // 后腿
  ctx.save();
  const rearLegGrad = ctx.createLinearGradient(-25, 5, -5, 32);
  rearLegGrad.addColorStop(0, furLight);
  rearLegGrad.addColorStop(0.5, fur);
  rearLegGrad.addColorStop(1, furDark);
  ctx.fillStyle = rearLegGrad;
  ctx.beginPath();
  ctx.ellipse(-21, 24, 13, 9, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(-14, 32, 13, 5.5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 尾巴（特征点 B）
  ctx.save();
  const tailGrad = ctx.createRadialGradient(-35, 0, 1, -35, 0, 11);
  tailGrad.addColorStop(0, "#ffffff");
  tailGrad.addColorStop(0.65, fur);
  tailGrad.addColorStop(1, furDark);
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.arc(-36, 1, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 身体
  ctx.save();
  const bodyGrad = ctx.createLinearGradient(-30, -12, 28, 23);
  bodyGrad.addColorStop(0, isPseudoscopic ? furDark : furLight);
  bodyGrad.addColorStop(0.45, fur);
  bodyGrad.addColorStop(1, isPseudoscopic ? furLight : furDark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(-5, 8, 32, 19, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-12, 1, 15, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // 前腿
  ctx.save();
  const frontGrad = ctx.createLinearGradient(8, 10, 18, 32);
  frontGrad.addColorStop(0, furLight);
  frontGrad.addColorStop(0.6, fur);
  frontGrad.addColorStop(1, furDark);
  ctx.fillStyle = frontGrad;
  ctx.beginPath();
  ctx.ellipse(14, 24, 7, 12, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(20, 33, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 头部
  ctx.save();
  const headGrad = ctx.createRadialGradient(12, -24, 3, 6, -18, 28);
  headGrad.addColorStop(0, "#ffffff");
  headGrad.addColorStop(0.38, furLight);
  headGrad.addColorStop(0.75, fur);
  headGrad.addColorStop(1, furDark);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(8, -18, 22, 21, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawEar(10, -31, 0.12, 0.88);

  // 吻部与鼻尖（特征点 A）
  ctx.save();
  const muzzleGrad = ctx.createRadialGradient(28, -13, 1, 27, -10, 12);
  muzzleGrad.addColorStop(0, "#ffffff");
  muzzleGrad.addColorStop(1, furDark);
  ctx.fillStyle = muzzleGrad;
  ctx.beginPath();
  ctx.ellipse(25, -10, 11, 8, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isPseudoscopic ? "#e879f9" : "#f43f5e";
  ctx.beginPath();
  ctx.moveTo(34, -13);
  ctx.quadraticCurveTo(42, -12, 39, -7);
  ctx.quadraticCurveTo(35, -4, 32, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#172033";
  ctx.beginPath();
  ctx.arc(19, -22, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(20, -23, 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(31, -5);
  ctx.quadraticCurveTo(28, 0, 23, -2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(100,116,139,0.75)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    const yy = -9 + i * 4;
    ctx.beginPath();
    ctx.moveTo(29, yy);
    ctx.lineTo(47, yy - 5 + i * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();

  // 顶部主标题
  if (titleText) {
    drawPillBadge(
      ctx,
      titleText,
      0,
      -68 * s - 14,
      isPseudoscopic ? "#d8b4fe" : "#38bdf8",
      "rgba(15,23,42,0.94)",
      isPseudoscopic
        ? "rgba(192,132,252,0.55)"
        : "rgba(56,189,248,0.55)",
      "center"
    );
  }

  // A / B 特征点与深度标尺
  if (showDepthMarkers) {
    const noseX = dirX * 38 * s;
    const noseY = -10 * s;
    const tailX = dirX * -36 * s;
    const tailY = 1 * s;

    // 特征点发光
    ctx.save();
    ctx.shadowColor = "rgba(251,113,133,0.85)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#fb7185";
    ctx.beginPath();
    ctx.arc(noseX, noseY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(52,211,153,0.85)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#34d399";
    ctx.beginPath();
    ctx.arc(tailX, tailY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawPillBadge(
      ctx,
      isPseudoscopic ? "A'(鼻, +d_A)" : "A(鼻, -d_A)",
      noseX + dirX * 32,
      noseY,
      "#fda4af",
      "rgba(15,23,42,0.90)",
      "rgba(251,113,133,0.45)",
      "center"
    );

    drawPillBadge(
      ctx,
      isPseudoscopic ? "B'(尾, +d_B)" : "B(尾, -d_B)",
      tailX - dirX * 32,
      tailY,
      "#6ee7b7",
      "rgba(15,23,42,0.90)",
      "rgba(52,211,153,0.45)",
      "center"
    );

    drawPillBadge(
      ctx,
      isPseudoscopic
        ? "人眼视线：B'(尾)在前 · A'(鼻)在后 (凹凸反转)"
        : "人眼视线：A(鼻)在前 · B(尾)在后 (正视立体)",
      0,
      44 * s + 15,
      isPseudoscopic ? "#e9d5ff" : "#bae6fd",
      "rgba(15,23,42,0.92)",
      isPseudoscopic
        ? "rgba(192,132,252,0.4)"
        : "rgba(56,189,248,0.4)",
      "center"
    );
  }

  ctx.restore();
}

// ======================================================
// 观察者人眼
// ======================================================

function drawObserverEye(ctx, x, y, label = "观察者人眼") {
  ctx.save();

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.quadraticCurveTo(x, y - 12, x + 10, y - 9);
  ctx.moveTo(x - 14, y);
  ctx.quadraticCurveTo(x, y + 12, x + 10, y + 9);
  ctx.stroke();

  ctx.save();
  ctx.shadowColor = "rgba(56,189,248,0.7)";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(x - 5, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawPillBadge(
    ctx,
    label,
    x + 10,
    y + 26,
    "#cbd5e1",
    "rgba(15,23,42,0.92)",
    "rgba(148,163,184,0.35)",
    "right"
  );

  ctx.restore();
}