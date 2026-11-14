/**
 * SignaturePad 文档页。路由: /mobile/form/signature-pad
 */

import { SignaturePad } from "@dreamer/ui-view/mobile/form/signature-pad";
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
import { MESSAGES_SIGNATURE_PAD } from "../../../data/component-messages-rows.ts";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

const API: DocsApiTableRow[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"md"',
    description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  },
  { name: "height", type: "number", default: "180", description: "高度" },
  { name: "penColor", type: "string", default: "#0f172a", description: "笔色" },
  {
    name: "onChange",
    type: "(dataUrl|null)=>void",
    default: "-",
    description: "变更",
  },
  {
    name: "messages",
    type: "Partial<SignaturePadMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode =
  `import { SignaturePad } from "@dreamer/ui-view/mobile/form/signature-pad";

<SignaturePad
  onChange={(dataUrl) => console.log("stroke", dataUrl?.slice(0, 32))}
/>`;

const exampleDemo = `<SignaturePad height={160} />`;

/**
 * createForm 演示字段：SignaturePad onChange 为 dataUrl string|null，
 * 表单侧用 string 字段（空串表示未签／已清空）。
 */
type SignatureCreateFormValues = { signature: string };

/** 与 createForm 联用演示 store */
const signatureCreateForm = createForm<SignatureCreateFormValues>({
  initialValues: { signature: "" },
  fields: {
    signature: { rules: [formRules.required("请签名")] },
  },
});

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "SignaturePad · ui-view",
};

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>SignaturePad</Title>
        <Paragraph>
          Canvas 手写签名，可清空并导出。与{" "}
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
          <code class="text-sm">onChange(dataUrl|null)</code>
          ，字段用 string，展开{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            {"{...form.bindValue(name)}"}
          </code>
          （清空时写入空串）。
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
            form={signatureCreateForm}
            layout="vertical"
            class="w-full"
            onFinish={() => {
              message.success("已提交");
            }}
          >
            <FormItem name="signature" label="签名">
              {(() => {
                // SignaturePad 无 value；取 bindValue 的 onChange/error，null 写空串
                const { error, onChange } = signatureCreateForm.bindValue(
                  "signature",
                );
                return (
                  <SignaturePad
                    height={160}
                    error={error}
                    onChange={(dataUrl: string | null) => {
                      onChange(dataUrl ?? "");
                    }}
                  />
                );
              })()}
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
import { SignaturePad } from "@dreamer/ui-view/mobile/form/signature-pad";

const form = createForm({
  initialValues: { signature: "" },
  fields: { signature: { rules: [formRules.required("请签名")] } },
});

// SignaturePad 无 value 受控；用 bindValue 的 onChange，或手动 setFieldValue
const { onChange, error } = form.bindValue("signature");

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="signature" label="签名">
    <SignaturePad
      error={error}
      onChange={(dataUrl) => onChange(dataUrl ?? "")}
    />
  </FormItem>
</Form>`}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
        <MobileDocDemo>
          <div class="p-3">
            <SignaturePad height={160} />
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
          <div class="p-3 flex flex-col gap-3">
            <SignaturePad size="xs" />
            <SignaturePad size="sm" />
            <SignaturePad size="md" />
            <SignaturePad size="lg" />
          </div>
        </MobileDocDemo>
        <CodeBlock
          title="代码示例"
          code={`<SignaturePad size="xs" />
<SignaturePad size="sm" />
<SignaturePad size="md" />
<SignaturePad size="lg" />`}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>
      <DocsMessagesSection
        interfaceName="SignaturePadMessages"
        defaultExportName="defaultSignaturePadMessages"
        rows={MESSAGES_SIGNATURE_PAD}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
