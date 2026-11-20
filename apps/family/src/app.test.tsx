import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { QUESTIONS } from "./content/catalog";
import { hashPin } from "./lib/pin";
import { createEncryptedHousehold, flushStorageWrites, readHousehold, saveHousehold, unlockEncryptedHousehold, writeEncryptedEnvelope } from "./lib/storage";
import { createChildProfile } from "./lib/profile";

describe("family learning app", () => {
  beforeEach(async () => {
    await flushStorageWrites();
    localStorage.clear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(async () => {
    await flushStorageWrites();
    vi.clearAllMocks();
  });

  async function savedHousehold() {
    const result = await flushStorageWrites().then(() => readHousehold());
    if (result.status === "ok") return result.household;
    if (result.status === "encrypted") return (await unlockEncryptedHousehold(result.envelope, "2468")).household;
    throw new Error(`Unexpected storage status: ${result.status}`);
  }

  async function createFamily(name = "我们的学习区") {
    fireEvent.change(screen.getByLabelText("家庭名称"), { target: { value: name } });
    fireEvent.change(screen.getByLabelText("家长称呼"), { target: { value: "妈妈" } });
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "建立家庭学习区" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
  }

  async function openParentSettings() {
    fireEvent.click(screen.getByRole("button", { name: "家长设置" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "进入家长设置" })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("家长密码确认"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "进入设置" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "孩子学习概览" })).toBeInTheDocument());
  }

  async function addChildFromSettings(name: string, avatarLabel = "星星头像", first = false) {
    if (!screen.queryByRole("heading", { name: "孩子学习概览" })) await openParentSettings();
    fireEvent.click(screen.getByRole("button", { name: first ? "添加第一个孩子" : "添加孩子" }));
    fireEvent.change(screen.getByLabelText("孩子的名字"), { target: { value: name } });
    fireEvent.click(screen.getByRole("button", { name: avatarLabel }));
    fireEvent.click(screen.getByRole("button", { name: "保存档案" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "新建孩子档案" })).not.toBeInTheDocument());
  }

  async function closeParentSettings() {
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
  }

  async function createFamilyWithChild(name: string, avatarLabel = "星星头像") {
    await createFamily();
    await openParentSettings();
    await addChildFromSettings(name, avatarLabel, true);
    await closeParentSettings();
  }

  it("starts with a private parent setup instead of showing child data", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "建立家庭学习区" })).toBeInTheDocument();
    expect(screen.queryByText("今天谁来学习？")).not.toBeInTheDocument();
  });

  it("lets a parent create a household and then add a named child profile", async () => {
    render(<App />);
    await createFamily();
    expect(screen.queryByRole("button", { name: "添加孩子" })).not.toBeInTheDocument();
    await openParentSettings();
    await addChildFromSettings("小星", "星星头像", true);
    await closeParentSettings();
    await waitFor(() => expect(screen.getByRole("button", { name: /小星/ })).toBeInTheDocument());
  });

  it("opens the child learning map after selecting a profile", async () => {
    render(<App />);
    await createFamilyWithChild("小月", "月亮头像");
    fireEvent.click(screen.getByRole("button", { name: /小月/ }));
    expect(screen.getByRole("heading", { name: /小月/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /数学/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "华文 Mandarin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /英语/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /看笔顺，亲手写/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /跟小芽开始/ })).toBeInTheDocument();
  });

  it("requires the parent PIN again after the app reloads", async () => {
    const pinSalt = "test-salt";
    saveHousehold({
      version: 2,
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
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("请输入 4 到 6 位数字"));
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "1357" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("密码不正确"));
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
  });

  it("runs an eight-question diagnostic and stores the child result", async () => {
    render(<App />);
    await createFamilyWithChild("小安");
    fireEvent.click(screen.getByRole("button", { name: /小安/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /数学起点小试/ })).toBeInTheDocument());

    for (let index = 0; index < 8; index += 1) {
      await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
      const prompt = screen.getByTestId("question-prompt").textContent ?? "";
      const question = QUESTIONS.find((item) => item.prompt === prompt && item.subject === "math" && item.diagnostic);
      expect(question).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: question!.correctAnswer }));
      await waitFor(() => expect(screen.getByTestId("answer-feedback")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "下一题" }));
    }
    await waitFor(() => expect(screen.getByRole("heading", { name: /起点小试完成/ })).toBeInTheDocument());
    const saved = await savedHousehold();
    expect(saved.children[0].diagnostics.math).toBeDefined();
    expect(saved.children[0].attempts).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "回到学习区" }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "数学继续练习" })).toBeInTheDocument());
  });

  it("protects the parent dashboard with a second PIN check", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("家庭名称"), { target: { value: "我们的学习岛" } });
    fireEvent.change(screen.getByLabelText("家长称呼"), { target: { value: "妈妈" } });
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "建立家庭学习区" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "家长设置" }));
    expect(screen.getByRole("heading", { name: "进入家长设置" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("家长密码确认"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "进入设置" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "孩子学习概览" })).toBeInTheDocument());
  });

  it("lets a parent change session length and reset one subject", async () => {
    const pinSalt = "parent-settings-salt";
    const child = createChildProfile("小树", "leaf", new Date("2026-11-20T00:00:00Z"));
    child.diagnostics.math = { completedAt: "2026-11-20T01:00:00Z", sessionId: "old-session" };
    saveHousehold({
      version: 2,
      householdName: "测试家庭",
      parentName: "妈妈",
      pinHash: await hashPin("2468", pinSalt),
      pinSalt,
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    });
    render(<App />);
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "家长设置" }));
    fireEvent.change(screen.getByLabelText("家长密码确认"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "进入设置" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "孩子学习概览" })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("小树的每轮题数"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "重做数学起点" }));
    await waitFor(async () => {
      const saved = await savedHousehold();
      expect(saved.children[0].settings.sessionLength).toBe(6);
      expect(saved.children[0].diagnostics.math).toBeUndefined();
    });
  });

  it("does not clear a subject when the parent cancels the reset confirmation", async () => {
    const pinSalt = "cancel-reset-salt";
    const child = createChildProfile("小树", "leaf", new Date("2026-11-20T00:00:00Z"));
    child.diagnostics.math = { completedAt: "2026-11-20T01:00:00Z", sessionId: "old-session" };
    saveHousehold({
      version: 2,
      householdName: "测试家庭",
      parentName: "妈妈",
      pinHash: await hashPin("2468", pinSalt),
      pinSalt,
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    });
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    render(<App />);
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "家长设置" }));
    fireEvent.change(screen.getByLabelText("家长密码确认"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "进入设置" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "孩子学习概览" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "重做数学起点" }));
    const saved = await savedHousehold();
    expect(saved.children[0].diagnostics.math).toEqual(child.diagnostics.math);
  });

  it("shows an actionable next step and weekly evidence in the parent dashboard", async () => {
    const pinSalt = "insights-salt";
    const child = createChildProfile("小星", "star", new Date("2026-11-20T00:00:00Z"));
    child.diagnostics.math = { completedAt: "2026-11-19T00:00:00Z", sessionId: "diagnostic" };
    child.evidence["math-add-sub-100"] = {
      ...child.evidence["math-add-sub-100"],
      pKnown: 0.93,
      nEff: 4,
      reviewStage: 2,
      dueAt: "2026-11-19T00:00:00Z"
    };
    saveHousehold({
      version: 2,
      householdName: "测试家庭",
      parentName: "妈妈",
      pinHash: await hashPin("2468", pinSalt),
      pinSalt,
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    });
    render(<App />);
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    await openParentSettings();
    expect(screen.getByText("到了复习时间", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出作答 CSV" })).toBeInTheDocument();
    expect(screen.getByText(/人工课纲复核：待完成/)).toBeInTheDocument();
  });

  it("restores an interrupted diagnostic after reload without repeating the answered question", async () => {
    const first = render(<App />);
    await createFamilyWithChild("小树");
    fireEvent.click(screen.getByRole("button", { name: /小树/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    const prompt = screen.getByTestId("question-prompt").textContent ?? "";
    const question = QUESTIONS.find((item) => item.prompt === prompt && item.subject === "math");
    expect(question).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: question!.correctAnswer }));
    await waitFor(() => expect(screen.getByTestId("answer-feedback")).toBeInTheDocument());
    expect(screen.getByText("1 / 8")).toBeInTheDocument();
    first.unmount();

    render(<App />);
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /小树/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByText("1 / 8")).toBeInTheDocument());
    const resumed = screen.getByTestId("question-prompt").textContent;
    expect(resumed).not.toBe(prompt);
    const saved = await savedHousehold();
    expect(saved.children[0].attempts).toHaveLength(1);
  });

  it("records a completed diagnostic once when the final next button is tapped twice", async () => {
    render(<App />);
    await createFamilyWithChild("小芽");
    fireEvent.click(screen.getByRole("button", { name: /小芽/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());

    for (let index = 0; index < 8; index += 1) {
      const prompt = screen.getByTestId("question-prompt").textContent ?? "";
      const question = QUESTIONS.find((item) => item.prompt === prompt && item.subject === "math");
      expect(question).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: question!.correctAnswer }));
      await waitFor(() => expect(screen.getByTestId("answer-feedback")).toBeInTheDocument());
      if (index < 7) {
        fireEvent.click(screen.getByRole("button", { name: "下一题" }));
        await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
      }
    }

    const next = screen.getByRole("button", { name: "下一题" });
    fireEvent.click(next);
    fireEvent.click(next);
    await waitFor(() => expect(screen.getByRole("heading", { name: "数学起点小试完成" })).toBeInTheDocument());
    const saved = await savedHousehold();
    expect(saved.children[0].attempts).toHaveLength(8);
    expect(saved.children[0].sessions).toHaveLength(1);
    expect(saved.children[0].activeSessions.math).toBeUndefined();
  });

  it("does not acknowledge an answer until the encrypted write succeeds", async () => {
    render(<App />);
    await createFamilyWithChild("小安");
    fireEvent.click(screen.getByRole("button", { name: /小安/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());

    const prompt = screen.getByTestId("question-prompt").textContent ?? "";
    const question = QUESTIONS.find((item) => item.prompt === prompt && item.subject === "math");
    expect(question).toBeDefined();
    const writeSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    fireEvent.click(screen.getByRole("button", { name: question!.correctAnswer }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("没有保存成功"));
    expect(screen.queryByTestId("answer-feedback")).not.toBeInTheDocument();
    expect(screen.getByText("0 / 8")).toBeInTheDocument();

    writeSpy.mockRestore();
    fireEvent.click(screen.getByRole("button", { name: question!.correctAnswer }));
    await waitFor(() => expect(screen.getByTestId("answer-feedback")).toBeInTheDocument());
    expect(screen.getByText("1 / 8")).toBeInTheDocument();
  });

  it("shows a recovery screen instead of overwriting corrupt family data", () => {
    localStorage.setItem("little-sprout-family-v1", "{broken-json");
    render(<App />);
    expect(screen.getByRole("heading", { name: "学习记录需要恢复" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "建立家庭学习区" })).not.toBeInTheDocument();
  });

  it("can explicitly lock the household and returns to encrypted PIN entry", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("家庭名称"), { target: { value: "我们的学习岛" } });
    fireEvent.change(screen.getByLabelText("家长称呼"), { target: { value: "妈妈" } });
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "建立家庭学习区" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "退出并锁定" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "输入家长密码" })).toBeInTheDocument());
    expect(localStorage.getItem("little-sprout-family-v1")).not.toContain("我们的学习岛");
  });

  it("opens an encrypted household only after the correct PIN", async () => {
    const child = createChildProfile("加密孩子", "moon", new Date("2026-11-20T00:00:00Z"));
    const household = {
      version: 2 as const,
      householdName: "秘密学习岛",
      parentName: "妈妈",
      pinHash: await hashPin("2468", "secure-salt"),
      pinSalt: "secure-salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    };
    const sealed = await createEncryptedHousehold(household, "2468");
    expect(writeEncryptedEnvelope(sealed.envelope).ok).toBe(true);
    render(<App />);
    expect(screen.getByRole("heading", { name: "输入家长密码" })).toBeInTheDocument();
    expect(localStorage.getItem("little-sprout-family-v1")).not.toContain("加密孩子");
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /加密孩子/ })).toBeInTheDocument());
  });

  it("offers recovery when an encrypted payload cannot be decrypted", async () => {
    const envelope = {
      format: "little-sprout-secure-v1" as const,
      kdfSalt: "salt",
      iv: "AAAAAAAAAAAAAAAA",
      ciphertext: "broken"
    };
    expect(writeEncryptedEnvelope(envelope).ok).toBe(true);
    render(<App />);
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /下载加密数据并重新开始/ })).toBeInTheDocument());
  });
});
