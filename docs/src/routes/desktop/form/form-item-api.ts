/**
 * Form、FormItem、FormList、createForm 等表单容器文档用 API 表数据。
 * 仅由 `form-containers.tsx` 引用；各独立表单控件文档请在各自页面内维护 API 表，勿从此文件 import。
 */

/** 文档站 API 表格行 */
export interface FormDocsApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

/** Form 容器属性说明 */
export const FORM_API: FormDocsApiRow[] = [
  {
    name: "layout",
    type: '"vertical" | "horizontal" | "inline"',
    default: "vertical",
    description: "垂直堆叠 / 中等屏起横向排布 / 行内尾对齐",
  },
  {
    name: "size",
    type: '"sm" | "md" | "lg"',
    default: "md",
    description: "向下注入控件默认尺寸（FormControlSizeContext）",
  },
  {
    name: "form",
    type: "FormStore",
    default: "-",
    description:
      "createForm() 实例；注入上下文，供 FormItem name/rules 与 form.bind 协作",
  },
  {
    name: "validateOnSubmit",
    type: "boolean",
    default: "true",
    description:
      "有 form 且无 onFinish 时，提交前是否 validateFields；onFinish 始终先校验。若 onSubmit 已是 form.handleSubmit，请设 false",
  },
  {
    name: "onFinish",
    type: "(values) => void | Promise<void>",
    default: "-",
    description:
      "推荐：校验通过后拿到全部 values（内部 form.submit，维护 submitting）",
  },
  {
    name: "onSubmit",
    type: "(e: Event) => void",
    default: "-",
    description:
      "原生提交钩子（已 preventDefault）；有 form 时默认校验通过后才调用",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "作用于原生 form 的额外 class",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "FormItem、FormList 等子节点",
  },
];

/** FormItem 表单项属性说明 */
export const FORM_ITEM_API: FormDocsApiRow[] = [
  {
    name: "name",
    type: "string",
    default: "-",
    description:
      "字段名；祖先 Form 传入 form store 时注册字段，并展示 errors[name]（显式 error 优先）",
  },
  {
    name: "rules",
    type: "FormRule[]",
    default: "-",
    description:
      "校验规则；写入 store，可用 formRules.* 工厂。控件值请用 form.bind(name) 绑定",
  },
  {
    name: "validateTrigger",
    type: '"change" | "blur" | "submit" | 数组',
    default: "跟随 createForm",
    description: "本字段校验触发时机",
  },
  {
    name: "label",
    type: "string",
    default: "-",
    description: "标签文案",
  },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "必填星号；rules 含 required 时也会显示 *",
  },
  {
    name: "hideRequiredMark",
    type: "boolean",
    default: "false",
    description:
      "为 true 时不显示红色 *，可与 required 同时为 true（子控件仍可 required、校验照旧）",
  },
  {
    name: "error",
    type: "string",
    default: "-",
    description: "错误文案；有值时表单项错误样式；优先于 store 错误",
  },
  {
    name: "labelPosition",
    type: '"top" | "left" | "outline"',
    default: "top",
    description:
      "标签在控件上方、左侧，或描边内嵌（字坐在子控件边框左上缺口；outline 目前由 Input / Password / Textarea 承接）",
  },
  {
    name: "labelAlign",
    type: '"left" | "right"',
    default: "left",
    description: "仅 labelPosition=left 时：标签在列内左/右对齐",
  },
  {
    name: "id",
    type: "string",
    default: "自动生成",
    description:
      "控件 id（label for）；不传时按组件实例自动生成稳定 id，并经 FormItemControlIdContext 下传",
  },
  {
    name: "trailing",
    type: "unknown",
    default: "-",
    description: "与控件同一行、输入右侧（如 FormList 删除）；与输入同一水平线",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "容器额外 class",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "单个表单控件（如 Input）；不自动注入 value，请配合 form.bind",
  },
];

/** createForm 选项 */
export const CREATE_FORM_OPTIONS_API: FormDocsApiRow[] = [
  {
    name: "initialValues",
    type: "Partial<T>",
    default: "{}",
    description: "初始字段值；resetFields 回到此快照",
  },
  {
    name: "fields",
    type: "Record<name, FormFieldMeta>",
    default: "-",
    description:
      "字段 rules / validateTrigger / initialValue；也可由 FormItem 运行时 register",
  },
  {
    name: "validateTrigger",
    type: '"change" | "blur" | "submit" | 数组',
    default: '["change","blur"]',
    description: "全局默认触发；提交时始终全量校验",
  },
  {
    name: "onValuesChange",
    type: "(changed, all) => void",
    default: "-",
    description: "任意 setFieldValue / bind 写入后回调",
  },
];

/** FormStore 常用 API */
export const FORM_STORE_API: FormDocsApiRow[] = [
  {
    name: "values / errors / touched / submitting / dirty",
    type: "Signal<…>",
    default: "-",
    description: "响应式状态；可读 .value",
  },
  {
    name: "bind(name)",
    type: "FormFieldBind",
    default: "-",
    description:
      "Event+value：Input/Password/Textarea/Search/Select 等；{ value, onInput, onChange, onBlur, error }",
  },
  {
    name: "bindChecked(name)",
    type: "FormFieldBindChecked",
    default: "-",
    description: "Checkbox/Switch/Radio：{ checked, onChange, onBlur, error }",
  },
  {
    name: "bindValue(name)",
    type: "FormFieldBindValue",
    default: "-",
    description:
      "值回调控件：RadioGroup/Cascader/Rate/Upload/RTE/Passcode 等；{ value, onChange, onValueChange, onBlur, error }",
  },
  {
    name: "bindTargetKeys(name)",
    type: "FormFieldBindTargetKeys",
    default: "-",
    description: "Transfer：{ targetKeys, onChange, error }",
  },
  {
    name: "signal(name)",
    type: "Signal<unknown>",
    default: "-",
    description: "单字段 Signal（细粒度订阅，避免整表重绘）",
  },
  {
    name: "validateField / validateFields",
    type: "Promise<…>",
    default: "-",
    description: "单字段或全表校验；失败写入 errors",
  },
  {
    name: "submit / handleSubmit",
    type: "fn",
    default: "-",
    description: "先校验再执行业务；handleSubmit 可直接作 onSubmit",
  },
  {
    name: "setFieldValue / setFieldsValue",
    type: "fn",
    default: "-",
    description: "写入值；可选立刻校验",
  },
  {
    name: "setFieldError / setFieldsError / clearErrors",
    type: "fn",
    default: "-",
    description: "手动错误态（对接服务端校验）",
  },
  {
    name: "resetFields",
    type: "(names?) => void",
    default: "-",
    description: "重置到 initialValues；可传字段名数组",
  },
  {
    name: "registerField / unregisterField",
    type: "fn",
    default: "-",
    description: "FormItem 挂载时注册规则；一般无需手写",
  },
];

/** formRules 工厂 */
export const FORM_RULES_API: FormDocsApiRow[] = [
  {
    name: "required / whitespace",
    type: "(message?) => FormRule",
    default: "-",
    description: "必填 / 空白字符串",
  },
  {
    name: "min / max",
    type: "(n, message?) => FormRule",
    default: "-",
    description: "字符串长度或数字范围",
  },
  {
    name: "pattern / email / url / type",
    type: "…",
    default: "-",
    description: "正则与内置类型",
  },
  {
    name: "equals / equalsField",
    type: "…",
    default: "-",
    description: "常量相等或交叉字段（确认密码）",
  },
  {
    name: "custom",
    type: "(validator) => FormRule",
    default: "-",
    description: "自定义同步/异步 validator",
  },
];
