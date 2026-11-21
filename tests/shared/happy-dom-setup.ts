/**
 * 为需要挂载到 DOM 的单测注入 happy-dom（Deno 下无 document）。
 */
import { Window } from "happy-dom";

const win = new Window();
const g = globalThis as unknown as Record<string, unknown>;

g.window = win;
g.document = win.document;
g.Node = win.Node;
g.Element = win.Element;
g.HTMLElement = win.HTMLElement;
g.Text = win.Text;
g.DocumentFragment = win.DocumentFragment;
g.Comment = win.Comment;
g.Event = win.Event;
g.MouseEvent = win.MouseEvent;
g.KeyboardEvent = win.KeyboardEvent;
if ((win as unknown as { DOMRect?: unknown }).DOMRect) {
  g.DOMRect = (win as unknown as { DOMRect: unknown }).DOMRect;
}
// Node 没有 EventTarget；选择器/浮层会在卸载后的 rAF 里调用 globalThis.addEventListener
g.addEventListener = win.addEventListener.bind(win);
g.removeEventListener = win.removeEventListener.bind(win);
g.dispatchEvent = win.dispatchEvent.bind(win);
g.requestAnimationFrame = (cb: FrameRequestCallback) =>
  win.requestAnimationFrame(cb as (ts: number) => void) as unknown as number;
g.cancelAnimationFrame = (id: number) => win.cancelAnimationFrame(id as never);
