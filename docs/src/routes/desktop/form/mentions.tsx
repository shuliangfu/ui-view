/**
 * 表单 - Mentions（展示全部用法）
 * 路由: /form/mentions
 */

import { Form, FormItem, Mentions, Paragraph, Title } from "@dreamer/ui-view";
import type { MentionOption } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const mentionOptions: MentionOption[] = [
  { value: "u1", label: "张三" },
  { value: "u2", label: "李四" },
  { value: "u3", label: "王五" },
];

export default function FormMentions() {
  const [val, setVal] = createSignal("");
  const [val2, setVal2] = createSignal("你好 @张三 请查收");
  const [showDropdown, setShowDropdown] = createSignal(false);
  const [options, setOptions] = createSignal<MentionOption[]>([]);

  const handleInput = (e: Event) => {
    const el = e.target as HTMLTextAreaElement;
    const v = el.value;
    const start = el.selectionStart ?? 0;
    setVal(v);
    const before = v.slice(0, start);
    const atIdx = before.lastIndexOf("@");
    if (atIdx >= 0) {
      const keyword = before.slice(atIdx + 1).toLowerCase();
      setOptions(
        keyword
          ? mentionOptions.filter(
            (o) =>
              o.label.toLowerCase().includes(keyword) ||
              o.value.toLowerCase().includes(keyword),
          )
          : mentionOptions,
      );
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelect = (opt: MentionOption) => {
    const v = val();
    const start = (globalThis.document?.activeElement as HTMLTextAreaElement)
      ?.selectionStart ?? v.length;
    const before = v.slice(0, start);
    const atIdx = before.lastIndexOf("@");
    if (atIdx >= 0) {
      setVal(v.slice(0, atIdx) + opt.label + " " + v.slice(start));
    }
    setShowDropdown(false);
  };

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Mentions</Title>
        <Paragraph>
          Mentions：value、onInput、onChange、placeholder、rows、showDropdown、dropdownOptions、onSelectOption、disabled、class。输入 @ 触发候选下拉，选项为 MentionOption[]（value、label）。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>带候选下拉（输入 @ 触发）</Title>
          <FormItem label="提及">
            <Mentions
              value={val}
              onInput={handleInput}
              onChange={(e) => setVal((e.target as HTMLTextAreaElement).value)}
              placeholder="输入 @ 提及"
              showDropdown={showDropdown}
              dropdownOptions={options}
              onSelectOption={handleSelect}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>有默认值 / 无候选（仅多行输入）</Title>
          <FormItem label="仅输入">
            <Mentions
              value={val2}
              onChange={(e) => setVal2((e.target as HTMLTextAreaElement).value)}
              placeholder="无 @ 候选时就是普通 textarea"
              rows={4}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="禁用">
            <Mentions placeholder="禁用" disabled value="" />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
