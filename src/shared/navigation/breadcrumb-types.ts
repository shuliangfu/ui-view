/**
 * 面包屑类型，供 PageHeader（shared）与 Breadcrumb（desktop）共用。
 */
export interface BreadcrumbItem {
  /** 显示文案 */
  label: string | unknown;
  /** 链接（最后一项可不传，则不渲染为链接） */
  href?: string;
  /** 无 href 时的点击回调（可选，与 onItemClick 二选一或同时使用） */
  onClick?: (e: Event) => void;
}
