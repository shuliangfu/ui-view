/**
 * Portal + `position: fixed` 下 Popover / Popconfirm 等的视口定位计算。
 * 与原先在 `relative` 容器内 `absolute` + `top-full` 等类名的几何语义一致（`mt-2`/`mb-2` 等 8px 间隔）。
 *
 * 共享 **auto 翻转**：优选方向空间不够就朝相反方向开（上挡→下、右挡→左，依次类推）。
 * 写死的具体方位（`top` / `bottomLeft` 等）保持原几何，不自动翻转。
 */

/** 与 Tailwind `m-2` 竖向/横向与触发器外缘的默认间距（px）一致 */
export const PORTAL_POP_GAP_PX = 8;

export type FullPopStylePlacement =
  | "top"
  | "topLeft"
  | "topRight"
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "left"
  | "leftTop"
  | "leftBottom"
  | "right"
  | "rightTop"
  | "rightBottom";

/** 在具体方位之外增加 `auto`：按 `autoPrefers`（默认 `top`）试探并在视口不够时翻转 */
export type AutoPopPlacement = FullPopStylePlacement | "auto";

/** 浮层自身尺寸（用于判断是否被视口裁切） */
export interface PopSize {
  width: number;
  height: number;
}

/** 视口宽高（通常取 `window.innerWidth/innerHeight`） */
export interface ViewportSize {
  width: number;
  height: number;
}

export interface ResolveAutoPopPlacementOptions {
  /** 触发器 `getBoundingClientRect()` */
  trigger: DOMRect;
  /** 调用方声明的方位；仅 `"auto"` 时才会翻转 */
  preferred: AutoPopPlacement;
  /** `preferred === "auto"` 时优先尝试的具体方位，默认 `"top"` */
  autoPrefers?: FullPopStylePlacement;
  /** 浮层内容尺寸；宽或高为 0 时不做翻转，原样返回优选方位 */
  popup: PopSize;
  /** 触发器与浮层间距，默认 {@link PORTAL_POP_GAP_PX} */
  gap?: number;
  /** 视口，缺省时读 `window`；无 window 则视为 1024×768 */
  viewport?: ViewportSize;
  /** 视口内边距，默认 0 */
  padding?: number;
}

/**
 * `auto` 与具体方位的对立方向：上↔下、左↔右，对齐后缀保留（`topLeft` ↔ `bottomLeft`）。
 *
 * @param placement - 具体方位
 */
export function oppositePopPlacement(
  placement: FullPopStylePlacement,
): FullPopStylePlacement {
  switch (placement) {
    case "top":
      return "bottom";
    case "topLeft":
      return "bottomLeft";
    case "topRight":
      return "bottomRight";
    case "bottom":
      return "top";
    case "bottomLeft":
      return "topLeft";
    case "bottomRight":
      return "topRight";
    case "left":
      return "right";
    case "leftTop":
      return "rightTop";
    case "leftBottom":
      return "rightBottom";
    case "right":
      return "left";
    case "rightTop":
      return "leftTop";
    case "rightBottom":
      return "leftBottom";
    default:
      return placement;
  }
}

function isVerticalPlacement(p: FullPopStylePlacement): boolean {
  return p.startsWith("top") || p.startsWith("bottom");
}

function verticalSide(p: FullPopStylePlacement): "top" | "bottom" | null {
  if (p.startsWith("top")) return "top";
  if (p.startsWith("bottom")) return "bottom";
  return null;
}

function horizontalSide(p: FullPopStylePlacement): "left" | "right" | null {
  if (p.startsWith("left")) return "left";
  if (p.startsWith("right")) return "right";
  return null;
}


function verticalAlignments(
  p: FullPopStylePlacement,
): FullPopStylePlacement[] {
  const side = verticalSide(p);
  if (!side) return [p];
  return side === "top"
    ? ["top", "topLeft", "topRight"]
    : ["bottom", "bottomLeft", "bottomRight"];
}

function horizontalAlignments(
  p: FullPopStylePlacement,
): FullPopStylePlacement[] {
  const side = horizontalSide(p);
  if (!side) return [p];
  return side === "left"
    ? ["left", "leftTop", "leftBottom"]
    : ["right", "rightTop", "rightBottom"];
}

/**
 * 按具体方位计算浮层在视口中的轴对齐矩形（未做夹取）。
 *
 * @param tr - 触发器矩形
 * @param placement - 具体方位
 * @param size - 浮层尺寸
 * @param gap - 间距
 */
