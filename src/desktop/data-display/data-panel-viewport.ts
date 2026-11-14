/**
 * DataPanel 底栏分页视口档：与 Tailwind `sm`／`xl` 对齐。
 * 电脑端 ≥1280px 为 full＋md，平板 640px–1279.98px 为 default＋sm，
 * 移动端 ≤639.98px 为 simple＋xs。
 */
import type {
  PaginationPreset,
  PaginationSize,
} from "../../shared/navigation/Pagination.tsx";

/** 移动端上限（含），对应 `max-sm` / `max-width: 639.98px`。 */
export const DATA_PANEL_MOBILE_MAX_PX = 639.98;
/** 平板上限（含），对应 `xl` 以下 / `max-width: 1279.98px`。 */
export const DATA_PANEL_TABLET_MAX_PX = 1279.98;
/** 平板／电脑分界，对应 Tailwind `xl`。 */
export const DATA_PANEL_DESKTOP_MIN_PX = 1280;
/** 平板下限，对应 Tailwind `sm`。 */
export const DATA_PANEL_TABLET_MIN_PX = 640;

export const DATA_PANEL_MOBILE_MQ =
  `(max-width: ${DATA_PANEL_MOBILE_MAX_PX}px)`;
export const DATA_PANEL_TABLET_MQ =
  `(min-width: ${DATA_PANEL_TABLET_MIN_PX}px) and (max-width: ${DATA_PANEL_TABLET_MAX_PX}px)`;

export type DataPanelViewportTier = "mobile" | "tablet" | "desktop";

/**
 * 按视口宽度判定档位。供单测钉死断点；运行时仍以 matchMedia 为准。
 */
export function resolveDataPanelViewportTier(
  widthPx: number,
): DataPanelViewportTier {
  if (widthPx <= DATA_PANEL_MOBILE_MAX_PX) return "mobile";
  if (widthPx <= DATA_PANEL_TABLET_MAX_PX) return "tablet";
  return "desktop";
}

/** 把 matchMedia 的 matches 结果收成视口档（无 matchMedia 时视为电脑端）。 */
export function viewportTierFromMedia(
  mobileMatches?: boolean,
  tabletMatches?: boolean,
): DataPanelViewportTier {
  if (mobileMatches) return "mobile";
  if (tabletMatches) return "tablet";
  return "desktop";
}

/** 视口档对应的默认分页 preset 与 size；`paginationPreset` 只覆盖 preset。 */
export function dataPanelPaginationForTier(
  tier: DataPanelViewportTier,
): { preset: PaginationPreset; size: PaginationSize } {
  if (tier === "mobile") return { preset: "simple", size: "xs" };
  if (tier === "tablet") return { preset: "default", size: "sm" };
  return { preset: "full", size: "md" };
}
