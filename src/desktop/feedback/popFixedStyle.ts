/**
 * 兼容再导出：实现已收口到 {@link ../../shared/feedback/popFixedStyle.ts}，
 * 供桌面 Popconfirm / Tooltip / Popover / ContextMenu 与 shared Tour 共用。
 */
export {
  type ArrowAnchorOffset,
  arrowAnchorOffset,
  type AutoPopPlacement,
  computeArrowAnchorStyle,
  computeAutoPopFixedStyle,
  computePopFixedStyle,
  flipPlacementToFit,
  type FullPopStylePlacement,
  oppositePopPlacement,
  POP_ARROW_SAFE_INSET_PX,
  POP_ARROW_SIZE_PX,
  type PopArrowSide,
  popArrowSide,
  popBoxForPlacement,
  type PopSize,
  PORTAL_POP_GAP_PX,
  resolveAutoPopPlacement,
  type ResolveAutoPopPlacementOptions,
  resolvePointFixedPosition,
  type ViewportSize,
} from "../../shared/feedback/popFixedStyle.ts";
