/**
 * 3.7 数据展示（Data Display，C 共用）。D：Table → desktop/data-display。
 *
 * 内部状态使用 `@dreamer/view` 的 **`Signal`**（`createSignal` 返回值，`.value` 读写）。
 * Carousel / Collapse / Tree / Image / ImageViewer 等需在渲染 getter 内读 signal 或父级 getter 的组件保留 `return () =>`；
 * 纯 props 展示的组件直接 `return` VNode。
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
  type DescriptionsLabelAlign,
  type DescriptionsLabelHorizontalAlign,
  type DescriptionsLabelVerticalAlign,
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
  type ImageViewerIndexInput,
  type ImageViewerOpenInput,
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
export {
  Carousel,
  type CarouselConcreteTransitionEffect,
  type CarouselProps,
  type CarouselTransitionEffect,
} from "./Carousel.tsx";
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

export { Watermark } from "./Watermark.tsx";
export type { WatermarkProps } from "./Watermark.tsx";

export { CountDown } from "./CountDown.tsx";
export type { CountDownProps, CountDownTimeParts } from "./CountDown.tsx";

export { defaultQRCodeMessages, QRCode } from "./QRCode.tsx";
export type { QRCodeProps } from "./QRCode.tsx";

export { VirtualList } from "./VirtualList.tsx";
export type { VirtualListProps } from "./VirtualList.tsx";

export { Cell, CellGroup } from "./Cell.tsx";
export type { CellGroupProps, CellProps } from "./Cell.tsx";
