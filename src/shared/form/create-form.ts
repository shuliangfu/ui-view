/**
 * createForm：轻量表单 store（values / errors / touched + 校验 / 绑定）。
 *
 * 设计取舍（相对 Ant Design 声明式 Form.Item 自动注入 children）：
 * - 与 `@dreamer/view` 的 Signal 对齐，业务用 `form.bind(name)` 把值接到 Input/Password；
 * - FormItem 通过 `name`/`rules` 注册字段并展示 `errors`，不克隆子节点；
 * - 无 store 时 Form/FormItem 仍可纯展示使用（向后兼容）。
 */

import { createSignal, type Signal } from "@dreamer/view";
import {
  type FormRule,
  type FormValidateTrigger,
  type FormValues,
  runFormRules,
} from "./form-rules.ts";

/** 单字段元数据（规则、触发时机、初始值） */
export type FormFieldMeta = {
  rules?: FormRule[];
  validateTrigger?: FormValidateTrigger | FormValidateTrigger[];
  initialValue?: unknown;
};

/** createForm 选项 */
export type CreateFormOptions<T extends FormValues = FormValues> = {
  /** 初始值；未列出的字段在 register / set 时补齐 */
  initialValues?: Partial<T>;
  /** 字段规则与触发（也可由 FormItem `name`+`rules` 运行时注册） */
  fields?: Partial<Record<keyof T & string, FormFieldMeta>>;
  /** 全局默认触发；默认 `["change", "blur"]`，提交时始终校验 */
  validateTrigger?: FormValidateTrigger | FormValidateTrigger[];
  /** 任意字段值变化时回调（changed 为本次变更子集） */
  onValuesChange?: (changed: Partial<T>, all: T) => void;
};

/** `validateFields` 成功结果 */
export type FormValidateOk<T extends FormValues> = {
  ok: true;
  values: T;
};

/** `validateFields` 失败结果 */
export type FormValidateFail = {
  ok: false;
  errors: Record<string, string>;
};

export type FormValidateResult<T extends FormValues> =
  | FormValidateOk<T>
  | FormValidateFail;

/**
 * `form.bind(name)` 返回值：可展开到 Input / Password / Textarea / Select 等。
 *
 * - `value` 为 Signal，符合控件 MaybeSignal 约定；
 * - `error` 为布尔，供控件红框；文案仍由 FormItem 展示。
 */
export type FormFieldBind<V = unknown> = {
  name: string;
  value: Signal<V>;
  error: boolean;
  onInput: (e: Event) => void;
  onChange: (e: Event) => void;
  onBlur: (e?: Event) => void;
};

/**
 * `form.bindChecked(name)`：Checkbox / Switch / Radio 单枚。
 */
export type FormFieldBindChecked = {
  name: string;
  checked: Signal<boolean>;
  error: boolean;
  onChange: (e: Event) => void;
  onBlur: (e?: Event) => void;
};

/**
 * `form.bindValue(name)`：`onChange(value)` 非 Event 的控件
 * （RadioGroup / Cascader / Rate / Upload / RTE / Passcode / Signature / picker range 等）。
 */
export type FormFieldBindValue<V = unknown> = {
  name: string;
  value: Signal<V>;
  error: boolean;
  onChange: (value: V) => void;
  /** 部分控件另有 onValueChange（如 Upload）时同指向此函数 */
  onValueChange: (value: V) => void;
  onBlur: (e?: Event) => void;
};

/**
 * `form.bindTargetKeys(name)`：Transfer；字段存 `string[]`，展开为 targetKeys + onChange。
 */
export type FormFieldBindTargetKeys = {
  name: string;
  targetKeys: Signal<string[]>;
  error: boolean;
  onChange: (targetKeys: string[]) => void;
  onBlur: (e?: Event) => void;
};

