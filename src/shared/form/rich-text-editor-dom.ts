/**
 * @module shared/form/rich-text-editor-dom
 * @description RichTextEditor DOM／选区／行内装饰／颜色字号等命令实现。
 */

import { sanitizeUrl } from "../sanitize-url.ts";
import { isHtmlElement, isHtmlElementOf } from "../dom-guards.ts";

export function stripHtmlToText(html: string): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 从 HTML 提取纯文本用于字数统计（SSR 时 document 不可用，用 try/catch 回退到 stripHtmlToText） */
export function getPlainText(html: string): string {
  try {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent ?? div.innerText ?? "").trim();
  } catch {
    return stripHtmlToText(html);
  }
}

/** 统计字数：中日韩字符逐字计数，英文/数字按连续词组计数。 */
export function getWordCount(html: string): number {
  const text = getPlainText(html).trim();
  if (!text) return 0;
  const matches = text.match(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}]+/gu,
  );
  return matches?.length ?? 0;
}

/** 序列化时按 void 处理、不输出闭合标签的 HTML 元素 */
const RTE_VOID_HTML_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/**
 * 属性值写回双引号属性时的转义。
 *
 * @param s - 原始属性值
 */
function rteEscapeAttrValueForSource(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "&#10;")
    .replace(/\r/g, "&#13;");
}

/**
 * 生成元素开始标签（含属性）。
 *
 * @param el - DOM 元素
 */
function rteSerializeOpenTag(el: Element): string {
  const name = el.tagName.toLowerCase();
  let tag = `<${name}`;
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i]!;
    tag += ` ${a.name}="${rteEscapeAttrValueForSource(a.value)}"`;
  }
  return `${tag}>`;
}

/**
 * 将编辑区 `innerHTML` 格式化为带 2 空格缩进的多行源码，便于在源码模式下编辑（结构类似开发者工具 Elements，无语法高亮）。
 * 解析失败或非浏览器环境时返回原串。
 *
 * @param html - 原始 HTML
 */
