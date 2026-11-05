/**
 * Overlay 遮罩层（View）。
 * 从 Modal／Drawer／ActionSheet／BottomSheet 等浮层共用的「全屏半透明遮罩」抽离。
 *
 * - **独立使用**：默认 `portal` 挂到 `document.body`，并可 `lockScroll`。
 * - **嵌在已 Portal 的浮层内**：传 `portal={false}` + `position="absolute"` + `lockScroll={false}`，
 *   作为对话框根节点的绝对定位子层（Modal／Drawer／ActionSheet／BottomSheet 即此模式）。
 */

import {
  createMemo,
  createPortal,
  createRenderEffect,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
} from "./controlled-open.ts";
import { getBrowserBodyPortalHost } from "./portal-host.ts";

export interface OverlayProps {
  /** 是否显示：`Signal` / 零参 getter / 布尔快照；嵌套场景常传 `true`（由父级控制挂载） */
  open?: ControlledOpenInput;
  /** 点击遮罩回调（常用于关闭） */
  onClick?: () => void;
  /** 点击是否触发 `onClick`，默认 true */
  clickable?: boolean;
  /** 关闭后是否销毁节点，默认 false（保持挂载但隐藏） */
  destroyOnClose?: boolean;
  /**
   * 打开时锁定 `document.body` 滚动；嵌在已自行锁滚动的浮层内时应为 `false`。
   * 默认：`portal===false` 时 false，否则 true。
   */
  lockScroll?: boolean;
  /** z-index；`position="absolute"` 且未传时不写 style，避免压过面板 */
  zIndex?: number;
  /** 额外 class（可覆盖默认底色，如 Modal 的 `bg-black/50`） */
  class?: string;
  /** 遮罩上的子内容（少见） */
  children?: unknown;
  /** `aria-label`；`as="button"` 时尤重要 */
  "aria-label"?: string;
  /**
   * 是否 Portal 到 `document.body`。
   * 嵌在 Modal／Drawer／ActionSheet／BottomSheet 根内时必须 `false`。
   * @default true
   */
  portal?: boolean;
  /**
   * 定位：独立浮层用 `fixed`；嵌在 `fixed inset-0` 对话框根内用 `absolute`。
   * @default portal ? "fixed" : "absolute"
   */
  position?: "fixed" | "absolute";
  /**
   * 根节点标签：ActionSheet／BottomSheet 用 `button` 以便 `aria-label`；Modal／Drawer 用 `div`。
   * @default "div"
   */
  as?: "div" | "button";
}

/**
 * 全屏／内联遮罩。
 */
export function Overlay(props: OverlayProps): JSXRenderable {
  const {
    onClick,
    clickable = true,
    destroyOnClose = false,
    zIndex,
    class: className,
    children,
    "aria-label": ariaLabel = "遮罩",
    portal = true,
    as = "div",
  } = props;

  const position = props.position ?? (portal ? "fixed" : "absolute");
  const lockScroll = props.lockScroll ?? portal;

  const isOpen = createMemo(() => readControlledOpenInput(props.open));

  createRenderEffect(() => {
    if (!lockScroll) return;
    if (!isOpen()) return;
    const body = getBrowserBodyPortalHost();
    if (!body) return;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    onCleanup(() => {
      body.style.overflow = prev;
    });
  });

  const handleClick = (e: Event) => {
    if (!clickable) return;
    // 仅点在遮罩自身时关闭（与历史 Modal mask 行为一致）
    if (e.target !== e.currentTarget) return;
    onClick?.();
  };

  const markup = () => {
    if (!isOpen() && destroyOnClose) return null;
    const posCls = position === "absolute" ? "absolute inset-0" : "fixed inset-0";
    const style: Record<string, string> | undefined =
      zIndex != null ? { zIndex: String(zIndex) } : undefined;
    const cls = twMerge(
      posCls,
      "bg-slate-900/35 transition-opacity motion-reduce:transition-none",
      as === "button" && "border-0 cursor-default p-0 appearance-none",
      !isOpen() && "pointer-events-none opacity-0",
      className,
    );

    if (as === "button") {
      return (
        <button
          type="button"
          class={cls}
          style={style}
          data-dreamer-overlay=""
          aria-label={ariaLabel}
          aria-hidden={!isOpen() ? true : undefined}
          onClick={handleClick}
        >
          {children}
        </button>
      );
    }

    return (
      <div
        class={cls}
        style={style}
        data-dreamer-overlay=""
        aria-hidden={!isOpen() ? true : undefined}
        aria-label={ariaLabel}
        role="presentation"
        onClick={handleClick}
      >
        {children}
      </div>
    );
  };

  if (!portal) {
    return () => markup();
  }

  const host = getBrowserBodyPortalHost();
  if (host) {
    createPortal(() => markup(), host);
    return null;
  }
  return () => markup();
}
