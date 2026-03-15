/**
 * 文档站风格布局：浅色顶栏 + 浅色侧栏，避免后台管理感。
 */

import { Link, ToastContainer, NotificationContainer } from "@dreamer/ui-view";
import type { VNode } from "@dreamer/view";
import { ThemeToggle } from "../components/ThemeToggle.tsx";

/** 基础组件下的二级子菜单：组件名 + 中文描述，对应路由 /basic/xxx */
const BASIC_SUBMENU = [
  { path: "/basic/button", label: "Button", desc: "按钮" },
  { path: "/basic/link", label: "Link", desc: "文字/图标链接" },
  { path: "/basic/icon", label: "Icon", desc: "图标容器/占位" },
  { path: "/basic/typography", label: "Typography", desc: "排版" },
  { path: "/basic/badge", label: "Badge", desc: "角标、数字徽章" },
  { path: "/basic/avatar", label: "Avatar", desc: "头像" },
  { path: "/basic/skeleton", label: "Skeleton", desc: "骨架屏" },
  { path: "/basic/spinner", label: "Spinner", desc: "加载旋转" },
] as const;

/** 表单组件下的二级子菜单，对应路由 /form/xxx，每页一个组件不写长 */
const FORM_SUBMENU = [
  { path: "/form/input", label: "Input", desc: "单行输入" },
  { path: "/form/search", label: "Search", desc: "搜索框" },
  { path: "/form/password", label: "Password", desc: "密码" },
  { path: "/form/textarea", label: "Textarea", desc: "多行输入" },
  { path: "/form/input-number", label: "InputNumber", desc: "数字输入" },
  { path: "/form/select", label: "Select", desc: "单选下拉" },
  { path: "/form/multiselect", label: "MultiSelect", desc: "多选下拉" },
  { path: "/form/checkbox", label: "Checkbox", desc: "勾选" },
  { path: "/form/checkbox-group", label: "CheckboxGroup", desc: "勾选组" },
  { path: "/form/radio-group", label: "RadioGroup", desc: "单选组" },
  { path: "/form/switch", label: "Switch", desc: "开关" },
  { path: "/form/slider", label: "Slider", desc: "滑块" },
  { path: "/form/rate", label: "Rate", desc: "评分" },
  { path: "/form/date-picker", label: "DatePicker", desc: "日期选择" },
  { path: "/form/time-picker", label: "TimePicker", desc: "时间选择" },
  {
    path: "/form/time-range-picker",
    label: "TimeRangePicker",
    desc: "时间范围",
  },
  { path: "/form/upload", label: "Upload", desc: "文件上传" },
  { path: "/form/transfer", label: "Transfer", desc: "穿梭框" },
  { path: "/form/mentions", label: "Mentions", desc: "@ 提及" },
  { path: "/form/rich-text-editor", label: "RichTextEditor", desc: "富文本" },
] as const;

/** 消息与通知下的二级子菜单，对应路由 /message/xxx */
const MESSAGE_SUBMENU = [
  { path: "/message/toast", label: "Toast", desc: "轻提示" },
  { path: "/message/message", label: "Message", desc: "全局提示" },
  { path: "/message/notification", label: "Notification", desc: "消息通知框" },
] as const;

/** 反馈与浮层下的二级子菜单，对应路由 /feedback/xxx */
const FEEDBACK_SUBMENU = [
  { path: "/feedback/alert", label: "Alert", desc: "静态提示条" },
  { path: "/feedback/modal", label: "Modal", desc: "模态弹窗" },
  { path: "/feedback/dialog", label: "Dialog", desc: "确认对话框" },
  { path: "/feedback/drawer", label: "Drawer", desc: "侧边抽屉" },
  { path: "/feedback/bottom-sheet", label: "BottomSheet", desc: "底部抽屉" },
  { path: "/feedback/action-sheet", label: "ActionSheet", desc: "底部动作列表" },
  { path: "/feedback/progress", label: "Progress", desc: "进度条" },
  { path: "/feedback/tooltip", label: "Tooltip", desc: "悬停提示" },
  { path: "/feedback/popover", label: "Popover", desc: "弹出面板" },
  { path: "/feedback/popconfirm", label: "Popconfirm", desc: "气泡确认框" },
  { path: "/feedback/result", label: "Result", desc: "结果页" },
] as const;

