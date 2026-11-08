/**
 * @fileoverview 本批 DIG 新组件 docs 页 UI 布局抽测：
 * 示例区可见、尺寸合理、不飞出视口；覆盖 18 个代表路由。
 */

import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG, sharedEnv } from "./helpers.ts";

/** 本批 18 组件代表 docs 路由（优先 mobile，桌面独有走 desktop） */
const DIG_UI_ROUTES: ReadonlyArray<{ path: string; label: string }> = [
  { path: "/mobile/basic/float-button", label: "FloatButton" },
  { path: "/mobile/navigation/dropdown-menu", label: "DropdownMenu" },
  { path: "/mobile/feedback/floating-panel", label: "FloatingPanel" },
  { path: "/mobile/feedback/share-sheet", label: "ShareSheet" },
  { path: "/mobile/form/number-keyboard", label: "NumberKeyboard" },
  { path: "/mobile/form/passcode-input", label: "PasscodeInput" },
  { path: "/mobile/form/signature-pad", label: "SignaturePad" },
  { path: "/mobile/navigation/index-bar", label: "IndexBar" },
  { path: "/mobile/data-display/count-down", label: "CountDown" },
  { path: "/mobile/data-display/cell", label: "Cell" },
  { path: "/mobile/data-display/qrcode", label: "QRCode" },
  { path: "/mobile/data-display/virtual-list", label: "VirtualList" },
  { path: "/mobile/data-display/watermark", label: "Watermark" },
  { path: "/mobile/feedback/overlay", label: "Overlay" },
  { path: "/mobile/feedback/tour", label: "Tour" },
  { path: "/mobile/feedback/notice-bar", label: "NoticeBar" },
  { path: "/desktop/feedback/context-menu", label: "ContextMenu" },
  { path: "/desktop/layout/splitter", label: "Splitter" },
];

describe("DIG 本批 docs UI 布局抽测", () => {
  for (const route of DIG_UI_ROUTES) {
    it(`UI·示例区可见：${route.label}（${route.path}）`, async (t) => {
      if (!t?.browser?.goto) return;
      await sharedEnv.goto(t, route.path);
      await sharedEnv.waitDocMainReady(t);
      /** 冷编译／hydration：正文先出水时「示例」块可能稍后才挂上（ContextMenu 等桌面页） */
      let result: { ok: boolean; reason: string } = {
        ok: false,
        reason: "not-probed",
      };
      const deadline = Date.now() + 8_000;
      while (Date.now() < deadline) {
        result = await t.browser.evaluate(() => {
          const main = document.querySelector("main");
          if (!main) return { ok: false, reason: "no-main" };
          const heads = Array.from(main.querySelectorAll("h1, h2, h3, h4"));
          const demoHead = heads.find((h) =>
            (h.textContent || "").includes("示例")
          );
          const isVisibleBox = (el: Element) => {
            const r = (el as HTMLElement).getBoundingClientRect();
            if (!(r.width >= 100 && r.height >= 32 && r.bottom > 0)) {
              return null;
            }
            const inView = r.top < innerHeight && r.left < innerWidth;
            const notHugeOffscreen = r.left > -innerWidth &&
              r.top > -innerHeight;
            return {
              ok: inView && notHugeOffscreen,
              reason: inView && notHugeOffscreen ? "ok" : "offscreen",
              w: r.width,
              h: r.height,
              top: r.top,
              left: r.left,
            };
          };
          if (demoHead) {
            // 先看示例标题下的预览盒（rounded-xl / dashed），避免中途祖先 offscreen 误杀
            let root: Element | null = demoHead.parentElement;
            for (let d = 0; d < 8 && root && root !== main; d++) {
              const boxes = root.querySelectorAll(
                "[class*='rounded-xl'], [class*='border-dashed'], [class*='border']",
              );
              for (let i = 0; i < boxes.length; i++) {
                const hit = isVisibleBox(boxes[i]!);
                if (hit?.ok) {
                  return { ...hit, reason: "demo-under-head" };
                }
              }
              root = root.parentElement;
            }
            let section: Element | null = demoHead.parentElement;
            let offscreenHit: {
              ok: boolean;
              reason: string;
              w?: number;
              h?: number;
            } | null = null;
            for (let i = 0; i < 8 && section && section !== main; i++) {
              const hit = isVisibleBox(section);
              if (hit?.ok) return hit;
              if (hit && !hit.ok) offscreenHit = hit;
              section = section.parentElement;
            }
            if (offscreenHit) return offscreenHit;
          }
          // 兜底：main 内任意有尺寸的示例容器
          const demos = main.querySelectorAll(
            "[class*='rounded-xl'], [class*='border-dashed'], [class*='border']",
          );
          for (let i = 0; i < demos.length; i++) {
            const hit = isVisibleBox(demos[i]!);
            if (hit?.ok) {
              return { ...hit, reason: "demo-box" };
            }
          }
          if (!demoHead) return { ok: false, reason: "no-demo-head" };
          return { ok: false, reason: "no-visible-demo" };
        }) as { ok: boolean; reason: string };
        if (result.ok) break;
        await sharedEnv.delay(120);
      }
      if (!result.ok) {
        throw new Error(
          `UI layout ${route.label} ${route.path}: ${JSON.stringify(result)}`,
        );
      }
      expect(result.ok).toBe(true);
    }, DOCS_BROWSER_CONFIG);
  }
});
