/**
 * Transfer 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/transfer
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Transfer } from "@dreamer/ui-view/form/transfer";

import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_TRANSFER } from "../../../data/component-messages-rows.ts";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const TRANSFER_API: ApiRow[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"md"',
    description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  },

  {
    name: "dataSource",
    type: "Array<{key, title, disabled?}>",
    default: "-",
    description: "数据源",
  },
  {
    name: "targetKeys",
    type: "MaybeSignal<string[]>",
    default: "-",
    description:
      "已选 key 列表。传 `createSignal` 返回值时组件内回写，可不写 onChange；静态数组仅适合禁用展示等不需穿梭场景",
  },
  {
    name: "onChange",
    type: "(keys: string[]) => void",
    default: "-",
    description:
      "可选。`targetKeys` 为 Signal 时组件已回写；需副作用（如打日志）时再传",
  },
  {
    name: "titles",
    type: "[string, string]",
    default: "-",
    description: "左右列标题",
  },
  {
    name: "showSearch",
    type: "boolean",
    default: "false",
    description: "是否显示搜索",
  },
  {
    name: "searchPlaceholder",
    type: "[string, string]",
    default: "-",
    description: "左右搜索框占位",
  },
  {
    name: "searchValue",
    type: "[string, string]",
    default: "-",
    description:
      "可选：左右搜索框初始文案（仅实例创建时生效）；勿做每键更新的受控绑定，以免失焦",
  },
  {
    name: "onSearch",
    type: "(dir: 'left'|'right', value: string) => void",
    default: "-",
    description: "用户输入搜索时的通知回调（筛选在组件内部完成）",
  },
  {
    name: "filterOption",
    type: "(inputValue: string, item: {key, title}) => boolean",
    default: "-",
    description: "自定义筛选",
  },
  {
    name: "render",
    type: "(item: {key, title}) => any",
    default: "-",
    description:
      "自定义渲染项；若返回非文本（非 string/number），列表回退为 title",
  },
  {
    name: "listStyle",
    type: "{ width?: number; height?: number | string; minHeight?: number | string; maxHeight?: number | string; itemHeight?: number }",
    default: "-",
    description:
      "列表样式：width 为列宽基准（窄容器内可收缩），height / minHeight / maxHeight 为列表整高（像素数字或 CSS 值；与顶层同名参数同时存在时顶层优先；height 默认 200），itemHeight 为每一项行高（像素）；不传 itemHeight 时按 size 默认为 xs 16 / sm 18 / md 18 / lg 20",
  },
  {
    name: "height",
    type: "number | string",
    default: "200",
    description:
      "列表整高，可传像素数字或 CSS 值（如 360、\"70vh\"、\"calc(100vh - 340px)\"）；优先于 listStyle.height",
  },
  {
    name: "minHeight",
    type: "number | string",
    default: "-",
    description: "列表最小高度，可传像素数字或 CSS 值；优先于 listStyle.minHeight",
  },
  {
    name: "maxHeight",
    type: "number | string",
    default: "-",
    description: "列表最大高度，可传像素数字或 CSS 值；优先于 listStyle.maxHeight",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "整组禁用",
  },
  {
    name: "hideFocusRing",
    type: "boolean",
    default: "false",
    description:
      "为 true 时隐藏列头搜索框与穿梭操作按钮的聚焦蓝色 ring；默认 false 显示",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  {
    name: "error",
    type: "boolean",
    default: "false",
    description: "错误状态（红框）；可与 createForm 绑定联用",
  },
  {
    name: "messages",
    type: "Partial<TransferMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const data = [
  { key: "1", title: "苹果" },
  { key: "2", title: "香蕉" },
  { key: "3", title: "橙子" },
  { key: "4", title: "葡萄" },
  { key: "5", title: "西瓜" },
  { key: "6", title: "草莓", disabled: true },
];

const importCode = `import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Transfer } from "@dreamer/ui-view/form/transfer";

const data = [{ key: "1", title: "选项1" }, { key: "2", title: "选项2" }];
const targetKeys = createSignal<string[]>([]);
<FormItem label="穿梭">
  <Transfer
    dataSource={data}
    targetKeys={targetKeys}
    titles={["待选", "已选"]}
  />
</FormItem>`;

/** createForm 演示字段（模块级） */
type TransferDemoValues = { keys: string[] };

