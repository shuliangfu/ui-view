/**
 * @module shared/form/rich-text-editor-toolbar
 * @description RichTextEditor 工具栏预设、按钮内容与样式辅助。
 */

import { type Owner } from "@dreamer/view";
import { safeRandomUUID } from "../utils/safe-random-uuid.ts";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "../../desktop/feedback/Tooltip.tsx";
import { controlBlueFocusRing } from "./input-focus-ring.ts";
import type {
  RichTextEditorMessages,
  ToolbarConfig,
  ToolbarItem,
  ToolbarPreset,
} from "./rich-text-editor-types.ts";

export function RteToolbarItemTip(props: {
  /** 列表项稳定 key，供 {@link For} 协调；不参与 Tooltip 逻辑 */
  key?: string | number;
  content: string;
  children?: unknown;
  class?: string;
}) {
  const c = props.content.trim();
  if (!c) {
    return <>{props.children}</>;
  }
  // 工具栏多在编辑区上方，placement 取 bottom 减少贴顶溢出
  return (
    <Tooltip
      content={c}
      placement="top"
      class={twMerge("shrink-0 items-center", props.class)}
      overlayClass="z-10050"
      arrow
    >
      {props.children}
    </Tooltip>
  );
}

/**
 * 根据预设与 {@link RichTextEditorMessages} 的工具栏文案返回工具栏分组。
 * 各 `title` 全部从 `messages.toolbar` 取值，便于本地化覆盖；自定义 `toolbar` 不走此函数。
 */
