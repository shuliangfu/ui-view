/**
 * CodeBlock 代码块（View）。
 * 展示代码并支持语法高亮（基于 Prism）、行号、复制、标题、最大高度滚动；归属 3.7 数据展示。
 */

import Prism from "prismjs";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-markdown.js";
import "prismjs/components/prism-typescript.js";
// html 与 plaintext 通常已在 core 或通过 markup
import "prismjs/components/prism-markup.js";
import { twMerge } from "tailwind-merge";

/** 常用语言 id，与 Prism 的 language 一致 */
export type CodeBlockLanguage =
  | "javascript"
  | "typescript"
  | "json"
  | "html"
  | "css"
  | "bash"
  | "shell"
  | "markdown"
  | "plaintext"
  | string;

export interface CodeBlockProps {
  /** 代码内容 */
  code: string;
  /** 语言（用于语法高亮）；不传或 unknown 则按纯文本展示 */
  language?: CodeBlockLanguage;
  /** 是否显示行号，默认 false */
  showLineNumbers?: boolean;
  /** 行号起始值，默认 1 */
  lineNumberStart?: number;
  /** 最大高度（如 "20rem"、"400px"），超出可滚动；不传则不限制 */
  maxHeight?: string | number;
  /** 标题（如文件名），显示在代码块上方 */
  title?: string | null;
  /** 是否显示复制按钮，默认 true */
  copyable?: boolean;
  /** 复制成功后回调 */
  onCopy?: () => void;
  /** 是否长行自动换行，默认 false（横向滚动） */
  wrapLongLines?: boolean;
  /** 额外 class（作用于最外层） */
  class?: string;
  /** pre 的 class */
  preClass?: string;
  /** code 的 class */
  codeClass?: string;
}

/** 转义 HTML 以便安全显示纯文本 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

/** 内置 Prism token 样式（与 Tailwind 配色一致，支持 dark） */
const PRISM_TOKEN_STYLES = `
.code-block-prism .token.comment,
.code-block-prism .token.prolog,
.code-block-prism .token.doctype,
.code-block-prism .token.cdata { color: #64748b; }
.code-block-prism .token.punctuation { color: #94a3b8; }
.code-block-prism .token.property,
.code-block-prism .token.tag,
.code-block-prism .token.boolean,
.code-block-prism .token.number,
.code-block-prism .token.constant { color: #0ea5e9; }
.code-block-prism .token.symbol { color: #0ea5e9; }
.code-block-prism .token.selector,
.code-block-prism .token.attr-name,
.code-block-prism .token.string,
.code-block-prism .token.char,
.code-block-prism .token.builtin { color: #059669; }
.code-block-prism .token.operator,
.code-block-prism .token.entity,
.code-block-prism .token.url { color: #94a3b8; }
.code-block-prism .token.atrule,
.code-block-prism .token.attr-value,
.code-block-prism .token.keyword { color: #7c3aed; }
.code-block-prism .token.function,
.code-block-prism .token.class-name { color: #dc2626; }
.code-block-prism .token.regex,
.code-block-prism .token.important,
.code-block-prism .token.variable { color: #ea580c; }
.dark .code-block-prism .token.comment,
.dark .code-block-prism .token.prolog,
.dark .code-block-prism .token.doctype,
.dark .code-block-prism .token.cdata { color: #94a3b8; }
.dark .code-block-prism .token.punctuation { color: #cbd5e1; }
.dark .code-block-prism .token.property,
.dark .code-block-prism .token.tag,
.dark .code-block-prism .token.boolean,
.dark .code-block-prism .token.number,
.dark .code-block-prism .token.constant { color: #38bdf8; }
.dark .code-block-prism .token.symbol { color: #38bdf8; }
.dark .code-block-prism .token.selector,
.dark .code-block-prism .token.attr-name,
.dark .code-block-prism .token.string,
.dark .code-block-prism .token.char,
.dark .code-block-prism .token.builtin { color: #34d399; }
.dark .code-block-prism .token.operator,
.dark .code-block-prism .token.entity,
.dark .code-block-prism .token.url { color: #cbd5e1; }
.dark .code-block-prism .token.atrule,
.dark .code-block-prism .token.attr-value,
.dark .code-block-prism .token.keyword { color: #a78bfa; }
.dark .code-block-prism .token.function,
.dark .code-block-prism .token.class-name { color: #f87171; }
.dark .code-block-prism .token.regex,
.dark .code-block-prism .token.important,
.dark .code-block-prism .token.variable { color: #fb923c; }
`;

