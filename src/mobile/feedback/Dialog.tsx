/**
 * 与桌面版实现一致：确认对话框（`@dreamer/ui-view` desktop/feedback），含 `variant` / `mobileLayout` 等。
 * 在 **mobile/feedback** 下提供与 BottomSheet 等并列的入口，便于从 `@dreamer/ui-view/mobile` 或
 * `@dreamer/ui-view/mobile/feedback` 与移动页同路径导入；底层仍经 Portal 挂到 `body`（或
 * `MobilePortalHostScope` 锚点，行为同 {@link ./BottomSheet.tsx} 说明）。
 */
export * from "../../desktop/feedback/Dialog.tsx";
