/**
 * Alert 静态提示条（View）。
 * 成功/警告/错误/信息等，常驻于页面内；支持标题、描述、可关闭、自定义操作。
 * 根节点默认 `w-full`，在 flex 父级下仍占满一行；若需随内容收缩可传 `class="w-auto"` 等覆盖。
 */

import { twMerge } from "tailwind-merge";
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
   * 本组件不维护「已关闭」状态，父级应在回调中更新 state/signal 并条件渲染以真正隐藏。
   */
  onClose?: () => void;
  /** 是否使用横幅样式（圆角更小、常作整行提示），默认 false */
  banner?: boolean;
  /** 自定义操作区（如「查看详情」链接或按钮），渲染在文案右侧或下方 */
  action?: unknown;
  /** 额外 class */
  class?: string;
  /** 子节点：若传入则作为主内容，message 作为标题（可选） */
  children?: unknown;
}

const typeIconMap = {
  success: IconCheckCircle,
  error: IconXCircle,
  warning: IconAlertCircle,
  info: IconInfo,
} as const;

const typeIconClasses: Record<AlertType, string> = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
};

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

export function Alert(props: AlertProps) {
  const {
    type = "info",
    message,
    description,
    showIcon = true,
    closable = false,
    onClose,
    banner = false,
    action,
    class: className,
    children,
  } = props;

  const IconComponent = typeIconMap[type];
  const iconCls = typeIconClasses[type];
  const borderCls = typeBorderClasses[type];
  /** `w-full`：避免放在 `flex`/`inline-flex` 父级时随文案收缩成窄条 */
  const baseCls =
    "flex w-full max-w-full gap-3 p-4 rounded-lg border border-l-4 transition-colors box-border";
  const bannerCls = banner ? "rounded-none border-l-4" : "";

  return (
    <div
      role="alert"
      class={twMerge(baseCls, borderCls, bannerCls, className)}
    >
      {showIcon && (
        <span class={twMerge("shrink-0 w-5 h-5 mt-0.5", iconCls)}>
          <IconComponent class="w-full h-full" />
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
      {closable && (
        <button
          type="button"
          aria-label="关闭"
          class="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
          onClick={() => onClose?.()}
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
      )}
    </div>
  );
}
