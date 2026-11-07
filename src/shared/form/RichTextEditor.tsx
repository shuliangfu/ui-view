/**
 * RichTextEditor 富文本编辑器（View）。
 * WYSIWYG 编辑：加粗/斜体/下划线/删除线、标题、字号、行高、列表、引用、链接、图片（URL/上传）、表格、代码块、对齐、颜色等。
 * 正文块尽量用 `p`：聚焦时设置 `defaultParagraphSeparator` 为 `p`，并在输入时把根级裸文本包进首段 `p`（浏览器默认常用 `div` 与无包裹首段）。
 * 前景/背景色使用 {@link ColorPicker} 隐藏触发器 + 命令式 `openFromPointerEvent`；打开前克隆选区，
 * 确定时再恢复，避免操作取色面板导致选区丢失而无法正确 `execCommand`。
 * 支持粘贴图片到内容区（剪贴板图片转 data URL 或经 onPasteImage 上传后插入）。
 * 工具栏可配置为 simple（简单，含全屏）、default（默认）、full（全部），或完全自定义；文字颜色与背景色在三档预设中均提供。
 * 各预设工具栏首位为「编辑源码」：在 HTML 源码与可视化编辑之间切换；进入源码时会对 `innerHTML` 做缩进排版（类 Elements 结构）便于编辑。
 * 受控 HTML 仅在**编辑区未获焦**且非链接弹层打开时由 {@link createEffect} 同步到 DOM；获焦时以浏览器 DOM
 * 为准，避免写 `innerHTML` 重置选区。`ref` 仅用 `createRef` 持有编辑区节点。
 */