export function CodeBlock(props: CodeBlockProps) {
  const {
    code,
    language = "plaintext",
    showLineNumbers = false,
    lineNumberStart = 1,
    maxHeight,
    title,
    copyable = true,
    onCopy,
    wrapLongLines = false,
    class: className,
    preClass,
    codeClass,
  } = props;

  const maxHeightStyle =
    maxHeight != null
      ? { maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }
      : undefined;

  const lines = code.split("\n");
  const lineCount = lines.length;

  const setCodeRef = (el: unknown) => {
    const codeEl = el as HTMLElement | null;
    if (!codeEl) return;
    let lang = (language ?? "plaintext").toLowerCase();
    if (lang === "html") lang = "markup";
    if (lang === "shell") lang = "bash";
    const prism = Prism as { languages?: Record<string, unknown>; highlight: (code: string, grammar: unknown, lang: string) => string };
    const grammar = prism.languages?.[lang];
    try {
      if (grammar) {
        codeEl.innerHTML = prism.highlight(code, grammar, lang);
      } else {
        codeEl.textContent = code;
      }
    } catch {
      codeEl.textContent = code;
    }
  };

  const handleCopy = () => {
    if (typeof globalThis.navigator?.clipboard?.writeText === "function") {
      globalThis.navigator.clipboard.writeText(code).then(() => onCopy?.());
    } else {
      onCopy?.();
    }
  };

  const setWrapperRef = (el: unknown) => {
    const wrapper = el as HTMLElement | null;
    if (!wrapper) return;
    if ((wrapper as HTMLElement & { _codeBlockStyle?: boolean })._codeBlockStyle) return;
    (wrapper as HTMLElement & { _codeBlockStyle?: boolean })._codeBlockStyle = true;
    const style = wrapper.ownerDocument.createElement("style");
    style.textContent = PRISM_TOKEN_STYLES;
    wrapper.insertBefore(style, wrapper.firstChild);
  };

  return () => (
    <div
      ref={setWrapperRef}
      class={twMerge(
        "code-block code-block-prism rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 text-sm",
        className,
      )}
    >
      {(title != null && title !== "") || copyable ? (
        <div class="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-600 bg-slate-100/80 dark:bg-slate-700/50">
          {title != null && title !== "" ? (
            <span class="font-medium text-slate-700 dark:text-slate-300 truncate">
              {title}
            </span>
          ) : (
            <span />
          )}
          {copyable && (
            <button
              type="button"
              class="shrink-0 px-2 py-1 text-xs rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400"
              onClick={handleCopy}
            >
              复制
            </button>
          )}
        </div>
      ) : null}
      <div class="flex overflow-hidden">
        {showLineNumbers && lineCount > 0 ? (
          <div
            class="shrink-0 select-none py-3 pr-3 text-right text-slate-400 dark:text-slate-500 font-mono text-xs leading-relaxed border-r border-slate-200 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/50"
            aria-hidden
          >
            {lines.map((_, i) => (
              <div key={i}>{lineNumberStart + i}</div>
            ))}
          </div>
        ) : null}
        <pre
          class={twMerge(
            "m-0 flex-1 overflow-auto p-3 font-mono leading-relaxed",
            wrapLongLines && "whitespace-pre-wrap wrap-break-word",
            !wrapLongLines && "whitespace-pre",
            preClass,
          )}
          style={maxHeightStyle}
        >
          <code
            ref={setCodeRef}
            class={twMerge(
              `language-${(language ?? "plaintext").toLowerCase()}`,
              codeClass,
            )}
          >
            {escapeHtml(code)}
          </code>
        </pre>
      </div>
    </div>
  );
}
