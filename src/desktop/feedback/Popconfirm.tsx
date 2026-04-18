/**
 * Popconfirm 气泡确认框（View）。
 * 删除等二次确认：点击触发后显示带标题与「确定、取消」按钮；支持危险 / 警告样式（确定钮配色）。
 * 受控：`open` + `onOpenChange`；触发器 `onClick` 里应 `onOpenChange(true)` 或写 `sig.value = true`。
 *
 * **手写 JSX**：`open={sig.value}` 会在创建 VNode 时变成快照；须传 **`open={sig}`** 或零参 getter。
 *
 * **定位**：面板经 {@link Portal} 挂到 `document.body` 且 `position: fixed`，
 * 由 {@link computePopFixedStyle} 按 `placement` 与触发器 `getBoundingClientRect` 对齐，避免被祖先 `overflow` 裁剪。
 * 打开期间用 rAF 循环同步视口位置（与 {@link Popover} 一致）以随滚动/窗口变化贴住触发器。
 *
 * 根层不挂全屏遮罩；点外部由 `document` 上 `click` 冒泡关闭。
 *
 * **返回值**：组件须 **`return () => VNode`**（零参 getter）。若直接 `return <span>…</span>`，
 * 运行时只做一次性 `mountVNodeTree`，`open` 的 Signal 变化不会重挂子树，表现为点击打不开。
 */

import {
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  isSignal,
  type JSXRenderable,
  onCleanup,
  Portal,
  type Signal,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { Button } from "../../shared/basic/Button.tsx";
import {
  computePopFixedStyle,
  type FullPopStylePlacement,
} from "./popFixedStyle.ts";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconHelpCircle } from "../../shared/basic/icons/HelpCircle.tsx";

export type PopconfirmPlacement =
  | "top"
  | "topLeft"
  | "topRight"
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "left"
  | "right";

/** `open`：布尔快照、`Signal<boolean>`（`createSignal` 返回值）或零参 getter（与 Modal `open` 同向） */
export type PopconfirmOpenInput =
  | boolean
  | (() => boolean)
  | Signal<boolean>;

export interface PopconfirmProps {
  /** 是否打开（受控）；推荐 `open={createSignal 返回值}`，勿 `open={sig.value}` */
  open?: PopconfirmOpenInput;
  /** 打开/关闭回调（关闭时传 false） */
  onOpenChange?: (open: boolean) => void;
  /** 确认标题/描述 */
  title: string;
  /** 确定后业务回调；浮层关闭由组件在回调之后统一处理（`requestClose`），不必在回调里写 `open.value = false` */
  onConfirm?: () => void;
  /** 取消后业务回调；浮层关闭由组件统一处理，不必在回调里再关 */
  onCancel?: () => void;
  /** 确定按钮文案，默认 "确定" */
  okText?: string;
  /** 取消按钮文案，默认 "取消" */
  cancelText?: string;
  /** 是否为危险操作（确定按钮红色），默认 false；与 `warning` 同时为 true 时以本项为准 */
  danger?: boolean;
  /**
   * 是否为警告类确认（确定按钮琥珀色），默认 false；与 `danger` 互斥语义上二选一，
   * 二者均为 false 时确定钮为 primary。
   */
  warning?: boolean;
  /** 是否显示问号图标，默认 true */
  showIcon?: boolean;
  /** 气泡位置，默认 "top" */
  placement?: PopconfirmPlacement;
  /**
   * 是否显示指向触发器的小箭头（与 {@link Popover} 同向：旋转方片 + 边框），默认 true。
   */
  arrow?: boolean;
  /** 触发元素（需在 onClick 中打开，如 `onClick={() => (sig.value = true)}`） */
  children?: unknown;
  /** 额外 class（包装器） */
  class?: string;
  /** 面板 class */
  overlayClass?: string;
}

/** 标记气泡面板根节点，供文档 `click` 与 `composedPath` 判断是否点在面板内 */
const POPCONFIRM_PANEL_ATTR = "data-dreamer-popconfirm-panel";

/**
 * 根据 `placement` 生成指向触发器一侧的箭头 class（与 {@link Popover} 的 `arrowClass` 同算法）。
 *
 * @param placement - 气泡方位
 * @returns 箭头根节点的 Tailwind 类名字符串
 */
function popconfirmArrowClass(placement: PopconfirmPlacement): string {
  const base =
    "absolute z-[1] w-2 h-2 rotate-45 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 pointer-events-none";
  if (placement.startsWith("top")) {
    return `${base} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-t-0 border-l-0`;
  }
  if (placement.startsWith("bottom")) {
    return `${base} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-b-0 border-r-0`;
  }
  if (placement.startsWith("left")) {
    return `${base} right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-b-0 border-l-0`;
  }
  if (placement.startsWith("right")) {
    return `${base} left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-t-0 border-r-0`;
  }
  return base;
}

