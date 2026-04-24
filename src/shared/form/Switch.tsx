/**
 * Switch 开关（View）。
 * 支持 disabled、checked，light/dark 主题；`sr-only` 原生 checkbox + 定制轨道/滑块。
 * `checked` 为 `createSignal` 返回值时，变更会先写入 Signal，可不写 `onChange` 仅做同步。
 *
 * **注意**：`quant` 的 Tailwind 对 `@dreamer/ui-view` 使用按需 `@source`（见
 * `uiViewTailwindPlugin` / `ui-view-sources.css`）。**必须**把本文件纳入扫描，
 * 否则 `sr-only`、`absolute` 等类未进产线 CSS 时，会出现原生方框+碎块/异常大的滑块等样式崩坏。
 */

import { createSignal, isSignal, type Signal } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { commitMaybeSignal, readMaybeSignal } from "./maybe-signal.ts";
import type { MaybeSignal } from "./maybe-signal.ts";

export interface SwitchProps {
  /**
   * 是否开启；见 {@link MaybeSignal}（内部透传至原生 `input`，由 View 对 `checked` 做细粒度绑定）。
   */
  checked?: MaybeSignal<boolean>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外 class（作用于 label） */
  class?: string;
  /**
   * 变更回调。`checked` 为 Signal 时组件会先自动写入；仍可传以做其它副作用。
   */
  onChange?: (e: Event) => void;
  /** 失焦回调 */
  onBlur?: (e: Event) => void;
  /** 聚焦回调 */
  onFocus?: (e: Event) => void;
  /** 键盘按下 */
  onKeyDown?: (e: Event) => void;
  /** 键盘抬起 */
  onKeyUp?: (e: Event) => void;
  /** 点击控件 */
  onClick?: (e: Event) => void;
  /** 粘贴 */
  onPaste?: (e: Event) => void;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
  /** 开启时文案（可选） */
  checkedChildren?: unknown;
  /** 关闭时文案（可选） */
  unCheckedChildren?: unknown;
  /** 错误状态（红框/红字） */
  error?: boolean;
  /** 为 true 时隐藏轨道在 peer 聚焦时的蓝色 ring；默认 false 显示 */
  hideFocusRing?: boolean;
}

/**
 * 开/关视觉状态：由 Signal/非受控本地 Signal/字面量/ getter 解包，供轨道色与 `translate` 复用。
 * 滑块**放在轨道容器内** `absolute`，避免在宽 `label`（如带「开/关」文）中相对外框错位。
 */
function getSwitchOn(
  checkedMaybe: MaybeSignal<boolean> | undefined,
  isUncontrolled: boolean,
  local: Signal<boolean> | undefined,
): boolean {
  if (isUncontrolled && local) return local.value;
  if (checkedMaybe !== undefined && isSignal(checkedMaybe)) {
    return (checkedMaybe as Signal<boolean>).value;
  }
  return readMaybeSignal(checkedMaybe) ?? false;
}

export function Switch(props: SwitchProps): JSXRenderable {
  const {
    checked: checkedMaybe,
    disabled = false,
    error = false,
    class: className,
    onChange: onChangeProp,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    name,
    id,
    checkedChildren,
    unCheckedChildren,
    hideFocusRing = false,
  } = props;

  /** 未传 `checked` 时用本地 Signal 模拟受控，以便滑块/轨道与 `input` 同相。 */
  const isUncontrolled = checkedMaybe === undefined;
  const localChecked = isUncontrolled ? createSignal(false) : undefined;

  /**
   * 用户切换时写回 `Signal` / 非受控 `local` / 其它可提交的 `MaybeSignal`。
   *
   * @param e - 原生 `change` 事件
   */
  const handleChange = (e: Event) => {
    const next = (e.target as HTMLInputElement).checked;
    if (checkedMaybe !== undefined && isSignal(checkedMaybe)) {
      (checkedMaybe as Signal<boolean>).value = next;
    } else if (isUncontrolled && localChecked) {
      localChecked.value = next;
    } else {
      commitMaybeSignal(checkedMaybe, next);
    }
    onChangeProp?.(e);
  };

  const checkedForInput: MaybeSignal<boolean> | boolean = isUncontrolled
    ? (localChecked as Signal<boolean>)
    : (checkedMaybe as MaybeSignal<boolean>);

  return (
    <label
      class={twMerge(
        "relative inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        error && "text-red-600 dark:text-red-400",
        className,
      )}
    >
      {
        /*
        `peer` 给后续 `peer-*` 文案/轨道 sibling 用；`sr-only` 务必在 Tailwind 扫描中生成。
      */
      }
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checkedForInput}
        disabled={disabled}
        aria-invalid={error}
        class="peer sr-only"
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onClick={onClick}
        onPaste={onPaste}
      />
      {
        /*
        用函数子节点与 `isOn` 细粒度重绘，避免在缺少 `peer-checked:translate` 的 CSS 时滑块不跟随。
        轨道为固定 `h-6 w-11` 的圆角条，滑块在轨内平移，与文「开/关」不抢占同一 `absolute` 参照物。
      */
      }
      {() => {
        const on = getSwitchOn(
          checkedMaybe,
          isUncontrolled,
          localChecked,
        );
        return (
          <span
            class={twMerge(
              "relative h-6 w-11 shrink-0 overflow-hidden rounded-full border transition-colors",
              "peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-0",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              on
                ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
                : "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-600",
              error && "border-red-500 dark:border-red-500",
              hideFocusRing && "peer-focus:ring-0",
            )}
            aria-hidden="true"
          >
            {
              /*
              使用 top-1/2 + -translate-y-1/2 在轨道内竖直居中；横向用 translate-x-0/5。
              与 ui-preact 对齐：preact 的滑块相对 `label` 用 `left-0.5`（离轨道**外**缘约 2px）；
              本实现滑块在**有 border 的**轨道内，若仍用 `left-0.5` 会相对内缘再进 2px、视觉上偏中。
              改为 `left-px` 相对**内**缘 1px，等效外缘 2px，与 preact 观感一致。
            */
            }
            <span
              class={twMerge(
                "pointer-events-none absolute left-px top-1/2 block h-5 w-5 -translate-y-1/2 rounded-full",
                "bg-white shadow ring-0 dark:bg-slate-200",
                "transition-transform duration-200 will-change-transform",
                on ? "translate-x-5" : "translate-x-0",
              )}
            />
          </span>
        );
      }}
      {unCheckedChildren != null && (
        <span class="peer-checked:hidden">{unCheckedChildren}</span>
      )}
      {checkedChildren != null && (
        <span class="hidden peer-checked:inline">{checkedChildren}</span>
      )}
    </label>
  );
}
