/**
 * Slider 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/slider
 */

import {
  CodeBlock,
  Form,
  FormItem,
  Paragraph,
  Slider,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const SLIDER_API: ApiRow[] = [
  {
    name: "value",
    type: "number | (() => number) | [number, number]",
    default: "-",
    description: "单值或 range 双值；可为 getter",
  },
  { name: "min", type: "number", default: "0", description: "最小值" },
  { name: "max", type: "number", default: "100", description: "最大值" },
  { name: "step", type: "number", default: "1", description: "步长" },
  {
    name: "range",
    type: "boolean",
    default: "false",
    description: "是否为范围双滑块",
  },
  {
    name: "vertical",
    type: "boolean",
    default: "false",
    description: "是否竖向",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更回调",
  },
  {
    name: "onInput",
    type: "(e: Event) => void",
    default: "-",
    description: "拖动中回调",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
];

const importCode = `import { Slider, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const val = createSignal(50);
<FormItem label="0–100">
  <Slider
    value={() => val.value}
    min={0}
    max={100}
    onChange={(e) => val.value = Number((e.target as HTMLInputElement).value)}
  />
</FormItem>`;

export default function FormSlider() {
  const val = createSignal(50);
  const rangeVal = createSignal<[number, number]>([20, 80]);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Slider 滑块</Title>
        <Paragraph class="mt-2">
          滑块，支持单值或 range
          双值、min、max、step、vertical、disabled、onChange。Tailwind v4 +
          light/dark。
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
            <Title level={3}>单值</Title>
            <FormItem label="0–100">
              <Slider
                value={() => val.value}
                min={0}
                max={100}
                onChange={(e) =>
                  val.value = Number((e.target as HTMLInputElement).value)}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Slider
  value={() => val.value}
  min={0}
  max={100}
  onChange={(e) => val.value = Number((e.target as HTMLInputElement).value)}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>range 双滑块</Title>
            <FormItem label="范围">
              <Slider
                range
                value={() => rangeVal.value}
                min={0}
                max={100}
                onChange={(e) => {
                  rangeVal.value =
                    (e.target as unknown as { value: [number, number] }).value;
                }}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Slider
  range
  value={() => rangeVal.value}
  min={0}
  max={100}
  onChange={(e) => rangeVal.value = (e.target as unknown as { value: [number, number] }).value}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>vertical 竖排</Title>
            <FormItem label="竖排单值">
              <Slider
                value={() => val.value}
                min={0}
                max={100}
                vertical
                onChange={(e) =>
                  val.value = Number((e.target as HTMLInputElement).value)}
              />
            </FormItem>
          </section>

          <section class="space-y-4">
            <Title level={3}>step / disabled</Title>
            <FormItem label="step=10">
              <Slider value={30} min={0} max={100} step={10} />
            </FormItem>
            <FormItem label="disabled">
              <Slider value={60} min={0} max={100} disabled />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Slider
  value={30}
  min={0}
  max={100}
  step={10}
/>
<Slider
  value={60}
  min={0}
  max={100}
  disabled
/>`}
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
              {SLIDER_API.map((row) => (
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
