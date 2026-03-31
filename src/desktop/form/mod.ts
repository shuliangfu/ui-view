/**
 * 桌面端表单入口：逐项从本目录 `./*.tsx` 导出（含 shared 薄 re-export 与桌面专有实现）。
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
export { Upload } from "./Upload.tsx";
export type {
  UploadCoreProps,
  UploadFile,
  UploadFileStatus,
  UploadMultipleValueMode,
  UploadProps,
} from "./Upload.tsx";
export {
  DEFAULT_UPLOAD_CHUNK_SIZE,
  defaultGetUploadResultUrl,
  fileMatchesAccept,
  formatUploadFileSize,
  runChunkedUpload,
  uploadActionWithPhase,
  uploadFilePhasedChunks,
  uploadFileSimple,
} from "../../shared/form/mod.ts";
export type {
  ChunkedUploadOptions,
  ChunkUploadContext,
} from "../../shared/form/mod.ts";
export { ColorPicker } from "./ColorPicker.tsx";
export type { ColorPickerHandle, ColorPickerProps } from "./ColorPicker.tsx";
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
export { MarkdownEditor } from "./MarkdownEditor.tsx";
export type {
  MarkdownEditorPreviewMode,
  MarkdownEditorProps,
} from "./MarkdownEditor.tsx";

/** 桌面专有：选择器、日期时间；另见本目录 `Transfer.tsx`（桌面 API，`label` 字段）按需直接路径引入，不在此 barrel 导出以免与 shared 通用 Transfer 冲突 */
export { Select } from "./Select.tsx";
export type { SelectOption, SelectProps } from "./Select.tsx";
export { MultiSelect } from "./MultiSelect.tsx";
export type { MultiSelectOption, MultiSelectProps } from "./MultiSelect.tsx";
export { Cascader } from "./Cascader.tsx";
export type { CascaderOption, CascaderProps } from "./Cascader.tsx";
export { TreeSelect } from "./TreeSelect.tsx";
export type { TreeSelectOption, TreeSelectProps } from "./TreeSelect.tsx";
export { DatePicker } from "./DatePicker.tsx";
export type { DatePickerProps } from "./DatePicker.tsx";
export { DateTimePicker } from "./DateTimePicker.tsx";
export type { DateTimePickerProps } from "./DateTimePicker.tsx";
export { TimePicker } from "./TimePicker.tsx";
export type { TimePickerProps } from "./TimePicker.tsx";
