/**
 * @fileoverview 文档站各组件 messages 字段表数据，与 @dreamer/ui-view 源码中的 *Messages / default*Messages 对齐。
 */

import type { DocsApiTableRow } from "../components/DocsApiTable.tsx";

export { MESSAGES_RICH_TEXT_EDITOR } from "./rich-text-editor-messages-rows.ts";

/** DatePickerMessages（calendarNav 见 {@link MESSAGES_PICKER_CALENDAR_NAV}） */
export const MESSAGES_DATE_PICKER: DocsApiTableRow[] = [
  {
    name: "placeholder",
    type: "string",
    default: `"请选择日期"`,
    description: "触发器占位；与 props.placeholder 同时存在时以 props 为准",
  },
  {
    name: "dialog",
    type: "string",
    default: `"选择日期"`,
    description: "日期浮层 aria-label",
  },
  {
    name: "confirm",
    type: "string",
    default: `"确定"`,
    description: "底部确定",
  },
  {
    name: "cancel",
    type: "string",
    default: `"取消"`,
    description: "底部取消",
  },
  {
    name: "rangePlaceholder",
    type: "string",
    default: `"…"`,
    description: "range 起始端未选占位",
  },
  {
    name: "multipleSummary",
    type: "(count: number) => string",
    default: "`(count) => \\`${count} 个日期\\``",
    description: "multiple 模式摘要",
  },
  {
    name: "calendarNav",
    type: "Partial<PickerCalendarNavMessages>",
    default: "`{}`",
    description:
      "日历导航条；子键见下文「PickerCalendarNav」表或与 defaultPickerCalendarNavMessages 对齐，一层浅合并",
  },
];

/** PickerCalendarNavMessages（DatePicker / DateTimePicker 的 calendarNav 嵌套） */
export const MESSAGES_PICKER_CALENDAR_NAV: DocsApiTableRow[] = [
  {
    name: "prevMonth",
    type: "string",
    default: `"上一月"`,
    description: "上一月按钮 aria-label",
  },
  {
    name: "nextMonth",
    type: "string",
    default: `"下一月"`,
    description: "下一月按钮 aria-label",
  },
  {
    name: "monthAndYear",
    type: "string",
    default: `"选择月份与年份"`,
    description: "日视图标题按钮 aria-label",
  },
  {
    name: "prevYear",
    type: "string",
    default: `"上一年"`,
    description: "月视图上一年",
  },
  {
    name: "nextYear",
    type: "string",
    default: `"下一年"`,
    description: "月视图下一年",
  },
  {
    name: "yearPanel",
    type: "string",
    default: `"选择年份"`,
    description: "月视图年份按钮 aria-label",
  },
  {
    name: "prevYearPage",
    type: "string",
    default: `"上一组年份"`,
    description: "年视图翻页",
  },
  {
    name: "nextYearPage",
    type: "string",
    default: `"下一组年份"`,
    description: "年视图翻页",
  },
  {
    name: "backToDayLabel",
    type: "string",
    default: `"返回日历视图"`,
    description: "月视图返回 aria-label",
  },
  {
    name: "backToDayText",
    type: "string",
    default: `"返回日历"`,
    description: "月视图返回可见文字",
  },
  {
    name: "backToMonthLabel",
    type: "string",
    default: `"返回月份选择"`,
    description: "年视图返回 aria-label",
  },
  {
    name: "backToMonthText",
    type: "string",
    default: `"返回选月"`,
    description: "年视图返回可见文字",
  },
  {
    name: "monthGrid",
    type: "string",
    default: `"选择月份"`,
    description: "月份宫格 aria-label",
  },
  {
    name: "yearGrid",
    type: "string",
    default: `"选择年份"`,
    description: "年份宫格 aria-label",
  },
  {
    name: "monthNames",
    type: "readonly string[]",
    default: "`1月`…`12月`（与 calendar-utils.MONTHS 一致）",
    description: "12 个月名称，顺序 0～11",
  },
  {
    name: "formatYearMonth",
    type: "(year, monthLabel) => string",
    default: "`(y, l) => \\`${y}年 ${l}\\``",
    description: "「年 + 月」标题",
  },
  {
    name: "formatYear",
    type: "(year) => string",
    default: "`(y) => \\`${y}年\\``",
    description: "单年标题",
  },
  {
    name: "formatYearRange",
    type: "(start, end) => string",
    default: "`(s,e) => \\`${s}年 — ${e}年\\``",
    description: "年份区间标题",
  },
];

