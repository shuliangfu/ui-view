/**
 * Sidebar 侧栏折叠菜单文档页。
 * 路由: /desktop/navigation/sidebar
 */

import { Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import { CodeBlock } from "@dreamer/ui-view/data-display";

import { Sidebar } from "@dreamer/ui-view/navigation";
import { IconBox } from "@dreamer/ui-view/icons/Box.tsx";
import { IconFileText } from "@dreamer/ui-view/icons/FileText.tsx";
import { IconPanelLeft } from "@dreamer/ui-view/icons/PanelLeft.tsx";
import { IconLink } from "@dreamer/ui-view/icons/Link.tsx";
import { IconMousePointer } from "@dreamer/ui-view/icons/MousePointer.tsx";
import { IconType } from "@dreamer/ui-view/icons/Type.tsx";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_SIDEBAR } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

/** 文档演示用菜单项（路径指向真实文档路由，便于高亮示意）；一级／二级都带自定义 icon */
const SIDEBAR_DEMO_ITEMS = [
  {
    path: "/desktop/navigation/sidebar",
    label: "侧栏",
    icon: <IconPanelLeft />,
  },
  {
    path: "/desktop/basic/button",
    label: "基础",
    icon: <IconBox />,
    children: [
      {
        path: "/desktop/basic/button",
        label: "Button",
        desc: "按钮",
        icon: <IconMousePointer />,
      },
      {
        path: "/desktop/basic/link",
        label: "Link",
        desc: "链接",
        icon: <IconLink />,
      },
    ],
  },
  {
    path: "/desktop/form/input",
    label: "表单",
    icon: <IconFileText />,
    children: [
      {
        path: "/desktop/form/input",
        label: "Input",
        desc: "输入框",
        icon: <IconType />,
      },
    ],
  },
];

