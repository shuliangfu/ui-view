/**
 * ShareSheet 分享面板（View）。
 * 底部宫格分享选项 + 取消；基于遮罩与 Portal（与 ActionSheet 同宿主策略）。
 */

import {
  createMemo,
  createPortal,
  createRenderEffect,
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

export interface ShareSheetOption {
  key: string;
  label: string;
  icon?: unknown;
  onClick?: () => void;
}

export interface ShareSheetProps {
  open?: ControlledOpenInput;
  onClose?: () => void;
  title?: string | null;
  options: ShareSheetOption[];
  cancelText?: string | null;
  maskClosable?: boolean;
  class?: string;
  messages?: Partial<ShareSheetMessages>;
}

export interface ShareSheetMessages {
  cancel: string;
  dialog: string;
  close: string;
}

export const defaultShareSheetMessages: ShareSheetMessages = {
  cancel: "取消",
  dialog: "分享",
  close: "关闭",
};

export function ShareSheet(props: ShareSheetProps): JSXRenderable {
  const {
    onClose,
    title,
    options,
    cancelText,
    maskClosable = true,
    class: className,
  } = props;
  const m = { ...defaultShareSheetMessages, ...(props.messages ?? {}) };
  const cancel = cancelText === undefined ? m.cancel : cancelText;
  const isOpen = createMemo(() => readControlledOpenInput(props.open));
  /** 机内 Portal：Context 为 `{ getHost }`，勿当成 HTMLElement */
  const portalHostScope = useContext(MobilePortalHostContext);
  const getScopedHost = portalHostScope?.getHost;

  createRenderEffect(() => {
    if (!isOpen()) return;
    if (portalHostScope != null) return;
    const body = getBrowserBodyPortalHost();
    if (!body) return;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    onCleanup(() => {
      body.style.overflow = prev;
    });
  });

  const markup = () => {
    if (!isOpen()) return null;
    return (
      <div
        class="fixed inset-0 z-300 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-label={m.dialog}
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
            "relative z-10 rounded-t-2xl bg-white dark:bg-slate-900 p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl",
            className,
          )}
        >
          {title != null && title !== "" && (
            <div class="text-center text-sm text-slate-500 mb-3">{title}</div>
          )}
          <div class="grid grid-cols-4 gap-3">
            {options.map((opt) => (
              <button
                type="button"
                key={opt.key}
                class="flex flex-col items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200"
                onClick={() => {
                  opt.onClick?.();
                  onClose?.();
                }}
              >
                <span class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-lg">
                  {opt.icon ?? opt.label.slice(0, 1)}
                </span>
                <span class="truncate max-w-16">{opt.label}</span>
              </button>
            ))}
          </div>
          {cancel != null && cancel !== "" && (
            <button
              type="button"
              class="mt-4 w-full h-11 rounded-xl bg-slate-100 dark:bg-slate-800 font-medium"
              onClick={() => onClose?.()}
            >
              {cancel}
            </button>
          )}
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
      data-dreamer-share-sheet-portal-anchor=""
    />
  );
}
