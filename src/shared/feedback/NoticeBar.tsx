/**
 * NoticeBar 通知栏（View）。
 * 顶部／块级提示条：信息／成功／警告／危险；可关闭、关闭前确认、关闭后不再显示。
 * 滚动：默认从右向左；也可从下往上。content 为数组时一次只显示一条，停留后再接下一条。
 *
 * 关闭态：内部 `closed` Signal + 子树 thunk 订阅（setup 经 jsx `untrack`）。
 */

import { createSignal, type JSXRenderable, onCleanup } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { Popconfirm } from "../../desktop/feedback/Popconfirm.tsx";
import { isAlertClosed, writeAlertCloseCookie } from "./alert-close-cookie.ts";
import { type MaybeSignal, readMaybeSignal } from "../form/maybe-signal.ts";
import { IconInfo } from "../basic/icons/Info.tsx";

export type NoticeBarTone = "info" | "success" | "warning" | "danger";

/** 滚动速度：三档或像素/秒 */
export type NoticeBarSpeed = "fast" | "medium" | "slow" | number;

/** 滚动方向：horizontal 从右向左，vertical 从下往上 */
export type NoticeBarDirection = "horizontal" | "vertical";
export type NoticeBarRounded = boolean | "sm" | "md" | "lg" | "full";

export interface NoticeBarMessages {
  /** 关闭按钮 aria-label */
  close: string;
}

export const defaultNoticeBarMessages: NoticeBarMessages = {
  close: "关闭",
};

export interface NoticeBarProps {
  /** 文案；字符串／节点，或数组（一次一条，滚完再接下一条） */
  content?: unknown;
  /** 子节点（与 content 二选一，children 优先） */
  children?: unknown;
  /** 色调 */
  tone?: NoticeBarTone;
  /**
   * 左侧图标，默认 `false` 不显示。写 `icon` 即显示默认 info 图标，
   * 颜色随 {@link tone}；也可传入自定义节点。
   */
  icon?: boolean | unknown;
  /** 是否可关闭；传入 closeConfirm 或 closeKey 时默认显示 */
  closable?: boolean;
  /**
   * 关闭回调（closable 时点击关闭触发）。
   * 点击后本组件会自行隐藏，并调用本回调。
   * 若设置了 {@link closeConfirm}，需在确认后才会隐藏并调用本回调。
   */
  onClose?: () => void;
  /**
   * 关闭前的确认文案。传入后点击关闭会先弹出气泡，取消则不关闭，
   * 确认后才隐藏并调用 {@link onClose}。
   */
  closeConfirm?: string;
  /**
   * Cookie 名。传入后确认（或直接）关闭会写入该 cookie（值 `1`，有效期一年），
   * 之后刷新或 SSR 都不再显示；调用方不必再自己管显隐。
   */
  closeKey?: string;
  /**
   * 受控可见；传入时优先于内部关闭态（`false` 隐藏）。
   * 未传则点 × 用内部 Signal 隐藏。请传 Signal 或 getter，勿传 `visible={sig.value}` 快照。
   * 若同时传了 {@link closeKey} 且 cookie 已写入，仍不再显示。
   */
  visible?: MaybeSignal<boolean>;
  /** 整条点击 */
  onClick?: () => void;
  /**
   * 开启滚动。水平时文案从容器右侧进入、向左循环；
   * 垂直时从下往上。数组时一次一条。遵循 reduced-motion。
   */
  scrollable?: boolean;
  /**
   * 滚动速度。`fast` / `medium` / `slow`，或数字（像素/秒）。
   * 默认 `medium`（60px/s）；`fast` 为 120，`slow` 为 30。
   */
  speed?: NoticeBarSpeed;
  /**
   * 滚动方向。`horizontal` 从右向左（默认），`vertical` 从下往上。
   */
  direction?: NoticeBarDirection;
  /**
   * 当前条展示秒数，到时再滚下一条。仅多条（或垂直滚动）时生效，默认 3。
   */
  interval?: number;
  /**
   * 圆角，默认 `false` 为直角。写 `rounded` 即为 `rounded-lg`；
   * 也可写 `sm` / `md` / `lg` / `full`。
   */
  rounded?: NoticeBarRounded;
  /** 额外 class */
  class?: string;
  messages?: Partial<NoticeBarMessages>;
}

