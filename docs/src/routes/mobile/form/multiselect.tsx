/**
 * MultiSelect（移动版）文档页（概述、引入、示例、API）。路由: /mobile/form/multiselect
 */

import { MultiSelect } from "@dreamer/ui-view/mobile/form/multiselect";
import { Form } from "@dreamer/ui-view/mobile/form/form";
import { FormItem } from "@dreamer/ui-view/mobile/form/form-item";
import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import { createForm } from "@dreamer/ui-view/form/create-form";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_MULTI_SELECT } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


/** createForm 演示字段（onChange 为 Event → bind） */
type MultiSelectCreateFormValues = { tags: string[] };

/** 与 createForm 联用演示 store */
const multiSelectCreateForm = createForm<MultiSelectCreateFormValues>({
  initialValues: { tags: [] },
  fields: {
    tags: { rules: [formRules.required("请至少选一项")] },
  },
});

const OPTIONS = [
  { value: "x", label: "项 X" },
  { value: "y", label: "项 Y" },
  { value: "z", label: "项 Z" },
];

const MULTI_API: DocsApiTableRow[] = [
  {
    name: "appearance",
    type: `"dropdown" | "native"`,
    default: `"dropdown"（与桌面一致）`,
    description: "默认自绘浮层；`native` 为原生 multiple + 全选/清空 + 大触控",
  },
  {
    name: "options",
    type: "MultiSelectOption[]",
    default: "-",
    description: "选项列表（必填）",
  },
  {
    name: "value",
    type: "MaybeSignal<string[]>",
    default: "-",
    description: "已选 value 数组",
  },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "dropdown 模式下无选中时触发器占位",
  },
  {
    name: "size",
    type: "SizeVariant",
    default: "md",
    description: "尺寸",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "禁用",
  },
  {
    name: "hideFocusRing",
    type: "boolean",
    default: "false",
    description: "隐藏聚焦 ring",
  },
  { name: "class", type: "string", default: "-", description: "根 class" },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更回调",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  {
    name: "messages",
    type: "Partial<MultiSelectMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode =
  `import { MultiSelect } from "@dreamer/ui-view/mobile/form/multiselect";

const val = createSignal<string[]>(["x"]);
<MultiSelect class="w-full" options={...} value={val} />`;

/**
 * 与桌面表单文档一致：示例用 Signal 须模块级，避免受控写回不生效。
 */
const mobileMultiSelectBasicVal = createSignal<string[]>(["x"]);
const mobileMultiSelectControlledVal = createSignal<string[]>(["x"]);

const exampleControlled = `const value = createSignal(["a"]);
<MultiSelect value={value} options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "MultiSelect 多选（移动） · ui-view",
};

export default function MobileMultiSelectDoc() {
  return (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>MultiSelect 多选（移动）</Title>
        <Paragraph class="mt-2">
          与桌面包一致默认{" "}
          <code class="text-sm">
            appearance=&quot;dropdown&quot;
          </code>（自绘浮层多选）；需要原生多选加高触控区时传{" "}
          <code class="text-sm">appearance=&quot;native&quot;</code>
          。与{" "}
          <Link
            href="/mobile/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Form / createForm（移动）
          </Link>
          、
          <Link
            href="/desktop/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            桌面 Form 容器
          </Link>{" "}
          联用：
          <code class="text-sm">onChange</code> 为 Event，展开{" "}
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

        <div class="space-y-4">
          <Title level={3}>与 createForm</Title>
          <MobileDocDemo>
            <Form
              form={multiSelectCreateForm}
              layout="vertical"
              class="w-full"
              onFinish={() => {
                message.success("已提交");
              }}
            >
              <FormItem name="tags" label="标签">
                <MultiSelect
                  class="w-full"
                  options={OPTIONS}
                  {...multiSelectCreateForm.bind("tags")}
                  placeholder="请选择"
                />
              </FormItem>
              <Button type="submit" variant="primary" class="w-full">
                提交
              </Button>
            </Form>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={`import { createForm } from "@dreamer/ui-view/form/create-form";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Form } from "@dreamer/ui-view/mobile/form/form";
import { FormItem } from "@dreamer/ui-view/mobile/form/form-item";
import { MultiSelect } from "@dreamer/ui-view/mobile/form/multiselect";

const form = createForm({
  initialValues: { tags: [] as string[] },
  fields: { tags: { rules: [formRules.required()] } },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="tags" label="标签">
    <MultiSelect options={OPTIONS} {...form.bind("tags")} />
  </FormItem>
</Form>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>基础</Title>
          <MobileDocDemo>
            <MultiSelect
              class="w-full"
              options={OPTIONS}
              value={mobileMultiSelectBasicVal}
            />
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={importCode}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>受控 Signal</Title>
          <MobileDocDemo>
            <MultiSelect
              class="w-full"
              options={OPTIONS}
              value={mobileMultiSelectControlledVal}
            />
            {() => (
              <p class="mt-2 text-xs text-slate-500">
                当前：{mobileMultiSelectControlledVal().join(", ") || "（空）"}
              </p>
            )}
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleControlled}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-4">
          <Title level={3}>size（xs / sm / md / lg）</Title>
          <MobileDocDemo>
            <div class="flex flex-col gap-3 p-2">
              <MultiSelect
                size="xs"
                class="w-full"
                options={OPTIONS}
                value={[]}
                placeholder="xs"
              />
              <MultiSelect
                size="sm"
                class="w-full"
                options={OPTIONS}
                value={[]}
                placeholder="sm"
              />
              <MultiSelect
                size="md"
                class="w-full"
                options={OPTIONS}
                value={[]}
                placeholder="md"
              />
              <MultiSelect
                size="lg"
                class="w-full"
                options={OPTIONS}
                value={[]}
                placeholder="lg"
              />
            </div>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={`<MultiSelect size="xs" options={OPTIONS} placeholder="xs" />
<MultiSelect size="sm" options={OPTIONS} placeholder="sm" />
<MultiSelect size="md" options={OPTIONS} placeholder="md" />
<MultiSelect size="lg" options={OPTIONS} placeholder="lg" />`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>

      <section class="space-y-4">
        <DocsMessagesSection
          interfaceName="MultiSelectMessages"
          defaultExportName="defaultMultiSelectMessages"
          rows={MESSAGES_MULTI_SELECT}
        />

        <Title level={2}>API</Title>
        <DocsApiTable rows={MULTI_API} />
      </section>
    </div>
  );
}
