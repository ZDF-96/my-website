---
title: 电磁现象的普遍规律
date: 2026-06-16
---
## 电荷和电场

### 库仑定律

库仑定律是描述静电现象的基本实验规律，其表述如下：在真空中，静止的点电荷$Q$对另一个静止的点电荷$Q'$的作用力$\mathbf{F}$为

$$
\mathbf{F} = \frac{QQ'}{4\pi\epsilon_{0}r^3}\mathbf{r}
$$

式中，$\mathbf{r}$是由源电荷$Q$指向检验电荷$Q'$的位置矢量，$\epsilon_{0}$为真空介电常量。

根据近代理论，电荷间的相互作用并非“超距作用”，而是通过一种特殊的物质形态——电场来传递的。处于电场中的任何电荷都会受到电场力的作用。由库仑定律可知，处于电场中的电荷$Q'$所受的力与其电荷量$Q'$成正比。基于此，我们利用检验电荷所受的电场力来定义其所在位置$\mathbf{x}$的电场强度$\mathbf{E}(\mathbf{x})$。点电荷$Q'$在电场$\mathbf{E}$中所受的力$\mathbf{F}$可写为

$$
\mathbf{F} = Q'\mathbf{E}
$$

由此，一个静止的点电荷$Q$在空间中激发的电场强度为

$$
\mathbf{E} = \frac{Q\mathbf{r}}{4\pi\epsilon_{0}r^3}
$$

实验表明，电场满足叠加原理，即多个点电荷共同激发的总电场，等于各个点电荷单独存在时所激发电场的矢量和。设由第$i$个源电荷$Q_{i}$指向空间观测点$P$的矢径为$\mathbf{r}_{i}$，则$P$点的总场强为

$$
\mathbf{E} = \sum_{i}\frac{Q_{i}\mathbf{r}_{i}}{4\pi\epsilon_{0}r_{i}^3}
$$

以上讨论针对的是离散点电荷系统。在许多宏观实际问题中，包含的电荷数量极其巨大，我们可以采用连续介质模型，将电荷视作连续分布于某一空间区域$V$内。此时需要引入微积分的思想：假设在区域$V$内某点$\mathbf{x}'$处取一个微体积元$\mathrm{d}V'$，该体积元内所含的微电荷量$\mathrm{d}Q$等于该点处的体电荷密度$\rho(\mathbf{x}')$乘以体积$\mathrm{d}V'$：

$$
\mathrm{d}Q = \rho(\mathbf{x}')\mathrm{d}V'
$$

![连续分布带电体的场强](/picture/maxwell-equation/maxwell-equation1.png)

设由源点$\mathbf{x}'$到场点$\mathbf{x}$的矢径为$\mathbf{r}$，根据叠加原理，连续电荷分布在$P$点激发的总电场强度$\mathbf{E}(\mathbf{x})$为

$$
\mathbf{E}(\mathbf{x}) = \int_{V}\frac{\rho(\mathbf{x}')\mathbf{r}}{4\pi\epsilon_{0}r^3}\mathrm{d}V'
$$

### 高斯定理

高斯定理是麦克斯韦方程组的第一条方程，描述的是电场通量和电荷的关系。

首先我们先介绍电通量。设$S$表示包围着电荷$Q$的一个闭合曲面，$\mathrm{d}\mathbf{S}$为$S$上的微小面元，以外法线方向为正向。通过闭合曲面$S$的电场强度$\mathbf{E}$的通量定义为面积分：

$$
\oint_{S} \mathbf{E} \cdot \mathrm{d}\mathbf{S}
$$

而高斯定理告诉我们，电场$\mathbf{E}$的电通量等于它所包围的电荷量的总和除以真空介电常数，即：

$$
\oint_{S} \mathbf{E} \cdot \mathrm{d}\mathbf{S} = \frac{Q}{\epsilon_{0}}
$$

如果电荷在闭合曲面外，则它发出的电场线穿入该曲面后再穿出来，因而对该闭合曲面的电场强度通量没有贡献。在一般情况下，设空间中有多个离散电荷$Q_{i}$，则$\mathbf{E}$通过任一闭合曲面$S$的总通量等于$S$内的总电荷除以$\epsilon_{0}$，而与$S$外的电荷无关：

$$
\oint_{S} \mathbf{E} \cdot \mathrm{d}\mathbf{S} = \frac{1}{\epsilon_{0}}\sum_{i \in S} Q_{i}
$$

如果电荷连续分布于空间中，则高斯定理的表达式应为：

$$
\oint_{S} \mathbf{E} \cdot \mathrm{d}\mathbf{S} = \frac{1}{\epsilon_{0}}\int_{V} \rho(\mathbf{x}) \mathrm{d}V
$$

以上是高斯定理的积分形式，为了求出电场和电荷的局域关系，即无穷小区域内的关系，需要用微分形式来描述：

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\epsilon_{0}}
$$

这就是高斯定理的微分形式，它是静电场的一个基本微分方程。上式指出，电荷是电场的源，电场线从正电荷发出而终止于负电荷。在没有电荷分布的空间区域，$\rho(\mathbf{x}) = 0$，因而在该点上$\nabla \cdot \mathbf{E} = 0$。这表示在该处既没有电场线发出，也没有电场线终止，但是可以有电场线连续通过该处。

### 静电场的旋度

散度是描述矢量场性质的一个重要方面，但要完全确定一个矢量场，还需要给出其旋度。旋度反映的是场的环流性质。麦克斯韦方程组一共包含四个基本方程（两个关于电场，两个关于磁场），其中描述电场的第二个方程揭示的正是电场的环流性质。

首先，我们知道，试探电荷在由静电荷激发的电场中会受到静电力作用。静电力是一种保守力，即静电力做功与路径无关——电荷从任意点出发，绕任意闭合回路运动一周，静电力做功恒为零。若取试探电荷的电荷量为一个单位正电荷，静电力沿闭合回路做功为零这一性质，便退化为静电场$\mathbf{E}$沿任意闭合回路$L$的环路积分（即环量）恒为零：

$$
\oint_{L} \mathbf{E} \cdot \mathrm{d}\mathbf{l} = 0
$$

![点电荷的环路积分](/picture/maxwell-equation/maxwell-equation2.png)

这一结论的严格证明十分简明。我们可以先计算单个静止点电荷$Q$激发的电场强度$\mathbf{E}$的环路积分：

$$
\oint_{L} \mathbf{E} \cdot \mathrm{d}\mathbf{l} = \frac{Q}{4\pi\epsilon_{0}} \oint_{L} \frac{\mathbf{r}}{r^3} \cdot \mathrm{d}\mathbf{l}
$$

设位移微元$\mathrm{d}\mathbf{l}$与空间矢径$\mathbf{r}$的夹角为$\theta$，则$\mathbf{r} \cdot \mathrm{d}\mathbf{l} = r \mathrm{d}l \cos \theta = r \mathrm{d}r$，因而上式可化为：

$$
\oint_{L} \mathbf{E} \cdot \mathrm{d}\mathbf{l} = \frac{Q}{4\pi\epsilon_{0}} \oint_{L} \frac{\mathrm{d}r}{r^2} = -\frac{Q}{4\pi\epsilon_{0}} \oint_{L} \mathrm{d}\left(\frac{1}{r}\right)
$$

上式右侧的被积函数是一个全微分。积分点从闭合回路$L$的任一点开始，绕$L$一周回到原处时，空间坐标未变，函数$1/r$亦回到原来的值。因而全微分$\mathrm{d}(1/r)$沿闭合回路的积分为零，由此得：

$$
\oint_{L} \mathbf{E} \cdot \mathrm{d}\mathbf{l} = 0
$$

以上证明了单个点电荷激发的电场环量为零。对于一般的静止电荷分布，可将其视为众多电荷元的集合。根据电场的叠加原理，总电场$\mathbf{E}$对任一闭合回路的环量，等于各个单独的电荷元所激发电场环量的代数和，因而恒为零。即上式对任意静电场和任一闭合回路都成立。

根据斯托克斯定理（Stokes' theorem），上述积分形式对应的微分形式为：

$$
\nabla \times \mathbf{E} = 0
$$

这说明静电场具有无旋性。大量实验与实践表明，电场的无旋性仅在静电情况下成立。在一般情况下（例如存在随时间变化的磁场时），电场是有旋的。因此，这并不是电场方程的完整形态，我们在稍后关于法拉第电磁感应定律的章节中会对其进行补充。

总结目前得到的结论，我们可以勾勒出静电场的基本物理图像：电荷是静电场的源，电场线从正电荷发出而终止于负电荷（有源场），在自由空间中电场线连续分布；在静电情形下，电场线不会闭合，即电场没有旋涡状结构（无旋场）。

---

# 磁场

## 毕奥-萨伐尔定律

在讨论了描述静电场的两个基本方程之后，我们将目光转向静磁场。首先，我们引入描述稳恒电流激发磁场的基本实验规律——毕奥-萨伐尔定律（Biot-Savart Law）。

历史上，人们最早通过天然磁体认识了磁现象。随着近代物理学的发展，我们知道天然磁体的磁性本质上来源于原子内部的微观运动（如电子自旋和轨道角动量所形成的“分子电流”）。因此，归根结底，宏观稳恒电流是产生恒定磁场的基本源泉。毕奥-萨伐尔定律正是定量描述稳恒电流与其所激发的磁场之间关系的宏观基本定律。

设$\mathbf{J}(\mathbf{x}')$为源点$\mathbf{x}'$处的体电流密度，$\mathbf{r}$为由源点$\mathbf{x}'$指向场点$\mathbf{x}$的矢径，则场点$\mathbf{x}$处的磁感应强度$\mathbf{B}(\mathbf{x})$为：

$$
\mathbf{B}(\mathbf{x}) = \frac{\mu_{0}}{4\pi} \int_{V} \frac{\mathbf{J}(\mathbf{x}') \times \mathbf{r}}{r^3} \mathrm{d}V'
$$

式中，$\mu_{0}$为真空磁导率，积分遍历整个电流分布区域$V$。

如果电流集中分布于细导线内，以$\mathrm{d}\mathbf{l}$表示沿着闭合回路$L$的线元矢量，$\mathrm{d}S_{\perp}$为导线的横截面元。由于电流元可以等效表示为$\mathbf{J}\mathrm{d}V' = \mathbf{J}\mathrm{d}S_{\perp}\mathrm{d}l = J\mathrm{d}S_{\perp}\mathrm{d}\mathbf{l}$，在导线横截面上进行积分后即可得到$I\mathrm{d}\mathbf{l}$。因此，细导线上恒定电流$I$激发磁场的毕奥-萨伐尔定律可写为：

$$
\mathbf{B}(\mathbf{x}) = \frac{\mu_{0}I}{4\pi} \oint_{L} \frac{\mathrm{d}\mathbf{l} \times \mathbf{r}}{r^3}
$$

### 利用毕奥-萨伐尔定律求解圆形载流导线的磁场

![圆形载流导线](/picture/maxwell-equation/maxwell-equation3.png)

此处以求解通有恒定电流的圆形载流导线产生的磁场为例。根据毕奥-萨伐尔定律，电流微元在空间任意一点产生的磁感应强度 $\mathrm{d}\mathbf{B}$，其方向由电流微元矢量 $\mathrm{d}\mathbf{l}$ 与从微元指向该点的单位位置矢量 $\mathbf{e}_r$ 的叉乘决定。

如上图所示，C处的电流微元在P点产生的磁场方向垂直于由位置矢量 $\mathbf{r}$（即PC连线）与过C点的导线切线所构成的平面，即图中的 $\mathrm{d}\mathbf{B}$ 方向。该电流微元产生的磁场 $\mathrm{d}\mathbf{B}$ 可以分解为平行于圆环轴线的分量 $\mathrm{d}B_{\parallel}$ 和垂直于轴线的分量 $\mathrm{d}B_{\perp}$。

在计算整个圆形导线产生的总磁场时，由于几何对称性，各个微元产生的垂直于轴线的分量 $\mathrm{d}B_{\perp}$ 积分后相互抵消，总贡献为0，仅保留沿轴线方向的分量 $\mathrm{d}B_{\parallel}$（其中$\cos\alpha = \frac{R}{\sqrt{R^2+a^2}}$，$\alpha$为$\mathrm{d}\mathbf{B}$与轴线的夹角）。因此有：

$$
\begin{aligned}
\mathrm{d}\mathbf{B} &= \frac{\mu_{0}I \mathrm{d}\mathbf{l} \times \mathbf{e}_r}{4\pi r^2} \\
\mathrm{d}B_{\parallel} &= \frac{\mu_{0}I\cos\alpha \, \mathrm{d}l}{4\pi (R^2+a^2)} \\
B_{\parallel} &= \int_{0}^{2\pi R}\frac{\mu_{0}IR \, \mathrm{d}l}{4\pi (R^2+a^2)^{3/2}}\\
B_{\parallel} &=\frac{\mu_{0} IR^2}{2(a^2+R^2)^{3/2}}
\end{aligned}
$$

### 利用毕奥-萨伐尔定律求解长直载流导线的磁场

![长直载流导线磁场分析](/picture/maxwell-equation/maxwell-equation4.png)

接下来考虑长直导线产生的磁场。如图所示，假设电流沿着竖直向上的方向。根据毕奥-萨伐尔定律，空间内P处的磁场方向应当垂直于由导线轴线与连线PO所构成的平面，即沿过P点的切线方向（垂直纸面向里）。为便于定量计算，我们以电流竖直向下为例，求解与导线垂直距离为 $a$ 的P点处的磁场。

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

如果所选的闭合曲线内没有包围电流，例如图中的环路 PQRSP，可以证明沿此回路的磁场环量严格为零。事实上，沿该回路的积分可分为四段计算。对于沿径向的 SP 段和 QR 段，由于 $\mathbf{B}$ 的方向与路径微元 $\mathrm{d}\mathbf{l}$ 始终正交（点积为零），因此这两段的积分为零。设圆弧 PQ 的半径为 $r_2$，弧长为 $l_2$；圆弧 RS 的半径为 $r_1$，弧长为 $l_1$。考虑积分方向，沿这两段圆弧的积分之和为：

$$
\int_{PQ} \mathbf{B} \cdot \mathrm{d}\mathbf{l} + \int_{RS} \mathbf{B} \cdot \mathrm{d}\mathbf{l} = \frac{\mu_{0}I}{2\pi r_2}l_2 - \frac{\mu_{0}I}{2\pi r_1}l_1
$$

根据几何相似关系可知，两段圆弧所对的圆心角相等（设为$\Delta\theta$），即 $l_2/r_2 = l_1/r_1 = \Delta\theta$。因此，上式的结果必然为 0。由此证明，对于未包围电流的闭合回路 PQRSP，其磁场环量为零。

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

若以此为基础，选取一个包围导线端点截面的积分回路，此时的磁场环量计算结果将不再等于 $\mu_0 I$。这一悖论的物理根源在于系统偏离了稳恒状态：当传导电流 $I$ 从无限远处流至导线端点（假设为原点）时，由于电路截断，电荷必将在端点处不断堆积。端点电荷量 $q$ 随时间不断增加（满足电荷守恒 $\mathrm{d}q/\mathrm{d}t = I$），进而在周围空间激发一个随时间动态增强的电场 $\mathbf{E}$。由于 $\partial \mathbf{E} / \partial t \neq 0$，原版的静磁学安培环路定理在此完全失效。

为了解决这种“传导电流不闭合”导致的理论矛盾，麦克斯韦（James Clerk Maxwell）对安培环路定理进行了著名的推广，引入了**位移电流**（Displacement Current）的概念。麦克斯韦提出，随时间变化的电场在激发磁场方面等效于一种空间电流，其位移电流密度 $\mathbf{J}_d$ 定义为：

$$
\mathbf{J}_d = \epsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

由此，修正后的安培-麦克斯韦定律（全电流定律）可表述为：

$$
\oint_{L} \mathbf{B} \cdot \mathrm{d}\mathbf{l} = \mu_0 \int_{S} \left( \mathbf{J} + \epsilon_0 \frac{\partial \mathbf{E}}{\partial t} \right) \cdot \mathrm{d}\mathbf{S} = \mu_0 (I_{\text{传导}} + I_{\text{位移}})
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
\mathbf{E} = \frac{q}{4\pi \epsilon_0 r^2} \mathbf{e}_r
$$

根据高斯定理，点电荷穿过整个封闭球面的电通量为 $q/\epsilon_0$。由于 $S_1$ 是精确的半个球面，且曲面法向量向外（符合右手定则），穿过 $S_1$ 的电通量 $\Phi_{E}$ 为：

$$
\Phi_{E} = \frac{q}{2\epsilon_0}
$$

根据麦克斯韦的定义，穿过 $S_1$ 的位移电流为：

$$
I_{\text{位移}} = \epsilon_0 \frac{\mathrm{d}\Phi_{E}}{\mathrm{d}t} = \epsilon_0 \left( \frac{1}{2\epsilon_0} \frac{\mathrm{d}q}{\mathrm{d}t} \right) = \frac{1}{2} \frac{\mathrm{d}q}{\mathrm{d}t} = \frac{I}{2}
$$

总电流 $I_{\text{全}} = I_{\text{传导}} + I_{\text{位移}} = 0 + I/2 = I/2$。左右两边完美相等！

**情形二：选取下半球面 $S_2$（$z < 0$ 区域）**

该曲面包围了导线本身。导线从无限远处穿破了 $S_2$ 表面进入内部，因此**穿过该曲面的传导电流 $I_{\text{传导}} = I$**。
根据与环路 $L$ 匹配的右手螺旋定则，此时曲面 $S_2$ 的正法线方向指向原点（即电场线的反方向）。因此，穿过 $S_2$ 的电通量为负值：

$$
\Phi_{E} = -\frac{q}{2\epsilon_0}
$$

对应的位移电流变为负值：

$$
I_{\text{位移}} = \epsilon_0 \frac{\mathrm{d}\Phi_{E}}{\mathrm{d}t} = -\frac{1}{2} \frac{\mathrm{d}q}{\mathrm{d}t} = -\frac{I}{2}
$$

总电流 $I_{\text{全}} = I_{\text{传导}} + I_{\text{位移}} = I - I/2 = I/2$。左右两边依然完美相等！

**结论：**

上述严格的解析推导表明，麦克斯韦引入的位移电流在数学结构上是极其自洽的。无论选取哪个积分曲面，端点电荷激发的变化电场产生的位移电流，都像“拼图”一样，精准地弥补了传导电流的缺失，确保了电磁场环路定理的绝对成立。

至此，麦克斯韦方程组已出现四个方程中的三个。