/**
 * Drawer 侧边抽屉（View）。
 *
 * **@dreamer/view 无独立 Drawer 组件**；官方在 {@link https://jsr.io/@dreamer/view 文档} 中建议用 **`createPortal`** 将浮层挂到 `body`（`portal` 模块注释含弹窗/抽屉场景）。
 * 本组件在 **`createPortal` + `createRenderEffect`** 上与 {@link Modal} 对齐，保证 `open={createSignal}` 时子 effect 订阅 `open`，避免 compileSource MountFn 只跑首帧导致「点不开」。
 *
 * 左/右拉出；支持标题（字符串或自定义 TSX）、`titleAlign`、底部、遮罩、Esc、宽度；客户端有真实 `document.body` 时走 Portal，SSR/无 body 时内联快照。
 */

import {
  createMemo,
  createRenderEffect,
  onCleanup,
  type Signal,
} from "@dreamer/view";

function isViewSignal(v: unknown): v is Signal<unknown> {
  if (typeof v !== "function") return false;
  // Signal 为函数形态，与 Record 无直接重叠，经 unknown 再收窄以满足 TS2352
  const f = v as unknown as Record<PropertyKey, unknown>;
  return f.__VIEW_SIGNAL === true &&
    Object.prototype.hasOwnProperty.call(f, "value");
}
import { createPortal } from "@dreamer/view/portal";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconClose } from "../basic/icons/Close.tsx";

export type DrawerPlacement = "left" | "right";

/** 标题栏主文案相对抽屉头的水平对齐；关闭按钮仍贴右，`center` 时与 Modal 同向绝对定位 */
export type DrawerTitleAlign = "left" | "center";

/**
 * 标题：字符串/数字、`null`/`false`/空串不显示标题栏；可传 VNode（TSX）；可传零参 getter 订阅更新。
 */
export type DrawerTitleInput =
  | string
  | number
  | null
  | false
  | unknown
  | (() => DrawerTitleInput | undefined);

/** `open`：布尔快照、`Signal<boolean>`（`createSignal` 返回值）或零参 getter（嵌套 state 用 getter） */
export type DrawerOpenInput = boolean | (() => boolean) | Signal<boolean>;

/** 解析后的标题：无栏 / 纯文本 / 自定义节点 */
type DrawerTitleResolved =
  | { kind: "hidden" }
  | { kind: "text"; text: string }
  | { kind: "custom"; content: unknown };

export interface DrawerProps {
  /** 是否打开（受控）；推荐 `open={createSignal 返回值}` */
  open?: DrawerOpenInput;
  /** 关闭回调 */
  onClose?: () => void;
  /** 从左侧或右侧滑出，默认 "right" */
  placement?: DrawerPlacement;
  /** 抽屉宽度（CSS），默认 "360px" */
  width?: string | number;
  /**
   * 标题；`null`/`false`/空串不显示标题栏；可传 TSX；可传 `() => …` 与 signal 同步。
   */
  title?: DrawerTitleInput;
  /**
   * 标题区对齐：`left` 为两端排布（默认）；`center` 为文案居中、关闭钮绝对贴右（对齐 Modal）。
   */
  titleAlign?: DrawerTitleAlign;
  /** 抽屉内容 */
  children?: unknown;
  /** 底部区域（如按钮组）；传 null 不显示 */
  footer?: unknown;
  /** 是否显示关闭按钮，默认 true */
  closable?: boolean;
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean;
  /** 关闭后是否销毁子节点，默认 false */
  destroyOnClose?: boolean;
  /** 是否支持 Esc 关闭，默认 true */
  keyboard?: boolean;
  /** 额外 class（作用于抽屉面板） */
  class?: string;
}

const defaultWidth = "360px";

/**
 * 解析 `open`；在 {@link createMemo} 内调用以订阅 `Signal` / 零参 getter。
 *
 * @param v - `DrawerProps.open`
 * @returns 当前是否视为打开
 */
