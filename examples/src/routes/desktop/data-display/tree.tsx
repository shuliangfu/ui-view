/** 路由: /data-display/tree */
import { createSignal } from "@dreamer/view";
import { Paragraph, Title, Tree } from "@dreamer/ui-view";
import type { TreeNode } from "@dreamer/ui-view";

export default function DataDisplayTree() {
  const [expandedKeys, setExpandedKeys] = createSignal<string[]>(["1"]);
  const [selectedKeys, setSelectedKeys] = createSignal<string[]>([]);
  const [checkedKeys, setCheckedKeys] = createSignal<string[]>([]);

  const treeData: TreeNode[] = [
    {
      key: "1",
      title: "节点 1",
      children: [
        { key: "1-1", title: "节点 1-1" },
        {
          key: "1-2",
          title: "节点 1-2",
          children: [{ key: "1-2-1", title: "节点 1-2-1" }],
        },
      ],
    },
    { key: "2", title: "节点 2" },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Tree</Title>
      <Paragraph>树形：展开/选中/勾选、异步加载、多选。</Paragraph>
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys()}
        onExpand={setExpandedKeys}
        selectedKeys={selectedKeys()}
        onSelect={setSelectedKeys}
        checkable
        checkedKeys={checkedKeys()}
        onCheck={setCheckedKeys}
      />
      <p class="text-sm text-slate-500">
        已选: {selectedKeys().join(", ") || "-"} | 已勾选:{" "}
        {checkedKeys().join(", ") || "-"}
      </p>
    </div>
  );
}
