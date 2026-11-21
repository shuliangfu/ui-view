/** WRITTEN-UNRUN. Eight live Descriptions examples plus two API-only tables; columns follow container width, not the heading. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { docsDemo, eventually, open } from "./driver.ts";

const grid = (root: Locator, title?: string) => {
  const scope = title
    ? root.locator(".descriptions").filter({ hasText: title }).first()
    : root.locator(".descriptions").first();
  return scope.locator("[data-descriptions-columns]");
};

async function actualColumns(g: Locator, max: number) {
  const widthPx = await g.evaluate((e) => e.getBoundingClientRect().width);
  const expected = widthPx <= 639.98
    ? 1
    : widthPx <= 1279.98
    ? Math.min(2, max)
    : max;
  await eventually(async () =>
    await g.getAttribute("data-descriptions-columns") === String(expected)
  );
  expect(await g.getAttribute("data-descriptions-columns")).toBe(
    String(expected),
  );
  const template = await g.evaluate((e) =>
    getComputedStyle(e).gridTemplateColumns.split(/\s+/).filter(Boolean).length
  );
  expect(template).toBe(expected);
  return expected;
}

async function pairs(g: Locator) {
  return await g.locator(":scope > div").evaluateAll((es) =>
    es.map((e) => {
      const c = getComputedStyle(e);
      const label = e.children[0] as HTMLElement | undefined;
      const value = e.children[1] as HTMLElement | undefined;
      const lc = label ? getComputedStyle(label) : undefined;
      return {
        label: (label?.textContent ?? "").trim(),
        value: (value?.textContent ?? "").trim(),
        span: c.gridColumnEnd === "auto"
          ? 1
          : Number(String(c.gridColumnEnd).replace("span ", "")) || 1,
        align: lc?.textAlign ?? "",
        items: lc?.alignItems ?? "",
        justify: lc?.justifyContent ?? "",
        labelPad: lc
          ? [lc.paddingTop, lc.paddingRight, lc.paddingBottom, lc.paddingLeft]
          : [],
        font: lc?.fontSize ?? "",
      };
    })
  );
}

const oneCol = [
  ["ID：", "U-1024-8573"],
  ["状态：", "正常 · 已实名认证 · 企业账户"],
  [
    "注册地详细通信地址（含省市区）：",
    "上海市浦东新区张江高科园区科苑路 88 号某大厦 12 层 1208 室（邮编 201203）",
  ],
  [
    "紧急联系人手机号码（异地）：",
    "+86 138 **** 9210（工作日 9:00–18:00 可接通）",
  ],
  [
    "最近一次登录时间：",
    "2026-03-28 14:32:07（UTC+8）· IP 203.0.113.42 · Chrome 124 / Windows 11",
  ],
  [
    "备注与内部说明：",
    "长文案示例：可含多句说明、编号列表意图、以及「引号」与 URL https://example.com/path?x=1 等混排；右侧与左侧标签列独立换行。",
  ],
];

const twoCol = [
  ["工号：", "E-00912"],
  ["入职日期：", "2024-06-01"],
  ["直属上级（含虚线汇报）：", "李四 / 王五（虚线）"],
  ["城市：", "杭州"],
  ["备注：", "column=2 时一行两组；本行 span:2 占满整行，可写较长说明。"],
];

const sku = [
  ["编码：", "SKU-9281"],
  ["商品全称（含规格）：", "无线降噪耳机 · 黑色 · USB-C 快充盒"],
  ["单价：", "¥ 1,299.00（含税）"],
  [
    "说明：",
    "三列栅格示例：短 label / 长 label / 数值混排；本项写 span=2，行尾空出一列会自动并入本项铺满整行。",
  ],
];

const descriptionsApi = [
  [
    "rows",
    "DescriptionsItem[]",
    "-",
    "描述行（label、children、span、labelAlign、render）；`span` 为跨列数，若本行末尾仍剩空列会自动并入该行最右项铺满，不留空白格",
  ],
  ["title", "string | unknown", "-", "标题"],
  [
    "column",
    "number",
    "3",
    "栅格列数上限：每行最多排几个描述项；要「整行一组 label+内容」用 1，要一行并排多组用 2/3。实际列数按容器宽度收敛：移动端（≤639.98px）1 列，平板（640px–1279.98px）最多 2 列，电脑端（≥1280px）用本值。弹层内按自身宽度计算，避免窄屏把内容挤成竖排。",
  ],
  ["bordered", "boolean", "false", "是否带边框"],
  ["size", "SizeVariant", "-", "尺寸"],
  ["layout", "horizontal | vertical", "-", "布局"],
  ["colon", "boolean", "true", "标签后是否显示冒号"],
  [
    "labelColPercent",
    "number",
    "38",
    "仅横向：标签列占「单列栅格槽位」宽度的百分比（12～85）；项 span>1 时自动换算，与只占一槽时首列竖线对齐；与 labelMinWidth 组成 minmax",
  ],
  [
    "labelMinWidth",
    "string | number",
    '"13.5rem"',
    "仅横向：标签列最小宽度（CSS 长度或像素数字）；适当增大可减少长标签换行。未指定时，容器宽度 ≤639.98px 自动改为 7rem，避免窄屏左侧留白、右侧被挤换行",
  ],
  [
    "labelAlign",
    "DescriptionsLabelAlign",
    '{ vertical: "top", horizontal: "right" }',
    "各行标签的默认对齐。vertical：top 上对齐、center 垂直居中、bottom 下对齐；horizontal：left 左对齐、center 居中、right 右对齐。单项可用 rows[].labelAlign 覆盖",
  ],
  ["labelClass", "string", "-", "标签列 class"],
  ["contentClass", "string", "-", "内容列 class"],
  ["class", "string", "-", "容器 class"],
];

const itemApi = [
  ["label", "string | unknown", "-", "标签（键）"],
  [
    "children",
    "unknown",
    "-",
    "内容（值）；可为文本或自定义节点。有 render 时作为 defaultNode 传入",
  ],
  [
    "span",
    "number",
    "1",
    "跨列数；若本行末尾仍剩空列会自动并入该行最右项铺满，不留空白格",
  ],
  [
    "labelAlign",
    "DescriptionsLabelAlign",
    "继承外层 labelAlign",
    "该行标签对齐，覆盖 Descriptions.labelAlign。vertical：top／center／bottom；horizontal：left／center／right。未写的轴向沿用外层默认",
  ],
  [
    "render",
    "(ctx: DescriptionsItemRenderCtx) => unknown",
    "-",
    "自定义内容区。签名 (ctx) => 节点，ctx 含 item（当前行）、index（在 rows 中的下标）、defaultNode（children 原值，便于包裹或回落）。有本函数时用返回值作为内容，不再直接渲染 children",
  ],
];

describe("Descriptions physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Descriptions 标签一列、内容一列（每行一组 → column=1） @${width}：六组键值、标题边框与 1 列栅格`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/descriptions");
        await p.setViewportSize({ width, height: 900 });
        const root = docsDemo(
          p,
          "标签一列、内容一列（每行一组 → column=1）",
        );
        expect(await root.locator(".descriptions > div").first().innerText())
          .toBe("用户信息");
        const g = grid(root);
        expect(await actualColumns(g, 1)).toBe(1);
        expect(await g.evaluate((e) => getComputedStyle(e).borderTopWidth))
          .toBe(
            "1px",
          );
        const rows = await pairs(g);
        expect(rows.map((r) => [r.label, r.value])).toEqual(oneCol);
        expect(rows.every((r) => r.align === "right")).toBe(true);
        await g.getByText("U-1024-8573", { exact: true }).click({ delay: 180 });
        expect((await pairs(g)).map((r) => [r.label, r.value])).toEqual(oneCol);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Descriptions 每行两组并排（column=2） @${width}：五项文案且列数随容器收敛`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/descriptions");
        await p.setViewportSize({ width, height: 900 });
        const g = grid(docsDemo(p, "每行两组并排（column=2）"));
        const cols = await actualColumns(g, 2);
        const rows = await pairs(g);
        expect(rows.map((r) => [r.label, r.value])).toEqual(twoCol);
        expect(rows[4].span).toBe(cols);
        await g.getByText("杭州", { exact: true }).click({ delay: 180 });
        expect((await pairs(g)).map((r) => r.value)[3]).toBe("杭州");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Descriptions 标题 + 列数 + 边框 @${width}：SKU 四项与按容器收敛的列数`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/descriptions");
        await p.setViewportSize({ width, height: 900 });
        const root = docsDemo(p, "标题 + 列数 + 边框");
        expect(await root.locator(".descriptions > div").first().innerText())
          .toBe("用户信息");
        const g = grid(root);
        await actualColumns(g, 3);
        expect((await pairs(g)).map((r) => [r.label, r.value])).toEqual(sku);
        expect(await g.evaluate((e) => getComputedStyle(e).borderTopWidth))
          .toBe(
            "1px",
          );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Descriptions layout=vertical @${width}：三项上下结构仍带冒号、默认无外框`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/descriptions");
        await p.setViewportSize({ width, height: 900 });
        const g = grid(docsDemo(p, "layout=vertical"));
        await actualColumns(g, 3);
        const rows = await pairs(g);
        expect(rows.map((r) => [r.label, r.value])).toEqual(sku.slice(0, 3));
        const dir = await g.locator(":scope > div").first().evaluate((e) =>
          getComputedStyle(e).flexDirection
        );
        expect(dir).toBe("column");
        expect(await g.evaluate((e) => getComputedStyle(e).borderTopWidth))
          .toBe(
            "0px",
          );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Descriptions 标签与内容比例（labelColPercent） @${width}：28%·6rem 窄于 50%·10rem`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/descriptions");
        await p.setViewportSize({ width, height: 900 });
        const root = docsDemo(p, "标签与内容比例（labelColPercent）");
        const narrow = grid(root, "较窄标签列（28% · 6rem）");
        const wide = grid(root, "较宽标签列（50% · 10rem）");
        await actualColumns(narrow, 1);
        await actualColumns(wide, 1);
        expect((await pairs(narrow)).map((r) => [r.label, r.value])).toEqual([
          ["用户名：", "zhangsan"],
          ["姓名：", "张三"],
          ["自动锁屏时间：", "10 分钟"],
        ]);
        expect((await pairs(wide)).map((r) => [r.label, r.value])).toEqual([
          ["用户名：", "lisi"],
          ["姓名：", "李四"],
          ["自动锁屏时间：", "10 分钟"],
        ]);
        const widths = async (g: Locator) =>
          await g.locator(":scope > div").first().evaluate((e) => {
            const label = e.children[0] as HTMLElement;
            return {
              min: (e as HTMLElement).style.gridTemplateColumns,
              label: label.getBoundingClientRect().width,
            };
          });
        const n = await widths(narrow), w = await widths(wide);
        expect(n.min).toContain("6rem");
        expect(w.min).toContain("10rem");
        expect(w.label).toBeGreaterThan(n.label);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Descriptions 标签对齐（labelAlign） @${width}：五行对齐与头像节点`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/descriptions");
        await p.setViewportSize({ width, height: 900 });
        const g = grid(docsDemo(p, "标签对齐（labelAlign）"));
        await actualColumns(g, 1);
        const rows = await pairs(g);
        expect(rows.map((r) => r.label)).toEqual([
          "上对齐 · 右：",
          "垂直居中 · 右：",
          "下对齐 · 右：",
          "垂直居中 · 左：",
          "垂直居中 · 中：",
        ]);
        expect(rows.every((r) => r.value === "张")).toBe(true);
        expect(rows.map((r) => [r.items, r.justify, r.align])).toEqual([
          ["flex-start", "flex-end", "right"],
          ["center", "flex-end", "right"],
          ["flex-end", "flex-end", "right"],
          ["center", "flex-start", "left"],
          ["center", "center", "center"],
        ]);
        await g.getByText("上对齐 · 右：", { exact: true }).click({
          delay: 180,
        });
        expect((await pairs(g)).map((r) => r.value)).toEqual(
          rows.map((r) => r.value),
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Descriptions size=sm / colon=false @${width}：小尺寸内边距与无冒号两项`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/descriptions");
        await p.setViewportSize({ width, height: 900 });
        const root = docsDemo(p, "size=sm / colon=false");
        const small = root.locator(".descriptions").filter({
          hasText: "小尺寸",
        })
          .first().locator("[data-descriptions-columns]");
        const bare = root.locator(".descriptions").filter({ hasText: "无冒号" })
          .first().locator("[data-descriptions-columns]");
        const sm = await pairs(small);
        const no = await pairs(bare);
        expect(sm.map((r) => [r.label, r.value])).toEqual(sku.slice(0, 3));
        expect(no.map((r) => [r.label, r.value])).toEqual([
          ["编码", "SKU-9281"],
          ["商品全称（含规格）", "无线降噪耳机 · 黑色 · USB-C 快充盒"],
        ]);
        expect(sm[0].labelPad).toEqual(["8px", "12px", "8px", "12px"]);
        expect(sm[0].font).toBe("14px");
        const md = await pairs(grid(docsDemo(p, "标题 + 列数 + 边框")));
        expect(md[0].labelPad).toEqual(["10px", "16px", "10px", "16px"]);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Descriptions 自定义渲染（render） @${width}：状态为成功标签，邮箱为 mailto 链接`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/descriptions");
        await p.setViewportSize({ width, height: 900 });
        const root = docsDemo(p, "自定义渲染（render）");
        expect(await root.locator(".descriptions > div").first().innerText())
          .toBe("用户信息");
        const g = grid(root, "用户信息");
        await actualColumns(g, 1);
        const rows = await pairs(g);
        expect(rows.map((r) => [r.label, r.value])).toEqual([
          ["姓名：", "张三"],
          ["状态：", "已启用"],
          ["邮箱：", "zhangsan@example.com"],
        ]);
        const statusTag = g.getByText("已启用", { exact: true });
        expect(await statusTag.evaluate((e) => e.tagName.toLowerCase())).toBe(
          "span",
        );
        expect(
          await statusTag.evaluate((e) =>
            e.classList.contains("bg-green-100") &&
            e.classList.contains("text-green-700")
          ),
        ).toBe(true);
        const mail = g.getByRole("link", {
          name: "zhangsan@example.com",
          exact: true,
        });
        expect(await mail.getAttribute("href")).toBe(
          "mailto:zhangsan@example.com",
        );
        await statusTag.click({ delay: 180 });
        expect((await pairs(g)).map((r) => [r.label, r.value])).toEqual([
          ["姓名：", "张三"],
          ["状态：", "已启用"],
          ["邮箱：", "zhangsan@example.com"],
        ]);
        expect(await mail.getAttribute("href")).toBe(
          "mailto:zhangsan@example.com",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Descriptions API 表 @${width}：Descriptions 与 DescriptionsItem 固定四列，不是假交互`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/descriptions");
        await p.setViewportSize({ width, height: 900 });
        for (
          const [name, rows] of [
            ["Descriptions", descriptionsApi],
            ["DescriptionsItem", itemApi],
          ] as const
        ) {
          const table = p.getByRole("heading", { name, exact: true }).locator(
            "xpath=following::table[1]",
          );
          expect(await table.count()).toBe(1);
          expect(
            await table.locator("thead th").allTextContents().then((a) =>
              a.map((s) => s.trim())
            ),
          ).toEqual(["属性", "类型", "默认值", "说明"]);
          expect(
            await table.locator("tbody tr").evaluateAll((es) =>
              es.map((e) =>
                Array.from(e.querySelectorAll("td")).map((c) =>
                  c.textContent!.trim()
                )
              )
            ),
          ).toEqual(rows);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
