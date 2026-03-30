/**
 * ColorPicker 颜色选择（View）。
 * 自绘饱和度/明度方格、色相条与 HEX/RGB 输入；打开面板后拖动等会派发 `input`；点「确定」再派发 `input`/`change` 收尾并关浮层，且跳过关闭瞬间用旧 `value` 回灌（避免颜色被冲回）。
 * 「取消」恢复打开前颜色并派发 `input`/`change`。
 * 弹层在根容器 `relative` 内 `absolute left-0 top-full mt-1`，随滚动跟移；也可经 {@link ColorPickerHandle.openAtClientPoint} 在指针附近以 `fixed` 打开。
 * 通过隐藏 `input` 派发 `input`/`change` 事件，与原先基于 `type="color"` 的 `onChange`/`onInput` 签名兼容（`e.target.value` 为 `#rrggbb`）。
 */

import {
  createEffect,
  createRef,
  createSignal,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconDroplet } from "../basic/icons/Droplet.tsx";
import { IconPalette } from "../basic/icons/Palette.tsx";
import { controlBlueFocusRing } from "./input-focus-ring.ts";
import { Input } from "./Input.tsx";
import {
  pickerPortalZClass,
  registerPointerDownOutside,
} from "./picker-portal-utils.ts";

/**
 * 命令式打开/关闭取色面板（与 {@link ColorPickerProps.pickerRef} 配合）。
 */
export interface ColorPickerHandle {
  /**
   * 在视口坐标附近以 `fixed` 打开面板（会夹紧视口，避免溢出）。
   *
   * @param clientX - 指针 X（如 `PointerEvent.clientX`）
   * @param clientY - 指针 Y（如 `PointerEvent.clientY`）
   */
  openAtClientPoint(clientX: number, clientY: number): void;
  /**
   * 自指针事件读取坐标并打开（等价于 `openAtClientPoint(ev.clientX, ev.clientY)`）。
   *
   * @param ev - 至少含 `clientX` / `clientY` 的对象
   */
  openFromPointerEvent(ev: Pick<PointerEvent, "clientX" | "clientY">): void;
  /**
   * 关闭面板：`true` 为确定（提交并触发 `onApply`），`false` 为取消（恢复原色）。
   *
   * @param commit - 是否按「确定」语义关闭
   */
  close(commit: boolean): void;
}

export interface ColorPickerProps {
  /** 当前颜色，#rrggbb */
  value?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变更回调（`e.target` 为隐藏 input，`value` 为 #rrggbb） */
  onChange?: (e: Event) => void;
  /** 拖拽/输入过程中的回调 */
  onInput?: (e: Event) => void;
  /**
   * 额外 class（作用于最外层 `relative` 容器）。
   * 默认带 `w-full`，传入 `max-w-*`、`w-*`、`w-auto` 等可与默认合并并由后者覆盖宽度。
   */
  class?: string;
  /** 随表单提交的隐藏域 `name` */
  name?: string;
  /** 触发器 `id`（用于 label；隐藏域为 `${id}-value`） */
  id?: string;
  /** 为 true 时隐藏聚焦激活态边框；默认 false */
  hideFocusRing?: boolean;
  /** 为 false 时不显示右侧调色板图标；默认 true */
  showSuffixIcon?: boolean;
  /**
   * 展示形态：`default` 为色块 + HEX 文案（+ 可选调色板图标）；`swatch` 仅渲染可点击色块，点击打开取色面板。
   */
  variant?: "default" | "swatch";
  /**
   * 为 true 时在取色面板顶部显示屏幕取色按钮、圆形预览与说明文案；默认 false 不显示。
   */
  showToolbar?: boolean;
  /**
   * 为 true 时不渲染可见触发按钮，仅保留隐藏域；由父级通过 {@link pickerRef} 调用 `openAtClientPoint` 等打开面板。
   */
  hideTrigger?: boolean;
  /**
   * 挂载后写入命令式 API；卸载时置回 `null`。
   */
  pickerRef?: { current: ColorPickerHandle | null };
  /**
   * 用户点击面板内「确定」并提交颜色后调用一次（参数为规范化后的 `#rrggbb`）。
   * 拖动过程中的变更仍只走 `onInput`/`onChange`；取消或点外部关闭不会调用。
   */
  onApply?: (hex: string) => void;
  /**
   * 取色面板打开/关闭时调用（与内部 `panelOpen` 同步）；供宿主禁止受控 `innerHTML` 在面板交互期间误回写。
   */
  onOpenChange?: (open: boolean) => void;
}

