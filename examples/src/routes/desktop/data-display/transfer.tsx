/** 路由: /data-display/transfer */
import { createSignal } from "@dreamer/view";
import { Paragraph, Title, Transfer } from "@dreamer/ui-view";

export default function DataDisplayTransfer() {
  const [targetKeys, setTargetKeys] = createSignal<string[]>(["2", "4"]);
  const [searchValue, setSearchValue] = createSignal<[string, string]>([
    "",
    "",
  ]);

  const dataSource = [
    { key: "1", title: "选项 1" },
    { key: "2", title: "选项 2" },
    { key: "3", title: "选项 3" },
    { key: "4", title: "选项 4" },
    { key: "5", title: "选项 5" },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Transfer</Title>
      <Paragraph>穿梭框：双列选择、搜索、自定义渲染。</Paragraph>
      <Transfer
        dataSource={dataSource}
        targetKeys={targetKeys()}
        onChange={setTargetKeys}
        titles={["源列表", "目标列表"]}
        showSearch
        searchValue={searchValue()}
        onSearch={(dir, v) =>
          setSearchValue((prev) =>
            dir === "left" ? [v, prev[1]] : [prev[0], v]
          )}
      />
      <p class="text-sm text-slate-500">已选: {targetKeys().join(", ")}</p>
    </div>
  );
}
