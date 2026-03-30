/**
 * Search 搜索框（View）。
 * 基于 Input type="search"，支持占位、有内容时显示清除按钮、onSearch 时右侧搜索按钮；隐藏浏览器原生 hover 清除图标。
 * 与 {@link Input} 对齐：onBlur / onFocus / onKeyDown / onKeyUp / onClick / onPaste 透传至内部 input；Enter 仍触发 onSearch（可在 onKeyDown 里 preventDefault 取消）。
 */

import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconSearch } from "../basic/icons/Search.tsx";
import type { SizeVariant } from "../types.ts";
import { controlBlueFocusRing } from "./input-focus-ring.ts";

export interface SearchProps {
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否禁用 */
  disabled?: boolean;
  /** 为 true 时隐藏聚焦激活态边框（输入框与侧栏按钮）；默认 false 显示 */
  hideFocusRing?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 输入值（受控可选）；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
  /** 额外 class（作用于包裹容器） */
  class?: string;
  /** 输入回调 */
  onInput?: (e: Event) => void;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 失焦回调；可在此发搜索请求，避免仅在 onInput 里调接口导致请求过频 */
  onBlur?: (e: Event) => void;
  /** 聚焦回调 */
  onFocus?: (e: Event) => void;
  /** 键盘按下（在内置「回车触发 onSearch」逻辑之前调用） */
  onKeyDown?: (e: Event) => void;
  /** 键盘抬起 */
  onKeyUp?: (e: Event) => void;
  /** 点击输入区域 */
  onClick?: (e: Event) => void;
  /** 粘贴 */
  onPaste?: (e: Event) => void;
  /** 搜索回调（回车或点击搜索时） */
  onSearch?: (value: string) => void;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 pl-8 text-xs rounded-md",
  sm: "px-3 py-1.5 pl-9 text-sm rounded-md",
  md: "px-3 py-2 pl-9 text-sm rounded-lg",
  lg: "px-4 py-2.5 pl-10 text-base rounded-lg",
};

/** 输入区底纹（不含 ring，由 {@link controlBlueFocusRing}(`!hideFocusRing`) 控制） */
const inputSurface =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

/** 清除 / 搜索按钮共用底纹（不含 ring） */
const btnSurface =
  "absolute top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none disabled:opacity-50";

/** 清除按钮显隐由 CSS :has(input:not(:placeholder-shown)) 控制，不在组件内读 value()，避免订阅 signal 导致整树重跑、input 失焦。 */
const clearBtnVisibleCls =
  "search-clear-btn hidden [.search-wrapper:has(input:not(:placeholder-shown))_.search-clear-btn]:inline-flex";

export function Search(props: SearchProps) {
  const {
    size = "md",
    disabled = false,
    placeholder = "搜索…",
    value,
    class: className,
    onInput,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    onSearch,
    name,
    id,
    hideFocusRing = false,
  } = props;

  const sizeCls = sizeClasses[size];
  // 禁止在组件体内读 value()：会订阅 signal，导致根 effect 重跑、整树重建、input 被替换失焦。
  // value 透传给 <input value={value} />，由 View applyProps 对 getter 做 createEffect 仅更新 .value。

  const handleClear = () => {
    const synthetic = { target: { value: "" } } as unknown as Event;
    onChange?.(synthetic);
    onInput?.(synthetic);
  };

  return (
    <span
      class={twMerge(
        "search-wrapper relative inline-block w-full max-w-xs",
        className,
      )}
    >
      <span
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        aria-hidden="true"
      >
        <svg
          class="size-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </span>
      <input
        type="search"
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        class={twMerge(
          "w-full",
          inputSurface,
          controlBlueFocusRing(!hideFocusRing),
          sizeCls,
          onSearch ? "pr-20" : "pr-9",
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:[-webkit-appearance:none]",
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyUp={onKeyUp}
        onClick={onClick}
        onPaste={onPaste}
        onKeyDown={(e: Event) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          const ev = e as KeyboardEvent;
          if (ev.key === "Enter" && onSearch && ev.target) {
            onSearch((ev.target as HTMLInputElement).value);
          }
        }}
      />
      <button
        type="button"
        class={twMerge(
          btnSurface,
          controlBlueFocusRing(!hideFocusRing),
          clearBtnVisibleCls,
          onSearch ? "right-10" : "right-2",
        )}
        disabled={disabled}
        aria-label="清除"
        onClick={handleClear}
      >
        <svg
          class="size-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      {onSearch && (
        <button
          type="button"
          class={twMerge(
            btnSurface,
            controlBlueFocusRing(!hideFocusRing),
            "right-2",
          )}
          disabled={disabled}
          aria-label="搜索"
          onClick={(e: Event) => {
            const input = (e.currentTarget as HTMLElement).parentElement
              ?.querySelector("input") as HTMLInputElement | null;
            if (input) onSearch(input.value);
          }}
        >
          <IconSearch size="sm" class="text-blue-600 dark:text-blue-400" />
        </button>
      )}
    </span>
  );
}
