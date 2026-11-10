/**
 * 兼容再导出：实现已收口到 {@link ../../shared/feedback/popFixedStyle.ts}，
 * 供桌面 Popconfirm / Tooltip / Popover / ContextMenu 与 shared Tour 共用。
 */
export {
  PORTAL_POP_GAP_PX,
  arrowAnchorOffset,
  computeArrowAnchorStyle,
  computeAutoPopFixedStyle,
  computePopFixedStyle,
  flipPlacementToFit,
  oppositePopPlacement,
  popArrowSide,
  popBoxForPlacement,
  resolveAutoPopPlacement,
  resolvePointFixedPosition,
  POP_ARROW_SAFE_INSET_PX,
  POP_ARROW_SIZE_PX,
  type ArrowAnchorOffset,
  type AutoPopPlacement,
  type PopArrowSide,
  type FullPopStylePlacement,
  type PopSize,
  type ResolveAutoPopPlacementOptions,
  type ViewportSize,
} from "../../shared/feedback/popFixedStyle.ts";
