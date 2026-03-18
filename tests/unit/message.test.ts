/**
 * Message 全局提示单元测试：独立 store，固定顶部居中。
 */

import { afterEach, describe, expect, it } from "@dreamer/test";
import {
  clearMessages,
  message,
  messageList,
} from "../../src/shared/feedback/message-store.ts";

describe("message", () => {
  afterEach(() => {
    clearMessages();
  });

  it("message.success 增加一条 success 类型", () => {
    message.success("成功", 0);
    const list = messageList();
    expect(list.length).toBe(1);
    expect(list[0].type).toBe("success");
    expect(list[0].content).toBe("成功");
  });

  it("message.error / info / warning 类型正确", () => {
    message.error("错误", 0);
    expect(messageList()[0].type).toBe("error");
    clearMessages();
    message.info("信息", 0);
    expect(messageList()[0].type).toBe("info");
    clearMessages();
    message.warning("警告", 0);
    expect(messageList()[0].type).toBe("warning");
  });

  it("message.destroy 清空 message 列表", () => {
    message.success("x", 0);
    expect(messageList().length).toBe(1);
    message.destroy();
    expect(messageList().length).toBe(0);
  });
});
