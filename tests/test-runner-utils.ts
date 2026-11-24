/**
 * 跨 runner 的测试文件收集与端口避让（Deno / Bun / Node 应对齐）。
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  isReservedDocsE2EPort,
  isSafeOwnedPid,
} from "./docs-browser/docs-process-guard.ts";

export {
  isReservedDocsE2EPort,
  RESERVED_DOCS_E2E_PORTS,
} from "./docs-browser/docs-process-guard.ts";

/** 收集时跳过的目录名（产物、夹具、依赖）。 */
export const TEST_COLLECT_SKIP_DIRS: ReadonlySet<string> = new Set([
  "coverage",
  "node_modules",
  "fixtures",
  "deno-cache",
]);

/**
 * 收集 ui-view 仓库 `tests/` 下全部 `*.test.ts(x)`。
 * 官方 `test-node.mjs` 此前只收 `docs-browser` + 一个单测文件，会漏跑并造成假绿。
 */
export function collectUiViewTestFiles(root: string): string[] {
  const testsRoot = join(root, "tests");
  const out: string[] = [];
  const walk = (dir: string) => {
    let names: string[] = [];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (TEST_COLLECT_SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(full);
      else if (/\.test\.tsx?$/.test(name)) out.push(full);
    }
  };
  walk(testsRoot);
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

export function isCollectableTestPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && !isReservedDocsE2EPort(port);
}

/**
 * 仅用 Node 内置 API 杀进程树，供 test-node.mjs 在不经 JSR 再导出时调用。
 */
export type SequentialTestRunResult = {
  results: { file: string; status: number | null }[];
  failed: number;
  exitCode: number;
};

/**
 * 按文件顺序执行并传播失败码（与 test-node.mjs 循环一致）。
 * 只接受调用方给出的文件列表，不会自己去收集或执行仓库全量。
 */
export function runTestFilesSequentially(
  command: string,
  prefixArgs: string[],
  files: string[],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv },
): SequentialTestRunResult {
  const results: { file: string; status: number | null }[] = [];
  let failed = 0;
  for (const file of files) {
    const r = spawnSync(command, [...prefixArgs, file], {
      cwd: options?.cwd,
      env: options?.env,
      encoding: "utf-8",
    });
    const status = r.status;
    results.push({ file, status });
    if (status !== 0) failed++;
  }
  return { results, failed, exitCode: failed > 0 ? 1 : 0 };
}

export function killProcessTreePortable(pid: number, signo = 9): void {
  if (!isSafeOwnedPid(pid)) return;
  const plat = process.platform;
  if (plat === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } catch {
      /* already gone */
    }
    return;
  }
  try {
    const childPids = execFileSync("pgrep", ["-P", String(pid)], {
      encoding: "utf-8",
    }).trim();
    if (childPids) {
      for (const line of childPids.split("\n")) {
        const childPid = Number.parseInt(line.trim(), 10);
        if (childPid) killProcessTreePortable(childPid, signo);
      }
    }
  } catch {
    /* no children */
  }
  try {
    process.kill(pid, signo);
  } catch {
    /* already gone */
  }
}
