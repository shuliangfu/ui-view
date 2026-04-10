/**
 * Descriptions 描述列表（View）。
 * 键值对展示；支持标题、列数、边框、尺寸、垂直/水平布局。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface DescriptionsItem {
  /** 标签（键） */
  label: string | unknown;
  /** 内容（值） */
  children?: unknown;
  /**
   * 跨列数（不超过外层 `column`）。
   * 若某行各 `span` 之和小于 `column` 仍剩空列，该行**最靠右**的项会自动加大 `span` 铺满该行，避免出现单独空白格。
   */
  span?: number;
}

export interface DescriptionsProps {
  /** 描述项列表 */
  items: DescriptionsItem[];
  /** 标题 */
  title?: string | unknown;
  /**
   * 栅格列数：每行排几个描述项（每个项内仍是「标签 | 内容」横向）。
   * 要整行只展示一组键值用 `1`；要一行并排多组用 `2`、`3` 等。默认 3。
   */
  column?: number;
  /** 是否带边框 */
  bordered?: boolean;
  /** 尺寸 */
  size?: SizeVariant;
  /** 布局：horizontal 标签在左，vertical 标签在上 */
  layout?: "horizontal" | "vertical";
  /** 标签后是否显示冒号，默认 true */
  colon?: boolean;
  /** 额外 class */
  class?: string;
  /** 标签列 class */
  labelClass?: string;
  /** 内容列 class */
  contentClass?: string;
  /**
   * 仅 `layout="horizontal"`：标签列占**外层每一列栅格槽位**宽度的百分比（如 `38` 即单槽宽的 38%）。
   * 与 {@link labelMinWidth} 组成 `minmax(min, 百分比)`；项 {@link DescriptionsItem.span} 大于 1 时会自动换算，使标签列与只占一槽时竖线对齐。
   * 默认 38。
   */
  labelColPercent?: number;
  /**
   * 仅 `layout="horizontal"`：标签列最小宽度（CSS 长度或像素数字），偏大可减少长标签换行。
   * 默认 `13.5rem`。
   */
  labelMinWidth?: string | number;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "text-xs py-1.5 px-2",
  sm: "text-sm py-2 px-3",
  md: "text-sm py-2.5 px-4",
  lg: "text-base py-3 px-4",
};

/** 横向布局标签列默认最小宽度（CSS 长度） */
const DESCRIPTIONS_LABEL_MIN_WIDTH_DEFAULT = "13.5rem";

/** 横向布局标签列默认占当前描述项格子的宽度百分比 */
const DESCRIPTIONS_LABEL_COL_PERCENT_DEFAULT = 38;

/**
 * 将 `labelMinWidth` 规范为 CSS 长度；`number` 视为 px。
 *
 * @param v - 调用方传入值
 * @param fallback - 回退串
 */
function descriptionsLabelMinWidthCss(
  v: string | number | undefined,
  fallback: string,
): string {
  if (v === undefined) return fallback;
  if (typeof v === "number" && Number.isFinite(v)) return `${v}px`;
  const s = String(v).trim();
  return s === "" ? fallback : s;
}

/**
 * 标签列占比限制在合理区间，避免把内容列挤没。
 *
 * @param n - 百分比数字，如 `40` 表示 40%
 */
function descriptionsLabelColPercentClamped(n: number | undefined): number {
  const x = n ?? DESCRIPTIONS_LABEL_COL_PERCENT_DEFAULT;
  if (!Number.isFinite(x)) return DESCRIPTIONS_LABEL_COL_PERCENT_DEFAULT;
  return Math.min(85, Math.max(12, Math.round(x)));
}

/**
 * 横向布局内层 `grid` 的百分比相对于**当前项占位宽度**；跨列时占位变宽，若仍用同一百分比则标签区会变宽。
 * 将「单列槽位上的目标占比」换算为当前格内占比：`basePercent / span`，使标签列绝对宽度与 `span === 1` 时一致、首列竖线对齐。
 *
 * @param basePercent - 已钳制后的 `labelColPercent`（12～85）
 * @param span - 当前项占据的外层栅格列数（至少为 1）
 */
function descriptionsHorizontalLabelPercentInCell(
  basePercent: number,
  span: number,
): number {
  const s = Number.isFinite(span) && span >= 1 ? Math.floor(span) : 1;
  return basePercent / s;
}

/**
 * 按行优先规则模拟外层栅格占位，并消除行尾空轨道：某行最右端若未贴齐 `column`，
 * 则增大该行「结束列最靠右」的项的 span，避免 `span` 之和小于 `column` 时出现单独一列空白（如 3 列栅格只跨 2 列）。
 *
 * @param items - 描述项（读取 `span`）
 * @param column - 外层列数（至少为 1）
 * @returns 与 `items` 等长的放置结果：行号、起始列（0-based）、有效 span（已含行尾扩展）
 */
