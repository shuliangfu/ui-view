/**
 * DropdownMenu 文档页。路由: /mobile/navigation/dropdown-menu
 */

import { DropdownMenu } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "items", type: "DropdownMenuItem[]", default: "-", description: "列定义" },
  { name: "value", type: "Record<string,string>", default: "-", description: "受控值" },
  { name: "onChange", type: "(key,value)=>void", default: "-", description: "变更" }
];

const importCode = `import { DropdownMenu } from "@dreamer/ui-view/mobile";\n\n<DropdownMenu items={[…]} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>DropdownMenu</Title>
        <Paragraph>移动顶栏多列下拉筛选菜单。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <DropdownMenu items={[{ key: "sort", title: "排序", options: [{ value: "n", label: "最新" }, { value: "h", label: "最热" }] }, { key: "filter", title: "筛选", options: [{ value: "a", label: "全部" }, { value: "m", label: "我的" }] }]} />
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
