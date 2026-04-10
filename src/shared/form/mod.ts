/**
 * View 表单组件入口（与 ANALYSIS 3.2 对齐）。
 *
 * 受控值可与 `@dreamer/view` 的 **`Signal`** 配合：例如 `value={textSig}` 或 `value={() => textSig()}`；
 * **Switch** 的 `checked` 可直接传 `createSignal` 返回值（`checked={sig}`）。
 * 统一类型见 {@link MaybeSignal}；由 View 对 getter / `Signal` 做细粒度更新；部分组件仍使用 `return () =>` 以稳定 DOM、避免输入失焦（见各文件注释）。
 */
export type { MaybeSignal } from "./maybe-signal.ts";
export { readMaybeSignal } from "./maybe-signal.ts";
export { AutoComplete } from "./AutoComplete.tsx";
export type { AutoCompleteProps } from "./AutoComplete.tsx";
export { Checkbox } from "./Checkbox.tsx";
export type { CheckboxProps } from "./Checkbox.tsx";
export { CheckboxGroup } from "./CheckboxGroup.tsx";
export type {
  CheckboxGroupOption,
  CheckboxGroupProps,
} from "./CheckboxGroup.tsx";
export { Input } from "./Input.tsx";
export type { InputProps } from "./Input.tsx";
export { InputNumber } from "./InputNumber.tsx";
export type { InputNumberProps } from "./InputNumber.tsx";
export { Password } from "./Password.tsx";
export type { PasswordProps } from "./Password.tsx";
export { Radio } from "./Radio.tsx";
export type { RadioProps } from "./Radio.tsx";
export { RadioGroup } from "./RadioGroup.tsx";
export type { RadioGroupOption, RadioGroupProps } from "./RadioGroup.tsx";
export { Rate } from "./Rate.tsx";
export type { RateProps } from "./Rate.tsx";
export { Search } from "./Search.tsx";
export type { SearchProps } from "./Search.tsx";
export { Slider } from "./Slider.tsx";
export type { SliderProps } from "./Slider.tsx";
export { Switch } from "./Switch.tsx";
export type { SwitchProps } from "./Switch.tsx";
export { Textarea } from "./Textarea.tsx";
export type { TextareaProps } from "./Textarea.tsx";
/** 自研日期/时间：Calendar + 浮层，无浏览器原生 date/time input */
export { DatePicker } from "./DatePicker.tsx";
export type {
  DatePickerMode,
  DatePickerProps,
  DatePickerRangeValue,
  DatePickerValue,
} from "./DatePicker.tsx";
export { DateTimePicker } from "./DateTimePicker.tsx";
export type {
  DateTimePickerMode,
  DateTimePickerProps,
  DateTimePickerRangeValue,
  DateTimePickerValue,
} from "./DateTimePicker.tsx";
export { TimePicker } from "./TimePicker.tsx";
export type {
  TimePickerMode,
  TimePickerProps,
  TimePickerRangeValue,
  TimePickerValue,
} from "./TimePicker.tsx";
/** Transfer 穿梭框（双列选择），归类为表单类组件 */
export { ColorPicker } from "./ColorPicker.tsx";
export type { ColorPickerHandle, ColorPickerProps } from "./ColorPicker.tsx";
export { Form } from "./Form.tsx";
export type { FormLayout, FormProps } from "./Form.tsx";
export { FormItem } from "./FormItem.tsx";
export type {
  FormItemLabelAlign,
  FormItemLabelPosition,
  FormItemProps,
} from "./FormItem.tsx";
export { FormList } from "./FormList.tsx";
export type { FormListProps, FormListRenderRowContext } from "./FormList.tsx";
export { Mentions } from "./Mentions.tsx";
export type { MentionOption, MentionsProps } from "./Mentions.tsx";
export { RichTextEditor } from "./RichTextEditor.tsx";
export type {
  RichTextEditorProps,
  ToolbarConfig,
  ToolbarItem,
  ToolbarPreset,
} from "./RichTextEditor.tsx";
export { MarkdownEditor } from "./MarkdownEditor.tsx";
export type {
  MarkdownEditorPreviewMode,
  MarkdownEditorProps,
} from "./MarkdownEditor.tsx";
export { Transfer } from "./Transfer.tsx";
export type { TransferItem, TransferProps } from "./Transfer.tsx";
export {
  DEFAULT_UPLOAD_CHUNK_SIZE,
  runChunkedUpload,
} from "./chunked-upload.ts";
export type {
  ChunkedUploadOptions,
  ChunkUploadContext,
} from "./chunked-upload.ts";
export {
  defaultGetUploadResultUrl,
  fileMatchesAccept,
  uploadActionWithPhase,
  uploadFilePhasedChunks,
  uploadFileSimple,
} from "./upload-http.ts";
export { formatUploadFileSize, Upload } from "./Upload.tsx";
export type {
  UploadCoreProps,
  UploadFile,
  UploadFileStatus,
  UploadMultipleValueMode,
  UploadProps,
} from "./Upload.tsx";
