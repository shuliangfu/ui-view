/**
 * 生命周期回归用子进程：拉起一个挂起的 deno 孙进程，安装退出钩子后立刻退出。
 * 不是测试文件（无 .test. 后缀），不会被 runner 收集。
 */
import { createCommand } from "@dreamer/runtime-adapter";
import {
  installSyncProcessExitHook,
  killOwnedDocsProcess,
} from "./docs-browser/docs-process-guard.ts";

const hold = createCommand("deno", {
  args: ["eval", "setInterval(() => {}, 1 << 30)"],
  stdout: "null",
  stderr: "null",
}).spawn();
const pid = hold.pid ?? 0;
if (!pid) {
  console.error("HOLD_PID=0");
  throw new Error("HOLD_PID=0");
}
console.log(`HOLD_PID=${pid}`);
installSyncProcessExitHook(() => {
  killOwnedDocsProcess(hold, pid);
});
// 不 unref 则父进程会一直等这个挂起的孙进程，退出钩子无法被验证。
try {
  hold.unref?.();
} catch {
  /* ignore */
}
