/**
 * Form 校验规则类型与执行器。
 *
 * 与 {@link createForm} / {@link FormItem} 的 `rules` 共用；同步规则按序短路，
 * `validator` 可为异步（返回 `Promise`）。
 */

/** 表单值字典（字段名 → 任意值） */
export type FormValues = Record<string, unknown>;

/**
 * 单条校验规则。
 *
 * - `required` / `whitespace` / `min` / `max` / `pattern` / `type` / `equals` 为内置；
 * - `validator` 为自定义（可异步）；返回非空字符串表示失败。
 */
export type FormRule = {
  /** 失败时展示的文案；内置规则有默认中文文案 */
  message?: string;
  /** 必填：`null`/`undefined`/空字符串/`[]` 失败 */
  required?: boolean;
  /** 字符串去首尾空白后为空则失败（常与 required 搭配） */
  whitespace?: boolean;
  /** 字符串最小长度，或数字最小值 */
  min?: number;
  /** 字符串最大长度，或数字最大值 */
  max?: number;
  /** 正则；字符串会 `new RegExp(pattern)` */
  pattern?: RegExp | string;
  /** 内置类型校验 */
  type?: "string" | "number" | "boolean" | "email" | "url" | "array";
  /**
   * 与另一值相等：常量，或从全部 values 派生（交叉字段，如确认密码）。
   */
  equals?: unknown | ((values: FormValues) => unknown);
  /**
   * 自定义校验。返回 `string` 为错误文案；`undefined`/`void`/`""` 表示通过。
   * 可返回 Promise。
   */
  validator?: (
    value: unknown,
    values: FormValues,
  ) =>
    | string
    | undefined
    | void
    | Promise<string | undefined | void>;
};

/** 校验触发时机 */
export type FormValidateTrigger = "change" | "blur" | "submit";

/** 内置规则默认文案 */
const DEFAULT_MESSAGES = {
  required: "此项为必填",
  whitespace: "不能为空白字符",
  minString: (n: number) => `至少 ${n} 个字符`,
  maxString: (n: number) => `最多 ${n} 个字符`,
  minNumber: (n: number) => `不能小于 ${n}`,
  maxNumber: (n: number) => `不能大于 ${n}`,
  pattern: "格式不正确",
  email: "请输入有效邮箱",
  url: "请输入有效 URL",
  typeString: "须为字符串",
  typeNumber: "须为数字",
  typeBoolean: "须为布尔值",
  typeArray: "须为数组",
  equals: "两次输入不一致",
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string" && value.length === 0) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" && value.trim() !== "" &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

/**
 * 按序执行规则；第一条失败即返回其文案，全部通过返回 `undefined`。
 *
 * @param value - 当前字段值
 * @param rules - 规则列表
 * @param values - 整表 values（供 equals / validator）
 */
export async function runFormRules(
  value: unknown,
  rules: FormRule[] | undefined,
  values: FormValues,
): Promise<string | undefined> {
  if (!rules || rules.length === 0) return undefined;

  for (const rule of rules) {
    if (rule.required && isEmptyValue(value)) {
      return rule.message ?? DEFAULT_MESSAGES.required;
    }

    if (rule.whitespace && typeof value === "string" && value.trim() === "") {
      return rule.message ?? DEFAULT_MESSAGES.whitespace;
    }

    // 空值且非 required：跳过后续长度/类型/pattern（与常见表单库一致）
    if (isEmptyValue(value) && !rule.required && !rule.whitespace) {
      if (rule.validator) {
        const msg = await rule.validator(value, values);
        if (msg) return msg;
      }
      continue;
    }

    if (rule.type) {
      const t = rule.type;
      if (t === "string" && typeof value !== "string") {
        return rule.message ?? DEFAULT_MESSAGES.typeString;
      }
      if (t === "number") {
        if (asNumber(value) == null) {
          return rule.message ?? DEFAULT_MESSAGES.typeNumber;
        }
      }
      if (t === "boolean" && typeof value !== "boolean") {
        return rule.message ?? DEFAULT_MESSAGES.typeBoolean;
      }
      if (t === "array" && !Array.isArray(value)) {
        return rule.message ?? DEFAULT_MESSAGES.typeArray;
      }
      if (t === "email") {
        const s = String(value ?? "");
        if (!EMAIL_RE.test(s)) return rule.message ?? DEFAULT_MESSAGES.email;
      }
      if (t === "url") {
        const s = String(value ?? "");
        try {
          new URL(s);
        } catch {
          return rule.message ?? DEFAULT_MESSAGES.url;
        }
      }
    }

    if (rule.min != null) {
      if (typeof value === "string") {
        if (value.length < rule.min) {
          return rule.message ?? DEFAULT_MESSAGES.minString(rule.min);
        }
      } else {
        const n = asNumber(value);
        if (n != null && n < rule.min) {
          return rule.message ?? DEFAULT_MESSAGES.minNumber(rule.min);
        }
      }
    }

    if (rule.max != null) {
      if (typeof value === "string") {
        if (value.length > rule.max) {
          return rule.message ?? DEFAULT_MESSAGES.maxString(rule.max);
        }
      } else {
        const n = asNumber(value);
        if (n != null && n > rule.max) {
          return rule.message ?? DEFAULT_MESSAGES.maxNumber(rule.max);
        }
      }
    }

    if (rule.pattern != null) {
      const re = typeof rule.pattern === "string"
        ? new RegExp(rule.pattern)
        : rule.pattern;
      if (!re.test(String(value ?? ""))) {
        return rule.message ?? DEFAULT_MESSAGES.pattern;
      }
    }

    if (rule.equals !== undefined) {
      const expected = typeof rule.equals === "function"
        ? (rule.equals as (v: FormValues) => unknown)(values)
        : rule.equals;
      if (!Object.is(value, expected)) {
        return rule.message ?? DEFAULT_MESSAGES.equals;
      }
    }

    if (rule.validator) {
      const msg = await rule.validator(value, values);
      if (msg) return msg;
    }
  }

  return undefined;
}

/**
 * 规则工厂：减少业务侧手写对象字面量。
 *
 * @example
 * ```ts
 * rules: [formRules.required(), formRules.min(6), formRules.email()]
 * ```
 */
export const formRules = {
  required: (message?: string): FormRule => ({
    required: true,
    message,
  }),
  whitespace: (message?: string): FormRule => ({
    whitespace: true,
    message,
  }),
  min: (min: number, message?: string): FormRule => ({ min, message }),
  max: (max: number, message?: string): FormRule => ({ max, message }),
  pattern: (pattern: RegExp | string, message?: string): FormRule => ({
    pattern,
    message,
  }),
  email: (message?: string): FormRule => ({ type: "email", message }),
  url: (message?: string): FormRule => ({ type: "url", message }),
  type: (
    type: NonNullable<FormRule["type"]>,
    message?: string,
  ): FormRule => ({ type, message }),
  equals: (
    equals: FormRule["equals"],
    message?: string,
  ): FormRule => ({ equals, message }),
  /** 交叉字段：与 `other` 字段值相等（如确认密码） */
  equalsField: (other: string, message?: string): FormRule => ({
    equals: (values: FormValues) => values[other],
    message: message ?? DEFAULT_MESSAGES.equals,
  }),
  custom: (validator: NonNullable<FormRule["validator"]>): FormRule => ({
    validator,
  }),
} as const;
