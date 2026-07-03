---
title: 电介质的电磁性质及介质中的麦克斯韦方程组
date: 2026-06-16
---

## 介质的介绍

介质由分子组成。分子内部有带正电的原子核和绕核运动的带负电的电子。从电磁学观点看来，介质是一个带电粒子系统，其内部存在着不规则而又迅速变化的微观电磁场。在研究宏观电磁现象时，我们所讨论的物理量是在一个包含大数目分子的物理无限小体积内的平均值，称为宏观物理量。

由于分子是电中性的，而且在热平衡时各分子内部的粒子运动一般没有确定的关联，因此，当没有外场时，介质内部一般不出现宏观的电荷与电流分布，内部的宏观电磁场亦为零。有外场时，介质中的带电粒子受场的作用，正负电荷发生相对位移，有极分子（原来正负电荷中心不重合的分子）的取向以及分子电流的取向亦呈现出一定的规则性（发生定向排列），这就是介质的极化和磁化现象。

由于极化和磁化的原因，介质内部及表面上便出现宏观的电荷与电流分布，我们把这些电荷、电流分别称为束缚电荷（极化电荷）和磁化电流（束缚电流）。这些宏观的电荷电流分布反过来又激发起附加的宏观电磁场，叠加在原来的外场上而得到介质内的总电磁场。介质内的宏观电磁现象就是这些电荷电流分布和电磁场之间相互作用的结果。

## 介质的极化

存在两类电介质：一类介质分子的正电中心和负电中心重合（无极分子），没有电偶极矩（电偶极矩定义为从负电荷指向正电荷的一个矢量，大小为正电荷或者负电荷所带的电荷量乘以两者之间的距离）；另一类介质分子的正负电中心不重合（有极分子），有分子电偶极矩。但是由于分子热运动的无规性，在物理无限小体积内的平均电偶极矩为零，因而也没有宏观电偶极矩分布。

在外场作用下，前一类分子的正负电中心被拉开，后一类介质的分子电偶极矩平均有一定取向性，因此都出现宏观电偶极矩分布。宏观电偶极矩分布用电极化强度矢量 $\mathbf{P}$ 描述，它等于物理无限小体积 $\Delta V$ 内的总电偶极矩与 $\Delta V$ 之比：

$$
\mathbf{P}=\frac{\sum_{i}\mathbf{p}_{i}}{\Delta V}
$$

式中 $\mathbf{p}_{i}$ 为第 $i$ 个分子的电偶极矩，求和符号表示对 $\Delta V$ 内所有分子求和。

由于极化，分子正负电中心发生相对位移，因而物理无限小体积 $\Delta V$ 内可能出现净余的正电荷或负电荷，即出现宏观的束缚电荷分布。我们现在首先要求出束缚电荷密度 $\rho_{p}$ 和电极化强度 $\mathbf{P}$ 之间的关系。

![推导极化电荷密度](/picture/jie-zhi/jie-zhi1.jpg)
*图1：推导极化电荷密度*

我们用一个简化模型来推导。假设每个分子由相距为 $\mathbf{l}$ 的一对正负电荷 $\pm q$ 构成，分子电偶极矩为 $\mathbf{p}=q\mathbf{l}$。假设介质内某曲面 $S$ 上有一个面元 $\mathrm{d}\mathbf{S}$，介质极化后，有一些分子电偶极子跨过 $\mathrm{d}\mathbf{S}$。当电偶极子的负电荷处于体积 $\mathbf{l} \cdot \mathrm{d}\mathbf{S}$ 内时，同一偶极子的正电荷就穿出界面 $\mathrm{d}\mathbf{S}$ 外边。设单位体积内的分子数为 $n$，则穿出 $\mathrm{d}\mathbf{S}$ 外面的正电荷为：

$$
n q \mathbf{l} \cdot \mathrm{d}\mathbf{S} = n\mathbf{p} \cdot \mathrm{d}\mathbf{S} = \mathbf{P} \cdot \mathrm{d}\mathbf{S}
$$

对包围区域 $V$ 的闭合界面 $S$ 积分，则可得到 $V$ 内通过界面 $S$ 穿出去的总正电荷量为：

$$
\oint_{S}\mathbf{P} \cdot \mathrm{d}\mathbf{S}
$$

