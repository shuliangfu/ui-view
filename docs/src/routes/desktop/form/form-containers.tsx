/**
 * Form / FormItem / FormList 表单容器与表单项文档。
 * 路由: /desktop/form/form-containers
 */

import {
  CodeBlock,
  Form,
  FormItem,
  FormList,
  Input,
  Link,
  Paragraph,
  Title,
} from "@dreamer/ui-view";

import { createSignal } from "@dreamer/view";

import { FORM_ITEM_API, type FormDocsApiRow } from "./form-item-api.ts";

/** Form 容器属性说明 */
const FORM_API: FormDocsApiRow[] = [
  {
    name: "layout",
    type: '"vertical" | "horizontal" | "inline"',
    default: "vertical",
    description: "垂直堆叠 / 中等屏起横向排布 / 行内尾对齐",
  },
  {
    name: "onSubmit",
    type: "(e: Event) => void",
    default: "-",
    description: "提交回调；组件内已 preventDefault，由调用方处理业务",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "作用于原生 form 的额外 class",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "FormItem、FormList 等子节点",
  },
];

/** FormList 动态列表属性说明 */
const FORM_LIST_API: FormDocsApiRow[] = [
  {
    name: "items",
    type: "unknown[] | number",
    default: "-",
    description: "列表长度：数组用 length，number 仅表示行数（行索引 0..n-1）",
  },
  {
    name: "onAdd",
    type: "() => void",
    default: "-",
    description: "点击「添加」时回调；不传则不渲染添加按钮",
  },
  {
    name: "onRemove",
    type: "(index: number) => void",
    default: "-",
    description: "点击某行「删除」时回调；不传则不渲染删除按钮",
  },
  {
    name: "addButtonText",
    type: "string",
    default: '"添加一项"',
    description: "添加按钮文案",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "外层容器 class",
  },
  {
    name: "renderRow",
    type: "(index, ctx) => unknown",
    default: "-",
    description:
      "按行渲染；ctx.removeButton 在传了 onRemove 时为删除按钮，请赋给 FormItem.trailing，与输入同一水平线",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "无 renderRow 时每行挂载同一模板；按索引变化请用 renderRow",
  },
];

const importCode =
  `import { Form, FormItem, FormList, Input } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const rowValues = createSignal<string[]>([""]);

<Form layout="vertical" onSubmit={(e) => { /* 处理提交 */ }}>
  <FormItem label="名称" id="name">
    <Input id="name" value={() => val.value} onInput={...} />
  </FormItem>
</Form>`;

/**
 * 渲染 API 表格（与其它表单文档页结构一致）。
 *
 * @param rows - 属性行
 */
