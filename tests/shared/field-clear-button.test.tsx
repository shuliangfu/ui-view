/** @jsxImportSource @dreamer/view */
/**
 * allowClear layout: after clear then re-enter, the button stays in its
 * reserved slot (not after suffix/steppers) and picker reserve stays intact.
 */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Cascader } from "../../src/shared/form/Cascader.tsx";
import { DatePicker } from "../../src/shared/form/DatePicker.tsx";
import { DateTimePicker } from "../../src/shared/form/DateTimePicker.tsx";
import { Input } from "../../src/shared/form/Input.tsx";
import { InputNumber } from "../../src/shared/form/InputNumber.tsx";
import { MultiSelect } from "../../src/shared/form/MultiSelect.tsx";
import { Search } from "../../src/shared/form/Search.tsx";
import { Select } from "../../src/shared/form/Select.tsx";
import { TimePicker } from "../../src/shared/form/TimePicker.tsx";
import { TreeSelect } from "../../src/shared/form/TreeSelect.tsx";

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, 30);
  });
}

function precedes(a: Element, b: Element): boolean {
  return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !==
    0;
}

function clearButton(
  host: ParentNode,
  label = "清除",
): HTMLElement | null {
  return host.querySelector(`[aria-label="${label}"]`);
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("InputNumber allowClear slot", () => {
  it("keeps the clear button between the value and suffix after clear then retype", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("1234.57");
    const stop = mount(
      () => (
        <InputNumber
          value={val}
          prefix="¥"
          suffix="元"
          precision={2}
          formatter={(n) => n.toLocaleString("en-US")}
          allowClear
        />
      ),
      host,
    );
    try {
      await flush();
      const input = host.querySelector("input") as HTMLInputElement;
      const suffix = [...host.querySelectorAll("span")].find((el) =>
        el.textContent === "元"
      );
      const decrease = host.querySelector(
        'button[aria-label="减少"]',
      ) as HTMLButtonElement;
      const firstClear = clearButton(host);
      expect(input).toBeTruthy();
      expect(suffix).toBeTruthy();
      expect(decrease).toBeTruthy();
      expect(firstClear).toBeTruthy();
      expect(precedes(input, firstClear!)).toBe(true);
      expect(precedes(firstClear!, suffix!)).toBe(true);
      expect(precedes(firstClear!, decrease)).toBe(true);

      firstClear!.click();
      await flush();
      expect(val.value).toBe("");
      expect(input.value).toBe("");
      expect(clearButton(host)).toBeNull();

      typeInto(input, "3");
      await flush();
      expect(val.value).toBe("3");
      const again = clearButton(host);
      expect(again).toBeTruthy();
      expect(precedes(input, again!)).toBe(true);
      expect(precedes(again!, suffix!)).toBe(true);
      expect(precedes(again!, decrease)).toBe(true);
    } finally {
      stop();
      host.remove();
    }
  });
});

describe("Input and Search allowClear slots", () => {
  it("Input trailing clear remounts after the input, not after a later control", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("hello");
    const stop = mount(
      () => <Input value={val} prefix="@" suffix=".com" allowClear />,
      host,
    );
    try {
      await flush();
      const input = host.querySelector("input") as HTMLInputElement;
      const firstClear = clearButton(host);
      expect(firstClear).toBeTruthy();
      expect(precedes(input, firstClear!)).toBe(true);
      firstClear!.click();
      await flush();
      expect(val.value).toBe("");
      expect(clearButton(host)).toBeNull();
      typeInto(input, "x");
      await flush();
      const again = clearButton(host);
      expect(again).toBeTruthy();
      expect(precedes(input, again!)).toBe(true);
    } finally {
      stop();
      host.remove();
    }
  });

  it("Search keeps the clear button in the same wrapper after clear then retype", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("q");
    const stop = mount(
      () => <Search value={val} onSearch={() => {}} />,
      host,
    );
    try {
      await flush();
      const input = host.querySelector("input") as HTMLInputElement;
      const searchBtn = host.querySelector(
        'button[aria-label="搜索"]',
      ) as HTMLButtonElement;
      const firstClear = clearButton(host);
      expect(firstClear).toBeTruthy();
      expect(searchBtn).toBeTruthy();
      expect(precedes(input, firstClear!)).toBe(true);
      expect(precedes(firstClear!, searchBtn)).toBe(true);
      firstClear!.click();
      await flush();
      expect(val.value).toBe("");
      expect(clearButton(host)).toBe(firstClear);
      typeInto(input, "z");
      await flush();
      const again = clearButton(host);
      expect(again).toBe(firstClear);
      expect(precedes(input, again!)).toBe(true);
      expect(precedes(again!, searchBtn)).toBe(true);
    } finally {
      stop();
      host.remove();
    }
  });
});

