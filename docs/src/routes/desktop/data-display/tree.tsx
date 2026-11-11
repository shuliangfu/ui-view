/**
 * Tree 文档页。路由: /desktop/data-display/tree
 */

import { createSignal } from "@dreamer/view";
import { Paragraph, Title } from "@dreamer/ui-view/basic";
import { CodeBlock, Tree } from "@dreamer/ui-view/data-display";
import type { TreeNode } from "@dreamer/ui-view/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_TREE } from "../../../data/component-messages-rows.ts";

const API: DocsApiTableRow[] = [
  { name: "treeData", type: "TreeNode[]", default: "-", description: "树数据" },
  {
    name: "expandedKeys",
    type: "Signal | () => string[] | string[]",
    default: "-",
    description: "展开 key（请传 Signal／getter，勿 .value 快照）",
  },
  {
    name: "defaultExpandedKeys",
    type: "string[]",
    default: "[]",
    description: "非受控初始展开",
  },
  {
    name: "selectedKeys",
    type: "Signal | () => string[] | string[]",
    default: "-",
    description: "选中 key（传 Signal／getter）",
  },
  {
    name: "checkedKeys",
    type: "Signal | () => string[] | string[]",
    default: "-",
    description: "勾选 key（传 Signal／getter）",
  },
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
    description: "默认 false＝父子联动＋半选；true＝仅切换自身、无联动",
  },
  {
    name: "showLine",
    type: "boolean",
    default: "false",
    description: "连接线风格（目录线）",
  },
  {
    name: "blockNode",
    type: "boolean",
    default: "false",
    description: "块级行（整行铺满选中底）",
  },
  { name: "multiple", type: "boolean", default: "false", description: "多选" },
  {
    name: "onExpand",
    type: "(keys) => void",
    default: "-",
    description: "展开变化",
  },
  {
    name: "onSelect",
    type: "(keys, info) => void",
    default: "-",
    description: "选中变化",
  },
  {
    name: "onCheck",
    type: "(keys) => void",
    default: "-",
    description: "勾选变化",
  },
  { name: "class", type: "string", default: "-", description: "容器 class" },
  {
    name: "messages",
    type: "Partial<TreeMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Tree } from "@dreamer/ui-view/data-display";
const expandedKeys = createSignal<string[]>(["1"]);
const selectedKeys = createSignal<string[]>([]);
const checkedKeys = createSignal<string[]>([]);

const treeData: TreeNode[] = [
  {
    key: "1",
    title: "节点 1",
    children: [
      { key: "1-1", title: "节点 1-1" },
      { key: "1-2", title: "节点 1-2", children: [{ key: "1-2-1", title: "节点 1-2-1" }] },
    ],
  },
  { key: "2", title: "节点 2" },
];

<Tree
  treeData={treeData}
  checkable
  expandedKeys={expandedKeys}
  onExpand={(keys) => (expandedKeys.value = keys)}
  selectedKeys={selectedKeys}
  onSelect={(keys) => (selectedKeys.value = keys)}
  checkedKeys={checkedKeys}
  onCheck={(keys) => (checkedKeys.value = keys)}
/>`;

const exampleCascade = `<Tree
  treeData={treeData}
  checkable
  /* checkStrictly 默认 false：勾父联动子孙；部分勾选时父半选 */
  expandedKeys={expandedKeys}
  onExpand={(keys) => (expandedKeys.value = keys)}
  checkedKeys={checkedKeys}
  onCheck={(keys) => (checkedKeys.value = keys)}
/>`;

const exampleStrict = `<Tree
  treeData={treeData}
  checkable
  checkStrictly
  expandedKeys={strictExpanded}
  onExpand={(keys) => (strictExpanded.value = keys)}
  checkedKeys={strictChecked}
  onCheck={(keys) => (strictChecked.value = keys)}
/>`;

const exampleShowLine = `<Tree
  treeData={treeData}
  showLine
  expandedKeys={lineExpanded}
  onExpand={(keys) => (lineExpanded.value = keys)}
  selectedKeys={lineSelected}
  onSelect={(keys) => (lineSelected.value = keys)}
/>`;

const exampleBlock = `<Tree
  treeData={treeData}
  blockNode
  checkable
  expandedKeys={blockExpanded}
  onExpand={(keys) => (blockExpanded.value = keys)}
  checkedKeys={blockChecked}
  onCheck={(keys) => (blockChecked.value = keys)}
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
  {
    key: "2",
    title: "节点 2",
    children: [{ key: "2-1", title: "节点 2-1" }],
  },
];

const expandedKeys = createSignal<string[]>(["1"]);
const selectedKeys = createSignal<string[]>([]);
const checkedKeys = createSignal<string[]>([]);

const strictExpanded = createSignal<string[]>(["1"]);
const strictChecked = createSignal<string[]>([]);

