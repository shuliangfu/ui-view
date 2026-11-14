/**
 * MarkdownEditor 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/markdown-editor
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { MarkdownEditor } from "@dreamer/ui-view/form/markdown-editor";

import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_MARKDOWN_EDITOR } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const MARKDOWN_EDITOR_API: ApiRow[] = [
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
      "Markdown 源码。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
  },
  {
    name: "onMarkdownChange",
    type: "(markdown: string) => void",
    default: "-",
    description: "输入后全文回调（在 onInput 之后），便于受控",
  },
  {
    name: "preview",
    type: '"off" | "split" | "tabs"',
    default: '"split"',
    description:
      "关闭预览；split 宽屏双栏、窄屏富文本同款顶栏切换源码/预览；tabs 始终顶栏切换",
  },
  {
    name: "parseOptions",
    type: "ParseOptions",
    default: "gfm+breaks",
    description: "透传 @dreamer/markdown 的 parse 选项",
  },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "占位文案",
  },
  {
    name: "rows",
    type: "number",
    default: "12",
    description: "textarea 行数",
  },
  {
    name: "uploadAction",
    type: "string",
    default: "-",
    description:
      "插图上传路由前缀；推荐 /ui-view-upload（DEFAULT_UI_VIEW_UPLOAD_BASE_PATH）；勿写死 /upload；有值时工具栏显示插图并走路径协议",
  },
  {
    name: "onUploadImage",
    type: "(file: File) => string | Promise<string>",
    default: "-",
    description: "自定义插图上传；优先于 uploadAction",
  },
  {
    name: "onPasteImage",
    type: "(blob: Blob) => string | Promise<string>",
    default: "-",
    description: "粘贴图片上传；优先于 uploadAction",
  },
  {
    name: "allowFullscreen",
    type: "boolean",
    default: "false",
    description:
      "为 true 时显示全屏按钮；默认 false。根节点 toggles md-editor-fullscreen",
  },
  {
    name: "maxLength",
    type: "number",
    default: "-",
    description: "最大字数 + 底部剩余提示",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "禁用",
  },
  {
    name: "readOnly",
    type: "boolean",
    default: "false",
    description: "只读（仍可看预览）",
  },
  {
    name: "error",
    type: "boolean",
    default: "false",
    description: "错误态红框",
  },
  {
    name: "hideFocusRing",
    type: "boolean",
    default: "false",
    description: "隐藏聚焦 ring",
  },
  {
    name: "ariaLabel",
    type: "string",
    default: '"Markdown 源码"',
    description: "无障碍名称",
  },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "aria-required",
  },
  {
    name: "editorMinHeightClass",
    type: "string",
    default: '"min-h-[240px]"',
    description: "编辑区最小高度 Tailwind 类",
  },
  {
    name: "previewMinHeightClass",
    type: "string",
    default: "同编辑区",
    description: "预览区最小高度类",
  },
  {
    name: "onInput / onChange / onBlur / onFocus / onKeyDown",
    type: "Event 回调",
    default: "-",
    description: "原生 textarea 事件",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "外层容器 class",
  },
  {
    name: "messages",
    type: "Partial<MarkdownEditorMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const DEMO_MD = `# 标题

**粗体**、*斜体*、\`行内代码\`。

- 列表项
- [链接](https://example.com)

\`\`\`ts
/** 预览区使用 Prism 对 \`language-ts\` 等着色（与 CodeBlock 一致） */
type User = { id: string; name: string; active: boolean };

async function fetchUser(id: string): Promise<User | null> {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) return null;
  return (await res.json()) as User;
}

