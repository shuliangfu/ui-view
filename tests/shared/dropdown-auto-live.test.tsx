/** @jsxImportSource @dreamer/view */
/** Geometry unit regression only; native wheel/click proof lives in dropdown-physical.test.ts. */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Dropdown } from "../../src/desktop/navigation/Dropdown.tsx";
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 80));
describe("Dropdown auto live", () => {
  for (const arrow of [false, true]) {
    it(`Dropdown auto live measures scroll/resize and includes ${arrow ? 8 : 4}px arrow/compact gap`, async () => {
      const proto = HTMLElement.prototype,
        original = proto.getBoundingClientRect,
        html = document.documentElement;
      const innerWidthDescriptor = Object.getOwnPropertyDescriptor(
          globalThis.window,
          "innerWidth",
        ),
        innerHeightDescriptor = Object.getOwnPropertyDescriptor(
          globalThis.window,
          "innerHeight",
        );
      const widthDescriptor = Object.getOwnPropertyDescriptor(
          html,
          "clientWidth",
        ),
        heightDescriptor = Object.getOwnPropertyDescriptor(
          html,
          "clientHeight",
        );
      let vw = 800, top = 100;
      Object.defineProperty(html, "clientWidth", {
        get: () => vw,
        configurable: true,
      });
      Object.defineProperty(html, "clientHeight", {
        get: () => 600,
        configurable: true,
      });
      const rect = (
        x: number,
        y: number,
        width: number,
        height: number,
      ): DOMRect => ({
        x,
        y,
        width,
        height,
        top: y,
        left: x,
        right: x + width,
        bottom: y + height,
        toJSON: () => ({ x, y, width, height }),
      });
      Object.defineProperty(globalThis.window, "innerWidth", {
        get: () => vw,
        configurable: true,
      });
      Object.defineProperty(globalThis.window, "innerHeight", {
        get: () => 600,
        configurable: true,
      });
      proto.getBoundingClientRect = function () {
        return this.classList.contains("overflow-visible")
          ? rect(0, 0, 120, 82)
          : rect(300, top, 90, 38);
      };
      const opened = createSignal(false), host = document.createElement("div");
      document.body.append(host);
      const stop = mount(
        () => (
          <Dropdown
            placement="auto"
            arrow={arrow}
            open={opened}
            onOpenChange={(v) => opened.value = v}
            overlay={<button type="button">Action</button>}
          >
            <button type="button">Open</button>
          </Dropdown>
        ),
        host,
      );
      try {
        opened.value = true;
        await flush();
        const panel = document.querySelector('[role="menu"]')!.parentElement!;
        const gap = arrow ? 8 : 4;
        expect(panel.style.top).toBe(`${138 + gap}px`);
        expect(panel.style.bottom).toBe("auto");
        // Enough room for the panel alone, not its required gap: must flip without reopening.
        top = 600 - 38 - 82 - gap / 2;
        await flush();
        expect(panel.style.bottom).toBe(`${600 - top + gap}px`);
        expect(panel.style.top).toBe("auto");
        top = 100;
        await flush();
        expect(panel.style.top).toBe(`${138 + gap}px`);
        expect(panel.style.bottom).toBe("auto");
        vw = 400;
        globalThis.window.dispatchEvent(new Event("resize"));
        await flush();
        expect(panel.style.right).toBe("10px");
        expect(panel.style.left).toBe("auto");
        expect(opened.value).toBe(true);
        expect(document.querySelectorAll('[role="menu"]').length).toBe(1);
      } finally {
        stop();
        host.remove();
        proto.getBoundingClientRect = original;
        for (
          const [key, descriptor] of [["innerWidth", innerWidthDescriptor], [
            "innerHeight",
            innerHeightDescriptor,
          ]] as const
        ) {
          if (descriptor) {
            Object.defineProperty(globalThis.window, key, descriptor);
          } else Reflect.deleteProperty(globalThis.window, key);
        }
        for (
          const [key, descriptor] of [["clientWidth", widthDescriptor], [
            "clientHeight",
            heightDescriptor,
          ]] as const
        ) {
          if (descriptor) Object.defineProperty(html, key, descriptor);
          else Reflect.deleteProperty(html, key);
        }
      }
    });
  }
});