由于介质是电中性的，因此可以反推体积 $V$ 内净余的负电荷量与穿过界面 $S$ 的正电荷量大小相等、符号相反。这种由于极化而出现的电荷分布称为束缚电荷。以 $\rho_{p}$ 表示束缚体电荷密度，有：

$$
\int_{V}\rho_{p}\mathrm{d}V=-\oint_{S}\mathbf{P} \cdot \mathrm{d}\mathbf{S}
$$

利用数学上的高斯散度定理，将面积分转换为体积分，可得：

$$
\rho_{p}=-\nabla \cdot \mathbf{P}
$$

![面束缚电荷密度](/picture/jie-zhi/jie-zhi2.jpg)
*图2：面束缚电荷密度*

非均匀介质极化后一般在整个介质内部都出现束缚电荷；在均匀介质内，束缚电荷只出现在自由电荷附近以及介质界面处。现在我们说明两介质分界面上的面束缚电荷的概念。

当两种电介质 1 和电介质 2 紧邻时，我们考虑分界面上的一个面元 $\mathrm{d}S$，并在两侧取一定厚度的薄层，使分界面包含在薄层内。在薄层内出现的束缚电荷与 $\mathrm{d}S$ 之比称为分界面上的束缚电荷面密度。通过前面的分析，通过薄层右侧面进入介质 2 的正电荷为 $\mathbf{P}_2 \cdot \mathrm{d}\mathbf{S}$，由介质 1 通过薄层左侧面进入薄层的正电荷为 $\mathbf{P}_1 \cdot \mathrm{d}\mathbf{S}$。因此，薄层内出现的净余电荷为 $-(\mathbf{P}_2 - \mathbf{P}_1) \cdot \mathrm{d}\mathbf{S}$。由此可得束缚面电荷密度的表达式：

$$
\sigma_{p}\mathrm{d}S=-(\mathbf{P}_{2}-\mathbf{P}_{1}) \cdot \mathrm{d}\mathbf{S}
$$

即：

$$
\sigma_{p}=-\mathbf{e}_{n} \cdot (\mathbf{P}_2-\mathbf{P}_1)
$$

其中，$\mathbf{e}_{n}$ 为分界面上由介质 1 指向介质 2 的法向单位矢量。所谓面束缚电荷不是真正分布在一个纯几何面上的电荷，而是在一个含有相当多分子层的薄层内的物理效应。

介质内的电现象包括两个方面：一方面，电场使介质极化而产生束缚电荷分布；另一方面，这些束缚电荷又反过来激发电场，两者是互相制约的。介质对宏观电场的作用就是通过束缚电荷激发电场。因此，若在麦克斯韦方程组中，总电荷密度 $\rho$ 包括自由电荷密度 $\rho_{f}$ 和束缚电荷密度 $\rho_{p}$ 在内，那么真空中的高斯定理推广到含介质的情况时，需要对电荷部分加上束缚电荷密度，即：

$$
\epsilon_{0}\nabla \cdot \mathbf{E}=\rho_f+\rho_p
$$

在实际问题中，自由电荷比较容易受实验条件的直接控制或观测，而束缚电荷则不然。因此，在麦克斯韦方程组中消去 $\rho_p$ 比较方便。根据 $\rho_p=-\nabla \cdot \mathbf{P}$，代入上式有：

$$
\nabla \cdot (\epsilon_0\mathbf{E}+\mathbf{P})=\rho_f
$$

引入一个新的辅助物理量——电位移矢量 $\mathbf{D}$，定义为：

$$
\mathbf{D}=\epsilon_0\mathbf{E}+\mathbf{P}
$$

于是得到：

$$
\nabla \cdot \mathbf{D}=\rho_f
$$

在此式中已消去了束缚电荷，但引进了一个辅助场量 $\mathbf{D}$。真空中的高斯定理告诉我们，$\mathbf{E}$ 的源是总电荷分布，它是介质中的总宏观电场强度，是电场的基本物理量；而 $\mathbf{D}$ 并不直接代表介质中的电场强度，它只是一个辅助物理量。我们必须给出 $\mathbf{D}$ 和 $\mathbf{E}$ 之间的实验关系才能最终解出电场强度。