function ApiTable({ rows }: { rows: FormDocsApiRow[] }) {
  return (
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
          {rows.map((row) => (
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
  );
}

export default function FormContainersDoc() {
  /** 动态列表每行输入值，长度即 FormList 行数 */
  const rowValues = createSignal<string[]>(["", ""]);

  /** 根用渲染 getter，读取 rowValues 以便增删行后 FormList 行数更新 */
  return (
    <div class="space-y-10 w-full">
      <section>
        <Title level={1}>Form · FormItem · FormList</Title>
        <Paragraph class="mt-2">
          表单布局容器 <strong>Form</strong>、表单项包装{" "}
          <strong>FormItem</strong>（标签、必填星号、错误）、动态行{" "}
          <strong>FormList</strong>（增删行）。具体输入控件见{" "}
          <Link
            href="/desktop/form/input"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Input
          </Link>{" "}
          等各组件文档。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          code={importCode}
          language="tsx"
          showLineNumbers
          title="代码示例"
          wrapLongLines
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>Form：layout</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            vertical（默认）、horizontal（md
            及以上横向）、inline（行内尾对齐）。
          </Paragraph>
          <div class="grid gap-6 lg:grid-cols-1">
            <div class="space-y-2">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                vertical
              </p>
              <Form
                layout="vertical"
                class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
              >
                <FormItem label="账号" id="fc-v1">
                  <Input id="fc-v1" placeholder="vertical" value="" />
                </FormItem>
                <FormItem label="备注" id="fc-v2">
                  <Input id="fc-v2" placeholder="第二行" value="" />
                </FormItem>
              </Form>
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                inline
              </p>
              <Form
                layout="inline"
                class="w-full border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
              >
                <FormItem label="关键词" id="fc-i1">
                  <Input id="fc-i1" placeholder="inline" value="" />
                </FormItem>
                <FormItem label="类型" id="fc-i2">
                  <Input id="fc-i2" placeholder="筛选" value="" />
                </FormItem>
              </Form>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <Title level={3}>FormItem：标签位置与必填</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              labelPosition="left"
            </code>{" "}
            与{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              labelAlign="right"
            </code>{" "}
            常用于对齐标签列；{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              hideRequiredMark
            </code>{" "}
            详见{" "}
            <Link
              href="/desktop/form/input"
              className="text-teal-600 hover:underline dark:text-teal-400"
            >
              Input · FormItem：hideRequiredMark
            </Link>
            。
          </Paragraph>
          <Form layout="vertical" class="w-full max-w-lg">
            <FormItem
              label="邮箱"
              required
              labelPosition="left"
              labelAlign="right"
              id="fc-email"
            >
              <Input
                id="fc-email"
                placeholder="左侧标签 + 右对齐"
                value=""
              />
            </FormItem>
          </Form>
        </div>

        <div class="space-y-4">
          <Title level={3}>FormList：动态增减行</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            父级持有数组状态；<code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              items
            </code>{" "}
            传行数或数组长度。按行渲染请用属性{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              renderRow={"{"}…{"}"}
            </code>
            （例如{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              renderRow={"{"}(index, {"{"} removeButton {"}"}) ={">"} …{"}"}
            </code>
            ）：View 会把<strong>子节点</strong>编成单参挂载函数{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              (parent) ={">"} void
            </code>
            ，若把按行回调写在子节点里会被当成父节点调用，行内表单不显示。
          </Paragraph>
          <Form layout="vertical" class="w-full max-w-xl">
            <FormList
              items={rowValues.value.length}
              onAdd={() => {
                rowValues.value = [...rowValues.value, ""];
              }}
              onRemove={(index) => {
                rowValues.value = rowValues.value.filter((_, j) => j !== index);
              }}
              addButtonText="添加一行"
              renderRow={(index: number, { removeButton }) => (
                <FormItem
                  label={`条目 ${index + 1}`}
                  id={`form-list-row-${index}`}
                  trailing={removeButton}
                >
                  <Input
                    id={`form-list-row-${index}`}
                    placeholder={`第 ${index + 1} 行`}
                    value={() => rowValues.value[index] ?? ""}
                    onInput={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      const next = [...rowValues.value];
                      next[index] = v;
                      rowValues.value = next;
                    }}
                  />
                </FormItem>
              )}
            />
          </Form>
          <CodeBlock
            code={`const rowValues = createSignal<string[]>(["", ""]);

<FormList
  items={rowValues.value.length}
  onAdd={() => { rowValues.value = [...rowValues.value, ""]; }}
  onRemove={(i) => {
    rowValues.value = rowValues.value.filter((_, j) => j !== i);
  }}
  renderRow={(index, { removeButton }) => (
    <FormItem
      label={\`条目 \${index + 1}\`}
      id={\`row-\${index}\`}
      trailing={removeButton}
    >
      <Input
        id={\`row-\${index}\`}
        value={() => rowValues.value[index] ?? ""}
        onInput={(e) => {
          const next = [...rowValues.value];
          next[index] = (e.target as HTMLInputElement).value;
          rowValues.value = next;
        }}
      />
    </FormItem>
  )}
/>`}
            language="tsx"
            showLineNumbers
            copyable
            title="代码示例"
            wrapLongLines
          />
        </div>
      </section>

      <section class="space-y-6">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          以下三表分别对应三个组件，属性均为可选（除 FormList.items 需传入）。
        </Paragraph>

        <div class="space-y-2">
          <Title level={3}>Form</Title>
          <ApiTable rows={FORM_API} />
        </div>

        <div class="space-y-2">
          <Title level={3}>FormItem</Title>
          <ApiTable rows={FORM_ITEM_API} />
        </div>

        <div class="space-y-2">
          <Title level={3}>FormList</Title>
          <ApiTable rows={FORM_LIST_API} />
        </div>
      </section>
    </div>
  );
}
