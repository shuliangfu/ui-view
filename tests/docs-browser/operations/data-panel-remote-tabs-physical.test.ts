import { describe, expect, it } from "@dreamer/test";
import type { Page, Request } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, visible } from "./driver.ts";
describe("DataPanel remote tabs physical", () => {
  it(
    "物理操作 DataPanel远程Tab：真实GET参数/精确响应及行ID、缓存零请求、刷新只失效当前标签、重新访问重请求",
    async (t) => {
      if (!t?.browser?.page) throw new Error("Native Page required");
      const page = t.browser.page as Page;
      const requests: {
        tab: string | null;
        page: string | null;
        size: string | null;
        method: string;
        hasDefaultTab: boolean;
      }[] = [];
      const responses: { tab: string | null; total: number; ids: string[] }[] =
        [];
      const pending: Promise<void>[] = [];
      const isRemote = (url: string) => {
        const u = new URL(url);
        return u.pathname === "/api/users" && u.searchParams.has("remoteTab");
      };
      const onRequest = (request: Request) => {
        if (!isRemote(request.url())) return;
        const u = new URL(request.url());
        requests.push({
          tab: u.searchParams.get("remoteTab"),
          page: u.searchParams.get("page"),
          size: u.searchParams.get("pageSize"),
          method: request.method(),
          hasDefaultTab: u.searchParams.has("tab"),
        });
      };
      page.on("request", onRequest);
      page.on("response", (response) => {
        if (!isRemote(response.url())) return;
        pending.push((async () => {
          expect(response.status()).toBe(200);
          const body = await response.json();
          responses.push({
            tab: new URL(response.url()).searchParams.get("remoteTab"),
            total: body.total,
            ids: body.rows.map((row: { id: string }) => row.id),
          });
        })());
      });
      const route = "/desktop/data-display/data-panel?keep=batch10&tab=stats";
      let expectedLocation = "?keep=batch10&tab=stats";
      await open(t, route);
      const panel = page.getByTestId("panel-demo-tabs-api"),
        all = panel.getByRole("tab", { name: "全部", exact: true }),
        admin = panel.getByRole("tab", { name: "管理员", exact: true });
      const seedNames = [
        "Alice",
        "Bob",
        "Carol",
        "David",
        "Eve",
        "Frank",
        "Grace",
        "Heidi",
        "Ivan",
        "Judy",
        "Mallory",
        "Niaj",
        "Olivia",
        "Peggy",
        "Rupert",
        "Sybil",
        "Trent",
        "Victor",
        "Walter",
        "Zoe",
      ];
      const expectedCells = (ids: string[]) =>
        ids.map((id) => {
          const i = Number(id) - 1;
          return [
            seedNames[i % seedNames.length] +
            (i >= seedNames.length ? ` ${i}` : ""),
            ["admin", "editor", "viewer"][i % 3],
          ];
        });
      const allIds = Array.from({ length: 28 }, (_, i) => String(i + 1)),
        adminIds = allIds.filter((_, i) => i % 3 === 0);
      const ids =
        async () => (await panel.locator('tbody tr[data-testid^="dp-row-"]')
          .evaluateAll((rows) =>
            rows.map((row) =>
              row.getAttribute("data-testid")!.replace("dp-row-", "")
            )
          ));
      const check = async (expected: string[], total: number) => {
        await eventually(async () =>
          JSON.stringify(await ids()) === JSON.stringify(expected)
        );
        expect(await ids()).toEqual(expected);
        expect(
          await panel.locator('tbody tr[data-testid^="dp-row-"]').evaluateAll(
            (rows) =>
              rows.map((row) =>
                [...row.querySelectorAll("td")].map((cell) =>
                  cell.textContent!.trim()
                )
              ),
          ),
        ).toEqual(expectedCells(expected));
        expect(
          (await panel.getByTestId("dp-total-count").textContent())!.trim(),
        )
          .toBe(`共 ${total} 条记录`);
        expect(new URL(page.url()).search).toBe(expectedLocation);
      };
      const settledCount = async (count: number) => {
        await page.waitForTimeout(200);
        await Promise.all(pending);
        expect(requests.length).toBe(count);
        expect(responses.length).toBe(count);
      };
      await check(allIds, 28);
      expect(
        (await panel.locator("thead th").allTextContents()).map((s) =>
          s.trim()
        ),
      ).toEqual(["姓名", "角色"]);
      for (
        const id of [
          "dp-create",
          "dp-search-toggle",
          "dp-print",
          "dp-import",
          "dp-export",
          "dp-columns",
          "dp-density",
          "dp-fullscreen",
          "dp-copy",
        ]
      ) expect(await panel.getByTestId(id).count()).toBe(0);
      expect(await panel.locator("tbody button").count()).toBe(0);
      await attr(all, "aria-selected", "true");
      await settledCount(1);
      expect(responses[0]).toEqual({ tab: "all", total: 28, ids: allIds });
      expectedLocation = "?keep=batch10&tab=stats&remoteTab=admin";
      await admin.click({ delay: 180 });
      await check(adminIds, 10);
      await attr(admin, "aria-selected", "true");
      await settledCount(2);
      expect(responses[1]).toEqual({ tab: "admin", total: 10, ids: adminIds });
      expectedLocation = "?keep=batch10&tab=stats&remoteTab=all";
      await all.click();
      await check(allIds, 28);
      await settledCount(2);
      await panel.getByTestId("dp-refresh").click();
      await eventually(() => requests.length === 3);
      await check(allIds, 28);
      await settledCount(3);
      expect(requests[2].tab).toBe("all");
      expectedLocation = "?keep=batch10&tab=stats&remoteTab=admin";
      await admin.click();
      await check(adminIds, 10);
      await settledCount(3);
      await panel.getByTestId("dp-refresh").click();
      await eventually(() => requests.length === 4);
      await check(adminIds, 10);
      await settledCount(4);
      expect(requests[3].tab).toBe("admin");
      expectedLocation = "?keep=batch10&tab=stats&remoteTab=all";
      await all.press("Enter");
      await check(allIds, 28);
      await settledCount(4);
      // The one-page demo has both disabled page directions; native pointer hits must not fetch.
      for (const id of ["dp-prev", "dp-next"]) {
        const button = panel.getByTestId(id);
        expect(await button.isDisabled()).toBe(true);
        const b = await button.boundingBox();
        if (!b) throw new Error("Disabled page button has no bounds");
        await button.scrollIntoViewIfNeeded();
        const r = await button.boundingBox();
        if (!r) throw new Error("Page button lost");
        await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
      }
      await settledCount(4);
      expectedLocation = "?keep=batch10&tab=stats";
      await open(t, route);
      await visible(page.getByTestId("panel-demo-tabs-api"));
      await check(allIds, 28);
      await settledCount(5);
      expectedLocation = "?keep=batch10&tab=stats&remoteTab=admin";
      await open(t, route + "&remoteTab=admin");
      await check(adminIds, 10);
      await settledCount(6);
      await attr(admin, "aria-selected", "true");
      expect(requests.map((r) => r.tab)).toEqual([
        "all",
        "admin",
        "all",
        "admin",
        "all",
        "admin",
      ]);
      for (const request of requests) {
        expect(request.method).toBe("GET");
        expect(request.page).toBe("1");
        expect(request.size).toBe("50");
        expect(request.hasDefaultTab).toBe(false);
      }
      console.log("remote Tab real requests and responses", {
        requests,
        responses,
      });
      page.off("request", onRequest);
    },
    DOCS_BROWSER_CONFIG,
  );
});