import {
  createEffect,
  createMemo,
  createRef,
  createRenderEffect,
  createSignal,
  For,
  getOwner,
  type JSXRenderable,
  onCleanup,
  untrack,
} from "@dreamer/view";
import { createPortal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { Modal } from "../../desktop/feedback/Modal.tsx";
import { Button } from "../basic/Button.tsx";
import { IconType } from "../basic/icons/Type.tsx";
import { ColorPicker, type ColorPickerHandle } from "./ColorPicker.tsx";
import { controlBlueFocusRing } from "./input-focus-ring.ts";
import { Input } from "./Input.tsx";
import {
  commitMaybeSignal,
  readMaybeSignal,
} from "./maybe-signal.ts";
import { uploadFileViaUiViewBase } from "./upload-http.ts";
import { getFormPortalBodyHost } from "./picker-portal-utils.ts";
import { isDomElement, isHtmlElement } from "../dom-guards.ts";
import {
  applyRteFontSize,
  applyRteForeOrBackColor,
  applyRteInlineDecoration,
  applyRteLineHeight,
  cloneEditorSelectionRangeIfInside,
  findOutermostRteCodeBlockPre,
  getPlainText,
  getWordCount,
  insertRteCodeBlockAtSelection,
  restoreEditorSelectionRange,
  rteApplyLinkUrl,
  rteEnsureParagraphAfterPreIfLast,
  rteHtmlLooselyEquals,
  rtePrettyPrintHtmlSource,
  rteRangeCollapsedAtEndOfElement,
  shouldSkipControlledInnerHtmlSync,
  trySetDefaultParagraphSeparatorToP,
  wrapRteLeadingRootTextInParagraph,
  type RteInlineDecoKind,
} from "./rich-text-editor-dom.ts";
import {
  buildRteHeaderTableHtml,
  buildRtePlainTableHtml,
  editorReadOnlyCls,
  editorSurface,
  findBarInputSurface,
  getToolbarByPreset,
  isHistoryToolbarDisabled,
  normalizeToolbarConfig,
  renderToolbarButtonContent,
  resolveRteDomEditorId,
  RteToolbarItemTip,
  rteToolbarDropdownDisabled,
  rteToolbarSelectFitCls,
  toolbarBtnBase,
  toolbarButtonClassForItem,
  toolbarGroupCls,
  toolbarWrapCls,
} from "./rich-text-editor-toolbar.tsx";
import {
  defaultRichTextEditorMessages,
  type RichTextEditorMessages,
  type RichTextEditorProps,
  type ToolbarItem,
} from "./rich-text-editor-types.ts";

export type {
  RichTextEditorMessages,
  RichTextEditorProps,
  ToolbarConfig,
  ToolbarItem,
  ToolbarPreset,
} from "./rich-text-editor-types.ts";
export { defaultRichTextEditorMessages } from "./rich-text-editor-types.ts";

export function RichTextEditor(props: RichTextEditorProps): JSXRenderable {
  const rteOwner = getOwner();
  /** 合并默认中文文案与外部传入 messages；嵌套对象同样深合并一层，避免子对象整段覆盖 */
  const userMessages = props.messages ?? {};
  const m: RichTextEditorMessages = {
    ...defaultRichTextEditorMessages,
    ...userMessages,
    findbar: {
      ...defaultRichTextEditorMessages.findbar,
      ...(userMessages.findbar ?? {}),
    },
    linkModal: {
      ...defaultRichTextEditorMessages.linkModal,
      ...(userMessages.linkModal ?? {}),
    },
    imageModal: {
      ...defaultRichTextEditorMessages.imageModal,
      ...(userMessages.imageModal ?? {}),
    },
    tableModal: {
      ...defaultRichTextEditorMessages.tableModal,
      ...(userMessages.tableModal ?? {}),
    },
    exportModal: {
      ...defaultRichTextEditorMessages.exportModal,
      ...(userMessages.exportModal ?? {}),
    },
    shortcutsModal: {
      ...defaultRichTextEditorMessages.shortcutsModal,
      ...(userMessages.shortcutsModal ?? {}),
    },
    infoModal: {
      ...defaultRichTextEditorMessages.infoModal,
      ...(userMessages.infoModal ?? {}),
    },
    toolbar: {
      ...defaultRichTextEditorMessages.toolbar,
      ...(userMessages.toolbar ?? {}),
    },
    blockLabels: {
      ...defaultRichTextEditorMessages.blockLabels,
      ...(userMessages.blockLabels ?? {}),
    },
    specialChars: {
      ...defaultRichTextEditorMessages.specialChars,
      ...(userMessages.specialChars ?? {}),
    },
  };
  const {
    value = "",
    onChange,
    toolbarPreset = "default",
    toolbar: customToolbar,
    placeholder = m.placeholder,
    disabled = false,
    readOnly = false,
    minHeight = "200px",
    maxHeight,
    class: className,
    name,
    id,
    onInsertImage,
    uploadAction,
    onUploadImage,
    onPasteImage,
    hideFocusRing = false,
  } = props;

  const toolbarGroups = customToolbar
    ? normalizeToolbarConfig(customToolbar)
    : getToolbarByPreset(toolbarPreset, m);

  /**
   * {@link refreshHistoryNavState} 会临时 focus 编辑区以调用 queryCommandEnabled；
   * 若同步触发编辑区 onFocus 再 queueMicrotask(refresh)，会与「焦点在查找条」等场景形成无限微任务链导致页面卡死。
   */
  let suppressEditorFocusHistoryRefresh = false;

  const editorId = resolveRteDomEditorId(rteOwner, id);
  const uploadInputId = `${editorId}-upload`;

  /**
   * 工具栏撤销/重做是否可点；与 {@link refreshHistoryNavState} 同步。
   * 撤销：**不**依赖 `queryCommandEnabled("undo")`（多环境下恒为 false），改为当前 innerHTML 是否与
   * {@link lastSyncedFromPropsHtml} 不同。重做：`queryCommandEnabled("redo")` 与「刚执行过撤销」标志合取。
   */
  const historyNavState = createSignal({
    canUndo: false,
    canRedo: false,
  });

  /**
   * 最近一次由受控 `value` 写入编辑区的 HTML（首次 effect 时初始化），作撤销对照基准。
   */
  let lastSyncedFromPropsHtml: string | null = null;

  /**
   * 用户通过工具栏或 Ctrl+Z 执行过撤销后为 true，用于在 `queryCommandEnabled("redo")` 不可靠时仍点亮重做。
   * 新输入、外部改写 innerHTML、执行重做后置 false（或由 finally 在非 undo/redo 工具操作时清除）。
   */
  let rteRedoEligibleAfterUndo = false;

  /**
   * 焦点在 contenteditable 编辑区上时为 true。为 true 时禁止用受控 `value` 写 `innerHTML`，否则浏览器会重置选区
   * （光标跳行首、首字倒序等）。由编辑区 `onFocus`/`onBlur` 维护；比仅靠 `document.activeElement` 可靠。
   */
  let rteEditorHasFocus = false;
  /**
   * 从源码切回可视后、`queueMicrotask` 里 `focus` 执行前，受控 `value` 往往尚未随 {@link emitChange} 更新；
   * {@link createEffect} 若此时用旧 `value`（如空串）写 `innerHTML` 会清空刚写入的正文。为 true 时跳过 props→innerHTML。
   */
  let rteBlockPropsInnerHtmlAfterSourceExit = false;

  /**
   * 防止 {@link refreshHistoryNavState} 重入（onFocus / microtask / signal 连锁时同步再入会导致栈溢出或页面卡死）。
   */
  let insideRefreshHistoryNav = false;

  /**
   * 根节点是否处于 `rte-fullscreen`，与全屏按钮的图标、`title` / `aria-label` 同步。
   */
  const rteFullscreen = createSignal(false);
  /**
   * 为 true 时主区域显示 HTML 源码 `<textarea>`，与 {@link rteSourceHtml} 同步；为 false 时为 contenteditable 可视化编辑。
   */
  const rteSourceMode = createSignal(false);
  /**
   * 源码模式下的 HTML 字符串；进入源码时从编辑区 `innerHTML` 拷贝，编辑中经 `onInput` 与父级 `onChange` 同步。
   */
  const rteSourceHtml = createSignal("");

  /**
   * 驱动页脚字数 memo 在「仅 DOM 变、受控 value 未变」时重算：`innerHTML` 非响应式，受控回写后须手动 bump。
   * 在 {@link emitChange} 末尾与 props→`innerHTML` 同步成功后递增。
   */
  const rteWordCountDomTick = createSignal(0);

  /**
   * 仅在 canUndo/canRedo 与当前 signal 不同时写入。
   * `createSignal` 对对象用 `Object.is`：每次 `value = { canUndo, canRedo }` 都是新引用，即使用户未操作也会触发订阅 →
   * 重渲染 → ref 再 `queueMicrotask(refresh)`，形成更新风暴导致页面极卡。
   *
   * @param next - 浏览器查询得到的下一状态
   */
  const setHistoryNavIfChanged = (next: {
    canUndo: boolean;
    canRedo: boolean;
  }) => {
    const prev = historyNavState.value;
    if (prev.canUndo === next.canUndo && prev.canRedo === next.canRedo) {
      return;
    }
    historyNavState.value = next;
  };

  /**
   * 根据当前 DOM 与受控基准更新撤销/重做按钮态；仅对 **redo** 查询 `queryCommandEnabled`（需焦点时短暂 focus 编辑区）。
   */
  const refreshHistoryNavState = () => {
    if (typeof document === "undefined") return;
    if (insideRefreshHistoryNav) return;
    insideRefreshHistoryNav = true;
    try {
      const editor = document.getElementById(editorId) as HTMLDivElement | null;
      if (!editor?.isConnected) return;
      /** 基准未建立前不做比较，避免误亮撤销 */
      if (lastSyncedFromPropsHtml === null) {
        setHistoryNavIfChanged({ canUndo: false, canRedo: false });
        return;
      }

      const baseline = lastSyncedFromPropsHtml;
      /**
       * 源码模式：用 {@link rteSourceHtml} 比基准判断撤销；不重试 `queryCommandEnabled(redo)`（避免为查 redo 抢焦点离开 `<textarea>`）。
       */
      if (rteSourceMode.value) {
        const srcHtml = rteSourceHtml.value;
        const canUndo = baseline === ""
          ? srcHtml.replace(/\uFEFF/g, "").trim() !== ""
          : srcHtml !== baseline;
        setHistoryNavIfChanged({ canUndo, canRedo: false });
        return;
      }

      const currentHtml = editor.innerHTML;
      /**
       * 非空基准时用 {@link rteHtmlLooselyEquals}：浏览器序列化的 innerHTML 与受控字符串常有空白/`&nbsp;` 差异，
       * 严格 `!==` 会在「已有实质编辑」时仍判相等 → 撤销永灰。
       */
      const canUndo = baseline === ""
        ? currentHtml.replace(/\uFEFF/g, "").trim() !== ""
        : !rteHtmlLooselyEquals(currentHtml, baseline);

      let qRedo = false;
      if (typeof document.queryCommandEnabled === "function") {
        const doc = globalThis.document;
        const prevActive = doc.activeElement;
        const root = doc.getElementById(`${editorId}-root`);
        /**
         * 焦点在编辑区 **或** 组件根内（工具栏、查找条等）时，不得为查 redo 去 `editor.focus()`：
         * 否则 `onBlur` 里排的微任务会再把焦点抢回编辑区，与 `onFocus`/受控更新形成高频震荡，页面直接卡死。
         * 仅当 {@link rteEditorHasFocus} 仍为 true 且焦点已跑出整棵 RTE 外时，才短暂抢焦点查询（极少见）。
         */
        const focusInsideRteChrome = prevActive === editor ||
          (root != null &&
            prevActive instanceof Node &&
            root.contains(prevActive));
        const needStealFocus = rteEditorHasFocus && !focusInsideRteChrome;
        if (needStealFocus) {
          suppressEditorFocusHistoryRefresh = true;
          try {
            editor.focus({ preventScroll: true });
          } finally {
            suppressEditorFocusHistoryRefresh = false;
          }
        }
        try {
          qRedo = document.queryCommandEnabled("redo");
        } catch {
          qRedo = false;
        }
        if (needStealFocus && isHtmlElement(prevActive)) {
          prevActive.focus({ preventScroll: true });
        }
      }

      const canRedo = qRedo || rteRedoEligibleAfterUndo;
      setHistoryNavIfChanged({ canUndo, canRedo });
    } finally {
      insideRefreshHistoryNav = false;
    }
  };

  /** 编辑区根节点；模板里只写 `ref={editorHostRef}`，不在 ref 里塞同步逻辑。 */
  const editorHostRef = createRef<HTMLDivElement>(null);

  const insertImageUrl = (url: string) => {
    const editor = document.getElementById(editorId) as HTMLDivElement | null;
    if (editor) {
      editor.focus();
      document.execCommand("insertImage", false, url);
      rteRedoEligibleAfterUndo = false;
      emitChange();
      queueMicrotask(() => refreshHistoryNavState());
    }
  };

  const handleToolbarAction = (
    item: ToolbarItem,
    childValue?: string,
    /** 工具栏点击时传入，用于在指针旁打开取色面板 */
    fromPointer?: MouseEvent,
  ) => {
    if (disabled || readOnly) return;
    /** 须在 try 外声明，供 finally 判断是否为撤销/重做（块内 const 在 finally 不可见） */
    const cmd = item.command;
    /** 源码模式下仅允许「源码/可视化」切换，避免对隐藏 contenteditable 执行无效命令 */
    if (rteSourceMode.value && cmd !== "rteToggleSourceHtml") return;
    const editor = document.getElementById(editorId) as HTMLDivElement | null;
    if (!editor) return;
    const val = childValue ?? item.value ?? "";

    /**
     * 可视化 ↔ HTML 源码：切到源码时快照 `innerHTML`；切回时写回并触发 {@link emitChange}。
     */
    if (cmd === "rteToggleSourceHtml") {
      if (rteSourceMode.value) {
        /**
         * 以 `<textarea>` 的 **DOM 值**为准：部分 reconciler 下 `onInput` 与 signal 可能不同步，仅用 `rteSourceHtml` 会读到旧串；
         * 且 `rteSourceMode` 置 false 后子树可能先提交 DOM，须在微任务里对 **当前** `getElementById(editorId)` 写 `innerHTML`，
         * 勿依赖本函数开头缓存的 `editor` 引用（可能是即将被替换的节点）。
         */
        const ta = document.getElementById(`${editorId}-source`) as
          | HTMLTextAreaElement
          | null;
        const html = ta != null ? ta.value : rteSourceHtml.value;
        rteSourceHtml.value = html;
        lastSyncedFromPropsHtml = html;
        rteRedoEligibleAfterUndo = false;
        /**
         * 先拦 props 同步再关源码模式：否则 effect 与 `emitChange` 同一轮里用滞后 `value` 覆盖可视区 `innerHTML`。
         */
        rteBlockPropsInnerHtmlAfterSourceExit = true;
        rteSourceMode.value = false;
        emitChange(html);
        /**
         * 双层微任务：等 {@link RteEditorBodyReactiveIsland} 等对 `rteSourceMode` 的 DOM 更新落盘后再写 `innerHTML` 与 `focus`。
         */
        queueMicrotask(() => {
          queueMicrotask(() => {
            const ed = document.getElementById(editorId) as
              | HTMLDivElement
              | null;
            if (ed) {
              ed.innerHTML = html;
            }
            lastSyncedFromPropsHtml = html;
            rteEditorHasFocus = true;
            rteBlockPropsInnerHtmlAfterSourceExit = false;
            ed?.focus({ preventScroll: true });
            refreshHistoryNavState();
          });
        });
      } else {
        rteSourceHtml.value = rtePrettyPrintHtmlSource(editor.innerHTML);
        rteRedoEligibleAfterUndo = false;
        rteSourceMode.value = true;
        queueMicrotask(() => {
          const ta = document.getElementById(`${editorId}-source`) as
            | HTMLTextAreaElement
            | null;
          ta?.focus({ preventScroll: true });
          refreshHistoryNavState();
        });
      }
      return;
    }

    try {
      editor.focus();

      if (cmd === "createLink") {
        openLinkUrlModal();
        return;
      }
      if (cmd === "insertImage") {
        if (onInsertImage) {
          Promise.resolve(onInsertImage()).then((url) => {
            if (url) insertImageUrl(url);
          });
        } else {
          rteAuxDraft1.value = "";
          rteAuxKind.value = "imageUrl";
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
        rteAuxDraft1.value = "3";
        rteAuxDraft2.value = "3";
        rteAuxKind.value = "tablePlain";
        return;
      }
      /** 字号：自定义 DOM 包裹，不经过 `execCommand` */
      if (cmd === "rteFontSize" && val) {
        applyRteFontSize(editor, val);
        emitChange();
        queueMicrotask(() => refreshHistoryNavState());
        return;
      }
      /** 行高：作用于当前块级节点 */
      if (cmd === "rteLineHeight" && val) {
        applyRteLineHeight(editor, val);
        emitChange();
        queueMicrotask(() => refreshHistoryNavState());
        return;
      }
      if (cmd === "foreColor" || cmd === "backColor") {
        rteAuxColorCmd = cmd;
        rteAuxDraft1.value = val || "#333333";
        /**
         * `click` 触发时选区常已在 `mousedown` 中丢失；优先使用工具栏 {@link onMouseDownCapture} 里已存的克隆。
         * 无（如键盘触发）时再尝试当前文档选区。
         */
        if (rteSavedColorSelectionRange == null) {
          rteSavedColorSelectionRange = cloneEditorSelectionRangeIfInside(
            editor,
          );
        }
        const pe = fromPointer ?? rteColorPickerAnchorFallback();
        rteColorPickerRef.current?.openFromPointerEvent(pe);
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
        rteAuxDraft1.value = "4";
        rteAuxDraft2.value = "3";
        rteAuxKind.value = "tableHeader";
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
        if (root) {
          root.classList.toggle("rte-fullscreen");
          /** 切换后同步 signal，工具栏重绘为「退出全屏」图标与文案 */
          rteFullscreen.value = root.classList.contains("rte-fullscreen");
        }
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
          /**
           * 勿用 document.write：在已关闭文档上写会清空／触发同步解析风险。
           * 用 DOM API 建文档，正文经 DOMParser 解析后 import，避免把未消毒 HTML 当脚本上下文写入。
           */
          const doc = win.document;
          doc.open();
          doc.close();
          const titleEl = doc.createElement("title");
          titleEl.textContent = m.printTitle;
          if (!doc.head) {
            doc.documentElement.appendChild(doc.createElement("head"));
          }
          doc.head!.appendChild(titleEl);
          const meta = doc.createElement("meta");
          meta.setAttribute("charset", "utf-8");
          doc.head!.insertBefore(meta, titleEl);
          const parsed = new DOMParser().parseFromString(
            `<div id="rte-print-root">${html}</div>`,
            "text/html",
          );
          const root = parsed.getElementById("rte-print-root");
          if (root && doc.body) {
            while (root.firstChild) {
              doc.body.appendChild(doc.importNode(root.firstChild, true));
            }
          }
          win.focus();
          win.print();
          win.close();
        }
        return;
      }
      if (cmd === "exportContent") {
        rteAuxKind.value = "export";
        return;
      }
      if (cmd === "shortcuts") {
        rteAuxMessage.value = m.shortcutsModal.body;
        rteAuxKind.value = "shortcuts";
        return;
      }
      if (cmd === "insertCodeBlock") {
        insertRteCodeBlockAtSelection(editor);
        emitChange();
        return;
      }
      if (cmd === "undo") {
        document.execCommand("undo", false);
        rteRedoEligibleAfterUndo = true;
        emitChange();
        return;
      }
      if (cmd === "redo") {
        document.execCommand("redo", false);
        rteRedoEligibleAfterUndo = false;
        emitChange();
        return;
      }
      if (cmd === "removeFormat") {
        document.execCommand(cmd, false);
        emitChange();
        return;
      }
      if (cmd === "bold" || cmd === "italic" || cmd === "underline") {
        const kind: RteInlineDecoKind = cmd === "bold"
          ? "bold"
          : cmd === "italic"
          ? "italic"
          : "underline";
        if (applyRteInlineDecoration(editor, kind)) {
          emitChange();
          return;
        }
      }

      document.execCommand(cmd, false, val);
      emitChange();
    } finally {
      /** 除撤销/重做外任意工具操作都会清空浏览器重做栈语义，同步熄灭本地重做门闸 */
      if (cmd !== "undo" && cmd !== "redo") {
        rteRedoEligibleAfterUndo = false;
      }
      queueMicrotask(() => refreshHistoryNavState());
    }
  };

  const handleInput = (e: Event) => {
    const el = e.currentTarget as HTMLDivElement;
    wrapRteLeadingRootTextInParagraph(el);
    rteRedoEligibleAfterUndo = false;
    emitChange(el.innerHTML);
    /** 同步刷新工具栏撤销态，避免仅依赖微任务时与当前帧 reconciler 顺序不一致导致仍显示 disabled */
    refreshHistoryNavState();
    queueMicrotask(() => refreshHistoryNavState());
  };

  const getEditorHtml = () => {
    const editor = document.getElementById(editorId) as HTMLDivElement | null;
    return editor?.innerHTML ?? "";
  };

  /** 通知父组件并同步 hidden input（因 value 用 untrack 不随 signal 更新，需在每次变更时手动写回） */
  const emitChange = (html?: string) => {
    /**
     * 撤销对照基准仍为 null 时，在 `commitMaybeSignal` **之前**读取受控值（{@link readMaybeSignal}）作为「上一拍」快照。
     * 否则仅依赖 effect/onFocus 初始化时，在 ref 晚就绪、焦点事件未送达等情况下 {@link lastSyncedFromPropsHtml} 会一直为 null，
     * {@link refreshHistoryNavState} 恒关撤销；或误把「已编辑后」的 DOM 当基准。
     */
    if (lastSyncedFromPropsHtml === null) {
      const prior = readMaybeSignal(props.value);
      lastSyncedFromPropsHtml = prior === undefined ? "" : prior;
    }
    const h = html ?? getEditorHtml();
    commitMaybeSignal(props.value, h);
    onChange?.(h);
    if (name != null) {
      const el = document.getElementById(`${editorId}-hidden`) as
        | HTMLInputElement
        | null;
      if (el) el.value = h;
    }
    rteWordCountDomTick.value = rteWordCountDomTick.value + 1;
  };

  /** 插入链接弹层开关；实际 {@link Modal} 由下方 `createRenderEffect` + {@link createPortal} 挂载，避免嵌在主 getter 内。 */
  const linkModalOpen = createSignal(false);
  const linkUrlDraft = createSignal("");

  /**
   * 除「插入链接」外的工具栏输入/确认弹层类型（{@link Modal} + Portal，替代原生 prompt/confirm/alert）。
   */
  type RteAuxModalKind =
    | "none"
    | "imageUrl"
    | "tablePlain"
    | "tableHeader"
    | "export"
    | "shortcuts"
    | "info";

  const rteAuxKind = createSignal<RteAuxModalKind>("none");
  const rteAuxDraft1 = createSignal("");
  const rteAuxDraft2 = createSignal("");
  const rteAuxMessage = createSignal("");
  /** 取色面板「确定」时使用的 `document.execCommand` 子命令 */
  let rteAuxColorCmd: "foreColor" | "backColor" = "foreColor";
  /**
   * 工具栏 `mousedown` 捕获阶段克隆的选区；`onApply` 里交给 {@link applyRteForeOrBackColor} 上色。
   */
  let rteSavedColorSelectionRange: Range | null = null;
  /**
   * 打开「插入链接」弹层前克隆的选区；确定时用 {@link rteApplyLinkUrl} 恢复后再 `createLink`，避免焦点进 Modal 后选区丢失而把 URL 插成可见正文。
   */
  let rteSavedLinkSelectionRange: Range | null = null;
  /**
   * 原生 `<select>` 抢走焦点前在捕获阶段保存的选区；`change` 时先 {@link restoreEditorSelectionRange} 再执行命令，
   * 否则段落/字号/行高等下拉无法在「有选中文本」时生效。
   */
  let rteSavedToolbarSelectRange: Range | null = null;
  /**
   * 工具栏原生下拉 `change`：先恢复 `mousedown` 捕获阶段保存的选区，再执行命令（否则焦点在 `select` 上时编辑区选区已丢失）。
   *
   * @param item - 对应工具栏项
   * @param e - `<select>` 的 `change` 事件
   */
  const handleToolbarSelectChange = (item: ToolbarItem, e: Event) => {
    const v = (e.target as HTMLSelectElement).value;
    const ed = document.getElementById(editorId) as HTMLDivElement | null;
    if (ed != null && rteSavedToolbarSelectRange != null) {
      restoreEditorSelectionRange(ed, rteSavedToolbarSelectRange);
      rteSavedToolbarSelectRange = null;
    }
    handleToolbarAction(item, v);
  };
  /** 无指针事件时（如下拉 `change`）用于定位取色面板的命令式引用 */
  const rteColorPickerRef: { current: ColorPickerHandle | null } = {
    current: null,
  };
  /**
   * 取色面板是否打开；为 true 时与链接 Modal 一样禁止用滞后的受控 `value` 写编辑区 `innerHTML`。
   */
  const rteColorPickerOpen = createSignal(false);

  /**
   * 在编辑区上方附近取一点视口坐标，供 {@link ColorPickerHandle.openFromPointerEvent} 在无 `MouseEvent` 时使用。
   *
   * @returns 含 `clientX` / `clientY` 的对象
   */
  const rteColorPickerAnchorFallback = (): Pick<
    PointerEvent,
    "clientX" | "clientY"
  > => {
    const ed = document.getElementById(editorId) as HTMLElement | null;
    if (ed) {
      const r = ed.getBoundingClientRect();
      return {
        clientX: Math.round(r.left + Math.min(160, r.width / 2)),
        clientY: Math.round(r.top + 48),
      };
    }
    return { clientX: 200, clientY: 120 };
  };

  /**
   * 关闭通用工具栏弹层。
   */
  const closeRteAuxModal = () => {
    rteAuxKind.value = "none";
  };

  /**
   * 打开纯文案提示弹层（如查找无结果）。
   *
   * @param message - 正文
   */
  const openRteAuxInfo = (message: string) => {
    rteAuxMessage.value = message;
    rteAuxKind.value = "info";
  };

  /**
   * 任意富文本弹层或取色面板打开时禁止受控 `innerHTML` 回写（与 {@link linkModalOpen} 同因）。
   */
  const rteAnyOverlayOpen = () =>
    linkModalOpen.value ||
    rteAuxKind.value !== "none" ||
    rteColorPickerOpen.value;

  /**
   * 确认插入图片 URL（无 `onInsertImage` 时由 Modal 收集）。
   */
  const confirmRteAuxImageUrl = () => {
    const url = rteAuxDraft1.value.trim();
    closeRteAuxModal();
    if (url) insertImageUrl(url);
  };

  /**
   * 确认插入无表头表格。
   */
  const confirmRteAuxTablePlain = () => {
    const rows = Math.max(
      1,
      Math.min(20, parseInt(rteAuxDraft1.value, 10) || 3),
    );
    const cols = Math.max(
      1,
      Math.min(10, parseInt(rteAuxDraft2.value, 10) || 3),
    );
    closeRteAuxModal();
    const ed = document.getElementById(editorId) as HTMLDivElement | null;
    if (!ed) return;
    ed.focus();
    rteRedoEligibleAfterUndo = false;
    document.execCommand(
      "insertHTML",
      false,
      buildRtePlainTableHtml(rows, cols),
    );
    emitChange();
    queueMicrotask(() => refreshHistoryNavState());
  };

  /**
   * 确认插入含表头表格。
   */
  const confirmRteAuxTableHeader = () => {
    const rows = Math.max(
      2,
      Math.min(20, parseInt(rteAuxDraft1.value, 10) || 4),
    );
    const cols = Math.max(
      1,
      Math.min(10, parseInt(rteAuxDraft2.value, 10) || 3),
    );
    closeRteAuxModal();
    const ed = document.getElementById(editorId) as HTMLDivElement | null;
    if (!ed) return;
    ed.focus();
    rteRedoEligibleAfterUndo = false;
    document.execCommand(
      "insertHTML",
      false,
      buildRteHeaderTableHtml(rows, cols),
    );
    emitChange();
    queueMicrotask(() => refreshHistoryNavState());
  };

  /**
   * 下载导出文件（HTML 或纯文本）。
   *
   * @param asHtml - true 为 HTML，false 为纯文本
   */
  const performExportDownload = (asHtml: boolean) => {
    closeRteAuxModal();
    const html = getEditorHtml();
    const blob = asHtml
      ? new Blob([html], { type: "text/html;charset=utf-8" })
      : new Blob([getPlainText(html)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = asHtml ? "content.html" : "content.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /**
   * 关闭链接 URL 弹层（取消、遮罩、Esc 共用）。
   */
  const closeLinkUrlModal = () => {
    linkModalOpen.value = false;
    rteSavedLinkSelectionRange = null;
  };

  /**
   * 打开链接 URL 弹层；由工具栏「链接」与 Ctrl+K 调用。
   * 若工具栏 `mousedown` 已写入 {@link rteSavedLinkSelectionRange} 则不再覆盖，以免 click 时选区已丢。
   */
  const openLinkUrlModal = () => {
    const ed = document.getElementById(editorId) as HTMLDivElement | null;
    if (rteSavedLinkSelectionRange == null && ed != null) {
      rteSavedLinkSelectionRange = cloneEditorSelectionRangeIfInside(ed);
    }
    linkUrlDraft.value = "";
    linkModalOpen.value = true;
  };

  /**
   * 确认插入链接：恢复选区后 {@link rteApplyLinkUrl}（有选中文本则仅其为锚文，URL 不进正文）。
   */
  const confirmLinkUrl = () => {
    const url = linkUrlDraft.value.trim();
    const saved = rteSavedLinkSelectionRange;
    closeLinkUrlModal();
    if (!url) return;
    const ed = document.getElementById(editorId) as HTMLDivElement | null;
    if (!ed) return;
    rteRedoEligibleAfterUndo = false;
    rteApplyLinkUrl(ed, url, saved, m.linkText);
    emitChange();
    queueMicrotask(() => refreshHistoryNavState());
  };

  /**
   * 弹层打开后将焦点移入 URL 输入框，便于键盘操作。
   */
  createEffect(() => {
    if (!linkModalOpen.value) return;
    const inputId = `${editorId}-rte-link-url`;
    queueMicrotask(() => {
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });
  });

  /**
   * 插入链接弹层**不**放在主 `return () =>` 的 VNode 树里：该 getter 会因工具栏
   * `historyNavState` 等频繁重跑，与内嵌 {@link Modal} 协调时可能导致 FormItem 等父级下子树整段未挂载（表现为
   * `.form-item-input` 为空）。打开时单独 `createPortal` 挂到 `body`，关闭时 `unmount` 整段移除。
   */
  createRenderEffect(() => {
    if (!linkModalOpen.value) return;
    const host = getFormPortalBodyHost();
    if (host == null) return;
    const root = createPortal(
      () => (
        <Modal
          open
          onClose={closeLinkUrlModal}
          title={m.linkModal.title}
          width="sm"
          keyboard
          footer={
            <div class="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => confirmLinkUrl()}
              >
                {m.linkModal.confirm}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => closeLinkUrlModal()}
              >
                {m.linkModal.cancel}
              </Button>
            </div>
          }
        >
          <label
            class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            for={`${editorId}-rte-link-url`}
          >
            {m.linkModal.urlLabel}
          </label>
          <Input
            id={`${editorId}-rte-link-url`}
            type="url"
            size="md"
            placeholder="https://"
            hideFocusRing={hideFocusRing}
            class="w-full"
            value={() => linkUrlDraft.value}
            onInput={(e: Event) => {
              linkUrlDraft.value = (e.target as HTMLInputElement).value;
            }}
            onKeyDown={(e: Event) => {
              const kev = e as KeyboardEvent;
              if (kev.key === "Enter") {
                kev.preventDefault();
                confirmLinkUrl();
              }
            }}
          />
        </Modal>
      ),
      host,
    );
    onCleanup(() => {
      root.unmount();
    });
  });

  /**
   * 工具栏通用 Modal：图片 URL、表格、颜色、导出、快捷键说明、纯提示等（替代原生 prompt/confirm/alert）。
   */
  createRenderEffect(() => {
    if (rteAuxKind.value === "none") return;
    const host = getFormPortalBodyHost();
    if (host == null) return;
    const root = createPortal(
      () => {
        const k = rteAuxKind.value;
        const footerOkCancel = (
          onConfirm: () => void,
        ) => (
          <div class="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="primary" onClick={() => onConfirm()}>
              {m.confirm}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => closeRteAuxModal()}
            >
              {m.cancel}
            </Button>
          </div>
        );

        if (k === "imageUrl") {
          return (
            <Modal
              open
              onClose={closeRteAuxModal}
              title={m.imageModal.title}
              width="sm"
              keyboard
              footer={footerOkCancel(confirmRteAuxImageUrl)}
            >
              <label
                class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                for={`${editorId}-rte-aux-f1`}
              >
                {m.imageModal.urlLabel}
              </label>
              <Input
                id={`${editorId}-rte-aux-f1`}
                type="url"
                size="md"
                placeholder="https://"
                hideFocusRing={hideFocusRing}
                class="w-full"
                value={() => rteAuxDraft1.value}
                onInput={(e: Event) => {
                  rteAuxDraft1.value = (e.target as HTMLInputElement).value;
                }}
                onKeyDown={(e: Event) => {
                  const kev = e as KeyboardEvent;
                  if (kev.key === "Enter") {
                    kev.preventDefault();
                    confirmRteAuxImageUrl();
                  }
                }}
              />
            </Modal>
          );
        }

        if (k === "tablePlain" || k === "tableHeader") {
          const onConfirm = k === "tablePlain"
            ? confirmRteAuxTablePlain
            : confirmRteAuxTableHeader;
          return (
            <Modal
              open
              onClose={closeRteAuxModal}
              title={k === "tableHeader"
                ? m.tableModal.headerTitle
                : m.tableModal.plainTitle}
              width="sm"
              keyboard
              footer={footerOkCancel(onConfirm)}
            >
              <label
                class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                for={`${editorId}-rte-aux-f1`}
              >
                {k === "tableHeader"
                  ? m.tableModal.headerRowsLabel
                  : m.tableModal.rowsLabel}
              </label>
              <Input
                id={`${editorId}-rte-aux-f1`}
                type="text"
                size="md"
                hideFocusRing={hideFocusRing}
                class="w-full"
                value={() => rteAuxDraft1.value}
                onInput={(e: Event) => {
                  rteAuxDraft1.value = (e.target as HTMLInputElement).value;
                }}
              />
              <label
                class="mb-1.5 mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300"
                for={`${editorId}-rte-aux-f2`}
              >
                {m.tableModal.colsLabel}
              </label>
              <Input
                id={`${editorId}-rte-aux-f2`}
                type="text"
                size="md"
                hideFocusRing={hideFocusRing}
                class="w-full"
                value={() => rteAuxDraft2.value}
                onInput={(e: Event) => {
                  rteAuxDraft2.value = (e.target as HTMLInputElement).value;
                }}
                onKeyDown={(e: Event) => {
                  const kev = e as KeyboardEvent;
                  if (kev.key === "Enter") {
                    kev.preventDefault();
                    onConfirm();
                  }
                }}
              />
            </Modal>
          );
        }

        if (k === "export") {
          return (
            <Modal
              open
              onClose={closeRteAuxModal}
              title={m.exportModal.title}
              width="sm"
              keyboard
              footer={
                <div class="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => performExportDownload(true)}
                  >
                    {m.exportModal.exportHtml}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => performExportDownload(false)}
                  >
                    {m.exportModal.exportText}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => closeRteAuxModal()}
                  >
                    {m.exportModal.cancel}
                  </Button>
                </div>
              }
            >
              <p class="text-sm text-slate-600 dark:text-slate-300">
                {m.exportModal.hint}
              </p>
            </Modal>
          );
        }

        if (k === "shortcuts") {
          return (
            <Modal
              open
              onClose={closeRteAuxModal}
              title={m.shortcutsModal.title}
              width="sm"
              keyboard
              footer={
                <div class="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => closeRteAuxModal()}
                  >
                    {m.shortcutsModal.ok}
                  </Button>
                </div>
              }
            >
              <pre class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 font-sans">
                {rteAuxMessage.value}
              </pre>
            </Modal>
          );
        }

        if (k === "info") {
          return (
            <Modal
              open
              onClose={closeRteAuxModal}
              title={m.infoModal.title}
              width="sm"
              keyboard
              footer={
                <div class="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => closeRteAuxModal()}
                  >
                    {m.infoModal.ok}
                  </Button>
                </div>
              }
            >
              <p class="text-sm text-slate-700 dark:text-slate-200">
                {rteAuxMessage.value}
              </p>
            </Modal>
          );
        }

        return null;
      },
      host,
    );
    onCleanup(() => {
      root.unmount();
    });
  });

  /**
   * 通用工具栏 Modal 打开后聚焦首个输入框（导出/说明类无输入则跳过）。
   */
  createEffect(() => {
    const k = rteAuxKind.value;
    if (
      k === "none" || k === "export" || k === "shortcuts" || k === "info"
    ) {
      return;
    }
    const focusId = `${editorId}-rte-aux-f1`;
    queueMicrotask(() => {
      const input = document.getElementById(focusId) as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });
  });

  const resolveImageToUrl = async (
    fileOrBlob: File | Blob,
    kind: "upload" | "paste",
  ): Promise<string | undefined> => {
    if (kind === "upload" && onUploadImage && fileOrBlob instanceof File) {
      const url = await onUploadImage(fileOrBlob);
      return url || undefined;
    }
    if (kind === "paste" && onPasteImage) {
      const url = await onPasteImage(fileOrBlob);
      return url || undefined;
    }
    const action = (uploadAction ?? "").trim();
    if (action) {
      const file = fileOrBlob instanceof File
        ? fileOrBlob
        : new File(
          [fileOrBlob],
          `paste-${Date.now()}.png`,
          { type: fileOrBlob.type || "image/png" },
        );
      return await uploadFileViaUiViewBase(action, file);
    }
    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl || undefined);
      };
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(fileOrBlob);
    });
  };

  const handleUploadChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    void resolveImageToUrl(file, "upload").then((url) => {
      if (url) insertImageUrl(url);
    });
    input.value = "";
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
        void resolveImageToUrl(blob, "paste").then((url) => {
          if (url) insertImageUrl(url);
        });
        return;
      }
    }
  };

  /**
   * 是否展示工具栏与页脚字数行（非只读且存在工具项时为 true）。
   * 隐藏时用 Tailwind `hidden` 类，避免 HTML `hidden` 属性在 hybrid 水合中与客户端不一致。
   */
  const showToolbar = !readOnly && toolbarGroups.length > 0;

  /**
   * 页脚「字数」单独成 getter 子树：在 {@link createMemo} 内订阅 {@link rteWordCountDomTick} 与受控 `value`。
   * 可视化模式下优先用编辑区 DOM 的 `innerHTML` 统计，避免受控 props 与 DOM 短暂不一致时（仍见占位符却按旧 HTML 计字数）。
   * 源码模式用 {@link rteSourceHtml}。无 `document` 或节点未挂载时回退到受控 `value`。
   */
  function RteWordCountReactiveIsland() {
    const wordCountMemo = createMemo(() => {
      readMaybeSignal(value);
      rteWordCountDomTick.value;
      if (rteSourceMode.value) {
        return getWordCount(rteSourceHtml.value);
      }
      const doc = globalThis.document;
      if (doc) {
        const ed = doc.getElementById(editorId) as HTMLDivElement | null;
        if (ed?.isConnected) {
          return getWordCount(ed.innerHTML);
        }
      }
      return getWordCount(readMaybeSignal(value) ?? "");
    });
    return () => (
      <div
        class={twMerge(
          "shrink-0 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600",
          !showToolbar && "hidden",
        )}
        data-rte-wordcount
        aria-hidden={showToolbar ? undefined : true}
        aria-live="polite"
      >
        {m.wordCount(wordCountMemo())}
      </div>
    );
  }

  /**
   * 将受控 `value`（HTML 字符串）同步到 contenteditable。
   * `value` 为无参函数时在此追踪 signal；`ref` 仅用 `createRef` 持有节点。
   * **获焦时不同步**：由 {@link rteEditorHasFocus} 与 {@link rteAnyOverlayOpen}（链接 Modal + 工具栏通用 Modal）门禁，杜绝写 `innerHTML` 导致选区丢失。
   *
   * 首帧 `editorHostRef.current` 常仍为 null（子树尚未挂 ref），若直接 return 则 effect 不会因 ref 赋值再跑，
   * 受控 HTML 永远不写入，表现为占位符 + 字数却按 props 统计。**先读受控依赖，再在微任务重试**直至 ref 就绪。
   *
   * @see editorHostRef
   */
  createEffect(() => {
    /** 源码模式由 {@link rteSourceHtml} 与 `<textarea>` 维护，勿用受控 `value` 覆盖可视区 `innerHTML` */
    if (rteSourceMode.value) return;
    /** 见 {@link rteBlockPropsInnerHtmlAfterSourceExit}：避免切回可视瞬间被旧 `value` 清空 */
    if (rteBlockPropsInnerHtmlAfterSourceExit) return;
    const v = readMaybeSignal(value);
    if (v === undefined) return;

    /**
     * 在 ref 已就绪的编辑区节点上执行受控 innerHTML 同步（与外层 effect 共享同一套门禁）。
     *
     * @param el - contenteditable 根节点
     */
    const syncControlledHtmlToEditor = (el: HTMLDivElement): void => {
      /**
       * 尚未记过撤销对照基准时：仅在**非获焦**且**无弹层**时初始化。
       * 若 `editorHostRef` 晚于首次 effect 就绪，用户已输入后 effect 才跑到此处且曾把本块放在 `rteEditorHasFocus` 检查**之前**，
       * 会用「已含当前输入」的 `innerHTML` 当基准 → 与 `refreshHistoryNavState` 里 `currentHtml` 恒等 → 撤销永灰。
       * 获焦后仍未有基准时改由编辑区 {@link onFocus} 用当时受控值写入。
       */
      if (
        lastSyncedFromPropsHtml === null &&
        !rteEditorHasFocus &&
        !rteAnyOverlayOpen()
      ) {
        /** 仅当 DOM 已与受控值一致时建撤销基准，避免 skipSync 导致从未写 innerHTML 却先把基准设成 v */
        if (rteHtmlLooselyEquals(el.innerHTML, v)) {
          lastSyncedFromPropsHtml = v;
          queueMicrotask(() => refreshHistoryNavState());
        }
      }
      /**
       * 编辑区获焦时 DOM 只能由用户输入 / execCommand 维护；任何受控回写都会重置选区（光标跳行首等）。
       * 链接弹层在 portal 内，焦点离开编辑区时也不能用可能滞后的 `value` 覆盖正文。
       */
      if (rteEditorHasFocus || rteAnyOverlayOpen()) {
        /** 勿在此每帧 `queueMicrotask(refresh)`：`value` 与 {@link historyNavState} 连锁会打爆主线程；撤销态由 onInput/onFocus/工具栏路径刷新即可 */
        return;
      }
      const skipSync = shouldSkipControlledInnerHtmlSync(editorId, el);
      if (skipSync) {
        return;
      }
      if (!rteHtmlLooselyEquals(el.innerHTML, v)) {
        el.innerHTML = v;
        lastSyncedFromPropsHtml = v;
        rteRedoEligibleAfterUndo = false;
        rteWordCountDomTick.value = rteWordCountDomTick.value + 1;
        queueMicrotask(() => refreshHistoryNavState());
      }
    };

    let refWaitAttempts = 0;
    const run = (): void => {
      const el = editorHostRef.current;
      if (!el) {
        refWaitAttempts += 1;
        /** ref 未挂时有限次微任务重试，避免永不 attach 时死循环 */
        if (refWaitAttempts < 48) {
          queueMicrotask(run);
        }
        return;
      }
      syncControlledHtmlToEditor(el);
    };
    run();
  });

  const handleKeyDown = (e: Event) => {
    const ev = e as KeyboardEvent;
    /**
     * 代码块为最后一个块且无后续 `p` 时，浏览器常无法把光标移出；插入时已补空段，此处用 ArrowDown 在块尾显式落到下一段。
     */
    if (!ev.ctrlKey && !ev.metaKey && ev.key === "ArrowDown") {
      if (!disabled && !readOnly && !rteSourceMode.value) {
        const ed = document.getElementById(editorId) as HTMLDivElement | null;
        const sel = document.getSelection();
        if (ed != null && sel != null && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const pre = findOutermostRteCodeBlockPre(ed, range.startContainer);
          if (pre != null) {
            const codeEl = pre.querySelector("code");
            if (
              codeEl != null &&
              rteRangeCollapsedAtEndOfElement(range, codeEl)
            ) {
              rteEnsureParagraphAfterPreIfLast(pre);
              const next = pre.nextSibling;
              if (next instanceof HTMLParagraphElement) {
                ev.preventDefault();
                const r = document.createRange();
                r.selectNodeContents(next);
                r.collapse(true);
                sel.removeAllRanges();
                sel.addRange(r);
                emitChange();
                queueMicrotask(() => refreshHistoryNavState());
                return;
              }
            }
          }
        }
      }
    }
    if (ev.ctrlKey || ev.metaKey) {
      const key = ev.key.toLowerCase();
      if (key === "z") {
        ev.preventDefault();
        if (ev.shiftKey) {
          document.execCommand("redo", false);
          rteRedoEligibleAfterUndo = false;
        } else {
          document.execCommand("undo", false);
          rteRedoEligibleAfterUndo = true;
        }
        emitChange();
        queueMicrotask(() => refreshHistoryNavState());
      } else if (key === "y") {
        ev.preventDefault();
        document.execCommand("redo");
        rteRedoEligibleAfterUndo = false;
        emitChange();
        queueMicrotask(() => refreshHistoryNavState());
      } else if (key === "b") {
        ev.preventDefault();
        rteRedoEligibleAfterUndo = false;
        const ed = document.getElementById(editorId) as HTMLDivElement | null;
        if (!ed || !applyRteInlineDecoration(ed, "bold")) {
          document.execCommand("bold");
        }
        emitChange();
        queueMicrotask(() => refreshHistoryNavState());
      } else if (key === "i") {
        ev.preventDefault();
        rteRedoEligibleAfterUndo = false;
        const ed = document.getElementById(editorId) as HTMLDivElement | null;
        if (!ed || !applyRteInlineDecoration(ed, "italic")) {
          document.execCommand("italic");
        }
        emitChange();
        queueMicrotask(() => refreshHistoryNavState());
      } else if (key === "u") {
        ev.preventDefault();
        rteRedoEligibleAfterUndo = false;
        const ed = document.getElementById(editorId) as HTMLDivElement | null;
        if (!ed || !applyRteInlineDecoration(ed, "underline")) {
          document.execCommand("underline");
        }
        emitChange();
        queueMicrotask(() => refreshHistoryNavState());
      } else if (key === "k") {
        ev.preventDefault();
        openLinkUrlModal();
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
      openRteAuxInfo(m.notFound);
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
      openRteAuxInfo(m.notFound);
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
    /** 查找串为空时不替换，避免 split/join 异常或误操作 */
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
      rteRedoEligibleAfterUndo = false;
      emitChange(editor.innerHTML);
      queueMicrotask(() => refreshHistoryNavState());
    } else {
      const sel = document.getSelection();
      if (sel && sel.toString() === find) {
        rteRedoEligibleAfterUndo = false;
        document.execCommand("insertText", false, replace);
        emitChange();
        queueMicrotask(() => refreshHistoryNavState());
      } else {
        doFind();
      }
    }
  };

  /**
   * 含 {@link For} 与撤销/全屏 signal：单独成组件后，仅本段 **函数子响应式插入** 随 `historyNavState` 重跑。
   * 若在外层根 `return` 里读 `historyNavState`，`ir-clean` 在「嵌套 **函数子响应式插入** 非空」时会整段 detach 根节点，
   * contenteditable 被摘下导致一输入就失焦（见 `view/compiler/ir-clean.ts`）。
   */
  function RteToolbarReactiveIsland() {
    return () => {
      const rteHistoryNav = historyNavState.value;
      const rteFs = rteFullscreen.value;
      /** 源码模式时除「切换回可视化」外禁用工具项，避免命令作用在隐藏的 contenteditable 上 */
      const rteSource = rteSourceMode.value;
      return (
        <div
          class={twMerge(
            toolbarWrapCls,
            "shrink-0",
            !showToolbar && "hidden",
          )}
          data-rte-toolbar
          aria-hidden={showToolbar ? undefined : true}
          role={showToolbar ? "toolbar" : undefined}
          aria-label={showToolbar ? m.toolbarAriaLabel : undefined}
          onMouseDown={(e: Event) => {
            /**
             * 对按钮等阻止默认可保留编辑区选区；若对原生 `<select>` 也 `preventDefault`，下拉无法展开（段落/字号/行高无反应）。
             */
            const t = e.target;
            if (isDomElement(t) && t.closest("select")) return;
            e.preventDefault();
          }}
        >
          {
            /*
             * hybrid + compileSource：`.map` 列表在 `return () => …` 内曾编译成「分组 div 在、子项全空」。
             * `<For>` 走编译器 {@link buildListRenderStmts}，对 render prop 做 `transformExpressionJsxToCalls`，与 mapArray 运行时一致。
             */
          }
          <For each={() => toolbarGroups}>
            {(group, gi) => (
              <div key={gi} class={toolbarGroupCls}>
                <For each={() => group}>
                  {(item) =>
                    item.children && item.children.length > 0
                      ? (
                        item.key === "heading"
                          ? (
                            <RteToolbarItemTip
                              key={item.key}
                              content={item.title}
                            >
                              {
                                /*
                                 * `disabled` 时原生 select 的 hover 行为不一致；由 {@link RteToolbarItemTip} 在外层触发器上处理悬停。
                                 */
                              }
                              <div
                                class={twMerge(
                                  toolbarBtnBase,
                                  controlBlueFocusRing(
                                    !hideFocusRing &&
                                      !rteToolbarDropdownDisabled(
                                        rteSource,
                                        disabled,
                                        item,
                                      ),
                                  ),
                                  /** 按内容收缩，避免 select 被 flex-1 撑满后右侧大片空白 */
                                  "w-fit max-w-36 gap-1 justify-start px-1",
                                  rteToolbarDropdownDisabled(
                                      rteSource,
                                      disabled,
                                      item,
                                    )
                                    ? "pointer-events-none cursor-not-allowed opacity-50"
                                    : "cursor-pointer",
                                )}
                              >
                                {
                                  /*
                                   * 段落下拉左侧 IconType；配置里 icon 文字不会在 select 上单独绘制。
                                   */
                                }
                                <span
                                  class={twMerge(
                                    "inline-flex shrink-0",
                                    rteToolbarDropdownDisabled(
                                        rteSource,
                                        disabled,
                                        item,
                                      )
                                      ? "text-slate-400 dark:text-slate-500"
                                      : "text-slate-600 dark:text-slate-400",
                                  )}
                                  aria-hidden="true"
                                >
                                  <IconType size="xs" class="text-current" />
                                </span>
                                <select
                                  class={twMerge(
                                    rteToolbarSelectFitCls,
                                    "appearance-none border-0 bg-transparent p-0 pr-2.5 text-sm font-medium focus:outline-hidden",
                                    rteToolbarDropdownDisabled(
                                        rteSource,
                                        disabled,
                                        item,
                                      )
                                      ? "cursor-not-allowed text-slate-500 dark:text-slate-400"
                                      : "cursor-pointer text-slate-900 dark:text-slate-100",
                                  )}
                                  disabled={rteToolbarDropdownDisabled(
                                    rteSource,
                                    disabled,
                                    item,
                                  )}
                                  aria-label={item.title}
                                  onMouseDownCapture={() => {
                                    const ed = document.getElementById(
                                      editorId,
                                    ) as HTMLDivElement | null;
                                    if (ed) {
                                      rteSavedToolbarSelectRange =
                                        cloneEditorSelectionRangeIfInside(ed);
                                    }
                                  }}
                                  onChange={(e: Event) =>
                                    handleToolbarSelectChange(item, e)}
                                >
                                  <For each={() => item.children ?? []}>
                                    {(c) => (
                                      <option key={c.value} value={c.value}>
                                        {c.label}
                                      </option>
                                    )}
                                  </For>
                                </select>
                              </div>
                            </RteToolbarItemTip>
                          )
                          : (
                            <RteToolbarItemTip
                              key={item.key}
                              content={item.title}
                            >
                              <select
                                class={twMerge(
                                  toolbarBtnBase,
                                  controlBlueFocusRing(
                                    !hideFocusRing &&
                                      !rteToolbarDropdownDisabled(
                                        rteSource,
                                        disabled,
                                        item,
                                      ),
                                  ),
                                  rteToolbarSelectFitCls,
                                  rteToolbarDropdownDisabled(
                                      rteSource,
                                      disabled,
                                      item,
                                    )
                                    ? "cursor-not-allowed appearance-none pr-2.5"
                                    : "cursor-pointer appearance-none pr-2.5",
                                )}
                                disabled={rteToolbarDropdownDisabled(
                                  rteSource,
                                  disabled,
                                  item,
                                )}
                                aria-label={item.title}
                                onMouseDownCapture={() => {
                                  const ed = document.getElementById(
                                    editorId,
                                  ) as HTMLDivElement | null;
                                  if (ed) {
                                    rteSavedToolbarSelectRange =
                                      cloneEditorSelectionRangeIfInside(ed);
                                  }
                                }}
                                onChange={(e: Event) =>
                                  handleToolbarSelectChange(item, e)}
                              >
                                <For each={() => item.children ?? []}>
                                  {(c) => (
                                    <option key={c.value} value={c.value}>
                                      {c.label}
                                    </option>
                                  )}
                                </For>
                              </select>
                            </RteToolbarItemTip>
                          )
                      )
                      : (
                        <RteToolbarItemTip
                          key={item.key}
                          content={item.key === "sourceHtml" && rteSource
                            ? m.sourceReturn
                            : item.key === "fullscreen" && rteFs
                            ? m.fullscreenExit
                            : item.title}
                        >
                          {
                            /*
                             * 禁用态下 button 仍包在 Tooltip 触发器内，由外层 `span` 接收 `mouseenter`/`mouseleave`。
                             */
                          }
                          <button
                            type="button"
                            class={toolbarButtonClassForItem(
                              item,
                              rteHistoryNav,
                              disabled ||
                                (rteSource &&
                                  item.command !== "rteToggleSourceHtml"),
                              !hideFocusRing,
                            )}
                            disabled={isHistoryToolbarDisabled(
                              item,
                              rteHistoryNav,
                              disabled ||
                                (rteSource &&
                                  item.command !== "rteToggleSourceHtml"),
                            )}
                            aria-label={item.key === "sourceHtml" && rteSource
                              ? m.sourceReturn
                              : item.key === "fullscreen" && rteFs
                              ? m.fullscreenExit
                              : item.title}
                            onMouseDownCapture={item.command === "foreColor" ||
                                item.command === "backColor"
                              ? () => {
                                const ed = document.getElementById(
                                  editorId,
                                ) as HTMLDivElement | null;
                                if (ed) {
                                  rteSavedColorSelectionRange =
                                    cloneEditorSelectionRangeIfInside(ed);
                                }
                              }
                              : item.command === "createLink"
                              ? () => {
                                const ed = document.getElementById(
                                  editorId,
                                ) as HTMLDivElement | null;
                                if (ed) {
                                  rteSavedLinkSelectionRange =
                                    cloneEditorSelectionRangeIfInside(ed);
                                }
                              }
                              : undefined}
                            onMouseDown={(e: Event) => e.preventDefault()}
                            onClick={(e: Event) =>
                              handleToolbarAction(
                                item,
                                undefined,
                                e as MouseEvent,
                              )}
                          >
                            {renderToolbarButtonContent(item, {
                              rteFullscreen: rteFs,
                            })}
                          </button>
                        </RteToolbarItemTip>
                      )}
                </For>
              </div>
            )}
          </For>
        </div>
      );
    };
  }

  /**
   * 可视 contenteditable 与源码 `<textarea>` 并列挂载；{@link rteSourceMode} 必须在本岛的内层 `return () =>` 中读取，
   * 才会订阅 signal 并更新 `hidden`、`contentEditable`。若只在外层根 getter 里读 `rteSourceMode.value`，切换后样式不刷新，
   * 表现为工具栏已按源码态禁用，正文区仍显示富文本且可点（与 {@link RteToolbarReactiveIsland} 同理）。
   */
  function RteEditorBodyReactiveIsland() {
    return () => {
      const srcOn = rteSourceMode.value;
      return (
        <div
          class={maxHeight
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "contents"}
        >
          <div
            key={`${editorId}-body`}
            id={editorId}
            contentEditable={!srcOn && !disabled && !readOnly}
            data-placeholder={placeholder}
            data-rte-editor
            class={twMerge(
              editorSurface,
              maxHeight && "min-h-0 flex-1 basis-0",
              srcOn && "hidden",
              readOnly && editorReadOnlyCls,
              "empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-500",
            )}
            style={minHeight ? { minHeight } : undefined}
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder}
            aria-readonly={readOnly}
            aria-hidden={srcOn ? true : undefined}
            aria-disabled={disabled}
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            /**
             * 聚焦时刷新撤销/重做可用状态。此处不必先 `queueMicrotask`：此时焦点已在编辑区，
             * `refreshHistoryNavState` 内 `hadEditorFocus === true` 不会再次 `focus` 编辑区，也就不会与
             * `suppressEditorFocusHistoryRefresh` 形成死循环（该标志仅在为查 redo 而临时抢焦点时使用）。
             */
            onFocus={() => {
              /** 须先于 `suppress` 分支执行，否则查询 redo 时临时 focus 也会跳过置位 */
              rteEditorHasFocus = true;
              /** Enter 新段用 `p` 而非浏览器默认的 `div`（Chromium 系） */
              trySetDefaultParagraphSeparatorToP();
              /**
               * ref 未就绪时 createEffect 可能从未写入 {@link lastSyncedFromPropsHtml}；须在首次获焦用**当时**受控值建基准，
               * 勿等「已输入后」的 effect 用 innerHTML 初始化（见上方 effect 注释）。
               */
              if (lastSyncedFromPropsHtml === null) {
                const vNow = typeof value === "function"
                  ? value()
                  : (value ?? "");
                lastSyncedFromPropsHtml = vNow;
              }
              if (suppressEditorFocusHistoryRefresh) return;
              refreshHistoryNavState();
            }}
            onBlur={() => {
              rteEditorHasFocus = false;
              queueMicrotask(() => refreshHistoryNavState());
            }}
            ref={editorHostRef}
          />
          {
            /*
             * 源码模式：等宽文本区直接编辑 HTML；`onInput` 与 {@link emitChange} 同步父级与隐藏 `name` 字段。
             */
          }
          <textarea
            id={`${editorId}-source`}
            data-rte-source-editor
            class={twMerge(
              editorSurface,
              maxHeight && "min-h-0 flex-1 basis-0 resize-none",
              !maxHeight && "resize-y",
              "font-mono text-xs whitespace-pre-wrap wrap-break-word tab-size-2",
              !srcOn && "hidden",
              readOnly && editorReadOnlyCls,
            )}
            style={minHeight ? { minHeight } : undefined}
            spellcheck={false}
            disabled={disabled}
            readOnly={readOnly}
            aria-label={m.sourceTextareaAriaLabel}
            aria-hidden={!srcOn ? true : undefined}
            value={() => rteSourceHtml.value}
            onInput={(e: Event) => {
              const v = (e.target as HTMLTextAreaElement).value;
              rteSourceHtml.value = v;
              emitChange(v);
              queueMicrotask(() => refreshHistoryNavState());
            }}
          />
        </div>
      );
    };
  }

  return () => (
    <div
      id={`${editorId}-root`}
      class={twMerge(
        "rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 relative",
        /** 限制最大高度时根为纵向 flex，正文在子级滚动；`max-h` 用变量便于全屏态覆盖。 */
        maxHeight &&
          "flex min-h-0 max-h-[var(--rte-max-body)] flex-col [&.rte-fullscreen]:max-h-none",
        /** 编辑区获焦时整格外框变蓝，与 Input 系一致；不画内层 ring，避免套在外框里一圈缝 */
        !hideFocusRing &&
          "has-[[data-rte-editor]:focus]:border-blue-500 dark:has-[[data-rte-editor]:focus]:border-blue-400 has-[[data-rte-source-editor]:focus]:border-blue-500 dark:has-[[data-rte-source-editor]:focus]:border-blue-400",
        "[&.rte-fullscreen]:fixed [&.rte-fullscreen]:inset-0 [&.rte-fullscreen]:z-9999 [&.rte-fullscreen]:bg-white [&.rte-fullscreen]:dark:bg-slate-900 [&.rte-fullscreen]:flex [&.rte-fullscreen]:flex-col",
        className,
      )}
      style={maxHeight
        ? ({
          "--rte-max-body": maxHeight,
        } as Record<string, string> & { "--rte-max-body": string })
        : undefined}
    >
      <RteToolbarReactiveIsland />
      <div
        id={`${editorId}-findbar`}
        class={twMerge(
          "shrink-0 flex flex-wrap items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 rte-findbar-hidden",
          "[&.rte-findbar-hidden]:h-0 [&.rte-findbar-hidden]:overflow-hidden [&.rte-findbar-hidden]:opacity-0 [&.rte-findbar-hidden]:pointer-events-none [&.rte-findbar-hidden]:min-h-0 [&.rte-findbar-hidden]:p-0 [&.rte-findbar-hidden]:border-b-0",
        )}
        role="search"
      >
        <input
          type="text"
          data-find-input
          placeholder={m.findbar.findPlaceholder}
          class={twMerge(
            findBarInputSurface,
            controlBlueFocusRing(!hideFocusRing),
          )}
        />
        <RteToolbarItemTip content={m.findbar.findNextTip}>
          <button
            type="button"
            class={twMerge(
              toolbarBtnBase,
              controlBlueFocusRing(!hideFocusRing),
            )}
            aria-label={m.findbar.findNextTip}
            onClick={() => doFind()}
          >
            {m.findbar.findButton}
          </button>
        </RteToolbarItemTip>
        <input
          type="text"
          data-replace-input
          placeholder={m.findbar.replacePlaceholder}
          class={twMerge(
            findBarInputSurface,
            controlBlueFocusRing(!hideFocusRing),
          )}
        />
        <RteToolbarItemTip content={m.findbar.replaceCurrentTip}>
          <button
            type="button"
            class={twMerge(
              toolbarBtnBase,
              controlBlueFocusRing(!hideFocusRing),
            )}
            aria-label={m.findbar.replaceCurrentTip}
            onClick={() => doReplace(false)}
          >
            {m.findbar.replaceButton}
          </button>
        </RteToolbarItemTip>
        <RteToolbarItemTip content={m.findbar.replaceAllTip}>
          <button
            type="button"
            class={twMerge(
              toolbarBtnBase,
              controlBlueFocusRing(!hideFocusRing),
            )}
            aria-label={m.findbar.replaceAllTip}
            onClick={() => doReplace(true)}
          >
            {m.findbar.replaceAllButton}
          </button>
        </RteToolbarItemTip>
      </div>
      <RteEditorBodyReactiveIsland />
      {name != null && (
        <input
          type="hidden"
          id={`${editorId}-hidden`}
          name={name}
          value={untrack(() => readMaybeSignal(value) ?? "")}
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
      <ColorPicker
        hideTrigger
        pickerRef={rteColorPickerRef}
        id={`${editorId}-rte-cp`}
        value={rteAuxDraft1.value}
        hideFocusRing={hideFocusRing}
        class="w-0 min-w-0"
        onInput={(e: Event) => {
          rteAuxDraft1.value = (e.target as HTMLInputElement).value;
        }}
        onChange={(e: Event) => {
          rteAuxDraft1.value = (e.target as HTMLInputElement).value;
        }}
        onOpenChange={(open: boolean) => {
          rteColorPickerOpen.value = open;
        }}
        onApply={(hex: string) => {
          const cmd = rteAuxColorCmd;
          const color = hex.trim();
          if (!color) return;
          const ed = document.getElementById(editorId) as HTMLDivElement | null;
          if (!ed) return;
          const saved = rteSavedColorSelectionRange;
          rteSavedColorSelectionRange = null;
          rteRedoEligibleAfterUndo = false;
          applyRteForeOrBackColor(ed, saved, cmd, color);
          emitChange();
          queueMicrotask(() => refreshHistoryNavState());
        }}
      />
      <RteWordCountReactiveIsland />
    </div>
  );
}
