---
title: "全息成像"
date: "2026-11-10"
---

## 全息成像

### 引言：波前信息的完整表征与传统照相术的“相位丢失”

在标量衍射理论框架下，空间中传播的单色光波场可由实标量波函数 $E(\boldsymbol{r},t)$ 完备描述。设三维物体在角频率为 $\omega = 2\pi\nu$（真空波长为 $\lambda$，波数为 $k = 2\pi/\lambda$）的理想单色激光照明下，其表面漫反射或散射出的**物光波（Object Wave）**传播至记录平面 $z=0$（面内坐标为 $(x,y)$）时，实电场分布可表为：

$$
E_O(x,y,t) = O(x,y)\cos\bigl[\omega t - \phi_O(x,y)\bigr] = \mathrm{Re}\Bigl\{\tilde{O}(x,y)\mathrm{e}^{-\mathrm{i}\omega t}\Bigr\},
$$

式中，剥离时间谐振因子 $\mathrm{e}^{-\mathrm{i}\omega t}$ 后的纯空间复函数

$$
\tilde{O}(x,y) = O(x,y)\exp\bigl[\mathrm{i}\phi_O(x,y)\bigr]
$$

定义为物光波在记录平面上的**复振幅（Complex Amplitude）**。依据惠更斯-菲涅耳原理（Huygens-Fresnel Principle），光波场在空间中的传播具有唯一确定性：只要完整获知某一波前平面 $z=0$ 上的复振幅分布 $\tilde{O}(x,y)$，即可唯一确定并重构该光波在 $z>0$ 半空间任意位置处的衍射场分布。

审视上述复振幅表达式可知，复振幅 $\tilde{O}(x,y)$ 承载着两类物理内涵截然不同且相互正交的光学信息：

- **实振幅分布** $O(x,y) \ge 0$：定量表征物体表面各点反射率或微元散射截面的空间差异，直接对应人眼视觉感知的物体表面**明暗色调与灰阶衬比度**；
- **空间相位分布** $\phi_O(x,y)$：定量记录光波自三维物体表面不同纵深坐标 $(x_0,y_0,z_0)$ 传播至记录平面 $(x,y,0)$ 所经历的几何光程差 $\Delta L(x,y)$（满足 $\phi_O \sim k\Delta L$）。正是相位分布 $\phi_O(x,y)$ 的空间曲率与局部梯度，唯一编码了三维物体的**空间立体纵深、表面几何形貌以及双目视差（Parallax）关系**。

然而，在传统光学照相术（Photography）中，相位信息 $\phi_O(x,y)$ 的直接探测面临一道天然的物理屏障。可见光的电磁振荡频率极高（$\nu \sim 5\times 10^{14}\ \mathrm{Hz}$，光振动周期 $T = 1/\nu \sim 2\times 10^{-15}\ \mathrm{s}$），而现有的各类物理光探测器——无论是卤化银感光乳胶、光电倍增管，抑或现代 CCD/CMOS 图像传感器乃至生物视网膜感光细胞——其微观光电响应时间 $\tau_d$（通常介于 $10^{-9}\ \mathrm{s} \sim 10^{-2}\ \mathrm{s}$）均远大于光波振动周期，即恒满足 $\tau_d \gg T$。

因此，一切物理光探测器在机制上皆为对能流密度（坡印廷矢量模）进行时间积分的**平方律探测器（Square-Law Detector）**。当物光波 $E_O(x,y,t)$ 单独照射感光介质时，探测器输出的宏观光强信号 $I_O(x,y)$ 为瞬时场强平方在响应时间 $\tau_d$ 内的时间平均值：

$$
\begin{aligned}
    I_O(x,y) &= \bigl\langle E_O^2(x,y,t) \bigr\rangle_{\tau_d} = \frac{1}{\tau_d}\int_{t_0}^{t_0+\tau_d} O^2(x,y)\cos^2\bigl[\omega t - \phi_O(x,y)\bigr]\mathrm{d}t \\
    &= \frac{1}{2}O^2(x,y) + \frac{O^2(x,y)}{2\tau_d}\underbrace{\int_{t_0}^{t_0+\tau_d} \cos\bigl[2\omega t - 2\phi_O(x,y)\bigr]\mathrm{d}t}_{\text{积分 }\to 0} \\
    &= \frac{1}{2}O^2(x,y) = \frac{1}{2}\bigl|\tilde{O}(x,y)\bigr|^2.
\end{aligned}
$$

由于 $\tau_d \gg T$，高频正负半周期相消，上式中第二项的积分趋近于零。为表述简明，在标量波动光学中通常略去比例常数 $1/2$，直接定义相对光强为复振幅的模平方：

$$
I_O(x,y) = \tilde{O}(x,y)\tilde{O}^*(x,y) = \bigl|O(x,y)\mathrm{e}^{\mathrm{i}\phi_O(x,y)}\bigr|^2 = O^2(x,y).
$$

上式深刻地揭示了传统照相术的物理局限：在模平方运算中，蕴含全部三维立体几何信息的相位因子因恒等式 $\bigl|\mathrm{e}^{\mathrm{i}\phi_O(x,y)}\bigr|^2 \equiv 1$ 而被**彻底抹除**。这正是普通照片仅能呈现二维平面光强分布的根本原因——无论观察者如何移动视线，照片中前景与后景的相对遮挡关系均保持凝固；人眼注视照片上不同远近的景物时，晶状体亦无需改变调焦屈光度。

#### 全息术（Holography）与两步波前再现原理

既然平方律探测器无法直接响应单一光波的高频相位 $\phi_O(x,y)$，若要完整留存波前信息，就必须借助相干外差机制将不可直接探测的“相位分布”转化为可探测的“光强分布”。1948 年，英籍匈牙利物理学家丹尼斯·盖博（Dennis Gabor，1971 年诺贝尔物理学奖得主）在研究消除电子显微镜球差以提高空间分辨率时，从波动物理层面提出了突破性的解决方案——**全息术（Holography）**（词源由希腊语词根 *holos*“全部、完整”与 *graphein*“书写、记录”复合而成，意为“波前全部信息的完整记录”）。

全息术的物理核心可凝练为**“干涉记录、衍射再现”的两步波前重建过程**：

