/**
 * DropdownMenu 文档页。路由: /mobile/navigation/dropdown-menu
 */

import {
  DropdownMenu,
  MobilePortalHostScope,
} from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "items", type: "DropdownMenuItem[]", default: "-", description: "列定义" },
  { name: "value", type: "Record<string,string>", default: "-", description: "受控值" },
  { name: "onChange", type: "(key,value)=>void", default: "-", description: "变更" },
];

const importCode = `import { DropdownMenu } from "@dreamer/ui-view/mobile";

<DropdownMenu
  items={[
    {
      key: "sort",
      title: "排序",
      options: [
        { value: "default", label: "默认" },
        { value: "price", label: "价格" },
      ],
    },
  ]}
/>`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>DropdownMenu</Title>
        <Paragraph>
          移动顶栏多列下拉筛选菜单。文档示例包在 MobilePortalHostScope
          内，打开时遮罩限制在示意框，不盖整页。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo class="flex min-h-[280px] flex-col overflow-hidden p-0">
          <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col">
            <DropdownMenu
              items={[
                {
                  key: "sort",
                  title: "排序",
                  options: [
                    { value: "n", label: "最新" },
                    { value: "h", label: "最热" },
                  ],
                },
                {
                  key: "filter",
                  title: "筛选",
                  options: [
                    { value: "a", label: "全部" },
                    { value: "m", label: "我的" },
                  ],
                },
              ]}
            />
            <div class="flex-1 p-4 text-sm text-slate-500 dark:text-slate-400">
              列表区域示意（打开菜单时遮罩盖住本框，不盖整页）
            </div>
          </MobilePortalHostScope>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
