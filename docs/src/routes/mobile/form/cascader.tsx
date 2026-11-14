/**
 * Cascader（移动版）文档页（概述、引入、示例、API）。路由: /mobile/form/cascader
 */

import { Cascader } from "@dreamer/ui-view/mobile/form/cascader";
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
import { MESSAGES_CASCADER } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

/** createForm 演示字段（onChange(value) → bindValue） */
type CascaderCreateFormValues = { region: string[] };

/** 与 createForm 联用演示 store */
const cascaderCreateForm = createForm<CascaderCreateFormValues>({
  initialValues: { region: [] },
  fields: {
    region: { rules: [formRules.required("请选择地区")] },
  },
});

const OPTIONS = [
  {
    value: "zhejiang",
    label: "浙江",
    children: [
      { value: "hangzhou", label: "杭州" },
      { value: "ningbo", label: "宁波" },
    ],
  },
  {
    value: "jiangsu",
    label: "江苏",
    children: [{ value: "nanjing", label: "南京" }],
  },
];

const CASCADER_API: DocsApiTableRow[] = [
  {
    name: "appearance",
    type: `"dropdown" | "native"`,
    default: `"dropdown"`,
    description:
      "默认多列浮层；`native` 为浅层双原生 select。移动入口与 shared 同源",
  },
  {
    name: "options",
    type: "CascaderOption[]",
    default: "-",
    description: "静态树；每项 value、label、可选 children / isLeaf",
  },
  {
    name: "value",
    type: "MaybeSignal<string[]>",
    default: "-",
    description: "选中路径；Signal 时组件内自动写回，可不写 onChange",
  },
  {
    name: "onChange",
    type: "(value: string[]) => void",
    default: "-",
    description: "非 Signal 受控时必须更新外部数据",
  },
  {
    name: "loadChildren",
    type: "(path: string[]) => Promise<CascaderOption[]>",
    default: "-",
    description: "异步加载子节点",
  },
  {
    name: "onLoadError",
    type: "(path, error) => void",
    default: "-",
    description: "加载失败回调",
  },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "未选时占位",
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
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  {
    name: "messages",
    type: "Partial<CascaderMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode =
  `import { Cascader } from "@dreamer/ui-view/mobile/form/cascader";

const val = createSignal<string[]>([]);

<Cascader options={tree} value={val} class="w-full" />`;

/** 模块级 Signal，与桌面 Cascader 文档受控约定一致 */
const mobileCascaderVal = createSignal<string[]>([]);

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Cascader 级联（移动） · ui-view",
};

export default function MobileCascaderDoc() {
  return (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>Cascader 级联（移动）</Title>
        <Paragraph class="mt-2">
          <code class="text-sm">@dreamer/ui-view/mobile</code> 再导出{" "}
          <code class="text-sm">
            shared/form/Cascader
          </code>，与桌面包一致；数据结构为嵌套{" "}
          <code class="text-sm">CascaderOption[]</code>
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
          <code class="text-sm">onChange(value)</code>，展开{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            {"{...form.bindValue(name)}"}
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
              form={cascaderCreateForm}
              layout="vertical"
              class="w-full"
              onFinish={() => {
                message.success("已提交");
              }}
            >
              <FormItem name="region" label="地区">
                <Cascader
                  options={OPTIONS}
                  {...cascaderCreateForm.bindValue("region")}
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
import { Cascader } from "@dreamer/ui-view/mobile/form/cascader";

const form = createForm({
  initialValues: { region: [] as string[] },
  fields: { region: { rules: [formRules.required()] } },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="region" label="地区">
    <Cascader options={tree} {...form.bindValue("region")} />
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
          <Title level={3}>静态树 + Signal</Title>
          <MobileDocDemo>
            <Cascader
              options={OPTIONS}
              value={mobileCascaderVal}
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
              <Cascader
                size="xs"
                options={OPTIONS}
                class="w-full"
                placeholder="xs"
              />
              <Cascader
                size="sm"
                options={OPTIONS}
                class="w-full"
                placeholder="sm"
              />
              <Cascader
                size="md"
                options={OPTIONS}
                class="w-full"
                placeholder="md"
              />
              <Cascader
                size="lg"
                options={OPTIONS}
                class="w-full"
                placeholder="lg"
              />
            </div>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={`<Cascader size="xs" options={OPTIONS} placeholder="xs" />
<Cascader size="sm" options={OPTIONS} placeholder="sm" />
<Cascader size="md" options={OPTIONS} placeholder="md" />
<Cascader size="lg" options={OPTIONS} placeholder="lg" />`}
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
          interfaceName="CascaderMessages"
          defaultExportName="defaultCascaderMessages"
          rows={MESSAGES_CASCADER}
        />

        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          详细行为（动态加载、列数、浮层定位）见桌面 Cascader 文档与源码注释。
        </Paragraph>
        <DocsApiTable rows={CASCADER_API} />
      </section>
    </div>
  );
}