1. **第一步：波前记录（Wavefront Recording —— 相干干涉编码）**：在物光波 $\tilde{O}(x,y)$ 照射感光干板的同时，引入另一束与之严格相干、波前形态已知的**参考光波（Reference Wave）** $\tilde{R}(x,y)$。两束光波在干板平面发生双光束相干叠加，合成光强中的交叉干涉项正比于 $\cos\bigl[\phi_O(x,y) - \phi_R(x,y)\bigr]$。由此，物光波的实振幅 $O(x,y)$ 被编码为干涉条纹的**明暗调制度（条纹衬比度）**，而物光波的相位 $\phi_O(x,y)$ 则被编码为干涉条纹的**空间位置偏移、弯曲形态与局部空间频率变化**。这张固化了微细干涉条纹的感光底片经显影定影后，即构成**全息图（Hologram）**。
2. **第二步：波前再现（Wavefront Reconstruction —— 衍射解码重建）**：移去原三维物体，用一束与原参考光波完全相同的**再现照明光波（Reconstruction Wave）**照明全息图。此时，布满复杂干涉条纹的全息图作为一张空间调制的广义衍射光栅对照明光产生相干衍射。在透射或反射的衍射光场中，$+1$ 级衍射光波将精确重现记录时物光波在干板平面上的复振幅分布 $\tilde{O}(x,y)$，使观察者迎光感知到与真实物体别无二致的三维立体像。

为从物理本质上厘清全息术与传统照相术的分野，表 1 对两者的核心特征进行了系统对比。

**表 1：传统光学照相术与全息成像的核心物理机制对比**

| 对比维度 | 传统照相术（Photography） | 全息成像（Holography） |
| --- | --- | --- |
| **记录的物理参量** | 仅记录物光实振幅的平方 $I = O^2(x,y)$，相位信息彻底丢失 | 同时记录物光波的实振幅 $O(x,y)$ 与相对相位差 $\phi_O - \phi_R$ |
| **光学空间映射关系** | 透镜几何共轭成像，物点与底片像点呈“点对点”局域映射 | 无透镜相干波前干涉记录，物点球面波非局域地编码至整张干板 |
| **图像读取与再现** | 非相干自然光照明，直接通过底片的吸收率观察二维明暗图案 | 相干激光照明，通过波动衍射重建原始三维波前 |
| **观察视差与景深** | 二维平面图像，无观察视差；人眼注视无需改变晶状体焦距 | 真实三维波前重现，具备连续水平与垂直视差；需真实调焦 |
| **局部破损容错性** | 底片局部受损或碎裂会导致对应空间部位的画面永久缺失 | **信息可分割性**：任意一小块碎片均可独立再现出完整全貌 |
| **正负片翻转效应** | 负片（底片）与正片的明暗灰阶完全黑白反转 | 负片与正片衍射出的物光波仅相差恒定相位 $\pi$，明暗一致 |
| **光源与介质门槛** | 普通非相干自然光；普通胶片空间分辨率约 $100\ \mathrm{lines/mm}$ | 高时空相干性单频激光；超微粒全息干板（达 $5000\ \mathrm{lines/mm}$） |

---

### 全息成像的数学物理理论：干涉记录与衍射再现

本节运用标量波动光学与线性系统理论，严格建立全息记录的干涉编码方程、感光介质线性响应模型以及再现光场的四项分解定理。

#### 第一步：双光束相干叠加与干涉编码方程

设全息感光干板固定于直角坐标系的 $z=0$ 平面，干板面内坐标为 $(x,y)$。在全息记录光路中（如图 1 所示），由同一台单纵模高相干激光器输出的激光束经分束镜（BS）分为两路：

1. **物光路**：激光经扩束镜照明三维物体，物体表面各点漫反射出的球面次波在空间相干叠加后，到达干板平面 $z=0$ 处的物光波复振幅记为：

$$
\tilde{O}(x,y) = O(x,y)\exp\bigl[\mathrm{i}\phi_O(x,y)\bigr].
$$

由于一般三维物体表面在微观上粗糙不平（形貌起伏尺度与光波长 $\lambda$ 同量级），$O(x,y)$ 与 $\phi_O(x,y)$ 均是随空间坐标 $(x,y)$ 剧烈涨落的复杂函数。

2. **参考光路**：激光经反射镜与扩束准直系统后，不经过物体而直接投射至干板平面，形成波前形态简单且解析已知的参考光波（通常采用均匀平面波或理想球面波），其在干板平面 $z=0$ 处的复振幅记为：

$$
\tilde{R}(x,y) = R(x,y)\exp\bigl[\mathrm{i}\phi_R(x,y)\bigr].
$$

在实验设计中，通常截取扩束高斯光斑的中心平坦区域照明干板，使参考光强在干板孔径内均匀分布，故可将参考光实振幅视为空间常数，即令 $R(x,y) \equiv R_0 = \text{const}$。

由于物光波与参考光波源自同一激光束，且光程差严格控制在激光相干长度以内，当两者在干板平面上的偏振态一致时，干板平面上的总合成复振幅为 $\tilde{U}(x,y) = \tilde{O}(x,y) + \tilde{R}(x,y)$。平方律感光干板实际响应并记录到的总干涉光强分布 $I(x,y)$ 为：

$$
\begin{aligned}
    I(x,y) &= \bigl|\tilde{U}(x,y)\bigr|^2 = \bigl[\tilde{O}(x,y) + \tilde{R}(x,y)\bigr]\bigl[\tilde{O}^*(x,y) + \tilde{R}^*(x,y)\bigr] \\
    &= |\tilde{O}(x,y)|^2 + |\tilde{R}(x,y)|^2 + \tilde{O}(x,y)\tilde{R}^*(x,y) + \tilde{O}^*(x,y)\tilde{R}(x,y) \\
    &= O^2(x,y) + R_0^2 + R_0 O(x,y)\mathrm{e}^{\mathrm{i}[\phi_O(x,y) - \phi_R(x,y)]} + R_0 O(x,y)\mathrm{e}^{-\mathrm{i}[\phi_O(x,y) - \phi_R(x,y)]} \\
    &= R_0^2 + O^2(x,y) + 2R_0 O(x,y)\cos\bigl[\phi_O(x,y) - \phi_R(x,y)\bigr].
\end{aligned}
$$

上式即为**全息波前记录基本方程**。

#### 物理图景剖析：干涉条纹同时锁定振幅与相位的编码机制

对比单一物光波光强式与双光束干涉光强式，可以清晰地洞察引入相干参考光 $\tilde{R}(x,y)$ 所带来的物理机制突破——其本质对应于通信理论中的**相干外差混频与空间载波调制**：

1. **物光振幅 $O(x,y)$ 编码于干涉条纹的局部衬比度（调制度）**：在干板上任意局部邻域 $(x,y)$ 内，干涉光强的极大值与极小值分别为 $I_{\max} = (R_0 + O)^2$ 与 $I_{\min} = (R_0 - O)^2$。依据迈克耳孙条纹可见度（Visibility / 衬比度）定义：

$$
\mathcal{V}(x,y) \equiv \frac{I_{\max}(x,y) - I_{\min}(x,y)}{I_{\max}(x,y) + I_{\min}(x,y)} = \frac{2R_0 O(x,y)}{R_0^2 + O^2(x,y)} = \frac{2\sqrt{K}\,O(x,y)/\langle O\rangle}{K + O^2(x,y)/\langle O^2\rangle},
$$

