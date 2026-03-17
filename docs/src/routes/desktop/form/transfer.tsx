/**
 * Transfer 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/transfer
 */

import {
  CodeBlock,
  Form,
  FormItem,
  Paragraph,
  Title,
  Transfer,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const TRANSFER_API: ApiRow[] = [
  {
    name: "dataSource",
    type: "Array<{key, title, disabled?}>",
    default: "-",
    description: "数据源",
  },
  {
    name: "targetKeys",
    type: "string[] | (() => string[])",
    default: "-",
    description:
      "已选 key 列表；建议传 getter（如 () => targetKeys()）以便穿梭时读到最新值",
  },
  {
    name: "onChange",
    type: "(keys: string[]) => void",
    default: "-",
    description: "变更回调",
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
    description: "受控搜索值",
  },
  {
    name: "onSearch",
    type: "(dir: 'left'|'right', value: string) => void",
    default: "-",
    description: "搜索变更",
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
    description: "自定义渲染项",
  },
  {
    name: "listStyle",
    type: "CSSProperties",
    default: "-",
    description: "列表容器样式",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "整组禁用",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const data = [
  { key: "1", title: "苹果" },
  { key: "2", title: "香蕉" },
  { key: "3", title: "橙子" },
  { key: "4", title: "葡萄" },
  { key: "5", title: "西瓜" },
  { key: "6", title: "草莓", disabled: true },
];

const importCode = `import { Transfer, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const data = [{ key: "1", title: "选项1" }, { key: "2", title: "选项2" }];
const [targetKeys, setTargetKeys] = createSignal<string[]>([]);
<FormItem label="穿梭">
  <Transfer
    dataSource={data}
    targetKeys={() => targetKeys()}
    onChange={(keys) => setTargetKeys(keys)}
    titles={["待选", "已选"]}
  />
</FormItem>`;

export default function FormTransfer() {
  const [targetKeys, setTargetKeys] = createSignal<string[]>([]);
  const [targetKeys2, setTargetKeys2] = createSignal<string[]>(["2", "4"]);
  const [searchValue, setSearchValue] = createSignal<[string, string]>([
    "",
    "",
  ]);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Transfer 穿梭框</Title>
        <Paragraph class="mt-2">
          穿梭框：dataSource、targetKeys、onChange、titles、showSearch、searchPlaceholder、searchValue、onSearch、filterOption、render、listStyle、disabled。宽度由
          class 控制，表单中需占满一列时传 class="w-full"。Tailwind v4 +
          light/dark。
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

        <Form layout="vertical" class="w-full space-y-6">
          <section class="space-y-4">
            <Title level={3}>基础（无搜索）</Title>
            <FormItem label="穿梭">
              <Transfer
                dataSource={data}
                targetKeys={() => targetKeys()}
                onChange={(keys) => setTargetKeys(keys)}
                titles={["待选", "已选"]}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Transfer
  dataSource={data}
  targetKeys={() => targetKeys()}
  onChange={(keys) => setTargetKeys(keys)}
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
                targetKeys={() => targetKeys2()}
                onChange={(keys) => setTargetKeys2(keys)}
                titles={["待选", "已选"]}
                showSearch
                searchValue={searchValue()}
                onSearch={(dir, value) =>
                  setSearchValue((prev) =>
                    dir === "left" ? [value, prev[1]] : [prev[0], value]
                  )}
                searchPlaceholder={["筛选左侧", "筛选右侧"]}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Transfer
  ...
  showSearch
  searchValue={searchValue()}
  onSearch={(dir, value) => ...}
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
                targetKeys={["1"]}
                onChange={() => {}}
                titles={["源", "目标"]}
              />
            </FormItem>
            <FormItem label="整组禁用">
              <Transfer
                dataSource={data}
                targetKeys={["1", "2"]}
                onChange={() => {}}
                disabled
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`dataSource 项可设 disabled: true；<Transfer disabled /> 整组禁用`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>
        </Form>
      </section>

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
