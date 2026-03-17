/**
 * RichTextEditor 富文本编辑器（View）。
 * WYSIWYG 编辑：加粗/斜体/下划线/删除线、标题、列表、引用、链接、图片（URL/上传）、表格、代码块、对齐、颜色等。
 * 支持粘贴图片到内容区（剪贴板图片转 data URL 或经 onPasteImage 上传后插入）。
 * 工具栏可配置为 simple（简单）、default（默认）、full（全部），或完全自定义。
 * 使用 untrack 读取 value，避免 value 变化触发 effect 重跑导致 contenteditable 被 patch 而失焦。
 */

import { untrack } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

/** 工具栏丰富程度预设 */
export type ToolbarPreset = "simple" | "default" | "full";

/** 单条工具栏项：命令与展示 */
export interface ToolbarItem {
  /** 展示用 key，如 bold、italic */
  key: string;
  /** 按钮标题 / 无障碍文案；可含快捷键说明，如 "加粗 (Ctrl+B)" */
  title: string;
  /** document.execCommand 或自定义命令名 */
  command: string;
  /** 命令参数（如 insertImage 的 url） */
  value?: string;
  /** 图标：可选 SVG 或文字缩写 */
  icon?: string;
  /** 子项（下拉，如标题层级、特殊字符） */
  children?: { value: string; label: string }[];
}

/** 自定义工具栏：二维数组，内层为同一组 */
export type ToolbarConfig = ToolbarItem[][] | ToolbarItem[];