/** Sidebar 组件 API 表行 */
const SIDEBAR_API: DocsApiTableRow[] = [
  {
    name: "overview",
    type: "{ path: string; label: string }",
    default: "-",
    description: "顶部单链「概览」",
  },
  {
    name: "sectionTitle",
    type: "string",
    default: "-",
    description: "分组标题（纯文案）",
  },
  {
    name: "items",
    type: "SidebarItem[]",
    default: "-",
    description: "一级菜单列表，类型为 SidebarItem[]，字段见下方 SidebarItem",
  },
  {
    name: "getCurrentPath",
    type: "() => string",
    default: "location.pathname",
    description: "当前路径，用于 active",
  },
  { name: "class", type: "string", default: "-", description: "aside class" },
  {
    name: "className",
    type: "string",
    default: "-",
    description: "同 class 的别名",
  },
  {
    name: "accordionGroupName",
    type: "string",
    default: "-",
    description: "多 Sidebar 并存时 details name 隔离",
  },
  {
    name: "drawerOpen",
    type: "Signal<boolean>",
    default: "-",
    description: "抽屉开关，与顶栏按钮联动；低于 drawerBreakpoint 时收入抽屉",
  },
  {
    name: "drawerBreakpoint",
    type: '"md" | "xl"',
    default: '"md"',
    description:
      "收起固定侧栏的断点；md 为 768px，xl 为 1280px（文档站用 xl，平板与移动端一样收起）",
  },
  {
    name: "drawerTitle",
    type: "string",
    default: "-",
    description: "抽屉标题；优先于 overview.label",
  },
  {
    name: "drawerAccordionGroupName",
    type: "string",
    default: "-",
    description: "抽屉内 details name，勿与 accordionGroupName 相同",
  },
  {
    name: "messages",
    type: "Partial<SidebarMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

/** SidebarItem 字段 */
const SIDEBAR_ITEM_API: DocsApiTableRow[] = [
  {
    name: "path",
    type: "string",
    default: "-",
    description:
      "路径。无 children 时作为链接地址；有 children 时用于判断当前分组是否展开和高亮",
  },
  {
    name: "label",
    type: "string",
    default: "-",
    description: "菜单文案",
  },
  {
    name: "icon",
    type: "unknown",
    default: "-",
    description:
      "自定义图标，显示在文案左侧（有子项时在展开箭头之后）；不传则只显示文字，可传如 <IconHome />",
  },
  {
    name: "children",
    type: "SidebarSubItem[]",
    default: "-",
    description:
      "二级菜单。传入则为可折叠分组，不传则为单链接。字段见下方 SidebarSubItem",
  },
];

/** SidebarSubItem 字段 */
const SIDEBAR_SUB_ITEM_API: DocsApiTableRow[] = [
  {
    name: "path",
    type: "string",
    default: "-",
    description: "二级链接地址，并用于当前路由高亮",
  },
  {
    name: "label",
    type: "string",
    default: "-",
    description: "菜单文案",
  },
  {
    name: "desc",
    type: "string",
    default: "-",
    description: "补充说明，展示为「label — desc」",
  },
  {
    name: "icon",
    type: "unknown",
    default: "-",
    description:
      "自定义图标，显示在文案左侧；不传则只显示文字，可传如 <IconHome />",
  },
];

const importCode = `import { Sidebar } from "@dreamer/ui-view/navigation";
import { IconBox } from "@dreamer/ui-view/icons/Box.tsx";
import { IconFileText } from "@dreamer/ui-view/icons/FileText.tsx";
import { IconPanelLeft } from "@dreamer/ui-view/icons/PanelLeft.tsx";
import { IconLink } from "@dreamer/ui-view/icons/Link.tsx";
import { IconMousePointer } from "@dreamer/ui-view/icons/MousePointer.tsx";
import { IconType } from "@dreamer/ui-view/icons/Type.tsx";

<Sidebar
  overview={{ path: "/desktop", label: "概览" }}
  sectionTitle="组件"
  items={items}
  getCurrentPath={() => "/desktop/basic/button"}
/>`;

/**
 * Sidebar 文档页：概述、引入、示例、文案表、API。
 */

const exampleDemo = `import { Sidebar } from "@dreamer/ui-view/navigation";
import { IconBox } from "@dreamer/ui-view/icons/Box.tsx";
import { IconPanelLeft } from "@dreamer/ui-view/icons/PanelLeft.tsx";
import { IconMousePointer } from "@dreamer/ui-view/icons/MousePointer.tsx";

const items = [
  { path: "/desktop/navigation/sidebar", label: "侧栏", icon: <IconPanelLeft /> },
  {
    path: "/desktop/basic/button",
    label: "基础",
    icon: <IconBox />,
    children: [
      {
        path: "/desktop/basic/button",
        label: "Button",
        desc: "按钮",
        icon: <IconMousePointer />,
      },
    ],
  },
];

<Sidebar
  overview={{ path: "/desktop", label: "概览" }}
  sectionTitle="组件"
  items={items}
  getCurrentPath={() => "/desktop/basic/button"}
/>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Sidebar 侧栏 · ui-view",
};

export default function NavigationSidebarDoc() {
  return (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>Sidebar 侧栏</Title>
        <Paragraph class="mt-2">
          文档站同款侧栏：分组、<code class="text-sm">details</code>{" "}
          手风琴、当前路由高亮；窄屏可配合{" "}
          <code class="text-sm">drawerOpen</code> 收入抽屉，并用{" "}
          <code class="text-sm">drawerBreakpoint</code> 指定断点（文档站为{" "}
          <code class="text-sm">
            xl
          </code>，平板与移动端一样默认收起）。一级、二级菜单都可传入{" "}
          <code class="text-sm">icon</code>{" "}
          自定义图标，显示在文案左侧；不传则只显示文字。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          title="代码示例"
          code={importCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>

      <section class="space-y-4">
        <Title level={2}>示例</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          下列 <code class="text-sm">getCurrentPath</code>{" "}
          固定返回演示路径，仅用于文档中高亮示意。
        </Paragraph>
        <div class="max-w-xs rounded-lg border border-slate-200 dark:border-slate-600 p-2">
          <Sidebar
            overview={{ path: "/desktop", label: "组件概览" }}
            sectionTitle="演示分组"
            items={[...SIDEBAR_DEMO_ITEMS]}
            getCurrentPath={() => "/desktop/basic/button"}
            accordionGroupName="docs-sidebar-demo"
          />
        </div>
      </section>

      <CodeBlock
        title="代码示例"
        code={exampleDemo}
        language="tsx"
        showLineNumbers
        copyable
        wrapLongLines
        maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
      />
      <DocsMessagesSection
        interfaceName="SidebarMessages"
        defaultExportName="defaultSidebarMessages"
        rows={MESSAGES_SIDEBAR}
      />

      <section class="space-y-4">
        <Title level={2}>API</Title>
        <Title level={3}>Sidebar</Title>
        <DocsApiTable rows={SIDEBAR_API} />
        <Title level={3}>SidebarItem</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          一级菜单项。没有 <code class="text-sm">children</code>{" "}
          时是单链接，有则是可折叠分组。
        </Paragraph>
        <DocsApiTable rows={SIDEBAR_ITEM_API} nameColumnHeader="字段" />
        <Title level={3}>SidebarSubItem</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          二级菜单项，展示为「label — desc」。
        </Paragraph>
        <DocsApiTable rows={SIDEBAR_SUB_ITEM_API} nameColumnHeader="字段" />
      </section>

      <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
        与{" "}
        <Link
          href="/desktop/navigation/navbar"
          className="text-teal-600 hover:underline dark:text-teal-400"
        >
          桌面 NavBar
        </Link>{" "}
        配合可做文档站布局（顶栏钮打开抽屉侧栏）。
      </Paragraph>
    </div>
  );
}
