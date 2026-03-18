/**
 * Popconfirm 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/feedback/popconfirm
 */

import { createSignal } from "@dreamer/view";
import {
  Button,
  CodeBlock,
  Paragraph,
  Popconfirm,
  Title,
} from "@dreamer/ui-view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const POPCONFIRM_API: ApiRow[] = [
  {
    name: "open",
    type: "boolean",
    default: "-",
    description: "是否打开（受控）",
  },
  {
    name: "onOpenChange",
    type: "(open: boolean) => void",
    default: "-",
    description: "打开/关闭回调",
  },
  { name: "title", type: "string", default: "-", description: "确认标题/描述" },
  {
    name: "onConfirm",
    type: "() => void",
    default: "-",
    description: "确定回调",
  },
  {
    name: "onCancel",
    type: "() => void",
    default: "-",
    description: "取消回调",
  },
  {
    name: "okText",
    type: "string",
    default: "确定",
    description: "确定按钮文案",
  },
  {
    name: "cancelText",
    type: "string",
    default: "取消",
    description: "取消按钮文案",
  },
  {
    name: "danger",
    type: "boolean",
    default: "false",
    description: "危险操作（确定按钮红色）",
  },
  {
    name: "showIcon",
    type: "boolean",
    default: "true",
    description: "是否显示问号图标",
  },
  {
    name: "placement",
    type: "string",
    default: "top",
    description: "气泡位置",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "触发元素（需在 onClick 中打开）",
  },
  { name: "class", type: "string", default: "-", description: "包装器 class" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Button, Popconfirm } from "@dreamer/ui-view";

const [open, setOpen] = createSignal(false);

{() => (
  <Popconfirm
    open={open()}
    onOpenChange={setOpen}
    title="确定要执行吗？"
    onConfirm={() => setOpen(false)}
    onCancel={() => setOpen(false)}
  >
    <Button onClick={() => setOpen(true)}>打开</Button>
  </Popconfirm>
)}`;

const exampleBasic = `{() => (
  <Popconfirm
    open={open()}
    onOpenChange={setOpen}
    title="确定要执行该操作吗？"
    placement="top"
    okText="确定"
    cancelText="取消"
    onConfirm={() => setOpen(false)}
    onCancel={() => setOpen(false)}
  >
    <Button variant="default" onClick={() => setOpen(true)}>普通确认（placement=top）</Button>
  </Popconfirm>
)}`;

const exampleDanger = `{() => (
  <Popconfirm
    open={openDanger()}
    onOpenChange={setOpenDanger}
    title="删除后无法恢复，确定删除吗？"
    danger
    okText="删除"
    cancelText="取消"
    showIcon
    onConfirm={() => setOpenDanger(false)}
    onCancel={() => setOpenDanger(false)}
  >
    <Button variant="danger" onClick={() => setOpenDanger(true)}>删除</Button>
  </Popconfirm>
)}`;

export default function FeedbackPopconfirm() {
  const [open, setOpen] = createSignal(false);
  const [openDanger, setOpenDanger] = createSignal(false);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Popconfirm 气泡确认框</Title>
        <Paragraph class="mt-2">
          气泡确认框：title、onConfirm、onCancel、okText、cancelText；支持
          open/onOpenChange 受控、danger、showIcon、placement。 使用 Tailwind
          v4，支持 light/dark 主题。
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

        <div class="space-y-4">
          <Title level={3}>基础用法（受控）</Title>
          <div class="flex gap-2">
            {() => (
              <Popconfirm
                open={open()}
                onOpenChange={setOpen}
                title="确定要执行该操作吗？"
                placement="top"
                okText="确定"
                cancelText="取消"
                onConfirm={() => setOpen(false)}
                onCancel={() => setOpen(false)}
              >
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setOpen(true)}
                >
                  普通确认（placement=top）
                </Button>
              </Popconfirm>
            )}
            {() => (
              <Popconfirm
                open={openDanger()}
                onOpenChange={setOpenDanger}
                title="删除后无法恢复，确定删除吗？"
                danger
                okText="删除"
                cancelText="取消"
                showIcon
                onConfirm={() => setOpenDanger(false)}
                onCancel={() => setOpenDanger(false)}
              >
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setOpenDanger(true)}
                >
                  删除
                </Button>
              </Popconfirm>
            )}
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleBasic}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>危险操作（danger + showIcon）</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            上例中右侧「删除」按钮使用
            danger、showIcon，确定按钮为红色并显示问号图标。
          </Paragraph>
          <CodeBlock
            title="代码示例"
            code={exampleDanger}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件接收以下属性，title 为必填；需在触发元素 onClick 中调用
          onOpenChange(true) 打开。
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
              {POPCONFIRM_API.map((row) => (
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