export function rtePrettyPrintHtmlSource(html: string): string {
  const raw = html ?? "";
  if (raw.trim() === "") return "";
  try {
    const doc = globalThis.document;
    if (!doc) return raw;
    const tpl = doc.createElement("template");
    tpl.innerHTML = raw;
    const lines: string[] = [];
    /**
     * 深度优先输出节点，每层一级缩进。
     *
     * @param node - 当前节点
     * @param depth - 缩进层级
     */
    const walk = (node: Node, depth: number): void => {
      const ind = "  ".repeat(depth);
      if (node.nodeType === Node.TEXT_NODE) {
        // 标签之间的换行/空白在 DOM 里常变成独立文本节点；若整段含 \n 直接 push，
        // 换行后 textarea 会从第 0 列起画，看起来像「内容没缩进」且多出空行。
        const raw = node.textContent ?? "";
        const trimmed = raw.replace(/^\s+|\s+$/g, "");
        if (trimmed === "") return;
        const parts = trimmed.split(/\r\n|\r|\n/);
        for (const part of parts) {
          if (part === "") continue;
          lines.push(ind + part);
        }
        return;
      }
      if (node.nodeType === Node.COMMENT_NODE) {
        lines.push(`${ind}<!--${node.textContent ?? ""}-->`);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      const name = el.tagName.toLowerCase();
      const open = rteSerializeOpenTag(el);
      if (RTE_VOID_HTML_TAGS.has(name)) {
        lines.push(ind + open);
        return;
      }
      if (el.childNodes.length === 0) {
        lines.push(ind + open + `</${name}>`);
        return;
      }
      lines.push(ind + open);
      for (const c of Array.from(el.childNodes)) {
        walk(c, depth + 1);
      }
      lines.push(ind + `</${name}>`);
    };
    for (const c of Array.from(tpl.content.childNodes)) {
      walk(c, 0);
    }
    return lines.join("\n");
  } catch {
    return raw;
  }
}

/**
 * 判断编辑区是否处于「用户正在编辑」：焦点在 `contenteditable` 上，或选区锚点仍落在其 DOM 内。
 * 受控 `value` 触发重绘时，仅比较 `activeElement === el` 在部分 reconciler 时序下会短暂不成立，
 * 若此时用 props 覆盖 `innerHTML` 会重置选区，光标回到开头。
 *
 * @param editor - 富文本编辑区根节点
 * @returns 为 true 时不应从受控 `value` 同步 `innerHTML`
 */
export function isEditorActiveOrSelectionInside(editor: HTMLElement): boolean {
  const doc = globalThis.document;
  if (!doc || !editor.isConnected) return false;
  if (doc.activeElement === editor) return true;
  try {
    const sel = doc.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    let n: Node | null = sel.anchorNode;
    if (!n) return false;
    if (n.nodeType === Node.TEXT_NODE) {
      n = n.parentNode;
    }
    return n != null && editor.contains(n);
  } catch {
    return false;
  }
}

/**
 * 若当前文档选区完全落在编辑区内，则克隆其第一个 `Range`；否则返回 `null`。
 * 在取色等浮层抢走焦点前调用，避免用户在面板内操作后 `document.getSelection()` 已折叠/清空，
 * 导致 `execCommand('foreColor'|'backColor')` 作用在错误位置。
 *
 * @param editor - contenteditable 根节点
 * @returns 可稍后交给 {@link restoreEditorSelectionRange} 的克隆，或 `null`
 */
export function cloneEditorSelectionRangeIfInside(
  editor: HTMLElement,
): Range | null {
  const doc = globalThis.document;
  if (!doc) return null;
  try {
    const sel = doc.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const r = sel.getRangeAt(0);
    if (!editor.contains(r.commonAncestorContainer)) return null;
    return r.cloneRange();
  } catch {
    return null;
  }
}

/**
 * 将文档选区恢复为给定 `Range`（须仍挂在编辑区 DOM 内）；失败时静默忽略。
 *
 * @param editor - 会先对其 `focus` 的编辑区根节点
 * @param range - {@link cloneEditorSelectionRangeIfInside} 的返回值，可为 `null`
 */
export function restoreEditorSelectionRange(
  editor: HTMLElement,
  range: Range | null,
): void {
  if (range == null) return;
  const doc = globalThis.document;
  if (!doc) return;
  try {
    if (!editor.contains(range.commonAncestorContainer)) return;
    editor.focus({ preventScroll: true });
    const sel = doc.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    /* Range 已失效或浏览器拒绝设置选区 */
  }
}

/**
 * 折叠光标处插入可见文案为 `linkText`、`href` 为 `url` 的锚点（不把 URL 写进正文）。
 *
 * @param editor - contenteditable 根
 * @param url - 链接地址
 * @param linkText - 锚点的可见文案（来自 {@link RichTextEditorMessages.linkText}）
 */
export function rteInsertLinkPlaceholderAtCaret(
  editor: HTMLElement,
  url: string,
  linkText: string,
): void {
  const safeHref = sanitizeUrl(url);
  if (safeHref == null) return;
  const a = document.createElement("a");
  a.href = safeHref;
  a.textContent = linkText;
  const sel = document.getSelection();
  if (sel != null && sel.rangeCount > 0) {
    const cr = sel.getRangeAt(0);
    if (editor.contains(cr.commonAncestorContainer)) {
      try {
        cr.insertNode(a);
        rteCollapseSelectionToEndOfNode(a);
        return;
      } catch {
        /* 退回 insertHTML */
      }
    }
  }
  try {
    const safe = safeHref.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    /** 锚文需经 HTML 转义，避免 messages.linkText 含 `<` 等字符破坏插入 */
    const safeText = linkText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    document.execCommand(
      "insertHTML",
      false,
      `<a href="${safe}">${safeText}</a>`,
    );
  } catch {
    /* ignore */
  }
}

/**
 * 应用超链接：有非空选区时用 `createLink`（锚文本为选中文字，URL 仅作 `href`）；
 * 折叠或无选区时在光标插入 `linkText` 文案的锚点，避免浏览器把 URL 当可见正文插入。
 *
 * @param editor - contenteditable 根
 * @param url - 用户输入的 URL
 * @param savedRange - 打开链接弹层前克隆的选区，可为 `null`
 * @param linkText - 折叠选区下插入锚点的可见文案
 */
export function rteApplyLinkUrl(
  editor: HTMLElement,
  url: string,
  savedRange: Range | null,
  linkText: string,
): void {
  const trimmed = url.trim();
  if (!trimmed) return;
  /** 拒 javascript:／data:text/html 等危险协议，避免 contenteditable 插入可执行链接 */
  const u = sanitizeUrl(trimmed);
  if (u == null) return;
  editor.focus({ preventScroll: true });
  restoreEditorSelectionRange(editor, savedRange);

  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) {
    rteInsertLinkPlaceholderAtCaret(editor, u, linkText);
    return;
  }
  const r = sel.getRangeAt(0);
  if (!editor.contains(r.commonAncestorContainer)) {
    rteInsertLinkPlaceholderAtCaret(editor, u, linkText);
    return;
  }
  const hasText = !r.collapsed && (r.toString() ?? "").length > 0;
  if (hasText) {
    document.execCommand("createLink", false, u);
    return;
  }
  rteInsertLinkPlaceholderAtCaret(editor, u, linkText);
}

