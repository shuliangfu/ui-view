/**
 * FlagImg：单国 SVG → data URL 图片渲染；空 svg 时展示占位。
 * 路由: /desktop/basic/flag-img
 */

import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { FlagImg } from "@internal/ui-view-flag-img";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_FLAG_IMG } from "../../../data/component-messages-rows.ts";

/** 文档示例用极简矩形 SVG（非真实国旗，仅演示 data URL 路径） */
const DEMO_FLAG_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3"><rect width="5" height="3" fill="#dc2626"/></svg>`;

/** FlagImg 组件 API 表行 */
const FLAG_IMG_API: DocsApiTableRow[] = [
  {
    name: "svg",
    type: "string",
    default: "-",
    description: "完整单国 SVG XML；为空时走占位 UI",
  },
  {
    name: "size",
    type: "IconSize | number",
    default: "-",
    description: "与 Icon 一致的尺寸约定",
  },
  {
    name: "title",
    type: "string | undefined",
    default: "-",
    description: "img title；无则读屏策略见源码",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "根容器 class",
  },
  {
    name: "messages",
    type: "Partial<FlagImgMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode =
  `import { FlagImg } from "@internal/ui-view-flag-img"; // 文档站别名；库内请走 icons 导出链

const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3"><rect width="5" height="3" fill="#dc2626"/></svg>\`;

<FlagImg svg={svg} size="md" />`;

/**
 * FlagImg 文档页：概述、引入、示例、文案表、API。
 */
export default function BasicFlagImgDoc() {
  return (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>FlagImg 国旗渲染</Title>
        <Paragraph class="mt-2">
          供各 <code class="text-sm">IconFlagXX</code>{" "}
          独立文件复用：传入一国完整 SVG 字符串，内部用{" "}
          <code class="text-sm">data:image/svg+xml</code>{" "}
          驱动图片，避免一次性打入超大映射表。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          包根聚合未列出 FlagImg 时，可从与源码一致的 internal 路径或 icons
          子模块导入；本站示例使用文档专用别名{" "}
          <code class="text-sm">@internal/ui-view-flag-img</code>。
        </Paragraph>
        <CodeBlock
          title="代码示例"
          code={importCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
        />
      </section>

      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-3">
          <Title level={3}>有 SVG</Title>
          <div class="flex items-center gap-4">
            <FlagImg svg={DEMO_FLAG_SVG} size="lg" title="示例旗" />
          </div>
        </div>
        <div class="space-y-3">
          <Title level={3}>空 SVG（占位与 messages.emptySvgTitle）</Title>
          <div class="flex items-center gap-4">
            <FlagImg svg="" size="md" />
          </div>
        </div>
      </section>

      <DocsMessagesSection
        interfaceName="FlagImgMessages"
        defaultExportName="defaultFlagImgMessages"
        rows={MESSAGES_FLAG_IMG}
      />

      <section class="space-y-4">
        <Title level={2}>API</Title>
        <DocsApiTable rows={FLAG_IMG_API} />
      </section>
    </div>
  );
}
