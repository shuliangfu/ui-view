/**
 * @fileoverview DataPanel 卸载清理：全局句柄／刷新表与 popstate 监听不得残留。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { DataPanel } from "../../src/desktop/data-display/DataPanel.tsx";
import {
  panelHandles,
  refreshers,
} from "../../src/desktop/data-display/data-panel-chrome.tsx";

const COLUMNS = [
  { prop: "name", label: "姓名" },
  { prop: "id", label: "编号" },
];

const rows = [
  { id: "1", name: "张三" },
  { id: "2", name: "李四" },
];

/**
 * Node 单测环境的 globalThis 往往没有 addEventListener（window 可能是另一对象）。
 * 没有时先补一对空实现，再挂钩子，才能观察到 DataPanel 的注册与卸载。
 */
function ensureGlobalEventListenerApi(): () => void {
  const g = globalThis as {
    addEventListener?: typeof addEventListener;
    removeEventListener?: typeof removeEventListener;
  };
  if (typeof g.addEventListener === "function") return () => {};
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  g.addEventListener = ((
    type: string,
    fn: EventListenerOrEventListenerObject,
  ) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(fn);
  }) as typeof addEventListener;
  g.removeEventListener = ((
    type: string,
    fn: EventListenerOrEventListenerObject,
  ) => {
    listeners.get(type)?.delete(fn);
  }) as typeof removeEventListener;
  return () => {
    delete (g as { addEventListener?: unknown }).addEventListener;
    delete (g as { removeEventListener?: unknown }).removeEventListener;
  };
}

function countPopstateListeners(): {
  added: number;
  removed: number;
  restore: () => void;
} {
  const g = globalThis as {
    addEventListener?: typeof addEventListener;
    removeEventListener?: typeof removeEventListener;
  };
  const origAdd = g.addEventListener?.bind(g);
  const origRemove = g.removeEventListener?.bind(g);
  let added = 0;
  let removed = 0;
  if (origAdd) {
    g.addEventListener = ((
      type: string,
      fn: EventListenerOrEventListenerObject,
      opts?: unknown,
    ) => {
      if (type === "popstate") added++;
      return origAdd(type, fn as EventListener, opts as boolean);
    }) as typeof addEventListener;
  }
  if (origRemove) {
    g.removeEventListener = ((
      type: string,
      fn: EventListenerOrEventListenerObject,
      opts?: unknown,
    ) => {
      if (type === "popstate") removed++;
      return origRemove(type, fn as EventListener, opts as boolean);
    }) as typeof removeEventListener;
  }
  return {
    get added() {
      return added;
    },
    get removed() {
      return removed;
    },
    restore() {
      if (origAdd) g.addEventListener = origAdd;
      if (origRemove) g.removeEventListener = origRemove;
    },
  } as { added: number; removed: number; restore: () => void };
}

describe("DataPanel 卸载清理", () => {
  it("renderToString 结束后清掉 panelHandles 与 refreshers", async () => {
    const key = "cleanup-handles-leak";
    panelHandles.delete(key);
    refreshers.delete(key);
    await renderToString(() =>
      DataPanel({
        panelKey: key,
        title: "清理",
        columns: COLUMNS,
        data: rows,
        syncUrl: false,
      })
    );
    expect(panelHandles.has(key)).toBe(false);
    expect(refreshers.has(key)).toBe(false);
  });

  it("反复挂载卸载不会让 panelHandles / refreshers 无限增长", async () => {
    const beforeHandles = panelHandles.size;
    const beforeRefreshers = refreshers.size;
    for (let i = 0; i < 8; i++) {
      const key = `cleanup-loop-${i}`;
      await renderToString(() =>
        DataPanel({
          panelKey: key,
          title: "循环",
          columns: COLUMNS,
          data: rows,
          syncUrl: false,
        })
      );
    }
    expect(panelHandles.size).toBe(beforeHandles);
    expect(refreshers.size).toBe(beforeRefreshers);
  });

  it("renderToString 结束后卸掉本次注册的 popstate 监听", async () => {
    const restoreApi = ensureGlobalEventListenerApi();
    const probe = countPopstateListeners();
    try {
      await renderToString(() =>
        DataPanel({
          panelKey: "cleanup-popstate",
          title: "清理",
          columns: COLUMNS,
          data: rows,
          tabs: [
            { key: "all", label: "全部" },
            { key: "on", label: "启用" },
          ],
          syncUrl: false,
        })
      );
      expect(probe.added).toBeGreaterThan(0);
      expect(probe.removed).toBe(probe.added);
    } finally {
      probe.restore();
      restoreApi();
    }
  });
});
