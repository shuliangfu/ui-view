/**
 * @module @dreamer/ui-view/desktop
 * @description
 * **包内路径**：`src/desktop/mod.ts`。桌面端 UI 聚合：**shared**（实现）+ **desktop** 下 form / feedback / navigation / data-display 等。
 *
 * - **反馈**：Modal、Dialog、Tooltip、Popover、Popconfirm、Drawer 等与 Portal、`document.body` 协作。
 * - **导航**：Dropdown、Breadcrumb、NavBar 等；`initDropdownEsc` 用于 Esc 关闭下拉。
 * - **数据**：Table 等；内部状态多用 `createSignal`（`Signal`，`.value`），部分组件用 `return () => …` 渲染 getter 订阅更新。
 * - **返回值**：公开导出函数显式标注为 {@link JSXRenderable}（见各 `.tsx`）。
 *
 * JSR 上与本目录对应的子路径为 `@dreamer/ui-view`（根）及 `@dreamer/ui-view/form` 等，见根目录 `deno.json`。
 *
 * @see {@link ../shared/mod.ts} 共享实现
 */
export * from "../shared/mod.ts";
export * from "./form/mod.ts";
export * from "./feedback/mod.ts";
export * from "./navigation/mod.ts";
export * from "./data-display/mod.ts";