export const MESSAGES_DATETIME_PICKER: DocsApiTableRow[] = [
  {
    name: "placeholder",
    type: "string",
    default: `"请选择日期时间"`,
    description: "触发器占位；props.placeholder 优先",
  },
  {
    name: "dialog",
    type: "string",
    default: `"选择日期与时间"`,
    description: "浮层 aria-label",
  },
  { name: "confirm", type: "string", default: `"确定"`, description: "确定" },
  { name: "cancel", type: "string", default: `"取消"`, description: "取消" },
  {
    name: "rangePlaceholder",
    type: "string",
    default: `"…"`,
    description: "range 空槽占位",
  },
  {
    name: "multipleSummary",
    type: "(count: number) => string",
    default: "`(c) => \\`${c} 个日期时间\\``",
    description: "multiple 摘要",
  },
  { name: "hour", type: "string", default: `"时"`, description: "时列表列头" },
  {
    name: "minute",
    type: "string",
    default: `"分"`,
    description: "分列表列头",
  },
  {
    name: "second",
    type: "string",
    default: `"秒"`,
    description: "秒列表列头",
  },
  {
    name: "start",
    type: "string",
    default: `"开始"`,
    description: "range 开始槽",
  },
  {
    name: "end",
    type: "string",
    default: `"结束"`,
    description: "range 结束槽",
  },
  {
    name: "startWithValue",
    type: "(value: string) => string",
    default: "`(v) => \\`开始 · ${v}\\``",
    description: "开始槽含值时的 tab 文案",
  },
  {
    name: "endWithValue",
    type: "(value: string) => string",
    default: "`(v) => \\`结束 · ${v}\\``",
    description: "结束槽含值时的 tab 文案",
  },
  {
    name: "calendarNav",
    type: "Partial<PickerCalendarNavMessages>",
    default: "`{}`",
    description:
      "嵌套日历导航；子键见「PickerCalendarNav」独立表或源码 defaultPickerCalendarNavMessages",
  },
];

export const MESSAGES_TIME_PICKER: DocsApiTableRow[] = [
  {
    name: "placeholder",
    type: "string",
    default: `"请选择时间"`,
    description: "触发器占位；props.placeholder 优先",
  },
  {
    name: "dialog",
    type: "string",
    default: `"选择时间"`,
    description: "浮层 aria-label",
  },
  { name: "confirm", type: "string", default: `"确定"`, description: "确定" },
  { name: "cancel", type: "string", default: `"取消"`, description: "取消" },
  {
    name: "rangePlaceholder",
    type: "string",
    default: `"…"`,
    description: "range 占位",
  },
  {
    name: "multipleSummary",
    type: "(count: number) => string",
    default: "`(c) => \\`${c} 个时刻\\``",
    description: "multiple 摘要",
  },
  { name: "hour", type: "string", default: `"时"`, description: "时列头" },
  { name: "minute", type: "string", default: `"分"`, description: "分列头" },
  { name: "second", type: "string", default: `"秒"`, description: "秒列头" },
  {
    name: "start",
    type: "string",
    default: `"开始"`,
    description: "range 开始",
  },
  { name: "end", type: "string", default: `"结束"`, description: "range 结束" },
  {
    name: "add",
    type: "string",
    default: `"加入已选"`,
    description: "multiple 加入",
  },
  {
    name: "removeTitle",
    type: "string",
    default: `"点击移除"`,
    description: "multiple 标签移除 title",
  },
];

