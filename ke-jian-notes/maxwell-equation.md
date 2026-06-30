---
title: 电磁现象的普遍规律
date: 2026-06-16
---

# 电荷和电场

## 库仑定律

库仑定律是描述静电现象的基本实验规律，其表述如下：在真空中，静止的点电荷 $Q$ 对另一个静止的点电荷 $Q'$ 的作用力 $\mathbf{F}$ 为

$$
\mathbf{F} = \frac{QQ'}{4\pi\varepsilon_{0}r^3}\mathbf{r}
$$

式中，$\mathbf{r}$ 是由源电荷 $Q$ 指向检验电荷 $Q'$ 的位置矢量，$\varepsilon_{0}$ 为真空介电常量。

根据近代理论，电荷间的相互作用并非“超距作用”，而是通过一种特殊的物质形态——电场来传递的。处于电场中的任何电荷都会受到电场力的作用。由库仑定律可知，处于电场中的电荷 $Q'$ 所受的力与其电荷量 $Q'$ 成正比。基于此，我们利用检验电荷所受的电场力来定义其所在位置 $\mathbf{x}$ 的电场强度 $\mathbf{E}(\mathbf{x})$。点电荷 $Q'$ 在电场 $\mathbf{E}$ 中所受的力 $\mathbf{F}$ 可写为

$$
\mathbf{F} = Q'\mathbf{E}
$$

由此，一个静止的点电荷 $Q$ 在空间中激发的电场强度为

$$
\mathbf{E} = \frac{Q\mathbf{r}}{4\pi\varepsilon_{0}r^3}
$$

实验表明，电场满足叠加原理，即多个点电荷共同激发的总电场，等于各个点电荷单独存在时所激发电场的矢量和。设由第 $i$ 个源电荷 $Q_{i}$ 指向空间观测点 $P$ 的矢径为 $\mathbf{r}_{i}$，则 $P$ 点的总场强为

$$
\mathbf{E} = \sum_{i}\frac{Q_{i}\mathbf{r}_{i}}{4\pi\varepsilon_{0}r_{i}^3}
$$

以上讨论针对的是离散点电荷系统。在许多宏观实际问题中，包含的电荷数量极其巨大，我们可以采用连续介质模型，将电荷视作连续分布于某一空间区域 $V$ 内。此时需要引入微积分的思想：假设在区域 $V$ 内某点 $\mathbf{x}'$ 处取一个微体积元 $\mathrm{d}V'$，该体积元内所含的微电荷量 $\mathrm{d}Q$ 等于该点处的体电荷密度 $\rho(\mathbf{x}')$ 乘以体积 $\mathrm{d}V'$：

$$
\mathrm{d}Q = \rho(\mathbf{x}')\mathrm{d}V'
$$

![连续分布带电体的场强](/picture/maxwell-equation/maxwell-equation1.png)

设由源点 $\mathbf{x}'$ 到场点 $\mathbf{x}$ 的矢径为 $\mathbf{r}$，根据叠加原理，连续电荷分布在场点激发的总电场强度 $\mathbf{E}(\mathbf{x})$ 为

$$
\mathbf{E}(\mathbf{x}) = \int_{V}\frac{\rho(\mathbf{x}')\mathbf{r}}{4\pi\varepsilon_{0}r^3}\mathrm{d}V'
$$

## 高斯定理

高斯定理是麦克斯韦方程组的第一条方程，描述的是电场通量与源电荷之间的局域映射关系。

首先引入电通量的概念。设 $S$ 表示包围着电荷 $Q$ 的一个闭合曲面，$\mathrm{d}\mathbf{S}$ 为 $S$ 上的微小面元矢量，以外法线方向为正方向。通过闭合曲面 $S$ 的电场强度 $\mathbf{E}$ 的通量定义为面积分：

$$
\oint_{S} \mathbf{E} \cdot \mathrm{d}\mathbf{S}
$$

而高斯定理指出，电场 $\mathbf{E}$ 的总电通量等于该闭合曲面所包围的电荷量总和除以真空介电常量，即：

$$
\oint_{S} \mathbf{E} \cdot \mathrm{d}\mathbf{S} = \frac{Q}{\varepsilon_{0}}
$$

如果电荷处于闭合曲面外部，则它发出的电场线穿入该曲面后必然再次穿出，因而对该闭合曲面的总电通量没有贡献。在一般情况下，设空间中有多个离散电荷 $Q_{i}$，则 $\mathbf{E}$ 通过任一闭合曲面 $S$ 的总通量仅取决于 $S$ 内部的总电荷，而与 $S$ 外部的电荷无关：

$$
\oint_{S} \mathbf{E} \cdot \mathrm{d}\mathbf{S} = \frac{1}{\varepsilon_{0}}\sum_{i \in S} Q_{i}
$$

如果电荷连续分布于空间中，则高斯定理的积分形式表述为：

$$
\oint_{S} \mathbf{E} \cdot \mathrm{d}\mathbf{S} = \frac{1}{\varepsilon_{0}}\int_{V} \rho(\mathbf{x}) \mathrm{d}V
$$

为了求出电场和电荷在局域无穷小区域内的微分关系，应用高斯散度定理，可以得到高斯定理的微分形式：

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_{0}}
$$

这就是静电场的一个基本微分方程。上式指出，电荷是电场的源，电场线从正电荷发出而终止于负电荷。在没有电荷分布的空间区域，$\rho(\mathbf{x}) = 0$，因而在该点上 $\nabla \cdot \mathbf{E} = 0$。这表示该处既没有电场线的汇，也没有电场线的源，电场线连续地通过该区域。

## 静电场的旋度

散度描述了矢量场的通量源汇性质，但要完全确定一个矢量场，还需要给出其旋度，以反映场的环流特征。麦克斯韦方程组中关于电场的第二个方程，揭示的正是电场的环流性质。

在静电场中，试探电荷受到的静电力是一种保守力，即静电力做功与路径无关。电荷沿任意闭合回路运动一周，静电力做的总功恒为零。若取试探电荷的电荷量为一个单位正电荷，这一保守性质便体现为静电场强 $\mathbf{E}$ 沿任意闭合回路 $L$ 的环路积分（即环量）恒为零：

$$
\oint_{L} \mathbf{E} \cdot \mathrm{d}\mathbf{l} = 0
$$

![点电荷的环路积分](/picture/maxwell-equation/maxwell-equation2.png)

这一结论可以通过单个静止点电荷 $Q$ 激发的电场直接证明：

$$
\oint_{L} \mathbf{E} \cdot \mathrm{d}\mathbf{l} = \frac{Q}{4\pi\varepsilon_{0}} \oint_{L} \frac{\mathbf{r}}{r^3} \cdot \mathrm{d}\mathbf{l}
$$

设位移微元 $\mathrm{d}\mathbf{l}$ 与空间矢径 $\mathbf{r}$ 的夹角为 $\theta$，则 $\mathbf{r} \cdot \mathrm{d}\mathbf{l} = r \mathrm{d}l \cos \theta = r \mathrm{d}r$，因而上式可化为：

$$
\oint_{L} \mathbf{E} \cdot \mathrm{d}\mathbf{l} = \frac{Q}{4\pi\varepsilon_{0}} \oint_{L} \frac{\mathrm{d}r}{r^2} = -\frac{Q}{4\pi\varepsilon_{0}} \oint_{L} \mathrm{d}\left(\frac{1}{r}\right)
$$

由于被积函数是一个全微分，当积分点绕闭合回路 $L$ 一周回到原处时，空间坐标未变，标量函数 $1/r$ 亦回到原值。因此，全微分沿闭合回路的积分恒为零：

$$
\oint_{L} \mathbf{E} \cdot \mathrm{d}\mathbf{l} = 0
$$

根据电场的叠加原理，这一结论可以完美推广到任意静止电荷分布产生的总静电场中。

根据斯托克斯定理（Stokes' theorem），上述积分形式对应的微分形式为：

$$
\nabla \times \mathbf{E} = 0
$$

这说明静电场具有无旋性。需要强调的是，电场的无旋性仅在静电情况下成立。在普遍情况下（如存在随时间变化的磁场时），变化磁场激发的感生电场是有旋的。因此，这并不是电场方程的完整形态，我们将在后续引入法拉第电磁感应定律进行修正。

总结静电场的物理图像：电荷是静电场的源（有源场），电场线从正电荷发出而终止于负电荷；在静电情形下，电场线绝不闭合（无旋场）。

---

# 磁场

## 毕奥-萨伐尔定律

在讨论了描述静电场的两个基本方程之后，我们将目光转向静磁场。首先，我们引入描述稳恒电流激发磁场的基本实验规律——毕奥-萨伐尔定律（Biot-Savart Law）。

历史上，人们最早通过天然磁体认识了磁现象。随着近代物理学的发展，我们认识到天然磁体的磁性本质上来源于原子内部微观粒子运动所形成的“分子电流”。因此，宏观稳恒电流是产生恒定磁场的根本源泉。毕奥-萨伐尔定律正是定量描述稳恒电流与其所激发的磁场之间关系的宏观基本定律。

设 $\mathbf{J}(\mathbf{x}')$ 为源点 $\mathbf{x}'$ 处的体电流密度矢量，$\mathbf{r}$ 为由源点 $\mathbf{x}'$ 指向场点 $\mathbf{x}$ 的矢径，则场点 $\mathbf{x}$ 处的磁感应强度 $\mathbf{B}(\mathbf{x})$ 为：

$$
\mathbf{B}(\mathbf{x}) = \frac{\mu_{0}}{4\pi} \int_{V} \frac{\mathbf{J}(\mathbf{x}') \times \mathbf{r}}{r^3} \mathrm{d}V'
$$

式中，$\mu_{0}$ 为真空磁导率，积分遍历整个电流分布区域 $V$。

如果电流集中分布于细导线内，以 $\mathrm{d}\mathbf{l}$ 表示沿着闭合回路 $L$ 的线元矢量，$\mathrm{d}S_{\perp}$ 为导线的横截面元。由于电流元可以等效表示为 $\mathbf{J}\mathrm{d}V' = \mathbf{J}\mathrm{d}S_{\perp}\mathrm{d}l = J\mathrm{d}S_{\perp}\mathrm{d}\mathbf{l} = I\mathrm{d}\mathbf{l}$，在导线横截面上进行积分后即可得到 $I\mathrm{d}\mathbf{l}$。因此，细导线上恒定电流 $I$ 激发磁场的毕奥-萨伐尔定律可写为：

$$
\mathbf{B}(\mathbf{x}) = \frac{\mu_{0}I}{4\pi} \oint_{L} \frac{\mathrm{d}\mathbf{l} \times \mathbf{r}}{r^3}
$$

### 利用毕奥-萨伐尔定律求解圆形载流导线的磁场

![圆形载流导线](/picture/maxwell-equation/maxwell-equation3.png)

此处以求解通有恒定电流的圆形载流导线轴线上的磁场为例。根据毕奥-萨伐尔定律，电流微元在空间任意一点产生的磁感应强度 $\mathrm{d}\mathbf{B}$，其方向由电流微元矢量 $\mathrm{d}\mathbf{l}$ 与从微元指向该点的单位位置矢量 $\mathbf{e}_r$ 的叉乘决定。

如上图所示，C处的电流微元在P点产生的磁场方向垂直于由位置矢量 $\mathbf{r}$（即PC连线）与过C点的导线切线所构成的平面，即图中的 $\mathrm{d}\mathbf{B}$ 方向。该电流微元产生的磁场 $\mathrm{d}\mathbf{B}$ 可以分解为平行于圆环轴线的分量 $\mathrm{d}B_{\parallel}$ 和垂直于轴线的分量 $\mathrm{d}B_{\perp}$。

在计算整个圆形导线产生的总磁场时，由于几何对称性，各个微元产生的垂直于轴线的分量 $\mathrm{d}B_{\perp}$ 积分后相互抵消，总贡献为 0，仅保留沿轴线方向的分量 $\mathrm{d}B_{\parallel}$（其中 $\cos\alpha = \frac{R}{\sqrt{R^2+a^2}}$，$\alpha$ 为 $\mathrm{d}\mathbf{B}$ 与轴线的夹角）。因此有：

$$
\begin{aligned}
\mathrm{d}\mathbf{B} &= \frac{\mu_{0}I}{4\pi} \frac{\mathrm{d}\mathbf{l} \times \mathbf{e}_r}{r^2} \\
\mathrm{d}B_{\parallel} &= \frac{\mu_{0}I\cos\alpha \, \mathrm{d}l}{4\pi (R^2+a^2)} \\
B_{\parallel} &= \int_{0}^{2\pi R}\frac{\mu_{0}IR \, \mathrm{d}l}{4\pi (R^2+a^2)^{3/2}}\\
B_{\parallel} &=\frac{\mu_{0} IR^2}{2(a^2+R^2)^{3/2}}
\end{aligned}
$$

### 利用毕奥-萨伐尔定律求解长直载流导线的磁场

![长直载流导线磁场分析](/picture/maxwell-equation/maxwell-equation4.png)

接下来考虑长直导线产生的磁场。如图所示，假设电流沿着竖直向上的方向。根据毕奥-萨伐尔定律，空间内P处的磁场方向应当垂直于由导线轴线与连线PO所构成的平面，即沿过P点的切线方向（垂直纸面向里）。为便于定量计算，求解与导线垂直距离为 $a$ 的P点处的磁场。

如图所示，以垂足O为原点，沿电流方向建立坐标轴。设电流微元 $\mathrm{d}l$ 到原点O的距离为 $l$，电流微元指向P点的位移矢量与电流正方向的夹角为 $\theta$。由几何关系可知：

$$
\begin{aligned}
l &= -a \cot\theta \\
\mathrm{d}l &= a \csc^2\theta \mathrm{d}\theta = \frac{a}{\sin^2\theta} \mathrm{d}\theta
\end{aligned}
$$

根据毕奥-萨伐尔定律的标量形式，电流微元在P点产生的磁感应强度大小为：

$$
\mathrm{d}B = \frac{\mu_{0}I \sin\theta \mathrm{d}l}{4\pi r^2}
$$

将 $r = \frac{a}{\sin\theta}$ 和 $\mathrm{d}l$ 的表达式代入上式，可将积分变量统一为角度 $\theta$：

$$
\mathrm{d}B = \frac{\mu_{0}I \sin\theta}{4\pi \left(\frac{a}{\sin\theta}\right)^2} \cdot \frac{a}{\sin^2\theta} \mathrm{d}\theta = \frac{\mu_{0}I}{4\pi a} \sin\theta \mathrm{d}\theta
$$

对整条导线进行积分，设导线两端对应的角度分别为 $\theta_{1}$ 和 $\theta_{2}$，则总磁场为：

$$
B = \int_{\theta_{1}}^{\theta_{2}} \frac{\mu_{0}I}{4\pi a} \sin\theta \mathrm{d}\theta = \frac{\mu_{0}I}{4\pi a} (\cos\theta_{1} - \cos\theta_{2})
$$

其中 $\theta_{1}$ 和 $\theta_{2}$ 分别对应于积分的下限和上限：

* 当 $\theta_{1} = 0$, $\theta_{2} = \pi/2$ 时，对应半无限长导线，积分结果为：
  $$
  B = \frac{\mu_{0}I}{4\pi a}
  $$
* 当 $\theta_{1} = 0$, $\theta_{2} = \pi$ 时，对应无限长导线，积分结果为：
  $$
  B = \frac{\mu_{0}I}{2\pi a}
  $$

## 安培环路定理

安培环路定理描述了稳恒磁场中，磁感应强度 $\mathbf{B}$ 沿任意闭合路径的线积分（即磁场环量）与穿过由该闭合路径所包围曲面的传导电流代数和 $I$ 之间的关系。其具体数学表达式为：

$$
\oint_{L} \mathbf{B} \cdot \mathrm{d}\mathbf{l} = \mu_{0}I
$$

式中，$L$ 为任一闭合曲线，$I$ 为穿过 $L$ 所围曲面的总电流，$\mu_{0}$ 为真空磁导率。

为了直观验证该定理，我们以无限长直载流导线产生的磁场为例进行考察。

![无限长直载流导线磁场环量](/picture/maxwell-equation/maxwell-equation6.png)

在前文中我们已经推导出，无限长直导线在距离为 $r$ 处产生的磁感应强度大小为：

$$
B = \frac{\mu_{0}I}{2\pi r}
$$

磁感线的方向为以导线为轴的同心圆。若选取一个半径为 $r$ 的同心圆作为积分回路 $L$，且积分方向与磁场方向一致，则磁场环量为：

$$
\oint_{L} \mathbf{B} \cdot \mathrm{d}\mathbf{l} = \oint_{L} B \, \mathrm{d}l = \frac{\mu_{0}I}{2\pi r} \cdot 2\pi r = \mu_{0} I
$$

结论与安培环路定理完全相符。

如果所选的闭合曲线内没有包围电流，例如图中的环路 PQRSP，可以证明沿此回路的磁场环量严格为零。事实上，沿该回路的积分可分为四段计算。对于沿径向的 SP 段 and QR 段，由于 $\mathbf{B}$ 的方向与路径微元 $\mathrm{d}\mathbf{l}$ 始终正交（点积为零），因此这两段的积分为零。设圆弧 PQ 的半径为 $r_2$，弧长为 $l_2$；圆弧 RS 的半径为 $r_1$，弧长为 $l_1$。考虑积分方向，沿这两段圆弧的积分之和为：

$$
\int_{PQ} \mathbf{B} \cdot \mathrm{d}\mathbf{l} + \int_{RS} \mathbf{B} \cdot \mathrm{d}\mathbf{l} = \frac{\mu_{0}I}{2\pi r_2}l_2 - \frac{\mu_{0}I}{2\pi r_1}l_1
$$

根据几何相似关系可知，两段圆弧所对的圆心角相等（设为 $\Delta\theta$），即 $l_2/r_2 = l_1/r_1 = \Delta\theta$。因此，上式的结果必然为 0。由此证明，对于未包围电流的闭合回路 PQRSP，其磁场环量为零。

在稳恒电流场中，安培环路定理的微分形式为：

$$
\nabla \times \mathbf{B} = \mu_{0}\mathbf{J}
$$

式中，$\nabla$ 为哈密顿（Nabla）算子，$\mathbf{J}$ 为传导电流密度。上式是恒定磁场理论的核心微分方程。

### 定理的适用性危机与麦克斯韦全电流定律

需要指出的是，原版安培环路定理仅适用于**稳恒电流场**（即满足 $\nabla \cdot \mathbf{J} = 0$）。当我们引入非稳恒状态时，例如空间中仅存在一根半无限长载流导线，该定理会出现适用性危机。

前文中推导过，半无限长直导线在端点平面的磁场分布为：

$$
B = \frac{\mu_0 I}{4\pi r}
$$

若以此为基础，选取一个包围导线端点截面的积分回路，此时的磁场环量计算结果将不再等于 $\mu_0 I$。这一悖论的物理根源在于系统偏离了稳恒状态：当传导电流 $I$ 从无限远处流至导线端点（假设为原点）时，由于电路截断，电荷必将在端点处不断堆积。端点电荷量 $q$随时间不断增加（满足电荷守恒 $\mathrm{d}q/\mathrm{d}t = I$），进而在周围空间激发一个随时间动态增强的电场 $\mathbf{E}$。由于 $\partial \mathbf{E} / \partial t \neq 0$，原版的静磁学安培环路定理在此完全失效。

为了解决这种“传导电流不闭合”导致的理论矛盾，麦克斯韦（James Clerk Maxwell）对安培环路定理进行了著名的推广，引入了**位移电流**（Displacement Current）的概念。麦克斯韦提出，随时间变化的电场在激发磁场方面等效于一种空间电流，其位移电流密度 $\mathbf{J}_d$ 定义为：

$$
\mathbf{J}_d = \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

由此，修正后的安培-麦克斯韦定律（全电流定律）可表述为：

$$
\oint_{L} \mathbf{B} \cdot \mathrm{d}\mathbf{l} = \mu_0 \int_{S} \left( \mathbf{J} + \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t} \right) \cdot \mathrm{d}\mathbf{S} = \mu_0 (I_{\text{传导}} + I_{\text{位移}})
$$

在全电流定律的普适框架下，上述半无限长导线模型的悖论得以完美消除。虽然传导电流 $I_{\text{传导}}$ 确实在导线端点处中断，但端点堆积电荷产生的时变电场向四周辐射出了等效的位移电流 $I_{\text{位移}}$。传导电流与位移电流在空间中共同构成了一个绝对闭合的“全电流”回路，从而保证了电磁场方程在任何情况下的自洽性。

### 利用半无限长导线反推位移电流的解析表达式

为了定量证明全电流定律的自洽性，我们尝试直接计算半无限长导线端点处的位移电流，并验证其是否与磁场环量严格匹配。

**1. 建立物理与几何模型**

设一根半无限长直导线沿 $z$ 轴负半轴放置（$z \in (-\infty, 0]$），通有恒定大小的电流 $I$，电流方向沿 $z$ 轴正方向（指向原点）。此时，电荷以速率 $\mathrm{d}q/\mathrm{d}t = I$ 在原点 $O(0,0,0)$ 处不断堆积，原点处的电荷量 $q(t) = I t$。

我们在 $xy$ 平面（$z=0$）上，以原点为圆心，选取一个半径为 $R$ 的圆作为安培环路 $L$。规定环路积分方向为逆时针（与 $+z$ 轴满足右手螺旋法则）。

**2. 计算左式：磁场环量**

根据前文推导，半无限长导线在 $z=0$ 平面上距离原点 $R$ 处的磁感应强度大小为：

$$
B = \frac{\mu_0 I}{4\pi R}
$$

由于 $\mathbf{B}$ 始终与环路 $\mathrm{d}\mathbf{l}$ 平行，沿闭合回路 $L$ 的磁场环量（即定律等式左边）为：

$$
\oint_{L} \mathbf{B} \cdot \mathrm{d}\mathbf{l} = B \cdot 2\pi R = \frac{\mu_0 I}{4\pi R} \cdot 2\pi R = \frac{\mu_0 I}{2}
$$

这就要求等式右边的总电流 $\mu_0 (I_{\text{传导}} + I_{\text{位移}})$ 必须严格等于 $\mu_0 I / 2$。

**3. 计算右式：位移电流的精准补偿**

以环路 $L$ 为边界，我们可以任意选取一个曲面 $S$ 来计算穿过的电流。我们分别考察两种极端情况，以展现麦克斯韦方程组的拓扑不变性：

**情形一：选取上半球面 $S_1$（$z > 0$ 区域）**

该曲面在导线上方，因此**穿过该曲面的传导电流 $I_{\text{传导}} = 0$**。全电流完全由位移电流贡献。原点处的累积电荷 $q$ 在空间产生径向向外的库仑电场：

$$
\mathbf{E} = \frac{q}{4\pi \varepsilon_0 r^2} \mathbf{e}_r
$$

根据高斯定理，点电荷穿过整个封闭球面的电通量为 $q/\varepsilon_0$。由于 $S_1$ 是精确的半个球面，且曲面法向量向外（符合右手定则），穿过 $S_1$ 的电通量 $\Phi_{E}$ 为：

$$
\Phi_{E} = \frac{q}{2\varepsilon_0}
$$

根据麦克斯韦的定义，穿过 $S_1$ 的位移电流为：

$$
I_{\text{位移}} = \varepsilon_0 \frac{\mathrm{d}\Phi_{E}}{\mathrm{d}t} = \varepsilon_0 \left( \frac{1}{2\varepsilon_0} \frac{\mathrm{d}q}{\mathrm{d}t} \right) = \frac{1}{2} \frac{\mathrm{d}q}{\mathrm{d}t} = \frac{I}{2}
$$

总电流 $I_{\text{全}} = I_{\text{传导}} + I_{\text{位移}} = 0 + I/2 = I/2$。左右两边完美相等！

**情形二：选取下半球面 $S_2$（$z < 0$ 区域）**

该曲面包围了导线本身。导线从无限远处穿破了 $S_2$ 表面进入内部，因此**穿过该曲面的传导电流 $I_{\text{传导}} = I$**。
根据与环路 $L$ 匹配的右手螺旋定则，此时曲面 $S_2$ 的正法线方向指向原点（即电场线的反方向）。因此，穿过 $S_2$ 的电通量为负值：

$$
\Phi_{E} = -\frac{q}{2\varepsilon_0}
$$

对应的位移电流变为负值：

$$
I_{\text{位移}} = \varepsilon_0 \frac{\mathrm{d}\Phi_{E}}{\mathrm{d}t} = -\frac{1}{2} \frac{\mathrm{d}q}{\mathrm{d}t} = -\frac{I}{2}
$$

总电流 $I_{\text{全}} = I_{\text{传导}} + I_{\text{位移}} = I - I/2 = I/2$。左右两边依然完美相等！

**结论：**

上述严格的解析推导表明，麦克斯韦引入的位移电流在数学结构上是极其自洽的。无论选取哪个积分曲面，端点电荷激发的变化电场产生的位移电流，都像“拼图”一样，精准地弥补了传导电流的缺失，确保了电磁场环路定理的绝对成立。

## 磁场的高斯定理

前面我们已经知道，静电场是有源无旋的，而恒定磁场是有旋的，即沿某一闭合回路的环量不一定为 0。那么磁场是否有源呢？我们知道，由电流激发的磁感应线总是闭合曲线。因此，磁感应强度 $\mathbf{B}$ 是无源场。表示 $\mathbf{B}$ 无源性的积分形式是 $\mathbf{B}$ 对任何闭合曲面的总通量为零：

$$
\oint_{S} \mathbf{B} \cdot \mathrm{d}\mathbf{S} = 0
$$

微分形式为：

$$
\nabla \cdot \mathbf{B} = 0
$$

$\mathbf{B}$ 的无源性也可以由毕奥-萨伐尔定律直接证明。这里我们把它作为磁场分布的一条基本规律引入。由电流所激发的磁场都是无源的。但是，自然界中是否存在与电荷相对应的磁荷作为磁场的源呢？如果磁荷存在的话，和电荷作为电场的源一样，磁荷也将作为磁场的源，这时一般来说 $\nabla \cdot \mathbf{B} \neq 0$。

近年来对于磁单极子（孤立的磁荷）存在的可能性有不少讨论，实验上也一直在寻找带有磁荷的粒子。但是，到现在还没有任何关于磁单极子存在的确实证据。因此，在假定磁荷不存在的前提下，我们可以把上式作为磁场的一条基本规律。基于此，目前给出的安培环路定理和磁场的高斯定理构成了恒定磁场的基本微分方程。

---

# 麦克斯韦方程组

以上章节由实验定律总结了恒定电磁场的基本规律。随着交变电流的研究和广泛应用，人们对电磁场的认识有了一个飞跃。由实验发现，不但电荷激发电场，电流激发磁场，而且变化着的电场和磁场可以互相激发，电场和磁场成为了一个统一的整体——电磁场。和恒定场相比，变化电磁场的新规律主要是：

1. 变化磁场激发电场（法拉第电磁感应定律）；
2. 变化电场激发磁场（麦克斯韦位移电流假设）。

现在我们来详细讨论这两个核心规律。

## 电磁感应定律

1831年，法拉第发现当磁场发生变化时，附近的闭合线圈中有电流通过，并由此总结出了电磁感应定律：闭合线圈中的感应电动势与通过该线圈内部的磁通量变化率成正比。

设 $L$ 为闭合线圈，$S$ 为 $L$ 所围成的一个曲面，$\mathrm{d}\mathbf{S}$ 为 $S$ 上的一个面元矢量。按照惯例，我们规定 $L$ 的围绕方向与 $\mathrm{d}\mathbf{S}$ 的法线方向成右手螺旋关系。由实验测定，当通过 $S$ 的磁通量增加时，在线圈 $L$ 上的感应电动势 $\mathcal{E}$ 与我们规定的 $L$ 围绕方向相反，因此用负号表示。电磁感应定律表述为：

$$
\mathcal{E} = -\frac{\mathrm{d}}{\mathrm{d}t}\int_{S}\mathbf{B} \cdot \mathrm{d}\mathbf{S}
$$

线圈上的电荷是直接受到该处电场作用而运动的，线圈上有感应电流就表明空间中存在着电场。因此，电磁感应现象的实质是变化磁场在其周围空间中激发了电场，这是电场和磁场内部相互作用的一个方面。

感应电动势是电场强度沿闭合回路的线积分，因此电磁感应定律公式可写为：

$$
\oint_{L}\mathbf{E} \cdot \mathrm{d}\mathbf{l} = -\frac{\mathrm{d}}{\mathrm{d}t}\int_{S}\mathbf{B} \cdot \mathrm{d}\mathbf{S}
$$

若回路 $L$ 是空间中的一条固定回路，则上式可写为：

$$
\oint_{L}\mathbf{E} \cdot \mathrm{d}\mathbf{l} = -\int_{S}\frac{\partial\mathbf{B}}{\partial t} \cdot \mathrm{d}\mathbf{S}
$$

根据斯托克斯定理，其微分形式为：

$$
\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}
$$

之前我们说过静电场是无旋的，但是随时间变化的磁场激发的感生电场是有旋的。因此，在考虑感生电场之后，更为一般的电场旋度方程需要进行如上改造。

## 位移电流与电流连续性方程

在详细展开位移电流之前，我们先补充引入电流连续性方程。电流的定义是单位时间内通过某一截面的电荷量。很多情况下，我们不但要知道总电流，而且要知道电流在导体内是怎样分布的。例如直流电通过一根导线时，在导线截面上电流是均匀分布的；但是高频交流电通过同一根导线时，电流在截面上不再是均匀分布，而是几乎集中到导线表面上（即趋肤效应）。因此，我们必须引入电流密度矢量 $\mathbf{J}$ 来描述电流的分布情况。简单来说，电流密度 $\mathbf{J}$ 的定义为单位时间内垂直通过单位面积的电荷量。

![电流连续性方程](/picture/maxwell-equation/maxwell-equation7.png)

考虑空间中一确定区域 $V$，其边界为闭合曲面 $S$。当物质运动时，可能有电荷进入或流出该区域。根据电荷守恒定律，如果有电荷从该区域流出的话，区域 $V$ 内的电荷必然减小。通过界面流出的总电流应该等于 $V$ 内的电荷减小率，即：

$$
\oint_{S}\mathbf{J} \cdot \mathrm{d}\mathbf{S} = -\int_{V}\frac{\partial\rho}{\partial t}\mathrm{d}V
$$

这是电荷守恒定律的积分形式。应用高斯散度定理把面积分变为体积分：

$$
\int_{V}\nabla \cdot \mathbf{J} \, \mathrm{d}V = -\int_{V}\frac{\partial\rho}{\partial t}\mathrm{d}V
$$

于是得到微分形式：

$$
\nabla \cdot \mathbf{J} + \frac{\partial \rho}{\partial t} = 0
$$

上式称为电流连续性方程，它是电荷守恒定律的微分形式。 对于闭合的恒定电流，由于电荷分布不随时间改变，有：

$$
\nabla \cdot \mathbf{J} = 0
$$

在交变（非恒定）情况下，电流分布由电荷守恒定律制约，它一般不再是闭合的。例如带有电容器的电路实质上是非闭合的回路。在电容器两极板之间是绝缘介质，自由电子不能通过。电荷运动到板上时，由于不能穿过介质，就在板上积聚起来。在交流电路中，电容器交替地充电和放电，但在两板之间的介质内始终没有传导电流通过。所以，传导电流 $\mathbf{J}$ 在该处实际上是中断的。一般来说，在非恒定情况下，由电荷守恒定律有：

$$
\nabla \cdot \mathbf{J} = -\frac{\partial\rho}{\partial t} \neq 0
$$

注意到传统的安培环路定理微分形式为：

$$
\nabla \times \mathbf{B} = \mu_{0}\mathbf{J}
$$

上式两边取散度，左边根据数学恒等式恒为 0，但右边在非恒定电流情况下 $\nabla \cdot \mathbf{J} \neq 0$。因此，非恒定电流情况下安培环路定理与电荷守恒定律会产生尖锐的逻辑矛盾。由于电荷守恒定律是精确的普遍规律，安培环路定理仅是根据恒定情况下的实验定律导出的特殊规律，在两者发生矛盾的情形下，我们应该修改安培环路定理，使它服从普遍的电荷守恒定律的要求。

推广的一个方案是假设存在一个称为位移电流的物理量 $\mathbf{J}_D$，它和传导电流 $\mathbf{J}$ 合起来构成闭合的量，即满足：

$$
\nabla \cdot (\mathbf{J} + \mathbf{J}_D) = 0
$$

并假设位移电流 $\mathbf{J}_D$ 与传导电流一样产生磁效应：

$$
\nabla \times \mathbf{B} = \mu_{0}(\mathbf{J} + \mathbf{J}_D)
$$

此式两边的散度都等于零，因而理论上就不再有矛盾。注意到电荷守恒定律以及电荷密度 $\rho$ 与电场散度的关系式（静电场高斯定理）：

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_{0}}
$$

代入连续性方程可得：

$$
\nabla \cdot \left(\mathbf{J} + \varepsilon_{0}\frac{\partial \mathbf{E}}{\partial t}\right) = 0
$$

于是我们得到了位移电流 $\mathbf{J}_D$ 的一个最自然的表达式：

$$
\mathbf{J}_D = \varepsilon_{0}\frac{\partial \mathbf{E}}{\partial t}
$$

从数学上来说，单由电流密度散度为 0 是不能唯一确定 $\mathbf{J}_D$ 的。但从物理上考虑，上式的位移电流表达式是满足条件的最简单的物理量，而且既然变化磁场能激发电场，则变化电场激发磁场也是非常对称且合理的假设。根据上式，位移电流的实质上是电场的变化率，它是麦克斯韦 (Maxwell) 首先引入的。位移电流假设的正确性由以后关于电磁波的广泛实践所完全证实。

## 麦克斯韦方程组的完整形态

至此，我们已经把电磁学中最基本的实验定律概括、总结和提高到了一组在一般情况下互相协调的方程组。这组方程称为麦克斯韦方程组，它完整反映了普遍情况下电荷、电流激发电磁场以及电磁场内部运动的规律。

以下给出真空环境下的麦克斯韦方程组完整形式：

### 微分形式

$$
\begin{aligned}
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_{0}\left(\mathbf{J} + \varepsilon_{0}\frac{\partial \mathbf{E}}{\partial t}\right) \\
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_{0}} \\
\nabla \cdot \mathbf{B} &= 0
\end{aligned}
$$

### 积分形式

$$
\begin{aligned}
\oint_{L} \mathbf{E} \cdot \mathrm{d}\mathbf{l} &= -\int_{S} \frac{\partial \mathbf{B}}{\partial t} \cdot \mathrm{d}\mathbf{S} \\
\oint_{L} \mathbf{B} \cdot \mathrm{d}\mathbf{l} &= \mu_{0} \int_{S} \left( \mathbf{J} + \varepsilon_{0}\frac{\partial \mathbf{E}}{\partial t} \right) \cdot \mathrm{d}\mathbf{S} \\
\oint_{S} \mathbf{E} \cdot \mathrm{d}\mathbf{S} &= \frac{1}{\varepsilon_{0}} \int_{V} \rho \, \mathrm{d}V \\
\oint_{S} \mathbf{B} \cdot \mathrm{d}\mathbf{S} &= 0
\end{aligned}
$$

在电荷密度 $\rho$ 和传导电流 $\mathbf{J}$ 为零的自由空间（真空区域），电场和磁场通过本身的互相激发而独立运动传播。变化的磁场产生有旋电场，变化的电场产生有旋磁场，这种电磁场的相互激发是它能够脱离电荷和电流而独立存在和运动的主要驱动力。

只要某处发生电磁扰动，由于电磁场互相激发，它就会在空间中交替运动传播，形成**电磁波**。麦克斯韦首先从这组方程组在理论上预言了电磁波的存在，并指出光波就是一种特定频段的电磁波。以后的赫兹 (Hertz) 实验和近代无线电的广泛实践完全证实了麦克斯韦方程组的至高正确性。

麦氏方程组不仅揭示了电磁场的运动规律，更深刻地揭示了电磁场可以独立于源之外作为一种物质形态而存在，这极大地加深了我们对电磁场物质性的认识。在后续的讨论中，我们还将进一步探讨电磁场的能量与动量等物理属性。需要指出的是，上述方程组是真空环境下的表述，如果考虑到介质内部的极化和磁化效应时，还需要引入介质方程做进一步的宏观扩展。