/**
 * Modal 模态弹窗（View）。
 * 桌面居中弹层：遮罩、标题、内容、底部按钮；支持关闭、点击遮罩关闭、Esc、自定义宽度与 footer。
 * 支持拖动标题栏、全屏切换；全屏与关闭按钮并排于标题栏右侧。
 * 拖动默认 `keepInView`（可视区内，不可拖出窗口）；可显式 `false` 关闭。
 * 非全屏弹层限制在视口宽内（减去两侧边距），正文直接子项 `max-width: 100%`，
 * 避免业务里写死的表单宽度撑出横向滚动条。
 *
 * **客户端**：`open === true` 且存在真实 `globalThis.document.body` 时，用 {@link createPortal} 挂到 `body`；
 * Portal 路径下父级槽位返回**隐藏占位 `span`**（勿返回 `null`），避免 Hybrid 水合 `replaceSlot` 与仅 `null` 时更新链异常。
 * 使用 {@link createRenderEffect} 同步挂载 Portal（`createEffect` 偏微任务，点击后控制台/视图可能晚一拍）。
 * **SSR**（无 `body`）时内联渲染；遮罩行内 `z-index`。
 *
 * **`open` 与 Hybrid**：勿传 `open={sig.value}` 布尔快照（父级 **函数子响应式插入** 可能不因 `.value` 变化重跑本组件）。
 * 应传 **`open={sig}`**（`Signal<boolean>`，`createSignal` 返回值）或 **`open={() => …}`**（零参 getter）；本组件内用 {@link createMemo} 读 `.value`，可独立订阅。
 * **勿**把「是否挂 Portal」写在首帧 `if (isOpen())` 里：首帧关闭时若跳过注册 {@link createRenderEffect}，`open` 后也不会再挂载（函数组件不会重跑）。
 *
 * **注意**：组件内 `createSignal`/`createEffect` 等须在**每次调用**时按相同顺序执行，不可在 `open === false` 时提前 return 跳过。
 *
 * **`width` / `title` / `children` / `footer` 与 compileSource**：父级 MountFn 可能只合并首帧 props；**`width` / `title`** 与 `open` 同向可传零参 getter，
 * 本组件内用 {@link createMemo} 订阅，打开后改预设仍会更新宽高与标题。**`footer`** 同样经 memo 读 {@link ModalProps.footer}，避免底栏 VNode 卡在首帧（确认框危险/警告样式与回调不刷新）。
 * **`children`** 仅当不关弹窗、正文也要随同一 signal 变时再传 `children={() => …}`；普通静态子节点即可。
 *
 * **拖动**：`position` 只经 DOM `transform` 更新，**不**订入 Portal `buildModalMarkup`，避免整树重插／子树 remount。
 **正文／底栏**：`children` 与 `footer` 在内容槽与底栏槽内各自订阅，**不**订入 `buildModalMarkup`，
 避免底栏随表单值重算时拆掉重建输入框、输入失焦。
 * `onPositionChange` 仅在拖拽结束回调（便于宿主持久化），拖动过程不回写宿主。
 * **标题状态挂点**：`#modal-title` 旁固定空 `[data-modal-title-status]`，宿主／子树可 DOM patch 绿点文案；勿用 `title` signal 驱动状态。
 */

import {
  createEffect,
  createMemo,
  createPortal,
  createRenderEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
  untrack,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { Overlay } from "../../shared/feedback/Overlay.tsx";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
} from "../../shared/feedback/controlled-open.ts";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconClose } from "../../shared/basic/icons/Close.tsx";
import { IconExitFullscreen } from "../../shared/basic/icons/ExitFullscreen.tsx";
import { IconMaximize2 } from "../../shared/basic/icons/Maximize2.tsx";

/** `open` 合法形态：布尔快照、`createSignal` 容器，或返回 boolean 的零参 getter（嵌套 state 用 getter）。 */
export type ModalOpenInput = ControlledOpenInput;

/** 标题栏主文案相对弹层的水平对齐（右侧关闭/全屏仍贴右） */
export type ModalTitleAlign = "left" | "center";

/** 宽度字面量与 CSS 数值形态（非 getter）。 */
export type ModalWidthPrimitive =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | string
  | number;

