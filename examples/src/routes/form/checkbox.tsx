/**
 * 表单 - Checkbox（展示全部用法）
 * 路由: /form/checkbox
 */

import { Checkbox, Form, FormItem, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormCheckbox() {
  const [checked, setChecked] = createSignal(false);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Checkbox</Title>
        <Paragraph>
          勾选：checked、disabled、error、children 文案等全部用法。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="勾选">
            <Checkbox
              checked={checked}
              onChange={(e) =>
                setChecked((e.target as HTMLInputElement).checked)}
            >
              勾选我
            </Checkbox>
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>error</Title>
          <FormItem label="错误态">
            <Checkbox checked={false} error>错误状态红框</Checkbox>
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="未选禁用">
            <Checkbox checked={false} disabled>禁用未选</Checkbox>
          </FormItem>
          <FormItem label="已选禁用">
            <Checkbox checked disabled>禁用已选</Checkbox>
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
