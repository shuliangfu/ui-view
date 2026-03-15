/**
 * 表单 - 勾选与开关（Checkbox、CheckboxGroup、Radio、RadioGroup、Switch）
 * 路由: /form/check
 */

import {
  Checkbox,
  CheckboxGroup,
  Form,
  FormItem,
  Paragraph,
  RadioGroup,
  Switch,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const checkboxOptions = [
  { value: "x", label: "选项 X" },
  { value: "y", label: "选项 Y" },
  { value: "z", label: "选项 Z" },
];

const radioOptions = [
  { value: "r1", label: "单选 1" },
  { value: "r2", label: "单选 2" },
  { value: "r3", label: "单选 3" },
];

export default function FormCheck() {
  const [checkboxVal, setCheckboxVal] = createSignal(false);
  const [checkboxGroupVal, setCheckboxGroupVal] = createSignal<string[]>([]);
  const [radioVal, setRadioVal] = createSignal("r1");
  const [switchVal, setSwitchVal] = createSignal(false);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>勾选与开关</Title>
        <Paragraph>
          Checkbox、CheckboxGroup、RadioGroup、Switch；Switch 支持 checkedChildren、unCheckedChildren、disabled、error。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-xl space-y-4">
        <FormItem label="Checkbox">
          <Checkbox
            checked={checkboxVal()}
            onChange={(e) =>
              setCheckboxVal((e.target as HTMLInputElement).checked)}
          >
            勾选我
          </Checkbox>
        </FormItem>
        <FormItem label="CheckboxGroup">
          <CheckboxGroup
            options={checkboxOptions}
            value={checkboxGroupVal()}
            onChange={(v) => setCheckboxGroupVal(v)}
          />
        </FormItem>
        <FormItem label="RadioGroup">
          <RadioGroup
            name="radio-demo"
            options={radioOptions}
            value={radioVal()}
            onChange={(v) => setRadioVal(v)}
          />
        </FormItem>
        <FormItem label="Switch">
          <Switch
            checked={switchVal()}
            onChange={(e) =>
              setSwitchVal((e.target as HTMLInputElement).checked)}
          />
        </FormItem>
        <FormItem label="Switch 自定义文案">
          <Switch
            checked={switchVal()}
            onChange={(e) =>
              setSwitchVal((e.target as HTMLInputElement).checked)}
            checkedChildren="开"
            unCheckedChildren="关"
          />
        </FormItem>
        <FormItem label="Switch disabled">
          <Switch checked={false} disabled />
          <Switch checked disabled class="ml-4" />
        </FormItem>
      </Form>
    </div>
  );
}
