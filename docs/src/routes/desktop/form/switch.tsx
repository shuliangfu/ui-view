/**
 * Switch 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/switch
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Switch } from "@dreamer/ui-view/form/switch";

import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const SWITCH_API: ApiRow[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"md"',
    description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  },

  {
    name: "checked",
    type: "boolean | (() => boolean) | Signal<boolean>",
    default: "-",
    description:
      "是否开启。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  {
    name: "hideFocusRing",
    type: "boolean",
    default: "false",
    description:
      "为 true 时隐藏开关轨道在获焦时的 peer 蓝色 ring；默认 false 显示",
  },
  {
    name: "error",
    type: "boolean",
    default: "false",
    description: "错误状态（红框）",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "可选。`checked` 为 Signal 时组件已回写；需副作用时再传",
  },
  {
    name: "onBlur",
    type: "(e: Event) => void",
    default: "-",
    description: "失焦回调（透传至内部 input）",
  },
  {
    name: "onFocus",
    type: "(e: Event) => void",
    default: "-",
    description: "聚焦回调（透传至内部 input）",
  },
  {
    name: "onKeyDown",
    type: "(e: Event) => void",
    default: "-",
    description: "键盘按下（透传至内部 input）",
  },
  {
    name: "onKeyUp",
    type: "(e: Event) => void",
    default: "-",
    description: "键盘抬起（透传至内部 input）",
  },
  {
    name: "onClick",
    type: "(e: Event) => void",
    default: "-",
    description: "点击（透传至内部 input）",
  },
  {
    name: "onPaste",
    type: "(e: Event) => void",
    default: "-",
    description: "粘贴（透传至内部 input）",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  {
    name: "checkedChildren",
    type: "unknown",
    default: "-",
    description: "开启时文案或节点",
  },
  {
    name: "unCheckedChildren",
    type: "unknown",
    default: "-",
    description: "关闭时文案或节点",
  },
];

const importCode = `import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Switch } from "@dreamer/ui-view/form/switch";

const checked = createSignal(false);
<FormItem label="开关">
  <Switch checked={checked} />
</FormItem>`;

/** createForm 演示字段（模块级） */
type SwitchDemoValues = { notify: boolean };

/** Switch + bindChecked 联用演示 store */
const switchDemoForm = createForm<SwitchDemoValues>({
  initialValues: { notify: false },
  fields: {
    notify: {
      rules: [
        formRules.custom((v) => (v === true ? undefined : "请开启通知")),
      ],
    },
  },
});

/** 与 createForm 示例的 CodeBlock 源码 */
const exampleCreateForm =
  `import { createForm, formRules } from "@dreamer/ui-view/form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Switch } from "@dreamer/ui-view/form/switch";
import { Button } from "@dreamer/ui-view/basic";
import { message } from "@dreamer/ui-view/feedback";

const form = createForm({
  initialValues: { notify: false },
  fields: {
    notify: {
      rules: [formRules.custom((v) => (v === true ? undefined : "请开启通知"))],
    },
  },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="notify" label="通知">
    <Switch {...form.bindChecked("notify")} />
  </FormItem>
  <Button type="submit" variant="primary">提交</Button>
</Form>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Switch 开关 · ui-view",
};

export default function FormSwitch() {
  const checked = createSignal(false);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Switch 开关</Title>
        <Paragraph class="mt-2">
          开关组件，支持
          checked、onChange、disabled、error、checkedChildren、unCheckedChildren。
          与{" "}
          <Link
            href="/desktop/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Form / createForm
          </Link>{" "}
          联用时展开{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            {"{...form.bindChecked(name)}"}
          </code>
          。动态选中态请使用{" "}
          <code class="text-sm">checked=&#123;createSignal(...)&#125;</code>
          {" "}
          返回值，勿写{" "}
          <code class="text-sm">checked=&#123;sig.value&#125;</code>{" "}
          快照。Tailwind v4 + light/dark。
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
            form={switchDemoForm}
            layout="vertical"
            class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
            onFinish={() => {
              message.success("已提交");
            }}
          >
            <FormItem name="notify" label="通知">
              <Switch {...switchDemoForm.bindChecked("notify")} />
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
            <FormItem label="开关">
              <Switch checked={checked} />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch checked={checked} />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>checkedChildren / unCheckedChildren</Title>
            <FormItem label="开/关文案">
              <Switch
                checked={checked}
                checkedChildren="开"
                unCheckedChildren="关"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch
  checked={checked}
  checkedChildren="开"
  unCheckedChildren="关"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>name / id</Title>
            <FormItem label="表单字段">
              <Switch name="notify" id="switch-notify" checked={checked} />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch name="notify" id="switch-notify" checked={checked} />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>error / disabled</Title>
            <FormItem label="错误态">
              <Switch checked={false} error />
            </FormItem>
            <FormItem label="禁用未选">
              <Switch checked={false} disabled />
            </FormItem>
            <FormItem label="禁用已选">
              <Switch checked disabled />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch checked={false} error />
<Switch checked={false} disabled />
<Switch checked disabled />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>
          <section class="space-y-4">
            <Title level={3}>size（xs / sm / md / lg）</Title>
            <FormItem label="xs">
              <Switch size="xs" checked />
            </FormItem>
            <FormItem label="sm">
              <Switch size="sm" checked />
            </FormItem>
            <FormItem label="md（默认）">
              <Switch size="md" checked />
            </FormItem>
            <FormItem label="lg">
              <Switch size="lg" checked />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch size="xs" checked />
<Switch size="sm" checked />
<Switch size="md" checked />
<Switch size="lg" checked />`}
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
              {SWITCH_API.map((row) => (
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
