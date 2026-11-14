/**
 * RadioGroup 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/radio-group
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { RadioGroup } from "@dreamer/ui-view/form/radio-group";

import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const RADIO_GROUP_API: ApiRow[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"md"',
    description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  },

  {
    name: "name",
    type: "string",
    default: "-",
    description: "原生 name（必填，用于分组）",
  },
  {
    name: "options",
    type: "Array<{value, label, disabled?}>",
    default: "-",
    description: "选项列表",
  },
  {
    name: "value",
    type: "string | (() => string) | Signal<string>",
    default: "-",
    description:
      "当前选中项 value。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
  },
  {
    name: "onChange",
    type: "(value: string) => void",
    default: "-",
    description: "可选。`value` 为 Signal 时组件已回写；需副作用时再传",
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
  { value: "r1", label: "单选 1" },
  { value: "r2", label: "单选 2" },
  { value: "r3", label: "单选 3", disabled: true },
];

const importCode = `import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { RadioGroup } from "@dreamer/ui-view/form/radio-group";

const options = [{ value: "a", label: "选项 A" }, { value: "b", label: "选项 B" }];
const val = createSignal("a");
<FormItem label="单选组">
  <RadioGroup
    name="field"
    options={options}
    value={val}
  />
</FormItem>`;

/** createForm 演示字段（模块级） */
type RadioGroupDemoValues = { level: string };

/** RadioGroup + bindValue 联用演示 store（name 由 bind 注入） */
const radioGroupDemoForm = createForm<RadioGroupDemoValues>({
  initialValues: { level: "" },
  fields: {
    level: { rules: [formRules.required("请选择级别")] },
  },
});

/** 与 createForm 示例的 CodeBlock 源码 */
const exampleCreateForm =
  `import { createForm, formRules } from "@dreamer/ui-view/form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { RadioGroup } from "@dreamer/ui-view/form/radio-group";
import { Button } from "@dreamer/ui-view/basic";
import { message } from "@dreamer/ui-view/feedback";

const form = createForm({
  initialValues: { level: "" },
  fields: { level: { rules: [formRules.required("请选择级别")] } },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="level" label="级别">
    <RadioGroup
      {...form.bindValue("level")}
      options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]}
    />
  </FormItem>
  <Button type="submit" variant="primary">提交</Button>
</Form>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "RadioGroup 单选组 · ui-view",
};

export default function FormRadioGroup() {
  const val = createSignal("r1");
  const val2 = createSignal("r2");

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>RadioGroup 单选组</Title>
        <Paragraph class="mt-2">
          单选组，name 必填；支持
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
          （name 由 bind 注入，再传 options）。Tailwind v4 + light/dark。
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
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <section class="space-y-4">
          <Title level={3}>与 createForm</Title>
          <Form
            form={radioGroupDemoForm}
            layout="vertical"
            class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
            onFinish={() => {
              message.success("已提交");
            }}
          >
            <FormItem name="level" label="级别">
              <RadioGroup
                {...radioGroupDemoForm.bindValue("level")}
                options={[
                  { value: "a", label: "A" },
                  { value: "b", label: "B" },
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
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </section>

        <Form layout="vertical" class="w-full space-y-6">
          <section class="space-y-4">
            <Title level={3}>基础</Title>
            <FormItem label="单选组">
              <RadioGroup
                name="radio-demo"
                options={options}
                value={val}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<RadioGroup
  name="radio-demo"
  options={options}
  value={val}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>有默认值 + 选项含 disabled</Title>
            <FormItem label="选项 3 为 disabled">
              <RadioGroup
                name="radio-demo2"
                options={options}
                value={val2}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<RadioGroup
  name="radio-demo2"
  options={options}
  value={val2}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>direction=horizontal（横向）</Title>
            <FormItem label="横向单选组">
              <RadioGroup
                name="radio-h"
                options={options}
                value={val2}
                direction="horizontal"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<RadioGroup
  name="radio-h"
  options={options}
  value={val2}
  direction="horizontal"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>direction=vertical（纵向）</Title>
            <FormItem label="纵向单选组">
              <RadioGroup
                name="radio-v"
                options={options}
                value={val2}
                direction="vertical"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<RadioGroup
  name="radio-v"
  options={options}
  value={val2}
  direction="vertical"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>error / disabled</Title>
            <FormItem label="错误态">
              <RadioGroup
                name="radio-err"
                options={options}
                value="r1"
                onChange={() => {}}
                error
              />
            </FormItem>
            <FormItem label="整组禁用">
              <RadioGroup
                name="radio-dis"
                options={options}
                value="r1"
                onChange={() => {}}
                disabled
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<RadioGroup
  name="radio-err"
  options={options}
  value="r1"
  onChange={() => {}}
  error
/>
<RadioGroup
  name="radio-dis"
  options={options}
  value="r1"
  onChange={() => {}}
  disabled
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>
          <section class="space-y-4">
            <Title level={3}>size（xs / sm / md / lg）</Title>
            <FormItem label="xs">
              <RadioGroup
                name="size-xs"
                size="xs"
                options={options}
                value="a"
              />
            </FormItem>
            <FormItem label="sm">
              <RadioGroup
                name="size-sm"
                size="sm"
                options={options}
                value="a"
              />
            </FormItem>
            <FormItem label="md（默认）">
              <RadioGroup
                name="size-md"
                size="md"
                options={options}
                value="a"
              />
            </FormItem>
            <FormItem label="lg">
              <RadioGroup
                name="size-lg"
                size="lg"
                options={options}
                value="a"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<RadioGroup name="size-xs" size="xs" options={options} value="a" />
<RadioGroup name="size-sm" size="sm" options={options} value="a" />
<RadioGroup name="size-md" size="md" options={options} value="a" />
<RadioGroup name="size-lg" size="lg" options={options} value="a" />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>
        </Form>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件接收以下属性，name 为必填。
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
              {RADIO_GROUP_API.map((row) => (
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
