/**
 * Tree 文档页。路由: /mobile/data-display/tree
 */

import { createSignal } from "@dreamer/view";
import { Tree } from "@dreamer/ui-view/mobile";
import type { TreeNode } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  {
    name: "checkable",
    type: "boolean",
    default: "false",
    description: "显示 checkbox",
  },
  {
    name: "checkStrictly",
    type: "boolean",
    default: "false",
    description: "默认 false＝父子联动＋半选；true＝严格独立",
  },
  {
    name: "showLine",
    type: "boolean",
    default: "false",
    description: "连接线风格",
  },
  {
    name: "blockNode",
    type: "boolean",
    default: "false",
    description: "块级行",
  },
  {
    name: "expandedKeys",
    type: "Signal | getter",
    default: "-",
    description: "展开 keys（勿传 .value 快照）",
  },
  {
    name: "checkedKeys",
    type: "Signal | getter",
    default: "-",
    description: "勾选 keys",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Tree } from "@dreamer/ui-view/mobile";

const expandedKeys = createSignal<string[]>(["1"]);
const checkedKeys = createSignal<string[]>([]);

<Tree
  treeData={treeData}
  checkable
  expandedKeys={expandedKeys}
  onExpand={(keys) => (expandedKeys.value = keys)}
  checkedKeys={checkedKeys}
  onCheck={(keys) => (checkedKeys.value = keys)}
/>`;

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

const expandedKeys = createSignal<string[]>(["1"]);
const checkedKeys = createSignal<string[]>([]);
const strictExpanded = createSignal<string[]>(["1"]);
const strictChecked = createSignal<string[]>([]);
const lineExpanded = createSignal<string[]>(["1"]);
const blockExpanded = createSignal<string[]>(["1"]);
const blockChecked = createSignal<string[]>([]);


const exampleCascade = `<Tree
  treeData={treeData}
  checkable
  defaultExpandedKeys={["1"]}
  expandedKeys={expandedKeys}
  onExpand={(keys) => (expandedKeys.value = keys)}
  checkedKeys={checkedKeys}
  onCheck={(keys) => (checkedKeys.value = keys)}
/>`;

const exampleStrict = `<Tree
  treeData={treeData}
  checkable
  checkStrictly
  defaultExpandedKeys={["1"]}
  expandedKeys={strictExpanded}
  onExpand={(keys) => (strictExpanded.value = keys)}
  checkedKeys={strictChecked}
  onCheck={(keys) => (strictChecked.value = keys)}
/>`;

const exampleLine = `<Tree
  treeData={treeData}
  showLine
  defaultExpandedKeys={["1"]}
  expandedKeys={lineExpanded}
  onExpand={(keys) => (lineExpanded.value = keys)}
/>`;

const exampleBlock = `<Tree
  treeData={treeData}
  blockNode
  checkable
  defaultExpandedKeys={["1"]}
  expandedKeys={blockExpanded}
  onExpand={(keys) => (blockExpanded.value = keys)}
  checkedKeys={blockChecked}
  onCheck={(keys) => (blockChecked.value = keys)}
/>`;


export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Tree</Title>
                <Paragraph>
          移动端树形。箭头＝展开；checkbox＝勾选（默认联动／半选，不写 selected）；
          标题／行＝仅本节点 selected。checkStrictly 关联动。另有 showLine／blockNode。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>展开 / 选中 / 勾选</Title>
          <div data-tree-demo="cascade"><MobileDocDemo class="p-3 space-y-2">
            <Tree
              treeData={treeData}
              checkable
              defaultExpandedKeys={["1"]}
              expandedKeys={expandedKeys}
              onExpand={(keys) => (expandedKeys.value = keys)}
              checkedKeys={checkedKeys}
              onCheck={(keys) => (checkedKeys.value = keys)}
            />
            {() => (
              <p class="text-xs text-slate-500" data-tree-keys-display="">
                已勾选: {checkedKeys.value.join(", ") || "-"}（共{" "}
                {checkedKeys.value.length}）
              </p>
            )}
          </MobileDocDemo></div>
          <CodeBlock title="代码示例" code={exampleCascade} language="tsx" showLineNumbers copyable wrapLongLines />

        </div>

        <div class="space-y-2">
          <Title level={3}>严格勾选 checkStrictly</Title>
          <div data-tree-demo="strict"><MobileDocDemo class="p-3 space-y-2">
            <Tree
              treeData={treeData}
              checkable
              checkStrictly
              defaultExpandedKeys={["1"]}
              expandedKeys={strictExpanded}
              onExpand={(keys) => (strictExpanded.value = keys)}
              checkedKeys={strictChecked}
              onCheck={(keys) => (strictChecked.value = keys)}
            />
            {() => (
              <p class="text-xs text-slate-500">
                严格已勾选: {strictChecked.value.join(", ") || "-"}（共{" "}
                {strictChecked.value.length}）
              </p>
            )}
          </MobileDocDemo></div>
          <CodeBlock title="代码示例" code={exampleStrict} language="tsx" showLineNumbers copyable wrapLongLines />

        </div>

        <div class="space-y-2">
          <Title level={3}>showLine 连接线</Title>
          <div data-tree-demo="show-line"><MobileDocDemo class="p-3">
            <Tree
              treeData={treeData}
              showLine
              defaultExpandedKeys={["1"]}
              expandedKeys={lineExpanded}
              onExpand={(keys) => (lineExpanded.value = keys)}
            />
          </MobileDocDemo></div>
          <CodeBlock title="代码示例" code={exampleLine} language="tsx" showLineNumbers copyable wrapLongLines />

        </div>

        <div class="space-y-2">
          <Title level={3}>blockNode 块级行</Title>
          <div data-tree-demo="block-node"><MobileDocDemo class="p-3 space-y-2">
            <Tree
              treeData={treeData}
              blockNode
              checkable
              defaultExpandedKeys={["1"]}
              expandedKeys={blockExpanded}
              onExpand={(keys) => (blockExpanded.value = keys)}
              checkedKeys={blockChecked}
              onCheck={(keys) => (blockChecked.value = keys)}
            />
          </MobileDocDemo></div>
          <CodeBlock title="代码示例" code={exampleBlock} language="tsx" showLineNumbers copyable wrapLongLines />

        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
