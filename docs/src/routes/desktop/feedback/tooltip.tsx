/**
 * Tooltip 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/feedback/tooltip
 */

import { Paragraph, Title } from "@dreamer/ui-view/basic";

import { CodeBlock } from "@dreamer/ui-view/data-display";

import { Tooltip } from "@dreamer/ui-view/feedback";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_TOOLTIP } from "../../../data/component-messages-rows.ts";
/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const TOOLTIP_API: ApiRow[] = [
  {
    name: "content",
    type: "string | unknown",
    default: "-",
    description: "提示文案或节点",
  },
  {
    name: "placement",
    type: "auto | top | right | bottom | left | …",
    default: "top",
    description:
      "气泡位置。传 auto 时优选上方，边挡住则朝相反方向展开（右挡→左、上挡→下），箭头跟随实际方位。写死方位不翻转。",
  },
  { name: "children", type: "unknown", default: "-", description: "触发元素" },
  {
    name: "arrow",
    type: "boolean",
    default: "true",
    description: "是否显示箭头",
  },
  { name: "class", type: "string", default: "-", description: "包装器 class" },
  {
    name: "overlayClass",
    type: "string",
    default: "-",
    description:
      "气泡外层（Portal 根节点）class，可传 z-index 等（如全屏编辑器内抬高）",
  },
  {
    name: "disabled",
    type: "boolean | (() => boolean)",
    default: "false",
    description:
      "为 true 时强制隐藏且不响应悬停；可传 getter（如 Popconfirm 打开时压掉同锚点 tip）。按下触发器也会收起 tip。",
  },  {
    name: "messages",
    type: "Partial<TooltipMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },

];

const importCode = `import { Tooltip } from "@dreamer/ui-view/feedback";

<Tooltip
  content="上方提示"
  placement="top"
>
  <span>悬停我</span>
</Tooltip>`;

const examplePlacement =
  `<Tooltip content="上方提示" placement="top"><span>Top</span></Tooltip>
<Tooltip content="右侧提示" placement="right"><span>Right</span></Tooltip>
<Tooltip content="下方提示" placement="bottom"><span>Bottom</span></Tooltip>
<Tooltip content="左侧提示" placement="left"><span>Left</span></Tooltip>`;

const exampleLong =
  `<Tooltip content="这是一段较长的提示文案，用于说明当前操作的注意事项。">
  <span>长文案</span>
</Tooltip>`;

const exampleNoArrow = `<Tooltip
  content="不显示箭头的气泡"
  arrow={false}
>
  <span>无箭头</span>
</Tooltip>`;

const exampleAuto = `<div class="flex justify-end">
  <Tooltip content="右边被挡时向左展开，箭头跟随实际方位" placement="auto">
    <span>靠右悬停</span>
  </Tooltip>
</div>`;

export default function FeedbackTooltip() {
  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Tooltip 悬停提示</Title>
        <Paragraph class="mt-2">
          悬停提示：触发器悬停时显示气泡；支持 placement（含 auto 贴边翻转）、箭头。有{" "}
          <code class="text-xs">document.body</code> 时气泡经{" "}
          <code class="text-xs">createPortal</code> 挂到 body，
          <code class="text-xs">fixed</code> 对齐视口，避免父级{" "}
          <code class="text-xs">overflow</code>{" "}
          裁切；无 body 时回退为包裹层内绝对定位。使用 Tailwind v4，支持
          light/dark 主题。
        </Paragraph>
        <Paragraph class="mt-2 text-sm text-slate-600 dark:text-slate-400">气泡可见文案请用 <code>content</code>。<code>messages</code> 与其它组件同形预留（当前仅 <code>_reserved</code>）。</Paragraph>
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

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>位置（placement）</Title>
          <div class="flex flex-wrap gap-6 pt-4">
            <Tooltip content="上方提示" placement="top">
              <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
                Top
              </span>
            </Tooltip>
            <Tooltip content="右侧提示" placement="right">
              <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
                Right
              </span>
            </Tooltip>
            <Tooltip content="下方提示" placement="bottom">
              <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
                Bottom
              </span>
            </Tooltip>
            <Tooltip content="左侧提示" placement="left">
              <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
                Left
              </span>
            </Tooltip>
          </div>
          <CodeBlock
            title="代码示例"
            code={examplePlacement}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>长文案</Title>
          <div class="pt-4">
            <Tooltip content="这是一段较长的提示文案，用于说明当前操作的注意事项。">
              <span class="px-3 py-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-default">
                长文案
              </span>
            </Tooltip>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleLong}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>无箭头（arrow=false）</Title>
          <div class="pt-4">
            <Tooltip content="不显示箭头的气泡" arrow={false}>
              <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
                无箭头
              </span>
            </Tooltip>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleNoArrow}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
        <div class="space-y-4" data-demo="auto-flip-right">
          <Title level={3}>贴边自动翻转（placement=auto）</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            触发器贴在视口最右侧。{" "}
            <code class="text-xs">placement=&quot;auto&quot;</code>
            {" "}时右边被挡会向左展开，箭头跟随实际方位。
          </Paragraph>
          <div class="-mr-3 sm:-mr-6 lg:-mr-10 pr-2">
            <div class="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 px-3 py-3">
                <div class="flex justify-end">
                  <Tooltip
                    content="右边被挡时向左展开，箭头跟随实际方位"
                    placement="auto"
                  >
                    <span
                      data-demo-trigger="tooltip-auto-right"
                      class="px-3 py-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-default"
                    >
                      靠右悬停
                    </span>
                  </Tooltip>
                </div>
            </div>
          </div>
          <CodeBlock
            title="代码示例（贴右边，auto 向左展开）"
            code={exampleAuto}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>

      <DocsMessagesSection
        interfaceName="TooltipMessages"
        defaultExportName="defaultTooltipMessages"
        rows={MESSAGES_TOOLTIP}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件接收以下属性，content 为必填。
        </Paragraph>
        <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
          <table class="w-full min-w-lg text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80">
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  属性
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  类型
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  默认值
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              {TOOLTIP_API.map((row) => (
                <tr
                  key={row.name}
                  class="border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <td class="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                    {row.name}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.type}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.default}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
