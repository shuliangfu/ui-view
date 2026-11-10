/**
 * @fileoverview docs 浏览器 E2E：全局单例 dev server + 浏览器 context。
 * 所有测试共用一个 dev server，省去重复启停开销。
 *
 * 用法：`import { sharedEnv, DOCS_BROWSER_CONFIG, runKeywordAndShallowHere } from "./helpers.ts"`
 * 测试文件不需要自己启停 server，直接用 `sharedEnv.goto / waitDocMainReady / getMainText`。
 */

import {
  connect,
  createCommand,
  dirname,
  execPath,
  getEnv,
  getEnvAll,
  IS_DENO,
  join,
  platform,
} from "@dreamer/runtime-adapter";
import type { SpawnedProcess } from "@dreamer/runtime-adapter";
import { cleanupAllBrowsers, expect } from "@dreamer/test";
import { createBrowserContext } from "@dreamer/test/browser";

/**
 * 文档页 E2E 用的浏览器上下文（与 `DOCS_BROWSER_CONFIG` 下 TestContext.browser 一致）。
 */
export type DocsBrowserTestContext = {
  browser?: {
    goto?: (url: string) => Promise<unknown>;
    /** Playwright Page（@dreamer/test 注入）；用于自定义 `goto` 超时等 */
    page?: {
      goto: (
        url: string,
        options?: { waitUntil?: string; timeout?: number },
      ) => Promise<unknown>;
    };
    evaluate: (fn: () => unknown) => Promise<unknown>;
    waitFor?: (
      fn: () => boolean,
      options?: { timeout?: number },
    ) => Promise<void>;
  };
};

/**
 * `sharedEnv.goto` 第三参：重型文档路由（如 ConfigProvider）冷编译时可能超过默认 60s 导航超时。
 */
export type SharedEnvGotoOptions = {
  /** Playwright `page.goto` 的 timeout；默认 60000 */
  navigationTimeoutMs?: number;
  /** `goto` 后 `waitMainChars` 等待 main 就绪的上限 */
  waitMainTimeoutMs?: number;
  /**
   * Playwright 导航完成条件。默认已是 `commit`：macOS CI 长跑末段 `domcontentloaded`
   * 可能拖满 60s 测试超时；提交后再由 `waitMainChars` 轮询 main 正文。
   */
  waitUntil?: "commit" | "domcontentloaded" | "load";
};

/**
 * ConfigProvider 文档路由：冷编译略重于普通页；此前超长超时多为 **ConfigProvider 渲染循环**
 * （已在 config-store 浅比较修复）。此处保留略宽裕的导航与 main 等待即可。
 */
export const HEAVY_DOC_GOTO_OPTIONS: SharedEnvGotoOptions = {
  waitUntil: "domcontentloaded",
  navigationTimeoutMs: 90_000,
  waitMainTimeoutMs: 60_000,
};

/** `goto` 后判定「main 已出水」的最小字符数（显著低于多数文档页真实长度） */
const GOTO_MAIN_MIN_CHARS = 24;

/** 严格示例块断言前默认等待的 main 最小字符数（替代固定 ~520ms） */
const STRICT_DOC_MAIN_MIN_CHARS = 52;

/** 内部固定延迟（毫秒），保留供极少数动画/交互节拍使用 */
function delayMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** 已对 `browser.evaluate` 打过 tsx keepNames 补丁的标记 */
const EVAL_TSX_KEEPNAMES_PATCHED = Symbol.for(
  "ui-view.docsBrowser.evalTsxKeepNamesPatched",
);

/**
 * Node + tsx（esbuild `keepNames: true`）会把 `page.evaluate` 回调里的
 * `const sleep = ...` / `function sleep` 改写成 `__name(fn, "sleep")`。
 * Playwright 把 `fn.toString()` 送进浏览器后，页内没有该 helper，于是抛
 * `ReferenceError: __name is not defined`（Deno/Bun 不插或插法不同，故仅 Node 红）。
 *
 * 在每个 browser context 上包一层：若源码含 `__name`，则用 `new Function`
 * 重建并注入恒等 `__name`，再交给原 `evaluate`（保留宿主超时）。
 */
function patchBrowserEvaluateForTsxKeepNames(
  t: DocsBrowserTestContext,
): void {
  const browser = t.browser as
    | (NonNullable<DocsBrowserTestContext["browser"]> & {
      [EVAL_TSX_KEEPNAMES_PATCHED]?: boolean;
    })
    | undefined;
  if (!browser?.evaluate || browser[EVAL_TSX_KEEPNAMES_PATCHED]) return;
  const original = browser.evaluate.bind(browser);
  browser.evaluate = ((fn: () => unknown) => {
    if (typeof fn !== "function") {
      return original(fn as () => unknown);
    }
    const src = Function.prototype.toString.call(fn);
    if (!src.includes("__name")) {
      return original(fn);
    }
    // 重建函数体在 Node 运行时生成，不再经 tsx keepNames；并把 __name 做成恒等。
    const rebuilt = new Function(
      "const __name = function (f) { return f; };" +
        `return (${src}).apply(this, arguments);`,
    ) as () => unknown;
    return original(rebuilt);
  }) as typeof browser.evaluate;
  browser[EVAL_TSX_KEEPNAMES_PATCHED] = true;
}

/**
 * 轮询直到 `main` 内至少有一个 Dreamer 委托句柄（`__onclick` 等）。
 * `location.reload()` 后正文可能先出水、事件句柄稍后才挂上——CI 上固定 100ms 不够，
 * 会导致 `__onclick` 未就绪时 `.click()` 也不走委托，UI 交互用例集体红。
 *
 * @param t 浏览器上下文
 * @param timeoutMs 超时毫秒
 */
