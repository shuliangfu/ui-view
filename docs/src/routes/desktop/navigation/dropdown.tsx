/**
 * Dropdown 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/navigation/dropdown
 */

import { createSignal } from "@dreamer/view";
import {
  Button,
  CodeBlock,
  Dropdown,
  Paragraph,
  Title,
} from "@dreamer/ui-view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const DROPDOWN_API: ApiRow[] = [
  { name: "children", type: "unknown", default: "-", description: "触发元素" },
  { name: "overlay", type: "unknown", default: "-", description: "下拉内容" },
  {
    name: "open",
    type: "boolean",
    default: "-",
    description: "是否打开（受控）",
  },
  {
    name: "defaultOpen",
    type: "boolean",
    default: "false",
    description: "非受控时初始是否打开",
  },
  {
    name: "onOpenChange",
    type: "(open: boolean) => void",
    default: "-",
    description: "打开/关闭回调",
  },
  {
    name: "trigger",
    type: "click | hover",
    default: "click",
    description: "触发方式",
  },
  {
    name: "hoverOpenDelay",
    type: "number",
    default: "150",
    description: "hover 展开延迟（ms）",
  },
  {
    name: "hoverCloseDelay",
    type: "number",
    default: "100",
    description: "hover 收起延迟（ms）",
  },
  {
    name: "placement",
    type: "string",
    default: "bottomLeft",
    description: "下拉位置",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  {
    name: "overlayClass",
    type: "string",
    default: "-",
    description: "下拉层 class",
  },
  {
    name: "overlayId",
    type: "string",
    default: "-",
    description: "下拉层 id（无障碍）",
  },
  { name: "class", type: "string", default: "-", description: "包装器 class" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Button, Dropdown } from "@dreamer/ui-view";

const [open, setOpen] = createSignal(false);
const overlay = <ul class="py-1 list-none m-0">...</ul>;
<Dropdown
  open={open()}
  onOpenChange={setOpen}
  overlay={overlay}
  trigger="click"
  placement="bottomLeft"
>
  <Button variant="default">点击展开</Button>
</Dropdown>`;

const exampleClick = `<Dropdown
  open={open()}
  onOpenChange={setOpen}
  overlay={overlay}
  trigger="click"
  placement="bottomLeft"
>
  <Button variant="default">点击展开</Button>
</Dropdown>`;

const exampleHover = `<Dropdown
  open={openHover()}
  onOpenChange={setOpenHover}
  overlay={overlay}
  trigger="hover"
  placement="bottom"
>
  <span class="...">悬停展开</span>
</Dropdown>`;

const exampleDisabled = `<Dropdown
  overlay={overlay}
  trigger="click"
  disabled
>
  <Button variant="default" disabled>禁用下拉</Button>
</Dropdown>`;

export default function NavigationDropdown() {
  const [open, setOpen] = createSignal(false);
  const [openHover, setOpenHover] = createSignal(false);

  const overlay = (
    <ul class="py-1 list-none m-0">
      <li>
        <a
          href="#"
          class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={() => setOpen(false)}
        >
          操作一
        </a>
      </li>
      <li>
        <a
          href="#"
          class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={() => setOpen(false)}
        >
          操作二
        </a>
      </li>
    </ul>
  );

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Dropdown 下拉菜单</Title>
        <Paragraph class="mt-2">
          下拉菜单：children、overlay、open、defaultOpen、onOpenChange、trigger、hoverOpenDelay、hoverCloseDelay、placement、disabled、overlayClass、overlayId。
          使用 Tailwind v4，支持 light/dark 主题。
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
          <Title level={3}>trigger=click</Title>
          <Dropdown
            open={open()}
            onOpenChange={setOpen}
            overlay={overlay}
            trigger="click"
            placement="bottomLeft"
          >
            <Button type="button" variant="default">点击展开</Button>
          </Dropdown>
          <CodeBlock
            title="代码示例"
            code={exampleClick}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>trigger=hover</Title>
          <Dropdown
            open={openHover()}
            onOpenChange={setOpenHover}
            overlay={overlay}
            trigger="hover"
            placement="bottom"
          >
            <span class="inline-block px-4 py-2 border border-slate-300 rounded cursor-pointer">
              悬停展开
            </span>
          </Dropdown>
          <CodeBlock
            title="代码示例"
            code={exampleHover}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>disabled</Title>
          <Dropdown overlay={overlay} trigger="click" disabled>
            <Button type="button" variant="default" disabled>禁用下拉</Button>
          </Dropdown>
          <CodeBlock
            title="代码示例"
            code={exampleDisabled}
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
          组件接收以下属性。
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
              {DROPDOWN_API.map((row) => (
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