function readDrawerOpenInput(v: DrawerOpenInput | undefined): boolean {
  if (v === undefined) return false;
  if (isViewSignal(v)) return !!v.value;
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return false;
    return !!(v as () => boolean)();
  }
  return !!v;
}

/**
 * 将 {@link DrawerProps.title} 规范为是否显示标题栏及内容形态（纯文本或自定义 VNode）。
 * 在 {@link createMemo} 内调用以订阅零参 getter。
 *
 * @param v - 原始 `title` prop
 * @returns 解析结果
 */
function readDrawerTitleInput(
  v: DrawerTitleInput | undefined,
): DrawerTitleResolved {
  if (v === undefined || v === null || v === false) return { kind: "hidden" };
  if (typeof v === "function") {
    /** 仅零参 getter；带参函数勿当作标题，避免误绑事件 */
    if ((v as () => unknown).length !== 0) return { kind: "hidden" };
    return readDrawerTitleInput((v as () => DrawerTitleInput | undefined)());
  }
  if (typeof v === "boolean") return { kind: "hidden" };
  if (typeof v === "string") {
    return v === "" ? { kind: "hidden" } : { kind: "text", text: v };
  }
  if (typeof v === "number" && !Number.isNaN(v)) {
    return { kind: "text", text: String(v) };
  }
  return { kind: "custom", content: v };
}

