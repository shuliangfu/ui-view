/**
 * @module shared/form/rich-text-editor-types
 * @description RichTextEditor 公开类型与默认文案。
 */

import type { SizeVariant } from "../types.ts";
import type { MaybeSignal } from "./maybe-signal.ts";

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

/**
 * RichTextEditor 全部用户可见文案；通过 {@link RichTextEditorProps.messages} 覆盖即可本地化。
 * 注：自定义 `toolbar` 时，`title`/`label` 由调用方自行决定，本对象只覆盖预设工具栏（simple/default/full）的文案。
 */
export interface RichTextEditorMessages {
  /** 编辑区空内容占位 */
  placeholder: string;
  /** 工具栏 `aria-label` */
  toolbarAriaLabel: string;
  /** 源码 textarea `aria-label` */
  sourceTextareaAriaLabel: string;
  /** 页脚字数行 */
  wordCount: (count: number) => string;
  /** 工具栏切换至源码模式后的工具按钮 tooltip / aria */
  sourceReturn: string;
  /** 工具栏全屏模式启用后的工具按钮 tooltip / aria */
  fullscreenExit: string;
  /** 链接占位锚文（折叠选区下插入的可见文本） */
  linkText: string;
  /** 打印窗口标题 */
  printTitle: string;
  /** 查找未找到提示 */
  notFound: string;
  /** 查找/替换条 */
  findbar: {
    findPlaceholder: string;
    replacePlaceholder: string;
    findButton: string;
    replaceButton: string;
    replaceAllButton: string;
    findNextTip: string;
    replaceCurrentTip: string;
    replaceAllTip: string;
  };
  /** 链接弹层 */
  linkModal: {
    title: string;
    urlLabel: string;
    confirm: string;
    cancel: string;
  };
  /** 图片 URL 弹层 */
  imageModal: { title: string; urlLabel: string };
  /** 表格弹层（无表头 / 含表头） */
  tableModal: {
    plainTitle: string;
    headerTitle: string;
    rowsLabel: string;
    headerRowsLabel: string;
    colsLabel: string;
  };
  /** 导出弹层 */
  exportModal: {
    title: string;
    exportHtml: string;
    exportText: string;
    cancel: string;
    hint: string;
  };
  /** 快捷键说明弹层 */
  shortcutsModal: { title: string; ok: string; body: string };
  /** 通用提示弹层 */
  infoModal: { title: string; ok: string };
  /** 通用按钮 */
  confirm: string;
  cancel: string;
  /** 工具栏按钮标题（与 ToolbarItem.key 同名） */
  toolbar: {
    sourceHtml: string;
    undo: string;
    redo: string;
    bold: string;
    italic: string;
    underline: string;
    link: string;
    heading: string;
    headingIconLabel: string;
    fontSize: string;
    lineHeight: string;
    foreColor: string;
    backColor: string;
    removeFormat: string;
    blockquote: string;
    ul: string;
    ol: string;
    strike: string;
    code: string;
    insertCodeBlock: string;
    insertImage: string;
    uploadImage: string;
    insertTable: string;
    justifyLeft: string;
    justifyCenter: string;
    justifyRight: string;
    hr: string;
    insertSpecialChar: string;
    insertTableWithHeader: string;
    sup: string;
    sub: string;
    indent: string;
    fullscreen: string;
    find: string;
    replace: string;
    print: string;
    export: string;
    shortcuts: string;
  };
  /** 段落 / 标题下拉文案 */
  blockLabels: { p: string; h2: string; h3: string; h4: string };
  /** 特殊字符下拉项标签 */
  specialChars: {
    nbsp: string;
    smile: string;
    thumb: string;
    heart: string;
  };
}

