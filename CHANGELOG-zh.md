# 变更日志

本项目的重要变更将记录在此文件中。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循
[语义化版本](https://semver.org/lang/zh-CN/)。

## [1.1.0-beta.20] - 2026-05-10

### 新增

- **Input** 可选属性 `accept`、`multiple`（透传原生）；`type="file"`
  时不绑定受控 `value`，且不在 input/change 时通过 Signal 写入路径字符串。

### 变更

- **Input** 在 `type="file"` 时跳过清除逻辑对值的同步；组合壳与单输入路径均透传
  `accept` / `multiple`。

## [1.1.0-beta.4] - 2026-04-22

### 变更

- **plugin** `uiViewTailwindPlugin`：生成 Tailwind `@source` CSS
  的步骤日志统一走 `@dreamer/logger`（`Logger.child` 带 `ui-view-tailwind`
  标签，或 独立 `createLogger` 且 `level: "debug"`），输出为 **debug**
  级别（不再用 `info`）。`deno.json` 增加 `jsr:@dreamer/logger` 依赖。
- **plugin** `onInit` 失败：优先使用注入的 `Logger.error`；无官方 `Logger`
  时仍支持 带 `error` 的遗留 logger；不再以 `info` 回退错误内容。

## [1.0.6] - 2026-04-19

### 变更

- **Dropdown** 的 `placement`
  仅保留向下展开（`bottom`、`bottomLeft`、`bottomRight`、`bottomAuto`），移除
  `top` / `topLeft` / `topRight`。
- **Dropdown** 优化 Portal + `fixed` 几何与带箭头时的 `bottomLeft` /
  `bottomRight` 对齐；触发器 `ref` 置于真实按钮上以准确测量。
- 文档：桌面端 Dropdown 路由 API 与 `arrow` 说明已同步。

## [1.0.2] - 2026-04-17

### 变更

- 聚合用 `mod.ts`（包根、`shared`、`desktop`、`mobile`、`basic` 入口）将
  `export *` 改为显式 `export { … }` /
  `export type { … }`，便于打包器静态解析依赖。
- `basic` 各入口将内置 `Icon*` 改为显式列出，不再使用
  `export * from "./icons/mod.ts"`。
- `desktop` / `mobile` 根聚合对子路径仅再导出相对 `shared` 的增量符号，避免与
  `shared` 重复导出同名符号。
