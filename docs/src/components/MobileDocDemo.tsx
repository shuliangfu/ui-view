/**
 * @fileoverview 移动端文档「示例」区容器：圆角边框浅底，用于替代已移除的 PhoneDeviceFrame。
 */

import { createMemo } from "@dreamer/view";

/** {@link MobileDocDemo} 的 props */
export interface MobileDocDemoProps {
  /** 示例内容 */
  children?: unknown;
  /**
   * 追加在默认样式后的 class；默认带 `p-4`，若需无内边距可传 `p-0` 等覆盖（与 Tailwind 生成顺序有关时以项目为准）。
   */
  class?: string;
}

/**
 * 与 {@link MobileDocDemo} 默认外壳一致；需「示例外框 + 内部 signal」同组件时可 import 本串，
 * 避免多一层 `children` 传递在部分更新路径下整块 reconcile。
 */
export const MOBILE_DOC_DEMO_SHELL_BASE =
  "max-w-md rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-800/40";

/**
 * 包裹交互示例，保持各页视觉一致。
 *
 * @param props - 子节点与可选 class
 */
export function MobileDocDemo(props: MobileDocDemoProps) {
  /**
   * 合并 class 用 memo：子级（如 ScrollList）内 signal 更新时，外壳字符串不变则少触发无关节点更新，
   * 与「示例区外层 div 整块重挂」类问题解耦（子树仍由各自组件 reconcile）。
   */
  const shellClass = createMemo(() =>
    props.class != null && props.class !== ""
      ? `${MOBILE_DOC_DEMO_SHELL_BASE} ${props.class}`
      : `${MOBILE_DOC_DEMO_SHELL_BASE} p-4`
  );
  return <div class={shellClass()}>{props.children}</div>;
}
