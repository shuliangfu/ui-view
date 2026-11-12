/**
 * @module @dreamer/ui-view/data-display
 * @description
 * **JSR**：`import … from "@dreamer/ui-view/data-display"`。桌面端**数据展示**：列表、卡片、图片、时间轴、树、日历、统计、分段器、表格等。
 *
 * **Table** 仅桌面提供；其余多为 shared 薄 re-export。`IMAGE_BUILTIN_FALLBACK_SRC` 为图片加载失败时的内置 data URI。
 * 各组件 props 与 `@returns` 见对应 `.tsx`。
 *
 * @see {@link ./Table.tsx} 表格组件
 */
export { Tag, type TagProps } from "./Tag.tsx";
export { Empty, type EmptyProps } from "./Empty.tsx";
export { Statistic, type StatisticProps } from "./Statistic.tsx";
export {
  Segmented,
  type SegmentedOption,
  type SegmentedProps,
} from "./Segmented.tsx";
export {
  Descriptions,
  type DescriptionsItem,
  type DescriptionsProps,
} from "./Descriptions.tsx";
export { Card, type CardProps } from "./Card.tsx";
export { List, type ListItemProps, type ListProps } from "./List.tsx";
export {
  Image,
  IMAGE_BUILTIN_FALLBACK_SRC,
  type ImageProps,
} from "./Image.tsx";
export {
  ImageViewer,
  type ImageViewerImageTransition,
  type ImageViewerProps,
  type ImageViewerTransition,
  type ImageViewerTransitionInput,
} from "./ImageViewer.tsx";
export {
  Timeline,
  type TimelineItemProps,
  type TimelineProps,
} from "./Timeline.tsx";
export {
  Collapse,
  type CollapseItem,
  type CollapseProps,
} from "./Collapse.tsx";
export { Carousel, type CarouselProps } from "./Carousel.tsx";
export {
  defaultTreeMessages,
  Tree,
  type TreeMessages,
  type TreeNode,
  type TreeProps,
} from "./Tree.tsx";
export {
  Calendar,
  type CalendarDaySelectionMode,
  type CalendarMode,
  type CalendarProps,
} from "./Calendar.tsx";
export { Comment, type CommentProps } from "./Comment.tsx";
export {
  CodeBlock,
  type CodeBlockLanguage,
  type CodeBlockProps,
} from "./CodeBlock.tsx";

export {
  type SortOrder,
  Table,
  type TableCellChangePayload,
  type TableColumn,
  type TableColumnEditable,
  type TableEditableOption,
  type TableProps,
} from "./Table.tsx";

export {
  type ActionCtrl,
  actionDisplayText,
  actionTipText,
  type ActionTone,
  assertRowActionsConfig,
  assertToolbarConfig,
  type BulkResult,
  type Caps,
  type Column,
  DATA_PANEL_CSS,
  DataPanel,
  type DataSource,
  type Density,
  type ExportContext,
  type ExportFormat,
  type FieldRule,
  type FormConfig,
  type FormField,
  type FormFieldRenderCtx,
  type FormRenderCtx,
  type ImportFormat,
  isRowBuiltin,
  isToolbarBuiltin,
  type ListResult,
  type Locale,
  type Messages,
  type Option,
  type PanelProps,
  type PanelToolbarConfig,
  type Query,
  refreshDataPanel,
  resolveActionCtrl,
  resolveRowActionCtrl,
  type Row,
  ROW_BUILTINS,
  type RowActionCtrl,
  type RowActionsConfig,
  type RowBuiltin,
  type SearchConfig,
  type SearchField,
  type Tone,
  TOOLBAR_BUILTINS,
  type ToolbarBuiltin,
  type ViewClick,
  type ViewConfig,
  type ViewItem,
  type ViewItemRenderCtx,
  type ViewRenderCtx,
  type WriteResult,
} from "./DataPanel.tsx";
export {
  assertDataViewToolbarConfig,
  DATA_VIEW_TOOLBAR_BUILTINS,
  DataView,
  type DataViewCaps,
  type DataViewProps,
  type DataViewToolbarBuiltin,
  isDataViewToolbarBuiltin,
  normalizeDataViewToolbar,
} from "./DataView.tsx";
export type { DataChromeTab, DataChromeTabType } from "./data-panel-tabs.tsx";
export {
  defaultDataPanelMessages,
  enDataPanelMessages,
} from "./data-panel-messages.ts";
export {
  assignColumnProps,
  buildExportFile,
  columnSortKey,
  columnWidthStyle,
  createLocalDataSource,
  CUSTOM_COL_PREFIX,
  type ExportFile,
  formatDateTime,
  isActionsColumn,
  isIndexColumn,
  isSelectionColumn,
  isSystemColumn,
  type LocalDataSource,
  type LocalDataSourceOptions,
  normalizeColumns,
  PANEL_COL_ACTIONS,
  PANEL_COL_INDEX,
  PANEL_COL_SELECT,
  parseCsv,
  parseJsonRows,
  parseXmlRows,
  resolvePanelColumns,
  validateForm,
} from "./data-panel-utils.ts";
export {
  type ApiDataSource,
  type ApiDataSourceOptions,
  type ApiMode,
  apiQueryParams,
  createApiDataSource,
  currentPageRoute,
  joinApiPath,
  normalizeListPayload,
  normalizePageRoute,
  resolveApiRoot,
} from "./data-panel-api-source.ts";
export { buildXlsx, parseXlsx, type XlsxSheet } from "./data-panel-xlsx.ts";

export { Watermark, type WatermarkProps } from "./Watermark.tsx";
export {
  CountDown,
  type CountDownProps,
  type CountDownTimeParts,
} from "./CountDown.tsx";
export { defaultQRCodeMessages, QRCode, type QRCodeProps } from "./QRCode.tsx";
export { VirtualList, type VirtualListProps } from "./VirtualList.tsx";
export {
  Cell,
  CellGroup,
  type CellGroupProps,
  type CellProps,
} from "./Cell.tsx";
