/** @jsxImportSource @dreamer/view */
/**
 * Descriptions：标签列宽度（labelColPercent / labelMinWidth）与标签对齐（labelAlign）。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import {
  Descriptions,
  type DescriptionsProps,
  resolveDescriptionsColumnCount,
} from "../../src/shared/data-display/Descriptions.tsx";

async function html(props: DescriptionsProps): Promise<string> {
  return String(await renderToString(() => <Descriptions {...props} />));
}

/** 取出包含「标签：」文本的标签单元格开标签，便于断言对齐 class。 */
function labelOpenTag(h: string, label: string): string {
  const needle = `${label}：`;
  const i = h.indexOf(needle);
  expect(i).toBeGreaterThan(-1);
  const start = h.lastIndexOf("<div", i);
  const end = h.indexOf(">", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return h.slice(start, end + 1);
}

describe("Descriptions 标签列宽与对齐", () => {
  it("缺省 minmax(13.5rem, 38%)，标签垂直 items-start、水平 justify-end 与 text-right", async () => {
    const h = await html({
      column: 1,
      items: [{ label: "姓名", children: "张三" }],
    });
    expect(h).toContain("minmax(13.5rem, 38%)");
    expect(h).toContain("张三");
    const tag = labelOpenTag(h, "姓名");
    expect(tag).toContain("items-start");
    expect(tag).toContain("justify-end");
    expect(tag).toContain("text-right");
  });

  it('自定义 labelColPercent: 28、labelMinWidth: "6rem" → minmax(6rem, 28%)', async () => {
    const h = await html({
      column: 1,
      labelColPercent: 28,
      labelMinWidth: "6rem",
      items: [{ label: "姓名", children: "张三" }],
    });
    expect(h).toContain("minmax(6rem, 28%)");
    expect(h).not.toContain("minmax(13.5rem, 38%)");
  });

  it("labelColPercent 钳位：5 → 12，90 → 85，NaN → 38", async () => {
    const low = await html({
      column: 1,
      labelColPercent: 5,
      items: [{ label: "姓名", children: "张三" }],
    });
    expect(low).toContain("minmax(13.5rem, 12%)");

    const high = await html({
      column: 1,
      labelColPercent: 90,
      items: [{ label: "姓名", children: "李四" }],
    });
    expect(high).toContain("minmax(13.5rem, 85%)");

    const nan = await html({
      column: 1,
      labelColPercent: Number.NaN,
      items: [{ label: "姓名", children: "王五" }],
    });
    expect(nan).toContain("minmax(13.5rem, 38%)");
  });

  it("labelMinWidth 传数字 112 → minmax(112px, …)", async () => {
    const h = await html({
      column: 1,
      labelMinWidth: 112,
      items: [{ label: "姓名", children: "张三" }],
    });
    expect(h).toContain("minmax(112px, 38%)");
  });

  it("span>1 时百分比除以 span，保证与单列项首列对齐", async () => {
    const h = await html({
      column: 2,
      labelColPercent: 28,
      labelMinWidth: "6rem",
      items: [
        { label: "姓名", children: "张三" },
        { label: "同事", children: "李四" },
        { label: "备注", children: "王五推荐", span: 2 },
      ],
    });
    expect(h).toContain("minmax(6rem, 28%)");
    expect(h).toContain("minmax(6rem, 14%)");
  });

  it("外层 labelAlign 对所有行生效，item.labelAlign 只覆盖写了的轴向", async () => {
    const h = await html({
      column: 1,
      labelAlign: { vertical: "center", horizontal: "left" },
      items: [
        { label: "姓名", children: "张三" },
        {
          label: "同事",
          children: "李四",
          labelAlign: { vertical: "bottom" },
        },
        {
          label: "推荐人",
          children: "王五",
          labelAlign: { horizontal: "right" },
        },
      ],
    });

    const nameTag = labelOpenTag(h, "姓名");
    expect(nameTag).toContain("items-center");
    expect(nameTag).toContain("justify-start");
    expect(nameTag).toContain("text-left");
    expect(nameTag).not.toContain("items-start");
    expect(nameTag).not.toContain("justify-end");

    const colleagueTag = labelOpenTag(h, "同事");
    expect(colleagueTag).toContain("items-end");
    expect(colleagueTag).toContain("justify-start");
    expect(colleagueTag).toContain("text-left");
    expect(colleagueTag).not.toContain("items-center");

    const referrerTag = labelOpenTag(h, "推荐人");
    expect(referrerTag).toContain("items-center");
    expect(referrerTag).toContain("justify-end");
    expect(referrerTag).toContain("text-right");
    expect(referrerTag).not.toContain("justify-start");
    expect(referrerTag).not.toContain("text-left");
  });

  it("无效对齐值被忽略，不掉进效果 class", async () => {
    const defaults = await html({
      column: 1,
      labelAlign: {
        vertical: "middle" as never,
        horizontal: "justify" as never,
      } as DescriptionsProps["labelAlign"],
      items: [
        {
          label: "姓名",
          children: "张三",
          labelAlign: { vertical: "stretch" as never },
        },
      ],
    });
    const defaultTag = labelOpenTag(defaults, "姓名");
    expect(defaultTag).toContain("items-start");
    expect(defaultTag).toContain("justify-end");
    expect(defaultTag).toContain("text-right");
    expect(defaultTag).not.toContain("items-middle");
    expect(defaultTag).not.toContain("items-stretch");
    expect(defaultTag).not.toContain("justify-justify");

    const keepOuter = await html({
      column: 1,
      labelAlign: { vertical: "center", horizontal: "left" },
      items: [
        {
          label: "姓名",
          children: "张三",
          labelAlign: {
            vertical: "middle" as never,
            horizontal: "justify" as never,
          },
        },
      ],
    });
    const kept = labelOpenTag(keepOuter, "姓名");
    expect(kept).toContain("items-center");
    expect(kept).toContain("justify-start");
    expect(kept).toContain("text-left");
    expect(kept).not.toContain("items-middle");
    expect(kept).not.toContain("justify-justify");
  });
});

describe("Descriptions 按容器宽度收敛列数", () => {
  it("宽度未知（SSR）时保持上限", () => {
    expect(resolveDescriptionsColumnCount(undefined, 3)).toBe(3);
    expect(resolveDescriptionsColumnCount(Number.NaN, 3)).toBe(3);
    expect(resolveDescriptionsColumnCount(undefined, 0)).toBe(1);
  });

  it("移动端 ≤639.98 为 1 列，平板最多 2 列，电脑端用上限", () => {
    expect(resolveDescriptionsColumnCount(390, 3)).toBe(1);
    expect(resolveDescriptionsColumnCount(639.98, 3)).toBe(1);
    expect(resolveDescriptionsColumnCount(640, 3)).toBe(2);
    expect(resolveDescriptionsColumnCount(1032, 3)).toBe(2);
    expect(resolveDescriptionsColumnCount(1279.98, 3)).toBe(2);
    expect(resolveDescriptionsColumnCount(1280, 3)).toBe(3);
    expect(resolveDescriptionsColumnCount(800, 1)).toBe(1);
    expect(resolveDescriptionsColumnCount(1440, 2)).toBe(2);
  });

  it("SSR 仍按 column 上限写出栅格（未测量不降列）", async () => {
    const h = await html({
      column: 3,
      items: [
        { label: "编码", children: "SKU-9281" },
        { label: "名称", children: "张三" },
        { label: "单价", children: "10" },
      ],
    });
    expect(h).toContain("repeat(3, minmax(0, 1fr))");
    expect(h).toContain('data-descriptions-columns="3"');
  });
});