/** 布局与容器下的二级子菜单，对应路由 /layout/xxx */
const LAYOUT_SUBMENU = [
  { path: "/layout/container", label: "Container", desc: "最大宽度容器" },
  { path: "/layout/hero", label: "Hero", desc: "英雄区/首屏" },
  { path: "/layout/grid", label: "Grid", desc: "栅格" },
  { path: "/layout/stack", label: "Stack", desc: "垂直/水平堆叠" },
  { path: "/layout/divider", label: "Divider", desc: "分割线" },
  { path: "/layout/tabs", label: "Tabs", desc: "标签页" },
  { path: "/layout/accordion", label: "Accordion", desc: "手风琴折叠" },
] as const;

/** 导航下的二级子菜单，对应路由 /navigation/xxx */
const NAVIGATION_SUBMENU = [
  { path: "/navigation/breadcrumb", label: "Breadcrumb", desc: "面包屑" },
  { path: "/navigation/pagination", label: "Pagination", desc: "分页" },
  { path: "/navigation/menu", label: "Menu", desc: "菜单列表" },
  { path: "/navigation/dropdown", label: "Dropdown", desc: "下拉菜单" },
  { path: "/navigation/steps", label: "Steps", desc: "步骤条" },
  { path: "/navigation/page-header", label: "PageHeader", desc: "页头" },
  { path: "/navigation/affix", label: "Affix", desc: "固钉" },
  { path: "/navigation/anchor", label: "Anchor", desc: "锚点" },
  { path: "/navigation/tab-bar", label: "TabBar", desc: "底部 Tab 栏" },
] as const;

/** 数据展示下的二级子菜单，对应路由 /data-display/xxx */
const DATA_DISPLAY_SUBMENU = [
  { path: "/data-display/table", label: "Table", desc: "表格" },
  { path: "/data-display/list", label: "List", desc: "列表" },
  { path: "/data-display/card", label: "Card", desc: "卡片" },
  { path: "/data-display/tag", label: "Tag", desc: "标签" },
  { path: "/data-display/empty", label: "Empty", desc: "空状态" },
  { path: "/data-display/image", label: "Image", desc: "图片" },
  { path: "/data-display/descriptions", label: "Descriptions", desc: "描述列表" },
  { path: "/data-display/timeline", label: "Timeline", desc: "时间轴" },
  { path: "/data-display/statistic", label: "Statistic", desc: "统计数值" },
  { path: "/data-display/segmented", label: "Segmented", desc: "分段控制器" },
  { path: "/data-display/collapse", label: "Collapse", desc: "折叠面板" },
  { path: "/data-display/carousel", label: "Carousel", desc: "轮播图" },
  { path: "/data-display/calendar", label: "Calendar", desc: "日历" },
  { path: "/data-display/comment", label: "Comment", desc: "评论" },
  { path: "/data-display/tree", label: "Tree", desc: "树形" },
  { path: "/data-display/transfer", label: "Transfer", desc: "穿梭框" },
  { path: "/data-display/code-block", label: "CodeBlock", desc: "代码块" },
] as const;

/** 图表下的二级子菜单，对应路由 /charts/xxx，基于 Chart.js */
const CHARTS_SUBMENU = [
  { path: "/charts/line", label: "ChartLine", desc: "折线图" },
  { path: "/charts/bar", label: "ChartBar", desc: "柱状图" },
  { path: "/charts/pie", label: "ChartPie", desc: "饼图" },
  { path: "/charts/doughnut", label: "ChartDoughnut", desc: "环形图" },
  { path: "/charts/radar", label: "ChartRadar", desc: "雷达图" },
  { path: "/charts/polar-area", label: "ChartPolarArea", desc: "极区图" },
  { path: "/charts/bubble", label: "ChartBubble", desc: "气泡图" },
  { path: "/charts/scatter", label: "ChartScatter", desc: "散点图" },
] as const;

/** 移动端下的二级子菜单，对应路由 /mobile/xxx */
const MOBILE_SUBMENU = [
  { path: "/mobile/bottom-sheet", label: "BottomSheet", desc: "底部抽屉" },
  { path: "/mobile/action-sheet", label: "ActionSheet", desc: "底部动作列表" },
  { path: "/mobile/tab-bar", label: "TabBar", desc: "底部 Tab 导航" },
  { path: "/mobile/pull-refresh", label: "PullRefresh", desc: "下拉刷新" },
  { path: "/mobile/swipe-cell", label: "SwipeCell", desc: "左滑操作" },
  { path: "/mobile/nav-bar", label: "NavBar", desc: "顶栏" },
] as const;