export function popBoxForPlacement(
  tr: DOMRect,
  placement: FullPopStylePlacement,
  size: PopSize,
  gap: number = PORTAL_POP_GAP_PX,
): { top: number; left: number; right: number; bottom: number } {
  const w = size.width;
  const h = size.height;
  const cx = tr.left + tr.width / 2;
  const cy = tr.top + tr.height / 2;
  switch (placement) {
    case "top":
      return { top: tr.top - gap - h, left: cx - w / 2, right: cx + w / 2, bottom: tr.top - gap };
    case "topLeft":
      return { top: tr.top - gap - h, left: tr.left, right: tr.left + w, bottom: tr.top - gap };
    case "topRight":
      return { top: tr.top - gap - h, left: tr.right - w, right: tr.right, bottom: tr.top - gap };
    case "bottom":
      return { top: tr.bottom + gap, left: cx - w / 2, right: cx + w / 2, bottom: tr.bottom + gap + h };
    case "bottomLeft":
      return { top: tr.bottom + gap, left: tr.left, right: tr.left + w, bottom: tr.bottom + gap + h };
    case "bottomRight":
      return { top: tr.bottom + gap, left: tr.right - w, right: tr.right, bottom: tr.bottom + gap + h };
    case "left":
      return { top: cy - h / 2, left: tr.left - gap - w, right: tr.left - gap, bottom: cy + h / 2 };
    case "leftTop":
      return { top: tr.top, left: tr.left - gap - w, right: tr.left - gap, bottom: tr.top + h };
    case "leftBottom":
      return { top: tr.bottom - h, left: tr.left - gap - w, right: tr.left - gap, bottom: tr.bottom };
    case "right":
      return { top: cy - h / 2, left: tr.right + gap, right: tr.right + gap + w, bottom: cy + h / 2 };
    case "rightTop":
      return { top: tr.top, left: tr.right + gap, right: tr.right + gap + w, bottom: tr.top + h };
    case "rightBottom":
      return { top: tr.bottom - h, left: tr.right + gap, right: tr.right + gap + w, bottom: tr.bottom };
    default:
      return { top: tr.top - gap - h, left: cx - w / 2, right: cx + w / 2, bottom: tr.top - gap };
  }
}

function overflowOf(
  box: { top: number; left: number; right: number; bottom: number },
  viewport: ViewportSize,
  padding: number,
): { top: number; left: number; right: number; bottom: number; total: number } {
  const left = Math.max(0, padding - box.left);
  const top = Math.max(0, padding - box.top);
  const right = Math.max(0, box.right - (viewport.width - padding));
  const bottom = Math.max(0, box.bottom - (viewport.height - padding));
  return { top, left, right, bottom, total: left + top + right + bottom };
}

function fallbackViewport(): ViewportSize {
  if (typeof globalThis.window !== "undefined") {
    return {
      width: globalThis.window.innerWidth,
      height: globalThis.window.innerHeight,
    };
  }
  return { width: 1024, height: 768 };
}

function pickLeastOverflow(
  trigger: DOMRect,
  candidates: FullPopStylePlacement[],
  preferred: FullPopStylePlacement,
  popup: PopSize,
  viewport: ViewportSize,
  gap: number,
  padding: number,
  axis: "vertical" | "horizontal" | "all",
): FullPopStylePlacement {
  let best = preferred;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const c of candidates) {
    const ov = overflowOf(popBoxForPlacement(trigger, c, popup, gap), viewport, padding);
    const score = axis === "vertical"
      ? ov.top + ov.bottom
      : axis === "horizontal"
      ? ov.left + ov.right
      : ov.total;
    const tieBreak = c === preferred ? -0.5 : 0;
    if (score + tieBreak < bestScore) {
      bestScore = score + tieBreak;
      best = c;
    }
  }
  return best;
}

/**
 * 在视口内为 `"auto"`（或已解析的优选方位）选择最终具体方位：
 * 主轴空间不够则翻到对侧；交叉轴被裁则改为朝内的对齐（如居中偏右溢出 → `*Right`，向左展开）。
 *
 * 仅当 `preferred === "auto"` 时翻转；写死方位原样返回。
 *
 * @param options - 触发器、优选方位与浮层尺寸
 */