const lineExpanded = createSignal<string[]>(["1"]);
const lineSelected = createSignal<string[]>([]);

const blockExpanded = createSignal<string[]>(["1"]);
const blockChecked = createSignal<string[]>([]);

function KeysDisplay(props: {
  getSelected?: () => string[];
  getChecked: () => string[];
  label?: string;
}) {
  // 返回 thunk：在独立 effect 内读 signal，避免整页不刷新「已勾选」计数
  return () => {
    const sel = props.getSelected?.() ?? [];
    const chk = props.getChecked();
    return (
      <p class="text-sm text-slate-500" data-tree-keys-display="">
        {props.label ? `${props.label} · ` : ""}
        {props.getSelected ? `已选: ${sel.join(", ") || "-"} | ` : ""}
        已勾选: {chk.join(", ") || "-"}（共 {chk.length}）
      </p>
    );
  };
}

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Tree · ui-view",
};

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Tree</Title>
        <Paragraph>
          树形控件。交互必须分流：
          <strong>箭头</strong>＝展开／收起（expandedKeys）；
          <strong>checkbox</strong>＝勾选（checkedKeys，默认
          cascade：勾叶则父半选／全选， 不写 selectedKeys）；
          <strong>标题／行</strong>＝仅选中本节点（selectedKeys，行高亮），
          <em>不会</em>改勾选计数、也绝不把父节点标成 selected。
          键盘：ArrowLeft／Right 展开，Enter 选中，Space 勾选。
          <code class="mx-1">checkStrictly</code>{" "}
          关闭父子联动。 keys 请传 Signal／getter，勿传 .value 快照。
        </Paragraph>
      </div>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>

      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-3">
          <Title level={3}>展开 / 选中 / 勾选</Title>
          <Paragraph class="text-sm text-slate-500">
            勾 checkbox「1-2-1」→ checkedKeys
            含该叶；若「1-2」仅此一子则父亦全选（cascade），有未勾兄弟时父半选；行高亮（selected）不变。
            点标题「1-2-1」→ 仅该叶 selected
            高亮，勾选计数不变。勾父「1」级联子孙。
          </Paragraph>
          <div
            class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3"
            data-tree-demo="cascade"
          >
            <Tree
              treeData={treeData}
              checkable
              defaultExpandedKeys={["1"]}
              expandedKeys={expandedKeys}
              onExpand={(keys) => (expandedKeys.value = keys)}
              selectedKeys={selectedKeys}
              onSelect={(keys) => (selectedKeys.value = keys)}
              checkedKeys={checkedKeys}
              onCheck={(keys) => (checkedKeys.value = keys)}
            />
            {() => (
              <KeysDisplay
                getSelected={() => selectedKeys.value}
                getChecked={() => checkedKeys.value}
              />
            )}
          </div>
          <CodeBlock code={exampleCascade} language="tsx" />
        </div>

        <div class="space-y-3">
          <Title level={3}>严格勾选 checkStrictly</Title>
          <Paragraph class="text-sm text-slate-500">
            checkStrictly：只切换自身，父子互不影响、无半选联动。
          </Paragraph>
          <div
            class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3"
            data-tree-demo="strict"
          >
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
              <KeysDisplay
                getChecked={() => strictChecked.value}
                label="严格"
              />
            )}
          </div>
          <CodeBlock code={exampleStrict} language="tsx" />
        </div>

        <div class="space-y-3">
          <Title level={3}>showLine 连接线</Title>
          <Paragraph class="text-sm text-slate-500">
            第二种展示风格：目录连接线，仅选中、无勾选。
          </Paragraph>
          <div
            class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900"
            data-tree-demo="show-line"
          >
            <Tree
              treeData={treeData}
              showLine
              defaultExpandedKeys={["1"]}
              expandedKeys={lineExpanded}
              onExpand={(keys) => (lineExpanded.value = keys)}
              selectedKeys={lineSelected}
              onSelect={(keys) => (lineSelected.value = keys)}
            />
          </div>
          <CodeBlock code={exampleShowLine} language="tsx" />
        </div>

        <div class="space-y-3">
          <Title level={3}>blockNode 块级行</Title>
          <Paragraph class="text-sm text-slate-500">
            整行铺满选中底，适合侧栏目录。
          </Paragraph>
          <div
            class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3"
            data-tree-demo="block-node"
          >
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
            {() => (
              <KeysDisplay getChecked={() => blockChecked.value} label="块级" />
            )}
          </div>
          <CodeBlock code={exampleBlock} language="tsx" />
        </div>
      </section>

      <DocsMessagesSection
        interfaceName="TreeMessages"
        defaultExportName="defaultTreeMessages"
        rows={MESSAGES_TREE}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          TreeNode：key、title、disabled、selectable、checkable、isLeaf、children。
          勾选联动默认开启（checkStrictly=false）；半选仅 DOM
          indeterminate，不进入 checkedKeys。
        </Paragraph>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
