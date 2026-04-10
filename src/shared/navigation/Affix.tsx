/**
 * Affix 固钉（View）。
 * 滚动超过阈值后将子节点通过 {@link createPortal} 挂到 `document.body`，以 `position: fixed` 贴在视口顶；
 * 原位保留占位高度避免布局跳动。是否固钉由宿主相对**视口**的 `getBoundingClientRect` 判定；`scroll` 监听挂在所有纵向可滚动祖先及 `window`（scroll 不冒泡），避免只绑 `window` 时侧栏内 `main` 滚动不触发更新。
 */

import { createRenderEffect, createSignal, onCleanup } from "@dreamer/view";
import { createPortal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

/** 浮层 z-index，需高于常见顶栏（如 z-50） */
const AFFIX_PORTAL_Z = 1030;

/**
 * 调试日志：需要排障时改为 `true`，平时保持 `false`。
 * 日志仅 `console.log`，不参与响应式，不会引发死循环。
 */
const AFFIX_DEBUG = false;

/** 仅调试：实例序号 */
let affixDebugSeq = 0;

/**
 * 调试输出，前缀 `[Affix]`。
 *
 * @param args - 透传 `console.log`
 */
function affixDbg(...args: unknown[]) {
  if (!AFFIX_DEBUG) return;
  console.log("[Affix]", ...args);
}

/** IO 用的细阈值，主栏滚动时也能较密地触发回调（避免只靠 scroll 漏事件） */
const AFFIX_IO_THRESHOLDS = Array.from(
  { length: 21 },
  (_, i) => i / 20,
);

export interface AffixProps {
  /** 子节点 */
  children?: unknown;
  /** 距离视口顶部的偏移（px），默认 `0` */
  offsetTop?: number;
  /** 额外 class（原位包装器） */
  class?: string;
  /** 固定浮层上的 class（如 shadow） */
  affixClass?: string;
  /**
   * 额外指定要监听 `scroll` 的容器（元素或 getter）；会与自动收集的纵向可滚动祖先合并。
   * 用于祖先链上未能识别出 overflow、或滚动发生在 Shadow/iframe 等少数场景。
   */
  scrollTarget?: Element | (() => Element | null);
  /**
   * 是否避让视口顶部 `fixed`/`sticky` 遮挡（如全站 Header），自动把固钉 `top` 与触发线设为「遮挡底边 + offsetTop + headerGap」。
   * 设为 `false` 则 `top` 仍相对视口顶（`offsetTop`），适合无顶栏或全屏浮层内使用。
   */
  respectFixedHeader?: boolean;
  /**
   * 测得顶栏遮挡高度大于 0 时，固钉条与顶栏底边之间的额外间距（px），默认 `8`（约 5～10px 视觉空隙）。
   * 无顶栏（测得高度为 0）时不叠加，避免无端下移。
   */
  headerGap?: number;
}

/**
 * 自宿主父链向上收集所有「纵向可滚动」的祖先，用于绑定 `scroll`（scroll 事件不冒泡，须挂在真正滚动的节点上）。
 *
 * @param host - Affix 根 DOM
 * @returns 祖先 HTMLElement 列表（从近到远）
 */
function getVerticalScrollAncestors(host: HTMLElement): HTMLElement[] {
  if (typeof getComputedStyle === "undefined") return [];
  const out: HTMLElement[] = [];
  let node: HTMLElement | null = host.parentElement;
  while (node) {
    const s = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(s.overflowY)) out.push(node);
    node = node.parentElement;
  }
  return out;
}

/**
 * 解析调用方显式传入的滚动容器（元素或 getter）。
 *
 * @param explicit - `scrollTarget` prop
 * @returns 元素或 `null`
 */
function resolveExplicitScrollTarget(
  explicit: AffixProps["scrollTarget"],
): HTMLElement | null {
  if (explicit === undefined) return null;
  const t = typeof explicit === "function" ? explicit() : explicit;
  return t instanceof HTMLElement ? t : null;
}

/**
 * 解析「顶栏与固钉条之间」的额外间距：默认 8px，限制在 0～24，非法值回退默认。
 *
 * @param raw - `headerGap` 属性
 * @returns 非负像素值
 */
function resolveHeaderGap(raw: AffixProps["headerGap"]): number {
  if (raw === undefined) return 8;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 8;
  return Math.max(0, Math.min(24, n));
}

/** 宿主高度过小（折叠/未布局）时不参与判定，避免误判与 Portal 抖动 */
const AFFIX_MIN_HOST_HEIGHT = 0.5;