式中 $K \equiv R_0^2 / \langle O^2(x,y)\rangle$ 定义为**参考光与物光的光束比（Beam Ratio）**。在强参考光条件 $R_0 \gg O(x,y)$ 下，$\mathcal{V}(x,y) \approx \frac{2}{R_0}O(x,y) \propto O(x,y)$。即干板局部区域的条纹明暗反差越显著，表征该处物光振幅 $O(x,y)$ 越强。

2. **物光相位 $\phi_O(x,y)$ 编码于干涉条纹的空间位置与局部空间频率**：在干板平面上，第 $m$ 级干涉亮纹的几何轨迹由等相位差方程决定：

$$
\Delta\phi(x,y) \equiv \phi_O(x,y) - \phi_R(x,y) = 2m\pi \quad (m = 0, \pm 1, \pm 2, \dots).
$$

对相对相位差 $\Delta\phi(x,y)$ 求面内空间梯度，可得干板上局部干涉条纹在 $x$ 与 $y$ 方向的瞬时空间频率（单位长度内的条纹周期数）：

$$
f_{lx}(x,y) = \frac{1}{2\pi}\frac{\partial\bigl[\phi_O(x,y) - \phi_R(x,y)\bigr]}{\partial x}, \qquad f_{ly}(x,y) = \frac{1}{2\pi}\frac{\partial\bigl[\phi_O(x,y) - \phi_R(x,y)\bigr]}{\partial y}.
$$

这表明：物光波前相位 $\phi_O(x,y)$ 的绝对数值决定了干涉条纹相对于参考基准条纹的**空间相移量**，而物光波前法线的局部倾角（相位梯度 $\nabla_\perp\phi_O$）则决定了干涉条纹的**局部疏密（空间频率）与弯曲走向**。

#### 感光介质的 H-D 特性曲线与振幅透射率线性化模型

为将空间干涉光强分布 $I(x,y)$ 永久固化为衍射光学元件，需经过感光干板的曝光与显影化学处理。设曝光时间为 $\tau_e$，则干板上各点接收到的**曝光量（Exposure）**定义为 $E(x,y) \equiv \tau_e I(x,y)$（单位：$\mathrm{J/m^2}$）。

在传统摄影学中，卤化银乳胶显影后的感光特性由**赫特-德瑞菲尔德曲线（Hurter-Driffield Curve，简称 H-D 曲线）**表征：该曲线以曝光量的常用对数 $\lg E$ 为横坐标，以显影后底片的**光学密度（Optical Density）** $D \equiv \lg(1/T_I)$ 为纵坐标（其中 $T_I \equiv I_{\text{透射}}/I_{\text{入射}}$ 为底片的**光强透射率**）。然而，全息图的波前再现本质上是相干衍射过程，波动光学关注的是全息图对光波复振幅的直接线性调制，因此必须引入**复振幅透射率（Complex Amplitude Transmittance）** $t(x,y)$：

$$
t(x,y) \equiv \frac{\tilde{U}_{\text{透射}}(x,y)}{\tilde{U}_{\text{入射}}(x,y)} = \sqrt{T_I(x,y)}\exp\bigl[\mathrm{i}\varphi_t(x,y)\bigr] = 10^{-D(x,y)/2}\exp\bigl[\mathrm{i}\varphi_t(x,y)\bigr],
$$

式中 $\varphi_t(x,y)$ 为全息图乳胶厚度或折射率空间起伏引入的附加相位。对于置于液门中或基底厚度高度均匀的纯吸收型银盐全息干板，可忽略 $\varphi_t(x,y)$ 的空间涨落，直接考察实振幅透射率 $t(E)$ 随曝光量 $E$ 的响应关系（即 **$t\text{-}E$ 特性曲线**）。

实验测得的 $t\text{-}E$ 特性曲线整体呈非线性单调递减的“反 S 型”形态（低曝光区对应平坦的“趾部”，高曝光区进入饱和的“肩部”，唯有中段存在斜率陡峭的准线性区）。以下严格推导全息记录实现**无失真线性波前编码**的物理条件：

1. **总曝光量的“直流背景偏置 + 交变空间调制”分解**

将全息记录光强公式两端同乘曝光时间 $\tau_e$，干板上各点的总曝光量 $E(x,y)$ 可严格拆分为空间均匀的直流背景项与空间起伏的交变调制项之和：

$$
\begin{aligned}
    E(x,y) &= \tau_e I(x,y) \\
    &= \tau_e R_0^2 + \tau_e\Bigl\{O^2(x,y) + 2R_0 O(x,y)\cos\bigl[\phi_O(x,y) - \phi_R(x,y)\bigr]\Bigr\} \\
    &\equiv E_0 + \Delta E(x,y),
\end{aligned}
$$

式中：$E_0 \equiv \tau_e R_0^2$ 为均匀参考光单独提供的**静态背景曝光量（直流工作点）**，在整张干板上为空间常数；$\Delta E(x,y) \equiv E(x,y) - E_0 = \tau_e\bigl[I(x,y) - R_0^2\bigr]$ 为物光自强项与双光束干涉项共同引起的**曝光量空间调制起伏（交变信号）**。

2. **工作点附近的泰勒展开与二阶非线性“倍频鬼像”机制**

将实振幅透射率函数 $t\bigl(E(x,y)\bigr) = t\bigl(E_0 + \Delta E(x,y)\bigr)$ 在静态工作点 $E = E_0$ 邻域内作泰勒级数展开：

$$
t(x,y) = t(E_0) + \left.\frac{\mathrm{d} t}{\mathrm{d} E}\right|_{E_0}\Delta E(x,y) + \frac{1}{2}\left.\frac{\mathrm{d}^2 t}{\mathrm{d} E^2}\right|_{E_0}\bigl[\Delta E(x,y)\bigr]^2 + \mathcal{O}\bigl(\Delta E^3\bigr).
$$

在全息记录中，必须严格抑制上式中的二阶及更高阶非线性项。事实上，注意到 $\Delta E(x,y)$ 中的主干涉项为 $2\tau_e R_0 O(x,y)\cos(\phi_O - \phi_R)$，一旦展开式中保留二阶平方项 $[\Delta E(x,y)]^2$，由三角倍角公式与欧拉公式立即可得：

$$
\begin{aligned}
    \bigl[\Delta E(x,y)\bigr]^2 &\sim 4\tau_e^2 R_0^2 O^2(x,y)\cos^2\bigl[\phi_O(x,y) - \phi_R(x,y)\bigr] \\
    &= \tau_e^2 R_0^2 O^2(x,y)\Bigl\{2 + \mathrm{e}^{+\mathrm{i}2[\phi_O(x,y) - \phi_R(x,y)]} + \mathrm{e}^{-\mathrm{i}2[\phi_O(x,y) - \phi_R(x,y)]}\Bigr\}.