async function waitDreamerHandlers(
  t: DocsBrowserTestContext,
  timeoutMs: number,
): Promise<void> {
  if (typeof t?.browser?.evaluate !== "function") {
    throw new Error("Target page, context or browser has been closed");
  }
  const deadline = Date.now() + timeoutMs;
  const wf = t.browser?.waitFor;
  /** 作为 `new Function(body)` 的函数体：直接 return boolean */
  const probeBody = 'const main = document.querySelector("main");' +
    "if (!main) return false;" +
    'const names = ["__onclick","__onchange","__oninput","__onkeydown","__onpointerdown"];' +
    "const nodes = main.querySelectorAll(\"button,a,input,textarea,select,[role='button'],[role='switch'],[role='checkbox'],[role='radio'],[role='tab'],[role='menuitem'],[data-tree-expand-key]\");" +
    "for (let i = 0; i < nodes.length; i++) {" +
    "  const el = nodes[i];" +
    "  for (let j = 0; j < names.length; j++) {" +
    '    if (typeof el[names[j]] === "function") return true;' +
    "  }" +
    "}" +
    "return false;";
  if (typeof wf === "function") {
    const remaining = deadline - Date.now();
    if (remaining > 0) {
      try {
        await wf(
          new Function(probeBody) as () => boolean,
          { timeout: remaining },
        );
        return;
      } catch (err) {
        if (isMissingPageMethodError(err) || isDeadBrowserNavError(err)) {
          throw new Error("Target page, context or browser has been closed");
        }
        /* 继续兜底轮询 */
      }
    }
  }
  while (Date.now() < deadline) {
    try {
      const ready = (await t.browser.evaluate(
        new Function(probeBody) as () => boolean,
      )) as boolean;
      if (ready) return;
    } catch (err) {
      if (isMissingPageMethodError(err) || isDeadBrowserNavError(err)) {
        throw new Error("Target page, context or browser has been closed");
      }
      throw err;
    }
    await delayMs(50);
  }
}

/**
 * 浏览器内路由核对：goto 可能传入带 query / hash 的完整路径，
 * 只与 location.pathname 比对（页面随后可能改写 search）。
 */
function docsPathnameCheckSrc(expectedPath: string): string {
  return (
    `const expected = ${JSON.stringify(expectedPath)};` +
    "const raw = String(expected).split('#')[0];" +
    "const e = (raw.split('?')[0] || '/').replace(/\\/+$/, '') || '/';" +
    "const p = (location.pathname || '/').replace(/\\/+$/, '') || '/';" +
    "if (p !== e && !p.endsWith(e)) return false;"
  );
}

/**
 * 等当前文档资源加载完成：`document.readyState === "complete"`
 * （对应 window `load`：HTML + CSS/JS/图片等子资源）。
 * 不把 Playwright `goto` 的 `waitUntil` 改成 `load` / `domcontentloaded`：
 * 那两项在 macOS CI 长跑末段曾让导航本身拖满 60s 测试超时。
 * `waitUntil: commit` 之后旧文档可能已经是 complete，必须同时等到目标路由。
 *
 * @param t 浏览器上下文
 * @param timeoutMs 超时毫秒；超时抛出含 readyState / pathname 的明确错误
 * @param expectedPath 可选：目标路由（可带 query / hash；比对时只取 pathname），避免把旧页的 complete 当成新页已加载
 */
async function waitDocumentComplete(
  t: DocsBrowserTestContext,
  timeoutMs: number,
  expectedPath?: string,
): Promise<void> {
  if (typeof t?.browser?.evaluate !== "function") {
    throw new Error("Target page, context or browser has been closed");
  }
  const deadline = Date.now() + timeoutMs;
  const pathCheck = expectedPath ? docsPathnameCheckSrc(expectedPath) : "";
  const probeBody = pathCheck + 'return document.readyState === "complete";';
  const snapshotBody =
    "return {" +
    '  readyState: String(document.readyState || ""),' +
    '  pathname: String(location.pathname || ""),' +
    '  title: String(document.title || "")' +
    "};";
  const wf = t.browser?.waitFor;
  if (typeof wf === "function") {
    const remaining = deadline - Date.now();
    if (remaining > 0) {
      try {
        await wf(
          new Function(probeBody) as () => boolean,
          { timeout: remaining },
        );
        return;
      } catch (err) {
        if (isMissingPageMethodError(err) || isDeadBrowserNavError(err)) {
          throw new Error("Target page, context or browser has been closed");
        }
        /* 继续兜底轮询（仍在同一 deadline 内），最后抛出更清楚的超时信息 */
      }
    }
  }
  while (Date.now() < deadline) {
    try {
      const ready = (await t.browser.evaluate(
        new Function(probeBody) as () => boolean,
      )) as boolean;
      if (ready) return;
    } catch (err) {
      if (isMissingPageMethodError(err) || isDeadBrowserNavError(err)) {
        throw new Error("Target page, context or browser has been closed");
      }
      throw err;
    }
    await delayMs(50);
  }
  let snap = { readyState: "unknown", pathname: "", title: "" };
  try {
    snap = (await t.browser.evaluate(
      new Function(snapshotBody) as () => typeof snap,
    )) as typeof snap;
  } catch {
    /* 超时信息尽量带上快照 */
  }
  const want = expectedPath ? `，期望路由 ${expectedPath}` : "";
  throw new Error(
    `文档资源未在 ${timeoutMs}ms 内加载完成（document.readyState === "complete"）` +
      `${want}；当前 readyState=${snap.readyState} pathname=${snap.pathname}` +
      (snap.title ? ` title=${snap.title}` : ""),
  );
}

