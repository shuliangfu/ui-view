/**
 * View 表单组件入口（与 ANALYSIS 3.2 对齐）。
 *
 * 受控值可与 `@dreamer/view/signal` 的 `SignalRef` 配合：例如
 * `value={() => textRef.value}`、`checked={() => checkedRef.value}`，
 * 由 View 对属性 getter 做细粒度更新；部分组件仍使用 `return () =>` 以稳定 DOM、避免输入失焦（见各文件注释）。
 */
export { Input } from "./Input.tsx";
export type { InputProps } from "./Input.tsx";
export { Search } from "./Search.tsx";
export type { SearchProps } from "./Search.tsx";
export { Password } from "./Password.tsx";
export type { PasswordProps } from "./Password.tsx";
export { Textarea } from "./Textarea.tsx";
export type { TextareaProps } from "./Textarea.tsx";
export { InputNumber } from "./InputNumber.tsx";
export type { InputNumberProps } from "./InputNumber.tsx";
export { AutoComplete } from "./AutoComplete.tsx";
export type { AutoCompleteProps } from "./AutoComplete.tsx";
export { Checkbox } from "./Checkbox.tsx";
export type { CheckboxProps } from "./Checkbox.tsx";
export { CheckboxGroup } from "./CheckboxGroup.tsx";
export type {
  CheckboxGroupOption,
  CheckboxGroupProps,
} from "./CheckboxGroup.tsx";
export { Radio } from "./Radio.tsx";
export type { RadioProps } from "./Radio.tsx";
export { RadioGroup } from "./RadioGroup.tsx";
export type { RadioGroupOption, RadioGroupProps } from "./RadioGroup.tsx";
export { Switch } from "./Switch.tsx";
export type { SwitchProps } from "./Switch.tsx";
export { Slider } from "./Slider.tsx";
export type { SliderProps } from "./Slider.tsx";
export { Rate } from "./Rate.tsx";
export type { RateProps } from "./Rate.tsx";
/** TimePicker 由桌面版提供（desktop/form/TimePicker），主包使用自定义下拉实现 */
export { TimeRangePicker } from "./TimeRangePicker.tsx";
export type { TimeRangePickerProps } from "./TimeRangePicker.tsx";
/** Transfer 穿梭框（双列选择），归类为表单类组件 */
export { Transfer } from "./Transfer.tsx";
export type { TransferItem, TransferProps } from "./Transfer.tsx";
export { Upload } from "./Upload.tsx";
export type { UploadFile, UploadFileStatus, UploadProps } from "./Upload.tsx";
export { ColorPicker } from "./ColorPicker.tsx";
export type { ColorPickerProps } from "./ColorPicker.tsx";
export { Mentions } from "./Mentions.tsx";
export type { MentionOption, MentionsProps } from "./Mentions.tsx";
export { Form } from "./Form.tsx";
export type { FormLayout, FormProps } from "./Form.tsx";
export { FormItem } from "./FormItem.tsx";
export type {
  FormItemLabelAlign,
  FormItemLabelPosition,
  FormItemProps,
} from "./FormItem.tsx";
export { FormList } from "./FormList.tsx";
export type { FormListProps } from "./FormList.tsx";
export { RichTextEditor } from "./RichTextEditor.tsx";
export type {
  RichTextEditorProps,
  ToolbarConfig,
  ToolbarItem,
  ToolbarPreset,
} from "./RichTextEditor.tsx";
