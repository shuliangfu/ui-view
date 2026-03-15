/**
 * Message 全局提示 — 复用 Toast，固定为顶部居中形态。
 * 与 Toast 类似但约定为「顶部居中」、更轻量；API 与 toast 一致，placement 固定为 top-center。
 */

import { toast } from "./toast-store.ts";

/** 默认 3 秒 */
const DEFAULT_DURATION = 3000;

/** Message API：顶部居中轻提示 */
export const message = {
  success: (content: string, duration = DEFAULT_DURATION) =>
    toast.show("success", content, duration, "top-center"),
  error: (content: string, duration = DEFAULT_DURATION) =>
    toast.show("error", content, duration, "top-center"),
  info: (content: string, duration = DEFAULT_DURATION) =>
    toast.show("info", content, duration, "top-center"),
  warning: (content: string, duration = DEFAULT_DURATION) =>
    toast.show("warning", content, duration, "top-center"),
  /** 关闭所有（与 toast.destroy 一致，因共用同一容器） */
  destroy: toast.destroy,
};
