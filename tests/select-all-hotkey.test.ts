/**
 * @fileoverview Ctrl+A / Command+A helpers for multi-select widgets.
 */

import { describe, expect, it } from "@dreamer/test";
import {
  isSelectAllHotkey,
  toggleSelectAllKeys,
} from "../src/shared/select-all-hotkey.ts";

describe("select-all-hotkey", () => {
  it("toggleSelectAllKeys fills or clears", () => {
    expect(toggleSelectAllKeys(["a"], ["a", "b"])).toEqual(["a", "b"]);
    expect(toggleSelectAllKeys(["a", "b"], ["a", "b"])).toEqual([]);
    expect(toggleSelectAllKeys([], ["x"])).toEqual(["x"]);
    expect(toggleSelectAllKeys(["x"], [])).toEqual([]);
  });

  it("isSelectAllHotkey accepts ctrl/meta A without extra modifiers", () => {
    expect(isSelectAllHotkey({ key: "a", metaKey: true })).toBe(true);
    expect(isSelectAllHotkey({ key: "A", ctrlKey: true })).toBe(true);
    expect(isSelectAllHotkey({ key: "a", metaKey: true, shiftKey: true }))
      .toBe(false);
    expect(isSelectAllHotkey({ key: "a" })).toBe(false);
    expect(
      isSelectAllHotkey({ key: "a", ctrlKey: true, defaultPrevented: true }),
    )
      .toBe(false);
  });
});
