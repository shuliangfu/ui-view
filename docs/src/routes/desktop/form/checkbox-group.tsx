/**
 * CheckboxGroup 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/checkbox-group
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import { CheckboxGroup } from "@dreamer/ui-view/form/checkbox-group";
import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { formRules } from "@dreamer/ui-view/form/form-rules";

import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const CHECKBOX_GROUP_API: ApiRow[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"md"',
    description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  },

  {
    name: "options",
    type: "Array<{value, label, disabled?}>",
    default: "-",
    description: "选项列表",
  },
  {
    name: "value",
    type: "string[] | (() => string[]) | Signal<string[]>",
    default: "-",
    description:
      "当前选中项 value 数组。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
  },
  {
    name: "onChange",
    type: "(value: string[]) => void",
    default: "-",
    description: "可选。`value` 为 Signal 时组件已回写；需副作用时再传",
  },
  {
    name: "name",
    type: "string",
    default: "-",
    description: "原生 name（用于表单）",
  },
  {
    name: "direction",
    type: "vertical | horizontal",
    default: "horizontal",
    description: "布局方向",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "整组禁用",
  },
  { name: "error", type: "boolean", default: "false", description: "错误状态" },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const options = [
  { value: "x", label: "选项 X" },
  { value: "y", label: "选项 Y" },
  { value: "z", label: "选项 Z", disabled: true },
];

const importCode =
  `import { CheckboxGroup } from "@dreamer/ui-view/form/checkbox-group";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";

const options = [{ value: "a", label: "选项 A" }, { value: "b", label: "选项 B" }];
const val = createSignal<string[]>([]);
<FormItem label="多选组">
  <CheckboxGroup
    options={options}
    value={val}
  />
</FormItem>`;

/** createForm 演示字段（模块级） */
type CheckboxGroupDemoValues = { hobbies: string[] };

/** CheckboxGroup + bindValue 联用演示 store */
const checkboxGroupDemoForm = createForm<CheckboxGroupDemoValues>({
  initialValues: { hobbies: [] },
  fields: {
    hobbies: {
      rules: [
        formRules.custom((v) =>
          Array.isArray(v) && v.length > 0 ? undefined : "请至少选一项"
        ),
      ],
    },
  },
});

/** 与 createForm 示例的 CodeBlock 源码 */
const exampleCreateForm =
  `import { createForm, formRules } from "@dreamer/ui-view/form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { CheckboxGroup } from "@dreamer/ui-view/form/checkbox-group";
import { Button } from "@dreamer/ui-view/basic";
import { message } from "@dreamer/ui-view/feedback";

const form = createForm({
  initialValues: { hobbies: [] as string[] },
  fields: {
    hobbies: {
      rules: [formRules.custom((v) =>
        Array.isArray(v) && v.length > 0 ? undefined : "请至少选一项"
      )],
    },
  },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="hobbies" label="兴趣">
    <CheckboxGroup
      {...form.bindValue("hobbies")}
      options={[{ value: "x", label: "X" }, { value: "y", label: "Y" }]}
    />
  </FormItem>
  <Button type="submit" variant="primary">提交</Button>
</Form>`;

export default function FormCheckboxGroup() {
  const val = createSignal<string[]>([]);
  const val2 = createSignal<string[]>(["x", "y"]);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>CheckboxGroup 多选组</Title>
        <Paragraph class="mt-2">
          多选组，支持
          options、value、onChange、direction（vertical/horizontal）、disabled、error。与
          {" "}
          <Link
            href="/desktop/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Form / createForm
          </Link>{" "}
          联用时展开{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            {"{...form.bindValue(name)}"}
          </code>
          （值为 string[]）。Tailwind v4 + light/dark。
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

        <section class="space-y-4">
          <Title level={3}>与 createForm</Title>
          <Form
            form={checkboxGroupDemoForm}
            layout="vertical"
            class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
            onFinish={() => {
              message.success("已提交");
            }}
          >
            <FormItem name="hobbies" label="兴趣">
              <CheckboxGroup
                {...checkboxGroupDemoForm.bindValue("hobbies")}
                options={[
                  { value: "x", label: "X" },
                  { value: "y", label: "Y" },
                ]}
              />
            </FormItem>
            <Button type="submit" variant="primary">
              提交
            </Button>
          </Form>
          <CodeBlock
            title="代码示例"
            code={exampleCreateForm}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </section>

        <Form layout="vertical" class="w-full space-y-6">
          <section class="space-y-4">
            <Title level={3}>基础</Title>
            <FormItem label="多选组">
              <CheckboxGroup
                options={options}
                value={val}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<CheckboxGroup
  options={options}
  value={val}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>有默认值 + 选项含 disabled</Title>
            <FormItem label="选项 Z 为 disabled">
              <CheckboxGroup
                options={options}
                value={val2}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<CheckboxGroup
  options={options}
  value={val2}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>direction=horizontal（横向）</Title>
            <FormItem label="横向多选组">
              <CheckboxGroup
                options={options}
                value={val2}
                direction="horizontal"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<CheckboxGroup
  options={options}
  value={val2}
  direction="horizontal"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>
              direction=vertical + 紧排（纵向 + class 缩小间距）
            </Title>
            <FormItem label="纵向紧排多选组">
              <CheckboxGroup
                options={options}
                value={val2}
                direction="vertical"
                class="gap-1"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<CheckboxGroup
  options={options}
  value={val2}
  direction="vertical"
  class="gap-1"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>error / disabled</Title>
            <FormItem label="错误态">
              <CheckboxGroup
                options={options}
                value={[]}
                onChange={() => {}}
                error
              />
            </FormItem>
            <FormItem label="整组禁用">
              <CheckboxGroup
                options={options}
                value={["x"]}
                onChange={() => {}}
                disabled
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<CheckboxGroup
  options={options}
  value={[]}
  onChange={() => {}}
  error
/>
<CheckboxGroup
  options={options}
  value={["x"]}
  onChange={() => {}}
  disabled
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>
          <section class="space-y-4">
            <Title level={3}>size（xs / sm / md / lg）</Title>
            <FormItem label="xs">
              <CheckboxGroup size="xs" options={options} value={["a"]} />
            </FormItem>
            <FormItem label="sm">
              <CheckboxGroup size="sm" options={options} value={["a"]} />
            </FormItem>
            <FormItem label="md（默认）">
              <CheckboxGroup size="md" options={options} value={["a"]} />
            </FormItem>
            <FormItem label="lg">
              <CheckboxGroup size="lg" options={options} value={["a"]} />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<CheckboxGroup size="xs" options={options} value={["a"]} />
<CheckboxGroup size="sm" options={options} value={["a"]} />
<CheckboxGroup size="md" options={options} value={["a"]} />
<CheckboxGroup size="lg" options={options} value={["a"]} />`}
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
              {CHECKBOX_GROUP_API.map((row) => (
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
