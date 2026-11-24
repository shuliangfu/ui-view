/**
 * docs 子进程隔离 / 异常退出回收 / 保留端口避让 的定向回归。
 * 不启动真实 docs 应用，不占用 3000/3100/8001/8004。
 */
import {
  createCommand,
  dirname,
  execPath,
  IS_BUN,
  IS_DENO,
  IS_NODE,
  join,
} from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname as nodeDirname, join as nodeJoin } from "node:path";
import {
  installSyncProcessExitHook,
  isReservedDocsE2EPort,
  isSafeOwnedPid,
  killOwnedDocsProcess,
  RESERVED_DOCS_E2E_PORTS,
  startWithCleanupOnFailure,
} from "./docs-browser/docs-process-guard.ts";
import {
  collectUiViewTestFiles,
  isCollectableTestPort,
  runTestFilesSequentially,
  TEST_COLLECT_SKIP_DIRS,
} from "./test-runner-utils.ts";

const hereDir = dirname(
  typeof import.meta.url !== "undefined" && import.meta.url.startsWith("file:")
    ? new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
    : join(".", "tests", "docs-server-lifecycle.test.ts"),
);
const UI_VIEW_ROOT = join(hereDir, "..");
const EXIT_CHILD = join(hereDir, "docs-server-lifecycle-exit-child.ts");

