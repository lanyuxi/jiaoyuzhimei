# 教育之美 · Education Beauty

> 为未知而教，为未来而教

**教育之美**是一个面向中小学与大学基础学科的**交互式可视化教学平台**。
目标是把教育中那些抽象难懂的公式、概念与实验，变成**可拖拽、可调参、可观察、可记录**的交互画面——
让学生不是"记住结论"，而是"亲手看到它是怎么来的"。

覆盖学科：语文之美、数学之美、英语之美、物理之美、化学之美、生物之美、历史之美、地理之美、体育之美、艺术之美。
目前**数学、物理、化学**三科已上线完整可交互内容，其余学科为占位页（Coming Soon）。

---

## 目录

- [核心特性](#核心特性)
- [学科内容总览](#学科内容总览)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [可用脚本](#可用脚本)
- [环境变量](#环境变量)
- [后端 API](#后端-api)
- [架构说明](#架构说明)
  - [前端路由](#前端路由)
  - [讲解动画系统](#讲解动画系统)
  - [物理实验台运行时](#物理实验台运行时)
  - [化学实验与报告](#化学实验与报告)
  - [会话持久化](#会话持久化)
  - [静态实验资源](#静态实验资源)
- [开发规范](#开发规范)
- [测试](#测试)
- [构建与部署](#构建与部署)
- [CI/CD 与 GitHub 同步](#cicd-与-github-同步)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)
- [许可](#许可)

---

## 核心特性

| 特性 | 说明 |
| --- | --- |
| 🎛️ **实时参数调节** | 侧边参数面板可拖动滑块、切换预设，图像与数值实时重算 |
| 🎬 **讲解动画系统** | 每个课程配有口播稿件 + 分场景 PPT 动画，支持字幕、进度跳转、双音色切换 |
| 🔊 **双音色语音讲解** | 微软 Edge TTS 生成 `晓晓`（女声）与 `云希`（男声）两套 mp3，共 5000+ 音频文件 |
| 📐 **数学公式渲染** | KaTeX 渲染 LaTeX 公式，公式与图形同步高亮 |
| 📊 **科学绘图** | Plotly 精简内核（按需注册图表类型），支持 2D/3D 图形 |
| 🧪 **真实实验台** | 物理实验台支持**拖拽接线**、指针偏转、真实物理量计算（不是写死的假数字） |
| 📝 **实验报告自动生成** | 记录操作步骤、测量数据、计算过程、结论与误差分析，可回看历史会话 |
| ↩ **撤销 / 重做 / 重置** | 实验台内置运行时支持完整的历史栈 |
| 🐛 **内置反馈通道** | 任意实验页可提交问题反馈，配套管理后台处理 |
| 📱 **移动端可用** | 实验台适配触屏拖拽，窄屏自适应布局 |

---

## 学科内容总览

### 🔢 数学之美 — 55 个交互实验

按难度分为 5 级（入门 / 基础 / 中级 / 高级 / 专业），覆盖 8 大主题分类（几何、代数、微积分、概率统计、线性代数、分析、离散数学、应用数学）。

<details>
<summary><b>展开查看完整实验清单</b></summary>

**入门级（小学 6–12 岁）**
加减乘除可视化、分数可视化、基础几何图形、集合论可视化、黄金分割、数论探索

**基础级（初中 12–15 岁）**
一次函数、二次函数、勾股定理、三角函数、极坐标图形、概率分布、贝塞尔曲线、蒙特卡洛方法

**中级（高中 15–18 岁）**
圆锥曲线、微积分、泰勒级数、复数与复平面、参数方程、向量场、数值积分、插值方法、排列组合

**高级（大学本科）**
线性代数、矩阵分解、微分方程、傅里叶变换、傅里叶级数、傅里叶绘图、主成分分析、回归分析、中心极限定理、贝叶斯定理、马尔可夫链、牛顿法求根、梯度下降、优化算法、信号处理

**专业级（研究生+）**
混沌理论、分形几何、热方程、波动方程、拉普拉斯方程、数值分析、密码学、博弈论、图论、生命游戏、欧拉恒等式、三体问题、反应扩散、莫比乌斯带、微分几何、偏微分方程、随机游走

</details>

### ⚛️ 物理之美 — 133 个交互实验 + 65 个教材实验

分两套目录，可在页面顶部切换：

**① 教材实验（人教版初中物理，65 个）**

严格对照人教版教材编排，按册分组：

| 册次 | 实验数 | 覆盖内容示例 |
| --- | --- | --- |
| 八年级上册 | 18 | 刻度尺测长度、停表测时间、平均速度、声音的产生与传播、音调响度、温度计、熔化与沸腾、碘的升华凝华、光的反射、平面镜成像、凸透镜成像、密度测量 |
| 八年级下册 | 21 | 弹簧测力计、重力、阻力对运动的影响、二力平衡、滑动摩擦力、压强、液体压强、托里拆利、浮力、阿基米德原理、动能与势能、杠杆平衡、滑轮、斜面机械效率 |
| 九年级全一册 | 26 | 分子热运动与扩散、内能、比热容、热机、电荷作用、串并联电路、**电流表**、电压表、电阻、滑动变阻器、欧姆定律、伏安法测电阻、电功率、电流热效应、保险丝、通电螺线管、电磁铁、磁场对通电导体、电磁感应、电磁波、链式反应 |

其中 **4 个实验已提供完整可操作实验台**：

| 实验 ID | 实验名称 | 核心交互 |
| --- | --- | --- |
| `heat-capacity-comparison` | 比较不同物质的吸热能力 | 加热计时、温度曲线、比热容计算 |
| `series-parallel-circuit` | 连接串联电路和并联电路 | 实物接线、电路图互转、通路校验 |
| `ammeter-use` | 练习使用电流表 | 拖拽接线、双量程、指针偏转、串联/并联干路/支路三种测法 |
| `electromagnetic-induction` | 探究什么情况下磁可以生电 | 摇动转速、磁极方向、感应电流与检流计 |

其余实验在目录中标记为"制作中"，可查看教学目标与器材清单。

**② 拓展实验（133 个）**

按 14 个物理分支归类：力学、电磁学、波动、光学、热学、近代物理、电路电子、流体声学、天体物理、非线性动力学、量子信息、相对论、生物物理、地球物理。

覆盖从单摆、抛体、多普勒效应，到洛伦兹吸引子、双缝干涉、薛定谔猫、BB84 量子密钥分发、黑洞引力透镜、DNA 熔解、板块构造等大量前沿与跨学科题材。

### 🧪 化学之美 — 102 个交互实验

按 10 个分类组织：酸碱、有机、热力学、氧化还原、沉淀、气体、电化学、金属、分析化学、配位化学。
难度分三级（易 / 中 / 难），每个实验给出试剂、器材、教学目标与预计时长。

实验室流程：选择试剂 → 混合/加热 → 观察现象（气泡 / 沉淀 / 变色 / 放热吸热）→ 记录 pH、温度读数 → 生成实验报告。

### 📚 其他学科

语文、英语、生物、历史、地理、体育、艺术：目前为统一占位页，后续接入。

---

## 技术栈

**前端（`client/`）**

| 类别 | 选型 |
| --- | --- |
| 框架 | React 19 + TypeScript 5.9 |
| 构建 | Vite 7 |
| 路由 | react-router-dom 7（`BrowserRouter`，路由级懒加载 + 失败重试） |
| 样式 | Tailwind CSS 4（`@tailwindcss/vite`） |
| 图表 | Plotly.js 3（自定义精简内核，`react-plotly.js`） |
| 公式 | KaTeX + react-katex |
| 计算 | mathjs 15 |
| 图标 | lucide-react |
| 测试 | Vitest 3 |
| 包管理 | pnpm 11.7.0（`packageManager` 锁定） |

**后端（`server/`）**

| 类别 | 选型 |
| --- | --- |
| 运行时 | Node.js + TypeScript（ESM） |
| 框架 | Express 4 |
| 存储 | lowdb 7（JSON 文件持久化） |
| 开发 | tsx watch |

---

## 目录结构

```
.
├── client/                         # 前端应用
│   ├── src/
│   │   ├── App.tsx                 # 路由总表（全部路由懒加载）
│   │   ├── main.tsx                # 入口
│   │   ├── experiments/            # 数学：55 个实验页面 + 总览页
│   │   ├── physics/                # 物理
│   │   │   ├── curriculum/         #   教材实验目录（人教版，含测量定义）
│   │   │   ├── labs/               #   可操作实验台（definition / controller / Scene）
│   │   │   ├── runtime/            #   实验台外壳、运行时、报告弹窗、数据表
│   │   │   ├── sessions/           #   会话仓储（localStorage）
│   │   │   └── data.ts             #   拓展实验目录（133 个）
│   │   ├── chemistry/              # 化学
│   │   │   ├── data/experiments/   #   实验目录（按分类拆分批次文件）
│   │   │   ├── lesson.ts           #   实验步骤编排
│   │   │   ├── sessionStore.ts     #   会话与报告存储
│   │   │   └── *Page.tsx           #   列表 / 实验页 / 实验台 / 会话 / 报告
│   │   ├── narrations/             # 口播稿件（55 篇 · ts + json）
│   │   ├── components/
│   │   │   ├── NarrationPresenter/ #   讲解演示器 + 55 套场景渲染器
│   │   │   ├── NarrationController/#   播放控制
│   │   │   ├── NarrationSubtitle/  #   字幕
│   │   │   ├── NarrationOutline/   #   大纲导航
│   │   │   ├── ParameterPanel/     #   参数面板
│   │   │   ├── Layout/             #   布局与侧边栏
│   │   │   ├── BugReport/          #   问题反馈
│   │   │   └── MathFormula/        #   公式组件
│   │   ├── contexts/               # NarrationContext 等全局状态
│   │   ├── hooks/                  # usePresenterHistory 等
│   │   └── lib/plotly-custom.ts    # Plotly 精简内核
│   ├── public/
│   │   ├── audio/narrations/       # 55 个课程 × 2 音色的语音与清单（5000+ mp3）
│   │   ├── physics-original/       # 物理拓展实验静态资源（原站构建产物）
│   │   └── education-beauty-logo.png
│   ├── docs/                       # 讲解系统制作规范
│   ├── scripts/                    # 课程完整性校验、讲稿导出、音频生成
│   └── vite.config.ts
├── server/                         # 后端服务
│   └── src/
│       ├── index.ts                # Express 入口
│       ├── db/                     # lowdb 数据层
│       └── routes/                 # /api/experiments、/api/bugs、/api/admin
├── docs/superpowers/               # 设计与计划文档（物理教材实验等）
├── .github/workflows/deploy-pages.yml  # GitHub Pages 部署
├── .cnb.yml                        # CNB 流水线（GitHub 同步 + NPC 模型）
└── package.json                    # 根脚本（并行启动前后端）
```

---

## 快速开始

### 环境要求

- **Node.js** ≥ 20（推荐 22）
- **pnpm** 11.7.0（前端必需，锁文件为 pnpm-lock.yaml）

```bash
npm install -g pnpm@11.7.0
```

### 1. 安装依赖

```bash
# 一次性安装根目录 + client + server
npm run install:all
```

或分别安装：

```bash
npm install                # 根目录（concurrently）
cd client && pnpm install  # 前端
cd ../server && npm install # 后端
```

### 2. 启动开发环境

```bash
npm run dev
```

会通过 `concurrently` 同时拉起：

- 前端 Vite dev server → http://localhost:5173
- 后端 API server → http://localhost:3001

也可以只启动一端：

```bash
npm run dev:client
npm run dev:server
```

### 3. 打开页面

浏览器访问 **http://localhost:5173**，首页是学科总览，点击「数学之美 / 物理之美 / 化学之美」进入对应实验目录。

> Windows 用户也可直接双击根目录的 `start-local-preview.cmd` 启动前端预览。

---

## 可用脚本

### 根目录

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 并行启动前端 + 后端 |
| `npm run dev:client` | 仅启动前端 |
| `npm run dev:server` | 仅启动后端 |
| `npm run install:all` | 安装全部依赖 |

### client

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | Vite 开发服务器 |
| `pnpm build` | 生产构建（**先跑课程完整性校验**，再 `tsc -b` + `vite build`） |
| `pnpm preview` | 预览构建产物 |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` | Vitest 全量测试 |
| `pnpm test:watch` | 测试监听模式 |
| `pnpm check-courses` | 课程完整性校验（讲稿 / 场景配置 / 渲染器 / 注册表是否齐全） |
| `pnpm export-narrations` | 把 TS 讲稿导出为 JSON（供音频生成使用） |
| `pnpm generate-audio` | 用 Edge TTS 生成讲解音频（需 `pip install edge-tts`） |

### server

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | tsx watch 启动开发服务 |
| `npm run build` | 编译 TypeScript 到 `dist/` |
| `npm run start` | 运行编译产物 |

---

## 环境变量

### 前端

| 变量 | 取值 | 说明 |
| --- | --- | --- |
| `GITHUB_PAGES` | `true` | 构建时把资源基础路径设为 `/jiaoyuzhimei/`，用于 GitHub Pages 子路径部署。不设置则为基础路径 `/` |

### 后端

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | 监听端口 |
| `ADMIN_PASSWORD` | `mathviz2025` | 管理后台登录密码。**生产环境务必覆盖** |

---

## 后端 API

基地址：`http://localhost:3001`

### 健康检查

```
GET /api/health
→ { "status": "ok", "timestamp": "..." }
```

### 实验配置

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/experiments` | 获取全部实验配置（按更新时间倒序） |
| `GET` | `/api/experiments/:id` | 获取单个实验 |
| `POST` | `/api/experiments` | 新建实验，需要 `name` / `type` / `params` |
| `PUT` | `/api/experiments/:id` | 更新实验 |
| `DELETE` | `/api/experiments/:id` | 删除实验 |

### 问题反馈

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/bugs` | 反馈列表 |
| `GET` | `/api/bugs/:id` | 反馈详情 |
| `POST` | `/api/bugs` | 提交反馈，`description` 必填 |
| `PATCH` | `/api/bugs/:id/status` | 更新状态，可选值 `open` / `in_progress` / `resolved` / `closed` |
| `DELETE` | `/api/bugs/:id` | 删除反馈 |

### 管理后台

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/admin/login` | 密码登录，返回简单 token |

数据存放在 `server/data.json`（lowdb 管理）。

> ⚠️ **安全提示**：当前后端为教学/开发定位，管理接口使用简单密码与 Base64 token，未做会话校验。
> 若部署到公网，请自行替换为正式鉴权方案（JWT + RBAC + HTTPS），并修改默认密码。

---

## 架构说明

### 前端路由

所有页面组件都通过 `lazyRetry` 懒加载——失败会自动重试 2 次（应对移动端网络抖动），仍失败则由 `ErrorBoundary` 兜底。

主要路由：

| 路径 | 页面 |
| --- | --- |
| `/` | 学科总览首页 |
| `/math` | 数学实验目录 |
| `/{math-slug}` | 各数学实验（如 `/fourier`、`/euler-identity`、`/three-body`） |
| `/physics` | 物理目录（教材实验 / 拓展实验两个 Tab） |
| `/physics/labs/:id` | 物理教材实验台 |
| `/physics/:slug` | 物理拓展实验页 |
| `/physics/sessions` · `/physics/sessions/:id/report` | 物理会话列表与实验报告 |
| `/chemistry` | 化学实验目录 |
| `/chemistry/:slug` · `/chemistry/:slug/lab` | 化学实验介绍页与实验室 |
| `/chemistry/sessions` · `/chemistry/sessions/:id/report` | 化学会话列表与报告 |
| `/admin` | 问题反馈管理后台 |
| `/valentine` | 独立移动端彩蛋页 |

### 讲解动画系统

每个课程由 6 个部分组成（详见 `client/docs/narration-skill.md`）：

```
口播稿件 (src/narrations/scripts/{id}.ts)
    ↓ export-narrations
JSON 稿件 (src/narrations/scripts/{id}.json)
    ↓ generate-audio（Edge TTS）
音频 + manifest (public/audio/narrations/{id}/[xiaoxiao|yunxi]/)
    ↓
场景配置 (components/NarrationPresenter/{id}Scenes.ts)
    ↓
专属渲染器 (components/NarrationPresenter/scenes/{Course}/XxxSceneRenderer.tsx)
    ↓
注册到 SceneRendererFactory + NarrationPresenter
    ↓
实验页面通过 NarrationController 调用
```

- **通用场景类型**：标题、公式、波形、频谱、对比、插图、应用、总结
- **音频清单**：每个课程目录下 `manifest.json` 记录每句话的文件名、时长、大小与文本，播放器据此对齐字幕
- **音色策略**：`xiaoxiao`（女声，小学/初中）、`yunxi`（男声，高中及以上）

> `pnpm build` 前会执行 `check-course-integrity`，校验 55 个课程的「稿件 / 场景配置 / 渲染器 / 工厂注册 / 演示器注册」是否齐全，避免出现"新课程套用傅里叶动画"这类低级错误。

### 物理实验台运行时

物理实验台并不各写一套，而是统一接入 `runtime` 层，保证会话记录、数据表、撤销重做、报告链路一致：

```
definition.ts   物理常量与接线柱/量程定义
controller.ts   纯函数状态机：reduce(动作) → { 新状态, 反馈 }
Scene.tsx       视觉层：只负责画与派发动作
      ↓
useLabRuntime   提供 dispatch / undo / redo / reset / hydrate
PhysicsLabShell 统一外壳：工具栏、步骤条、数据表、报告弹窗、完成判定
```

- 实验注册在 `physics/labs/registry.ts`，ID 与课程表一一对应
- 非法操作**不会静默通过**，会返回带原因的教学反馈（如"电流表必须串联在电路中""禁止两端子直连""量程过小"）
- 测量值来自真实公式计算（例如电流表：`I = U / (R总 + R表)`），指针按量程分度值取整

新增一个教材实验台的步骤：写 `definition.ts` → 写 `controller.ts`（含 `completion` / `report`）→ 写 `Scene.tsx` → 在 `registry.ts` 注册 → 在课程表 `catalog.ts` 把该实验从"制作中"改为可用。

### 化学实验与报告

```
data/experiments/*.ts   实验种子数据（试剂、器材、目标、探针期望结果）
lesson.ts               由探针推导实验步骤（加试剂 → 混合 → 观察 → 记录 → 完成）
ChemistryLabPage.tsx    实验室交互
sessionStore.ts         会话 / 测量 / 报告写入 localStorage
```

观察结论由 `probe.expect` 推导：是否反应、是否产气、是否沉淀、是否变色、吸放热，再据此生成现象描述与 pH / 温度读数。

### 会话持久化

| 存储 key | 内容 |
| --- | --- |
| `education-beauty-physics-sessions-v1` | 物理实验会话（含运行时快照、测量记录、报告） |
| `education-beauty-chemistry-sessions` | 化学实验会话 |

物理会话仓储做了健壮性处理：`localStorage` 不可用（隐私模式等）时自动降级为内存存储；数据损坏时标记 `malformed` 并保留备份；版本不匹配标记 `stale`。

### 静态实验资源

`client/public/physics-original/` 存放物理拓展实验的静态构建产物（约 130 个实验页面 chunk、讲解清单、嵌入样式）。
它们由 `PhysicsExperimentFrame` 以 iframe 方式挂载，从而把旧的独立实验站零改造地集成进统一外壳。

---

## 开发规范

- **语言**：注释、文案、提交信息统一使用中文
- **类型**：全量 TypeScript `strict`，禁止 `any` 逃逸；`verbatimModuleSyntax` 要求类型导入显式 `import type`
- **未使用代码**：`noUnusedLocals` / `noUnusedParameters` 打开，提交前确保 `tsc -b` 无报错
- **提交信息**：采用语义化前缀 `feat:` / `fix:` / `refactor:` / `docs:` / `chore:`
- **不动无关文件**：一次改动只解决一个问题
- **新增课程必须过校验**：`pnpm check-courses` 必须通过

### 新增一个数学实验的清单

1. `src/experiments/{name}/{Name}Experiment.tsx` — 实验页面
2. `src/App.tsx` — 注册惰性路由
3. `src/components/Layout/Sidebar.tsx` 与 `src/experiments/Home.tsx` — 加入目录
4. （可选，做讲解动画时）`src/narrations/scripts/{id}.ts` + `{id}.json`
5. （可选）`src/components/NarrationPresenter/{id}Scenes.ts` + `scenes/{Course}/`
6. 跑 `pnpm check-courses` 与 `pnpm test`

---

## 测试

```bash
cd client
pnpm test          # 一次性运行
pnpm test:watch    # 监听模式
```

当前规模：**31 个测试文件 / 233 个用例，全部通过**。

测试覆盖的重点：

- 物理实验台状态机（接线校验、量程、读数、完成判定、计时）
- 物理会话仓储（持久化、损坏恢复、不可用降级）
- 课程目录完整性（教材实验 ID 与注册表一一对应、封面样式、难度分级）
- 化学集成（目录、步骤、报告）
- 数学算法正确性（三体演化有界性、生命游戏规则、Gray-Scott、莫比乌斯曲面、欧拉公式）

后端目前无自动化测试，改动后请手动验证接口。

---

## 构建与部署

### 本地构建

```bash
cd client
pnpm build      # 输出到 client/dist
pnpm preview    # 本地预览产物

cd ../server
npm run build   # 输出到 server/dist
npm run start
```

> 构建会先执行课程完整性校验。若报 `[xxx] 缺少场景渲染器`，说明该课程的讲解链路没配全，需补齐后再构建。
> 当前仓库已知：`pde` 课程缺少专属场景渲染器（既有问题，会阻断 `pnpm build` 的 prebuild 阶段）。临时绕过可执行 `pnpm exec vite build`。

### GitHub Pages 自动部署

`.github/workflows/deploy-pages.yml` 已配置：推送到 `main` 后自动构建前端并把 `client/dist` 发布到 `gh-pages` 分支。

流程要点：

1. `pnpm install --frozen-lockfile`（工作目录 `client`）
2. `pnpm build`，并注入 `GITHUB_PAGES=true`（使资源路径适配 `/jiaoyuzhimei/` 子路径）
3. 复制 `index.html` → `404.html` 实现 SPA 回退，写入 `.nojekyll`，删除预压缩文件
4. 强推到 `gh-pages`

站点地址：`https://lanyuxi.github.io/jiaoyuzhimei/`

### 其他部署方式

- **静态托管**：只要 `client/dist` 配上 SPA 回退规则即可（Netlify / Vercel / OSS + CDN 均可）
- **前后端分离**：前端静态托管，后端单独部署 Node 服务；需在网关把 `/api/*` 反向代理到后端端口

---

## CI/CD 与 GitHub 同步

仓库使用 **CNB（cnb.cool）** 作为主开发仓库，通过 `.cnb.yml` 定义流水线：

```yaml
main:
  push:
    - name: sync-to-github     # main 有推送时，自动同步到 GitHub
      imports:                 # 凭据来自独立密钥仓库，不写入仓库文件
        - https://cnb.cool/xixi2060/gh-secret/-/blob/main/github.yml
      stages:
        - name: sync to github
          image: tencentcom/git-sync
          settings:
            target_url: https://github.com/lanyuxi/jiaoyuzhimei.git
            branch: main
            force: true
            sync_mode: push
```

同时配置了 NPC（`@CodeBuddy`）在 Issue / PR 评论时触发的流水线，并将底层模型锁定为 `deepseek-v4.1-flash`。

**工作方式**：在 CNB 上开 PR → 合并进 `main` → 流水线自动把 `main` 同步到 GitHub `https://github.com/lanyuxi/jiaoyuzhimei`。
GitHub 侧再触发 Pages 部署，形成"CNB 开发 → GitHub 同步 → Pages 上线"的链路。

> 凭据保存在 CNB **密钥仓库**（Web 编辑、有审计日志），流水线用 `imports` 注入，不落地到代码仓库。
> 触发事件选择 `push`（可信事件），避免敏感值进入评论类不可信事件的执行环境。

---

## 常见问题

**Q：`pnpm install` 报锁文件不一致？**
请使用 pnpm 11.7.0（仓库已在 `packageManager` 字段锁定），并加 `--frozen-lockfile`。

**Q：`pnpm build` 报课程完整性校验失败？**
说明有课程的讲解链路缺失（讲稿 / 场景配置 / 渲染器 / 注册）。按提示补齐，或确认是既有问题后用 `pnpm exec vite build` 临时绕过。

**Q：实验页白屏或一直转圈？**
先看控制台是否为某 chunk 加载失败。路由做了 2 次自动重试；仍失败通常是构建产物与 CDN 缓存不一致，清缓存后重试。

**Q：讲解没有声音？**
确认 `client/public/audio/narrations/{课程}/manifest.json` 存在，且浏览器允许自动播放（首次需用户交互触发）。

**Q：提交反馈报 `Failed to submit`？**
反馈走后端 `/api/bugs`。请确认后端服务已在 3001 端口启动，并在网关配置了 `/api` 代理。

**Q：物理拓展实验显示了旧版页面？**
拓展实验通过 `client/public/physics-original/` 的静态产物以 iframe 挂载，更新需替换该目录内容。

---

## 贡献指南

1. 从 `main` 切出特性分支（推荐 `auto/{关键词}-{随机后缀}` 或 `feat/{name}`）
2. 完成改动，确保：
   ```bash
   cd client && pnpm exec tsc -b && pnpm test && pnpm lint
   ```
3. 提交（语义化信息，中文描述）
4. 推送并创建 PR，**PR 描述中引用对应 Issue**（`Ref: #编号`）
5. 等待评审与 CI，合并由人工完成

代码风格约定见 [开发规范](#开发规范)。新增内容较多时，建议先补测试再提 PR。

---

## 许可

本项目为教育用途项目。仓库未附带显式开源许可证文件，使用前请与作者确认授权范围。

- GitHub：https://github.com/lanyuxi/jiaoyuzhimei
- 主开发仓库（CNB）：https://cnb.cool/xixi2060/jiaoyuzhimei/jiaoyuzhimei

---

<div align="center">

**教育之美** · 为未知而教，为未来而教

</div>
