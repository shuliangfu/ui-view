/**
 * Switch 开关（View）。
 * 支持 disabled、checked，light/dark 主题；`sr-only` 原生 checkbox + 定制轨道/滑块。
 * `checked` 为 `createSignal` 返回值时，变更会先写入 Signal，可不写 `onChange` 仅做同步。
 *
 * **注意**：`quant` 的 Tailwind 对 `@dreamer/ui-view` 使用按需 `@source`（见
 * `uiViewTailwindPlugin` / `ui-view-sources.css`）。**必须**把本文件纳入扫描，
 * 否则 `sr-only`、`absolute` 等类未进产线 CSS 时，会出现原生方框+碎块/异常大的滑块等样式崩坏。
 */

import {
  createEffect,
  createSignal,
  type JSXRenderable,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  resolveFormControlDisabled,
  resolveFormControlSize,
} from "./form-control-context.ts";
import { createOptionalValueState, type MaybeSignal } from "./maybe-signal.ts";
import type { SizeVariant } from "../types.ts";

export interface SwitchProps {
  /** 尺寸，与 {@link import("./Input.tsx").Input} 相同：xs、sm、md、lg */
  size?: SizeVariant;
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

const switchTrackSize: Record<SizeVariant, string> = {
  xs: "h-4 w-7",
  sm: "h-5 w-9",
  md: "h-6 w-11",
  lg: "h-7 w-14",
};
const switchThumbSize: Record<SizeVariant, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};
/** md 保持原 1.25rem 行程；其余按轨宽减滑块与左右留白估算 */
const switchThumbTravel: Record<SizeVariant, string> = {
  xs: "0.75rem",
  sm: "1rem",
  md: "1.25rem",
  lg: "1.75rem",
};
const switchLabelSize: Record<SizeVariant, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
};

export function Switch(props: SwitchProps): JSXRenderable {
  const {
    size: sizeProp,
    checked: checkedMaybe,

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
  const disabled = resolveFormControlDisabled(props.disabled);
  const size = resolveFormControlSize(sizeProp);
  const selected = createOptionalValueState(checkedMaybe, false);
  /**
   * Getter 受控（如 DataPanel 行内 `checked={isOn}`）时 `commit()` 无法回写，
   * 滑块会等到父级延后写值或整行重建才跳到终态，200ms 的 translateX 过渡播不出来。
   * 点击后先记下乐观态，等受控值追上再放下，让同一节点上的过渡真正播放。
   */
  const optimistic = createSignal<boolean | null>(null);
  createEffect(() => {
    const committed = selected.read();
    if (optimistic.value !== null && optimistic.value === committed) {
      optimistic.value = null;
    }
  });
  const isOn = (): boolean => optimistic.value ?? selected.read();

  /**
   * 用户切换时写回受控 Signal / 非受控内部状态，并立刻更新乐观显示态。
   *
   * @param e - 原生 `change` 事件
   */
  const handleChange = (e: Event) => {
    const next = (e.target as HTMLInputElement).checked;
    selected.commit(next);
    optimistic.value = next;
    onChangeProp?.(e);
  };

  const checkedForInput = isOn;

  return (
    <label
      class={twMerge(
        "relative inline-flex items-center gap-2 text-slate-700 dark:text-slate-300",
        switchLabelSize[size],
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
      {
        /*
        轨道与滑块都是常驻节点，仅用函数式 class / style 细粒度更新：
        这样切换时滑块的 `transform` 过渡（200ms）能真正播放，而不是整段重建后瞬移。
      */
      }
      <span
        class={() => {
          const on = isOn();
          return twMerge(
            "relative shrink-0 overflow-hidden rounded-full border transition-colors motion-reduce:transition-none",
            switchTrackSize[size],
            "peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-0",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            on
              ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
              : "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-600",
            error && "border-red-500 dark:border-red-500",
            hideFocusRing && "peer-focus:ring-0",
          );
        }}
        aria-hidden="true"
      >
        {
          /*
          滑块位移：勿在同一元素上用 `twMerge` 同时拼 `-translate-y-1/2` 与 `translate-x-5`；
          默认的 tailwind-merge 会把 `translate-x-*` 与 `translate-y-*` 当同一组，易只剩其一，
          表现即为「开态轨道已蓝但圆点仍在左侧」。改用单一 `style.transform` 写死 `translate(…, -50%)`。
        */
        }
        <span
          class={twMerge(
            "pointer-events-none absolute left-px top-1/2 block rounded-full",
            switchThumbSize[size],
            "bg-white shadow ring-0 dark:bg-slate-200",
            "transition-[transform] duration-200 motion-reduce:transition-none will-change-transform",
          )}
          style={() => ({
            // 1.25rem 与 `translate-x-5` / 轨宽 `w-11` 下的行程一致
            transform: isOn()
              ? `translate(${switchThumbTravel[size]}, -50%)`
              : "translate(0, -50%)",
          })}
        />
      </span>
      {unCheckedChildren != null && (
        <span class="peer-checked:hidden">{unCheckedChildren}</span>
      )}
      {checkedChildren != null && (
        <span class="hidden peer-checked:inline">{checkedChildren}</span>
      )}
    </label>
  );
}
