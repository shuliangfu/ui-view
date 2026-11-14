/**
 * Textarea 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/textarea
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Textarea } from "@dreamer/ui-view/form/textarea";

import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_TEXTAREA } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const TEXTAREA_API: ApiRow[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"md"',
    description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  },

  {
    name: "value",
    type: "string | (() => string) | Signal<string>",
    default: "-",
    description:
      "受控文本。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
  },
  { name: "rows", type: "number", default: "-", description: "行数（高度）" },
  {
    name: "maxLength",
    type: "number",
    default: "-",
    description: "最大字数（展示已用/总数）",
  },
  {
    name: "readOnly",
    type: "boolean",
    default: "false",
    description: "是否只读",
  },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "是否必填",
  },
  {
    name: "error",
    type: "boolean",
    default: "false",
    description: "错误状态（红框）",
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
    description: "为 true 时隐藏聚焦时的蓝色激活边框（ring）；默认 false 显示",
  },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "占位文案",
  },
  {
    name: "label",
    type: "string",
    default: "-",
    description:
      "描边内嵌标签，效果见 Input「描边内嵌标签」；空且未聚焦在框内，聚焦或有值后上到边框左上缺口",
  },
  {
    name: "floatingLabel",
    type: "boolean",
    default: "false",
    description: "为 true 且未设 label 时，用 placeholder 作为描边内嵌标签",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  {
    name: "onInput",
    type: "(e: Event) => void",
    default: "-",
    description: "输入回调",
  },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更回调",
  },
  {
    name: "onBlur",
    type: "(e: Event) => void",
    default: "-",
    description: "失焦回调（透传至原生 textarea）",
  },
  {
    name: "onFocus",
    type: "(e: Event) => void",
    default: "-",
    description: "聚焦回调（透传至原生 textarea）",
  },
  {
    name: "onKeyDown",
    type: "(e: Event) => void",
    default: "-",
    description: "键盘按下（透传至原生 textarea）",
  },
  {
    name: "onKeyUp",
    type: "(e: Event) => void",
    default: "-",
    description: "键盘抬起（透传至原生 textarea）",
  },
  {
    name: "onClick",
    type: "(e: Event) => void",
    default: "-",
    description: "点击（透传至原生 textarea）",
  },
  {
    name: "onPaste",
    type: "(e: Event) => void",
    default: "-",
    description: "粘贴（透传至原生 textarea）",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  {
    name: "messages",
    type: "Partial<TextareaMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

/** createForm 演示字段形状（模块级，避免文档页重跑丢失状态） */
type TextareaFormValues = { content: string };

/** Textarea + createForm 联用演示 store */
const textareaForm = createForm<TextareaFormValues>({
  initialValues: { content: "" },
  fields: {
    content: { rules: [formRules.required()] },
  },
});

const importCode = `import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Textarea } from "@dreamer/ui-view/form/textarea";

const val = createSignal("");
<FormItem label="多行">
  <Textarea
    value={val}
    placeholder="多行输入"
    rows={3}
  />
</FormItem>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Textarea 多行输入 · ui-view",
};

export default function FormTextarea() {
  const valBase = createSignal("");
  const valMaxLength = createSignal("");
  const valError = createSignal("");
  const readOnlyVal = createSignal("只读多行内容");

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Textarea 多行输入</Title>
        <Paragraph class="mt-2">
          多行输入框，支持
          value、onInput、rows、maxLength、readOnly、required、error、disabled。宽度由
          class 控制，表单中需占满一列时传 class="w-full"。与{" "}
          <Link
            href="/desktop/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Form / createForm
          </Link>{" "}
          联用时展开{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            {"{...form.bind(name)}"}
          </code>
          。Tailwind v4 + light/dark。
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
            form={textareaForm}
            layout="vertical"
            class="w-full max-w-md"
            onFinish={() => {
              message.success("ok");
            }}
          >
            <FormItem
              name="content"
              label="内容"
              rules={[formRules.required()]}
            >
              <Textarea
                {...textareaForm.bind("content")}
                placeholder="必填多行"
                rows={3}
                class="w-full"
              />
            </FormItem>
            <Button type="submit" variant="primary">
              校验
            </Button>
          </Form>
          <CodeBlock
            title="代码示例"
            code={`const textareaForm = createForm({
  initialValues: { content: "" },
  fields: { content: { rules: [formRules.required()] } },
});

<Form
  form={textareaForm}
  layout="vertical"
  class="w-full max-w-md"
  onFinish={() => { message.success("ok"); }}
>
  <FormItem name="content" label="内容" rules={[formRules.required()]}>
    <Textarea {...textareaForm.bind("content")} placeholder="必填多行" rows={3} />
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
            <Title level={3}>基础</Title>
            <FormItem label="多行">
              <Textarea
                value={valBase}
                placeholder="多行输入"
                rows={3}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Textarea
  value={valBase}
  placeholder="多行输入"
  rows={3}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={2}>maxLength（展示已用/总数）</Title>
            <FormItem label="最多 200 字">
              <Textarea
                value={valMaxLength}
                placeholder="输入会显示字数"
                maxLength={200}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Textarea
  value={valMaxLength}
  placeholder="输入会显示字数"
  maxLength={200}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>required / error</Title>
            <FormItem label="必填" required error="内容不能为空">
              <Textarea
                value={valError}
                placeholder="错误态红框"
                error
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<FormItem
  label="必填"
  required
  error="内容不能为空"
>
  <Textarea
    value={valError}
    placeholder="错误态红框"
    error
  />
</FormItem>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>readOnly</Title>
            <FormItem label="只读">
              <Textarea value={readOnlyVal} readOnly rows={2} />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Textarea
  value={readOnlyVal}
  readOnly
  rows={2}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>disabled / rows</Title>
            <FormItem label="禁用，rows=5">
              <Textarea placeholder="禁用" disabled value="" rows={5} />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Textarea
  placeholder="禁用"
  disabled
  value=""
  rows={5}
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
              <Textarea size="xs" placeholder="xs" value="" rows={2} />
            </FormItem>
            <FormItem label="sm">
              <Textarea size="sm" placeholder="sm" value="" rows={2} />
            </FormItem>
            <FormItem label="md（默认）">
              <Textarea size="md" placeholder="md" value="" rows={2} />
            </FormItem>
            <FormItem label="lg">
              <Textarea size="lg" placeholder="lg" value="" rows={2} />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Textarea size="xs" placeholder="xs" value="" rows={2} />
<Textarea size="sm" placeholder="sm" value="" rows={2} />
<Textarea size="md" placeholder="md" value="" rows={2} />
<Textarea size="lg" placeholder="lg" value="" rows={2} />`}
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
        interfaceName="TextareaMessages"
        defaultExportName="defaultTextareaMessages"
        rows={MESSAGES_TEXTAREA}
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
              {TEXTAREA_API.map((row) => (
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
