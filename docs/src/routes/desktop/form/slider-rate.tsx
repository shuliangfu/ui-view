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
          Slider：value、min、max、step、range、vertical、disabled、onChange、onInput、class、name、id。Rate：value、count、allowHalf、disabled、onChange、class。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-xl space-y-4">
        <Title level={2}>Slider 单值</Title>
        <FormItem label="单值">
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
        <Title level={2}>Slider 范围</Title>
        <FormItem label="范围">
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
        <Title level={2}>Rate</Title>
        <FormItem label="评分">
          {() => (
            <Rate
              value={rateVal()}
              onChange={(v) => setRateVal(v)}
              count={5}
            />
          )}
        </FormItem>
        <Title level={2}>Rate allowHalf / disabled</Title>
        <FormItem label="半星">
          {() => (
            <Rate
              value={2.5}
              onChange={() => {}}
              count={5}
              allowHalf
            />
          )}
        </FormItem>
        <FormItem label="禁用">
          {() => (
            <Rate value={3} count={5} disabled onChange={() => {}} />
          )}
        </FormItem>
      </Form>
    </div>
  );
}
