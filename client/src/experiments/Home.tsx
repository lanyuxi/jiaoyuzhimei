import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'

// 难度等级定义
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert'

export interface Experiment {
  path: string
  title: string
  description: string
  icon: string
  difficulty: DifficultyLevel
  ageRange: string
  topics: string[]
  hasAnimation: boolean
  hasSteps: boolean
}

// 难度等级配置 - 使用更精美的渐变色
export const difficultyConfig: Record<DifficultyLevel, { label: string; color: string; bgColor: string; gradient: string; ageRange: string }> = {
  beginner: { label: '入门级', color: 'text-emerald-700', bgColor: 'bg-emerald-50', gradient: 'from-emerald-400 to-teal-500', ageRange: '小学 6-12岁' },
  elementary: { label: '基础级', color: 'text-blue-700', bgColor: 'bg-blue-50', gradient: 'from-blue-400 to-indigo-500', ageRange: '初中 12-15岁' },
  intermediate: { label: '中级', color: 'text-amber-700', bgColor: 'bg-amber-50', gradient: 'from-amber-400 to-orange-500', ageRange: '高中 15-18岁' },
  advanced: { label: '高级', color: 'text-purple-700', bgColor: 'bg-purple-50', gradient: 'from-purple-400 to-pink-500', ageRange: '大学本科' },
  expert: { label: '专业级', color: 'text-rose-700', bgColor: 'bg-rose-50', gradient: 'from-rose-400 to-red-500', ageRange: '研究生+' },
}

// 主题分类
const topicCategories = [
  { id: 'geometry', label: '几何', icon: '📐' },
  { id: 'algebra', label: '代数', icon: '🔢' },
  { id: 'calculus', label: '微积分', icon: '∫' },
  { id: 'probability', label: '概率统计', icon: '🎲' },
  { id: 'linear-algebra', label: '线性代数', icon: '▦' },
  { id: 'analysis', label: '分析', icon: '📈' },
  { id: 'discrete', label: '离散数学', icon: '🔗' },
  { id: 'applied', label: '应用数学', icon: '⚙️' },
]

