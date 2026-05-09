/**
 * Sidebar 侧栏折叠菜单文档页。
 * 路由: /desktop/navigation/sidebar
 */

import { CodeBlock, Link, Paragraph, Sidebar, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_SIDEBAR } from "../../../data/component-messages-rows.ts";

/** 文档演示用菜单项（路径指向真实文档路由，便于高亮示意） */
const SIDEBAR_DEMO_ITEMS = [
  {
    path: "/desktop/basic/button",
    label: "基础",
    children: [
      {
        path: "/desktop/basic/button",
        label: "Button",
        desc: "按钮",
      },
      {
        path: "/desktop/basic/link",
        label: "Link",
        desc: "链接",
      },
    ],
  },
  {
    path: "/desktop/form/input",
    label: "表单",
    children: [
      {
        path: "/desktop/form/input",
        label: "Input",
        desc: "输入框",
      },
    ],
  },
] as const;

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
    description: "一级项；含 children 时为折叠分组",
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
    description: "小屏抽屉开关，与顶栏按钮联动",
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

const importCode = `import { Sidebar } from "@dreamer/ui-view";

<Sidebar
  overview={{ path: "/desktop", label: "概览" }}
  sectionTitle="组件"
  items={items}
  getCurrentPath={() => "/desktop/basic/button"}
/>`;

/**
 * Sidebar 文档页：概述、引入、示例、文案表、API。
 */
export default function NavigationSidebarDoc() {
  return (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>Sidebar 侧栏</Title>
        <Paragraph class="mt-2">
          文档站同款侧栏：分组、<code class="text-sm">details</code>{" "}
          手风琴、当前路由高亮；小屏可配合{" "}
          <code class="text-sm">drawerOpen</code> 收入抽屉。
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

      <DocsMessagesSection
        interfaceName="SidebarMessages"
        defaultExportName="defaultSidebarMessages"
        rows={MESSAGES_SIDEBAR}
      />

      <section class="space-y-4">
        <Title level={2}>API</Title>
        <DocsApiTable rows={SIDEBAR_API} />
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