export const MESSAGES_ALERT: DocsApiTableRow[] = [
  {
    name: "close",
    type: "string",
    default: `"关闭"`,
    description: "关闭按钮 aria-label",
  },
];

export const MESSAGES_INPUT: DocsApiTableRow[] = [
  {
    name: "clear",
    type: "string",
    default: `"清除"`,
    description: "allowClear 时清除钮 aria-label",
  },
];

export const MESSAGES_EMPTY: DocsApiTableRow[] = [
  {
    name: "description",
    type: "string",
    default: `"暂无数据"`,
    description: "主描述；props.description 优先",
  },
  {
    name: "ariaLabel",
    type: "string",
    default: `"空状态"`,
    description: "容器 aria-label",
  },
];

export const MESSAGES_TAG: DocsApiTableRow[] = [
  {
    name: "close",
    type: "string",
    default: `"关闭"`,
    description: "可关闭时按钮 aria-label",
  },
];

export const MESSAGES_RATE: DocsApiTableRow[] = [
  {
    name: "starLabel",
    type: "(idx: number) => string",
    default: "`(i) => \\`${i} 星\\``",
    description: "单颗星 aria-label，idx 从 1 起",
  },
];

export const MESSAGES_SEGMENTED: DocsApiTableRow[] = [
  {
    name: "ariaLabel",
    type: "string",
    default: `"分段选择"`,
    description: "容器 aria-label",
  },
];

export const MESSAGES_CODE_BLOCK: DocsApiTableRow[] = [
  {
    name: "windowClose",
    type: "string",
    default: `"关闭"`,
    description: "窗口装饰点 title",
  },
  {
    name: "windowMinimize",
    type: "string",
    default: `"最小化"`,
    description: "最小化点 title",
  },
  {
    name: "windowMaximize",
    type: "string",
    default: `"最大化"`,
    description: "最大化点 title",
  },
  {
    name: "copy",
    type: "string",
    default: `"复制"`,
    description: "复制按钮 title / aria-label",
  },
  {
    name: "copySuccess",
    type: "string",
    default: `"复制成功"`,
    description: "复制成功 toast",
  },
  {
    name: "copyFail",
    type: "string",
    default: `"复制失败"`,
    description: "复制失败 toast",
  },
];

export const MESSAGES_IMAGE_VIEWER: DocsApiTableRow[] = [
  {
    name: "dialog",
    type: "string",
    default: `"图片查看"`,
    description: "全屏壳 aria-label",
  },
  { name: "close", type: "string", default: `"关闭"`, description: "关闭" },
  { name: "prev", type: "string", default: `"上一张"`, description: "上一张" },
  { name: "next", type: "string", default: `"下一张"`, description: "下一张" },
  { name: "zoomIn", type: "string", default: `"放大"`, description: "放大" },
  { name: "zoomOut", type: "string", default: `"缩小"`, description: "缩小" },
  {
    name: "rotateCcw",
    type: "string",
    default: `"逆时针旋转"`,
    description: "逆时针",
  },
  {
    name: "rotateCw",
    type: "string",
    default: `"顺时针旋转"`,
    description: "顺时针",
  },
  {
    name: "resetAriaLabel",
    type: "string",
    default: `"重置缩放与旋转"`,
    description: "重置按钮 aria-label",
  },
  {
    name: "reset",
    type: "string",
    default: `"重置"`,
    description: "重置按钮文案",
  },
];

export const MESSAGES_DRAWER: DocsApiTableRow[] = [
  {
    name: "close",
    type: "string",
    default: `"关闭"`,
    description: "关闭按钮 aria-label",
  },
];

export const MESSAGES_MODAL: DocsApiTableRow[] = [
  {
    name: "close",
    type: "string",
    default: `"关闭"`,
    description: "右上角关闭 aria-label",
  },
  {
    name: "enterFullscreen",
    type: "string",
    default: `"全屏"`,
    description: "进入全屏 aria-label",
  },
  {
    name: "exitFullscreen",
    type: "string",
    default: `"退出全屏"`,
    description: "退出全屏 aria-label",
  },
];