/**
 * `width` 可与 `open` 一样传零参 getter，避免 Hybrid/compileSource 下首帧快照不随 signal 更新。
 */
export type ModalWidthInput =
  | ModalWidthPrimitive
  | (() => ModalWidthPrimitive | undefined);

/**
 * `title` 支持零参 getter；`false` 与 `null` 均不展示标题栏。
 */
export type ModalTitleInput =
  | string
  | null
  | false
  | (() => string | null | false | undefined);

/**
 * 模态层在视口内垂直落位：当前仅 `bottom`（与底部对齐，适配 Home 条安全区），后续可扩展如 `top`。
 */
export type ModalPlacement = "bottom";

/**
 * Modal 内置文案。
 */
export interface ModalMessages {
  /** 右上角关闭按钮 `aria-label` */
  close: string;
  /** 进入全屏按钮 `aria-label` */
  enterFullscreen: string;
  /** 退出全屏按钮 `aria-label` */
  exitFullscreen: string;
  /** 遮罩 `aria-label` */
  mask: string;
}

/** 默认中文文案 */
export const defaultModalMessages: ModalMessages = {
  close: "关闭",
  enterFullscreen: "全屏",
  exitFullscreen: "退出全屏",
  mask: "遮罩",
};

export interface ModalProps {
  /**
   * 是否打开（受控）。
   * 推荐 `open={createSignal 返回值}`；勿依赖 `open={x.value}` 在 Hybrid 下随点击更新。
   */
  open?: ModalOpenInput;
  /** 关闭回调（关闭按钮、遮罩、Esc 触发） */
  onClose?: () => void;
  /** 标题；传 null 或 false 不显示标题栏；可传 `() => string` 订阅 signal */
  title?: ModalTitleInput;
  /**
   * 标题主文案对齐：`center` 在弹层内水平居中（默认）；`left` 与右侧操作按钮两端排布。
   */
  titleAlign?: ModalTitleAlign;
  /** 弹层内容；可传 `() => VNode` 零参 getter 与宽度同步更新 */
  children?: unknown;
  /** 底部区域：传 VNode 或 null 不显示；不传时默认无 footer。可传 `() => VNode` 零参 getter（与 children 相同，随 signal 更新）。自定义「确定／取消」脚时请 **确定在左、取消在右**（与 Dialog／Popconfirm 一致）。 */
  footer?: unknown;
  /** 是否显示右上角关闭按钮，默认 true */
  closable?: boolean;
  /** 点击遮罩是否关闭，默认 true；`mask={false}` 时不渲染遮罩，本项无实际点击目标 */
  maskClosable?: boolean;
  /** 是否渲染半透明遮罩；`false` 时不渲染遮罩层且不挡背后点击，宜配合 keyboard/关闭按钮 */
  mask?: boolean;
  /** 弹层宽度：预设或 CSS 字符串、数字（px）；默认 "520px"（等同 sm）；可传 `() => 同上` */
  width?: ModalWidthInput;
  /**
   * 是否在视口内垂直居中；`false` 时靠上并留顶距（与 Ant Design 顶部对齐相近）。
   * 与 {@link placement} 同传时，以 `placement` 为准（`placement="bottom"` 时不再使用本项的垂直方向）。
   */
  centered?: boolean;
  /**
   * 在遮罩中的垂直落位。传 `bottom` 时自底部对齐（如底部 Sheet），并预留 `safe-area` 下内边距；水平仍居中。
   * 未传时沿用 `centered` 的居上/居中行为。
   */
  placement?: ModalPlacement;
  /** 关闭后是否销毁子节点（不挂载），默认 false */
  destroyOnClose?: boolean;
  /** 是否支持 Esc 关闭，默认 false；传 true 时按 Esc 触发 onClose */
  keyboard?: boolean;
  /** 是否可拖动（标题栏拖拽），默认 false；传 true 时可拖移弹层 */
  draggable?: boolean;
  /**
   * 拖动时是否限制在浏览器可视区内（不可拖出窗口／看不见）。
   * 默认 **true**；仅 `draggable` 时生效。传 `false` 可恢复无边界拖动。
   */
  keepInView?: boolean;
  /**
   * 拖动位移初始值（相对默认落点的 translate x/y，单位 px）。
   * 仅在挂载／`open` 从关→开时采用；之后以内部拖动为准。可传零参 getter。
   */
  defaultPosition?:
    | { x: number; y: number }
    | (() => { x: number; y: number } | undefined);
  /**
   * 拖动过程／结束时的位移回调（mouseup 再报一次最终值）。
   * 用于宿主持久化 left/top 等价的 translate 偏移。
   */
  onPositionChange?: (pos: { x: number; y: number }) => void;
  /**
   * 每次打开弹层时是否初始为全屏布局；关闭后重置为窗口态。
   * 与 `fullscreenable` 独立；二者可同时使用（打开即全屏且保留切换按钮）。
   * 可传零参 getter，在每次打开时再求值（例如按当前视口决定）。
   */
  fullscreen?: boolean | (() => boolean | undefined);
  /** 是否显示全屏切换按钮（与关闭按钮并排），默认 false；传 true 时显示 */
  fullscreenable?: boolean;
  /** 遮罩 class（仅 `mask !== false` 时生效） */
  maskClass?: string;
  /** 弹层容器 class */
  wrapClass?: string;
  /** 内容区 class */
  bodyClass?: string;
  /**
   * 底部栏（含确定/取消等）外层 flex 容器的 class，与默认的 `justify-end` 等合并；用于 `Dialog` 在窄屏居中等。
   */
  footerClass?: string;
  /** 额外 class（作用于弹层盒子） */
  class?: string;
  /** 多语言/自定义文案；未传字段走 {@link defaultModalMessages} */
  messages?: Partial<ModalMessages>;
}

