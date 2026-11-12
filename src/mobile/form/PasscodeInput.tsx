/**
 * PasscodeInput 密码／验证码输入（View）。
 * 等宽格子；可配合 {@link NumberKeyboard}；`MaybeSignal` 受控。
 */

import {
  createMemo,
  createSignal,
  type JSXRenderable,
  useContext,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";
import { resolveFormControlSize } from "../../shared/form/form-control-context.ts";
import { FormItemControlIdContext } from "../../shared/form/form-item-control-id.ts";
import { controlErrorBorder } from "../../shared/form/input-focus-ring.ts";
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
  /** 控件尺寸，与 Input 相同；也可由外层 Form 的 size 注入 */
  size?: SizeVariant;
  /** 当前值 */
  value?: MaybeSignal<string>;
  onChange?: (value: string) => void;
  /** 失焦回调（可用于 blur 校验） */
  onBlur?: (e: Event) => void;
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
  /** 错误状态（格子红框）；可与 FormItem / createForm bindValue 联用 */
  error?: boolean;
  /** 表单字段名 */
  name?: string;
  /** 控件 id；未传时取 FormItemControlIdContext */
  id?: string;
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
    onBlur,
    onFinish,
    length = 6,
    mask = false,
    digitsOnly = true,
    secludedInput = true,
    disabled = false,
    error = false,
    name,
    id,
    class: className,
    "aria-label": ariaLabelProp,
  } = props;
  const size = resolveFormControlSize(props.size);
  const fromFormItem = useContext(FormItemControlIdContext);
  const resolvedId = id ?? fromFormItem;
  const cellSizeCls: Record<SizeVariant, string> = {
    xs: "size-7 text-sm",
    sm: "size-8 text-base",
    md: "size-10 text-lg",
    lg: "size-12 text-xl",
  };
  const gapCls: Record<SizeVariant, string> = {
    xs: "gap-1",
    sm: "gap-1.5",
    md: "gap-2",
    lg: "gap-2.5",
  };
  const ariaLabel = ariaLabelProp ?? m.label;

  const focused = createSignal(false);
  const inputRef = createSignal<HTMLInputElement | null>(null);

  const valueNow = createMemo(() => {
    const v = readMaybeSignal(props.value) ?? "";
    return digitsOnly
      ? v.replace(/\D/g, "").slice(0, length)
      : v.slice(0, length);
  });

  /**
   * 写回受控值并触发 onChange / onFinish。
   *
   * @param next - 原始输入字符串
   */
  const setValue = (next: string) => {
    let v = digitsOnly ? next.replace(/\D/g, "") : next;
    v = v.slice(0, length);
    commitMaybeSignal(props.value, v);
    onChange?.(v);
    if (v.length >= length) onFinish?.(v);
  };

  /** 渲染等宽格子；错误态统一红框 */
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
            "flex items-center justify-center rounded-lg border font-semibold",
            cellSizeCls[size],
            "border-slate-300 dark:border-slate-600 bg-slate-100 shadow-inner dark:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.55),inset_0_-1px_0_rgb(255_255_255_/_0.06)] dark:bg-slate-900/70",
            error && controlErrorBorder,
            active && !error && "border-blue-500 ring-2 ring-blue-500/30",
            active && error && "ring-2 ring-red-500/30",
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
      class={twMerge(
        "passcode-input relative inline-flex",
        gapCls[size],
        className,
      )}
      role="group"
      aria-label={ariaLabel}
      aria-invalid={error}
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
          id={resolvedId}
          name={name}
          class="absolute opacity-0 w-px h-px pointer-events-none"
          inputMode={digitsOnly ? "numeric" : "text"}
          autocomplete="one-time-code"
          maxlength={length}
          disabled={disabled}
          value={valueNow()}
          aria-label={ariaLabel}
          aria-invalid={error}
          onFocus={() => {
            focused.value = true;
          }}
          onBlur={(e: Event) => {
            focused.value = false;
            onBlur?.(e);
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
