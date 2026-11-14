/**
 * FloatingPanel 浮动面板（View）。
 * 底部可拖拽高度面板（多锚点）；Portal 宿主同 BottomSheet。
 */

import {
  createMemo,
  createPortal,
  createRenderEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
  useContext,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { MobilePortalHostContext } from "../MobilePortalHostScope.tsx";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
} from "../../shared/feedback/controlled-open.ts";
import { getBrowserBodyPortalHost } from "../../shared/feedback/portal-host.ts";

export interface FloatingPanelMessages {
  /** 遮罩关闭 aria-label */
  close: string;
}

export const defaultFloatingPanelMessages: FloatingPanelMessages = {
  close: "关闭",
};

export interface FloatingPanelProps {
  open?: ControlledOpenInput;
  onClose?: () => void;
  /** 锚点高度（px），升序；默认 [120, 320, 560] */
  anchors?: number[];
  /** 当前锚点下标 */
  anchorIndex?: number;
  onAnchorChange?: (index: number) => void;
  children?: unknown;
  class?: string;
  /** 显示拖拽条，默认 true */
  showHandle?: boolean;
  maskClosable?: boolean;
  messages?: Partial<FloatingPanelMessages>;
}

export function FloatingPanel(props: FloatingPanelProps): JSXRenderable {
  const {
    onClose,
    anchors = [120, 320, 560],
    anchorIndex: anchorIndexProp,
    onAnchorChange,
    children,
    class: className,
    showHandle = true,
    maskClosable = true,
  } = props;
  const m: FloatingPanelMessages = {
    ...defaultFloatingPanelMessages,
    ...(props.messages ?? {}),
  };

  const isOpen = createMemo(() => readControlledOpenInput(props.open));
  const idx = createSignal(anchorIndexProp ?? Math.min(1, anchors.length - 1));
  const dragH = createSignal<number | null>(null);
  /** 机内 Portal：Context 为 `{ getHost }`，勿当成 HTMLElement */
  const portalHostScope = useContext(MobilePortalHostContext);
  const getScopedHost = portalHostScope?.getHost;

  createRenderEffect(() => {
    if (anchorIndexProp != null) idx.value = anchorIndexProp;
  });

  createRenderEffect(() => {
    if (!isOpen()) return;
    // 机内 Scope 时不锁整页 body
    if (portalHostScope != null) return;
    const body = getBrowserBodyPortalHost();
    if (!body) return;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    onCleanup(() => {
      body.style.overflow = prev;
    });
  });

  const heightNow = () =>
    dragH.value ?? anchors[idx.value] ?? anchors[0] ?? 320;

  const onHandleDown = (e: PointerEvent) => {
    const startY = e.clientY;
    const startH = heightNow();
    const onMove = (ev: PointerEvent) => {
      const next = Math.max(anchors[0] ?? 80, startH - (ev.clientY - startY));
      dragH.value = next;
    };
    const onUp = () => {
      const h = dragH.value ?? startH;
      dragH.value = null;
      let best = 0;
      let bestDist = Infinity;
      anchors.forEach((a, i) => {
        const d = Math.abs(a - h);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      idx.value = best;
      onAnchorChange?.(best);
      globalThis.removeEventListener?.("pointermove", onMove);
      globalThis.removeEventListener?.("pointerup", onUp);
    };
    globalThis.addEventListener?.("pointermove", onMove);
    globalThis.addEventListener?.("pointerup", onUp);
  };

  const markup = () => {
    if (!isOpen()) return null;
    return (
      <div
        class="fixed inset-0 z-300 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="absolute inset-0 bg-slate-900/35"
          aria-label={m.close}
          onClick={() => {
            if (maskClosable) onClose?.();
          }}
        />
        <div
          class={twMerge(
            "relative z-10 flex flex-col rounded-t-2xl bg-white dark:bg-slate-900 shadow-xl",
            className,
          )}
          style={{ height: `${heightNow()}px` }}
        >
          {showHandle && (
            <div
              class="flex justify-center py-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e: Event) => onHandleDown(e as PointerEvent)}
            >
              <div class="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
          )}
          <div class="min-h-0 flex-1 overflow-auto px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      </div>
    );
  };

  createRenderEffect(() => {
    let host: HTMLElement | null | undefined;
    if (getScopedHost != null) {
      host = getScopedHost();
      if (host == null) return;
    } else {
      host = getBrowserBodyPortalHost();
    }
    if (host == null) return;
    const root = createPortal(() => markup(), host);
    onCleanup(() => {
      root.unmount();
    });
  });

  return (
    <span
      style="display:none;width:0;height:0;overflow:hidden;position:absolute;clip:rect(0,0,0,0)"
      aria-hidden="true"
      data-dreamer-floating-panel-portal-anchor=""
    />
  );
}