export const experiments: Experiment[] = [
  // ===== 入门级 (小学 6-12岁) =====
  {
    path: '/basic-arithmetic',
    title: '加减乘除可视化',
    description: '通过方块和数轴理解基本运算，掌握加减乘除的本质含义。',
    icon: '➕',
    difficulty: 'beginner',
    ageRange: '小学低年级',
    topics: ['algebra'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/fractions',
    title: '分数可视化',
    description: '通过饼图、条形图和网格图理解分数的概念，学习分数的比较和运算。',
    icon: '🥧',
    difficulty: 'beginner',
    ageRange: '小学中年级',
    topics: ['algebra'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/geometry-shapes',
    title: '基础几何图形',
    description: '学习三角形、长方形、正方形、圆等常见几何图形的面积和周长计算。',
    icon: '📐',
    difficulty: 'beginner',
    ageRange: '小学中年级',
    topics: ['geometry'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/set-theory',
    title: '集合论可视化',
    description: '通过韦恩图理解并集、交集、差集等集合运算，培养逻辑思维能力。',
    icon: '⭕',
    difficulty: 'beginner',
    ageRange: '小学高年级',
    topics: ['discrete'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/golden-ratio',
    title: '黄金分割',
    description: '斐波那契数列、黄金螺线、向日葵种子排列中的黄金比例，发现自然界的数学之美。',
    icon: '🐚',
    difficulty: 'beginner',
    ageRange: '小学高年级',
    topics: ['geometry', 'algebra'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/number-theory',
    title: '数论探索',
    description: '素数分布、Collatz 猜想、Ulam 螺旋等数论可视化，探索数字的奥秘。',
    icon: '🔢',
    difficulty: 'beginner',
    ageRange: '小学高年级',
    topics: ['algebra', 'discrete'],
    hasAnimation: true,
    hasSteps: true,
  },

  // ===== 基础级 (初中 12-15岁) =====
  {
    path: '/linear-function',
    title: '一次函数',
    description: '探索斜率和截距对直线的影响，理解一次函数的图像特征和性质。',
    icon: '📏',
    difficulty: 'elementary',
    ageRange: '初中',
    topics: ['algebra', 'geometry'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/quadratic-function',
    title: '二次函数',
    description: '探索抛物线的顶点、对称轴和根，理解二次函数的图像特征。',
    icon: '📐',
    difficulty: 'elementary',
    ageRange: '初中',
    topics: ['algebra', 'geometry'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/pythagorean',
    title: '勾股定理',
    description: '探索直角三角形中边长的关系，理解勾股定理的几何证明和实际应用。',
    icon: '📏',
    difficulty: 'elementary',
    ageRange: '初中',
    topics: ['geometry'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/conic-sections',
    title: '圆锥曲线',
    description: '探索椭圆、双曲线和抛物线的性质，理解焦点、准线和离心率。',
    icon: '🔵',
    difficulty: 'intermediate',
    ageRange: '高中',
    topics: ['geometry', 'algebra'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/trigonometry',
    title: '三角函数',
    description: '通过单位圆动画直观理解正弦、余弦函数，探索三角函数的周期性和相位变化。',
    icon: '📐',
    difficulty: 'elementary',
    ageRange: '初中',
    topics: ['geometry', 'algebra'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/polar',
    title: '极坐标图形',
    description: '探索玫瑰线、心形线、螺线等极坐标系中的美丽曲线。',
    icon: '🌸',
    difficulty: 'elementary',
    ageRange: '初中',
    topics: ['geometry'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/probability',
    title: '概率分布',
    description: '探索正态分布、泊松分布、二项分布等常见概率分布的形态与参数影响。',
    icon: '🎲',
    difficulty: 'elementary',
    ageRange: '初中',
    topics: ['probability'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/bezier',
    title: '贝塞尔曲线',
    description: '交互式贝塞尔曲线编辑器，de Casteljau 算法可视化，理解曲线的构造原理。',
    icon: '✏️',
    difficulty: 'elementary',
    ageRange: '初中',
    topics: ['geometry'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/monte-carlo',
    title: '蒙特卡洛方法',
    description: '用随机投点法估算圆周率π，体验随机模拟的强大威力。',
    icon: '🎯',
    difficulty: 'elementary',
    ageRange: '初中',
    topics: ['probability', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },

  // ===== 中级 (高中 15-18岁) =====
  {
    path: '/permutation-combination',
    title: '排列组合',
    description: '探索排列、组合与帕斯卡三角形的奥秘，理解计数原理和组合数学的应用。',
    icon: '🎯',
    difficulty: 'intermediate',
    ageRange: '高中',
    topics: ['probability', 'discrete'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/calculus',
    title: '微积分',
    description: '可视化导数的几何意义（切线斜率）和积分的几何意义（曲线下面积）。',
    icon: '∫',
    difficulty: 'intermediate',
    ageRange: '高中',
    topics: ['calculus'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/taylor',
    title: '泰勒级数',
    description: '观察多项式如何逐项逼近函数，理解泰勒展开的收敛性。',
    icon: 'Σ',
    difficulty: 'intermediate',
    ageRange: '高中',
    topics: ['calculus', 'analysis'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/complex',
    title: '复数与复平面',
    description: '在复平面上可视化复数运算，理解欧拉公式 e^(iθ) 的几何意义。',
    icon: 'ℂ',
    difficulty: 'intermediate',
    ageRange: '高中',
    topics: ['algebra', 'geometry'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/parametric',
    title: '参数方程',
    description: '利萨如图形、摆线、贝塞尔曲线等参数曲线的可视化。',
    icon: '〰️',
    difficulty: 'intermediate',
    ageRange: '高中',
    topics: ['geometry', 'calculus'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/vector-field',
    title: '向量场',
    description: '探索二维向量场的散度、旋度和流线，理解场论基础。',
    icon: '➡️',
    difficulty: 'intermediate',
    ageRange: '高中',
    topics: ['calculus', 'linear-algebra'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/numerical-integration',
    title: '数值积分',
    description: '矩形法、梯形法、Simpson 法的可视化比较，理解数值计算原理。',
    icon: '∫',
    difficulty: 'intermediate',
    ageRange: '高中',
    topics: ['calculus', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/interpolation',
    title: '插值方法',
    description: '线性、拉格朗日、牛顿和三次样条插值，学习数据拟合技术。',
    icon: '📈',
    difficulty: 'intermediate',
    ageRange: '高中',
    topics: ['algebra', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },

  // ===== 高级 (大学本科) =====
  {
    path: '/linear-algebra',
    title: '线性代数',
    description: '观察矩阵变换如何影响向量空间，理解特征值和特征向量的几何含义。',
    icon: '▦',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['linear-algebra'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/matrix-decomposition',
    title: '矩阵分解',
    description: '可视化 SVD、特征值分解、LU 和 QR 分解，理解矩阵的结构。',
    icon: '🔢',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['linear-algebra'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/ode',
    title: '微分方程',
    description: '简谐振动、阻尼振动、捕食者-猎物模型等ODE的数值解和相图。',
    icon: '📈',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['calculus', 'analysis'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/fourier',
    title: '傅里叶变换',
    description: '探索信号的频域分解，理解傅里叶级数如何将复杂波形分解为简单正弦波的叠加。',
    icon: '📊',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['analysis', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/fourier-series',
    title: '傅里叶级数',
    description: '用旋转圆可视化傅里叶级数的叠加，理解吉布斯现象。',
    icon: '🎵',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['analysis', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/fourier-drawing',
    title: '傅里叶绘图',
    description: '用旋转的圆（本轮）绘制任意图形，理解傅里叶级数的几何意义。',
    icon: '✏️',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['analysis', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/pca',
    title: '主成分分析',
    description: '可视化数据降维、特征提取和协方差矩阵分解。',
    icon: '📊',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['linear-algebra', 'probability'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/regression',
    title: '回归分析',
    description: '线性、多项式、指数和对数回归，最小二乘法拟合。',
    icon: '📉',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['probability', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/clt',
    title: '中心极限定理',
    description: '观察样本均值如何趋向正态分布，理解统计学中最重要的定理之一。',
    icon: '🔔',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['probability'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/bayes',
    title: '贝叶斯定理',
    description: '理解条件概率和贝叶斯推断，揭示"基础率谬误"的直觉陷阱。',
    icon: '🧮',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['probability'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/markov-chain',
    title: '马尔可夫链',
    description: '状态转移、稳态分布和随机过程模拟。',
    icon: '🔗',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['probability', 'discrete'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/newton-method',
    title: '牛顿法求根',
    description: '可视化牛顿-拉弗森迭代法，观察切线如何逐步逼近方程的根。',
    icon: '🎯',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['calculus', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/gradient-descent',
    title: '梯度下降',
    description: '机器学习核心算法，观察优化路径如何找到函数最小值。',
    icon: '⬇️',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['calculus', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/optimization',
    title: '优化算法',
    description: '比较梯度下降、动量、Adam、模拟退火等优化方法。',
    icon: '🎯',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['calculus', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/signal-processing',
    title: '信号处理',
    description: '探索滤波器、频谱分析、窗函数和信号去噪技术。',
    icon: '📡',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['analysis', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },

  // ===== 专业级 (研究生+) =====
  {
    path: '/chaos',
    title: '混沌理论',
    description: 'Logistic Map、Lorenz 吸引子，探索确定性系统中的混沌行为。',
    icon: '🦋',
    difficulty: 'expert',
    ageRange: '研究生',
    topics: ['analysis', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/fractal',
    title: '分形几何',
    description: '探索 Mandelbrot 集和 Julia 集的无限细节与自相似性。',
    icon: '🌀',
    difficulty: 'expert',
    ageRange: '研究生',
    topics: ['geometry', 'analysis'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/game-theory',
    title: '博弈论',
    description: '囚徒困境、纳什均衡、最优响应和演化博弈动态。',
    icon: '🎮',
    difficulty: 'expert',
    ageRange: '研究生',
    topics: ['discrete', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/wave-equation',
    title: '波动方程',
    description: '可视化驻波、行波、叠加和阻尼波，理解波动现象。',
    icon: '🌊',
    difficulty: 'expert',
    ageRange: '研究生',
    topics: ['calculus', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/heat-equation',
    title: '热传导方程',
    description: '一维热扩散过程的数值模拟和可视化。',
    icon: '🔥',
    difficulty: 'expert',
    ageRange: '研究生',
    topics: ['calculus', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/random-walk',
    title: '随机游走',
    description: '布朗运动、扩散过程和均方位移分析。',
    icon: '🚶',
    difficulty: 'expert',
    ageRange: '研究生',
    topics: ['probability', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/graph-theory',
    title: '图论基础',
    description: '可视化 BFS、DFS、Dijkstra 等图遍历算法的执行过程。',
    icon: '🕸️',
    difficulty: 'expert',
    ageRange: '研究生',
    topics: ['discrete', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },

  // ===== 新增实验 =====
  {
    path: '/laplace',
    title: '拉普拉斯变换',
    description: '探索时域与复频域之间的桥梁，理解系统响应和极点零点分析。',
    icon: '🔄',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['calculus', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/differential-geometry',
    title: '微分几何',
    description: '探索曲线与曲面的内在性质，学习 Frenet 标架、高斯曲率和测地线。',
    icon: '🌀',
    difficulty: 'expert',
    ageRange: '研究生',
    topics: ['geometry', 'calculus'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/pde',
    title: '偏微分方程',
    description: '探索多变量函数的微分方程，包括拉普拉斯方程、波动方程和热传导方程。',
    icon: '∂',
    difficulty: 'expert',
    ageRange: '研究生',
    topics: ['calculus', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/numerical-analysis',
    title: '数值分析',
    description: '学习数值计算的核心方法，包括误差分析、数值稳定性和迭代算法。',
    icon: '🔢',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['applied', 'calculus'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/cryptography',
    title: '密码学基础',
    description: '探索现代密码学的数学基础，包括 RSA、椭圆曲线和哈希函数。',
    icon: '🔐',
    difficulty: 'advanced',
    ageRange: '大学',
    topics: ['discrete', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/game-of-life',
    title: '康威生命游戏',
    description: '元胞自动机的经典之作，仅凭两条简单规则就涌现出滑翔机、脉冲星等复杂生命图案。',
    icon: '🦠',
    difficulty: 'intermediate',
    ageRange: '初中以上',
    topics: ['discrete', 'applied'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/euler-identity',
    title: '欧拉恒等式',
    description: '被誉为最美数学公式 e^(iπ)+1=0，动态展示复指数旋转如何将五个最重要的常数联系在一起。',
    icon: '🌀',
    difficulty: 'advanced',
    ageRange: '高中以上',
    topics: ['analysis', 'algebra'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/three-body',
    title: '三体引力轨道',
    description: '模拟牛顿万有引力下多颗天体的混沌之舞，探索著名的"8字"周期解与对初值的敏感依赖。',
    icon: '🪐',
    difficulty: 'expert',
    ageRange: '大学以上',
    topics: ['applied', 'calculus'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/reaction-diffusion',
    title: '反应扩散与图灵斑图',
    description: '用 Gray-Scott 模型模拟化学反应，亲眼看豹纹、珊瑚、斑马纹等图案从混沌中自发生长。',
    icon: '🐆',
    difficulty: 'advanced',
    ageRange: '高中以上',
    topics: ['applied', 'calculus'],
    hasAnimation: true,
    hasSteps: true,
  },
  {
    path: '/mobius',
    title: '莫比乌斯环与克莱因瓶',
    description: '可旋转的 3D 单侧曲面，蚂蚁不用翻越边缘就能走遍"两面"，揭开拓扑学不可定向曲面的奥秘。',
    icon: '♾️',
    difficulty: 'advanced',
    ageRange: '高中以上',
    topics: ['geometry'],
    hasAnimation: true,
    hasSteps: true,
  },
]

type CoverType =
  | 'arithmetic'
  | 'fraction'
  | 'geometry'
  | 'set'
  | 'spiral'
  | 'numberTheory'
  | 'linear'
  | 'quadratic'
  | 'pythagorean'
  | 'conic'
  | 'trig'
  | 'polar'
  | 'distribution'
  | 'bezier'
  | 'monteCarlo'
  | 'combinatorics'
  | 'calculus'
  | 'taylor'
  | 'complex'
  | 'parametric'
  | 'vectorField'
  | 'integration'
  | 'interpolation'
  | 'matrix'
  | 'ode'
  | 'fourier'
  | 'epicycle'
  | 'scatter'
  | 'bayes'
  | 'markov'
  | 'newton'
  | 'optimization'
  | 'signal'
  | 'chaos'
  | 'fractal'
  | 'game'
  | 'wave'
  | 'heat'
  | 'randomWalk'
  | 'graph'
  | 'surface'
  | 'cellular'
  | 'reaction'
  | 'threeBody'
  | 'formula'

type CoverSpec = {
  type: CoverType
  accent: string
  secondary?: string
  formula?: string
}

const coverSpecs: Record<string, CoverSpec> = {
  '/basic-arithmetic': { type: 'arithmetic', accent: '#2563eb', formula: '24 - 9 = 15' },
  '/fractions': { type: 'fraction', accent: '#7c3aed', formula: '3/4' },
  '/geometry-shapes': { type: 'geometry', accent: '#0891b2', formula: 'A = pi r^2' },
  '/set-theory': { type: 'set', accent: '#2563eb', secondary: '#22c55e', formula: 'A union B' },
  '/golden-ratio': { type: 'spiral', accent: '#d97706', formula: 'phi = 1.618' },
  '/number-theory': { type: 'numberTheory', accent: '#0f766e', formula: 'p_n' },
  '/linear-function': { type: 'linear', accent: '#2563eb', formula: 'y = ax + b' },
  '/quadratic-function': { type: 'quadratic', accent: '#7c3aed', formula: 'y = ax^2 + bx + c' },
  '/pythagorean': { type: 'pythagorean', accent: '#0891b2', formula: 'a^2 + b^2 = c^2' },
  '/conic-sections': { type: 'conic', accent: '#f97316', formula: 'x^2/a^2 + y^2/b^2 = 1' },
  '/trigonometry': { type: 'trig', accent: '#2563eb', formula: 'y = sin x' },
  '/polar': { type: 'polar', accent: '#8b5cf6', formula: 'r = cos(3theta)' },
  '/probability': { type: 'distribution', accent: '#06b6d4', formula: 'N(mu, sigma^2)' },
  '/bezier': { type: 'bezier', accent: '#f97316', formula: 'B(t)' },
  '/monte-carlo': { type: 'monteCarlo', accent: '#ef4444', formula: 'pi approx 4m/n' },
  '/permutation-combination': { type: 'combinatorics', accent: '#f59e0b', formula: 'C(n,k)' },
  '/calculus': { type: 'calculus', accent: '#2563eb', formula: "f'(x)" },
  '/taylor': { type: 'taylor', accent: '#7c3aed', formula: 'sum a_n x^n' },
  '/complex': { type: 'complex', accent: '#06b6d4', formula: 'e^(i theta)' },
  '/parametric': { type: 'parametric', accent: '#8b5cf6', formula: 'x(t), y(t)' },
  '/vector-field': { type: 'vectorField', accent: '#0f766e', formula: 'F(x,y)' },
  '/numerical-integration': { type: 'integration', accent: '#2563eb', formula: 'int f(x) dx' },
  '/interpolation': { type: 'interpolation', accent: '#f97316', formula: 'P(x)' },
  '/linear-algebra': { type: 'matrix', accent: '#2563eb', formula: 'Ax = lambda x' },
  '/matrix-decomposition': { type: 'matrix', accent: '#7c3aed', formula: 'A = U Sigma V^T' },
  '/ode': { type: 'ode', accent: '#ef4444', formula: "x'' + kx = 0" },
  '/fourier': { type: 'fourier', accent: '#2563eb', formula: 'F(omega)' },
  '/fourier-series': { type: 'epicycle', accent: '#8b5cf6', formula: 'sum c_n e^(int)' },
  '/fourier-drawing': { type: 'epicycle', accent: '#f97316', formula: 'z(t)' },
  '/pca': { type: 'scatter', accent: '#22c55e', formula: 'PC1' },
  '/regression': { type: 'scatter', accent: '#2563eb', formula: 'y = beta x' },
  '/clt': { type: 'distribution', accent: '#8b5cf6', formula: 'bar X -> N' },
  '/bayes': { type: 'bayes', accent: '#0f766e', formula: 'P(A|B)' },
  '/markov-chain': { type: 'markov', accent: '#2563eb', formula: 'P^n' },
  '/newton-method': { type: 'newton', accent: '#ef4444', formula: 'x - f/fprime' },
  '/gradient-descent': { type: 'optimization', accent: '#f97316', formula: 'theta -= eta grad J' },
  '/optimization': { type: 'optimization', accent: '#7c3aed', formula: 'min f(x)' },
  '/signal-processing': { type: 'signal', accent: '#06b6d4', formula: 's(t)' },
  '/chaos': { type: 'chaos', accent: '#ef4444', formula: 'x_{n+1}=rx(1-x)' },
  '/fractal': { type: 'fractal', accent: '#8b5cf6', formula: 'z^2 + c' },
  '/game-theory': { type: 'game', accent: '#0f766e', formula: 'payoff' },
  '/wave-equation': { type: 'wave', accent: '#2563eb', formula: 'u_tt = c^2 u_xx' },
  '/heat-equation': { type: 'heat', accent: '#f97316', formula: 'u_t = alpha u_xx' },
  '/random-walk': { type: 'randomWalk', accent: '#2563eb', formula: 'S_n' },
  '/graph-theory': { type: 'graph', accent: '#7c3aed', formula: 'G(V,E)' },
  '/laplace': { type: 'signal', accent: '#2563eb', formula: 'L{f(t)}' },
  '/differential-geometry': { type: 'surface', accent: '#06b6d4', formula: 'kappa, tau' },
  '/pde': { type: 'heat', accent: '#7c3aed', formula: 'u_t = Delta u' },
  '/numerical-analysis': { type: 'newton', accent: '#2563eb', formula: 'error_n' },
  '/cryptography': { type: 'numberTheory', accent: '#0f766e', formula: 'c = m^e mod n' },
  '/game-of-life': { type: 'cellular', accent: '#22c55e', formula: 'B3/S23' },
  '/euler-identity': { type: 'complex', accent: '#8b5cf6', formula: 'e^(i*pi)+1=0' },
  '/three-body': { type: 'threeBody', accent: '#f97316', formula: 'F = GmM/r^2' },
  '/reaction-diffusion': { type: 'reaction', accent: '#0f766e', formula: 'Gray-Scott' },
  '/mobius': { type: 'surface', accent: '#8b5cf6', formula: 'M(t,u)' },
}

const defaultCover: CoverSpec = { type: 'formula', accent: '#2563eb', formula: 'f(x)' }

function getCoverSpec(experiment: Experiment): CoverSpec {
  return coverSpecs[experiment.path] ?? { ...defaultCover, formula: experiment.title }
}

function makeCoverId(path: string) {
  return `math-cover-${path.replace(/[^a-z0-9-]/gi, '-')}`
}

function wavePath(amplitude = 34, frequency = 2, phase = 0) {
  return Array.from({ length: 81 }, (_, index) => {
    const x = 42 + index * 5.4
    const y = 116 - Math.sin((index / 80) * Math.PI * frequency + phase) * amplitude
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function parabolaPath() {
  return Array.from({ length: 81 }, (_, index) => {
    const t = -2.2 + (index / 80) * 4.4
    const x = 72 + ((t + 2.2) / 4.4) * 376
    const y = 164 - (t * t - 1.1 * t - 1.1) * 20
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function polarRosePath() {
  return Array.from({ length: 361 }, (_, index) => {
    const theta = (index / 360) * Math.PI * 2
    const r = 78 * Math.cos(3 * theta)
    const x = 260 + r * Math.cos(theta) * 1.45
    const y = 120 - r * Math.sin(theta) * 1.05
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function lissajousPath() {
  return Array.from({ length: 241 }, (_, index) => {
    const t = (index / 240) * Math.PI * 2
    const x = 260 + 145 * Math.sin(3 * t + Math.PI / 4)
    const y = 118 + 72 * Math.sin(2 * t)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function spiralPath() {
  return Array.from({ length: 160 }, (_, index) => {
    const t = (index / 18) * Math.PI
    const r = 4 + index * 0.82
    const x = 260 + r * Math.cos(t)
    const y = 120 + r * Math.sin(t)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function randomWalkPath() {
  const points = [
    [74, 145],
    [98, 124],
    [126, 132],
    [151, 104],
    [185, 111],
    [214, 86],
    [242, 100],
    [272, 82],
    [306, 96],
    [340, 72],
    [372, 90],
    [410, 72],
    [450, 96],
  ]
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
}

function ChartFrame({
  coverId,
  accent,
  children,
}: {
  coverId: string
  accent: string
  children: ReactNode
}) {
  const gridId = `${coverId}-grid`

  return (
    <svg viewBox="0 0 520 240" className="h-full w-full" role="img" aria-hidden="true">
      <defs>
        <pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.7" />
        </pattern>
        <filter id={`${coverId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="520" height="240" rx="10" fill="#ffffff" />
      <rect width="520" height="240" fill={`url(#${gridId})`} />
      <path d="M 42 120 H 478" stroke="#94a3b8" strokeWidth="1.4" />
      <path d="M 260 24 V 216" stroke="#94a3b8" strokeWidth="1.4" />
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((tick) => (
        <text key={`x-${tick}`} x={260 + tick * 46} y="222" textAnchor="middle" fill="#64748b" fontSize="12">
          {tick}
        </text>
      ))}
      {[-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2].map((tick) => (
        <text key={`y-${tick}`} x="28" y={124 - tick * 38} textAnchor="middle" fill="#64748b" fontSize="12">
          {tick}
        </text>
      ))}
      <circle cx="260" cy="120" r="2.8" fill={accent} />
      {children}
    </svg>
  )
}

function MathCoverPreview({ experiment }: { experiment: Experiment }) {
  const spec = getCoverSpec(experiment)
  const coverId = makeCoverId(experiment.path)

  return (
    <div className="h-[196px] overflow-hidden bg-white px-4 pt-4">
      <div className="h-full overflow-hidden rounded-[8px] bg-white">
        <PreviewChart spec={spec} coverId={coverId} />
      </div>
    </div>
  )
}

function PreviewChart({ spec, coverId }: { spec: CoverSpec; coverId: string }) {
  switch (spec.type) {
    case 'arithmetic':
      return <ArithmeticPreview coverId={coverId} accent={spec.accent} />
    case 'fraction':
      return <FractionPreview coverId={coverId} accent={spec.accent} />
    case 'geometry':
      return <GeometryPreview coverId={coverId} accent={spec.accent} />
    case 'set':
      return <SetPreview coverId={coverId} accent={spec.accent} secondary={spec.secondary ?? '#22c55e'} />
    case 'spiral':
      return <SpiralPreview coverId={coverId} accent={spec.accent} />
    case 'numberTheory':
      return <NumberTheoryPreview coverId={coverId} accent={spec.accent} />
    case 'linear':
      return <LinePreview coverId={coverId} accent={spec.accent} />
    case 'quadratic':
      return <QuadraticPreview coverId={coverId} accent={spec.accent} />
    case 'pythagorean':
      return <PythagoreanPreview coverId={coverId} accent={spec.accent} />
    case 'conic':
      return <ConicPreview coverId={coverId} accent={spec.accent} />
    case 'trig':
      return <TrigPreview coverId={coverId} accent={spec.accent} />
    case 'polar':
      return <PolarPreview coverId={coverId} accent={spec.accent} />
    case 'distribution':
      return <DistributionPreview coverId={coverId} accent={spec.accent} />
    case 'bezier':
      return <BezierPreview coverId={coverId} accent={spec.accent} />
    case 'monteCarlo':
      return <MonteCarloPreview coverId={coverId} accent={spec.accent} />
    case 'combinatorics':
      return <CombinatoricsPreview coverId={coverId} accent={spec.accent} />
    case 'calculus':
      return <CalculusPreview coverId={coverId} accent={spec.accent} />
    case 'taylor':
      return <TaylorPreview coverId={coverId} accent={spec.accent} />
    case 'complex':
      return <ComplexPreview coverId={coverId} accent={spec.accent} />
    case 'parametric':
      return <ParametricPreview coverId={coverId} accent={spec.accent} />
    case 'vectorField':
      return <VectorFieldPreview coverId={coverId} accent={spec.accent} />
    case 'integration':
      return <IntegrationPreview coverId={coverId} accent={spec.accent} />
    case 'interpolation':
      return <InterpolationPreview coverId={coverId} accent={spec.accent} />
    case 'matrix':
      return <MatrixPreview coverId={coverId} accent={spec.accent} />
    case 'ode':
      return <OdePreview coverId={coverId} accent={spec.accent} />
    case 'fourier':
      return <FourierPreview coverId={coverId} accent={spec.accent} />
    case 'epicycle':
      return <EpicyclePreview coverId={coverId} accent={spec.accent} />
    case 'scatter':
      return <ScatterPreview coverId={coverId} accent={spec.accent} />
    case 'bayes':
      return <BayesPreview coverId={coverId} accent={spec.accent} />
    case 'markov':
      return <MarkovPreview coverId={coverId} accent={spec.accent} />
    case 'newton':
      return <NewtonPreview coverId={coverId} accent={spec.accent} />
    case 'optimization':
      return <OptimizationPreview coverId={coverId} accent={spec.accent} />
    case 'signal':
      return <SignalPreview coverId={coverId} accent={spec.accent} />
    case 'chaos':
      return <ChaosPreview coverId={coverId} accent={spec.accent} />
    case 'fractal':
      return <FractalPreview coverId={coverId} accent={spec.accent} />
    case 'game':
      return <GamePreview coverId={coverId} accent={spec.accent} />
    case 'wave':
      return <WavePreview coverId={coverId} accent={spec.accent} />
    case 'heat':
      return <HeatPreview coverId={coverId} accent={spec.accent} />
    case 'randomWalk':
      return <RandomWalkPreview coverId={coverId} accent={spec.accent} />
    case 'graph':
      return <GraphPreview coverId={coverId} accent={spec.accent} />
    case 'surface':
      return <SurfacePreview coverId={coverId} accent={spec.accent} />
    case 'cellular':
      return <CellularPreview coverId={coverId} accent={spec.accent} />
    case 'reaction':
      return <ReactionPreview coverId={coverId} accent={spec.accent} />
    case 'threeBody':
      return <ThreeBodyPreview coverId={coverId} accent={spec.accent} />
    case 'formula':
    default:
      return <FormulaPreview coverId={coverId} accent={spec.accent} formula={spec.formula ?? 'f(x)'} />
  }
}

function ArithmeticPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {Array.from({ length: 12 }, (_, index) => (
        <rect key={index} x={94 + (index % 6) * 42} y={64 + Math.floor(index / 6) * 44} width="26" height="26" rx="6" fill={index < 7 ? accent : '#dbeafe'} opacity={index < 7 ? 0.9 : 1} />
      ))}
      <path d="M 92 168 H 430" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <circle cx="275" cy="168" r="8" fill="#ef4444" />
    </ChartFrame>
  )
}

function FractionPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <circle cx="182" cy="118" r="66" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="2" />
      <path d="M 182 118 L 182 52 A 66 66 0 0 1 248 118 Z" fill={accent} opacity="0.88" />
      <path d="M 182 118 L 248 118 A 66 66 0 0 1 182 184 Z" fill={accent} opacity="0.7" />
      {Array.from({ length: 8 }, (_, index) => (
        <rect key={index} x={315 + (index % 4) * 32} y={76 + Math.floor(index / 4) * 34} width="25" height="25" rx="5" fill={index < 5 ? accent : '#dbeafe'} opacity={index < 5 ? 0.86 : 1} />
      ))}
    </ChartFrame>
  )
}

function GeometryPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <polygon points="116,170 180,62 244,170" fill="#e0f2fe" stroke={accent} strokeWidth="4" />
      <rect x="290" y="82" width="112" height="88" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
      <circle cx="404" cy="82" r="28" fill="#ecfeff" stroke="#06b6d4" strokeWidth="4" />
    </ChartFrame>
  )
}

function SetPreview({ coverId, accent, secondary }: { coverId: string; accent: string; secondary: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <circle cx="214" cy="120" r="72" fill={accent} opacity="0.28" stroke={accent} strokeWidth="4" />
      <circle cx="306" cy="120" r="72" fill={secondary} opacity="0.28" stroke={secondary} strokeWidth="4" />
      <path d="M 260 56 A 72 72 0 0 1 260 184 A 72 72 0 0 1 260 56" fill="#a78bfa" opacity="0.35" />
    </ChartFrame>
  )
}

function SpiralPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={spiralPath()} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <rect x="112" y="52" width="92" height="92" rx="8" fill="#fef3c7" opacity="0.45" />
      <rect x="204" y="52" width="58" height="58" rx="8" fill="#fed7aa" opacity="0.45" />
    </ChartFrame>
  )
}

function NumberTheoryPreview({ coverId, accent }: { coverId: string; accent: string }) {
  const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47])

  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {Array.from({ length: 49 }, (_, index) => {
        const value = index + 1
        return (
          <rect key={value} x={142 + (index % 7) * 34} y={40 + Math.floor(index / 7) * 26} width="22" height="18" rx="4" fill={primes.has(value) ? accent : '#e2e8f0'} opacity={primes.has(value) ? 0.9 : 0.65} />
        )
      })}
    </ChartFrame>
  )
}

function LinePreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d="M 72 178 L 448 52" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <circle cx="142" cy="154" r="7" fill="#ef4444" />
      <circle cx="372" cy="78" r="7" fill="#ef4444" />
    </ChartFrame>
  )
}

function QuadraticPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={parabolaPath()} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <path d="M 206 42 V 204" stroke="#f97316" strokeWidth="2" strokeDasharray="7 7" />
      <circle cx="206" cy="146" r="7" fill="#ef4444" />
    </ChartFrame>
  )
}

function PythagoreanPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <polygon points="180,168 180,72 328,168" fill="#e0f2fe" stroke={accent} strokeWidth="4" />
      <rect x="104" y="72" width="76" height="76" rx="6" fill="#dbeafe" stroke="#60a5fa" strokeWidth="3" />
      <rect x="328" y="126" width="78" height="78" rx="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" transform="rotate(-33 328 126)" />
    </ChartFrame>
  )
}

function ConicPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <ellipse cx="260" cy="120" rx="116" ry="58" fill="none" stroke={accent} strokeWidth="4" />
      <path d="M 72 178 C 160 34 270 34 448 178" fill="none" stroke="#7c3aed" strokeWidth="3" />
      <path d="M 152 54 C 232 120 232 120 152 186" fill="none" stroke="#06b6d4" strokeWidth="3" />
      <path d="M 368 54 C 288 120 288 120 368 186" fill="none" stroke="#06b6d4" strokeWidth="3" />
    </ChartFrame>
  )
}

function TrigPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={wavePath(46, 4)} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <circle cx="130" cy="120" r="46" fill="none" stroke="#f97316" strokeWidth="3" />
      <line x1="130" y1="120" x2="166" y2="91" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
    </ChartFrame>
  )
}

function PolarPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={polarRosePath()} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 260 120 H 374" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
      <circle cx="374" cy="120" r="7" fill="#ef4444" />
    </ChartFrame>
  )
}

function DistributionPreview({ coverId, accent }: { coverId: string; accent: string }) {
  const heights = [28, 48, 70, 96, 124, 148, 132, 98, 68, 40, 24]

  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {heights.map((height, index) => (
        <rect key={index} x={88 + index * 30} y={188 - height} width="22" height={height} rx="5" fill={accent} opacity={0.18 + index * 0.055} />
      ))}
      <path d="M 70 188 C 136 180 156 66 252 66 C 350 66 372 180 450 188" fill="none" stroke={accent} strokeWidth="4" />
    </ChartFrame>
  )
}

function BezierPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d="M 92 168 L 190 58 L 326 182 L 430 72" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeDasharray="7 7" />
      <path d="M 92 168 C 190 58 326 182 430 72" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      {[92, 190, 326, 430].map((x, index) => (
        <circle key={x} cx={x} cy={[168, 58, 182, 72][index]} r="8" fill="#ef4444" />
      ))}
    </ChartFrame>
  )
}

function MonteCarloPreview({ coverId, accent }: { coverId: string; accent: string }) {
  const dots = [
    [132, 72, true],
    [176, 98, true],
    [214, 142, true],
    [252, 68, false],
    [294, 154, true],
    [338, 92, true],
    [376, 170, false],
    [410, 74, false],
    [156, 176, true],
    [232, 112, true],
    [322, 132, true],
    [392, 126, false],
  ]

  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <rect x="104" y="48" width="312" height="150" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M 104 198 A 150 150 0 0 1 254 48" fill="none" stroke={accent} strokeWidth="5" />
      {dots.map(([x, y, inside], index) => (
        <circle key={index} cx={x as number} cy={y as number} r="5" fill={inside ? '#22c55e' : '#ef4444'} opacity="0.9" />
      ))}
    </ChartFrame>
  )
}

function CombinatoricsPreview({ coverId, accent }: { coverId: string; accent: string }) {
  const rows = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]]

  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {rows.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => (
          <circle key={`${rowIndex}-${colIndex}`} cx={260 + (colIndex - row.length / 2) * 40 + 20} cy={54 + rowIndex * 34} r={10 + value * 1.5} fill={accent} opacity={0.25 + value * 0.08} />
        )),
      )}
    </ChartFrame>
  )
}

function CalculusPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={wavePath(34, 2.4, 0.4)} fill="none" stroke={accent} strokeWidth="4" />
      <path d="M 212 154 L 336 72" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
      <path d="M 132 120 C 188 168 260 168 338 120 L 338 188 L 132 188 Z" fill={accent} opacity="0.16" />
    </ChartFrame>
  )
}

function TaylorPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={wavePath(44, 1.8)} fill="none" stroke={accent} strokeWidth="4" />
      <path d="M 70 166 C 132 124 194 94 260 92 C 332 90 390 124 450 166" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="7 7" />
    </ChartFrame>
  )
}

function ComplexPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <circle cx="260" cy="120" r="74" fill="none" stroke="#c7d2fe" strokeWidth="3" />
      <path d="M 260 120 L 318 74" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <path d="M 298 86 A 52 52 0 0 1 328 122" fill="none" stroke="#ef4444" strokeWidth="3" />
      <circle cx="318" cy="74" r="8" fill="#ef4444" />
    </ChartFrame>
  )
}

function ParametricPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={lissajousPath()} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <circle cx="260" cy="120" r="7" fill="#ef4444" />
    </ChartFrame>
  )
}

function VectorFieldPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {Array.from({ length: 7 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => {
          const x = 92 + col * 42
          const y = 62 + row * 24
          const angle = Math.atan2(y - 120, x - 260) + Math.PI / 2
          const dx = Math.cos(angle) * 14
          const dy = Math.sin(angle) * 14
          return <path key={`${row}-${col}`} d={`M ${x - dx / 2} ${y - dy / 2} L ${x + dx / 2} ${y + dy / 2}`} stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
        }),
      )}
    </ChartFrame>
  )
}

function IntegrationPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {Array.from({ length: 9 }, (_, index) => {
        const x = 112 + index * 34
        const h = 28 + Math.sin(index / 2) * 34 + index * 6
        return <rect key={index} x={x} y={188 - h} width="30" height={h} fill={accent} opacity="0.18" stroke={accent} strokeWidth="1.4" />
      })}
      <path d={wavePath(38, 2.2, 0.6)} fill="none" stroke={accent} strokeWidth="4" />
    </ChartFrame>
  )
}

function InterpolationPreview({ coverId, accent }: { coverId: string; accent: string }) {
  const points = [
    [92, 164],
    [148, 92],
    [224, 126],
    [308, 74],
    [396, 142],
    [448, 78],
  ]

  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d="M 92 164 C 138 70 182 120 224 126 C 268 132 272 52 308 74 C 346 98 366 166 448 78" fill="none" stroke={accent} strokeWidth="4" />
      {points.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="#ef4444" />
      ))}
    </ChartFrame>
  )
}

function MatrixPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <polygon points="166,72 274,72 274,180 166,180" fill="#dbeafe" opacity="0.55" stroke="#60a5fa" strokeWidth="3" />
      <polygon points="252,52 404,82 358,184 206,154" fill={accent} opacity="0.24" stroke={accent} strokeWidth="4" />
      <path d="M 166 72 L 252 52 M 274 180 L 358 184" stroke="#94a3b8" strokeDasharray="6 6" strokeWidth="2" />
    </ChartFrame>
  )
}

function OdePreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={wavePath(42, 3.2)} fill="none" stroke={accent} strokeWidth="4" />
      <path d="M 112 120 C 162 70 224 70 260 120 C 296 170 358 170 408 120" fill="none" stroke="#0f766e" strokeWidth="3" strokeDasharray="8 7" />
    </ChartFrame>
  )
}

function FourierPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={wavePath(44, 4)} fill="none" stroke={accent} strokeWidth="4" />
      {[104, 140, 176, 212, 248, 284].map((x, index) => (
        <rect key={x} x={x} y={168 - index * 18} width="22" height={index * 18 + 18} rx="5" fill="#f97316" opacity={0.78 - index * 0.08} />
      ))}
    </ChartFrame>
  )
}

function EpicyclePreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <circle cx="168" cy="120" r="48" fill="none" stroke={accent} strokeWidth="3" />
      <circle cx="216" cy="120" r="30" fill="none" stroke={accent} strokeWidth="3" opacity="0.7" />
      <path d="M 168 120 L 216 120 L 238 99" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
      <path d="M 238 99 C 304 56 352 178 430 92" fill="none" stroke="#0f766e" strokeWidth="4" />
    </ChartFrame>
  )
}

function ScatterPreview({ coverId, accent }: { coverId: string; accent: string }) {
  const points = [
    [112, 168],
    [150, 142],
    [184, 150],
    [224, 112],
    [262, 122],
    [306, 94],
    [348, 82],
    [388, 78],
    [424, 58],
  ]

  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d="M 96 176 L 438 56" stroke={accent} strokeWidth="3" />
      {points.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="7" fill={index % 2 ? '#22c55e' : '#f97316'} opacity="0.9" />
      ))}
    </ChartFrame>
  )
}

function BayesPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <rect x="114" y="74" width="292" height="92" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M 114 166 L 210 74 L 306 166 L 406 74" fill="none" stroke={accent} strokeWidth="4" />
      <circle cx="210" cy="74" r="9" fill="#ef4444" />
      <circle cx="306" cy="166" r="9" fill="#ef4444" />
    </ChartFrame>
  )
}

function MarkovPreview({ coverId, accent }: { coverId: string; accent: string }) {
  const nodes = [
    [158, 120],
    [260, 70],
    [362, 120],
    [260, 176],
  ]

  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d="M 158 120 L 260 70 L 362 120 L 260 176 Z" fill="none" stroke={accent} strokeWidth="3" strokeDasharray="7 7" />
      {nodes.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="22" fill={accent} opacity="0.18" stroke={accent} strokeWidth="4" />
      ))}
    </ChartFrame>
  )
}

function NewtonPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={parabolaPath()} fill="none" stroke={accent} strokeWidth="4" />
      <path d="M 128 186 L 328 64" stroke="#ef4444" strokeWidth="3" />
      <path d="M 328 64 L 410 120" stroke="#ef4444" strokeWidth="3" strokeDasharray="6 6" />
      <circle cx="328" cy="64" r="8" fill="#ef4444" />
    </ChartFrame>
  )
}

function OptimizationPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d="M 92 70 C 152 170 220 170 260 120 C 306 60 364 76 430 180" fill="none" stroke={accent} strokeWidth="4" />
      <path d="M 128 88 L 172 128 L 220 146 L 260 120 L 300 92" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="8 7" />
      {[128, 172, 220, 260, 300].map((x, index) => (
        <circle key={x} cx={x} cy={[88, 128, 146, 120, 92][index]} r="6" fill="#ef4444" />
      ))}
    </ChartFrame>
  )
}

function SignalPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={wavePath(42, 5)} fill="none" stroke={accent} strokeWidth="4" />
      <path d="M 64 156 C 116 120 172 120 224 156 C 276 192 332 192 386 156 C 414 138 438 132 462 132" fill="none" stroke="#f97316" strokeWidth="3" opacity="0.8" />
    </ChartFrame>
  )
}

function ChaosPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {Array.from({ length: 100 }, (_, index) => {
        const x = 70 + index * 4
        const y = 62 + ((index * 37) % 116)
        return <circle key={index} cx={x} cy={y} r="2.4" fill={accent} opacity="0.72" />
      })}
      <path d="M 74 178 C 130 82 176 76 242 144 C 302 206 366 66 446 88" fill="none" stroke="#ef4444" strokeWidth="2.5" />
    </ChartFrame>
  )
}

function FractalPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <polygon points="260,46 124,190 396,190" fill="none" stroke={accent} strokeWidth="4" />
      <polygon points="260,46 192,118 328,118" fill="#ede9fe" stroke={accent} strokeWidth="2.4" />
      <polygon points="192,118 158,154 226,154" fill="#ede9fe" stroke={accent} strokeWidth="2.4" opacity="0.8" />
      <polygon points="328,118 294,154 362,154" fill="#ede9fe" stroke={accent} strokeWidth="2.4" opacity="0.8" />
    </ChartFrame>
  )
}

function GamePreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <rect x="152" y="70" width="216" height="112" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="260" y1="70" x2="260" y2="182" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="152" y1="126" x2="368" y2="126" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="210" cy="100" r="18" fill={accent} opacity="0.78" />
      <circle cx="314" cy="154" r="18" fill="#f97316" opacity="0.78" />
    </ChartFrame>
  )
}

function WavePreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={wavePath(46, 3)} fill="none" stroke={accent} strokeWidth="4" />
      <path d={wavePath(24, 6, 1.4)} fill="none" stroke="#06b6d4" strokeWidth="3" opacity="0.8" />
    </ChartFrame>
  )
}

function HeatPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {Array.from({ length: 10 }, (_, col) =>
        Array.from({ length: 5 }, (_, row) => (
          <rect key={`${col}-${row}`} x={108 + col * 30} y={60 + row * 28} width="28" height="26" rx="5" fill={col < 3 ? '#ef4444' : col < 6 ? accent : '#60a5fa'} opacity={0.32 + (10 - Math.abs(col - 3)) * 0.04} />
        )),
      )}
    </ChartFrame>
  )
}

function RandomWalkPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d={randomWalkPath()} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="74" cy="145" r="8" fill="#22c55e" />
      <circle cx="450" cy="96" r="8" fill="#ef4444" />
    </ChartFrame>
  )
}

function GraphPreview({ coverId, accent }: { coverId: string; accent: string }) {
  const nodes = [
    [144, 76],
    [248, 64],
    [368, 92],
    [190, 166],
    [318, 170],
  ]
  const edges = [[0, 1], [1, 2], [0, 3], [3, 4], [4, 2], [1, 4]]

  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {edges.map(([a, b], index) => (
        <line key={index} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#94a3b8" strokeWidth="3" />
      ))}
      {nodes.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="18" fill={accent} opacity="0.82" />
      ))}
    </ChartFrame>
  )
}

function SurfacePreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d="M 90 140 C 172 58 246 58 320 140 C 360 184 420 176 456 116" fill="none" stroke={accent} strokeWidth="5" />
      <path d="M 92 96 C 180 160 248 168 330 94 C 366 60 410 62 456 96" fill="none" stroke="#06b6d4" strokeWidth="4" opacity="0.8" />
      <path d="M 154 82 C 178 124 180 160 160 190" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
      <path d="M 350 58 C 328 104 328 156 366 190" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
    </ChartFrame>
  )
}

function CellularPreview({ coverId, accent }: { coverId: string; accent: string }) {
  const active = new Set(['2-1', '3-2', '1-3', '2-3', '3-3', '6-1', '6-2', '6-3', '7-2'])

  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {Array.from({ length: 9 }, (_, col) =>
        Array.from({ length: 5 }, (_, row) => (
          <rect key={`${col}-${row}`} x={126 + col * 30} y={62 + row * 28} width="24" height="24" rx="5" fill={active.has(`${col}-${row}`) ? accent : '#e2e8f0'} opacity={active.has(`${col}-${row}`) ? 0.9 : 0.7} />
        )),
      )}
    </ChartFrame>
  )
}

function ReactionPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      {Array.from({ length: 36 }, (_, index) => {
        const x = 104 + (index % 9) * 38
        const y = 58 + Math.floor(index / 9) * 34
        const r = 8 + ((index * 7) % 12)
        return <circle key={index} cx={x} cy={y} r={r} fill={index % 3 === 0 ? accent : index % 3 === 1 ? '#06b6d4' : '#f97316'} opacity="0.38" />
      })}
    </ChartFrame>
  )
}

