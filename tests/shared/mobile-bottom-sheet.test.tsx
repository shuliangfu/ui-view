/** @jsxImportSource @dreamer/view */
/** DOM regression only; native input/geometry lives in docs-browser/operations/mobile-sheets-physical. */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { BottomSheet } from "../../src/mobile/feedback/BottomSheet.tsx";
import { MobilePortalHostScope } from "../../src/mobile/MobilePortalHostScope.tsx";
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 50));
describe("Mobile BottomSheet", () => {
  it("BottomSheet scoped host: one DOM per instance after ref resolves, unique live title IDs, accessible interactive subtree", async () => {
    const first = createSignal(false),
      second = createSignal(false),
      host = document.createElement("div");
    document.body.append(host);
    const before = document.body.style.overflow;
    const stop = mount(() => (
      <MobilePortalHostScope>
        <BottomSheet
          open={first}
          onClose={() => first.value = false}
          title="First sheet"
        >
          First content
        </BottomSheet>
        <BottomSheet
          open={second}
          onClose={() => second.value = false}
          title="Second sheet"
        >
          Second content
        </BottomSheet>
      </MobilePortalHostScope>
    ), host);
    try {
      await flush();
      const portalHost = host.querySelector(
        "[data-dreamer-mobile-portal-host]",
      )!;
      expect(portalHost).toBeTruthy();
      expect(portalHost.getAttribute("aria-hidden")).toBe(null);
      const dialogs = [
        ...host.querySelectorAll<HTMLElement>('[role="dialog"]'),
      ];
      expect(dialogs.length).toBe(2);
      expect(dialogs.every((el) => portalHost.contains(el))).toBe(true);
      const ids = dialogs.map((el) => el.getAttribute("aria-labelledby")!);
      expect(new Set(ids).size).toBe(2);
      expect(ids.map((id) => document.querySelectorAll(`[id="${id}"]`).length))
        .toEqual([1, 1]);
      expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(
        [
          "First sheet",
          "Second sheet",
        ],
      );
      first.value = true;
      await flush();
      const opened = host.querySelector<HTMLElement>('[aria-hidden="false"]')!;
      expect(opened).toBeTruthy();
      expect(opened.classList.contains("pointer-events-auto")).toBe(true);
      expect(opened.classList.contains("pointer-events-none")).toBe(false);
      expect(document.body.style.overflow).toBe(before);
      expect(host.querySelectorAll('[role="dialog"]').length).toBe(2);
      first.value = false;
      await flush();
      expect(host.querySelector('[aria-hidden="false"]')).toBe(null);
      expect(document.body.style.overflow).toBe(before);
    } finally {
      stop();
      host.remove();
    }
  });
});
