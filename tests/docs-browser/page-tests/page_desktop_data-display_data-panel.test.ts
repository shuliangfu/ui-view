/**
 * @fileoverview 文档路由 `/desktop/data-display/data-panel` 的浏览器 E2E（真实 Chromium + 文档站 dev server）。
 * 覆盖：工具栏按钮组（单一淡分割线）、搜索 Modal、表格（排序 / 合计 / 隐藏列 / 行内编辑）、
 * 批量条（在表格下方）、新增 / 编辑 / 查看 Modal、删除确认、分页、导出（五种格式）、导入、
 * 远程数据源、深色主题、en-US 文案、自定义单元格。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

const DOC_PATH = "/desktop/data-display/data-panel";

type T = Parameters<typeof runKeywordAndShallowHere>[0];

/** 页内工具库：按面板 key 作用域查询 / 点击 / 填值 / 等待 */
const LIB = `
if (!window.__dp) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const root = (k) => document.querySelector('[data-testid="panel-' + k + '"]');
  let lastMiss = "";
  const q = (k, sel) => {
    const el = (root(k) || document).querySelector(sel);
    if (!el) lastMiss = k + " " + sel;
    return el;
  };
  const qa = (k, sel) => [...(root(k) || document).querySelectorAll(sel)];
  const until = async (fn, ms = 6000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { if (fn()) return true; } catch (_) {} await sleep(40); }
    return false;
  };
  const click = (el) => { if (!el) throw new Error("missing element: " + lastMiss);
    const inner = el.tagName === "SPAN" ? el.querySelector("button") : null;
    (inner || el).click();
  };
  const fill = (el, v) => {
    if (!el) throw new Error("missing input");
    el.focus(); el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const dlg = () => document.querySelector('[role="dialog"]');
  const text = (el) => (el ? el.textContent.trim() : "");
  const total = (k) => Number((text(q(k, '[data-testid="dp-total-count"]')).match(/\\d+/) || [0])[0]);
  const rows = (k) => qa(k, '[data-testid^="dp-row-"]');
  const cell = (r, n) => r.querySelectorAll("td")[(r.querySelector("td input[type=checkbox]") ? 1 : 0) + n];
  const names = (k) => rows(k).map((r) => text(cell(r, 1)));
  const g = (sel) => {
    const el = document.querySelector(sel);
    if (!el) lastMiss = "document " + sel;
    return el;
  };
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  /** 任意 CSS 颜色（rgb / rgba / oklab / oklch…）→ [r,g,b,a]（a 0..1） */
  const rgba = (c) => {
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  /** 把半透明前景叠到不透明底色上 */
  const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  /** 元素的有效背景：自内向外收集各层背景色，从最外层不透明底开始逐层合成 */
  const effBg = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const c = rgba(getComputedStyle(e).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    let base = layers.length && layers[layers.length - 1][3] === 1 ? layers.pop().slice(0, 3) : [255, 255, 255];
    while (layers.length) base = over(layers.pop(), base);
    return base;
  };
  const lum = (c) => { const f = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
  /** WCAG 对比度：文字色（若带透明度先叠到有效背景）vs 有效背景 */
  const contrast = (el) => {
    const bg = effBg(el);
    const fg = over(rgba(getComputedStyle(el).color), bg);
    const a = lum(fg), b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  window.__dp = { rgba, effBg, contrast, g, cell, sleep, root, q, qa, until, click, fill, dlg, text, total, rows, names };
}
`;

/** 执行一段（可 await 的）页内代码，`D` 为页内工具库，返回其 return 值 */
async function ev<R = unknown>(t: T, body: string): Promise<R> {
  const fn = new Function(
    `${LIB}; const D = window.__dp; return (async () => { ${body} })();`,
  ) as () => unknown;
  return (await t.browser!.evaluate(fn)) as R;
}

/** 打开文档页并等待指定面板水合（工具栏按钮已打上 data-testid） */
async function open(t: T, panel: string): Promise<void> {
  await sharedEnv.goto(t, DOC_PATH);
  await sharedEnv.waitDocMainReady(t);
  const ok = await ev<boolean>(
    t,
    `return await D.until(() => D.q(${
      JSON.stringify(panel)
    }, '[data-testid="dp-refresh"]'), 30000);`,
  );
  expect(ok).toBe(true);
  await ev(t, `await D.sleep(300);`);
}

const P = (k: string) => JSON.stringify(k);

