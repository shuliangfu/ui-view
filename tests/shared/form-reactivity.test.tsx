/** @jsxImportSource @dreamer/view */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { InputNumber } from "../../src/shared/form/InputNumber.tsx";
import { Rate } from "../../src/shared/form/Rate.tsx";
import { Slider } from "../../src/shared/form/Slider.tsx";
import { Search } from "../../src/shared/form/Search.tsx";
import { bindNativeFocusEvents } from "../../src/shared/form/native-focus-events.ts";
import { Password } from "../../src/shared/form/Password.tsx";
import { Textarea } from "../../src/shared/form/Textarea.tsx";
import { MultiSelect } from "../../src/shared/form/MultiSelect.tsx";
import { Form } from "../../src/shared/form/Form.tsx";
import { FormItem } from "../../src/shared/form/FormItem.tsx";
import { Input } from "../../src/shared/form/Input.tsx";
import { createForm } from "../../src/shared/form/create-form.ts";
const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 30));
};

describe("Form reactivity", () => {
  it("Password showPassword signal updates native type without replacing the input", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const shown = createSignal(false), val = createSignal("secret");
    const stop = mount(
      () => (
        <Password
          value={val}
          showPassword={shown}
          onToggleShow={() => {
            shown.value = !shown.value;
          }}
        />
      ),
      host,
    );
    try {
      await flush();
      const input = host.querySelector("input")!;
      input.focus();
      expect(input.type).toBe("password");
      host.querySelector("button")!.click();
      await flush();
      expect(host.querySelector("input")).toBe(input);
      expect(input.type).toBe("text");
      expect(input.value).toBe("secret");
      expect(host.querySelector("button")!.getAttribute("aria-label")).toBe(
        "隐藏密码",
      );
      host.querySelector("button")!.click();
      await flush();
      expect(input.type).toBe("password");
      expect(input.value).toBe("secret");
    } finally {
      stop();
      host.remove();
    }
  });

  it("Textarea remaining counter follows input and clear without replacing the textarea", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("");
    const stop = mount(() => <Textarea value={val} maxLength={10} />, host);
    try {
      await flush();
      const input = host.querySelector("textarea")!;
      input.focus();
      input.value = "12345";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await flush();
      expect(host.textContent).toContain("剩余 5 / 10");
      expect(host.querySelector("textarea")).toBe(input);
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await flush();
      expect(host.textContent).toContain("剩余 10 / 10");
    } finally {
      stop();
      host.remove();
    }
  });

  it("FormItem updates bound control aria-invalid with errors while retaining the input node", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const form = createForm({ initialValues: { name: "" } });
    const stop = mount(() => (
      <Form form={form}>
        <FormItem name="name">
          <Input {...form.bind("name")} />
        </FormItem>
      </Form>
    ), host);
    try {
      await flush();
      const input = host.querySelector("input")!;
      form.setFieldError("name", "required");
      await flush();
      expect(input.getAttribute("aria-invalid")).toBe("true");
      form.clearFieldError("name");
      await flush();
      expect(input.getAttribute("aria-invalid")).toBe("false");
      expect(host.querySelector("input")).toBe(input);
    } finally {
      stop();
      host.remove();
    }
  });

  it("MultiSelect deduplicates a held pointer click but not an independent detail-zero activation", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal<string[]>([]);
    const stop = mount(
      () => (
        <MultiSelect
          value={val}
          options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]}
        />
      ),
      host,
    );
    try {
      await flush();
      const option = () => host.querySelector('[role="option"]') as HTMLElement;
      option().dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, button: 0 }),
      );
      await flush();
      option().dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 1 }),
      );
      await flush();
      expect(val()).toEqual(["a"]);
      option().click();
      await flush();
      expect(val()).toEqual([]);
      option().dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, button: 0 }),
      );
      option().dispatchEvent(new Event("pointercancel", { bubbles: true }));
      option().click();
      await flush();
      expect(val()).toEqual([]);
    } finally {
      stop();
      host.remove();
    }
  });

  it("InputNumber native focus/blur exposes raw value, clamps and formats without replacing input", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal("1234.567");
    let focuses = 0, blurs = 0;
    const stop = mount(
      () => (
        <InputNumber
          value={val}
          min={0}
          max={2000}
          precision={2}
          formatter={(n) => n.toLocaleString("en-US")}
          onFocus={() => focuses++}
          onBlur={() => blurs++}
        />
      ),
      host,
    );
    try {
      await flush();
      const input = host.querySelector("input")!;
      expect(input.value).toBe("1,234.57");
      input.focus();
      await flush();
      expect(input.value).toBe("1234.567");
      expect(focuses).toBe(1);
      input.value = "-3";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await flush();
      input.blur();
      await flush();
      expect(input.value).toBe("0");
      expect(val.value).toBe("0");
      expect(blurs).toBe(1);
      expect(host.querySelector("input")).toBe(input);
    } finally {
      stop();
      host.remove();
    }
  });

  it("Search forwards native focus/blur exactly once and removes listeners on disposal", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    let focuses = 0, blurs = 0;
    const stop = mount(
      () => <Search onFocus={() => focuses++} onBlur={() => blurs++} />,
      host,
    );
    try {
      await flush();
      const input = host.querySelector("input")!;
      input.focus();
      input.blur();
      expect(focuses).toBe(1);
      expect(blurs).toBe(1);
      input.focus();
      input.blur();
      expect(focuses).toBe(2);
      expect(blurs).toBe(2);
      stop();
      input.dispatchEvent(new Event("focus"));
      input.dispatchEvent(new Event("blur"));
      expect(focuses).toBe(2);
      expect(blurs).toBe(2);
    } finally {
      stop();
      host.remove();
    }
  });

  it("native focus ref detaches replaced nodes and does not double-bind the same node", () => {
    const host = document.createElement("div");
    document.body.append(host);
    let focusCount = 0;
    let bind: (el: HTMLInputElement | null) => void = () => {};
    const stop = mount(() => {
      bind = bindNativeFocusEvents<HTMLInputElement>(
        () => {},
        () => focusCount++,
      );
      return <div />;
    }, host);
    try {
      const first = document.createElement("input"),
        second = document.createElement("input");
      bind(first);
      bind(first);
      first.dispatchEvent(new Event("focus"));
      expect(focusCount).toBe(1);
      bind(second);
      first.dispatchEvent(new Event("focus"));
      expect(focusCount).toBe(1);
      second.dispatchEvent(new Event("focus"));
      expect(focusCount).toBe(2);
      bind(null);
      second.dispatchEvent(new Event("focus"));
      expect(focusCount).toBe(2);
    } finally {
      stop();
      host.remove();
    }
  });

  it("Rate exposes initial and changing aria-valuenow while retaining its root", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal(3.5);
    const stop = mount(() => <Rate value={val} allowHalf />, host);
    try {
      await flush();
      const root = host.querySelector('[role="slider"]')!;
      expect(root.getAttribute("aria-valuenow")).toBe("3.5");
      val.value = 4;
      await flush();
      expect(root.getAttribute("aria-valuenow")).toBe("4");
      expect(host.querySelector('[role="slider"]')).toBe(root);
    } finally {
      stop();
      host.remove();
    }
  });

  it("Slider range preserves zero for either endpoint instead of replacing it with max", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const val = createSignal<[number, number]>([20, 80]);
    const stop = mount(
      () => <Slider range value={val} min={0} max={100} />,
      host,
    );
    try {
      await flush();
      const inputs = host.querySelectorAll("input");
      inputs[1].value = "0";
      inputs[1].dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
      expect(val.value).toEqual([0, 20]);
      expect(inputs[0].value).toBe("0");
      expect(inputs[1].value).toBe("20");
      inputs[1].value = "30";
      inputs[1].dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
      expect(val.value).toEqual([0, 30]);
    } finally {
      stop();
      host.remove();
    }
  });

  it("Slider createForm.bind preserves numeric range values and does not reset DOM to min", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const form = createForm({ initialValues: { score: 50 } });
    const stop = mount(() => (
      <Form form={form}>
        <Slider {...form.bind("score")} min={0} max={100} />
      </Form>
    ), host);
    try {
      await flush();
      const input = host.querySelector("input")!;
      expect(input.value).toBe("50");
      input.value = "51";
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
      expect(form.values().score).toBe(51);
      expect(input.value).toBe("51");
    } finally {
      stop();
      host.remove();
    }
  });
});
