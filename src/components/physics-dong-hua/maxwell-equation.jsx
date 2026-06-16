"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function MaxwellEquationSimulation() {
  const mountRef = useRef(null);
  
  // UI 状态控制
  const [showGrid, setShowGrid] = useState(true);
  const [showAxis, setShowAxis] = useState(true);
  const [showLoop, setShowLoop] = useState(true);
  const [showS1, setShowS1] = useState(false);
  const [showS2, setShowS2] = useState(false);
  const [showEField, setShowEField] = useState(false);

  // 保存 Three.js 对象的引用以便在状态更新时切换可见性
  const sceneObjects = useRef({});

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. 初始化场景、相机和渲染器
    const scene = new THREE.Scene();
    // 🌟 设置深色物理星空背景
    scene.background = new THREE.Color(0x0a0a10); 

    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    // 设置初始俯视抬高视角
    camera.position.set(6, 4, 6);

    // 🌟 开启抗锯齿
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    // 🌟 解决模糊问题
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    // 2. 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // --- 物理模型构建 ---
    
    // A. 分界平面 (适合深色背景的网格)
    const gridHelper = new THREE.GridHelper(10, 20, 0x555555, 0x222222);
    scene.add(gridHelper);
    sceneObjects.current.grid = gridHelper;

    // B. Z 轴标识 (高亮白线)
    const axisGroup = new THREE.Group();
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -5, 0),
      new THREE.Vector3(0, 5, 0)
    ]);
    const zAxis = new THREE.Line(axisGeometry, axisMaterial);
    axisGroup.add(zAxis);
    scene.add(axisGroup);
    sceneObjects.current.axis = axisGroup;

    // C. 半无限长导线
    const wireGeo = new THREE.CylinderGeometry(0.04, 0.04, 5, 32);
    wireGeo.translate(0, -2.5, 0); 
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x33b5e5, metalness: 0.5, roughness: 0.2 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wire);

    // D. 原点堆积电荷 (高亮红心)
    const chargeGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const chargeMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const charge = new THREE.Mesh(chargeGeo, chargeMat);
    scene.add(charge);

    // E. 安培环路 L
    const radius = 2.5;
    const loopGeo = new THREE.TorusGeometry(radius, 0.03, 16, 100);
    const loopMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const loop = new THREE.Mesh(loopGeo, loopMat);
    loop.rotation.x = Math.PI / 2;
    scene.add(loop);
    sceneObjects.current.loop = loop;

    // F. 上半球面 S1 (z > 0)
    const s1Geo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const s1Mat = new THREE.MeshPhysicalMaterial({ 
      color: 0x00ffcc, transparent: true, opacity: 0.25, side: THREE.DoubleSide
    });
    const s1 = new THREE.Mesh(s1Geo, s1Mat);
    scene.add(s1);
    sceneObjects.current.s1 = s1;

    // G. 下半球面 S2 (z < 0)
    const s2Geo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const s2Mat = new THREE.MeshPhysicalMaterial({ 
      color: 0xcc00ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide
    });
    const s2 = new THREE.Mesh(s2Geo, s2Mat);
    scene.add(s2);
    sceneObjects.current.s2 = s2;

    // H. 电场线 (位移电流)
    const eFieldGroup = new THREE.Group();
    const arrowCount = 8;
    for (let i = 0; i < arrowCount; i++) {
      for (let j = 1; j < arrowCount / 2; j++) {
        const theta = (i / arrowCount) * Math.PI * 2;
        const phi = (j / (arrowCount / 2)) * Math.PI;
        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta)
        ).normalize();
        
        // 稍微调亮电场线的颜色，使其在黑底上更醒目
        const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0,0,0), radius + 0.6, 0xffcc00, 0.3, 0.1);
        eFieldGroup.add(arrow);
      }
    }
    scene.add(eFieldGroup);
    sceneObjects.current.eField = eFieldGroup;

    // 3. 动画循环
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 🌟 4. 使用 ResizeObserver 彻底解决 Canvas 发虚问题
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(currentMount);

    // 清理函数
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 监听 React 状态变化，更新 Three.js 对象的可见性
  useEffect(() => {
    if (!sceneObjects.current.grid) return;
    sceneObjects.current.grid.visible = showGrid;
    sceneObjects.current.axis.visible = showAxis;
    sceneObjects.current.loop.visible = showLoop;
    sceneObjects.current.s1.visible = showS1;
    sceneObjects.current.s2.visible = showS2;
    sceneObjects.current.eField.visible = showEField;
  }, [showGrid, showAxis, showLoop, showS1, showS2, showEField]);

  // 动态提示文案
  const getStatusText = () => {
    if (showS1 && !showS2) {
      return "情形一：导线未穿过 S1。传导电流 = 0。电场线穿出 S1，位移电流 = I/2。总电流 = I/2。";
    } else if (!showS1 && showS2) {
      return "情形二：导线穿破了 S2。传导电流 = I。电场线与 S2 法线(向上)相反，位移电流 = -I/2。总电流 = I/2。";
    } else if (showS1 && showS2) {
      return "闭合球面：导线穿入。传导电流 = I。电场线穿出整个球面，总位移电流 = 0。";
    }
    return "💡 请在上方勾选并选择一个曲面 (S1 或 S2) 来计算穿过的总电流。";
  };

  return (
    <div className="relative w-full h-[650px] md:h-[750px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl mt-8 mb-12">
      {/* 3D 渲染容器 (背景颜色由 Three.js 接管) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full outline-none" />

      {/* 🌟 标题与操作提示词 (按照截图修改) */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 pointer-events-none">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-wider text-shadow-md m-0">
          麦克斯韦方程 · 位移电流
        </h2>
        <div className="mt-2 text-gray-400 text-sm md:text-base font-medium flex items-center gap-2">
          <span>半无限长导线充电模型</span>
        </div>
        <div className="mt-4 text-cyan-300 text-xs md:text-sm flex items-center gap-2 bg-black/40 w-fit px-3 py-1 rounded-full border border-cyan-500/30">
          <span className="animate-pulse">🖱️</span> 
          提示：按住鼠标拖拽可旋转视角，滚轮缩放，右键平移
        </div>
      </div>

      {/* 🌟 暗黑毛玻璃风格的控制面板 */}
      <div className="absolute top-36 left-4 md:top-36 md:left-6 bg-[#1a1a24]/80 backdrop-blur-md border border-white/10 p-4 md:p-5 rounded-xl shadow-lg flex flex-col gap-3 select-none text-sm md:text-base text-gray-200">
        <label className="flex items-center cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="mr-3 accent-cyan-500 w-4 h-4"/>
          显示分界平面 (XY-平面)
        </label>
        <label className="flex items-center cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" checked={showAxis} onChange={e => setShowAxis(e.target.checked)} className="mr-3 accent-cyan-500 w-4 h-4"/>
          显示中心 Z 轴
        </label>
        <label className="flex items-center cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" checked={showLoop} onChange={e => setShowLoop(e.target.checked)} className="mr-3 accent-red-500 w-4 h-4"/>
          <span className="text-red-400 font-semibold drop-shadow-md">显示安培环路 L</span>
        </label>
        
        <div className="w-full h-px bg-white/10 my-1"></div>
        
        <label className="flex items-center cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" checked={showS1} onChange={e => setShowS1(e.target.checked)} className="mr-3 accent-teal-500 w-4 h-4"/>
          <span className="text-teal-300 font-semibold drop-shadow-md">显示上半球面 S1</span>
        </label>
        <label className="flex items-center cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" checked={showS2} onChange={e => setShowS2(e.target.checked)} className="mr-3 accent-purple-500 w-4 h-4"/>
          <span className="text-purple-400 font-semibold drop-shadow-md">显示下半球面 S2</span>
        </label>
        
        <div className="w-full h-px bg-white/10 my-1"></div>
        
        <label className="flex items-center cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" checked={showEField} onChange={e => setShowEField(e.target.checked)} className="mr-3 accent-amber-500 w-4 h-4"/>
          <span className="text-amber-400 font-semibold drop-shadow-md">显示电场线 (位移电流)</span>
        </label>
      </div>

      {/* 🌟 动态信息反馈底部面板 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 md:w-auto bg-[#1a1a24]/90 backdrop-blur-xl border border-white/20 text-white px-4 md:px-8 py-3 md:py-4 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center text-center">
        <p className="text-sm md:text-base font-medium tracking-wide m-0">
          {getStatusText()}
        </p>
      </div>
    </div>
  );
}