/** @jsxImportSource @dreamer/view */
/** Esc 注册必须跟随展开态；预构造的关闭菜单不能抢占，卸载时不能留下回调。 */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import {
  Dropdown,
  initDropdownEsc,
} from "../../src/desktop/navigation/Dropdown.tsx";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 40));
describe("Dropdown escape", () => {
  it("Dropdown Esc follows the opened menu, not the last constructed closed menu", async () => {
    const first = createSignal(false), second = createSignal(false);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stopEsc = initDropdownEsc();
    const stop = mount(() => (
      <>
        <Dropdown
          open={first}
          onOpenChange={(v) => first.value = v}
          overlay={<div>first menu</div>}
        >
          <button type="button">first</button>
        </Dropdown>
        <Dropdown
          open={second}
          onOpenChange={(v) => second.value = v}
          overlay={<div>second menu</div>}
        >
          <button type="button">second</button>
        </Dropdown>
      </>
    ), host);
    const g = globalThis as unknown as Record<string, unknown>;
    try {
      await flush();
      expect(g.__lastDropdownClose).toBeUndefined();
      first.value = true;
      await flush();
      expect(typeof g.__lastDropdownClose).toBe("function");
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      await flush();
      expect(first.value).toBe(false);
      expect(second.value).toBe(false);
      expect(g.__lastDropdownClose).toBeUndefined();
      second.value = true;
      await flush();
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      await flush();
      expect(second.value).toBe(false);
      first.value = true;
      await flush();
    } finally {
      stop();
      stopEsc?.();
      host.remove();
    }
    expect(g.__lastDropdownClose).toBeUndefined();
  });

  it("Dropdown Esc capture consumes only an active popup; the next Esc reaches its containing modal", async () => {
    const opened = createSignal(false), host = document.createElement("div");
    document.body.appendChild(host);
    let modalEscapes = 0;
    const onModalKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") modalEscapes++;
    };
    // Modal may have registered first; listener registration order must not decide ownership.
    document.addEventListener("keydown", onModalKey);
    const stopEsc = initDropdownEsc();
    const stop = mount(
      () => (
        <Dropdown
          open={opened}
          onOpenChange={(v) => opened.value = v}
          overlay={<div>child popup</div>}
        >
          <button type="button">child</button>
        </Dropdown>
      ),
      host,
    );
    try {
      opened.value = true;
      await flush();
      const first = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(first);
      await flush();
      expect(opened.value).toBe(false);
      expect(first.defaultPrevented).toBe(true);
      expect(modalEscapes).toBe(0);
      const second = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(second);
      await flush();
      expect(second.defaultPrevented).toBe(false);
      expect(modalEscapes).toBe(1);
    } finally {
      stop();
      stopEsc?.();
      document.removeEventListener("keydown", onModalKey);
      host.remove();
    }
  });
});