export function resolveAutoPopPlacement(
  options: ResolveAutoPopPlacementOptions,
): FullPopStylePlacement {
  const preferred = options.preferred;
  const autoPrefers = options.autoPrefers ?? "top";
  if (preferred !== "auto") return preferred;
  const popup = options.popup;
  if (!(popup.width > 0) || !(popup.height > 0)) return autoPrefers;
  return flipPlacementToFit(
    autoPrefers,
    options.trigger,
    popup,
    options.viewport ?? fallbackViewport(),
    options.gap ?? PORTAL_POP_GAP_PX,
    options.padding ?? 0,
  );
}

/**
 * 按「边挡住就朝相反方向」规则，从具体优选方位得到最终方位（供 `auto` 与点菜单复用）。
 *
 * @param preferred - 优选具体方位
 * @param trigger - 触发器矩形
 * @param popup - 浮层尺寸
 * @param viewport - 视口
 * @param gap - 间距
 * @param padding - 视口内边距
 */
export function flipPlacementToFit(
  preferred: FullPopStylePlacement,
  trigger: DOMRect,
  popup: PopSize,
  viewport: ViewportSize,
  gap: number = PORTAL_POP_GAP_PX,
  padding: number = 0,
): FullPopStylePlacement {
  let next = preferred;
  if (isVerticalPlacement(preferred)) {
    const opp = oppositePopPlacement(preferred);
    const prefOv = overflowOf(popBoxForPlacement(trigger, preferred, popup, gap), viewport, padding);
    const oppOv = overflowOf(popBoxForPlacement(trigger, opp, popup, gap), viewport, padding);
    const prefMain = prefOv.top + prefOv.bottom;
    const oppMain = oppOv.top + oppOv.bottom;
    if (oppMain < prefMain) next = opp;
    next = pickLeastOverflow(
      trigger,
      verticalAlignments(next),
      next,
      popup,
      viewport,
      gap,
      padding,
      "horizontal",
    );
  } else {
    const opp = oppositePopPlacement(preferred);
    const prefOv = overflowOf(popBoxForPlacement(trigger, preferred, popup, gap), viewport, padding);
    const oppOv = overflowOf(popBoxForPlacement(trigger, opp, popup, gap), viewport, padding);
    const prefMain = prefOv.left + prefOv.right;
    const oppMain = oppOv.left + oppOv.right;
    if (oppMain < prefMain) next = opp;
    next = pickLeastOverflow(
      trigger,
      horizontalAlignments(next),
      next,
      popup,
      viewport,
      gap,
      padding,
      "vertical",
    );
  }
  return next;
}

/**
 * 根据触发器在视口内的外接矩形，计算挂到 `document.body` 的 `fixed` 浮层内联 style。
 * 不依赖 `absolute` 祖先，避免被 `overflow` 裁剪，便于与 rAF 同步 `getBoundingClientRect` 跟随滚动。
 *
 * @param tr - 触发器 `getBoundingClientRect()` 结果
 * @param placement - 与原先 Tailwind 方位类对应的语义（须为已解析的具体方位，不含 `auto`）
 * @returns 可直接赋给 `style` 的 plain object（`top/left/.../transform` 等）
 */
export function computePopFixedStyle(
  tr: DOMRect,
  placement: FullPopStylePlacement,
): Record<string, string> {
  if (typeof globalThis.window === "undefined") {
    return {};
  }
  const w = globalThis.window;
  const ih = w.innerHeight;
  const iw = w.innerWidth;
  const g = PORTAL_POP_GAP_PX;
  switch (placement) {
    case "top":
      return {
        bottom: `${ih - tr.top + g}px`,
        left: `${tr.left + tr.width / 2}px`,
        transform: "translateX(-50%)",
      };
    case "topLeft":
      return {
        bottom: `${ih - tr.top + g}px`,
        left: `${tr.left}px`,
      };
    case "topRight":
      return {
        bottom: `${ih - tr.top + g}px`,
        right: `${iw - tr.right}px`,
      };
    case "bottom":
      return {
        top: `${tr.bottom + g}px`,
        left: `${tr.left + tr.width / 2}px`,
        transform: "translateX(-50%)",
      };
    case "bottomLeft":
      return {
        top: `${tr.bottom + g}px`,
        left: `${tr.left}px`,
      };
    case "bottomRight":
      return {
        top: `${tr.bottom + g}px`,
        right: `${iw - tr.right}px`,
      };
    case "left":
      return {
        right: `${iw - tr.left + g}px`,
        top: `${tr.top + tr.height / 2}px`,
        transform: "translateY(-50%)",
      };
    case "leftTop":
      return {
        right: `${iw - tr.left + g}px`,
        top: `${tr.top}px`,
      };
    case "leftBottom":
      return {
        right: `${iw - tr.left + g}px`,
        bottom: `${ih - tr.bottom}px`,
      };
    case "right":
      return {
        top: `${tr.top + tr.height / 2}px`,
        left: `${tr.right + g}px`,
        transform: "translateY(-50%)",
      };
    case "rightTop":
      return {
        top: `${tr.top}px`,
        left: `${tr.right + g}px`,
      };
    case "rightBottom":
      return {
        bottom: `${ih - tr.bottom}px`,
        left: `${tr.right + g}px`,
      };
    default:
      return {};
  }
}

