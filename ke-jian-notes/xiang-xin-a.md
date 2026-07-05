---
title: 向心加速度的推导
date: 2026-07-5
---

实际上，向心加速度的出现是自然而然的结果，因为速度是一个矢量，既包含大小又有方向。随着时间的推移，速度大小的变化贡献了切向加速度，而速度方向随时间的变化则贡献了法向加速度（即向心加速度）。为了便于理解，我们以圆周运动为例进行讨论，随后即可将其推广至一般的平面曲线运动。

如下图所示，为了研究质点在 $t$ 时刻于 A 点的加速度，我们可以从 $t$ 到 $t+\Delta t$ 时间内的平均加速度入手。假设质点在 A 点的速度为 $\mathbf{v}$，经过 $\Delta t$ 后在 B 点的速度为 $\mathbf{v}^{\prime}$，则 $\Delta \mathbf{v} = \mathbf{v}^{\prime} - \mathbf{v}$ 表示速度增量。

![向心加速度的推导示意图](/picture/xiang-xin-a/xiang-xin-a1.png)

我们在 $\mathbf{v}^{\prime}$ 方向上截取线段 $AC = v = |\mathbf{v}|$，并连接 D、C，从而将总速度增量 $\Delta\mathbf{v}$ 分解为 $\Delta_1\mathbf{v}$ 和 $\Delta_2\mathbf{v}$ 两个分量。根据加速度的定义有：

$$
\mathbf{a} = \lim_{\Delta t \to 0} \frac{\Delta \mathbf{v}}{\Delta t} = \lim_{\Delta t \to 0} \frac{\Delta_1 \mathbf{v}}{\Delta t} + \lim_{\Delta t \to 0} \frac{\Delta_2 \mathbf{v}}{\Delta t}
$$

对于等号右边的第二项，由于 $\triangle ACD$ 和 $\triangle OAB$ 均为等腰三角形，且 OA 垂直于 $\mathbf{v}$（即 AD），OB 垂直于 $\mathbf{v}^{\prime}$（即 AC），因此顶角 $\angle CAD = \angle AOB = \Delta\theta$。由此可知，这两个等腰三角形相似，故有：

$$
\begin{aligned}
\frac{|\Delta_2\mathbf{v}|}{AB} &= \frac{v}{R} \\
|\Delta_2\mathbf{v}| &= AB \cdot \frac{v}{R}
\end{aligned}
$$

其中，$R$ 表示质点圆周运动的轨迹半径。于是，加速度中的第二项（即法向加速度）的大小可以由下式求出：

$$
a_n = \lim_{\Delta t \to 0} \frac{|\Delta_2 \mathbf{v}|}{\Delta t} = \frac{v}{R} \lim_{\Delta t \to 0} \frac{AB}{\Delta t} = \frac{v}{R} \lim_{\Delta t \to 0} \frac{|\Delta s|}{\Delta t} = \frac{v^2}{R}
$$

在上述推导中，我们利用了当 $\Delta t \to 0$ 时，弦长趋近于弧长（即 $AB \approx |\Delta s|$）的性质。

需要注意的是，这仅仅给出了该项加速度的大小。关于方向：在等腰 $\triangle ACD$ 中，底角 $\angle ADC = (180^\circ - \Delta\theta) / 2$。当 $\Delta t \to 0$ 时，$\Delta\theta \to 0$，底角趋近于 $90^\circ$。这意味着 $\Delta_2\mathbf{v}$（即线段 CD 对应的向量）的方向趋近于垂直初速度 $\mathbf{v}$ 的方向。因此，我们得出 $\Delta_2\mathbf{v}$ 所贡献的加速度方向垂直于初速度方向，并指向圆心。由于其方向始终指向圆心，该法向加速度也被称为“向心加速度”，写成矢量形式即为：

$$
\mathbf{a}_n = \frac{v^2}{R}\mathbf{e}_n
$$

（其中 $\mathbf{e}_n$ 为指向圆心的单位法向量）。

此外，由于圆弧长度 $|\Delta s|$ 可以用半径 $R$ 和圆心角增量 $\Delta\theta$ 表示，即：

$$
|\Delta s| = R\Delta\theta
$$

将此式代入前式，也可以得到向心加速度的另一种表达形式：

$$
a_n = \frac{v}{R} \lim_{\Delta t \to 0} \frac{|\Delta s|}{\Delta t} = \frac{v}{R} \lim_{\Delta t \to 0} \frac{R\Delta\theta}{\Delta t} = v\omega
$$

又因为线速度 $v = \lim_{\Delta t \to 0} \frac{|\Delta s|}{\Delta t} = \omega R$，进一步代入可得：

$$
a_n = \omega^2 R
$$

最后，对于 $\Delta_1\mathbf{v}$ 的贡献，它代表了速度大小的变化。由于其方向始终沿着初速度 $\mathbf{v}$ 的方向（或反方向），这部分被称为切向加速度（$a_t$），其大小由下式给出：

$$
a_t = \lim_{\Delta t \to 0} \frac{|\Delta_1 \mathbf{v}|}{\Delta t} = \frac{\mathrm{d}v}{\mathrm{d}t}
$$

因此我们可以得出结论：对于作非匀速曲线运动的质点，其速度的大小和方向都在时刻变化。这种变化自然而然地分解为两个部分——大小的改变贡献了切向加速度，方向的偏折贡献了法向加速度。