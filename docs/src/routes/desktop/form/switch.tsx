/**
 * 表单 - Switch（展示全部用法）
 * 路由: /form/switch
 */

import { Form, FormItem, Paragraph, Switch, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormSwitch() {
  const [checked, setChecked] = createSignal(false);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Switch</Title>
        <Paragraph>
          开关：checked、onChange、disabled、error、name、id、checkedChildren、unCheckedChildren。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="开关">
            <Switch
              checked={checked}
              onChange={(e) =>
                setChecked((e.target as HTMLInputElement).checked)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>checkedChildren / unCheckedChildren</Title>
          <FormItem label="开/关文案">
            <Switch
              checked={checked}
              onChange={(e) =>
                setChecked((e.target as HTMLInputElement).checked)}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>name / id</Title>
          <FormItem label="表单字段">
            <Switch
              name="notify"
              id="switch-notify"
              checked={checked}
              onChange={(e) =>
                setChecked((e.target as HTMLInputElement).checked)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>error / disabled</Title>
          <FormItem label="错误态">
            <Switch checked={false} error />
          </FormItem>
          <FormItem label="禁用未选">
            <Switch checked={false} disabled />
          </FormItem>
          <FormItem label="禁用已选">
            <Switch checked disabled />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
