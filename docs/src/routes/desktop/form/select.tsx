/**
 * 表单 - Select（展示全部用法）
 * 路由: /form/select
 */

import { Form, FormItem, Paragraph, Select, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const options = [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
  { value: "c", label: "选项 C", disabled: true },
];

export default function FormSelect() {
  const [val, setVal] = createSignal("");
  const [val2, setVal2] = createSignal("b");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Select</Title>
        <Paragraph>
          单选下拉：options、value、placeholder、onChange、size、disabled、name、id。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>placeholder</Title>
          <FormItem label="请选择">
            <Select
              options={options}
              value={val}
              onChange={(e) => setVal((e.target as HTMLSelectElement).value)}
              placeholder="请选择"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>有默认值 + 选项含 disabled</Title>
          <FormItem label="选项 C 为 disabled">
            <Select
              options={options}
              value={val2}
              onChange={(e) => setVal2((e.target as HTMLSelectElement).value)}
              placeholder="请选择"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="禁用">
            <Select options={options} value="a" disabled />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>name / id</Title>
          <FormItem label="表单字段" id="select-name">
            <Select
              id="select-name"
              name="city"
              options={options}
              value={val}
              onChange={(e) => setVal((e.target as HTMLSelectElement).value)}
              placeholder="请选择城市"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>size</Title>
          <FormItem label="sm">
            <Select options={options} value="" size="sm" placeholder="sm" />
          </FormItem>
          <FormItem label="md">
            <Select options={options} value="" size="md" placeholder="md" />
          </FormItem>
          <FormItem label="lg">
            <Select options={options} value="" size="lg" placeholder="lg" />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