export function getToolbarByPreset(
  preset: ToolbarPreset,
  messages: RichTextEditorMessages,
): ToolbarItem[][] {
  const t = messages.toolbar;
  const sourceItem: ToolbarItem = {
    key: "sourceHtml",
    title: t.sourceHtml,
    command: "rteToggleSourceHtml",
    icon: "HTML",
  };
  const rowBasic: ToolbarItem[] = [
    sourceItem,
    { key: "undo", title: t.undo, command: "undo", icon: "↶" },
    { key: "redo", title: t.redo, command: "redo", icon: "↷" },
    { key: "bold", title: t.bold, command: "bold", icon: "B" },
    { key: "italic", title: t.italic, command: "italic", icon: "I" },
    { key: "underline", title: t.underline, command: "underline", icon: "U" },
    { key: "link", title: t.link, command: "createLink", value: "" },
  ];
  const headingItem: ToolbarItem = {
    key: "heading",
    title: t.heading,
    command: "formatBlock",
    value: "p",
    icon: t.headingIconLabel,
    children: [
      { value: "p", label: messages.blockLabels.p },
      { value: "h2", label: messages.blockLabels.h2 },
      { value: "h3", label: messages.blockLabels.h3 },
      { value: "h4", label: messages.blockLabels.h4 },
    ],
  };
  const fontSizeItem: ToolbarItem = {
    key: "fontSize",
    title: t.fontSize,
    command: "rteFontSize",
    value: "16px",
    children: [
      { value: "12px", label: "12px" },
      { value: "14px", label: "14px" },
      { value: "16px", label: "16px" },
      { value: "18px", label: "18px" },
      { value: "20px", label: "20px" },
      { value: "24px", label: "24px" },
      { value: "28px", label: "28px" },
    ],
  };
  const lineHeightItem: ToolbarItem = {
    key: "lineHeight",
    title: t.lineHeight,
    command: "rteLineHeight",
    value: "1.5",
    children: [
      { value: "1.25", label: "1.25" },
      { value: "1.5", label: "1.5" },
      { value: "1.75", label: "1.75" },
      { value: "2", label: "2" },
      { value: "2.5", label: "2.5" },
    ],
  };
  const rowTypography: ToolbarItem[] = [
    headingItem,
    fontSizeItem,
    lineHeightItem,
  ];
  const rowColors: ToolbarItem[] = [
    {
      key: "foreColor",
      title: t.foreColor,
      command: "foreColor",
      value: "#000000",
      icon: "A",
    },
    {
      key: "backColor",
      title: t.backColor,
      command: "backColor",
      value: "#ffff00",
    },
  ];

  /** 独立一行全屏（与 `full` 预设同源项一致），`simple` 用于小说等长文时可一键铺满视口编辑。 */
  const rowFullscreen: ToolbarItem[] = [
    {
      key: "fullscreen",
      title: t.fullscreen,
      command: "fullscreen",
      /** 图标由 `renderToolbarButtonContent` 的 `fullscreen` 分支绘制（全屏后切换为退出形） */
      icon: "⛶",
    },
  ];

  const simple: ToolbarItem[][] = [
    rowBasic,
    rowTypography,
    rowColors,
    rowFullscreen,
  ];

  const defaultPreset: ToolbarItem[][] = [
    rowBasic,
    rowTypography,
    [
      {
        key: "removeFormat",
        title: t.removeFormat,
        command: "removeFormat",
        icon: "✕",
      },
      {
        key: "blockquote",
        title: t.blockquote,
        command: "formatBlock",
        value: "blockquote",
      },
      { key: "ul", title: t.ul, command: "insertUnorderedList", icon: "•" },
      { key: "ol", title: t.ol, command: "insertOrderedList", icon: "1." },
    ],
    rowColors,
  ];

  const full: ToolbarItem[][] = [
    ...defaultPreset,
    [
      {
        key: "strike",
        title: t.strike,
        command: "strikeThrough",
        /** 预设工具栏由 `renderToolbarButtonContent` 的 `strike` 分支绘制 SVG；保留字符供自定义回退 */
        icon: "S̲",
      },
      {
        key: "code",
        title: t.code,
        command: "formatBlock",
        value: "pre",
        icon: "</>",
      },
      {
        key: "insertCodeBlock",
        title: t.insertCodeBlock,
        command: "insertCodeBlock",
        icon: "{ }",
      },
      {
        key: "insertImage",
        title: t.insertImage,
        command: "insertImage",
        value: "",
      },
      {
        key: "uploadImage",
        title: t.uploadImage,
        command: "uploadImage",
        value: "",
      },
      {
        key: "insertTable",
        title: t.insertTable,
        command: "insertTable",
        value: "",
        icon: "▦",
      },
      {
        key: "justifyLeft",
        title: t.justifyLeft,
        command: "justifyLeft",
        icon: "≡",
      },
      {
        key: "justifyCenter",
        title: t.justifyCenter,
        command: "justifyCenter",
        icon: "≡",
      },
      {
        key: "justifyRight",
        title: t.justifyRight,
        command: "justifyRight",
        icon: "≡",
      },
      {
        key: "hr",
        title: t.hr,
        command: "insertHorizontalRule",
        icon: "—",
      },
      {
        key: "insertSpecialChar",
        title: t.insertSpecialChar,
        command: "insertSpecialChar",
        icon: "Ω",
        children: [
          { value: "&nbsp;", label: messages.specialChars.nbsp },
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
          { value: "😀", label: messages.specialChars.smile },
          { value: "👍", label: messages.specialChars.thumb },
          { value: "❤", label: messages.specialChars.heart },
        ],
      },
      {
        key: "insertTableWithHeader",
        title: t.insertTableWithHeader,
        command: "insertTableWithHeader",
        icon: "▦H",
      },
      { key: "sup", title: t.sup, command: "superscript", icon: "x²" },
      { key: "sub", title: t.sub, command: "subscript", icon: "x₂" },
      {
        key: "indent",
        title: t.indent,
        command: "indentFirstLine",
        icon: "¶",
      },
      {
        key: "fullscreen",
        title: t.fullscreen,
        command: "fullscreen",
        /** 图标由 `renderToolbarButtonContent` 的 `fullscreen` 分支绘制（全屏后切换为退出形） */
        icon: "⛶",
      },
      { key: "find", title: t.find, command: "find" },
      { key: "replace", title: t.replace, command: "replace" },
      { key: "print", title: t.print, command: "print" },
      { key: "export", title: t.export, command: "exportContent" },
      {
        key: "shortcuts",
        title: t.shortcuts,
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
export function normalizeToolbarConfig(config: ToolbarConfig): ToolbarItem[][] {
  if (config.length === 0) return [];
  const first = config[0];
  if (Array.isArray(first)) return config as ToolbarItem[][];
  return [config as ToolbarItem[]];
}

/** 仅用字符串去除 HTML 标签（SSR 安全，用于字数统计） */
const rteToolbarSvgCls = "size-4 shrink-0";

/**
 * 渲染工具栏按钮内容：预设项用 currentColor 线框 SVG，避免彩色 emoji；未知项回退到 `icon` 或 `key` 文本。
 *
 * @param item - 工具栏配置项
 * @param options - 运行时状态；`rteFullscreen` 为 true 时 `fullscreen` 项显示「退出全屏」图标
 */
export function renderToolbarButtonContent(
  item: ToolbarItem,
  options?: { rteFullscreen?: boolean },
) {
  switch (item.key) {
    /**
     * 插入链接：原双弧线路径在 16px 下易糊成「一团」；改用与 `IconLink2`（Link2.tsx）
     * 相同的链环造型，小工具栏上更易辨认。
     */
    case "link":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 17H7A5 5 0 0 1 7 7h2"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 7h2a5 5 0 1 1 0 10h-2"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h8"
          />
        </svg>
      );
    case "blockquote":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-width="2"
            d="M8 6v12M8 8h6a2 2 0 012 2v2a2 2 0 01-2 2H8"
          />
        </svg>
      );
    case "insertImage":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            fill="none"
            stroke-width="2"
          />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 15l-5-5L5 21"
          />
        </svg>
      );
    case "uploadImage":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v12"
          />
        </svg>
      );
    case "backColor":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 20h16M6 16l6-12 4 4-6 8"
          />
        </svg>
      );
    case "find":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      );
    case "replace":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 7h12M4 7l3-3m-3 3l3 3M20 17H8m12 0l-3 3m3-3l-3-3"
          />
        </svg>
      );
    case "print":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 9V5h12v4M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
          />
        </svg>
      );
    case "export":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V4"
          />
        </svg>
      );
    /** 左对齐：与 `IconAlignLeft`（AlignLeft.tsx）路径一致 */
    case "justifyLeft":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h10M4 18h14"
          />
        </svg>
      );
    /** 居中对齐：与 `IconAlignCenter`（AlignCenter.tsx）路径一致 */
    case "justifyCenter":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M7 12h10M5 18h14"
          />
        </svg>
      );
    /** 右对齐：与 `IconAlignRight`（AlignRight.tsx）路径一致 */
    case "justifyRight":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M10 12h10M6 18h14"
          />
        </svg>
      );
    /**
     * 删除线：配置里 `S̲` 为文本组合字符，下划线受字距影响易偏右；
     * 使用与 Lucide「Strikethrough」一致的路径（横线贯穿 S 形中部、几何居中）。
     */
    case "strike":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 4H9a3 3 0 0 0-2.83 4"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14 12a4 4 0 0 1 0 8H6"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 12h16"
          />
        </svg>
      );
    /**
     * HTML 源码切换：尖括号 + 斜杠，与「行内代码」的 `</>` 文本配置区分图形。
     */
    case "sourceHtml":
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 9l-4 4 4 4M16 9l4 4-4 4"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.5 6l-5 12"
          />
        </svg>
      );
    /**
     * 全屏：未全屏时与 `IconMaximize2` 同形；全屏后与 `IconExitFullscreen` 同形（四角向内）。
     */
    case "fullscreen":
      if (options?.rteFullscreen) {
        return (
          <svg
            class={rteToolbarSvgCls}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 9l4 0l0 -4"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 3l6 6"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 15l4 0l0 4"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 21l6 -6"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-4 0l0 -4"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 9l6 -6"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 15l-4 0l0 4"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 15l6 6"
            />
          </svg>
        );
      }
      return (
        <svg
          class={rteToolbarSvgCls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 4l4 0l0 4"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14 10l6 -6"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 20l-4 0l0 -4"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 20l6 -6"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 20l4 0l0 -4"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14 14l6 6"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 4l-4 0l0 4"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4l6 6"
          />
        </svg>
      );
    default:
      return (
        <span class="inline-flex min-w-5 items-center justify-center leading-none">
          {item.icon ?? item.key}
        </span>
      );
  }
}