/**
 * 导航后的统一就绪链，共用一段超时预算，避免 complete + main + 句柄串行叠满 60s 测试超时。
 * 顺序：资源加载完成 → 目标路由 main 出字 → Dreamer 事件句柄。
 *
 * @param t 浏览器上下文
 * @param timeoutMs 整段等待上限
 * @param expectedPath 目标路由（可带 query / hash；比对时只取 pathname）
 */
async function waitAfterDocsNavigate(
  t: DocsBrowserTestContext,
  timeoutMs: number,
  expectedPath?: string,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const need = (step: string): number => {
    const ms = deadline - Date.now();
    if (ms <= 0) {
      throw new Error(
        `导航后等待超时：在「${step}」之前已用尽 ${timeoutMs}ms`,
      );
    }
    return ms;
  };
  await waitDocumentComplete(t, need("资源加载完成"), expectedPath);
  await waitMainChars(t, GOTO_MAIN_MIN_CHARS, need("main 出字"), expectedPath);
  await waitDreamerHandlers(t, Math.min(need("Dreamer 事件句柄"), 18_000));
}

async function waitMainChars(
  t: DocsBrowserTestContext,
  minChars: number,
  timeoutMs: number,
  expectedPath?: string,
): Promise<void> {
  /** 整段等待共用截止时刻，避免「waitFor 跑满 + 轮询再跑满」叠加超过单次调用上限（曾拖满 60s 测试超时） */
  const deadline = Date.now() + timeoutMs;
  const wf = t.browser?.waitFor;
  // 浏览器内不能闭包宿主变量：把 minChars / 目标 pathname 内联进函数体。
  // waitUntil: commit 后旧文档的 main 可能仍在，必须等到新路由的正文。
  const pathCheck = expectedPath ? docsPathnameCheckSrc(expectedPath) : "";
  const probeSrc = pathCheck +
    `const main = document.querySelector("main"); return (main?.innerText?.length ?? 0) >= ${
      Number(minChars)
    };`;
  if (typeof wf === "function") {
    const remaining = deadline - Date.now();
    if (remaining > 0) {
      try {
        await wf(
          new Function(probeSrc) as () => boolean,
          { timeout: remaining },
        );
        return;
      } catch (err) {
        if (isMissingPageMethodError(err) || isDeadBrowserNavError(err)) {
          throw new Error("Target page, context or browser has been closed");
        }
        /* 继续兜底轮询（仍在同一 deadline 内） */
      }
    }
  }
  while (Date.now() < deadline) {
    try {
      const ready = (await t.browser!.evaluate(
        new Function(probeSrc) as () => boolean,
      )) as boolean;
      if (ready) return;
    } catch (err) {
      if (isMissingPageMethodError(err) || isDeadBrowserNavError(err)) {
        throw new Error("Target page, context or browser has been closed");
      }
      throw err;
    }
    await delayMs(40);
  }
}

/**
 * `main` 内浅层交互探针（与各 page-tests 原拷贝逻辑一致，集中维护）。
 *
 * @param t 浏览器上下文
 * @param mainTextFallback 关键词探针失败时的正文兜底（用于长度/图表类页面）
 */
export async function shallowInteractMainHere(
  t: DocsBrowserTestContext,
  mainTextFallback: string,
): Promise<void> {
  if (!t?.browser) return;
  const runProbe = () =>
    t.browser!.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return { ok: false, acted: false };
      const listbox = main.querySelector(
        'button[aria-haspopup="listbox"]',
      ) as HTMLButtonElement | null;
      if (listbox && !listbox.disabled) {
        listbox.click();
        return { ok: true, acted: true };
      }
      const range = main.querySelector(
        'input[type="range"]',
      ) as HTMLInputElement | null;
      if (range) {
        const max = Number(range.max) || 100;
        const cur = Number(range.value) || 0;
        range.value = String(Math.min(max, cur + 5));
        range.dispatchEvent(new Event("input", { bubbles: true }));
        return { ok: true, acted: true };
      }
      const cb = main.querySelector(
        'input[type="checkbox"]:not(:disabled)',
      ) as HTMLInputElement | null;
      if (cb) {
        cb.click();
        return { ok: true, acted: true };
      }
      const rad = main.querySelector(
        'input[type="radio"]:not(:disabled)',
      ) as HTMLInputElement | null;
      if (rad) {
        rad.click();
        return { ok: true, acted: true };
      }
      const fileInput = main.querySelector(
        'input[type="file"]:not(:disabled)',
      ) as HTMLInputElement | null;
      if (fileInput) {
        fileInput.click();
        return { ok: true, acted: true };
      }
      const input = main.querySelector(
        "textarea:not(:disabled), input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=file]):not(:disabled)",
      ) as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.value = "e2e-probe";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return { ok: true, acted: true };
      }
      const btn = main.querySelector(
        'button[type="button"]:not([disabled]), button:not([type]):not([disabled])',
      ) as HTMLButtonElement | null;
      if (btn) {
        btn.click();
        return { ok: true, acted: true };
      }
      const table = main.querySelector("table");
      if (table) {
        const cellBtn = table.querySelector(
          "td button, td a",
        ) as HTMLElement | null;
        if (cellBtn) {
          cellBtn.click();
          return { ok: true, acted: true };
        }
      }
      const len = main.innerText?.length ?? 0;
      return { ok: true, acted: false, len };
    }) as Promise<{ ok: boolean; acted?: boolean; len?: number }>;
  let probe: { ok: boolean; acted?: boolean; len?: number };
  try {
    probe = await runProbe();
  } catch (err) {
    if (!isRecoverableBrowserError(err)) throw err;
    await recoverAndRevisit(t, {
      resourceExhausted: isResourceExhaustedSpawnError(err),
    });
    probe = await runProbe();
  }

  expect(probe.ok).toBe(true);
  if (!probe.acted) {
    expect(
      (probe.len ?? mainTextFallback.length) > 100 ||
        /canvas|Chart|svg|代码|API|示例/.test(mainTextFallback),
    ).toBe(true);
  }
}

