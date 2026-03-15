/**
 * 表单 - InputNumber（展示全部用法）
 * 路由: /form/input-number
 */

import {
  Form,
  FormItem,
  InputNumber,
  Paragraph,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormInputNumber() {
  const [val, setVal] = createSignal("10");
  const [val2, setVal2] = createSignal("0");
  const [val3, setVal3] = createSignal("50");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>InputNumber</Title>
        <Paragraph>
          数字输入：value、onChange、min、max、step、placeholder、size、disabled、name、id。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>步进按钮 + min/max/step</Title>
          <FormItem label="0–100，步进 5">
            <InputNumber
              value={val}
              min={0}
              max={100}
              step={5}
              onChange={(e) => setVal((e.target as HTMLInputElement).value)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>小数步进（step=0.1）</Title>
          <FormItem label="0–10，步进 0.1">
            <InputNumber
              value={val2}
              min={0}
              max={10}
              step={0.1}
              onChange={(e) => setVal2((e.target as HTMLInputElement).value)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>placeholder</Title>
          <FormItem label="占位">
            <InputNumber placeholder="请输入数量" value="" min={0} max={999} />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="禁用">
            <InputNumber value="99" min={0} max={100} disabled />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>size</Title>
          <FormItem label="sm">
            <InputNumber size="sm" value="1" min={0} max={10} />
          </FormItem>
          <FormItem label="md">
            <InputNumber
              size="md"
              value={val3}
              min={0}
              max={100}
              onChange={(e) => setVal3((e.target as HTMLInputElement).value)}
            />
          </FormItem>
          <FormItem label="lg">
            <InputNumber size="lg" value="5" min={0} max={10} />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
