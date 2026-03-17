/**
 * Message 全局提示单元测试：委托 toast 且固定 top-center。
 */

import { afterEach, describe, expect, it } from "@dreamer/test";
import { message } from "../../src/shared/feedback/message.ts";
import {
  clearToasts,
  toastList,
} from "../../src/shared/feedback/toast-store.ts";

describe("message", () => {
  afterEach(() => {
    clearToasts();
  });

  it("message.success 增加一条 success 且 placement 为 top-center", () => {
    message.success("成功", 0);
    const list = toastList();
    expect(list.length).toBe(1);
    expect(list[0].type).toBe("success");
    expect(list[0].content).toBe("成功");
    expect(list[0].placement).toBe("top-center");
  });

  it("message.error / info / warning 类型正确", () => {
    message.error("错误", 0);
    expect(toastList()[0].type).toBe("error");
    clearToasts();
    message.info("信息", 0);
    expect(toastList()[0].type).toBe("info");
    clearToasts();
    message.warning("警告", 0);
    expect(toastList()[0].type).toBe("warning");
  });

  it("message.destroy 清空 toast 列表", () => {
    message.success("x", 0);
    expect(toastList().length).toBe(1);
    message.destroy();
    expect(toastList().length).toBe(0);
  });
});