/** 其它下的二级子菜单，对应路由 /other/xxx */
const OTHER_SUBMENU = [
  { path: "/other/back-top", label: "BackTop", desc: "回到顶部" },
  { path: "/other/config-provider", label: "ConfigProvider", desc: "全局配置" },
] as const;

/** 组件分类：有子菜单的用 children，无子菜单的为单链接 */
const MENU: ReadonlyArray<
  {
    path: string;
    label: string;
    children?: ReadonlyArray<{ path: string; label: string; desc: string }>;
  }
> = [
  { path: "/basic", label: "基础组件", children: BASIC_SUBMENU },
  { path: "/form", label: "表单组件", children: FORM_SUBMENU },
  { path: "/message", label: "消息与通知", children: MESSAGE_SUBMENU },
  { path: "/feedback", label: "反馈与浮层", children: FEEDBACK_SUBMENU },
  { path: "/layout", label: "布局与容器", children: LAYOUT_SUBMENU },
  { path: "/navigation", label: "导航", children: NAVIGATION_SUBMENU },
  { path: "/data-display", label: "数据展示", children: DATA_DISPLAY_SUBMENU },
  { path: "/charts", label: "图表", children: CHARTS_SUBMENU },
  { path: "/mobile", label: "移动端", children: MOBILE_SUBMENU },
  { path: "/other", label: "其它", children: OTHER_SUBMENU },
];

interface LayoutProps {
  children?: VNode | VNode[];
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      {/* 顶栏：品牌突出、导航胶囊式、主题按钮分区 */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/98 dark:border-slate-700/80 dark:bg-slate-900/98 shadow-sm shadow-slate-200/50 dark:shadow-slate-950/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="shrink-0 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100"
          >
            <span className="rounded-lg bg-teal-500 px-2.5 py-1 font-mono text-sm text-white dark:bg-teal-600">
              ui-view
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              桌面版
            </Link>
            <Link
              href="/mobile"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              移动版
            </Link>

            <span
              className="ml-2 h-6 w-px bg-slate-200 dark:bg-slate-600"
              aria-hidden="true"
            />
            <ThemeToggle />
            <a
              href="https://github.com/shuliangfu/ui-view"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              title="GitHub 仓库"
              aria-label="GitHub 仓库"
            >
              <span className="inline-block size-5" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex flex-1 w-full max-w-[1800px]">
        {/* 侧栏：一级为分组标题「组件」，二级为各分类链接，仅通过二级进入页面 */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-100 dark:border-slate-700 py-8 pl-6 pr-4 lg:block">
          <nav className="space-y-3" aria-label="组件导航">
            {/* 一级：仅作分组标题，不跳转 */}
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              组件
            </p>
            {/* 二级：分类；有 children 的展开子菜单（Button/Link/Icon…），无则单链接 */}
            <ul className="list-none space-y-2 p-0 m-0 pl-3" role="list">
              {MENU.map((item) => (
                <li key={item.path}>
                  {item.children
                    ? (
                      <>
                        <p className="py-1.5 pl-3 pr-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                          {item.label}
                        </p>
                        <ul
                          className="list-none space-y-0.5 p-0 m-0 pl-3"
                          role="list"
                        >
                          {item.children.map((sub) => (
                            <li key={sub.path}>
                              <Link
                                href={sub.path}
                                className="block w-full rounded-md py-2 pl-3 pr-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
                              >
                                {sub.label} — {sub.desc}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    )
                    : (
                      <Link
                        href={item.path}
                        className="block w-full rounded-md py-2 pl-3 pr-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 py-8 px-4 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>

      {/* 消息与通知容器：Toast、Message 共用 ToastContainer；Notification 单独容器 */}
      <ToastContainer />
      <NotificationContainer />

      <footer className="border-t border-slate-100 dark:border-slate-700 py-6 text-center text-sm text-slate-400 dark:text-slate-400">
        <p>© 2024 @dreamer/ui-view · 使用 @dreamer/dweb 构建</p>
      </footer>
    </div>
  );
}
