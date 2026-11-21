/** @jsxImportSource @dreamer/view */
/**
 * NoticeBar：速度档、一条一条滚、纵向滚动、关闭确认与 closeKey。
 */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { renderToString } from "@dreamer/view/ssr";
import { describe, expect, it } from "@dreamer/test";
import {
  NoticeBar,
  noticeBarSpeedPx,
} from "../../src/shared/feedback/NoticeBar.tsx";
import {
  ALERT_CLOSE_COOKIE_VALUE,
  clearAlertCloseCookie,
  isAlertClosed,
} from "../../src/shared/feedback/alert-close-cookie.ts";

const ITEMS = ["第一条维护通知", "第二条版本说明", "第三条认证提醒"];
const CLOSE_KEY = "test-notice-bar-unit-close";

async function flush(ms = 30): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

async function html(
  props: Partial<Parameters<typeof NoticeBar>[0]> = {},
): Promise<string> {
  return String(
    await renderToString(() => <NoticeBar content="一条通知" {...props} />),
  );
}

function mountBar(
  props: Partial<Parameters<typeof NoticeBar>[0]>,
): { host: HTMLDivElement; stop: () => void } {
  const host = document.createElement("div");
  document.body.append(host);
  const stop = mount(() => <NoticeBar {...props} />, host);
  return { host, stop };
}

function confirmPanel(title: string): HTMLElement | null {
  const panels = Array.from(
    document.querySelectorAll("[data-dreamer-popconfirm-panel]"),
  ) as HTMLElement[];
  return panels.find((el) => el.textContent?.includes(title)) ?? null;
}

function confirmButton(
  panel: HTMLElement,
  label: string,
): HTMLButtonElement | undefined {
  return Array.from(panel.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(label)
  ) as HTMLButtonElement | undefined;
}

/** happy-dom in this unit runner has no document location, so cookie writes are dropped. */
function installCookieJar(): () => void {
  const doc = document;
  const map = new Map<string, string>();
  Object.defineProperty(doc, "cookie", {
    configurable: true,
    get() {
      return [...map].map(([key, value]) => `${key}=${value}`).join("; ");
    },
    set(raw: string) {
      const first = String(raw).split(";")[0] ?? "";
      const eq = first.indexOf("=");
      if (eq <= 0) return;
      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1).trim();
      const maxAge = /max-age=(\d+)/i.exec(String(raw));
      if (
        (maxAge && Number(maxAge[1]) <= 0) ||
        /expires=thu, 01 jan 1970/i.test(String(raw))
      ) {
        map.delete(name);
        return;
      }
      map.set(name, value);
    },
  });
  return () => {
    Reflect.deleteProperty(doc, "cookie");
  };
}

describe("noticeBarSpeedPx", () => {
  it("maps presets and positive numbers, and falls back to medium", () => {
    expect(noticeBarSpeedPx("fast")).toBe(120);
    expect(noticeBarSpeedPx("medium")).toBe(60);
    expect(noticeBarSpeedPx("slow")).toBe(30);
    expect(noticeBarSpeedPx()).toBe(60);
    expect(noticeBarSpeedPx(90)).toBe(90);
    expect(noticeBarSpeedPx(0)).toBe(60);
    expect(noticeBarSpeedPx(-10)).toBe(60);
    expect(noticeBarSpeedPx(Number.NaN)).toBe(60);
  });
});

