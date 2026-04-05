/**
 * View 桌面端 UI 组件 = 公共组件（shared）+ 桌面专用（本目录）。
 * D 组件：feedback（Modal、Dialog、Tooltip、Popover、Popconfirm）、navigation（Dropdown、Breadcrumb、NavBar）、data-display（Table）。
 * 内部状态使用 @dreamer/view 的 `createSignal`（返回 **`Signal`**，`.value` 读写）；Table/Dropdown/Select 等保留 `return () =>` 渲染 getter 以订阅 signal。
 * Modal 等遮罩用 `globalThis.document` 处理 body 与键盘/拖拽监听；纯 props 组件以直接 `return` VNode 为主。
 */
export * from "../shared/mod.ts";
export * from "./form/mod.ts";
export * from "./feedback/mod.ts";
export * from "./navigation/mod.ts";
export * from "./data-display/mod.ts";
