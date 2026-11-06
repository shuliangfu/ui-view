/**
 * docs 开发用：包装 @dreamer/runtime-adapter 的 WebSocket Origin 校验。
 *
 * 【Why】HMR wsUrl 使用 listenHost（默认 127.0.0.1），浏览器若以 localhost 打开则
 * Origin≠Host，runtime-adapter 默认同源校验拒绝：「WebSocket 升级被拒绝：Origin 不被允许」。
 *
 * 【Fix】
 * 1. 本文件覆盖 `upgradeWebSocket` / `serve`，合并本机 Origin 白名单
 *    （localhost / 127.0.0.1 / [::1] × 当前 PORT 与 3000–3025）。
 * 2. 显式再导出（不用 `export *`＋同名覆盖，Deno 下调用方仍可能拿到原实现）。
 * 3. 必须在**仓库根** `deno.json` 的 `scopes` 里把
 *    `https://jsr.io/@dreamer/server/` 与 `…/dweb/` 对 adapter 的 jsr 导入指到本文件
 *    （成员 `docs/deno.json` 的 scopes 无效；远端 JSR 包内的 `jsr:` 也不吃顶层 imports）。
 */

import {
  getEnv,
  serve as realServe,
  upgradeWebSocket as realUpgradeWebSocket,
  type ServeHandle,
  type ServeOptions,
  type UpgradeWebSocketOptions,
  type UpgradeWebSocketResult,
} from "jsr:@dreamer/runtime-adapter@1.2.2";

export {
  IS_BUN, IS_DENO, IS_NODE, IS_SUPPORTED, RUNTIME, RuntimeAdapterError, WebSocketAdapter, addSignalListener, arch, args, assertSupportedRuntime, basename, chdir, chmod, chown, connect, copyFile, create, createCommand, cron, cwd, deleteEnv, detectRuntime, dirname, ensureDir, ensureDirSync, execCommandSync, execPath, exists, existsSync, exit, extname, fromFileUrl, getBuffer, getBun, getCpuUsage, getDeno, getDiskUsage, getEnv, getEnvAll, getLoadAverage, getLoadAverageSync, getMemoryInfo, getMemoryInfoSync, getProcess, getStderr, getStdout, getSystemInfo, getSystemInfoSync, getSystemStatus, hasEnv, hash, hashFile, hashFileSync, hashSync, isAbsolute, isDirectory, isDirectorySync, isFile, isFileSync, isRelative, isRuntimeAdapterError, isStderrTerminal, isStdinTerminal, isTerminal, join, killProcessTree, makeTempDir, makeTempFile, mkdir, mkdirSync, normalize, onlyBunOrDenoError, open, pathToFileUrl, pid, platform, platformLimitationError, readFile, readFileSync, readStdin, readTextFile, readTextFileSync, readdir, readdirSync, realPath, realPathSync, relative, remove, removeSignalListener, removeSync, rename, resolve, setEnv, setStdinRaw, startTls, stat, statSync, symlink, truncate, unsupportedRuntimeError, version, walk, watchFs, writeFile, writeFileSync, writeStderrSync, writeStdoutSync, writeTextFile, writeTextFileSync
} from "jsr:@dreamer/runtime-adapter@1.2.2";

export type {
  ServeHandle,
  ServeOptions,
  UpgradeWebSocketOptions,
  UpgradeWebSocketResult,
  FileWatcher,
} from "jsr:@dreamer/runtime-adapter@1.2.2";

type ServeHandler = (
  req: Request,
) =>
  | Response
  | Promise<Response>
  | Promise<Response | undefined>
  | undefined;

/** 本机文档站可能出现的 Origin（含端口占用自动 +1 的常见区间） */
export function docsLocalHmrAllowedOrigins(): string[] {
  const ports = new Set<number>();
  const envPort = getEnv("PORT")?.trim();
  if (envPort && /^\d+$/.test(envPort) && Number(envPort) > 0) {
    ports.add(Number(envPort));
  }
  for (let p = 3000; p <= 3025; p++) ports.add(p);

  const hosts = ["127.0.0.1", "localhost", "[::1]"];
  const out: string[] = [];
  for (const host of hosts) {
    for (const port of ports) {
      out.push(`http://${host}:${port}`);
    }
  }
  return out;
}

function mergeAllowed(extra?: string[]): string[] {
  return [...new Set([...(extra ?? []), ...docsLocalHmrAllowedOrigins()])];
}

export function upgradeWebSocket(
  request: Request,
  options?: UpgradeWebSocketOptions,
): UpgradeWebSocketResult {
  return realUpgradeWebSocket(request, {
    ...options,
    allowedOrigins: mergeAllowed(options?.allowedOrigins),
  });
}

export function serve(
  options: ServeOptions | ServeHandler,
  handler?: ServeHandler,
): ServeHandle {
  if (typeof options === "function") {
    return realServe(
      { allowedOrigins: mergeAllowed() },
      options,
    );
  }
  return realServe(
    {
      ...options,
      allowedOrigins: mergeAllowed(options.allowedOrigins),
    },
    handler!,
  );
}
