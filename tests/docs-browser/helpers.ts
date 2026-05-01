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
  /** Playwright `page.goto` 的 timeout；默认 60000，与 @dreamer/test 一致 */
  navigationTimeoutMs?: number;
  /** `goto` 后 `waitMainChars` 等待 main 就绪的上限 */
  waitMainTimeoutMs?: number;
  /**
   * Playwright 导航完成条件。重型 SPA（Vite 冷编译）下 `domcontentloaded` 可能长时间不满足，
   * 改用 `commit`（导航已提交）后再由 `waitMainChars` 轮询 main 正文更稳。
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

/**
 * 轮询直到 `main` 文本长度达标（配合 Playwright `waitFor` 优先）。
 *
 * @param t 浏览器上下文
 * @param minChars 最小字符数
 * @param timeoutMs 超时毫秒
 */
async function waitMainChars(
  t: DocsBrowserTestContext,
  minChars: number,
  timeoutMs: number,
): Promise<void> {
  /** 整段等待共用截止时刻，避免「waitFor 跑满 + 轮询再跑满」叠加超过单次调用上限（曾拖满 60s 测试超时） */
  const deadline = Date.now() + timeoutMs;
  const wf = t.browser?.waitFor;
  if (typeof wf === "function") {
    const remaining = deadline - Date.now();
    if (remaining > 0) {
      try {
        await wf(
          () => {
            const main = document.querySelector("main");
            return (main?.innerText?.length ?? 0) >= minChars;
          },
          { timeout: remaining },
        );
        return;
      } catch {
        /* 继续兜底轮询（仍在同一 deadline 内） */
      }
    }
  }
  while (Date.now() < deadline) {
    const len = (await t.browser!.evaluate(() => {
      const main = document.querySelector("main");
      return main?.innerText?.length ?? 0;
    })) as number;
    if (len >= minChars) return;
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
  const probe = (await t.browser.evaluate(() => {
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
  })) as { ok: boolean; acted?: boolean; len?: number };

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
    const pid = (globalThis as { Deno?: { pid?: number } }).Deno?.pid;
    if (typeof pid === "number" && Number.isFinite(pid)) {
      return PREFERRED_DOCS_PORT + Math.abs(pid % 180);
    }
  } catch {
    /* 非 Deno 环境 */
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
  maxAttempts = 50,
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
  if (_singletonStarted) {
    if (await _probeDocsDevOk(5000)) return;
    await _killServer();
  }

  _singletonPort = await findAvailablePort("127.0.0.1", preferredPortStart());
  _singletonBaseUrl = `http://127.0.0.1:${_singletonPort}`;
  const cmd = createCommand(execPath(), {
    args: IS_DENO ? ["run", "-A", "src/main.ts"] : ["run", "dev"],
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
  if (!_singletonProcess) return;
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
   * 导航后以 `main` 文本长度为准就绪，避免固定 sleep。
   *
   * @param options.navigationTimeoutMs 传给 Playwright `page.goto`；默认 60s，重型页请用 {@link HEAVY_DOC_GOTO_OPTIONS}
   */
  async goto(
    t: DocsBrowserTestContext,
    path: string,
    options?: SharedEnvGotoOptions,
  ): Promise<void> {
    if (!t?.browser?.goto) return;
    await this.start();
    await _ensureAlive();
    const url = _singletonBaseUrl + (path.startsWith("/") ? path : "/" + path);
    const navMs = options?.navigationTimeoutMs ?? 60_000;
    /** 默认与 @dreamer/test 内 `page.goto` 一致；重型页可改为 `commit` */
    const waitUntil = options?.waitUntil ?? "domcontentloaded";
    const page = t.browser.page;
    if (typeof page?.goto === "function") {
      await page.goto(url, {
        waitUntil,
        timeout: navMs,
      });
    } else {
      await t.browser.goto(url);
    }
    const waitMainMs = options?.waitMainTimeoutMs ?? 25_000;
    await waitMainChars(t, GOTO_MAIN_MIN_CHARS, waitMainMs);
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
    const minChars = options?.minChars ?? STRICT_DOC_MAIN_MIN_CHARS;
    const timeoutMs = options?.timeoutMs ?? 18_000;
    await waitMainChars(t, minChars, timeoutMs);
  },

  /**
   * 读取 `main` 内文本
   */
  async getMainText(
    t: { browser?: { evaluate: (fn: () => string) => Promise<unknown> } },
  ): Promise<string> {
    if (!t?.browser) return "";
    return (await t.browser.evaluate(() => {
      const main = document.querySelector("main");
      return main?.innerText ?? "";
    })) as string;
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
