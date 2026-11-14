/**
 * DropdownMenu 文档页。路由: /mobile/navigation/dropdown-menu
 */

import { createSignal } from "@dreamer/view";
import { MobilePortalHostScope } from "@dreamer/ui-view/mobile/portal";
import { DropdownMenu } from "@dreamer/ui-view/mobile/navigation";
import { Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_DROPDOWN_MENU } from "../../../data/component-messages-rows.ts";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


const API: DocsApiTableRow[] = [
  {
    name: "items",
    type: "DropdownMenuItem[]",
    default: "-",
    description: "列定义",
  },
  {
    name: "value",
    type: "Record<string,string>",
    default: "-",
    description: "受控值（勿直接传 Signal，传 .value 并在 onChange 写回）",
  },
  {
    name: "onChange",
    type: "(key,value)=>void",
    default: "-",
    description: "变更",
  },
  {
    name: "messages",
    type: "Partial<DropdownMenuMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode =
  `import { MobilePortalHostScope } from "@dreamer/ui-view/mobile/portal";

<MobilePortalHostScope>
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
  />
</MobilePortalHostScope>`;

const items = [
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
];

const exampleBasic = `<MobilePortalHostScope>
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
</MobilePortalHostScope>`;

const exampleValue = `const value = createSignal({ sort: "n", filter: "a" });

<MobilePortalHostScope>
  <DropdownMenu
    items={items}
    value={value.value}
    onChange={(key, v) => {
      value.value = { ...value.value, [key]: v };
    }}
  />
</MobilePortalHostScope>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "DropdownMenu · ui-view",
};

export default function Page() {
  const value = createSignal<Record<string, string>>({
    sort: "n",
    filter: "a",
  });
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>DropdownMenu</Title>
        <Paragraph>
          移动顶栏多列下拉。须包 MobilePortalHostScope，遮罩限制在示意框。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT} />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-2">
          <Title level={3}>基础多列</Title>
          <MobileDocDemo class="flex min-h-[280px] flex-col overflow-hidden p-0">
            <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col">
              <DropdownMenu items={items} />
              <div class="flex-1 p-4 text-sm text-slate-500 dark:text-slate-400">
                列表区域示意（打开菜单时遮罩盖住本框）
              </div>
            </MobilePortalHostScope>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleBasic}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-2">
          <Title level={3}>受控 value</Title>
          <MobileDocDemo class="flex min-h-[240px] flex-col overflow-hidden p-0">
            <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col">
              {() => (
                <DropdownMenu
                  items={items}
                  value={value.value}
                  onChange={(key, v) => {
                    value.value = { ...value.value, [key]: v };
                  }}
                />
              )}
              {() => (
                <p class="p-3 text-xs text-slate-500">
                  value：{JSON.stringify(value.value)}
                </p>
              )}
            </MobilePortalHostScope>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleValue}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>
      <DocsMessagesSection
        interfaceName="DropdownMenuMessages"
        defaultExportName="defaultDropdownMenuMessages"
        rows={MESSAGES_DROPDOWN_MENU}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
