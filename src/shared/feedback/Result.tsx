/**
 * Result 结果页（View）。
 * 成功/失败/信息/警告/403/404 等结果态；支持标题、副标题、自定义图标、操作区。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconAlertCircle } from "../basic/icons/AlertCircle.tsx";
import { IconCheckCircle } from "../basic/icons/CheckCircle.tsx";
import { IconHelpCircle } from "../basic/icons/HelpCircle.tsx";
import { IconInfo } from "../basic/icons/Info.tsx";
import { IconShieldAlert } from "../basic/icons/ShieldAlert.tsx";
import { IconXCircle } from "../basic/icons/XCircle.tsx";

export type ResultStatus =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "403"
  | "404";

export interface ResultProps {
  /** 结果状态，决定默认图标与配色 */
  status?: ResultStatus;
  /** 主标题 */
  title?: string;
  /** 副标题/描述 */
  subTitle?: string;
  /** 自定义图标（覆盖 status 默认图标） */
  icon?: unknown;
  /** 操作区（如按钮组），渲染在副标题下方 */
  extra?: unknown;
  /** 额外内容（如列表），渲染在 extra 下方 */
  children?: unknown;
  /** 额外 class（作用于最外层） */
  class?: string;
}

const statusIconMap = {
  success: IconCheckCircle,
  error: IconXCircle,
  warning: IconAlertCircle,
  info: IconInfo,
  "403": IconShieldAlert,
  "404": IconHelpCircle,
} as const;

const statusIconClasses: Record<ResultStatus, string> = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
  "403": "text-slate-500 dark:text-slate-400",
  "404": "text-slate-500 dark:text-slate-400",
};

export function Result(props: ResultProps): JSXRenderable {
  const {
    status = "info",
    title,
    subTitle,
    icon: customIcon,
    extra,
    children,
    class: className,
  } = props;

  const IconComponent = statusIconMap[status];
  const iconCls = statusIconClasses[status];

  return (
    <div
      class={twMerge(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      {customIcon != null
        ? (
          <div class="mb-4 text-6xl text-slate-400 dark:text-slate-500">
            {customIcon}
          </div>
        )
        : (
          <span
            class={twMerge(
              "shrink-0 w-16 h-16 mb-4 flex items-center justify-center",
              iconCls,
            )}
          >
            <IconComponent class="w-full h-full" />
          </span>
        )}
      {title != null && title !== "" && (
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h2>
      )}
      {subTitle != null && subTitle !== "" && (
        <p class="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
          {subTitle}
        </p>
      )}
      {extra != null && (
        <div class="flex flex-wrap gap-2 justify-center mb-4">{extra}</div>
      )}
      {children != null && <div class="w-full max-w-md">{children}</div>}
    </div>
  );
}
