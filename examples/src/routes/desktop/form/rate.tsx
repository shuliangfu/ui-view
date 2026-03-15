/**
 * 表单 - Rate（展示全部用法）
 * 路由: /form/rate
 */

import { Form, FormItem, Paragraph, Rate, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormRate() {
  const [val, setVal] = createSignal(0);
  const [valHalf, setValHalf] = createSignal(0);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Rate</Title>
        <Paragraph>
          评分：count、value、allowHalf、disabled 等全部用法。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础（5 星）</Title>
          <FormItem label="评分">
            <Rate value={val} onChange={(v) => setVal(v)} count={5} />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>allowHalf 半星</Title>
          <FormItem label="半星">
            <Rate
              value={valHalf}
              onChange={(v) => setValHalf(v)}
              count={5}
              allowHalf
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>count / disabled</Title>
          <FormItem label="3 星">
            <Rate value={2} count={3} />
          </FormItem>
          <FormItem label="10 星">
            <Rate value={7} count={10} />
          </FormItem>
          <FormItem label="disabled">
            <Rate value={3} count={5} disabled />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
