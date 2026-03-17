/**
 * Select 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/select
 */

import {
  CodeBlock,
  Form,
  FormItem,
  Paragraph,
  Select,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const SELECT_API: ApiRow[] = [
  {
    name: "options",
    type: "SelectOption[]",
    default: "-",
    description: "选项列表 { value, label, disabled? }",
  },
  {
    name: "value",
    type: "string | (() => string)",
    default: "-",
    description: "当前值；可为 getter",
  },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "占位选项文案（value 为空时显示）",
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
    description: "选项变更回调",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
];

const options = [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
  { value: "c", label: "选项 C", disabled: true },
];

const importCode = `import { Select, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const options = [{ value: "a", label: "选项 A" }, { value: "b", label: "选项 B" }];
const [val, setVal] = createSignal("");
<FormItem label="请选择">
  <Select
    options={options}
    value={val}
    onChange={(e) => setVal((e.target as HTMLSelectElement).value)}
    placeholder="请选择"
  />
</FormItem>`;

export default function FormSelect() {
  const [val, setVal] = createSignal("");
  const [val2, setVal2] = createSignal("b");

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Select 下拉选择</Title>
        <Paragraph class="mt-2">
          单选下拉框，支持
          options、value、placeholder、onChange、size、disabled。Tailwind v4 +
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
            <Title level={3}>placeholder</Title>
            <FormItem label="请选择">
              <Select
                options={options}
                value={val}
                onChange={(e) => setVal((e.target as HTMLSelectElement).value)}
                placeholder="请选择"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Select
  options={options}
  value={val}
  onChange={(e) => setVal((e.target as HTMLSelectElement).value)}
  placeholder="请选择"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>有默认值 + 选项含 disabled</Title>
            <FormItem label="选项 C 为 disabled">
              <Select
                options={options}
                value={val2}
                onChange={(e) => setVal2((e.target as HTMLSelectElement).value)}
                placeholder="请选择"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Select options={options} value={val2} onChange={...} placeholder="请选择" />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>disabled</Title>
            <FormItem label="禁用">
              <Select options={options} value="a" disabled />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Select options={options} value="a" disabled />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>name / id</Title>
            <FormItem label="表单字段" id="select-name">
              <Select
                id="select-name"
                name="city"
                options={options}
                value={val}
                onChange={(e) => setVal((e.target as HTMLSelectElement).value)}
                placeholder="请选择城市"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Select
  name="city"
  id="select-name"
  options={options}
  value={val}
  onChange={...}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>size</Title>
            <FormItem label="sm">
              <Select options={options} value="" size="sm" placeholder="sm" />
            </FormItem>
            <FormItem label="md">
              <Select options={options} value="" size="md" placeholder="md" />
            </FormItem>
            <FormItem label="lg">
              <Select options={options} value="" size="lg" placeholder="lg" />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Select options={options} size="sm" placeholder="sm" />`}
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
              {SELECT_API.map((row) => (
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
