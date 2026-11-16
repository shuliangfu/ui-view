/**
 * Transfer groupTransferItems: same group stays together, ungrouped first.
 */
import { describe, expect, it } from "@dreamer/test";
import { groupTransferItems } from "../../src/shared/form/Transfer.tsx";

describe("Transfer groupTransferItems", () => {
  it("keeps ungrouped items first and groups the rest in first-seen order", () => {
    const blocks = groupTransferItems([
      { key: "x", title: "其它" },
      { key: "r1", title: "管理员", group: "角色" },
      { key: "p1", title: "查看", group: "权限" },
      { key: "r2", title: "只读", group: "角色" },
      { key: "u1", title: "/settings", group: "路由" },
    ]);
    expect(blocks.map((b) => b.group)).toEqual([
      undefined,
      "角色",
      "权限",
      "路由",
    ]);
    expect(blocks[0].items.map((i) => i.key)).toEqual(["x"]);
    expect(blocks[1].items.map((i) => i.key)).toEqual(["r1", "r2"]);
    expect(blocks[2].items.map((i) => i.key)).toEqual(["p1"]);
    expect(blocks[3].items.map((i) => i.key)).toEqual(["u1"]);
  });

  it("omits empty groups and trims blank group names as ungrouped", () => {
    const blocks = groupTransferItems([
      { key: "a", title: "A", group: "  " },
      { key: "b", title: "B", group: "角色" },
    ]);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].group).toBeUndefined();
    expect(blocks[0].items[0].key).toBe("a");
    expect(blocks[1].group).toBe("角色");
  });
});
