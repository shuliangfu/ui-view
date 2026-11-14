/**
 * Password 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/password
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Password } from "@dreamer/ui-view/form/password";
import { IconLock } from "@dreamer/ui-view/icons/Lock.tsx";

import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_PASSWORD } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const PASSWORD_API: ApiRow[] = [
  {
    name: "value",
    type: "string | (() => string) | Signal<string>",
    default: "-",
    description:
      "受控密码文本。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
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
    name: "prefix",
    type: "unknown",
    default: "-",
    description:
      "前缀节点，位于输入框左侧、与框体同一外边框；可与显隐按钮同时使用",
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
  {
    name: "error",
    type: "boolean",
    default: "false",
    description: "错误状态（红框）",
  },
  {
    name: "showStrength",
    type: "boolean",
    default: "false",
    description: "是否显示强度提示（弱/中/强），组件内根据 value 动态计算",
  },
  {
    name: "showPassword",
    type: "boolean",
    default: "-",
    description: "是否显示明文（显隐由父组件控制）",
  },
  {
    name: "onToggleShow",
    type: "() => void",
    default: "-",
    description: "点击显隐按钮时回调",
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
    description: "失焦回调（透传至原生 password input）",
  },
  {
    name: "onFocus",
    type: "(e: Event) => void",
    default: "-",
    description: "聚焦回调（透传至原生 password input）",
  },
  {
    name: "onKeyDown",
    type: "(e: Event) => void",
    default: "-",
    description: "键盘按下（透传至原生 password input）",
  },
  {
    name: "onKeyUp",
    type: "(e: Event) => void",
    default: "-",
    description: "键盘抬起（透传至原生 password input）",
  },
  {
    name: "onClick",
    type: "(e: Event) => void",
    default: "-",
    description: "点击（透传至原生 password input）",
  },
  {
    name: "onPaste",
    type: "(e: Event) => void",
    default: "-",
    description: "粘贴（透传至原生 password input）",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  {
    name: "autoComplete",
    type: "boolean | string",
    default: "-",
    description:
      "`true` 时写原生 autocomplete（默认 `current-password`，`newPassword` 时 `new-password`）并合并 autofill 暗色 class；`string` 时原样写出；`false`/不传则不加",
  },
  {
    name: "newPassword",
    type: "boolean",
    default: "false",
    description:
      '与 `autoComplete={true}` 联用：注册/设新密码场景写原生 `autocomplete="new-password"`，否则为 `current-password`',
  },
  {
    name: "messages",
    type: "Partial<PasswordMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

/** createForm 演示字段形状（模块级，避免文档页重跑丢失状态） */
type PasswordFormValues = { password: string };

/** Password + createForm 联用演示 store */
const passwordForm = createForm<PasswordFormValues>({
  initialValues: { password: "" },
  fields: {
    password: { rules: [formRules.required()] },
  },
});

const importCode = `import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Password } from "@dreamer/ui-view/form/password";

const val = createSignal("");
<FormItem label="密码">
  <Password
    value={val}
    placeholder="输入密码"
    showStrength
  />
</FormItem>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Password 密码输入 · ui-view",
};

export default function FormPassword() {
  const val = createSignal("");
  const valNoStrength = createSignal("");
  const prefixVal = createSignal("");
  const prefixShow = createSignal(false);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Password 密码输入</Title>
        <Paragraph class="mt-2">
          密码输入框，支持显隐切换、showStrength 强度提示、prefix
          前缀、size、disabled、error。宽度由 class 控制，表单中需占满一列时传
          class="w-full"。Tailwind v4 + light/dark。与{" "}
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
            form={passwordForm}
            layout="vertical"
            class="w-full max-w-md"
            onFinish={() => {
              message.success("ok");
            }}
          >
            <FormItem
              name="password"
              label="密码"
              rules={[formRules.required()]}
            >
              <Password
                {...passwordForm.bind("password")}
                placeholder="必填密码"
                class="w-full"
              />
            </FormItem>
            <Button type="submit" variant="primary">
              校验
            </Button>
          </Form>
          <CodeBlock
            title="代码示例"
            code={`const passwordForm = createForm({
  initialValues: { password: "" },
  fields: { password: { rules: [formRules.required()] } },
});

<Form
  form={passwordForm}
  layout="vertical"
  class="w-full max-w-md"
  onFinish={() => { message.success("ok"); }}
>
  <FormItem name="password" label="密码" rules={[formRules.required()]}>
    <Password {...passwordForm.bind("password")} placeholder="必填密码" />
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
            <Title level={3}>带强度提示（showStrength）</Title>
            <FormItem label="密码" id="password-1">
              <Password
                id="password-1"
                value={val}
                showStrength
                placeholder="输入密码看强度"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Password
  value={val}
  showStrength
  placeholder="输入密码看强度"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={2}>无强度提示</Title>
            <FormItem label="密码">
              <Password
                value={valNoStrength}
                placeholder="仅显隐切换"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Password
  value={valNoStrength}
  placeholder="仅显隐切换"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>prefix 前缀</Title>
            <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
              与 Input 相同：prefix
              渲染在输入框左侧，和框体共用同一外边框；可与右侧显隐按钮同时使用。
            </Paragraph>
            <FormItem label="带图标前缀" id="password-prefix">
              <Password
                id="password-prefix"
                value={prefixVal}
                showPassword={prefixShow.value}
                onToggleShow={() => {
                  prefixShow.value = !prefixShow.value;
                }}
                prefix={
                  <IconLock
                    size="sm"
                    class="text-slate-500 dark:text-slate-400"
                  />
                }
                placeholder="请输入密码"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`import { IconLock } from "@dreamer/ui-view/icons/Lock.tsx";

<Password
  value={val}
  showPassword={show}
  onToggleShow={() => { show.value = !show.value; }}
  prefix={
    <IconLock size="sm" class="text-slate-500 dark:text-slate-400" />
  }
  placeholder="请输入密码"
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
              <Password placeholder="禁用" disabled value="" />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Password
  placeholder="禁用"
  disabled
  value=""
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={2}>size（xs / sm / md / lg）</Title>
            <FormItem label="xs">
              <Password size="xs" placeholder="xs" value="" />
            </FormItem>
            <FormItem label="sm">
              <Password size="sm" placeholder="sm" value="" />
            </FormItem>
            <FormItem label="md（默认）">
              <Password size="md" placeholder="md" value="" />
            </FormItem>
            <FormItem label="lg">
              <Password size="lg" placeholder="lg" value="" />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Password size="xs" placeholder="xs" value="" />
<Password size="sm" placeholder="sm" value="" />
<Password size="md" placeholder="md" value="" />
<Password size="lg" placeholder="lg" value="" />`}
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
        interfaceName="PasswordMessages"
        defaultExportName="defaultPasswordMessages"
        rows={MESSAGES_PASSWORD}
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
              {PASSWORD_API.map((row) => (
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
