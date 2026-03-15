/** 路由: /data-display/segmented */
import { createSignal } from "@dreamer/view";
import { Paragraph, Segmented, Title } from "@dreamer/ui-view";

export default function DataDisplaySegmented() {
  const [value, setValue] = createSignal("列表");

  const options = [
    { value: "列表", label: "列表" },
    { value: "网格", label: "网格" },
    { value: "卡片", label: "卡片" },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Segmented</Title>
      <Paragraph>
        分段控制器：options、value、onChange、block、size、disabled。
      </Paragraph>
      <Segmented options={options} value={value()} onChange={setValue} />
      <Title level={2}>block / size=lg</Title>
      <Segmented
        options={options}
        value={value()}
        onChange={setValue}
        block
        size="lg"
      />
      <Title level={2}>disabled 项</Title>
      <Segmented
        options={[
          ...options,
          { value: "禁用", label: "禁用", disabled: true },
        ]}
        value={value()}
        onChange={setValue}
      />
      <p class="text-sm text-slate-500">当前: {value()}</p>
    </div>
  );
}
