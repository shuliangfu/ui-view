/**
 * NavBar（桌面顶栏）文档页。
 * 路由: /desktop/navigation/navbar
 */

import { CodeBlock, Link, NavBar, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_DESKTOP_NAV_BAR } from "../../../data/component-messages-rows.ts";

/** 桌面 NavBar API 表行 */
const DESKTOP_NAV_BAR_API: DocsApiTableRow[] = [
  {
    name: "start",
    type: "unknown",
    default: "-",
    description: "最左区域（如菜单钮）",
  },
  {
    name: "center",
    type: "unknown",
    default: "-",
    description: "小屏居中层（常与 centerNudgeX 配合）",
  },
  {
    name: "centerNudgeX",
    type: "string",
    default: "-",
    description: "居中微调 CSS 长度",
  },
  {
    name: "brand",
    type: "unknown",
    default: "-",
    description: "品牌区",
  },
  { name: "nav", type: "unknown", default: "-", description: "主导航插槽" },
  {
    name: "menuAlign",
    type: `"left" | "center" | "right"`,
    default: `"right"`,
    description: "导航 flex 对齐",
  },
  { name: "end", type: "unknown", default: "-", description: "右侧操作区" },
  {
    name: "containerMaxWidth",
    type: "ContainerSize",
    default: `"xl"`,
    description: "内层 Container 宽度",
  },
  {
    name: "sticky",
    type: "boolean",
    default: "true",
    description: "是否 sticky 顶栏",
  },
  {
    name: "border",
    type: "boolean",
    default: "true",
    description: "底部分割线",
  },
  {
    name: "blur",
    type: "boolean",
    default: "true",
    description: "毛玻璃背景",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "header class",
  },
  {
    name: "containerClass",
    type: "string",
    default: "-",
    description: "Container 内层 flex 容器 class",
  },
  {
    name: "messages",
    type: "Partial<DesktopNavBarMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode = `import { Link, NavBar } from "@dreamer/ui-view";

<NavBar
  sticky={false}
  brand={<span class="font-semibold">Brand</span>}
  nav={
    <>
      <Link href="#">首页</Link>
      <Link href="#">文档</Link>
    </>
  }
/>`;

/**
 * NavBar（桌面）文档页：概述、引入、示例、文案表、API。
 */
export default function NavigationDesktopNavBarDoc() {
  return (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>NavBar 顶栏（桌面）</Title>
        <Paragraph class="mt-2">
          与{" "}
          <Link
            href="/mobile/navigation/navbar"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            移动端 NavBar
          </Link>{" "}
          不同：桌面版基于 Container 多区布局，主导航插槽的{" "}
          <code class="text-sm">aria-label</code> 来自{" "}
          <code class="text-sm">messages.navAriaLabel</code>。
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
          演示关闭 sticky/blur，避免嵌入文档页时粘连视口或样式过重。
        </Paragraph>
        <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
          <NavBar
            sticky={false}
            blur={false}
            border
            brand={
              <span class="font-semibold text-slate-800 dark:text-slate-100">
                Demo UI
              </span>
            }
            nav={
              <>
                <Link
                  href="#"
                  className="text-sm px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  首页
                </Link>
                <Link
                  href="#"
                  className="text-sm px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  组件
                </Link>
              </>
            }
            end={
              <span class="text-xs text-slate-500 dark:text-slate-400">
                end 插槽
              </span>
            }
          />
        </div>
      </section>

      <DocsMessagesSection
        interfaceName="DesktopNavBarMessages"
        defaultExportName="defaultDesktopNavBarMessages"
        rows={MESSAGES_DESKTOP_NAV_BAR}
      />

      <section class="space-y-4">
        <Title level={2}>API</Title>
        <DocsApiTable rows={DESKTOP_NAV_BAR_API} />
      </section>
    </div>
  );
}