\end{aligned}
$$

上式揭示了非线性失真的物理机制：平方项不仅使条纹空间频率翻倍，更衍生出相位翻倍的二次谐波因子 $\mathrm{e}^{\pm\mathrm{i}2(\phi_O - \phi_R)}$。在波前再现阶段，此类倍频项会将照明光衍射至偏转角加倍的 $\pm 2$ 级方向，且其携带的波前相位被畸变为 $\pm 2\phi_O(x,y)$，从而在真实再现像旁形成严重失真的**高阶衍射鬼像（Higher-Order Ghost Images）**与互调背景噪声。

3. **实现严格线性调制的双重实验判据（拐点偏置 + 强参考光条件）**

为彻底消除上式中的二阶及以上非线性失真，实验中需同时施加两项物理约束：

- **工作点拐点偏置（令二阶导数消隐）**：通过协同调节参考光强 $R_0^2$ 与曝光时间 $\tau_e$，将静态背景曝光量 $E_0 = \tau_e R_0^2$ 精确偏置到 $t\text{-}E$ 曲线中段准线性区的中心**反曲拐点（Inflection Point）**处。在该拐点上，曲线斜率绝对值最大，而局部曲率（二阶导数）满足 $\left.\frac{\mathrm{d}^2 t}{\mathrm{d} E^2}\right|_{E_0} \approx 0$，从而使二阶非线性项在主阶上归零。
- **强参考光小信号条件（限制动态摆幅）**：在记录时严格控制参考光强远大于物光强，即满足**强参考光条件** $R_0^2 \gg O^2(x,y)$（实验中通常取光束比 $K \equiv R_0^2/\langle O^2\rangle = 3\sim 10$）。由交变曝光量公式可得交变曝光量 $\Delta E(x,y)$ 相对于直流工作点 $E_0$ 的相对调制度：

$$
\frac{|\Delta E(x,y)|}{E_0} = \frac{O^2(x,y)}{R_0^2} + 2\frac{O(x,y)}{R_0}\bigl|\cos(\phi_O - \phi_R)\bigr| \sim \frac{1}{K} + \frac{2}{\sqrt{K}}\bigl|\cos(\phi_O - \phi_R)\bigr|.
$$

当 $K \gg 1$（即 $O/R_0 \ll 1$）时，恒有 $|\Delta E(x,y)| \ll E_0$（小信号调制条件），且交变项中略去二阶小量 $O^2/R_0^2$ 后有 $\Delta E(x,y) \approx 2\tau_e R_0 O(x,y)\cos(\phi_O - \phi_R)$。这确保了总曝光量 $E(x,y) = E_0 + \Delta E(x,y)$ 始终被约束在工作点 $E_0$ 邻域极窄的准线性区间内作微幅摆动，不致越界进入趾部或肩部饱和区，故三阶及以上高阶余项 $\mathcal{O}(\Delta E^3)$ 亦可安全略去。

4. **线性透射率方程与四项分解式的导出**

在满足上述双重线性化判据后，泰勒展开式可严格截断至一阶线性项。记工作点 $E_0$ 处的静态背景透射率为 $t_b \equiv t(E_0)$，工作点处的 $t\text{-}E$ 曲线斜率为 $\beta \equiv \left.\frac{\mathrm{d} t}{\mathrm{d} E}\right|_{E_0}$，并定义光强线性调制系数 $\beta' \equiv \beta\tau_e$（对于常规显影的银盐负片，曝光越强处析出的金属银颗粒越密、透射率越低，故斜率 $\beta' < 0$；若经反转冲洗制成正片，则 $\beta' > 0$）。

将 $\Delta E(x,y) = \tau_e\bigl[I(x,y) - R_0^2\bigr]$ 代入一阶线性近似式，即得：

$$
t(x,y) = t(E_0) + \beta\Delta E(x,y) = t_b + \beta'\bigl[I(x,y) - R_0^2\bigr].
$$

（注：若引入准线性区切线反向延长线在纵轴上的等效截距 $t_0 \equiv t_b - \beta' R_0^2$，则上式亦可等价改写为文献中常见的切线截距形式 $t(x,y) = t_0 + \beta' I(x,y)$。）

最后，将全息记录光强基本方程的复振幅展开式 $I(x,y) = R_0^2 + |\tilde{O}|^2 + \tilde{O}\tilde{R}^* + \tilde{O}^*\tilde{R}$ 代入线性透射率方程，括号内的常数项 $R_0^2$ 精确相消，由此导出显影后全息图的**振幅透射率四项基本表达式**：

$$
t(x,y) = t_b + \beta'\bigl|\tilde{O}(x,y)\bigr|^2 + \beta'\tilde{O}(x,y)\tilde{R}^*(x,y) + \beta'\tilde{O}^*(x,y)\tilde{R}(x,y).
$$

#### 第二步：波前衍射再现与透射光场四项分解定理

在波前再现阶段，移去原三维物体，将显影定影后的全息图精确复位至 $z=0$ 平面，并用一束波长与记录时相同的**再现照明光波（Reconstruction Wave）** $\tilde{C}(x,y) = C(x,y)\mathrm{e}^{\mathrm{i}\phi_C(x,y)}$ 从左侧照明全息图。

当照明光波穿过 $z=0$ 平面的全息图时，紧贴全息图右表面（$z=0^+$ 平面）的初始透射光场复振幅 $\tilde{U}_t(x,y)$ 等于入射照明光复振幅与全息图振幅透射率 $t(x,y)$ 的乘积：

$$
\begin{aligned}
    \tilde{U}_t(x,y) &= \tilde{C}(x,y)\cdot t(x,y) \\
    &= t_b\tilde{C}(x,y) + \beta' O^2(x,y)\tilde{C}(x,y) \\
    &\quad + \beta'\tilde{C}(x,y)\tilde{R}^*(x,y)\tilde{O}(x,y) \\
    &\quad + \beta'\tilde{C}(x,y)\tilde{R}(x,y)\tilde{O}^*(x,y).
\end{aligned}
$$

上式给出了任意照明光波下的普适衍射场。在标准全息再现中，令再现照明光波与记录时的参考光波完全一致，即取 $\tilde{C}(x,y) \equiv \tilde{R}(x,y) = R_0\mathrm{e}^{\mathrm{i}\phi_R(x,y)}$（如图 1 所示）。此时有模平方恒等式：

$$
\tilde{C}(x,y)\tilde{R}^*(x,y) = \tilde{R}(x,y)\tilde{R}^*(x,y) = \bigl|R_0\mathrm{e}^{\mathrm{i}\phi_R(x,y)}\bigr|^2 \equiv R_0^2 \quad (\text{正实常数}),
$$

