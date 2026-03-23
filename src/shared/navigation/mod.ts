/**
 * 导航组件（C 共用）：NavBar、Pagination、Menu、Steps、PageHeader、Affix、Anchor、BackTop。
 * D：Dropdown、Breadcrumb → desktop/navigation；M：TabBar、NavBar → mobile/navigation。
 *
 * `Sidebar` / `Pagination` / `Menu` 内部状态使用 `@dreamer/view/signal` 的 `SignalRef`（`.value`）；
 * `Steps` 在渲染 getter 内读 `current`（可为 getter）；`Affix` 为纯 data 容器，直接返回 VNode。
 */
export type { BreadcrumbItem } from "./breadcrumb-types.ts";
export {
  Sidebar,
  type SidebarItem,
  type SidebarProps,
  type SidebarSubItem,
} from "./Sidebar.tsx";
export { Pagination, type PaginationProps } from "./Pagination.tsx";
export { Menu, type MenuItem, type MenuProps } from "./Menu.tsx";
export {
  type StepItem,
  Steps,
  type StepsProps,
  type StepStatus,
} from "./Steps.tsx";
export { PageHeader, type PageHeaderProps } from "./PageHeader.tsx";
export {
  Affix,
  type AffixInitOptions,
  type AffixProps,
  initAffix,
} from "./Affix.tsx";
export {
  Anchor,
  type AnchorLink,
  type AnchorProps,
  type AnchorSpyOptions,
  initAnchorSpy,
} from "./Anchor.tsx";
export { BackTop } from "./BackTop.tsx";
export type { BackTopProps, BackTopTarget } from "./BackTop.tsx";
