/**
 * @fileoverview 文档站 / 嵌入式预览：将 BottomSheet、ActionSheet 等浮层的 Portal 限制在「模拟视口」内，而非整页 `document.body`。
 * 通过 `transform: translateZ(0)` 建立 `position: fixed` 的包含块，使遮罩与抽屉相对于本 Scope 铺满。
 */

import { createContext, createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

/**
 * Context 承载对象而非裸函数：`@dreamer/view` 的 `useContext` 会把「函数型 value」当场执行一次，
 * 若直接传 `() => hostEl()`，消费者会得到 `HTMLElement | null` 而非 getter，导致 BottomSheet 等处 `getScopedHost is not a function`。
 */
export interface MobilePortalHostContextValue {
  /**
   * 返回当前 Portal 锚点 DOM；未挂载或未设 ref 时为 `null`/`undefined`。
   */
  getHost: () => HTMLElement | null | undefined;
}

/** 无 Provider 时为 `null` */
export const MobilePortalHostContext = createContext<
  MobilePortalHostContextValue | null
>(null);

/** {@link MobilePortalHostScope} 的 props */
export interface MobilePortalHostScopeProps {
  /** 可滚动主内容等；与底部锚点层共用同一「机内视口」 */
  children?: unknown;
  /**
   * 包裹层额外 class；须保持纵向 flex 与 `min-h-0`，以便在 flex 布局中占满剩余屏高。
   */
  class?: string;
}

/**
 * 包住模拟手机/内嵌移动预览的可交互区域：子组件树内的 BottomSheet、ActionSheet 会优先 Portal 到本层叠锚点。
 *
 * @param props - 子节点与可选 class
 */
export function MobilePortalHostScope(props: MobilePortalHostScopeProps) {
  /** Portal 真实挂载的 DOM 节点，由 ref 写入 */
  const hostEl = createSignal<HTMLElement | null>(null);

  /**
   * 供 {@link MobilePortalHostContext} 消费：在 `createMemo` 内调用可订阅 ref 更新。
   *
   * @returns 当前锚点元素，未挂载时为 `null`
   */
  const getHost = () => hostEl();

  /**
   * 将锚点层 DOM 与信号同步，便于 BottomSheet 等 `createMemo` 追踪依赖。
   *
   * @param el - 原生元素或卸载时的 `null`
   */
  const setHostRef = (el: unknown) => {
    hostEl.set((el as HTMLElement | null) ?? null);
  };

  return (
    <MobilePortalHostContext.Provider value={{ getHost }}>
      <div
        class={twMerge(
          "relative flex min-h-0 flex-1 flex-col [transform:translateZ(0)]",
          props.class,
        )}
      >
        {props.children}
        {
          /*
          叠在内容之上、不参与命中检测；浮层根节点自行 `pointer-events-auto`
        */
        }
        <div
          ref={setHostRef}
          class="pointer-events-none absolute inset-0 z-[120]"
          aria-hidden="true"
          data-dreamer-mobile-portal-host=""
        />
      </div>
    </MobilePortalHostContext.Provider>
  );
}
