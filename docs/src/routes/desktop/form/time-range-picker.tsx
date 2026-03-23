/**
 * TimeRangePicker 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/time-range-picker
 */

import {
  CodeBlock,
  Form,
  FormItem,
  Paragraph,
  TimeRangePicker,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const TIMERANGEPICKER_API: ApiRow[] = [
  {
    name: "start",
    type: "string | (() => string)",
    default: "-",
    description: "开始时间（HH:mm 或 HH:mm:ss）；可为 getter",
  },
  {
    name: "end",
    type: "string | (() => string)",
    default: "-",
    description: "结束时间；可为 getter",
  },
  {
    name: "onChange",
    type: "([start, end]: [string, string]) => void",
    default: "-",
    description: "变更回调",
  },
  {
    name: "size",
    type: "SizeVariant",
    default: "md",
    description: "尺寸：xs、sm、md、lg",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
];

const importCode =
  `import { TimeRangePicker, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const range = createSignal<[string, string]>(["", ""]);
<FormItem label="时间范围">
  <TimeRangePicker
    start={() => range.value[0]}
    end={() => range.value[1]}
    onChange={(v) => range.value = v}
  />
</FormItem>`;

export default function FormTimeRangePicker() {
  const range = createSignal<[string, string]>(["", ""]);
  const range2 = createSignal<[string, string]>([
    "09:00",
    "18:00",
  ]);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>TimeRangePicker 时间范围</Title>
        <Paragraph class="mt-2">
          时间范围选择，start/end 为 HH:mm 或 HH:mm:ss；支持 onChange([start,
          end])、size、disabled。宽度由 class 控制，表单中需占满一列时传
          class="w-full"。Tailwind v4 + light/dark。
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

        <Form layout="vertical" class="w-full space-y-6">
          <section class="space-y-4">
            <Title level={3}>基础</Title>
            <FormItem label="时间范围">
              <TimeRangePicker
                start={() => range.value[0]}
                end={() => range.value[1]}
                onChange={(v) => range.value = v}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<TimeRangePicker
  start={() => range.value[0]}
  end={() => range.value[1]}
  onChange={(v) => range.value = v}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>有默认值 / size / disabled</Title>
            <FormItem label="默认 09:00–18:00">
              <TimeRangePicker
                start={() => range2.value[0]}
                end={() => range2.value[1]}
                onChange={(v) => range2.value = v}
              />
            </FormItem>
            <FormItem label="sm">
              <TimeRangePicker start="" end="" size="sm" onChange={() => {}} />
            </FormItem>
            <FormItem label="禁用">
              <TimeRangePicker
                start="08:00"
                end="17:00"
                disabled
                onChange={() => {}}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<TimeRangePicker
  start={() => range2.value[0]}
  end={() => range2.value[1]}
  onChange={(v) => range2.value = v}
/>
<TimeRangePicker start="" end="" size="sm" onChange={() => {}} />
<TimeRangePicker start="08:00" end="17:00" disabled onChange={() => {}} />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>
        </Form>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件接收以下属性（均为可选）。
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
              {TIMERANGEPICKER_API.map((row) => (
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
