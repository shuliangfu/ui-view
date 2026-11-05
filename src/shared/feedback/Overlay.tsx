/**
 * Overlay 遮罩层（View）。
 * 从 Modal／Drawer／ActionSheet 等浮层共用的「全屏半透明遮罩」抽离；支持受控 `open`、点击关闭、Portal、滚动锁定。
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
  /** 是否显示：`Signal` / 零参 getter / 布尔快照 */
  open?: ControlledOpenInput;
  /** 点击遮罩回调（常用于关闭） */
  onClick?: () => void;
  /** 点击是否触发 `onClick`，默认 true */
  clickable?: boolean;
  /** 关闭后是否销毁节点，默认 false（保持挂载但隐藏） */
  destroyOnClose?: boolean;
  /** 打开时锁定 `document.body` 滚动，默认 true */
  lockScroll?: boolean;
  /** z-index，默认 300（与 Modal／ActionSheet 同档） */
  zIndex?: number;
  /** 额外 class */
  class?: string;
  /** 遮罩上的子内容（少见；一般浮层内容另写） */
  children?: unknown;
  /** `aria-label`，默认「遮罩」 */
  "aria-label"?: string;
}

/**
 * 全屏遮罩；有 `document.body` 时 Portal 挂到 body。
 */
export function Overlay(props: OverlayProps): JSXRenderable {
  const {
    onClick,
    clickable = true,
    destroyOnClose = false,
    lockScroll = true,
    zIndex = 300,
    class: className,
    children,
    "aria-label": ariaLabel = "遮罩",
  } = props;

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

  const markup = () => {
    if (!isOpen() && destroyOnClose) return null;
    return (
      <div
        class={twMerge(
          "fixed inset-0 bg-slate-900/35 transition-opacity motion-reduce:transition-none",
          !isOpen() && "pointer-events-none opacity-0",
          className,
        )}
        style={{ zIndex: String(zIndex) }}
        aria-hidden={!isOpen() ? true : undefined}
        aria-label={ariaLabel}
        role="presentation"
        onClick={() => {
          if (clickable) onClick?.();
        }}
      >
        {children}
      </div>
    );
  };

  const host = getBrowserBodyPortalHost();
  if (host) {
    createPortal(() => markup(), host);
    return null;
  }
  return () => markup();
}
