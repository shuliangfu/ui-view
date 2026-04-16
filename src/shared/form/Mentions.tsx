/**
 * Mentions @提及（View）。
 * 对齐 Input：value 可为 getter、主体不读 value()；showDropdown/dropdownOptions 由子组件内读，仅下拉槽位重跑，textarea 不失焦。
 * 下拉打开时支持方向键与 Enter 选择；`onSelectOption` 由父级插入正文（常见为保留 `@` + label）。
 */

import { createEffect, createSignal, type Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";
import { controlBlueFocusRing } from "./input-focus-ring.ts";
import { commitMaybeSignal, type MaybeSignal } from "./maybe-signal.ts";

/** 候选选项 */
export interface MentionOption {
  value: string;
  label: string;
}

export interface MentionsProps {
  /** 当前值（受控可选）；见 {@link MaybeSignal} */
  value?: MaybeSignal<string>;
  /** 占位文案 */
  placeholder?: string;
  /** 行数 */
  rows?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 输入回调（父组件可据此解析 @ 与 selectionStart，决定是否展示候选） */
  onInput?: (e: Event) => void;
  /** 失焦回调 */
  onBlur?: (e: Event) => void;
  /** 聚焦回调 */
  onFocus?: (e: Event) => void;
  /** 键盘按下；下拉打开时组件先处理方向键 / Enter / Escape，再调用本回调 */
  onKeyDown?: (e: Event) => void;
  /** 键盘抬起 */
  onKeyUp?: (e: Event) => void;
  /** 点击文本区 */
  onClick?: (e: Event) => void;
  /** 粘贴 */
  onPaste?: (e: Event) => void;
  /** 是否展示候选下拉；可为 getter，由子组件内读 */
  showDropdown?: boolean | (() => boolean);
  /** 候选列表；可为 getter，由子组件内读 */
  dropdownOptions?: MentionOption[] | (() => MentionOption[]);
  /** 选中某一候选时回调 */
  onSelectOption?: (option: MentionOption) => void;
  /** 额外 class */
  class?: string;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

/** 文本区底纹（不含 ring） */
const textareaSurface =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-2 text-sm rounded-lg resize-y min-h-[80px]";

const dropdownCls =
  "absolute z-10 mt-1 w-full min-w-[160px] max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1";
const dropdownItemBaseCls =
  "px-3 py-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer";
const dropdownItemHoverCls = "hover:bg-slate-100 dark:hover:bg-slate-700";
const dropdownItemActiveCls = "bg-slate-100 dark:bg-slate-700";

/**
 * 解析是否展示下拉及候选列表（与下拉子组件逻辑一致）。
 *
 * @param showDropdown - 布尔或 getter
 * @param dropdownOptions - 数组或 getter
 * @returns 是否打开、选项列表
 */
function resolveMentionsDropdownState(
  showDropdown?: boolean | (() => boolean),
  dropdownOptions?: MentionOption[] | (() => MentionOption[]),
): { open: boolean; options: MentionOption[] } {
  const open = typeof showDropdown === "function"
    ? Boolean(showDropdown())
    : Boolean(showDropdown);
  const options = typeof dropdownOptions === "function"
    ? dropdownOptions()
    : (dropdownOptions ?? []);
  return { open, options };
}

/**
 * 仅此子组件读 showDropdown()/dropdownOptions()，避免 Mentions 主体订阅导致整块重渲染、textarea 失焦。
 * 高亮索引由父级 {@link Signal} 持有，在此读 `.value` 以细粒度更新项样式。
 */
function MentionsDropdown(props: {
  showDropdown?: boolean | (() => boolean);
  dropdownOptions?: MentionOption[] | (() => MentionOption[]);
  onSelectOption?: (option: MentionOption) => void;
  /** 键盘 / 鼠标高亮下标 */
  highlightIdx: Signal<number>;
  /** listbox 根节点稳定 id（aria-controls / activedescendant） */
  listboxId: string;
}) {
  const {
    showDropdown = false,
    dropdownOptions = [],
    onSelectOption,
    highlightIdx,
    listboxId,
  } = props;
  const show = typeof showDropdown === "function"
    ? showDropdown()
    : showDropdown;
  const opts = typeof dropdownOptions === "function"
    ? dropdownOptions()
    : (dropdownOptions ?? []);
  if (!show || opts.length === 0 || !onSelectOption) return null;
  return (
    <div
      id={listboxId}
      class={dropdownCls}
      role="listbox"
      aria-label="提及候选"
    >
      {opts.map((opt, i) => (
        <div
          key={opt.value}
          id={`${listboxId}-opt-${i}`}
          role="option"
          aria-selected={() => highlightIdx.value === i}
          class={() =>
            twMerge(
              dropdownItemBaseCls,
              dropdownItemHoverCls,
              highlightIdx.value === i && dropdownItemActiveCls,
            )}
          onClick={() => onSelectOption(opt)}
          onMouseEnter={() => {
            highlightIdx.value = i;
          }}
          onMouseDown={(e: Event) => e.preventDefault()}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
}

export function Mentions(props: MentionsProps): JSXRenderable {
  const {
    value,
    placeholder = "输入 @ 提及",
    rows = 3,
    disabled = false,
    onChange,
    onInput,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    showDropdown,
    dropdownOptions,
    onSelectOption,
    class: className,
    hideFocusRing = false,
    name,
    id,
  } = props;

  // 禁止在组件体内读 value()、showDropdown()、dropdownOptions()：会订阅 signal，导致根 effect 重跑、整树重建、textarea 被替换失焦。value 透传给 textarea；下拉由子组件读。

  /** 下拉内键盘高亮；勿在下拉子树外读 showDropdown 以免扩大订阅面 */
  const mentionHighlightIdx = createSignal(-1);

  /** 与 textarea `id` 解耦，供 listbox / option 节点与 aria-activedescendant */
  const listboxStableId = `mentions-lb-${
    Math.random().toString(36).slice(2, 11)
  }`;

  /**
   * 下拉关闭、无候选、或候选列表变化时重置高亮（不在本 effect 内读 mentionHighlightIdx，避免与方向键互相触发）。
   */
  createEffect(() => {
    const open = typeof showDropdown === "function"
      ? Boolean(showDropdown())
      : Boolean(showDropdown);
    const opts = typeof dropdownOptions === "function"
      ? dropdownOptions()
      : (dropdownOptions ?? []);
    const optsKey = opts.map((o) => `${o.value}\t${o.label}`).join("\n");
    if (!open || opts.length === 0) {
      mentionHighlightIdx.value = -1;
      return;
    }
    void optsKey;
    mentionHighlightIdx.value = -1;
  });

  /**
   * 高亮变化时将对应 option 滚入 listbox 可视区域。
   */
  createEffect(() => {
    const idx = mentionHighlightIdx.value;
    if (idx < 0) return;
    const open = typeof showDropdown === "function"
      ? Boolean(showDropdown())
      : Boolean(showDropdown);
    if (!open) return;
    queueMicrotask(() => {
      globalThis.document
        ?.getElementById(`${listboxStableId}-opt-${idx}`)
        ?.scrollIntoView({ block: "nearest" });
    });
  });

  /**
   * 受控 `value` 为 Signal 时由组件写回，再调用外部 `onInput`。
   *
   * @param e - 原生 input 事件
   */
  const handleInput = (e: Event) => {
    commitMaybeSignal(value, (e.target as HTMLTextAreaElement).value);
    onInput?.(e);
  };

  /**
   * 受控 `value` 为 Signal 时由组件写回，再调用外部 `onChange`。
   *
   * @param e - 原生 change 事件
   */
  const handleChange = (e: Event) => {
    commitMaybeSignal(value, (e.target as HTMLTextAreaElement).value);
    onChange?.(e);
  };

  /**
   * 下拉打开时在事件回调内读 getter（不扩大组件体订阅）；方向键移动高亮，Enter 选中，Escape 清高亮。
   *
   * @param e - 键盘事件
   */
  const handleKeyDown = (e: Event) => {
    const ke = e as KeyboardEvent;
    const { open, options: opts } = resolveMentionsDropdownState(
      showDropdown,
      dropdownOptions,
    );
    const canKeyboardSelect = open && opts.length > 0 &&
      Boolean(onSelectOption) && !disabled;

    if (canKeyboardSelect) {
      if (ke.key === "ArrowDown") {
        ke.preventDefault();
        const len = opts.length;
        const prev = mentionHighlightIdx.value;
        mentionHighlightIdx.value = prev < 0 ? 0 : Math.min(prev + 1, len - 1);
        return;
      }
      if (ke.key === "ArrowUp") {
        ke.preventDefault();
        const len = opts.length;
        const prev = mentionHighlightIdx.value;
        mentionHighlightIdx.value = prev < 0 ? len - 1 : Math.max(prev - 1, 0);
        return;
      }
      if (ke.key === "Enter" && !ke.shiftKey) {
        const hi = mentionHighlightIdx.value;
        if (hi >= 0 && hi < opts.length) {
          ke.preventDefault();
          onSelectOption!(opts[hi]);
          return;
        }
      }
      if (ke.key === "Escape") {
        mentionHighlightIdx.value = -1;
      }
    }

    onKeyDown?.(e);
  };

  const textareaProps = {
    id,
    name,
    rows,
    value,
    placeholder,
    disabled,
    class: twMerge(textareaSurface, controlBlueFocusRing(!hideFocusRing)),
    "aria-expanded": () => {
      const open = typeof showDropdown === "function"
        ? Boolean(showDropdown())
        : Boolean(showDropdown);
      return open;
    },
    "aria-haspopup": "listbox" as const,
    "aria-controls": () => {
      const open = typeof showDropdown === "function"
        ? Boolean(showDropdown())
        : Boolean(showDropdown);
      return open ? listboxStableId : undefined;
    },
    "aria-autocomplete": "list" as const,
    "aria-activedescendant": () => {
      const open = typeof showDropdown === "function"
        ? Boolean(showDropdown())
        : Boolean(showDropdown);
      if (!open) return undefined;
      const opts = typeof dropdownOptions === "function"
        ? dropdownOptions()
        : (dropdownOptions ?? []);
      const hi = mentionHighlightIdx.value;
      if (hi < 0 || hi >= opts.length) return undefined;
      return `${listboxStableId}-opt-${hi}`;
    },
    onChange: handleChange,
    onInput: handleInput,
    onBlur,
    onFocus,
    onKeyDown: handleKeyDown,
    onKeyUp,
    onClick,
    onPaste,
  };

  return () => (
    <div class={twMerge("relative", className)}>
      <textarea {...textareaProps} />
      <MentionsDropdown
        showDropdown={showDropdown}
        dropdownOptions={dropdownOptions}
        onSelectOption={onSelectOption}
        highlightIdx={mentionHighlightIdx}
        listboxId={listboxStableId}
      />
    </div>
  );
}