/**
 * 仅当存在真实 `document.body` 时设置 `overflow`，与 Modal 同向。
 *
 * @param overflow - 写入 `body.style.overflow` 的值
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
 * 是否可将 Portal 挂到页面 `body`（SSR 字符串渲染时常无 `body`）。
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

export function Drawer(props: DrawerProps) {
  const {
    onClose,
    placement = "right",
    width = defaultWidth,
    children,
    footer = null,
    closable = true,
    maskClosable = true,
    destroyOnClose = false,
    keyboard = true,
    titleAlign = "left",
    class: className,
  } = props;

  /**
   * 须无条件调用：`createRenderEffect` 内读 {@link isOpen}，订阅 `open` 的 `Signal`。
   */
  const isOpen = createMemo(() => readDrawerOpenInput(props.open));

  /**
   * 订阅 `title` 的零参 getter，并与纯字符串 / 自定义 TSX 同步刷新标题栏。
   */
  const resolvedTitle = createMemo(() => readDrawerTitleInput(props.title));

  /** 面板 `width` CSS 值（数字则补 `px`） */
  const widthStyle = typeof width === "number" ? `${width}px` : String(width);
  /**
   * compileSource 下 `style={\`width:…\`}` 会误生成 `Object.assign(el.style, string)`，
   * 浏览器抛「Indexed property setter is not supported」；须用驼峰对象，与 `Modal` 组件（`desktop/feedback/Modal.tsx`）一致。
   */
  const drawerPanelStyle: Record<string, string> = {
    width: widthStyle,
    maxWidth: "100vw",
  };
  const isLeft = placement === "left";

  /**
   * ref：首挂时做滑入动画；Portal 每次卸载会建新节点，可重复触发。
   */
  const setDrawerRef = (el: unknown) => {
    if (el == null || typeof el !== "object") return;
    const st = (el as HTMLElement).style;
    if (st == null) return;
    const elWithFlag = el as HTMLElement & { _drawerAnimated?: boolean };
    if (elWithFlag._drawerAnimated) return;
    elWithFlag._drawerAnimated = true;
    st.transition = "transform 0.2s ease-out";
    st.transform = isLeft ? "translateX(-100%)" : "translateX(100%)";
    const raf = (globalThis as unknown as {
      requestAnimationFrame?: (cb: () => void) => number;
    }).requestAnimationFrame;
    if (raf) {
      raf(() => {
        st.transform = "translateX(0)";
      });
    } else st.transform = "translateX(0)";
  };

  /**
   * 抽屉 DOM：由 `createPortal(() => …)` 的 getter 重跑时与依赖同步。
   * `z-300`：与 Modal 等同档，保证浮层在文档流之上。
   */
  const buildDrawerMarkup = () => {
    const handleMaskClick = (e: Event) => {
      if (e.target === e.currentTarget && maskClosable) onClose?.();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (keyboard && e.key === "Escape") onClose?.();
    };

    const t = resolvedTitle();
    const showTitleBar = t.kind !== "hidden";

    return (
      <div
        class="fixed inset-0 z-300 flex"
        role="dialog"
        aria-modal="true"
        aria-labelledby={showTitleBar ? "drawer-title" : undefined}
        tabindex={-1}
        onKeyDown={(e: Event) => handleKeyDown(e as KeyboardEvent)}
      >
        <div
          class={twMerge(
            "absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm transition-opacity",
          )}
          onClick={(e: Event) => handleMaskClick(e)}
          aria-hidden
        />
        <div
          ref={setDrawerRef}
          class={twMerge(
            "relative z-10 flex flex-col h-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xl",
            isLeft ? "ml-0" : "ml-auto",
            className,
          )}
          style={drawerPanelStyle}
          onClick={(e: Event) => e.stopPropagation()}
        >
          {showTitleBar && (
            <div
              class={twMerge(
                "shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-600",
                titleAlign === "center"
                  ? "relative flex min-h-14 items-center justify-center"
                  : "flex items-center justify-between gap-2",
              )}
            >
              {t.kind === "text"
                ? (
                  <h2
                    id="drawer-title"
                    class={twMerge(
                      "text-lg font-semibold min-w-0 truncate box-border",
                      titleAlign === "center"
                        ? closable
                          ? "w-full text-center px-14 sm:px-16"
                          : "w-full text-center px-1"
                        : "flex-1 pr-2 text-left",
                    )}
                  >
                    {t.text}
                  </h2>
                )
                : (
                  <div
                    id="drawer-title"
                    class={twMerge(
                      "min-w-0 box-border",
                      titleAlign === "center"
                        ? closable
                          ? "w-full flex justify-center px-14 sm:px-16"
                          : "w-full flex justify-center px-1"
                        : "flex-1 min-w-0 pr-2 text-left",
                    )}
                  >
                    {t.content}
                  </div>
                )}
              {closable && (
                <button
                  type="button"
                  aria-label="关闭"
                  class={twMerge(
                    "p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0",
                    titleAlign === "center" &&
                      "absolute right-4 top-1/2 -translate-y-1/2",
                  )}
                  onClick={() => onClose?.()}
                >
                  <IconClose class="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          {!showTitleBar && closable && (
            <div class="absolute top-4 right-4 z-10">
              <button
                type="button"
                aria-label="关闭"
                class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                onClick={() => onClose?.()}
              >
                <IconClose class="w-5 h-5" />
              </button>
            </div>
          )}
          <div class="flex-1 overflow-auto min-h-0 px-6 py-4">{children}</div>
          {footer != null && (
            <div class="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * **必须**每实例无条件注册：`open` 从 false→true 时父级未必重跑 `Drawer()`，
   * 若跳过本 effect 则永远无法挂 Portal（与 Modal 一致）。
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
      const root = createPortal(() => buildDrawerMarkup(), portalHost);
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

  const hostSync = getBrowserBodyPortalHost();
  if (hostSync != null) {
    if (destroyOnClose && !readDrawerOpenInput(props.open)) {
      return null;
    }
    return (
      <span
        style="display:none;width:0;height:0;overflow:hidden;position:absolute;clip:rect(0,0,0,0)"
        aria-hidden="true"
        data-dreamer-drawer-portal-anchor=""
      />
    );
  }
  if (!readDrawerOpenInput(props.open)) {
    return null;
  }
  trySetDocumentBodyOverflow("hidden");
  return buildDrawerMarkup();
}
