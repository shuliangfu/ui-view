/**
 * Slider、Rate 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/slider-rate
 */

import {
  CodeBlock,
  Form,
  FormItem,
  Paragraph,
  Rate,
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
    type: "number | [number, number] | (() => number | [number, number])",
    default: "-",
    description: "当前值；range 时为 [min, max]",
  },
  { name: "min", type: "number", default: "0", description: "最小值" },
  { name: "max", type: "number", default: "100", description: "最大值" },
  { name: "step", type: "number", default: "1", description: "步长" },
  {
    name: "range",
    type: "boolean",
    default: "false",
    description: "是否范围模式",
  },
  {
    name: "vertical",
    type: "boolean",
    default: "false",
    description: "是否垂直",
  },
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
    description: "值变更（e.target.value）",
  },
  {
    name: "onInput",
    type: "(e: Event) => void",
    default: "-",
    description: "输入时触发",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
];

const RATE_API: ApiRow[] = [
  {
    name: "value",
    type: "number | (() => number)",
    default: "-",
    description: "当前星级；可为 getter",
  },
  { name: "count", type: "number", default: "5", description: "星星总数" },
  {
    name: "allowHalf",
    type: "boolean",
    default: "false",
    description: "是否允许半星",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  {
    name: "onChange",
    type: "(value: number) => void",
    default: "-",
    description: "变更回调",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const importCode =
  `import { Slider, Rate, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

// Slider
const [val, setVal] = createSignal(50);
<Slider
  value={val()}
  min={0}
  max={100}
  onChange={(e) => setVal(Number((e.target as HTMLInputElement).value))}
/>

// Rate
const [rate, setRate] = createSignal(0);
<Rate value={rate()} count={5} onChange={(v) => setRate(v)} />`;

export default function FormSliderRate() {
  const [sliderVal, setSliderVal] = createSignal(50);
  const [sliderRangeVal, setSliderRangeVal] = createSignal<[number, number]>([
    20,
    80,
  ]);
  const [rateVal, setRateVal] = createSignal(0);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Slider / Rate 滑块与评分</Title>
        <Paragraph class="mt-2">
          Slider：单值/范围滑块，支持
          value、min、max、step、range、vertical、disabled、onChange。Rate：星级评分，支持
          value、count、allowHalf、disabled、onChange。Tailwind v4 +
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
            <Title level={3}>Slider 单值</Title>
            <FormItem label="单值">
              {() => (
                <Slider
                  value={sliderVal()}
                  min={0}
                  max={100}
                  onChange={(e) =>
                    setSliderVal(Number((e.target as HTMLInputElement).value))}
                />
              )}
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Slider
  value={sliderVal()}
  min={0}
  max={100}
  onChange={(e) => setSliderVal(Number((e.target as HTMLInputElement).value))}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>Slider 范围</Title>
            <FormItem label="范围">
              {() => (
                <Slider
                  range
                  value={sliderRangeVal()}
                  min={0}
                  max={100}
                  onChange={(e) =>
                    setSliderRangeVal(
                      (e.target as unknown as { value: [number, number] })
                        .value,
                    )}
                />
              )}
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Slider
  range
  value={sliderRangeVal()}
  min={0}
  max={100}
  onChange={(e) => setSliderRangeVal(...)}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>Rate 基础</Title>
            <FormItem label="评分">
              {() => (
                <Rate
                  value={rateVal()}
                  onChange={(v) => setRateVal(v)}
                  count={5}
                />
              )}
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Rate
  value={rateVal()}
  onChange={(v) => setRateVal(v)}
  count={5}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>Rate allowHalf / disabled</Title>
            <FormItem label="半星">
              {() => (
                <Rate value={2.5} onChange={() => {}} count={5} allowHalf />
              )}
            </FormItem>
            <FormItem label="禁用">
              {() => <Rate value={3} count={5} disabled onChange={() => {}} />}
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Rate allowHalf /> / <Rate disabled />`}
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
          Slider、Rate 属性如下（均为可选）。
        </Paragraph>

        <div>
          <Title level={3}>Slider</Title>
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
        </div>

        <div>
          <Title level={3}>Rate</Title>
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
                {RATE_API.map((row) => (
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