/** 绑定宿主 `fetch`，健康检查走 Deno/Bun 网络栈 */
const hostFetch = globalThis.fetch.bind(globalThis);

/** 与 `docs/src/config/main.dev.ts` 默认一致；实际端口在 `start()` 内探测 */
const PREFERRED_DOCS_PORT = 3000;

/**
 * docs dev 子进程从 spawn 到根路径 `GET /` 成功的最长等待（毫秒）。
 * CI 或本机可调大：`UI_VIEW_DOCS_DEV_START_MS=180000`。
 */
function docsDevStartupDeadlineMs(): number {
  const raw = getEnv("UI_VIEW_DOCS_DEV_START_MS");
  if (raw != null && raw !== "") {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 15_000) return n;
  }
  return 120_000;
}

/**
 * 按进程 PID 偏移首选端口，减轻多 worker / 并行 `deno test --jobs>1` 时同时抢 3000 的竞态。
 *
 * @returns 起始探测端口（落在 [3000, 3179] 一带）
 */
function preferredPortStart(): number {
  try {
    const denoPid = (globalThis as { Deno?: { pid?: number } }).Deno?.pid;
    if (typeof denoPid === "number" && Number.isFinite(denoPid)) {
      return PREFERRED_DOCS_PORT + Math.abs(denoPid % 180);
    }
  } catch {
    /* ignore */
  }
  try {
    const proc = (globalThis as { process?: { pid?: number } }).process;
    if (typeof proc?.pid === "number" && Number.isFinite(proc.pid)) {
      return PREFERRED_DOCS_PORT + Math.abs(proc.pid % 180);
    }
  } catch {
    /* ignore */
  }
  return PREFERRED_DOCS_PORT;
}

/**
 * 检测端口是否已有**活跃监听**（对端 accept 新连接）
 * @param host 主机
 * @param port 端口
 */
async function isPortInUse(host: string, port: number): Promise<boolean> {
  try {
    const conn = await connect({ host, port });
    conn.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * 在**本进程**尝试 `listen` 该端口，判断子进程 docs dev 能否成功绑定。
 *
 * @param host 与 docs `main.dev` 一致，一般为 `127.0.0.1`
 * @param port 待测端口
 */
function canBindPortLocally(host: string, port: number): boolean {
  const DenoRef = (globalThis as {
    Deno?: {
      listen: (
        o: { hostname: string; port: number },
      ) => { close: () => void };
    };
  })
    .Deno;
  if (DenoRef?.listen) {
    try {
      const listener = DenoRef.listen({ hostname: host, port });
      listener.close();
      return true;
    } catch {
      return false;
    }
  }
  // Node / Bun：同步探测不可靠；交给 findAvailablePort 的 isPortInUse 异步路径
  return false;
}

/**
 * 从起始端口起查找第一个**本机可 bind** 的端口
 * @param host 主机
 * @param startPort 首选端口
 * @param maxAttempts 最大尝试次数
 */
async function findAvailablePort(
  host: string,
  startPort: number,
  maxAttempts = 200,
): Promise<number> {
  const DenoRef = (globalThis as { Deno?: { listen: unknown } }).Deno;
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (DenoRef?.listen) {
      if (canBindPortLocally(host, port)) return port;
      continue;
    }
    if (!(await isPortInUse(host, port))) return port;
  }
  throw new Error(
    `docs e2e: 从端口 ${startPort} 起尝试 ${maxAttempts} 次均无法 bind 或均被占用，无法启动 dev`,
  );
}

/** 规整绝对路径 */
function normalizeAbsolutePath(p: string): string {
  const isAbsolute = p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p);
  const parts = p.replace(/\\/g, "/").split("/").filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") out.pop();
    else if (part !== ".") out.push(part);
  }
  const joined = out.join("/");
  if (!isAbsolute) return joined;
  if (out[0] && /^[A-Za-z]:$/.test(out[0])) return joined;
  return "/" + joined;
}

const _helpersDir = dirname(
  typeof import.meta.url !== "undefined" && import.meta.url.startsWith("file:")
    ? new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
    : join(".", "tests", "docs-browser", "helpers.ts"),
);

/** ui-view 包根（`tests/docs-browser` 的上两级） */
const UI_VIEW_ROOT = normalizeAbsolutePath(join(_helpersDir, "..", ".."));
/** docs 应用根目录 */
export const DOCS_ROOT = join(UI_VIEW_ROOT, "docs");

/**
 * 浏览器子进程入口：与 `tests/browser-stub.js` 一致
 */
function entryPointForBrowser(): string {
  return join(UI_VIEW_ROOT, "tests", "browser-stub.js");
}

/**
 * 传给 `it(..., DOCS_BROWSER_CONFIG)` 的浏览器选项
 */
export const DOCS_BROWSER_CONFIG = {
  sanitizeOps: false,
  sanitizeResources: false,
  timeout: 60_000,
  browser: {
    enabled: true,
    headless: true,
    browserSource: "test" as const,
    entryPoint: entryPointForBrowser(),
    bodyContent: '<div id="root"></div>',
    browserMode: true,
    moduleLoadTimeout: 20_000,
  },
};

