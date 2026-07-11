# 物理之美教材仿真实验阶段 A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立人教版 65 项教材实验目录、原生 React 仿真实验运行时、会话与报告系统，并交付三个可完整操作的九年级标杆实验。

**Architecture:** 教材元数据、通用运行时、器材组件、实验控制器和会话存储分层实现。新教材实验使用 `/physics/labs/:slug` 原生路由；现有 `/physics/:slug` iframe 路由保持不变并归入“拓展实验”。阶段 A 只开放三个已通过完成验收的标杆实验，其余教材条目保留完整内容和明确的未开放状态，后续实验包按同一控制器协议接入。

**Tech Stack:** React 19、TypeScript 5.9、React Router 7、Tailwind CSS 4、Vitest 3、SVG/Canvas、Pointer Events、localStorage、Lucide React。

## Global Constraints

- 权威范围是 `D:/下载中心/人教版初中物理实验清单.xlsx` 的 65 项：八年级上册 21 项、八年级下册 18 项、九年级全一册 26 项。
- 教材版本显示为“人教版”，不显示“2024 新教材”。
- 每项教材实验都保存实验目的、实验原理、实验器材、实验步骤、实验结论、实验补充六类内容。
- 现有 133 个实验必须继续从“拓展实验”访问，现有 `physics-original` 资源和 `/physics/:slug` 路由不得删除。
- 新教材实验必须原生运行，不得使用 iframe 嵌入独立 HTML。
- 仿真实验采用 2D SVG/Canvas；关键器材支持鼠标与触摸操作。
- 实验控制器必须是纯函数，不直接访问 DOM、React 状态或 localStorage。
- 仪器读数由实验状态计算，不能用固定展示数字代替物理计算。
- 会话存储使用版本化 localStorage；损坏数据不得导致页面白屏。
- 新增按钮图标使用 Lucide React，并提供可访问名称和提示。
- 卡片圆角不超过 8px；场景尺寸稳定；桌面与 390×844 移动视口不得重叠。
- 本地 `npm run dev` 热更新、`npm test`、`npm run build` 和 `GITHUB_PAGES=true` 构建必须可用。
- 阶段 A 完成后仍需分别执行九年级剩余 23 项、八年级下册 18 项、八年级上册 21 项和全量发布计划；阶段 A 不是 65 项最终完成状态。

---

## File Map

### Curriculum and routing

- `client/src/physics/curriculum/types.ts`: 教材、实验、测量字段和开放状态类型。
- `client/src/physics/curriculum/catalog.ts`: 65 项工作簿内容与查询索引。
- `client/src/physics/curriculum/catalog.test.ts`: 数量、唯一性、章节和六字段完整性测试。
- `client/src/physics/TextbookPhysicsCatalog.tsx`: 左侧教材树、筛选、搜索和教材卡片。
- `client/src/physics/LegacyPhysicsCatalog.tsx`: 从现有 `PhysicsHome.tsx` 提取的 133 项拓展目录。
- `client/src/physics/PhysicsHome.tsx`: “教材实验/拓展实验”一级标签容器。
- `client/src/physics/TextbookPhysicsExperimentPage.tsx`: 教材实验详情、未开放状态和实验台入口。
- `client/src/App.tsx`: 教材实验、会话和报告路由。

### Runtime and sessions

- `client/src/physics/runtime/types.ts`: `LabAction`、`LabController`、器材与步骤协议。
- `client/src/physics/runtime/geometry.ts`: 命中、距离、边界和吸附计算。
- `client/src/physics/runtime/geometry.test.ts`: 几何边界测试。
- `client/src/physics/runtime/reducer.ts`: 通用实验动作归约、撤销、重置和步骤反馈。
- `client/src/physics/runtime/reducer.test.ts`: 状态机正确和错误路径测试。
- `client/src/physics/runtime/useLabRuntime.ts`: React 与纯控制器之间的适配层。
- `client/src/physics/runtime/usePointerDrag.ts`: Pointer Events 拖拽适配。
- `client/src/physics/runtime/PhysicsLabShell.tsx`: 三栏实验台骨架。
- `client/src/physics/runtime/ExperimentInfo.tsx`: 六类实验内容展示。
- `client/src/physics/runtime/MeasurementTable.tsx`: 原始量与派生量表格。
- `client/src/physics/runtime/ExperimentReportDialog.tsx`: 会话报告弹窗。
- `client/src/physics/sessions/types.ts`: 会话、事件、测量和报告类型。
- `client/src/physics/sessions/repository.ts`: 可注入 `StorageLike` 的版本化存储。
- `client/src/physics/sessions/repository.test.ts`: 保存、恢复、损坏数据和版本测试。
- `client/src/physics/sessions/PhysicsSessionsPage.tsx`: 历史会话列表。
- `client/src/physics/sessions/PhysicsReportPage.tsx`: 独立报告页。

### Benchmark labs

- `client/src/physics/labs/registry.ts`: 实验 ID 到定义、控制器和场景组件的注册表。
- `client/src/physics/labs/heat-capacity/definition.ts`: “比较不同物质的吸热能力”教学与测量定义。
- `client/src/physics/labs/heat-capacity/controller.ts`: 加热、温升、计时、记录和结论模型。
- `client/src/physics/labs/heat-capacity/controller.test.ts`: 热学公式与步骤测试。
- `client/src/physics/labs/heat-capacity/HeatCapacityScene.tsx`: 水和食用油实验场景。
- `client/src/physics/labs/series-parallel/definition.ts`: “连接串联电路和并联电路”定义。
- `client/src/physics/labs/series-parallel/controller.ts`: 端子、导线、支路和短路校验。
- `client/src/physics/labs/series-parallel/controller.test.ts`: 电路拓扑测试。
- `client/src/physics/labs/series-parallel/SeriesParallelScene.tsx`: 可拖拽导线和元件场景。
- `client/src/physics/labs/electromagnetic-induction/definition.ts`: “探究什么情况下磁可以生电”定义。
- `client/src/physics/labs/electromagnetic-induction/controller.ts`: 切割磁感线、电流方向和记录模型。
- `client/src/physics/labs/electromagnetic-induction/controller.test.ts`: 感应电流测试。
- `client/src/physics/labs/electromagnetic-induction/ElectromagneticInductionScene.tsx`: 磁体、导体棒和电流计场景。

