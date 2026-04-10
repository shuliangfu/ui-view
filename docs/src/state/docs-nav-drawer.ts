/**
 * 文档站顶栏「菜单」与分区 {@link Sidebar} 小屏抽屉共用状态。
 * 根 `_layout` 读 `docsNavDrawerOpen` / `docsNavSidebarAttached`，`desktop`/`mobile` 的 `_layout` 在挂载时声明侧栏已挂上。
 */

import { createSignal } from "@dreamer/view";

/** 小屏侧栏抽屉是否打开（由顶栏按钮置 true，Drawer 内点链接或关闭钮置 false） */
export const docsNavDrawerOpen = createSignal(false);

/**
 * 当前是否处于带侧栏的文档分区（/desktop/*、/mobile/*），为 true 时顶栏才显示汉堡按钮。
 */
export const docsNavSidebarAttached = createSignal(false);
