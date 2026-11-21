/**
 * Alert 静态提示条（View）。
 * 成功/警告/错误/信息等，常驻于页面内；支持标题、描述、可关闭、关闭前确认、自定义操作。
 * 根节点默认 `w-full`，在 flex 父级下仍占满一行；若需随内容收缩可传 `class="w-auto"` 等覆盖。
 */

import { twMerge } from "tailwind-merge";
import { createSignal, type JSXRenderable } from "@dreamer/view";
import { Popconfirm } from "../../desktop/feedback/Popconfirm.tsx";
import { isAlertClosed, writeAlertCloseCookie } from "./alert-close-cookie.ts";

export {
  clearAlertCloseCookie,
  isAlertClosed,
  writeAlertCloseCookie,
} from "./alert-close-cookie.ts";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconAlertCircle } from "../basic/icons/AlertCircle.tsx";
import { IconCheckCircle } from "../basic/icons/CheckCircle.tsx";
import { IconInfo } from "../basic/icons/Info.tsx";
import { IconXCircle } from "../basic/icons/XCircle.tsx";
/** Alert 语义类型，与 Toast/Notification 一致 */
export type AlertType = "success" | "info" | "warning" | "error";

export interface AlertProps {
  /** 语义类型，决定图标与边框色 */
  type?: AlertType;
  /** 主文案（必填） */
  message: string;
  /** 补充描述（可选，显示在主文案下方） */
  description?: string;
  /** 是否显示左侧图标，默认 true */
  showIcon?: boolean;
  /** 是否显示关闭按钮，默认 false */
  closable?: boolean;
  /**
   * 关闭回调（closable 时点击关闭触发）。
   * 点击后本组件会自行卸载／隐藏，并调用本回调。
   * 若设置了 {@link closeConfirm}，需在确认后才会隐藏并调用本回调。
   * 若还要用父级 signal 控制「再次显示」等，请把 signal 放在模块作用域（或其它稳定位置），
   * 读值写在 `{() => ...}` 里；勿在会重跑的页面函数里每次 `createSignal(true)`，否则只更新旧实例。
   */
  onClose?: () => void;
  /**
   * 关闭前的确认文案。传入后点击关闭会先弹出气泡，取消则不关闭，
   * 确认后才隐藏并调用 {@link onClose}。
   */
  closeConfirm?: string;
  /**
   * Cookie 名。传入后确认（或直接）关闭会写入该 cookie（值 `1`，有效期一年），
   * 之后刷新或 SSR 都不再显示；调用方不必再自己管显隐。
   */
  closeKey?: string;
  /** 是否使用横幅样式（圆角更小、常作整行提示），默认 false */
  banner?: boolean;
  /** 自定义操作区（如「查看详情」链接或按钮），渲染在文案右侧或下方 */
  action?: unknown;
  /** 额外 class */
  class?: string;
  /** 子节点：若传入则作为主内容，message 作为标题（可选） */
  children?: unknown;
  /** 多语言/自定义文案；未传字段走 {@link defaultAlertMessages} */
  messages?: Partial<AlertMessages>;
}

/** Alert 内置文案 */
export interface AlertMessages {
  /** 关闭按钮 `aria-label` */
  close: string;
}

/** 默认中文文案 */
export const defaultAlertMessages: AlertMessages = {
  close: "关闭",
};

const typeIconMap = {
  success: IconCheckCircle,
  error: IconXCircle,
  warning: IconAlertCircle,
  info: IconInfo,
} as const;

const typeBorderClasses: Record<AlertType, string> = {
  success:
    "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200",
  error:
    "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200",
  warning:
    "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200",
  info:
    "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200",
};

export function Alert(props: AlertProps): JSXRenderable {
  const dismissed = createSignal(false);
  const confirmOpen = createSignal(false);

  const persistAndDismiss = (): void => {
    const key = props.closeKey?.trim();
    if (key) writeAlertCloseCookie(key);
    dismissed.value = true;
    props.onClose?.();
  };

  /**
   * 外层直接返回稳定容器，仅在子节点 `{() => ...}` 里读 `dismissed`。
   * 若整段 `return () =>` 作为组件返回值，会与挂载本组件的 `insert` effect
   * 同层展平：关闭时重建 `createSignal`，提示条又出现（表现为关不掉）。
   */
  return (
    <div class="contents">
      {() => {
        if (dismissed.value) return null;
        const closeKey = props.closeKey?.trim() || undefined;
        if (closeKey && isAlertClosed(closeKey)) return null;

        const type = props.type ?? "info";
        const message = props.message;
        const description = props.description;
        const showIcon = props.showIcon ?? true;
        const closeConfirm = props.closeConfirm?.trim() || undefined;
        const closable = props.closable ?? Boolean(closeConfirm || closeKey);
        const banner = props.banner ?? false;
        const action = props.action;
        const className = props.class;
        const children = props.children;
        /** 合并默认中文文案与外部传入 messages */
        const m: AlertMessages = {
          ...defaultAlertMessages,
          ...(props.messages ?? {}),
        };

        const IconComponent = typeIconMap[type];
        const borderCls = typeBorderClasses[type];
        const hasBody = (description != null && description !== "") ||
          children != null;
        /** `w-full`：避免放在 `flex`/`inline-flex` 父级时随文案收缩成窄条。
         * 单行：图标与文字垂直居中；有描述或子内容时图标与标题对齐。 */
        const baseCls =
          `flex w-full max-w-full gap-3 p-4 rounded-lg border border-l-4 transition-colors box-border ${
            hasBody ? "items-start" : "items-center"
          }`;
        const bannerCls = banner ? "rounded-none border-l-4" : "";
        /**
         * 关闭钮必须是正方形（宽=高），且 self-center，避免在 banner／多行描述的
         * flex 行里被 stretch 拉高。size-6（24px）与原先 p-1 + 16px 图标接近，
         * 不放大单行提示里已经正常的关闭高度。
         */
        const closeBtnCls =
          "self-center inline-flex size-6 shrink-0 items-center justify-center rounded p-0 hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100";
        const closeBtn = closable
          ? (
            <button
              type="button"
              aria-label={m.close}
              class={closeBtnCls}
              onClick={() => {
                if (closeConfirm) {
                  confirmOpen.value = true;
                  return;
                }
                persistAndDismiss();
              }}
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )
          : null;

        return (
          <div
            role="alert"
            class={twMerge(baseCls, borderCls, bannerCls, className)}
          >
            {showIcon && (
              <span class="shrink-0 w-5 h-5">
                <IconComponent class="w-full h-full text-current" />
              </span>
            )}
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm">{message}</div>
              {description != null && description !== "" && (
                <div class="mt-1 text-sm opacity-90">{description}</div>
              )}
              {children != null && <div class="mt-2">{children}</div>}
            </div>
            {action != null && <div class="shrink-0">{action}</div>}
            {closeConfirm && closeBtn
              ? (
                <Popconfirm
                  open={confirmOpen}
                  title={closeConfirm}
                  warning
                  class="self-center shrink-0"
                  onConfirm={persistAndDismiss}
                >
                  {closeBtn}
                </Popconfirm>
              )
              : closeBtn}
          </div>
        );
      }}
    </div>
  );
}