---

### Task 1: Import the 65-item curriculum catalog

**Files:**
- Create: `client/src/physics/curriculum/types.ts`
- Create: `client/src/physics/curriculum/catalog.ts`
- Create: `client/src/physics/curriculum/catalog.test.ts`

**Interfaces:**
- Consumes: 工作簿 `八年级上册!A4:L24`、`八年级下册!A4:L21`、`九年级全一册!A4:L29`。
- Produces: `textbookPhysicsExperiments: readonly TextbookPhysicsExperiment[]`、`textbookExperimentById: ReadonlyMap<string, TextbookPhysicsExperiment>`、`filterTextbookExperiments(filters: CurriculumFilters)`。

- [ ] **Step 1: Write the failing catalog integrity test**

```ts
import { describe, expect, it } from 'vitest'
import { textbookPhysicsExperiments } from './catalog'

describe('textbook physics catalog', () => {
  it('contains the exact 65-item volume split', () => {
    const counts = textbookPhysicsExperiments.reduce<Record<string, number>>((result, item) => {
      result[item.volume] = (result[item.volume] ?? 0) + 1
      return result
    }, {})
    expect(textbookPhysicsExperiments).toHaveLength(65)
    expect(counts['八年级上册']).toBe(21)
    expect(counts['八年级下册']).toBe(18)
    expect(counts['九年级全一册']).toBe(26)
  })

  it('has unique ids and all six teaching sections', () => {
    expect(new Set(textbookPhysicsExperiments.map((item) => item.id)).size).toBe(65)
    for (const item of textbookPhysicsExperiments) {
      expect(item.textbook).toBe('人教版')
      expect(item.purpose.length).toBeGreaterThan(0)
      expect(item.principle.length).toBeGreaterThan(0)
      expect(item.apparatus.length).toBeGreaterThan(0)
      expect(item.steps.length).toBeGreaterThan(0)
      expect(item.conclusion.length).toBeGreaterThan(0)
      expect(item.supplement.length).toBeGreaterThan(0)
    }
  })

})
```

- [ ] **Step 2: Run the test and verify RED**

Run from `client`:

```powershell
npm test -- src/physics/curriculum/catalog.test.ts
```

Expected: FAIL because `./catalog` does not exist.

- [ ] **Step 3: Add the exact domain types**

```ts
export type TextbookVolume = '八年级上册' | '八年级下册' | '九年级全一册'
export type ExperimentRequirement = 'required' | 'optional'
export type ExperimentActivityType = '基础技能' | '测量' | '探究' | '演示' | '模型'
export type ExperimentAvailability = 'available' | 'scheduled'

export interface MeasurementDefinition {
  key: string
  label: string
  unit: string
  kind: 'raw' | 'derived' | 'observation'
  decimals?: number
}

export interface TextbookPhysicsExperiment {
  id: string
  sourceNumber: number
  title: string
  textbook: '人教版'
  volume: TextbookVolume
  chapter: string
  sourceType: string
  requirement: ExperimentRequirement
  activityType: ExperimentActivityType
  purpose: readonly string[]
  principle: readonly string[]
  apparatus: readonly string[]
  steps: readonly string[]
  conclusion: readonly string[]
  supplement: readonly string[]
  measurements: readonly MeasurementDefinition[]
  availability: ExperimentAvailability
  labId?: string
}

export interface CurriculumFilters {
  volume: TextbookVolume | 'ALL'
  chapter: string | 'ALL'
  requirement: ExperimentRequirement | 'ALL'
  query: string
}
```

- [ ] **Step 4: Transcribe and normalize all 65 workbook rows**

Create `catalog.ts` with one `TextbookPhysicsExperiment` per workbook row. Use the exact workbook text for title, chapter, purpose, principle, apparatus, steps, conclusion and supplement. Split the apparatus cell on `、` and keep each remaining long text cell as a one-item string array. Apply these deterministic mappings:

```ts
const requiredSourceTypes = new Set([
  '基础技能·建议必做',
  '基础技能·必做',
  '测量·建议必做',
  '测量·必做',
  '探究·必做',
])

const activityTypeByPrefix = {
  基础技能: '基础技能',
  测量: '测量',
  探究: '探究',
  演示: '演示',
  模型: '模型',
} as const

function requirementFromSource(sourceType: string) {
  return requiredSourceTypes.has(sourceType) ? 'required' : 'optional'
}

function activityTypeFromSource(sourceType: string) {
  const prefix = sourceType.split(/[·/]/)[0] as keyof typeof activityTypeByPrefix
  return activityTypeByPrefix[prefix]
}
```

Use stable English IDs. The three benchmark records use `heat-capacity-comparison`, `series-parallel-circuit`, and `electromagnetic-induction`; every record initially uses `availability: 'scheduled'`. Tasks 7-9 change availability only in the same commit that registers a working controller. All rows include measurement definitions: quantitative experiments define workbook-relevant raw and derived fields; qualitative experiments define at least one `kind: 'observation'` field.

