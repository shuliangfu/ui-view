/**
 * Notification 消息通知框存储单元测试：open、close、destroy、key 去重。
 * 使用 duration 0 避免 setTimeout 干扰。
 */

import { afterEach, describe, expect, it } from "@dreamer/test";
import {
  closeNotification,
  destroyNotifications,
  notification,
  notificationList,
  openNotification,
} from "../../src/shared/feedback/notification-store.ts";

describe("notification-store", () => {
  afterEach(() => {
    destroyNotifications();
  });

  it("openNotification 增加一条，返回 id", () => {
    const id = openNotification({
      title: "标题",
      duration: 0,
    });
    expect(id).toBeDefined();
    expect(id.startsWith("notification-")).toBe(true);
    const list = notificationList();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe("标题");
    expect(list[0].type).toBe("default");
    expect(list[0].placement).toBe("top-right");
  });

  it("openNotification 支持 type、description、placement", () => {
    openNotification({
      title: "成功",
      description: "已保存",
      type: "success",
      placement: "bottom-center",
      duration: 0,
    });
    const list = notificationList();
    expect(list[0].type).toBe("success");
    expect(list[0].description).toBe("已保存");
    expect(list[0].placement).toBe("bottom-center");
  });

  it("相同 key 会替换旧通知", () => {
    openNotification({ key: "k1", title: "第一", duration: 0 });
    openNotification({ key: "k1", title: "第二", duration: 0 });
    const list = notificationList();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe("第二");
  });

  it("closeNotification 移除指定 id", () => {
    const id = openNotification({ title: "x", duration: 0 });
    closeNotification(id);
    expect(notificationList().length).toBe(0);
  });

  it("destroyNotifications 清空全部", () => {
    openNotification({ title: "a", duration: 0 });
    openNotification({ title: "b", duration: 0 });
    destroyNotifications();
    expect(notificationList().length).toBe(0);
  });

  it("notification.open / close / destroy 与上述一致", () => {
    const id = notification.open({ title: "t", duration: 0 });
    expect(notificationList().length).toBe(1);
    notification.close(id);
    expect(notificationList().length).toBe(0);
    notification.open({ title: "t2", duration: 0 });
    notification.destroy();
    expect(notificationList().length).toBe(0);
  });
});