/**
 * 估算视口顶部遮挡总高度（全站顶栏等），用于顶固钉的 `top` 与触发线。
 * 1) 多采样 {@link Document.elementsFromPoint} 捕获 `fixed`/`sticky` 层（含贴顶窄条）；
 * 2) 自顶向下多次下探：解决「公告条 + 顶栏」叠放时单次采样只命中一层的问题；
 * 3) 贴顶的 `header` / `[role="banner"]`（`static` 文档流顶栏，如文档站外包层内的 NavBar）。
 *
 * @returns 遮挡底边相对视口顶的像素（取整，并做上限避免异常大块）
 */
function measureTopObstruction(): number {
  const doc = globalThis.document;
  if (!doc) return 0;
  const vh = globalThis.innerHeight;
  const vw = globalThis.innerWidth;
  let maxBottom = 0;

  /**
   * 将候选矩形纳入「顶区遮挡」：放宽 `top`，允许公告条/双层顶栏；仍限制高度避免把半屏算进顶栏。
   *
   * @param r - 元素视口矩形
   */
  const considerTopChromeRect = (r: DOMRectReadOnly) => {
    if (r.height < 1) return;
    /** 顶区：允许略下移的 static 顶栏（外包 div + inner header），或第二条横幅 */
    if (r.top > 112) return;
    if (r.height > 280 || r.bottom > vh * 0.42) return;
    maxBottom = Math.max(maxBottom, r.bottom);
  };

  if (typeof doc.elementsFromPoint === "function") {
    /** 左/中/右采样，避免顶栏品牌区偏左时中点未命中 fixed 条 */
    const xs = [0.12, 0.5, 0.88]
      .map((ratio) => Math.min(Math.max(vw * ratio, 8), vw - 8));

    /**
     * 从视口顶向下逐层下探：每层取当前 y 的命中栈中 fixed/sticky 的最大 bottom，再把 y 移到其下继续。
     * 最多 4 层，防止异常环。
     */
    let probeY = 6;
    for (let layer = 0; layer < 4; layer++) {
      let layerMax = 0;
      for (const x of xs) {
        const stack = doc.elementsFromPoint(x, probeY);
        if (!stack?.length) continue;
        for (const node of stack) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.closest("[view-portal]")) continue;
          const s = getComputedStyle(node);
          if (s.position !== "fixed" && s.position !== "sticky") continue;
          const r = node.getBoundingClientRect();
          if (r.top > 120 || r.height < 1) continue;
          if (r.height > 280 || r.bottom > vh * 0.42) continue;
          layerMax = Math.max(layerMax, r.bottom);
        }
      }
      if (layerMax <= probeY + 0.5) break;
      maxBottom = Math.max(maxBottom, layerMax);
      probeY = Math.min(layerMax + 3, vh - 4);
      if (probeY >= vh * 0.4) break;
    }
  }

  const body = doc.body;
  if (body) {
    for (const el of Array.from(
      body.querySelectorAll("header, [role='banner']"),
    )) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.closest("[view-portal]")) continue;
      const r = el.getBoundingClientRect();
      /** 顶栏：靠上、横向占比较宽，避免侧栏内窄 `nav` 误算 */
      const minBannerWidth = Math.min(vw * 0.32, 320);
      if (r.top > 96 || r.width < minBannerWidth) {
        continue;
      }
      considerTopChromeRect(r);
    }
  }

  return Math.min(Math.ceil(maxBottom), Math.floor(vh * 0.45));
}

/**
 * 是否应进入顶固钉态：浮层为 `position:fixed` 相对**视口**，用宿主 `getBoundingClientRect`。
 * 当 `rect.top <= topInset + offset` 时固钉（`topInset` 可已含顶栏与 `headerGap`，与浮层 `top` 一致）。
 *
 * @param host - 宿主（占位层）元素
 * @param offset - `offsetTop`（px）
 * @param topInset - 从视口顶到触发线的基准高度（px），含顶栏避让
 */
function computeShouldAffixTop(
  host: HTMLElement,
  offset: number,
  topInset: number,
): boolean {
  const rect = host.getBoundingClientRect();
  if (rect.height < AFFIX_MIN_HOST_HEIGHT) return false;
  return rect.top <= topInset + offset;
}

/**
 * 获取可作为 Portal 挂载点的 `body`；SSR 或无 DOM 时为 `null`。
 */
function getBody(): HTMLElement | null {
  return typeof globalThis.document !== "undefined"
    ? globalThis.document.body
    : null;
}

/**
 * Affix：长页滚动时将子区域钉在视口顶；固钉时内容经 Portal 挂到 body，避免被父级 `overflow` 裁切。
 */