/**
 * 解析受控 `open`；在 {@link createMemo} 内调用以订阅 `Signal` / 零参 getter。
 *
 * @param v - 受控打开状态
 * @returns 是否视为打开
 */
function readPopconfirmOpenInput(v: PopconfirmOpenInput | undefined): boolean {
  if (v === undefined) return false;
  if (isSignal(v)) return !!(v as Signal<boolean>).value;
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return false;
    return !!(v as () => boolean)();
  }
  return !!v;
}

/**
 * 构建 Popconfirm 根结构：`relative` 包裹触发器，打开时经 Portal 在 body 上 `fixed` 画板。
 *
 * @param props - 组件 props
 * @param openNow - 当前是否展开面板
 * @param getPortalStyle - 返回挂到 `document.body` 的 `fixed` 外层上 `style` 对象（`computePopFixedStyle` 结果）
 * @param okVariant - 确定按钮变体
 * @param iconToneCls - 图标颜色类
 * @param handleConfirm - 确定处理
 * @param handleCancel - 取消处理
 * @param setTriggerRef - 触发器容器 ref
 * @param setFloatingRef - 面板根节点 ref（供点外部关闭判断）
 */
function buildPopconfirmTree(
  props: PopconfirmProps,
  openNow: boolean,
  getPortalStyle: () => Record<string, string>,
  okVariant: "primary" | "danger" | "warning",
  iconToneCls: string,
  handleConfirm: () => void,
  handleCancel: () => void,
  setTriggerRef: (el: unknown) => void,
  setFloatingRef: (el: unknown) => void,
) {
  const {
    title,
    okText = "确定",
    cancelText = "取消",
    showIcon = true,
    placement = "top",
    arrow = true,
    children,
    class: className,
    overlayClass,
  } = props;

  const arrowCls = arrow ? popconfirmArrowClass(placement) : "";

  return (
    <span
      ref={setTriggerRef}
      class={twMerge("relative inline-flex", className)}
    >
      {children}
      {openNow && typeof globalThis.document !== "undefined" && (
        <Portal mount={globalThis.document.body}>
          <div
            class="fixed z-[1065] overflow-visible pointer-events-auto"
            style={() =>
              getPortalStyle()}
          >
            <span
              ref={setFloatingRef}
              data-dreamer-popconfirm-panel=""
              class={twMerge(
                "relative z-0 block min-w-[200px] max-w-[min(24rem,calc(100vw-1rem))] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg text-slate-900 dark:text-slate-100 p-3 box-border",
                overlayClass,
              )}
            >
              <div class="flex gap-2">
                {showIcon && (
                  <span class={twMerge("shrink-0 mt-0.5", iconToneCls)}>
                    <IconHelpCircle class="w-4 h-4" />
                  </span>
                )}
                <div class="flex-1">
                  <div class="text-sm mb-3">{title}</div>
                  <div class="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant={okVariant}
                      size="sm"
                      onClick={(_e: Event) => handleConfirm()}
                    >
                      {okText}
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={(_e: Event) => handleCancel()}
                    >
                      {cancelText}
                    </Button>
                  </div>
                </div>
              </div>
              {arrow && <span class={arrowCls} aria-hidden="true" />}
            </span>
          </div>
        </Portal>
      )}
    </span>
  );
}

/**
 * 气泡确认：受控打开；浮层在 Portal 中 `fixed` 定位并 rAF 同步触发器视口位置。
 *
 * @param props - {@link PopconfirmProps}
 */
