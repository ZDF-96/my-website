---
title: 多质点系动力学：质心、动量与能量定理
date: 2026-09-26
---

在经典力学中，当研究对象由单个质点拓展至多质点系统（包含离散质点系、变形介质与刚体）时，质点间错综复杂的内力使运动微分方程组的求解极其困难。为了从宏观上把握系统整体运动的动力学本质，物理学引入了“质心”概念，并建立了质心运动定理、动量定理、质点系动能定理与柯尼希定理。

---

## 1. 质心与质心运动定理

### 1.1 质心的严格数学定义

> **【定义】质心 (Center of Mass)**
>
> 对于由 $n$ 个离散质点构成的系统，设第 $i$ 个质点的质量为 $m_i$，在选定惯性参考系 $K$ 下的位置矢量为 $\bm{r}_i$。系统的总质量定义为：
> $$M = \sum_{i=1}^{n} m_i$$
> 系统**质心**的位置矢量 $\bm{r}_c$ 严格定义为各质点位置矢量按其质量加权的几何平均：
> $$\bm{r}_c \equiv \frac{\sum_{i=1}^{n} m_i \bm{r}_i}{\sum_{i=1}^{n} m_i} = \frac{1}{M} \sum_{i=1}^{n} m_i \bm{r}_i$$
> 若物体具有连续分布的质量，其密度分布为 $\rho(\bm{r})$，则离散求和过渡为空间体积分：
> $$\bm{r}_c \equiv \frac{1}{M} \iiint_{V} \bm{r} \,\mathrm{d}m = \frac{1}{M} \iiint_{V} \rho(\bm{r})\bm{r} \,\mathrm{d}V \quad \left( M = \iiint_{V} \rho(\bm{r}) \,\mathrm{d}V \right)$$

![质点系统与质心位矢分布](/picture/zhi-xin-fa/zhi-xin-fa1.png)

---

