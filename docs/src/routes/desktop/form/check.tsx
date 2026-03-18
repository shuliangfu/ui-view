/**
 * Checkbox、CheckboxGroup、RadioGroup、Switch 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/check
 */

import {
  Checkbox,
  CheckboxGroup,
  CodeBlock,
  Form,
  FormItem,
  Paragraph,
  RadioGroup,
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

const CHECKBOX_API: ApiRow[] = [
  {
    name: "checked",
    type: "boolean | (() => boolean)",
    default: "-",
    description: "是否选中；可为 getter",
  },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更（e.target.checked）",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  { name: "children", type: "any", default: "-", description: "标签内容" },
];

const CHECKBOX_GROUP_API: ApiRow[] = [
  {
    name: "options",
    type: "Array<{value, label, disabled?}>",
    default: "-",
    description: "选项列表",
  },
  {
    name: "value",
    type: "string[] | (() => string[])",
    default: "-",
    description: "当前选中值数组",
  },
  {
    name: "onChange",
    type: "(value: string[]) => void",
    default: "-",
    description: "变更回调",
  },
  {
    name: "direction",
    type: "vertical | horizontal",
    default: "vertical",
    description: "布局方向",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "整组禁用",
  },
  { name: "error", type: "boolean", default: "false", description: "错误状态" },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const RADIO_GROUP_API: ApiRow[] = [
  {
    name: "name",
    type: "string",
    default: "-",
    description: "原生 name（必填以互斥）",
  },
  {
    name: "options",
    type: "Array<{value, label, disabled?}>",
    default: "-",
    description: "选项列表",
  },
  {
    name: "value",
    type: "string | (() => string)",
    default: "-",
    description: "当前选中值",
  },
  {
    name: "onChange",
    type: "(value: string) => void",
    default: "-",
    description: "变更回调",
  },
  {
    name: "direction",
    type: "vertical | horizontal",
    default: "vertical",
    description: "布局方向",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "整组禁用",
  },
  { name: "error", type: "boolean", default: "false", description: "错误状态" },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const SWITCH_API: ApiRow[] = [
  {
    name: "checked",
    type: "boolean | (() => boolean)",
    default: "-",
    description: "是否选中；可为 getter",
  },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更（e.target.checked）",
  },
  {
    name: "checkedChildren",
    type: "any",
    default: "-",
    description: "选中时文案/节点",
  },
  {
    name: "unCheckedChildren",
    type: "any",
    default: "-",
    description: "未选中时文案/节点",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  { name: "error", type: "boolean", default: "false", description: "错误状态" },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const checkboxOptions = [
  { value: "x", label: "选项 X" },
  { value: "y", label: "选项 Y" },
  { value: "z", label: "选项 Z" },
];

const radioOptions = [
  { value: "r1", label: "单选 1" },
  { value: "r2", label: "单选 2" },
  { value: "r3", label: "单选 3" },
];

const importCode =
  `import { Checkbox, CheckboxGroup, RadioGroup, Switch, Form, FormItem } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const [cb, setCb] = createSignal(false);
const [groupVal, setGroupVal] = createSignal<string[]>([]);
const [radioVal, setRadioVal] = createSignal("r1");
const [sw, setSw] = createSignal(false);

<Checkbox
  checked={cb()}
  onChange={(e) => setCb((e.target as HTMLInputElement).checked)}
>
  勾选我
</Checkbox>
<CheckboxGroup options={...} value={groupVal()} onChange={setGroupVal} />
<RadioGroup name="radio-demo" options={...} value={radioVal()} onChange={setRadioVal} />
<Switch
  checked={sw()}
  onChange={(e) => setSw((e.target as HTMLInputElement).checked)}
/>`;

export default function FormCheck() {
  const [checkboxVal, setCheckboxVal] = createSignal(false);
  const [checkboxGroupVal, setCheckboxGroupVal] = createSignal<string[]>([]);
  const [radioVal, setRadioVal] = createSignal("r1");
  const [switchVal, setSwitchVal] = createSignal(false);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>
          Checkbox / CheckboxGroup / RadioGroup / Switch 勾选与开关
        </Title>
        <Paragraph class="mt-2">
          Checkbox：单选框；CheckboxGroup：多选组（options、value、onChange）；RadioGroup：单选组（name、options、value、onChange）；Switch：开关（checked、onChange、checkedChildren、unCheckedChildren、disabled、error）。Tailwind
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
            <Title level={3}>Checkbox</Title>
            <FormItem label="Checkbox">
              <Checkbox
                checked={checkboxVal()}
                onChange={(e) =>
                  setCheckboxVal((e.target as HTMLInputElement).checked)}
              >
                勾选我
              </Checkbox>
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Checkbox
  checked={checkboxVal()}
  onChange={(e) => setCheckboxVal((e.target as HTMLInputElement).checked)}
>
  勾选我
</Checkbox>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>CheckboxGroup</Title>
            <FormItem label="CheckboxGroup">
              <CheckboxGroup
                options={checkboxOptions}
                value={checkboxGroupVal()}
                onChange={(v) => setCheckboxGroupVal(v)}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<CheckboxGroup
  options={...}
  value={checkboxGroupVal()}
  onChange={setCheckboxGroupVal}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>RadioGroup</Title>
            <FormItem label="RadioGroup">
              <RadioGroup
                name="radio-demo"
                options={radioOptions}
                value={radioVal()}
                onChange={(v) => setRadioVal(v)}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<RadioGroup
  name="radio-demo"
  options={...}
  value={radioVal()}
  onChange={setRadioVal}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>Switch 基础与自定义文案</Title>
            <FormItem label="Switch">
              <Switch
                checked={switchVal()}
                onChange={(e) =>
                  setSwitchVal((e.target as HTMLInputElement).checked)}
              />
            </FormItem>
            <FormItem label="Switch 自定义文案">
              <Switch
                checked={switchVal()}
                onChange={(e) =>
                  setSwitchVal((e.target as HTMLInputElement).checked)}
                checkedChildren="开"
                unCheckedChildren="关"
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch
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
            <Title level={3}>Switch disabled</Title>
            <FormItem label="禁用">
              <Switch checked={false} disabled />
              <Switch checked disabled class="ml-4" />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Switch disabled />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>
        </Form>
      </section>

      <section class="space-y-6">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          四个组件属性如下（均为可选）。
        </Paragraph>

        {[
          { title: "Checkbox", rows: CHECKBOX_API },
          { title: "CheckboxGroup", rows: CHECKBOX_GROUP_API },
          { title: "RadioGroup", rows: RADIO_GROUP_API },
          { title: "Switch", rows: SWITCH_API },
        ].map(({ title, rows }) => (
          <div key={title}>
            <Title level={3}>{title}</Title>
            <div class="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
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
                  {rows.map((row) => (
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
          </div>
        ))}
      </section>
    </div>
  );
}