// ─── 全局单例 dev server ─────────────────────────────────────────────

let _singletonPort = PREFERRED_DOCS_PORT;
let _singletonBaseUrl = `http://127.0.0.1:${_singletonPort}`;
let _singletonProcess: SpawnedProcess | null = null;
let _singletonStarted = false;
let _singletonStartPromise: Promise<void> | null = null;
/** 为 false 时表示由父进程（如 test-node.mjs）托管，cleanup 不得杀 */
let _singletonOwnsProcess = true;
let _exitHookInstalled = false;

function installDocsServerExitHook(): void {
  if (_exitHookInstalled) return;
  _exitHookInstalled = true;
  const kill = () => {
    if (!_singletonOwnsProcess || !_singletonProcess) return;
    try {
      _singletonProcess.kill(9);
    } catch {
      /* ignore */
    }
  };
  try {
    const proc = (globalThis as {
      process?: {
        on?: (ev: string, fn: () => void) => void;
      };
    }).process;
    proc?.on?.("exit", kill);
    proc?.on?.("SIGTERM", kill);
    proc?.on?.("SIGINT", kill);
  } catch {
    /* ignore */
  }
  try {
    const DenoRef = (globalThis as {
      Deno?: { addSignalListener?: (s: string, fn: () => void) => void };
    }).Deno;
    DenoRef?.addSignalListener?.("SIGTERM", kill);
    DenoRef?.addSignalListener?.("SIGINT", kill);
  } catch {
    /* ignore */
  }
}

async function _probeDocsDevOk(timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await hostFetch(`${_singletonBaseUrl.replace(/\/$/, "")}/`, {
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(tid);
  }
}

async function _startServer(): Promise<void> {
  installDocsServerExitHook();
  if (_singletonStarted) {
    if (await _probeDocsDevOk(5000)) return;
    await _killServer();
  }

  // 父进程（test-node.mjs）已拉起共享 docs server 时复用，避免 Node 每文件 spawn 泄漏端口
  const externalBase = getEnv("UI_VIEW_DOCS_E2E_BASE_URL");
  if (externalBase && externalBase.trim() !== "") {
    _singletonBaseUrl = externalBase.replace(/\/$/, "");
    const extPort = getEnv("UI_VIEW_DOCS_E2E_PORT");
    if (extPort) {
      const n = Number.parseInt(extPort, 10);
      if (Number.isFinite(n) && n > 0) _singletonPort = n;
    }
    _singletonOwnsProcess = false;
    _singletonProcess = null;
    const deadlineMs = docsDevStartupDeadlineMs();
    const deadline = Date.now() + deadlineMs;
    let ready = false;
    while (Date.now() < deadline) {
      if (await _probeDocsDevOk(2000)) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!ready) {
      throw new Error(
        `Docs dev server (external UI_VIEW_DOCS_E2E_BASE_URL) not ready within ${deadlineMs}ms: ${_singletonBaseUrl}`,
      );
    }
    _singletonStarted = true;
    return;
  }

  _singletonPort = await findAvailablePort("127.0.0.1", preferredPortStart());
  _singletonBaseUrl = `http://127.0.0.1:${_singletonPort}`;
  _singletonOwnsProcess = true;
  // Docs app is Deno-based. Under Bun/Node, spawn PATH `deno` (CI installs it)
  // instead of `node run dev` / relying on package.json → deno indirection alone.
  const docsCmd = IS_DENO ? execPath() : "deno";
  const cmd = createCommand(docsCmd, {
    args: ["run", "-A", "src/main.ts"],
    cwd: DOCS_ROOT,
    env: {
      ...getEnvAll(),
      PORT: String(_singletonPort),
      UI_VIEW_DOCS_BROWSER_E2E: "1",
    },
    stdout: "inherit",
    stderr: "inherit",
  });
  _singletonProcess = cmd.spawn();

  const deadlineMs = docsDevStartupDeadlineMs();
  const deadline = Date.now() + deadlineMs;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const r = await hostFetch(_singletonBaseUrl + "/");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {
      // 服务尚未就绪
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!ready) {
    throw new Error(
      `Docs dev server did not start within ${deadlineMs}ms (set UI_VIEW_DOCS_DEV_START_MS to override).`,
    );
  }
  /** 根路径已通后再短暂 settle；过长会拖慢首测（健康检查已通过） */
  const settleMs = platform() === "windows" ? 1200 : 1500;
  await new Promise((r) => setTimeout(r, settleMs));
  _singletonStarted = true;
}

async function _killServer(): Promise<void> {
  if (!_singletonOwnsProcess) {
    _singletonStarted = false;
    return;
  }
  if (!_singletonProcess) {
    _singletonStarted = false;
    return;
  }
  const child = _singletonProcess;
  _singletonProcess = null;
  try {
    child.kill(9);
  } catch {
    // ignore
  }
  try {
    await Promise.race([
      child.status,
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), 15_000)
      ),
    ]);
  } catch {
    // ignore
  }
  try {
    child.unref?.();
  } catch {
    // ignore
  }
  await new Promise((r) => setTimeout(r, 300));
  _singletonStarted = false;
}

/**
 * 确保 dev server 存活；失败时自动重启。
 */
async function _ensureAlive(timeoutMs = 5000): Promise<void> {
  if (await _probeDocsDevOk(timeoutMs)) return;
  await _killServer();
  await new Promise((r) => setTimeout(r, 400));
  await _startServer();
  if (await _probeDocsDevOk(timeoutMs)) return;
  throw new Error(`docs dev 健康检查失败（已尝试重启）：${_singletonBaseUrl}`);
}