> **【概念辨析】质心与重心的本质区别与 $\bm{r}_G \equiv \bm{r}_c$ 的严格等效性证明**
>
> **质心**与**重心**（Center of Gravity, CG）属于两类截然不同的物理概念：
> * **质心 ($\bm{r}_c$)：** 描述系统质量空间分布的纯几何内禀量，完全由物体自身的质量分布决定，与空间中是否存在外引力场无关。
> * **重心 ($\bm{r}_G$)：** 外引力场对系统各质元所施重力的合力等效作用点，本质上是刚体内部的一个**随体固连点**（Body-fixed point）。
>
> #### 一、 理论力学力系简化（Poinsot 定理）与合力矩等效条件
>
> 设空间引力场中第 $i$ 个质点的位置矢量为 $\bm{r}_i$，局部引力加速度为 $\bm{g}_i = \bm{g}(\bm{r}_i)$，所受重力分力为 $\bm{G}_i = m_i \bm{g}_i$。  
> 根据理论力学中的力系等效原理（Poinsot 简化定理），一个空间分布重力系能够严格等效于集中在点 $\bm{r}_G$ 的单一合力 $\bm{G}$ 的充要条件为：
>
> 1. **主矢相等：**
>    $$\bm{G} = \sum_{i=1}^{n} \bm{G}_i = \sum_{i=1}^{n} m_i \bm{g}_i$$
>
> 2. **对任意参考点的主矩相等（合力矩定理）：**  
>    以坐标原点 $O$ 为矩心，集中合力对 $O$ 的力矩必须恒等于各分重力矩的矢量和：
>    $$\bm{r}_G \times \bm{G} = \sum_{i=1}^{n} \bm{r}_i \times \bm{G}_i \implies \bm{r}_G \times \left( \sum_{i=1}^{n} m_i \bm{g}_i \right) = \sum_{i=1}^{n} \bm{r}_i \times (m_i \bm{g}_i)$$
>
> #### 二、 均匀引力场下 $\bm{r}_G = \bm{r}_c$ 的严格数理证明
>
> 在均匀引力场中，引力场强处处为恒矢量，即 $\bm{g}_i \equiv \bm{g}$。将常矢量 $\bm{g}$ 从求和号中提取：
> $$\bm{r}_G \times \left( \sum_{i=1}^{n} m_i \bm{g} \right) = \sum_{i=1}^{n} \bm{r}_i \times (m_i \bm{g}) \implies \bm{r}_G \times (M \bm{g}) = \left( \sum_{i=1}^{n} m_i \bm{r}_i \right) \times \bm{g}$$
> 代入质心定义 $\sum m_i \bm{r}_i = M \bm{r}_c$，两端消去标量总质量 $M$，移项整理得到：
> $$(\bm{r}_G - \bm{r}_c) \times \bm{g} = \bm{0}$$
>
> * **单一场方向的局限性：**  
>   由向量积代数性质，上式仅能证明矢量 $(\bm{r}_G - \bm{r}_c)$ 与 $\bm{g}$ 平行共线：
>   $$\bm{r}_G = \bm{r}_c + \lambda \bm{g} \quad (\lambda \in \mathbb{R})$$
>   这表明在特定朝向的外场中，重心 $\bm{r}_G$ 可以是穿过质心 $\bm{r}_c$ 且沿重力作用线上的**任意一点**（一维非唯一解）。
>
> * **随体固连性公理与空间转动不变性：**  
>   重心的物理定义是刚体的**固有随体固连点**，其在随体坐标系中的相对位置必须与刚体在空间中的姿态取向无关。  
>   刚体在三维空间中作任意 $\mathrm{SO}(3)$ 刚体转动，完全等价于外引力场 $\bm{g}$ 可以相对于刚体取空间中任意三个线性无关的方向（例如直角坐标系的三维正交基矢 $\bm{e}_x, \bm{e}_y, \bm{e}_z$）。因此上式必须对任意场方向同时恒成立：
>   $$\begin{cases} (\bm{r}_G - \bm{r}_c) \times \bm{e}_x = \bm{0} \implies (\bm{r}_G - \bm{r}_c) \in \operatorname{span}\{\bm{e}_x\} \\ (\bm{r}_G - \bm{r}_c) \times \bm{e}_y = \bm{0} \implies (\bm{r}_G - \bm{r}_c) \in \operatorname{span}\{\bm{e}_y\} \\ (\bm{r}_G - \bm{r}_c) \times \bm{e}_z = \bm{0} \implies (\bm{r}_G - \bm{r}_c) \in \operatorname{span}\{\bm{e}_z\} \end{cases}$$
>   三个线性独立一维子空间的交集仅包含零矢量：
>   $$(\bm{r}_G - \bm{r}_c) \in \left( \operatorname{span}\{\bm{e}_x\} \cap \operatorname{span}\{\bm{e}_y\} \cap \operatorname{span}\{\bm{e}_z\} \right) = \{\bm{0}\}$$
>   即必有：
>   $$\bm{r}_G - \bm{r}_c = \bm{0} \iff \bm{r}_G \equiv \bm{r}_c$$
>   **结论：** 只有当外力场严格均匀，且引入刚体随体旋转不变性要求时，刚体的重心与质心才具有**全空间唯一重合性**。
>
> #### 三、 非均匀引力场与力螺旋（Wrench）退化
>
> 若空间存在引力梯度（$\nabla \bm{g} \neq \bm{0}$）或非平行引力场，分布重力系将表现出以下本质特性：
>
> 1. **力系第二不变量与不可单力化：**  
>    根据 Poinsot 定理，一个合力非零（$\bm{G} \neq \bm{0}$）的空间力系能够简化为单一集中力的充要条件是其第二不变量（主矢与主矩的点积）恒等于零：
>    $$\mathcal{I}_2 = \bm{G} \cdot \bm{M}_O = \left( \sum_{i=1}^{n} m_i \bm{g}_i \right) \cdot \left( \sum_{i=1}^{n} \bm{r}_i \times (m_i \bm{g}_i) \right) = 0$$
>    在一般非平行引力场中，通常 $\mathcal{I}_2 \neq 0$。此时力系无法进一步简化为单一合力，而是退化为沿中心轴作用的**力螺旋（Wrench）**——即一个单一合力 $\bm{G}$ 伴随一个无法通过改变参考点消除的平行力偶矩 $\bm{M}_\parallel$。此时，**严格意义上的单一重心点在物理上根本不存在**。
>
> 2. **重心的滑动与随体性丧失：**  
>    即便在特殊引力场中偶然满足 $\mathcal{I}_2 = 0$（例如一维高度单调引力场 $\bm{g}(z) = g(z)\bm{e}_z$），等效中心位置：
>    $$\bm{r}_G = \frac{\sum_{i=1}^{n} m_i g(\bm{r}_i) \bm{r}_i}{\sum_{i=1}^{n} m_i g(\bm{r}_i)}$$
>    也强烈依赖于局部场强分布与刚体在空间中的摆放姿态。当刚体翻转时，强场区覆盖的物体部位发生改变，导致 $\bm{r}_G$ 在刚体内部相对几何位置发生“滑动”，彻底丧失了作为刚体固有几何特征的随体固连属性。