export function Affix(props: AffixProps) {
  const {
    children,
    offsetTop = 0,
    class: className,
    affixClass,
    scrollTarget: scrollTargetProp,
    respectFixedHeader = true,
    headerGap: headerGapProp,
  } = props;

  const dbgId = AFFIX_DEBUG ? ++affixDebugSeq : 0;

  /** 有顶栏时固钉条与顶栏底之间的空隙（px） */
  const headerGapPx = resolveHeaderGap(headerGapProp);

  const offset = Number(offsetTop) || 0;

  const hostEl = createSignal<HTMLElement | null>(null);
  const affixed = createSignal(false);
  const placeholderHeight = createSignal(0);
  const layoutTick = createSignal(0);
  /** 视口顶 fixed/sticky 遮挡底边（px），供触发线与 `top` 共用 */
  const topInset = createSignal(0);

  /**
   * 计算 Portal 浮层行内样式（`position:fixed` 与 left/width/top 等）。
   * 必须在 `createPortal` 传入的响应式 getter 内**同步**调用并读 signal，不得用 `createMemo`：
   * View 的 `createMemo` 依赖内部 `createEffect`，提交晚于同帧的 `createRenderEffect`，
   * 首帧挂载 Portal 时仍会读到「未固钉」时缓存的空 `{}`，导致浮层无定位、不可见。
   *
   * @returns 行内样式对象；未固钉或无宿主时返回空对象
   */
  const computePortalStyle = (): Record<string, string> => {
    layoutTick.value;
    if (!affixed.value) return {};
    const el = hostEl.value;
    if (!el) return {};
    const inset = respectFixedHeader ? topInset.value : 0;
    /** 仅当确实测到顶栏时才加空隙，避免无顶栏页整体下移 */
    const chromeGap = respectFixedHeader && inset > 0 ? headerGapPx : 0;
    const r = el.getBoundingClientRect();
    return {
      position: "fixed",
      left: `${r.left}px`,
      width: `${r.width}px`,
      zIndex: String(AFFIX_PORTAL_Z),
      boxSizing: "border-box",
      top: `${inset + offset + chromeGap}px`,
      bottom: "auto",
    };
  };

  /**
   * 根据滚动位置切换固钉（仅改 `affixed` / `placeholderHeight`）。
   * 勿在此处递增 `layoutTick`：固钉后 Portal 与布局可能**同步**再派发 `scroll`，若在 `runSync` 内 bump `layoutTick` 会触发浮层重绘并形成
   * `runSync → layoutTick → … → scroll → runSync` 的同步死循环（`maximum synchronous depth exceeded`）。
   * 几何刷新见下方 `onScrollOrResize` 内微任务，以及挂载后紧跟的 {@link bumpLayoutAfterScroll}。
   */
  /** 调试：runSync 调用次数（仅用于抽样日志） */
  let runSyncDebugCount = 0;

  const runSync = () => {
    const h = hostEl.value;
    if (!h?.isConnected) {
      if (AFFIX_DEBUG) {
        affixDbg(`#${dbgId} runSync skip`, {
          hasHost: !!h,
          connected: h?.isConnected,
        });
      }
      return;
    }
    let inset = 0;
    if (respectFixedHeader) {
      inset = measureTopObstruction();
      if (!Object.is(topInset.value, inset)) topInset.value = inset;
    } else if (!Object.is(topInset.value, 0)) {
      topInset.value = 0;
    }

    const chromeGap = respectFixedHeader && inset > 0 ? headerGapPx : 0;
    const next = computeShouldAffixTop(h, offset, inset + chromeGap);
    runSyncDebugCount++;
    if (AFFIX_DEBUG && (next !== affixed.value || runSyncDebugCount <= 5)) {
      const r = h.getBoundingClientRect();
      affixDbg(`#${dbgId} runSync`, {
        n: runSyncDebugCount,
        next,
        was: affixed.value,
        rectTop: r.top,
        rectBottom: r.bottom,
        innerH: globalThis.innerHeight,
      });
    }
    if (next !== affixed.value) {
      if (next) {
        placeholderHeight.value = h.getBoundingClientRect().height;
      } else {
        placeholderHeight.value = 0;
      }
      affixed.value = next;
    }
  };

  /**
   * 在已固钉时推进 `layoutTick`，让 {@link computePortalStyle} 重算 left/width。
   * 使用 `queueMicrotask` 跳出当前 scroll/resize 同步栈，避免与 `runSync` 形成嵌套通知死循环。
   */
  const bumpLayoutAfterScroll = () => {
    queueMicrotask(() => {
      if (affixed.value) layoutTick.value++;
    });
  };

  /** 挂载宿主后绑定滚动/resize，卸载时移除监听 */
  createRenderEffect(() => {
    const host = hostEl.value;
    if (!host || typeof globalThis.document === "undefined") return;

    const explicitEl = resolveExplicitScrollTarget(scrollTargetProp);
    const ancestors = getVerticalScrollAncestors(host);
    const scrollElements = new Set<HTMLElement>();
    if (explicitEl) scrollElements.add(explicitEl);
    for (const a of ancestors) scrollElements.add(a);

    const onScrollOrResize = () => {
      runSync();
      bumpLayoutAfterScroll();
    };

    for (const el of scrollElements) {
      el.addEventListener("scroll", onScrollOrResize, { passive: true });
    }
    globalThis.addEventListener("scroll", onScrollOrResize, { passive: true });
    globalThis.addEventListener("resize", onScrollOrResize);

    /**
     * 主栏等「内部滚动」在个别环境下 scroll 监听仍可能漏帧；用 IntersectionObserver
     * 且 `root` 为最近滚动祖先时，目标相对该视口交叉区域变化会回调，从而驱动 {@link runSync}。
     */
    const ioRoot: Element | null = ancestors[0] ?? null;
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        () => {
          /** 微任务推迟，避免与布局/IO 同步重入叠出过深 */
          queueMicrotask(onScrollOrResize);
        },
        {
          root: ioRoot,
          threshold: AFFIX_IO_THRESHOLDS,
          rootMargin: "0px",
        },
      );
      io.observe(host);
      if (AFFIX_DEBUG) {
        affixDbg(`#${dbgId} IntersectionObserver`, {
          root: ioRoot
            ? ioRoot.tagName + (ioRoot.id ? `#${ioRoot.id}` : "")
            : "viewport",
        });
      }
    }

    if (AFFIX_DEBUG) {
      affixDbg(`#${dbgId} bind scroll`, {
        scrollTargets: [...scrollElements].map((el) =>
          `${el.tagName}${el.id ? `#${el.id}` : ""}`
        ),
        ancestorCount: ancestors.length,
      });
    }

    runSync();
    /** 首帧即进入固钉时无 scroll 事件，须补一次几何刷新，避免 Portal 沿用占位前的 left/width */
    bumpLayoutAfterScroll();

    onCleanup(() => {
      io?.disconnect();
      for (const el of scrollElements) {
        el.removeEventListener("scroll", onScrollOrResize);
      }
      globalThis.removeEventListener("scroll", onScrollOrResize);
      globalThis.removeEventListener("resize", onScrollOrResize);
    });
  });

  /** 固钉态在客户端将子树挂到 body，卸载或退出固钉时 `unmount` */
  createRenderEffect(() => {
    const body = getBody();
    if (!affixed.value || !body) return;

    if (AFFIX_DEBUG) affixDbg(`#${dbgId} createPortal`);

    const root = createPortal(
      () => (
        <div
          class={twMerge("max-w-full", affixClass ?? "")}
          style={computePortalStyle()}
        >
          {children}
        </div>
      ),
      body,
    );

    onCleanup(() => {
      if (AFFIX_DEBUG) affixDbg(`#${dbgId} portal cleanup`);
      root.unmount();
    });
  });

  /**
   * View 的 `scheduleFunctionRef` 在响应式子树更新时会先 `ref(null)` 再 `ref(el)`。
   * 若对 `hostEl` 写入 `null`，会触发依赖 `hostEl` 的 `createRenderEffect` 执行 cleanup 并立刻重绑；
   * 与 `runSync` 写入 `affixed`/`layoutTick` 触发的重渲染叠在一起，会形成
   * `notifyEffectSubscriber(render): maximum synchronous depth exceeded` 死循环。
   * 因此在「上一宿主仍接在文档上」时忽略本次 `null`，仅在真卸载（已断开）时清空。
   *
   * @param el - `ref` 传入的节点或 `null`
   */
  const setHostRef = (el: unknown) => {
    const next = (el as HTMLElement | null) ?? null;
    if (AFFIX_DEBUG) {
      affixDbg(
        `#${dbgId} ref`,
        next
          ? {
            tag: next.tagName,
            id: next.id || "",
            connected: next.isConnected,
          }
          : "null",
      );
    }
    if (next === null) {
      const prev = hostEl.value;
      if (prev != null && prev.isConnected) return;
      hostEl.value = null;
      return;
    }
    hostEl.value = next;
  };

  /**
   * 根 `div` 直接返回；**勿**再包一层 `return () => …`：
   * 否则父级 `insert` 展平时会订阅 `affixed`，重跑后 `cleanNode` 销毁组件子树，再次执行 `Affix()` 会重新 `createSignal`，固钉态被清空（表现为始终钉不住视口顶）。
   * 对 `affixed` / `placeholderHeight` 的读取放在 **children 函数**内，由子级 `insert` 单独挂 effect（与 Menu/Pagination 一致）。
   */
  return (
    <div ref={setHostRef} class={twMerge("w-full min-w-0", className ?? "")}>
      {() =>
        affixed.value
          ? (
            <div
              class="w-full box-border"
              style={{ minHeight: `${placeholderHeight.value}px` }}
              aria-hidden="true"
            />
          )
          : children}
    </div>
  );
}
