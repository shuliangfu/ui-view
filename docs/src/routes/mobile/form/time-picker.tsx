/**
 * TimePicker（移动版）文档页：概述、引入、示例、文案（messages）、API。
 * 路由: /mobile/form/time-picker
 */

import { TimePicker } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import { MESSAGES_TIME_PICKER } from "../../../data/component-messages-rows.ts";

/** 与桌面 TimePicker 对齐的 API 说明（移动入口与 shared 实现一致） */
const TIMEPICKER_API: DocsApiTableRow[] = [
  {
    name: "mode",
    type: `"single" | "range" | "multiple"`,
    default: "single",
    description:
      "单时刻 / 区间 / 多时刻；range、multiple 时隐藏值为 JSON，详见桌面文档",
  },
  {
    name: "value",
    type: "MaybeSignal<TimePickerValue>",
    default: "-",
    description: "受控值，形态随 mode、format 变化",
  },
  {
    name: "size",
    type: "SizeVariant",
    default: "md",
    description: "触发器尺寸",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "禁用",
  },
  {
    name: "hideFocusRing",
    type: "boolean",
    default: "false",
    description: "隐藏聚焦 ring",
  },
  {
    name: "placeholder",
    type: "string",
    default: `"请选择时间"`,
    description: "无值占位；props 优先于 messages.placeholder",
  },
  {
    name: "format",
    type: "string",
    default: "HH:mm",
    description: "HH / mm / ss 或前缀链；详见桌面 TimePicker",
  },
  {
    name: "panelAttach",
    type: `"anchored" | "viewport"`,
    default: "anchored",
    description: "viewport：浮层 fixed 到视口，避免被 overflow 裁切",
  },
  { name: "class", type: "string", default: "-", description: "根 class" },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更；值为时间串或 JSON",
  },
  { name: "name", type: "string", default: "-", description: "隐藏域 name" },
  { name: "id", type: "string", default: "-", description: "根 id" },
  {
    name: "messages",
    type: "Partial<TimePickerMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode = `import { TimePicker } from "@dreamer/ui-view/mobile";
import { createSignal } from "@dreamer/view";

const val = createSignal("09:30");

<TimePicker value={val} class="w-full" />`;

/** 模块级 Signal，与桌面 TimePicker 受控约定一致 */
const mobileTimePickerVal = createSignal("09:30");

/**
 * TimePicker 移动文档页。
 */
export default function MobileTimePickerDoc() {
  return (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>TimePicker 时间（移动）</Title>
        <Paragraph class="mt-2">
          与桌面共用实现：触发器 + 时分（及 format 允许的秒）列表面板；从{" "}
          <code class="text-sm">@dreamer/ui-view/mobile</code>{" "}
          导入与同页其它移动表单一致。<code class="text-sm">mode</code>、
          <code class="text-sm">format</code>、
          <code class="text-sm">panelAttach</code>{" "}
          等行为见桌面 TimePicker 文档。
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

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>基础（Signal）</Title>
          <MobileDocDemo>
            <TimePicker value={mobileTimePickerVal} class="w-full" />
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={importCode}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>

      <DocsMessagesSection
        interfaceName="TimePickerMessages"
        defaultExportName="defaultTimePickerMessages"
        rows={MESSAGES_TIME_PICKER}
      />

      <section class="space-y-4">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          与 <code class="text-sm">@dreamer/ui-view</code>{" "}
          中 TimePicker 一致；完整 mode/format 组合见桌面文档。
        </Paragraph>
        <DocsApiTable rows={TIMEPICKER_API} />
      </section>
    </div>
  );
}
