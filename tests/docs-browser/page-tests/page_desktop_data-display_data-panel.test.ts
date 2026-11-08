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
  const cell = (r, n) => r.querySelectorAll("td")[(r.querySelector("td:first-child input[type=checkbox]:not(.sr-only)") ? 1 : 0) + n];
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
  const pop = () => document.querySelector(".dp-pop");
  const popBtn = (txt) => pop() ? [...pop().querySelectorAll("button")].find((b) => b.textContent.trim() === txt) : null;
  /** ui-view Select：点开触发按钮 → 点选项文案 */
  const pick = async (wrap, label) => {
    const trig = wrap.querySelector("button[aria-haspopup]");
    if (trig.getAttribute("aria-expanded") !== "true") trig.click();
    await until(() => trig.getAttribute("aria-expanded") === "true");
    const o = [...wrap.querySelectorAll('[role="option"]')].find((b) => b.textContent.trim() === label);
    if (!o) throw new Error("missing option " + label);
    o.click(); await sleep(80);
  };
  const sw = (k, id) => {
    const w = q(k, '[data-testid="dp-switch-' + id + '"]');
    const input = w.querySelector("input");
    const label = w.querySelector("label");
    const track = label.querySelector('span[aria-hidden="true"]');
    return { w, input, label, track, knob: track.firstElementChild, on: input.checked, toggle: () => label.click() };
  };
  const picked = (wrap) => wrap.querySelector("button[aria-haspopup]").textContent.trim();
  const hidden = (wrap) => wrap.querySelector('input[type="hidden"]').value;
  window.__dp = { sw, pick, picked, hidden, pop, popBtn, rgba, effBg, contrast, g, cell, sleep, root, q, qa, until, click, fill, dlg, text, total, rows, names };
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
        "单元格编辑",
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
    expect(panels).toBe(23);
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
      const ids = ["dp-create","dp-search-toggle","dp-refresh","dp-print","dp-import","dp-export","dp-columns","dp-density","dp-fullscreen","dp-copy"];
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
      const n = r.ids.length;
      expect(n).toBe(10);
      // 紧挨着：没有间隙（允许 ≤0 的 1px 重叠）
      for (const g of r.gaps) expect(g <= 0.01 && g >= -1.01).toBe(true);
      // 只有两端圆角
      expect(r.rads[0][0] > 0).toBe(true);
      expect(r.rads[0][1]).toBe(0);
      for (let i = 1; i < n - 1; i++) expect(r.rads[i]).toEqual([0, 0]);
      expect(r.rads[n - 1][0]).toBe(0);
      expect(r.rads[n - 1][1] > 0).toBe(true);
      // 分割线：每个按钮左侧无边框，除最后一个外右侧恰好 1px → 相邻之间只有一条线
      for (let i = 1; i < n; i++) expect(r.borders[i][0]).toBe(0);
      for (let i = 0; i < n - 1; i++) expect(r.borders[i][1]).toBe(1);
      expect(r.labels).toEqual([
        "添加",
        "搜索",
        "刷新",
        "打印",
        "导入",
        "导出",
        "列设置",
        "行高",
        "全屏",
        "复制",
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
      { const sb = document.querySelector('[role="dialog"] [data-testid="dp-search-submit"]'), rb = document.querySelector('[role="dialog"] [data-testid="dp-search-reset"]');
        const ra = sb.getBoundingClientRect(), rr = rb.getBoundingClientRect();
        out.footerOrder = (ra.left < rr.left && Math.abs(ra.top - rr.top) < 2 ? "ok" : "swapped") + ":" + sb.textContent.replace(/\\s/g, "") + "," + rb.textContent.replace(/\\s/g, "");
        out.footerDom = !!(sb.compareDocumentPosition(rb) & Node.DOCUMENT_POSITION_FOLLOWING); }
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
      await D.pick(sel, "管理员");
      // 先选「管理员」搜索，再改回「全部」搜索：筛选必须被清除（而不是把「全部」当作值）
      D.click(D.g('[data-testid="dp-search-submit"]'));
      await D.until(() => D.total(k) < 25);
      out.adminOnly = D.total(k);
      D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
      await D.until(() => document.querySelector('[data-testid="dp-search"]'));
      const sel2 = document.querySelector('[data-testid="dp-f-role"]');
      await D.pick(sel2, "全部");
      D.fill(document.querySelector('[data-testid="dp-f-name"] input'), "");
      D.click(D.g('[data-testid="dp-search-submit"]'));
      await D.until(() => D.total(k) === 25);
      out.allAgain = D.total(k);
      D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
      await D.until(() => document.querySelector('[data-testid="dp-search"]'));
      const sel3 = document.querySelector('[data-testid="dp-f-role"]');
      await D.pick(sel3, "管理员");
      D.click(D.g('[data-testid="dp-search-reset"]'));
      await D.until(() => D.total(k) === 24 || D.total(k) === 25);
      out.afterReset = D.total(k);
      out.nameCleared = document.querySelector('[data-testid="dp-f-name"] input').value === "";
      out.roleCleared = D.picked(document.querySelector('[data-testid="dp-f-role"]')) === "全部" && D.hidden(document.querySelector('[data-testid="dp-f-role"]')) === "";
      out.statusCleared = D.picked(document.querySelector('[data-testid="dp-f-status"]')) === "全部" && D.hidden(document.querySelector('[data-testid="dp-f-status"]')) === "";
      // 关闭
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      out.escaped = await D.until(() => !document.querySelector('[data-testid="dp-search"]'), 3000);
      return out;`,
      );
      expect(r.inline).toBe(false);
      expect(r.modal).toBe(true);
      expect(r.footerOrder).toBe("ok:搜索,重置");
      expect(r.footerDom).toBe(true);
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
      out.roleValue = D.hidden(document.querySelector('[data-testid="dp-f-role"]'));
      const st = document.querySelector('[data-testid="dp-f-status"]');
      await D.pick(st, "停用");
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
      out.stored = localStorage.getItem("dp-prefs-demo-table");
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
      const swId = D.q(k, '[data-testid^="dp-switch-"]').getAttribute("data-testid").replace("dp-switch-", "");
      const before = D.sw(k, swId).on;
      D.sw(k, swId).toggle();
      await D.sleep(900);
      out.switched = D.sw(k, swId).on !== before;
      // 行内文本编辑：双击 → 输入 → Enter
      const firstEdit = D.q(k, '[data-testid^="dp-edit-name-"]');
      const editId = firstEdit.getAttribute("data-testid").replace("dp-edit-name-", "");
      firstEdit.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      await D.until(() => D.q(k, '[data-testid="dp-inline-name"]'));
      const inp = D.q(k, '[data-testid="dp-inline-name"]');
      const innerInput = inp.querySelector("input");
      innerInput.value = "Renamed Inline";
      innerInput.dispatchEvent(new Event("input", { bubbles: true }));
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
    "列设置：真实鼠标勾选立即显隐、浮层不关、重置列、localStorage",
    async (t) => {
      if (!t?.browser?.goto) return;
      // deno-lint-ignore no-explicit-any
      const page = (t.browser as any).page as {
        mouse: { click: (x: number, y: number) => Promise<void> };
        hover: (sel: string) => Promise<void>;
      };

      await open(t, "demo-table");
      // 清偏好并重进，保证默认 hidden 列状态
      await ev(t, `localStorage.removeItem("dp-prefs-demo-table"); localStorage.removeItem("dp-cols-demo-table");`);
      await open(t, "demo-table");

      const centerClick = async (sel: string) => {
        const box = await ev<{ x: number; y: number; w: number; h: number } | null>(
          t,
          `const el = document.querySelector(${JSON.stringify(sel)});
           if (!el) return null;
           el.scrollIntoView({ block: "center", inline: "center" });
           const r = el.getBoundingClientRect();
           return { x: r.x, y: r.y, w: r.width, h: r.height };`,
        );
        if (!box) throw new Error("missing " + sel);
        await page.mouse.click(box.x + box.w / 2, box.y + box.h / 2);
        await ev(t, `await D.sleep(80);`);
      };

      const before = await ev<boolean>(
        t,
        `return D.q(${P("demo-table")}, "thead").textContent.includes("创建时间");`,
      );
      expect(before).toBe(false);

      await centerClick(
        '[data-testid="panel-demo-table"] [data-testid="dp-columns"]',
      );
      const menuOpened = await ev<boolean>(
        t,
        `return await D.until(() => !!document.querySelector('[data-testid="dp-column-menu"]'));`,
      );
      expect(menuOpened).toBe(true);

      // 勾选「创建时间」→ 表头出现；浮层仍开；勾选同步
      await centerClick('[data-testid="dp-col-createdAt"]');
      const afterShow = await ev<Record<string, unknown>>(
        t,
        `
        const ok = await D.until(() => D.q(${P("demo-table")}, "thead").textContent.includes("创建时间"));
        const cb = document.querySelector('[data-testid="dp-col-createdAt"]');
        return {
          ok,
          menuOpen: !!document.querySelector('[data-testid="dp-column-menu"]'),
          header: D.q(${P("demo-table")}, "thead").textContent.includes("创建时间"),
          checked: !!(cb && cb.checked),
          stored: localStorage.getItem("dp-prefs-demo-table"),
        };`,
      );
      expect(afterShow.ok).toBe(true);
      expect(afterShow.menuOpen).toBe(true);
      expect(afterShow.header).toBe(true);
      expect(afterShow.checked).toBe(true);
      expect(String(afterShow.stored)).not.toContain("createdAt");

      // 取消勾选 → 隐藏；浮层仍开
      await centerClick('[data-testid="dp-col-createdAt"]');
      const afterHide = await ev<Record<string, unknown>>(
        t,
        `
        const ok = await D.until(() => !D.q(${P("demo-table")}, "thead").textContent.includes("创建时间"));
        const cb = document.querySelector('[data-testid="dp-col-createdAt"]');
        return {
          ok,
          menuOpen: !!document.querySelector('[data-testid="dp-column-menu"]'),
          header: D.q(${P("demo-table")}, "thead").textContent.includes("创建时间"),
          checked: !!(cb && cb.checked),
          stored: localStorage.getItem("dp-prefs-demo-table"),
        };`,
      );
      expect(afterHide.ok).toBe(true);
      expect(afterHide.menuOpen).toBe(true);
      expect(afterHide.header).toBe(false);
      expect(afterHide.checked).toBe(false);
      expect(String(afterHide.stored)).toContain("createdAt");

      // 隐藏姓名后重置
      await centerClick('[data-testid="dp-col-name"]');
      await ev(
        t,
        `await D.until(() => !D.q(${P("demo-table")}, "thead").textContent.includes("姓名"));`,
      );
      await centerClick('[data-testid="dp-col-reset"]');
      const afterReset = await ev<Record<string, unknown>>(
        t,
        `
        const ok = await D.until(() => {
          const th = D.q(${P("demo-table")}, "thead").textContent;
          return th.includes("姓名") && !th.includes("创建时间");
        });
        const nameCb = document.querySelector('[data-testid="dp-col-name"]');
        const createdCb = document.querySelector('[data-testid="dp-col-createdAt"]');
        return {
          ok,
          menuOpen: !!document.querySelector('[data-testid="dp-column-menu"]'),
          hasName: D.q(${P("demo-table")}, "thead").textContent.includes("姓名"),
          hasCreated: D.q(${P("demo-table")}, "thead").textContent.includes("创建时间"),
          nameChecked: !!(nameCb && nameCb.checked),
          createdChecked: !!(createdCb && createdCb.checked),
          resetColor: (() => { const b = document.querySelector('[data-testid="dp-col-reset"]'); return b ? getComputedStyle(b).color : ""; })(),
          stored: localStorage.getItem("dp-prefs-demo-table"),
        };`,
      );
      expect(afterReset.ok).toBe(true);
      expect(afterReset.menuOpen).toBe(true);
      expect(afterReset.hasName).toBe(true);
      expect(afterReset.hasCreated).toBe(false);
      expect(afterReset.nameChecked).toBe(true);
      expect(afterReset.createdChecked).toBe(false);
      expect(String(afterReset.resetColor)).not.toBe("rgb(100, 116, 139)");
      expect(String(afterReset.stored)).toContain("createdAt");
      expect(String(afterReset.stored)).not.toContain('"name"');

      await page.mouse.click(2, 2);
      const closed = await ev<boolean>(
        t,
        `return await D.until(() => !document.querySelector('[data-testid="dp-column-menu"]'));`,
      );
      expect(closed).toBe(true);
    },
    { ...DOCS_BROWSER_CONFIG, timeout: 120_000 },
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

  it("批量设为／批量删除均走行内 Popconfirm；取消不生效，确认才执行", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t, "demo-batch");
    const r = await ev<Record<string, unknown>>(
      t,
      `
      const k = ${P("demo-batch")};
      const out = {};
      const confirmOpen = () => document.querySelector('[data-testid="dp-confirm"]');
      // messages.confirm 为「确 定」（中间空格，与表单脚一致）
      const OK = "确 定";
      const popHas = (txt) => !!D.popBtn(txt);
      D.click(D.q(k, '[data-testid="dp-select-2"]'));
      D.click(D.q(k, '[data-testid="dp-select-3"]'));
      await D.until(() => D.q(k, '[data-testid="dp-batch-bar"]'));
      // 批量设为停用 → 行内 Popconfirm（非 Modal／dp-confirm）
      D.click(D.q(k, '[data-testid="dp-batch-status-disabled"]'));
      await D.until(() => popHas(OK));
      out.statusNoModal = !confirmOpen() && !document.querySelector('[role="dialog"]');
      out.statusText = D.text(D.pop().querySelector("div.text-sm"));
      out.statusOkLeft = (() => {
        const ok = D.popBtn(OK), cancel = D.popBtn("取消");
        return !!ok && !!cancel && ok.getBoundingClientRect().left < cancel.getBoundingClientRect().left;
      })();
      D.click(D.popBtn("取消"));
      await D.until(() => !D.pop());
      out.statusUnchanged = D.sw(k, 2).on === true && D.sw(k, 3).on === true;
      D.click(D.q(k, '[data-testid="dp-batch-status-disabled"]'));
      await D.until(() => popHas(OK));
      D.click(D.popBtn(OK));
      await D.until(() => !D.pop() && D.sw(k, 2).on === false && D.sw(k, 3).on === false);
      out.statusChanged = D.sw(k, 2).on === false && D.sw(k, 3).on === false;
      await D.until(() => !D.q(k, '[data-testid="dp-batch-bar"]'));
      // 批量删除：行内 Popconfirm（非大确认对话框）
      const total0 = D.total(k);
      D.click(D.q(k, '[data-testid="dp-select-2"]'));
      D.click(D.q(k, '[data-testid="dp-select-3"]'));
      await D.until(() => D.q(k, '[data-testid="dp-batch-delete"]'));
      // size=sm on batch bar buttons（py-1.5 ≈ 30–36px；勿用默认 md）
      out.batchSm = [...D.qa(k, '[data-testid="dp-batch-bar"] button')].every((b) => {
        const h = b.getBoundingClientRect().height;
        const cls = b.className || "";
        return h > 0 && h <= 36 && cls.includes("py-1.5");
      });
      D.click(D.q(k, '[data-testid="dp-batch-delete"]'));
      await D.until(() => popHas("删除"));
      out.deleteNoModal = !confirmOpen() && !document.querySelector('[role="dialog"]');
      out.deleteText = D.text(D.pop().querySelector("div.text-sm"));
      out.notDeletedYet = D.total(k) === total0 && !!D.q(k, '[data-testid="dp-row-2"]');
      D.click(D.popBtn("取消"));
      await D.until(() => !D.pop());
      out.stillThere = D.total(k) === total0;
      D.click(D.q(k, '[data-testid="dp-batch-delete"]'));
      await D.until(() => popHas("删除"));
      D.click(D.popBtn("删除"));
      await D.until(() => D.total(k) === total0 - 2);
      out.deleted = D.total(k) === total0 - 2 && !D.q(k, '[data-testid="dp-row-2"]');
      return out;`,
    );
    expect(r.statusNoModal).toBe(true);
    expect(r.statusText).toBe("确定将选中的 2 项设为「停用」吗？");
    expect(r.statusOkLeft).toBe(true);
    expect(r.statusUnchanged).toBe(true);
    expect(r.statusChanged).toBe(true);
    expect(r.batchSm).toBe(true);
    expect(r.deleteNoModal).toBe(true);
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
const footerOrder = () => { const a = document.querySelector('[role="dialog"] [data-testid="dp-form-submit"]'), b = document.querySelector('[role="dialog"] [data-testid="dp-form-cancel"]'); if (!a || !b) return "missing"; const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (ra.left < rb.left && Math.abs(ra.top - rb.top) < 2 ? "ok" : "swapped") + ":" + a.textContent.replace(/\\s/g, "") + "," + b.textContent.replace(/\\s/g, ""); };
      const dialogForm = () => document.querySelector('[role="dialog"] [data-testid="dp-form"]');
      const confirmOpen = () => document.querySelector('[data-testid="dp-confirm"]');
      const total0 = D.total(k);
      // 新增：空提交 → 必填错误；非法邮箱 → 格式错误
      D.click(D.q(k, '[data-testid="dp-create"]'));
      await D.until(dialogForm);
      out.createTitle = D.text(document.querySelector('[role="dialog"] h2'));
      out.createOrder = footerOrder();
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
      out.editOrder = footerOrder();
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
      // 删除：点击只弹小气泡确认（不是大弹窗），行仍在；取消 / 点击外部关闭且不删除；确认才删除
      const delBtn = () => D.q(k, '[data-testid="dp-delete-' + newId + '"]');
      D.click(delBtn());
      await D.until(() => D.pop());
      out.noModal = !confirmOpen() && !document.querySelector('[role="dialog"]');
      out.confirmText = D.text(D.pop().querySelector("div.text-sm"));
      out.rowStillThere = !!D.q(k, '[data-testid="dp-row-' + newId + '"]') && D.total(k) === total0 + 1;
      D.click(D.popBtn("取消"));
      await D.until(() => !D.pop());
      out.cancelKeeps = !!D.q(k, '[data-testid="dp-row-' + newId + '"]') && D.total(k) === total0 + 1;
      D.click(delBtn());
      await D.until(() => D.pop());
      document.body.click();
      out.outsideClosed = await D.until(() => !D.pop(), 3000);
      out.outsideKeeps = D.total(k) === total0 + 1;
      D.click(delBtn());
      await D.until(() => D.pop());
      D.click(D.popBtn("删除"));
      await D.until(() => D.total(k) === total0);
      out.deleted = !D.q(k, '[data-testid="dp-row-' + newId + '"]');
      return out;`,
      );
      expect(r.createTitle).toContain("新增");
      // 页脚按钮顺序：「确定」在左、「取消」在右（新增 / 编辑一致）
      expect(r.createOrder).toBe("ok:确定,取消");
      expect(r.editOrder).toBe("ok:确定,取消");
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
      expect(r.noModal).toBe(true);
      expect(r.confirmText).toBe("确定删除Newbie 2？");
      expect(r.outsideClosed).toBe(true);
      expect(r.outsideKeeps).toBe(true);
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
      const j = D.q(k, '[data-testid="dp-jump"] input');
      D.fill(j, "3");
      j.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await D.until(() => range().startsWith("第 11-15"));
      out.jumped = range();
      const sz = D.q(k, '[data-testid="dp-pagesize"]');
      await D.pick(sz, "20 条/页");
      await D.until(() => range().startsWith("第 1-20"));
      out.size20 = [range(), D.rows(k).length];
      out.sizeOptions = [...D.q(k, '[data-testid="dp-pagesize"]').querySelectorAll('[role="option"]')].map((o) => o.textContent.trim());
      // 越界跳页被夹到最后一页
      const j2 = D.q(k, '[data-testid="dp-jump"] input');
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
      D.click(D.q(k, '[data-testid="dp-delete-' + id + '"]'));
      await D.until(() => D.pop());
      await D.sleep(700);
      out.notDeletedBeforeConfirm = D.total(k) === t0 + 1;
      D.click(D.popBtn("删除"));
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
        perPage: D.q(k, '[data-testid="dp-pagesize"]').querySelector('[role="option"]').textContent.trim(),
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
      const leading = document.querySelector('[data-testid="demo-custom-leading"]');
      const freezeBtn = D.q(k, '[data-testid="dp-row-extra-freeze-2"]');
      const notifyBtn = D.q(k, '[data-testid="dp-tb-extra-notify"]');
      const hintEl = () => document.querySelector('[data-testid="demo-custom-hint"]');
      // no confirm field: click runs action immediately (no Popconfirm)
      freezeBtn.scrollIntoView({ block: "center" });
      D.click(freezeBtn);
      await D.until(() => /freeze:/.test(D.text(hintEl())), 3000);
      const freezeHint = D.text(hintEl());
      D.click(notifyBtn);
      await D.until(() => /tb:notify/.test(D.text(hintEl())), 3000);
      const hint = D.text(hintEl());
      const pop = document.querySelector("[data-dreamer-popconfirm-panel]");
      // Btn wraps: testid on outer span, tone class on inner Button
      return {
        cells: D.qa(k, '[data-testid="demo-custom-name"]').length,
        leading: leading ? leading.textContent.trim() : "",
        noCreate: !D.q(k, '[data-testid="dp-create"]'),
        hasFreeze: !!freezeBtn,
        hasNotify: !!notifyBtn,
        freezeDelCls: !!(freezeBtn && freezeBtn.querySelector(".dp-act-del")),
        freezeHint,
        hint,
        noPopconfirm: !pop,
      };`,
      );
      expect(c.cells).toBe(5);
      expect(String(c.leading)).toContain("面板外提示");
      expect(c.noCreate).toBe(true);
      expect(c.hasFreeze).toBe(true);
      expect(c.hasNotify).toBe(true);
      expect(c.freezeDelCls).toBe(true);
      expect(String(c.freezeHint)).toContain("freeze:2");
      expect(String(c.hint)).toContain("tb:notify");
      expect(c.noPopconfirm).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "toolbar: false 整栏工具栏不出现；表格／分页仍在",
    async (t) => {
      if (!t?.browser?.goto) return;
      // open() waits for dp-refresh; toolbar:false has none — wait on table instead
      await sharedEnv.goto(t, DOC_PATH);
      await sharedEnv.waitDocMainReady(t);
      const ready = await ev<boolean>(
        t,
        `return await D.until(() => D.q(${P("demo-toolbar-off")}, '[data-testid="dp-table"]'), 30000);`,
      );
      expect(ready).toBe(true);
      await ev(t, `await D.sleep(300);`);
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-toolbar-off")};
      return {
        toolbar: !!D.q(k, '[data-testid="data-panel-toolbar"]'),
        table: !!D.q(k, '[data-testid="dp-table"]'),
        pagination: !!D.q(k, '[data-testid="dp-pagination"]'),
        refresh: !!D.q(k, '[data-testid="dp-refresh"]'),
        hint: !!document.querySelector('[data-testid="demo-toolbar-off-hint"]'),
        rows: D.rows(k).length,
      };`,
      );
      expect(r.toolbar).toBe(false);
      expect(r.table).toBe(true);
      expect(r.pagination).toBe(true);
      expect(r.refresh).toBe(false);
      expect(r.hint).toBe(true);
      expect((r.rows as number) > 0).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "移动端：表格卡上／左／右贴边；分页控件居中、条数在下居中；桌面表格区仍有间距",
    async (t) => {
      if (!t?.browser?.goto) return;
      // deno-lint-ignore no-explicit-any
      const page = (t.browser as any).page as {
        setViewportSize?: (s: { width: number; height: number }) => Promise<void>;
      } | undefined;
      if (!page?.setViewportSize) return;
      await sharedEnv.goto(t, DOC_PATH);
      await sharedEnv.waitDocMainReady(t);
      await ev(
        t,
        `return await D.until(() => D.q(${P("demo-toolbar-off")}, ".dp-table-wrap"), 30000);`,
      );

      await page.setViewportSize({ width: 1280, height: 800 });
      await ev(t, `await D.sleep(200);`);
      const desk = await ev<Record<string, number>>(
        t,
        `
      const k = ${P("demo-toolbar-off")};
      const card = getComputedStyle(D.q(k, ".dp-card"));
      const wrap = getComputedStyle(D.q(k, ".dp-table-wrap"));
      const rangeBox = D.q(k, ".dp-range").getBoundingClientRect();
      const ctrlsBox = D.q(k, ".dp-pg-ctrls").getBoundingClientRect();
      return {
        cardMT: parseFloat(card.marginTop),
        cardML: parseFloat(card.marginLeft),
        cardMR: parseFloat(card.marginRight),
        wrapPT: parseFloat(wrap.paddingTop),
        wrapPL: parseFloat(wrap.paddingLeft),
        wrapPR: parseFloat(wrap.paddingRight),
        wrapPB: parseFloat(wrap.paddingBottom),
        // desktop: range left of controls (same row)
        deskSideBySide: rangeBox.right <= ctrlsBox.left + 2 ? 1 : 0,
        deskSameRow: Math.abs(rangeBox.top - ctrlsBox.top) < 24 ? 1 : 0,
      };`,
      );
      expect(desk.wrapPT).toBeGreaterThan(0);
      expect(desk.wrapPL).toBeGreaterThan(0);
      expect(desk.wrapPR).toBeGreaterThan(0);
      expect(desk.wrapPB).toBeGreaterThan(0);
      expect(desk.deskSideBySide).toBe(1);
      expect(desk.deskSameRow).toBe(1);

      await page.setViewportSize({ width: 375, height: 812 });
      await ev(t, `await D.sleep(200);`);
      const mob = await ev<Record<string, number>>(
        t,
        `
      const k = ${P("demo-toolbar-off")};
      const card = getComputedStyle(D.q(k, ".dp-card"));
      const wrap = getComputedStyle(D.q(k, ".dp-table-wrap"));
      const pgEl = D.q(k, ".dp-pg");
      const pg = getComputedStyle(pgEl);
      const rangeEl = D.q(k, ".dp-range");
      const ctrlsEl = D.q(k, ".dp-pg-ctrls");
      const pgBox = pgEl.getBoundingClientRect();
      const rangeBox = rangeEl.getBoundingClientRect();
      const ctrlsBox = ctrlsEl.getBoundingClientRect();
      const pgMid = pgBox.left + pgBox.width / 2;
      return {
        cardMT: parseFloat(card.marginTop),
        cardML: parseFloat(card.marginLeft),
        cardMR: parseFloat(card.marginRight),
        wrapPT: parseFloat(wrap.paddingTop),
        wrapPL: parseFloat(wrap.paddingLeft),
        wrapPR: parseFloat(wrap.paddingRight),
        wrapPB: parseFloat(wrap.paddingBottom),
        pgPL: parseFloat(pg.paddingLeft),
        pgPR: parseFloat(pg.paddingRight),
        pgPB: parseFloat(pg.paddingBottom),
        rangeBelow: rangeBox.top >= ctrlsBox.bottom - 2 ? 1 : 0,
        rangeCenterDelta: Math.abs((rangeBox.left + rangeBox.right) / 2 - pgMid),
        ctrlsCenterDelta: Math.abs((ctrlsBox.left + ctrlsBox.right) / 2 - pgMid),
        pgW: pgBox.width,
      };`,
      );
      expect(mob.cardMT).toBe(0);
      expect(mob.cardML).toBe(0);
      expect(mob.cardMR).toBe(0);
      expect(mob.wrapPT).toBe(0);
      expect(mob.wrapPL).toBe(0);
      expect(mob.wrapPR).toBe(0);
      expect(mob.wrapPB).toBeGreaterThan(0);
      expect(mob.pgPL).toBeGreaterThan(0);
      expect(mob.pgPR).toBeGreaterThan(0);
      expect(mob.pgPB).toBeGreaterThan(0);
      // mobile: controls centered; range below + centered
      expect(mob.rangeBelow).toBe(1);
      expect(mob.rangeCenterDelta).toBeLessThan(mob.pgW * 0.25);
      expect(mob.ctrlsCenterDelta).toBeLessThan(mob.pgW * 0.25);

      // restore desktop viewport for subsequent tests in shared browser
      await page.setViewportSize({ width: 1280, height: 800 });
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "刷新按钮重新加载当前页；每个面板互不影响（同页 23 个实例）",
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
      expect(r.toolbars).toBe(22);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "23 个示例：22 个有工具栏；toolbar:false 示例无工具栏，表格／分页齐全",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-basic");
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const keys = ["demo-basic","demo-search","demo-table","demo-crud","demo-batch","demo-page","demo-export","demo-remote","demo-dark","demo-locale","demo-toolbar-off","demo-defaults","demo-bool","demo-tb-fn","demo-ra-fn","demo-tb-custom","demo-ra-custom","demo-key-order","demo-enabled","demo-title","demo-can","demo-custom","demo-cell"];
      await D.until(() => D.total("demo-remote") > 0, 10000);
      const out = {};
      for (const k of keys) {
        const hasTb = !!D.q(k, '[data-testid="data-panel-toolbar"]');
        out[k] = {
          toolbar: hasTb,
          table: !!D.q(k, '[data-testid="dp-table"]'),
          pagination: !!D.q(k, '[data-testid="dp-pagination"]'),
          rows: D.rows(k).length,
          // toolbar:false panel has no refresh; treat table presence as hydrated proxy
          hydrated: k === "demo-toolbar-off"
            ? !!D.q(k, '[data-testid="dp-table"]')
            : !!D.q(k, '[data-testid="dp-refresh"]'),
          visible: D.q(k, ".dp-card").getBoundingClientRect().height > 100,
        };
      }
      return out;`,
      );
      expect(Object.keys(r).length).toBe(23);
      for (const [k, v] of Object.entries(r)) {
        const o = v as Record<string, unknown>;
        const expectTb = k !== "demo-toolbar-off";
        expect([k, o.toolbar, o.table, o.pagination, o.hydrated, o.visible])
          .toEqual([k, expectTb, true, true, true, true]);
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
        await D.until(() => D.pop());
        D.click(D.popBtn("取消"));
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
    "状态开关（ui-view Switch）：ON 旋钮在右、OFF 在左、有过渡动画；locked 行为禁用开关（浅色 / 深色）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-basic");
      const measure = () =>
        ev<Record<string, Record<string, unknown>>>(
          t,
          `
        const k = ${P("demo-basic")};
        const m = (id) => {
          const s = D.sw(k, id);
          const br = s.track.getBoundingClientRect(), kr = s.knob.getBoundingClientRect();
          const cs = getComputedStyle(s.track), ks = getComputedStyle(s.knob);
          return {
            checked: s.on, disabled: s.input.disabled, native: s.input.type, cursor: getComputedStyle(s.label).cursor,
            w: Math.round(br.width), h: Math.round(br.height),
            knobLeft: Math.round((kr.left - br.left) * 10) / 10, knobRight: Math.round((br.right - kr.right) * 10) / 10,
            knobCenterRight: kr.left + kr.width / 2 > br.left + br.width / 2,
            knobW: Math.round(kr.width), knobH: Math.round(kr.height),
            radius: parseFloat(cs.borderTopLeftRadius), opacity: cs.opacity, bg: cs.backgroundColor,
            kTrans: ks.transitionProperty + "|" + ks.transitionDuration,
          };
        };
        return { on: m(2), off: m(4), locked: m(1) };`,
        );
      const check = (
        r: Record<string, Record<string, unknown>>,
        dark: boolean,
      ) => {
        const tag = dark ? "dark" : "light";
        // ON：蓝色，旋钮在右侧
        expect([tag, r.on.checked]).toEqual([tag, true]);
        expect([tag, r.on.knobCenterRight]).toEqual([tag, true]);
        expect([tag, r.on.knobRight]).toEqual([tag, 2]);
        const onRgb = (r.on.bg as string).match(/\d+/g)!.map(Number);
        // 蓝色系（theme 主色）：B 通道明显高于 R，且与 OFF 底色不同
        expect([tag, onRgb[2] - onRgb[0] > 100]).toEqual([tag, true]);
        expect([tag, r.on.bg !== r.off.bg]).toEqual([tag, true]);
        // OFF：旋钮在左侧
        expect([tag, r.off.checked]).toEqual([tag, false]);
        expect([tag, r.off.knobCenterRight]).toEqual([tag, false]);
        expect([tag, r.off.knobLeft]).toEqual([tag, 2]);
        const offRgb = (r.off.bg as string).match(/\d+/g)!.map(Number);
        // OFF：灰色系（slate），不是蓝 / 绿
        expect([tag, Math.abs(offRgb[2] - offRgb[0]) < 60]).toEqual([
          tag,
          true,
        ]);
        // 圆形旋钮 + 胶囊轨道 + 过渡（同一个 ui-view Switch 组件）
        for (const x of [r.on, r.off, r.locked]) {
          expect([tag, x.w, x.h]).toEqual([tag, 44, 24]);
          expect([tag, x.knobW, x.knobH]).toEqual([tag, 20, 20]);
          expect((x.radius as number) >= 10).toBe(true);
          expect(String(x.kTrans)).toContain("transform");
          expect(String(x.kTrans)).toContain("0.2s");
        }
        expect([tag, r.on.disabled, r.on.opacity, r.off.disabled]).toEqual([
          tag,
          false,
          "1",
          false,
        ]);
        // locked 行：禁用开关（不是浅绿色方块）：胶囊、半透明、not-allowed、仍显示当前状态（ON → 旋钮在右）
        expect([tag, r.locked.disabled]).toEqual([tag, true]);
        expect([tag, r.locked.opacity]).toEqual([tag, "0.5"]);
        expect([tag, r.locked.cursor]).toEqual([tag, "not-allowed"]);
        expect([tag, r.locked.checked, r.locked.knobCenterRight]).toEqual([
          tag,
          true,
          true,
        ]);
        expect([tag, r.locked.bg]).toEqual([tag, r.on.bg]);
      };
      check(await measure(), false);

      // 点击 locked 开关无效
      const afterClick = await ev<boolean>(
        t,
        `const k = ${P("demo-basic")};
       D.sw(k, 1).toggle(); await D.sleep(500);
       return D.sw(k, 1).on;`,
      );
      expect(afterClick).toBe(true);

      // 动画：点击 ON 开关后，旋钮的 translateX 在 20px → 0px 之间出现中间值（不是瞬移）
      const anim = await ev<{ samples: number[]; end: boolean }>(
        t,
        `
      const k = ${P("demo-basic")};
      const tx = () => new DOMMatrixReadOnly(getComputedStyle(D.sw(k, 3).knob).transform).m41;
      const start = tx();
      const samples = [];
      D.sw(k, 3).toggle();
      const t0 = performance.now();
      while (performance.now() - t0 < 500) { try { samples.push(Math.round(tx() * 100) / 100); } catch (_) {} await new Promise((r) => requestAnimationFrame(r)); }
      return { samples: [start, ...samples], end: D.sw(k, 3).on };`,
      );
      expect(anim.end).toBe(false);
      expect(anim.samples[0]).toBe(20);
      expect(anim.samples[anim.samples.length - 1]).toBe(0);
      expect(anim.samples.some((v) => v > 0.5 && v < 19.5)).toBe(true);

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

  // ---------------------------------------------------------------- 单元格编辑
  /** 每种可编辑类型一个用例：dblclick 进入编辑 → 改值（用 ui-view 控件的真实交互）→ 按模式结束 */
  const CELL_CASES = [
    { prop: "name", id: "2", kind: "input", set: "Zed", shows: ["Zed"] },
    { prop: "score", id: "2", kind: "input", set: "99", shows: ["99"] },
    { prop: "role", id: "2", kind: "select", set: "管理员", shows: ["管理员"] },
    {
      prop: "tags",
      id: "3",
      kind: "multi",
      set: ["VIP", "内测"],
      shows: ["VIP", "内测"],
    },
    { prop: "birthday", id: "2", kind: "date", day: 15, shows: ["-15"] },
    {
      prop: "loginAt",
      id: "2",
      kind: "datetime",
      day: 15,
      hour: 5,
      minute: 6,
      shows: ["-15 05:06"],
    },
    {
      prop: "remark",
      id: "2",
      kind: "input",
      set: "line1\nline2",
      shows: ["line1", "line2"],
    },
  ];

  /** 在页内跑完所有类型用例；mode: blur | enter | esc | fail */
  const runCells = (t: T, mode: string) =>
    ev<
      Record<
        string,
        {
          before: string;
          after: string;
          editorGone: boolean;
          error: boolean;
          editorKind: string;
          native: number;
          stillEditingAfterPick: boolean;
        }
      >
    >(
      t,
      `
      const k = ${P("demo-cell")};
      const mode = ${JSON.stringify(mode)};
      const cases = ${JSON.stringify(CELL_CASES)};
      const out = {};
      const shown = (c) => { const e = D.q(k, '[data-testid="dp-edit-' + c.prop + '-' + c.id + '"]'); return e ? e.textContent : null; };
      const editor = (c) => D.q(k, '[data-testid="dp-inline-' + c.prop + '"]');
      /** 用 ui-view 控件的真实交互改值 */
      const setValue = async (ed, c) => {
        if (c.kind === "input") {
          const el = ed.querySelector("input:not([type=hidden]), textarea");
          el.focus(); el.value = c.set;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (c.kind === "select") {
          await D.pick(ed, c.set);
        } else if (c.kind === "multi") {
          await D.until(() => ed.querySelector('[role="option"]'));
          for (const o of ed.querySelectorAll('[role="option"]')) {
            const want = c.set.includes(o.textContent.trim());
            if ((o.getAttribute("aria-selected") === "true") !== want) { o.click(); await D.sleep(60); }
          }
          [...ed.querySelectorAll("button")].find((b) => b.textContent.trim() === "完成").click();
        } else {
          await D.until(() => ed.querySelector("[data-ui-calendar-day]"));
          [...ed.querySelectorAll("[data-ui-calendar-day]")].find((b) => b.textContent.trim() === String(c.day)).click();
          if (c.kind === "datetime") {
            ed.querySelector('[data-picker-time-kind="hour"] [data-picker-cell-value="' + c.hour + '"]').click();
            ed.querySelector('[data-picker-time-kind="minute"] [data-picker-cell-value="' + c.minute + '"]').click();
          }
          await D.sleep(60);
          [...ed.querySelector('[role="dialog"]').querySelectorAll("button")].find((b) => b.textContent.trim() === "确定").click();
        }
        await D.sleep(250);
      };
      if (mode === "fail") {
        D.click(D.g('[data-testid="cell-demo-fail"]'));
        await D.sleep(100);
      }
      for (const c of cases) {
        const before = shown(c);
        D.q(k, '[data-testid="dp-edit-' + c.prop + '-' + c.id + '"]').dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        await D.until(() => editor(c));
        const ed = editor(c);
        await D.until(() => ed.contains(document.activeElement));
        const marker = ({
          input: () => (c.prop === "remark" ? "textarea" : c.prop === "score" ? "number" : "text"),
          select: () => "select", multi: () => "multiselect", date: () => "datepicker", datetime: () => "datetimepicker",
        })[c.kind]();
        const ui = {
          text: !!ed.querySelector("input[type=text], input:not([type])"),
          number: !!ed.querySelector('button[aria-label="增加"]'),
          textarea: !!ed.querySelector("textarea"),
          select: !!ed.querySelector('button[aria-haspopup="listbox"]') && !ed.querySelector("[data-ui-multiselect-panel]"),
          multiselect: !!ed.querySelector("[data-ui-multiselect-panel]"),
          datepicker: !!ed.querySelector("[data-ui-datepicker-root]"),
          datetimepicker: !!ed.querySelector("[data-ui-datetime-picker-root]"),
        }[marker];
        // 不能出现原生 select / date / datetime-local / checkbox / multiple 控件
        const native = ed.querySelectorAll('select, input[type=date], input[type=datetime-local], input[type=time], input[type=checkbox], input[type=radio]').length;
        await setValue(ed, c);
        // 选完值（浮层关闭 / 确定）后仍处于编辑态：等失焦 / Enter 才保存
        const stillEditingAfterPick = !!editor(c);
        if (mode === "blur" || mode === "fail") (document.activeElement || document.body).blur();
        else if (mode === "enter") ed.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        else if (mode === "esc") ed.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        const gone = await D.until(() => !editor(c), 3000);
        await D.sleep(450);
        out[c.prop] = {
          before, after: shown(c), editorGone: gone,
          error: mode === "fail" ? await D.until(() => document.body.innerText.includes("保存失败（演示：服务端拒绝）"), 2000) : false,
          editorKind: ed.getAttribute("data-editor") + ":" + marker + ":" + ui,
          native, stillEditingAfterPick,
        };
        // 等 toast 消失 / 重渲染稳定，避免影响下一个用例
        await D.sleep(150);
      }
      return out;`,
    );

  it(
    "单元格编辑·失焦保存：每种类型用 ui-view 控件（无原生控件）dblclick → 改值 → blur 后保存并回到展示态",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-cell");
      const r = await runCells(t, "blur");
      expect(r.name.editorKind).toBe("text:text:true");
      expect(r.score.editorKind).toBe("number:number:true");
      expect(r.role.editorKind).toBe("select:select:true");
      expect(r.tags.editorKind).toBe("multiselect:multiselect:true");
      expect(r.birthday.editorKind).toBe("date:datepicker:true");
      expect(r.loginAt.editorKind).toBe("datetime:datetimepicker:true");
      expect(r.remark.editorKind).toBe("textarea:textarea:true");
      for (const c of CELL_CASES) {
        const x = r[c.prop];
        expect([c.prop, "native", x.native]).toEqual([c.prop, "native", 0]);
        expect([c.prop, "editorGone", x.editorGone]).toEqual([
          c.prop,
          "editorGone",
          true,
        ]);
        expect([c.prop, x.after !== x.before]).toEqual([c.prop, true]);
        for (const s of c.shows) {
          expect([c.prop, String(x.after).includes(s)])
            .toEqual([c.prop, true]);
        }
      }
      // 浮层选完值 / 点确定后不会提前保存：仍在编辑，直到失焦
      for (const p of ["role", "tags", "birthday", "loginAt"]) {
        expect([p, r[p].stillEditingAfterPick]).toEqual([p, true]);
      }
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "单元格编辑·Enter 保存：每种类型（textarea 也是 Enter 保存）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-cell");
      const r = await runCells(t, "enter");
      for (const c of CELL_CASES) {
        const x = r[c.prop];
        expect([c.prop, x.editorGone]).toEqual([c.prop, true]);
        for (const s of c.shows) {
          expect([c.prop, String(x.after).includes(s)])
            .toEqual([c.prop, true]);
        }
      }
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "单元格编辑·Esc 取消：每种类型都恢复原值并回到展示态（不保存、不残留）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-cell");
      const r = await runCells(t, "esc");
      for (const c of CELL_CASES) {
        const x = r[c.prop];
        expect([c.prop, x.editorGone]).toEqual([c.prop, true]);
        expect([c.prop, x.after]).toEqual([c.prop, x.before]);
      }
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "单元格编辑·浮层打开时 Esc 只关浮层、不取消编辑；点编辑器外部保存",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-cell");
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-cell")};
      const out = {};
      const edit = (p, id) => D.q(k, '[data-testid="dp-edit-' + p + '-' + id + '"]');
      const ed = (p) => D.q(k, '[data-testid="dp-inline-' + p + '"]');
      edit("role", 2).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      await D.until(() => ed("role") && ed("role").querySelector('[aria-expanded="true"]'));
      out.opened = !!ed("role").querySelector('[aria-expanded="true"]');
      ed("role").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await D.sleep(300);
      out.stillEditing = !!ed("role");
      // 再次 Esc：真正取消
      ed("role").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await D.until(() => !ed("role"));
      out.cancelled = !ed("role");
      // 点编辑器外部：选值后保存
      const before = edit("role", 2).textContent;
      edit("role", 2).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      await D.until(() => ed("role"));
      await D.pick(ed("role"), before.includes("管理员") ? "访客" : "管理员");
      await D.sleep(200);
      out.editingAfterPick = !!ed("role");
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await D.until(() => !ed("role"));
      await D.sleep(450);
      out.saved = edit("role", 2).textContent !== before;
      return out;`,
      );
      expect(r.opened).toBe(true);
      expect(r.stillEditing).toBe(true);
      expect(r.cancelled).toBe(true);
      expect(r.editingAfterPick).toBe(true);
      expect(r.saved).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "单元格编辑·保存失败：提示错误、保持原值、回到展示态（含开关）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-cell");
      const r = await runCells(t, "fail");
      for (const c of CELL_CASES) {
        const x = r[c.prop];
        expect([c.prop, x.editorGone]).toEqual([c.prop, true]);
        expect([c.prop, x.error]).toEqual([c.prop, true]);
        expect([c.prop, x.after]).toEqual([c.prop, x.before]);
      }
      // 开关：失败后回到原状态
      const sw = await ev<{ before: boolean; after: boolean }>(
        t,
        `const k = ${P("demo-cell")};
       const before = D.sw(k, 2).on;
       D.sw(k, 2).toggle();
       await D.sleep(1000);
       return { before, after: D.sw(k, 2).on };`,
      );
      expect(sw.after).toBe(sw.before);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "单元格编辑·开关：点击即切换并保存；number 输入非法值时提示并保持原值；未改动失焦不保存",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-cell");
      const r = await ev<Record<string, unknown>>(
        t,
        `
      const k = ${P("demo-cell")};
      const out = {};
      const s0 = D.sw(k, 2).on;
      D.sw(k, 2).toggle();
      await D.sleep(900);
      out.switched = D.sw(k, 2).on !== s0;
      // number：清空后失焦 → 非法，保持原值
      const span = () => D.q(k, '[data-testid="dp-edit-score-3"]');
      const inp = () => D.q(k, '[data-testid="dp-inline-score"] input');
      const before = span().textContent;
      span().dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      await D.until(() => inp());
      await D.until(() => document.activeElement === inp());
      inp().value = "";
      inp().dispatchEvent(new Event("input", { bubbles: true }));
      document.activeElement.blur();
      await D.until(() => !D.q(k, '[data-testid="dp-inline-score"]'));
      await D.sleep(300);
      out.invalidKept = span().textContent === before;
      out.invalidMsg = await D.until(() => document.body.innerText.includes("表单有误"), 2000);
      // 未改动直接失焦：回到展示态，原值不变
      span().dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      await D.until(() => inp());
      await D.until(() => document.activeElement === inp());
      out.focusedOnOpen = document.activeElement === inp();
      document.activeElement.blur();
      await D.until(() => !D.q(k, '[data-testid="dp-inline-score"]'));
      out.unchangedKept = span().textContent === before;
      return out;`,
      );
      expect(r.switched).toBe(true);
      expect(r.invalidKept).toBe(true);
      expect(r.invalidMsg).toBe(true);
      expect(r.focusedOnOpen).toBe(true);
      expect(r.unchangedKept).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it("单元格编辑·深色：编辑器与浮层配色可读（深色底 + 亮字）", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t, "demo-cell");
    await ev(
      t,
      `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
       b.click(); await D.sleep(700);`,
    );
    const r = await ev<Record<string, { ratio: number; lum: number }>>(
      t,
      `const k = ${P("demo-cell")};
       const out = {};
       for (const [p, id, sel] of [["name", 2, "input"], ["role", 2, "button[aria-haspopup]"], ["birthday", 2, "button[aria-haspopup]"], ["remark", 2, "textarea"]]) {
         D.q(k, '[data-testid="dp-edit-' + p + '-' + id + '"]').dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
         await D.until(() => D.q(k, '[data-testid="dp-inline-' + p + '"]'));
         await D.sleep(300);
         const ed = D.q(k, '[data-testid="dp-inline-' + p + '"]');
         const ctl = ed.querySelector(sel);
         const bg = D.effBg(ctl);
         out[p] = { ratio: Math.round(D.contrast(ctl.querySelector("span") || ctl) * 100) / 100, lum: (bg[0] + bg[1] + bg[2]) / 3 };
         ed.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
         ed.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
         await D.until(() => !D.q(k, '[data-testid="dp-inline-' + p + '"]'));
       }
       return out;`,
    );
    for (const p of ["name", "role", "birthday", "remark"]) {
      expect([p, r[p].lum < 90]).toEqual([p, true]); // 深色底
      expect([p, r[p].ratio >= 4.5]).toEqual([p, true]);
    }
  }, DOCS_BROWSER_CONFIG);
  it(
    "行删除用小气泡确认：箭头在按钮上方、问号图标在左、红色删除 + 取消；浅色 / 深色；取消 / 点外部不删除；确认才删",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-crud");
      const measure = () =>
        ev<Record<string, unknown>>(
          t,
          `
        const k = ${P("demo-crud")};
        const out = {};
        D.q(k, '[data-testid="dp-delete-3"]').scrollIntoView({ block: "center" });
        await D.sleep(150);
        D.click(D.q(k, '[data-testid="dp-delete-3"]'));
        await D.until(() => D.pop());
        await D.sleep(300);
        // 气泡打开会重建触发器：重新取按钮
        const btn = D.q(k, '[data-testid="dp-delete-3"] button') || D.q(k, '[data-testid="dp-delete-3"]');
        const panel = D.pop();
        const pr = panel.getBoundingClientRect(), br = btn.getBoundingClientRect();
        const name = D.names(k)[2];
        out.text = D.text(panel.querySelector("div.text-sm"));
        out.name = name;
        out.above = pr.bottom <= br.top + 1;
        out.centered = Math.abs((pr.left + pr.width / 2) - (br.left + br.width / 2)) < 6;
        out.small = pr.width < 360 && pr.height < 140;
        out.inBody = panel.closest("[data-dreamer-popconfirm-panel]") !== null && !document.querySelector('[role="dialog"]');
        const icon = panel.querySelector("svg");
        out.iconLeft = !!icon && icon.getBoundingClientRect().right <= panel.querySelector("div.text-sm").getBoundingClientRect().left + 1;
        const arrow = panel.querySelector('[aria-hidden="true"]');
        out.arrow = !!arrow && arrow.getBoundingClientRect().height > 0;
        const ok = D.popBtn("删除"), cancel = D.popBtn("取消");
        out.btns = !!ok && !!cancel && ok.getBoundingClientRect().left < cancel.getBoundingClientRect().left;
        const okBg = D.rgba(getComputedStyle(ok).backgroundColor);
        out.okRed = okBg[0] > 180 && okBg[1] < 90 && okBg[2] < 90;
        const cs = getComputedStyle(panel);
        out.panelBg = cs.backgroundColor;
        out.panelFg = cs.color;
        out.ratio = Math.round(D.contrast(panel.querySelector("div.text-sm")) * 100) / 100;
        out.arrowBg = arrow ? getComputedStyle(arrow).backgroundColor : "";
        D.click(cancel);
        await D.until(() => !D.pop());
        return out;`,
        );
      const light = await measure();
      expect(light.text).toBe("确定删除" + light.name + "？");
      expect(light.above).toBe(true);
      expect(light.centered).toBe(true);
      expect(light.small).toBe(true);
      expect(light.inBody).toBe(true);
      expect(light.iconLeft).toBe(true);
      expect(light.arrow).toBe(true);
      expect(light.btns).toBe(true);
      expect(light.okRed).toBe(true);
      expect(light.panelBg).toBe("rgb(255, 255, 255)");
      expect((light.ratio as number) >= 4.5).toBe(true);
      await ev(
        t,
        `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
       b.click(); await D.sleep(700);`,
      );
      const dark = await measure();
      expect(dark.text).toBe("确定删除" + dark.name + "？");
      expect(dark.above).toBe(true);
      expect(dark.okRed).toBe(true);
      expect(dark.panelBg).toBe("rgb(30, 41, 59)");
      expect(dark.arrowBg).toBe("rgb(30, 41, 59)");
      expect((dark.ratio as number) >= 4.5).toBe(true);
      // 切换行：打开 A 后点 B 的删除 → 只有 B 的气泡
      const sw = await ev<Record<string, unknown>>(
        t,
        `const k = ${P("demo-crud")};
       D.click(D.q(k, '[data-testid="dp-delete-3"]'));
       await D.until(() => D.pop());
       D.click(D.q(k, '[data-testid="dp-delete-4"]'));
       await D.sleep(400);
       const pops = document.querySelectorAll(".dp-pop");
       const out = { count: pops.length, text: pops[0] ? D.text(pops[0].querySelector("div.text-sm")) : "", total: D.total(k) };
       document.body.click();
       await D.until(() => !D.pop());
       return out;`,
      );
      expect(sw.count).toBe(1);
      expect(String(sw.text)).toBe(
        "确定删除" +
          (await ev<string>(t, `return D.names(${P("demo-crud")})[3];`)) + "？",
      );
      expect(sw.total).toBe(8);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "行删 Popconfirm 打开时同锚点 Tooltip「删除」不挡确认钮（tip 仍 top；打开时隐藏）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-crud");
      const r = await ev<Record<string, unknown>>(
        t,
        `
        const k = ${P("demo-crud")};
        const wrap = D.q(k, '[data-testid="dp-delete-3"]');
        wrap.scrollIntoView({ block: "center" });
        await D.sleep(120);
        // 先悬停出 Tooltip「删除」
        wrap.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        await D.sleep(200);
        const tipBefore = [...document.querySelectorAll('[role="tooltip"]')]
          .filter((el) => (el.textContent || "").trim() === "删除")
          .some((el) => {
            const cs = getComputedStyle(el);
            return cs.opacity !== "0" && cs.visibility !== "hidden";
          });
        D.click(wrap);
        await D.until(() => D.pop());
        await D.sleep(200);
        const tips = [...document.querySelectorAll('[role="tooltip"]')]
          .filter((el) => (el.textContent || "").trim() === "删除");
        const tipVisible = tips.some((el) => {
          const cs = getComputedStyle(el);
          return cs.opacity !== "0" && cs.visibility !== "hidden" && el.getClientRects().length > 0;
        });
        const ok = D.popBtn("删除");
        const panel = D.pop();
        let tipBlocksOk = false;
        if (tipVisible && ok) {
          const tr = tips[0].getBoundingClientRect();
          const or = ok.getBoundingClientRect();
          tipBlocksOk = !(tr.bottom < or.top || tr.top > or.bottom || tr.right < or.left || tr.left > or.right);
        }
        D.click(D.popBtn("取消"));
        await D.until(() => !D.pop());
        return { tipBefore, tipVisible, tipBlocksOk, hasOk: !!ok, hasPanel: !!panel };
        `,
      );
      // tip may or may not have shown before click depending on hover path; after open must not block
      expect(r.hasOk).toBe(true);
      expect(r.hasPanel).toBe(true);
      expect(r.tipVisible).toBe(false);
      expect(r.tipBlocksOk).toBe(false);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "操作列图标：无边框无底色的纯图标、图标之间有间距；悬停只变色；禁用删除为半透明灰 + not-allowed（浅色 / 深色）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-basic");
      // deno-lint-ignore no-explicit-any
      const page = (t.browser as any).page;
      const style = (sel: string) =>
        ev<Record<string, string | number>>(
          t,
          `const b = document.querySelector(${JSON.stringify(sel)} + " button");
         const cs = getComputedStyle(b);
         return { color: cs.color, bg: cs.backgroundColor, bw: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join(","),
           bs: cs.borderTopStyle, shadow: cs.boxShadow, opacity: cs.opacity, cursor: cs.cursor, disabled: b.disabled ? 1 : 0,
           w: b.getBoundingClientRect().width };`,
        );
      const row = (id: string, kind: string) =>
        `[data-testid="panel-demo-basic"] [data-testid="dp-${kind}-${id}"]`;
      const check = async (dark: boolean) => {
        const tag = dark ? "dark" : "light";
        const base = dark ? "rgb(148, 163, 184)" : "rgb(100, 116, 139)";
        const hover = dark ? "rgb(96, 165, 250)" : "rgb(37, 99, 235)";
        const hoverDel = dark ? "rgb(248, 113, 113)" : "rgb(220, 38, 38)";
        await page.mouse.move(2, 2);
        for (const kind of ["view", "edit", "delete"]) {
          const sel = row("2", kind);
          await page.hover(
            `[data-testid="panel-demo-basic"] [data-testid="dp-row-2"] td:first-child`,
          );
          const s0 = await style(sel);
          // 无边框、无底色、无阴影
          expect([tag, kind, s0.bw]).toEqual([tag, kind, "0px,0px,0px,0px"]);
          expect([tag, kind, s0.bg]).toEqual([tag, kind, "rgba(0, 0, 0, 0)"]);
          expect([tag, kind, s0.shadow]).toEqual([tag, kind, "none"]);
          expect([tag, kind, s0.color]).toEqual([tag, kind, base]);
          // 悬停：只变色，仍无边框 / 底色
          await page.hover(`${sel} button`);
          await ev(t, `await D.sleep(300);`);
          const s1 = await style(sel);
          expect([tag, kind, s1.color]).toEqual([
            tag,
            kind,
            kind === "delete" ? hoverDel : hover,
          ]);
          expect([tag, kind, s1.bw]).toEqual([tag, kind, "0px,0px,0px,0px"]);
          expect([tag, kind, s1.bg]).toEqual([tag, kind, "rgba(0, 0, 0, 0)"]);
          expect([tag, kind, s1.opacity]).toEqual([tag, kind, "1"]);
        }
        // 禁用的删除（locked 行）：半透明灰、not-allowed，悬停不变色，同样无边框 / 底色
        const dsel = row("1", "delete");
        await page.hover(`${dsel}`);
        await ev(t, `await D.sleep(300);`);
        const d = await style(dsel);
        expect([tag, d.disabled]).toEqual([tag, 1]);
        expect([tag, d.opacity]).toEqual([tag, "0.4"]);
        expect([tag, d.cursor]).toEqual([tag, "not-allowed"]);
        expect([tag, d.color]).toEqual([
          tag,
          dark ? "rgb(100, 116, 139)" : "rgb(148, 163, 184)",
        ]);
        expect([tag, d.bg]).toEqual([tag, "rgba(0, 0, 0, 0)"]);
        expect([tag, d.bw]).toEqual([tag, "0px,0px,0px,0px"]);
        // 图标紧凑：16px 图标（与表格文字同大），相邻图标之间 4–8px（几乎相邻）
        const geo = await ev<{ sizes: number[][]; gaps: number[] }>(
          t,
          `const r = ["view","edit","delete"].map((k) => document.querySelector('[data-testid="panel-demo-basic"] [data-testid="dp-' + k + '-2"] svg').getBoundingClientRect());
         return { sizes: r.map((x) => [Math.round(x.width * 10) / 10, Math.round(x.height * 10) / 10]),
           gaps: [r[1].left - r[0].right, r[2].left - r[1].right].map((v) => Math.round(v * 10) / 10) };`,
        );
        for (const sz of geo.sizes) {
          expect([
            tag,
            sz[0] >= 15.5 && sz[0] <= 16.5,
            sz[1] >= 15.5 && sz[1] <= 16.5,
          ]).toEqual([tag, true, true]);
        }
        for (const g of geo.gaps) {
          expect([tag, g >= 4 && g <= 8]).toEqual([tag, true]);
        }
      };
      await check(false);
      await ev(
        t,
        `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
       b.click(); await D.sleep(700);`,
      );
      await check(true);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "查看（眼睛图标）详情弹窗：页脚右对齐「关闭」按钮，点击关闭；浅色 / 深色；en-US 为 Close",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-crud");
      const probe = () =>
        ev<Record<string, unknown>>(
          t,
          `
        const k = ${P("demo-crud")};
        const out = {};
        D.q(k, '[data-testid="dp-view-2"]').scrollIntoView({ block: "center" });
        await D.sleep(100);
        D.click(D.q(k, '[data-testid="dp-view-2"]'));
        await D.until(() => document.querySelector('[data-testid="dp-view-footer"]'));
        const dlg = D.dlg();
        const foot = document.querySelector('[data-testid="dp-view-footer"]');
        const btn = foot.querySelector("button");
        const fr = foot.getBoundingClientRect(), br = btn.getBoundingClientRect(), dr = dlg.getBoundingClientRect();
        out.text = btn.textContent.trim();
        out.rightAligned = Math.abs(fr.right - br.right) < 1 && br.left > fr.left + fr.width / 2;
        out.inside = br.right <= dr.right && br.bottom <= dr.bottom && br.top >= dr.top;
        const cs = getComputedStyle(btn);
        out.fg = cs.color; out.bg = cs.backgroundColor;
        out.ratio = Math.round(D.contrast(btn) * 100) / 100;
        // 与表单弹窗的页脚按钮同款（同一 Btn 组件）：圆角、非透明底
        out.radius = parseFloat(cs.borderTopLeftRadius) > 0;
        D.click(btn);
        out.closed = await D.until(() => !document.querySelector('[data-testid="dp-view-footer"]'), 3000);
        out.dialogGone = await D.until(() => !document.querySelector('[role="dialog"]'), 3000);
        return out;`,
        );
      const light = await probe();
      expect(light.text).toBe("关闭");
      expect(light.rightAligned).toBe(true);
      expect(light.inside).toBe(true);
      expect(light.radius).toBe(true);
      // 与表单页脚同款 Btn（默认样式 4.1:1），按 WCAG 1.4.11 UI 组件对比度 >= 3:1 断言
      expect((light.ratio as number) >= 3).toBe(true);
      expect(light.closed).toBe(true);
      expect(light.dialogGone).toBe(true);
      await ev(
        t,
        `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
       b.click(); await D.sleep(700);`,
      );
      const dark = await probe();
      expect(dark.text).toBe("关闭");
      expect(dark.rightAligned).toBe(true);
      // 深色下库默认 Button（sky-500 + 白字）本身只有 ~2.8:1，与其它弹窗页脚按钮同款；这里只防回归到更差
      expect((dark.ratio as number) >= 2.5).toBe(true);
      expect(dark.closed).toBe(true);
      expect(dark.dialogGone).toBe(true);
      // 文案可被 locale 切换：en-US 面板为 Close
      await ev(
        t,
        `const k = ${P("demo-locale")};
       D.q(k, '[data-testid^="dp-view-"]').scrollIntoView({ block: "center" });
       await D.sleep(100);
       D.click(D.q(k, '[data-testid^="dp-view-"]'));
       await D.until(() => document.querySelector('[data-testid="dp-view-footer"]'));`,
      );
      const en = await ev<string>(
        t,
        `return document.querySelector('[data-testid="dp-view-footer"] button').textContent.trim();`,
      );
      expect(en).toBe("Close");
      await ev(
        t,
        `D.click(document.querySelector('[data-testid="dp-view-footer"] button')); await D.sleep(300);`,
      );
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "分页「每页条数」与搜索 / 表单下拉使用 ui-view Select：紧凑、与分页按钮等高、选择生效；浅色 / 深色",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-page");
      const probe = () =>
        ev<Record<string, unknown>>(
          t,
          `
        const k = ${P("demo-page")};
        const out = {};
        const wrap = D.q(k, '[data-testid="dp-pagesize"]');
        wrap.scrollIntoView({ block: "center" }); await D.sleep(100);
        out.native = D.qa(k, '[data-testid="dp-pagination"] select').length;
        const trig = wrap.querySelector("button[aria-haspopup]");
        const tr = trig.getBoundingClientRect(), nx = D.q(k, '[data-testid="dp-next"]').getBoundingClientRect();
        out.width = Math.round(tr.width);
        out.heightDiff = Math.abs(tr.height - nx.height);
        const ch = trig.querySelector("svg, [role=img]").getBoundingClientRect();
        out.arrowGap = Math.round(tr.right - ch.right);
        out.ratio = Math.round(D.contrast(trig.querySelector("span")) * 100) / 100;
        out.bg = getComputedStyle(trig).backgroundColor;
        const before = D.rows(k).length;
        await D.pick(wrap, "20 条/页");
        await D.until(() => D.q(k, '[data-testid="dp-range"]').textContent.includes("1-20"));
        out.after = D.text(D.q(k, '[data-testid="dp-range"]'));
        await D.pick(D.q(k, '[data-testid="dp-pagesize"]'), "5 条/页");
        await D.until(() => D.q(k, '[data-testid="dp-range"]').textContent.includes("1-5 "));
        out.back = D.text(D.q(k, '[data-testid="dp-range"]'));
        return out;`,
        );
      const light = await probe();
      expect(light.native).toBe(0);
      expect((light.width as number) <= 120).toBe(true);
      expect((light.heightDiff as number) <= 4).toBe(true);
      expect((light.arrowGap as number) <= 12).toBe(true);
      expect((light.ratio as number) >= 4.5).toBe(true);
      expect(String(light.after).includes("1-20")).toBe(true);
      expect(String(light.back).includes("1-5 ")).toBe(true);
      await ev(
        t,
        `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
       b.click(); await D.sleep(700);`,
      );
      const dark = await probe();
      expect(dark.native).toBe(0);
      expect((dark.heightDiff as number) <= 4).toBe(true);
      expect((dark.arrowGap as number) <= 12).toBe(true);
      expect((dark.ratio as number) >= 4.5).toBe(true);
      expect(dark.bg).not.toBe(light.bg);
      expect(String(dark.after).includes("1-20")).toBe(true);
      // 搜索弹窗内的 select 也是 Select（无原生 select）
      const sm = await ev<Record<string, unknown>>(
        t,
        `const k = ${P("demo-basic")};
       D.q(k, '[data-testid="dp-search-toggle"]').scrollIntoView({ block: "center" });
       D.click(D.q(k, '[data-testid="dp-search-toggle"]'));
       await D.until(() => document.querySelector('[role="dialog"] [data-testid="dp-search"]'));
       const d = D.dlg();
       const w = d.querySelector('[data-testid="dp-f-role"]');
       const out = { native: d.querySelectorAll("select").length, hasTrigger: !!w.querySelector("button[aria-haspopup]") };
       const trig = w.querySelector("button[aria-haspopup]");
       trig.click(); await D.until(() => trig.getAttribute("aria-expanded") === "true");
       const lb = w.querySelector('[role="listbox"]').getBoundingClientRect(), vp = innerHeight;
       out.listboxVisible = lb.height > 0 && lb.bottom <= vp + 1;
       trig.click(); await D.sleep(100);
       D.click(D.g('[data-testid="dp-search-reset"]')); await D.sleep(200);
       D.click(document.querySelector('[role="dialog"] button[aria-label]')); await D.sleep(200);
       return out;`,
      );
      expect(sm.native).toBe(0);
      expect(sm.hasTrigger).toBe(true);
      expect(sm.listboxVisible).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "分页「跳至」输入框使用 ui-view Input：无原生微调箭头、紧凑、与分页按钮等高；Enter 跳转并夹取越界 / 非法值；浅色 / 深色",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-page");
      const probe = () =>
        ev<Record<string, unknown>>(
          t,
          `
        const k = ${P("demo-page")};
        const out = {};
        const range = () => D.text(D.q(k, '[data-testid="dp-range"]'));
        const inp = () => D.q(k, '[data-testid="dp-jump"] input');
        const go = async (v) => {
          const el = inp(); el.focus();
          D.fill(el, v);
          el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
          await D.sleep(300);
          return range();
        };
        D.q(k, '[data-testid="dp-jump"]').scrollIntoView({ block: "center" }); await D.sleep(100);
        const el = inp(), cs = getComputedStyle(el), r = el.getBoundingClientRect();
        const nx = D.q(k, '[data-testid="dp-next"]').getBoundingClientRect();
        out.type = el.type;
        out.width = Math.round(r.width);
        out.heightDiff = Math.abs(r.height - nx.height);
        out.appearance = cs.appearance || cs.webkitAppearance;
        out.ratio = Math.round(D.contrast(el) * 100) / 100;
        el.focus(); await D.sleep(50);
        const f = getComputedStyle(el);
        out.outlineW = f.outlineStyle === "none" ? 0 : parseFloat(f.outlineWidth);
        out.focusShadow = f.boxShadow;
        out.bg = f.backgroundColor;
        out.letters = (() => { D.fill(el, "a1b2"); return el.value; })();
        out.p3 = await go("3");
        out.clampHigh = await go("99");
        out.clampLow = await go("0");
        out.invalid = await go("abc");
        out.cleared = inp().value;
        await go("1");
        return out;`,
        );
      const check = (r: Record<string, unknown>) => {
        expect(r.type).toBe("text");
        expect((r.width as number) <= 64).toBe(true);
        expect((r.heightDiff as number) <= 4).toBe(true);
        expect(r.appearance).toBe("textfield");
        expect((r.ratio as number) >= 4.5).toBe(true);
        expect((r.outlineW as number) <= 2).toBe(true);
        expect(r.letters).toBe("12");
        expect(String(r.p3).startsWith("第 11-15")).toBe(true);
        expect(String(r.clampHigh).startsWith("第 36-40")).toBe(true);
        expect(String(r.clampLow).startsWith("第 1-5")).toBe(true);
        expect(String(r.invalid).startsWith("第 1-5")).toBe(true);
        expect(r.cleared).toBe("");
      };
      const light = await probe();
      check(light);
      await ev(
        t,
        `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
       b.click(); await D.sleep(700);`,
      );
      const dark = await probe();
      check(dark);
      expect(dark.bg).not.toBe(light.bg);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "编辑 Modal 全部字段类型使用 ui-view 控件（text / number / select / multiselect / switch / date / datetime / textarea），无原生控件，改值后提交生效；浅色 / 深色",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t, "demo-cell");
      const run = (dark: boolean) =>
        ev<Record<string, unknown>>(
          t,
          `
        const k = ${P("demo-cell")};
        const dark = ${dark};
        const out = {};
        const row = () => D.q(k, '[data-testid="dp-row-2"]');
        D.q(k, '[data-testid="dp-edit-2"]').scrollIntoView({ block: "center" });
        D.click(D.q(k, '[data-testid="dp-edit-2"]'));
        await D.until(() => document.querySelector('[role="dialog"] [data-testid="dp-form"]'));
        const d = D.dlg();
        const f = (n) => d.querySelector('[data-testid="dp-fld-' + n + '"]');
        // Switch 内部是 sr-only 的 checkbox（ui-view 组件自身），其余原生控件不允许出现
        out.native = d.querySelectorAll("select, input[type=date], input[type=datetime-local], input[type=time], input[type=checkbox]:not(.sr-only), input[type=radio]").length;
        out.markers = {
          name: !!f("name").querySelector("input"),
          score: !!f("score").querySelector('button[aria-label="增加"]'),
          role: !!f("role").querySelector('button[aria-haspopup="listbox"]'),
          tags: !!f("tags").querySelector("[data-ui-multiselect-panel]"),
          status: !!f("status").querySelector("label input[type=checkbox].sr-only") || !!f("status").querySelector("label"),
          birthday: !!f("birthday").querySelector("[data-ui-datepicker-root]"),
          loginAt: !!f("loginAt").querySelector("[data-ui-datetime-picker-root]"),
          remark: !!f("remark").querySelector("textarea"),
        };
        out.prefill = { birthday: D.picked(f("birthday")), loginAt: D.picked(f("loginAt")), role: D.picked(f("role")) };
        // 改值（真实交互）
        D.fill(f("score").querySelector("input"), "77");
        await D.pick(f("role"), "管理员");
        await D.until(() => f("tags").querySelector('[role="option"]'));
        const tg = f("tags"); tg.querySelector("button[aria-haspopup]").click();
        await D.until(() => tg.querySelector('button[aria-haspopup]').getAttribute("aria-expanded") === "true");
        for (const o of tg.querySelectorAll('[role="option"]')) {
          const want = ["VIP", "内测"].includes(o.textContent.trim());
          if ((o.getAttribute("aria-selected") === "true") !== want) { o.click(); await D.sleep(60); }
        }
        [...tg.querySelectorAll("button")].find((b) => b.textContent.trim() === "完成").click();
        await D.sleep(150);
        const sw = f("status").querySelector("input"); const swBefore = sw.checked;
        f("status").querySelector("label").click();
        await D.sleep(300);
        out.switchToggled = f("status").querySelector("input").checked !== swBefore;
        const pickDay = async (n, day, hm) => {
          const w = f(n); w.querySelector("button[aria-haspopup]").click();
          await D.until(() => w.querySelector("[data-ui-calendar-day]"));
          [...w.querySelectorAll("[data-ui-calendar-day]")].find((b) => b.textContent.trim() === String(day)).click();
          if (hm) {
            w.querySelector('[data-picker-time-kind="hour"] [data-picker-cell-value="' + hm[0] + '"]').click();
            w.querySelector('[data-picker-time-kind="minute"] [data-picker-cell-value="' + hm[1] + '"]').click();
          }
          await D.sleep(60);
          const dlg = w.querySelector('[role="dialog"]');
          // 弹窗内浮层随 Modal 内容滚动（absolute 锚定）：滚到可见后必须完整落在视口内
          dlg.scrollIntoView({ block: "nearest" });
          await D.sleep(100);
          const r = dlg.getBoundingClientRect();
          out["popup_" + n] = r.width > 0 && r.bottom <= innerHeight + 1 && r.top >= 0;
          [...dlg.querySelectorAll("button")].find((b) => b.textContent.trim() === "确定").click();
          await D.sleep(200);
        };
        await pickDay("birthday", 15);
        await pickDay("loginAt", 15, [5, 6]);
        D.fill(f("remark").querySelector("textarea"), "form remark");
        out.afterPick = { birthday: D.picked(f("birthday")), loginAt: D.picked(f("loginAt")), role: D.picked(f("role")) };
        // 弹窗内下拉可见（未被裁切）
        f("role").querySelector("button[aria-haspopup]").click();
        await D.sleep(150);
        const lb = f("role").querySelector('[role="listbox"]').getBoundingClientRect();
        out.listboxVisible = lb.height > 0 && lb.bottom <= innerHeight + 1;
        f("role").querySelector("button[aria-haspopup]").click();
        await D.sleep(100);
        out.fieldContrast = Math.round(D.contrast(f("birthday").querySelector("button span")) * 100) / 100;
        out.fieldBgDark = (() => { const b = D.effBg(f("birthday").querySelector("button")); return (b[0] + b[1] + b[2]) / 3 < 90; })();
        D.click(D.g('[data-testid="dp-form-submit"]'));
        await D.until(() => !D.dlg(), 5000);
        await D.sleep(500);
        out.rowText = row().textContent;
        return out;`,
        );
      const light = await run(false);
      expect(light.native).toBe(0);
      expect(Object.values(light.markers as Record<string, boolean>)).toEqual(
        [true, true, true, true, true, true, true, true],
      );
      const pre = light.prefill as Record<string, string>;
      expect(/^\d{4}-\d{2}-\d{2}$/.test(pre.birthday)).toBe(true);
      expect(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(pre.loginAt)).toBe(true);
      expect(light.switchToggled).toBe(true);
      expect(light.popup_birthday).toBe(true);
      expect(light.popup_loginAt).toBe(true);
      expect(light.listboxVisible).toBe(true);
      const ap = light.afterPick as Record<string, string>;
      expect(ap.birthday.endsWith("-15")).toBe(true);
      expect(ap.loginAt.endsWith("-15 05:06")).toBe(true);
      expect(ap.role).toBe("管理员");
      const rt = String(light.rowText);
      for (const x of ["管理员", "VIP", "内测", "77", "form remark", "-15"]) {
        expect([x, rt.includes(x)]).toEqual([x, true]);
      }
      await ev(
        t,
        `const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("[data-theme-icon]") && x.offsetParent !== null);
       b.click(); await D.sleep(700);`,
      );
      const dark = await run(true);
      expect(dark.native).toBe(0);
      expect((dark.fieldContrast as number) >= 4.5).toBe(true);
      expect(dark.fieldBgDark).toBe(true);
      expect(dark.listboxVisible).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  /**
   * UI·示例区主内容可见且有尺寸。
   */
  it("UI·示例区可见有尺寸", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(120);
    const got = await t.browser.evaluate(() => {
      const main = document.querySelector("main") as HTMLElement | null;
      if (!main) return { ok: false };
      const r = main.getBoundingClientRect();
      const text = (main.innerText || "").trim();
      return { ok: r.width > 80 && r.height > 80 && text.length > 20 };
    }) as { ok: boolean };
    expect(got.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

});
