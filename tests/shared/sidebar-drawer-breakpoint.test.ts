/**
 * Sidebar drawerBreakpoint 布局类名。
 */
import { describe, expect, it } from "@dreamer/test";
import { resolveSidebarDrawerLayout } from "../../src/shared/navigation/Sidebar.tsx";

describe("resolveSidebarDrawerLayout", () => {
  it("defaults to md and shows the fixed sidebar from 768px", () => {
    const layout = resolveSidebarDrawerLayout();
    expect(layout.shell.includes("md:w-72")).toBe(true);
    expect(layout.aside.includes("md:block")).toBe(true);
    expect(layout.drawerHost).toBe("md:hidden");
  });

  it("xl collapses the sidebar through tablet until 1280px", () => {
    const layout = resolveSidebarDrawerLayout("xl");
    expect(layout.shell.includes("xl:w-72")).toBe(true);
    expect(layout.aside.includes("xl:block")).toBe(true);
    expect(layout.drawerHost).toBe("xl:hidden");
    expect(layout.shell.includes("md:w-72")).toBe(false);
  });
});
