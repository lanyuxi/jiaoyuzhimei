/**
 * 真机实测的浮层几何 —— **独立于实现**的副本，只给测试用。
 *
 * 为什么要有这份副本（而不是直接 import `controlObstacles`）：
 * 上一轮之所以失守，是因为判据与实现共用同一个（估出来的）常量 ——
 * 实现写错，判据跟着一起错，测出来还是全绿。
 * 于是这里存一份「在真 Chromium 里 `getBoundingClientRect()` 量出来的原始数据」，
 * 测试拿它与 `controlObstacles()` 的输出互相校验：
 * **任一边漂移超过容差就直接红**，实现改坏了不可能再自证清白。
 *
 * 数据来源（可复现）：
 *   `vite preview` 起真页面 → 逐视口枚举所有
 *   `z-index ≥ 20` 且 `position: absolute|fixed|sticky` 的浮层 →
 *   `getBoundingClientRect()` → 裁到舞台矩形内 → 去重。
 * 量到的矩形见 `MEASURED_OVERLAYS`（相对各自舞台左上角，屏幕像素）。
 *
 * ⚠️ 布局改动（挪控件 / 改宽度 / 改断点）后必须**重新量一遍**并更新本文件，
 * 否则这条"交叉校验"会变成"两边都过期"。
 */
export interface MeasuredOverlay {
  x: number
  y: number
  width: number
  height: number
  /** 量到这条数据时的舞台尺寸（= 视口宽 × （视口高 − 59）的实验室可用区） */
  stage?: { width: number; height: number }
  /** 这条浮层是什么（便于失败信息定位） */
  label: string
}

/** 舞台尺寸（`PhysicsLabShell` 给实验台的那块矩形：整视口扣掉下方 59px 状态栏） */
export const MEASURED_STAGES = [
  { width: 1375, height: 782 },
  { width: 1280, height: 661 },
  { width: 1920, height: 1021 },
  { width: 1920, height: 361 },
  { width: 1024, height: 541 },
  { width: 768, height: 541 },
  { width: 390, height: 692 },
] as const

/**
 * 每个舞台尺寸下量到的浮层矩形。
 *
 * 数字直接抄自真机输出（见文件的"数据来源"），**没有经过任何加工** ——
 * 这是它能当"独立证据"的前提。
 */
