/**
 * 文档站品牌链：跳转站点首页 `/`，仅用于根布局顶栏 NavBar（侧栏不放，避免与顶栏重复）。
 */

import { Link } from "@dreamer/ui-view";

/** 渲染「ui-view + 文档」首页链接 */
export default function DocsSiteBrand() {
  return (
    <Link
      href="/"
      class="shrink-0 flex items-center gap-2 group no-underline hover:no-underline"
      aria-label="返回首页"
    >
      <span class="rounded-xl bg-linear-to-br from-teal-500 to-emerald-600 px-3 py-1.5 font-mono text-sm font-bold text-white shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/35 transition-shadow">
        ui-view
      </span>
      {
        /* <span class="hidden sm:inline text-sm font-medium text-slate-600 dark:text-slate-300">
        文档
      </span> */
      }
    </Link>
  );
}