/**
 * 全局单例 docs browser 测试环境。
 * 整个测试进程只启动一次 dev server，所有测试文件共享。
 *
 * 用法：
 * ```ts
 * import { sharedEnv, DOCS_BROWSER_CONFIG } from "./helpers.ts";
 *
 * describe("xxx", () => {
 *   it("test", async (t) => {
 *     await sharedEnv.goto(t, "/desktop/form/input");
 *     const text = await sharedEnv.getMainText(t);
 *     expect(text).toMatch(/Input/);
 *   }, DOCS_BROWSER_CONFIG);
 * });
 * ```
 *
 * 首次调用 `goto` 时自动启动 dev server；
 * `cleanup()` 在整个测试进程结束时调用一次。
 *
 * **线程安全**：并发 `start()` 只会启动一次（Promise 去重）。
 */

/** Playwright「页／上下文／浏览器已关」类错误（CI 首测冷启时偶发） */
function isDeadBrowserNavError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Target page, context or browser has been closed|browser is disconnected|Target closed|Browser closed|Connection closed/i
    .test(msg);
}

/**
 * macOS CI 长跑末段常见：进程／线程表耗尽，spawn Chromium／Deno 报
 * `WouldBlock` / `Resource temporarily unavailable (os error 35)`。
 */
function isResourceExhaustedSpawnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /WouldBlock|Resource temporarily unavailable|os error 35|EAGAIN|EMFILE|too many open files/i
    .test(msg);
}

/**
 * `@dreamer/test` 在用例超时的 finally 里会把共享 `browserCtx.page` 置为 undefined。
 * Deno 超时与下一例 setup 竞态时，`evaluate` / `waitForFunction` 会打在空 page 上。
 */
function isMissingPageMethodError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Cannot read propert(?:y|ies) of undefined \(reading '(?:evaluate|goto|waitForFunction|waitFor)'\)/i
    .test(msg);
}

function isRecoverableBrowserError(err: unknown): boolean {
  return isDeadBrowserNavError(err) ||
    isResourceExhaustedSpawnError(err) ||
    isMissingPageMethodError(err);
}

/** 最近一次 `sharedEnv.goto` 的路径，供 page 被摘掉后恢复并重新导航 */
let _lastGoto: { path: string; options?: SharedEnvGotoOptions } | undefined;

type PlaywrightBrowserHandle = {
  isConnected?: () => boolean;
  newPage?: () => Promise<{
    goto: (
      url: string,
      options?: { waitUntil?: string; timeout?: number },
    ) => Promise<unknown>;
    setDefaultTimeout?: (ms: number) => void;
    setDefaultNavigationTimeout?: (ms: number) => void;
  }>;
};

type MutableDocsBrowser = NonNullable<DocsBrowserTestContext["browser"]> & {
  browser?: PlaywrightBrowserHandle;
  [key: symbol]: unknown;
};

type DocsPlaywrightPage =
  & NonNullable<
    NonNullable<DocsBrowserTestContext["browser"]>["page"]
  >
  & {
    evaluate?: (fn: () => unknown) => Promise<unknown>;
    waitForFunction?: (
      fn: () => boolean,
      options?: { timeout?: number },
    ) => Promise<unknown>;
    setDefaultTimeout?: (ms: number) => void;
    setDefaultNavigationTimeout?: (ms: number) => void;
  };

/**
 * `t.browser` 是 @dreamer/test 的包装对象，`evaluate` 闭包读的是内部 `context.page`。
 * 只改 `t.browser.page` 不够，必须把 evaluate／goto／waitFor 一并指到新 page。
 */
function rebindDocsBrowserToPage(
  t: DocsBrowserTestContext,
  newPage: DocsPlaywrightPage,
): void {
  const browser = t.browser as MutableDocsBrowser | undefined;
  if (!browser) return;
  try {
    newPage.setDefaultTimeout?.(60_000);
    newPage.setDefaultNavigationTimeout?.(60_000);
  } catch {
    /* ignore */
  }
  browser.page = newPage;
  if (typeof newPage.evaluate === "function") {
    const pageEvaluate = newPage.evaluate.bind(newPage);
    browser.evaluate = ((fn: () => unknown) =>
      pageEvaluate(fn)) as typeof browser.evaluate;
  }
  const pageGoto = newPage.goto.bind(newPage);
  browser.goto = (async (url: string) => {
    await pageGoto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  }) as typeof browser.goto;
  if (typeof newPage.waitForFunction === "function") {
    const pageWait = newPage.waitForFunction.bind(newPage);
    browser.waitFor = (async (
      fn: () => boolean,
      options?: { timeout?: number },
    ) => {
      const timeoutMs = options?.timeout ?? 10_000;
      await pageWait(fn, { timeout: timeoutMs });
    }) as typeof browser.waitFor;
  }
  delete browser[EVAL_TSX_KEEPNAMES_PATCHED];
}

/**
 * 把新建的 BrowserContext 绑回当前 TestContext.browser（evaluate／goto／page）。
 */
function rebindDocsBrowserFromContext(
  t: DocsBrowserTestContext,
  ctx: {
    browser: unknown;
    page: unknown;
    evaluate: (fn: () => unknown) => Promise<unknown>;
    goto: (url: string) => Promise<void>;
    waitFor: (
      fn: () => boolean,
      options?: { timeout?: number },
    ) => Promise<void>;
  },
): void {
  const browser = t.browser as MutableDocsBrowser | undefined;
  if (!browser) return;
  browser.browser = ctx.browser as PlaywrightBrowserHandle;
  browser.page = ctx.page as NonNullable<
    DocsBrowserTestContext["browser"]
  >["page"];
  browser.evaluate = ctx.evaluate.bind(ctx) as typeof browser.evaluate;
  browser.goto = ctx.goto.bind(ctx) as typeof browser.goto;
  browser.waitFor = ctx.waitFor.bind(ctx) as typeof browser.waitFor;
  delete browser[EVAL_TSX_KEEPNAMES_PATCHED];
}