const toneIconCls: Record<NoticeBarTone, string> = {
  info: "text-sky-600 dark:text-sky-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

const toneCls: Record<NoticeBarTone, string> = {
  info:
    "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200 border-sky-200/80 dark:border-sky-800",
  success:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 border-amber-200/80 dark:border-amber-800",
  danger:
    "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200 border-red-200/80 dark:border-red-800",
};

const SPEED_PX = { fast: 120, medium: 60, slow: 30 } as const;

const noticeBarRoundedCls = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const;

function noticeBarRoundedClass(rounded?: NoticeBarRounded): string {
  if (rounded === true) return "rounded-lg";
  if (
    rounded === "sm" || rounded === "md" || rounded === "lg" ||
    rounded === "full"
  ) {
    return noticeBarRoundedCls[rounded];
  }
  return "rounded-none";
}

export function noticeBarSpeedPx(speed?: NoticeBarSpeed): number {
  if (typeof speed === "number" && Number.isFinite(speed) && speed > 0) {
    return speed;
  }
  if (speed === "fast" || speed === "slow") return SPEED_PX[speed];
  return SPEED_PX.medium;
}

function holdMs(interval?: number): number {
  if (
    typeof interval === "number" && Number.isFinite(interval) &&
    interval >= 0
  ) {
    return interval * 1000;
  }
  return 3000;
}

const MARQUEE_STYLE_ID = "dreamer-notice-bar-marquee-style";
const MARQUEE_CSS =
  "@keyframes notice-bar-marquee{from{transform:translateX(0)}to{transform:translateX(-100%)}}" +
  ".animate-notice-bar-marquee{padding-left:100%;animation:notice-bar-marquee var(--notice-bar-marquee-duration,12s) linear infinite}" +
  "@media (prefers-reduced-motion:reduce){.animate-notice-bar-marquee{padding-left:0!important;animation:none!important}}";

function ensureMarqueeStyle(): void {
  const doc = (globalThis as { document?: Document }).document;
  if (!doc?.head || doc.getElementById(MARQUEE_STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = MARQUEE_STYLE_ID;
  el.textContent = MARQUEE_CSS;
  doc.head.appendChild(el);
}

function scrollItems(content: unknown): unknown[] | undefined {
  if (!Array.isArray(content)) return undefined;
  return content.filter((item) => item != null && item !== "");
}

function prefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
      ?.matches === true;
  } catch {
    return false;
  }
}

function moveSec(dist: number, pxPerSec: number): number {
  return Math.max(0.2, dist / Math.max(pxPerSec, 1));
}

function scheduleFrame(fn: () => void): number {
  const raf =
    (globalThis as { requestAnimationFrame?: (cb: () => void) => number })
      .requestAnimationFrame;
  if (typeof raf === "function") return raf(fn);
  return 0;
}

function cancelFrame(id: number): void {
  if (!id) return;
  const cancel =
    (globalThis as { cancelAnimationFrame?: (handle: number) => void })
      .cancelAnimationFrame;
  if (typeof cancel === "function") cancel(id);
}

function hasAnimationFrame(): boolean {
  return typeof (globalThis as { requestAnimationFrame?: unknown })
    .requestAnimationFrame === "function";
}

/**
 * 一条一条切换的滚动轨道（水平从右进左出，垂直从下进上出）。
 * 状态放在本组件内，避免外层 thunk 因 phase 重跑而拆掉正在离场的节点。
 */
function NoticeBarStepper(props: {
  items: unknown[];
  speed: number;
  direction: NoticeBarDirection;
  interval: number;
}): JSXRenderable {
  const itemIndex = createSignal(0);
  const offset = createSignal<"enter" | "show" | "exit">("enter");
  const transition = createSignal("none");
  const enterAt = createSignal("translateX(100%)");
  const exitAt = createSignal("translateX(-100%)");
  let clipEl: HTMLElement | null = null;
  let trackEl: HTMLElement | null = null;
  let seq = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let raf = 0;

  const clearPlay = (): void => {
    seq++;
    if (timer != null) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (raf) {
      cancelFrame(raf);
      raf = 0;
    }
  };
  onCleanup(clearPlay);

  const measure = (): {
    enter: string;
    exit: string;
    inDist: number;
    outDist: number;
  } => {
    const clip = clipEl;
    const track = trackEl;
    const vertical = props.direction === "vertical";
    if (!clip || !track) {
      return vertical
        ? {
          enter: "translateY(100%)",
          exit: "translateY(-100%)",
          inDist: 24,
          outDist: 24,
        }
        : {
          enter: "translateX(100%)",
          exit: "translateX(-100%)",
          inDist: 200,
          outDist: 200,
        };
    }
    if (vertical) {
      const d = Math.max(clip.clientHeight, track.offsetHeight, 1);
      return {
        enter: `translateY(${d}px)`,
        exit: `translateY(-${d}px)`,
        inDist: d,
        outDist: d,
      };
    }
    const inDist = Math.max(clip.clientWidth, 1);
    const outDist = Math.max(track.scrollWidth, clip.clientWidth, 1);
    return {
      enter: `translateX(${inDist}px)`,
      exit: `translateX(-${outDist}px)`,
      inDist,
      outDist,
    };
  };

  const beginEnter = (): void => {
    clearPlay();
    const my = seq;
    const reduced = prefersReducedMotion();
    const m = measure();
    enterAt.value = m.enter;
    exitAt.value = m.exit;
    transition.value = "none";
    offset.value = "enter";
    if (reduced) {
      offset.value = "show";
      const wait = holdMs(props.interval);
      timer = setTimeout(() => {
        if (my !== seq) return;
        const n = props.items.length;
        if (n <= 0) return;
        itemIndex.value = (itemIndex.value + 1) % n;
        beginEnter();
      }, wait || 4000);
      return;
    }
    if (!hasAnimationFrame()) {
      transition.value = "none";
      offset.value = "show";
      return;
    }
    raf = scheduleFrame(() => {
      raf = scheduleFrame(() => {
        if (my !== seq) return;
        const sec = moveSec(m.inDist, props.speed);
        transition.value = `transform ${sec}s linear`;
        offset.value = "show";
      });
    });
  };

  const onMoved = (e: TransitionEvent): void => {
    if (e.propertyName !== "transform") return;
    if (e.target !== e.currentTarget) return;
    const cur = offset.value;
    if (cur === "show") {
      const my = seq;
      timer = setTimeout(() => {
        if (my !== seq) return;
        const m = measure();
        exitAt.value = m.exit;
        transition.value = `transform ${
          moveSec(m.outDist, props.speed)
        }s linear`;
        offset.value = "exit";
      }, holdMs(props.interval));
      return;
    }
    if (cur === "exit") {
      const n = props.items.length;
      if (n <= 0) return;
      transition.value = "none";
      offset.value = "enter";
      itemIndex.value = (itemIndex.value + 1) % n;
      raf = scheduleFrame(() => beginEnter());
    }
  };

  const setClip = (el: HTMLElement | null): void => {
    clipEl = el;
  };
  const setTrack = (el: HTMLElement | null): void => {
    trackEl = el;
    if (el) beginEnter();
  };

  return (
    <div
      ref={setClip}
      class={twMerge(
        "min-w-0 flex-1 overflow-hidden",
        props.direction === "vertical"
          ? "relative h-[1.5em] leading-[1.5em]"
          : "whitespace-nowrap [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]",
      )}
    >
      <div
        ref={setTrack}
        class={props.direction === "vertical"
          ? "absolute inset-x-0 top-0 whitespace-nowrap"
          : "inline-block whitespace-nowrap"}
        data-dreamer-notice-bar-track=""
        style={() => {
          const o = offset.value;
          const t = transition.value;
          const transform = o === "enter"
            ? enterAt.value
            : o === "exit"
            ? exitAt.value
            : "translate(0)";
          return { transform, transition: t, willChange: "transform" };
        }}
        onTransitionEnd={onMoved}
      >
        {() => {
          const list = props.items;
          if (!list.length) return null;
          const i = ((itemIndex.value % list.length) + list.length) %
            list.length;
          return list[i];
        }}
      </div>
    </div>
  );
}

function noticeBarIcon(
  icon: unknown,
  tone: NoticeBarTone,
): JSXRenderable {
  if (icon === true) {
    return (
      <span class={twMerge("shrink-0 inline-flex", toneIconCls[tone])}>
        <IconInfo class="w-4 h-4" />
      </span>
    );
  }
  if (icon == null || icon === false) return null;
  return <span class="shrink-0 inline-flex">{icon}</span>;
}

export function NoticeBar(props: NoticeBarProps): JSXRenderable {
  const closed = createSignal(false);
  const confirmOpen = createSignal(false);

  const persistAndDismiss = (): void => {
    const key = props.closeKey?.trim();
    if (key) writeAlertCloseCookie(key);
    closed.value = true;
    props.onClose?.();
  };

  return (
    <div class="contents" data-dreamer-notice-bar-host="">
      {() => {
        const visible = readMaybeSignal(props.visible);
        if (visible === false) return null;
        const closeKey = props.closeKey?.trim() || undefined;
        if (closeKey && isAlertClosed(closeKey)) return null;
        if (visible === undefined && closed.value) return null;

        const tone = props.tone ?? "info";
        const scrollable = props.scrollable === true;
        const direction: NoticeBarDirection = props.direction === "vertical"
          ? "vertical"
          : "horizontal";
        const closeConfirm = props.closeConfirm?.trim() || undefined;
        const closable = props.closable ??
          Boolean(closeConfirm || closeKey);
        const onClick = props.onClick;
        const m = {
          ...defaultNoticeBarMessages,
          ...(props.messages ?? {}),
        };
        const items = props.children != null
          ? undefined
          : scrollItems(props.content);
        const body = props.children ??
          (items ? undefined : props.content);
        const stepperItems = items ??
          (scrollable && direction === "vertical" && body != null
            ? [body]
            : undefined);
        const useStepper = scrollable && stepperItems != null &&
          stepperItems.length > 0;
        const useMarquee = scrollable && !useStepper;
        const px = noticeBarSpeedPx(props.speed);
        if (useMarquee) ensureMarqueeStyle();

        const closeBtn = closable
          ? (
            <button
              type="button"
              class="shrink-0 rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label={m.close}
              data-dreamer-notice-bar-close=""
              onClick={(e: Event) => {
                e.stopPropagation();
                if (closeConfirm) {
                  confirmOpen.value = true;
                  return;
                }
                persistAndDismiss();
              }}
            >
              ×
            </button>
          )
          : null;

        return (
          <div
            class={twMerge(
              "notice-bar flex items-center gap-2 px-3 py-2 text-sm border overflow-hidden",
              noticeBarRoundedClass(props.rounded),
              toneCls[tone],
              onClick && "cursor-pointer",
              props.class,
            )}
            role="status"
            data-dreamer-notice-bar=""
            onClick={() => onClick?.()}
          >
            {noticeBarIcon(props.icon, tone)}
            {useStepper
              ? (
                <NoticeBarStepper
                  items={stepperItems!}
                  speed={px}
                  direction={direction}
                  interval={props.interval ?? 3}
                />
              )
              : (
                <div
                  class={twMerge(
                    "min-w-0 flex-1",
                    useMarquee &&
                      "overflow-hidden whitespace-nowrap [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]",
                  )}
                >
                  <div
                    class={twMerge(
                      useMarquee &&
                        "inline-flex items-center animate-notice-bar-marquee motion-reduce:animate-none",
                    )}
                    data-dreamer-notice-bar-track={useMarquee ? "" : undefined}
                    ref={useMarquee
                      ? (el: HTMLElement | null) => {
                        if (!el) return;
                        const apply = (): void => {
                          const dist = el.scrollWidth;
                          if (dist <= 0) return;
                          el.style.animationDuration = `${moveSec(dist, px)}s`;
                        };
                        if (!hasAnimationFrame()) return;
                        scheduleFrame(apply);
                        if (typeof ResizeObserver === "function") {
                          const ro = new ResizeObserver(() => apply());
                          ro.observe(el);
                          if (el.parentElement) ro.observe(el.parentElement);
                          onCleanup(() => ro.disconnect());
                        } else {
                          const ids: number[] = [];
                          let n = 0;
                          const tick = (): void => {
                            apply();
                            if (++n < 8) ids.push(scheduleFrame(tick));
                          };
                          ids.push(scheduleFrame(tick));
                          onCleanup(() => {
                            for (const id of ids) cancelFrame(id);
                          });
                        }
                      }
                      : undefined}
                    style={useMarquee ? { paddingLeft: "100%" } : undefined}
                  >
                    {items
                      ? items.map((item, i) => (
                        <span class="inline-flex items-center">
                          {i > 0 && (
                            <span
                              aria-hidden="true"
                              class="inline-block px-8 opacity-50"
                            >
                              •
                            </span>
                          )}
                          <span>{item}</span>
                        </span>
                      ))
                      : body}
                  </div>
                </div>
              )}
            {closeConfirm && closeBtn
              ? (
                <Popconfirm
                  open={confirmOpen}
                  title={closeConfirm}
                  warning
                  class="shrink-0"
                  onConfirm={persistAndDismiss}
                >
                  {closeBtn}
                </Popconfirm>
              )
              : closeBtn}
          </div>
        );
      }}
    </div>
  );
}