参考光自身的相位因子 $\mathrm{e}^{\mathrm{i}\phi_R}$ 与其复共轭 $\mathrm{e}^{-\mathrm{i}\phi_R}$ 在第三项中精确互消（这一过程在信息光学与通信理论中对应于**相干同步解调**）。由此可导出经典的**全息再现光场四项分解定理**。

#### 推导：全息图再现透射光场的四项分解与物理诠释

当采用原参考光波 $\tilde{R}(x,y) = R_0\mathrm{e}^{\mathrm{i}\phi_R(x,y)}$ 照明线性记录的全息图时，全息图后表面（$z=0^+$）的透射光波场可严格分解为四个物理性质迥异的衍射波分量：

$$
\begin{aligned}
    \tilde{U}_t(x,y) &= \tilde{R}(x,y)\cdot t(x,y) \\
    &= \tilde{U}_1(x,y) + \tilde{U}_2(x,y) + \tilde{U}_3(x,y) + \tilde{U}_4(x,y)
\end{aligned}
$$

其中四项波场的具体表达式与成像特性如下：

1. **第一项 $\tilde{U}_1(x,y) = t_b R_0 \mathrm{e}^{\mathrm{i}\phi_R(x,y)}$（零级直透光波）**：其复振幅仅为原参考光波 $\tilde{R}(x,y)$ 乘以常数衰减因子 $t_b$。该项代表直接透过全息图均匀背景的 **$0$ 级衍射透射波**，严格遵循照明参考光的原始方向继续传播，不携带关于物体的任何空间调制信息。
2. **第二项 $\tilde{U}_2(x,y) = \beta' O^2(x,y) R_0 \mathrm{e}^{\mathrm{i}\phi_R(x,y)}$（零级自相关晕光波 / Halo Wave）**：其载波相位因子仍为 $\mathrm{e}^{\mathrm{i}\phi_R(x,y)}$，故其中心传播方向与 $0$ 级直透光 $\tilde{U}_1$ 完全重合；然而由于其振幅受到空间非均匀物光强度 $O^2(x,y) = \tilde{O}\tilde{O}^*$ 的调制，依据傅里叶光学的卷积定理（空域乘积对应频域自相关），该光束会在 $0$ 级透射主光束外围产生一定角域的衍射展宽，形成弥散的背景光晕（即**自相关晕光**）。在满足强参考光条件 $R_0^2 \gg O^2(x,y)$ 时，$|\tilde{U}_2| \ll |\tilde{U}_3|$，其相对干扰强度显著降低。
3. **第三项 $\tilde{U}_3(x,y) = \beta' R_0^2 \tilde{O}(x,y) = \beta' R_0^2 O(x,y)\mathrm{e}^{\mathrm{i}\phi_O(x,y)}$（$+1$ 级衍射波 —— 正视三维虚像波）**：由于比例系数 $\beta' R_0^2$ 为纯实数常数（无论采用负片 $\beta'<0$ 抑或正片 $\beta'>0$，光强分布 $|\tilde{U}_3|^2$ 均完全一致），该项光波在 $z=0^+$ 平面上的复振幅分布与记录时三维物体发出的原始物光波 $\tilde{O}(x,y)$ **除一个实常数比例因子外完全等同**。当 $\tilde{U}_3(x,y)$ 在 $z>0$ 半空间继续向右传播并进入观察者瞳孔时，其波前曲率与光线发散角与记录时真实物体散射的波前毫无二致。人眼视觉系统将入瞳的发散光线向全息图后方（$z<0$ 侧）反向延伸，即在原三维物体的确切空间坐标处感知到一幅具有完整立体视差与景深的**正视三维虚像（Orthoscopic Virtual Image）**。
4. **第四项 $\tilde{U}_4(x,y) = \beta' R_0^2 \mathrm{e}^{\mathrm{i} 2\phi_R(x,y)}\tilde{O}^*(x,y) = \beta' R_0^2 O(x,y)\mathrm{e}^{\mathrm{i}[2\phi_R(x,y) - \phi_O(x,y)]}$（$-1$ 级衍射波 —— 共轭赝视实像波）**：该项正比于原物光波的**相位共轭波（Phase-Conjugate Wave）** $\tilde{O}^*(x,y) = O(x,y)\mathrm{e}^{-\mathrm{i}\phi_O(x,y)}$，并附加了倍频参考光相位因子 $\mathrm{e}^{\mathrm{i} 2\phi_R(x,y)}$。由于物光相位符号反演（$\phi_O \to -\phi_O$），原本自物点向外发散的球面波前被翻转为向空间共轭点坍缩会聚的球面波前。因此，$\tilde{U}_4(x,y)$ 离开全息图后无需借助任何成像透镜，即可在全息图前方（$z>0$ 侧）的自由空间中实际会聚，形成一幅可用毛玻璃屏直接承接的**共轭三维实像（Pseudoscopic Real Image）**。

#### 深度辨析：$-1$ 级共轭实像呈现“凹凸反转”赝视效应的几何成因

在全息实验中，直接迎光观察 $-1$ 级共轭实像往往会感知到奇异的纵深反转现象。设想原三维物体是一座面朝全息干板的浮雕头像：鼻尖距干板最近（设纵向距离为 $z_{\text{鼻}} = 15\ \mathrm{cm}$），耳部距干板较远（$z_{\text{耳}} = 25\ \mathrm{cm}$）。

当 $-1$ 级衍射波 $\tilde{U}_4$ 在全息图前方（$z>0$ 侧）会聚成形时，关于干板平面的纵向镜像对称性使得鼻尖实像点会聚于距全息图较近的 $z'_{\text{鼻}} = +15\ \mathrm{cm}$ 处，而耳部实像点会聚于距全息图较远的 $z'_{\text{耳}} = +25\ \mathrm{cm}$ 处。当观察者立于更右侧（如 $z = +50\ \mathrm{cm}$ 处）迎着光线向全息图方向注视该实像时，**耳部实像点反而处于观察者与鼻尖实像点之间（即耳部距人眼更近，鼻尖距人眼更远）**。与此同时，光线在记录时形成的前后景遮挡拓扑关系并未改变，这种“几何视差深度”与“遮挡心理线索”的剧烈冲突，导致观察者双目立体视觉重构出的景深彻底颠倒——原本凸出的鼻尖在视觉中内凹为孔洞，整座头像呈现出“内外翻转（Inside-out）”的立体错觉，光学上将其严格界定为**赝视像（Pseudoscopic Image）**。若需获取景深正常的正视实像（Orthoscopic Real Image），可采用一束逆向共轭参考光 $\tilde{C} = \tilde{R}^*$ 自全息图背面照明重建，或以该全息图为母版二次翻拍制作“二步像面全息图”。

![图 1 离轴全息成像的两步波前重建原理图](/picture/quan-xi-cheng-xiang/quan-xi-cheng-xiang1.png)