实验指出，各种介质材料有不同的电磁性能，$\mathbf{D}$ 和 $\mathbf{E}$ 的关系也有多种形式。对于一般各向同性的线性介质，极化强度 $\mathbf{P}$ 和 $\mathbf{E}$ 之间有简单的线性关系：

$$
\mathbf{P}=\chi_e\epsilon_0\mathbf{E}
$$

其中，$\chi_e$ 称为介质的电极化率。因此可得：

$$
\begin{aligned}
\mathbf{D} &=\epsilon_{0}\mathbf{E}+\mathbf{P}\\
&=\epsilon_{0}\mathbf{E}+\chi_e \epsilon_0\mathbf{E}\\
&=\epsilon_0(1+\chi_e)\mathbf{E}\\
&=\epsilon_0\epsilon_r\mathbf{E}\\
&=\epsilon\mathbf{E}
\end{aligned}
$$

这里，$\epsilon$ 称为介质的介电常数（电容率），$\epsilon_r = 1 + \chi_e$ 称为相对介电常数（相对电容率）。

## 介质的磁化与宏观电磁场方程

关于物质磁性的起源，核心思想源于安培提出的“分子电流假说”（Ampère's molecular current hypothesis）。在现代物理图像中，原子内部电子绕原子核的轨道运动以及电子自身的自旋，会形成微观的环形电流（即分子电流）。每一个这样的微观电流环都等效于一个微小的磁偶极子。在没有外加磁场时，由于热运动的存在，这些分子电流的取向是无规则分布的，其宏观磁效应相互抵消，介质整体不显磁性。但在外磁场作用下，这些分子电流受到磁力矩的作用，倾向于沿着外磁场方向规则排列，从而在宏观上产生净磁场，这一过程即为介质的磁化。此时，介质内部及表面将形成宏观的磁化电流（也称束缚电流），其体电流密度记为 $\mathbf{J}_M$。

分子电流可以用磁偶极矩来描述。若把分子电流看作载有电流 $i$ 的小线圈，线圈面积矢量为 $\mathbf{a}$，则与该分子电流相应的微观磁偶极矩可表示为：

$$
\mathbf{m} = i\mathbf{a}
$$

介质磁化后，空间中出现宏观磁偶极矩分布，我们用磁化强度 $\mathbf{M}$（Magnetization）来表示。它的定义为物理无限小体积 $\Delta V$ 内的总磁偶极矩与 $\Delta V$ 之比：

$$
\mathbf{M} = \frac{\sum_i\mathbf{m}_i}{\Delta V}
$$

为了推导磁化电流密度 $\mathbf{J}_M$ 与磁化强度 $\mathbf{M}$ 的关系，我们可以参考以下示意图。图中 $S$ 为介质内部的一个任意曲面，其边界线为 $L$。为了求出磁化电流密度，我们计算从 $S$ 的背面流向前面的总磁化电流 $I_M$。由图可见，若分子电流与边界线 $L$ 交链（即线圈被边界线穿过），该分子电流就对 $I_M$ 有贡献。在其他情形下，或者分子电流根本不通过 $S$，或者从 $S$ 背面流出来后再从前面流进（净贡献为零）。因此，通过 $S$ 的总磁化电流 $I_M$ 等于与边界线 $L$ 交链的分子数目乘上每个分子的电流 $i$。

![磁化电流密度推导示意图](/picture/jie-zhi/jie-zhi3.jpg)
*图3：磁化电流密度推导示意图*

考虑边界线 $L$ 上的一个线元 $\mathrm{d}\mathbf{l}$，分子电流圈的面积矢量为 $\mathbf{a}$。由图可见，若分子中心位于底面积为 $\mathbf{a}$、高为 $\mathrm{d}\mathbf{l}$、体积为 $\mathbf{a} \cdot \mathrm{d}\mathbf{l}$ 的斜柱体内，则该分子电流就会被 $\mathrm{d}\mathbf{l}$ 所穿过。因此，若介质单位体积内的分子数为 $n$，则与边界线 $L$ 交链的分子电流数目可表示为：

$$
\oint_{L} n\mathbf{a} \cdot \mathrm{d}\mathbf{l}
$$

