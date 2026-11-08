/**
 * PasscodeInput 密码／验证码输入（View）。
 * 等宽格子；可配合 {@link NumberKeyboard}；`MaybeSignal` 受控。
 */

import {
  createMemo,
  createSignal,
  type JSXRenderable,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  commitMaybeSignal,
  type MaybeSignal,
  readMaybeSignal,
} from "../../shared/form/maybe-signal.ts";

export interface PasscodeInputMessages {
  /** 无障碍标签；显式 `aria-label` 优先 */
  label: string;
}

export const defaultPasscodeInputMessages: PasscodeInputMessages = {
  label: "验证码",
};

export interface PasscodeInputProps {
  /** 当前值 */
  value?: MaybeSignal<string>;
  onChange?: (value: string) => void;
  /** 完成（长度达到 length） */
  onFinish?: (value: string) => void;
  /** 位数，默认 6 */
  length?: number;
  /** 是否掩码显示，默认 false（OTP 常明文） */
  mask?: boolean;
  /** 仅数字，默认 true */
  digitsOnly?: boolean;
  /** 自动弹出系统键盘用的隐藏 input，默认 true */
  secludedInput?: boolean;
  disabled?: boolean;
  class?: string;
  /** 无障碍标签；优先于 messages.label */
  "aria-label"?: string;
  messages?: Partial<PasscodeInputMessages>;
}

export function PasscodeInput(props: PasscodeInputProps): JSXRenderable {
  const m: PasscodeInputMessages = {
    ...defaultPasscodeInputMessages,
    ...(props.messages ?? {}),
  };
  const {
    onChange,
    onFinish,
    length = 6,
    mask = false,
    digitsOnly = true,
    secludedInput = true,
    disabled = false,
    class: className,
    "aria-label": ariaLabelProp,
  } = props;
  const ariaLabel = ariaLabelProp ?? m.label;

  const focused = createSignal(false);
  const inputRef = createSignal<HTMLInputElement | null>(null);

  const valueNow = createMemo(() => {
    const v = readMaybeSignal(props.value) ?? "";
    return digitsOnly ? v.replace(/\D/g, "").slice(0, length) : v.slice(0, length);
  });

  const setValue = (next: string) => {
    let v = digitsOnly ? next.replace(/\D/g, "") : next;
    v = v.slice(0, length);
    commitMaybeSignal(props.value, v);
    onChange?.(v);
    if (v.length >= length) onFinish?.(v);
  };

  const cells = () => {
    const v = valueNow();
    const nodes: unknown[] = [];
    for (let i = 0; i < length; i++) {
      const ch = v[i] ?? "";
      const active = focused.value && i === v.length;
      nodes.push(
        <div
          key={i}
          class={twMerge(
            "flex size-10 items-center justify-center rounded-lg border text-lg font-semibold",
            "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900",
            active && "border-blue-500 ring-2 ring-blue-500/30",
          )}
        >
          {ch ? (mask ? "•" : ch) : ""}
        </div>,
      );
    }
    return nodes;
  };

  return () => (
    <div
      class={twMerge("passcode-input relative inline-flex gap-2", className)}
      role="group"
      aria-label={ariaLabel}
      onClick={() => {
        if (disabled) return;
        focused.value = true;
        inputRef.value?.focus?.();
      }}
    >
      {cells()}
      {secludedInput && (
        <input
          ref={(el: unknown) => {
            inputRef.value = el as HTMLInputElement | null;
          }}
          class="absolute opacity-0 w-px h-px pointer-events-none"
          inputMode={digitsOnly ? "numeric" : "text"}
          autocomplete="one-time-code"
          maxlength={length}
          disabled={disabled}
          value={valueNow()}
          aria-label={ariaLabel}
          onFocus={() => {
            focused.value = true;
          }}
          onBlur={() => {
            focused.value = false;
          }}
          onInput={(e: Event) => {
            const t = e.target as HTMLInputElement;
            setValue(t.value ?? "");
          }}
        />
      )}
    </div>
  );
}