/**
 * 解析 `auto` 后计算 `fixed` style，并返回实际方位（供箭头跟随）。
 * 浮层尺寸未知时按 `autoPrefers`（默认 `top`）落位，不翻转。
 *
 * @param tr - 触发器矩形
 * @param preferred - 声明方位（可 `auto`）
 * @param popup - 已测得的浮层尺寸；未知时传 `{ width: 0, height: 0 }`
 * @param options - `autoPrefers` / `gap` / `viewport` / `padding`
 */
export function computeAutoPopFixedStyle(
  tr: DOMRect,
  preferred: AutoPopPlacement,
  popup: PopSize,
  options?: Pick<ResolveAutoPopPlacementOptions, "autoPrefers" | "gap" | "viewport" | "padding">,
): { style: Record<string, string>; placement: FullPopStylePlacement } {
  const placement = resolveAutoPopPlacement({
    trigger: tr,
    preferred,
    popup,
    autoPrefers: options?.autoPrefers,
    gap: options?.gap,
    viewport: options?.viewport,
    padding: options?.padding,
  });
  return { style: computePopFixedStyle(tr, placement), placement };
}

/**
 * 右键菜单等「点坐标」浮层：默认向点击处右下展开；右边挡住则向左，下边挡住则向上；
 * 仍溢出时再夹入视口内边距。
 *
 * @param x - 视口 X（通常是 `clientX`）
 * @param y - 视口 Y（通常是 `clientY`）
 * @param size - 菜单尺寸；未知时先落在点上且不翻转
 * @param viewport - 视口
 * @param padding - 视口内边距，默认 0
 */
export function resolvePointFixedPosition(
  x: number,
  y: number,
  size: PopSize,
  viewport: ViewportSize,
  padding: number = 0,
): { x: number; y: number; flippedX: boolean; flippedY: boolean } {
  const vw = viewport.width;
  const vh = viewport.height;
  const maxX = Math.max(padding, vw - padding);
  const maxY = Math.max(padding, vh - padding);
  let left = x;
  let top = y;
  let flippedX = false;
  let flippedY = false;
  if (size.width > 0) {
    if (x + size.width > maxX && x - size.width >= padding) {
      left = x - size.width;
      flippedX = true;
    } else if (x + size.width > maxX) {
      left = Math.max(padding, maxX - size.width);
      flippedX = true;
    }
    if (left < padding) left = padding;
  }
  if (size.height > 0) {
    if (y + size.height > maxY && y - size.height >= padding) {
      top = y - size.height;
      flippedY = true;
    } else if (y + size.height > maxY) {
      top = Math.max(padding, maxY - size.height);
      flippedY = true;
    }
    if (top < padding) top = padding;
  }
  return { x: left, y: top, flippedX, flippedY };
}

/** 箭头方片边长（与组件里 `w-2 h-2` 一致，px） */
export const POP_ARROW_SIZE_PX = 8;

/**
 * 箭头中心距面板边缘的最小距离，避免落在 rounded-lg 圆角外。
 * 仅作夹紧下限；有空间时优先对准触发器中线，不会为了居中把箭头拉回面板中线。
 */
export const POP_ARROW_SAFE_INSET_PX = 12;

export type PopArrowSide = "top" | "bottom" | "left" | "right";

/**
 * 箭头所在的面板边：在触发器上方则贴面板底边，下方贴顶边，左侧贴右边，右侧贴左边。
 *
 * @param placement - 已解析的具体方位
 */