const defaultWidth = "520px";

/** 非全屏弹层在窄屏上不超过视口（左右各留 1rem，并计入安全区）。 */
export const MODAL_VIEWPORT_MAX_WIDTH =
  "min(100%, calc(100vw - 2rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)))";

/**
 * 弹层盒子尺寸：给出 width 的同时用 maxWidth 卡住视口，并用 minWidth:0
 * 避免作为 flex 子项时被内部固定宽表单撑破。
 */
export function modalShellSizeStyle(opts: {
  fullscreen: boolean;
  width: string;
  placement?: string;
}): Record<string, string> {
  if (opts.fullscreen) {
    return {
      width: "100%",
      height: "100%",
      maxWidth: "100vw",
      maxHeight: "100vh",
    };
  }
  return {
    width: opts.width,
    maxWidth: opts.placement === "bottom" ? "100%" : MODAL_VIEWPORT_MAX_WIDTH,
    minWidth: "0",
    boxSizing: "border-box",
  };
}

/** 预设宽度：xs/sm/md/lg/xl 对应 400/520/640/800/960px */
const WIDTH_PRESETS: Record<string, string> = {
  xs: "400px",
  sm: "520px",
  md: "640px",
  lg: "800px",
  xl: "960px",
};

/**
 * 解析 `width`：支持快照或零参 getter；getter 返回 `undefined` 时用默认宽度。
 *
 * @param v - `ModalProps.width`
 * @returns 用于样式计算的宽度原始值
 */
function readModalFullscreenInput(
  v: boolean | (() => boolean | undefined) | undefined,
): boolean {
  if (typeof v === "function") return !!v();
  return !!v;
}

function readModalWidthInput(
  v: ModalWidthInput | undefined,
): ModalWidthPrimitive {
  if (v === undefined) return defaultWidth;
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return defaultWidth;
    const inner = (v as () => ModalWidthPrimitive | undefined)();
    return inner === undefined ? defaultWidth : inner;
  }
  return v;
}

/**
 * 解析 `title`：`null`/`false`/空串不展示标题栏；支持零参 getter。
 *
 * @param v - `ModalProps.title`
 * @returns 展示用文案，`null` 表示无标题栏
 */
function readModalTitleInput(v: ModalTitleInput | undefined): string | null {
  if (v === undefined) return null;
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return null;
    const t = (v as () => unknown)();
    if (t === null || t === false || t === undefined) return null;
    if (typeof t === "string") return t === "" ? null : t;
    return String(t);
  }
  if (v === null || v === false) return null;
  if (typeof v === "string") return v === "" ? null : v;
  return String(v);
}

/**
 * 解析 `children`：若为无参函数则调用一次（用于与 signal 同步的子树）。
 *
 * @param v - `ModalProps.children`
 * @returns 实际插入内容区的节点描述
 */