export const MESSAGES_DIALOG: DocsApiTableRow[] = [
  ...MESSAGES_MODAL,
  {
    name: "confirm",
    type: "string",
    default: `"确定"`,
    description: "确定按钮默认；props.confirmText 优先",
  },
  {
    name: "cancel",
    type: "string",
    default: `"取消"`,
    description: "取消按钮默认；props.cancelText 优先",
  },
];

export const MESSAGES_POPCONFIRM: DocsApiTableRow[] = [
  { name: "ok", type: "string", default: `"确定"`, description: "确定" },
  { name: "cancel", type: "string", default: `"取消"`, description: "取消" },
];

export const MESSAGES_PAGINATION: DocsApiTableRow[] = [
  {
    name: "nav",
    type: "string",
    default: `"分页"`,
    description: "nav aria-label",
  },
  { name: "prev", type: "string", default: `"上一页"`, description: "上一页" },
  { name: "next", type: "string", default: `"下一页"`, description: "下一页" },
  {
    name: "pageLabel",
    type: "(page: number) => string",
    default: "`(p) => \\`第 ${p} 页\\``",
    description: "页码按钮 aria-label",
  },
  {
    name: "pageSize",
    type: "string",
    default: `"每页条数"`,
    description: "每页条数选择器 aria-label",
  },
  {
    name: "pageSizeUnit",
    type: "(n: number) => string",
    default: "`(n) => \\`${n} 条/页\\``",
    description: "每页条数选项文案",
  },
  {
    name: "jumpTo",
    type: "string",
    default: `"跳至"`,
    description: "快速跳转前缀",
  },
  {
    name: "pageUnit",
    type: "string",
    default: `"页"`,
    description: "跳转单位",
  },
  {
    name: "totalText",
    type: "(total: number) => string",
    default: "`(t) => \\`共 ${t} 条\\``",
    description: "showTotal 默认",
  },
];

export const MESSAGES_STEPS: DocsApiTableRow[] = [
  {
    name: "ariaLabel",
    type: "string",
    default: `"步骤"`,
    description: "列表 aria-label",
  },
];

export const MESSAGES_ANCHOR: DocsApiTableRow[] = [
  {
    name: "navAriaLabel",
    type: "string",
    default: `"锚点导航"`,
    description: "nav aria-label",
  },
];

export const MESSAGES_PAGE_HEADER: DocsApiTableRow[] = [
  {
    name: "breadcrumbAriaLabel",
    type: "string",
    default: `"面包屑"`,
    description: "面包屑 nav aria-label",
  },
  {
    name: "back",
    type: "string",
    default: `"返回"`,
    description: "返回按钮 aria-label",
  },
];

export const MESSAGES_BREADCRUMB: DocsApiTableRow[] = [
  {
    name: "navAriaLabel",
    type: "string",
    default: `"Breadcrumb"`,
    description: "nav aria-label",
  },
];

export const MESSAGES_BACK_TOP: DocsApiTableRow[] = [
  {
    name: "ariaLabel",
    type: "string",
    default: `"回到顶部"`,
    description: "按钮 aria-label",
  },
];

export const MESSAGES_SIDEBAR: DocsApiTableRow[] = [
  {
    name: "navAriaLabel",
    type: "string",
    default: `"侧栏导航"`,
    description: "侧栏 nav aria-label",
  },
  {
    name: "drawerTitleFallback",
    type: "string",
    default: `"导航"`,
    description: "小屏抽屉默认标题",
  },
];

export const MESSAGES_DESKTOP_NAV_BAR: DocsApiTableRow[] = [
  {
    name: "navAriaLabel",
    type: "string",
    default: `"主导航"`,
    description: "主导航区域 aria-label",
  },
];

