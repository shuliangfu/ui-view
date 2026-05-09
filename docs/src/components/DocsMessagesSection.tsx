/**
 * @fileoverview 文档站「文案 messages」独立区块：与 API 属性表分开，单独一张表说明可本地化字段。
 */

import { Paragraph, Title } from "@dreamer/ui-view";
import { DocsApiTable, type DocsApiTableRow } from "./DocsApiTable.tsx";

/**
 * 在 **API** 章节之上渲染「文案（messages）」说明 + 独立表格（不与 props 表混排）。
 *
 * @param props.interfaceName - TS 接口名，便于读者在源码中跳转
 * @param props.defaultExportName - 包内默认文案导出名，如 defaultDatePickerMessages
 * @param props.rows - messages 各字段一行（字段路径可用 `a.b` 表示嵌套）
 */
export function DocsMessagesSection(props: {
  interfaceName: string;
  defaultExportName: string;
  rows: readonly DocsApiTableRow[];
}) {
  const { interfaceName, defaultExportName, rows } = props;
  return (
    <section class="space-y-3">
      <Title level={2}>文案（messages）</Title>
      <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
        组件支持通过{" "}
        <code class="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
          messages
        </code>{" "}
        传入{" "}
        <code class="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
          Partial&lt;{interfaceName}&gt;
        </code>
        ，仅覆盖需要的字段；其余使用包内{" "}
        <code class="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
          {defaultExportName}
        </code>
        。若存在嵌套对象，与组件实现一致时为<strong>
          一层浅合并
        </strong>（只替换你写的子键）。 下列表格<strong>
          仅描述文案字段
        </strong>，与下方 API 中的运行时 props 表分开。
      </Paragraph>
      <DocsApiTable rows={rows} nameColumnHeader="字段" />
    </section>
  );
}
