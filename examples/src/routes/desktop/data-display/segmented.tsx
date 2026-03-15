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
        分段控制器：多选一紧凑展示，支持 block、size、disabled。
      </Paragraph>
      <Segmented options={options} value={value()} onChange={setValue} />
      <Segmented
        options={options}
        value={value()}
        onChange={setValue}
        block
        size="lg"
      />
      <p class="text-sm text-slate-500">当前: {value()}</p>
    </div>
  );
}