/**
 * 导航前页已死／spawn 资源耗尽：优先同 Browser newPage；否则清浏览器后带退避重建。
 * os35 时多等几拍再 launch，避免立刻再撞进程上限。
 */
async function recoverDocsBrowserPage(
  t: DocsBrowserTestContext,
  opts?: { resourceExhausted?: boolean },
): Promise<void> {
  const mutable = t.browser as MutableDocsBrowser | undefined;
  const pw = mutable?.browser;
  const skipReuse = opts?.resourceExhausted === true;
  if (
    !skipReuse &&
    pw &&
    typeof pw.newPage === "function" &&
    (typeof pw.isConnected !== "function" || pw.isConnected())
  ) {
    try {
      const newPage = await pw.newPage();
      rebindDocsBrowserToPage(
        t,
        newPage as DocsPlaywrightPage,
      );
      return;
    } catch {
      /* fall through */
    }
  }
  await cleanupAllBrowsers().catch(() => {});
  // Resource exhaustion: longer settle so unreaped Chromium helpers can exit
  const settleMs = opts?.resourceExhausted
    ? (platform() === "darwin" ? 2500 : 1500)
    : 120;
  await delayMs(settleMs);

  const browserOpts = {
    enabled: true,
    headless: true,
    browserSource: "test" as const,
    entryPoint: entryPointForBrowser(),
    bodyContent: '<div id="root"></div>',
    browserMode: true,
    moduleLoadTimeout: 20_000,
  };
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        await cleanupAllBrowsers().catch(() => {});
        await delayMs(800 * attempt + (opts?.resourceExhausted ? 1200 : 0));
      }
      const ctx = await createBrowserContext(browserOpts);
      rebindDocsBrowserFromContext(t, ctx);
      return;
    } catch (err) {
      lastErr = err;
      if (!isResourceExhaustedSpawnError(err) && attempt === 0) {
        // non-exhaustion first failure: one more try then throw
        continue;
      }
      if (!isResourceExhaustedSpawnError(err) && attempt >= 1) break;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(String(lastErr ?? "recoverDocsBrowserPage failed"));
}

async function navigateDocsPage(
  t: DocsBrowserTestContext,
  url: string,
  options?: SharedEnvGotoOptions,
): Promise<void> {
  patchBrowserEvaluateForTsxKeepNames(t);
  const navMs = options?.navigationTimeoutMs ?? 60_000;
  // 默认 commit：domcontentloaded 在 macOS CI 长跑末段可能拖满 60s 测试超时
  const waitUntil = options?.waitUntil ?? "commit";
  const page = t.browser?.page;
  if (typeof page?.goto === "function") {
    await page.goto(url, {
      waitUntil,
      timeout: navMs,
    });
    return;
  }
  if (typeof t.browser?.goto !== "function") {
    throw new Error("Target page, context or browser has been closed");
  }
  await t.browser.goto(url);
}

/**
 * 超时竞态或资源耗尽后重建 page，并回到最近一次文档路由（空白新页不能直接 wait main）。
 */
async function recoverAndRevisit(
  t: DocsBrowserTestContext,
  opts?: { resourceExhausted?: boolean },
): Promise<void> {
  await recoverDocsBrowserPage(t, opts);
  if (!_lastGoto) return;
  const path = _lastGoto.path;
  const docsPath = path.startsWith("/") ? path : "/" + path;
  const url = _singletonBaseUrl + docsPath;
  await navigateDocsPage(t, url, _lastGoto.options);
  await waitAfterDocsNavigate(
    t,
    _lastGoto.options?.waitMainTimeoutMs ?? 25_000,
    docsPath,
  );
}

