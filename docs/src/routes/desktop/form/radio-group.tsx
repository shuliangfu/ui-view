/**
 * 表单 - RadioGroup（展示全部用法）
 * 路由: /form/radio-group
 */

import { Form, FormItem, Paragraph, RadioGroup, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const options = [
  { value: "r1", label: "单选 1" },
  { value: "r2", label: "单选 2" },
  { value: "r3", label: "单选 3", disabled: true },
];

export default function FormRadioGroup() {
  const [val, setVal] = createSignal("r1");
  const [val2, setVal2] = createSignal("r2");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>RadioGroup</Title>
        <Paragraph>
          单选组：name、options、value、选项 disabled、整组 disabled、error
          等全部用法。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="单选组">
            <RadioGroup
              name="radio-demo"
              options={options}
              value={val}
              onChange={(v) => setVal(v)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>有默认值 + 选项含 disabled</Title>
          <FormItem label="选项 3 为 disabled">
            <RadioGroup
              name="radio-demo2"
              options={options}
              value={val2}
              onChange={(v) => setVal2(v)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>error / disabled</Title>
          <FormItem label="错误态">
            <RadioGroup
              name="radio-err"
              options={options}
              value="r1"
              onChange={() => {}}
              error
            />
          </FormItem>
          <FormItem label="整组禁用">
            <RadioGroup
              name="radio-dis"
              options={options}
              value="r2"
              onChange={() => {}}
              disabled
            />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
