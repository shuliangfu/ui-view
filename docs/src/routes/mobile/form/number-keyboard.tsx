/**
 * NumberKeyboard 文档页。路由: /mobile/form/number-keyboard
 */

import { createSignal } from "@dreamer/view";
import { MobilePortalHostScope } from "@dreamer/ui-view/mobile/portal";
import { NumberKeyboard } from "@dreamer/ui-view/mobile/form/number-keyboard";
import { PasscodeInput } from "@dreamer/ui-view/mobile/form/passcode-input";
import { Form } from "@dreamer/ui-view/mobile/form/form";
import { FormItem } from "@dreamer/ui-view/mobile/form/form-item";
import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import { createForm } from "@dreamer/ui-view/form/create-form";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { message } from "@dreamer/ui-view/feedback";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_NUMBER_KEYBOARD } from "../../../data/component-messages-rows.ts";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"md"',
    description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  },
  {
    name: "open",
    type: "ControlledOpenInput",
    default: "-",
    description: "是否打开",
  },
  {
    name: "onInput",
    type: "(key: string) => void",
    default: "-",
    description: "按键输入",
  },
  { name: "onDelete", type: "() => void", default: "-", description: "删除" },
  { name: "onConfirm", type: "() => void", default: "-", description: "确认" },
  {
    name: "decimal",
    type: "boolean",
    default: "false",
    description: "是否显示小数点",
  },
  { name: "onClose", type: "() => void", default: "-", description: "关闭" },
  {
    name: "messages",
    type: "Partial<NumberKeyboardMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { NumberKeyboard } from "@dreamer/ui-view/mobile/form/number-keyboard";

const open = createSignal(false);

<NumberKeyboard
  open={open}
  decimal
  onInput={(key) => console.log("input", key)}
  onDelete={() => console.log("delete")}
  onClose={() => (open.value = false)}
/>`;

const exampleDemo = `const open = createSignal(false);
const value = createSignal("");
<NumberKeyboard open={open} value={value} onClose={() => (open.value = false)} />`;

/**
 * NumberKeyboard 不是字段所有者：onInput / onDelete 里调用 form.setFieldValue，
 * 驱动已 bind / bindValue 的 Input / PasscodeInput。
 */
type KeyboardCreateFormValues = { code: string };

/** createForm + 键盘写入演示 store（模块级） */
const keyboardCreateForm = createForm<KeyboardCreateFormValues>({
  initialValues: { code: "" },
  fields: {
    code: {
      rules: [
        formRules.required("请输入验证码"),
        formRules.pattern(/^\d{6}$/, "须为 6 位数字"),
      ],
    },
  },
});

/** 与 createForm 示例共用的键盘开关（模块级） */
const keyboardCreateFormOpen = createSignal(false);

export default function Page() {
  const open = createSignal(false);
  const digits = createSignal("");
  const sizeOpen = createSignal(false);
  const kbSize = createSignal<"xs" | "sm" | "md" | "lg">("md");
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>NumberKeyboard</Title>
        <Paragraph>
          底部数字键盘，可配合 PasscodeInput / Input。键盘本身不持有表单字段：在
          {" "}
          <code class="text-sm">onInput</code> /{" "}
          <code class="text-sm">onDelete</code> 中调用{" "}
          <code class="text-sm">form.setFieldValue</code>
          ，写入已绑定的控件。与{" "}
          <Link
            href="/mobile/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Form / createForm（移动）
          </Link>
          、
          <Link
            href="/desktop/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            桌面 Form 容器
          </Link>{" "}
          联用说明见下。示例限制在机内 Portal Scope。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <Title level={3}>与 createForm</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          PasscodeInput 用 <code class="text-sm">bindValue</code>
          ；键盘按键通过 <code class="text-sm">setFieldValue</code>{" "}
          追加／删除字符（亦可同样驱动 <code class="text-sm">Input</code> +{" "}
          <code class="text-sm">bind</code>）。
        </Paragraph>
        <MobileDocDemo class="flex min-h-[360px] flex-col p-4">
          <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col gap-3">
            <Form
              form={keyboardCreateForm}
              layout="vertical"
              class="w-full"
              onFinish={() => {
                message.success("已提交");
              }}
            >
              <FormItem name="code" label="验证码">
                <div class="flex justify-center">
                  <PasscodeInput
                    {...keyboardCreateForm.bindValue("code")}
                    length={6}
                  />
                </div>
              </FormItem>
              <Button
                type="button"
                onClick={() => {
                  keyboardCreateFormOpen.value = true;
                }}
              >
                打开数字键盘
              </Button>
              <NumberKeyboard
                open={keyboardCreateFormOpen}
                onInput={(k: string) => {
                  const cur = String(
                    keyboardCreateForm.getFieldValue("code") ?? "",
                  );
                  if (cur.length >= 6) return;
                  keyboardCreateForm.setFieldValue("code", cur + k);
                }}
                onDelete={() => {
                  const cur = String(
                    keyboardCreateForm.getFieldValue("code") ?? "",
                  );
                  keyboardCreateForm.setFieldValue(
                    "code",
                    cur.slice(0, -1),
                  );
                }}
                onClose={() => {
                  keyboardCreateFormOpen.value = false;
                }}
              />
              <Button type="submit" variant="primary" class="w-full">
                提交
              </Button>
            </Form>
          </MobilePortalHostScope>
        </MobileDocDemo>
        <CodeBlock
          title="代码示例"
          code={`import { createForm } from "@dreamer/ui-view/form/create-form";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Form } from "@dreamer/ui-view/mobile/form/form";
