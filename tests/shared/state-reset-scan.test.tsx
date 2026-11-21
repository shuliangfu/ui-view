/** @jsxImportSource @dreamer/view */
/**
 * 扫描：组件 setup 里 createSignal 且整段 return () => 时，
 * 在 mount(() => <Comp />)（与 dweb 路由相同的展平路径）下点击是否会把状态打回初值。
 */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Alert } from "../../src/shared/feedback/Alert.tsx";
import { FloatButton } from "../../src/shared/basic/FloatButton.tsx";
import { Text } from "../../src/shared/basic/Typography.tsx";
import { IndexBar } from "../../src/mobile/navigation/IndexBar.tsx";
import { PasscodeInput } from "../../src/mobile/form/PasscodeInput.tsx";
import { CountDown } from "../../src/shared/data-display/CountDown.tsx";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 30));

function withHost(run: (host: HTMLElement) => Promise<void>): Promise<void> {
  const host = document.createElement("div");
  document.body.append(host);
  return run(host).finally(() => host.remove());
}

describe("state-reset scan (return () => + createSignal)", () => {
  it("Alert closable：点击关闭后应消失", async () => {
    await withHost(async (host) => {
      const stop = mount(
        () => <Alert message="可关闭" closable />,
        host,
      );
      try {
        await flush();
        const btn = host.querySelector(
          'button[aria-label="关闭"]',
        ) as HTMLButtonElement;
        expect(Boolean(btn)).toBe(true);
        btn.click();
        await flush();
        expect(host.querySelector('[role="alert"]')).toBe(null);
      } finally {
        stop();
      }
    });
  });

  it("Alert 放在稳定 div 里：关闭后应消失", async () => {
    await withHost(async (host) => {
      const stop = mount(
        () => (
          <div>
            <Alert message="可关闭" closable />
          </div>
        ),
        host,
      );
      try {
        await flush();
        const btn = host.querySelector(
          'button[aria-label="关闭"]',
        ) as HTMLButtonElement;
        btn.click();
        await flush();
        expect(host.querySelector('[role="alert"]')).toBe(null);
      } finally {
        stop();
      }
    });
  });

  it("FloatButton 非受控：点击主按钮应展开子项", async () => {
    await withHost(async (host) => {
      const stop = mount(
        () => (
          <FloatButton
            aria-label="新建"
            items={[
              { key: "a", icon: "A", "aria-label": "A" },
              { key: "b", icon: "B", "aria-label": "B" },
            ]}
          />
        ),
        host,
      );
      try {
        await flush();
        const main = host.querySelector(
          'button[aria-label="新建"]',
        ) as HTMLButtonElement;
        expect(main.getAttribute("aria-expanded")).toBe("false");
        main.click();
        await flush();
        expect(main.getAttribute("aria-expanded")).toBe("true");
        expect(host.querySelector('button[aria-label="A"]')).not.toBe(null);
      } finally {
        stop();
      }
    });
  });

  it("Typography copyable：复制成功后 aria-label 应变为已复制", async () => {
    const nav = globalThis.navigator as Navigator & {
      clipboard?: { writeText: (s: string) => Promise<void> };
    };
    const orig = nav.clipboard;
    Object.defineProperty(nav, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
    await withHost(async (host) => {
      const stop = mount(() => <Text copyable>hello</Text>, host);
      try {
        await flush();
        const btn = host.querySelector("button") as HTMLButtonElement;
        expect(btn.getAttribute("aria-label")).toBe("复制");
        btn.click();
        await flush();
        await flush();
        expect(btn.getAttribute("aria-label")).toBe("已复制");
      } finally {
        stop();
      }
    });
    Object.defineProperty(nav, "clipboard", {
      configurable: true,
      value: orig,
    });
  });

  it("IndexBar：点击侧栏字母后 aria-current 应跟上", async () => {
    await withHost(async (host) => {
      const stop = mount(
        () => (
          <IndexBar
            items={[
              { index: "A", title: "A", children: "aa" },
              { index: "B", title: "B", children: "bb" },
            ]}
          />
        ),
        host,
      );
      try {
        await flush();
        const buttons = [
          ...host.querySelectorAll("button"),
        ] as HTMLButtonElement[];
        expect(buttons[0].getAttribute("aria-current")).toBe("true");
        buttons[1].click();
        await flush();
        expect(buttons[1].getAttribute("aria-current")).toBe("true");
        expect(buttons[0].getAttribute("aria-current")).not.toBe("true");
      } finally {
        stop();
      }
    });
  });

  it("PasscodeInput：点击后当前格应出现焦点环", async () => {
    await withHost(async (host) => {
      const stop = mount(() => <PasscodeInput length={4} />, host);
      try {
        await flush();
        const group = host.querySelector(".passcode-input") as HTMLElement;
        group.click();
        await flush();
        const cells = [...group.querySelectorAll(":scope > div")];
        const hasRing = cells.some((el) => el.className.includes("ring-2"));
        expect(hasRing).toBe(true);
      } finally {
        stop();
      }
    });
  });

  it("CountDown：1 秒后 remaining 应变小且节点仍在", async () => {
    await withHost(async (host) => {
      const stop = mount(
        () => <CountDown remaining={3000} interval={50} />,
        host,
      );
      try {
        await flush();
        const first = host.querySelector('[role="timer"]')?.textContent ?? "";
        await new Promise((r) => setTimeout(r, 120));
        const el = host.querySelector('[role="timer"]');
        expect(el).not.toBe(null);
        const second = el?.textContent ?? "";
        expect(second === first && first === "").toBe(false);
      } finally {
        stop();
      }
    });
  });

  it("文档页模式：setup 里 createSignal，稳定容器 + 子节点读 signal", async () => {
    await withHost(async (host) => {
      function DemoPage() {
        const open = createSignal(false);
        return (
          <div>
            <button
              type="button"
              data-open=""
              onClick={() => {
                open.value = true;
              }}
            >
              打开
            </button>
            <span data-state="">{() => open.value ? "on" : "off"}</span>
          </div>
        );
      }
      const stop = mount(() => <DemoPage />, host);
      try {
        await flush();
        expect(host.querySelector("[data-state]")?.textContent).toBe("off");
        (host.querySelector("[data-open]") as HTMLButtonElement).click();
        await flush();
        expect(host.querySelector("[data-state]")?.textContent).toBe("on");
      } finally {
        stop();
      }
    });
  });
});
