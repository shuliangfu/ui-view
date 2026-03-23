/**
 * Toast 轻提示存储单元测试：toast.show、removeToast、clearToasts。
 * 使用 duration 0 避免 setTimeout 干扰断言。
 */

import { afterEach, describe, expect, it } from "@dreamer/test";
import {
  clearToasts,
  removeToast,
  toast,
  toastList,
} from "../../src/shared/feedback/toast-store.ts";

describe("toast-store", () => {
  afterEach(() => {
    clearToasts();
  });

  it("toast.show 增加一条，类型与内容正确", () => {
    const id = toast.show("success", "保存成功", 0);
    expect(id).toBeDefined();
    expect(id.startsWith("toast-")).toBe(true);
    const list = toastList();
    expect(list.length).toBe(1);
    expect(list[0].type).toBe("success");
    expect(list[0].content).toBe("保存成功");
    expect(list[0].duration).toBe(0);
    expect(list[0].placement).toBe("top");
  });

  it("toast.success 默认 placement 为 top", () => {
    toast.success("ok", 0);
    expect(toastList()[0].placement).toBe("top");
  });

  it("removeToast 移除指定 id", () => {
    const id = toast.show("error", "失败", 0);
    expect(toastList().length).toBe(1);
    removeToast(id);
    expect(toastList().length).toBe(0);
  });

  it("clearToasts 清空全部", () => {
    toast.show("info", "a", 0);
    toast.show("warning", "b", 0);
    expect(toastList().length).toBe(2);
    clearToasts();
    expect(toastList().length).toBe(0);
  });

  it("toast.dismiss 与 removeToast 一致", () => {
    const id = toast.show("success", "x", 0);
    toast.dismiss(id);
    expect(toastList().length).toBe(0);
  });

  it("toast.destroy 与 clearToasts 一致", () => {
    toast.show("info", "1", 0);
    toast.destroy();
    expect(toastList().length).toBe(0);
  });
});