/**
 * 若选区落在已有 RTE 上色 `span` 内，则只改内联样式，避免反复包一层嵌套 `span`。
 * 自 {@link Range.commonAncestorContainer} 向上找**第一个**带对应 `data-*` 的 `span`（即最内层包裹）。
 *
 * @param editor - contenteditable 根，遇此停止向上
 * @param range - 当前选区
 * @param cmd - 前景或背景，决定读写的 `data-*` 与 CSS 属性
 * @param color - 新颜色值
 * @returns 是否已就地更新并应跳过后续 `surroundContents`
 */
function tryUpdateExistingRteColorSpan(
  editor: HTMLElement,
  range: Range,
  cmd: "foreColor" | "backColor",
  color: string,
): boolean {
  const attr = cmd === "foreColor" ? "data-rte-color" : "data-rte-bgcolor";
  const styleKey = cmd === "foreColor" ? "color" : "backgroundColor";
  let n: Node | null = range.commonAncestorContainer;
  if (n.nodeType === Node.TEXT_NODE) n = n.parentNode;
  while (n != null && n !== editor) {
    if (isHtmlElementOf(n, "HTMLSpanElement") && n.hasAttribute(attr)) {
      try {
        const spanRange = document.createRange();
        spanRange.selectNodeContents(n);
        const fullyInside =
          range.compareBoundaryPoints(Range.START_TO_START, spanRange) >= 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, spanRange) <= 0;
        if (fullyInside) {
          n.style.setProperty(styleKey, color, "important");
          const sel = document.getSelection();
          if (sel) {
            sel.removeAllRanges();
            const nr = document.createRange();
            nr.selectNodeContents(n);
            nr.collapse(false);
            sel.addRange(nr);
          }
          return true;
        }
      } catch {
        /* 继续向上找 */
      }
    }
    n = n.parentNode;
  }
  return false;
}

/**
 * 用带 `!important` 的内联样式包一层 `span`，避免编辑区 `text-slate-*` 等类通过继承/层叠盖住前景色。
 * 先 `surroundContents`；跨块选区失败时用 `extractContents` + `insertNode`（与 MDN 对 `surroundContents` 的说明一致）。
 *
 * @param range - 须未折叠且边界仍有效
 * @param styleKey - `color` 或 `backgroundColor`
 * @param value - CSS 颜色值
 * @returns 是否已成功写入 DOM
 */
function rteSurroundRangeWithImportantStyle(
  range: Range,
  styleKey: "color" | "backgroundColor",
  value: string,
): boolean {
  const span = document.createElement("span");
  span.style.setProperty(styleKey, value, "important");
  if (styleKey === "color") span.setAttribute("data-rte-color", "");
  else span.setAttribute("data-rte-bgcolor", "");
  try {
    range.surroundContents(span);
  } catch {
    try {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    } catch {
      return false;
    }
  }
  try {
    const sel = document.getSelection();
    if (sel) {
      sel.removeAllRanges();
      const nr = document.createRange();
      nr.selectNodeContents(span);
      nr.collapse(false);
      sel.addRange(nr);
    }
  } catch {
    /* 选区收尾失败不影响上色 */
  }
  return true;
}

/** 加粗/斜体/下划线：用 `span` + `style` + `data-rte-*`，不生成 `b`/`i`/`u` */
export type RteInlineDecoKind = "bold" | "italic" | "underline";

/**
 * 判断是否为本组件维护的内联装饰 `span`（粗/斜/下划线）。
 *
 * @param el - 待检测元素
 */
function rteSpanHasInlineDecoMark(el: HTMLSpanElement): boolean {
  return el.hasAttribute("data-rte-bold") ||
    el.hasAttribute("data-rte-italic") ||
    el.hasAttribute("data-rte-underline");
}

/**
 * 自选区公共祖先向上找**最内层**、且完全包含选区的 RTE 内联装饰 `span`。
 *
 * @param editor - contenteditable 根
 * @param range - 选区
 */
function findInnermostRteInlineDecoSpan(
  editor: HTMLElement,
  range: Range,
): HTMLSpanElement | null {
  let n: Node | null = range.commonAncestorContainer;
  if (n.nodeType === Node.TEXT_NODE) n = n.parentNode;
  while (n != null && n !== editor) {
    if (isHtmlElementOf(n, "HTMLSpanElement") && rteSpanHasInlineDecoMark(n)) {
      try {
        const sr = document.createRange();
        sr.selectNodeContents(n);
        const inside =
          range.compareBoundaryPoints(Range.START_TO_START, sr) >= 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, sr) <= 0;
        if (inside) return n;
      } catch {
        /* 继续 */
      }
    }
    n = n.parentNode;
  }
  return null;
}

