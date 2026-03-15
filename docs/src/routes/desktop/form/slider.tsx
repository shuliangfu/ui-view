/**
 * 表单 - Slider（展示全部用法）
 * 路由: /form/slider
 */

import { Form, FormItem, Paragraph, Slider, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormSlider() {
  const [val, setVal] = createSignal(50);
  const [rangeVal, setRangeVal] = createSignal<[number, number]>([20, 80]);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Slider</Title>
        <Paragraph>
          滑块：value、min、max、step、range、vertical、disabled、onChange、onInput、name、id。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>单值</Title>
          <FormItem label="0–100">
            <Slider
              value={val}
              min={0}
              max={100}
              onChange={(e) =>
                setVal(Number((e.target as HTMLInputElement).value))}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>range 双滑块</Title>
          <FormItem label="范围">
            <Slider
              range
              value={rangeVal}
              min={0}
              max={100}
              onChange={(e) =>
                setRangeVal(
                  (e.target as unknown as { value: [number, number] }).value,
                )}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>vertical 竖排</Title>
          <FormItem label="竖排单值">
            <Slider
              value={val}
              min={0}
              max={100}
              vertical
              onChange={(e) =>
                setVal(Number((e.target as HTMLInputElement).value))}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>step / disabled</Title>
          <FormItem label="step=10">
            <Slider value={30} min={0} max={100} step={10} />
          </FormItem>
          <FormItem label="disabled">
            <Slider value={60} min={0} max={100} disabled />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
