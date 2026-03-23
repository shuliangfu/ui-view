/**
 * DatePicker 日期选择（桌面版）。
 * 自定义实现：触发区 + 日历浮层（Calendar）+ 取消/确定；value 为 YYYY-MM-DD 字符串。
 */

import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { Calendar } from "../../shared/data-display/Calendar.tsx";
import { MONTHS } from "../../shared/data-display/calendar-utils.ts";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronDown } from "../../shared/basic/icons/ChevronDown.tsx";
import { IconChevronLeft } from "../../shared/basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../../shared/basic/icons/ChevronRight.tsx";
import type { SizeVariant } from "../../shared/types.ts";

export interface DatePickerProps {
  /** 当前值，YYYY-MM-DD；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
  min?: string;
  max?: string;
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  class?: string;
  name?: string;
  id?: string;
  /** 占位文案 */
  placeholder?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

/** 触发器基础样式：不含宽度，需全宽时由调用方加 class="w-full" */
const triggerBase =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-between gap-2 text-left";

/** 与 Select 等共用 Esc 关闭 */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/** 将 YYYY-MM-DD 解析为本地 Date，无效则返回 null */
function parseDate(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    isNaN(date.getTime()) || date.getFullYear() !== y ||
    date.getMonth() !== m - 1 || date.getDate() !== d
  ) return null;
  return date;
}

/** 将 Date 格式化为 YYYY-MM-DD */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const pad = (n: number) => (n < 10 ? "0" + n : String(n));
  return `${y}-${pad(m)}-${pad(day)}`;
}

/** 日期归一化到当天 0 时 0 分（用于 min/max 比较） */
function dayStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DatePicker(props: DatePickerProps) {
  const {
    value,
    min,
    max,
    size = "md",
    disabled = false,
    onChange,
    class: className,
    name,
    id,
    placeholder = "请选择日期",
  } = props;

  const sizeCls = sizeClasses[size];
  const resolvedValue = typeof value === "function" ? value() : value;
  const valueDate = parseDate(resolvedValue);

  const openState = createSignal(false);
  /** 面板内当前选中的日期（未确定前） */
  const draft = createSignal<Date | null>(valueDate);
  /** 面板当前展示的月份（用于上一月/下一月） */
  const viewDate = createSignal<Date>(valueDate ?? new Date());

  /** 打开时同步 draft/viewDate 为当前 value */
  const handleOpen = () => {
    if (disabled) return;
    const v = parseDate(resolvedValue);
    draft.value = v;
    viewDate.value = v ?? new Date();
    openState.value = true;
  };

  const handleBackdropClick = () => {
    openState.value = false;
  };

  const minDate = min != null ? parseDate(min) : null;
  const maxDate = max != null ? parseDate(max) : null;
  const disabledDate = (d: Date) => {
    const t = dayStart(d);
    if (minDate != null && t < dayStart(minDate)) return true;
    if (maxDate != null && t > dayStart(maxDate)) return true;
    return false;
  };

  /** 确定：将 draft 格式化为字符串并触发 onChange 后关闭 */
  const handleConfirm = () => {
    const d = draft.value;
    if (d != null) {
      const str = formatDate(d);
      const synthetic = new Event("change", { bubbles: true }) as Event & {
        target: { name?: string; value: string };
      };
      (synthetic as { target: { name?: string; value: string } }).target = {
        name: name ?? undefined,
        value: str,
      };
      onChange?.(synthetic);
    }
    openState.value = false;
  };

  /** 取消：仅关闭 */
  const handleCancel = () => {
    openState.value = false;
  };

  const prevMonth = () => {
    const v = viewDate.value;
    viewDate.value = new Date(v.getFullYear(), v.getMonth() - 1);
  };
  const nextMonth = () => {
    const v = viewDate.value;
    viewDate.value = new Date(v.getFullYear(), v.getMonth() + 1);
  };

  const displayText = resolvedValue ?? placeholder;

  /** 在渲染 getter 内读 viewDate，保证月份切换后 UI 订阅更新 */
  return () => {
    const view = viewDate.value;
    /** 传给 Calendar 的展示月（当月 1 号），选中日单独用 selectedDate */
    const calendarValue = new Date(view.getFullYear(), view.getMonth(), 1);

    return (
      <span class={twMerge("relative inline-block", className)}>
        <input type="hidden" name={name} value={resolvedValue ?? ""} />
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={openState.value}
          aria-label={displayText}
          class={twMerge(triggerBase, sizeCls)}
          onClick={handleOpen}
        >
          <span
            class={resolvedValue
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500"}
          >
            {displayText}
          </span>
          <IconChevronDown
            size="sm"
            class={twMerge(
              "shrink-0 text-slate-400 dark:text-slate-500 transition-transform",
              openState.value && "rotate-180",
            )}
          />
        </button>
        {openState.value && (
          <>
            {typeof globalThis !== "undefined" &&
              (() => {
                const g = globalThis as unknown as Record<
                  string,
                  (() => void) | undefined
                >;
                g[DROPDOWN_ESC_KEY] = () => {
                  openState.value = false;
                };
                return null;
              })()}
            <div
              class="fixed inset-0 z-40"
              aria-hidden
              onClick={handleBackdropClick}
            />
            <div
              role="dialog"
              aria-label="选择日期"
              class="absolute z-50 left-0 top-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg"
            >
              {/* 月份导航 */}
              <div class="flex items-center justify-between gap-2 mb-2">
                <button
                  type="button"
                  aria-label="上一月"
                  class="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={prevMonth}
                >
                  <IconChevronLeft size="sm" />
                </button>
                <span class="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {view.getFullYear()}年 {MONTHS[view.getMonth()]}
                </span>
                <button
                  type="button"
                  aria-label="下一月"
                  class="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={nextMonth}
                >
                  <IconChevronRight size="sm" />
                </button>
              </div>
              <Calendar
                value={calendarValue}
                selectedDate={draft.value ?? undefined}
                onChange={(d) => {
                  draft.value = d;
                }}
                disabledDate={disabledDate}
                fullscreen={false}
                class="border-0 p-0 min-h-0"
              />
              <div class="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={handleCancel}
                >
                  取消
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  onClick={handleConfirm}
                >
                  确定
                </button>
              </div>
            </div>
          </>
        )}
      </span>
    );
  };
}