/**
 * 判断选区边界是否与某元素 `selectNodeContents` 完全一致。
 *
 * @param range - 选区
 * @param el - 容器元素
 */
function rteSelectionFullyCoversNodeContents(
  range: Range,
  el: HTMLElement,
): boolean {
  try {
    const sr = document.createRange();
    sr.selectNodeContents(el);
    return range.compareBoundaryPoints(Range.START_TO_START, sr) === 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, sr) === 0;
  } catch {
    return false;
  }
}

/**
 * 对应 `data-rte-*` 属性名。
 *
 * @param kind - 装饰类型
 */
function rteDataAttrForInlineKind(kind: RteInlineDecoKind): string {
  if (kind === "bold") return "data-rte-bold";
  if (kind === "italic") return "data-rte-italic";
  return "data-rte-underline";
}

/**
 * 在已有 `span` 上合并一种内联装饰（`!important`）。
 *
 * @param span - 目标 `span`
 * @param kind - 粗/斜/下划
 */
function mergeRteInlineDecoKind(
  span: HTMLSpanElement,
  kind: RteInlineDecoKind,
): void {
  if (kind === "bold") {
    span.style.setProperty("font-weight", "700", "important");
    span.setAttribute("data-rte-bold", "");
  } else if (kind === "italic") {
    span.style.setProperty("font-style", "italic", "important");
    span.setAttribute("data-rte-italic", "");
  } else {
    span.style.setProperty("text-decoration", "underline", "important");
    span.setAttribute("data-rte-underline", "");
  }
}

/**
 * 去掉 `span` 上某一种装饰；若不再含任何 RTE 标记且无颜色标记则展开子节点。
 *
 * @param span - 目标 `span`
 * @param kind - 要移除的类型
 */
function stripRteInlineDecoKind(
  span: HTMLSpanElement,
  kind: RteInlineDecoKind,
): void {
  if (kind === "bold") {
    span.style.removeProperty("font-weight");
    span.removeAttribute("data-rte-bold");
  } else if (kind === "italic") {
    span.style.removeProperty("font-style");
    span.removeAttribute("data-rte-italic");
  } else {
    span.style.removeProperty("text-decoration");
    span.removeAttribute("data-rte-underline");
  }
  const hasDeco = span.hasAttribute("data-rte-bold") ||
    span.hasAttribute("data-rte-italic") ||
    span.hasAttribute("data-rte-underline");
  const hasColor = span.hasAttribute("data-rte-color") ||
    span.hasAttribute("data-rte-bgcolor");
  if (!hasDeco && !hasColor) {
    const parent = span.parentNode;
    if (parent) {
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    }
  }
}

/**
 * 将选区折叠到 `node` 内容末尾（`node` 为元素或文本父级）。
 *
 * @param node - 参照节点
 */
function rteCollapseSelectionToEndOfNode(node: Node): void {
  try {
    const sel = document.getSelection();
    if (!sel) return;
    const nr = document.createRange();
    if (node.nodeType === Node.TEXT_NODE) {
      nr.setStart(node, (node as Text).length);
      nr.collapse(true);
    } else {
      nr.selectNodeContents(node);
      nr.collapse(false);
    }
    sel.removeAllRanges();
    sel.addRange(nr);
  } catch {
    /* ignore */
  }
}

/**
 * 用带某一种内联装饰的 `span` 包裹选区。
 *
 * @param range - 非折叠选区
 * @param kind - 装饰类型
 */
function rteSurroundRangeWithInlineDecoKind(
  range: Range,
  kind: RteInlineDecoKind,
): boolean {
  const span = document.createElement("span");
  mergeRteInlineDecoKind(span, kind);
  try {
    range.surroundContents(span);
  } catch {
    try {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    } catch {
      return false;
    }
  }
  rteCollapseSelectionToEndOfNode(span);
  return true;
}

/**
 * 折叠选区处插入带零宽字符的样式 `span`，后续输入继承该样式。
 *
 * @param kind - 装饰类型
 * @param range - 折叠选区
 */
