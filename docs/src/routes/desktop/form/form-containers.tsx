/**
 * Form / FormItem / FormList / createForm 表单容器与表单项文档。
 * 路由: /desktop/form/form-containers
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";

import type { FormListRenderRowContext } from "@dreamer/ui-view/form/form-list";
import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { FormList } from "@dreamer/ui-view/form/form-list";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Checkbox } from "@dreamer/ui-view/form/checkbox";
import { Input } from "@dreamer/ui-view/form/input";
import { Password } from "@dreamer/ui-view/form/password";
import { RadioGroup } from "@dreamer/ui-view/form/radio-group";
import { Select } from "@dreamer/ui-view/form/select";
import { Switch } from "@dreamer/ui-view/form/switch";

import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";

import {
  CREATE_FORM_OPTIONS_API,
  FORM_API,
  FORM_ITEM_API,
  FORM_RULES_API,
  FORM_STORE_API,
  type FormDocsApiRow,
} from "./form-item-api.ts";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_FORM_LIST } from "../../../data/component-messages-rows.ts";

/** FormList 动态列表属性说明 */
const FORM_LIST_API: FormDocsApiRow[] = [
  {
    name: "items",
    type:
      "unknown[] | number | (() => unknown[] | number) | Signal<unknown[] | number>",
    default: "-",
    description:
      "列表长度：数组用 length，number 仅表示行数。请传行数 signal 本身，勿写 items={count.value}",
  },
  {
    name: "onAdd",
    type: "() => void",
    default: "-",
    description: "点击「添加」时回调；不传则不渲染添加按钮",
  },
  {
    name: "onRemove",
    type: "(index: number) => void",
    default: "-",
    description: "点击某行「删除」时回调；不传则不渲染删除按钮",
  },
  {
    name: "addButtonText",
    type: "string",
    default: '"添加一项"',
    description: "添加按钮文案",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "外层容器 class",
  },
  {
    name: "renderRow",
    type: "(index, ctx) => unknown",
    default: "-",
    description:
      "按行渲染；ctx.removeButton 在传了 onRemove 时为删除按钮，请赋给 FormItem.trailing",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "无 renderRow 时每行挂载同一模板；按索引变化请用 renderRow",
  },
  {
    name: "messages",
    type: "Partial<FormListMessages>",
    default: "-",
    description: "本地化文案；addButtonText 仍优先于 messages.addButton",
  },
];

/** createForm 演示字段形状（显式泛型，保证 bind().value 为 Signal<string>） */
type DemoFormValues = {
  username: string;
  email: string;
  password: string;
  password2: string;
};

/**
 * createForm 演示 store（模块级，避免文档页重跑丢失状态）。
 */
const demoForm = createForm<DemoFormValues>({
  initialValues: {
    username: "",
    email: "",
    password: "",
    password2: "",
  },
  fields: {
    username: {
      rules: [
        formRules.required("请输入用户名"),
        formRules.min(2),
        formRules.max(32),
        formRules.pattern(
          /^[A-Za-z][A-Za-z0-9_]*$/,
          "字母开头，仅字母数字下划线",
        ),
      ],
    },
    email: {
      rules: [formRules.required(), formRules.email()],
    },
    password: {
      rules: [formRules.required(), formRules.min(6, "至少 6 位")],
    },
    password2: {
      rules: [
        formRules.required("请确认密码"),
        formRules.equalsField("password"),
      ],
    },
  },
});

const demoSubmitResult = createSignal("");

/** 绑定变体演示：bind / bindChecked / bindValue */
type BindVariantValues = {
  city: string;
  agree: boolean;
  notify: boolean;
  level: string;
};

const bindVariantForm = createForm<BindVariantValues>({
  initialValues: {
    city: "",
    agree: false,
    notify: true,
    level: "a",
  },
  fields: {
    city: { rules: [formRules.required("请选择城市")] },
    agree: {
      rules: [
        formRules.custom((v) => (v === true ? undefined : "请勾选同意")),
      ],
    },
    level: { rules: [formRules.required()] },
  },
});

/**
 * FormList 动态行示例的状态。
 */
const formListRowValues = createSignal<string[]>(["", ""]);
const formListLength = createSignal(formListRowValues.value.length);

function formListDocOnAdd(): void {
  formListRowValues.value = [...formListRowValues.value, ""];
  formListLength.value = formListRowValues.value.length;
}

function formListDocOnRemove(index: number): void {
  formListRowValues.value = formListRowValues.value.filter((_, j) =>
    j !== index
  );
  formListLength.value = formListRowValues.value.length;
}

