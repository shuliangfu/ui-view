/**
 * Dropdown 下拉菜单（View）。
 * 桌面点击/悬停展开；触发元素 + 下拉内容，支持 placement、trigger(click/hover)、
 * 非受控 defaultOpen、Esc 关闭（需 initDropdownEsc）、hover 延迟防抖。
 */

import { twMerge } from "tailwind-merge";

export type DropdownPlacement =
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "top"
  | "topLeft"
  | "topRight";

export interface DropdownProps {
  /** 触发元素（子节点） */
  children?: unknown;
  /** 下拉内容（菜单或自定义节点） */
  overlay: unknown;
  /** 是否打开（受控）；不传时使用 defaultOpen 作为初始值，需配合 onOpenChange 由父级更新 */
  open?: boolean;
  /** 非受控时的初始是否打开，默认 false */
  defaultOpen?: boolean;
  /** 打开/关闭回调（受控/非受控均由父级更新 open 以触发重绘） */
  onOpenChange?: (open: boolean) => void;
  /** 触发方式：click 或 hover，默认 "click" */
  trigger?: "click" | "hover";
  /** hover 时展开延迟（ms），默认 150 */
  hoverOpenDelay?: number;
  /** hover 时收起延迟（ms），默认 100 */
  hoverCloseDelay?: number;
  /** 下拉位置，默认 "bottomLeft" */
  placement?: DropdownPlacement;
  /** 是否禁用，默认 false */
  disabled?: boolean;
  /** 额外 class（包装器） */
  class?: string;
  /** 下拉层 class */
  overlayClass?: string;
  /** 下拉层 id（无障碍：aria-describedby 等，可选） */
  overlayId?: string;
}

/** 用于 Esc 关闭时注册当前打开的下拉关闭回调（每帧仅一个） */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/** 在客户端调用一次，监听 Esc 关闭当前已打开的下拉（与 open 受控的 Dropdown 配合） */
export function initDropdownEsc() {
  if (typeof globalThis.document === "undefined") return;
  const g = globalThis as unknown as Record<string, (() => void) | undefined>;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    const close = g[DROPDOWN_ESC_KEY];
    if (close) {
      close();
      delete g[DROPDOWN_ESC_KEY];
    }
  };
  globalThis.document.addEventListener("keydown", onKeyDown);
  return () => globalThis.document.removeEventListener("keydown", onKeyDown);
}

const placementClasses: Record<DropdownPlacement, string> = {
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
  bottomLeft: "top-full left-0 mt-1",
  bottomRight: "top-full right-0 mt-1",
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
  topLeft: "bottom-full left-0 mb-1",
  topRight: "bottom-full right-0 mb-1",
};

/** hover 时用的定时器（闭包共享，避免闪动） */
const hoverTimers: { open: number; close: number } = { open: 0, close: 0 };

export function Dropdown(props: DropdownProps) {
  const {
    children,
    overlay,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    trigger = "click",
    hoverOpenDelay = 150,
    hoverCloseDelay = 100,
    placement = "bottomLeft",
    disabled = false,
    class: className,
    overlayClass,
    overlayId,
  } = props;

  const open = controlledOpen ?? defaultOpen;
  const isHover = trigger === "hover";
  const posCls = placementClasses[placement];

  const handleTriggerClick = (e: Event) => {
    e.preventDefault();
    if (disabled) return;
    if (!isHover) onOpenChange?.(!open);
  };

  const handleTriggerEnter = () => {
    if (disabled) return;
    if (!isHover) return;
    if (hoverTimers.close) {
      clearTimeout(hoverTimers.close);
      hoverTimers.close = 0;
    }
    hoverTimers.open = setTimeout(() => onOpenChange?.(true), hoverOpenDelay);
  };

  const handleTriggerLeave = () => {
    if (!isHover) return;
    if (hoverTimers.open) {
      clearTimeout(hoverTimers.open);
      hoverTimers.open = 0;
    }
    hoverTimers.close = setTimeout(
      () => onOpenChange?.(false),
      hoverCloseDelay,
    );
  };

  const handleOverlayEnter = () => {
    if (hoverTimers.close) {
      clearTimeout(hoverTimers.close);
      hoverTimers.close = 0;
    }
  };

  const handleOverlayLeave = () => {
    if (isHover) {
      hoverTimers.close = setTimeout(
        () => onOpenChange?.(false),
        hoverCloseDelay,
      );
    }
  };

  if (open && typeof globalThis !== "undefined") {
    const g = globalThis as unknown as Record<string, (() => void) | undefined>;
    g[DROPDOWN_ESC_KEY] = () => onOpenChange?.(false);
  }

  return () => (
    <span
      class={twMerge("relative inline-flex", className)}
      onMouseEnter={isHover
        ? (handleTriggerEnter as (e: Event) => void)
        : undefined}
      onMouseLeave={isHover
        ? (handleTriggerLeave as (e: Event) => void)
        : undefined}
    >
      <span
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="true"
        aria-expanded={open}
        aria-disabled={disabled}
        onClick={!isHover
          ? (handleTriggerClick as (e: Event) => void)
          : undefined}
        onKeyDown={!isHover && !disabled
          ? ((e: Event) => {
            const k = (e as KeyboardEvent).key;
            if (k === "Enter" || k === " ") {
              e.preventDefault();
              onOpenChange?.(!open);
            }
          }) as (e: Event) => void
          : undefined}
        class={disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}
      >
        {children}
      </span>
      {open && (
        <>
          {!isHover && (
            <div
              class="fixed inset-0 z-40"
              aria-hidden
              onClick={() => onOpenChange?.(false)}
            />
          )}
          <div
            id={overlayId}
            role="menu"
            class={twMerge(
              "absolute z-50 min-w-[120px] py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg",
              posCls,
              overlayClass,
            )}
            onMouseEnter={isHover
              ? (handleOverlayEnter as (e: Event) => void)
              : undefined}
            onMouseLeave={isHover
              ? (handleOverlayLeave as (e: Event) => void)
              : undefined}
          >
            {overlay}
          </div>
        </>
      )}
    </span>
  );
}