describe("Select-like allowClear slots", () => {
  it("Select clear stays in the trigger wrapper after clear then reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("a");
    const stop = mount(
      () => (
        <Select
          allowClear
          value={val}
          options={[{ value: "a", label: "甲" }, { value: "b", label: "乙" }]}
        />
      ),
      host,
    );
    try {
      await flush();
      const firstClear = clearButton(host);
      const panel = host.querySelector("[data-ui-select-panel]");
      expect(firstClear).toBeTruthy();
      expect(panel).toBeTruthy();
      expect(firstClear!.parentElement?.className.includes("right-8")).toBe(
        true,
      );
      expect(precedes(firstClear!, panel!)).toBe(true);
      firstClear!.click();
      await flush();
      expect(val.value).toBe("");
      expect(clearButton(host)).toBeNull();
      val.value = "b";
      await flush();
      const again = clearButton(host);
      expect(again).toBeTruthy();
      expect(again!.parentElement?.className.includes("right-8")).toBe(true);
      expect(precedes(again!, panel!)).toBe(true);
    } finally {
      stop();
      host.remove();
    }
  });

  it("MultiSelect clear stays in the trigger wrapper after clear then reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal(["a"]);
    const stop = mount(
      () => (
        <MultiSelect
          allowClear
          value={val}
          options={[{ value: "a", label: "甲" }, { value: "b", label: "乙" }]}
        />
      ),
      host,
    );
    try {
      await flush();
      const firstClear = clearButton(host, "清空");
      const panel = host.querySelector("[data-ui-multiselect-panel]");
      expect(firstClear).toBeTruthy();
      expect(panel).toBeTruthy();
      expect(precedes(firstClear!, panel!)).toBe(true);
      firstClear!.click();
      await flush();
      expect(val.value).toEqual([]);
      expect(clearButton(host, "清空")).toBeNull();
      val.value = ["b"];
      await flush();
      const again = clearButton(host, "清空");
      expect(again).toBeTruthy();
      expect(again!.parentElement?.className.includes("right-8")).toBe(true);
      expect(precedes(again!, panel!)).toBe(true);
    } finally {
      stop();
      host.remove();
    }
  });

  it("Cascader clear stays in the trigger wrapper after clear then reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal(["zhejiang", "hangzhou"]);
    const stop = mount(
      () => (
        <Cascader
          allowClear
          value={val}
          options={[{
            value: "zhejiang",
            label: "浙江",
            children: [{ value: "hangzhou", label: "杭州" }],
          }]}
        />
      ),
      host,
    );
    try {
      await flush();
      const firstClear = clearButton(host);
      const panel = host.querySelector("[data-ui-cascader-panel-wrap]");
      expect(firstClear).toBeTruthy();
      expect(panel).toBeTruthy();
      expect(precedes(firstClear!, panel!)).toBe(true);
      firstClear!.click();
      await flush();
      expect(val.value).toEqual([]);
      expect(clearButton(host)).toBeNull();
      val.value = ["zhejiang", "hangzhou"];
      await flush();
      const again = clearButton(host);
      expect(again).toBeTruthy();
      expect(again!.parentElement?.className.includes("right-8")).toBe(true);
      expect(precedes(again!, panel!)).toBe(true);
    } finally {
      stop();
      host.remove();
    }
  });

  it("TreeSelect clear stays in the trigger wrapper after clear then reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("hangzhou");
    const stop = mount(
      () => (
        <TreeSelect
          allowClear
          value={val}
          options={[{
            value: "zhejiang",
            label: "浙江",
            children: [{ value: "hangzhou", label: "杭州" }],
          }]}
        />
      ),
      host,
    );
    try {
      await flush();
      const firstClear = clearButton(host);
      const panel = host.querySelector("[data-ui-treeselect-panel]");
      expect(firstClear).toBeTruthy();
      expect(panel).toBeTruthy();
      expect(precedes(firstClear!, panel!)).toBe(true);
      firstClear!.click();
      await flush();
      expect(val.value).toBe("");
      expect(clearButton(host)).toBeNull();
      val.value = "hangzhou";
      await flush();
      const again = clearButton(host);
      expect(again).toBeTruthy();
      expect(again!.parentElement?.className.includes("right-8")).toBe(true);
      expect(precedes(again!, panel!)).toBe(true);
    } finally {
      stop();
      host.remove();
    }
  });
});