function renderFormListDocRow(
  index: number,
  ctx: FormListRenderRowContext,
): unknown {
  const { removeButton } = ctx;
  return (
    <FormItem
      label={`条目 ${index + 1}`}
      id={`form-list-row-${index}`}
      trailing={removeButton}
    >
      <Input
        id={`form-list-row-${index}`}
        placeholder={`第 ${index + 1} 行`}
        value={() => formListRowValues.value[index] ?? ""}
        onInput={(e) => {
          const v = (e.target as HTMLInputElement).value;
          const next = [...formListRowValues.value];
          next[index] = v;
          formListRowValues.value = next;
        }}
      />
    </FormItem>
  );
}

const importCode =
  `import { createForm, formRules } from "@dreamer/ui-view/form";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Input } from "@dreamer/ui-view/form/input";
import { Password } from "@dreamer/ui-view/form/password";

const form = createForm({
  initialValues: { email: "", password: "" },
  fields: {
    email: { rules: [formRules.required(), formRules.email()] },
    password: { rules: [formRules.required(), formRules.min(6)] },
  },
});

<Form form={form} onFinish={async (values) => { /* 提交 values */ }}>
  <FormItem name="email" label="邮箱">
    <Input {...form.bind("email")} />
  </FormItem>
  <FormItem name="password" label="密码">
    <Password {...form.bind("password")} />
  </FormItem>
  <Button type="submit">提交</Button>
</Form>`;

function ApiTable({ rows }: { rows: FormDocsApiRow[] }) {
  return (
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
  );
}

const exampleFormLayout = `<Form layout="horizontal">…</Form>
<Form layout="vertical">…</Form>
<Form layout="inline">…</Form>`;

const exampleFormItem = `<FormItem label="用户名" required labelPosition="top">
  <Input />
</FormItem>
<FormItem label="邮箱" labelPosition="left">
  <Input />
</FormItem>
<FormItem label="手机号" required labelPosition="outline">
  <Input />
</FormItem>`;

const exampleCreateForm = `const form = createForm({
  initialValues: { username: "", email: "", password: "", password2: "" },
  fields: {
    username: { rules: [formRules.required(), formRules.min(2)] },
    email: { rules: [formRules.required(), formRules.email()] },
    password: { rules: [formRules.required(), formRules.min(6)] },
    password2: {
      rules: [formRules.required(), formRules.equalsField("password")],
    },
  },
});

<Form
  form={form}
  onFinish={async (values) => {
    message.success("已提交");
    console.log(values);
  }}
>
  <FormItem name="username" label="用户名">
    <Input {...form.bind("username")} />
  </FormItem>
  <FormItem name="email" label="邮箱">
    <Input {...form.bind("email")} />
  </FormItem>
  <FormItem name="password" label="密码">
    <Password {...form.bind("password")} showStrength />
  </FormItem>
  <FormItem name="password2" label="确认密码">
    <Password {...form.bind("password2")} />
  </FormItem>
  <div class="flex gap-2">
    <Button type="submit" variant="primary">提交</Button>
    <Button type="button" onClick={() => form.resetFields()}>重置</Button>
  </div>
</Form>`;

