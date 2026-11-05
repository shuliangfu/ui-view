/**
 * @module shared/prism-languages
 * @description CodeBlock 与 Markdown 预览共用的 Prism 语言表。
 * 在此静态注册白名单语言（避免两处重复 import）；未知 id 不得高亮，调用方应走 textContent。
 */

import Prism from "prismjs";
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-tsx.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-markdown.js";

/** 已注册／允许高亮的语言 id（含别名） */
export const PRISM_LANG_ALLOW = new Set([
  "plaintext",
  "markup",
  "html",
  "css",
  "javascript",
  "typescript",
  "json",
  "bash",
  "shell",
  "markdown",
  "jsx",
  "tsx",
]);

/**
 * 归一化语言 id：html→markup、shell→bash；tsx 无独立 grammar 时回退 typescript。
 *
 * @returns 可用于 `Prism.languages[id]` 的 id，或 `null`（不在白名单）
 */
export function normalizePrismLang(language: string | undefined | null): string | null {
  let lang = (language ?? "plaintext").toLowerCase();
  if (!PRISM_LANG_ALLOW.has(lang)) return null;
  if (lang === "html") lang = "markup";
  if (lang === "shell") lang = "bash";
  if (lang === "plaintext") return "plaintext";
  return lang;
}

type PrismLike = {
  languages?: Record<string, unknown>;
  highlight: (code: string, grammar: unknown, lang: string) => string;
};

/**
 * 对白名单语言做 Prism 高亮；失败或未知语言返回 `null`（调用方应 textContent）。
 */
export function highlightPrismCode(
  code: string,
  language: string | undefined | null,
): string | null {
  const lang0 = normalizePrismLang(language);
  if (lang0 == null || lang0 === "plaintext") return null;
  const prism = Prism as unknown as PrismLike;
  let lang = lang0;
  let grammar = prism.languages?.[lang];
  if (!grammar && lang === "tsx") {
    grammar = prism.languages?.["typescript"];
    if (grammar) lang = "typescript";
  }
  if (!grammar) return null;
  try {
    return prism.highlight(code, grammar, lang);
  } catch {
    return null;
  }
}

export { Prism };
