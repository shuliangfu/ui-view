/**
 * Cell / CellGroup 文档页。路由: /desktop/data-display/cell
 */

import { createSignal } from "@dreamer/view";
import { Paragraph, Title } from "@dreamer/ui-view/basic";
import { Switch } from "@dreamer/ui-view/form/switch";
import { Cell, CellGroup, CodeBlock } from "@dreamer/ui-view/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "title", type: "unknown", default: "-", description: "主标题" },
  { name: "description", type: "unknown", default: "-", description: "描述" },
  { name: "icon", type: "unknown", default: "-", description: "左侧图标" },
  { name: "extra", type: "unknown", default: "-", description: "右侧额外" },
  { name: "arrow", type: "boolean", default: "false", description: "右箭头" },
  {
    name: "onClick",
    type: "() => void",
    default: "-",
    description: "整行点击",
  },
  { name: "href", type: "string", default: "-", description: "有则渲染为 a" },
  { name: "disabled", type: "boolean", default: "false", description: "禁用" },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "必填星号",
  },
  {
    name: "clickable",
    type: "boolean",
    default: "-",
    description: "强制按下反馈",
  },
  {
    name: "CellGroup.title",
    type: "unknown",
    default: "-",
    description: "分组标题",
  },
  {
    name: "CellGroup.inset",
    type: "boolean",
    default: "true",
    description: "子项分割线",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Cell, CellGroup } from "@dreamer/ui-view/data-display";
const tip = createSignal("");
const notifyOn = createSignal(true);

<CellGroup title="设置">
  <Cell title="账号" arrow extra="详情" onClick={() => (tip.value = "已打开账号详情")} />
  <Cell title="通知" description="推送开关" extra={<Switch checked={notifyOn} />} />
  <Cell title="注销" arrow extra="不可用" disabled />
</CellGroup>`;

const exampleInteractive = `const tip = createSignal("");
const notifyOn = createSignal(true);

<CellGroup title="设置">
  <Cell title="账号" arrow extra="详情" onClick={() => (tip.value = "已打开账号详情")} />
  <Cell title="通知" description="推送开关" extra={<Switch checked={notifyOn} />} />
  <Cell title="注销（禁用示意）" arrow extra="不可用" disabled />
</CellGroup>`;

const exampleIconHref = `<CellGroup title="资料" inset>
  <Cell
    icon={<span aria-hidden="true">👤</span>}
    title="昵称"
    required
    extra="未填写"
    arrow
    onClick={() => {}}
  />
  <Cell
    title="帮助文档"
    description="新窗口打开"
    arrow
    href="https://example.com/help"
  />
</CellGroup>`;

const exampleInset = `<CellGroup title="紧凑" inset={false}>
  <Cell title="一项" />
  <Cell title="二项" />
</CellGroup>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Cell / CellGroup · ui-view",
};

export default function Page() {
  const tip = createSignal("");
  const notifyOn = createSignal(true);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Cell / CellGroup</Title>
        <Paragraph>
          列表行：箭头／详情须配 onClick 或 href；禁用半透明不可点；可与 Switch
          等组合。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>可点详情 + Switch + 禁用</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            <CellGroup title="设置">
              <Cell
                title="账号"
                arrow
                extra="详情"
                onClick={() => (tip.value = "已打开账号详情")}
              />
              <Cell
                title="通知"
                description="推送开关"
                extra={
                  <Switch
                    checked={notifyOn}
                    onChange={(e: Event) => {
                      const on = (e.target as HTMLInputElement).checked;
                      tip.value = on ? "通知已开启" : "通知已关闭";
                    }}
                  />
                }
              />
              <Cell title="注销（禁用示意）" arrow extra="不可用" disabled />
            </CellGroup>
            {() =>
              tip.value
                ? (
                  <p
                    class="text-sm text-blue-600 dark:text-blue-400 px-1"
                    role="status"
                  >
                    {tip.value}
                  </p>
                )
                : null}
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleInteractive}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>图标 / 必填 / href</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <CellGroup title="资料" inset>
              <Cell
                icon={<span aria-hidden="true">👤</span>}
                title="昵称"
                required
                extra="未填写"
                arrow
                onClick={() => (tip.value = "编辑昵称")}
              />
              <Cell
                title="帮助文档"
                description="新窗口打开"
                arrow
                href="https://example.com/help"
              />
            </CellGroup>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleIconHref}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>无分割线 inset=false</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <CellGroup title="紧凑" inset={false}>
              <Cell title="一项" />
              <Cell title="二项" />
            </CellGroup>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleInset}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
