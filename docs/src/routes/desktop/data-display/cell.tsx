/**
 * Cell / CellGroup 文档页。路由: /desktop/data-display/cell
 */

import { createSignal } from "@dreamer/view";
import { Cell, CellGroup, CodeBlock, Paragraph, Switch, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "title", type: "unknown", default: "-", description: "主标题" },
  { name: "description", type: "unknown", default: "-", description: "描述" },
  { name: "extra", type: "unknown", default: "-", description: "右侧额外" },
  { name: "arrow", type: "boolean", default: "false", description: "右箭头（可点时请配 onClick）" },
  { name: "onClick", type: "() => void", default: "-", description: "整行点击" },
  { name: "disabled", type: "boolean", default: "false", description: "禁用（半透明且不可点）" },
  { name: "clickable", type: "boolean", default: "-", description: "强制可点样式（无 onClick 时）" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Cell, CellGroup, Switch } from "@dreamer/ui-view";

const tip = createSignal("");
const notifyOn = createSignal(true);

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
    extra={<Switch checked={notifyOn} />}
  />
  <Cell title="注销（禁用示意）" arrow extra="不可用" disabled />
</CellGroup>
{tip.value && <p>{tip.value}</p>}`;

export default function Page() {
  const tip = createSignal("");
  const notifyOn = createSignal(true);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Cell / CellGroup</Title>
        <Paragraph>
          列表行：带箭头／「详情」须传 onClick 才可点；禁用行半透明且不可点。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
          <CellGroup title="设置">
            <Cell
              title="账号"
              arrow
              extra="详情"
              onClick={() => {
                tip.value = "已打开账号详情";
              }}
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
                <p class="text-sm text-blue-600 dark:text-blue-400 px-1" role="status">
                  {tip.value}
                </p>
              )
              : null}
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