/** 表单 store 对外 API */
export type FormStore<T extends FormValues = FormValues> = {
  /** 全部字段值（Signal） */
  values: Signal<T>;
  /** 字段错误文案（无错误的键可缺省） */
  errors: Signal<Partial<Record<keyof T & string, string>>>;
  /** 已触摸字段 */
  touched: Signal<Partial<Record<keyof T & string, boolean>>>;
  /** 提交进行中（validate + 业务 handler） */
  submitting: Signal<boolean>;
  /** 相对 initialValues 是否有改动 */
  dirty: Signal<boolean>;

  getFieldValue: (name: keyof T & string) => unknown;
  setFieldValue: (
    name: keyof T & string,
    value: unknown,
    opts?: { validate?: boolean; touch?: boolean },
  ) => void;
  setFieldsValue: (partial: Partial<T>, opts?: { validate?: boolean }) => void;
  getFieldError: (name: keyof T & string) => string | undefined;
  setFieldError: (name: keyof T & string, error: string | undefined) => void;
  setFieldsError: (
    next: Partial<Record<keyof T & string, string | undefined>>,
  ) => void;
  clearFieldError: (name: keyof T & string) => void;
  clearErrors: () => void;

  /** FormItem 挂载时注册 / 更新规则 */
  registerField: (name: keyof T & string, meta?: FormFieldMeta) => void;
  unregisterField: (name: keyof T & string) => void;
  getFieldMeta: (name: keyof T & string) => FormFieldMeta | undefined;
  isFieldRequired: (name: keyof T & string) => boolean;

  validateField: (name: keyof T & string) => Promise<boolean>;
  validateFields: (
    names?: Array<keyof T & string>,
  ) => Promise<FormValidateResult<T>>;

  resetFields: (names?: Array<keyof T & string>) => void;
  isFieldTouched: (name: keyof T & string) => boolean;

  /**
   * 绑定控件：返回可展开的 props（Event + value）。
   * `error` 随 `errors` Signal 读取，请在渲染 getter 内展开或只取需要的回调。
   */
  bind: <K extends keyof T & string>(name: K) => FormFieldBind<T[K]>;
  /** Checkbox / Switch：`checked` + Event onChange */
  bindChecked: <K extends keyof T & string>(name: K) => FormFieldBindChecked;
  /** 值回调型控件：`onChange(value)` / `onValueChange(value)` */
  bindValue: <K extends keyof T & string>(name: K) => FormFieldBindValue<T[K]>;
  /** Transfer：`targetKeys` + `onChange(keys)` */
  bindTargetKeys: <K extends keyof T & string>(
    name: K,
  ) => FormFieldBindTargetKeys;
  /** 仅取值 Signal（控件 `value={form.signal("x")}`） */
  signal: <K extends keyof T & string>(name: K) => Signal<T[K]>;

  /**
   * 校验通过后执行 handler；自动维护 `submitting`。
   * 校验失败不抛错，返回 `{ ok: false }`。
   */
  submit: (
    handler: (values: T) => void | Promise<void>,
  ) => Promise<FormValidateResult<T>>;
  /** 供 `<Form onSubmit={form.handleSubmit(fn)}>` 或原生 form */
  handleSubmit: (
    handler: (values: T) => void | Promise<void>,
  ) => (e?: Event) => void;
};

function normalizeTriggers(
  t: FormValidateTrigger | FormValidateTrigger[] | undefined,
  fallback: FormValidateTrigger[],
): FormValidateTrigger[] {
  if (t == null) return fallback;
  return Array.isArray(t) ? t : [t];
}

function readEventValue(e: Event): unknown {
  /** 不依赖 `instanceof HTMLInputElement`（Deno 单测无 DOM 全局） */
  const t = e.target as {
    type?: string;
    value?: string;
    checked?: boolean;
    valueAsNumber?: number;
  } | null;
  if (!t) return undefined;
  if (t.type === "checkbox") return !!t.checked;
  if (t.type === "number") {
    return t.value === "" ? "" : t.valueAsNumber;
  }
  return t.value;
}