![均匀引力场与非均匀梯度引力场对比](/picture/zhi-xin-fa/zhi-xin-fa2.png)

---

### 1.2 质心运动定理的完整微元推导

设质点系由 $n$ 个质点组成。对于任意质点 $i$（$i = 1, 2, \dots, n$），其所受的力严格分为两类：
* **外力 $\bm{F}_i^{(e)}$：** 系统外部物体对质点 $i$ 施加的作用力；
* **内力 $\bm{f}_{ij}$：** 系统内部质点 $j$ 对质点 $i$ 施加的作用力（约定 $\bm{f}_{ii} = \bm{0}$）。

根据牛顿第二定律，第 $i$ 个质点的运动微分方程为：
$$m_i \frac{\mathrm{d}^2\bm{r}_i}{\mathrm{d}t^2} = \bm{F}_i^{(e)} + \sum_{\substack{j=1 \\ j \neq i}}^{n} \bm{f}_{ij}$$

对系统中全部 $n$ 个质点的运动方程进行矢量求和：
$$\sum_{i=1}^{n} m_i \frac{\mathrm{d}^2\bm{r}_i}{\mathrm{d}t^2} = \sum_{i=1}^{n} \bm{F}_i^{(e)} + \sum_{i=1}^{n} \sum_{\substack{j=1 \\ j \neq i}}^{n} \bm{f}_{ij}$$

对各组成项展开物理分析：
* **内力抵消项：** 双重求和遍历了系统内所有相互作用对，改写为对无序质点对 $(i, j)$ 的求和：
  $$\sum_{i=1}^{n} \sum_{\substack{j=1 \\ j \neq i}}^{n} \bm{f}_{ij} = \sum_{1 \le i < j \le n} (\bm{f}_{ij} + \bm{f}_{ji})$$
  根据牛顿第三定律，相互作用力等大、反向且共线，即 $\bm{f}_{ij} + \bm{f}_{ji} = \bm{0} \ (\forall i \neq j)$。故系统内力矢量和恒等于零：
  $$\sum_{i=1}^{n} \sum_{\substack{j=1 \\ j \neq i}}^{n} \bm{f}_{ij} \equiv \bm{0}$$

* **合外力定义：** 定义系统所受合外力为 $\bm{F}_{\text{ext}} \equiv \sum_{i=1}^{n} \bm{F}_i^{(e)}$。

* **质心加速度代换：** 质量 $m_i$ 与时间无关，利用微分算符的线性性质：
  $$\sum_{i=1}^{n} m_i \frac{\mathrm{d}^2\bm{r}_i}{\mathrm{d}t^2} = \frac{\mathrm{d}^2}{\mathrm{d}t^2}\left( \sum_{i=1}^{n} m_i \bm{r}_i \right) = \frac{\mathrm{d}^2}{\mathrm{d}t^2}(M \bm{r}_c) = M \bm{a}_c$$

> **【基本定理】质心运动定理 (Theorem of Center of Mass Motion)**
>
> 质点系所受的合外力 $\bm{F}_{\text{ext}}$ 等于系统的总质量 $M$ 与其质心加速度 $\bm{a}_c$ 的乘积：
> $$\bm{F}_{\text{ext}} = M \bm{a}_c = M \frac{\mathrm{d}^2\bm{r}_c}{\mathrm{d}t^2}$$
> **物理精要：** 系统质心的运动状态完全由外力决定；内部发生的碰撞、化学爆炸或相互吸引，无论多么剧烈，均不能改变质心的运动轨迹与速度。

---

## 2. 质点系动量定理与动能定理

### 2.1 动量定理与动量守恒

定义质点系总动量 $\bm{P}$ 为所有质点动量的矢量和：
$$\bm{P} \equiv \sum_{i=1}^{n} \bm{p}_i = \sum_{i=1}^{n} m_i \bm{v}_i = \frac{\mathrm{d}}{\mathrm{d}t} \left( \sum_{i=1}^{n} m_i \bm{r}_i \right) = M \bm{v}_c$$

对时间求导，结合质心运动定理，得到**动量定理的微分形式**：
$$\frac{\mathrm{d}\bm{P}}{\mathrm{d}t} = \bm{F}_{\text{ext}}$$

