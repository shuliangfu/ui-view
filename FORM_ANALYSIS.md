# ui-view 表单（Form）全面分析

> 对照 `ANALYSIS.md` 3.2 表单组件清单，对当前实现做功能完整度与缺口分析。

---

## 一、组件清单与实现状态

### 1.1 与 ANALYSIS 3.2 对照表

| ANALYSIS 组件   | 说明                               | D/M/C | 实现位置                        | 状态                |
| --------------- | ---------------------------------- | ----- | ------------------------------- | ------------------- |
| Input           | 单行输入                           | C     | shared/form/Input.tsx           | ✅ 已实现           |
| Search          | 搜索框                             | C     | shared/form/Search.tsx          | ✅ 已实现           |
| Password        | 密码输入                           | C     | shared/form/Password.tsx        | ✅ 已实现           |
| Textarea        | 多行输入                           | C     | shared/form/Textarea.tsx        | ✅ 已实现           |
| InputNumber     | 数字输入                           | C     | shared/form/InputNumber.tsx     | ✅ 已实现           |
| Select          | 单选下拉                           | D/M   | desktop/form, mobile/form       | ✅ 已实现           |
| MultiSelect     | 多选下拉                           | D/M   | desktop/form, mobile/form       | ✅ 已实现           |
| AutoComplete    | 自动完成                           | C     | shared/form/AutoComplete.tsx    | ✅ 已实现（简化版） |
| Cascader        | 级联选择                           | D/M   | desktop/form, mobile/form       | ✅ 已实现           |
| TreeSelect      | 树选择                             | D     | desktop/form                    | ✅ 已实现           |
| Checkbox        | 多选勾选                           | C     | shared/form/Checkbox.tsx        | ✅ 已实现           |
| CheckboxGroup   | 多选组                             | C     | shared/form/CheckboxGroup.tsx   | ✅ 已实现           |
| Radio           | 单选                               | C     | shared/form/Radio.tsx           | ✅ 已实现           |
| RadioGroup      | 单选组                             | C     | shared/form/RadioGroup.tsx      | ✅ 已实现           |
| Switch          | 开关                               | C     | shared/form/Switch.tsx          | ✅ 已实现           |
| Slider          | 滑块                               | C     | shared/form/Slider.tsx          | ✅ 已实现           |
| Rate            | 评分                               | C     | shared/form/Rate.tsx            | ✅ 已实现           |
| DatePicker      | 日期选择                           | D/M   | desktop/form, mobile/form       | ✅ 已实现           |
| DateRangePicker | 日期范围                           | D/M   | desktop/form, mobile/form       | ✅ 已实现           |
| TimePicker      | 时间选择                           | C     | shared/form/TimePicker.tsx      | ✅ 已实现           |
| TimeRangePicker | 时间范围                           | C     | shared/form/TimeRangePicker.tsx | ✅ 已实现           |
| ColorPicker     | 颜色选择                           | C     | shared/form/ColorPicker.tsx     | ✅ 已实现           |
| Upload          | 文件上传                           | C     | shared/form/Upload.tsx          | ✅ 已实现           |
| Mentions        | @提及                              | C     | shared/form/Mentions.tsx        | ✅ 已实现           |
| Transfer        | 穿梭框                             | D     | desktop/form/Transfer.tsx       | ✅ 已实现           |
| Form            | 表单容器（校验、布局）             | C     | shared/form/Form.tsx            | ✅ 已实现           |
| FormItem        | 表单项包装（标签、必填、错误提示） | C     | shared/form/FormItem.tsx        | ✅ 已实现           |
| FormList        | 动态表单项                         | C     | shared/form/FormList.tsx        | ✅ 已实现           |
| RichTextEditor  | 富文本编辑器                       | C     | shared/form/RichTextEditor.tsx  | ✅ 已实现           |

**结论**：ANALYSIS 3.2 表单清单已全部实现（含 RichTextEditor）。

---

## 二、各组件功能完善度

### 2.1 已实现能力（共性）

- **基础能力**：value/checked
  受控、disabled、size（部分）、name/id、class、onChange/onInput。
- **主题**：light/dark 样式（Tailwind）。
- **导出**：shared/form 导出共用组件；desktop/form、mobile/form 分别导出 D/M
  组件，与 ANALYSIS 约定一致。

### 2.2 按组件细项