function ThreeBodyPreview({ coverId, accent }: { coverId: string; accent: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <path d="M 124 120 C 188 40 316 200 396 98 C 318 42 182 198 124 120" fill="none" stroke={accent} strokeWidth="4" />
      <circle cx="124" cy="120" r="11" fill="#ef4444" />
      <circle cx="260" cy="120" r="11" fill="#2563eb" />
      <circle cx="396" cy="98" r="11" fill="#f59e0b" />
    </ChartFrame>
  )
}

function FormulaPreview({ coverId, accent, formula }: { coverId: string; accent: string; formula: string }) {
  return (
    <ChartFrame coverId={coverId} accent={accent}>
      <rect x="96" y="76" width="328" height="86" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      <text x="260" y="128" textAnchor="middle" fill={accent} fontSize="30" fontWeight="700" fontFamily="ui-serif, Georgia, serif">
        {formula}
      </text>
      <path d="M 174 146 H 346" stroke={accent} strokeWidth="5" strokeLinecap="round" />
    </ChartFrame>
  )
}

// 按难度分组
const groupByDifficulty = (exps: Experiment[]) => {
  const groups: Record<DifficultyLevel, Experiment[]> = {
    beginner: [],
    elementary: [],
    intermediate: [],
    advanced: [],
    expert: [],
  }
  exps.forEach((exp) => {
    groups[exp.difficulty].push(exp)
  })
  return groups
}