function rteInsertCollapsedInlineDecoSpan(
  kind: RteInlineDecoKind,
  range: Range,
): boolean {
  try {
    const span = document.createElement("span");
    mergeRteInlineDecoKind(span, kind);
    const zw = document.createTextNode("\u200b");
    span.appendChild(zw);
    range.insertNode(span);
    const nr = document.createRange();
    nr.setStart(zw, 1);
    nr.collapse(true);
    const sel = document.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(nr);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 查找完全包含选区的、**仅**带颜色标记（无粗斜划 `data-rte-*`）的最内层 `span`，用于与字色同层合并。
 *
 * @param editor - contenteditable 根
 * @param range - 选区
 */
function findInnermostRteColorOnlySpan(
  editor: HTMLElement,
  range: Range,
): HTMLSpanElement | null {
  let n: Node | null = range.commonAncestorContainer;
  if (n.nodeType === Node.TEXT_NODE) n = n.parentNode;
  while (n != null && n !== editor) {
    if (
      isHtmlElementOf(n, "HTMLSpanElement") &&
      (n.hasAttribute("data-rte-color") ||
        n.hasAttribute("data-rte-bgcolor")) &&
      !rteSpanHasInlineDecoMark(n)
    ) {
      try {
        const sr = document.createRange();
        sr.selectNodeContents(n);
        const inside =
          range.compareBoundaryPoints(Range.START_TO_START, sr) >= 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, sr) <= 0;
        if (inside) return n;
      } catch {
        /* continue */
      }
    }
    n = n.parentNode;
  }
  return null;
}

/**
 * 对选区施加或切换加粗/斜体/下划线（不调用 `execCommand('bold'|…)`，避免 `b`/`i`/`u`）。
 *
 * @param editor - contenteditable 根
 * @param kind - 装饰类型
 * @returns 为 `true` 表示已处理，调用方应 `emitChange` 且勿再 `execCommand`
 */
export function applyRteInlineDecoration(
  editor: HTMLElement,
  kind: RteInlineDecoKind,
): boolean {
  editor.focus({ preventScroll: true });
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const raw = sel.getRangeAt(0);
  if (!editor.contains(raw.commonAncestorContainer)) return false;

  const attr = rteDataAttrForInlineKind(kind);

  if (raw.collapsed) {
    const r = raw.cloneRange();
    const innerC = findInnermostRteInlineDecoSpan(editor, r);
    /** 光标已在同类型装饰内：去掉整段包裹（避免再走 `execCommand` 生成 `b`/`i`/`u`） */
    if (innerC && innerC.hasAttribute(attr)) {
      const parentC = innerC.parentNode;
      stripRteInlineDecoKind(innerC, kind);
      const focusC = innerC.isConnected ? innerC : parentC;
      if (focusC) rteCollapseSelectionToEndOfNode(focusC);
      return true;
    }
    return rteInsertCollapsedInlineDecoSpan(kind, r);
  }

  const r = raw.cloneRange();
  const decoSpan = findInnermostRteInlineDecoSpan(editor, r);

  if (decoSpan && decoSpan.hasAttribute(attr)) {
    if (rteSelectionFullyCoversNodeContents(r, decoSpan)) {
      const parentBefore = decoSpan.parentNode;
      stripRteInlineDecoKind(decoSpan, kind);
      const anchor = decoSpan.isConnected ? decoSpan : parentBefore;
      if (anchor) rteCollapseSelectionToEndOfNode(anchor);
      return true;
    }
    const neutral = document.createElement("span");
    if (kind === "bold") {
      neutral.style.setProperty("font-weight", "400", "important");
    } else if (kind === "italic") {
      neutral.style.setProperty("font-style", "normal", "important");
    } else {
      neutral.style.setProperty("text-decoration", "none", "important");
    }
    try {
      r.surroundContents(neutral);
    } catch {
      try {
        const frag = r.extractContents();
        neutral.appendChild(frag);
        r.insertNode(neutral);
      } catch {
        return false;
      }
    }
    rteCollapseSelectionToEndOfNode(neutral);
    return true;
  }

  if (decoSpan && rteSpanHasInlineDecoMark(decoSpan)) {
    mergeRteInlineDecoKind(decoSpan, kind);
    rteCollapseSelectionToEndOfNode(decoSpan);
    return true;
  }

  const colorSpan = findInnermostRteColorOnlySpan(editor, r);
  if (colorSpan) {
    mergeRteInlineDecoKind(colorSpan, kind);
    rteCollapseSelectionToEndOfNode(colorSpan);
    return true;
  }

  return rteSurroundRangeWithInlineDecoKind(r, kind);
}

/** 插入代码块时使用的 HTML，与工具栏命令保持一致 */
const RTE_CODE_BLOCK_INSERT_HTML =
  '<pre class="rte-code-block language-plaintext"><code><br></code></pre>';

/**
 * 从节点沿父链走向编辑根，取路径上**最外层**（最靠近根）的 `pre.rte-code-block`。
 * 若误用「最内层」`pre` 且其父为 `<code>`，在其后 `insertBefore` 仍会把新块留在同一 `<code>` 内，嵌套无法消除。
 *
 * @param editor - contenteditable 根
 * @param node - 选区相关节点（可为文本节点）
 * @returns 最外层 RTE 代码块 `pre` 或 `null`
 */
export function findOutermostRteCodeBlockPre(
  editor: HTMLElement,
  node: Node,
): HTMLPreElement | null {
  const start = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  let n: Node | null = start;
  /** 沿祖先链可能经过多层 `pre.rte-code-block`（错误嵌套时），保留最后一次命中的即最外层 */
  let outer: HTMLPreElement | null = null;
  while (n != null && n !== editor) {
    if (n instanceof HTMLPreElement && n.classList.contains("rte-code-block")) {
      outer = n;
    }
    n = n.parentNode;
  }
  return outer;
}

/**
 * 折叠选区是否落在 `el` 内容末尾（与 `selectNodeContents(el).collapse(false)` 同界）。
 *
 * @param range - 当前选区
 * @param el - 通常为 `code`
 */
export function rteRangeCollapsedAtEndOfElement(
  range: Range,
  el: Node,
): boolean {
  if (!range.collapsed) return false;
  try {
    const endProbe = document.createRange();
    endProbe.selectNodeContents(el);
    endProbe.collapse(false);
    return range.compareBoundaryPoints(Range.START_TO_START, endProbe) === 0;
  } catch {
    return false;
  }
}

/**
 * 若 `pre` 在父节点中没有下一个兄弟，则追加空段 `<p><br></p>`，避免代码块贴底时无法点击或方向键移出。
 *
 * @param pre - RTE 代码块根 `pre`
 */
export function rteEnsureParagraphAfterPreIfLast(pre: HTMLPreElement): void {
  if (pre.nextSibling != null) return;
  const parent = pre.parentNode;
  if (parent == null) return;
  const p = document.createElement("p");
  p.appendChild(document.createElement("br"));
  parent.appendChild(p);
}

/**
 * 插入 RTE 代码块。光标若已在代码块内，继续用 `insertHTML` 会把新的 `pre` 插进当前 `code` 造成无限嵌套；
 * 此时在**最外层** `pre.rte-code-block` 之后插入兄弟块（脱离错误的 `pre>code>pre` 链），并把光标移入新块首行。
 *
 * @param editor - contenteditable 根
 */
export function insertRteCodeBlockAtSelection(editor: HTMLElement): void {
  editor.focus({ preventScroll: true });
  const sel = document.getSelection();
  if (sel == null || sel.rangeCount < 1) return;

  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const enclosing = findOutermostRteCodeBlockPre(
    editor,
    range.startContainer,
  );

  if (enclosing != null && enclosing.parentNode != null) {
    const wrap = document.createElement("div");
    wrap.innerHTML = RTE_CODE_BLOCK_INSERT_HTML;
    const newPre = wrap.firstElementChild;
    if (!(newPre instanceof HTMLPreElement)) return;
    enclosing.parentNode.insertBefore(newPre, enclosing.nextSibling);
    const code = newPre.querySelector("code");
    if (code != null) {
      const caret = document.createRange();
      caret.selectNodeContents(code);
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
    }
    rteEnsureParagraphAfterPreIfLast(newPre);
  } else if (typeof document.execCommand === "function") {
    document.execCommand("insertHTML", false, RTE_CODE_BLOCK_INSERT_HTML);
    if (sel.rangeCount > 0) {
      const after = findOutermostRteCodeBlockPre(
        editor,
        sel.getRangeAt(0).startContainer,
      );
      if (after != null) {
        rteEnsureParagraphAfterPreIfLast(after);
      }
    }
  }
}

/**
 * 为选区设置前景或背景色：若选区已在 {@link tryUpdateExistingRteColorSpan} 可识别的 `span` 内则只改 `style`；
 * 否则用 {@link rteSurroundRangeWithImportantStyle} 包一层；最后退回 `execCommand`。
 *
 * @param editor - contenteditable 根节点
 * @param savedRange - 打开取色器前克隆的选区；须仍挂在文档中且未折叠
 * @param cmd - `foreColor` 或 `backColor`
 * @param color - 颜色串，如 `#rrggbb`
 */
export function applyRteForeOrBackColor(
  editor: HTMLElement,
  savedRange: Range | null,
  cmd: "foreColor" | "backColor",
  color: string,
): void {
  editor.focus({ preventScroll: true });
  /**
   * 必须先恢复选区再取 Range：`savedRange` 为打开取色器前的克隆，与当前文档选区可能脱节；
   * 内联粗体等改动后公共祖先也可能变化，仅用克隆会导致 `tryUpdate`/`surroundContents` 误判或失败。
   */
  restoreEditorSelectionRange(editor, savedRange);

  const sel = document.getSelection();
  let r: Range | null = null;
  if (sel && sel.rangeCount > 0) {
    const live = sel.getRangeAt(0);
    if (!live.collapsed && editor.contains(live.commonAncestorContainer)) {
      r = live.cloneRange();
    }
  }
  if (r == null && savedRange != null) {
    try {
      if (
        !savedRange.collapsed &&
        editor.contains(savedRange.commonAncestorContainer)
      ) {
        r = savedRange.cloneRange();
      }
    } catch {
      r = null;
    }
  }

  const styleKey = cmd === "foreColor" ? "color" : "backgroundColor";
  if (r != null && tryUpdateExistingRteColorSpan(editor, r, cmd, color)) {
    return;
  }
  if (r != null && rteSurroundRangeWithImportantStyle(r, styleKey, color)) {
    return;
  }
  restoreEditorSelectionRange(editor, savedRange);
  if (typeof document.execCommand === "function") {
    try {
      /** DOM 类型定义第三参为 `string`，浏览器对 `styleWithCSS` 接受 `"true"` */
      document.execCommand("styleWithCSS", false, "true");
    } catch {
      /* 忽略 */
    }
  }
  document.execCommand(cmd, false, color);
}

/**
 * 若选区完全落在带 `data-rte-font-size` 的 `span` 内，则只更新其 `font-size`，避免重复嵌套。
 *
 * @param editor - contenteditable 根
 * @param range - 当前选区（非折叠）
 * @param size - 如 `16px`
 * @returns 是否已就地更新并收起选区到该 `span` 末尾
 */
function tryUpdateExistingRteFontSizeSpan(
  editor: HTMLElement,
  range: Range,
  size: string,
): boolean {
  let n: Node | null = range.commonAncestorContainer;
  if (n.nodeType === Node.TEXT_NODE) n = n.parentNode;
  while (n != null && n !== editor) {
    if (
      isHtmlElementOf(n, "HTMLSpanElement") &&
      n.hasAttribute("data-rte-font-size")
    ) {
      try {
        const spanRange = document.createRange();
        spanRange.selectNodeContents(n);
        const inside =
          range.compareBoundaryPoints(Range.START_TO_START, spanRange) >= 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, spanRange) <= 0;
        if (inside) {
          n.style.setProperty("font-size", size, "important");
          rteCollapseSelectionToEndOfNode(n);
          return true;
        }
      } catch {
        /* 选区与 span 比较失败则继续向上找 */
      }
    }
    n = n.parentNode;
  }
  return false;
}