/** 根据预设返回工具栏分组 */
function getToolbarByPreset(preset: ToolbarPreset): ToolbarItem[][] {
  const simple: ToolbarItem[][] = [
    [
      { key: "undo", title: "撤销 (Ctrl+Z)", command: "undo", icon: "↶" },
      { key: "redo", title: "重做 (Ctrl+Y)", command: "redo", icon: "↷" },
      { key: "bold", title: "加粗 (Ctrl+B)", command: "bold", icon: "B" },
      { key: "italic", title: "斜体 (Ctrl+I)", command: "italic", icon: "I" },
      {
        key: "underline",
        title: "下划线 (Ctrl+U)",
        command: "underline",
        icon: "U",
      },
      {
        key: "link",
        title: "插入链接 (Ctrl+K)",
        command: "createLink",
        value: "",
        icon: "🔗",
      },
    ],
  ];

  const defaultPreset: ToolbarItem[][] = [
    ...simple,
    [
      {
        key: "removeFormat",
        title: "清除格式",
        command: "removeFormat",
        icon: "✕",
      },
      {
        key: "heading",
        title: "段落与标题",
        command: "formatBlock",
        value: "p",
        icon: "段落",
        children: [
          { value: "p", label: "正文" },
          { value: "h2", label: "标题 2" },
          { value: "h3", label: "标题 3" },
          { value: "h4", label: "标题 4" },
        ],
      },
      {
        key: "blockquote",
        title: "引用",
        command: "formatBlock",
        value: "blockquote",
        icon: "❝",
      },
      {
        key: "ul",
        title: "无序列表",
        command: "insertUnorderedList",
        icon: "•",
      },
      {
        key: "ol",
        title: "有序列表",
        command: "insertOrderedList",
        icon: "1.",
      },
    ],
  ];

  const full: ToolbarItem[][] = [
    ...defaultPreset,
    [
      { key: "strike", title: "删除线", command: "strikeThrough", icon: "S̲" },
      {
        key: "code",
        title: "行内代码",
        command: "formatBlock",
        value: "pre",
        icon: "</>",
      },
      {
        key: "insertCodeBlock",
        title: "代码块(可高亮)",
        command: "insertCodeBlock",
        icon: "{ }",
      },
      {
        key: "insertImage",
        title: "插入图片 URL",
        command: "insertImage",
        value: "",
        icon: "🖼",
      },
      {
        key: "uploadImage",
        title: "上传图片",
        command: "uploadImage",
        value: "",
        icon: "📤",
      },
      {
        key: "insertTable",
        title: "插入表格",
        command: "insertTable",
        value: "",
        icon: "▦",
      },
      {
        key: "justifyLeft",
        title: "左对齐",
        command: "justifyLeft",
        icon: "≡",
      },
      {
        key: "justifyCenter",
        title: "居中",
        command: "justifyCenter",
        icon: "≡",
      },
      {
        key: "justifyRight",
        title: "右对齐",
        command: "justifyRight",
        icon: "≡",
      },
      {
        key: "foreColor",
        title: "文字颜色",
        command: "foreColor",
        value: "#000000",
        icon: "A",
      },
      {
        key: "backColor",
        title: "背景色",
        command: "backColor",
        value: "#ffff00",
        icon: "🖍",
      },
      {
        key: "hr",
        title: "水平线",
        command: "insertHorizontalRule",
        icon: "—",
      },
      {
        key: "insertSpecialChar",
        title: "特殊字符",
        command: "insertSpecialChar",
        icon: "Ω",
        children: [
          { value: "&nbsp;", label: "空格" },
          { value: "©", label: "©" },
          { value: "®", label: "®" },
          { value: "™", label: "™" },
          { value: "°", label: "°" },
          { value: "×", label: "×" },
          { value: "÷", label: "÷" },
          { value: "…", label: "…" },
          { value: "—", label: "—" },
          { value: "“", label: "“" },
          { value: '"', label: '"' },
          { value: "😀", label: "😀" },
          { value: "👍", label: "👍" },
          { value: "❤", label: "❤" },
        ],
      },
      {
        key: "insertTableWithHeader",
        title: "插入表格(含表头)",
        command: "insertTableWithHeader",
        icon: "▦H",
      },
      { key: "sup", title: "上标", command: "superscript", icon: "x²" },
      { key: "sub", title: "下标", command: "subscript", icon: "x₂" },
      {
        key: "indent",
        title: "首行缩进",
        command: "indentFirstLine",
        icon: "¶",
      },
      { key: "fullscreen", title: "全屏", command: "fullscreen", icon: "⛶" },
      { key: "find", title: "查找 (Ctrl+F)", command: "find", icon: "🔍" },
      { key: "replace", title: "替换", command: "replace", icon: "🔄" },
      { key: "print", title: "打印", command: "print", icon: "🖨" },
      { key: "export", title: "导出", command: "exportContent", icon: "↓" },
      {
        key: "parseMarkdown",
        title: "解析 Markdown",
        command: "parseMarkdown",
        icon: "Md",
      },
      {
        key: "shortcuts",
        title: "快捷键帮助",
        command: "shortcuts",
        icon: "?",
      },
    ],
  ];

  switch (preset) {
    case "simple":
      return simple;
    case "default":
      return defaultPreset;
    case "full":
      return full;
    default:
      return defaultPreset;
  }
}

/** 将自定义配置规范为二维数组 */
function normalizeToolbarConfig(config: ToolbarConfig): ToolbarItem[][] {
  if (config.length === 0) return [];
  const first = config[0];
  if (Array.isArray(first)) return config as ToolbarItem[][];
  return [config as ToolbarItem[]];
}

/** 仅用字符串去除 HTML 标签（SSR 安全，用于字数统计） */
function stripHtmlToText(html: string): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 从 HTML 提取纯文本用于字数统计（SSR 时 document 不可用，用 try/catch 回退到 stripHtmlToText） */
function getPlainText(html: string): string {
  try {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent ?? div.innerText ?? "").trim();
  } catch {
    return stripHtmlToText(html);
  }
}

