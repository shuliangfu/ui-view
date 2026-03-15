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
import { IconCopy } from "../basic/icons/mod.ts";
import { toast } from "../feedback/toast-store.ts";
import { CODE_BLOCK_PRISM_STYLES } from "./code-block-prism-styles.ts";

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
  /** 是否显示左上角三色圆点（仿 macOS 窗口按钮），默认 true */
  showWindowDots?: boolean;
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

export function CodeBlock(props: CodeBlockProps) {
  const {
    code,
    language = "plaintext",
    showLineNumbers = false,
    lineNumberStart = 1,
    maxHeight,
    title,
    copyable = true,
    showWindowDots = true,
    onCopy,
    wrapLongLines = false,
    class: className,
    preClass,
    codeClass,
  } = props;

  const maxHeightStyle = maxHeight != null
    ? {
      maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
    }
    : undefined;

  const lines = code.split("\n");
  const lineCount = lines.length;

  /** 服务端无 DOM，需在 JSX 中直接输出代码文本，供 SSR 可见；客户端由 setCodeRef 替换为高亮结果 */
  const setCodeRef = (el: unknown) => {
    const codeEl = el as HTMLElement | null;
    if (!codeEl || typeof globalThis.document === "undefined") return;
    let lang = (language ?? "plaintext").toLowerCase();
    if (lang === "html") lang = "markup";
    if (lang === "shell") lang = "bash";
    const prism = Prism as {
      languages?: Record<string, unknown>;
      highlight: (code: string, grammar: unknown, lang: string) => string;
    };
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
      globalThis.navigator.clipboard.writeText(code).then(() => {
        toast.success("复制成功", 2000);
        onCopy?.();
      }).catch(() => {
        toast.error("复制失败", 2000);
      });
    } else {
      toast.error("复制失败", 2000);
      onCopy?.();
    }
  };

  const setWrapperRef = (el: unknown) => {
    const wrapper = el as HTMLElement | null;
    if (!wrapper) return;
    if (
      (wrapper as HTMLElement & { _codeBlockStyle?: boolean })._codeBlockStyle
    ) return;
    (wrapper as HTMLElement & { _codeBlockStyle?: boolean })._codeBlockStyle =
      true;
    const style = wrapper.ownerDocument.createElement("style");
    style.textContent = CODE_BLOCK_PRISM_STYLES;
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
      {(title != null && title !== "") || showWindowDots
        ? (
          <div class="relative flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-200 dark:border-slate-600 bg-slate-100/80 dark:bg-slate-700/50">
            {/* 左上角三色圆点（仿 macOS 窗口按钮，仅装饰）；可通过 showWindowDots 关闭 */}
            {showWindowDots && (
              <div
                class="relative z-10 flex items-center gap-1.5 shrink-0"
                aria-hidden
              >
                <span
                  class="w-2.5 h-2.5 rounded-full bg-[#ef4446]"
                  title="关闭"
                />
                <span
                  class="w-2.5 h-2.5 rounded-full bg-[#e5a00d]"
                  title="最小化"
                />
                <span
                  class="w-2.5 h-2.5 rounded-full bg-[#34c749]"
                  title="最大化"
                />
              </div>
            )}
            {/* 标题相对整条标题栏绝对居中，不受左侧圆点影响 */}
            {title != null && title !== "" && (
              <span class="absolute inset-0 flex items-center justify-center pointer-events-none font-medium text-slate-700 dark:text-slate-300 truncate max-w-full px-12">
                {title}
              </span>
            )}
          </div>
        )
        : null}
      {/* 代码区域：复制按钮放在右上角，不占标题栏 */}
      <div class="relative flex overflow-hidden">
        {copyable && (
          <button
            type="button"
            class="absolute top-2 right-2 z-10 p-2 rounded hover:bg-slate-200/80 dark:hover:bg-slate-600/80 text-slate-600 dark:text-slate-400 transition-colors"
            onClick={handleCopy}
            title="复制"
            aria-label="复制"
          >
            <IconCopy class="w-4 h-4" />
          </button>
        )}
        {showLineNumbers && lineCount > 0
          ? (
            <div
              class="shrink-0 select-none py-3 pr-3 text-right text-slate-400 dark:text-slate-500 font-mono text-xs leading-relaxed border-r border-slate-200 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/50"
              aria-hidden
            >
              {lines.map((_, i) => <div key={i}>{lineNumberStart + i}</div>)}
            </div>
          )
          : null}
        <pre
          class={twMerge(
            "m-0 flex-1 overflow-auto p-3 font-mono leading-relaxed",
            copyable && "pr-12",
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
            {/* SSR 输出 code 文本；客户端 setCodeRef 替换为高亮 */}
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