export async function main(): Promise<void> {
  const u = await fetchUser("42");
  if (u?.active) {
    console.log(\`Hello, \${u.name}\`);
  }
}
\`\`\`
`;

const importCode = `import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { MarkdownEditor } from "@dreamer/ui-view/form/markdown-editor";

const md = createSignal("# 你好\\n\\n正文");
<FormItem label="Markdown">
  <MarkdownEditor
    class="w-full"
    value={md}
    onMarkdownChange={(s) => { md.value = s; }}
    preview="split"
  />
</FormItem>`;

/** createForm 演示字段（模块级） */
type MarkdownDemoValues = { md: string };

/** MarkdownEditor + bind 联用演示 store */
const markdownDemoForm = createForm<MarkdownDemoValues>({
  initialValues: { md: "" },
  fields: { md: { rules: [formRules.required("请填写 Markdown")] } },
});

/** 与 createForm 示例的 CodeBlock 源码 */
const exampleCreateForm =
  `import { createForm, formRules } from "@dreamer/ui-view/form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { MarkdownEditor } from "@dreamer/ui-view/form/markdown-editor";
import { Button } from "@dreamer/ui-view/basic";
import { message } from "@dreamer/ui-view/feedback";

const form = createForm({
  initialValues: { md: "" },
  fields: { md: { rules: [formRules.required("请填写 Markdown")] } },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="md" label="Markdown">
    <MarkdownEditor {...form.bind("md")} rows={8} preview="tabs" />
  </FormItem>
  <Button type="submit" variant="primary">提交</Button>
</Form>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "MarkdownEditor · ui-view",
};

export default function FormMarkdownEditor() {
  const splitVal = createSignal(DEMO_MD);
  const tabsVal = createSignal("# 标签模式\n\n切换「预览」查看渲染。");
  const offVal = createSignal("仅编辑，无预览。");
  const maxVal = createSignal("字数限制示例：");

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>MarkdownEditor</Title>
        <Paragraph class="mt-2">
          基于{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            @dreamer/markdown
          </code>{" "}
          的{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">parse</code>
          {" "}
          实时预览；与 RichTextEditor 独立。预览区使用{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            innerHTML
          </code>
          ，围栏代码块会在客户端用 Prism 着色（与 CodeBlock
          相同语言包）。不可信内容请业务侧消毒。表单内需占满宽度时传{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            class="w-full"
          </code>。与{" "}
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
            form={markdownDemoForm}
            layout="vertical"
            class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
            onFinish={() => {
              message.success("已提交");
            }}
          >
            <FormItem name="md" label="Markdown">
              <MarkdownEditor
                {...markdownDemoForm.bind("md")}
                rows={8}
                preview="tabs"
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
            <Title level={3}>preview：split（默认）</Title>
            <FormItem label="分栏预览">
              <MarkdownEditor
                class="w-full"
                id="docs-md-split"
                value={splitVal}
                onMarkdownChange={(s) => {
                  splitVal.value = s;
                }}
                preview="split"
                placeholder="输入 Markdown…"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<MarkdownEditor
  class="w-full"
  value={md}
  onMarkdownChange={(s) => { md.value = s; }}
  preview="split"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>preview：tabs</Title>
            <FormItem label="标签切换（小屏常用）">
              <MarkdownEditor
                class="w-full"
                value={tabsVal}
                onMarkdownChange={(s) => {
                  tabsVal.value = s;
                }}
                preview="tabs"
                rows={8}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<MarkdownEditor preview="tabs" rows={8} />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>preview：off</Title>
            <FormItem label="仅源码">
              <MarkdownEditor
                class="w-full"
                value={offVal}
                onMarkdownChange={(s) => {
                  offVal.value = s;
                }}
                preview="off"
                rows={6}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<MarkdownEditor preview="off" />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
              maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>maxLength</Title>
            <FormItem label="最大 200 字">
              <MarkdownEditor
                class="w-full"
                value={maxVal}
                onMarkdownChange={(s) => {
                  maxVal.value = s;
                }}
                preview="split"
                maxLength={200}
                rows={5}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<MarkdownEditor maxLength={200} preview="split" />`}
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
              <MarkdownEditor
                size="xs"
                preview="off"
                editorMinHeightClass="min-h-[96px]"
                placeholder="xs"
              />
            </FormItem>
            <FormItem label="sm">
              <MarkdownEditor
                size="sm"
                preview="off"
                editorMinHeightClass="min-h-[96px]"
                placeholder="sm"
              />
            </FormItem>
            <FormItem label="md（默认）">
              <MarkdownEditor
                size="md"
                preview="off"
                editorMinHeightClass="min-h-[96px]"
                placeholder="md"
              />
            </FormItem>
            <FormItem label="lg">
              <MarkdownEditor
                size="lg"
                preview="off"
                editorMinHeightClass="min-h-[96px]"
                placeholder="lg"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<MarkdownEditor size="xs" preview="off" editorMinHeightClass="min-h-[96px]" />
<MarkdownEditor size="sm" preview="off" editorMinHeightClass="min-h-[96px]" />
<MarkdownEditor size="md" preview="off" editorMinHeightClass="min-h-[96px]" />
<MarkdownEditor size="lg" preview="off" editorMinHeightClass="min-h-[96px]" />`}
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
        interfaceName="MarkdownEditorMessages"
        defaultExportName="defaultMarkdownEditorMessages"
        rows={MESSAGES_MARKDOWN_EDITOR}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件属性均为可选；解析选项类型见{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            @dreamer/markdown/types
          </code>{" "}
          的{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            ParseOptions
          </code>。
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
              {MARKDOWN_EDITOR_API.map((row) => (
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