/** Transfer + bindTargetKeys 联用演示 store */
const transferDemoForm = createForm<TransferDemoValues>({
  initialValues: { keys: [] },
  fields: {
    keys: {
      rules: [
        formRules.custom((v) =>
          Array.isArray(v) && v.length > 0 ? undefined : "请至少选择一项"
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
import { Transfer } from "@dreamer/ui-view/form/transfer";
import { Button } from "@dreamer/ui-view/basic";
import { message } from "@dreamer/ui-view/feedback";

const form = createForm({
  initialValues: { keys: [] as string[] },
  fields: {
    keys: {
      rules: [formRules.custom((v) =>
        Array.isArray(v) && v.length > 0 ? undefined : "请至少选择一项"
      )],
    },
  },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="keys" label="穿梭">
    <Transfer
      {...form.bindTargetKeys("keys")}
      class="w-full"
      dataSource={data}
      titles={["待选", "已选"]}
    />
  </FormItem>
  <Button type="submit" variant="primary">提交</Button>
</Form>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Transfer 穿梭框 · ui-view",
};

export default function FormTransfer() {
  const targetKeys = createSignal<string[]>([]);
  const targetKeys2 = createSignal<string[]>(["2", "4"]);
  /** 含 disabled 项示例：受控请传 Signal；勿写死 targetKeys 否则无法穿梭 */
  const targetKeysWithDisabled = createSignal<string[]>(["1"]);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Transfer 穿梭框</Title>
        <Paragraph class="mt-2">
          左右列表使用原生多选 select：单击只选一项，Ctrl /
          Command+单击多选，点中列表后 Ctrl / Command+A
          全选当前列（不会选中整页）。列宽可随容器收缩，聚焦时只在列表内侧显示淡色细线。可用
          height、minHeight、maxHeight 控制列表整高（像素数字或 CSS
          值，也可写在 listStyle 里），height 默认 200。可用
          listStyle.itemHeight 控制每一项行高（像素），不传则按 size
          使用默认行高。render
          若返回非文本则回退为标题。dataSource、targetKeys、onChange、titles、showSearch、searchPlaceholder、可选
          searchValue（仅初始文案）、onSearch（输入通知）、filterOption、render、listStyle、disabled。宽度由
          class 控制，表单中需占满一列时传 class="w-full"。Tailwind v4 +
          light/dark。与{" "}
          <Link
            href="/desktop/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Form / createForm
          </Link>{" "}
          联用时展开{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            {"{...form.bindTargetKeys(name)}"}
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
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <section class="space-y-4">
          <Title level={3}>与 createForm</Title>
          <Form
            form={transferDemoForm}
            layout="vertical"
            class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
            onFinish={() => {
              message.success("已提交");
            }}
          >
            <FormItem name="keys" label="穿梭">
              <Transfer
                {...transferDemoForm.bindTargetKeys("keys")}
                class="w-full"
                dataSource={data}
                titles={["待选", "已选"]}
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
            <Title level={3}>基础（无搜索）</Title>
            <FormItem label="穿梭">
              <Transfer
                dataSource={data}
                targetKeys={targetKeys}
                titles={["待选", "已选"]}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Transfer
  dataSource={data}
  targetKeys={targetKeys}
  titles={["待选", "已选"]}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>showSearch 搜索筛选</Title>
            <FormItem label="左右列可搜索">
              <Transfer
                dataSource={data}
                targetKeys={targetKeys2}
                titles={["待选", "已选"]}
                showSearch
                searchPlaceholder={["筛选左侧", "筛选右侧"]}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Transfer
  ...
  showSearch
  searchPlaceholder={["左", "右"]}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>dataSource 含 disabled 项 / 整组 disabled</Title>
            <FormItem label="草莓为 disabled">
              <Transfer
                dataSource={data}
                targetKeys={targetKeysWithDisabled}
                titles={["源", "目标"]}
              />
            </FormItem>
            <FormItem label="整组禁用">
              <Transfer
                dataSource={data}
                targetKeys={["1", "2"]}
                disabled
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`// 项级 disabled：受控 targetKeys 用 Signal
const targetKeys = createSignal<string[]>(["1"]);
<Transfer
  dataSource={[{ key: "a", title: "可选" }, { key: "b", title: "禁用", disabled: true }]}
  targetKeys={targetKeys}
/>
// 整组：<Transfer disabled />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>
          <section class="space-y-4">
            <Title level={3}>size（xs / sm / md / lg）</Title>
            <FormItem label="xs">
              <Transfer
                size="xs"
                dataSource={data}
                targetKeys={targetKeys}
                titles={["待选", "已选"]}
                listStyle={{ width: 160, height: 120 }}
              />
            </FormItem>
            <FormItem label="sm">
              <Transfer
                size="sm"
                dataSource={data}
                targetKeys={targetKeys}
                titles={["待选", "已选"]}
                listStyle={{ width: 160, height: 120 }}
              />
            </FormItem>
            <FormItem label="md（默认）">
              <Transfer
                size="md"
                dataSource={data}
                targetKeys={targetKeys}
                titles={["待选", "已选"]}
                listStyle={{ width: 160, height: 120 }}
              />
            </FormItem>
            <FormItem label="lg">
              <Transfer
                size="lg"
                dataSource={data}
                targetKeys={targetKeys}
                titles={["待选", "已选"]}
                listStyle={{ width: 160, height: 120 }}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Transfer size="xs" dataSource={data} targetKeys={targetKeys} titles={["待选", "已选"]} />
<Transfer size="sm" dataSource={data} targetKeys={targetKeys} titles={["待选", "已选"]} />
<Transfer size="md" dataSource={data} targetKeys={targetKeys} titles={["待选", "已选"]} />
<Transfer size="lg" dataSource={data} targetKeys={targetKeys} titles={["待选", "已选"]} />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>
        </Form>
      </section>

      <DocsMessagesSection
        interfaceName="TransferMessages"
        defaultExportName="defaultTransferMessages"
        rows={MESSAGES_TRANSFER}
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
              {TRANSFER_API.map((row) => (
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
