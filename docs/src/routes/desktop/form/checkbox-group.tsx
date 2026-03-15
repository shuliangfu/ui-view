/**
 * 表单 - CheckboxGroup（展示全部用法）
 * 路由: /form/checkbox-group
 */

import {
  CheckboxGroup,
  Form,
  FormItem,
  Paragraph,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const options = [
  { value: "x", label: "选项 X" },
  { value: "y", label: "选项 Y" },
  { value: "z", label: "选项 Z", disabled: true },
];

export default function FormCheckboxGroup() {
  const [val, setVal] = createSignal<string[]>([]);
  const [val2, setVal2] = createSignal<string[]>(["x", "y"]);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>CheckboxGroup</Title>
        <Paragraph>
          多选组：options、value、onChange、name、disabled、error、direction（vertical/horizontal 横向纵向布局）。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="多选组">
            <CheckboxGroup
              options={options}
              value={val}
              onChange={(v) => setVal(v)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>有默认值 + 选项含 disabled</Title>
          <FormItem label="选项 Z 为 disabled">
            <CheckboxGroup
              options={options}
              value={val2}
              onChange={(v) => setVal2(v)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>direction=horizontal（横向）</Title>
          <FormItem label="横向多选组">
            <CheckboxGroup
              options={options}
              value={val2}
              onChange={(v) => setVal2(v)}
              direction="horizontal"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>error / disabled</Title>
          <FormItem label="错误态">
            <CheckboxGroup
              options={options}
              value={[]}
              onChange={() => {}}
              error
            />
          </FormItem>
          <FormItem label="整组禁用">
            <CheckboxGroup
              options={options}
              value={["x"]}
              onChange={() => {}}
              disabled
            />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