function shallowDirty(
  current: FormValues,
  initial: FormValues,
): boolean {
  const keys = new Set([
    ...Object.keys(current),
    ...Object.keys(initial),
  ]);
  for (const k of keys) {
    if (!Object.is(current[k], initial[k])) return true;
  }
  return false;
}

/**
 * 创建表单 store。建议在模块级或组件外层稳定创建一次，避免重渲染丢失状态。
 *
 * @example
 * ```ts
 * const form = createForm({
 *   initialValues: { email: "", password: "" },
 *   fields: {
 *     email: { rules: [formRules.required(), formRules.email()] },
 *     password: { rules: [formRules.required(), formRules.min(6)] },
 *   },
 * });
 * ```
 */
export function createForm<T extends FormValues = FormValues>(
  options: CreateFormOptions<T> = {},
): FormStore<T> {
  const initialValues: T = {
    ...(options.initialValues ?? {}),
  } as T;
  /** resetFields 用的初始快照（后续 register 缺省字段会补 `undefined`） */
  const initialSnapshot: T = { ...initialValues };

  const fieldMeta = new Map<string, FormFieldMeta>();
  if (options.fields) {
    for (const [k, meta] of Object.entries(options.fields)) {
      if (meta) {
        fieldMeta.set(k, { ...meta });
        if (
          !(k in initialValues) &&
          meta.initialValue !== undefined
        ) {
          (initialValues as FormValues)[k] = meta.initialValue;
        }
      }
    }
  }

  // 稳定初始快照（reset 用）
  Object.assign(initialSnapshot, initialValues);

  const defaultTriggers = normalizeTriggers(
    options.validateTrigger,
    ["change", "blur"],
  );

  const values = createSignal<T>({ ...initialValues });
  const errors = createSignal<
    Partial<Record<keyof T & string, string>>
  >({});
  const touched = createSignal<
    Partial<Record<keyof T & string, boolean>>
  >({});
  const submitting = createSignal(false);
  const dirty = createSignal(false);

  /** 每字段一个 Signal，供 bind().value 细粒度订阅，避免整表 values 驱动所有输入重绘 */
  const fieldSignals = new Map<string, Signal<unknown>>();

  function ensureFieldSignal(name: string): Signal<unknown> {
    let sig = fieldSignals.get(name);
    if (!sig) {
      sig = createSignal<unknown>(
        (values.value as FormValues)[name],
      );
      fieldSignals.set(name, sig);
    }
    return sig;
  }

  // 预创建已有初始字段的 signal
  for (const k of Object.keys(initialValues)) {
    ensureFieldSignal(k);
  }

  function syncDirty() {
    dirty.value = shallowDirty(
      values.value as FormValues,
      initialSnapshot as FormValues,
    );
  }

  function writeValue(name: string, value: unknown) {
    const next = {
      ...(values.value as FormValues),
      [name]: value,
    } as T;
    values.value = next;
    ensureFieldSignal(name).value = value;
    syncDirty();
    options.onValuesChange?.(
      { [name]: value } as Partial<T>,
      next,
    );
  }

  function triggersFor(name: string): FormValidateTrigger[] {
    const meta = fieldMeta.get(name);
    return normalizeTriggers(meta?.validateTrigger, defaultTriggers);
  }

  function shouldValidate(
    name: string,
    trigger: FormValidateTrigger,
  ): boolean {
    return triggersFor(name).includes(trigger);
  }

  const store: FormStore<T> = {
    values,
    errors,
    touched,
    submitting,
    dirty,

    getFieldValue(name) {
      return (values.value as FormValues)[name];
    },

    setFieldValue(name, value, opts) {
      writeValue(name, value);
      if (opts?.touch) {
        touched.value = { ...touched.value, [name]: true };
      }
      if (opts?.validate ?? shouldValidate(name, "change")) {
        void store.validateField(name);
      }
    },

    setFieldsValue(partial, opts) {
      const next = {
        ...(values.value as FormValues),
        ...(partial as FormValues),
      } as T;
      values.value = next;
      for (const [k, v] of Object.entries(partial as FormValues)) {
        ensureFieldSignal(k).value = v;
      }
      syncDirty();
      options.onValuesChange?.(partial, next);
      if (opts?.validate) {
        void store.validateFields(
          Object.keys(partial) as Array<keyof T & string>,
        );
      }
    },

    getFieldError(name) {
      return errors.value[name];
    },

    setFieldError(name, error) {
      const next = { ...errors.value };
      if (error == null || error === "") delete next[name];
      else next[name] = error;
      errors.value = next;
    },

    setFieldsError(nextMap) {
      const next = { ...errors.value };
      for (const [k, v] of Object.entries(nextMap)) {
        if (v == null || v === "") delete next[k as keyof T & string];
        else next[k as keyof T & string] = v;
      }
      errors.value = next;
    },

    clearFieldError(name) {
      store.setFieldError(name, undefined);
    },

    clearErrors() {
      errors.value = {};
    },

    registerField(name, meta) {
      const prev = fieldMeta.get(name) ?? {};
      fieldMeta.set(name, {
        ...prev,
        ...meta,
        rules: meta?.rules ?? prev.rules,
      });
      ensureFieldSignal(name);
      if (
        !(name in (values.value as FormValues)) &&
        meta?.initialValue !== undefined
      ) {
        writeValue(name, meta.initialValue);
      } else if (!(name in (values.value as FormValues))) {
        // 占位，避免 validate 读到 undefined 与初始快照不一致时误报 dirty
        const cur = { ...(values.value as FormValues), [name]: undefined };
        values.value = cur as T;
        ensureFieldSignal(name).value = undefined;
        (initialSnapshot as FormValues)[name] = undefined;
      }
    },

    unregisterField(name) {
      fieldMeta.delete(name);
    },

    getFieldMeta(name) {
      return fieldMeta.get(name);
    },

    isFieldRequired(name) {
      const rules = fieldMeta.get(name)?.rules;
      return !!rules?.some((r) => r.required);
    },

    async validateField(name) {
      const rules = fieldMeta.get(name)?.rules;
      const all = values.value as FormValues;
      const msg = await runFormRules(all[name], rules, all);
      store.setFieldError(name, msg);
      return !msg;
    },

    async validateFields(names) {
      const keys = names ??
        ([
          ...new Set([
            ...fieldMeta.keys(),
            ...Object.keys(values.value as FormValues),
          ]),
        ] as Array<keyof T & string>);
      const nextErrors: Record<string, string> = {};
      let ok = true;
      const all = values.value as FormValues;
      for (const name of keys) {
        const rules = fieldMeta.get(name)?.rules;
        const msg = await runFormRules(all[name], rules, all);
        if (msg) {
          ok = false;
          nextErrors[name] = msg;
        }
      }
      // 合并：校验到的字段更新；未点名的旧错误保留（局部校验时）
      if (names) {
        const merged = { ...errors.value } as Record<string, string>;
        for (const name of keys) {
          if (nextErrors[name]) merged[name] = nextErrors[name];
          else delete merged[name];
        }
        errors.value = merged as Partial<
          Record<keyof T & string, string>
        >;
      } else {
        errors.value = nextErrors as Partial<
          Record<keyof T & string, string>
        >;
      }
      if (ok) return { ok: true, values: values.value };
      return { ok: false, errors: nextErrors };
    },

    resetFields(names) {
      if (!names) {
        const snap = { ...initialSnapshot } as T;
        values.value = snap;
        for (const [k, sig] of fieldSignals) {
          sig.value = (snap as FormValues)[k];
        }
        errors.value = {};
        touched.value = {};
        dirty.value = false;
        return;
      }
      const next = { ...(values.value as FormValues) };
      const nextTouched = { ...touched.value };
      const nextErrors = { ...errors.value };
      for (const name of names) {
        next[name] = (initialSnapshot as FormValues)[name];
        ensureFieldSignal(name).value = next[name];
        delete nextTouched[name];
        delete nextErrors[name];
      }
      values.value = next as T;
      touched.value = nextTouched;
      errors.value = nextErrors;
      syncDirty();
    },

    isFieldTouched(name) {
      return !!touched.value[name];
    },

    signal<K extends keyof T & string>(name: K) {
      return ensureFieldSignal(name) as Signal<T[K]>;
    },

    bind<K extends keyof T & string>(name: K) {
      const valueSig = ensureFieldSignal(name) as Signal<T[K]>;
      const applyFromEvent = (e: Event) => {
        const v = readEventValue(e) as T[K];
        writeValue(name, v);
        touched.value = { ...touched.value, [name]: true };
        if (errors.value[name]) {
          // 输入时清掉旧错误，随后按 trigger 再校验
          store.clearFieldError(name);
        }
        if (shouldValidate(name, "change")) {
          void store.validateField(name);
        }
      };
      return {
        name,
        value: valueSig,
        get error() {
          return !!errors.value[name];
        },
        onInput: applyFromEvent,
        onChange: applyFromEvent,
        onBlur: () => {
          touched.value = { ...touched.value, [name]: true };
          if (shouldValidate(name, "blur")) {
            void store.validateField(name);
          }
        },
      };
    },

    bindChecked<K extends keyof T & string>(name: K) {
      const raw = ensureFieldSignal(name);
      const checkedSig = raw as Signal<boolean>;
      return {
        name,
        checked: checkedSig,
        get error() {
          return !!errors.value[name];
        },
        onChange: (e: Event) => {
          const v = readEventValue(e);
          const next = typeof v === "boolean"
            ? v
            : !!(e.target as { checked?: boolean } | null)?.checked;
          writeValue(name, next);
          touched.value = { ...touched.value, [name]: true };
          if (errors.value[name]) store.clearFieldError(name);
          if (shouldValidate(name, "change")) {
            void store.validateField(name);
          }
        },
        onBlur: () => {
          touched.value = { ...touched.value, [name]: true };
          if (shouldValidate(name, "blur")) {
            void store.validateField(name);
          }
        },
      };
    },

    bindValue<K extends keyof T & string>(name: K) {
      const valueSig = ensureFieldSignal(name) as Signal<T[K]>;
      const applyValue = (v: T[K]) => {
        writeValue(name, v);
        touched.value = { ...touched.value, [name]: true };
        if (errors.value[name]) store.clearFieldError(name);
        if (shouldValidate(name, "change")) {
          void store.validateField(name);
        }
      };
      return {
        name,
        value: valueSig,
        get error() {
          return !!errors.value[name];
        },
        onChange: applyValue,
        onValueChange: applyValue,
        onBlur: () => {
          touched.value = { ...touched.value, [name]: true };
          if (shouldValidate(name, "blur")) {
            void store.validateField(name);
          }
        },
      };
    },

    bindTargetKeys<K extends keyof T & string>(name: K) {
      const valueSig = ensureFieldSignal(name) as Signal<string[]>;
      return {
        name,
        targetKeys: valueSig,
        get error() {
          return !!errors.value[name];
        },
        onChange: (keys: string[]) => {
          writeValue(name, keys);
          touched.value = { ...touched.value, [name]: true };
          if (errors.value[name]) store.clearFieldError(name);
          if (shouldValidate(name, "change")) {
            void store.validateField(name);
          }
        },
        onBlur: () => {
          touched.value = { ...touched.value, [name]: true };
          if (shouldValidate(name, "blur")) {
            void store.validateField(name);
          }
        },
      };
    },

    async submit(handler) {
      if (submitting.value) {
        return {
          ok: false as const,
          errors: { ...(errors.value as Record<string, string>) },
        };
      }
      submitting.value = true;
      try {
        const result = await store.validateFields();
        if (!result.ok) return result;
        await handler(result.values);
        return result;
      } finally {
        submitting.value = false;
      }
    },

    handleSubmit(handler) {
      return (e?: Event) => {
        e?.preventDefault?.();
        void store.submit(handler);
      };
    },
  };

  return store;
}
