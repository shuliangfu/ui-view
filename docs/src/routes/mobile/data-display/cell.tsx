/**
 * Cell / CellGroup 文档页。路由: /mobile/data-display/cell
 */

import { createSignal } from "@dreamer/view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { Cell, CellGroup, Switch } from "@dreamer/ui-view/mobile";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "title", type: "unknown", default: "-", description: "标题" },
  { name: "description", type: "unknown", default: "-", description: "描述" },
  { name: "extra", type: "unknown", default: "-", description: "右侧额外" },
  { name: "arrow", type: "boolean", default: "false", description: "箭头（可点时请配 onClick）" },
  { name: "onClick", type: "() => void", default: "-", description: "整行点击" },
  { name: "disabled", type: "boolean", default: "false", description: "禁用" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Cell, CellGroup, Switch } from "@dreamer/ui-view/mobile";

const tip = createSignal("");
const notifyOn = createSignal(true);

<CellGroup title="账户">
  <Cell title="资料" arrow extra="详情" onClick={() => (tip.value = "进入资料")} />
  <Cell
    title="安全"
    description="密码与设备"
    arrow
    onClick={() => (tip.value = "进入安全设置")}
  />
  <Cell
    title="通知"
    extra={<Switch checked={notifyOn} />}
  />
</CellGroup>`;

export default function Page() {
  const tip = createSignal("");
  const notifyOn = createSignal(true);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Cell / CellGroup</Title>
        <Paragraph>
          移动端列表行：箭头行须配 onClick；开关放在 extra 可交互。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <div class="space-y-3">
            <CellGroup title="账户">
              <Cell
                title="资料"
                arrow
                extra="详情"
                onClick={() => {
                  tip.value = "已打开资料";
                }}
              />
              <Cell
                title="安全"
                description="密码与设备"
                arrow
                onClick={() => {
                  tip.value = "已打开安全设置";
                }}
              />
              <Cell
                title="通知"
                description="推送开关"
                extra={
                  <Switch
                    checked={notifyOn}
                    onChange={(v: boolean) => {
                      notifyOn.value = v;
                      tip.value = v ? "通知已开启" : "通知已关闭";
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
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