export const MESSAGES_MOBILE_NAV_BAR: DocsApiTableRow[] = [
  {
    name: "back",
    type: "string",
    default: `"返回"`,
    description: "无 leftText 时左侧 aria-label",
  },
];

export const MESSAGES_SEARCH: DocsApiTableRow[] = [
  {
    name: "placeholder",
    type: "string",
    default: `"搜索…"`,
    description: "占位默认；props.placeholder 优先",
  },
  {
    name: "clear",
    type: "string",
    default: `"清除"`,
    description: "清除 aria-label",
  },
  {
    name: "search",
    type: "string",
    default: `"搜索"`,
    description: "搜索钮 aria-label",
  },
];

export const MESSAGES_PASSWORD: DocsApiTableRow[] = [
  {
    name: "show",
    type: "string",
    default: `"显示密码"`,
    description: "显示密码",
  },
  {
    name: "hide",
    type: "string",
    default: `"隐藏密码"`,
    description: "隐藏密码",
  },
  {
    name: "strengthText",
    type: "(level: string) => string",
    default: "`(l) => \\`强度：${l}\\``",
    description: "强度前缀文案",
  },
  { name: "strengthWeak", type: "string", default: `"弱"`, description: "弱" },
  {
    name: "strengthMedium",
    type: "string",
    default: `"中"`,
    description: "中",
  },
  {
    name: "strengthStrong",
    type: "string",
    default: `"强"`,
    description: "强",
  },
];

export const MESSAGES_TEXTAREA: DocsApiTableRow[] = [
  {
    name: "remaining",
    type: "(remaining, maxLength) => string",
    default: "`(r,m) => \\`剩余 ${r} / ${m}\\``",
    description: "maxLength 时字数行",
  },
];

export const MESSAGES_UPLOAD: DocsApiTableRow[] = [
  {
    name: "dragPlaceholder",
    type: "string",
    default: `"点击或拖拽文件到此处"`,
    description: "拖拽区默认；props.dragPlaceholder 优先",
  },
  {
    name: "triggerLabel",
    type: "string",
    default: `"选择文件"`,
    description: "触发条默认；props.triggerLabel 优先",
  },
  {
    name: "pending",
    type: "string",
    default: `"等待上传"`,
    description: "列表项 pending aria-label",
  },
  {
    name: "done",
    type: "string",
    default: `"已完成"`,
    description: "完成 aria-label",
  },
  {
    name: "error",
    type: "string",
    default: `"上传失败"`,
    description: "失败 aria-label",
  },
  { name: "retry", type: "string", default: `"重试"`, description: "重试按钮" },
  {
    name: "cancelOrRemove",
    type: "(name: string) => string",
    default: "`(name) => \\`取消或移除 ${name}\\``",
    description: "取消或移除 aria-label",
  },
  {
    name: "remove",
    type: "(name: string) => string",
    default: "`(name) => \\`移除 ${name}\\``",
    description: "移除 aria-label",
  },
  {
    name: "errAcceptType",
    type: "string",
    default: `"文件类型不在 accept 允许范围内"`,
    description: "类型不符错误",
  },
  {
    name: "errFileTooLarge",
    type: "(max: string) => string",
    default: "`(max) => \\`文件超过大小限制（最大 ${max}）\\``",
    description: "超大文件错误",
  },
  {
    name: "errMaxCount",
    type: "(max: number) => string",
    default: "`(max) => \\`最多只能选择 ${max} 个文件\\``",
    description: "超出数量错误",
  },
];

