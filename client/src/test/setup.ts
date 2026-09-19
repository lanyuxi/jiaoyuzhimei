// 测试环境补丁：让 ReactDOM 的 act(...) 生效。
// 没有这一行时 React 19 会打印 "not configured to support act(...)" 并跳过批处理，
// 于是「渲染 → 断言」之间 state 可能还没落盘。
// 注意：`act` 的开关是挂在 globalThis 上的字符串键（React 约定），必须原样写。
;(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

export {}
