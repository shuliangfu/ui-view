/**
 * InputNumber 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/input-number
 */

import {
  CodeBlock,
  Form,
  FormItem,
  InputNumber,
  Paragraph,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const INPUT_NUMBER_API: ApiRow[] = [
  {
    name: "value",
    type: "string | (() => string)",
    default: "-",
    description: "当前值；可为 getter",
  },
  { name: "min", type: "number", default: "-", description: "最小值" },
  { name: "max", type: "number", default: "-", description: "最大值" },
  { name: "step", type: "number", default: "1", description: "步进值" },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "占位文案",
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
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更回调",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
];

const importCode =
  `import { InputNumber, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const [val, setVal] = createSignal("10");
<FormItem label="数量">
  <InputNumber
    value={val}
    min={0}
    max={100}
    step={5}
    onChange={(e) => setVal((e.target as HTMLInputElement).value)}
  />
</FormItem>`;

export default function FormInputNumber() {
  const [val, setVal] = createSignal("10");
  const [val2, setVal2] = createSignal("0");
  const [val3, setVal3] = createSignal("50");

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>InputNumber 数字输入</Title>
        <Paragraph class="mt-2">
          数字输入框，带步进按钮；支持
          value、min、max、step、placeholder、size、disabled、onChange。宽度由
          class 控制，表单中需占满一列时传 class="w-full"。Tailwind v4 +
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
            <Title level={3}>步进按钮 + min/max/step</Title>
            <FormItem label="0–100，步进 5">
              <InputNumber
                value={val}
                min={0}
                max={100}
                step={5}
                onChange={(e) => setVal((e.target as HTMLInputElement).value)}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<InputNumber
  value={val}
  min={0}
  max={100}
  step={5}
  onChange={(e) => setVal((e.target as HTMLInputElement).value)}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>小数步进（step=0.1）</Title>
            <FormItem label="0–10，步进 0.1">
              <InputNumber
                value={val2}
                min={0}
                max={10}
                step={0.1}
                onChange={(e) => setVal2((e.target as HTMLInputElement).value)}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<InputNumber
  value={val2}
  min={0}
  max={10}
  step={0.1}
  onChange={(e) => setVal2((e.target as HTMLInputElement).value)}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>placeholder</Title>
            <FormItem label="占位">
              <InputNumber
                placeholder="请输入数量"
                value=""
                min={0}
                max={999}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<InputNumber
  placeholder="请输入数量"
  value=""
  min={0}
  max={999}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>disabled</Title>
            <FormItem label="禁用">
              <InputNumber value="99" min={0} max={100} disabled />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<InputNumber value="99" min={0} max={100} disabled />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>size</Title>
            <FormItem label="sm">
              <InputNumber size="sm" value="1" min={0} max={10} />
            </FormItem>
            <FormItem label="md">
              <InputNumber
                size="md"
                value={val3}
                min={0}
                max={100}
                onChange={(e) => setVal3((e.target as HTMLInputElement).value)}
              />
            </FormItem>
            <FormItem label="lg">
              <InputNumber size="lg" value="5" min={0} max={10} />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<InputNumber size="sm" value="1" min={0} max={10} />
<InputNumber size="md" value={val3} min={0} max={100} onChange={...} />
<InputNumber size="lg" value="5" min={0} max={10} />`}
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
              {INPUT_NUMBER_API.map((row) => (
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
