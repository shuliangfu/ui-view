/**
 * 表单 - 滑块与评分（Slider、Rate）
 * 路由: /form/slider-rate
 */

import {
  Form,
  FormItem,
  Paragraph,
  Rate,
  Slider,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormSliderRate() {
  const [sliderVal, setSliderVal] = createSignal(50);
  const [sliderRangeVal, setSliderRangeVal] = createSignal<[number, number]>([
    20,
    80,
  ]);
  const [rateVal, setRateVal] = createSignal(0);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>滑块与评分</Title>
        <Paragraph>
          Slider（单值 / 范围）、Rate 示例。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-xl space-y-4">
        <FormItem label="Slider 单值">
          {() => (
            <Slider
              value={sliderVal()}
              min={0}
              max={100}
              onChange={(e) =>
                setSliderVal(Number((e.target as HTMLInputElement).value))}
            />
          )}
        </FormItem>
        <FormItem label="Slider 范围">
          {() => (
            <Slider
              range
              value={sliderRangeVal()}
              min={0}
              max={100}
              onChange={(e) =>
                setSliderRangeVal(
                  (e.target as unknown as { value: [number, number] }).value,
                )}
            />
          )}
        </FormItem>
        <FormItem label="Rate">
          {() => (
            <Rate
              value={rateVal()}
              onChange={(v) => setRateVal(v)}
              count={5}
            />
          )}
        </FormItem>
      </Form>
    </div>
  );
}