---

### 同轴孪生像串扰与离轴全息的空间角度分离判据

由再现光场四项分解定理可知，当照明参考光穿过全息图时，全息图后方会同时激发出三束物理性质迥异的衍射波场：$0$ 级直透光与自相关晕光（$\tilde{U}_1 + \tilde{U}_2$）、$+1$ 级发散虚像光（$\tilde{U}_3 \propto \tilde{O}$）以及 $-1$ 级会聚实像光（$\tilde{U}_4 \propto \tilde{O}^*$）。

决定全息成像质量的一个核心物理问题是：**既然这三束光波在同一时刻由同一张全息图孔径衍射而出，如何才能使观察者在迎光观察 $+1$ 级虚像时，视线完全避开 $0$ 级背景强光与 $-1$ 级实像的干扰？在记录与再现过程中，参考光与物光的主光轴夹角 $\theta_R$ 需要满足何种定量判据？**

本节从同轴全息的物理局限出发，结合波动光学的“空间相位斜率偏转定理”与光锥角谱展宽模型，严格推导离轴全息的空间载波分路机制与最小分离夹角判据。

#### 同轴全息（$\theta_R = 0^\circ$）的物理困境：孪生像共轴串扰

1948 年盖博创立全息术之初，受限于高压汞灯光源极为有限的时空相干性，采用了**同轴全息（In-line Holography）**光路构型：记录时，参考光与物光沿同一法线方向（夹角 $\theta_R = 0^\circ$）垂直照明干板，此时参考光在干板平面上的相位为空间常数（不妨设 $\phi_R(x,y) \equiv 0$）。

将 $\phi_R = 0$ 代入再现方程立即可见，$\tilde{U}_1, \tilde{U}_2, \tilde{U}_3, \tilde{U}_4$ 四项波场均不含任何改变传播方向的空间线性相位因子——**这意味着 $0$ 级直透光、$+1$ 级虚像光锥与 $-1$ 级实像光锥具有完全重合的中心光轴，三束波场在空间上共轴套叠并同时射向观察者瞳孔**（如图 2 所示）：

- 当观察者位于全息图右侧，迎光调焦于全息图后方（$z<0$ 侧）的 **$+1$ 级三维虚像**时，在全息图前方（$z>0$ 侧）会聚成形的 **$-1$ 级共轭实像**恰好悬浮在视线正中央。由于人眼晶状体调焦于远处的虚像平面，近处的实像光波在视网膜上形成严重的离焦弥散斑，化作孪生鬼影叠印在虚像之上；
- 与此同时，能量占主导地位的 **$0$ 级直透光与自相关晕光**亦沿同一法线方向直射入眼，严重降低了再现虚像的信噪比与衬比度。

这种虚像、实像与背景零级光沿同一视线共轴混叠、无法在空间上剥离的现象，即为制约早期全息术发展的**孪生像串扰问题（Twin-Image Problem）**。

#### 离轴全息（$\theta_R \neq 0^\circ$）的突破：空间载波相位与衍射偏转分路机制

为彻底破除共轴串扰，1962 年利思（E. N. Leith）与乌帕特尼克斯（J. Upatnieks）将通信理论中的“载波调制与频分复用”思想引入波动光学，提出了具有里程碑意义的**离轴全息（Off-Axis Holography）**方案：记录时，令物光波主轴依然垂直照射干板（沿 $z$ 轴正方向，平均倾角 $\theta_O = 0^\circ$），而**令平行参考光在 $xz$ 平面内以倾角 $\theta_R$ 斜入射至干板**（如图 2 所示）。

引入参考光倾角 $\theta_R$ 之所以能在再现阶段将原本共轴的三束衍射波分离至三个截然不同的空间方向，其内在的数学物理机制可严格归纳为以下四个步骤：

1. **第一性原理预备：平面波倾角与记录平面“空间线性相位因子”的双向锁定关系**

考察一束在 $xz$ 平面内沿与 $+z$ 轴成 $+\theta$ 角方向（向右上方倾斜）传播的单位振幅单色平面波。其三维波矢为 $\boldsymbol{k} = (k_x, 0, k_z) = (k\sin\theta, 0, k\cos\theta)$，故其在三维空间中的复振幅分布为：

$$
\tilde{U}(x,y,z) = U_0 \exp(\mathrm{i}\boldsymbol{k}\cdot\boldsymbol{r}) = U_0 \exp\bigl[\mathrm{i} k(x\sin\theta + z\cos\theta)\bigr].
$$

令 $z=0$，即得该倾斜平面波在全息干板平面上的复振幅分布：

$$
\tilde{U}(x,y,0) = U_0 \exp(\mathrm{i} k x \sin\theta).
$$

从几何光学的波前光程差审视，上式的物理图像极为清晰：当倾角为 $\theta$ 的平面波波前到达 $z=0$ 干板时，干板上横向坐标为 $x$ 的点较原点 $x=0$ 处多经历了一段几何光程 $\Delta L(x) = x\sin\theta$，从而引入了随坐标 $x$ 线性递增的相位差 $\phi(x) = k\Delta L(x) = kx\sin\theta$。

更为关键的是该关系的**逆定理（相位斜率决定传播方向定理）**：对于自干板后表面 $z=0^+$ 出射的任意光波，其沿 $x$ 方向附加的**空间线性相位梯度（相位斜率）直接决定了出射光波矢的横向分量 $k_x$**，从而唯一锁定了该光束在 $z>0$ 半空间的传播主轴倾角 $\theta_{\text{out}}$：

$$
k_x = \frac{\partial\phi}{\partial x} = k\sin\theta_{\text{out}} \quad \Longleftrightarrow \quad \sin\theta_{\text{out}} = \frac{1}{k}\frac{\partial\phi}{\partial x}.
$$

简言之：**在波前复振幅上乘以线性相位因子 $\exp(+\mathrm{i} k x \sin\alpha)$，在物理上等价于赋予光波横向波矢偏置 $\Delta k_x = +k\sin\alpha$，从而如闪耀光栅或楔形棱镜一般将光束主轴向上偏转。**

2. **记录阶段：参考光倾角以“符号相反的相位斜率”写入全息图**

在离轴记录阶段，设物光波 $\tilde{O}(x,y) = O(x,y)\mathrm{e}^{\mathrm{i}\phi_O(x,y)}$ 沿法线 $\theta_O = 0^\circ$ 正入射（其平均载波相位斜率为 $0$）；而参考光以倾角 $+\theta_R$ 斜入射，由上述平面波关系可知，参考光及其复共轭在 $z=0$ 干板上的复振幅分别为：

$$
\tilde{R}(x,y) = R_0 \exp(+\mathrm{i} k x \sin\theta_R), \qquad \tilde{R}^*(x,y) = R_0 \exp(-\mathrm{i} k x \sin\theta_R).
$$