describe("NoticeBar SSR", () => {
  it("renders the message as status and is not closable by default", async () => {
    const h = await html();
    expect(h).toContain('role="status"');
    expect(h).toContain("一条通知");
    expect(h).not.toContain('aria-label="关闭"');
  });

  it("renders a close button when closable, closeConfirm, or closeKey is set", async () => {
    expect(await html({ closable: true })).toContain('aria-label="关闭"');
    expect(await html({ closeConfirm: "确认关闭？" })).toContain(
      'aria-label="关闭"',
    );
    expect(await html({ closeKey: CLOSE_KEY })).toContain('aria-label="关闭"');
  });

  it("does not throw when scrollable text is rendered without requestAnimationFrame", async () => {
    const raf = globalThis.requestAnimationFrame;
    // deno-lint-ignore no-explicit-any
    (globalThis as any).requestAnimationFrame = undefined;
    try {
      const h = await html({
        scrollable: true,
        content: "长文案从右侧进入向左循环滚动示意",
      });
      expect(h).toContain("长文案从右侧进入向左循环滚动示意");
      expect(h).toContain("animate-notice-bar-marquee");
    } finally {
      globalThis.requestAnimationFrame = raf;
    }
  });

  it("renders only the first array item when scrollable, not all items in one row", async () => {
    const h = await html({
      scrollable: true,
      content: ITEMS,
      interval: 3,
    });
    expect(h).toContain(ITEMS[0]);
    expect(h).not.toContain(ITEMS[1]);
    expect(h).not.toContain(ITEMS[2]);
    expect(h).not.toContain("•");
  });

  it("renders the vertical track for direction=vertical", async () => {
    const h = await html({
      scrollable: true,
      direction: "vertical",
      content: ITEMS,
      interval: 4,
    });
    expect(h).toContain("h-[1.5em]");
    expect(h).toContain(ITEMS[0]);
    expect(h).not.toContain(ITEMS[1]);
  });

  it("renders the default info icon when icon is true, colored by tone", async () => {
    const info = await html({ icon: true, tone: "info" });
    expect(info).toContain("text-sky-600");
    expect(info).toContain('viewBox="0 0 24 24"');
    const danger = await html({ icon: true, tone: "danger" });
    expect(danger).toContain("text-red-600");
    expect(danger).toContain('viewBox="0 0 24 24"');
    const success = await html({ icon: true, tone: "success" });
    expect(success).toContain("text-emerald-600");
    const warning = await html({ icon: true, tone: "warning" });
    expect(warning).toContain("text-amber-600");
  });

  it("does not render the default icon when icon is omitted or false", async () => {
    const none = await html();
    expect(none).not.toContain('viewBox="0 0 24 24"');
    const off = await html({ icon: false });
    expect(off).not.toContain('viewBox="0 0 24 24"');
  });

  it("still renders a custom icon node", async () => {
    const h = await html({ icon: <span aria-hidden="true">📢</span> });
    expect(h).toContain("📢");
    expect(h).not.toContain("text-sky-600");
  });

  it("defaults to square corners, and rounded or rounded=true is rounded-lg", async () => {
    const def = await html();
    expect(def).toContain("rounded-none");
    expect(def).not.toContain("rounded-lg");
    const off = await html({ rounded: false });
    expect(off).toContain("rounded-none");
    const on = await html({ rounded: true });
    expect(on).toContain("rounded-lg");
    const sm = await html({ rounded: "sm" });
    expect(sm).toContain("rounded-sm");
    const full = await html({ rounded: "full" });
    expect(full).toContain("rounded-full");
  });
});

