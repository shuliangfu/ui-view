/**
 * TreeSelect（移动版）文档页（概述、引入、示例、API）。路由: /mobile/form/tree-select
 */

import { TreeSelect } from "@dreamer/ui-view/mobile/form/tree-select";
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
import { MESSAGES_TREE_SELECT } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

/** createForm 演示字段 */
type TreeSelectCreateFormValues = { dept: string };

/** 与 createForm 联用演示 store */
const treeSelectCreateForm = createForm<TreeSelectCreateFormValues>({
  initialValues: { dept: "" },
  fields: {
    dept: { rules: [formRules.required("请选择部门")] },
  },
});

const TREE_OPTIONS = [
  {
    value: "dev",
    label: "研发",
    children: [
      { value: "fe", label: "前端" },
      { value: "be", label: "后端" },
    ],
  },
  { value: "ops", label: "运维" },
];

const TREE_API: DocsApiTableRow[] = [
  {
    name: "appearance",
    type: `"dropdown" | "native"`,
    default: `"dropdown"（与桌面一致）`,
    description: "默认缩进浮层；`native` 为单原生 select，选项文案为完整路径",
  },
  {
    name: "options",
    type: "TreeSelectOption[]",
    default: "-",
    description: "嵌套树；每项 value、label、可选 children",
  },
  {
    name: "value",
    type: "MaybeSignal<string>",
    default: "-",
    description: "选中节点 value（非路径串）",
  },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "未选占位",
  },
  { name: "size", type: "SizeVariant", default: "md", description: "尺寸" },
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
    description: "变更；与 Select 相同可取 target.value",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  {
    name: "messages",
    type: "Partial<TreeSelectMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode =
  `import { TreeSelect } from "@dreamer/ui-view/mobile/form/tree-select";

const val = createSignal("");

const options = [
  {
    value: "dev",
    label: "研发",
    children: [
      { value: "fe", label: "前端" },
      { value: "be", label: "后端" },
    ],
  },
];

<TreeSelect options={options} value={val} placeholder="请选择" class="w-full" />`;

/** 与 Select 移动文档相同：Signal 放模块级，保证受控写回与订阅正确 */
const mobileTreeSelectVal = createSignal("fe");

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "TreeSelect 树选择（移动） · ui-view",
};

export default function MobileTreeSelectDoc() {
  return (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>TreeSelect 树选择（移动）</Title>
        <Paragraph class="mt-2">
          选项为嵌套树，适合部门/类目；与桌面一致默认{" "}
          <code class="text-sm">dropdown</code>（缩进浮层）。需要单原生{" "}
          <code class="text-sm">select</code>、选项展示完整路径（如「研发 /
          前端」）时传{" "}
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
          联用：展开{" "}
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
              form={treeSelectCreateForm}
              layout="vertical"
              class="w-full"
              onFinish={() => {
                message.success("已提交");
              }}
            >
              <FormItem name="dept" label="部门">
                <TreeSelect
                  options={TREE_OPTIONS}
                  {...treeSelectCreateForm.bind("dept")}
                  placeholder="请选择部门"
                  class="w-full"
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
import { TreeSelect } from "@dreamer/ui-view/mobile/form/tree-select";

const form = createForm({
  initialValues: { dept: "" },
  fields: { dept: { rules: [formRules.required()] } },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="dept" label="部门">
    <TreeSelect options={options} {...form.bind("dept")} />
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
            <TreeSelect
              options={TREE_OPTIONS}
              value={mobileTreeSelectVal}
              placeholder="请选择部门"
              class="w-full"
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
          <Title level={3}>size（xs / sm / md / lg）</Title>
          <MobileDocDemo>
            <div class="flex flex-col gap-3 p-2">
              <TreeSelect
                size="xs"
                options={TREE_OPTIONS}
                class="w-full"
                placeholder="xs"
              />
              <TreeSelect
                size="sm"
                options={TREE_OPTIONS}
                class="w-full"
                placeholder="sm"
              />
              <TreeSelect
                size="md"
                options={TREE_OPTIONS}
                class="w-full"
                placeholder="md"
              />
              <TreeSelect
                size="lg"
                options={TREE_OPTIONS}
                class="w-full"
                placeholder="lg"
              />
            </div>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={`<TreeSelect size="xs" options={TREE_OPTIONS} placeholder="xs" />
<TreeSelect size="sm" options={TREE_OPTIONS} placeholder="sm" />
<TreeSelect size="md" options={TREE_OPTIONS} placeholder="md" />
<TreeSelect size="lg" options={TREE_OPTIONS} placeholder="lg" />`}
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
          interfaceName="TreeSelectMessages"
          defaultExportName="defaultTreeSelectMessages"
          rows={MESSAGES_TREE_SELECT}
        />

        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          与 Select 的差异见 shared TreeSelect 文件头注释（平铺 options vs 树形
          options）。
        </Paragraph>
        <DocsApiTable rows={TREE_API} />
      </section>
    </div>
  );
}