export function Popconfirm(props: PopconfirmProps): JSXRenderable {
  const { onOpenChange, onConfirm, onCancel, danger = false, warning = false } =
    props;

  /** 订阅 `open` 的 Signal / getter */
  const isOpen = createMemo(() => readPopconfirmOpenInput(props.open));

  let triggerEl: HTMLElement | null = null;
  let floatingEl: HTMLElement | null = null;

  /**
   * 关闭浮层：若 `open` 为 **`Signal<boolean>`**（`createSignal` 返回值）则写回 `false`（仅传 `open={sig}` 未配 `onOpenChange` 时也能关），
   * 再调用 `onOpenChange(false)`。
   */
  const requestClose = () => {
    const o = props.open;
    if (isSignal(o)) (o as Signal<boolean>).value = false;
    onOpenChange?.(false);
  };

  /** 确定：先业务回调再统一关闭 */
  const handleConfirm = () => {
    onConfirm?.();
    requestClose();
  };

  /** 取消：先业务回调再统一关闭 */
  const handleCancel = () => {
    onCancel?.();
    requestClose();
  };

  const okVariant = danger ? "danger" : warning ? "warning" : "primary";
  const iconToneCls = danger
    ? "text-red-500 dark:text-red-400"
    : warning
    ? "text-amber-500 dark:text-amber-400"
    : "text-slate-400 dark:text-slate-500";

  /** 与 {@link computePopFixedStyle} 同源的挂 body 的 `style` 对象，打开时 rAF 更新以贴住触发器 */
  const portalFixedStyle = createSignal<Record<string, string>>({});

  /**
   * 与 Popover 一致：仅打开时 rAF 循环 + resize/VisualViewport 补一帧，避免全页/容器内滚动时浮层脱节。
   */
  createEffect(() => {
    if (!isOpen() || typeof globalThis.window === "undefined") {
      portalFixedStyle.value = {};
      return;
    }
    void (props.placement);
    const run = () => {
      if (!triggerEl) return;
      const tr = triggerEl.getBoundingClientRect();
      const p = (props.placement ?? "top") as FullPopStylePlacement;
      portalFixedStyle.value = computePopFixedStyle(tr, p);
    };
    run();
    let rafLoop = 0;
    let running = true;
    const keepAligned = () => {
      if (!running) return;
      run();
      rafLoop = globalThis.requestAnimationFrame(keepAligned);
    };
    rafLoop = globalThis.requestAnimationFrame(keepAligned);
    const onResize = () => run();
    globalThis.window.addEventListener("resize", onResize);
    const vv = globalThis.visualViewport;
    if (vv) {
      vv.addEventListener("resize", onResize);
    }
    return () => {
      running = false;
      globalThis.cancelAnimationFrame(rafLoop);
      globalThis.window.removeEventListener("resize", onResize);
      if (vv) {
        vv.removeEventListener("resize", onResize);
      }
    };
  });

  /**
   * 记录触发器包裹元素，供 document `click` 判断是否点在触发区域内。
   *
   * @param el - ref 回调收到的节点
   */
  const setTriggerRef = (el: unknown) => {
    if (el != null && typeof el === "object" && "getBoundingClientRect" in el) {
      triggerEl = el as HTMLElement;
    } else {
      triggerEl = null;
    }
  };

  /**
   * 记录面板根节点，供 document `click` 与 `contains` / `composedPath` 配合判断是否点在外部。
   *
   * @param el - ref 回调收到的节点
   */
  const setFloatingRef = (el: unknown) => {
    if (el != null && typeof el === "object" && "getBoundingClientRect" in el) {
      floatingEl = el as HTMLElement;
    } else {
      floatingEl = null;
    }
  };

  /**
   * 打开期间：文档 `click` **冒泡**阶段判断区外关闭。
   * 须在按钮 `click` 之后执行，故不用 `pointerdown` 捕获；双 rAF 后再监听，避免打开同一次点击误关。
   */
  createRenderEffect(() => {
    if (!isOpen()) return;

    const doc = globalThis.document;
    let armed = false;
    let armRaf0 = 0;
    let armRaf1 = 0;
    armRaf0 = globalThis.requestAnimationFrame(() => {
      armRaf1 = globalThis.requestAnimationFrame(() => {
        armed = true;
      });
    });

    const onDocumentClickBubble = (e: Event) => {
      if (!armed) return;
      const t = e.target;
      if (!(t instanceof globalThis.Node)) return;
      if (triggerEl != null && triggerEl.contains(t)) return;
      const path = typeof e.composedPath === "function"
        ? e.composedPath()
        : [t];
      const inPanel = path.some((n) =>
        n instanceof globalThis.Element &&
        n.hasAttribute(POPCONFIRM_PANEL_ATTR)
      );
      if (inPanel) return;
      if (floatingEl != null && floatingEl.contains(t)) return;
      requestClose();
    };

    doc?.addEventListener("click", onDocumentClickBubble, false);

    onCleanup(() => {
      globalThis.cancelAnimationFrame(armRaf0);
      globalThis.cancelAnimationFrame(armRaf1);
      doc?.removeEventListener("click", onDocumentClickBubble, false);
    });
  });

  /**
   * 零参 getter：`mountVNodeTree` 对手写函数组件在返回值为 `() => unknown` 时走
   * View 对子树 getter 的响应式包裹下，须在 getter 内调用 `isOpen()`，`open` 变化时才会重渲面板。
   */
  return () =>
    buildPopconfirmTree(
      props,
      isOpen(),
      () => portalFixedStyle.value,
      okVariant,
      iconToneCls,
      handleConfirm,
      handleCancel,
      setTriggerRef,
      setFloatingRef,
    );
}