- [ ] **Step 5: Add indexes and pure filtering**

```ts
export const textbookExperimentById = new Map(textbookPhysicsExperiments.map((item) => [item.id, item]))

export function filterTextbookExperiments(filters: CurriculumFilters) {
  const query = filters.query.trim().toLocaleLowerCase('zh-CN')
  return textbookPhysicsExperiments.filter((item) => {
    const matchesVolume = filters.volume === 'ALL' || item.volume === filters.volume
    const matchesChapter = filters.chapter === 'ALL' || item.chapter === filters.chapter
    const matchesRequirement = filters.requirement === 'ALL' || item.requirement === filters.requirement
    const haystack = [item.title, item.chapter, ...item.purpose, ...item.principle].join(' ').toLocaleLowerCase('zh-CN')
    return matchesVolume && matchesChapter && matchesRequirement && (!query || haystack.includes(query))
  })
}
```

- [ ] **Step 6: Run catalog tests and full typecheck**

```powershell
npm test -- src/physics/curriculum/catalog.test.ts
node .\node_modules\typescript\bin\tsc -b
```

Expected: catalog tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit**

```powershell
git add client/src/physics/curriculum
git commit -m "feat: add physics curriculum catalog"
```

---

### Task 2: Split textbook and legacy catalogs

**Files:**
- Create: `client/src/physics/LegacyPhysicsCatalog.tsx`
- Create: `client/src/physics/TextbookPhysicsCatalog.tsx`
- Modify: `client/src/physics/PhysicsHome.tsx:1-409`
- Modify: `client/package.json`
- Modify: `client/package-lock.json`
- Test: `client/src/physicsCatalog.test.ts`

**Interfaces:**
- Consumes: `textbookPhysicsExperiments`, `filterTextbookExperiments`, existing `physicsExperiments`.
- Produces: `PhysicsHome` with `catalog=textbook|extended` URL search parameter and links to `/physics/labs/:id` or existing `/physics/:slug`.

