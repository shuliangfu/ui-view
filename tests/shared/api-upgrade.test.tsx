/** @jsxImportSource @dreamer/view */
/**
 * t1819 / t1820 API 升级的聚焦单测。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import {
  Avatar,
  AvatarGroup,
  Skeleton,
  Text,
} from "../../src/shared/basic/mod.ts";
import { QRCode } from "../../src/shared/data-display/QRCode.tsx";
import { Form } from "../../src/shared/form/Form.tsx";
import { Input } from "../../src/shared/form/Input.tsx";
import { InputNumber } from "../../src/shared/form/InputNumber.tsx";
import { Search } from "../../src/shared/form/Search.tsx";
import { Select } from "../../src/shared/form/Select.tsx";
import { Slider } from "../../src/shared/form/Slider.tsx";
import { DatePicker } from "../../src/shared/form/DatePicker.tsx";
import { DateTimePicker } from "../../src/shared/form/DateTimePicker.tsx";
import { TimePicker } from "../../src/shared/form/TimePicker.tsx";
import { Tabs } from "../../src/shared/layout/Tabs.tsx";
import {
  computeDropdownFixedStyle,
  getDropdownArrowProps,
} from "../../src/desktop/navigation/Dropdown.tsx";

describe("Typography extras", () => {
  it("applies type, strong, code and a copy button", async () => {
    const h = String(
      await renderToString(() => (
        <Text type="danger" strong code copyable>
          hello
        </Text>
      )),
    );
    expect(h).toContain("text-red-600");
    expect(h).toContain("<strong");
    expect(h).toContain("<code");
    expect(h).toContain("hello");
    expect(h).toContain('aria-label="复制"');
    expect(h).toContain("<svg");
    expect(h).not.toMatch(/>复制</);
  });
});

describe("Avatar shape and group", () => {
  it("uses rounded-md for square and overlaps in a group", async () => {
    const square = String(
      await renderToString(() => <Avatar shape="square">A</Avatar>),
    );
    expect(square).toContain("rounded-md");
    expect(square).not.toContain("rounded-full");
    const group = String(
      await renderToString(() => (
        <AvatarGroup>
          <Avatar>A</Avatar>
          <Avatar>B</Avatar>
        </AvatarGroup>
      )),
    );
    expect(group).toContain("-space-x-2");
  });
});

describe("Skeleton variants", () => {
  it("renders paragraph bars and an avatar circle", async () => {
    const p = String(
      await renderToString(() => <Skeleton variant="paragraph" />),
    );
    expect(p).toContain("flex-col");
    expect(p).toContain("w-2/3");
    const a = String(
      await renderToString(() => <Skeleton variant="avatar" />),
    );
    expect(a).toContain("rounded-full");
    expect(a).toContain("h-10");
  });
});

describe("QRCode icon", () => {
  it("wraps the matrix and overlays an image", async () => {
    const h = String(
      await renderToString(() => <QRCode value="hello" icon="/logo.png" />),
    );
    expect(h).toContain("relative");
    expect(h).toContain('src="/logo.png"');
    expect(h).toContain("data-dreamer-qrcode");
  });
});

describe("Tabs defaultActiveKey and tabPosition", () => {
  it("marks defaultActiveKey as selected and uses a left border", async () => {
    const h = String(
      await renderToString(() => (
        <Tabs
          defaultActiveKey="b"
          tabPosition="left"
          items={[
            { key: "a", label: "A", children: "one" },
            { key: "b", label: "B", children: "two" },
          ]}
        />
      )),
    );
    expect(h).toContain("border-r");
    expect(h).toContain("two");
    expect(h).toContain('data-tab-key="b"');
    expect(h).toContain("aria-selected");
  });
});

describe("Form disabled context", () => {
  it("disables a nested Input", async () => {
    const h = String(
      await renderToString(() => (
        <Form disabled>
          <Input value="x" />
        </Form>
      )),
    );
    expect(h).toContain("disabled");
  });
});

describe("Select allowClear", () => {
  it("shows a sibling clear button when there is a value", async () => {
    const h = String(
      await renderToString(() => (
        <Select
          allowClear
          value="a"
          options={[{ value: "a", label: "甲" }]}
        />
      )),
    );
    expect(h).toContain('aria-label="清除"');
    expect(h).toContain("relative");
  });
});

describe("Search allowClear", () => {
  it("hides the clear button when allowClear is false", async () => {
    const on = String(
      await renderToString(() => <Search value="q" />),
    );
    const off = String(
      await renderToString(() => <Search value="q" allowClear={false} />),
    );
    expect(on).toContain('aria-label="清除"');
    expect(off).not.toContain('aria-label="清除"');
  });
});

describe("InputNumber prefix suffix clear", () => {
  it("renders prefix, suffix and clear", async () => {
    const h = String(
      await renderToString(() => (
        <InputNumber value={3} prefix="¥" suffix="元" allowClear />
      )),
    );
    expect(h).toContain("¥");
    expect(h).toContain("元");
    expect(h).toContain('aria-label="清除"');
    const clearAt = h.indexOf('aria-label="清除"');
    expect(clearAt).toBeGreaterThan(h.indexOf("¥"));
    expect(clearAt).toBeLessThan(h.indexOf("元"));
    expect(clearAt).toBeLessThan(h.indexOf('aria-label="减少"'));
  });
});

describe("Slider marks", () => {
  it("renders labels under the track", async () => {
    const h = String(
      await renderToString(() => (
        <Slider value={50} marks={{ 0: "0", 100: "满" }} />
      )),
    );
    expect(h).toContain("满");
  });
});

describe("Dropdown top placement", () => {
  it("anchors the panel above the trigger", () => {
    const w = globalThis as unknown as {
      window?: { innerWidth: number; innerHeight: number };
    };
    const prev = w.window;
    w.window = { innerWidth: 1280, innerHeight: 800 };
    try {
      const tr = {
        x: 100,
        y: 200,
        width: 40,
        height: 24,
        top: 200,
        left: 100,
        right: 140,
        bottom: 224,
        toJSON: () => ({
          x: 100,
          y: 200,
          width: 40,
          height: 24,
          top: 200,
          left: 100,
          right: 140,
          bottom: 224,
        }),
      } as DOMRect;
      const style = computeDropdownFixedStyle(tr, "topRight", true);
      expect(style.top).toEqual("auto");
      expect(style.right).toEqual(`${1280 - tr.right}px`);
      expect(style.bottom).toEqual(`${800 - tr.top + 8}px`);
      const arrow = getDropdownArrowProps("topRight");
      expect(arrow.style.bottom).toEqual("0");
      expect(arrow.style.right).toEqual("12px");
    } finally {
      if (prev === undefined) {
        delete w.window;
      } else {
        w.window = prev;
      }
    }
  });
});

describe("DatePicker allowClear", () => {
  it("shows a sibling clear button when there is a value", async () => {
    const h = String(
      await renderToString(() => <DatePicker allowClear value="2026-11-18" />),
    );
    expect(h).toContain('aria-label="清除"');
    expect(h).toContain("w-5 shrink-0");
    expect(h).toContain("data-ui-picker-placeholder");
    expect(h).toContain("请选择日期");
  });

  it("reserves space between the value and the icon so clear does not overlap", async () => {
    const withValue = String(
      await renderToString(() => <DatePicker allowClear value="2026-11-16" />),
    );
    const empty = String(
      await renderToString(() => <DatePicker allowClear />),
    );
    expect(withValue).toContain("w-5 shrink-0");
    expect(empty).toContain("w-5 shrink-0");
    expect(empty).not.toContain('aria-label="清除"');
    expect(withValue.indexOf("2026-11-16")).toBeLessThan(
      withValue.indexOf("w-5 shrink-0"),
    );
    expect(withValue.indexOf("w-5 shrink-0")).toBeLessThan(
      withValue.indexOf('aria-label="清除"'),
    );
  });

  it("keeps the reserved slot after the value is cleared, without a visible clear control", async () => {
    const empty = String(
      await renderToString(() => <DatePicker allowClear value="" />),
    );
    expect(empty).not.toContain('aria-label="清除"');
    expect(empty).toContain("w-5 shrink-0");
  });
});

describe("DateTimePicker allowClear", () => {
  it("reserves space between the value and the icon so clear does not overlap", async () => {
    const h = String(
      await renderToString(() => (
        <DateTimePicker allowClear value="2026-11-16 10:00:00" />
      )),
    );
    expect(h).toContain('aria-label="清除"');
    expect(h).toContain("w-5 shrink-0");
    expect(h).toContain("data-ui-picker-placeholder");
    expect(h).toContain("请选择日期时间");
    expect(h.indexOf("w-5 shrink-0")).toBeLessThan(
      h.indexOf('aria-label="清除"'),
    );
    const empty = String(
      await renderToString(() => <DateTimePicker allowClear />),
    );
    expect(empty).not.toContain('aria-label="清除"');
    expect(empty).toContain("w-5 shrink-0");
  });
});

describe("TimePicker allowClear", () => {
  it("reserves space between the value and the icon so clear does not overlap", async () => {
    const h = String(
      await renderToString(() => <TimePicker allowClear value="10:00:00" />),
    );
    expect(h).toContain('aria-label="清除"');
    expect(h).toContain("w-5 shrink-0");
    expect(h).toContain("data-ui-picker-placeholder");
    expect(h).toContain("请选择时间");
    const empty = String(
      await renderToString(() => <TimePicker allowClear />),
    );
    expect(empty).not.toContain('aria-label="清除"');
    expect(empty).toContain("w-5 shrink-0");
  });
});
