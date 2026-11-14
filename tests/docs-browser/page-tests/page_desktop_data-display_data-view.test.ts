/**
 * @fileoverview 文档路由 `/desktop/data-display/data-view` 的浏览器测试。
 * DataView 数据明细 — 覆盖文档页基础示例：标题、Descriptions、默认工具栏与常用动作。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

const DOC_PATH = "/desktop/data-display/data-view";

type T = Parameters<typeof runKeywordAndShallowHere>[0];

const TB_IDS = [
  "dv-update",
  "dv-refresh",
  "dv-print",
  "dv-import",
  "dv-export",
  "dv-fullscreen",
  "dv-copy",
] as const;

async function open(t: T): Promise<void> {
  await sharedEnv.goto(t, DOC_PATH);
  await sharedEnv.waitDocMainReady(t);
  const ok = await t.browser!.evaluate(async () => {
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      if (
        document.querySelector(
          '[data-testid="panel-demo-data-view"] [data-testid="dv-refresh"]',
        )
      ) {
        return true;
      }
      await new Promise((r) => setTimeout(r, 40));
    }
    return false;
  });
  expect(ok).toBe(true);
}

describe("文档页 E2E：/desktop/data-display/data-view（DataView 数据明细）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /DataView|数据明细/i,
    ]);
  }, DOCS_BROWSER_CONFIG);

  it(
    "基础示例：标题、IconList、Descriptions、默认工具栏、无分页",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t);
      const r = await t.browser!.evaluate(() => {
        const ids = [
          "dv-update",
          "dv-refresh",
          "dv-print",
          "dv-import",
          "dv-export",
          "dv-fullscreen",
          "dv-copy",
        ];
        const root = document.querySelector(
          '[data-testid="panel-demo-data-view"]',
        ) as HTMLElement | null;
        if (!root) return { ok: false, reason: "missing panel" };
        const title = root.querySelector('[data-testid="data-view"]');
        const titleHtml = title?.innerHTML ?? "";
        const body = root.querySelector('[data-testid="dv-view"]');
        const text = (body?.textContent ?? "") + (title?.textContent ?? "");
        const present = Object.fromEntries(
          ids.map((id) => [id, !!root.querySelector(`[data-testid="${id}"]`)]),
        );
        return {
          ok: true,
          title: (title?.textContent ?? "").trim(),
          hasListIcon: titleHtml.includes('d="M8 6h13M8 12h13M8 18h13"'),
          hasEyeIcon: titleHtml.includes(
            'd="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"',
          ),
          hasName: text.includes("Ada Lovelace"),
          hasEmail: text.includes("ada@example.com"),
          hasStatus: text.includes("启用"),
          hasCreated: /2026/.test(text),
          present,
          hasPagination: !!root.querySelector('[data-testid="dp-pg"]'),
          hasPanelToolbar: !!root.querySelector(
            '[data-testid="data-panel-toolbar"]',
          ),
          hasViewToolbar: !!root.querySelector(
            '[data-testid="data-view-toolbar"]',
          ),
        };
      }) as {
        ok: boolean;
        reason?: string;
        title: string;
        hasListIcon: boolean;
        hasEyeIcon: boolean;
        hasName: boolean;
        hasEmail: boolean;
        hasStatus: boolean;
        hasCreated: boolean;
        present: Record<string, boolean>;
        hasPagination: boolean;
        hasPanelToolbar: boolean;
        hasViewToolbar: boolean;
      };
      expect(r.ok).toBe(true);
      expect(r.title).toContain("用户详情");
      expect(r.hasListIcon).toBe(true);
      expect(r.hasEyeIcon).toBe(false);
      expect(r.hasName).toBe(true);
      expect(r.hasEmail).toBe(true);
      expect(r.hasStatus).toBe(true);
      expect(r.hasCreated).toBe(true);
      expect(r.hasViewToolbar).toBe(true);
      expect(r.hasPagination).toBe(false);
      expect(r.hasPanelToolbar).toBe(false);
      for (const id of TB_IDS) {
        expect(r.present[id]).toBe(true);
      }
    },
    DOCS_BROWSER_CONFIG,
  );

  it("更新：打开编辑 Modal 并提交后回写当前记录", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t);
    const r = await t.browser!.evaluate(async () => {
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const until = async (fn: () => boolean, ms = 6000) => {
        const t0 = Date.now();
        while (Date.now() - t0 < ms) {
          try {
            if (fn()) return true;
          } catch {
            /* ignore */
          }
          await sleep(40);
        }
        return false;
      };
      const root = document.querySelector(
        '[data-testid="panel-demo-data-view"]',
      ) as HTMLElement | null;
      const update = root?.querySelector(
        '[data-testid="dv-update"]',
      ) as HTMLButtonElement | null;
      const click = (el: Element | null) => {
        if (!el) throw new Error("missing element");
        const inner = el.tagName === "SPAN" ? el.querySelector("button") : null;
        ((inner || el) as HTMLElement).click();
      };
      if (!update || (update as HTMLButtonElement).disabled) {
        return { ok: false, reason: "no update" };
      }
      click(update);
      const opened = await until(() =>
        !!document.querySelector('[role="dialog"] [data-testid="dv-form"]')
      );
      const dlg = document.querySelector('[role="dialog"]') as
        | HTMLElement
        | null;
      const title = (dlg?.querySelector("h2")?.textContent ?? "").trim();
      const nameInput = document.querySelector(
        '[data-testid="dv-fld-name"] input',
      ) as HTMLInputElement | null;
      const emailInput = document.querySelector(
        '[data-testid="dv-fld-email"] input',
      ) as HTMLInputElement | null;
      if (!nameInput || !emailInput) {
        return {
          ok: false,
          reason: "missing fields",
          opened,
          title,
        };
      }
      const name0 = nameInput.value;
      nameInput.focus();
      nameInput.value = "Ada Updated";
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      nameInput.dispatchEvent(new Event("change", { bubbles: true }));
      const submit = document.querySelector(
        '[data-testid="dv-form-submit"]',
      ) as HTMLElement | null;
      click(submit);
      const closed = await until(
        () =>
          !document.querySelector('[role="dialog"] [data-testid="dv-form"]'),
        8000,
      );
      await until(
        () =>
          (root?.querySelector('[data-testid="dv-view"]')?.textContent ?? "")
            .includes("Ada Updated"),
        4000,
      );
      const body =
        root?.querySelector('[data-testid="dv-view"]')?.textContent ??
          "";
      return {
        ok: true,
        opened,
        title,
        name0,
        email0: emailInput.value,
        closed,
        hasUpdated: body.includes("Ada Updated"),
        keptEmail: body.includes("ada@example.com"),
        stale: body.includes("Ada Lovelace") && !body.includes("Ada Updated"),
      };
    }) as {
      ok: boolean;
      reason?: string;
      opened: boolean;
      title: string;
      name0?: string;
      email0?: string;
      closed: boolean;
      hasUpdated?: boolean;
      keptEmail?: boolean;
      stale?: boolean;
    };
    expect(r.ok).toBe(true);
    expect(r.opened).toBe(true);
    expect(r.title).toContain("编辑 · Ada Lovelace");
    expect(r.name0).toBe("Ada Lovelace");
    expect(r.closed).toBe(true);
    expect(r.hasUpdated).toBe(true);
    expect(r.keptEmail).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("表单 Modal 连续输入时保持焦点，不会整段重绘失焦", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t);
    const r = await t.browser!.evaluate(async () => {
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const until = async (fn: () => boolean, ms = 6000) => {
        const t0 = Date.now();
        while (Date.now() - t0 < ms) {
          try {
            if (fn()) return true;
          } catch {
            /* ignore */
          }
          await sleep(40);
        }
        return false;
      };
      const click = (el: Element | null) => {
        if (!el) throw new Error("missing element");
        const inner = el.tagName === "SPAN" ? el.querySelector("button") : null;
        ((inner || el) as HTMLElement).click();
      };
      const root = document.querySelector(
        '[data-testid="panel-demo-data-view"]',
      ) as HTMLElement | null;
      const update = root?.querySelector(
        '[data-testid="dv-update"]',
      ) as HTMLButtonElement | null;
      if (!update || update.disabled) {
        return {
          ok: false,
          reason: "no update",
          remounted: false,
          lostAt: -1,
          value: "",
        };
      }
      click(update);
      const opened = await until(() =>
        !!document.querySelector('[role="dialog"] [data-testid="dv-form"]')
      );
      if (!opened) {
        return {
          ok: false,
          reason: "form not opened",
          remounted: false,
          lostAt: -1,
          value: "",
        };
      }
      const sel = '[role="dialog"] [data-testid="dv-fld-name"] input';
      const first = document.querySelector(sel) as HTMLInputElement | null;
      if (!first) {
        return {
          ok: false,
          reason: "missing name input",
          remounted: false,
          lostAt: -1,
          value: "",
        };
      }
      first.focus();
      if (document.activeElement !== first) {
        return {
          ok: false,
          reason: "no initial focus",
          remounted: false,
          lostAt: -1,
          value: first.value,
        };
      }
      const typed = "HelloFocus";
      let remounted = false;
      let lostAt = -1;
      let prev: HTMLInputElement = first;
      for (let i = 0; i < typed.length; i++) {
        const el = document.querySelector(sel) as HTMLInputElement | null;
        if (!el) {
          return {
            ok: false,
            reason: "input gone",
            remounted,
            lostAt: i,
            value: prev.value,
          };
        }
        if (el !== prev) remounted = true;
        if (document.activeElement !== el) {
          lostAt = i;
          return {
            ok: false,
            reason: "lost focus",
            remounted,
            lostAt,
            value: el.value,
            activeTag: document.activeElement
              ? (document.activeElement as HTMLElement).tagName
              : "",
          };
        }
        el.value = typed.slice(0, i + 1);
        el.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            data: typed[i],
            inputType: "insertText",
          }),
        );
        await sleep(20);
        prev = el;
      }
      const last = document.querySelector(sel) as HTMLInputElement | null;
      const focused = !!(last && document.activeElement === last);
      return {
        ok: !!(focused && last && last.value === typed && !remounted),
        reason: focused ? undefined : "lost focus after typing",
        remounted,
        lostAt,
        value: last?.value ?? "",
        activeTag: document.activeElement
          ? (document.activeElement as HTMLElement).tagName
          : "",
      };
    }) as {
      ok: boolean;
      reason?: string;
      remounted: boolean;
      lostAt: number;
      value: string;
      activeTag?: string;
    };
    expect(r.ok).toBe(true);
    expect(r.remounted).toBe(false);
    expect(r.lostAt).toBe(-1);
    expect(r.value).toBe("HelloFocus");
    // 单独跑此例时要冷启文档站，60s 不够
  }, { ...DOCS_BROWSER_CONFIG, timeout: 180_000 });

  it("刷新、打印、导入、导出、全屏、复制", async (t) => {
    if (!t?.browser?.goto) return;
    await open(t);
    const r = await t.browser!.evaluate(async () => {
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const until = async (fn: () => boolean, ms = 6000) => {
        const t0 = Date.now();
        while (Date.now() - t0 < ms) {
          try {
            if (fn()) return true;
          } catch {
            /* ignore */
          }
          await sleep(40);
        }
        return false;
      };
      const root = document.querySelector(
        '[data-testid="panel-demo-data-view"]',
      ) as HTMLElement | null;
      if (!root) return { ok: false, reason: "missing panel" };
      const q = (id: string) =>
        root.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
      const click = (el: Element | null) => {
        if (!el) throw new Error("missing element");
        const inner = el.tagName === "SPAN" ? el.querySelector("button") : null;
        ((inner || el) as HTMLElement).click();
      };
      const dismiss = async () => {
        document.body.click();
        await sleep(80);
      };
      const out: Record<string, unknown> = { ok: true };

      click(q("dv-refresh"));
      await sleep(400);
      const body = root.querySelector('[data-testid="dv-view"]')?.textContent ??
        "";
      out.refreshed = body.includes("Ada Lovelace") ||
        body.includes("Ada Updated");

      let written = "";
      let printed = false;
      const origOpen = globalThis.open;
      globalThis.open = () =>
        ({
          document: {
            write: (s: string) => {
              written += s;
            },
            close() {},
          },
          focus() {},
          print() {
            printed = true;
          },
        }) as unknown as Window;
      click(q("dv-print"));
      if (!written) {
        const frame = document.querySelector(
          '[data-testid="print-frame"]',
        ) as HTMLIFrameElement | null;
        const fhtml = frame?.contentDocument?.documentElement?.outerHTML ?? "";
        written = fhtml;
        printed = printed || fhtml.includes("<table>");
      }
      globalThis.open = origOpen;
      out.printed = printed;
      out.printHtml = written.includes("<table>") &&
        (written.includes("Ada Lovelace") || written.includes("Ada Updated"));

      const origInputClick = HTMLInputElement.prototype.click;
      let importFmt = "";
      HTMLInputElement.prototype.click = function (this: HTMLInputElement) {
        if (this.type === "file") {
          importFmt = this.getAttribute("data-import-format") ?? "";
          out.importTestId = this.getAttribute("data-testid");
          return;
        }
        return origInputClick.call(this);
      };
      click(q("dv-import"));
      const importMenu = await until(() =>
        !!document.querySelector('[data-testid="dv-import-csv"]')
      );
      (document.querySelector(
        '[data-testid="dv-import-csv"]',
      ) as HTMLElement | null)?.click();
      await sleep(80);
      HTMLInputElement.prototype.click = origInputClick;
      document.body.click();
      out.importMenu = importMenu;
      out.importFmt = importFmt;

      const blobs: Blob[] = [];
      const origCreate = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (b: Blob | MediaSource) => {
        if (b instanceof Blob) blobs.push(b);
        return origCreate(b);
      };
      const origAClick = HTMLAnchorElement.prototype.click;
      let downloadName = "";
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        if (this.download) {
          downloadName = this.download;
          return;
        }
        return origAClick.call(this);
      };
      click(q("dv-export"));
      const exportMenu = await until(() =>
        !!document.querySelector('[data-testid="dv-export-csv"]')
      );
      (document.querySelector(
        '[data-testid="dv-export-csv"]',
      ) as HTMLElement | null)?.click();
      await until(() => blobs.length > 0);
      const csv = blobs[0]
        ? (await blobs[0].text()).replace(/^\uFEFF/, "")
        : "";
      HTMLAnchorElement.prototype.click = origAClick;
      URL.createObjectURL = origCreate;
      document.body.click();
      out.exportMenu = exportMenu;
      out.exportName = downloadName;
      out.exportCsv = csv.slice(0, 400);
      out.exportHasHeader = csv.includes("姓名") && csv.includes("邮箱");
      out.exportHasRow = csv.includes("Ada Lovelace") ||
        csv.includes("Ada Updated") || csv.includes("ada@example.com");

      await dismiss();
      const isFs = () => {
        const el = root.querySelector(
          '[data-testid="dv-shell"]',
        ) as HTMLElement | null;
        const cls = el?.className ?? "";
        return el?.getAttribute("data-fullscreen") === "true" ||
          cls.split(/\s+/).includes("dp-fs");
      };
      if (isFs()) click(q("dv-fullscreen"));
      await until(() => !isFs(), 2000);
      click(q("dv-fullscreen"));
      const entered = await until(() => isFs(), 2000);
      click(q("dv-fullscreen"));
      const exited = await until(() => !isFs(), 2000);
      out.fullscreen = entered && exited && !isFs();

      let copied = "";
      const stub = {
        writeText: (s: string) => {
          copied = s;
          return Promise.resolve();
        },
      };
      try {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: stub,
        });
      } catch {
        const nav = navigator as Navigator & {
          clipboard?: { writeText?: (s: string) => Promise<void> };
        };
        if (nav.clipboard) nav.clipboard.writeText = stub.writeText;
      }
      click(q("dv-copy"));
      await until(() => copied.length > 0, 2000);
      out.copied = copied;
      out.copyHasHeader = copied.includes("姓名") && copied.includes("邮箱");
      out.copyHasRow = copied.includes("Ada Lovelace") ||
        copied.includes("Ada Updated") || copied.includes("ada@example.com");
      return out;
    }) as Record<string, unknown>;
    expect(r.ok).toBe(true);
    expect(r.refreshed).toBe(true);
    expect(r.printed).toBe(true);
    expect(r.printHtml).toBe(true);
    expect(r.importMenu).toBe(true);
    expect(r.importFmt).toBe("csv");
    expect(r.importTestId).toBe("dv-import-input");
    expect(r.exportMenu).toBe(true);
    expect(String(r.exportName)).toMatch(/\.csv$/);
    expect(r.exportHasHeader).toBe(true);
    expect(r.exportHasRow).toBe(true);
    expect(r.fullscreen).toBe(true);
    expect(r.copyHasHeader).toBe(true);
    expect(r.copyHasRow).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("Tab：标签在工具栏左侧，点击可切换，并写入 ?tab=", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ready = await t.browser!.evaluate(async () => {
      const t0 = Date.now();
      while (Date.now() - t0 < 30000) {
        if (
          document.querySelector(
            '[data-testid="panel-demo-data-view-tabs"] [data-testid="dv-refresh"]',
          )
        ) {
          return true;
        }
        await new Promise((r) => setTimeout(r, 40));
      }
      return false;
    });
    expect(ready).toBe(true);

    const start = await t.browser!.evaluate(() => {
      const root = document.querySelector(
        '[data-testid="panel-demo-data-view-tabs"]',
      ) as HTMLElement | null;
      const bar = root?.querySelector(
        '[data-testid="data-view-toolbar"]',
      ) as HTMLElement | null;
      const tabs = bar ? [...bar.querySelectorAll('[role="tab"]')] : [];
      const tools = root?.querySelector("[data-dv-tools]") as
        | HTMLElement
        | null;
      const tabLeft = tabs[0]?.getBoundingClientRect().left ?? 0;
      const toolsLeft = tools?.getBoundingClientRect().left ?? 0;
      const text = (el: Element | null) => (el ? el.textContent!.trim() : "");
      return {
        inToolbar: tabs.length === 2,
        labels: tabs.map((el) => text(el)),
        selected: tabs
          .filter((el) => el.getAttribute("aria-selected") === "true")
          .map((el) => text(el)),
        tabsLeftOfTools: tabLeft < toolsLeft && toolsLeft - tabLeft > 8,
        basicVisible: (root?.textContent || "").includes("Ada Lovelace"),
        extraVisible: (root?.textContent || "").includes("注册来源：后台录入"),
      };
    });
    expect(start.inToolbar).toBe(true);
    expect(start.labels).toEqual(["基本信息", "其他"]);
    expect(start.selected).toEqual(["基本信息"]);
    expect(start.tabsLeftOfTools).toBe(true);
    expect(start.basicVisible).toBe(true);
    expect(start.extraVisible).toBe(false);

    const afterExtra = await t.browser!.evaluate(async () => {
      const text = (el: Element | null) => (el ? el.textContent!.trim() : "");
      const clickExtra = () => {
        const root = document.querySelector(
          '[data-testid="panel-demo-data-view-tabs"]',
        ) as HTMLElement | null;
        const bar = root?.querySelector(
          '[data-testid="data-view-toolbar"]',
        ) as HTMLElement | null;
        const tab = [...(bar ? bar.querySelectorAll('[role="tab"]') : [])].find(
          (el) => text(el) === "其他",
        ) as HTMLElement | undefined;
        if (tab) {
          tab.scrollIntoView({ block: "center" });
          tab.click();
        }
        return { root, bar, tab };
      };
      const t0 = Date.now();
      let switched = false;
      while (Date.now() - t0 < 8000) {
        const { tab } = clickExtra();
        if (tab?.getAttribute("aria-selected") === "true") {
          switched = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 40));
      }
      const { root, bar } = clickExtra();
      return {
        switched,
        selected: [...(bar ? bar.querySelectorAll('[role="tab"]') : [])]
          .filter((el) => el.getAttribute("aria-selected") === "true")
          .map((el) => text(el)),
        tab: new URLSearchParams(location.search).get("tab"),
        extraVisible: (root?.textContent || "").includes("注册来源：后台录入"),
        basicVisible: (root?.textContent || "").includes("Ada Lovelace"),
      };
    });
    expect(afterExtra.switched).toBe(true);
    expect(afterExtra.selected).toEqual(["其他"]);
    expect(afterExtra.tab).toBe("extra");
    expect(afterExtra.extraVisible).toBe(true);
    expect(afterExtra.basicVisible).toBe(false);
  }, DOCS_BROWSER_CONFIG);

  it("Tab：用 ?tab=extra#tab 打开会激活其他", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, `${DOC_PATH}?tab=extra#tab`);
    await sharedEnv.waitDocMainReady(t);
    const r = await t.browser!.evaluate(async () => {
      const t0 = Date.now();
      let root: HTMLElement | null = null;
      while (Date.now() - t0 < 30000) {
        root = document.querySelector(
          '[data-testid="panel-demo-data-view-tabs"]',
        ) as HTMLElement | null;
        if (root?.querySelector('[data-testid="dv-refresh"]')) break;
        await new Promise((r) => setTimeout(r, 40));
      }
      const bar = root?.querySelector(
        '[data-testid="data-view-toolbar"]',
      ) as HTMLElement | null;
      const text = (el: Element | null) => (el ? el.textContent!.trim() : "");
      const tabs = bar ? [...bar.querySelectorAll('[role="tab"]')] : [];
      return {
        selected: tabs
          .filter((el) => el.getAttribute("aria-selected") === "true")
          .map((el) => text(el)),
        tab: new URLSearchParams(location.search).get("tab"),
        hash: location.hash,
        extraVisible: (root?.textContent || "").includes("注册来源：后台录入"),
      };
    });
    expect(r.selected).toEqual(["其他"]);
    expect(r.tab).toBe("extra");
    expect(r.hash).toBe("#tab");
    expect(r.extraVisible).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it(
    "页面提示条：工具栏下方可见，关闭后隐藏",
    async (t) => {
      if (!t?.browser?.goto) return;
      await open(t);
      const r = await t.browser!.evaluate(async () => {
        const root = document.querySelector(
          '[data-testid="panel-demo-data-view-alert"]',
        ) as HTMLElement | null;
        if (!root) return { ok: false, reason: "missing panel" };
        const tb = root.querySelector('[data-testid="data-view-toolbar"]');
        const alert = root.querySelector('[data-testid="dv-alert"]');
        const body = root.querySelector('[data-testid="dv-body"]');
        const close = alert?.querySelector(
          'button[aria-label="关闭"]',
        ) as HTMLButtonElement | null;
        const afterToolbar = !!(tb && alert && body &&
          (tb.compareDocumentPosition(alert) &
            Node.DOCUMENT_POSITION_FOLLOWING) &&
          (alert.compareDocumentPosition(body) &
            Node.DOCUMENT_POSITION_FOLLOWING));
        const text = alert?.textContent ?? "";
        close?.click();
        await new Promise((r) => setTimeout(r, 100));
        return {
          ok: true,
          hasAlert: !!alert,
          afterToolbar,
          text,
          hasClose: !!close,
          hidden: !root.querySelector('[data-testid="dv-alert"]'),
        };
      });
      expect(r.ok).toBe(true);
      expect(r.hasAlert).toBe(true);
      expect(r.afterToolbar).toBe(true);
      expect(String(r.text).includes("请先完成实名认证")).toBe(true);
      expect(r.hasClose).toBe(true);
      expect(r.hidden).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );
});