function readModalChildrenInput(v: unknown): unknown {
  if (typeof v === "function" && (v as () => unknown).length === 0) {
    return (v as () => unknown)();
  }
  return v;
}

/**
 * 仅当 `globalThis.document` 与 `body` 存在且为元素节点时设置 `body.style.overflow`。
 *
 * @param overflow - 写入 `overflow` 的 CSS 值
 */
function trySetDocumentBodyOverflow(overflow: string): void {
  try {
    if (typeof globalThis.document === "undefined") return;
    const b = globalThis.document.body;
    if (b == null || b.nodeType !== 1) return;
    const st = b.style;
    if (st == null) return;
    st.overflow = overflow;
  } catch {
    /* 非浏览器或受限环境 */
  }
}

/**
 * 是否可将 Portal 挂到真实页面 `body`（SSR 字符串渲染时常无 `body`）。
 *
 * @returns 可作为 Portal 容器的 `body` 元素，否则 `null`
 */
function getBrowserBodyPortalHost(): HTMLElement | null {
  try {
    if (typeof globalThis.document === "undefined") return null;
    const b = globalThis.document.body;
    if (b == null || b.nodeType !== 1) return null;
    return b as HTMLElement;
  } catch {
    return null;
  }
}

/**
 * 标题栏按下时开始拖动：与 ImageViewer 的 useImageDrag 一致，不计算偏移，按下位置即起点，只按位移累加。
 * 在 globalThis.document 上监听 mousemove/mouseup，requestAnimationFrame 节流 + passive，保证跟手。
 *
 * @param getPosition 当前位移 getter
 * @param setPosition 设置位移
 * @param enabled 是否启用拖动
 */

function readModalDefaultPosition(
  v: ModalProps["defaultPosition"],
): { x: number; y: number } {
  if (v == null) return { x: 0, y: 0 };
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return { x: 0, y: 0 };
    const inner = (v as () => { x: number; y: number } | undefined)();
    if (!inner || typeof inner !== "object") return { x: 0, y: 0 };
    const x = Number((inner as { x?: unknown }).x);
    const y = Number((inner as { y?: unknown }).y);
    return {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
    };
  }
  const x = Number((v as { x?: unknown }).x);
  const y = Number((v as { y?: unknown }).y);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  };
}

/**
 * 将拟议 translate 偏移钳到视口内，使弹层矩形尽量留在可视区。
 * 供拖动与单测复用。
 *
 * @param next 拟议 translate
 * @param startPos mousedown 时的 translate
 * @param startRect mousedown 时弹层 getBoundingClientRect
 * @param viewport 视口宽高
 * @param margin 边距（px），默认 0
 */
export function clampModalTranslateToViewport(
  next: { x: number; y: number },
  startPos: { x: number; y: number },
  startRect: { left: number; top: number; width: number; height: number },
  viewport: { width: number; height: number },
  margin = 0,
): { x: number; y: number } {
  const dx = next.x - startPos.x;
  const dy = next.y - startPos.y;
  let left = startRect.left + dx;
  let top = startRect.top + dy;
  const w = startRect.width;
  const h = startRect.height;
  const vw = viewport.width;
  const vh = viewport.height;
  const minLeft = Math.min(margin, vw - w - margin);
  const maxLeft = Math.max(margin, vw - w - margin);
  const minTop = Math.min(margin, vh - h - margin);
  const maxTop = Math.max(margin, vh - h - margin);
  left = Math.min(Math.max(left, minLeft), maxLeft);
  top = Math.min(Math.max(top, minTop), maxTop);
  return {
    x: startPos.x + (left - startRect.left),
    y: startPos.y + (top - startRect.top),
  };
}