在区间 $[t_1, t_2]$ 上对时间积分，得到**积分形式**：
$$\bm{I}_{\text{ext}} = \int_{t_1}^{t_2} \bm{F}_{\text{ext}} \,\mathrm{d}t = \bm{P}(t_2) - \bm{P}(t_1) = M \bm{v}_c(t_2) - M \bm{v}_c(t_1)$$

当 $\bm{F}_{\text{ext}} = \bm{0}$ 时，$\bm{P} = M \bm{v}_c = \text{常矢量}$，此即**动量守恒定律**。

---

### 2.2 动能定理与成对内力做功的微元推演

动量定理表明内力对系统总动量无任何改变，但**在动能转化过程中，内力做功起决定性作用**。

对质点 $i$，在时间微元 $\mathrm{d}t$ 内发生位移 $\mathrm{d}\bm{r}_i$，动能定理给出：
$$\mathrm{d}W_i = \left( \bm{F}_i^{(e)} + \sum_{\substack{j=1 \\ j \neq i}}^{n} \bm{f}_{ij} \right) \cdot \mathrm{d}\bm{r}_i = \mathrm{d}\left( \frac{1}{2}m_i v_i^2 \right) = \mathrm{d}E_{ki}$$

对全系统求和：
$$\sum_{i=1}^{n} \bm{F}_i^{(e)} \cdot \mathrm{d}\bm{r}_i + \sum_{i=1}^{n} \sum_{\substack{j=1 \\ j \neq i}}^{n} \bm{f}_{ij} \cdot \mathrm{d}\bm{r}_i = \mathrm{d}\left( \sum_{i=1}^{n} E_{ki} \right) = \mathrm{d}E_k$$

内力功项重组为对无序质点对的求和：
$$\mathrm{d}W_{\text{int}} = \sum_{1 \le i < j \le n} \left( \bm{f}_{ij} \cdot \mathrm{d}\bm{r}_i + \bm{f}_{ji} \cdot \mathrm{d}\bm{r}_j \right)$$

由牛顿第三定律 $\bm{f}_{ji} = -\bm{f}_{ij}$：
$$\bm{f}_{ij} \cdot \mathrm{d}\bm{r}_i + \bm{f}_{ji} \cdot \mathrm{d}\bm{r}_j = \bm{f}_{ij} \cdot (\mathrm{d}\bm{r}_i - \mathrm{d}\bm{r}_j) = \bm{f}_{ij} \cdot \mathrm{d}\bm{r}_{ij}$$

其中 $\bm{r}_{ij} \equiv \bm{r}_i - \bm{r}_j$ 为质点 $i$ 相对质点 $j$ 的相对位矢，$\mathrm{d}\bm{r}_{ij}$ 即两质点间的**相对位移**。于是：
$$\mathrm{d}W_{\text{int}} = \sum_{1 \le i < j \le n} \bm{f}_{ij} \cdot \mathrm{d}\bm{r}_{ij}$$

![质点间相互作用成对内力与相对位移](/picture/zhi-xin-fa/zhi-xin-fa3.png)

> **【物理精要】质点系动能定理与内力做功特性**
>
> 系统动能变化的积分关系为：
> $$W_{\text{ext}} + W_{\text{int}} = \Delta E_k = E_{k2} - E_{k1}$$
>
> **两大核心推论：**
> 1. **成对内力总功一般不为零：** 虽然内力之和恒为零，但只要质点间存在相对位移（$\mathrm{d}\bm{r}_{ij} \neq \bm{0}$），内力做功就通常不为零。内力做功的本质是机械能与系统内部能量（形变势能、内能等）的转化途径。
> 2. **理想刚体中内力总功恒等于零：** 刚体内任意两点间距离严格恒定（$|\bm{r}_{ij}| = \text{常数}$），必有 $\bm{r}_{ij} \cdot \mathrm{d}\bm{r}_{ij} = 0$。对于中心内力（$\bm{f}_{ij} \parallel \bm{r}_{ij}$），必有 $\bm{f}_{ij} \cdot \mathrm{d}\bm{r}_{ij} \equiv 0$。因此理想刚体内力做功之和恒为零。

---

## 3. 柯尼希定理 (König's Theorem) 的严格证明

柯尼希定理建立了“质心参考系”，将复杂的多自由度动力学解耦为质心平动与相对于质心的内部运动。

### 3.1 实验室系与质心参考系的运动学关系