export function popArrowSide(placement: FullPopStylePlacement): PopArrowSide {
  if (placement.startsWith("top")) return "bottom";
  if (placement.startsWith("bottom")) return "top";
  if (placement.startsWith("left")) return "right";
  if (placement.startsWith("right")) return "left";
  return "bottom";
}

function clampArrowOffset(raw: number, extent: number, inset: number): number {
  if (!(extent > 0)) return 0;
  const min = Math.min(inset, extent / 2);
  const max = Math.max(min, extent - min);
  if (raw < min) return min;
  if (raw > max) return max;
  return raw;
}

export interface ArrowAnchorOffset {
  /** 箭头中心沿该边的偏移（相对面板左或上边缘，px） */
  offset: number;
  /** 水平边（上/下）用 left，竖直边（左/右）用 top */
  axis: "left" | "top";
  /** 箭头所在的面板边 */
  side: PopArrowSide;
}

/**
 * 计算箭头中心相对面板的偏移：对准触发器中线，必要时夹在面板内侧安全距离。
 * 上/下：对准触发器水平中线；左/右：对准触发器垂直中线。
 *
 * @param placement - 已解析的具体方位
 * @param trigger - 触发器视口矩形
 * @param panel - 面板视口矩形（须已布局）
 * @param inset - 距面板边缘的最小距离，默认 {@link POP_ARROW_SAFE_INSET_PX}
 */
export function arrowAnchorOffset(
  placement: FullPopStylePlacement,
  trigger: Pick<DOMRect, "left" | "top" | "width" | "height">,
  panel: Pick<DOMRect, "left" | "top" | "width" | "height">,
  inset: number = POP_ARROW_SAFE_INSET_PX,
): ArrowAnchorOffset {
  const side = popArrowSide(placement);
  if (side === "top" || side === "bottom") {
    const raw = trigger.left + trigger.width / 2 - panel.left;
    return {
      offset: clampArrowOffset(raw, panel.width, inset),
      axis: "left",
      side,
    };
  }
  const raw = trigger.top + trigger.height / 2 - panel.top;
  return {
    offset: clampArrowOffset(raw, panel.height, inset),
    axis: "top",
    side,
  };
}

/**
 * 箭头 `position:absolute` 的内联 style：中心对准触发器中线，并带旋转位移使尖角伸出面板边。
 * 面板尺寸为 0 时退回 50%（尚未测得几何）。
 *
 * @param placement - 已解析的具体方位
 * @param trigger - 触发器视口矩形
 * @param panel - 面板视口矩形
 * @param inset - 距边缘最小距离
 */
export function computeArrowAnchorStyle(
  placement: FullPopStylePlacement,
  trigger: Pick<DOMRect, "left" | "top" | "width" | "height">,
  panel: Pick<DOMRect, "left" | "top" | "width" | "height">,
  inset: number = POP_ARROW_SAFE_INSET_PX,
): Record<string, string> {
  const side = popArrowSide(placement);
  if (!(panel.width > 0) || !(panel.height > 0)) {
    if (side === "top" || side === "bottom") {
      return {
        left: "50%",
        right: "auto",
        top: side === "top" ? "0px" : "auto",
        bottom: side === "bottom" ? "0px" : "auto",
        transform: side === "bottom"
          ? "translate(-50%, 50%) rotate(45deg)"
          : "translate(-50%, -50%) rotate(45deg)",
      };
    }
    return {
      top: "50%",
      bottom: "auto",
      left: side === "left" ? "0px" : "auto",
      right: side === "right" ? "0px" : "auto",
      transform: side === "right"
        ? "translate(50%, -50%) rotate(45deg)"
        : "translate(-50%, -50%) rotate(45deg)",
    };
  }
  const { offset, axis } = arrowAnchorOffset(placement, trigger, panel, inset);
  if (axis === "left") {
    return {
      left: `${offset}px`,
      right: "auto",
      top: side === "top" ? "0px" : "auto",
      bottom: side === "bottom" ? "0px" : "auto",
      transform: side === "bottom"
        ? "translate(-50%, 50%) rotate(45deg)"
        : "translate(-50%, -50%) rotate(45deg)",
    };
  }
  return {
    top: `${offset}px`,
    bottom: "auto",
    left: side === "left" ? "0px" : "auto",
    right: side === "right" ? "0px" : "auto",
    transform: side === "right"
      ? "translate(50%, -50%) rotate(45deg)"
      : "translate(-50%, -50%) rotate(45deg)",
  };
}
