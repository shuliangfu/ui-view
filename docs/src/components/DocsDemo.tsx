/**
 * @fileoverview 桌面文档「示例」壳：标题 + 预览 + 代码，预览与代码之间固定上下间距。
 * 预览外包一层真实块，避免子树根节点 `display: contents`（如 DataPanel）打散 gap。
 */
import { Title } from "@dreamer/ui-view/basic";
import { CodeBlock } from "@dreamer/ui-view/data-display";

/** 数据面板／数据详情文档代码示例的默认最大高度，超出滚动 */
export const DOCS_DEMO_CODE_MAX_HEIGHT = "24rem";

export interface DocsDemoProps {
  /** 示例小标题 */
  title: string;
  /** 展示用源码 */
  code: string;
  /** 实时预览 */
  children?: unknown;
  /** 代码块最大高度，默认 {@link DOCS_DEMO_CODE_MAX_HEIGHT} */
  maxHeight?: string | number;
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
        maxHeight={props.maxHeight ?? DOCS_DEMO_CODE_MAX_HEIGHT}
      />
    </div>
  );
}
