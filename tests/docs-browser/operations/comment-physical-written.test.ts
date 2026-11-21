/** WRITTEN-UNRUN. Two live Comment examples; actions have no callbacks, so clicks must leave copy unchanged. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { example, open } from "./driver.ts";

const comments = (root: Locator) =>
  root.locator(
    "xpath=self::*[contains(concat(' ', normalize-space(@class), ' '), ' comment ')] | ./*[contains(concat(' ', normalize-space(@class), ' '), ' comment ')]",
  );

function core(snap: Awaited<ReturnType<typeof commentSnap>>) {
  const { avatarRadius: _radius, ...rest } = snap;
  return rest;
}

async function commentSnap(el: Locator) {
  return await el.evaluate((e) => {
    const body = e.children[1] as HTMLElement;
    const meta = body.children[0] as HTMLElement;
    const content = body.children[1] as HTMLElement;
    const actions = body.querySelector(":scope > .mt-2");
    const replies = body.querySelector(":scope > .mt-4");
    const avatar = e.children[0] as HTMLElement;
    const rc = replies ? getComputedStyle(replies) : undefined;
    return {
      author: meta.querySelector(".font-medium")?.textContent ?? "",
      datetime: meta.querySelector(".text-xs")?.textContent ?? "",
      content: (content.textContent ?? "").trim(),
      actions: actions
        ? Array.from(actions.querySelectorAll(":scope > span")).map((n) =>
          n.textContent?.trim() ?? ""
        )
        : [],
      avatar: (avatar.textContent ?? "").trim(),
      avatarRadius: getComputedStyle(avatar.firstElementChild ?? avatar)
        .borderRadius,
      replyPad: rc?.paddingLeft ?? "",
      replyBorder: rc ? [rc.borderLeftWidth, rc.borderLeftStyle] : [],
      replyCount: replies
        ? replies.querySelectorAll(":scope > .comment").length
        : 0,
    };
  });
}

describe("Comment physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Comment 基础（author / avatar / datetime / actions） @${width}：文案头像操作精确，真点无状态`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/comment");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "基础（author / avatar / datetime / actions）");
        const list = comments(root);
        expect(await list.count()).toBe(1);
        const snap = await commentSnap(list.first());
        expect(core(snap)).toEqual({
          author: "用户 A",
          datetime: "2024-01-15 10:00",
          content: "这是一条评论内容。",
          actions: ["回复", "点赞"],
          avatar: "A",
          replyCount: 0,
          replyPad: "",
          replyBorder: [],
        });
        expect(snap.avatarRadius).not.toBe("0px");
        await list.first().getByText("回复", { exact: true }).click({
          delay: 180,
        });
        await list.first().getByText("点赞", { exact: true }).click({
          delay: 180,
        });
        expect(await commentSnap(list.first())).toEqual(snap);
        expect(await comments(example(p, "replies 嵌套回复")).count()).toBe(1);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Comment replies 嵌套回复 @${width}：默认问号头像、左边线与嵌套文案，点击不串改基础例`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/comment");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "replies 嵌套回复");
        const parent = comments(root).first();
        const snap = await commentSnap(parent);
        expect(core(snap)).toEqual({
          author: "用户 B",
          datetime: "2024-01-15 11:00",
          content: "带回复的评论。",
          actions: [],
          avatar: "?",
          replyCount: 1,
          replyPad: "16px",
          replyBorder: ["2px", "solid"],
        });
        const child = parent.locator(":scope > div").nth(1).locator(
          ":scope > .mt-4 > .comment",
        );
        expect(core(await commentSnap(child))).toEqual({
          author: "用户 A",
          datetime: "2024-01-15 12:00",
          content: "回复内容。",
          actions: [],
          avatar: "?",
          replyCount: 0,
          replyPad: "",
          replyBorder: [],
        });
        await child.getByText("回复内容。", { exact: true }).click({
          delay: 180,
        });
        await parent.getByText("带回复的评论。", { exact: true }).click({
          delay: 180,
        });
        expect(await commentSnap(parent)).toEqual(snap);
        const basic = await commentSnap(
          comments(example(p, "基础（author / avatar / datetime / actions）"))
            .first(),
        );
        expect(basic.author).toBe("用户 A");
        expect(basic.avatar).toBe("A");
        expect(basic.actions).toEqual(["回复", "点赞"]);
        expect(basic.replyCount).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