export default function Home() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all')
  const [selectedTopic, setSelectedTopic] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 判断是否情人节前后（2月12日-2月16日）
  const now = new Date()
  const isValentineSeason = now.getMonth() === 1 && now.getDate() >= 12 && now.getDate() <= 16

  // 过滤实验
  const filteredExperiments = experiments.filter((exp) => {
    const matchesDifficulty = selectedDifficulty === 'all' || exp.difficulty === selectedDifficulty
    const matchesTopic = selectedTopic === 'all' || exp.topics.includes(selectedTopic)
    const matchesSearch =
      searchQuery === '' ||
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesDifficulty && matchesTopic && matchesSearch
  })

  const groupedExperiments = groupByDifficulty(filteredExperiments)

  // 统计各难度数量
  const difficultyStats = {
    beginner: experiments.filter((e) => e.difficulty === 'beginner').length,
    elementary: experiments.filter((e) => e.difficulty === 'elementary').length,
    intermediate: experiments.filter((e) => e.difficulty === 'intermediate').length,
    advanced: experiments.filter((e) => e.difficulty === 'advanced').length,
    expert: experiments.filter((e) => e.difficulty === 'expert').length,
  }

  return (
    <div className="max-w-7xl mx-auto">

      {/* 情人节横幅 */}
      {isValentineSeason && (
        <Link
          to="/valentine"
          className="block w-full mb-6 md:mb-10 group relative overflow-hidden rounded-2xl border border-pink-200/50 bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 p-4 md:p-6 text-left hover:shadow-xl hover:shadow-pink-200/30 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 via-rose-400/10 to-red-400/5 group-hover:from-pink-400/10 group-hover:via-rose-400/15 group-hover:to-red-400/10 transition-all duration-500" />
          <div className="relative flex items-center gap-3 md:gap-5">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-400/30 group-hover:scale-110 transition-transform duration-500">
              <span className="text-2xl md:text-3xl">💕</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base md:text-xl font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-red-500 bg-clip-text text-transparent">
                情人节快乐！四种数学表白函数
              </div>
              <div className="text-pink-500/70 text-xs md:text-sm mt-1">
                心形参数方程 · 笛卡尔心形线 · 隐函数心形 · 简洁心形 — 点击查看沉浸式动画
              </div>
            </div>
            <div className="text-pink-400 group-hover:translate-x-1 transition-transform">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* 头部 - 更精美的设计 */}
      <header className="mb-6 md:mb-10">
        <div className="flex items-center gap-3 md:gap-4 mb-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <span className="text-2xl md:text-3xl text-white">∑</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
              数学之美
            </h1>
            <p className="text-slate-500 text-sm md:text-base mt-0.5 md:mt-1">
              通过交互式可视化，探索数学的奥秘与美感
            </p>
          </div>
        </div>
      </header>

      {/* 统计卡片 - 移动端横向滚动 */}
      <div className="mb-6 md:mb-10 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex md:grid md:grid-cols-5 gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 snap-x snap-mandatory md:snap-none">
          {(Object.keys(difficultyConfig) as DifficultyLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setSelectedDifficulty(selectedDifficulty === level ? 'all' : level)}
              className={`relative flex-shrink-0 w-32 md:w-auto p-4 md:p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden group snap-start ${
                selectedDifficulty === level
                  ? 'border-indigo-400 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* 背景渐变装饰 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${difficultyConfig[level].gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

              <div className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${difficultyConfig[level].gradient} bg-clip-text text-transparent`}>
                {difficultyStats[level]}
              </div>
              <div className="text-xs md:text-sm font-semibold text-slate-700 mt-1">{difficultyConfig[level].label}</div>
              <div className="text-xs text-slate-400 mt-0.5 hidden md:block">{difficultyConfig[level].ageRange}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 筛选栏 - 玻璃态设计 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-4 md:p-5 mb-6 md:mb-10">
        <div className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:gap-4 md:items-center">
          {/* 搜索框 */}
          <div className="w-full md:flex-1 md:min-w-[200px] relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="搜索实验..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all outline-none text-base"
            />
          </div>

          {/* 主题筛选 - 移动端横向滚动 */}
          <div className="-mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 md:flex-wrap">
              <button
                onClick={() => setSelectedTopic('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedTopic === 'all'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部
              </button>
              {topicCategories.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(selectedTopic === topic.id ? 'all' : topic.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedTopic === topic.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {topic.icon} {topic.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 实验列表 - 按难度分组 */}
      {selectedDifficulty === 'all' ? (
        // 显示所有分组
        (Object.keys(difficultyConfig) as DifficultyLevel[]).map((level) => {
          const levelExperiments = groupedExperiments[level]
          if (levelExperiments.length === 0) return null

          return (
            <section key={level} className="mb-8 md:mb-12">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
                <div className={`w-1 md:w-1.5 h-6 md:h-8 rounded-full bg-gradient-to-b ${difficultyConfig[level].gradient}`} />
                <span
                  className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-semibold ${difficultyConfig[level].bgColor} ${difficultyConfig[level].color}`}
                >
                  {difficultyConfig[level].label}
                </span>
                <span className="text-slate-400 text-xs md:text-sm hidden sm:inline">{difficultyConfig[level].ageRange}</span>
                <span className="text-slate-300 text-xs md:text-sm hidden sm:inline">·</span>
                <span className="text-slate-400 text-xs md:text-sm">{levelExperiments.length} 个</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {levelExperiments.map((exp) => (
                  <ExperimentCard key={exp.path} experiment={exp} />
                ))}
              </div>
            </section>
          )
        })
      ) : (
        // 显示单个分组
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredExperiments.map((exp) => (
            <ExperimentCard key={exp.path} experiment={exp} />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {filteredExperiments.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-3xl md:text-4xl">🔍</span>
          </div>
          <h3 className="text-base md:text-lg font-semibold text-slate-700 mb-2">没有找到匹配的实验</h3>
          <p className="text-slate-500 text-sm md:text-base">尝试调整筛选条件或搜索关键词</p>
        </div>
      )}
    </div>
  )
}

// 实验卡片组件
function ExperimentCard({ experiment }: { experiment: Experiment }) {
  const config = difficultyConfig[experiment.difficulty]

  return (
    <Link
      to={experiment.path}
      className="group block overflow-hidden rounded-lg border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/60 active:scale-[0.98]"
    >
      <MathCoverPreview experiment={experiment} />
      <div className="space-y-3 px-4 pb-4 pt-3">
        <h2 className="text-base font-bold leading-6 text-slate-900 transition-colors group-hover:text-blue-600">
          {experiment.title}
        </h2>
        <p className="min-h-[44px] overflow-hidden text-sm leading-[22px] text-slate-500 line-clamp-2">{experiment.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
          {experiment.hasAnimation && (
            <span className="rounded-[8px] bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600">
              动画
            </span>
          )}
          {experiment.hasSteps && (
            <span className="rounded-[8px] bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-600">
              步骤
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
