/**
 * Toast 轻提示 — 全局状态与命令式 API。
 * 供 Toast 容器消费，支持 success/error/info/warning、duration、placement。
 */

import { createSignal } from "@dreamer/view";

/** 单条 Toast 类型 */
export type ToastType = "success" | "error" | "info" | "warning";

/** 可选展示位置：上、下、居中（水平+垂直居中），默认上 */
export type ToastPlacement = "top" | "bottom" | "center";

export interface ToastItem {
  id: string;
  type: ToastType;
  content: string;
  duration: number;
  placement: ToastPlacement;
  /** 创建时间戳，用于排序与自动关闭 */
  createdAt: number;
}

/** 全局 Toast 列表（模块级 `Signal`，`createSignal`；命令式 API 写 `.value`） */
const toastListRef = createSignal<ToastItem[]>([]);

/**
 * 供 ToastContainer 在渲染 getter 内调用：读 `.value` 以订阅列表变化。
 * （与旧版元组 `createSignal` 的 getter 语义一致。）
 */
export function toastList(): ToastItem[] {
  return toastListRef.value;
}

/** 生成唯一 id */
function nextId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 添加一条 Toast；duration 为 0 表示不自动关闭 */
function push(item: Omit<ToastItem, "id" | "createdAt">): string {
  const id = nextId();
  const list = toastListRef.value;
  toastListRef.value = [
    ...list,
    {
      ...item,
      id,
      createdAt: Date.now(),
    },
  ];
  if (item.duration > 0) {
    setTimeout(() => removeToast(id), item.duration);
  }
  return id;
}

/** 移除指定 id 的 Toast */
export function removeToast(id: string): void {
  toastListRef.value = toastListRef.value.filter((t: ToastItem) => t.id !== id);
}

/** 清空所有 Toast */
export function clearToasts(): void {
  toastListRef.value = [];
}

/** 默认 duration（毫秒） */
const DEFAULT_DURATION = 3000;

/** 命令式 API：展示轻提示 */
export const toast = {
  success: (
    content: string,
    duration = DEFAULT_DURATION,
    placement: ToastPlacement = "top",
  ) => toast.show("success", content, duration, placement),
  error: (
    content: string,
    duration = DEFAULT_DURATION,
    placement: ToastPlacement = "top",
  ) => toast.show("error", content, duration, placement),
  info: (
    content: string,
    duration = DEFAULT_DURATION,
    placement: ToastPlacement = "top",
  ) => toast.show("info", content, duration, placement),
  warning: (
    content: string,
    duration = DEFAULT_DURATION,
    placement: ToastPlacement = "top",
  ) => toast.show("warning", content, duration, placement),
  show: (
    type: ToastType,
    content: string,
    duration = DEFAULT_DURATION,
    placement: ToastPlacement = "top",
  ): string => push({ type, content, duration, placement }),
  dismiss: removeToast,
  destroy: clearToasts,
};
