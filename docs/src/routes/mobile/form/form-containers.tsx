/**
 * 移动端 Form / createForm 简要文档。
 * 路由: /mobile/form/form-containers
 */

import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/basic";
import { createForm } from "@dreamer/ui-view/form/create-form";
import { Form } from "@dreamer/ui-view/mobile/form/form";
import { FormItem } from "@dreamer/ui-view/mobile/form/form-item";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Input } from "@dreamer/ui-view/mobile/form/input";
import { Password } from "@dreamer/ui-view/mobile/form/password";
import { PasscodeInput } from "@dreamer/ui-view/mobile/form/passcode-input";
import { CodeBlock } from "@dreamer/ui-view/data-display";
import { message } from "@dreamer/ui-view/feedback";

type MobileDemoValues = {
  account: string;
  password: string;
  code: string;
};

const mobileForm = createForm<MobileDemoValues>({
  initialValues: { account: "", password: "", code: "" },
  fields: {
    account: { rules: [formRules.required("请输入账号")] },
    password: { rules: [formRules.required(), formRules.min(6)] },
    code: {
      rules: [
        formRules.required("请输入验证码"),
        formRules.pattern(/^\d{4,6}$/, "4～6 位数字"),
      ],
    },
  },
});

export default function MobileFormContainersDoc() {
  return (
    <div class="space-y-8 w-full">
      <section>
        <Title level={1}>Form · createForm（移动）</Title>
        <Paragraph class="mt-2">
          与桌面共用{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            createForm
          </code>
          /
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            formRules
          </code>
          。移动控件同样可用{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            bind
          </code>
          /
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            bindValue
          </code>
          。完整说明见{" "}
          <Link
            href="/desktop/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            桌面 Form 容器
          </Link>
          。NumberKeyboard 为辅助键盘，请{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            onInput
          </code>{" "}
          写入{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            form.setFieldValue
          </code>
          。
        </Paragraph>
      </section>

      <section class="space-y-4">
        <Title level={2}>示例</Title>
        <Title level={3}>与 createForm</Title>
        <Form
          form={mobileForm}
          layout="vertical"
          class="w-full max-w-md border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4"
          onFinish={() => {
            message.success("已提交");
          }}
        >
          <FormItem name="account" label="账号">
            <Input
              {...mobileForm.bind("account")}
              placeholder="账号"
              class="w-full"
            />
          </FormItem>
          <FormItem name="password" label="密码">
            <Password
              {...mobileForm.bind("password")}
              class="w-full"
            />
          </FormItem>
          <FormItem name="code" label="验证码">
            <PasscodeInput {...mobileForm.bindValue("code")} length={6} />
          </FormItem>
          <Button type="submit" variant="primary" class="w-full">
            提交
          </Button>
        </Form>
        <CodeBlock
          title="代码示例"
          code={`import { createForm, formRules } from "@dreamer/ui-view/form";
import { Form } from "@dreamer/ui-view/mobile/form/form";
import { FormItem } from "@dreamer/ui-view/mobile/form/form-item";
import { Input } from "@dreamer/ui-view/mobile/form/input";
import { PasscodeInput } from "@dreamer/ui-view/mobile/form/passcode-input";

const form = createForm({
  initialValues: { account: "", code: "" },
  fields: {
    account: { rules: [formRules.required()] },
    code: { rules: [formRules.required(), formRules.pattern(/^\\d{6}$/)] },
  },
});

<Form form={form} onFinish={…}>
  <FormItem name="account"><Input {...form.bind("account")} /></FormItem>
  <FormItem name="code"><PasscodeInput {...form.bindValue("code")} length={6} /></FormItem>
</Form>`}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
        />
      </section>
    </div>
  );
}