function useDrag(
  getPosition: () => { x: number; y: number },
  setPosition: (v: { x: number; y: number }) => void,
  enabled: boolean,
  onDragEnd?: (pos: { x: number; y: number }) => void,
  options?: {
    keepInView?: boolean;
    getBoxEl?: () => HTMLElement | null;
  },
) {
  return (e: MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = getPosition();
    const boxEl = options?.getBoxEl?.() ?? null;
    const startRect = boxEl?.getBoundingClientRect?.() ?? null;
    const constrain = options?.keepInView !== false;
    let rafId = 0;
    let last = startPos;
    const clamp = (raw: { x: number; y: number }) => {
      if (!constrain || !startRect) return raw;
      const vw = globalThis.innerWidth ?? startRect.width;
      const vh = globalThis.innerHeight ?? startRect.height;
      return clampModalTranslateToViewport(raw, startPos, startRect, {
        width: vw,
        height: vh,
      });
    };
    const onMove = (ev: MouseEvent) => {
      const nextX = startPos.x + ev.clientX - startX;
      const nextY = startPos.y + ev.clientY - startY;
      last = clamp({ x: nextX, y: nextY });
      if (rafId) globalThis.cancelAnimationFrame(rafId);
      rafId = globalThis.requestAnimationFrame(() => {
        rafId = 0;
        setPosition(last);
      });
    };
    const doc = typeof globalThis.document !== "undefined"
      ? globalThis.document
      : null;
    const onUp = () => {
      if (rafId) globalThis.cancelAnimationFrame(rafId);
      // Ensure final position applied + notify host (persist).
      last = clamp(last);
      setPosition(last);
      onDragEnd?.(last);
      if (!doc) return;
      doc.removeEventListener(
        "mousemove",
        onMove,
        { passive: true } as AddEventListenerOptions,
      );
      doc.removeEventListener("mouseup", onUp);
    };
    if (doc) {
      doc.addEventListener("mousemove", onMove, { passive: true });
      doc.addEventListener("mouseup", onUp);
    }
  };
}

/** 弹层内可聚焦选择器（与常见 a11y 实践对齐） */
const MODAL_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 收集容器内可见可聚焦元素。
 */
function listModalFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR),
  )
    .filter((el) => {
      if (el.getAttribute("aria-hidden") === "true") return false;
      const style = globalThis.getComputedStyle?.(el);
      if (
        style && (style.visibility === "hidden" || style.display === "none")
      ) {
        return false;
      }
      return true;
    });
}

