/** @jsxImportSource @dreamer/view */
/** DOM units only; physical native mouse/touch proof is in docs-browser/operations/mobile-feedback-*. */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { ShareSheet } from "../../src/mobile/feedback/ShareSheet.tsx";
import { FloatingPanel } from "../../src/mobile/feedback/FloatingPanel.tsx";
import { SwipeCell } from "../../src/mobile/feedback/SwipeCell.tsx";
import { PullRefresh } from "../../src/mobile/feedback/PullRefresh.tsx";
import { MobilePortalHostScope } from "../../src/mobile/MobilePortalHostScope.tsx";
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 40));
describe("Mobile feedback events", () => {
  it("Mobile scoped ShareSheet/FloatingPanel explicitly restore hit testing without locking the body", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const before = document.body.style.overflow, opened = createSignal(true);
    const stop = mount(() => (
      <MobilePortalHostScope>
        <ShareSheet open={opened} options={[{ key: "demo", label: "Demo" }]} />
        <FloatingPanel open={opened}>Content</FloatingPanel>
      </MobilePortalHostScope>
    ), host);
    try {
      await flush();
      const dialogs = [
        ...host.querySelectorAll<HTMLElement>('[role="dialog"]'),
      ];
      expect(dialogs.length).toBe(2);
      expect(
        dialogs.every((el) => el.classList.contains("pointer-events-auto")),
      )
        .toBe(true);
      expect(document.body.style.overflow).toBe(before);
      opened.value = false;
      await flush();
      expect(host.querySelectorAll('[role="dialog"]').length).toBe(0);
    } finally {
      stop();
      host.remove();
    }
  });
  it("SwipeCell never captures an action-button pointerdown; content still starts a swipe", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    let clicks = 0, captures = 0;
    const stop = mount(
      () => (
        <SwipeCell
          rightActions={[{
            text: "Action",
            onClick: () => clicks++,
          }]}
        >
          <div data-content="">Content</div>
        </SwipeCell>
      ),
      host,
    );
    try {
      await flush();
      const root = host.querySelector<HTMLElement>("[data-swipe-cell]")!;
      root.setPointerCapture = () => captures++;
      const down = () =>
        Object.assign(
          new MouseEvent("pointerdown", {
            bubbles: true,
            button: 0,
            clientX: 100,
          }),
          { pointerId: 1, isPrimary: true, pointerType: "mouse" },
        );
      const action = root.querySelector("button")!;
      action.dispatchEvent(down());
      action.click();
      expect(clicks).toBe(1);
      expect(captures).toBe(0);
      root.querySelector("[data-content]")!.dispatchEvent(down());
      expect(captures).toBe(1);
    } finally {
      stop();
      host.remove();
    }
  });
  it("PullRefresh controlled loading updates actual label/spinner and returns to collapsed idle", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const loading = createSignal(false),
      stop = mount(() => (
        <PullRefresh loading={loading}>
          <div>Rows</div>
        </PullRefresh>
      ), host);
    try {
      await flush();
      const label = () =>
        host.querySelector("[data-pull-refresh-label]")!.textContent;
      expect(label()).toBe("下拉即可刷新...");
      loading.value = true;
      await flush();
      expect(label()).toBe("加载中...");
      expect(host.querySelectorAll(".animate-spin").length).toBe(1);
      expect(
        host.querySelector("[data-pull-refresh-head]")!.classList.contains(
          "opacity-100",
        ),
      ).toBe(true);
      loading.value = false;
      await flush();
      expect(label()).toBe("下拉即可刷新...");
      expect(host.querySelectorAll(".animate-spin").length).toBe(0);
      expect(
        host.querySelector("[data-pull-refresh-head]")!.classList.contains(
          "opacity-0",
        ),
      ).toBe(true);
    } finally {
      stop();
      host.remove();
    }
  });
});