export const MESSAGES_TRANSFER: DocsApiTableRow[] = [
  {
    name: "sourceTitle",
    type: "string",
    default: `"源列表"`,
    description: "左标题默认；titles[0] 优先",
  },
  {
    name: "targetTitle",
    type: "string",
    default: `"目标列表"`,
    description: "右标题默认；titles[1] 优先",
  },
  {
    name: "searchPlaceholder",
    type: "string",
    default: `"搜索"`,
    description: "搜索占位默认；searchPlaceholder prop 优先",
  },
  {
    name: "count",
    type: "(n: number) => string",
    default: "`(n) => \\`${n} 项\\``",
    description: "列表底部计数",
  },
  {
    name: "selectedSuffix",
    type: "(n: number) => string",
    default: "`(n) => \\`，已选 ${n}\\``",
    description: "已选后缀",
  },
  {
    name: "moveRight",
    type: "string",
    default: `"右移"`,
    description: "右移 aria-label",
  },
  {
    name: "moveLeft",
    type: "string",
    default: `"左移"`,
    description: "左移 aria-label",
  },
];

export const MESSAGES_TREE_SELECT: DocsApiTableRow[] = [
  {
    name: "placeholder",
    type: "string",
    default: `"请选择"`,
    description: "占位默认；props.placeholder 优先",
  },
  {
    name: "triggerFallback",
    type: "string",
    default: `"树形选择"`,
    description: "触发条 aria-label 兜底",
  },
  {
    name: "listbox",
    type: "string",
    default: `"树形选项"`,
    description: "下拉 listbox aria-label",
  },
];

export const MESSAGES_FORM_LIST: DocsApiTableRow[] = [
  {
    name: "addButton",
    type: "string",
    default: `"添加一项"`,
    description: "添加按钮默认；addButtonText 优先",
  },
  {
    name: "remove",
    type: "string",
    default: `"删除"`,
    description: "删除按钮可见文字",
  },
  {
    name: "removeRow",
    type: "(index: number) => string",
    default: "`(i) => \\`删除第 ${i} 项\\``",
    description: "删除 aria-label，参数为 1-based 行号",
  },
  {
    name: "list",
    type: "string",
    default: `"动态列表"`,
    description: "容器 aria-label",
  },
];

export const MESSAGES_SLIDER: DocsApiTableRow[] = [
  {
    name: "rangeMin",
    type: "string",
    default: `"范围最小值"`,
    description: "range 左拇指 aria-label",
  },
  {
    name: "rangeMax",
    type: "string",
    default: `"范围最大值"`,
    description: "range 右拇指 aria-label",
  },
];

export const MESSAGES_INPUT_NUMBER: DocsApiTableRow[] = [
  {
    name: "decrease",
    type: "string",
    default: `"减少"`,
    description: "减号 aria-label",
  },
  {
    name: "increase",
    type: "string",
    default: `"增加"`,
    description: "加号 aria-label",
  },
];

export const MESSAGES_SELECT: DocsApiTableRow[] = [
  {
    name: "triggerFallback",
    type: "string",
    default: `"选择"`,
    description: "触发器 aria-label 兜底",
  },
];

export const MESSAGES_MULTI_SELECT: DocsApiTableRow[] = [
  {
    name: "placeholder",
    type: "string",
    default: `"请选择"`,
    description: "占位默认",
  },
  { name: "selectAll", type: "string", default: `"全选"`, description: "全选" },
  { name: "clear", type: "string", default: `"清空"`, description: "清空" },
  { name: "done", type: "string", default: `"完成"`, description: "完成" },
  {
    name: "selectedSummary",
    type: "(summary: string) => string",
    default: "`(s) => \\`已选：${s}\\``",
    description: "触发条摘要 aria-label",
  },
  {
    name: "listbox",
    type: "string",
    default: `"多选列表"`,
    description: "listbox aria-label",
  },
];

export const MESSAGES_AUTO_COMPLETE: DocsApiTableRow[] = [
  {
    name: "listbox",
    type: "string",
    default: `"建议列表"`,
    description: "候选列表 aria-label",
  },
];

export const MESSAGES_MENTIONS: DocsApiTableRow[] = [
  {
    name: "placeholder",
    type: "string",
    default: `"输入 @ 提及"`,
    description: "占位默认",
  },
  {
    name: "listbox",
    type: "string",
    default: `"提及候选"`,
    description: "下拉 aria-label",
  },
];

