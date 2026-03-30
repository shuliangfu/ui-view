/**
 * 文档站品牌链：跳转站点首页 `/`，仅用于根布局顶栏 NavBar（侧栏不放，避免与顶栏重复）。
 */

import { Link } from "@dreamer/ui-view";

/** 顶栏品牌：仅展示 ui-view；避免在 Link 子树里用 JSX 块注释夹正文，compileSource 下可能闪屏 */
export default function DocsSiteBrand() {
  return (
    <Link
      href="/"
      class="shrink-0 inline-flex items-center group no-underline hover:no-underline"
      aria-label="返回首页"
    >
      <span class="rounded-xl bg-linear-to-br from-teal-500 to-emerald-600 px-3 py-1.5 font-mono text-sm font-bold text-white shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/35 transition-shadow">
        ui-view
      </span>
    </Link>
  );
}
