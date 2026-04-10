/**
 * Message 全局提示 — 独立状态与命令式 API（与 Toast 分离）。
 * 固定顶部居中展示，支持 success/error/info/warning、duration。
 */

import { createSignal } from "@dreamer/view";

/** 单条 Message 类型 */
export type MessageType = "success" | "error" | "info" | "warning";

/** 展示位置：顶部居中、视口绝对居中（水平+垂直） */
export type MessagePlacement = "top" | "center";

export interface MessageItem {
  id: string;
  type: MessageType;
  content: string;
  duration: number;
  /** 展示位置，默认 top */
  placement: MessagePlacement;
  /** 创建时间戳，用于排序与自动关闭 */
  createdAt: number;
}

/** 全局 Message 列表（模块级 `Signal`，`createSignal`） */
const messageListRef = createSignal<MessageItem[]>([]);

/** 供 MessageContainer 在渲染 getter 内订阅列表 */
export function messageList(): MessageItem[] {
  return messageListRef.value;
}

function nextId(): string {
  return `message-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 添加一条 Message；duration 为 0 表示不自动关闭；placement 可选，默认 top */
function push(
  item: Omit<MessageItem, "id" | "createdAt" | "placement"> & {
    placement?: MessagePlacement;
  },
): string {
  const id = nextId();
  const list = messageListRef.value;
  messageListRef.value = [
    ...list,
    {
      ...item,
      placement: item.placement ?? "top",
      id,
      createdAt: Date.now(),
    },
  ];
  if (item.duration > 0) {
    setTimeout(() => removeMessage(id), item.duration);
  }
  return id;
}

/** 移除指定 id 的 Message */
export function removeMessage(id: string): void {
  messageListRef.value = messageListRef.value.filter((m: MessageItem) =>
    m.id !== id
  );
}

/** 关闭全部 Message */
export function clearMessages(): void {
  messageListRef.value = [];
}

const DEFAULT_DURATION = 3000;

/** 命令式 API：全局提示，可选 placement（top 顶部居中 / center 视口绝对居中） */
export const message = {
  success: (
    content: string,
    duration = DEFAULT_DURATION,
    placement: MessagePlacement = "top",
  ): string => message.show("success", content, duration, placement),
  error: (
    content: string,
    duration = DEFAULT_DURATION,
    placement: MessagePlacement = "top",
  ): string => message.show("error", content, duration, placement),
  info: (
    content: string,
    duration = DEFAULT_DURATION,
    placement: MessagePlacement = "top",
  ): string => message.show("info", content, duration, placement),
  warning: (
    content: string,
    duration = DEFAULT_DURATION,
    placement: MessagePlacement = "top",
  ): string => message.show("warning", content, duration, placement),
  show: (
    type: MessageType,
    content: string,
    duration = DEFAULT_DURATION,
    placement: MessagePlacement = "top",
  ): string => push({ type, content, duration, placement }),
  destroy: clearMessages,
};
