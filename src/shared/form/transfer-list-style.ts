/**
 * Transfer 整列高度：顶层 height / minHeight / maxHeight 只接受像素数字，
 * CSS 值写在 listStyle 同名字段。数字转 px，CSS 字符串原样使用。
 * 这些尺寸作用在整列面板（标题、搜索、列表、计数），不是内部 select。
 */

export const DEFAULT_TRANSFER_LIST_HEIGHT = "200px";

export type TransferListSize = number | string;

export type TransferListBoxStyle = {
  height: string;
  minHeight?: string;
  maxHeight?: string;
  boxSizing: "border-box";
};

/** Numbers become px; CSS strings are used as-is. */
export function resolveCssSize(
  value: TransferListSize | undefined,
): string | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `${value}px`;
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

/** Top-level props only accept pixel numbers. */
export function resolvePxNumber(value: number | undefined): string | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `${value}px`;
  }
  return undefined;
}

/** Numeric top-level props win over listStyle; unset height defaults to 200px. */
export function resolveListBoxStyle(
  listStyle: {
    height?: TransferListSize;
    minHeight?: TransferListSize;
    maxHeight?: TransferListSize;
  },
  overrides: {
    height?: number;
    minHeight?: number;
    maxHeight?: number;
  } = {},
): TransferListBoxStyle {
  const style: TransferListBoxStyle = {
    height: resolvePxNumber(overrides.height) ??
      resolveCssSize(listStyle.height) ??
      DEFAULT_TRANSFER_LIST_HEIGHT,
    boxSizing: "border-box",
  };
  const minHeight = resolvePxNumber(overrides.minHeight) ??
    resolveCssSize(listStyle.minHeight);
  const maxHeight = resolvePxNumber(overrides.maxHeight) ??
    resolveCssSize(listStyle.maxHeight);
  if (minHeight) style.minHeight = minHeight;
  if (maxHeight) style.maxHeight = maxHeight;
  return style;
}
