/**
 * 导航组件（C 共用）：Pagination、Menu、Steps、PageHeader、Affix、Anchor、BackTop。
 * D：Dropdown、Breadcrumb → desktop/navigation；M：TabBar、NavBar → mobile/navigation。
 */
export type { BreadcrumbItem } from "./breadcrumb-types.ts";
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