function isPidAlive(pid: number): boolean {
  if (!pid || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitUntil(
  pred: () => boolean,
  timeoutMs: number,
  stepMs = 50,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pred()) return true;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return pred();
}

async function spawnHangDeno(): Promise<
  { pid: number; proc: ReturnType<ReturnType<typeof createCommand>["spawn"]> }
> {
  const proc = createCommand("deno", {
    args: ["eval", "setInterval(() => {}, 1 << 30)"],
    stdout: "null",
    stderr: "null",
  }).spawn();
  const pid = proc.pid ?? 0;
  if (!pid) throw new Error("failed to spawn hang deno");
  const alive = await waitUntil(() => isPidAlive(pid), 3000);
  if (!alive) throw new Error(`hang deno pid ${pid} died immediately`);
  return { pid, proc };
}

describe("docs E2E reserved ports", () => {
  it("does not treat user service ports as collectable", () => {
    for (const port of [3000, 3100, 8001, 8004]) {
      expect(isReservedDocsE2EPort(port)).toBe(true);
      expect(isCollectableTestPort(port)).toBe(false);
    }
    expect(RESERVED_DOCS_E2E_PORTS.size).toBe(4);
    expect(isReservedDocsE2EPort(3018)).toBe(false);
    expect(isCollectableTestPort(3018)).toBe(true);
    expect(isCollectableTestPort(3102)).toBe(true);
  });
});

describe("Node runner test file collection", () => {
  it("includes unit suites previously missed by test-node.mjs", () => {
    const files = collectUiViewTestFiles(UI_VIEW_ROOT);
    const norm = files.map((f) => f.replace(/\\/g, "/"));
    const has = (part: string) =>
      norm.some((f) =>
        f.includes(part) && f.endsWith(".test.ts") ||
        f.includes(part) && f.endsWith(".test.tsx")
      );
    expect(has("/tests/data-panel/")).toBe(true);
    expect(has("/tests/shared/")).toBe(true);
    expect(has("/tests/docs/")).toBe(true);
    expect(has("/tests/docs-browser/")).toBe(true);
    expect(has("docs-sidebar-reconcile.test.ts")).toBe(true);
    expect(has("plugin-sources-css.test.ts")).toBe(true);
    expect(has("docs-server-lifecycle.test.ts")).toBe(true);
    expect(files.length).toBeGreaterThan(300);
    const names = norm.map((f) => f.split("/").pop() ?? f);
    expect(names.includes("docs-server-lifecycle-exit-child.ts")).toBe(false);
    expect(norm.some((f) => f.includes("/fixtures/") && f.includes(".test.")))
      .toBe(false);
  });

  it("skips coverage / fixtures / node_modules in a temp tree", () => {
    const root = mkdtempSync(nodeJoin(tmpdir(), "ui-view-collect-"));
    const testsDir = nodeJoin(root, "tests");
    mkdirSync(nodeJoin(testsDir, "shared"), { recursive: true });
    mkdirSync(nodeJoin(testsDir, "coverage"), { recursive: true });
    mkdirSync(nodeJoin(testsDir, "docs-browser", "operations", "fixtures"), {
      recursive: true,
    });
    writeFileSync(nodeJoin(testsDir, "shared", "ok.test.ts"), "");
    writeFileSync(nodeJoin(testsDir, "coverage", "hidden.test.ts"), "");
    writeFileSync(
      nodeJoin(
        testsDir,
        "docs-browser",
        "operations",
        "fixtures",
        "fx.test.ts",
      ),
      "",
    );
    expect(TEST_COLLECT_SKIP_DIRS.has("coverage")).toBe(true);
    const files = collectUiViewTestFiles(root).map((f) =>
      f.replace(/\\/g, "/")
    );
    expect(files.some((f) => f.endsWith("/shared/ok.test.ts"))).toBe(true);
    expect(files.some((f) => f.includes("/coverage/"))).toBe(false);
    expect(files.some((f) => f.includes("/fixtures/"))).toBe(false);
  });
});

describe("docs process cleanup on start failure", () => {
  it("kills the already-spawned process when start throws", async () => {
    const { pid, proc } = await spawnHangDeno();
    let cleaned = false;
    let caught = false;
    try {
      await startWithCleanupOnFailure(async () => {
        throw new Error("docs not ready");
      }, () => {
        killOwnedDocsProcess(proc, pid);
        cleaned = true;
      });
    } catch (err) {
      caught = err instanceof Error && err.message === "docs not ready";
    }
    expect(caught).toBe(true);
    expect(cleaned).toBe(true);
    expect(await waitUntil(() => !isPidAlive(pid), 5000)).toBe(true);
  });
});

describe("docs process exit hook", () => {
  it("kills the hold child when the hook installer process exits", async () => {
    const runtime = IS_DENO ? execPath() : IS_BUN ? "bun" : "node";
    const args = IS_DENO
      ? ["run", "-A", EXIT_CHILD]
      : IS_NODE
      ? ["--import", "tsx", EXIT_CHILD]
      : [EXIT_CHILD];
    const output = await createCommand(runtime, {
      args,
      cwd: UI_VIEW_ROOT,
      stdout: "piped",
      stderr: "piped",
    }).output();
    const stdout = new TextDecoder().decode(output.stdout ?? new Uint8Array());
    const stderr = new TextDecoder().decode(output.stderr ?? new Uint8Array());
    const match = /HOLD_PID=(\d+)/.exec(stdout);
    if (!match) {
      throw new Error(
        `exit-child did not print HOLD_PID (code=${output.code}):\n${stdout}\n${stderr}`,
      );
    }
    const holdPid = Number.parseInt(match[1], 10);
    expect(holdPid).toBeGreaterThan(0);
    const gone = await waitUntil(() => !isPidAlive(holdPid), 8000);
    if (!gone) {
      killOwnedDocsProcess(null, holdPid);
    }
    expect(gone).toBe(true);
    expect(output.success).toBe(true);
  });
});

describe("owned process tree kill stays scoped", () => {
  it("rejects init and self pid", () => {
    expect(isSafeOwnedPid(0)).toBe(false);
    expect(isSafeOwnedPid(1)).toBe(false);
    expect(isSafeOwnedPid(-3)).toBe(false);
    const self = (globalThis as { process?: { pid?: number } }).process?.pid;
    if (typeof self === "number") expect(isSafeOwnedPid(self)).toBe(false);
    expect(isSafeOwnedPid(424242)).toBe(true);
  });

  it("does not kill a preexisting process when cleaning another owned pid", async () => {
    const preexisting = await spawnHangDeno();
    const owned = await spawnHangDeno();
    try {
      killOwnedDocsProcess(owned.proc, owned.pid);
      expect(await waitUntil(() => !isPidAlive(owned.pid), 5000)).toBe(true);
      expect(isPidAlive(preexisting.pid)).toBe(true);
    } finally {
      killOwnedDocsProcess(preexisting.proc, preexisting.pid);
      await waitUntil(() => !isPidAlive(preexisting.pid), 5000);
    }
  });
});

describe("sequential runner executes every given file and propagates failure", () => {
  it("runs pass then fail, records both, and returns exit code 1", () => {
    const dir = mkdtempSync(nodeJoin(tmpdir(), "ui-view-seq-"));
    const marker = nodeJoin(dir, "marker");
    const passFile = nodeJoin(dir, "pass.test.ts");
    const failFile = nodeJoin(dir, "fail.test.ts");
    writeFileSync(
      passFile,
      `Deno.env.get("MARKER") && Deno.writeTextFileSync(Deno.env.get("MARKER")! + "-pass", "ok");
Deno.test("pass", () => {});
`,
    );
    writeFileSync(
      failFile,
      `Deno.env.get("MARKER") && Deno.writeTextFileSync(Deno.env.get("MARKER")! + "-fail", "ok");
Deno.test("fail", () => { throw new Error("intentional fixture failure"); });
`,
    );
    const deno = IS_DENO ? execPath() : "deno";
    const result = runTestFilesSequentially(
      deno,
      ["test", "-A", "--no-check"],
      [
        passFile,
        failFile,
      ],
      {
        env: { ...process.env, MARKER: marker },
      },
    );
    expect(result.results.length).toBe(2);
    expect(result.results[0]!.status).toBe(0);
    expect(result.results[1]!.status).not.toBe(0);
    expect(result.failed).toBe(1);
    expect(result.exitCode).toBe(1);
    expect(existsSync(marker + "-pass")).toBe(true);
    expect(existsSync(marker + "-fail")).toBe(true);
  });
});