/** 与 DatePicker、Select 等共用 Esc 关闭（依赖应用侧 `initDropdownEsc` 全局监听） */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/**
 * 浮层打开时注册全局 Esc 回调（多浮层时后打开的覆盖前者）。
 *
 * @param close - 按下 Esc 时执行
 */
function registerDropdownEsc(close: () => void): void {
  if (typeof globalThis === "undefined") return;
  const g = globalThis as unknown as Record<
    string,
    (() => void) | undefined
  >;
  g[DROPDOWN_ESC_KEY] = close;
}

/**
 * 浮层关闭时移除 Esc 回调，避免残留到其它页面逻辑。
 */
function clearDropdownEsc(): void {
  if (typeof globalThis === "undefined") return;
  const g = globalThis as unknown as Record<
    string,
    (() => void) | undefined
  >;
  g[DROPDOWN_ESC_KEY] = undefined;
}

/**
 * 将通道限制在 0～255。
 *
 * @param n - 原始值
 */
function clamp255(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

/**
 * 解析 #rgb / #rrggbb 为 RGB；非法时返回 null。
 *
 * @param hex - 颜色字符串
 */
function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const s = hex.trim().replace(/^#/, "");
  if (s.length === 3) {
    const r = parseInt(s[0] + s[0], 16);
    const g = parseInt(s[1] + s[1], 16);
    const b = parseInt(s[2] + s[2], 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b };
  }
  if (s.length === 6) {
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b };
  }
  return null;
}

/**
 * RGB 转 #rrggbb。
 *
 * @param r - 红 0～255
 * @param g - 绿 0～255
 * @param b - 蓝 0～255
 */
function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => clamp255(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toLowerCase();
}

/**
 * RGB 转 HSV；h∈[0,360)，s、v∈[0,1]。
 *
 * @param r - 红 0～255
 * @param g - 绿 0～255
 * @param b - 蓝 0～255
 */
function rgbToHsv(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

/**
 * HSV 转 RGB。
 *
 * @param h - 色相 0～360
 * @param s - 饱和度 0～1
 * @param v - 明度 0～1
 */
function hsvToRgb(
  h: number,
  s: number,
  v: number,
): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h >= 0 && h < 60) {
    rp = c;
    gp = x;
    bp = 0;
  } else if (h < 120) {
    rp = x;
    gp = c;
    bp = 0;
  } else if (h < 180) {
    rp = 0;
    gp = c;
    bp = x;
  } else if (h < 240) {
    rp = 0;
    gp = x;
    bp = c;
  } else if (h < 300) {
    rp = x;
    gp = 0;
    bp = c;
  } else {
    rp = c;
    gp = 0;
    bp = x;
  }
  return {
    r: clamp255((rp + m) * 255),
    g: clamp255((gp + m) * 255),
    b: clamp255((bp + m) * 255),
  };
}

/**
 * 归一化为 #rrggbb；无法解析时返回 `#000000`。
 *
 * @param hex - 输入字符串
 */
function normalizeHex(hex: string): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return "#000000";
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * 在隐藏 input 上写入颜色并派发事件，供受控表单与 `onInput`/`onChange` 使用。
 *
 * @param el - 隐藏域
 * @param hex - #rrggbb
 * @param type - `input` 或 `change`
 * @param handler - 可选回调
 */
function dispatchColorInputEvent(
  el: HTMLInputElement,
  hex: string,
  type: "input" | "change",
  handler?: (e: Event) => void,
): void {
  el.value = hex;
  const ev = new Event(type, { bubbles: true });
  Object.defineProperty(ev, "target", { value: el, enumerable: true });
  Object.defineProperty(ev, "currentTarget", { value: el, enumerable: true });
  handler?.(ev);
}

