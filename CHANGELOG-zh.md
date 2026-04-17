# 变更日志

本项目的重要变更将记录在此文件中。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循
[语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.2] - 2026-04-17

### 变更

- 聚合用 `mod.ts`（包根、`shared`、`desktop`、`mobile`、`basic` 入口）将
  `export *` 改为显式 `export { … }` /
  `export type { … }`，便于打包器静态解析依赖。
- `basic` 各入口将内置 `Icon*` 改为显式列出，不再使用
  `export * from "./icons/mod.ts"`。
- `desktop` / `mobile` 根聚合对子路径仅再导出相对 `shared` 的增量符号，避免与
  `shared` 重复导出同名符号。