设 $K$ 为实验室惯性系。以系统质心 $C$ 为坐标原点，建立坐标轴与 $K$ 系各对应轴平行且随质心平动的参考系 $K'$，称为**质心参考系**（CM 系）。  
对于系统内任意质点 $i$：
* 在 $K$ 系中的位置为 $\bm{r}_i$，速度为 $\bm{v}_i = \dot{\bm{r}}_i$；
* 在 $K'$ 系中的位置为 $\bm{r}_i' = \bm{r}_i - \bm{r}_c$，速度为 $\bm{u}_i = \dot{\bm{r}}_i' = \bm{v}_i - \bm{v}_c$。

> **【定理性质】质心系零动量特性**
>
> 根据质心定义 $\sum_{i=1}^{n} m_i \bm{r}_i = M \bm{r}_c$，质点系在质心系中的位置加权和恒为零：
> $$\sum_{i=1}^{n} m_i \bm{r}_i' = \sum_{i=1}^{n} m_i (\bm{r}_i - \bm{r}_c) = \sum_{i=1}^{n} m_i \bm{r}_i - M \bm{r}_c \equiv \bm{0}$$
> 对其关于时间求微商，即得**零动量系条件**：
> $$\bm{P}' = \sum_{i=1}^{n} m_i \bm{u}_i = \frac{\mathrm{d}}{\mathrm{d}t} \left( \sum_{i=1}^{n} m_i \bm{r}_i' \right) \equiv \bm{0}$$
> 系统在质心系中的总动量恒等为零。

---

### 3.2 动能展开与交叉项的严格消去

将速度变换式 $\bm{v}_i = \bm{v}_c + \bm{u}_i$ 代入系统总动能：
$$\begin{aligned} E_k &= \frac{1}{2} \sum_{i=1}^{n} m_i \bm{v}_i^2 = \frac{1}{2} \sum_{i=1}^{n} m_i (\bm{v}_c + \bm{u}_i) \cdot (\bm{v}_c + \bm{u}_i) \\ &= \frac{1}{2} \left( \sum_{i=1}^{n} m_i \right) v_c^2 + \bm{v}_c \cdot \left( \sum_{i=1}^{n} m_i \bm{u}_i \right) + \frac{1}{2} \sum_{i=1}^{n} m_i u_i^2 \end{aligned}$$

分析展开项：
1. **质心平动动能：** $\frac{1}{2} \left( \sum m_i \right) v_c^2 = \frac{1}{2} M v_c^2 \equiv E_{kC}$；
2. **交叉耦合项：** 由零动量特性知 $\sum m_i \bm{u}_i \equiv \bm{0}$，因此：
   $$\bm{v}_c \cdot \left( \sum_{i=1}^{n} m_i \bm{u}_i \right) = \bm{v}_c \cdot \bm{0} \equiv 0$$
3. **相对质心动能：** $\frac{1}{2} \sum m_i u_i^2 \equiv E_{k,\text{rel}}$。