export const sharedEnv = {
  /**
   * 启动 dev server（幂等，已启动则跳过）。
   * 通常不需要手动调用——`goto` 内部会自动 `start`。
   */
  async start(): Promise<void> {
    if (_singletonStartPromise) return _singletonStartPromise;
    _singletonStartPromise = _startServer();
    try {
      await _singletonStartPromise;
    } catch (e) {
      _singletonStartPromise = null;
      throw e;
    }
  },

  /** 当前 dev server 的 BASE_URL */
  get baseUrl(): string {
    return _singletonBaseUrl;
  },

  /**
   * 导航到 docs 路径。首次调用自动启动 dev server。
   * 默认 `waitUntil: commit`（避免 macOS CI `domcontentloaded` / `load` 拖满 60s），
   * 随后等 `document.readyState === "complete"`（资源加载完），再等目标路由
   * `main` 出字与 Dreamer 事件句柄，避免未加载完就点击或断言。
   *
   * @param options.navigationTimeoutMs 传给 Playwright `page.goto`；默认 60s，重型页请用 {@link HEAVY_DOC_GOTO_OPTIONS}
   */
  async goto(
    t: DocsBrowserTestContext,
    path: string,
    options?: SharedEnvGotoOptions,
  ): Promise<void> {
    if (!t?.browser?.goto && typeof t.browser?.page?.goto !== "function") {
      return;
    }
    _lastGoto = { path, options };
    await this.start();
    await _ensureAlive();
    const docsPath = path.startsWith("/") ? path : "/" + path;
    const url = _singletonBaseUrl + docsPath;
    const waitMainMs = options?.waitMainTimeoutMs ?? 25_000;
    const run = async () => {
      if (typeof t.browser?.page?.goto !== "function") {
        await recoverDocsBrowserPage(t, {
          resourceExhausted: false,
        });
      }
      await navigateDocsPage(t, url, options);
      // commit 后：资源加载完 → 目标路由 main 出字 → Dreamer 句柄。
      // 句柄未挂时 `.click()` 不走委托（Modal 点得开「打开」却找不到「确定」）。
      await waitAfterDocsNavigate(t, waitMainMs, docsPath);
    };
    try {
      await run();
    } catch (err) {
      // CI：冷启断开、超时后 page 被置空，或 macOS 长跑末段 WouldBlock／os35
      if (!isRecoverableBrowserError(err)) throw err;
      await recoverDocsBrowserPage(t, {
        resourceExhausted: isResourceExhaustedSpawnError(err),
      });
      await run();
    }
  },

  /**
   * 严格示例块交互前等待文档主体渲染充分（替代各用例内固定 ~520ms）。
   *
   * @param t 浏览器上下文
   * @param options.minChars 最小字符数，默认 52
   * @param options.timeoutMs 超时毫秒
   */
  async waitDocMainReady(
    t: DocsBrowserTestContext,
    options?: { minChars?: number; timeoutMs?: number },
  ): Promise<void> {
    patchBrowserEvaluateForTsxKeepNames(t);
    const minChars = options?.minChars ?? STRICT_DOC_MAIN_MIN_CHARS;
    const timeoutMs = options?.timeoutMs ?? 18_000;
    const once = async () => {
      const expectedPath = _lastGoto?.path
        ? (_lastGoto.path.startsWith("/")
          ? _lastGoto.path
          : "/" + _lastGoto.path)
        : undefined;
      const deadline = Date.now() + timeoutMs;
      const need = (step: string): number => {
        const ms = deadline - Date.now();
        if (ms <= 0) {
          throw new Error(
            `文档就绪等待超时：在「${step}」之前已用尽 ${timeoutMs}ms`,
          );
        }
        return ms;
      };
      await waitDocumentComplete(t, need("资源加载完成"), expectedPath);
      await waitMainChars(t, minChars, need("main 出字"), expectedPath);
      // 正文出水后再等 Dreamer 事件句柄，覆盖 reload 后的 hydration 窗口（CI 更慢）
      await waitDreamerHandlers(t, Math.min(need("Dreamer 事件句柄"), 18_000));
    };
    try {
      await once();
    } catch (err) {
      if (!isRecoverableBrowserError(err)) throw err;
      await recoverAndRevisit(t, {
        resourceExhausted: isResourceExhaustedSpawnError(err),
      });
      await once();
    }
  },

  /**
   * 读取 `main` 内文本
   */
  async getMainText(
    t: DocsBrowserTestContext,
  ): Promise<string> {
    if (!t?.browser) return "";
    const read = async () =>
      (await t.browser!.evaluate(() => {
        const main = document.querySelector("main");
        return main?.innerText ?? "";
      })) as string;
    try {
      return await read();
    } catch (err) {
      if (!isRecoverableBrowserError(err)) throw err;
      await recoverAndRevisit(t, {
        resourceExhausted: isResourceExhaustedSpawnError(err),
      });
      return await read();
    }
  },

  /** 固定暂停（毫秒） */
  delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  },

  /** 确保 dev 存活（可手动调用做健康检查） */
  async ensureAlive(timeoutMs = 5000): Promise<void> {
    await this.start();
    await _ensureAlive(timeoutMs);
  },

  /**
   * 清理：关停 dev server + 清理浏览器。
   * 在最外层 describe 的 afterAll 调用一次即可。
   */
  async cleanup(): Promise<void> {
    await _killServer();
    await cleanupAllBrowsers();
    _singletonStartPromise = null;
  },
};

/** 类型导出，供测试文件做 ReturnType */
export type SharedDocsEnv = typeof sharedEnv;

/**
 * 打开文档、断言关键词命中、`main` 就绪后执行浅层探针（替代各 page-tests 文件尾部重复实现）。
 *
 * @param t 浏览器上下文
 * @param path 文档路由，如 `/desktop/form/input`
 * @param patterns 须在正文出现的正则列表
 * @param minLen `main` 最小文本长度阈值
 * @param gotoOptions 可选：重型路由放宽导航 / main 就绪等待（如 {@link HEAVY_DOC_GOTO_OPTIONS}）
 */
export async function runKeywordAndShallowHere(
  t: DocsBrowserTestContext,
  path: string,
  patterns: RegExp[],
  minLen = 32,
  gotoOptions?: SharedEnvGotoOptions,
): Promise<void> {
  if (!t?.browser?.goto) return;
  await sharedEnv.goto(t, path, gotoOptions);
  let text = await sharedEnv.getMainText(t);
  const secondaryMainWaitMs = gotoOptions?.waitMainTimeoutMs ?? 25_000;
  /** `goto` 已等待 ≥24 字；不足 minLen 时再等到阈值，避免与上一段等待重复耗尽超时 */
  if (text.length < minLen) {
    await waitMainChars(t, minLen, secondaryMainWaitMs);
    text = await sharedEnv.getMainText(t);
  }
  if (text.length === 0) {
    text = (await t.browser!.evaluate(() =>
      document.body?.innerText ?? ""
    )) as string;
  }
  expect(text.length).toBeGreaterThanOrEqual(minLen);
  for (const p of patterns) {
    expect(text).toMatch(p);
  }
  await shallowInteractMainHere(t, text);
}
