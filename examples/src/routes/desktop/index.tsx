/**
 * 桌面版首页：桌面组件总览与分类入口。
 * 路由: /desktop
 */

import { Link } from "@dreamer/ui-view";

/** 桌面版组件分类：用于本页展示与跳转，与侧栏 MENU 结构一致 */
const DESKTOP_CATEGORIES = [
  {
    path: "/desktop/basic",
    label: "基础组件",
    desc: "Button、Link、Icon、Typography、Badge、Avatar、Skeleton、Spinner 等",
    firstPath: "/desktop/basic/button",
  },
  {
    path: "/desktop/form",
    label: "表单组件",
    desc:
      "Input、Select、Checkbox、Switch、DatePicker、Upload、RichTextEditor 等",
    firstPath: "/desktop/form/input",
  },
  {
    path: "/desktop/message",
    label: "消息与通知",
    desc: "Toast、Message、Notification",
    firstPath: "/desktop/message/toast",
  },
  {
    path: "/desktop/feedback",
    label: "反馈与浮层",
    desc: "Alert、Modal、Dialog、Drawer、Progress、Tooltip、Popover、Result 等",
    firstPath: "/desktop/feedback/alert",
  },
  {
    path: "/desktop/layout",
    label: "布局与容器",
    desc: "Container、Hero、Grid、Stack、Divider、Tabs、Accordion",
    firstPath: "/desktop/layout/container",
  },
  {
    path: "/desktop/navigation",
    label: "导航",
    desc:
      "Breadcrumb、Pagination、Menu、Dropdown、Steps、PageHeader、Affix、Anchor",
    firstPath: "/desktop/navigation/breadcrumb",
  },
  {
    path: "/desktop/data-display",
    label: "数据展示",
    desc: "Table、List、Card、Tag、Empty、Image、Timeline、Tree、CodeBlock 等",
    firstPath: "/desktop/data-display/table",
  },
  {
    path: "/desktop/charts",
    label: "图表",
    desc: "基于 Chart.js：折线图、柱状图、饼图、雷达图、散点图等",
    firstPath: "/desktop/charts/line",
  },
  {
    path: "/desktop/other",
    label: "其它",
    desc: "BackTop、ConfigProvider",
    firstPath: "/desktop/other/back-top",
  },
] as const;

export default function DesktopIndex() {
  return (
    <div className="max-w-3xl">
      {/* 标题与说明 */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          桌面版组件
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          @dreamer/ui-view 桌面端组件库，适用于后台、文档站等 PC
          场景。左侧为组件分类导航，点击可进入各组件示例页查看用法与 API。
        </p>
      </section>

      {/* 分类卡片列表 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
          组件分类
        </h2>
        <ul className="list-none p-0 m-0 space-y-3">
          {DESKTOP_CATEGORIES.map((cat) => (
            <li key={cat.path}>
              <Link
                href={cat.firstPath}
                className="block rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 p-5 hover:border-teal-500/50 dark:hover:border-teal-400/50 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {cat.label}
                </span>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                  {cat.desc}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 技术说明 */}
      <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-600">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
          说明
        </h2>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
          <li>组件基于 View 细粒度渲染，与 Tailwind v4、明暗主题兼容。</li>
          <li>
            桌面版与移动版（/mobile）共用部分基础组件，按场景选用不同布局与交互。
          </li>
          <li>示例代码与 API 详见各组件子页。</li>
        </ul>
      </section>
    </div>
  );
}