若引入参考光的**空间载波频率** $f_c \equiv \sin\theta_R / \lambda$，则 $\tilde{R}(x,y) = R_0 \exp(\mathrm{i} 2\pi f_c x)$。上式呈现出核心的对称破缺特征：参考光自身 $\tilde{R}$ 携带**正斜率相位** $+\mathrm{i} k x \sin\theta_R$，而其复共轭 $\tilde{R}^*$ 携带**负斜率相位** $-\mathrm{i} k x \sin\theta_R$。

将上式代入显影后全息图的四项振幅透射率公式，可得离轴全息图的透射率函数：

$$
t(x,y) = \bigl[t_b + \beta' O^2(x,y)\bigr] + \beta' R_0 \tilde{O}(x,y)\exp(-\mathrm{i} k x \sin\theta_R) + \beta' R_0 \tilde{O}^*(x,y)\exp(+\mathrm{i} k x \sin\theta_R).
$$

该式表明，全息干板在编码物光信息的同时，将负相位斜率 $-k\sin\theta_R$ 锁定于原始物光项 $\tilde{O}$ 上，而将正相位斜率 $+k\sin\theta_R$ 锁定于共轭物光项 $\tilde{O}^*$ 上。

3. **再现阶段：照明光相位与透射率相位的代数叠加实现三路空间分束**

在波前再现阶段，再次采用倾角为 $+\theta_R$ 的原参考光 $\tilde{C}(x,y) = \tilde{R}(x,y) = R_0\exp(+\mathrm{i} k x \sin\theta_R)$ 照明全息图。依据透射场关系 $\tilde{U}_t(x,y) = t(x,y)\cdot\tilde{R}(x,y)$，**用斜入射参考光照明全息图，在数学上等价于对离轴透射率公式中的每一项统一乘上正斜率相位因子 $\exp(+\mathrm{i} k x \sin\theta_R)$（即在相位指数上统一叠加 $+k x \sin\theta_R$）**。

逐项考察这一相位叠加过程，三束出射光波的空间偏转方向遂得以严格确立：

- **第一路：$0$ 级直透光与自相关晕光（沿 $+\theta_R$ 方向传播）**

离轴透射率公式的前两项 $\bigl[t_b + \beta' O^2(x,y)\bigr]$ 为纯实数项，自身不含线性载波相位（相位斜率为 $0$）。当乘以再现光 $\tilde{R}(x,y) = R_0\exp(+\mathrm{i} k x \sin\theta_R)$ 后，该分量完整继承了再现光的正斜率线性相位：

$$
\tilde{U}_1 + \tilde{U}_2 = \bigl[t_b + \beta' O^2(x,y)\bigr] R_0 \exp(+\mathrm{i} k x \sin\theta_R).
$$

由相位斜率偏转定理，其中心载波横向波矢为 $k_{x,0} = +k\sin\theta_R$，故 $\sin\theta_0 = \sin\theta_R$，即 **$0$ 级直透光与晕光严格保持照明参考光的原始倾角 $\theta_0 = +\theta_R$，沿右上方继续传播**。

- **第二路：$+1$ 级正视虚像光（沿法线正前方 $\theta_{+1} = 0^\circ$ 传播）**

离轴透射率公式的第三项原本耦合了参考光共轭项 $\tilde{R}^*$ 的负斜率相位 $-\mathrm{i} k x \sin\theta_R$。当乘以再现光 $\tilde{R}$ 的正斜率相位 $+\mathrm{i} k x \sin\theta_R$ 时，指数上符号相反的两个线性倾斜相位发生**精确共轭相消**：

$$
\begin{aligned}
    \tilde{U}_3 &= \bigl[\beta' R_0 \tilde{O}(x,y)\exp(-\mathrm{i} k x \sin\theta_R)\bigr]\cdot \bigl[R_0 \exp(+\mathrm{i} k x \sin\theta_R)\bigr] \\
    &= \beta' R_0^2 \tilde{O}(x,y)\exp\bigl[\mathrm{i}(k x \sin\theta_R - k x \sin\theta_R)\bigr] = \beta' R_0^2 \tilde{O}(x,y).
\end{aligned}
$$

其物理图景在于：斜入射的再现光（倾角 $+\theta_R$）穿过全息图时，被全息图载波光栅精准地向下衍射偏转了 $-\theta_R$ 角，从而将参考光原本的倾斜波前彻底展平。由于线性载波相位归零（$\Delta k_x = 0$），**重现出的 $+1$ 级虚像光波 $\tilde{U}_3$ 完全恢复了记录时物光波沿法线正前方（$\theta_{+1} = 0^\circ$）传播的原始方向**，直接射向正前方的观察者。

- **第三路：$-1$ 级共轭实像光（沿倍增倾角 $\theta_{-1} \approx +2\theta_R$ 传播）**

离轴透射率公式的第四项原本即带有 $\tilde{R}$ 的正斜率相位 $+\mathrm{i} k x \sin\theta_R$。当再现阶段再次乘以照明光 $\tilde{R}$ 的正斜率相位 $+\mathrm{i} k x \sin\theta_R$ 时，两个同号的线性相位发生**同向倍增叠加**：

$$
\begin{aligned}
    \tilde{U}_4 &= \bigl[\beta' R_0 \tilde{O}^*(x,y)\exp(+\mathrm{i} k x \sin\theta_R)\bigr]\cdot \bigl[R_0 \exp(+\mathrm{i} k x \sin\theta_R)\bigr] \\
    &= \beta' R_0^2 \tilde{O}^*(x,y)\exp(+\mathrm{i} 2 k x \sin\theta_R).
\end{aligned}
$$

由相位斜率偏转定理，该波场的横向载波波矢倍增为 $k_{x,-1} = +2k\sin\theta_R$，故其出射倾角 $\theta_{-1}$ 满足：

$$
\sin\theta_{-1} = \frac{k_{x,-1}}{k} = 2\sin\theta_R \quad \xrightarrow{\text{傍轴小角度近似}} \quad \theta_{-1} \approx +2\theta_R.
$$

其物理图景在于：全息图光栅在入射参考光原有倾角 $+\theta_R$ 的基础上，进一步将其向上顺势衍射偏转了 $+\theta_R$ 角，使得 **$-1$ 级共轭实像光波以约 $+2\theta_R$ 的陡峭倾角向远轴方向衍射分离**。

将上述三束出射光波的复振幅与空间传播方向汇总，即构成离轴全息再现的分路方程组：

- **$0$ 级背景与晕光**：保持原倾角 $+\theta_R$，沿右上方传播；
- **$+1$ 级虚像光**：$\mathrm{e}^{+\mathrm{i}\phi_R}$ 与 $\mathrm{e}^{-\mathrm{i}\phi_R}$ 精确相消，沿正前方 $\theta_{+1} = 0^\circ$ 射向观察者；
- **$-1$ 级实像光**：叠加双倍线性相位 $\sin\theta_{-1} = 2\sin\theta_R$，沿倍增倾角 $\theta_{-1} \approx +2\theta_R$ 衍射偏离。

#### 最小分离夹角判据：$\theta_R \ge 3\Delta\theta_O$ 的角谱无混叠推导

尽管只要 $\theta_R \neq 0^\circ$，三束衍射波的中心主轴即发生分离，但在实验设计中并不能任意选取过小的离轴角（如 $\theta_R = 1^\circ$）。**原因在于真实的三维扩展物体具有有限的空间尺度，其散射的物光波并非单根几何光线，而是具有特定空间角谱宽度的发散光锥。**若参考光倾角 $\theta_R$ 过小，即便中心主光轴得以错开，相邻两束衍射光锥的边缘仍会发生空间交叠。欲实现零串扰的高保真再现，必须确保相邻衍射光锥的**角谱外边界彻底分离**。

设三维物体相对于全息干板中心的**半视场张角（半角宽度）为 $\Delta\theta_O$**，这意味着物光波 $\tilde{O}(x,y)$ 所含平面波分量的倾角分布在 $[-\Delta\theta_O, +\Delta\theta_O]$ 区间内，对应的最高空间频率（空间带宽）为：

$$
B \equiv f_{O,\max} = \frac{\sin(\Delta\theta_O)}{\lambda} \approx \frac{\Delta\theta_O}{\lambda}.
$$

以下分别核算正前方的“$+1$ 级虚像光锥”与相邻的“$0$ 级自相关晕光锥”各自占据的角度扇区边界（对照图 2）：

1. **$+1$ 级虚像光锥（$\tilde{U}_3$）的角度边界**：

由于 $\tilde{U}_3 \propto \tilde{O}(x,y)$ 完整复原了原始物光波，其中心主轴沿正前方 $\theta_{+1} = 0^\circ$ 传播，上下张开的半角宽度即为物体的半张角 $\Delta\theta_O$。因此，$+1$ 级虚像光锥在角度空间中占据 $[-\Delta\theta_O, +\Delta\theta_O]$ 扇区，其**上边界位于 $+\Delta\theta_O$ 处**（对应最高空间频率 $+B$）。

2. **$0$ 级自相关晕光锥（$\tilde{U}_2$）的角度边界（双倍频宽展宽效应）**：

$0$ 级光束的中心主轴沿参考光方向 $+\theta_R$ 传播。其中直透背景项 $\tilde{U}_1$ 仅为单一倾角的平行光束，而自相关晕光项 $\tilde{U}_2 \propto O^2(x,y)\tilde{R} = [\tilde{O}(x,y)\tilde{O}^*(x,y)]\tilde{R}$ 则呈现出显著的角域展宽。

从物理机制考察，$O^2(x,y)$ 源于物体表面不同散射点之间的**内部相互干涉（自相关）**：取物体最上端边缘发出的极限物光波 $\exp(+\mathrm{i} k x \sin\Delta\theta_O)$ 与最下端边缘发出的极限物光波 $\exp(-\mathrm{i} k x \sin\Delta\theta_O)$，这两束夹角最大的物光分量在干板上相干叠加所形成的自相关项包含交叉因子：

$$
\exp(+\mathrm{i} k x \sin\Delta\theta_O)\cdot \exp(-\mathrm{i} k x \sin\Delta\theta_O)^* = \exp\bigl(\pm\mathrm{i} 2 k x \sin\Delta\theta_O\bigr).
$$

这表明，物光自干涉条纹的最高空间频率达到了物光自身带宽 $B$ 的 **$2$ 倍**（即 $\pm 2B$）。当倾角为 $+\theta_R$ 的参考光照明该自干涉光栅时，在傍轴近似下，衍射出的自相关晕光锥将以 $+\theta_R$ 为中心向两侧展宽 $\pm 2\Delta\theta_O$。因此，$0$ 级晕光锥占据 $[\theta_R - 2\Delta\theta_O,\, \theta_R + 2\Delta\theta_O]$ 扇区，其**下边界向下延伸至 $\theta_R - 2\Delta\theta_O$ 处**（对应空间频率 $f_c - 2B$）。

3. **相邻光锥边缘互不交叠的临界分离条件**：

为确保观察者在正前方观测 $+1$ 级虚像时，$0$ 级自相关晕光锥的下边界（$\theta_R - 2\Delta\theta_O$）完全不侵入 $+1$ 级虚像光锥的上边界（$+\Delta\theta_O$），两者之间必须满足角域分离条件：

$$
\theta_R - 2\Delta\theta_O \ge +\Delta\theta_O \implies \theta_R \ge 3\Delta\theta_O.
$$

若摒弃小角度近似，直接由光栅衍射正弦关系（对应空间频域无混叠条件 $f_c - 2B \ge B$）严格表述，则上式推广为：

$$
\sin\theta_R \ge 3\sin(\Delta\theta_O) \quad \Longleftrightarrow \quad f_c \ge 3B.
$$

#### 核心物理图像总结：离轴全息最小夹角判据的三份角域构成

上述推导即为经典的**利思-乌帕特尼克斯离轴分离判据**。参考光倾角 $\theta_R$ 之所以至少需达到物体半张角 $\Delta\theta_O$ 的 $3$ 倍，是因为在主轴 $0^\circ$ 与 $+\theta_R$ 之间的角域间隔内，必须同时容纳相邻两束光锥的内侧半宽（图 2）：

- **第 $1$ 份 $\Delta\theta_O$**：用于容纳正前方 **$+1$ 级虚像光锥**向上张开的半角宽度（$0^\circ \to +\Delta\theta_O$）；
- **另外 $2$ 份 $\Delta\theta_O$**：用于容纳斜上方 **$0$ 级自相关晕光锥**向下弥散的半角宽度（因物体上下边缘极限物光自干涉的最大夹角为 $2\Delta\theta_O$，故其衍射晕光半宽恰为 $2\Delta\theta_O$）。

唯有当参考光倾角满足 $\theta_R \ge 3\Delta\theta_O$（或在强参考光 $R_0^2 \gg O^2$ 极限下忽略微弱自相关晕光 $\tilde{U}_2$ 时满足 $\theta_R \ge \Delta\theta_O$），$+1$ 级虚像光锥方能与 $0$ 级背景光及 $-1$ 级实像光在空间角域上彻底剥离，从而在纯净暗背景下重建高信噪比的三维立体波前。

![图 2 同轴全息中的共轭像串扰及离轴全息的角谱分离原理](/picture/quan-xi-cheng-xiang/quan-xi-cheng-xiang2.png)