describe("文档页 E2E：/desktop/data-display/data-panel（DataPanel 数据面板）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [/DataPanel|数据面板/i]);
  }, DOCS_BROWSER_CONFIG);

  it("页面列出每个功能的示例小节", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const heads = await ev<string[]>(
      t,
      `return [...document.querySelectorAll("main h3")].map((h) => h.textContent.trim());`,
    );
    for (
      const need of [
        "基础用法",
        "搜索表单（Modal）",
        "表格",
        "新增 / 编辑 Modal 与删除确认",
        "批量操作",
        "分页",
        "导出",
        "远程数据源",
        "深色主题",
        "多语言",
        "自定义",
      ]
    ) {
      expect(heads.some((h) => h.includes(need))).toBe(true);
    }
    const panels = await ev<number>(
      t,
      `return document.querySelectorAll('[data-testid^="panel-demo-"]').length;`,
    );
    expect(panels).toBe(11);
  }, DOCS_BROWSER_CONFIG);

  it(
    "工具栏：一个连在一起的按钮组，相邻按钮之间只有一条淡分割线",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-basic");
      const r = await ev<{
        ids: string[];
        gaps: number[];
        rads: number[][];
        borders: number[][];
        labels: string[];
      }>(
        t,
        `
      const ids = ["dp-create","dp-search-toggle","dp-refresh","dp-print","dp-import","dp-export","dp-columns"];
      const btns = ids.map((id) => D.q(${
          P("demo-basic")
        }, '[data-testid="' + id + '"]'));
      if (btns.some((b) => !b)) return { ids: ids.filter((id, i) => !btns[i]), gaps: [], rads: [], borders: [], labels: [] };
      const rects = btns.map((b) => b.getBoundingClientRect());
      const cs = btns.map((b) => getComputedStyle(b));
      return {
        ids: ids,
        gaps: rects.slice(1).map((r, i) => Math.round((r.left - rects[i].right) * 100) / 100),
        rads: cs.map((c) => [parseFloat(c.borderTopLeftRadius), parseFloat(c.borderTopRightRadius)]),
        borders: cs.map((c) => [parseFloat(c.borderLeftWidth), parseFloat(c.borderRightWidth)]),
        labels: btns.map((b) => b.getAttribute("aria-label") || ""),
      };`,
      );
      expect(r.ids.length).toBe(7);
      // 紧挨着：没有间隙（允许 ≤0 的 1px 重叠）
      for (const g of r.gaps) expect(g <= 0.01 && g >= -1.01).toBe(true);
      // 只有两端圆角
      expect(r.rads[0][0] > 0).toBe(true);
      expect(r.rads[0][1]).toBe(0);
      for (let i = 1; i < 6; i++) expect(r.rads[i]).toEqual([0, 0]);
      expect(r.rads[6][0]).toBe(0);
      expect(r.rads[6][1] > 0).toBe(true);
      // 分割线：每个按钮左侧无边框，除最后一个外右侧恰好 1px → 相邻之间只有一条线
      for (let i = 1; i < 7; i++) expect(r.borders[i][0]).toBe(0);
      for (let i = 0; i < 6; i++) expect(r.borders[i][1]).toBe(1);
      expect(r.labels).toEqual([
        "添加",
        "搜索",
        "刷新",
        "打印",
        "导入",
        "导出",
        "列设置",
      ]);
    },
    DOCS_BROWSER_CONFIG,
  );

  it("工具栏配色：浅色灰白、分割线颜色淡；深色面板为 slate", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t, "demo-basic");
    const light = await ev<{ bg: string; bd: string; fg: string }>(
      t,
      `const c = getComputedStyle(D.q(${
        P("demo-basic")
      }, '[data-testid="dp-refresh"]'));
       return { bg: c.backgroundColor, bd: c.borderRightColor, fg: c.color };`,
    );
    expect(light.bg).toBe("rgb(241, 245, 249)");
    expect(light.bd).toBe("rgb(226, 232, 240)");
    expect(light.fg).toBe("rgb(51, 65, 85)");
    const dark = await ev<{ bg: string; bd: string; card: string }>(
      t,
      `const c = getComputedStyle(D.q(${
        P("demo-dark")
      }, '[data-testid="dp-refresh"]'));
       const card = getComputedStyle(D.q(${P("demo-dark")}, ".dp-card"));
       return { bg: c.backgroundColor, bd: c.borderRightColor, card: card.backgroundColor };`,
    );
    expect(dark.bg).toBe("rgb(15, 23, 42)");
    expect(dark.bd).toBe("rgb(30, 41, 59)");
    expect(dark.card).toBe("rgb(24, 33, 47)");
    // 浅色面板的卡片不会被染成深色
    const lightCard = await ev<string>(
      t,
      `return getComputedStyle(D.q(${
        P("demo-basic")
      }, ".dp-card")).backgroundColor;`,
    );
    expect(lightCard).not.toBe("rgb(24, 33, 47)");
  }, DOCS_BROWSER_CONFIG);

  it(
    "深色模式：行悬停底色与 dweb-admin 一致（slate-800 @ 60%），文字不变；浅色不变",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-dark");
      // 与 dweb-admin 深色行悬停的计算值一致（Tailwind dark:hover:bg-slate-800/60）
      const DWEB_ADMIN_DARK_HOVER = "oklab(0.279 -0.00709772 -0.040381 / 0.6)";
      // deno-lint-ignore no-explicit-any
      const page = (t.browser as any).page;
      const rowSel = '[data-testid="panel-demo-dark"] [data-testid^="dp-row-"]';
      const probe = (sel: string) =>
        ev<{ bg: string; fg: string; tag: string; btn: string }>(
          t,
          `const r = document.querySelector(${JSON.stringify(sel)});
         const tag = r.querySelector("span.inline-block");
         const btn = r.querySelector("button");
         return { bg: getComputedStyle(r).backgroundColor, fg: getComputedStyle(r.querySelector("td")).color,
           tag: tag ? getComputedStyle(tag).color + "|" + getComputedStyle(tag).backgroundColor : "",
           btn: btn ? getComputedStyle(btn).color : "" };`,
        );
      await page.mouse.move(2, 2);
      await ev(t, `await D.sleep(250);`);
      const before = await probe(rowSel);
      await page.hover(rowSel);
      await ev(t, `await D.sleep(250);`);
      const hovered = await probe(rowSel);
      expect(hovered.bg).toBe(DWEB_ADMIN_DARK_HOVER);
      expect(hovered.bg).not.toBe(before.bg);
      // 近白色底会让文字不可读：悬停底色必须是深色
      expect(hovered.bg.startsWith("oklab(0.2")).toBe(true);
      // 文字 / 标签 / 按钮颜色不因悬停变化
      expect(hovered.fg).toBe(before.fg);
      expect(hovered.tag).toBe(before.tag);
      expect(hovered.btn).toBe(before.btn);
      // 斑马行同样适用
      const row2 =
        '[data-testid="panel-demo-dark"] [data-testid^="dp-row-"]:nth-child(2)';
      await page.hover(row2);
      await ev(t, `await D.sleep(250);`);
      expect((await probe(row2)).bg).toBe(DWEB_ADMIN_DARK_HOVER);
      // 浅色面板悬停不受影响（仍为浅色）
      const light = '[data-testid="panel-demo-basic"] [data-testid^="dp-row-"]';
      await page.hover(light);
      await ev(t, `await D.sleep(250);`);
      expect((await probe(light)).bg.startsWith("oklch(0.98")).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "搜索：工具栏按钮打开 Modal；提交搜索、重置清空；表格位置不变",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-basic");
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-basic")};
      const out = {};
      out.inline = !!D.q(k, '[data-testid="dp-search"]');
      const top0 = D.q(k, '[data-testid="dp-table"]').getBoundingClientRect().top;
      D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
      await D.until(() => D.dlg() && document.querySelector('[role="dialog"] [data-testid="dp-search"]'));
      out.modal = !!document.querySelector('[role="dialog"] [data-testid="dp-search"]');
      out.fields = [...document.querySelectorAll('[role="dialog"] [data-testid^="dp-f-"]')].map((e) => e.getAttribute("data-testid"));
      out.topOpen = D.q(k, '[data-testid="dp-table"]').getBoundingClientRect().top === top0;
      D.fill(document.querySelector('[role="dialog"] [data-testid="dp-f-name"] input'), "ali");
      D.click(D.g('[data-testid="dp-search-submit"]'));
      await D.until(() => D.total(k) === 1);
      out.afterSearch = [D.total(k), D.names(k)];
      out.closed = await D.until(() => !document.querySelector('[data-testid="dp-search"]'));
      // 再次打开：带出当前筛选
      D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
      await D.until(() => document.querySelector('[data-testid="dp-search"]'));
      out.kept = document.querySelector('[data-testid="dp-f-name"] input').value;
      // 下拉搜索：角色 = 管理员
      const sel = document.querySelector('[data-testid="dp-f-role"]');
      sel.value = "admin"; sel.dispatchEvent(new Event("change", { bubbles: true }));
      // 先选「管理员」搜索，再改回「全部」搜索：筛选必须被清除（而不是把「全部」当作值）
      D.click(D.g('[data-testid="dp-search-submit"]'));
      await D.until(() => D.total(k) < 25);
      out.adminOnly = D.total(k);
      D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
      await D.until(() => document.querySelector('[data-testid="dp-search"]'));
      const sel2 = document.querySelector('[data-testid="dp-f-role"]');
      sel2.selectedIndex = 0; sel2.dispatchEvent(new Event("change", { bubbles: true }));
      D.fill(document.querySelector('[data-testid="dp-f-name"] input'), "");
      D.click(D.g('[data-testid="dp-search-submit"]'));
      await D.until(() => D.total(k) === 25);
      out.allAgain = D.total(k);
      D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
      await D.until(() => document.querySelector('[data-testid="dp-search"]'));
      const sel3 = document.querySelector('[data-testid="dp-f-role"]');
      sel3.value = "admin"; sel3.dispatchEvent(new Event("change", { bubbles: true }));
      D.click(D.g('[data-testid="dp-search-reset"]'));
      await D.until(() => D.total(k) === 24 || D.total(k) === 25);
      out.afterReset = D.total(k);
      out.nameCleared = document.querySelector('[data-testid="dp-f-name"] input').value === "";
      out.roleCleared = document.querySelector('[data-testid="dp-f-role"]').selectedIndex === 0;
      out.statusCleared = document.querySelector('[data-testid="dp-f-status"]').selectedIndex === 0;
      // 关闭
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      out.escaped = await D.until(() => !document.querySelector('[data-testid="dp-search"]'), 3000);
      return out;`,
      );
      expect(r.inline).toBe(false);
      expect(r.modal).toBe(true);
      expect(r.fields).toEqual(["dp-f-name", "dp-f-role", "dp-f-status"]);
      expect(r.topOpen).toBe(true);
      expect((r.afterSearch as unknown[])[0]).toBe(1);
      expect(((r.afterSearch as unknown[])[1] as string[])[0]).toBe("Alice");
      expect(r.closed).toBe(true);
      expect(r.kept).toBe("ali");
      expect(r.afterReset === 25).toBe(true);
      expect(r.adminOnly).toBe(1); // 姓名含 ali 且角色=管理员
      expect(r.allAgain).toBe(25);
      expect(r.nameCleared).toBe(true);
      expect(r.roleCleared).toBe(true);
      expect(r.statusCleared).toBe(true);
      expect(r.escaped).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it("搜索：select 条件与初始筛选（带出初始值）", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t, "demo-search");
    const r = await ev<Record<string, unknown>>(
      t,
      `
      const k = ${P("demo-search")};
      const out = { initialTotal: D.total(k) };
      D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
      await D.until(() => document.querySelector('[data-testid="dp-search"]'));
      out.roleValue = document.querySelector('[data-testid="dp-f-role"]').value;
      const st = document.querySelector('[data-testid="dp-f-status"]');
      st.value = "disabled"; st.dispatchEvent(new Event("change", { bubbles: true }));
      D.click(D.g('[data-testid="dp-search-submit"]'));
      await D.until(() => D.total(k) < out.initialTotal);
      out.after = D.total(k);
      out.allDisabledAdmins = D.rows(k).every((r) => r.textContent.includes("管理员") && r.textContent.includes("停用"));
      return out;`,
    );
    expect(r.initialTotal).toBe(9); // 25 行里 i%3==0 → 9 个管理员
    expect(r.roleValue).toBe("admin");
    expect((r.after as number) < 9).toBe(true);
    expect(r.allDisabledAdmins).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it(
    "表格：排序三态、合计、hidden 列与列设置、行内开关与行内编辑",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-table");
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-table")};
      const out = {};
      // 默认按余额降序
      const bal = () => D.rows(k).map((r) => parseFloat(D.cell(r, 5).textContent.replace(/,/g, "")));
      const b0 = bal();
      out.defaultDesc = b0.every((v, i) => i === 0 || b0[i - 1] >= v);
      // 合计行
      out.totals = D.text(D.q(k, '[data-testid="dp-total-balance"]'));
      // 点击姓名排序：升序 → 降序 → 回默认
      const sortBtn = () => D.q(k, '[data-testid="dp-sort-name"]');
      D.click(sortBtn()); await D.until(() => D.names(k)[0] === "Alice");
      out.asc = D.names(k).slice(0, 2);
      D.click(sortBtn()); await D.until(() => D.names(k)[0] !== "Alice");
      out.desc = D.names(k)[0];
      D.click(sortBtn()); await D.until(() => { const v = bal(); return v.every((x, i) => i === 0 || v[i - 1] >= x); });
      out.back = true;
      // hidden 列：创建时间默认不显示，列设置打开后出现
      out.hiddenBefore = !D.q(k, "thead").textContent.includes("创建时间");
      D.click(D.q(k, '[data-testid="dp-columns"]'));
      await D.until(() => document.querySelector('[data-testid="dp-col-createdAt"]'));
      D.click(D.g('[data-testid="dp-col-createdAt"]'));
      await D.until(() => D.q(k, "thead").textContent.includes("创建时间"));
      out.hiddenAfter = true;
      out.stored = localStorage.getItem("dp-cols-demo-table");
      // 取消勾选姓名列 → 消失；重置列 → 恢复默认
      if (!document.querySelector('[data-testid="dp-col-name"]')) {
        D.click(D.q(k, '[data-testid="dp-columns"]'));
        await D.until(() => document.querySelector('[data-testid="dp-col-name"]'));
      }
      D.click(D.g('[data-testid="dp-col-name"]'));
      await D.until(() => !D.q(k, "thead").textContent.includes("姓名"));
      if (!document.querySelector('[data-testid="dp-col-reset"]')) {
        D.click(D.q(k, '[data-testid="dp-columns"]'));
        await D.until(() => document.querySelector('[data-testid="dp-col-reset"]'));
      }
      D.click(D.g('[data-testid="dp-col-reset"]'));
      await D.until(() => D.q(k, "thead").textContent.includes("姓名") && !D.q(k, "thead").textContent.includes("创建时间"));
      out.reset = true;
      document.body.click();
      // 行内开关：状态标签（启用/停用）切换
      const sw = D.q(k, '[data-testid^="dp-switch-"]');
      const before = sw.getAttribute("aria-checked");
      const id = sw.getAttribute("data-testid");
      D.click(sw);
      await D.until(() => D.q(k, '[data-testid="' + id + '"]').getAttribute("aria-checked") !== before);
      out.switched = true;
      // 行内文本编辑：双击 → 输入 → Enter
      const firstEdit = D.q(k, '[data-testid^="dp-edit-name-"]');
      const editId = firstEdit.getAttribute("data-testid").replace("dp-edit-name-", "");
      firstEdit.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      await D.until(() => D.q(k, '[data-testid="dp-inline-name"]'));
      const inp = D.q(k, '[data-testid="dp-inline-name"]');
      inp.value = "Renamed Inline";
      inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await D.until(() => D.names(k).includes("Renamed Inline"));
      out.inlineEdited = D.names(k).includes("Renamed Inline");
      out.editId = !!editId;
      return out;`,
      );
      expect(r.defaultDesc).toBe(true);
      expect(String(r.totals)).toMatch(/^[\d,]+\.\d{2}$/);
      expect((r.asc as string[])[0]).toBe("Alice");
      expect(
        (r.asc as string[])[1] < "Bob" || (r.asc as string[])[1] >= "Alice",
      ).toBe(true);
      expect(r.desc).not.toBe("Alice");
      expect(r.back).toBe(true);
      expect(r.hiddenBefore).toBe(true);
      expect(r.hiddenAfter).toBe(true);
      expect(String(r.stored)).not.toContain("createdAt");
      expect(r.reset).toBe(true);
      expect(r.switched).toBe(true);
      expect(r.inlineEdited).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "批量条：选中行后出现在表格下方，表格位置不动；locked 行不可选",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-batch");
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-batch")};
      const out = {};
      const box = () => { const r = D.q(k, '[data-testid="dp-table"]').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 100) / 100).join(","); };
      const table = () => D.q(k, '[data-testid="dp-table"]').getBoundingClientRect();
      const top0 = table().top;
      const box0 = box();
      out.noBarBefore = !D.q(k, '[data-testid="dp-batch-bar"]');
      out.lockedDisabled = D.q(k, '[data-testid="dp-select-1"]').disabled === true;
      out.lockedDeleteDisabled = D.q(k, '[data-testid="dp-delete-1"] button').disabled === true;
      D.click(D.q(k, '[data-testid="dp-select-all"]'));
      await D.until(() => D.q(k, '[data-testid="dp-batch-bar"]'));
      const bar = D.q(k, '[data-testid="dp-batch-bar"]').getBoundingClientRect();
      const tb = table();
      out.sameTop = tb.top === top0;
      out.sameBoxOnSelect = box() === box0;
      out.barBelowTable = bar.top >= tb.bottom - 0.5;
      out.barAbovePagination = D.q(k, '[data-testid="dp-pagination"]').getBoundingClientRect().top >= bar.bottom - 0.5;
      out.count = D.text(D.q(k, '[data-testid="dp-selected-count"]'));
      out.lockedNotSelected = !D.q(k, '[data-testid="dp-select-1"]').checked;
      out.buttons = [...D.qa(k, '[data-testid="dp-batch-bar"] [data-testid]')].map((e) => e.getAttribute("data-testid"));
      D.click(D.q(k, '[data-testid="dp-batch-clear"]'));
      await D.until(() => !D.q(k, '[data-testid="dp-batch-bar"]'));
      out.cleared = true;
      out.stillTop = table().top === top0;
      out.sameBoxAfterClear = box() === box0;
      return out;`,
      );
      expect(r.noBarBefore).toBe(true);
      expect(r.lockedDisabled).toBe(true);
      expect(r.lockedDeleteDisabled).toBe(true);
      expect(r.sameTop).toBe(true);
      expect(r.sameBoxOnSelect).toBe(true);
      expect(r.sameBoxAfterClear).toBe(true);
      expect(r.barBelowTable).toBe(true);
      expect(r.barAbovePagination).toBe(true);
      expect(r.count).toBe("已选 9 项");
      expect(r.lockedNotSelected).toBe(true);
      expect(r.buttons).toEqual([
        "dp-selected-count",
        "dp-batch-status-active",
        "dp-batch-status-disabled",
        "dp-batch-delete",
        "dp-batch-clear",
      ]);
      expect(r.cleared).toBe(true);
      expect(r.stillTop).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it("批量状态与批量删除都需要确认；取消不生效，确认才执行", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t, "demo-batch");
    const r = await ev<Record<string, unknown>>(
      t,
      `
      const k = ${P("demo-batch")};
      const out = {};
      const confirmOpen = () => document.querySelector('[data-testid="dp-confirm"]');
      D.click(D.q(k, '[data-testid="dp-select-2"]'));
      D.click(D.q(k, '[data-testid="dp-select-3"]'));
      await D.until(() => D.q(k, '[data-testid="dp-batch-bar"]'));
      // 批量设为停用 → 确认框
      D.click(D.q(k, '[data-testid="dp-batch-status-disabled"]'));
      await D.until(confirmOpen);
      out.statusText = D.text(document.querySelector('[data-testid="dp-confirm-text"]'));
      D.click(D.g('[data-testid="dp-confirm-cancel"]'));
      await D.until(() => !confirmOpen());
      out.statusUnchanged = D.q(k, '[data-testid="dp-switch-2"]').getAttribute("aria-checked") === "true" && D.q(k, '[data-testid="dp-switch-3"]').getAttribute("aria-checked") === "true";
      D.click(D.q(k, '[data-testid="dp-batch-status-disabled"]'));
      await D.until(confirmOpen);
      D.click(D.g('[data-testid="dp-confirm-ok"]'));
      await D.until(() => !confirmOpen() && !D.q(k, '[data-testid="dp-batch-bar"]'));
      out.statusChanged = D.q(k, '[data-testid="dp-switch-2"]').getAttribute("aria-checked") === "false" && D.q(k, '[data-testid="dp-switch-3"]').getAttribute("aria-checked") === "false";
      // 批量删除
      const total0 = D.total(k);
      D.click(D.q(k, '[data-testid="dp-select-2"]'));
      D.click(D.q(k, '[data-testid="dp-select-3"]'));
      await D.until(() => D.q(k, '[data-testid="dp-batch-delete"]'));
      D.click(D.q(k, '[data-testid="dp-batch-delete"]'));
      await D.until(confirmOpen);
      out.deleteText = D.text(document.querySelector('[data-testid="dp-confirm-text"]'));
      out.notDeletedYet = D.total(k) === total0 && !!D.q(k, '[data-testid="dp-row-2"]');
      D.click(D.g('[data-testid="dp-confirm-cancel"]'));
      await D.until(() => !confirmOpen());
      out.stillThere = D.total(k) === total0;
      D.click(D.q(k, '[data-testid="dp-batch-delete"]'));
      await D.until(confirmOpen);
      D.click(D.g('[data-testid="dp-confirm-ok"]'));
      await D.until(() => D.total(k) === total0 - 2);
      out.deleted = D.total(k) === total0 - 2 && !D.q(k, '[data-testid="dp-row-2"]');
      return out;`,
    );
    expect(r.statusText).toBe("确定将选中的 2 项设为「停用」吗？");
    expect(r.statusUnchanged).toBe(true);
    expect(r.statusChanged).toBe(true);
    expect(r.deleteText).toBe("确定要删除选中的 2 项吗？此操作不可恢复。");
    expect(r.notDeletedYet).toBe(true);
    expect(r.stillThere).toBe(true);
    expect(r.deleted).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it(
    "新增 / 编辑 / 查看使用 Modal，表单校验；删除必须经过确认对话框",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-crud");
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-crud")};
      const out = {};
      const dialogForm = () => document.querySelector('[role="dialog"] [data-testid="dp-form"]');
      const confirmOpen = () => document.querySelector('[data-testid="dp-confirm"]');
      const total0 = D.total(k);
      // 新增：空提交 → 必填错误；非法邮箱 → 格式错误
      D.click(D.q(k, '[data-testid="dp-create"]'));
      await D.until(dialogForm);
      out.createTitle = D.text(document.querySelector('[role="dialog"] h2'));
      D.click(D.g('[data-testid="dp-form-submit"]'));
      await D.until(() => document.querySelector('[data-testid="dp-form-error"]'));
      out.invalidTop = D.text(document.querySelector('[data-testid="dp-form-error"]'));
      out.stillOpen = !!dialogForm();
      out.errorsShown = document.querySelector('[role="dialog"]').textContent.includes("此项必填");
      D.fill(document.querySelector('[data-testid="dp-fld-name"] input'), "Newbie");
      D.fill(document.querySelector('[data-testid="dp-fld-email"] input'), "not-an-email");
      D.click(D.g('[data-testid="dp-form-submit"]'));
      await D.until(() => document.querySelector('[role="dialog"]').textContent.includes("格式不正确"));
      out.patternError = true;
      D.fill(document.querySelector('[data-testid="dp-fld-email"] input'), "newbie@example.com");
      D.fill(document.querySelector('[data-testid="dp-fld-balance"] input'), "-5");
      D.click(D.g('[data-testid="dp-form-submit"]'));
      await D.until(() => document.querySelector('[role="dialog"]').textContent.includes("不能小于 0"));
      out.minError = true;
      D.fill(document.querySelector('[data-testid="dp-fld-balance"] input'), "42");
      D.click(D.g('[data-testid="dp-form-submit"]'));
      await D.until(() => !dialogForm());
      await D.until(() => D.total(k) === total0 + 1);
      out.created = D.total(k) === total0 + 1 && D.names(k)[0] === "Newbie";
      const newId = D.rows(k)[0].getAttribute("data-testid").replace("dp-row-", "");
      // 编辑：表单带出当前值，改名后保存
      D.click(D.q(k, '[data-testid="dp-edit-' + newId + '"]'));
      await D.until(dialogForm);
      out.editTitle = D.text(document.querySelector('[role="dialog"] h2'));
      out.prefill = document.querySelector('[data-testid="dp-fld-name"] input').value;
      D.fill(document.querySelector('[data-testid="dp-fld-name"] input'), "Newbie 2");
      D.click(D.g('[data-testid="dp-form-submit"]'));
      await D.until(() => !dialogForm());
      await D.until(() => D.names(k).includes("Newbie 2"));
      out.edited = true;
      // 取消不保存
      D.click(D.q(k, '[data-testid="dp-edit-' + newId + '"]'));
      await D.until(dialogForm);
      D.fill(document.querySelector('[data-testid="dp-fld-name"] input'), "SHOULD NOT SAVE");
      D.click(D.g('[data-testid="dp-form-cancel"]'));
      await D.until(() => !dialogForm());
      out.cancelKept = D.names(k).includes("Newbie 2") && !D.names(k).includes("SHOULD NOT SAVE");
      // 查看：详情 Modal
      D.click(D.q(k, '[data-testid="dp-view-' + newId + '"]'));
      await D.until(() => document.querySelector('[role="dialog"]') && document.querySelector('[role="dialog"]').textContent.includes("newbie@example.com"));
      out.viewShows = document.querySelector('[role="dialog"]').textContent.includes("Newbie 2");
      document.querySelector('[role="dialog"] button[aria-label]')?.click();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await D.until(() => !document.querySelector('[role="dialog"]'), 3000);
      // 删除：点击只弹确认，行仍在；取消仍在；确认才删除
      D.click(D.q(k, '[data-testid="dp-delete-' + newId + '"] button') || D.q(k, '[data-testid="dp-delete-' + newId + '"]'));
      await D.until(confirmOpen);
      out.confirmText = D.text(document.querySelector('[data-testid="dp-confirm-text"]'));
      out.rowStillThere = !!D.q(k, '[data-testid="dp-row-' + newId + '"]') && D.total(k) === total0 + 1;
      D.click(D.g('[data-testid="dp-confirm-cancel"]'));
      await D.until(() => !confirmOpen());
      out.cancelKeeps = !!D.q(k, '[data-testid="dp-row-' + newId + '"]');
      D.click(D.q(k, '[data-testid="dp-delete-' + newId + '"] button') || D.q(k, '[data-testid="dp-delete-' + newId + '"]'));
      await D.until(confirmOpen);
      D.click(D.g('[data-testid="dp-confirm-ok"]'));
      await D.until(() => D.total(k) === total0);
      out.deleted = !D.q(k, '[data-testid="dp-row-' + newId + '"]');
      return out;`,
      );
      expect(r.createTitle).toContain("新增");
      expect(r.invalidTop).toBe("表单有误，请检查标红的字段");
      expect(r.stillOpen).toBe(true);
      expect(r.errorsShown).toBe(true);
      expect(r.patternError).toBe(true);
      expect(r.minError).toBe(true);
      expect(r.created).toBe(true);
      expect(r.editTitle).toContain("编辑");
      expect(r.prefill).toBe("Newbie");
      expect(r.edited).toBe(true);
      expect(r.cancelKept).toBe(true);
      expect(r.viewShows).toBe(true);
      expect(r.confirmText).toBe("确定要删除「Newbie 2」吗？此操作不可恢复。");
      expect(r.rowStillThere).toBe(true);
      expect(r.cancelKeeps).toBe(true);
      expect(r.deleted).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it("分页：每页条数、上一页 / 下一页、页码、跳页、范围文案", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t, "demo-page");
    const r = await ev<Record<string, unknown>>(
      t,
      `
      const k = ${P("demo-page")};
      const out = {};
      const range = () => D.text(D.q(k, '[data-testid="dp-range"]'));
      out.first = range();
      out.prevDisabled = D.q(k, '[data-testid="dp-prev"]').disabled === true;
      out.pageBtns = D.qa(k, '[data-testid^="dp-page-"]').map((b) => b.textContent.trim());
      D.click(D.q(k, '[data-testid="dp-next"]'));
      await D.until(() => range().startsWith("第 6-10"));
      out.second = range();
      out.secondFirstRow = D.text(D.cell(D.rows(k)[0], 0));
      D.click(D.q(k, '[data-testid="dp-page-8"]'));
      await D.until(() => range().startsWith("第 36-40"));
      out.last = range();
      out.nextDisabled = D.q(k, '[data-testid="dp-next"]').disabled === true;
      const j = D.q(k, '[data-testid="dp-jump"]');
      D.fill(j, "3");
      j.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await D.until(() => range().startsWith("第 11-15"));
      out.jumped = range();
      const sz = D.q(k, '[data-testid="dp-pagesize"]');
      sz.value = "20"; sz.dispatchEvent(new Event("change", { bubbles: true }));
      await D.until(() => range().startsWith("第 1-20"));
      out.size20 = [range(), D.rows(k).length];
      out.sizeOptions = [...sz.options].map((o) => o.textContent.trim());
      // 越界跳页被夹到最后一页
      const j2 = D.q(k, '[data-testid="dp-jump"]');
      D.fill(j2, "99");
      j2.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await D.until(() => range().startsWith("第 21-40"));
      out.clamped = range();
      return out;`,
    );
    expect(r.first).toBe("第 1-5 条，共 40 条");
    expect(r.prevDisabled).toBe(true);
    const pb = r.pageBtns as string[];
    expect(pb.includes("1") && pb.includes("8")).toBe(true);
    expect(r.second).toBe("第 6-10 条，共 40 条");
    expect(r.secondFirstRow).toBe("6");
    expect(r.last).toBe("第 36-40 条，共 40 条");
    expect(r.nextDisabled).toBe(true);
    expect(r.jumped).toBe("第 11-15 条，共 40 条");
    expect(r.size20).toEqual(["第 1-20 条，共 40 条", 20]);
    expect(r.sizeOptions).toEqual(["5 条/页", "10 条/页", "20 条/页"]);
    expect(r.clamped).toBe("第 21-40 条，共 40 条");
  }, DOCS_BROWSER_CONFIG);

  it(
    "导出：xlsx / csv / json / xml / html 都生成文件（xlsx 为合法 ZIP/OOXML）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-export");
      const r = await ev<
        Record<
          string,
          {
            name: string;
            type: string;
            size: number;
            head: string;
            text: string;
          }
        >
      >(
        t,
        `
      const k = ${P("demo-export")};
      const got = {};
      const origCreate = URL.createObjectURL.bind(URL);
      const blobs = [];
      URL.createObjectURL = (b) => { blobs.push(b); return origCreate(b); };
      const origClick = HTMLAnchorElement.prototype.click;
      let lastName = "";
      HTMLAnchorElement.prototype.click = function () { if (this.download) { lastName = this.download; return; } return origClick.call(this); };
      for (const f of ["xlsx", "csv", "json", "xml", "html"]) {
        const n0 = blobs.length;
        D.click(D.q(k, '[data-testid="dp-export"]'));
        await D.until(() => document.querySelector('[data-testid="dp-export-' + f + '"]'));
        D.click(D.g('[data-testid="dp-export-' + f + '"]'));
        await D.until(() => blobs.length > n0);
        const b = blobs[blobs.length - 1];
        const buf = new Uint8Array(await b.arrayBuffer());
        got[f] = {
          name: lastName, type: b.type, size: buf.length,
          head: String.fromCharCode(buf[0], buf[1]),
          text: f === "xlsx" ? new TextDecoder().decode(buf) : new TextDecoder().decode(buf),
        };
        document.body.click();
        await D.sleep(100);
      }
      HTMLAnchorElement.prototype.click = origClick;
      URL.createObjectURL = origCreate;
      for (const f of Object.keys(got)) if (f !== "xlsx") got[f].text = got[f].text.slice(0, 400); else got[f].text = got[f].text.includes("xl/worksheets/sheet1.xml") + "|" + got[f].text.includes("Alice") + "|" + got[f].text.includes("合计");
      return got;`,
      );
      const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      expect(r.xlsx.name).toBe(`users-${stamp}.xlsx`);
      expect(r.xlsx.type).toContain("spreadsheetml.sheet");
      expect(r.xlsx.head).toBe("PK");
      expect(r.xlsx.size > 1000).toBe(true);
      expect(r.xlsx.text).toBe("true|true|true");
      expect(r.csv.name).toBe(`users-${stamp}.csv`);
      expect(r.csv.text).toContain("姓名,邮箱,角色,状态,余额,积分");
      expect(r.json.name).toBe(`users-${stamp}.json`);
      expect(r.json.text).toContain('"name": "Alice"');
      expect(r.xml.name).toBe(`users-${stamp}.xml`);
      expect(r.xml.text).toContain("<rows>");
      expect(r.html.name).toBe(`users-${stamp}.html`);
      expect(r.html.text).toContain("<table>");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("导出内容：全部匹配行（不止当前页）、只含可见列、尊重筛选", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t, "demo-export");
    const r = await ev<Record<string, unknown>>(
      t,
      `
      const k = ${P("demo-export")};
      const blobs = [];
      const origCreate = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (b) => { blobs.push(b); return origCreate(b); };
      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { if (this.download) return; return origClick.call(this); };
      const exportCsv = async () => {
        const n0 = blobs.length;
        D.click(D.q(k, '[data-testid="dp-export"]'));
        await D.until(() => document.querySelector('[data-testid="dp-export-csv"]'));
        D.click(D.g('[data-testid="dp-export-csv"]'));
        await D.until(() => blobs.length > n0);
        document.body.click(); await D.sleep(100);
        return (await blobs[blobs.length - 1].text()).replace(/^\\uFEFF/, "").split("\\r\\n");
      };
      const out = {};
      const all = await exportCsv();
      out.allRows = all.length - 1; // 15 行 + 表头 - 表头
      out.header = all[0];
      // 打开创建时间列 → 导出多一列
      D.click(D.q(k, '[data-testid="dp-columns"]'));
      await D.until(() => document.querySelector('[data-testid="dp-col-createdAt"]'));
      D.click(D.g('[data-testid="dp-col-createdAt"]'));
      await D.sleep(100); document.body.click(); await D.sleep(100);
      out.headerWithDate = (await exportCsv())[0];
      // 隐藏姓名列 → 不导出
      D.click(D.q(k, '[data-testid="dp-columns"]'));
      await D.until(() => document.querySelector('[data-testid="dp-col-name"]'));
      D.click(D.g('[data-testid="dp-col-name"]'));
      await D.sleep(100); document.body.click(); await D.sleep(100);
      out.headerNoName = (await exportCsv())[0];
      URL.createObjectURL = origCreate; HTMLAnchorElement.prototype.click = origClick;
      return out;`,
    );
    expect(r.allRows).toBe(15);
    expect(r.header).toBe("姓名,邮箱,角色,状态,余额,积分");
    expect(r.headerWithDate).toBe("姓名,邮箱,角色,状态,余额,积分,创建时间");
    expect(r.headerNoName).toBe("邮箱,角色,状态,余额,积分,创建时间");
  }, DOCS_BROWSER_CONFIG);

  it("导入：选择 CSV 后新增行；打印按钮会打开打印窗口", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t, "demo-export");
    const r = await ev<Record<string, unknown>>(
      t,
      `
      const k = ${P("demo-export")};
      const out = {};
      const total0 = D.total(k);
      const origClick = HTMLInputElement.prototype.click;
      HTMLInputElement.prototype.click = function () {
        if (this.type === "file") {
          const dt = new DataTransfer();
          dt.items.add(new File(["姓名,邮箱\\r\\nImported A,a@imp.com\\r\\n\\"Imported, B\\",b@imp.com\\r\\n"], "rows.csv", { type: "text/csv" }));
          this.files = dt.files;
          setTimeout(() => this.onchange && this.onchange(new Event("change")), 0);
          return;
        }
        return origClick.call(this);
      };
      D.click(D.q(k, '[data-testid="dp-import"]'));
      await D.until(() => D.total(k) === total0 + 2);
      out.imported = D.total(k) === total0 + 2;
      out.firstNames = D.names(k).slice(0, 2);
      HTMLInputElement.prototype.click = origClick;
      // 打印：拦截 window.open
      let written = "";
      const origOpen = window.open;
      window.open = () => ({ document: { write: (s) => { written += s; }, close() {} }, focus() {}, print() { out.printed = true; } });
      D.click(D.q(k, '[data-testid="dp-print"]'));
      window.open = origOpen;
      out.printHtml = written.includes("<table>") && written.includes("Imported A");
      return out;`,
    );
    expect(r.imported).toBe(true);
    expect(r.firstNames).toEqual(["Imported, B", "Imported A"]);
    expect(r.printed).toBe(true);
    expect(r.printHtml).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("远程（异步）数据源：加载、翻页、搜索、新增、删除确认", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t, "demo-remote");
    const r = await ev<Record<string, unknown>>(
      t,
      `
      const k = ${P("demo-remote")};
      const out = {};
      await D.until(() => D.total(k) === 60, 10000);
      out.total = D.total(k);
      out.rows = D.rows(k).length;
      // 翻页会出现 loading 遮罩
      D.click(D.q(k, '[data-testid="dp-next"]'));
      out.sawLoading = await D.until(() => D.q(k, '[data-testid="dp-loading"]'), 2000);
      await D.until(() => D.text(D.q(k, '[data-testid="dp-range"]')).startsWith("第 11-20"), 5000);
      out.page2 = D.text(D.q(k, '[data-testid="dp-range"]'));
      await D.until(() => !D.q(k, '[data-testid="dp-loading"]'));
      // 搜索
      D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
      await D.until(() => document.querySelector('[data-testid="dp-search"]'));
      D.fill(document.querySelector('[data-testid="dp-f-name"] input'), "Alice");
      D.click(D.g('[data-testid="dp-search-submit"]'));
      await D.until(() => D.total(k) < 60, 5000);
      out.searched = D.total(k);
      out.backToPage1 = D.text(D.q(k, '[data-testid="dp-range"]')).startsWith("第 1-");
      // 新增（异步写）
      await D.until(() => !D.q(k, '[data-testid="dp-loading"]'));
      const t0 = D.total(k);
      D.click(D.q(k, '[data-testid="dp-create"]'));
      await D.until(() => document.querySelector('[data-testid="dp-form"]'));
      D.fill(document.querySelector('[data-testid="dp-fld-name"] input'), "Alice Remote");
      D.fill(document.querySelector('[data-testid="dp-fld-email"] input'), "ar@example.com");
      D.click(D.g('[data-testid="dp-form-submit"]'));
      await D.until(() => D.total(k) === t0 + 1, 5000);
      out.created = D.total(k) === t0 + 1;
      // 删除：确认前不调用 remove
      const id = D.rows(k)[0].getAttribute("data-testid").replace("dp-row-", "");
      D.click(D.q(k, '[data-testid="dp-delete-' + id + '"] button') || D.q(k, '[data-testid="dp-delete-' + id + '"]'));
      await D.until(() => document.querySelector('[data-testid="dp-confirm"]'));
      await D.sleep(700);
      out.notDeletedBeforeConfirm = D.total(k) === t0 + 1;
      D.click(D.g('[data-testid="dp-confirm-ok"]'));
      await D.until(() => D.total(k) === t0, 5000);
      out.deleted = D.total(k) === t0;
      return out;`,
    );
    expect(r.total).toBe(60);
    expect(r.rows).toBe(10);
    expect(r.sawLoading).toBeTruthy();
    expect(r.page2).toBe("第 11-20 条，共 60 条");
    expect((r.searched as number) < 60 && (r.searched as number) >= 1).toBe(
      true,
    );
    expect(r.backToPage1).toBe(true);
    expect(r.created).toBe(true);
    expect(r.notDeletedBeforeConfirm).toBe(true);
    expect(r.deleted).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it(
    "en-US 文案与 messages 覆盖；自定义单元格 / 操作列 / 工具栏",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-locale");
      const en = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-locale")};
      return {
        labels: ["dp-create","dp-refresh","dp-print","dp-export","dp-columns"].map((id) => D.q(k, '[data-testid="' + id + '"]').getAttribute("aria-label")),
        count: D.text(D.q(k, '[data-testid="dp-total-count"]')),
        range: D.text(D.q(k, '[data-testid="dp-range"]')),
        actions: D.q(k, "thead").textContent.includes("Actions"),
        perPage: D.q(k, '[data-testid="dp-pagesize"]').options[0].textContent.trim(),
      };`,
      );
      expect(en.labels).toEqual([
        "New",
        "Refresh",
        "Print",
        "Export",
        "Columns",
      ]);
      expect(en.count).toBe("6 records");
      expect(en.range).toBe("1-6 of 6");
      expect(en.actions).toBe(true);
      expect(en.perPage).toBe("10 / page");

      await open(t, "demo-custom");
      const c = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-custom")};
      return {
        cells: D.qa(k, '[data-testid="demo-custom-name"]').length,
        extras: D.qa(k, '[data-testid="demo-custom-extra"]').map((e) => e.textContent.trim()),
        toolbar: D.q(k, '[data-testid="data-panel-toolbar"]').textContent.includes("自定义工具栏内容"),
        noCreate: !D.q(k, '[data-testid="dp-create"]'),
      };`,
      );
      expect(c.cells).toBe(5);
      expect(c.extras).toEqual(["#1", "#2", "#3", "#4", "#5"]);
      expect(c.toolbar).toBe(true);
      expect(c.noCreate).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "刷新按钮重新加载当前页；每个面板互不影响（同页 11 个实例）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-crud");
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-crud")};
      const other = ${P("demo-batch")};
      const o0 = D.total(other);
      D.click(D.q(k, '[data-testid="dp-refresh"]'));
      await D.sleep(300);
      D.click(D.q(k, '[data-testid="dp-select-2"]'));
      await D.until(() => D.q(k, '[data-testid="dp-batch-bar"]'));
      return {
        sameTotal: D.total(other) === o0,
        otherNoBar: !D.q(other, '[data-testid="dp-batch-bar"]'),
        toolbars: document.querySelectorAll('[data-testid="data-panel-toolbar"]').length,
      };`,
      );
      expect(r.sameTotal).toBe(true);
      expect(r.otherNoBar).toBe(true);
      expect(r.toolbars).toBe(11);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "11 个示例全部渲染：工具栏 / 表格 / 分页齐全，且水合后可交互",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-basic");
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const keys = ["demo-basic","demo-search","demo-table","demo-crud","demo-batch","demo-page","demo-export","demo-remote","demo-dark","demo-locale","demo-custom"];
      await D.until(() => D.total("demo-remote") > 0, 10000);
      const out = {};
      for (const k of keys) {
        out[k] = {
          toolbar: !!D.q(k, '[data-testid="data-panel-toolbar"]'),
          table: !!D.q(k, '[data-testid="dp-table"]'),
          pagination: !!D.q(k, '[data-testid="dp-pagination"]'),
          rows: D.rows(k).length,
          hydrated: !!D.q(k, '[data-testid="dp-refresh"]'),
          visible: D.q(k, ".dp-card").getBoundingClientRect().height > 100,
        };
      }
      return out;`,
      );
      expect(Object.keys(r).length).toBe(11);
      for (const [k, v] of Object.entries(r)) {
        const o = v as Record<string, unknown>;
        expect([k, o.toolbar, o.table, o.pagination, o.hydrated, o.visible])
          .toEqual([k, true, true, true, true, true]);
        expect((o.rows as number) > 0).toBe(true);
      }
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "浅色 / 深色主题切换（真实主题按钮）：面板配色、行悬停色随主题变化，切回浅色恢复",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-basic");
      // deno-lint-ignore no-explicit-any
      const page = (t.browser as any).page;
      const state = () =>
        ev<{ dark: boolean; card: string; tb: string }>(
          t,
          `return { dark: document.documentElement.classList.contains("dark"),
          card: getComputedStyle(D.q(${
            P("demo-basic")
          }, ".dp-card")).backgroundColor,
          tb: getComputedStyle(D.q(${
            P("demo-basic")
          }, '[data-testid="dp-refresh"]')).backgroundColor };`,
        );
      const clickToggle = () =>
        ev(
          t,
          `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
         if (!b) throw new Error("theme toggle not found");
         b.click(); await D.sleep(600);`,
        );
      const hoverBg = async () => {
        const sel =
          '[data-testid="panel-demo-basic"] [data-testid^="dp-row-"]:nth-child(3)';
        await page.hover(sel);
        await ev(t, `await D.sleep(300);`);
        return await ev<string>(
          t,
          `return getComputedStyle(document.querySelector(${
            JSON.stringify(sel)
          })).backgroundColor;`,
        );
      };
      const light = await state();
      expect(light.dark).toBe(false);
      expect(light.tb).toBe("rgb(241, 245, 249)");
      expect((await hoverBg()).startsWith("oklch(0.98")).toBe(true);
      await clickToggle();
      const dark = await state();
      expect(dark.dark).toBe(true);
      expect(dark.card).toBe("rgb(24, 33, 47)");
      expect(dark.tb).toBe("rgb(15, 23, 42)");
      // 与 dweb-admin 深色行悬停一致
      expect(await hoverBg()).toBe("oklab(0.279 -0.00709772 -0.040381 / 0.6)");
      await clickToggle();
      const back = await state();
      expect(back.dark).toBe(false);
      expect(back.card).toBe(light.card);
      expect(back.tb).toBe("rgb(241, 245, 249)");
      expect((await hoverBg()).startsWith("oklch(0.98")).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "整页交互全程零控制台错误 / 零页面异常（搜索、新增、选择、导出、分页、主题）",
    async (t) => {
      if (!t?.browser?.goto) return;
      // deno-lint-ignore no-explicit-any
      const page = (t.browser as any).page;
      const errors: string[] = [];
      const onConsole = (m: { type(): string; text(): string }) => {
        if (m.type() === "error") errors.push("console: " + m.text());
      };
      const onPageError = (e: Error) => errors.push("pageerror: " + e.message);
      page.on("console", onConsole);
      page.on("pageerror", onPageError);
      try {
        await open(t, "demo-basic");
        await ev(
          t,
          `
        const k = ${P("demo-basic")};
        D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
        await D.until(() => document.querySelector('[data-testid="dp-search"]'));
        D.fill(document.querySelector('[data-testid="dp-f-name"] input'), "bo");
        D.click(D.g('[data-testid="dp-search-submit"]'));
        await D.until(() => D.total(k) < 25);
        D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
        await D.until(() => document.querySelector('[data-testid="dp-search"]'));
        D.click(D.g('[data-testid="dp-search-reset"]'));
        await D.until(() => D.total(k) === 25);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await D.sleep(300);
        D.click(D.q(k, '[data-testid="dp-create"]'));
        await D.until(() => document.querySelector('[data-testid="dp-form"]'));
        D.click(D.g('[data-testid="dp-form-cancel"]'));
        await D.until(() => !document.querySelector('[data-testid="dp-form"]'));
        D.click(D.q(k, '[data-testid="dp-select-2"]'));
        await D.until(() => D.q(k, '[data-testid="dp-batch-bar"]'));
        D.click(D.q(k, '[data-testid="dp-batch-clear"]'));
        D.click(D.q(k, '[data-testid="dp-next"]'));
        await D.sleep(300);
        D.click(D.q(k, '[data-testid="dp-sort-name"]'));
        await D.sleep(300);
        D.click(D.q(k, '[data-testid="dp-columns"]'));
        await D.sleep(300);
        document.body.click();
        D.click(D.q(k, '[data-testid="dp-delete-2"]'));
        await D.until(() => document.querySelector('[data-testid="dp-confirm"]'));
        D.click(D.g('[data-testid="dp-confirm-cancel"]'));
        await D.sleep(300);
        `,
        );
        await ev(
          t,
          `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
         b.click(); await D.sleep(500); b.click(); await D.sleep(500);`,
        );
      } finally {
        page.off("console", onConsole);
        page.off("pageerror", onPageError);
      }
      expect(errors).toEqual([]);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "状态开关：ON 旋钮在右、OFF 在左、有过渡动画；locked 行为禁用开关（浅色 / 深色）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-basic");
      const measure = () =>
        ev<Record<string, Record<string, unknown>>>(
          t,
          `
        const k = ${P("demo-basic")};
        const m = (id) => {
          const b = D.q(k, '[data-testid="dp-switch-' + id + '"]');
          const kn = b.querySelector("span");
          const br = b.getBoundingClientRect(), kr = kn.getBoundingClientRect();
          const cs = getComputedStyle(b), ks = getComputedStyle(kn);
          return {
            checked: b.getAttribute("aria-checked"), disabled: b.disabled, ariaDisabled: b.getAttribute("aria-disabled"),
            w: Math.round(br.width), h: Math.round(br.height),
            knobLeft: Math.round((kr.left - br.left) * 10) / 10, knobRight: Math.round((br.right - kr.right) * 10) / 10,
            knobCenterRight: kr.left + kr.width / 2 > br.left + br.width / 2,
            knobW: Math.round(kr.width), knobH: Math.round(kr.height),
            radius: parseFloat(cs.borderTopLeftRadius), opacity: cs.opacity, cursor: cs.cursor, bg: cs.backgroundColor,
            kTrans: ks.transitionProperty + "|" + ks.transitionDuration, bTrans: cs.transitionProperty,
          };
        };
        return { on: m(2), off: m(4), locked: m(1) };`,
        );
      const check = (
        r: Record<string, Record<string, unknown>>,
        dark: boolean,
      ) => {
        const tag = dark ? "dark" : "light";
        // ON：蓝色，旋钮在右侧（右边距 ≈2px）
        expect([tag, r.on.checked]).toEqual([tag, "true"]);
        expect([tag, r.on.knobCenterRight]).toEqual([tag, true]);
        expect([tag, r.on.knobRight]).toEqual([tag, 2]);
        expect([tag, r.on.bg]).toEqual([
          tag,
          dark ? "rgb(59, 130, 246)" : "rgb(37, 99, 235)",
        ]);
        // OFF：旋钮在左侧（左边距 ≈2px）
        expect([tag, r.off.checked]).toEqual([tag, "false"]);
        expect([tag, r.off.knobCenterRight]).toEqual([tag, false]);
        expect([tag, r.off.knobLeft]).toEqual([tag, 2]);
        expect([tag, r.off.bg]).toEqual([
          tag,
          dark ? "rgb(71, 85, 105)" : "rgb(203, 213, 225)",
        ]);
        // 圆形旋钮 + 胶囊轨道 + 过渡
        for (const x of [r.on, r.off, r.locked]) {
          expect([tag, x.w, x.h]).toEqual([tag, 36, 20]);
          expect([tag, x.knobW, x.knobH]).toEqual([tag, 16, 16]);
          expect((x.radius as number) >= 10).toBe(true);
          expect(String(x.kTrans)).toContain("transform");
          expect(String(x.kTrans)).toContain("0.2s");
          expect(String(x.bTrans)).toContain("background-color");
        }
        expect([tag, r.on.disabled, r.on.opacity, r.off.disabled]).toEqual([
          tag,
          false,
          "1",
          false,
        ]);
        // locked 行：禁用开关（不是浅绿色方块）：胶囊、半透明、not-allowed、仍显示当前状态（ON → 旋钮在右）
        expect([tag, r.locked.disabled, r.locked.ariaDisabled]).toEqual([
          tag,
          true,
          "true",
        ]);
        expect([tag, r.locked.opacity]).toEqual([tag, "0.5"]);
        expect([tag, r.locked.cursor]).toEqual([tag, "not-allowed"]);
        expect([tag, r.locked.checked, r.locked.knobCenterRight]).toEqual([
          tag,
          "true",
          true,
        ]);
        expect([tag, r.locked.bg]).toEqual([tag, r.on.bg]);
      };
      check(await measure(), false);

      // 点击 locked 开关无效
      const afterClick = await ev<string>(
        t,
        `D.click(D.q(${
          P("demo-basic")
        }, '[data-testid="dp-switch-1"]')); await D.sleep(300);
       return D.q(${
          P("demo-basic")
        }, '[data-testid="dp-switch-1"]').getAttribute("aria-checked");`,
      );
      expect(afterClick).toBe("true");

      // 动画：点击 ON 开关后，旋钮的 translateX 在 16px → 0px 之间出现中间值（不是瞬移）
      const anim = await ev<{ samples: number[]; end: string }>(
        t,
        `
      const k = ${P("demo-basic")};
      const b = () => D.q(k, '[data-testid="dp-switch-3"]');
      const tx = () => new DOMMatrixReadOnly(getComputedStyle(b().querySelector("span")).transform).m41;
      const start = tx();
      const samples = [];
      D.click(b());
      const t0 = performance.now();
      while (performance.now() - t0 < 400) { samples.push(Math.round(tx() * 100) / 100); await new Promise((r) => requestAnimationFrame(r)); }
      return { samples: [start, ...samples], end: b().getAttribute("aria-checked") };`,
      );
      expect(anim.end).toBe("false");
      expect(anim.samples[0]).toBe(16);
      expect(anim.samples[anim.samples.length - 1]).toBe(0);
      expect(anim.samples.some((v) => v > 0.5 && v < 15.5)).toBe(true);

      // 切到深色（真实主题按钮）后同样成立
      await ev(
        t,
        `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
       b.click(); await D.sleep(700);`,
      );
      const dark = await measure();
      // 上面的动画测试已把 3 号切为 OFF，不影响 2 / 4 / 1
      check(dark, true);
      // 深色下 locked 行不是浅绿色方块
      expect(String(dark.locked.bg)).not.toMatch(
        /^rgb\(2[0-9]{2}, 2[0-9]{2}, 2[0-9]{2}\)$/,
      );
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "深色模式标签 / 徽章：半透明深色底 + 亮字，文字对比度 ≥ 4.5:1；浅色不变",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-search");
      // 清掉初始「角色=管理员」筛选，让所有色调的标签都出现
      await ev(
        t,
        `const k = ${P("demo-search")};
       D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
       await D.until(() => document.querySelector('[data-testid="dp-search"]'));
       D.click(D.g('[data-testid="dp-search-reset"]'));
       await D.until(() => D.total(k) === 25);
       document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
       await D.until(() => !document.querySelector('[data-testid="dp-search"]'));`,
      );
      const scan = () =>
        ev<
          {
            n: number;
            items: { text: string; fg: string; bg: string; ratio: number }[];
          }
        >(
          t,
          `
        const k = ${P("demo-search")};
        const tags = D.qa(k, "span.dp-tag");
        const seen = new Map();
        for (const e of tags) {
          const cs = getComputedStyle(e);
          const key = e.textContent.trim();
          if (!seen.has(key)) seen.set(key, { text: key, fg: cs.color, bg: cs.backgroundColor, ratio: Math.round(D.contrast(e) * 100) / 100 });
        }
        return { n: tags.length, items: [...seen.values()] };`,
        );
      const light = await scan();
      expect(light.n > 0).toBe(true);
      for (const it of light.items) {
        // 浅色保持原样：不使用深色模式的半透明底
        expect(it.bg.includes("0.15)")).toBe(false);
        expect([it.text, it.ratio >= 4.5]).toEqual([it.text, true]);
      }
      await ev(
        t,
        `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
       b.click(); await D.sleep(700);`,
      );
      const dark = await scan();
      const by = Object.fromEntries(dark.items.map((i) => [i.text, i]));
      // 管理员 danger / 编辑 info / 访客 default / 启用 success / 停用 warning 全部出现
      for (const k of ["管理员", "编辑", "访客", "启用", "停用"]) {
        expect(by[k] !== undefined).toBe(true);
      }
      expect([by["管理员"].fg, by["管理员"].bg]).toEqual([
        "rgb(252, 165, 165)",
        "rgba(239, 68, 68, 0.15)",
      ]);
      expect([by["启用"].fg, by["启用"].bg]).toEqual([
        "rgb(134, 239, 172)",
        "rgba(34, 197, 94, 0.15)",
      ]);
      expect([by["停用"].fg, by["停用"].bg]).toEqual([
        "rgb(253, 224, 71)",
        "rgba(234, 179, 8, 0.15)",
      ]);
      expect([by["编辑"].fg, by["编辑"].bg]).toEqual([
        "rgb(125, 211, 252)",
        "rgba(56, 189, 248, 0.15)",
      ]);
      expect([by["访客"].fg, by["访客"].bg]).toEqual([
        "rgb(203, 213, 225)",
        "rgba(148, 163, 184, 0.15)",
      ]);
      for (const it of dark.items) {
        expect([it.text, it.ratio >= 4.5]).toEqual([it.text, true]);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