export const MEASURED_OVERLAYS: readonly MeasuredOverlay[] = [
  // ── 1375×782 ────────────────────────────────────────────────
  { stage: { width: 1375, height: 782 }, label: '顶部标题栏', x: 0, y: 0, width: 1375, height: 70 },
  { stage: { width: 1375, height: 782 }, label: '右上画布工具条', x: 1317, y: 16, width: 42, height: 150 },
  { stage: { width: 1375, height: 782 }, label: '左-转电路图', x: 16, y: 64, width: 78, height: 83 },
  { stage: { width: 1375, height: 782 }, label: '左-复位摆位', x: 16, y: 164, width: 78, height: 83 },
  { stage: { width: 1375, height: 782 }, label: '左-操作提示', x: 16, y: 224, width: 132, height: 78 },
  { stage: { width: 1375, height: 782 }, label: '右-协作入口胶囊组', x: 1063, y: 64, width: 244, height: 75 },
  { stage: { width: 1375, height: 782 }, label: '底部读数条', x: 344, y: 670, width: 688, height: 96 },
  { stage: { width: 1375, height: 782 }, label: '底部提示胶囊', x: 1131, y: 673, width: 228, height: 33 },

  // ── 1280×661 ────────────────────────────────────────────────
  { stage: { width: 1280, height: 661 }, label: '顶部标题栏', x: 0, y: 0, width: 1280, height: 70 },
  { stage: { width: 1280, height: 661 }, label: '右上画布工具条', x: 1222, y: 16, width: 42, height: 150 },
  { stage: { width: 1280, height: 661 }, label: '左-转电路图', x: 16, y: 64, width: 78, height: 83 },
  { stage: { width: 1280, height: 661 }, label: '左-复位摆位', x: 16, y: 164, width: 78, height: 83 },
  { stage: { width: 1280, height: 661 }, label: '左-操作提示', x: 16, y: 224, width: 132, height: 78 },
  { stage: { width: 1280, height: 661 }, label: '右-协作入口胶囊组', x: 968, y: 64, width: 244, height: 75 },
  { stage: { width: 1280, height: 661 }, label: '底部读数条', x: 320, y: 549, width: 640, height: 96 },
  { stage: { width: 1280, height: 661 }, label: '底部提示胶囊', x: 1036, y: 552, width: 228, height: 33 },

  // ── 1920×1021 ───────────────────────────────────────────────
  { stage: { width: 1920, height: 1021 }, label: '顶部标题栏', x: 0, y: 0, width: 1920, height: 70 },
  { stage: { width: 1920, height: 1021 }, label: '右上画布工具条', x: 1862, y: 16, width: 42, height: 150 },
  { stage: { width: 1920, height: 1021 }, label: '左-转电路图', x: 16, y: 64, width: 78, height: 83 },
  { stage: { width: 1920, height: 1021 }, label: '左-复位摆位', x: 16, y: 164, width: 78, height: 83 },
  { stage: { width: 1920, height: 1021 }, label: '左-操作提示', x: 16, y: 224, width: 132, height: 78 },
  { stage: { width: 1920, height: 1021 }, label: '右-协作入口胶囊组', x: 1608, y: 64, width: 244, height: 75 },
  { stage: { width: 1920, height: 1021 }, label: '底部读数条', x: 584, y: 951, width: 751, height: 54 },
  { stage: { width: 1920, height: 1021 }, label: '底部提示胶囊', x: 1676, y: 912, width: 228, height: 33 },

  // ── 1920×361（矮视口）───────────────────────────────────────
  { stage: { width: 1920, height: 361 }, label: '顶部标题栏', x: 0, y: 0, width: 1920, height: 70 },
  { stage: { width: 1920, height: 361 }, label: '右上画布工具条', x: 1862, y: 16, width: 42, height: 150 },
  { stage: { width: 1920, height: 361 }, label: '左-转电路图', x: 16, y: 64, width: 78, height: 83 },
  { stage: { width: 1920, height: 361 }, label: '左-复位摆位', x: 16, y: 164, width: 78, height: 83 },
  { stage: { width: 1920, height: 361 }, label: '左-操作提示', x: 16, y: 224, width: 132, height: 78 },
  { stage: { width: 1920, height: 361 }, label: '右-协作入口胶囊组', x: 1608, y: 64, width: 244, height: 75 },
  { stage: { width: 1920, height: 361 }, label: '底部读数条', x: 584, y: 291, width: 751, height: 54 },
  { stage: { width: 1920, height: 361 }, label: '底部提示胶囊', x: 1676, y: 252, width: 228, height: 33 },

  // ── 1024×541 ────────────────────────────────────────────────
  { stage: { width: 1024, height: 541 }, label: '顶部标题栏', x: 0, y: 0, width: 1024, height: 70 },
  { stage: { width: 1024, height: 541 }, label: '右上画布工具条', x: 966, y: 16, width: 42, height: 150 },
  { stage: { width: 1024, height: 541 }, label: '左-转电路图', x: 16, y: 64, width: 78, height: 83 },
  { stage: { width: 1024, height: 541 }, label: '左-复位摆位', x: 16, y: 164, width: 78, height: 83 },
  { stage: { width: 1024, height: 541 }, label: '左-操作提示', x: 16, y: 224, width: 132, height: 78 },
  { stage: { width: 1024, height: 541 }, label: '右-协作入口胶囊组', x: 712, y: 64, width: 244, height: 75 },
  { stage: { width: 1024, height: 541 }, label: '底部读数条', x: 256, y: 429, width: 512, height: 96 },
  { stage: { width: 1024, height: 541 }, label: '底部提示胶囊', x: 780, y: 432, width: 228, height: 33 },

  // ── 768×541 ─────────────────────────────────────────────────
  { stage: { width: 768, height: 541 }, label: '顶部标题栏', x: 0, y: 0, width: 768, height: 70 },
  { stage: { width: 768, height: 541 }, label: '右上画布工具条', x: 710, y: 16, width: 42, height: 150 },
  { stage: { width: 768, height: 541 }, label: '左-转电路图', x: 16, y: 64, width: 78, height: 83 },
  { stage: { width: 768, height: 541 }, label: '左-复位摆位', x: 16, y: 164, width: 78, height: 83 },
  { stage: { width: 768, height: 541 }, label: '左-操作提示', x: 16, y: 224, width: 132, height: 78 },
  { stage: { width: 768, height: 541 }, label: '右-协作入口胶囊组', x: 456, y: 64, width: 244, height: 75 },
  { stage: { width: 768, height: 541 }, label: '底部读数条', x: 192, y: 402, width: 384, height: 123 },

  // ── 390×692（手机竖屏）──────────────────────────────────────
  { stage: { width: 390, height: 692 }, label: '顶部标题栏', x: 0, y: 0, width: 390, height: 70 },
  { stage: { width: 390, height: 692 }, label: '右上画布工具条', x: 332, y: 16, width: 42, height: 150 },
  { stage: { width: 390, height: 692 }, label: '左-转电路图', x: 16, y: 64, width: 78, height: 83 },
  { stage: { width: 390, height: 692 }, label: '左-复位摆位', x: 16, y: 164, width: 78, height: 83 },
  { stage: { width: 390, height: 692 }, label: '左-操作提示', x: 16, y: 224, width: 132, height: 78 },
  { stage: { width: 390, height: 692 }, label: '右-协作入口胶囊组', x: 78, y: 64, width: 244, height: 75 },
  { stage: { width: 390, height: 692 }, label: '底部读数条', x: 96, y: 524, width: 198, height: 152 },
  { stage: { width: 390, height: 692 }, label: '底部提示胶囊', x: 146, y: 583, width: 228, height: 33 },
]