/** 统计字数（按空格分词，过滤空串） */
function getWordCount(html: string): number {
  const text = getPlainText(html).trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

/** 将选区内的 Markdown 风格转为 HTML（** -> bold, * -> italic, ` -> code, # -> 标题） */
function parseMarkdownInSelection(html: string): string {
  return html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>");
}

export interface RichTextEditorProps {
  /** 当前内容（HTML 字符串）；作为受控值或初始值；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
  /** 内容变化回调（输出 HTML） */
  onChange?: (html: string) => void;
  /** 工具栏丰富程度：simple / default / full；与 toolbar 二选一 */
  toolbarPreset?: ToolbarPreset;
  /** 自定义工具栏（覆盖 toolbarPreset）；二维数组为分组 */
  toolbar?: ToolbarConfig;
  /** 占位文案 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读（仅展示） */
  readOnly?: boolean;
  /** 编辑区最小高度（如 "200px"、"10rem"） */
  minHeight?: string;
  /** 额外 class（作用于最外层容器） */
  class?: string;
  /** 原生 name（会同步到隐藏 input 便于表单提交） */
  name?: string;
  /** 原生 id（编辑区与隐藏 input 会使用） */
  id?: string;
  /** 插入图片 URL 时由调用方提供（如弹窗输入）；若返回 string 则插入，否则不插入 */
  onInsertImage?: () => Promise<string> | string;
  /** 上传图片：选择文件后调用，返回图片 URL 后插入；不传则转为 data URL 插入 */
  onUploadImage?: (file: File) => Promise<string> | string;
  /** 粘贴图片时：不传则用 data URL 插入；传则经此处理（如上传）后插入返回的 URL */
  onPasteImage?: (blob: Blob) => Promise<string> | string;
}

const toolbarWrapCls =
  "flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50";
const toolbarGroupCls =
  "flex items-center gap-0.5 border-r border-slate-200 dark:border-slate-600 pr-2 last:border-r-0 last:pr-0";
const toolbarBtnCls =
  "p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[28px] text-sm font-medium";
const editorCls =
  "w-full min-h-[120px] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-t-0 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 overflow-auto [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_pre]:bg-slate-100 [&_pre]:dark:bg-slate-700 [&_pre]:p-2 [&_pre]:rounded [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:dark:bg-slate-700 [&_th]:p-2 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2";
const editorReadOnlyCls = "cursor-default bg-slate-50 dark:bg-slate-800/80";

export function RichTextEditor(props: RichTextEditorProps) {
  const {
    value = "",
    onChange,
    toolbarPreset = "default",
    toolbar: customToolbar,
    placeholder = "输入内容…",
    disabled = false,
    readOnly = false,
    minHeight = "200px",
    class: className,
    name,
    id,
    onInsertImage,
    onUploadImage,
    onPasteImage,
  } = props;

  const toolbarGroups = customToolbar
    ? normalizeToolbarConfig(customToolbar)
    : getToolbarByPreset(toolbarPreset);

  const editorId = id ?? `rte-${Math.random().toString(36).slice(2, 9)}`;
  const uploadInputId = `${editorId}-upload`;

  const insertImageUrl = (url: string) => {
    const editor = document.getElementById(editorId) as HTMLDivElement | null;
    if (editor) {
      editor.focus();
      document.execCommand("insertImage", false, url);
    }
  };

  const handleToolbarAction = (item: ToolbarItem, childValue?: string) => {
    if (disabled || readOnly) return;
    const editor = document.getElementById(editorId) as HTMLDivElement | null;
    if (!editor) return;
    editor.focus();

    const cmd = item.command;
    const val = childValue ?? item.value ?? "";

    if (cmd === "createLink") {
      const url = globalThis.prompt?.("输入链接 URL") ?? "";
      if (url) document.execCommand(cmd, false, url);
      return;
    }
    if (cmd === "insertImage") {
      if (onInsertImage) {
        Promise.resolve(onInsertImage()).then((url) => {
          if (url) insertImageUrl(url);
        });
      } else {
        const url = globalThis.prompt?.("输入图片 URL") ?? "";
        if (url) insertImageUrl(url);
      }
      return;
    }
    if (cmd === "uploadImage") {
      const input = document.getElementById(uploadInputId) as
        | HTMLInputElement
        | null;
      if (input) {
        input.value = "";
        input.click();
      }
      return;
    }
    if (cmd === "insertTable") {
      const rowsStr = globalThis.prompt?.("行数", "3") ?? "3";
      const colsStr = globalThis.prompt?.("列数", "3") ?? "3";
      const rows = Math.max(1, Math.min(20, parseInt(rowsStr, 10) || 3));
      const cols = Math.max(1, Math.min(10, parseInt(colsStr, 10) || 3));
      const tableStyles =
        "border-collapse:collapse;width:100%;table-layout:fixed";
      const cellStyles =
        "border:1px solid #cbd5e1;padding:6px 8px;min-width:60px;";
      let html = `<table style="${tableStyles}" class="rte-table"><tbody>`;
      for (let r = 0; r < rows; r++) {
        html += "<tr>";
        for (let c = 0; c < cols; c++) {
          html += `<td style="${cellStyles}">&nbsp;</td>`;
        }
        html += "</tr>";
      }
      html += "</tbody></table>";
      document.execCommand("insertHTML", false, html);
      emitChange();
      return;
    }
    if (cmd === "foreColor" || cmd === "backColor") {
      const color = globalThis.prompt?.("输入颜色（如 #333）", val) ?? val;
      if (color) document.execCommand(cmd, false, color);
      emitChange();
      return;
    }
    if (cmd === "insertHorizontalRule") {
      document.execCommand("insertHorizontalRule", false);
      emitChange();
      return;
    }
    if (cmd === "insertSpecialChar" && childValue != null) {
      const toInsert = childValue.startsWith("&") ? childValue : childValue;
      document.execCommand("insertHTML", false, toInsert);
      emitChange();
      return;
    }
    if (cmd === "insertTableWithHeader") {
      const rowsStr = globalThis.prompt?.("行数（含表头）", "4") ?? "4";
      const colsStr = globalThis.prompt?.("列数", "3") ?? "3";
      const rows = Math.max(2, Math.min(20, parseInt(rowsStr, 10) || 4));
      const cols = Math.max(1, Math.min(10, parseInt(colsStr, 10) || 3));
      const tableStyles =
        "border-collapse:collapse;width:100%;table-layout:fixed";
      const cellStyles =
        "border:1px solid #cbd5e1;padding:6px 8px;min-width:60px;";
      const thStyles = cellStyles +
        ";font-weight:600;background:rgb(241 245 249);";
      let html = `<table style="${tableStyles}" class="rte-table"><thead><tr>`;
      for (let c = 0; c < cols; c++) {
        html += `<th style="${thStyles}">&nbsp;</th>`;
      }
      html += "</tr></thead><tbody>";
      for (let r = 1; r < rows; r++) {
        html += "<tr>";
        for (let c = 0; c < cols; c++) {
          html += `<td style="${cellStyles}">&nbsp;</td>`;
        }
        html += "</tr>";
      }
      html += "</tbody></table>";
      document.execCommand("insertHTML", false, html);
      emitChange();
      return;
    }
    if (cmd === "superscript" || cmd === "subscript") {
      document.execCommand(cmd, false);
      emitChange();
      return;
    }
    if (cmd === "indentFirstLine") {
      document.execCommand("formatBlock", false, "p");
      const sel = document.getSelection();
      if (sel && sel.anchorNode) {
        const block = sel.anchorNode.nodeType === 3
          ? sel.anchorNode.parentElement
          : sel.anchorNode as Element;
        const p = block?.closest?.("p");
        if (p && !p.style.textIndent) p.style.textIndent = "2em";
      }
      emitChange();
      return;
    }
    if (cmd === "fullscreen") {
      const root = document.getElementById(`${editorId}-root`);
      if (root) root.classList.toggle("rte-fullscreen");
      return;
    }
    if (cmd === "find") {
      const bar = document.getElementById(`${editorId}-findbar`);
      if (bar) bar.classList.toggle("rte-findbar-hidden");
      return;
    }
    if (cmd === "replace") {
      const bar = document.getElementById(`${editorId}-findbar`);
      if (bar) {
        bar.classList.remove("rte-findbar-hidden");
        const replaceInput = bar.querySelector("[data-replace-input]") as
          | HTMLInputElement
          | null;
        if (replaceInput) replaceInput.focus();
      }
      return;
    }
    if (cmd === "print") {
      const html = getEditorHtml();
      const win = globalThis.open("", "_blank");
      if (win) {
        win.document.write(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>打印</title></head><body>${html}</body></html>`,
        );
        win.document.close();
        win.focus();
        win.print();
        win.close();
      }
      return;
    }
    if (cmd === "exportContent") {
      const html = getEditorHtml();
      const mode = globalThis.confirm?.("导出为 HTML？取消则导出为纯文本") ??
        true;
      const blob = mode
        ? new Blob([html], { type: "text/html;charset=utf-8" })
        : new Blob([getPlainText(html)], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = mode ? "content.html" : "content.txt";
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    if (cmd === "parseMarkdown") {
      const sel = document.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const fragment = range.cloneContents();
        const div = document.createElement("div");
        div.appendChild(fragment);
        const parsed = parseMarkdownInSelection(div.innerHTML);
        document.execCommand("insertHTML", false, parsed);
        emitChange();
      }
      return;
    }
    if (cmd === "shortcuts") {
      const msg =
        "快捷键：\nCtrl+Z 撤销\nCtrl+Y 重做\nCtrl+B 加粗\nCtrl+I 斜体\nCtrl+U 下划线\nCtrl+K 插入链接\nCtrl+F 查找";
      globalThis.alert?.(msg);
      return;
    }
    if (cmd === "insertCodeBlock") {
      const html =
        '<pre class="rte-code-block language-plaintext"><code><br></code></pre>';
      document.execCommand("insertHTML", false, html);
      emitChange();
      return;
    }
    if (cmd === "undo" || cmd === "redo" || cmd === "removeFormat") {
      document.execCommand(cmd, false);
      emitChange();
      return;
    }

    document.execCommand(cmd, false, val);
    emitChange();
  };

  const handleInput = (e: Event) => {
    const el = e.currentTarget as HTMLDivElement;
    emitChange(el.innerHTML);
  };

  const getEditorHtml = () => {
    const editor = document.getElementById(editorId) as HTMLDivElement | null;
    return editor?.innerHTML ?? "";
  };

  /** 通知父组件并同步 hidden input（因 value 用 untrack 不随 signal 更新，需在每次变更时手动写回） */
  const emitChange = (html?: string) => {
    const h = html ?? getEditorHtml();
    onChange?.(h);
    if (name != null) {
      const el = document.getElementById(`${editorId}-hidden`) as
        | HTMLInputElement
        | null;
      if (el) el.value = h;
    }
  };

  const handleUploadChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const resolveUrl = (url: string) => {
      insertImageUrl(url);
      emitChange();
    };
    if (onUploadImage) {
      Promise.resolve(onUploadImage(file)).then((url) => {
        if (url) resolveUrl(url);
      });
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (dataUrl) resolveUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: Event) => {
    const ev = e as ClipboardEvent;
    const items = ev.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (!blob) return;
        ev.preventDefault();
        const resolveUrl = (url: string) => {
          insertImageUrl(url);
          emitChange();
        };
        if (onPasteImage) {
          Promise.resolve(onPasteImage(blob)).then((url) => {
            if (url) resolveUrl(url);
          });
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            if (dataUrl) resolveUrl(dataUrl);
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
  };

  const showToolbar = !readOnly && toolbarGroups.length > 0;
  /** 用 untrack 读 value，避免订阅导致 value 变化时 effect 重跑、patch 编辑区失焦 */
  const wordCount = untrack(() =>
    getWordCount(typeof value === "function" ? value() : (value ?? ""))
  );

  const handleKeyDown = (e: Event) => {
    const ev = e as KeyboardEvent;
    if (ev.ctrlKey || ev.metaKey) {
      const key = ev.key.toLowerCase();
      if (key === "z") {
        ev.preventDefault();
        document.execCommand(ev.shiftKey ? "redo" : "undo");
        emitChange();
      } else if (key === "y") {
        ev.preventDefault();
        document.execCommand("redo");
        emitChange();
      } else if (key === "b") {
        ev.preventDefault();
        document.execCommand("bold");
        emitChange();
      } else if (key === "i") {
        ev.preventDefault();
        document.execCommand("italic");
        emitChange();
      } else if (key === "u") {
        ev.preventDefault();
        document.execCommand("underline");
        emitChange();
      } else if (key === "k") {
        ev.preventDefault();
        const url = globalThis.prompt?.("输入链接 URL") ?? "";
        if (url) document.execCommand("createLink", false, url);
        emitChange();
      } else if (key === "f") {
        ev.preventDefault();
        const bar = document.getElementById(`${editorId}-findbar`);
        if (bar) bar.classList.toggle("rte-findbar-hidden");
      }
    }
  };

  const doFind = () => {
    const bar = document.getElementById(`${editorId}-findbar`);
    if (!bar) return;
    const findInput = bar.querySelector("[data-find-input]") as
      | HTMLInputElement
      | null;
    const query = findInput?.value?.trim();
    if (!query) return;
    const editor = document.getElementById(editorId);
    if (!editor) return;
    const text = getPlainText(editor.innerHTML);
    const idx = text.indexOf(query);
    if (idx === -1) {
      globalThis.alert?.("未找到");
      return;
    }
    try {
      const sel = document.getSelection();
      if (sel) {
        const range = document.createRange();
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        let pos = 0;
        let startNode: Text | null = null;
        let startOffset = 0;
        let endNode: Text | null = null;
        let endOffset = 0;
        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          const len = node.textContent?.length ?? 0;
          if (startNode === null && pos + len > idx) {
            startNode = node;
            startOffset = idx - pos;
          }
          if (endNode === null && pos + len >= idx + query.length) {
            endNode = node;
            endOffset = idx + query.length - pos;
            break;
          }
          pos += len;
        }
        if (startNode && endNode && sel) {
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
          sel.removeAllRanges();
          sel.addRange(range);
          editor.focus();
        }
      }
    } catch {
      globalThis.alert?.("未找到");
    }
  };

  const doReplace = (all: boolean) => {
    const bar = document.getElementById(`${editorId}-findbar`);
    if (!bar) return;
    const findInput = bar.querySelector("[data-find-input]") as
      | HTMLInputElement
      | null;
    const replaceInput = bar.querySelector("[data-replace-input]") as
      | HTMLInputElement
      | null;
    const find = findInput?.value ?? "";
    const replace = replaceInput?.value ?? "";
    if (!find) return;
    const editor = document.getElementById(editorId) as HTMLDivElement | null;
    if (!editor) return;
    if (all) {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walker.nextNode()) {
        nodes.push(walker.currentNode as Text);
      }
      for (const node of nodes) {
        const text = node.textContent ?? "";
        if (text.includes(find)) {
          node.textContent = text.split(find).join(replace);
        }
      }
      onChange?.(editor.innerHTML);
    } else {
      const sel = document.getSelection();
      if (sel && sel.toString() === find) {
        document.execCommand("insertText", false, replace);
        emitChange();
      } else {
        doFind();
      }
    }
  };

  return () => (
    <div
      id={`${editorId}-root`}
      class={twMerge(
        "rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 relative",
        "[&.rte-fullscreen]:fixed [&.rte-fullscreen]:inset-0 [&.rte-fullscreen]:z-9999 [&.rte-fullscreen]:bg-white [&.rte-fullscreen]:dark:bg-slate-900 [&.rte-fullscreen]:flex [&.rte-fullscreen]:flex-col",
        className,
      )}
    >
      {showToolbar && (
        <div
          class={toolbarWrapCls}
          role="toolbar"
          aria-label="编辑工具栏"
          onMouseDown={(e: Event) => e.preventDefault()}
        >
          {toolbarGroups.map((group, gi) => (
            <div key={gi} class={toolbarGroupCls}>
              {group.map((item) =>
                item.children && item.children.length > 0
                  ? (
                    <select
                      key={item.key}
                      class={twMerge(
                        toolbarBtnCls,
                        "cursor-pointer appearance-none pr-6",
                      )}
                      disabled={disabled}
                      title={item.title}
                      aria-label={item.title}
                      onMouseDown={(e: Event) => e.preventDefault()}
                      onChange={(e: Event) => {
                        const v = (e.target as HTMLSelectElement).value;
                        handleToolbarAction(item, v);
                      }}
                    >
                      {item.children.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  )
                  : (
                    <button
                      type="button"
                      key={item.key}
                      class={toolbarBtnCls}
                      disabled={disabled}
                      title={item.title}
                      aria-label={item.title}
                      onMouseDown={(e: Event) => e.preventDefault()}
                      onClick={() =>
                        handleToolbarAction(item)}
                    >
                      {item.icon ?? item.key}
                    </button>
                  )
              )}
            </div>
          ))}
        </div>
      )}
      <div
        id={`${editorId}-findbar`}
        class={twMerge(
          "flex flex-wrap items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 rte-findbar-hidden",
          "[&.rte-findbar-hidden]:h-0 [&.rte-findbar-hidden]:overflow-hidden [&.rte-findbar-hidden]:opacity-0 [&.rte-findbar-hidden]:pointer-events-none [&.rte-findbar-hidden]:min-h-0 [&.rte-findbar-hidden]:p-0 [&.rte-findbar-hidden]:border-b-0",
        )}
        role="search"
      >
        <input
          type="text"
          data-find-input
          placeholder="查找"
          class="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800"
        />
        <button type="button" class={toolbarBtnCls} onClick={() => doFind()}>
          查找
        </button>
        <input
          type="text"
          data-replace-input
          placeholder="替换为"
          class="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800"
        />
        <button
          type="button"
          class={toolbarBtnCls}
          onClick={() => doReplace(false)}
        >
          替换
        </button>
        <button
          type="button"
          class={toolbarBtnCls}
          onClick={() => doReplace(true)}
        >
          全部替换
        </button>
      </div>
      <div
        key={`${editorId}-body`}
        id={editorId}
        contentEditable={!disabled && !readOnly}
        data-placeholder={placeholder}
        class={twMerge(
          editorCls,
          readOnly && editorReadOnlyCls,
          "empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-500",
        )}
        style={minHeight ? { minHeight } : undefined}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        aria-readonly={readOnly}
        aria-disabled={disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        ref={(el: HTMLDivElement | null) => {
          if (!el) return;
          // 用 untrack 读 value，避免订阅导致 value 变化时 effect 重跑、patch 导致失焦
          const v = untrack(() =>
            typeof value === "function" ? value() : value
          );
          if (v === undefined) return;
          // 正在编辑（编辑器有焦点）时不从 value 覆盖 innerHTML，避免输入时失焦
          if (globalThis.document?.activeElement === el) return;
          if (el.innerHTML !== v) {
            el.innerHTML = v;
          }
        }}
      />
      {name != null && (
        <input
          type="hidden"
          id={`${editorId}-hidden`}
          name={name}
          value={untrack(() =>
            (typeof value === "function" ? value() : value) ?? ""
          )}
          readOnly
          aria-hidden="true"
        />
      )}
      <input
        type="file"
        id={uploadInputId}
        accept="image/*"
        class="hidden"
        aria-hidden="true"
        onChange={handleUploadChange}
      />
      {showToolbar && (
        <div
          class="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600"
          aria-live="polite"
        >
          字数：{wordCount}
        </div>
      )}
    </div>
  );
}
