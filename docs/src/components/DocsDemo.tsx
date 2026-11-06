/**
 * @fileoverview 桌面文档「示例」壳：标题 + 预览 + 代码，预览与代码之间固定上下间距。
 * 预览外包一层真实块，避免子树根节点 `display: contents`（如 DataPanel）打散 gap。
 */
import { Title } from "@dreamer/ui-view/basic";
import { CodeBlock } from "@dreamer/ui-view/data-display";

export interface DocsDemoProps {
  /** 示例小标题 */
  title: string;
  /** 展示用源码 */
  code: string;
  /** 实时预览 */
  children?: unknown;
}

/** 统一：上预览、下代码，`gap-6` 分隔 */
export function DocsDemo(props: DocsDemoProps) {
  return (
    <div class="flex flex-col gap-6">
      <Title level={3}>{props.title}</Title>
      <div class="min-w-0">{props.children}</div>
      <CodeBlock
        title="代码示例"
        code={props.code}
        language="tsx"
        showLineNumbers
        copyable
        wrapLongLines
      />
    </div>
  );
}