function computeDescriptionsPlacements(
  items: DescriptionsItem[],
  column: number,
): { row: number; startCol: number; span: number }[] {
  const colCount = Math.max(
    1,
    Number.isFinite(column) ? Math.floor(column) : 1,
  );
  const placements: { row: number; startCol: number; span: number }[] = [];

  let row = 0;
  let col = 0;

  for (let i = 0; i < items.length; i++) {
    let span = items[i].span ?? 1;
    if (!Number.isFinite(span) || span < 1) span = 1;
    span = Math.min(Math.floor(span), colCount);

    if (col + span > colCount) {
      row++;
      col = 0;
    }

    placements.push({ row, startCol: col, span });
    col += span;
    if (col >= colCount) {
      row++;
      col = 0;
    }
  }

  const rowToIndices = new Map<number, number[]>();
  for (let i = 0; i < placements.length; i++) {
    const r = placements[i].row;
    if (!rowToIndices.has(r)) rowToIndices.set(r, []);
    rowToIndices.get(r)!.push(i);
  }

  for (const indices of rowToIndices.values()) {
    let maxEnd = 0;
    for (const idx of indices) {
      const p = placements[idx];
      maxEnd = Math.max(maxEnd, p.startCol + p.span);
    }
    if (maxEnd < colCount) {
      const gap = colCount - maxEnd;
      let rightIdx = indices[0];
      for (const idx of indices) {
        const a = placements[rightIdx];
        const b = placements[idx];
        if (b.startCol + b.span > a.startCol + a.span) rightIdx = idx;
      }
      placements[rightIdx].span += gap;
    }
  }

  return placements;
}

export function Descriptions(props: DescriptionsProps) {
  const {
    items,
    title,
    column = 3,
    bordered = false,
    size = "md",
    layout = "horizontal",
    colon = true,
    class: className,
    labelClass,
    contentClass,
    labelColPercent: labelColPercentProp,
    labelMinWidth: labelMinWidthProp,
  } = props;

  const labelColPercent = descriptionsLabelColPercentClamped(
    labelColPercentProp,
  );
  const labelMinWidthCss = descriptionsLabelMinWidthCss(
    labelMinWidthProp,
    DESCRIPTIONS_LABEL_MIN_WIDTH_DEFAULT,
  );

  /** 外层栅格列数（规范化后，与轨道 repeat 一致） */
  const columnCount = Math.max(
    1,
    Number.isFinite(column) ? Math.floor(column) : 1,
  );

  /** 每项在外层栅格中的行、列与有效 span（行尾空列会并入最右项） */
  const placements = computeDescriptionsPlacements(items, columnCount);

  const cellCls = sizeClasses[size];
  /**
   * 横向布局：标签列由 {@link labelColPercent}、{@link labelMinWidth} 控制宽度，右对齐；
   * 各行竖线、冒号位置一致；过长标签仍可在格内换行（可配合更大 `labelMinWidth` 减少换行）。
   */
  const labelCls = twMerge(
    "text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/50",
    cellCls,
    layout === "horizontal" && "text-right min-w-0 break-words",
    labelClass,
  );
  const contentCls = twMerge(cellCls, contentClass);

  return (
    <div class={twMerge("descriptions", className)}>
      {title != null && (
        <div class="text-base font-semibold text-slate-900 dark:text-white mb-3">
          {title}
        </div>
      )}
      <div
        class={twMerge(
          "grid gap-0",
          bordered &&
            "border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden",
        )}
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item, index) => {
          const placement = placements[index]!;
          const effectiveSpan = placement.span;
          // 内层占比：按**有效**占位宽度换算，含行尾自动扩展后的 span
          const labelPercentInCell = descriptionsHorizontalLabelPercentInCell(
            labelColPercent,
            effectiveSpan,
          );
          const touchesRightEdge =
            placement.startCol + effectiveSpan >= columnCount;
          return (
            <div
              key={index}
              class={twMerge(
                "min-w-0",
                layout === "horizontal" && "grid w-full gap-0",
                layout === "vertical" && "flex flex-col",
                bordered &&
                  "border-b border-r border-slate-200 dark:border-slate-600",
              )}
              style={{
                gridRow: placement.row + 1,
                gridColumn: `${placement.startCol + 1} / span ${effectiveSpan}`,
                ...(layout === "horizontal"
                  ? {
                    /**
                     * `minmax(最小宽, 占比%)`：占比相对**本项**宽度；有效 span>1 时用 `labelColPercent/span` 保证与单列项首列对齐。
                     */
                    gridTemplateColumns:
                      `minmax(${labelMinWidthCss}, ${labelPercentInCell}%) minmax(0, 1fr)`,
                  }
                  : {}),
                ...(bordered && touchesRightEdge
                  ? { borderRight: "none" }
                  : {}),
              }}
            >
              <div class={labelCls}>
                {item.label}
                {colon ? "：" : null}
              </div>
              <div class={twMerge(contentCls, "min-w-0 wrap-break-word")}>
                {item.children}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
