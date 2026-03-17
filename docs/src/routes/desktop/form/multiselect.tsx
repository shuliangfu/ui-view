/**
 * MultiSelect 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/multiselect
 */

import {
  CodeBlock,
  Form,
  FormItem,
  MultiSelect,
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

const MULTISELECT_API: ApiRow[] = [
  {
    name: "options",
    type: "Array<{value, label, disabled?}>",
    default: "-",
    description: "选项列表",
  },
  {
    name: "value",
    type: "string[] | (() => string[])",
    default: "-",
    description: "当前选中值数组；可为 getter",
  },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更回调（e.target 或 selectedOptions）",
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
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const options = [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
  { value: "c", label: "选项 C", disabled: true },
];

const importCode =
  `import { MultiSelect, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const options = [{ value: "a", label: "选项 A" }, { value: "b", label: "选项 B" }];
const [val, setVal] = createSignal<string[]>([]);
<FormItem label="多选">
  <MultiSelect
    options={options}
    value={val}
    onChange={(e) => setVal(...)}
  />
</FormItem>`;

export default function FormMultiSelect() {
  const [val, setVal] = createSignal<string[]>([]);
  const [val2, setVal2] = createSignal<string[]>(["a", "b"]);

  const handleChange = (e: Event) => {
    const t = e.target as HTMLSelectElement & { value?: string[] };
    const v = Array.isArray(t.value)
      ? t.value
      : Array.from((t as HTMLSelectElement).selectedOptions || []).map((o) =>
        o.value
      );
    setVal(v);
  };

  const handleChange2 = (e: Event) => {
    const t = e.target as HTMLSelectElement & { value?: string[] };
    const v = Array.isArray(t.value)
      ? t.value
      : Array.from((t as HTMLSelectElement).selectedOptions || []).map((o) =>
        o.value
      );
    setVal2(v);
  };

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>MultiSelect 多选下拉</Title>
        <Paragraph class="mt-2">
          多选下拉：options、value、onChange、size、disabled、name、id；选项可设
          disabled；上方有全选、清空。Tailwind v4 + light/dark。
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
            <Title level={3}>全选 / 清空</Title>
            <FormItem label="多选（上方有全选、清空）">
              <MultiSelect
                options={options}
                value={val}
                onChange={handleChange}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<MultiSelect
  options={options}
  value={val}
  onChange={handleChange}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>有默认选中 + 选项含 disabled</Title>
            <FormItem label="选项 C 为 disabled">
              <MultiSelect
                options={options}
                value={val2}
                onChange={handleChange2}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`options: [{ value: "c", label: "选项 C", disabled: true }];
value={["a","b"]}`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>disabled</Title>
            <FormItem label="禁用">
              <MultiSelect options={options} value={["a"]} disabled />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<MultiSelect options={options} value={["a"]} disabled />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>size</Title>
            <FormItem label="sm">
              <MultiSelect options={options} value={[]} size="sm" />
            </FormItem>
            <FormItem label="lg">
              <MultiSelect options={options} value={[]} size="lg" />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<MultiSelect size="sm" /> / <MultiSelect size="lg" />`}
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
              {MULTISELECT_API.map((row) => (
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
