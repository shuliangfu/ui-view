/**
 * PasscodeInput 文档页。路由: /mobile/form/passcode-input
 */

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
import { MESSAGES_PASSCODE_INPUT } from "../../../data/component-messages-rows.ts";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

const API: DocsApiTableRow[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"md"',
    description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  },
  {
    name: "value",
    type: "MaybeSignal<string>",
    default: "-",
    description: "受控值",
  },
  { name: "length", type: "number", default: "6", description: "位数" },
  { name: "mask", type: "boolean", default: "false", description: "掩码" },
  {
    name: "onFinish",
    type: "(v)=>void",
    default: "-",
    description: "填满回调",
  },
  {
    name: "messages",
    type: "Partial<PasscodeInputMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode =
  `import { PasscodeInput } from "@dreamer/ui-view/mobile/form/passcode-input";

<PasscodeInput
  length={6}
  mask
  onChange={(v) => console.log("change", v)}
  onFinish={(v) => console.log("finish", v)}
/>`;

const exampleDemo = `<PasscodeInput length={6} />`;

/** createForm 演示字段（onChange(value) → bindValue） */
type PasscodeCreateFormValues = { code: string };

/** 与 createForm 联用演示 store */
const passcodeCreateForm = createForm<PasscodeCreateFormValues>({
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

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "PasscodeInput · ui-view",
};

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>PasscodeInput</Title>
        <Paragraph>
          等宽验证码／密码格输入。与{" "}
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
          联用：
          <code class="text-sm">onChange(value)</code>，展开{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            {"{...form.bindValue(name)}"}
          </code>
          。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          code={importCode}
          language="tsx"
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <Title level={3}>与 createForm</Title>
        <MobileDocDemo>
          <Form
            form={passcodeCreateForm}
            layout="vertical"
            class="w-full"
            onFinish={() => {
              message.success("已提交");
            }}
          >
            <FormItem name="code" label="验证码">
              <div class="flex justify-center">
                <PasscodeInput
                  {...passcodeCreateForm.bindValue("code")}
                  length={6}
                />
              </div>
            </FormItem>
            <Button type="submit" variant="primary" class="w-full">
              提交
            </Button>
          </Form>
        </MobileDocDemo>
        <CodeBlock
          title="代码示例"
          code={`import { createForm } from "@dreamer/ui-view/form/create-form";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Form } from "@dreamer/ui-view/mobile/form/form";
import { FormItem } from "@dreamer/ui-view/mobile/form/form-item";
import { PasscodeInput } from "@dreamer/ui-view/mobile/form/passcode-input";

const form = createForm({
  initialValues: { code: "" },
  fields: {
    code: {
      rules: [formRules.required(), formRules.pattern(/^\\d{6}$/)],
    },
  },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="code" label="验证码">
    <PasscodeInput {...form.bindValue("code")} length={6} />
  </FormItem>
</Form>`}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
        <MobileDocDemo>
          <div class="p-4 flex justify-center">
            <PasscodeInput length={6} />
          </div>
        </MobileDocDemo>
        <CodeBlock
          title="代码示例"
          code={exampleDemo}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
        <Title level={3}>size（xs / sm / md / lg）</Title>
        <MobileDocDemo>
          <div class="p-4 flex flex-col items-center gap-3">
            <PasscodeInput size="xs" length={4} />
            <PasscodeInput size="sm" length={4} />
            <PasscodeInput size="md" length={4} />
            <PasscodeInput size="lg" length={4} />
          </div>
        </MobileDocDemo>
        <CodeBlock
          title="代码示例"
          code={`<PasscodeInput size="xs" length={4} />
<PasscodeInput size="sm" length={4} />
<PasscodeInput size="md" length={4} />
<PasscodeInput size="lg" length={4} />`}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>
      <DocsMessagesSection
        interfaceName="PasscodeInputMessages"
        defaultExportName="defaultPasscodeInputMessages"
        rows={MESSAGES_PASSCODE_INPUT}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
