/**
 * Cell 文档页。路由: /mobile/data-display/cell
 */
import { createSignal } from "@dreamer/view";
import {
  Cell,
  CellGroup,
  CodeBlock,
} from "@dreamer/ui-view/mobile/data-display";
import { Switch } from "@dreamer/ui-view/mobile/form/switch";
import { Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


const API: DocsApiTableRow[] = [
  {
    name: "arrow / onClick / disabled / href",
    type: "—",
    default: "-",
    description: "见桌面 API；行为一致",
  },
];
const importCode =
  `import { Cell, CellGroup } from "@dreamer/ui-view/mobile/data-display";`;

const exampleInteractive = `const on = createSignal(true);

<CellGroup title="设置">
  <Cell title="账号" arrow extra="详情" onClick={() => {}} />
  <Cell title="通知" description="推送" extra={<Switch checked={on} />} />
  <Cell title="注销" arrow disabled extra="不可用" />
</CellGroup>`;

const exampleHref = `<CellGroup>
  <Cell title="帮助" arrow href="https://example.com/help" />
</CellGroup>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Cell · ui-view",
};

export default function Page() {
  const tip = createSignal("");
  const on = createSignal(true);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Cell</Title>
        <Paragraph>移动列表行：详情可点、Switch、禁用、href。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT} />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-2">
          <Title level={3}>可点 + Switch + 禁用</Title>
          <MobileDocDemo class="p-3 space-y-2">
            <CellGroup title="设置">
              <Cell
                title="账号"
                arrow
                extra="详情"
                onClick={() => (tip.value = "已打开账号详情")}
              />
              <Cell
                title="通知"
                description="推送"
                extra={<Switch checked={on} />}
              />
              <Cell title="注销" arrow disabled extra="不可用" />
            </CellGroup>
            {() =>
              tip.value
                ? <p class="text-xs text-blue-600" role="status">{tip.value}</p>
                : null}
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleInteractive}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-2">
          <Title level={3}>href 链接行</Title>
          <MobileDocDemo class="p-3">
            <CellGroup>
              <Cell title="帮助" arrow href="https://example.com/help" />
            </CellGroup>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleHref}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
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
