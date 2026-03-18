/**
 * TimePicker 时间选择（桌面版）。
 * 自定义实现：触发区 + 时分两列选择 + 取消/确定；value 为 HH:mm 或 HH:mm:ss。
 */

import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconChevronDown } from "../../shared/basic/icons/mod.ts";
import type { SizeVariant } from "../../shared/types.ts";

export interface TimePickerProps {
  /** 当前值，HH:mm 或 HH:mm:ss；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
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

const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/** 解析 HH:mm 或 HH:mm:ss，返回 [hour, minute] 或 null */
function parseTime(s: string | undefined): [number, number] | null {
  if (!s) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(s.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return [h, m];
}

/** 格式化为 HH:mm */
function formatTime(hour: number, minute: number): string {
  const pad = (n: number) => (n < 10 ? "0" + n : String(n));
  return `${pad(hour)}:${pad(minute)}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimePicker(props: TimePickerProps) {
  const {
    value,
    size = "md",
    disabled = false,
    onChange,
    class: className,
    name,
    id,
    placeholder = "请选择时间",
  } = props;

  const sizeCls = sizeClasses[size];
  const resolvedValue = typeof value === "function" ? value() : value;
  const parsed = parseTime(resolvedValue);

  const [open, setOpen] = createSignal(false);
  const [draftHour, setDraftHour] = createSignal(parsed?.[0] ?? 0);
  const [draftMinute, setDraftMinute] = createSignal(parsed?.[1] ?? 0);

  const handleOpen = () => {
    if (disabled) return;
    const p = parseTime(resolvedValue);
    if (p) {
      setDraftHour(p[0]);
      setDraftMinute(p[1]);
    } else {
      setDraftHour(0);
      setDraftMinute(0);
    }
    setOpen(true);
  };

  const handleBackdropClick = () => setOpen(false);

  const handleConfirm = () => {
    const str = formatTime(draftHour(), draftMinute());
    const synthetic = new Event("change", { bubbles: true }) as Event & {
      target: { name?: string; value: string };
    };
    (synthetic as { target: { name?: string; value: string } }).target = {
      name: name ?? undefined,
      value: str,
    };
    onChange?.(synthetic);
    setOpen(false);
  };

  const handleCancel = () => setOpen(false);

  const displayText = resolvedValue ?? placeholder;

  const listBase =
    "py-1.5 px-2 text-sm text-center rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700";
  const listSelected =
    "bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600";

  return () => (
    <span class={twMerge("relative inline-block", className)}>
      <input type="hidden" name={name} value={resolvedValue ?? ""} />
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open()}
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
            open() && "rotate-180",
          )}
        />
      </button>
      {open() && (
        <>
          {typeof globalThis !== "undefined" &&
            (() => {
              const g = globalThis as unknown as Record<
                string,
                (() => void) | undefined
              >;
              g[DROPDOWN_ESC_KEY] = () => setOpen(false);
              return null;
            })()}
          <div
            class="fixed inset-0 z-40"
            aria-hidden
            onClick={handleBackdropClick}
          />
          <div
            role="dialog"
            aria-label="选择时间"
            class="absolute z-50 left-0 top-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg flex flex-col gap-2"
          >
            <div class="flex gap-2">
              {/* 时 */}
              <div class="flex flex-col">
                <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600">
                  时
                </div>
                <div class="max-h-48 overflow-y-auto min-w-12">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      class={twMerge(
                        listBase,
                        "w-full",
                        draftHour() === h ? listSelected : "",
                      )}
                      onClick={() => setDraftHour(h)}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
              {/* 分 */}
              <div class="flex flex-col">
                <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600">
                  分
                </div>
                <div class="max-h-48 overflow-y-auto min-w-12">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      class={twMerge(
                        listBase,
                        "w-full",
                        draftMinute() === m ? listSelected : "",
                      )}
                      onClick={() => setDraftMinute(m)}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
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
}