交链的分子数目乘以每个微观分子的电流 $i$，即可得到穿过曲面 $S$ 的总磁化电流：

$$
I_M = \oint_{L} ni\mathbf{a} \cdot \mathrm{d}\mathbf{l} = \oint_{L} n\mathbf{m} \cdot \mathrm{d}\mathbf{l} = \oint_{L} \mathbf{M} \cdot \mathrm{d}\mathbf{l}
$$

若以 $\mathbf{J}_M$ 表示宏观磁化电流密度，则通过曲面 $S$ 的总电流也可写为面积分形式：

$$
\int_S \mathbf{J}_M \cdot \mathrm{d}\mathbf{S} = \oint_{L} \mathbf{M} \cdot \mathrm{d}\mathbf{l}
$$

利用斯托克斯定理（Stokes' theorem）将右侧的线积分化为 $\nabla \times \mathbf{M}$ 的面积分，即 $\int_S \mathbf{J}_M \cdot \mathrm{d}\mathbf{S} = \int_S (\nabla \times \mathbf{M}) \cdot \mathrm{d}\mathbf{S}$。由于积分曲面 $S$ 的选取具有任意性，被积函数必须处处相等，由此可得微分形式：

$$
\mathbf{J}_M = \nabla \times \mathbf{M}
$$

除了磁化电流之外，交变电场还会引发另一种宏观束缚电流——极化电流。在静电学中，当外电场恒定时，介质分子发生极化，正负电荷中心发生微小相对位移，形成静止的电偶极矩。此时，带电粒子被严格束缚在分子内部或附近，宏观上只表现为静止的极化束缚电荷分布（其体电荷密度 $\rho_P = -\nabla \cdot \mathbf{P}$），不存在宏观的电荷流动。

然而，当外加电场随时间变化时，介质内的极化状态也会随之改变。电介质中分子的正负电荷中心在变动电场的作用下发生相对往复运动。尽管每个束缚电荷的位移极其微小（并未像导体中的自由电子那样脱离原子束缚），但这种大量带电粒子的集体定向运动，在宏观上等效于一种空间电流，即极化电流。

我们可以通过微观定义来严格推导极化电流密度 $\mathbf{J}_P$。设物理无限小体积 $\Delta V$ 内每个束缚带电粒子的位移矢量为 $\mathbf{x}_i$，电荷量为 $e_i$，极化强度 $\mathbf{P}$（单位体积内的电偶极矩）定义为：

$$
\mathbf{P} = \frac{1}{\Delta V}\sum_{i}e_i\mathbf{x}_i
$$

对时间求偏导数，位移的时间变化率即为微观电荷的运动速度 $\mathbf{v}_i = \frac{\partial \mathbf{x}_i}{\partial t}$：

$$
\frac{\partial \mathbf{P}}{\partial t} = \frac{1}{\Delta V}\sum_{i}e_i\mathbf{v}_i = \mathbf{J}_P
$$

等式右侧正是单位体积内大量束缚电荷运动所形成的宏观极化电流密度 $\mathbf{J}_P$。这在物理上也与电荷守恒定律完美自洽：极化电流散度 $\nabla \cdot \mathbf{J}_P = \nabla \cdot \frac{\partial \mathbf{P}}{\partial t} = -\frac{\partial \rho_P}{\partial t}$，恰好反映了束缚电荷密度随时间的演化规律。

磁化电流 $\mathbf{J}_M$ 和极化电流 $\mathbf{J}_P$ 之和，构成了介质内部总的束缚电流密度。

介质内的磁现象包括两个相互制约的方面：一方面，电磁场作用于介质分子上产生磁化电流和极化电流分布；另一方面，这些诱导出的宏观束缚电流又反过来作为源激发新的磁场。因此，若在麦克斯韦方程组的安培-麦克斯韦环路定理中，将总电流密度扩展为自由电流密度 $\mathbf{J}_f$ 和介质内的束缚电流密度 $\mathbf{J}_M + \mathbf{J}_P$ 之和，那么在真空形式的基础上，电磁场方程在介质内部依然严格成立：

$$
\frac{1}{\mu_0}\nabla \times \mathbf{B} = \mathbf{J}_f + \mathbf{J}_M + \mathbf{J}_P + \epsilon_{0}\frac{\partial\mathbf{E}}{\partial t}
$$

