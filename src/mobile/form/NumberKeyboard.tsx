/**
 * NumberKeyboard 数字键盘（View）。
 * 移动端底部数字键；可与 PasscodeInput／金额输入配合；Portal 宿主同 BottomSheet。
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
import type { SizeVariant } from "../../shared/types.ts";
import { resolveFormControlSize } from "../../shared/form/form-control-context.ts";
import { MobilePortalHostContext } from "../MobilePortalHostScope.tsx";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
} from "../../shared/feedback/controlled-open.ts";
import { getBrowserBodyPortalHost } from "../../shared/feedback/portal-host.ts";

export interface NumberKeyboardProps {
  /** 控件尺寸，与 Input 相同；也可由外层 Form 的 size 注入 */
  size?: SizeVariant;
  open?: ControlledOpenInput;
  onClose?: () => void;
  /** 按下数字／小数点 */
  onInput?: (key: string) => void;
  /** 删除 */
  onDelete?: () => void;
  /** 右下角确认；不传则显示「完成」并 onClose */
  onConfirm?: () => void;
  /** 是否显示小数点，默认 false */
  decimal?: boolean;
  /** 是否显示确认键，默认 true */
  showConfirm?: boolean;
  /** 额外 class */
  class?: string;
  messages?: Partial<NumberKeyboardMessages>;
  /** 点击遮罩关闭，默认 true */
  maskClosable?: boolean;
}

export interface NumberKeyboardMessages {
  confirm: string;
  close: string;
  delete: string;
}

export const defaultNumberKeyboardMessages: NumberKeyboardMessages = {
  confirm: "完成",
  close: "关闭",
  delete: "删除",
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "decimal", "0", "delete"] as const;

export function NumberKeyboard(props: NumberKeyboardProps): JSXRenderable {
  const {
    onClose,
    onInput,
    onDelete,
    onConfirm,
    decimal = false,
    showConfirm = true,
    class: className,
    maskClosable = true,
  } = props;
  const size = resolveFormControlSize(props.size);
  const keySizeCls: Record<SizeVariant, string> = {
    xs: "h-9 text-sm",
    sm: "h-10 text-base",
    md: "h-12 text-lg",
    lg: "h-14 text-xl",
  };
  const confirmSizeCls: Record<SizeVariant, string> = {
    xs: "h-9 text-sm",
    sm: "h-10 text-sm",
    md: "h-11 text-base",
    lg: "h-12 text-lg",
  };
  const m = { ...defaultNumberKeyboardMessages, ...(props.messages ?? {}) };
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

  const emitKey = (k: string) => {
    if (k === "delete") {
      onDelete?.();
      return;
    }
    if (k === "decimal") {
      if (decimal) onInput?.(".");
      return;
    }
    onInput?.(k);
  };

  const markup = () => {
    if (!isOpen()) return null;
    return (
      <div class="fixed inset-0 z-300 flex flex-col justify-end" role="dialog" aria-label="数字键盘">
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
            "relative z-10 rounded-t-2xl bg-slate-100 dark:bg-slate-900 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl",
            className,
          )}
        >
          <div class="grid grid-cols-3 gap-1.5">
            {KEYS.map((k) => {
              if (k === "decimal" && !decimal) {
                return <div key={k} />;
              }
              const label = k === "delete" ? "⌫" : k === "decimal" ? "." : k;
              return (
                <button
                  type="button"
                  key={k}
                  class={twMerge("rounded-lg bg-white dark:bg-slate-800 font-medium active:bg-slate-200 dark:active:bg-slate-700", keySizeCls[size])}
                  aria-label={k === "delete" ? m.delete : label}
                  onClick={() => emitKey(k)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {showConfirm && (
            <button
              type="button"
              class={twMerge("mt-2 w-full rounded-lg bg-blue-600 text-white font-medium active:bg-blue-500", confirmSizeCls[size])}
              onClick={() => {
                onConfirm?.();
                if (!onConfirm) onClose?.();
                else onClose?.();
              }}
            >
              {m.confirm}
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
      data-dreamer-number-keyboard-portal-anchor=""
    />
  );
}
