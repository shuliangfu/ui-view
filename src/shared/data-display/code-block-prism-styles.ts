/**
 * Prism 语法高亮 token 样式（与 Tailwind 配色一致，支持 dark）。
 * 抽离为独立文件，避免 CodeBlock.tsx 内长模板字面量导致 deno fmt 不稳定。
 */
export const CODE_BLOCK_PRISM_STYLES = `
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
