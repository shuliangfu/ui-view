/**
 * @module shared/sanitize-url
 * @description 链接协议白名单消毒（对齐 `@dreamer/view` 的 `sanitizeUrl` 语义）。
 * 拒 `javascript:`／`vbscript:`／`data:text/html*`；安全则原样返回，危险返回 `null`。
 * 供 RTE 插入链接、打印前二次检查等，不依赖 view 未导出的内部工具。
 */

/**
 * 是否危险 URL scheme（忽略空白与大小写）。
 */
export function isDangerousUrl(url: string): boolean {
  const compact = [...url].filter((ch) => ch.charCodeAt(0) > 0x20).join("");
  const lower = compact.toLowerCase();
  if (lower.startsWith("javascript:")) return true;
  if (lower.startsWith("vbscript:")) return true;
  if (lower.startsWith("data:text/html")) return true;
  if (lower.startsWith("data:") && lower.includes("text/html")) return true;
  return false;
}

/**
 * 净化 URL：危险 scheme 返回 `null`；否则返回字符串。
 */
export function sanitizeUrl(url: unknown): string | null {
  if (url == null || url === false) return null;
  const s = String(url);
  if (isDangerousUrl(s)) return null;
  return s;
}