export const MESSAGES_CASCADER: DocsApiTableRow[] = [
  {
    name: "placeholder",
    type: "string",
    default: `"请选择"`,
    description: "占位默认",
  },
  {
    name: "triggerFallback",
    type: "string",
    default: `"级联选择"`,
    description: "触发条 aria-label 兜底",
  },
  {
    name: "dialog",
    type: "string",
    default: `"级联选择"`,
    description: "浮层 aria-label",
  },
  {
    name: "loading",
    type: "string",
    default: `"加载中…"`,
    description: "列加载中",
  },
  {
    name: "emptyFirst",
    type: "string",
    default: `"暂无选项"`,
    description: "第一列空",
  },
  {
    name: "emptyChild",
    type: "string",
    default: `"无下级选项"`,
    description: "子级空",
  },
];

export const MESSAGES_COLOR_PICKER: DocsApiTableRow[] = [
  {
    name: "eyedropper",
    type: "string",
    default: `"屏幕取色"`,
    description: "取色钮 aria-label",
  },
  {
    name: "eyedropperTitle",
    type: "string",
    default: `"取色器（需浏览器支持）"`,
    description: "取色钮 title",
  },
  {
    name: "hint",
    type: "string",
    default: `"拖动方格与色相条选择颜色"`,
    description: "工具区说明",
  },
  { name: "confirm", type: "string", default: `"确定"`, description: "确定" },
  { name: "cancel", type: "string", default: `"取消"`, description: "取消" },
  {
    name: "dialog",
    type: "string",
    default: `"颜色选择"`,
    description: "浮层 aria-label",
  },
  {
    name: "swatchTrigger",
    type: "(hex: string) => string",
    default: "`(h) => \\`选择颜色，当前 ${h}\\``",
    description: "色块触发器 aria-label",
  },
];

export const MESSAGES_CALENDAR: DocsApiTableRow[] = [
  {
    name: "weekdays",
    type: "readonly string[]",
    default: '`["日", "一", … "六"]`',
    description: "周标题，长度须为 7，索引 0 为周日",
  },
  {
    name: "months",
    type: "readonly string[]",
    default: '`["1月", … "12月"]`',
    description: "月份名，长度须为 12",
  },
];

export const MESSAGES_CAROUSEL: DocsApiTableRow[] = [
  {
    name: "prev",
    type: "string",
    default: `"上一张"`,
    description: "上一张 aria-label",
  },
  {
    name: "next",
    type: "string",
    default: `"下一张"`,
    description: "下一张 aria-label",
  },
];

export const MESSAGES_TABLE: DocsApiTableRow[] = [
  {
    name: "loading",
    type: "string",
    default: `"加载中…"`,
    description: "加载中文案",
  },
  {
    name: "emptyText",
    type: "string",
    default: `"暂无数据"`,
    description: "空数据",
  },
  { name: "yes", type: "string", default: `"是"`, description: "布尔 true" },
  { name: "no", type: "string", default: `"否"`, description: "布尔 false" },
  {
    name: "doubleClickToEdit",
    type: "string",
    default: `"双击编辑"`,
    description: "可编辑格 title",
  },
  {
    name: "paginationAriaLabel",
    type: "string",
    default: `"表格分页"`,
    description: "底部分页 nav aria-label",
  },
  { name: "prev", type: "string", default: `"上一页"`, description: "上一页" },
  { name: "next", type: "string", default: `"下一页"`, description: "下一页" },
  {
    name: "pageLabel",
    type: "(page: number) => string",
    default: "`(p) => \\`第 ${p} 页\\``",
    description: "页码 aria-label",
  },
  {
    name: "paginationRange",
    type: "(from, to, total) => string",
    default: "`(f,t,tot) => \\`第 ${f}–${t} 条 / 共 ${tot} 条\\``",
    description: "分页范围摘要",
  },
  {
    name: "paginationTotalZero",
    type: "(total: number) => string",
    default: "`(tot) => \\`共 ${tot} 条\\``",
    description: "总数为 0 时摘要",
  },
  {
    name: "paginationOfPages",
    type: "(current, total) => string",
    default: "`(c,t) => \\`第 ${c} / ${t} 页\\``",
    description: "页码摘要",
  },
];