export default function FormContainersDoc() {
  return (
    <div class="space-y-10 w-full">
      <section>
        <Title level={1}>Form · FormItem · FormList · createForm</Title>
        <Paragraph class="mt-2">
          表单布局容器 <strong>Form</strong>、表单项{" "}
          <strong>FormItem</strong>、动态行{" "}
          <strong>FormList</strong>，以及轻量 store{" "}
          <strong>createForm</strong>（values / errors / touched、规则校验、
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            form.bind
          </code>
          ）。无 store 时 Form/FormItem 仍可纯展示；联用 store 后可少写手写
          signal 与错误态。具体输入控件见{" "}
          <Link
            href="/desktop/form/input"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Input
          </Link>{" "}
          等。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          code={importCode}
          language="tsx"
          showLineNumbers
          title="代码示例"
          wrapLongLines
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>createForm：校验 · 绑定 · 提交</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            用{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              createForm
            </code>{" "}
            持有状态；FormItem 传{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              name
            </code>
            （及可选{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              rules
            </code>
            ）注册字段并展示错误；控件展开{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              {"{...form.bind(name)}"}
            </code>
            。提交用{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              onFinish
            </code>
            （推荐）或{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              form.submit
            </code>
            。交叉字段用{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              formRules.equalsField
            </code>
            。
          </Paragraph>
          <Form
            form={demoForm}
            layout="vertical"
            class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
            onFinish={(values) => {
              demoSubmitResult.value = JSON.stringify(values);
              message.success("校验通过，已提交");
            }}
          >
            <FormItem name="username" label="用户名">
              <Input
                {...demoForm.bind("username")}
                placeholder="字母开头"
              />
            </FormItem>
            <FormItem name="email" label="邮箱">
              <Input
                {...demoForm.bind("email")}
                type="email"
                placeholder="you@example.com"
              />
            </FormItem>
            <FormItem name="password" label="密码">
              <Password
                {...demoForm.bind("password")}
                showStrength
                newPassword
                class="w-full"
              />
            </FormItem>
            <FormItem name="password2" label="确认密码">
              <Password
                {...demoForm.bind("password2")}
                class="w-full"
              />
            </FormItem>
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <Button type="submit" variant="primary">
                提交
              </Button>
              <Button
                type="button"
                onClick={() => {
                  demoForm.resetFields();
                  demoSubmitResult.value = "";
                }}
              >
                重置
              </Button>
              <span class="text-xs text-slate-500 dark:text-slate-400">
                dirty: {() => String(demoForm.dirty.value)}
                {" · "}
                submitting: {() => String(demoForm.submitting.value)}
              </span>
            </div>
            {() =>
              demoSubmitResult.value
                ? (
                  <p class="mt-2 break-all text-xs text-teal-700 dark:text-teal-300">
                    onFinish values: {demoSubmitResult.value}
                  </p>
                )
                : null}
          </Form>
          <CodeBlock
            title="代码示例"
            code={exampleCreateForm}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>
            bind 变体：Select · Checkbox · Switch · RadioGroup
          </Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              bind
            </code>{" "}
            用于 Event+value；
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              bindChecked
            </code>{" "}
            用于 Checkbox/Switch；
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              bindValue
            </code>{" "}
            用于 RadioGroup/Cascader/Rate/Upload 等值回调。Transfer 用{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              bindTargetKeys
            </code>
            。
          </Paragraph>
          <Form
            form={bindVariantForm}
            layout="vertical"
            class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
            onFinish={() => {
              message.success("变体表单校验通过");
            }}
          >
            <FormItem name="city" label="城市">
              <Select
                {...bindVariantForm.bind("city")}
                options={[
                  { value: "sh", label: "上海" },
                  { value: "bj", label: "北京" },
                ]}
                placeholder="请选择"
              />
            </FormItem>
            <FormItem name="agree" label="协议">
              <Checkbox {...bindVariantForm.bindChecked("agree")}>
                我已阅读并同意
              </Checkbox>
            </FormItem>
            <FormItem name="notify" label="通知">
              <Switch {...bindVariantForm.bindChecked("notify")} />
            </FormItem>
            <FormItem name="level" label="级别">
              <RadioGroup
                {...bindVariantForm.bindValue("level")}
                options={[
                  { value: "a", label: "A" },
                  { value: "b", label: "B" },
                ]}
              />
            </FormItem>
            <Button type="submit" variant="primary">
              校验并提交
            </Button>
          </Form>
          <CodeBlock
            title="代码示例"
            code={`const form = createForm({
  initialValues: { city: "", agree: false, notify: true, level: "a" },
});

<FormItem name="city"><Select {...form.bind("city")} options={…} /></FormItem>
<FormItem name="agree"><Checkbox {...form.bindChecked("agree")}>同意</Checkbox></FormItem>
<FormItem name="notify"><Switch {...form.bindChecked("notify")} /></FormItem>
<FormItem name="level"><RadioGroup {...form.bindValue("level")} options={…} /></FormItem>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>Form：layout</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            vertical（默认）、horizontal（md
            及以上横向）、inline（行内尾对齐）。无 store 时仍可纯布局使用。
          </Paragraph>
          <div class="grid gap-6 lg:grid-cols-1">
            <div class="space-y-2">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                vertical
              </p>
              <Form
                layout="vertical"
                class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
              >
                <FormItem label="账号" id="fc-v1">
                  <Input id="fc-v1" placeholder="vertical" value="" />
                </FormItem>
                <FormItem label="备注" id="fc-v2">
                  <Input id="fc-v2" placeholder="第二行" value="" />
                </FormItem>
              </Form>
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                horizontal
              </p>
              <Form
                layout="horizontal"
                class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
              >
                <FormItem label="账号" id="fc-h1">
                  <Input id="fc-h1" placeholder="horizontal" value="" />
                </FormItem>
                <FormItem label="备注" id="fc-h2">
                  <Input id="fc-h2" placeholder="第二项" value="" />
                </FormItem>
              </Form>
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                inline
              </p>
              <Form
                layout="inline"
                class="w-full border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
              >
                <FormItem label="关键词" id="fc-i1">
                  <Input id="fc-i1" placeholder="inline" value="" />
                </FormItem>
                <FormItem label="类型" id="fc-i2">
                  <Input id="fc-i2" placeholder="筛选" value="" />
                </FormItem>
              </Form>
            </div>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleFormLayout}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>FormItem：标签位置与必填</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              labelPosition="left"
            </code>{" "}
            与{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              labelAlign="right"
            </code>{" "}
            常用于对齐标签列；{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              labelPosition="outline"
            </code>{" "}
            把标签嵌进输入框边框左上缺口。联用 store 时也可只传{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              name
            </code>
            ，必填星号由 rules 推断。
          </Paragraph>
          <Form layout="vertical" class="w-full max-w-lg">
            <FormItem
              label="邮箱"
              required
              labelPosition="left"
              labelAlign="right"
              id="fc-email"
            >
              <Input
                id="fc-email"
                placeholder="左侧标签 + 右对齐"
                value=""
              />
            </FormItem>
            <FormItem
              label="手机号"
              required
              labelPosition="outline"
              id="fc-outline"
            >
              <Input id="fc-outline" value="" />
            </FormItem>
          </Form>
          <CodeBlock
            title="代码示例"
            code={exampleFormItem}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>FormList：动态增减行</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            父级持有数组状态；
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              items
            </code>{" "}
            传行数 signal。按行渲染请用{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              renderRow
            </code>
            。勿写{" "}
            <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
              items={"{"}rowValues.value.length{"}"}
            </code>
            ，以免订阅整表导致失焦。
          </Paragraph>
          <Form layout="vertical" class="w-full max-w-xl">
            <FormList
              items={formListLength}
              onAdd={formListDocOnAdd}
              onRemove={formListDocOnRemove}
              addButtonText="添加一行"
              renderRow={renderFormListDocRow}
            />
          </Form>
          <CodeBlock
            code={`const rowValues = createSignal<string[]>(["", ""]);
const rowCount = createSignal(rowValues.value.length);

function onAdd() {
  rowValues.value = [...rowValues.value, ""];
  rowCount.value = rowValues.value.length;
}
function onRemove(i: number) {
  rowValues.value = rowValues.value.filter((_, j) => j !== i);
  rowCount.value = rowValues.value.length;
}

function renderRow(index: number, { removeButton }: { removeButton: unknown }) {
  return (
    <FormItem label={\`条目 \${index + 1}\`} trailing={removeButton}>
      <Input
        value={() => rowValues.value[index] ?? ""}
        onInput={(e) => {
          const next = [...rowValues.value];
          next[index] = (e.target as HTMLInputElement).value;
          rowValues.value = next;
        }}
      />
    </FormItem>
  );
}

<FormList items={rowCount} onAdd={onAdd} onRemove={onRemove} renderRow={renderRow} />`}
            language="tsx"
            showLineNumbers
            copyable
            title="代码示例"
            wrapLongLines
          />
        </div>
      </section>

      <section class="space-y-6">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          Form / FormItem 无 store 时行为与升级前兼容；createForm 为可选增强层。
        </Paragraph>

        <div class="space-y-2">
          <Title level={3}>Form</Title>
          <ApiTable rows={FORM_API} />
        </div>

        <div class="space-y-2">
          <Title level={3}>FormItem</Title>
          <ApiTable rows={FORM_ITEM_API} />
        </div>

        <div class="space-y-2">
          <Title level={3}>createForm(options)</Title>
          <ApiTable rows={CREATE_FORM_OPTIONS_API} />
        </div>

        <div class="space-y-2">
          <Title level={3}>FormStore</Title>
          <ApiTable rows={FORM_STORE_API} />
        </div>

        <div class="space-y-2">
          <Title level={3}>formRules</Title>
          <ApiTable rows={FORM_RULES_API} />
        </div>

        <DocsMessagesSection
          interfaceName="FormListMessages"
          defaultExportName="defaultFormListMessages"
          rows={MESSAGES_FORM_LIST}
        />

        <div class="space-y-2">
          <Title level={3}>FormList</Title>
          <ApiTable rows={FORM_LIST_API} />
        </div>
      </section>
    </div>
  );
}
