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
import { createEffect, createRef } from "@dreamer/view";
import { createReactive } from "@dreamer/view/reactive";

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
    description:
      "仅在松手时原生 change 触发；单值 target.value 为 string；range 为合成 value: [n,n]。拖动中不调用，避免父级每帧更新导致 input 被换掉拖不动",
  },
  {
    name: "onInput",
    type: "(e: Event) => void",
    default: "-",
    description:
      "拖动过程回调（rAF 合并）；需要拖动时更新父级 state 或展示请用此项；与 onChange 可同时使用",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
];

const importCode = `import { Slider, Form, FormItem } from "@dreamer/ui-view";
import { createEffect, createRef } from "@dreamer/view";
import { createReactive } from "@dreamer/view/reactive";

/** 仅 committed 走响应式并绑 Slider；文案用 ref 写 DOM，拖动时不走模板插值 */
const slider = createReactive({ committed: 50 });
const hintRef = createRef<HTMLSpanElement>();
createEffect(() => {
  const el = hintRef.current;
  if (el) el.textContent = \`当前值：\${slider.committed}\`;
});
<FormItem label="0–100">
  <div class="flex w-full min-w-0 flex-col gap-1">
    <Slider
      value={() => slider.committed}
      min={0}
      max={100}
      onInput={(e) => {
        const el = hintRef.current;
        if (el) el.textContent = \`当前值：\${(e.target as HTMLInputElement).value}\`;
      }}
      onChange={(e) => {
        slider.committed = Number((e.target as HTMLInputElement).value);
      }}
    />
    <span
      ref={hintRef}
      class="text-sm tabular-nums text-slate-600 dark:text-slate-400"
    />
  </div>
</FormItem>`;

/** 文档示例：滑块下方展示当前数值的样式（等宽数字、次要色） */
const sliderValueHintCls =
  "text-sm tabular-nums text-slate-600 dark:text-slate-400";

/** 单值行：仅改 DOM 文案 */
function writeSingleValueHint(el: HTMLElement | null, v: number): void {
  if (el != null) el.textContent = `当前值：${v}`;
}

/** 竖排行：带「共用 reactive」说明 */
function writeVerticalValueHint(el: HTMLElement | null, v: number): void {
  if (el != null) {
    el.textContent = `当前值：${v}（与上方「单值」共用 reactive）`;
  }
}

/** range 行文案 */
function writeRangeValueHint(
  el: HTMLElement | null,
  a: number,
  b: number,
): void {
  if (el != null) el.textContent = `当前范围：${a} – ${b}`;
}

/** step 示例文案 */
function writeStepValueHint(el: HTMLElement | null, v: number): void {
  if (el != null) el.textContent = `当前值：${v}（步长 10）`;
}