export const toolbarWrapCls =
  "flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50";
export const toolbarGroupCls =
  "flex items-center gap-0.5 border-r border-slate-200 dark:border-slate-600 pr-1 last:border-r-0 last:pr-0";
/** 工具栏按钮底纹（不含聚焦 ring，由 {@link controlBlueFocusRing} 控制） */
export const toolbarBtnBase =
  "inline-flex items-center justify-center p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed min-w-[28px] min-h-[28px] text-sm font-medium";

/**
 * 整表禁用或源码模式下（除「源码切换」外）下拉不可用；段落下拉外层 `div` 无 `disabled`，须单独套灰度与弱色字。
 *
 * @param rteSource - 当前是否 HTML 源码模式
 * @param editorDisabled - `RichTextEditor` 的 `disabled`
 * @param item - 工具项
 */
export function rteToolbarDropdownDisabled(
  rteSource: boolean,
  editorDisabled: boolean,
  item: ToolbarItem,
): boolean {
  return editorDisabled ||
    (rteSource && item.command !== "rteToggleSourceHtml");
}

/** 撤销/重做在「可用」时的强调色（相对默认工具栏灰字加亮） */
export const toolbarHistoryActiveCls =
  "text-slate-900 dark:text-slate-100 font-semibold";
/** 撤销/重做在「当前不可用」时的弱化色（暗色背景下 slate-600 + disabled:opacity-50 会几乎看不见，故提亮并减轻 disabled 叠暗） */
export const toolbarHistoryMutedCls =
  "text-slate-500 dark:text-slate-400 disabled:opacity-80";