在实际工程与实验观测中，自由电流分布 $\mathbf{J}_f$ 可以直接受外部电源控制和测定，而 $\mathbf{J}_M$ 和 $\mathbf{J}_P$ 深藏于介质内部，难以直接测量。因此，在宏观基本方程中消去 $\mathbf{J}_M$ 和 $\mathbf{J}_P$ 会给计算带来极大的便利。将 $\mathbf{J}_M = \nabla \times \mathbf{M}$ 以及 $\mathbf{J}_P = \frac{\partial\mathbf{P}}{\partial t}$ 代入上式，并重新移项整理可得：

$$
\nabla \times \left(\frac{\mathbf{B}}{\mu_0} - \mathbf{M}\right) = \mathbf{J}_f + \frac{\partial}{\partial t}(\epsilon_0\mathbf{E} + \mathbf{P})
$$

结合前文定义的电位移矢量 $\mathbf{D} = \epsilon_0\mathbf{E} + \mathbf{P}$，并引入一个新的辅助物理量——磁场强度 $\mathbf{H}$，定义为：

$$
\mathbf{H} = \frac{\mathbf{B}}{\mu_0} - \mathbf{M}
$$

上式即可化简为宏观安培环路定理的标准形式：

$$
\nabla \times \mathbf{H} = \mathbf{J}_f + \frac{\partial\mathbf{D}}{\partial t}
$$

在这里需要特别强调物理概念的本质：磁感应强度 $\mathbf{B}$ 描述了所有真实电流（包括自由电流和束缚电流）共同激发的空间总场，因此它是表征磁场基本属性的真实物理量；而 $\mathbf{H}$ 并不直接代表介质内的真实场强，它仅仅是一个为了数学求解方便而人为引入的“辅助物理量”。

为了使方程组闭合以求解磁场，还需要确定 $\mathbf{H}$ 和 $\mathbf{B}$ （或 $\mathbf{M}$）之间的本构关系。实验指出，对于各向同性的非铁磁性介质，在场强不太大的情况下，磁化强度 $\mathbf{M}$ 与磁场强度 $\mathbf{H}$ 之间存在简单的线性比例关系：

$$
\mathbf{M} = \chi_M \mathbf{H}
$$

其中 $\chi_M$ 称为介质的磁化率（Magnetic susceptibility）。代入 $\mathbf{H}$ 的定义式中可得：

$$
\begin{aligned}
\mathbf{B} &= \mu_0(\mathbf{H} + \mathbf{M}) \\
&= \mu_0(1 + \chi_M)\mathbf{H} \\
&= \mu \mathbf{H}
\end{aligned}
$$

其中：

$$
\mu = \mu_0\mu_r, \quad \mu_r = 1 + \chi_M
$$

$\mu$ 为介质的绝对磁导率，$\mu_r$ 为相对磁导率。

从物理本质上看，$\mathbf{E}$ 和 $\mathbf{B}$ 才是电磁场的基本物理量，而 $\mathbf{D}$ 和 $\mathbf{H}$ 只是引入的宏观辅助物理量。历史上，由于人们早期对磁性起源曾有不正确的认识（如磁荷观点），曾错误地把 $\mathbf{H}$ 称为“磁场强度”并与电场强度 $\mathbf{E}$ 作物理类比。现在物理学界早已认清这种看法的局限性，但由于历史习惯，仍然保留了 $\mathbf{B}$（磁感应强度）和 $\mathbf{H}$（磁场强度）的传统名称。在工程实践中，由于 $\mathbf{H}$ 的旋度仅仅依赖于可受实验直接控制的自由电流 $\mathbf{J}_f$，计算宏观磁场分布时使用 $\mathbf{H}$ 具有不可替代的实用价值。

最后，我们将各向同性线性介质中的宏观麦克斯韦方程组微分形式总结如下：

$$
\begin{aligned}
\nabla \cdot \mathbf{D} &= \rho_f \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial\mathbf{B}}{\partial t} \\
\nabla \times \mathbf{H} &= \mathbf{J}_f + \frac{\partial\mathbf{D}}{\partial t}
\end{aligned}
$$