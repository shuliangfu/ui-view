/**
 * FloatButton 悬浮按钮（View）。
 * 默认固定于**视口**角；文档／局部演示传 `position="absolute"`，挂在最近 `relative` 容器内，避免飞出示例框。
 */

import { createSignal, type JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export type FloatButtonShape = "circle" | "square";
export type FloatButtonPlacement =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface FloatButtonItem {
  key: string;
  /** 按钮内容（图标／文字） */
  icon?: unknown;
  /** 无障碍名称 */
  "aria-label"?: string;
  onClick?: () => void;
  /** 徽标数字／点 */
  badge?: number | boolean;
}

export interface FloatButtonMessages {
  /** 主按钮无障碍标签；显式 `aria-label` 优先 */
  label: string;
}

export const defaultFloatButtonMessages: FloatButtonMessages = {
  label: "悬浮按钮",
};

export interface FloatButtonProps {
  /** 主按钮内容 */
  icon?: unknown;
  /** 主按钮点击；有 `items` 时默认切换展开 */
  onClick?: () => void;
  /** 展开子项 */
  items?: FloatButtonItem[];
  /** 受控展开 */
  open?: boolean;
  /** 展开变化 */
  onOpenChange?: (open: boolean) => void;
  shape?: FloatButtonShape;
  placement?: FloatButtonPlacement;
  /**
   * 定位参照：`fixed` 相对视口（产品默认）；`absolute` 相对最近定位祖先（文档示例框内用）。
   * @default "fixed"
   */
  position?: "fixed" | "absolute";
  /** 主按钮 aria-label；优先于 messages.label */
  "aria-label"?: string;
  messages?: Partial<FloatButtonMessages>;
  /** 徽标 */
  badge?: number | boolean;
  class?: string;
  /** 距边偏移，默认 24 */
  offset?: number;
  /** z-index，默认 280 */
  zIndex?: number;
}

const placeCls: Record<FloatButtonPlacement, string> = {
  "bottom-right": "right-0 bottom-0",
  "bottom-left": "left-0 bottom-0",
  "top-right": "right-0 top-0",
  "top-left": "left-0 top-0",
};

function BadgeDot(props: { badge?: number | boolean }) {
  const b = props.badge;
  if (b == null || b === false) return null;
  // 贴主按钮右上角外缘（常规角标），不盖住主图标；定位用 style 防 Tailwind 未产出 inset 类时掉回中心
  const cornerStyle = {
    position: "absolute",
    top: "0",
    right: "0",
    transform: "translate(50%, -50%)",
    zIndex: "10",
    pointerEvents: "none",
  } as const;
  if (b === true) {
    return (
      <span
        class="size-2.5 rounded-full bg-red-500"
        style={cornerStyle}
        aria-hidden="true"
      />
    );
  }
  const n = typeof b === "number" ? b : 0;
  if (n <= 0) return null;
  return (
    <span
      class="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none text-white tabular-nums"
      style={cornerStyle}
      role="status"
      aria-label={String(n > 99 ? "99+" : n)}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function FloatButton(props: FloatButtonProps): JSXRenderable {
  const m: FloatButtonMessages = {
    ...defaultFloatButtonMessages,
    ...(props.messages ?? {}),
  };
  const {
    icon = "+",
    onClick,
    items,
    open: openProp,
    onOpenChange,
    shape = "circle",
    placement = "bottom-right",
    position = "fixed",
    badge,
    class: className,
    offset = 24,
    zIndex = 280,
    "aria-label": ariaLabelProp,
  } = props;
  const ariaLabel = ariaLabelProp ?? m.label;

  const innerOpen = createSignal(false);
  const hasMenu = (items?.length ?? 0) > 0;

  const isOpen = () => openProp ?? innerOpen.value;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) innerOpen.value = v;
    onOpenChange?.(v);
  };

  const shapeCls = shape === "circle" ? "rounded-full" : "rounded-xl";
  // 强制正方／正圆 FAB：锁宽高＋aspect，清默认 button padding，避免被父级 flex 拉成「又高又扁」
  const btnBase = twMerge(
    "relative inline-flex h-12 w-12 min-h-12 min-w-12 shrink-0 aspect-square box-border p-0",
    "items-center justify-center overflow-visible shadow-lg leading-none",
    "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700",
    "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400",
    shapeCls,
  );

  return () => (
    <div
      class={twMerge(
        position === "absolute" ? "absolute" : "fixed",
        "flex flex-col-reverse items-center gap-3 w-max",
        placeCls[placement],
        className,
      )}
      style={{
        zIndex: String(zIndex),
        margin: `${offset}px`,
      }}
    >
      {hasMenu && isOpen() && (
        <div class="flex flex-col-reverse items-center gap-3">
          {items!.map((it) => (
            <button
              type="button"
              key={it.key}
              class={twMerge(btnBase, "h-10 w-10 min-h-10 min-w-10 size-10 bg-slate-700 hover:bg-slate-600")}
              aria-label={it["aria-label"] ?? it.key}
              onClick={() => {
                it.onClick?.();
                setOpen(false);
              }}
            >
              {it.icon ?? it.key}
              <BadgeDot badge={it.badge} />
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        class={btnBase}
        aria-label={ariaLabel}
        aria-expanded={hasMenu ? isOpen() : undefined}
        onClick={() => {
          if (hasMenu) setOpen(!isOpen());
          onClick?.();
        }}
      >
        {icon}
        <BadgeDot badge={badge} />
      </button>
    </div>
  );
}