> **【核心定理】柯尼希定理 (König's Theorem)**
>
> 质点系在任意惯性系下的总动能 $E_k$，严格等于系统随质心平动的动能 $E_{kC}$ 与系统相对于质心系的内部相对动能 $E_{k,\text{rel}}$ 之和：
> $$E_k = E_{kC} + E_{k,\text{rel}} = \frac{1}{2} M v_c^2 + \frac{1}{2} \sum_{i=1}^{n} m_i u_i^2$$
> **资用动能物理图像：**  
> 平动动能 $E_{kC} = \frac{P^2}{2M}$ 由系统总动量锁定，在无外力冲量介入时无法释放；只有内部相对动能 $E_{k,\text{rel}}$（资用动能）能够在系统内部转化为弹性势能、电磁能或在非弹性碰撞中耗散为内能。

---

## 4. 典型例题解析与教学图景

### 例题 1：一维完全弹性碰撞 —— 质心系速度反演法

> **题目：** 在光滑水平面上，质量为 $m_1$、初速为 $v_1$ 的物块与质量为 $m_2$、初速为 $v_2$ 的物块发生对心完全弹性碰撞。求碰后末速度 $v_1'$ 与 $v_2'$。

![实验室参考系与质心参考系速度反演对比](/picture/zhi-xin-fa/zhi-xin-fa4.png)

**解析：**

水平外力为零，系统质心速度全程恒定：
$$v_c = \frac{m_1 v_1 + m_2 v_2}{m_1 + m_2}$$

变换至质心系，碰前速度分别为 $u_1 = v_1 - v_c$，$u_2 = v_2 - v_c$。在质心系中同时满足：
* 总动量恒为零：$m_1 u_1' + m_2 u_2' = 0 \implies u_2' = -\frac{m_1}{m_2} u_1'$；
* 动能守恒：$\frac{1}{2}m_1 u_1^2 + \frac{1}{2}m_2 u_2^2 = \frac{1}{2}m_1 (u_1')^2 + \frac{1}{2}m_2 (u_2')^2$。

代入化简得 $(u_1')^2 = u_1^2$。排除未发生碰撞的平凡解 $u_1' = u_1$，弹性碰撞在质心系中的本质为**纯速度反演**：
$$u_1' = -u_1 = -(v_1 - v_c), \quad u_2' = -u_2 = -(v_2 - v_c)$$

应用伽利略速度变换返回实验室系：
$$\begin{aligned} v_1' &= u_1' + v_c = 2v_c - v_1 = \frac{(m_1 - m_2)v_1 + 2m_2 v_2}{m_1 + m_2} \\ v_2' &= u_2' + v_c = 2v_c - v_2 = \frac{2m_1 v_1 + (m_2 - m_1)v_2}{m_1 + m_2} \end{aligned}$$

---

### 例题 2：经典人船模型 —— 质心位置恒定与位移关系

> **题目：** 质量为 $M$、长为 $L$ 的均质木船静止在静水面上，质量为 $m$ 的人站在船尾。忽略水对船的运动阻力，当人从船尾走到船头时，求船相对于静止水面（岸）移动的距离。

![人船模型初末状态与质心位移几何关系](/picture/zhi-xin-fa/zhi-xin-fa5.png)

#### 方法一：质心绝对坐标不变法（几何代数法）

以静止水面（岸）为惯性参考系，沿人运动的水平方向建立一维坐标轴 $x$。

1. **初态质心位置确定：**  
   设初始时船尾对应坐标原点 $x = 0$。
   * 均质木船长为 $L$，其几何中心（质量中心）坐标为 $x_M^{(1)} = \frac{L}{2}$；
   * 人立于船尾，其绝对坐标为 $x_m^{(1)} = 0$。  
   系统初始总质心坐标为：
   $$x_c^{(1)} = \frac{m x_m^{(1)} + M x_M^{(1)}}{m + M} = \frac{m \cdot 0 + M \cdot \frac{L}{2}}{m + M} = \frac{M L}{2(m + M)}$$

2. **末态质心位置建立：**  
   设人从船尾走到船头后，船体对地的代数位移为 $\Delta x_M$（设向右为正向）。此时：
   * 船身几何中心的对地新坐标为 $x_M^{(2)} = \frac{L}{2} + \Delta x_M$；
   * 人走至船头，其对地新坐标为 $x_m^{(2)} = L + \Delta x_M$。  
   系统末态总质心坐标为：
   $$x_c^{(2)} = \frac{m x_m^{(2)} + M x_M^{(2)}}{m + M} = \frac{m (L + \Delta x_M) + M \left(\frac{L}{2} + \Delta x_M\right)}{m + M}$$

3. **根据质心运动定理联立求解：**  
   由于人与船构成的系统在水平方向上不受任何外力（水阻力忽略），即 $F_{\text{ext}, x} = 0$。由质心运动定理：
   $$(M + m)\ddot{x}_c = 0 \implies v_c(t) = \text{常数}$$
   又因系统初态处于静止（$v_c(0) = 0$），质心在水平方向始终保持静止，空间绝对位置严格恒定：
   $$x_c^{(1)} \equiv x_c^{(2)}$$
   代入两态质心表达式：
   $$\frac{M L}{2(m + M)} = \frac{m (L + \Delta x_M) + M \left(\frac{L}{2} + \Delta x_M\right)}{m + M}$$
   两端消去公分母 $(m+M)$ 并展开：
   $$\frac{M L}{2} = m L + m \Delta x_M + \frac{M L}{2} + M \Delta x_M$$
   常数项 $\frac{M L}{2}$ 自然对消，整理得：
   $$(M + m)\Delta x_M + m L = 0 \implies \Delta x_M = -\frac{m}{M + m} L$$
   代数解中的负号表明，船体的实际移动方向与选定的 $x$ 轴正向相反（即与人的行进方向相反）。船相对于水面后退的实际距离为：
   $$s_{\text{船}} = |\Delta x_M| = \frac{m}{M + m} L$$

#### 方法二：动量守恒微元积分法（相对位移分解法）

1. **瞬时动量守恒与微元位移关联：**  
   以地面为惯性系，取水平向右为正方向。在人行走的任意瞬时 $t$，设人的对地瞬时速度为 $v_m(t)$，船的对地瞬时速度为 $v_M(t)$。  
   水平方向合外力为零，系统水平总动量在全过程中严格守恒：
   $$P_x(t) = m v_m(t) + M v_M(t) = 0$$
   在时间微元 $\mathrm{d}t$ 内，两物体发生的对地位移微元分别为 $\mathrm{d}x_m = v_m(t)\,\mathrm{d}t$ 和 $\mathrm{d}x_M = v_M(t)\,\mathrm{d}t$。上式两边同乘 $\mathrm{d}t$：
   $$m \,\mathrm{d}x_m + M \,\mathrm{d}x_M = 0$$
   在整个运动过程 $[0, t_{\text{end}}]$ 内对时间积分：
   $$m \int_0^{t_{\text{end}}} \mathrm{d}x_m + M \int_0^{t_{\text{end}}} \mathrm{d}x_M = 0 \implies m \Delta x_m + M \Delta x_M = 0$$
   此式表明：**对于初态静止且合外力为零的系统，各物体的质量与各自对地位移乘积的矢量和恒为零**（即质心总位移 $\Delta x_c \equiv 0$）。

2. **相对位移分解（伽利略位移变换）：**  
   人相对于船从船尾走到船头，其相对于船体的相对位移为向右的矢量，大小为船长：
   $$\Delta x_{m/M} = +L$$
   由经典运动学的位移合成定理（绝对位移等于相对位移与牵连位移的矢量和）：
   $$\Delta x_m = \Delta x_M + \Delta x_{m/M} = \Delta x_M + L$$

3. **代入求解：**  
   联立两式：
   $$M \Delta x_M + m (\Delta x_M + L) = 0 \implies (M + m)\Delta x_M = -m L$$
   解得船对地的位移为：
   $$\Delta x_M = -\frac{m}{M + m} L$$
   同时可直接求得人对地的实际向前净位移：
   $$\Delta x_m = \Delta x_M + L = -\frac{m}{M + m} L + L = \frac{M}{M + m} L$$

> **【教学图景与两种解法的本质对比】**
>
> * **方法一（质心绝对坐标不变法）：** 侧重于**状态量分析**。无需考虑中间过程的运动细节（加速、减速、停顿、回退），只要首末两态系统内各部分的几何构型确定，建立对地坐标直接令 $x_c^{(1)} = x_c^{(2)}$ 即可。正负号完全由代数方程自发判定，思维链条最短，不易因相对速度正负号混乱而发生教学笔误。
> * **方法二（微元位移积分法）：** 侧重于**过程量守恒**。物理图像更接近牛顿力学与冲量动量定理的本质：人蹬船的内力冲量 $\int f_{\text{内}}\,\mathrm{d}t$ 在两者之间严格对称传递。该方法普适性强，可直接推广至人行走过程中任意时刻 $t$ 的动力学轨迹追踪、变质量流体反冲、以及多物体相互作用系统（如人在两只船之间跳跃、斜面上滑块下滑）的位移分配问题。

---

### 例题 3：轻弹簧双物块相互作用 —— 相对振动与柯尼希定理

> **题目：** 物块 A（质量 $m$）和物块 B（质量 $M$）置于光滑水平面上。物块 A 左侧固连一处于原长 $L_0$ 的轻弹簧。$t=0$ 时，物块 B 以水平初速度 $v_0$ 向右接触弹簧（**B 与弹簧仅接触，无栓接**）。已知在 $t=2t_0$ 时刻，物块 B 与弹簧恰好分离。在压缩阶段前半段的 $t_0$ 时间内，物块 A 移动的对地位移测量值为 $s_A$。求：
> 1. 压缩过程中弹簧的最大压缩量 $\Delta x_m$；
> 2. 全过程中弹簧蓄积的最大弹性势能 $E_{p\max}$。

![轻弹簧双物块相互作用三阶段过程](/picture/zhi-xin-fa/zhi-xin-fa6.png)

![相对压缩量随时间变化曲线](/picture/zhi-xin-fa/zhi-xin-fa7.png)

**解析：**

**第 1 步：相对运动微分方程与动力学周期**
全系统水平动量守恒，质心速度恒定：
$$v_c = \frac{M v_0}{M + m}$$
设向右为 $x$ 轴正方向，初态弹簧原长为 $L_0$。物块 B 位于左侧，A 位于右侧，则两物块位置满足 $x_A - x_B \le L_0$。定义弹簧的实际**压缩形变量**为：
$$\Delta x(t) \equiv L_0 - [x_A(t) - x_B(t)] \ge 0$$
在压缩接触阶段，物块受弹力作用的牛顿第二定律方程为：
$$m \ddot{x}_A = +k \Delta x, \quad M \ddot{x}_B = -k \Delta x$$
对两式分别除以质量并相减，注意到 $\ddot{\Delta x} = \ddot{x}_B - \ddot{x}_A$：
$$\ddot{\Delta x} = \ddot{x}_B - \ddot{x}_A = -\left(\frac{1}{M} + \frac{1}{m}\right) k \Delta x = -\frac{k}{\mu} \Delta x$$
其中 $\mu = \frac{M m}{M + m}$ 为系统的约化质量。该方程为标准一维简谐振动微分方程，振动圆频率为 $\omega = \sqrt{\frac{k}{\mu}}$。
结合初态边界条件 $\Delta x(0) = 0$ 和初相对压缩速率 $\dot{\Delta x}(0) = \dot{x}_B(0) - \dot{x}_A(0) = v_0 - 0 = v_0$，其解析解为：
$$\Delta x(t) = \frac{v_0}{\omega} \sin(\omega t)$$
因物块 B 与弹簧未栓接，接触面不能承受拉应力。当弹簧再度恢复原长时（$\Delta x = 0$），接触弹力降为零，随后物块 A 速度大于物块 B，两者自然脱离接触。因此接触压缩时长 $2t_0$ 严格对应简谐振动的半个周期：
$$\omega \cdot (2t_0) = \pi \implies \omega = \frac{\pi}{2t_0}$$

**第 2 步：求解最大压缩量 $\Delta x_m$**
当 $\omega t = \frac{\pi}{2}$（即 $t = t_0$）时，相对速度 $\dot{\Delta x} = 0$，两物块达到瞬时共速 $v_A(t_0) = v_B(t_0) \equiv v_{\text{共}}$。由全系统水平动量守恒可知，该瞬时共速严格等于系统质心速度：
$$v_{\text{共}} \equiv v_c = \frac{M v_0}{M + m}$$
此时弹簧压缩量达到极大值：
$$\Delta x_m = \frac{v_0}{\omega} = \frac{2 v_0 t_0}{\pi}$$

**第 3 步：应用柯尼希定理确定最大弹性势能**
在共速瞬时，两物块在质心参考系中相对静止（相对速度均为零）。由柯尼希定理，系统在质心系中的初态资用动能全部转化为弹簧的弹性势能：
$$E_{p\max} = E_{k,\text{rel}}^{(0)} = \frac{1}{2}\mu v_0^2 = \frac{1}{2}\left(\frac{M m}{M + m}\right) v_0^2 = \frac{1}{2} m \left( \frac{M v_0}{M + m} \right) v_0 = \frac{1}{2} m v_c v_0$$

**第 4 步：通过物块 A 的对地位移反解 $v_c$**
由物块 A 的动力学微分方程：
$$m \ddot{x}_A = k \Delta x = \mu \omega^2 \cdot \frac{v_0}{\omega}\sin(\omega t) = \mu v_0 \omega \sin(\omega t)$$
注意到 $\mu v_0 = \left(\frac{Mm}{M+m}\right)v_0 = m v_c$，代入消去质量 $m$ 即得物块 A 的加速度与速度表达式：
$$\begin{aligned} \ddot{x}_A(t) &= v_c \omega \sin(\omega t) \\ v_A(t) &= \int_0^t v_c \omega \sin(\omega t') \,\mathrm{d}t' = v_c [1 - \cos(\omega t)] \end{aligned}$$
对速度函数在前半程区间 $[0, t_0]$ 进行定积分，求得测量位移 $s_A$：
$$\begin{aligned} s_A &= \int_{0}^{t_0} v_c [1 - \cos(\omega t)] \,\mathrm{d}t = v_c \left[ t - \frac{1}{\omega}\sin(\omega t) \right]_{0}^{t_0} \\ &= v_c \left( t_0 - \frac{2t_0}{\pi}\sin\frac{\pi}{2} \right) = v_c t_0 \left( \frac{\pi - 2}{\pi} \right) \end{aligned}$$
由此精确解出未知的质心速度：
$$v_c = \frac{\pi s_A}{(\pi - 2)t_0}$$
将 $v_c$ 代回最大弹性势能表达式，最终得到完全由测量量表示的蓄积能量：
$$E_{p\max} = \frac{1}{2} m v_c v_0 = \frac{\pi m v_0 s_A}{2(\pi - 2)t_0}$$