export default function FormSlider() {
  /** 仅 committed 响应式；拖动中数字靠 ref 写 span，避免模板插值触发兄弟节点更新 */
  const singleSlider = createReactive({ committed: 50 });
  const rangeSlider = createReactive({
    committed: [20, 80] as [number, number],
  });
  const stepSlider = createReactive({ committed: 30 });

  const singleRowHintRef = createRef<HTMLSpanElement>();
  const verticalRowHintRef = createRef<HTMLSpanElement>();
  const rangeHintRef = createRef<HTMLSpanElement>();
  const stepHintRef = createRef<HTMLSpanElement>();

  /** committed 变化时同步两处文案（含挂载后 ref 就绪） */
  createEffect(() => {
    const v = singleSlider.committed;
    writeSingleValueHint(singleRowHintRef.current, v);
    writeVerticalValueHint(verticalRowHintRef.current, v);
  });

  createEffect(() => {
    const c = rangeSlider.committed;
    writeRangeValueHint(rangeHintRef.current, c[0], c[1]);
  });

  createEffect(() => {
    writeStepValueHint(stepHintRef.current, stepSlider.committed);
  });

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Slider 滑块</Title>
        <Paragraph class="mt-2 leading-relaxed">
          滑块，支持单值或 range
          双值、min、max、step、vertical、disabled、onChange / onInput。Tailwind
          v4 + light/dark。
        </Paragraph>
        <Paragraph class="mt-3 text-sm text-slate-600 dark:text-slate-400">
          <strong>受控与拖动：</strong>
          本组件不在原生 <code class="text-xs">input</code> 上绑响应式{" "}
          <code class="text-xs">value</code>，而用 ref + effect
          在非拖动时同步。<strong>不要</strong>在{" "}
          <code class="text-xs">onInput</code> 里更新与 Slider{" "}
          <code class="text-xs">value</code> 绑定的<strong>同一状态</strong>
          ，否则易换掉 <code class="text-xs">input</code> 拖不动。
        </Paragraph>
        <Paragraph class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          <strong>响应式与 DOM：</strong>
          任意 signal / reactive 字段变化都会调度<strong>
            依赖它的视图更新
          </strong>
          （理想情况下只更新对应文本或节点，不是整页）。但在模板里写{" "}
          <code class="text-xs">{"{() => ...}"}</code>{" "}
          绑定「拖动中的数字」时，每次变化仍会走视图层更新，DevTools
          里常见父级、兄弟节点<strong>
            高亮
          </strong>，极端情况下可能影响滑块。本页示例用{" "}
          <code class="text-xs">createReactive</code> 只存{" "}
          <code class="text-xs">committed</code>（供{" "}
          <code class="text-xs">
            value
          </code>，仅 <code class="text-xs">onChange</code> 写），拖动中的读数用
          {" "}
          <code class="text-xs">ref</code> +{" "}
          <code class="text-xs">
            textContent
          </code>{" "}
          在 <code class="text-xs">onInput</code> 更新——<strong>
            不经过
          </strong>{" "}
          另一份响应式展示字段，可与 input 最大程度隔离。
        </Paragraph>
        <Paragraph class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          <strong>range 双滑块：</strong>
          横向为同一轨道上的两枚拇指，中间为选中区间色带；竖向 range
          仍为双轨示意布局。
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
              <div class="flex w-full min-w-0 flex-col gap-1">
                <Slider
                  value={() => singleSlider.committed}
                  min={0}
                  max={100}
                  onInput={(e) => {
                    const n = Number((e.target as HTMLInputElement).value);
                    writeSingleValueHint(singleRowHintRef.current, n);
                    writeVerticalValueHint(verticalRowHintRef.current, n);
                  }}
                  onChange={(e) => {
                    singleSlider.committed = Number(
                      (e.target as HTMLInputElement).value,
                    );
                  }}
                />
                <span ref={singleRowHintRef} class={sliderValueHintCls} />
              </div>
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`import { createEffect, createRef } from "@dreamer/view";
import { createReactive } from "@dreamer/view/reactive";

const slider = createReactive({ committed: 50 });
const hintRef = createRef<HTMLSpanElement>();
createEffect(() => {
  const el = hintRef.current;
  if (el) el.textContent = \`当前值：\${slider.committed}\`;
});
<div class="flex w-full min-w-0 flex-col gap-1">
  <Slider
    value={() => slider.committed}
    min={0}
    max={100}
    onInput={(e) => {
      const el = hintRef.current;
      if (el) {
        el.textContent = \`当前值：\${(e.target as HTMLInputElement).value}\`;
      }
    }}
    onChange={(e) => {
      slider.committed = Number((e.target as HTMLInputElement).value);
    }}
  />
  <span
    ref={hintRef}
    class="text-sm tabular-nums text-slate-600 dark:text-slate-400"
  />
</div>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>range 双滑块</Title>
            <FormItem label="范围">
              <div class="flex w-full min-w-0 flex-col gap-1">
                <Slider
                  range
                  value={() => rangeSlider.committed}
                  min={0}
                  max={100}
                  onInput={(e) => {
                    const t =
                      (e.target as unknown as { value: [number, number] })
                        .value;
                    writeRangeValueHint(rangeHintRef.current, t[0], t[1]);
                  }}
                  onChange={(e) => {
                    const t =
                      (e.target as unknown as { value: [number, number] })
                        .value;
                    rangeSlider.committed = [t[0], t[1]];
                  }}
                />
                <span ref={rangeHintRef} class={sliderValueHintCls} />
              </div>
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`import { createEffect, createRef } from "@dreamer/view";
import { createReactive } from "@dreamer/view/reactive";

const range = createReactive({
  committed: [20, 80] as [number, number],
});
const hintRef = createRef<HTMLSpanElement>();
createEffect(() => {
  const el = hintRef.current;
  const c = range.committed;
  if (el) el.textContent = \`当前范围：\${c[0]} – \${c[1]}\`;
});
<div class="flex w-full min-w-0 flex-col gap-1">
  <Slider
    range
    value={() => range.committed}
    min={0}
    max={100}
    onInput={(e) => {
      const t = (e.target as unknown as { value: [number, number] }).value;
      const el = hintRef.current;
      if (el) el.textContent = \`当前范围：\${t[0]} – \${t[1]}\`;
    }}
    onChange={(e) => {
      const t = (e.target as unknown as { value: [number, number] }).value;
      range.committed = [t[0], t[1]];
    }}
  />
  <span
    ref={hintRef}
    class="text-sm tabular-nums text-slate-600 dark:text-slate-400"
  />
</div>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>vertical 竖排</Title>
            <FormItem label="竖排单值">
              <div class="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                <Slider
                  value={() => singleSlider.committed}
                  min={0}
                  max={100}
                  vertical
                  onInput={(e) => {
                    const n = Number((e.target as HTMLInputElement).value);
                    writeSingleValueHint(singleRowHintRef.current, n);
                    writeVerticalValueHint(verticalRowHintRef.current, n);
                  }}
                  onChange={(e) => {
                    singleSlider.committed = Number(
                      (e.target as HTMLInputElement).value,
                    );
                  }}
                />
                <span
                  ref={verticalRowHintRef}
                  class={`${sliderValueHintCls} sm:pb-1`}
                />
              </div>
            </FormItem>
          </section>

          <section class="space-y-4">
            <Title level={3}>step / disabled</Title>
            <FormItem label="step=10">
              <div class="flex w-full min-w-0 flex-col gap-1">
                <Slider
                  value={() => stepSlider.committed}
                  min={0}
                  max={100}
                  step={10}
                  onInput={(e) => {
                    writeStepValueHint(
                      stepHintRef.current,
                      Number((e.target as HTMLInputElement).value),
                    );
                  }}
                  onChange={(e) => {
                    stepSlider.committed = Number(
                      (e.target as HTMLInputElement).value,
                    );
                  }}
                />
                <span ref={stepHintRef} class={sliderValueHintCls} />
              </div>
            </FormItem>
            <FormItem label="disabled">
              <div class="flex w-full min-w-0 flex-col gap-1">
                <Slider value={60} min={0} max={100} disabled />
                <span class={sliderValueHintCls}>
                  当前值：60（禁用，不可拖动）
                </span>
              </div>
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`import { createEffect, createRef } from "@dreamer/view";
import { createReactive } from "@dreamer/view/reactive";

const step = createReactive({ committed: 30 });
const hintRef = createRef<HTMLSpanElement>();
createEffect(() => {
  const el = hintRef.current;
  if (el) el.textContent = \`当前值：\${step.committed}（步长 10）\`;
});
<div class="flex w-full min-w-0 flex-col gap-1">
  <Slider
    value={() => step.committed}
    min={0}
    max={100}
    step={10}
    onInput={(e) => {
      const el = hintRef.current;
      if (el) {
        el.textContent = \`当前值：\${(e.target as HTMLInputElement).value}（步长 10）\`;
      }
    }}
    onChange={(e) => {
      step.committed = Number((e.target as HTMLInputElement).value);
    }}
  />
  <span
    ref={hintRef}
    class="text-sm tabular-nums text-slate-600 dark:text-slate-400"
  />
</div>
<div class="flex w-full min-w-0 flex-col gap-1">
  <Slider value={60} min={0} max={100} disabled />
  <span class="text-sm tabular-nums text-slate-600 dark:text-slate-400">
    当前值：60（禁用，不可拖动）
  </span>
</div>`}
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
          组件接收以下属性（均为可选）。对外只暴露{" "}
          <code class="text-xs">onChange</code> /{" "}
          <code class="text-xs">onInput</code>；<code class="text-xs">
            range
          </code>{" "}
          为 true 时两个原生 input 在拖动中仅经 rAF 走{" "}
          <code class="text-xs">onInput</code>（若传入）；松手时再触发{" "}
          <code class="text-xs">onChange</code>。
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