export const MESSAGES_MARKDOWN_EDITOR: DocsApiTableRow[] = [
  {
    name: "sourceLabel",
    type: "string",
    default: `"Markdown 源码"`,
    description: "源码标签 / aria",
  },
  {
    name: "previewLabel",
    type: "string",
    default: `"Markdown 预览"`,
    description: "预览标签",
  },
  {
    name: "renderPreview",
    type: "string",
    default: `"渲染预览"`,
    description: "渲染预览 tooltip",
  },
  {
    name: "toolbarAriaLabel",
    type: "string",
    default: `"Markdown 编辑器工具栏"`,
    description: "工具栏 aria-label",
  },
  {
    name: "fullscreen",
    type: "string",
    default: `"全屏编辑"`,
    description: "进入全屏",
  },
  {
    name: "fullscreenExit",
    type: "string",
    default: `"退出全屏"`,
    description: "退出全屏",
  },
  {
    name: "textareaAriaLabel",
    type: "string",
    default: `"Markdown 源码"`,
    description: "textarea 默认 aria-label",
  },
  {
    name: "previewEmpty",
    type: "string",
    default: "（HTML 占位段落，见源码）",
    description: "预览空内容",
  },
  {
    name: "previewError",
    type: "string",
    default: "（HTML 错误提示，见源码）",
    description: "解析失败提示",
  },
  {
    name: "charCount",
    type: "(remaining, maxLength) => string",
    default: "`(r,m) => \\`剩余 ${r} / ${m}\\``",
    description: "字数提示",
  },
];

export const MESSAGES_PULL_REFRESH: DocsApiTableRow[] = [
  {
    name: "pulling",
    type: "string",
    default: `"下拉即可刷新..."`,
    description: "未达阈值",
  },
  {
    name: "loosing",
    type: "string",
    default: `"释放即可刷新..."`,
    description: "已达阈值",
  },
  {
    name: "loading",
    type: "string",
    default: `"加载中..."`,
    description: "刷新中",
  },
  {
    name: "success",
    type: "string | null",
    default: "`null`",
    description: "成功提示；null 不展示成功态",
  },
];

export const MESSAGES_SCROLL_LIST: DocsApiTableRow[] = [
  {
    name: "noMore",
    type: "string",
    default: `"没有更多了"`,
    description: "hasMore=false 底提示；noMoreText 优先",
  },
];

export const MESSAGES_ACTION_SHEET: DocsApiTableRow[] = [
  {
    name: "cancel",
    type: "string",
    default: `"取消"`,
    description: "取消钮；cancelText 优先",
  },
  {
    name: "dialog",
    type: "string",
    default: `"操作列表"`,
    description: "浮层 aria-label",
  },
  {
    name: "close",
    type: "string",
    default: `"关闭"`,
    description: "遮罩关闭 aria-label",
  },
];

export const MESSAGES_BOTTOM_SHEET: DocsApiTableRow[] = [
  {
    name: "close",
    type: "string",
    default: `"关闭"`,
    description: "标题栏关闭按钮文案",
  },
  {
    name: "closeAriaLabel",
    type: "string",
    default: `"关闭"`,
    description: "遮罩关闭 aria-label",
  },
];

export const MESSAGES_TAB_BAR: DocsApiTableRow[] = [
  {
    name: "navAriaLabel",
    type: "string",
    default: `"底部导航"`,
    description: "nav aria-label",
  },
];

export const MESSAGES_FLAG_IMG: DocsApiTableRow[] = [
  {
    name: "emptySvgTitle",
    type: "string",
    default: `"空 SVG"`,
    description: "svg 为空时 Icon title 占位",
  },
];
