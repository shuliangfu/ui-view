/** @jsxImportSource @dreamer/view */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import {
  Cascader,
  type CascaderOption,
} from "../../src/shared/form/Cascader.tsx";
import { pressEventLikelyInsideRoot } from "../../src/shared/form/inline-dropdown-outside-click.ts";
import {
  type PickerOverlayDisposeSlot,
  registerPickerFixedOverlayPositionAndOutsideClick,
} from "../../src/shared/form/picker-portal-utils.ts";
import { DatePicker } from "../../src/shared/form/DatePicker.tsx";
import { DateTimePicker } from "../../src/shared/form/DateTimePicker.tsx";
import { TimePicker } from "../../src/shared/form/TimePicker.tsx";
const flush = () => new Promise((resolve) => setTimeout(resolve, 40));
function button(host: HTMLElement, text: string) {
  const el = [...host.querySelectorAll("button")].find((el) =>
    el.textContent?.trim() === text
  );
  if (!el) throw new Error("missing button " + text);
  return el;
}

describe("Hierarchy and time reactivity", () => {
  it("Cascader closes when the selected lazy node resolves to an empty leaf", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    let resolve: (kids: CascaderOption[]) => void = () => {};
    const loadChildren = () =>
      new Promise<CascaderOption[]>((r) => resolve = r);
    const val = createSignal<string[]>([]);
    const stop = mount(
      () => (
        <Cascader
          value={val}
          options={[{ value: "a", label: "A" }]}
          loadChildren={loadChildren}
        />
      ),
      host,
    );
    try {
      await flush();
      const trigger = host.querySelector(
        "button[aria-haspopup]",
      )! as HTMLButtonElement;
      trigger.click();
      await flush();
      button(host, "A").click();
      await flush();
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      resolve([]);
      await flush();
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(val.value).toEqual(["a"]);
    } finally {
      stop();
      host.remove();
    }
  });

  it("Cascader ignores an old empty response when a different branch is now selected", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const pending = new Map<string, (kids: CascaderOption[]) => void>();
    const val = createSignal<string[]>([]);
    const stop = mount(
      () => (
        <Cascader
          value={val}
          options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]}
          loadChildren={(path) =>
            new Promise<CascaderOption[]>((r) =>
              pending.set(path.join("/"), r)
            )}
        />
      ),
      host,
    );
    try {
      await flush();
      const trigger = host.querySelector(
        "button[aria-haspopup]",
      )! as HTMLButtonElement;
      trigger.click();
      await flush();
      button(host, "A").click();
      await flush();
      button(host, "B").click();
      await flush();
      expect(pending.has("a")).toBe(true);
      expect(pending.has("b")).toBe(true);
      pending.get("a")!([]);
      await flush();
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(val.value).toEqual(["b"]);
      pending.get("b")!([{ value: "child", label: "Child", isLeaf: true }]);
      await flush();
      button(host, "Child").click();
      await flush();
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(val.value).toEqual(["b", "child"]);
    } finally {
      stop();
      host.remove();
    }
  });

  it("TimePicker multiple previews an empty draft without changing committed hidden data and cancel restores it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal(["09:00", "12:00"]);
    const stop = mount(() => <TimePicker mode="multiple" value={val} />, host);
    try {
      await flush();
      const trigger = host.querySelector(
        "button[aria-haspopup]",
      )! as HTMLButtonElement;
      trigger.click();
      await flush();
      (host.querySelector('button[title="点击移除"]')! as HTMLButtonElement)
        .click();
      await flush();
      (host.querySelector('button[title="点击移除"]')! as HTMLButtonElement)
        .click();
      await flush();
      expect(trigger.getAttribute("aria-label")).toBe("请选择时间");
      expect(host.querySelector("input")!.value).toBe(
        JSON.stringify(["09:00", "12:00"]),
      );
      button(host, "取消").click();
      await flush();
      expect(trigger.getAttribute("aria-label")).toBe("09:00、12:00");
      expect(val.value).toEqual(["09:00", "12:00"]);
    } finally {
      stop();
      host.remove();
    }
  });

  it("outside hit testing does not count an occluded dropdown backdrop behind an external header", () => {
    const root = document.createElement("div"),
      inside = document.createElement("div"),
      cover = document.createElement("div");
    root.append(inside);
    document.body.append(root, cover);
    const descriptor = Object.getOwnPropertyDescriptor(
      document,
      "elementsFromPoint",
    );
    try {
      Object.defineProperty(document, "elementsFromPoint", {
        configurable: true,
        value: () => [cover, inside],
      });
      expect(
        pressEventLikelyInsideRoot(
          new MouseEvent("click", { clientX: 3, clientY: 3 }),
          root,
        ),
      ).toBe(false);
      Object.defineProperty(document, "elementsFromPoint", {
        configurable: true,
        value: () => [inside, cover],
      });
      expect(
        pressEventLikelyInsideRoot(
          new MouseEvent("click", { clientX: 3, clientY: 3 }),
          root,
        ),
      ).toBe(true);
    } finally {
      if (descriptor) {
        Object.defineProperty(document, "elementsFromPoint", descriptor);
      } else Reflect.deleteProperty(document, "elementsFromPoint");
      root.remove();
      cover.remove();
    }
  });

  it("picker outside registration handles the next outside press immediately, ignores internal/trigger, and disposes", () => {
    const host = document.createElement("div"),
      panel = document.createElement("div"),
      trigger = document.createElement("button"),
      outside = document.createElement("button");
    host.append(trigger, panel);
    document.body.append(host, outside);
    let closed = 0;
    const outsideSlot: PickerOverlayDisposeSlot = { dispose: null },
      anchorSlot: PickerOverlayDisposeSlot = { dispose: null };
    try {
      registerPickerFixedOverlayPositionAndOutsideClick(
        panel,
        { current: trigger },
        () => closed++,
        outsideSlot,
        anchorSlot,
        undefined,
        { fixedToViewport: false },
      );
      panel.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      expect(closed).toBe(0);
      outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      expect(closed).toBe(1);
      outsideSlot.dispose?.();
      outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      expect(closed).toBe(1);
    } finally {
      outsideSlot.dispose?.();
      anchorSlot.dispose?.();
      host.remove();
      outside.remove();
    }
  });

  it("DateTimePicker multiple previews removing its final day and cancel retains committed datetime", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const initial = "2026-11-19 08:20", val = createSignal([initial]);
    const stop = mount(
      () => <DateTimePicker mode="multiple" value={val} />,
      host,
    );
    try {
      await flush();
      const trigger = host.querySelector(
        "button[aria-haspopup]",
      )! as HTMLButtonElement;
      trigger.click();
      await flush();
      const date = [
        ...host.querySelectorAll<HTMLButtonElement>("[data-ui-calendar-day]"),
      ].find((el) => el.textContent?.trim() === "19");
      if (!date) throw new Error("missing calendar day");
      date.click();
      await flush();
      expect(trigger.getAttribute("aria-label")).toBe("请选择日期时间");
      expect(host.querySelector("input")!.value).toBe(
        JSON.stringify([initial]),
      );
      button(host, "取消").click();
      await flush();
      expect(trigger.getAttribute("aria-label")).toBe(initial);
      expect(val.value).toEqual([initial]);
    } finally {
      stop();
      host.remove();
    }
  });

  it("DatePicker multiple previews removing its final day without overwriting committed data", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal(["2026-11-19"]);
    const stop = mount(() => <DatePicker mode="multiple" value={val} />, host);
    try {
      await flush();
      const trigger = host.querySelector(
        "button[aria-haspopup]",
      )! as HTMLButtonElement;
      trigger.click();
      await flush();
      const date = [
        ...host.querySelectorAll<HTMLButtonElement>("[data-ui-calendar-day]"),
      ].find((el) => el.textContent?.trim() === "19");
      if (!date) throw new Error("missing day");
      date.click();
      await flush();
      expect(trigger.getAttribute("aria-label")).toBe("请选择日期");
      expect(host.querySelector("input")!.value).toBe(
        JSON.stringify(["2026-11-19"]),
      );
      button(host, "取消").click();
      await flush();
      expect(trigger.getAttribute("aria-label")).toBe("2026-11-19");
    } finally {
      stop();
      host.remove();
    }
  });
});
