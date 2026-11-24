/**
 * docs E2E 子进程的端口避让、失败回收与退出钩子。
 * 供 helpers.ts 与生命周期回归测试共用，避免在每个用例里重复清理。
 */
import { killProcessTree } from "@dreamer/runtime-adapter";

/** 用户本机长期占用的服务端口，E2E docs 不得探测或绑定。 */
export const RESERVED_DOCS_E2E_PORTS: ReadonlySet<number> = new Set([
  3000,
  3100,
  8001,
  8004,
]);

export function isReservedDocsE2EPort(port: number): boolean {
  return RESERVED_DOCS_E2E_PORTS.has(port);
}

export type KillableDocsProcess = {
  killTree?: (signo?: number) => void;
  kill?: (signo?: number) => void;
  pid?: number;
} | null;

/**
 * 只允许杀掉本测试真正 spawn 出来的 PID。
 * 拒绝 0/负数/PID 1（init）以及当前测试进程自身，避免误杀端口上已有的用户服务。
 * 清理按 PID 进程树进行，从不按端口杀进程。
 */
export function isSafeOwnedPid(pid: unknown): pid is number {
  if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 1) {
    return false;
  }
  const self = (globalThis as { process?: { pid?: number } }).process?.pid;
  if (typeof self === "number" && pid === self) return false;
  return true;
}

/**
 * 杀掉 docs 子进程整棵树。
 * Bun 下 `kill(9)` 只杀直接子进程，孙进程（如 deno 拉起的工具进程）会变成 PPID=1 孤儿并继续占端口。
 */
export function killOwnedDocsProcess(
  proc: KillableDocsProcess,
  pid?: number,
): void {
  const treePid = pid ?? proc?.pid;
  if (!isSafeOwnedPid(treePid)) return;
  try {
    if (typeof proc?.killTree === "function") proc.killTree(9);
    else if (typeof proc?.kill === "function") proc.kill(9);
  } catch {
    /* already gone */
  }
  try {
    killProcessTree(treePid, 9);
  } catch {
    /* already gone */
  }
}

/**
 * 启动失败时回收已 spawn 的子进程，再把原错误抛出。
 */
export async function startWithCleanupOnFailure<T>(
  start: () => Promise<T>,
  cleanup: () => void | Promise<void>,
): Promise<T> {
  try {
    return await start();
  } catch (err) {
    try {
      await cleanup();
    } catch {
      /* 保留启动失败作为主错误 */
    }
    throw err;
  }
}

type ProcessLike = {
  on?: (event: string, fn: () => void) => void;
  off?: (event: string, fn: () => void) => void;
  removeListener?: (event: string, fn: () => void) => void;
};

type DenoSignalLike = {
  addSignalListener?: (signal: string, fn: () => void) => void;
  removeSignalListener?: (signal: string, fn: () => void) => void;
};

/**
 * 同步退出钩子：覆盖 Node/Bun `process` 事件、Deno 信号，以及 `unload`。
 * Deno 没有 `process.on("exit")`，仅 SIGTERM/SIGINT 不够覆盖测试进程正常退出，
 * 这是 docs 子进程残留（PPID=1）的主因之一。钩子必须同步。
 */
export function installSyncProcessExitHook(kill: () => void): () => void {
  const proc = (globalThis as { process?: ProcessLike }).process;
  const DenoRef = (globalThis as { Deno?: DenoSignalLike }).Deno;
  const events = ["exit", "beforeExit", "SIGTERM", "SIGINT"] as const;
  for (const ev of events) {
    try {
      proc?.on?.(ev, kill);
    } catch {
      /* ignore */
    }
  }
  for (const sig of ["SIGTERM", "SIGINT"] as const) {
    try {
      DenoRef?.addSignalListener?.(sig, kill);
    } catch {
      /* ignore */
    }
  }
  try {
    globalThis.addEventListener("unload", kill);
  } catch {
    /* ignore */
  }
  return () => {
    for (const ev of events) {
      try {
        proc?.off?.(ev, kill);
      } catch {
        /* ignore */
      }
      try {
        proc?.removeListener?.(ev, kill);
      } catch {
        /* ignore */
      }
    }
    for (const sig of ["SIGTERM", "SIGINT"] as const) {
      try {
        DenoRef?.removeSignalListener?.(sig, kill);
      } catch {
        /* ignore */
      }
    }
    try {
      globalThis.removeEventListener("unload", kill);
    } catch {
      /* ignore */
    }
  };
}