function assertPickerClearLayout(host: HTMLElement, valueText: string): void {
  const reserve = [...host.querySelectorAll("span")].find((el) =>
    el.className.includes("w-5") && el.className.includes("shrink-0")
  );
  expect(reserve).toBeTruthy();
  const trigger = host.querySelector(
    'button[aria-haspopup="dialog"]',
  ) as HTMLElement | null;
  expect(trigger).toBeTruthy();
  expect(trigger!.contains(reserve!)).toBe(true);
  const clear = clearButton(host);
  if (valueText) {
    expect(clear).toBeTruthy();
    expect(reserve!.contains(clear!)).toBe(true);
    const html = host.innerHTML;
    expect(html.indexOf(valueText)).toBeLessThan(html.indexOf("w-5 shrink-0"));
    expect(html.indexOf("w-5 shrink-0")).toBeLessThan(
      html.indexOf('aria-label="清除"'),
    );
    const iconWrap = reserve!.nextElementSibling as HTMLElement | null;
    expect(iconWrap).toBeTruthy();
    expect(precedes(clear!, iconWrap!)).toBe(true);
  } else {
    expect(clear).toBeNull();
  }
}

describe("Picker allowClear reserved slot", () => {
  it("DatePicker hides clear after clear, keeps the slot, and restores position on reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("2026-11-16");
    const stop = mount(
      () => <DatePicker allowClear value={val} />,
      host,
    );
    try {
      await flush();
      assertPickerClearLayout(host, "2026-11-16");
      clearButton(host)!.click();
      await flush();
      expect(val.value).toBe("");
      assertPickerClearLayout(host, "");
      val.value = "2026-11-18";
      await flush();
      assertPickerClearLayout(host, "2026-11-18");
    } finally {
      stop();
      host.remove();
    }
  });

  it("DateTimePicker hides clear after clear, keeps the slot, and restores position on reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("2026-11-16 10:00:00");
    const stop = mount(
      () => <DateTimePicker allowClear value={val} />,
      host,
    );
    try {
      await flush();
      assertPickerClearLayout(host, "2026-11-16 10:00:00");
      clearButton(host)!.click();
      await flush();
      expect(val.value).toBe("");
      assertPickerClearLayout(host, "");
      val.value = "2026-11-18 11:00:00";
      await flush();
      assertPickerClearLayout(host, "2026-11-18 11:00:00");
    } finally {
      stop();
      host.remove();
    }
  });

  it("TimePicker hides clear after clear, keeps the slot, and restores position on reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("10:00:00");
    const stop = mount(
      () => <TimePicker allowClear value={val} />,
      host,
    );
    try {
      await flush();
      assertPickerClearLayout(host, "10:00:00");
      clearButton(host)!.click();
      await flush();
      expect(val.value).toBe("");
      assertPickerClearLayout(host, "");
      val.value = "11:00:00";
      await flush();
      assertPickerClearLayout(host, "11:00:00");
    } finally {
      stop();
      host.remove();
    }
  });
});

function pickerTrigger(host: HTMLElement): HTMLElement {
  return host.querySelector(
    'button[aria-haspopup="dialog"]',
  ) as HTMLElement;
}

function placeholderSizer(host: HTMLElement): HTMLElement | null {
  return host.querySelector("[data-ui-picker-placeholder]");
}

function gridAreaOf(el: HTMLElement): string {
  return (el.style.gridArea || getComputedStyle(el).gridArea || "")
    .replaceAll(" ", "");
}

function assertPlaceholderSizer(
  host: HTMLElement,
  placeholder: string,
  visible: string,
): void {
  const sizer = placeholderSizer(host);
  expect(sizer).toBeTruthy();
  expect(sizer!.getAttribute("aria-hidden")).not.toBeNull();
  expect(sizer!.className.includes("invisible")).toBe(true);
  expect(sizer!.textContent).toBe(placeholder);
  const label = sizer!.nextElementSibling as HTMLElement | null;
  expect(label).toBeTruthy();
  expect(label!.textContent).toBe(visible);
  const grid = sizer!.parentElement as HTMLElement;
  expect(
    grid.className.includes("inline-grid") ||
      grid.style.display === "inline-grid",
  ).toBe(true);
  expect(
    grid.style.justifyItems === "start" ||
      grid.className.includes("justify-items-start"),
  ).toBe(true);
  expect(gridAreaOf(sizer!).includes("1/1")).toBe(true);
  expect(gridAreaOf(label!).includes("1/1")).toBe(true);
  const trigger = pickerTrigger(host);
  expect(trigger.contains(grid)).toBe(true);
  const sizerW = sizer!.offsetWidth;
  const labelW = label!.offsetWidth;
  if (sizerW > 0 && labelW > 0) {
    expect(label!.offsetLeft).toBe(sizer!.offsetLeft);
    expect(label!.offsetLeft).toBe(0);
  }
}

