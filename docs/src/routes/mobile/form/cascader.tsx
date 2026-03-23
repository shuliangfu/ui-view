/**
 * Cascader（移动版）文档。路由: /mobile/form/cascader
 */

import { Cascader } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

const OPTIONS = [
  {
    value: "zhejiang",
    label: "浙江",
    children: [
      { value: "hangzhou", label: "杭州" },
      { value: "ningbo", label: "宁波" },
    ],
  },
  {
    value: "jiangsu",
    label: "江苏",
    children: [{ value: "nanjing", label: "南京" }],
  },
];

export default function MobileCascaderDoc() {
  return (
    <div class="w-full max-w-lg space-y-8">
      <Title level={1} class="text-2xl sm:text-3xl">
        Cascader
      </Title>
      <Paragraph class="text-slate-600 dark:text-slate-400">
        双列下拉级联，触控友好。
      </Paragraph>
      <Cascader options={OPTIONS} onChange={() => {}} class="w-full" />
      <CodeBlock
        language="tsx"
        copyable
        code={`import { Cascader } from "@dreamer/ui-view/mobile";

<Cascader options={tree} value={["zhejiang","hangzhou"]} onChange={...} />`}
      />
    </div>
  );
}