/**
 * 用带 `data-rte-font-size` 的 `span` 包裹非折叠选区；`surroundContents` 失败时退回 `extractContents`。
 *
 * @param range - 克隆后的选区
 * @param size - 如 `16px`
 * @returns 是否成功
 */
function rteSurroundRangeWithFontSize(range: Range, size: string): boolean {
  const span = document.createElement("span");
  span.style.setProperty("font-size", size, "important");
  span.setAttribute("data-rte-font-size", "");
  try {
    range.surroundContents(span);
  } catch {
    try {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    } catch {
      return false;
    }
  }
  rteCollapseSelectionToEndOfNode(span);
  return true;
}

/**
 * 折叠选区时在光标处插入零宽占位 + 字号 `span`，便于后续输入继承字号。
 *
 * @param size - 如 `16px`
 * @param range - 折叠选区
 * @returns 是否成功
 */
function rteInsertCollapsedFontSizeSpan(size: string, range: Range): boolean {
  try {
    const span = document.createElement("span");
    span.style.setProperty("font-size", size, "important");
    span.setAttribute("data-rte-font-size", "");
    const zw = document.createTextNode("\u200b");
    span.appendChild(zw);
    range.insertNode(span);
    const nr = document.createRange();
    nr.setStart(zw, 1);
    nr.collapse(true);
    const sel = document.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(nr);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 为选区设置字号：`span` + `font-size !important` + `data-rte-font-size`（与字色包裹思路一致）。
 *
 * @param editor - contenteditable 根
 * @param size - 如 `16px`
 */
export function applyRteFontSize(editor: HTMLElement, size: string): void {
  if (!size.trim()) return;
  editor.focus({ preventScroll: true });
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const raw = sel.getRangeAt(0);
  if (!editor.contains(raw.commonAncestorContainer)) return;

  if (raw.collapsed) {
    rteInsertCollapsedFontSizeSpan(size, raw.cloneRange());
    return;
  }

  const r = raw.cloneRange();
  if (tryUpdateExistingRteFontSizeSpan(editor, r, size)) return;
  rteSurroundRangeWithFontSize(r, size);
}

/**
 * 自节点向上在编辑区内查找适合设置行高的块级容器。
 *
 * @param editor - contenteditable 根
 * @param node - 起点（常为选区锚点）
 */
function rteFindBlockForLineHeight(
  editor: HTMLElement,
  node: Node | null,
): HTMLElement | null {
  let n: Node | null = node;
  if (n?.nodeType === Node.TEXT_NODE) n = n.parentNode;
  while (n != null && n !== editor) {
    if (isHtmlElement(n)) {
      const t = n.tagName.toLowerCase();
      if (
        t === "p" || t === "div" || t === "blockquote" || t === "li" ||
        t === "pre" || t === "td" || t === "th" || /^h[1-6]$/.test(t)
      ) {
        return n;
      }
    }
    n = n.parentNode;
  }
  return null;
}

/**
 * 为光标所在块设置 `line-height`（`!important`）；若无块则先 `formatBlock` 为 `p` 再尝试。
 *
 * @param editor - contenteditable 根
 * @param value - 如 `1.5`
 */
export function applyRteLineHeight(editor: HTMLElement, value: string): void {
  if (!value.trim()) return;
  editor.focus({ preventScroll: true });
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  let block = rteFindBlockForLineHeight(editor, sel.anchorNode);
  if (!block && typeof document.execCommand === "function") {
    try {
      document.execCommand("formatBlock", false, "p");
    } catch {
      /* 不支持则忽略 */
    }
    block = rteFindBlockForLineHeight(editor, sel.anchorNode);
  }
  if (block && editor.contains(block)) {
    block.style.setProperty("line-height", value, "important");
  }
}

/**
 * Chromium 系：将 Enter 新段默认由 `div` 改为 `p`（非标准命令，不支持时静默忽略）。
 */
export function trySetDefaultParagraphSeparatorToP(): void {
  if (typeof document.execCommand !== "function") return;
  try {
    document.execCommand("defaultParagraphSeparator", false, "p");
  } catch {
    /* Safari 等可能不支持 */
  }
}

/**
 * 若编辑区根下以非空文本节点开头，将其包入 `p`，避免在空编辑器里直接输入时首段无块级标签。
 *
 * @param editor - contenteditable 根元素
 * @returns 是否修改过 DOM
 */
export function wrapRteLeadingRootTextInParagraph(
  editor: HTMLDivElement,
): boolean {
  const first = editor.firstChild;
  if (!first || first.nodeType !== Node.TEXT_NODE) return false;
  const tn = first as Text;
  const raw = tn.textContent ?? "";
  if (raw === "") return false;
  const p = document.createElement("p");
  editor.removeChild(tn);
  p.appendChild(tn);
  editor.insertBefore(p, editor.firstChild);
  try {
    const sel = document.getSelection();
    if (sel && sel.anchorNode && editor.contains(sel.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } catch {
    /* 选区恢复失败则忽略 */
  }
  return true;
}

/**
 * 受控 `value` 重绘时是否禁止用 props 覆盖编辑区 `innerHTML`。
 * 焦点在 **contenteditable** 上或选区锚点在其内时禁止（见 {@link isEditorActiveOrSelectionInside}），避免重置光标。
 * 焦点在 **查找条**（`#${editorId}-findbar`）内时禁止，避免破坏查找/替换流程。
 * 仅工具栏按钮获焦时**不**在此返回 true：工具栏 `mousedown` 已尽量保留编辑区选区，若仍用「整棵 root 含工具栏」跳过同步，
 * 会在挂载后焦点落在工具栏等场景下导致从未写入 `innerHTML`，出现占位符与字数按受控值统计不一致。
 *
 * @param editorId - 编辑区元素 id（与根节点 `id` 为 `${editorId}-root` 对应）
 * @param editorEl - contenteditable 根节点
 */
export function shouldSkipControlledInnerHtmlSync(
  editorId: string,
  editorEl: HTMLDivElement,
): boolean {
  const doc = globalThis.document;
  if (!doc) return false;
  if (isEditorActiveOrSelectionInside(editorEl)) return true;
  const ae = doc.activeElement;
  const findBar = doc.getElementById(`${editorId}-findbar`);
  if (findBar && ae instanceof Node && findBar.contains(ae)) return true;
  return false;
}

/**
 * 比较两段富文本 HTML 是否在「受控回写」语义下等价：忽略零宽符、`&nbsp;` 与普通空格差异及标签间空白折叠，
 * 避免浏览器序列化与父级回显字符串严格不等时误判需重写 `innerHTML`（进而重置光标）。
 *
 * @param a - 一段 HTML
 * @param b - 另一段 HTML
 * @returns 宽松相等时为 true
 */
export function rteHtmlLooselyEquals(a: string, b: string): boolean {
  if (a === b) return true;
  const norm = (s: string) =>
    s.replace(/\uFEFF/g, "").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ");
  return norm(a) === norm(b);
}

/** 工具栏内 SVG 统一尺寸 class */