/**
 * 工具栏内原生 `<select>`：默认宽度往往等于**最宽 option**，短标签（如「正文」「空格」）右侧会空一大块；
 * `field-sizing: content` 按**当前选中项**收缩宽度（Chrome 123+、Safari 17.4+、Firefox 等，旧浏览器回退为较宽）。
 * 右侧 `padding` 在具体 `select` 上与 `appearance-none` 配合，略小于旧版 `pr-5` 以收紧「正文 / 空格」等短标签右侧空白。
 * 段落下拉外层勿对子级 select 使用 `flex-1`，否则会强行撑满父级。
 */
export const rteToolbarSelectFitCls =
  "text-left [field-sizing:content] w-max min-w-0 max-w-[min(100%,14rem)]";

/**
 * 无表头表格 HTML（与历史 `insertTable` 行内样式一致）。
 *
 * @param rows - 行数
 * @param cols - 列数
 */
export function buildRtePlainTableHtml(rows: number, cols: number): string {
  const tableStyles = "border-collapse:collapse;width:100%;table-layout:fixed";
  const cellStyles = "border:1px solid #cbd5e1;padding:6px 8px;min-width:60px;";
  let html = `<table style="${tableStyles}" class="rte-table"><tbody>`;
  for (let r = 0; r < rows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      html += `<td style="${cellStyles}">&nbsp;</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
}

/**
 * 含表头表格 HTML（与历史 `insertTableWithHeader` 一致）。
 *
 * @param rows - 行数（含表头）
 * @param cols - 列数
 */
export function buildRteHeaderTableHtml(rows: number, cols: number): string {
  const tableStyles = "border-collapse:collapse;width:100%;table-layout:fixed";
  const cellStyles = "border:1px solid #cbd5e1;padding:6px 8px;min-width:60px;";
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
  return html;
}

/**
 * 根据 {@link ToolbarItem} 与浏览器撤销栈状态，生成工具栏按钮 class（撤销/重做单独高亮/置灰）。
 *
 * @param item - 工具项
 * @param nav - 是否可撤销 / 可重做
 * @param editorDisabled - 整表禁用
 * @param showFocusRing - 是否显示聚焦 ring
 * @returns 合并后的 Tailwind class
 */
export function toolbarButtonClassForItem(
  item: ToolbarItem,
  nav: { canUndo: boolean; canRedo: boolean },
  editorDisabled: boolean,
  showFocusRing: boolean,
): string {
  const ring = controlBlueFocusRing(showFocusRing);
  if (item.command === "undo") {
    const active = !editorDisabled && nav.canUndo;
    return twMerge(
      toolbarBtnBase,
      ring,
      active ? toolbarHistoryActiveCls : toolbarHistoryMutedCls,
    );
  }
  if (item.command === "redo") {
    const active = !editorDisabled && nav.canRedo;
    return twMerge(
      toolbarBtnBase,
      ring,
      active ? toolbarHistoryActiveCls : toolbarHistoryMutedCls,
    );
  }
  return twMerge(toolbarBtnBase, ring);
}

/**
 * 是否禁用撤销/重做按钮（无栈时点击无意义，与置灰样式一致）。
 *
 * @param item - 工具项
 * @param nav - 是否可撤销 / 可重做
 * @param editorDisabled - 整表禁用
 */
export function isHistoryToolbarDisabled(
  item: ToolbarItem,
  nav: { canUndo: boolean; canRedo: boolean },
  editorDisabled: boolean,
): boolean {
  if (editorDisabled) return true;
  if (item.command === "undo") return !nav.canUndo;
  if (item.command === "redo") return !nav.canRedo;
  return false;
}

/**
 * 可编辑区底纹。外框仅由根节点 `*-root` 的 `border` 绘制；此处用 `border-0`，避免与根在左/右/下叠成双线（原先 `border border-t-0` 与根整圈边框重复）。
 * 工具栏与正文分界仍由 {@link toolbarWrapCls} 的 `border-b` 承担；聚焦高亮由根 `has-[[data-rte-editor]:focus]` 改外框色。
 * 内层不设 `focus:border-transparent`：`border-0` 下边色类无视觉效果，且 `hideFocusRing` 仅作用于根与工具栏控件的 ring，不依赖此处类名。
 */
export const editorSurface =
  "w-full min-h-[120px] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border-0 focus:outline-hidden overflow-auto [&_p]:mb-2 [&_p]:mt-0 [&_p:last-child]:mb-0 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_pre]:bg-slate-100 [&_pre]:dark:bg-slate-700 [&_pre]:p-2 [&_pre]:rounded [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:dark:bg-slate-700 [&_th]:p-2 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2";

/** 查找条内小型文本框底纹（不含 ring） */
export const findBarInputSurface =
  "px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800 focus:outline-hidden";
export const editorReadOnlyCls = "cursor-default bg-slate-50 dark:bg-slate-800/80";

/**
 * 每个 {@link RichTextEditor} 实例的 View {@link Owner} 对应一个稳定 DOM `id`。
 * 若每次父级重渲染都用 `Math.random()` 换新 id，则页脚 {@link RteWordCountReactiveIsland} 闭包里的旧 id
 * 无法 `getElementById`，字数会退回按受控 `value` 统计，与仍显示占位符的空 `innerHTML` 不一致。
 */
const rteDomEditorIdByOwner = new WeakMap<Owner, string>();

/**
 * 解析富文本 **contenteditable 根节点**的 HTML `id`：显式传入的 `id` 优先；否则按 Owner 生成并跨渲染复用。
 *
 * @param owner - 在 {@link RichTextEditor} 同步体开头调用 {@link getOwner()} 的结果（与本组件实例一致）
 * @param explicitId - props 上的 `id`
 * @returns 非空字符串，与编辑区 `id={…}`、`document.getElementById` 一致
 */
export function resolveRteDomEditorId(
  owner: Owner | null,
  explicitId: string | undefined,
): string {
  if (explicitId != null && explicitId !== "") {
    if (owner != null) {
      rteDomEditorIdByOwner.set(owner, explicitId);
    }
    return explicitId;
  }
  if (owner != null) {
    const existing = rteDomEditorIdByOwner.get(owner);
    if (existing != null) {
      return existing;
    }
    const gen = `rte-${
      safeRandomUUID().replace(/-/g, "").slice(0, 10)
    }`;
    rteDomEditorIdByOwner.set(owner, gen);
    return gen;
  }
  return `rte-${safeRandomUUID().replace(/-/g, "").slice(0, 10)}`;
}