function triggerWidth(host: HTMLElement): number {
  const el = pickerTrigger(host);
  return el.getBoundingClientRect().width || el.offsetWidth || el.scrollWidth;
}

describe("Picker trigger width stays stable after clear", () => {
  async function assertClearDoesNotWiden(
    host: HTMLElement,
    placeholder: string,
    filled: string,
    reselect: string,
    assign: (next: string) => void,
    stableEmpty = true,
  ): Promise<void> {
    await flush();
    assertPlaceholderSizer(host, placeholder, filled);
    const before = triggerWidth(host);
    const sizerBefore = placeholderSizer(host);
    clearButton(host)!.click();
    await flush();
    assertPlaceholderSizer(host, placeholder, placeholder);
    expect(placeholderSizer(host)).toBe(sizerBefore);
    const afterClear = triggerWidth(host);
    if (before > 0 && afterClear > 0) {
      expect(afterClear > before).toBe(false);
      if (stableEmpty) expect(afterClear).toBe(before);
    }
    assign(reselect);
    await flush();
    assertPlaceholderSizer(host, placeholder, reselect);
    const afterReselect = triggerWidth(host);
    if (before > 0 && afterReselect > 0) {
      expect(afterReselect).toBe(before);
    }
  }

  it("TimePicker does not grow after clear or shrink after reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("14:30");
    const stop = mount(
      () => <TimePicker allowClear value={val} />,
      host,
    );
    try {
      await assertClearDoesNotWiden(
        host,
        "请选择时间",
        "14:30",
        "16:00",
        (next) => {
          val.value = next;
        },
      );
    } finally {
      stop();
      host.remove();
    }
  });

  it("DatePicker does not grow after clear or shrink after reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("2026-11-16");
    const stop = mount(
      () => <DatePicker allowClear value={val} />,
      host,
    );
    try {
      await assertClearDoesNotWiden(
        host,
        "请选择日期",
        "2026-11-16",
        "2026-11-18",
        (next) => {
          val.value = next;
        },
      );
    } finally {
      stop();
      host.remove();
    }
  });

  it("DateTimePicker keeps the placeholder sizer after clear then reselect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("2026-11-16 10:00:00");
    const stop = mount(
      () => <DateTimePicker allowClear value={val} />,
      host,
    );
    try {
      await assertClearDoesNotWiden(
        host,
        "请选择日期时间",
        "2026-11-16 10:00:00",
        "2026-11-18 11:00:00",
        (next) => {
          val.value = next;
        },
        false,
      );
    } finally {
      stop();
      host.remove();
    }
  });

  it("TimePicker short value stays left-aligned with leftover space on the right", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("12:55");
    const stop = mount(
      () => <TimePicker allowClear value={val} />,
      host,
    );
    try {
      await assertClearDoesNotWiden(
        host,
        "请选择时间",
        "12:55",
        "08:01",
        (next) => {
          val.value = next;
        },
      );
      const clear = clearButton(host)!;
      const sizer = placeholderSizer(host)!;
      const grid = sizer.parentElement as HTMLElement;
      expect(precedes(grid, clear)).toBe(true);
      assertPickerClearLayout(host, "08:01");
    } finally {
      stop();
      host.remove();
    }
  });

  it("does not leave a clear slot when allowClear is off", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const stop = mount(
      () => <TimePicker value="14:30" />,
      host,
    );
    try {
      await flush();
      expect(clearButton(host)).toBeNull();
      const reserve = [...host.querySelectorAll("span")].find((el) =>
        el.className.includes("w-5") && el.className.includes("shrink-0")
      );
      expect(reserve).toBeUndefined();
      assertPlaceholderSizer(host, "请选择时间", "14:30");
    } finally {
      stop();
      host.remove();
    }
  });
});
