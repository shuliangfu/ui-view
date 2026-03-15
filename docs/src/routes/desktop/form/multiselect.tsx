/**
 * 表单 - MultiSelect（展示全部用法）
 * 路由: /form/multiselect
 */

import {
  Form,
  FormItem,
  MultiSelect,
  Paragraph,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const options = [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
  { value: "c", label: "选项 C", disabled: true },
];

export default function FormMultiSelect() {
  const [val, setVal] = createSignal<string[]>([]);
  const [val2, setVal2] = createSignal<string[]>(["a", "b"]);

  const handleChange = (e: Event) => {
    const t = e.target as HTMLSelectElement & { value?: string[] };
    const v = Array.isArray(t.value)
      ? t.value
      : Array.from((t as HTMLSelectElement).selectedOptions || []).map((o) =>
        o.value
      );
    setVal(v);
  };

  const handleChange2 = (e: Event) => {
    const t = e.target as HTMLSelectElement & { value?: string[] };
    const v = Array.isArray(t.value)
      ? t.value
      : Array.from((t as HTMLSelectElement).selectedOptions || []).map((o) =>
        o.value
      );
    setVal2(v);
  };

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>MultiSelect</Title>
        <Paragraph>
          多选下拉：options、value、onChange、size、disabled、name、id；选项可设 disabled。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>全选 / 清空</Title>
          <FormItem label="多选（上方有全选、清空）">
            <MultiSelect
              options={options}
              value={val}
              onChange={handleChange}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>有默认选中 + 选项含 disabled</Title>
          <FormItem label="选项 C 为 disabled">
            <MultiSelect
              options={options}
              value={val2}
              onChange={handleChange2}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="禁用">
            <MultiSelect options={options} value={["a"]} disabled />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>size</Title>
          <FormItem label="sm">
            <MultiSelect options={options} value={[]} size="sm" />
          </FormItem>
          <FormItem label="lg">
            <MultiSelect options={options} value={[]} size="lg" />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