describe("NoticeBar mount", () => {
  it("shows one array item at a time and advances after interval", async () => {
    const { host, stop } = mountBar({
      scrollable: true,
      speed: 10_000,
      interval: 0.05,
      content: ITEMS,
    });
    await flush(40);
    const first =
      host.querySelector("[data-dreamer-notice-bar]")?.textContent ??
        "";
    expect(first).toContain(ITEMS[0]);
    expect(first).not.toContain(ITEMS[1]);
    const track = host.querySelector("[data-dreamer-notice-bar-track]");
    expect(track).not.toBeNull();
    // finish enter (min 200ms) + hold + exit + next enter
    const deadline = Date.now() + 2000;
    let text = first;
    while (Date.now() < deadline) {
      text = host.querySelector("[data-dreamer-notice-bar]")?.textContent ?? "";
      if (text.includes(ITEMS[1]) && !text.includes(ITEMS[0])) break;
      if (track) {
        track.dispatchEvent(
          new Event("transitionend", { bubbles: true }),
        );
        const ev = new Event("transitionend", { bubbles: true });
        Object.defineProperty(ev, "propertyName", { value: "transform" });
        track.dispatchEvent(ev);
      }
      await flush(40);
    }
    expect(text).toContain(ITEMS[1]);
    expect(text).not.toContain(ITEMS[0]);
    expect(text).not.toContain(ITEMS[2]);
    stop();
    host.remove();
  });

  it("uses a vertical track and still starts from the first item", async () => {
    const { host, stop } = mountBar({
      scrollable: true,
      direction: "vertical",
      speed: "fast",
      interval: 4,
      content: ITEMS,
    });
    await flush(40);
    const bar = host.querySelector("[data-dreamer-notice-bar]");
    const track = host.querySelector("[data-dreamer-notice-bar-track]");
    expect(bar?.textContent).toContain(ITEMS[0]);
    expect(bar?.textContent).not.toContain(ITEMS[1]);
    expect(track).not.toBeNull();
    const style = (track as HTMLElement).style.transform;
    expect(
      style.includes("translateY") || style === "translate(0)" ||
        style === "",
    ).toBe(true);
    stop();
    host.remove();
  });

  it("hides after the close button is clicked", async () => {
    const { host, stop } = mountBar({
      closable: true,
      content: "可关闭的通知",
    });
    await flush();
    const btn = host.querySelector(
      "[data-dreamer-notice-bar-close]",
    ) as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    btn!.click();
    await flush();
    expect(host.querySelector("[data-dreamer-notice-bar]")).toBeNull();
    stop();
    host.remove();
  });

  it("asks for confirmation before closing, and cancel keeps the bar", async () => {
    const { host, stop } = mountBar({
      closeConfirm: "确认关闭？",
      content: "先确认再关",
    });
    await flush();
    const btn = host.querySelector(
      "[data-dreamer-notice-bar-close]",
    ) as HTMLButtonElement;
    btn.click();
    await flush();
    expect(host.querySelector("[data-dreamer-notice-bar]")).not.toBeNull();
    const panel = confirmPanel("确认关闭？");
    expect(panel).not.toBeNull();
    const cancel = confirmButton(panel!, "取消");
    expect(cancel).toBeDefined();
    cancel!.click();
    await flush();
    expect(host.querySelector("[data-dreamer-notice-bar]")?.textContent)
      .toContain("先确认再关");
    stop();
    host.remove();
  });

  it("writes closeKey and stays hidden after remount", async () => {
    const restoreCookie = installCookieJar();
    clearAlertCloseCookie(CLOSE_KEY);
    const closed = mountBar({
      closeConfirm: "关闭后将不再提示",
      closeKey: CLOSE_KEY,
      content: "写入 cookie 后不再显示",
    });
    await flush();
    const btn = closed.host.querySelector(
      "[data-dreamer-notice-bar-close]",
    ) as HTMLButtonElement;
    btn.click();
    await flush();
    const panel = confirmPanel("关闭后将不再提示");
    expect(panel).not.toBeNull();
    const ok = confirmButton(panel!, "确定");
    expect(ok).toBeDefined();
    ok!.click();
    await flush(80);
    expect(isAlertClosed(CLOSE_KEY)).toBe(true);
    expect(document.cookie).toContain(
      `${CLOSE_KEY}=${ALERT_CLOSE_COOKIE_VALUE}`,
    );
    expect(closed.host.querySelector("[data-dreamer-notice-bar]")).toBeNull();
    closed.stop();
    closed.host.remove();

    const again = mountBar({
      closeConfirm: "关闭后将不再提示",
      closeKey: CLOSE_KEY,
      content: "写入 cookie 后不再显示",
    });
    await flush();
    expect(again.host.querySelector("[data-dreamer-notice-bar]")).toBeNull();
    again.stop();
    again.host.remove();
    clearAlertCloseCookie(CLOSE_KEY);
    restoreCookie();
  });

  it("controlled visible can hide and show again", async () => {
    const visible = createSignal(true);
    const host = document.createElement("div");
    document.body.append(host);
    const stop = mount(
      () => (
        <>
          {() =>
            visible.value
              ? (
                <NoticeBar
                  closable
                  visible={visible}
                  onClose={() => {
                    visible.value = false;
                  }}
                  content="受控条"
                />
              )
              : (
                <button
                  type="button"
                  id="restore"
                  onClick={() => {
                    visible.value = true;
                  }}
                >
                  重新显示
                </button>
              )}
        </>
      ),
      host,
    );
    await flush();
    expect(host.querySelector("[data-dreamer-notice-bar]")?.textContent)
      .toContain("受控条");
    (host.querySelector("[data-dreamer-notice-bar-close]") as HTMLButtonElement)
      .click();
    await flush();
    expect(visible.value).toBe(false);
    expect(host.querySelector("[data-dreamer-notice-bar]")).toBeNull();
    expect(host.querySelector("#restore")).not.toBeNull();
    (host.querySelector("#restore") as HTMLButtonElement).click();
    await flush();
    expect(host.querySelector("[data-dreamer-notice-bar]")?.textContent)
      .toContain("受控条");
    stop();
    host.remove();
  });
});
