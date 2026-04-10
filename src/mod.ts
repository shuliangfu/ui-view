/**
 * @module @dreamer/ui-view
 * @packageDocumentation
 *
 * @description
 * Dreamer **View** 体系 UI 组件库主入口：聚合 **shared**（实现）与 **desktop**（默认端）。
 * 样式基于 Tailwind CSS v4，支持亮色/暗黑；公开组件函数的显式返回类型为 {@link JSXRenderable}（定义见 `@dreamer/view`）。
 *
 * ## JSR 子路径（`deno.json` → `exports`）
 *
 * | 导入子路径 | 说明 |
 * |------------|------|
 * | `@dreamer/ui-view` | 本文件：桌面端聚合 + 全量 shared |
 * | `@dreamer/ui-view/basic` | 桌面基础：按钮、链接、图标、排版、徽标、头像、骨架、加载 |
 * | `@dreamer/ui-view/form` | 桌面表单 |
 * | `@dreamer/ui-view/config-provider` | 全局主题/配置 |
 * | `@dreamer/ui-view/data-display` | 桌面数据展示（含 Table） |
 * | `@dreamer/ui-view/feedback` | 桌面反馈：弹窗、抽屉、Toast/Message/Notification 等 |
 * | `@dreamer/ui-view/layout` | 布局：容器、栅格、Tabs、Accordion 等 |
 * | `@dreamer/ui-view/navigation` | 桌面导航：菜单、分页、下拉、锚点等 |
 * | `@dreamer/ui-view/charts` | Chart.js 封装图表 |
 * | `@dreamer/ui-view/mobile` | 移动端聚合（shared + 移动专用） |
 * | `@dreamer/ui-view/mobile/*` | 与上表对应的移动端分类入口 |
 * | `@dreamer/ui-view/plugin` | Tailwind v4 按需 content 扫描插件 |
 *
 * 各 **export function** 的 `@param` / `@returns` 与行为说明见对应 `.tsx` 源文件顶部及函数 JSDoc。
 *
 * @see {@link ./desktop/mod.ts} 桌面端聚合
 * @see {@link ./shared/mod.ts} 共享实现聚合
 */
export * from "./shared/mod.ts";
export * from "./desktop/mod.ts";
