/**
 * 表单 - Password（展示全部用法）
 * 路由: /form/password
 */

import { Form, FormItem, Paragraph, Password, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormPassword() {
  const [val, setVal] = createSignal("");
  const [valNoStrength, setValNoStrength] = createSignal("");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Password</Title>
        <Paragraph>
          密码输入：显隐切换、强度提示（showStrength）、禁用、尺寸等全部用法。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>带强度提示（showStrength）</Title>
          <FormItem label="密码">
            <Password
              value={val}
              onInput={(e) => setVal((e.target as HTMLInputElement).value)}
              onChange={(e) => setVal((e.target as HTMLInputElement).value)}
              showStrength
              placeholder="输入密码看强度"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>无强度提示</Title>
          <FormItem label="密码">
            <Password
              value={valNoStrength}
              onInput={(e) =>
                setValNoStrength((e.target as HTMLInputElement).value)}
              onChange={(e) =>
                setValNoStrength((e.target as HTMLInputElement).value)}
              placeholder="仅显隐切换"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="禁用">
            <Password placeholder="禁用" disabled value="" />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>size</Title>
          <FormItem label="sm">
            <Password size="sm" placeholder="sm" value="" />
          </FormItem>
          <FormItem label="md">
            <Password size="md" placeholder="md" value="" />
          </FormItem>
          <FormItem label="lg">
            <Password size="lg" placeholder="lg" value="" />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