/** 默认中文文案 */
export const defaultRichTextEditorMessages: RichTextEditorMessages = {
  placeholder: "输入内容…",
  toolbarAriaLabel: "编辑工具栏",
  sourceTextareaAriaLabel: "HTML 源码",
  wordCount: (count) => `字数：${count}`,
  sourceReturn: "返回可视化编辑",
  fullscreenExit: "退出全屏",
  linkText: "链接",
  printTitle: "打印",
  notFound: "未找到",
  findbar: {
    findPlaceholder: "查找",
    replacePlaceholder: "替换为",
    findButton: "查找",
    replaceButton: "替换",
    replaceAllButton: "全部替换",
    findNextTip: "查找下一处匹配",
    replaceCurrentTip: "替换当前匹配项",
    replaceAllTip: "替换文档内全部匹配项",
  },
  linkModal: {
    title: "插入链接",
    urlLabel: "链接 URL",
    confirm: "确定",
    cancel: "取消",
  },
  imageModal: { title: "插入图片", urlLabel: "图片 URL" },
  tableModal: {
    plainTitle: "插入表格",
    headerTitle: "插入表格（含表头）",
    rowsLabel: "行数",
    headerRowsLabel: "行数（含表头）",
    colsLabel: "列数",
  },
  exportModal: {
    title: "导出内容",
    exportHtml: "导出 HTML",
    exportText: "导出纯文本",
    cancel: "取消",
    hint: "选择导出格式：HTML 保留标签与样式线索；纯文本仅保留可见文字。",
  },
  shortcutsModal: {
    title: "快捷键",
    ok: "知道了",
    body:
      "快捷键：\nCtrl+Z 撤销\nCtrl+Y 重做\nCtrl+B 加粗\nCtrl+I 斜体\nCtrl+U 下划线\nCtrl+K 插入链接\nCtrl+F 查找\n工具栏「编辑源码」可切换 HTML 源码与可视化",
  },
  infoModal: { title: "提示", ok: "确定" },
  confirm: "确定",
  cancel: "取消",
  toolbar: {
    sourceHtml: "编辑源码",
    undo: "撤销 (Ctrl+Z)",
    redo: "重做 (Ctrl+Y)",
    bold: "加粗 (Ctrl+B)",
    italic: "斜体 (Ctrl+I)",
    underline: "下划线 (Ctrl+U)",
    link: "插入链接 (Ctrl+K)",
    heading: "段落与标题",
    headingIconLabel: "段落",
    fontSize: "字号",
    lineHeight: "行高",
    foreColor: "文字颜色",
    backColor: "背景色",
    removeFormat: "清除格式",
    blockquote: "引用",
    ul: "无序列表",
    ol: "有序列表",
    strike: "删除线",
    code: "行内代码",
    insertCodeBlock: "代码块(可高亮)",
    insertImage: "插入图片 URL",
    uploadImage: "上传图片",
    insertTable: "插入表格",
    justifyLeft: "左对齐",
    justifyCenter: "居中",
    justifyRight: "右对齐",
    hr: "水平线",
    insertSpecialChar: "特殊字符",
    insertTableWithHeader: "插入表格(含表头)",
    sup: "上标",
    sub: "下标",
    indent: "首行缩进",
    fullscreen: "全屏",
    find: "查找 (Ctrl+F)",
    replace: "替换",
    print: "打印",
    export: "导出",
    shortcuts: "快捷键帮助",
  },
  blockLabels: { p: "正文", h2: "标题 2", h3: "标题 3", h4: "标题 4" },
  specialChars: {
    nbsp: "空格",
    smile: "表情 😀",
    thumb: "赞 👍",
    heart: "心形 ❤",
  },
};

/**
 * 工具栏与查找条悬停说明：使用 {@link Tooltip} 统一气泡样式；**不再**写原生 `title`，避免与自定义气泡叠两层。
 * Tooltip 气泡默认经 Portal 挂到 `document.body` 且 `fixed` 定位，避免工具栏 `overflow` 裁切；全屏根节点为 `z-9999` 时可用 `overlayClass` 抬高 z-index（如 `z-10050`）。
 *
 * @param props.content - 提示文案；`trim` 后为空则仅渲染子节点、不包裹 Tooltip
 * @param props.children - 触发区域（外包结构保持与原先一致，避免影响 `mousedown` 选区保留逻辑）
 * @param props.class - 额外 class 合并到 Tooltip 触发器外层
 * @returns 包装后的节点
 */
export interface RichTextEditorProps {
  /** 控件尺寸，与 Input 相同；也可由外层 Form 的 size 注入 */
  size?: SizeVariant;
  /** 当前内容（HTML 字符串）；见 {@link MaybeSignal} */
  value?: MaybeSignal<string>;
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
  /**
   * 整格外框最大高度（如 `"70vh"`、`"min(76dvh,42rem)"`）。
   * 传入后根节点为纵向 flex，正文区在框内 `overflow-auto` 滚动；全屏（`.rte-fullscreen`）时自动取消上限。
   */
  maxHeight?: string;
  /** 额外 class（作用于最外层容器） */
  class?: string;
  /** 原生 name（会同步到隐藏 input 便于表单提交） */
  name?: string;
  /** 原生 id（编辑区与隐藏 input 会使用） */
  id?: string;
  /** 插入图片 URL 时由调用方提供（如弹窗输入）；若返回 string 则插入，否则不插入 */
  onInsertImage?: () => Promise<string> | string;
  /**
   * 插图上传路由前缀（与 `uiViewUploadPlugin.basePath` 对齐）。
   * 推荐默认 `DEFAULT_UI_VIEW_UPLOAD_BASE_PATH`（`/ui-view-upload`）；**勿**写死 `/upload`。
   * 有值且未传 `onUploadImage`／`onPasteImage` 时，走路径协议 `${uploadAction}/init|chunk|complete`。
   */
  uploadAction?: string;
  /** 上传图片：选择文件后调用，返回图片 URL 后插入；优先于 `uploadAction`；皆无则 data URL */
  onUploadImage?: (file: File) => Promise<string> | string;
  /** 粘贴图片时：优先于 `uploadAction`；皆无则 data URL */
  onPasteImage?: (blob: Blob) => Promise<string> | string;
  /** 为 true 时隐藏编辑区、工具栏与查找条控件的聚焦激活态边框；默认 false 显示 */
  hideFocusRing?: boolean;
  /** 多语言/自定义文案；未传字段走 {@link defaultRichTextEditorMessages} */
  messages?: Partial<RichTextEditorMessages>;
}