/** 色相条 CSS 渐变（与常见取色器一致） */
const HUE_STRIP_GRADIENT =
  "linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)";

/** `fixed` 浮层预估宽度（与 `min-w-[288px]`、内边距一致，略放大留余量） */
const FLOAT_PANEL_EST_W = 304;
/** `fixed` 浮层预估高度（方格+色相条+RGB+HEX+按钮区近似） */
const FLOAT_PANEL_EST_H = 440;
/** 视口内边距（与 {@link computePickerPortalStyle} 默认一致） */
const FLOAT_VIEWPORT_INSET = 8;

/**
 * 将取色面板左上角夹在视口内，默认放在指针右下侧（`top = clientY + 8`），空间不足则翻到指针上方。
 *
 * @param clientX - 指针 X
 * @param clientY - 指针 Y
 */
function clampFloatingPanelPosition(
  clientX: number,
  clientY: number,
): { left: number; top: number } {
  const vw = typeof globalThis !== "undefined" &&
      typeof globalThis.innerWidth === "number"
    ? globalThis.innerWidth
    : 1024;
  const vh = typeof globalThis !== "undefined" &&
      typeof globalThis.innerHeight === "number"
    ? globalThis.innerHeight
    : 768;
  let left = clientX;
  let top = clientY + 8;
  const maxLeft = vw - FLOAT_VIEWPORT_INSET - FLOAT_PANEL_EST_W;
  if (left > maxLeft) left = Math.max(FLOAT_VIEWPORT_INSET, maxLeft);
  if (left < FLOAT_VIEWPORT_INSET) left = FLOAT_VIEWPORT_INSET;
  if (top + FLOAT_PANEL_EST_H > vh - FLOAT_VIEWPORT_INSET) {
    top = clientY - FLOAT_PANEL_EST_H - 8;
  }
  if (top < FLOAT_VIEWPORT_INSET) top = FLOAT_VIEWPORT_INSET;
  return { left: Math.round(left), top: Math.round(top) };
}