import { FormItem } from "@dreamer/ui-view/mobile/form/form-item";
import { PasscodeInput } from "@dreamer/ui-view/mobile/form/passcode-input";
import { NumberKeyboard } from "@dreamer/ui-view/mobile/form/number-keyboard";
import { Input } from "@dreamer/ui-view/mobile/form/input";

const form = createForm({
  initialValues: { code: "" },
  fields: { code: { rules: [formRules.required(), formRules.pattern(/^\\d{6}$/)] } },
});
const open = createSignal(false);

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="code" label="验证码">
    <PasscodeInput {...form.bindValue("code")} length={6} />
    {/* 或: <Input {...form.bind("code")} readOnly /> */}
  </FormItem>
  <Button type="button" onClick={() => (open.value = true)}>打开键盘</Button>
  <NumberKeyboard
    open={open}
    onInput={(k) => {
      const cur = String(form.getFieldValue("code") ?? "");
      if (cur.length >= 6) return;
      form.setFieldValue("code", cur + k);
    }}
    onDelete={() => {
      const cur = String(form.getFieldValue("code") ?? "");
      form.setFieldValue("code", cur.slice(0, -1));
    }}
    onClose={() => { open.value = false; }}
  />
</Form>`}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
        />
        <MobileDocDemo class="flex min-h-[360px] flex-col p-4">
          <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col gap-3">
            <div class="flex justify-center">
              <PasscodeInput
                length={6}
                value={digits}
                onChange={(v: string) => {
                  digits.value = v;
                }}
              />
            </div>
            <Button type="button" onClick={() => (open.value = true)}>
              打开数字键盘
            </Button>
            <NumberKeyboard
              open={open}
              onInput={(k: string) => {
                if (digits.value.length >= 6) return;
                digits.value = digits.value + k;
              }}
              onDelete={() => {
                digits.value = digits.value.slice(0, -1);
              }}
              onClose={() => (open.value = false)}
            />
          </MobilePortalHostScope>
        </MobileDocDemo>
        <CodeBlock
          title="代码示例"
          code={exampleDemo}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
        />
        <Title level={3}>size（xs / sm / md / lg）</Title>
        <MobileDocDemo class="flex min-h-[360px] flex-col p-4">
          <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col gap-3">
            <div class="flex flex-wrap justify-center gap-2">
              {(["xs", "sm", "md", "lg"] as const).map((s) => (
                <Button
                  type="button"
                  onClick={() => {
                    kbSize.value = s;
                    sizeOpen.value = true;
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
            {() => (
              <NumberKeyboard
                size={kbSize.value}
                open={sizeOpen}
                onClose={() => (sizeOpen.value = false)}
              />
            )}
          </MobilePortalHostScope>
        </MobileDocDemo>
        <CodeBlock
          title="代码示例"
          code={`<NumberKeyboard size="xs" open={open} />
<NumberKeyboard size="sm" open={open} />
<NumberKeyboard size="md" open={open} />
<NumberKeyboard size="lg" open={open} />`}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
        />
      </section>
      <DocsMessagesSection
        interfaceName="NumberKeyboardMessages"
        defaultExportName="defaultNumberKeyboardMessages"
        rows={MESSAGES_NUMBER_KEYBOARD}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
