/**
 * 移动版文档布局：侧栏 + 主内容（与 desktop/_layout 结构对齐，菜单项对应 @dreamer/ui-view/mobile）。
 * aside 与 main 各自纵向滚动，不共用整页滚动。
 */

import { Sidebar } from "@dreamer/ui-view";
import type { VNode } from "@dreamer/view";
import SiteFooter from "../../components/SiteFooter.tsx";

/** 反馈与浮层 */
const FEEDBACK_SUBMENU = [
  {
    path: "/mobile/feedback/bottom-sheet",
    label: "BottomSheet",
    desc: "底部抽屉",
  },
  {
    path: "/mobile/feedback/action-sheet",
    label: "ActionSheet",
    desc: "操作表",
  },
  {
    path: "/mobile/feedback/pull-refresh",
    label: "PullRefresh",
    desc: "下拉刷新",
  },
  {
    path: "/mobile/feedback/swipe-cell",
    label: "SwipeCell",
    desc: "滑动单元格",
  },
] as const;

/** 导航 */
const NAVIGATION_SUBMENU = [
  { path: "/mobile/navigation/tab-bar", label: "TabBar", desc: "底部标签栏" },
  { path: "/mobile/navigation/navbar", label: "NavBar", desc: "顶栏" },
] as const;

/** 表单（移动样式） */
const FORM_SUBMENU = [
  { path: "/mobile/form/select", label: "Select", desc: "单选" },
  { path: "/mobile/form/multiselect", label: "MultiSelect", desc: "多选" },
  { path: "/mobile/form/date-picker", label: "DatePicker", desc: "日期" },
  {
    path: "/mobile/form/date-range-picker",
    label: "DateRangePicker",
    desc: "日期范围",
  },
  { path: "/mobile/form/cascader", label: "Cascader", desc: "级联" },
] as const;

const MENU: ReadonlyArray<{
  path: string;
  label: string;
  children?: ReadonlyArray<{ path: string; label: string; desc: string }>;
}> = [
  { path: "/mobile/feedback", label: "反馈与浮层", children: FEEDBACK_SUBMENU },
  { path: "/mobile/navigation", label: "导航", children: NAVIGATION_SUBMENU },
  { path: "/mobile/form", label: "表单", children: FORM_SUBMENU },
];

interface LayoutProps {
  children?: VNode | VNode[];
}

export default function MobileDocsLayout({ children }: LayoutProps) {
  /* 占满根布局中间 flex-1 区域高度，h-full 形成明确高度上限，侧栏与 main 的 overflow-y-auto 才能独立接滚轮 */
  return (
    <div class="flex h-full min-h-0 flex-1 w-full max-w-[1800px] mx-auto overflow-hidden">
      {
        /*
         * 侧栏仅菜单；回首页见顶栏，与 desktop/_layout 一致。
         */
      }
      <Sidebar
        overview={{ path: "/mobile", label: "移动版概览" }}
        sectionTitle="移动端组件"
        items={MENU}
        class="min-h-0 overflow-y-auto overscroll-y-contain"
      />
      {
        /*
         * 正文区用 flex-auto，避免 flex-1 固定高度导致长文溢出叠在页脚上（同 desktop/_layout）。
         */
      }
      <main class="flex flex-1 min-h-0 min-w-0 flex-col overflow-y-auto overscroll-y-contain py-8 px-4 sm:px-6 lg:px-10">
        <div class="flex flex-auto flex-col">{children}</div>
        <SiteFooter />
      </main>
    </div>
  );
}