| 组件                         | 已有                                                                                                                                                                                                                                                                        | 缺失/建议                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Input**                    | size, disabled, placeholder, value, type, onInput/onChange, name, id                                                                                                                                                                                                        | 无 `error` 状态样式；无 `required`、`aria-required`/`aria-invalid`；无 `readOnly`                  |
| **Search**                   | 图标、placeholder、value、onSearch(Enter)                                                                                                                                                                                                                                   | 注释写「回车或点击搜索」但**无搜索按钮**，点击搜索未实现；无清除按钮                               |
| **Password**                 | 显隐切换、onToggleShow、aria-label                                                                                                                                                                                                                                          | ANALYSIS 提到的「强度提示」未实现                                                                  |
| **Textarea**                 | rows, value, onInput/onChange                                                                                                                                                                                                                                               | 无 size；无 error/required/readOnly；无 maxLength 展示                                             |
| **InputNumber**              | step, min, max, value                                                                                                                                                                                                                                                       | 无「精度」独立 API（可用 step=0.01 等间接实现）；无步进按钮（+/-）                                 |
| **Select (D/M)**             | options/children, value, onChange, size, disabled                                                                                                                                                                                                                           | 桌面/移动均为**原生 `<select>`**，无自定义下拉 UI；无 placeholder 占位选项（可传 children 自定义） |
| **MultiSelect (D/M)**        | options, value[], onChange                                                                                                                                                                                                                                                  | 原生多选，无 key（见下节）；无「全选/清空」等快捷操作                                              |
| **AutoComplete**             | options(datalist), value, onInput/onChange                                                                                                                                                                                                                                  | **onSelect 未接**（datalist 选中的值未通过 onSelect 回传）；datalist 的 option 建议加 key          |
| **Cascader (D/M)**           | 两级级联、value[]、onChange                                                                                                                                                                                                                                                 | 仅两级；option 列表建议加 key                                                                      |
| **TreeSelect (D)**           | 树扁平化为 select、value、onChange                                                                                                                                                                                                                                          | 同上，option 建议 key                                                                              |
| **Checkbox/Radio**           | checked, disabled, name, value, onChange                                                                                                                                                                                                                                    | 无 error 状态                                                                                      |
| **CheckboxGroup/RadioGroup** | options, value, onChange                                                                                                                                                                                                                                                    | 列表 map 建议加 key（见下节）                                                                      |
| **Switch**                   | checked, disabled, checkedChildren/unCheckedChildren                                                                                                                                                                                                                        | 无 error 状态                                                                                      |
| **Slider**                   | value, min, max, step, onInput/onChange                                                                                                                                                                                                                                     | 无竖排、无 range 双滑块                                                                            |
| **Rate**                     | count, value, allowHalf, onChange                                                                                                                                                                                                                                           | 有 role/aria；半星点击为整星（可接受）                                                             |
| **DatePicker (D/M)**         | value, min, max, size, onChange                                                                                                                                                                                                                                             | 原生 `type="date"`，无自定义日历弹层                                                               |
| **DateRangePicker (D/M)**    | start, end, min, max, onChange                                                                                                                                                                                                                                              | 两个 date input，逻辑正确                                                                          |
| **TimePicker**               | value, size, onChange                                                                                                                                                                                                                                                       | 原生 `type="time"`                                                                                 |
| **ColorPicker**              | value(#rrggbb), onChange                                                                                                                                                                                                                                                    | 原生 color input                                                                                   |
| **Upload**                   | multiple, accept, onChange                                                                                                                                                                                                                                                  | 仅选择文件，**无上传进度、无文件列表展示、无拖拽区域**                                             |
| **Mentions**                 | value, placeholder, onInput/onChange                                                                                                                                                                                                                                        | 仅多行输入+placeholder 提示，**无 @ 触发候选 UI、无插入片段**                                      |
| **TimeRangePicker**          | start, end, size, disabled, onChange([start, end]), name/id（-start/-end）                                                                                                                                                                                                  | 双 time 输入，与 DateRangePicker 语义一致                                                          |
| **Transfer (D)**             | dataSource, targetKeys, onChange, titles, disabled；双列、单项→/←、批量»/«                                                                                                                                                                                                  | 无搜索/筛选；项级 disabled 已支持                                                                  |
| **Form**                     | layout(vertical/horizontal/inline)、onSubmit（内部 preventDefault）                                                                                                                                                                                                         | 无内置校验集成，由调用方在 onSubmit 中处理                                                         |
| **FormItem**                 | label, required（*）, error（文案+子输入红框）, id（label for / error id）                                                                                                                                                                                                  | 有 error 时容器 role="alert"；子控件可后续增加 error/required props 以配合                         |
| **FormList**                 | items, onAdd, onRemove, children 渲染函数 (index)=>node, addButtonText                                                                                                                                                                                                      | 每行带删除按钮；受控由父组件持列表数据                                                             |
| **RichTextEditor**           | value, onChange, toolbarPreset, toolbar 自定义, placeholder, readOnly, minHeight, name, id；**插入图片 URL**（onInsertImage / prompt）、**上传图片**（onUploadImage + 隐藏 file input）、**粘贴图片**（onPasteImage 或 data URL）；**插入表格**（行/列 prompt）；三档工具栏 | 见下方 2.3 可完善项。                                                                              |

### 2.3 RichTextEditor 可完善项分析

**当前已实现（含 2.3 全部可完善项）**：

- 插入图片 URL、上传图片、粘贴图片、插入表格（含表头行「插入表格(含表头)」）。
- **编辑**：撤销/重做（工具栏 + Ctrl+Z / Ctrl+Y）、清除格式。
- **插入**：水平线、特殊字符/表情（下拉选择）、表格增强（th 表头）。
- **视图**：全屏（工具栏按钮切换）、字数统计（底部展示）、Markdown 解析（「解析
  Markdown」按钮对选区应用 **、*、`、# 等）。
- **代码**：代码块（「代码块(可高亮)」插入带 class `rte-code-block` 的
  pre/code，便于接入 Prism）。
- **格式**：首行缩进、上标/下标（execCommand）。
- **高级**：查找替换（查找栏：查找/替换/全部替换，遍历文本节点）、打印（新窗口打印）、导出（HTML
  或纯文本下载）。
- **无障碍**：工具栏按钮 title 含快捷键说明；「快捷键帮助」按钮弹出说明。

---

## 三、代码质量与规范

### 3.1 JSX key

- **已加 key**：desktop/form/Select.tsx、mobile/form/Select.tsx（option
  key=opt.value）。
- **建议补 key**（避免 lint / 虚拟 DOM 优化问题）：
  - shared/form/AutoComplete.tsx：`options.map((opt) => <option key={opt} value={opt} />)`
  - shared/form/RadioGroup.tsx：`options.map((opt) => <Radio key={opt.value} ... />)`
  - shared/form/CheckboxGroup.tsx：`options.map((opt) => <Checkbox key={opt.value} ... />)`
  - desktop/form/MultiSelect.tsx、mobile/form/MultiSelect.tsx：`<option key={opt.value} ...>`
  - desktop/form/Cascader.tsx、mobile/form/Cascader.tsx：两处 options.map 的
    option 加 key
  - desktop/form/TreeSelect.tsx：flat.map 的 option 加 key

### 3.2 无障碍与语义

- **Rate**：已用 role="slider"、aria-valuemin/max/now、aria-readonly、按钮
  aria-label。
- **Password**：显隐按钮有 aria-label。
- **RadioGroup**：role="radiogroup"、aria-label。
- **CheckboxGroup**：role="group"、aria-label。
- 其他输入类组件：多数未暴露 **error/required**，因此未统一做
  `aria-invalid`、`aria-required`、`aria-describedby`（错误文案）。若后续做
  FormItem，建议在 FormItem 层统一挂载这些属性。

### 3.3 受控与 defaultValue

- 当前均为受控用法（value/checked 由父组件控制）；**无
  defaultValue/defaultChecked**。若需非受控用法，可在后续版本为部分组件增加
  default 值支持。

---

## 四、缺口与优先级建议

### 4.1 已补全（与 ANALYSIS 一致）

1. **Form + FormItem**：已实现（shared/form/Form.tsx、FormItem.tsx），支持
   layout、onSubmit、label、required、error。
2. **FormList**：已实现（shared/form/FormList.tsx），支持
   items、onAdd、onRemove、renderRow 渲染每行。
3. **TimeRangePicker**：已实现（shared/form/TimeRangePicker.tsx），双 time
   输入，onChange([start, end])。
4. **Transfer**（D）：已实现（desktop/form/Transfer.tsx），双列、targetKeys
   受控、批量移动。

### 4.2 功能增强（非必须）

5. **AutoComplete**：在用户从 datalist 选中的时机调用
   `onSelect`（或文档标明选中由 onChange 体现）。
6. **Search**：可选「搜索」按钮，点击时调用 onSearch(currentValue)。
7. **Upload**：文件列表、上传进度、拖拽区域（或单独文档说明当前为「选择器」）。
8. **Input / Textarea / 等**：error、required、readOnly 等 props，便于与
   FormItem 配合。
9. **Password**：可选「强度提示」。
10. **Mentions**：@ 触发、候选列表、插入片段（实现成本较高，可标为后续迭代）。

---

## 五、总结

| 维度           | 结论                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **组件覆盖**   | ANALYSIS 3.2 表单清单已全部实现（含 RichTextEditor：URL/上传/粘贴图片、表格）。                                                  |
| **功能完善度** | 基础交互与样式完整；Form/FormItem/FormList/TimeRangePicker/Transfer 已就绪；部分增强（Upload 列表、Mentions 候选等）可按需迭代。 |
| **代码规范**   | 部分列表渲染建议补 key；FormItem 已支持 error 样式与 required 星号。                                                             |
| **建议顺序**   | 按需做 4.2 功能增强；RichTextEditor 为可选。                                                                                     |

以上为表单全面分析结论；当前实现已与 ANALYSIS 3.2
对齐，表单能力可满足大部分业务场景。