- [ ] **Step 1: Write the failing source integration test**

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('physics catalog navigation', () => {
  it('separates textbook and extended experiments', () => {
    const root = process.cwd()
    const home = readFileSync(join(root, 'src/physics/PhysicsHome.tsx'), 'utf8')
    const textbook = readFileSync(join(root, 'src/physics/TextbookPhysicsCatalog.tsx'), 'utf8')
    const legacy = readFileSync(join(root, 'src/physics/LegacyPhysicsCatalog.tsx'), 'utf8')
    expect(home).toContain('教材实验')
    expect(home).toContain('拓展实验')
    expect(textbook).toContain('/physics/labs/')
    expect(legacy).toContain('/physics/')
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

```powershell
npm test -- src/physicsCatalog.test.ts
```

Expected: FAIL because the two catalog components do not exist.

- [ ] **Step 3: Add Lucide React**

Run from `client`:

```powershell
npm install lucide-react
```

Expected: `lucide-react` appears in `client/package.json` dependencies and lockfiles update.

- [ ] **Step 4: Extract the current 133-item catalog without behavior changes**

Move the existing cover artwork, category/difficulty filters, `ExperimentCard`, and legacy catalog rendering from `PhysicsHome.tsx` into `LegacyPhysicsCatalog.tsx`. Preserve `physicsExperiments`, `physicsCategories`, existing card links and copy. Export `default function LegacyPhysicsCatalog()`.

- [ ] **Step 5: Build the textbook catalog**

Use this state contract and derive chapters from the selected volume:

```ts
const [filters, setFilters] = useState<CurriculumFilters>({
  volume: '九年级全一册',
  chapter: 'ALL',
  requirement: 'ALL',
  query: '',
})

const chapters = [...new Set(
  textbookPhysicsExperiments
    .filter((item) => filters.volume === 'ALL' || item.volume === filters.volume)
    .map((item) => item.chapter),
)]
const results = filterTextbookExperiments(filters)
```

Render a restrained left directory rail, compact top filter controls, result count, and four-column card grid. Cards with `availability: 'available'` link to `/physics/labs/${item.id}`; scheduled cards render a disabled `制作中` state and never navigate to an empty page. Use `BookOpen`, `Search`, `FlaskConical`, and `LockKeyhole` icons with tooltips or accessible labels.

- [ ] **Step 6: Replace `PhysicsHome` with the two-tab shell**

Read and write the `catalog` URL search parameter so refresh preserves the active tab:

```ts
const [searchParams, setSearchParams] = useSearchParams()
const activeCatalog = searchParams.get('catalog') === 'extended' ? 'extended' : 'textbook'

function selectCatalog(next: 'textbook' | 'extended') {
  setSearchParams(next === 'textbook' ? {} : { catalog: 'extended' })
}
```

The first viewport must show the tabs and course directory, without the current four large statistics cards.

- [ ] **Step 7: Verify catalog behavior**

```powershell
npm test -- src/physicsCatalog.test.ts src/physics/curriculum/catalog.test.ts src/physicsIntegration.test.ts
node .\node_modules\typescript\bin\tsc -b
```

Expected: PASS. Update old `physicsIntegration.test.ts` source assertions only where `PhysicsHome` extraction intentionally moved code; keep all 133 legacy assertions.

- [ ] **Step 8: Commit**

```powershell
git add client/package.json client/package-lock.json client/src/physics client/src/physicsCatalog.test.ts client/src/physicsIntegration.test.ts
git commit -m "feat: add textbook physics catalog"
```

---

### Task 3: Add textbook detail and route isolation

**Files:**
- Create: `client/src/physics/TextbookPhysicsExperimentPage.tsx`
- Create: `client/src/physics/runtime/ExperimentInfo.tsx`
- Modify: `client/src/App.tsx:80-86,171-177`
- Test: `client/src/physicsRoutes.test.ts`

**Interfaces:**
- Consumes: `textbookExperimentById`.
- Produces: `/physics/labs/:id` route contract and six-section scheduled experiment detail page.

- [ ] **Step 1: Write the failing routing test**

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

it('routes textbook labs before the legacy slug route', () => {
  const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8')
  expect(app.indexOf('path="physics/labs/:id"')).toBeLessThan(app.indexOf('path="physics/:slug"'))
  expect(app).toContain("import('./physics/TextbookPhysicsExperimentPage')")
})
```

- [ ] **Step 2: Run the test and verify RED**

```powershell
npm test -- src/physicsRoutes.test.ts
```

Expected: FAIL because the textbook routes are absent.

- [ ] **Step 3: Implement the six-section information component**

```ts
export interface ExperimentInfoProps {
  experiment: TextbookPhysicsExperiment
}

const sections = [
  ['实验目的', 'purpose'],
  ['实验原理', 'principle'],
  ['实验器材', 'apparatus'],
  ['实验步骤', 'steps'],
  ['实验结论', 'conclusion'],
  ['实验补充', 'supplement'],
] as const
```

Render unframed content bands or compact cards only for individually framed content; do not nest cards. Steps use an ordered list, apparatus uses a compact list, and formulas remain selectable text.

- [ ] **Step 4: Implement the page and unavailable state**

The page resolves `id` through `textbookExperimentById`. Unknown IDs show a clear not-found message and link to `/physics`; scheduled experiments show all six teaching sections plus `该实验正在制作中` and no fake laboratory. Task 6 adds the lab host after the runtime and registry exist.

- [ ] **Step 5: Add lazy routes in order**

```tsx
const TextbookPhysicsExperimentPage = lazyRetry(() => import('./physics/TextbookPhysicsExperimentPage'))
<Route path="physics" element={<PhysicsHome />} />
<Route path="physics/labs/:id" element={<TextbookPhysicsExperimentPage />} />
<Route path="physics/:slug" element={<PhysicsExperimentFrame />} />
```

The lab route remains an experiment page and continues to show the bug-report button.

- [ ] **Step 6: Run route, catalog and type tests**

```powershell
npm test -- src/physicsRoutes.test.ts src/physicsCatalog.test.ts
node .\node_modules\typescript\bin\tsc -b
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add client/src/App.tsx client/src/components/Layout/Layout.tsx client/src/physics/TextbookPhysicsExperimentPage.tsx client/src/physics/runtime/ExperimentInfo.tsx client/src/physicsRoutes.test.ts
git commit -m "feat: add textbook physics routes"
```

---

### Task 4: Build versioned session persistence

**Files:**
- Create: `client/src/physics/sessions/types.ts`
- Create: `client/src/physics/sessions/repository.ts`
- Create: `client/src/physics/sessions/repository.test.ts`

**Interfaces:**
- Consumes: experiment ID, event payloads and measurement records.
- Produces: `PhysicsSessionRepository` and `browserPhysicsSessionRepository`.

- [ ] **Step 1: Write failing repository tests with an in-memory storage**

```ts
class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

it('persists and restores a measurement', () => {
  const repository = new PhysicsSessionRepository(new MemoryStorage())
  const session = repository.create('heat-capacity-comparison', '比较不同物质的吸热能力')
  repository.appendMeasurement(session.id, {
    trialId: 'water-1', key: 'temperature', label: '水温', value: 32, unit: '℃', kind: 'raw', at: '2026-07-11T00:00:00.000Z',
  })
  expect(repository.get(session.id)?.measurements[0]?.value).toBe(32)
})

it('quarantines malformed storage without throwing', () => {
  const storage = new MemoryStorage()
  storage.setItem('education-beauty-physics-sessions-v1', '{bad json')
  const repository = new PhysicsSessionRepository(storage)
  expect(repository.list()).toEqual([])
  expect(storage.getItem('education-beauty-physics-sessions-v1-corrupt')).toBe('{bad json')
})
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
npm test -- src/physics/sessions/repository.test.ts
```

Expected: FAIL because repository types do not exist.

- [ ] **Step 3: Add session types**

```ts
export type PhysicsSessionStatus = 'IN_PROGRESS' | 'COMPLETED'

export interface PhysicsEventRecord {
  id: string
  action: string
  detail: string
  outcome: 'accepted' | 'rejected'
  at: string
}

export interface PhysicsMeasurementRecord {
  trialId: string
  key: string
  label: string
  value: number | string
  unit: string
  kind: 'raw' | 'derived' | 'observation'
  at: string
}

export interface PhysicsSession {
  version: 1
  id: string
  experimentId: string
  experimentTitle: string
  status: PhysicsSessionStatus
  createdAt: string
  updatedAt: string
  events: PhysicsEventRecord[]
  measurements: PhysicsMeasurementRecord[]
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
```

- [ ] **Step 4: Implement the injected repository**

Use `education-beauty-physics-sessions-v1` as the only live key. Constructor parsing catches errors, copies the raw string to `-corrupt`, removes the invalid live key, and starts with an empty list. Every mutating method returns a cloned `PhysicsSession`; no caller mutates repository-owned arrays.

- [ ] **Step 5: Run tests and typecheck**

```powershell
npm test -- src/physics/sessions/repository.test.ts
node .\node_modules\typescript\bin\tsc -b
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add client/src/physics/sessions
git commit -m "feat: persist physics lab sessions"
```

---

### Task 5: Implement the pure lab runtime

**Files:**
- Create: `client/src/physics/runtime/types.ts`
- Create: `client/src/physics/runtime/geometry.ts`
- Create: `client/src/physics/runtime/geometry.test.ts`
- Create: `client/src/physics/runtime/reducer.ts`
- Create: `client/src/physics/runtime/reducer.test.ts`
- Create: `client/src/physics/runtime/useLabRuntime.ts`
- Create: `client/src/physics/runtime/usePointerDrag.ts`

**Interfaces:**
- Consumes: `LabController<TState>`, pointer positions and semantic actions.
- Produces: `createLabRuntime`, `reduceLabAction`, `useLabRuntime`, `usePointerDrag`, `snapPoint`, `clampPosition`.

- [ ] **Step 1: Write geometry RED tests**

```ts
expect(clampPosition({ x: -10, y: 500 }, { width: 100, height: 80 }, { width: 400, height: 300 })).toEqual({ x: 0, y: 220 })
expect(snapPoint({ x: 98, y: 101 }, [{ id: 'hook', x: 100, y: 100 }], 8)?.id).toBe('hook')
expect(snapPoint({ x: 120, y: 120 }, [{ id: 'hook', x: 100, y: 100 }], 8)).toBeNull()
```

- [ ] **Step 2: Write reducer RED tests**

```ts
const controller: LabController<{ value: number }> = {
  createInitialState: () => ({ value: 0 }),
  reduce: (state, action) => action.type === 'increment'
    ? { state: { value: state.value + 1 }, feedback: { outcome: 'accepted', message: '已增加' } }
    : { state, feedback: { outcome: 'rejected', message: '无效操作' } },
  deriveMeasurements: () => [],
  completion: () => ({ complete: false, message: '继续实验' }),
}

const runtime = createLabRuntime(controller)
const next = reduceLabAction(runtime, { type: 'increment' })
expect(next.present.value).toBe(1)
expect(next.past).toHaveLength(1)
expect(reduceLabAction(next, { type: 'undo' }).present.value).toBe(0)
```

- [ ] **Step 3: Run runtime tests and verify RED**

```powershell
npm test -- src/physics/runtime/geometry.test.ts src/physics/runtime/reducer.test.ts
```

Expected: FAIL because runtime modules do not exist.

- [ ] **Step 4: Add exact controller contracts**

```ts
export interface LabAction {
  type: string
  payload?: unknown
}

export interface LabFeedback {
  outcome: 'accepted' | 'rejected'
  message: string
}

export interface LabTransition<TState> {
  state: TState
  feedback: LabFeedback
}

export interface DerivedMeasurement {
  trialId: string
  key: string
  label: string
  value: number | string
  unit: string
  kind: 'raw' | 'derived' | 'observation'
}

export interface LabController<TState> {
  createInitialState(): TState
  reduce(state: TState, action: LabAction): LabTransition<TState>
  deriveMeasurements(state: TState): readonly DerivedMeasurement[]
  completion(state: TState): { complete: boolean; message: string }
}

export interface LabRuntime<TState> {
  present: TState
  past: TState[]
  future: TState[]
  feedback: LabFeedback | null
}
```

- [ ] **Step 5: Implement geometry and immutable reducer**

`reduceLabAction` handles `undo`, `redo` and `reset` before forwarding semantic actions to the controller. Accepted actions push the old state into a 30-entry history and clear `future`; rejected actions preserve history. `reset` uses `createInitialState` and preserves no measurements.

- [ ] **Step 6: Implement React adapters**

`useLabRuntime(controller)` wraps `useReducer` and exposes `{ state, feedback, measurements, completion, dispatch, undo, redo, reset }`. `usePointerDrag` converts `clientX/clientY` through the stage bounding rectangle, calls `setPointerCapture`, and emits semantic `dragStart`, `dragMove`, `dragEnd` actions. It does not contain experiment-specific snapping rules.

- [ ] **Step 7: Verify GREEN**

```powershell
npm test -- src/physics/runtime/geometry.test.ts src/physics/runtime/reducer.test.ts
node .\node_modules\typescript\bin\tsc -b
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add client/src/physics/runtime
git commit -m "feat: add physics lab runtime"
```

---

### Task 6: Build the lab shell, registry and reports

**Files:**
- Create: `client/src/physics/runtime/PhysicsLabShell.tsx`
- Create: `client/src/physics/runtime/MeasurementTable.tsx`
- Create: `client/src/physics/runtime/ExperimentReportDialog.tsx`
- Create: `client/src/physics/labs/registry.ts`
- Create: `client/src/physics/PhysicsLabHost.tsx`
- Create: `client/src/physics/sessions/PhysicsSessionsPage.tsx`
- Create: `client/src/physics/sessions/PhysicsReportPage.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/Layout/Layout.tsx`
- Modify: `client/src/physics/TextbookPhysicsExperimentPage.tsx`
- Modify: `client/src/physicsRoutes.test.ts`
- Test: `client/src/physicsLabShell.test.ts`

**Interfaces:**
- Consumes: `LabController`, scene component, `TextbookPhysicsExperiment`, `PhysicsSessionRepository`.
- Produces: `RegisteredLab`, `labRegistry`, `PhysicsLabHost`, visible measurement/report surfaces.

- [ ] **Step 1: Write the failing shell contract test**

```ts
it('exposes the required experiment controls', () => {
  const source = readFileSync(join(process.cwd(), 'src/physics/runtime/PhysicsLabShell.tsx'), 'utf8')
  for (const label of ['实验步骤', '当前读数', '数据表格', '撤销', '重做', '重置', '实验报告']) {
    expect(source).toContain(label)
  }
  expect(source).toContain('aria-label')
})
```

- [ ] **Step 2: Run and verify RED**

```powershell
npm test -- src/physicsLabShell.test.ts
```

Expected: FAIL because `PhysicsLabShell.tsx` does not exist.

- [ ] **Step 3: Define the registry contract**

```ts
export interface RegisteredLab {
  experimentId: string
  Lab: ComponentType<{ experiment: TextbookPhysicsExperiment }>
}

export const labRegistry = new Map<string, RegisteredLab>()
```

The type parameter is removed in the implementation because each registered `Lab` component owns its strongly typed controller and scene internally. The three benchmark tasks append concrete entries. `PhysicsLabHost` returns a clear configuration error when an available catalog record has no registry entry; this is an implementation defect, not a scheduled state.

- [ ] **Step 4: Implement the stable three-column shell**

Desktop uses `grid-template-columns: 240px minmax(0,1fr) 300px`; mobile uses one scene column with apparatus and steps drawers. The scene has `aspect-ratio: 16 / 9`, `min-height: 480px` on desktop and no font-size viewport scaling. Toolbar icon buttons use `Undo2`, `Redo2`, `RotateCcw`, `TableProperties`, and `FileText` with visible tooltips.

- [ ] **Step 5: Connect accepted and rejected actions to sessions**

On first lab mount create one session. Every semantic action appends an event with its controller feedback. Pressing “记录当前读数” stores the controller's current derived measurements. Completion marks the session complete. Rejected actions are recorded with `outcome: 'rejected'` so reports can explain mistakes.

- [ ] **Step 6: Implement session list and report page**

Sessions list shows status, experiment, latest update and links to continue or view report. Report page displays the six teaching sections, accepted/rejected event timeline, grouped measurement table, completion conclusion and supplement. Unknown or removed sessions show a non-crashing empty state.

- [ ] **Step 7: Add session routes and activate the host on available records**

```tsx
const PhysicsSessionsPage = lazyRetry(() => import('./physics/sessions/PhysicsSessionsPage'))
const PhysicsReportPage = lazyRetry(() => import('./physics/sessions/PhysicsReportPage'))

<Route path="physics/sessions" element={<PhysicsSessionsPage />} />
<Route path="physics/sessions/:id/report" element={<PhysicsReportPage />} />
<Route path="physics/labs/:id" element={<TextbookPhysicsExperimentPage />} />
```

Add `/physics/sessions` to `nonExperimentPaths`; report and lab routes remain experiment pages. `TextbookPhysicsExperimentPage` renders `<PhysicsLabHost experiment={experiment} />` only when `availability === 'available'`.

- [ ] **Step 8: Verify shell and typecheck**

```powershell
npm test -- src/physicsLabShell.test.ts src/physics/sessions/repository.test.ts src/physicsRoutes.test.ts
node .\node_modules\typescript\bin\tsc -b
```

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
git add client/src/App.tsx client/src/components/Layout/Layout.tsx client/src/physics/runtime client/src/physics/labs/registry.ts client/src/physics/PhysicsLabHost.tsx client/src/physics/TextbookPhysicsExperimentPage.tsx client/src/physics/sessions client/src/physicsLabShell.test.ts client/src/physicsRoutes.test.ts
git commit -m "feat: add physics lab shell and reports"
```

---

### Task 7: Implement “比较不同物质的吸热能力”

**Files:**
- Create: `client/src/physics/labs/heat-capacity/definition.ts`
- Create: `client/src/physics/labs/heat-capacity/controller.ts`
- Create: `client/src/physics/labs/heat-capacity/controller.test.ts`
- Create: `client/src/physics/labs/heat-capacity/HeatCapacityScene.tsx`
- Modify: `client/src/physics/labs/registry.ts`
- Modify: `client/src/physics/curriculum/catalog.ts`

**Interfaces:**
- Consumes: `LabController`, pointer drag events, catalog record `heat-capacity-comparison`.
- Produces: `heatCapacityController`, `HeatCapacityState`, registered `HeatCapacityScene`.

- [ ] **Step 1: Write failing physics tests**

```ts
it('heats equal masses according to Q = cmΔT', () => {
  const state = createHeatCapacityState({ waterMass: 0.2, oilMass: 0.2, heaterPower: 80 })
  const heated = advanceHeating(state, 60)
  expect(heated.waterTemperature).toBeCloseTo(25 + 4800 / (0.2 * 4200), 4)
  expect(heated.oilTemperature).toBeCloseTo(25 + 4800 / (0.2 * 2100), 4)
  expect(heated.oilTemperature).toBeGreaterThan(heated.waterTemperature)
})

it('rejects recording before both thermometers are placed', () => {
  const result = heatCapacityController.reduce(heatCapacityController.createInitialState(), { type: 'record' })
  expect(result.feedback).toEqual({ outcome: 'rejected', message: '请先把两支温度计分别放入水和食用油中' })
})
```

- [ ] **Step 2: Run and verify RED**

```powershell
npm test -- src/physics/labs/heat-capacity/controller.test.ts
```

Expected: FAIL because the controller does not exist.

- [ ] **Step 3: Implement the state and controller**

```ts
export interface HeatCapacityState {
  waterMass: number
  oilMass: number
  heaterPower: number
  elapsedSeconds: number
  waterTemperature: number
  oilTemperature: number
  waterThermometerPlaced: boolean
  oilThermometerPlaced: boolean
  heatersPlaced: boolean
  heating: boolean
  trials: HeatCapacityTrial[]
}

export function temperatureAfterEnergy(initial: number, power: number, seconds: number, massKg: number, heatCapacity: number) {
  return initial + (power * seconds) / (massKg * heatCapacity)
}
```

Use `cWater = 4200 J/(kg·℃)` and `cOil = 2100 J/(kg·℃)`. Actions: place thermometers, place heaters, start, tick, stop, record, reset trial. Starting is rejected until equal masses and both heaters/thermometers are installed. Recording requires a stopped run of at least 30 seconds.

- [ ] **Step 4: Build the scene**

Render two labeled beakers, water/oil fills, thermometer columns with stable scales, two identical heaters, stopwatch, apparatus tray and live readings. Thermometers and heaters drag to explicit snap zones. Start/stop is a clear command button; mass uses a numeric stepper rather than a free slider because equal-mass control is instructional. Export `HeatCapacityLab`, which owns `heatCapacityController` and renders `PhysicsLabShell<HeatCapacityState>`.

- [ ] **Step 5: Register and verify**

```powershell
npm test -- src/physics/labs/heat-capacity/controller.test.ts src/physicsLabShell.test.ts
node .\node_modules\typescript\bin\tsc -b
```

Expected: PASS, registry contains `heat-capacity-comparison`, and the same catalog record changes to `availability: 'available'`.

- [ ] **Step 6: Commit**

```powershell
git add client/src/physics/labs/heat-capacity client/src/physics/labs/registry.ts client/src/physics/curriculum/catalog.ts
git commit -m "feat: add heat capacity simulation"
```

---

### Task 8: Implement “连接串联电路和并联电路”

**Files:**
- Create: `client/src/physics/labs/series-parallel/definition.ts`
- Create: `client/src/physics/labs/series-parallel/controller.ts`
- Create: `client/src/physics/labs/series-parallel/controller.test.ts`
- Create: `client/src/physics/labs/series-parallel/SeriesParallelScene.tsx`
- Modify: `client/src/physics/labs/registry.ts`
- Modify: `client/src/physics/curriculum/catalog.ts`

**Interfaces:**
- Consumes: terminal IDs and semantic wire actions.
- Produces: `CircuitGraph`, `validateSeriesCircuit`, `validateParallelCircuit`, registered scene.

- [ ] **Step 1: Write topology RED tests**

```ts
it('recognizes one closed series loop', () => {
  const graph = circuitFromEdges([
    ['battery+', 'switch-a'], ['switch-b', 'lamp1-a'], ['lamp1-b', 'lamp2-a'], ['lamp2-b', 'battery-'],
  ])
  expect(validateSeriesCircuit(graph)).toEqual({ valid: true, message: '串联电路连接正确' })
})

it('rejects a direct battery short', () => {
  const graph = circuitFromEdges([['battery+', 'battery-']])
  expect(validateCircuitSafety(graph)).toEqual({ valid: false, message: '电源两极不能用导线直接相连' })
})
```

- [ ] **Step 2: Run and verify RED**

```powershell
npm test -- src/physics/labs/series-parallel/controller.test.ts
```

Expected: FAIL because circuit functions do not exist.

- [ ] **Step 3: Implement graph validation**

```ts
export interface CircuitEdge { from: string; to: string }
export interface CircuitGraph { edges: CircuitEdge[] }
export type CircuitMode = 'series' | 'parallel'

export function normalizedEdgeKey(edge: CircuitEdge) {
  return [edge.from, edge.to].sort().join('::')
}
```

Reject duplicate wires, self-links, direct battery shorts and edits while the switch is closed. Series validation requires one closed loop containing battery, switch and both lamps. Parallel validation requires two independent lamp branches sharing battery endpoints. Completion requires building and energizing both valid modes in separate trials.

- [ ] **Step 4: Build terminal drag interaction**

Render battery, switch, two lamps and insulated leads on a dark workbench. Dragging starts from a terminal and previews a wire; dropping within the target radius creates an edge. Connected terminals show a visible ring and textual status. The switch cannot close on an invalid or unsafe graph. Export `SeriesParallelLab`, which binds the controller to `PhysicsLabShell<CircuitLabState>`.

- [ ] **Step 5: Register and verify**

```powershell
npm test -- src/physics/labs/series-parallel/controller.test.ts
node .\node_modules\typescript\bin\tsc -b
```

Expected: PASS, registry contains `series-parallel-circuit`, and its catalog record is available.

- [ ] **Step 6: Commit**

```powershell
git add client/src/physics/labs/series-parallel client/src/physics/labs/registry.ts client/src/physics/curriculum/catalog.ts
git commit -m "feat: add series parallel circuit lab"
```

---

### Task 9: Implement “探究什么情况下磁可以生电”

**Files:**
- Create: `client/src/physics/labs/electromagnetic-induction/definition.ts`
- Create: `client/src/physics/labs/electromagnetic-induction/controller.ts`
- Create: `client/src/physics/labs/electromagnetic-induction/controller.test.ts`
- Create: `client/src/physics/labs/electromagnetic-induction/ElectromagneticInductionScene.tsx`
- Modify: `client/src/physics/labs/registry.ts`
- Modify: `client/src/physics/curriculum/catalog.ts`

**Interfaces:**
- Consumes: conductor position/velocity, circuit closed state and magnetic field direction.
- Produces: induced current value/direction, three-condition trial records and registered scene.

- [ ] **Step 1: Write electromagnetic RED tests**

```ts
it('produces no current for an open circuit', () => {
  expect(inducedCurrent({ closed: false, fieldTesla: 0.5, lengthMeters: 0.1, velocity: 0.4 })).toBe(0)
})

it('reverses current when conductor velocity reverses', () => {
  const right = inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0.1, velocity: 0.4 })
  const left = inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0.1, velocity: -0.4 })
  expect(right).toBeGreaterThan(0)
  expect(left).toBeCloseTo(-right)
})
```

- [ ] **Step 2: Run and verify RED**

```powershell
npm test -- src/physics/labs/electromagnetic-induction/controller.test.ts
```

Expected: FAIL because induction functions do not exist.

- [ ] **Step 3: Implement the model**

```ts
export function inducedCurrent(input: {
  closed: boolean
  fieldTesla: number
  lengthMeters: number
  velocity: number
  resistanceOhms?: number
}) {
  if (!input.closed) return 0
  return (input.fieldTesla * input.lengthMeters * input.velocity) / (input.resistanceOhms ?? 2)
}
```

The controller records three required observations: conductor stationary, conductor moving right, conductor moving left. It rejects recording if the conductor has not moved through the magnet gap or the circuit is open. Completion concludes that a closed circuit's conductor must cut magnetic field lines and current direction reverses with motion direction.

- [ ] **Step 4: Build the scene**

Render a horseshoe magnet, field-line zone, horizontal conductor rail, draggable conductor and center-zero galvanometer. The needle angle derives from current and uses a stable fixed dial. Show motion direction and field direction with both arrows and labels. Export `ElectromagneticInductionLab`, which binds the controller to `PhysicsLabShell<InductionState>`.

- [ ] **Step 5: Register and verify**

```powershell
npm test -- src/physics/labs/electromagnetic-induction/controller.test.ts
node .\node_modules\typescript\bin\tsc -b
```

Expected: PASS, registry contains `electromagnetic-induction`, and its catalog record is available.

- [ ] **Step 6: Commit**

```powershell
git add client/src/physics/labs/electromagnetic-induction client/src/physics/labs/registry.ts client/src/physics/curriculum/catalog.ts
git commit -m "feat: add electromagnetic induction lab"
```

---

### Task 10: Stage A integration, visual verification and local preview

**Files:**
- Modify: `client/src/physicsIntegration.test.ts`
- Modify: `client/src/index.css` only for shared lab focus, tooltip and reduced-motion rules that Tailwind cannot express locally.
- Modify: `start-local-preview.cmd` only if it fails to start the existing Vite server reliably.

**Interfaces:**
- Consumes: all Stage A routes, catalog, sessions, registry and three labs.
- Produces: Stage A verification evidence and a running local preview URL.

- [ ] **Step 1: Add final integration assertions**

```ts
it('ships the stage A textbook lab platform', () => {
  expect(textbookPhysicsExperiments).toHaveLength(65)
  expect(physicsExperiments).toHaveLength(133)
  expect([...labRegistry.keys()].sort()).toEqual([
    'electromagnetic-induction',
    'heat-capacity-comparison',
    'series-parallel-circuit',
  ])
})
```

- [ ] **Step 2: Run the complete automated verification**

Run from `client`:

```powershell
npm test
node .\node_modules\typescript\bin\tsc -b
npm run build
```

Expected: all tests PASS, typecheck exits 0, build exits 0. Existing bundle-size warnings may remain; no new runtime or missing-asset errors are allowed.

- [ ] **Step 3: Verify GitHub Pages build mode**

```powershell
$env:GITHUB_PAGES='true'
npm run build
Remove-Item Env:\GITHUB_PAGES
```

Expected: `client/dist/index.html` references `/jiaoyuzhimei/` assets and all three textbook lab routes are present in the generated app bundle.

- [ ] **Step 4: Start local preview**

Run from repository root:

```powershell
.\start-local-preview.cmd
```

Expected: `http://127.0.0.1:5173/physics` responds and Vite hot updates source changes.

- [ ] **Step 5: Perform browser workflow verification**

At 1440×900 and 390×844:

1. Open `/physics`; verify textbook tab is default and shows 65 items with nine-grade default selection.
2. Filter required/optional and chapters; verify counts and no card reflow overlap.
3. Switch to extended tab; open one legacy experiment and verify iframe simulation still loads.
4. Complete heat-capacity lab by placing apparatus, heating, recording water/oil data and opening the report.
5. Complete series and parallel circuit trials; verify short-circuit rejection.
6. Record stationary/right/left induction trials and verify galvanometer direction.
7. Reload each lab and verify the active session restores.
8. Open sessions and a report; verify events, measurements and conclusion.
9. Check browser console for errors and inspect screenshots for clipping, overlapping or blank stages.

- [ ] **Step 6: Commit Stage A verification fixes**

```powershell
git add client/src/physicsIntegration.test.ts client/src/index.css start-local-preview.cmd
git commit -m "test: verify physics curriculum stage a"
```

If `client/src/index.css` and `start-local-preview.cmd` require no changes, omit them from `git add`; do not create an empty commit.

---

## Stage A Exit Gate

Stage A is complete only when:

- The catalog contains all 65 authoritative records and all 133 legacy records remain accessible.
- The three benchmark labs can be completed through real user actions and generate persisted measurements and reports.
- Each benchmark has at least one rejected error path with an accurate message.
- Full tests, TypeScript, normal build and GitHub Pages build pass.
- Desktop and mobile browser workflows pass without blank scenes, overlap or missing assets.
- Local preview remains running at `http://127.0.0.1:5173/` for user review.

After Stage A review, create separate detailed plans for:

1. 九年级剩余 23 项实验。
2. 八年级下册 18 项实验。
3. 八年级上册 21 项实验。
4. 65 项全量完成审计与 GitHub Pages 发布。
