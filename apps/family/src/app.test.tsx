import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { QUESTIONS } from "./content/catalog";
import { hashPin } from "./lib/pin";
import { saveHousehold } from "./lib/storage";
import { createChildProfile } from "./lib/profile";

describe("family learning app", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with a private parent setup instead of showing child data", () => {
    render(<App />);
    expect(screen.getByText("先建立家庭空间")).toBeInTheDocument();
    expect(screen.queryByText("今天谁来学习？")).not.toBeInTheDocument();
  });

  it("lets a parent create a household and then add a named child profile", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("家庭称呼"), { target: { value: "我们的学习岛" } });
    fireEvent.change(screen.getByLabelText("家长称呼"), { target: { value: "妈妈" } });
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "建立家庭空间" }));

    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "添加孩子" }));
    fireEvent.change(screen.getByLabelText("孩子名字"), { target: { value: "小星" } });
    fireEvent.click(screen.getByRole("button", { name: "星星头像" }));
    fireEvent.click(screen.getByRole("button", { name: "保存档案" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /小星/ })).toBeInTheDocument());
  });

  it("opens the child learning map after selecting a profile", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("家庭称呼"), { target: { value: "我们的学习岛" } });
    fireEvent.change(screen.getByLabelText("家长称呼"), { target: { value: "妈妈" } });
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "建立家庭空间" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "添加孩子" }));
    fireEvent.change(screen.getByLabelText("孩子名字"), { target: { value: "小月" } });
    fireEvent.click(screen.getByRole("button", { name: "月亮头像" }));
    fireEvent.click(screen.getByRole("button", { name: "保存档案" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /小月/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /小月/ }));
    expect(screen.getByRole("heading", { name: /小月/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /数学/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /华文/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /英语/ })).toBeInTheDocument();
  });

  it("requires the parent PIN again after the app reloads", async () => {
    const pinSalt = "test-salt";
    saveHousehold({
      version: 1,
      householdName: "测试家庭",
      parentName: "妈妈",
      pinHash: await hashPin("2468", pinSalt),
      pinSalt,
      createdAt: "2026-11-20T00:00:00.000Z",
      children: []
    });
    render(<App />);
    expect(screen.getByRole("heading", { name: "输入家长密码" })).toBeInTheDocument();
    expect(screen.queryByText("今天谁来学习？")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "解锁家庭空间" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("请输入 4 到 6 位数字"));
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "1357" } });
    fireEvent.click(screen.getByRole("button", { name: "解锁家庭空间" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("密码不正确"));
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "解锁家庭空间" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
  });

  it("runs an eight-question diagnostic and stores the child result", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("家庭称呼"), { target: { value: "我们的学习岛" } });
    fireEvent.change(screen.getByLabelText("家长称呼"), { target: { value: "妈妈" } });
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "建立家庭空间" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "添加孩子" }));
    fireEvent.change(screen.getByLabelText("孩子名字"), { target: { value: "小安" } });
    fireEvent.click(screen.getByRole("button", { name: "保存档案" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /小安/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /小安/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    expect(screen.getByRole("heading", { name: /数学入学小测/ })).toBeInTheDocument();

    for (let index = 0; index < 8; index += 1) {
      await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
      const prompt = screen.getByTestId("question-prompt").textContent ?? "";
      const question = QUESTIONS.find((item) => item.prompt === prompt && item.subject === "math" && item.diagnostic);
      expect(question).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: question!.correctAnswer }));
      await waitFor(() => expect(screen.getByTestId("answer-feedback")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "下一题" }));
    }
    expect(screen.getByRole("heading", { name: /小测完成/ })).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem("little-sprout-family-v1")!);
    expect(saved.children[0].diagnostics.math).toBeDefined();
    expect(saved.children[0].attempts).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "回到学习岛" }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    expect(screen.getByRole("heading", { name: "数学自适应练习" })).toBeInTheDocument();
  });

  it("protects the parent dashboard with a second PIN check", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("家庭称呼"), { target: { value: "我们的学习岛" } });
    fireEvent.change(screen.getByLabelText("家长称呼"), { target: { value: "妈妈" } });
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "建立家庭空间" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "家长看板" }));
    expect(screen.getByRole("heading", { name: "打开家长看板" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("家长密码确认"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "进入看板" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "学习进度总览" })).toBeInTheDocument());
  });

  it("lets a parent change session length and reset one subject", async () => {
    const pinSalt = "parent-settings-salt";
    const child = createChildProfile("小树", "leaf", new Date("2026-11-20T00:00:00Z"));
    child.diagnostics.math = { completedAt: "2026-11-20T01:00:00Z", sessionId: "old-session" };
    saveHousehold({
      version: 1,
      householdName: "测试家庭",
      parentName: "妈妈",
      pinHash: await hashPin("2468", pinSalt),
      pinSalt,
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    });
    render(<App />);
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "解锁家庭空间" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "家长看板" }));
    fireEvent.change(screen.getByLabelText("家长密码确认"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "进入看板" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "学习进度总览" })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("小树的每次题量"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "重新定位数学" }));
    const saved = JSON.parse(localStorage.getItem("little-sprout-family-v1")!);
    expect(saved.children[0].settings.sessionLength).toBe(6);
    expect(saved.children[0].diagnostics.math).toBeUndefined();
  });
});
