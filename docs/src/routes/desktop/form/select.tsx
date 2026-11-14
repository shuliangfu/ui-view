/**
 * Select 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/select
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Select } from "@dreamer/ui-view/form/select";

import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_SELECT } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


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
    type: "string | (() => string) | Signal<string>",
    default: "-",
    description:
      "当前选中项的 value（空字符串表示未选）。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
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
  {
    name: "error",
    type: "boolean",
    default: "false",
    description: "错误状态（红框）",
  },
  {
    name: "hideFocusRing",
    type: "boolean",
    default: "false",
    description: "为 true 时隐藏聚焦时的蓝色激活边框（ring）；默认 false 显示",
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
  {
    name: "messages",
    type: "Partial<SelectMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const options = [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
  { value: "c", label: "选项 C", disabled: true },
];

/**
 * 文档示例受控值须模块级：View 文档页重跑时若在页面组件内 `createSignal` 会丢状态（与 FormList / InputNumber 文档一致）。
 */
const selectDocVal = createSignal("");
const selectDocVal2 = createSignal("b");

/** createForm 演示字段形状（模块级，避免文档页重跑丢失状态） */
type SelectFormValues = { city: string };

/** Select + createForm 联用演示 store */
const selectForm = createForm<SelectFormValues>({
  initialValues: { city: "" },
  fields: {
    city: { rules: [formRules.required()] },
  },
});

const importCode = `import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Select } from "@dreamer/ui-view/form/select";

const options = [{ value: "a", label: "选项 A" }, { value: "b", label: "选项 B" }];
const val = createSignal("");
<FormItem label="请选择">
  <Select
    options={options}
    value={val}
    placeholder="请选择"
  />
</FormItem>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Select 下拉选择 · ui-view",
};

export default function FormSelect() {
  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Select 下拉选择</Title>
        <Paragraph class="mt-2">
          单选下拉框，支持
          options、value、placeholder、onChange、onBlur、error、size、disabled。宽度由
          class 控制，表单中需占满一列时传 class="w-full"。与{" "}
          <Link
            href="/desktop/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Form / createForm
          </Link>{" "}
          联用：
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            {"{...form.bind(name)}"}
          </code>
          。
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
            form={selectForm}
            layout="vertical"
            class="w-full max-w-md"
            onFinish={() => {
              message.success("ok");
            }}
          >
            <FormItem name="city" label="城市" rules={[formRules.required()]}>
              <Select
                {...selectForm.bind("city")}
                options={options}
                placeholder="请选择"
                class="w-full"
              />
            </FormItem>
            <Button type="submit" variant="primary">
              校验
            </Button>
          </Form>
          <CodeBlock
            title="代码示例"
            code={`const selectForm = createForm({
  initialValues: { city: "" },
  fields: { city: { rules: [formRules.required()] } },
});

<Form
  form={selectForm}
  layout="vertical"
  class="w-full max-w-md"
  onFinish={() => { message.success("ok"); }}
>
  <FormItem name="city" label="城市" rules={[formRules.required()]}>
    <Select {...selectForm.bind("city")} options={options} placeholder="请选择" />
  </FormItem>
  <Button type="submit" variant="primary">校验</Button>
</Form>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </section>

        <Form layout="vertical" class="w-full space-y-6">
          <section class="space-y-4">
            <Title level={3}>placeholder</Title>
            <FormItem label="请选择">
              <Select
                options={options}
                value={selectDocVal}
                placeholder="请选择"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Select
  options={options}
  value={val}
  placeholder="请选择"
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
            <FormItem label="选项 C 为 disabled">
              <Select
                options={options}
                value={selectDocVal2}
                placeholder="请选择"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Select
  options={options}
  value={val2}
  onChange={...}
  placeholder="请选择"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>disabled</Title>
            <FormItem label="禁用">
              <Select options={options} value="a" disabled />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Select
  options={options}
  value="a"
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
            <Title level={3}>name / id</Title>
            <FormItem label="表单字段" id="select-name">
              <Select
                id="select-name"
                name="city"
                options={options}
                value={selectDocVal}
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
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>size（xs / sm / md / lg）</Title>
            <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
              与 <code class="text-xs">Input</code> 相同四种{" "}
              <code class="text-xs">SizeVariant</code>。
            </Paragraph>
            <FormItem label="xs">
              <Select options={options} value="" size="xs" placeholder="xs" />
            </FormItem>
            <FormItem label="sm">
              <Select options={options} value="" size="sm" placeholder="sm" />
            </FormItem>
            <FormItem label="md（默认）">
              <Select options={options} value="" size="md" placeholder="md" />
            </FormItem>
            <FormItem label="lg">
              <Select options={options} value="" size="lg" placeholder="lg" />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Select options={options} value="" size="xs" placeholder="xs" />
<Select options={options} value="" size="sm" placeholder="sm" />
<Select options={options} value="" size="md" placeholder="md" />
<Select options={options} value="" size="lg" placeholder="lg" />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>
        </Form>
      </section>

      <DocsMessagesSection
        interfaceName="SelectMessages"
        defaultExportName="defaultSelectMessages"
        rows={MESSAGES_SELECT}
      />

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