export function Modal(props: ModalProps): JSXRenderable {
  const {
    onClose,
    closable = true,
    maskClosable = true,
    mask: showMask = true,
    centered = true,
    destroyOnClose = false,
    keyboard = false,
    draggable = false,
    keepInView,
    fullscreenable = false,
    titleAlign = "center",
    maskClass,
    wrapClass,
    bodyClass,
    footerClass,
    class: className,
    messages,
  } = props;
  const m = { ...defaultModalMessages, ...messages };

  /**
   * 禁止在 `open === false` 时提前 return：否则关闭态不执行 `createSignal`/`createEffect`，
   * 打开态才执行，会破坏 View 与同类框架的 **hook 调用顺序一致**，表现为点击后无更新、事件异常等。
   */
  const fullscreen = createSignal(false);
  const position = createSignal(
    readModalDefaultPosition(props.defaultPosition),
  );
  /** Dialog box DOM — drag writes transform here; must not feed Portal rebuild. */
  let modalBoxEl: HTMLElement | null = null;

  function applyModalBoxTransform(
    el: HTMLElement | null,
    pos: { x: number; y: number },
    isFullscreen: boolean,
  ): void {
    if (!el) return;
    if (isFullscreen) {
      el.style.transform = "";
      el.style.willChange = "";
      return;
    }
    el.style.transform = `translate(${pos.x}px,${pos.y}px)`;
    el.style.willChange = pos.x !== 0 || pos.y !== 0 ? "transform" : "";
  }

  // Drag／open：只改 style，不触发 Portal insert 重跑
  createEffect(() => {
    const pos = position.value;
    const fs = fullscreen.value;
    applyModalBoxTransform(modalBoxEl, pos, fs);
  });

  /**
   * 在组件内订阅 `open`（`Signal` / getter），避免 Hybrid 下父级未重跑时 `open={sig.value}` 卡在首帧。
   */
  const isOpen = createMemo(() => readControlledOpenInput(props.open));

  /**
   * 与 `open` 同向：`width`/`title`/`children` 在 {@link buildModalMarkup} 内通过 memo 读取，
   * Portal 的 insert getter 重跑时能订阅零参 getter 内的 signal（compileSource 首帧 props 快照不再卡宽度）。
   */
  const resolvedWidth = createMemo(() => readModalWidthInput(props.width));
  const resolvedTitle = createMemo(() => readModalTitleInput(props.title));
  const resolvedChildren = createMemo(() =>
    readModalChildrenInput(props.children)
  );

  /** 底栏须随 `props.footer` patch 更新；零参 getter 与 `children` 一样在 memo 内解开，避免 loading 等卡在首帧。 */
  const resolvedFooter = createMemo(() => readModalChildrenInput(props.footer));

  /**
   * `fullscreen` prop：每次打开时同步初始全屏态，关闭时清零，避免下次打开仍停留在上一档全屏。
   */
  createEffect(() => {
    if (isOpen()) {
      fullscreen.value = readModalFullscreenInput(props.fullscreen);
      // Re-apply host defaultPosition on each open (e.g. restored from localStorage).
      position.value = readModalDefaultPosition(props.defaultPosition);
    } else {
      fullscreen.value = false;
    }
  });

  /** 打开时在 globalThis.document 上监听 Esc，不依赖弹层获焦；关闭时移除监听 */
  createEffect(() => {
    if (!isOpen()) return;
    const doc = typeof globalThis.document !== "undefined"
      ? globalThis.document
      : null;
    if (!doc) return;
    const handler = (e: KeyboardEvent) => {
      if (keyboard && e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    doc.addEventListener("keydown", handler as EventListener);
    return () => doc.removeEventListener("keydown", handler as EventListener);
  });

  /**
   * 打开时：记住触发焦点 → 聚焦弹层首个可聚焦控件；Tab 循环陷阱；
   * 关闭／卸载时恢复先前焦点（避免焦点落到 body 丢失键盘上下文）。
   */
  createEffect(() => {
    if (!isOpen()) return;
    const doc = typeof globalThis.document !== "undefined"
      ? globalThis.document
      : null;
    if (!doc) return;
    const previouslyFocused = doc.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const panel = doc.querySelector<HTMLElement>("[data-ui-modal-panel]");
      if (!panel) return;
      const list = listModalFocusable(panel);
      (list[0] ?? panel).focus?.({ preventScroll: true });
    };
    const raf = globalThis.requestAnimationFrame?.(focusFirst);
    // fallback without rAF
    if (raf == null) Promise.resolve().then(focusFirst);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const panel = doc.querySelector<HTMLElement>("[data-ui-modal-panel]");
      if (!panel) return;
      const list = listModalFocusable(panel);
      if (list.length === 0) {
        e.preventDefault();
        panel.focus?.({ preventScroll: true });
        return;
      }
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const active = doc.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    doc.addEventListener("keydown", onKeyDown as EventListener);
    return () => {
      doc.removeEventListener("keydown", onKeyDown as EventListener);
      if (raf != null) globalThis.cancelAnimationFrame?.(raf);
      if (
        previouslyFocused &&
        typeof previouslyFocused.focus === "function" &&
        doc.contains(previouslyFocused)
      ) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  });

  /** 默认 true：拖动不可出可视区；显式 false 关闭。 */
  const constrainDrag = keepInView ?? true;

  const handleTitleMouseDown = useDrag(
    () => position.value,
    (v) => {
      // Live drag: update internal position → DOM transform effect only.
      position.value = v;
    },
    draggable,
    (v) => {
      // Persist once on mouseup — host must not drive Portal rebuild props.
      props.onPositionChange?.(v);
    },
    {
      keepInView: constrainDrag,
      getBoxEl: () => modalBoxEl,
    },
  );

  /**
   * 弹层 DOM：Portal 的 `insert` getter 订阅 `fullscreen` / {@link resolvedWidth} 等。
   * **不**订阅 `position`（拖动只改 DOM transform，见 {@link applyModalBoxTransform}）。
   * **不**订阅 {@link resolvedChildren}／{@link resolvedFooter}：二者在槽内以 thunk 插入，
   * 底栏随表单值更新时只替换底栏，不重建正文输入框。
   * `style` 须为 **camelCase 对象**：compileSource 下模板字符串 style 会误生成 `Object.assign(el.style, string)` 导致浏览器抛错。
   */
  const buildModalMarkup = () => {
    const w = resolvedWidth();
    const widthStyle = typeof w === "number"
      ? `${w}px`
      : (WIDTH_PRESETS[w as string] ?? String(w));
    const title = resolvedTitle();
    const isFullscreen = fullscreen.value;
    // untrack：首帧带上位移，但不把 position 订进 Portal effect
    const pos = untrack(() => position.value);
    const hasOffset = pos.x !== 0 || pos.y !== 0;
    const placement = props.placement;
    /** 写入 `CSSStyleDeclaration` 的扁平对象（勿用整段 cssText 字符串作 style={…}） */
    const modalBoxStyle: Record<string, string> = {
      ...modalShellSizeStyle({
        fullscreen: isFullscreen,
        width: widthStyle,
        placement,
      }),
      ...(!isFullscreen && draggable
        ? {
          transform: `translate(${pos.x}px,${pos.y}px)`,
          ...(hasOffset ? { willChange: "transform" } : {}),
        }
        : {}),
    };
    const modalClass = isFullscreen
      ? "rounded-none"
      : "rounded-xl max-h-[90vh] min-w-0";
    const showHeaderActions = fullscreenable || closable;
    const wrapZ = isFullscreen ? 9999 : 300;

    return (
      <div
        class={twMerge(
          "fixed inset-0 flex justify-center",
          placement === "bottom"
            ? "items-end pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-0 px-0 sm:px-4"
            : (centered ? "items-center" : "items-start pt-12 sm:pt-16"),
          !showMask && "pointer-events-none",
          wrapClass,
        )}
        style={{ zIndex: wrapZ }}
        data-ui-modal-panel=""
        tabindex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {showMask
          ? (
            <Overlay
              open
              portal={false}
              lockScroll={false}
              position="absolute"
              class={twMerge(
                "bg-black/50 dark:bg-black/60 backdrop-blur-sm",
                maskClass,
              )}
              clickable={maskClosable}
              onClick={() => onClose?.()}
              aria-label={m.mask}
            />
          )
          : null}
        <div
          class={twMerge(
            "relative z-10 flex flex-col shadow-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
            !showMask && "pointer-events-auto",
            modalClass,
            className,
          )}
          style={modalBoxStyle}
          ref={(el: HTMLElement | null) => {
            modalBoxEl = el;
            if (el) {
              applyModalBoxTransform(
                el,
                untrack(() => position.value),
                untrack(() => fullscreen.value),
              );
            }
          }}
          onClick={(e: Event) => e.stopPropagation()}
        >
          {(title != null && title !== "")
            ? (
              <div
                class={twMerge(
                  "shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-600 bg-slate-200/80 dark:bg-slate-900/70",
                  !isFullscreen && "rounded-t-xl",
                  titleAlign === "center"
                    ? "relative flex min-h-14 items-center justify-center"
                    : "flex items-center justify-between gap-2",
                  draggable && "cursor-grab active:cursor-grabbing select-none",
                )}
                onMouseDown={handleTitleMouseDown as unknown as (
                  e: Event,
                ) => void}
              >
                {
                  /*
                  标题＋静态状态挂点：宿主／WebChat 只 DOM patch
                  [data-modal-title-status]，勿用 title signal 驱动（防 Portal 重插）。
                */
                }
                <div
                  class={twMerge(
                    "flex min-w-0 items-center gap-2",
                    titleAlign === "center"
                      ? showHeaderActions
                        ? "w-full justify-center px-14 sm:px-16"
                        : "w-full justify-center px-1"
                      : "flex-1 pr-2",
                  )}
                >
                  <h2
                    id="modal-title"
                    class="text-lg font-semibold min-w-0 truncate box-border"
                  >
                    {title}
                  </h2>
                  <span
                    data-modal-title-status=""
                    data-testid="modal-title-status"
                    class="hidden shrink-0 items-center gap-1.5 text-xs font-normal text-slate-500 dark:text-slate-400"
                    aria-live="polite"
                  />
                </div>
                {showHeaderActions && (
                  <div
                    class={twMerge(
                      "flex items-center gap-1 shrink-0",
                      titleAlign === "center" &&
                        "absolute right-4 top-1/2 -translate-y-1/2",
                    )}
                  >
                    {fullscreenable && (
                      <button
                        type="button"
                        aria-label={isFullscreen
                          ? m.exitFullscreen
                          : m.enterFullscreen}
                        class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                        onMouseDown={(e: Event) => e.stopPropagation()}
                        onClick={(e: Event) => {
                          e.stopPropagation();
                          fullscreen.value = !fullscreen.value;
                        }}
                      >
                        {isFullscreen
                          ? <IconExitFullscreen class="w-5 h-5" />
                          : <IconMaximize2 class="w-5 h-5" />}
                      </button>
                    )}
                    {closable && (
                      <button
                        type="button"
                        aria-label={m.close}
                        class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                        onMouseDown={(e: Event) => e.stopPropagation()}
                        onClick={() => onClose?.()}
                      >
                        <IconClose class="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
            : showHeaderActions
            ? (
              <div class="absolute top-4 right-4 z-10 flex items-center gap-1">
                {fullscreenable && (
                  <button
                    type="button"
                    aria-label={isFullscreen
                      ? m.exitFullscreen
                      : m.enterFullscreen}
                    class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    onMouseDown={(e: Event) => e.stopPropagation()}
                    onClick={(e: Event) => {
                      e.stopPropagation();
                      fullscreen.value = !fullscreen.value;
                    }}
                  >
                    {isFullscreen
                      ? <IconExitFullscreen class="w-5 h-5" />
                      : <IconMaximize2 class="w-5 h-5" />}
                  </button>
                )}
                {closable && (
                  <button
                    type="button"
                    aria-label={m.close}
                    class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    onMouseDown={(e: Event) => e.stopPropagation()}
                    onClick={() => onClose?.()}
                  >
                    <IconClose class="w-5 h-5" />
                  </button>
                )}
              </div>
            )
            : null}
          <div
            class={twMerge(
              "flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-6 py-4 min-h-0 [&>*]:box-border [&>*]:max-w-full [&>*]:min-w-0",
              !(title != null && title !== "") && showHeaderActions &&
                "pt-12 pr-12",
              bodyClass,
            )}
          >
            {() => resolvedChildren()}
          </div>
          {() => {
            const footer = resolvedFooter();
            if (footer == null) return null;
            return (
              <div
                class={twMerge(
                  "shrink-0 flex min-w-0 flex-wrap items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-600",
                  !isFullscreen && "rounded-b-xl",
                  footerClass,
                )}
              >
                {footer}
              </div>
            );
          }}
        </div>
      </div>
    );
  };

  /**
   * **必须**每实例注册一次、且**无条件**注册：`open` 从 false→true 时父级未必重跑 `Modal()`，
   * 若首帧因 `!isOpen` 跳过本 effect，则永远无法挂 Portal。
   * 在内层读 {@link isOpen}（及 `destroyOnClose`）再决定挂载/卸载与 `body` overflow。
   */
  createRenderEffect(() => {
    const openNow = isOpen();
    const showShell = openNow || !destroyOnClose;
    if (!showShell) {
      trySetDocumentBodyOverflow("");
      return;
    }
    const portalHost = getBrowserBodyPortalHost();
    if (openNow && portalHost != null) {
      trySetDocumentBodyOverflow("hidden");
      const root = createPortal(() => buildModalMarkup(), portalHost);
      onCleanup(() => {
        root.unmount();
        trySetDocumentBodyOverflow("");
      });
      return;
    }
    if (!openNow) {
      trySetDocumentBodyOverflow("");
    }
  });

  /**
   * 同步返回值：有真实 `document.body` 时用隐藏占位，真实弹层仅由上方 `createRenderEffect` + Portal 挂到 `body`。
   * `destroyOnClose` 且关闭时不占槽位；无 `body`（纯 SSR 字符串）时退回内联快照。
   */
  const hostSync = getBrowserBodyPortalHost();
  if (hostSync != null) {
    if (destroyOnClose && !readControlledOpenInput(props.open)) {
      return null;
    }
    return (
      <span
        style="display:none;width:0;height:0;overflow:hidden;position:absolute;clip:rect(0,0,0,0)"
        aria-hidden="true"
        data-dreamer-modal-portal-anchor=""
      />
    );
  }
  if (!readControlledOpenInput(props.open)) {
    return null;
  }
  trySetDocumentBodyOverflow("hidden");
  return buildModalMarkup();
}