export function ColorPicker(props: ColorPickerProps) {
  const {
    disabled = false,
    onChange,
    onInput,
    class: className,
    name,
    id,
    hideFocusRing = false,
    showSuffixIcon = true,
    variant = "default",
    showToolbar = false,
    hideTrigger = false,
  } = props;

  /**
   * 当前受控颜色（#rrggbb）。
   * **禁止**在组件 setup 里 `const { value } = props`：`value` 会变成一次性快照，父级 `signal` 更新后触发器仍显示旧色（与 `InputNumber` 等受控组件一致，须反复读 `props.value`）。
   */
  const controlledHex = () => normalizeHex(props.value ?? "#000000");

  const panelOpen = createSignal(false);
  /** `anchored`：相对触发器；`floating`：视口 `fixed`（由命令式 API 打开） */
  const panelLayout = createSignal<"anchored" | "floating">("anchored");
  /** `floating` 时面板的 `left`（px） */
  const panelFloatX = createSignal(0);
  /** `floating` 时面板的 `top`（px） */
  const panelFloatY = createSignal(0);

  /** 内部 HSV，与打开面板或外部 `value` 同步 */
  const hue = createSignal(0);
  const sat = createSignal(1);
  const val = createSignal(1);
  /** HEX 文本框草稿（可含未完成的输入） */
  const hexDraft = createSignal(controlledHex());
  const rDraft = createSignal(0);
  const gDraft = createSignal(0);
  const bDraft = createSignal(0);

  /**
   * 触发按钮 DOM 引用（勿用 createRef：其内部 signal 可能被编译路径订阅，叠加 insertReactive 易重复挂载）。
   */
  const triggerRef: { current: HTMLButtonElement | null } = {
    current: null,
  };
  const hiddenRef = createRef<HTMLInputElement>(null);
  /** 点击面板外关闭：document 捕获监听，须在关闭 / 卸载时 dispose */
  const outsidePointerCleanup: { dispose: (() => void) | null } = {
    dispose: null,
  };
  /** 避免同一 DOM 节点重复 registerPointerDownOutside */
  const outsidePanelEl: { current: HTMLElement | null } = { current: null };
  /**
   * 打开面板瞬间的外部 `value` 快照（#rrggbb）；取消 / 点外部 / Esc 时恢复并派发事件。
   */
  const panelOriginHex: { current: string } = { current: "#000000" };
  /**
   * 关闭浮层后 `createEffect` 可能**连续执行多次**（`panelOpen` 与 `props.value` 各触发一次）；
   * 单次布尔跳过会在第二次执行时仍用**尚未更新的旧 `value`** 调用 `applyHexToHsv`，把颜色冲回默认。
   * 此处为剩余跳过次数（通常设为 2）。
   */
  const skipClosedPropSyncRemaining: { current: number } = { current: 0 };
  /**
   * 确定/取消关闭瞬间 `props.value` 常滞后；在父级追上之前，触发器与隐藏域用此色展示，避免闪回默认色。
   * 当 `controlledHex()` 与该值一致时于 effect 内清回 `null`。
   */
  const closedOptimisticHexRef: { current: string | null } = { current: null };

  /** 移除「点外部关闭」监听，避免泄漏或重复注册 */
  const clearOutsidePointerDismiss = () => {
    outsidePointerCleanup.dispose?.();
    outsidePointerCleanup.dispose = null;
    outsidePanelEl.current = null;
  };

  /** 从当前 HSV 写回 RGB 草稿与 hex 草稿 */
  const syncDraftsFromHsv = () => {
    const { r, g, b } = hsvToRgb(hue.value, sat.value, val.value);
    const hex = rgbToHex(r, g, b);
    hexDraft.value = hex;
    rDraft.value = r;
    gDraft.value = g;
    bDraft.value = b;
    return hex;
  };

  /**
   * 用 HEX 更新 HSV 与草稿（解析失败则忽略）。
   *
   * @param hex - 颜色字符串
   */
  const applyHexToHsv = (hex: string) => {
    const n = normalizeHex(hex);
    const rgb = parseHexRgb(n);
    if (!rgb) return;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    hue.value = hsv.h;
    sat.value = hsv.s;
    val.value = hsv.v;
    hexDraft.value = n;
    rDraft.value = rgb.r;
    gDraft.value = rgb.g;
    bDraft.value = rgb.b;
  };

  /**
   * 提交当前 HSV 到隐藏域并向父级派发事件。
   *
   * @param fireChange - 是否同时派发 `change`（取消恢复时需 `true` 以便只绑 `onChange` 的表单也能回退）
   */
  const commitColor = (fireChange: boolean) => {
    const hex = syncDraftsFromHsv();
    const el = hiddenRef.current;
    if (!el) return;
    dispatchColorInputEvent(el, hex, "input", onInput);
    if (fireChange) dispatchColorInputEvent(el, hex, "change", onChange);
  };

  /**
   * 将当前草稿同步到父级（仅 `input`）；打开面板期间拖动/输入时调用。
   */
  const emitDraftInput = () => commitColor(false);

  /**
   * 确定：`input`+`change` 提交当前色，记录乐观色、跳过多次 props 回灌，再关浮层。
   */
  const confirmPanel = () => {
    if (!panelOpen.value) return;
    clearOutsidePointerDismiss();
    clearDropdownEsc();
    commitColor(true);
    const appliedHex = syncDraftsFromHsv();
    closedOptimisticHexRef.current = appliedHex;
    skipClosedPropSyncRemaining.current = 2;
    panelLayout.value = "anchored";
    panelOpen.value = false;
    /** 须先于 `onApply`：宿主据此关闭「取色中」门禁，避免确认当帧仍禁止/误同步受控 `value` */
    props.onOpenChange?.(false);
    props.onApply?.(appliedHex);
  };

  /**
   * 取消：恢复打开前颜色并通知父级（`input` + `change`），再关闭浮层。
   */
  const cancelPanel = () => {
    if (!panelOpen.value) return;
    clearOutsidePointerDismiss();
    clearDropdownEsc();
    const origin = panelOriginHex.current;
    applyHexToHsv(origin);
    const el = hiddenRef.current;
    if (el) {
      dispatchColorInputEvent(el, origin, "input", onInput);
      dispatchColorInputEvent(el, origin, "change", onChange);
    }
    closedOptimisticHexRef.current = normalizeHex(origin);
    skipClosedPropSyncRemaining.current = 2;
    panelLayout.value = "anchored";
    panelOpen.value = false;
    props.onOpenChange?.(false);
  };

  /**
   * 在指针附近以 `fixed` 打开面板（无可见触发器场景，如富文本工具栏）。
   *
   * @param clientX - 视口 X
   * @param clientY - 视口 Y
   */
  const openFloatingAt = (clientX: number, clientY: number) => {
    if (props.disabled) return;
    if (panelOpen.value) cancelPanel();
    closedOptimisticHexRef.current = null;
    const origin = controlledHex();
    panelOriginHex.current = origin;
    applyHexToHsv(origin);
    const p = clampFloatingPanelPosition(clientX, clientY);
    panelFloatX.value = p.left;
    panelFloatY.value = p.top;
    panelLayout.value = "floating";
    panelOpen.value = true;
    registerDropdownEsc(cancelPanel);
    props.onOpenChange?.(true);
  };

  /**
   * 打开面板：记录快照、灌入 HSV，并注册 Esc 为取消（与 DatePicker 浮层一致）。
   */
  const openPanel = () => {
    if (props.disabled) return;
    closedOptimisticHexRef.current = null;
    panelLayout.value = "anchored";
    const origin = controlledHex();
    panelOriginHex.current = origin;
    applyHexToHsv(origin);
    panelOpen.value = true;
    registerDropdownEsc(cancelPanel);
    props.onOpenChange?.(true);
  };

  /**
   * 向父级暴露命令式打开/关闭（与 {@link ColorPickerProps.pickerRef} 同步）。
   */
  createEffect(() => {
    const pr = props.pickerRef;
    if (!pr) return;
    const handle: ColorPickerHandle = {
      openAtClientPoint(cx, cy) {
        openFloatingAt(cx, cy);
      },
      openFromPointerEvent(ev) {
        openFloatingAt(ev.clientX, ev.clientY);
      },
      close(commit) {
        if (commit) confirmPanel();
        else cancelPanel();
      },
    };
    pr.current = handle;
    onCleanup(() => {
      if (pr.current === handle) pr.current = null;
    });
  });

  /**
   * 面板关闭后用 `props.value` 同步内部 HSV；先消耗跳过计数，再在「乐观色与 props 不一致」时拒绝用旧 props 回灌。
   */
  createEffect(() => {
    const v = controlledHex();
    if (!panelOpen.value) {
      if (skipClosedPropSyncRemaining.current > 0) {
        skipClosedPropSyncRemaining.current -= 1;
        return;
      }
      const opt = closedOptimisticHexRef.current;
      if (opt != null) {
        if (normalizeHex(v) !== normalizeHex(opt)) {
          return;
        }
        closedOptimisticHexRef.current = null;
      }
      applyHexToHsv(v);
      const el = hiddenRef.current;
      if (el && el.value !== v) el.value = v;
    }
  });

  /**
   * 根据指针在 SV 平面上的位置更新饱和度与明度（比例按平面宽高 0～1 夹取），并 `emitDraftInput`。
   */
  const pickSvFromPointer = (
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ) => {
    const w = rect.width || 1;
    const h = rect.height || 1;
    const x = (clientX - rect.left) / w;
    const y = (clientY - rect.top) / h;
    sat.value = Math.min(1, Math.max(0, x));
    val.value = Math.min(1, Math.max(0, 1 - y));
    syncDraftsFromHsv();
    emitDraftInput();
  };

  /** 拖拽色相条并同步父级 `onInput` */
  const pickHueFromPointer = (clientX: number, rect: DOMRect) => {
    const t = (clientX - rect.left) / rect.width;
    hue.value = Math.min(360, Math.max(0, t * 360));
    syncDraftsFromHsv();
    emitDraftInput();
  };

  /**
   * 浏览器支持时打开系统取色器（Chromium EyeDropper API）。
   */
  const tryEyeDropper = async () => {
    const Ed = (globalThis as {
      EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
    }).EyeDropper;
    if (!Ed) return;
    try {
      const result = await new Ed().open();
      if (result?.sRGBHex) {
        applyHexToHsv(result.sRGBHex);
        emitDraftInput();
      }
    } catch {
      /* 用户取消 */
    }
  };

  const triggerRing = controlBlueFocusRing(!hideFocusRing);

  return () => {
    /** 父级传入色 */
    const propHex = controlledHex();
    const preview = hsvToRgb(hue.value, sat.value, val.value);
    /** 与面板内圆点预览一致，由当前 HSV 导出 */
    const previewHex = rgbToHex(preview.r, preview.g, preview.b);
    /**
     * 关闭且 props 尚未追上本次确定/取消时，用乐观色展示，避免界面闪回默认蓝。
     */
    const closedSurfaceHex =
      !panelOpen.value && closedOptimisticHexRef.current != null &&
        normalizeHex(propHex) !== normalizeHex(closedOptimisticHexRef.current)
        ? closedOptimisticHexRef.current
        : propHex;
    const triggerDisplayHex = panelOpen.value ? previewHex : closedSurfaceHex;
    /** 与触发器一致，避免关面板后隐藏域与展示脱节 */
    const hiddenValueHex = panelOpen.value ? previewHex : closedSurfaceHex;

    /** 仅色块触发：窄布局，无 HEX 文案与后缀图标 */
    const swatchOnly = variant === "swatch";

    return (
      <div
        class={twMerge(
          hideTrigger
            ? "pointer-events-none fixed top-0 left-0 z-0 m-0 h-0 w-0 overflow-visible border-0 p-0"
            : "relative",
          !hideTrigger &&
            (swatchOnly
              ? "inline-block w-auto min-w-0"
              : "w-full min-w-[80px]"),
          className,
        )}
      >
        <input
          ref={hiddenRef}
          type="hidden"
          name={name}
          id={id ? `${id}-value` : undefined}
          value={hiddenValueHex}
          disabled={disabled}
          tabindex={-1}
          aria-hidden
        />
        {!hideTrigger && (
          <button
            ref={triggerRef}
            type="button"
            id={id}
            disabled={disabled}
            class={twMerge(
              swatchOnly
                ? "box-border flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white p-1 text-left dark:border-slate-600 dark:bg-slate-800"
                : "flex h-10 w-full min-w-[80px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 text-left text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
              !swatchOnly && showSuffixIcon && "pr-9",
              disabled && "cursor-not-allowed opacity-50",
              !disabled &&
                "cursor-pointer hover:border-slate-400 dark:hover:border-slate-500",
              triggerRing,
            )}
            aria-expanded={panelOpen.value}
            aria-haspopup="dialog"
            aria-label={swatchOnly
              ? `选择颜色，当前 ${triggerDisplayHex}`
              : undefined}
            title={swatchOnly ? triggerDisplayHex : undefined}
            onClick={() => {
              if (panelOpen.value) confirmPanel();
              else openPanel();
            }}
          >
            <span
              class={swatchOnly
                ? "block h-full w-full min-h-0 min-w-0 rounded border border-slate-200 dark:border-slate-600"
                : "h-6 w-6 shrink-0 rounded border border-slate-200 dark:border-slate-600"}
              style={{ backgroundColor: triggerDisplayHex }}
              aria-hidden
            />
            {!swatchOnly && (
              <span class="min-w-0 flex-1 truncate font-mono text-xs uppercase">
                {triggerDisplayHex}
              </span>
            )}
          </button>
        )}
        {!hideTrigger && !swatchOnly && showSuffixIcon && (
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex w-9 shrink-0 items-center justify-center text-slate-500 dark:text-slate-400"
            aria-hidden
          >
            <IconPalette size="sm" />
          </span>
        )}
        {panelOpen.value && (
          <div
            role="dialog"
            aria-label="颜色选择"
            class={twMerge(
              "pointer-events-auto flex min-w-[288px] max-w-[min(100vw-1rem,20rem)] flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-600 dark:bg-slate-800",
              pickerPortalZClass,
              panelLayout.value === "floating"
                ? "fixed"
                : "absolute left-0 top-full mt-1",
            )}
            style={panelLayout.value === "floating"
              ? {
                left: `${panelFloatX.value}px`,
                top: `${panelFloatY.value}px`,
              }
              : undefined}
            ref={(el: HTMLElement | null) => {
              if (el == null) {
                clearOutsidePointerDismiss();
                return;
              }
              if (el === outsidePanelEl.current) return;
              clearOutsidePointerDismiss();
              outsidePanelEl.current = el;
              /**
               * 延后注册「点外部关闭」：避免与打开面板的同一次 pointerdown 同帧命中 document 捕获，
               * 导致面板刚打开就被关掉（工具栏按钮、命令式打开常见）。
               */
              queueMicrotask(() => {
                if (outsidePanelEl.current !== el) return;
                outsidePointerCleanup.dispose = registerPointerDownOutside(
                  el,
                  cancelPanel,
                  hideTrigger ? undefined : triggerRef,
                );
              });
            }}
          >
            {showToolbar && (
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  title="取色器（需浏览器支持）"
                  aria-label="屏幕取色"
                  onClick={() => void tryEyeDropper()}
                >
                  <IconDroplet
                    size="sm"
                    class="text-slate-600 dark:text-slate-300"
                  />
                </button>
                <div
                  class="h-9 w-9 shrink-0 rounded-full border-2 border-slate-200 shadow-inner dark:border-slate-500"
                  style={{
                    backgroundColor: previewHex,
                  }}
                  aria-hidden
                />
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  拖动方格与色相条选择颜色
                </p>
              </div>
            )}

            {
              /* 饱和度×明度：底为当前色相纯色，右向变白，上向变黑 */
            }
            <div
              class="relative h-40 w-full cursor-crosshair touch-none overflow-hidden rounded-lg select-none"
              onPointerDown={(e: Event) => {
                const pe = e as PointerEvent;
                const el = pe.currentTarget as HTMLElement;
                el.setPointerCapture(pe.pointerId);
                pickSvFromPointer(
                  pe.clientX,
                  pe.clientY,
                  el.getBoundingClientRect(),
                );
              }}
              onPointerMove={(e: Event) => {
                const pe = e as PointerEvent;
                if (!pe.buttons) return;
                const el = pe.currentTarget as HTMLElement;
                pickSvFromPointer(
                  pe.clientX,
                  pe.clientY,
                  el.getBoundingClientRect(),
                );
              }}
              onPointerUp={(e: Event) => {
                const pe = e as PointerEvent;
                (pe.currentTarget as HTMLElement).releasePointerCapture(
                  pe.pointerId,
                );
              }}
            >
              <div
                class="absolute inset-0"
                style={{
                  backgroundColor: `hsl(${Math.round(hue.value)},100%,50%)`,
                }}
              />
              <div
                class="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, rgb(255,255,255), transparent)",
                }}
              />
              <div
                class="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgb(0,0,0), transparent)",
                }}
              />
              <div
                class="pointer-events-none absolute h-3 w-3 rounded-full border-2 border-white shadow-md"
                style={{
                  left: `${sat.value * 100}%`,
                  top: `${(1 - val.value) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>

            <div
              class="relative h-3 w-full cursor-pointer touch-none rounded-full select-none"
              style={{ background: HUE_STRIP_GRADIENT }}
              onPointerDown={(e: Event) => {
                const pe = e as PointerEvent;
                const el = pe.currentTarget as HTMLElement;
                el.setPointerCapture(pe.pointerId);
                pickHueFromPointer(pe.clientX, el.getBoundingClientRect());
              }}
              onPointerMove={(e: Event) => {
                const pe = e as PointerEvent;
                if (!pe.buttons) return;
                const el = pe.currentTarget as HTMLElement;
                pickHueFromPointer(pe.clientX, el.getBoundingClientRect());
              }}
              onPointerUp={(e: Event) => {
                const pe = e as PointerEvent;
                (pe.currentTarget as HTMLElement).releasePointerCapture(
                  pe.pointerId,
                );
              }}
            >
              <div
                class="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{ left: `${(hue.value / 360) * 100}%` }}
              />
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label
                  class="mb-0.5 block text-xs font-medium text-slate-600 dark:text-slate-400"
                  for={id ? `${id}-cp-r` : undefined}
                >
                  R
                </label>
                <Input
                  id={id ? `${id}-cp-r` : undefined}
                  type="text"
                  size="sm"
                  hideFocusRing={hideFocusRing}
                  class="w-full min-w-0"
                  value={() => String(rDraft.value)}
                  onInput={(e: Event) => {
                    const n = parseInt(
                      (e.target as HTMLInputElement).value,
                      10,
                    );
                    if (Number.isFinite(n)) {
                      rDraft.value = clamp255(n);
                      const hex = rgbToHex(
                        rDraft.value,
                        gDraft.value,
                        bDraft.value,
                      );
                      applyHexToHsv(hex);
                      emitDraftInput();
                    }
                  }}
                />
              </div>
              <div>
                <label
                  class="mb-0.5 block text-xs font-medium text-slate-600 dark:text-slate-400"
                  for={id ? `${id}-cp-g` : undefined}
                >
                  G
                </label>
                <Input
                  id={id ? `${id}-cp-g` : undefined}
                  type="text"
                  size="sm"
                  hideFocusRing={hideFocusRing}
                  class="w-full min-w-0"
                  value={() => String(gDraft.value)}
                  onInput={(e: Event) => {
                    const n = parseInt(
                      (e.target as HTMLInputElement).value,
                      10,
                    );
                    if (Number.isFinite(n)) {
                      gDraft.value = clamp255(n);
                      const hex = rgbToHex(
                        rDraft.value,
                        gDraft.value,
                        bDraft.value,
                      );
                      applyHexToHsv(hex);
                      emitDraftInput();
                    }
                  }}
                />
              </div>
              <div>
                <label
                  class="mb-0.5 block text-xs font-medium text-slate-600 dark:text-slate-400"
                  for={id ? `${id}-cp-b` : undefined}
                >
                  B
                </label>
                <Input
                  id={id ? `${id}-cp-b` : undefined}
                  type="text"
                  size="sm"
                  hideFocusRing={hideFocusRing}
                  class="w-full min-w-0"
                  value={() => String(bDraft.value)}
                  onInput={(e: Event) => {
                    const n = parseInt(
                      (e.target as HTMLInputElement).value,
                      10,
                    );
                    if (Number.isFinite(n)) {
                      bDraft.value = clamp255(n);
                      const hex = rgbToHex(
                        rDraft.value,
                        gDraft.value,
                        bDraft.value,
                      );
                      applyHexToHsv(hex);
                      emitDraftInput();
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label
                class="mb-0.5 block text-xs font-medium text-slate-600 dark:text-slate-400"
                for={id ? `${id}-cp-hex` : undefined}
              >
                HEX
              </label>
              <Input
                id={id ? `${id}-cp-hex` : undefined}
                type="text"
                size="sm"
                hideFocusRing={hideFocusRing}
                class="w-full font-mono"
                value={() => hexDraft.value}
                onInput={(e: Event) => {
                  hexDraft.value = (e.target as HTMLInputElement).value;
                }}
                onBlur={() => {
                  const n = normalizeHex(hexDraft.value);
                  applyHexToHsv(n);
                  emitDraftInput();
                }}
              />
            </div>

            <div class="mt-1 flex justify-end gap-2 border-t border-slate-200 pt-2 dark:border-slate-600">
              <button
                type="button"
                class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                onClick={() => confirmPanel()}
              >
                确定
              </button>
              <button
                type="button"
                class="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                onClick={() => cancelPanel()}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
}
