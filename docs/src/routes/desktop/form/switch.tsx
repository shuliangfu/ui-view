/**
 * Switch 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/switch
 */

import {
  CodeBlock,
  Form,
  FormItem,
  Paragraph,
  Switch,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const SWITCH_API: ApiRow[] = [
  {
    name: "checked",
    type: "boolean | (() => boolean)",
    default: "-",
    description: "是否开启；可为 getter",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  {
    name: "error",
    type: "boolean",
    default: "false",
    description: "错误状态（红框）",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更回调",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  {
    name: "checkedChildren",
    type: "unknown",
    default: "-",
    description: "开启时文案或节点",
  },
  {
    name: "unCheckedChildren",
    type: "unknown",
    default: "-",
    description: "关闭时文案或节点",
  },
];

const importCode = `import { Switch, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const [checked, setChecked] = createSignal(false);
<FormItem label="开关">
  <Switch
    checked={checked}
    onChange={(e) => setChecked((e.target as HTMLInputElement).checked)}
  />
</FormItem>`;

export default function FormSwitch() {
  const [checked, setChecked] = createSignal(false);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Switch 开关</Title>
        <Paragraph class="mt-2">
          开关组件，支持
          checked、onChange、disabled、error、checkedChildren、unCheckedChildren。Tailwind
          v4 + light/dark。
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
            <Title level={3}>基础</Title>
            <FormItem label="开关">
              <Switch
                checked={checked}
                onChange={(e) =>
                  setChecked((e.target as HTMLInputElement).checked)}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch
  checked={checked}
  onChange={(e) => setChecked((e.target as HTMLInputElement).checked)}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>checkedChildren / unCheckedChildren</Title>
            <FormItem label="开/关文案">
              <Switch
                checked={checked}
                onChange={(e) =>
                  setChecked((e.target as HTMLInputElement).checked)}
                checkedChildren="开"
                unCheckedChildren="关"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch
  checked={checked}
  onChange={...}
  checkedChildren="开"
  unCheckedChildren="关"
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>name / id</Title>
            <FormItem label="表单字段">
              <Switch
                name="notify"
                id="switch-notify"
                checked={checked}
                onChange={(e) =>
                  setChecked((e.target as HTMLInputElement).checked)}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch
  name="notify"
  id="switch-notify"
  checked={checked}
  onChange={...}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>error / disabled</Title>
            <FormItem label="错误态">
              <Switch checked={false} error />
            </FormItem>
            <FormItem label="禁用未选">
              <Switch checked={false} disabled />
            </FormItem>
            <FormItem label="禁用已选">
              <Switch checked disabled />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch checked={false} error />
<Switch checked={false} disabled />
<Switch checked disabled />`}
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
              {SWITCH_API.map((row) => (
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
