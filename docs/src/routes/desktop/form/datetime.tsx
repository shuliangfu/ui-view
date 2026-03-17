/**
 * DatePicker、TimePicker、TimeRangePicker 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/datetime
 */

import {
  CodeBlock,
  DatePicker,
  Form,
  FormItem,
  Paragraph,
  TimePicker,
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

const DATEPICKER_API: ApiRow[] = [
  {
    name: "value",
    type: "string | (() => string)",
    default: "-",
    description: "日期值（如 YYYY-MM-DD）；可为 getter",
  },
  { name: "min", type: "string", default: "-", description: "最小日期" },
  { name: "max", type: "string", default: "-", description: "最大日期" },
  { name: "size", type: "SizeVariant", default: "md", description: "尺寸" },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更（e.target.value）",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
];

const TIMEPICKER_API: ApiRow[] = [
  {
    name: "value",
    type: "string | (() => string)",
    default: "-",
    description: "时间值（HH:mm 或 HH:mm:ss）；可为 getter",
  },
  { name: "size", type: "SizeVariant", default: "md", description: "尺寸" },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更（e.target.value）",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
];

const TIMERANGEPICKER_API: ApiRow[] = [
  {
    name: "start",
    type: "string | (() => string)",
    default: "-",
    description: "开始时间",
  },
  {
    name: "end",
    type: "string | (() => string)",
    default: "-",
    description: "结束时间",
  },
  {
    name: "onChange",
    type: "([start, end]: [string, string]) => void",
    default: "-",
    description: "变更回调",
  },
  { name: "size", type: "SizeVariant", default: "md", description: "尺寸" },
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
  `import { DatePicker, TimePicker, TimeRangePicker, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const [dateVal, setDateVal] = createSignal("");
const [timeVal, setTimeVal] = createSignal("");
const [rangeVal, setRangeVal] = createSignal<[string, string]>(["", ""]);

<FormItem label="日期">
  <DatePicker
    value={dateVal()}
    onChange={(e) => setDateVal((e.target as HTMLInputElement).value)}
  />
</FormItem>
<FormItem label="时间">
  <TimePicker
    value={timeVal()}
    onChange={(e) => setTimeVal((e.target as HTMLInputElement).value)}
  />
</FormItem>
<FormItem label="时间范围">
  <TimeRangePicker
    start={() => rangeVal()[0]}
    end={() => rangeVal()[1]}
    onChange={(v) => setRangeVal(v)}
  />
</FormItem>`;

export default function FormDatetime() {
  const [dateVal, setDateVal] = createSignal("");
  const [timeVal, setTimeVal] = createSignal("");
  const [timeRangeVal, setTimeRangeVal] = createSignal<[string, string]>([
    "",
    "",
  ]);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>
          DatePicker / TimePicker / TimeRangePicker 日期与时间
        </Title>
        <Paragraph class="mt-2">
          DatePicker：日期选择，value、min、max、size、disabled、onChange。TimePicker：时间选择，value、size、disabled、onChange。TimeRangePicker：时间范围，start、end、onChange、size、disabled。Tailwind
          v4 + light/dark。
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
            <Title level={3}>基础用法</Title>
            <FormItem label="DatePicker">
              <DatePicker
                value={dateVal()}
                onChange={(e) =>
                  setDateVal((e.target as HTMLInputElement).value)}
              />
            </FormItem>
            <FormItem label="TimePicker">
              <TimePicker
                value={timeVal()}
                onChange={(e) =>
                  setTimeVal((e.target as HTMLInputElement).value)}
              />
            </FormItem>
            <FormItem label="TimeRangePicker">
              {() => (
                <TimeRangePicker
                  start={timeRangeVal()[0]}
                  end={timeRangeVal()[1]}
                  onChange={(v) => setTimeRangeVal(v)}
                />
              )}
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<DatePicker value={...} onChange={...} />
<TimePicker value={...} onChange={...} />
<TimeRangePicker start={...} end={...} onChange={...} />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>
        </Form>
      </section>

      <section class="space-y-6">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          三个组件属性如下（均为可选）。
        </Paragraph>

        <div>
          <Title level={3}>DatePicker</Title>
          <div class="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
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
                {DATEPICKER_API.map((row) => (
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
        </div>

        <div>
          <Title level={3}>TimePicker</Title>
          <div class="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
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
                {TIMEPICKER_API.map((row) => (
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
        </div>

        <div>
          <Title level={3}>TimeRangePicker</Title>
          <div class="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
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
        </div>
      </section>
    </div>
  );
}
