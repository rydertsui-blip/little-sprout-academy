import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { QUESTIONS, SKILLS } from "./content/catalog";
import { AUDIO_ASSETS } from "./content/audioAssets";
import { hashPin } from "./lib/pin";
import { createEncryptedHousehold, flushStorageWrites, readHousehold, saveHousehold, unlockEncryptedHousehold, writeEncryptedEnvelope } from "./lib/storage";
import { createChildProfile } from "./lib/profile";
import { MathTool } from "./screens/MathTool";
import { LanguageTool } from "./screens/LanguageTool";

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
    await waitFor(() => expect(screen.getByRole("heading", { name: "孩子学习情况" })).toBeInTheDocument());
  }

  async function addChildFromSettings(name: string, avatarLabel = "星星头像", first = false) {
    if (!screen.queryByRole("heading", { name: "孩子学习情况" })) await openParentSettings();
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

  function currentQuestion() {
    const id = screen.getByTestId("question-prompt").getAttribute("data-question-id");
    const question = QUESTIONS.find((item) => item.id === id);
    expect(question).toBeDefined();
    return question!;
  }

  async function tapMatchPair(pairId: string) {
    const left = document.querySelector(`[data-match-side="left"][data-pair-id="${pairId}"]`) as HTMLButtonElement | null;
    const right = document.querySelector(`[data-match-side="right"][data-pair-id="${pairId}"]`) as HTMLButtonElement | null;
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    fireEvent.click(left!);
    await waitFor(() => expect(right!).not.toBeDisabled());
    fireEvent.click(right!);
  }

  async function answerCurrentQuestion(correct = true) {
    const question = currentQuestion();
    if (question.kind === "choice") {
      const answer = correct ? question.correctAnswer : question.options.find((option) => option !== question.correctAnswer)!;
      fireEvent.click(screen.getByRole("button", { name: answer }));
    } else if (question.kind === "order") {
      const bank = screen.getByTestId("order-board").querySelector(".order-bank")!;
      const sequence = correct ? question.correctOrder : [...question.correctOrder].reverse();
      for (const token of sequence) {
        const btn = Array.from(bank.querySelectorAll("button")).find((item) => item.textContent === token && !item.disabled);
        expect(btn).toBeDefined();
        fireEvent.click(btn!);
      }
      fireEvent.click(screen.getByRole("button", { name: /Check|检查答案/ }));
    } else {
      if (!correct) {
        const first = question.pairs[0];
        const wrongRight = question.pairs[1];
        const left = document.querySelector(`[data-match-side="left"][data-pair-id="${first.id}"]`) as HTMLButtonElement | null;
        const right = document.querySelector(`[data-match-side="right"][data-pair-id="${wrongRight.id}"]`) as HTMLButtonElement | null;
        fireEvent.click(left!);
        await waitFor(() => expect(right!).not.toBeDisabled());
        fireEvent.click(right!);
      }
      for (const pair of question.pairs) await tapMatchPair(pair.id);
    }
    await waitFor(() => expect(screen.getByTestId("answer-feedback")).toBeInTheDocument());
    return question;
  }

  async function finishCurrentRound(length = 5) {
    for (let index = 0; index < length; index += 1) {
      await answerCurrentQuestion();
      fireEvent.click(screen.getByRole("button", { name: "Next question" }));
      if (index < length - 1) await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    }
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

  it("shows three island stops and a today marker on the child home", async () => {
    render(<App />);
    await createFamilyWithChild("小岛");
    fireEvent.click(screen.getByRole("button", { name: /小岛/ }));
    expect(screen.getByTestId("island-trail")).toBeInTheDocument();
    expect(screen.getAllByTestId("island-trail-stop")).toHaveLength(3);
    expect(screen.getByTestId("island-today")).toHaveTextContent("今天从这里开始");
  });

  it("recommends a starting level from age and lets the parent confirm it", async () => {
    render(<App />);
    await createFamily();
    await openParentSettings();
    fireEvent.click(screen.getByRole("button", { name: "添加第一个孩子" }));
    fireEvent.change(screen.getByLabelText("孩子的名字"), { target: { value: "小芽" } });
    expect(screen.getByLabelText("孩子年龄")).toHaveValue("6");
    expect(screen.getByLabelText("在读年级")).toHaveValue("P1");
    fireEvent.change(screen.getByLabelText("孩子年龄"), { target: { value: "5" } });
    expect(screen.getByLabelText("在读年级")).toHaveValue("K2");
    fireEvent.change(screen.getByLabelText("在读年级"), { target: { value: "P1" } });
    fireEvent.click(screen.getByRole("button", { name: "星星头像" }));
    fireEvent.click(screen.getByRole("button", { name: "保存档案" }));
    await waitFor(async () => {
      const saved = await savedHousehold();
      expect(saved.children[0].ageYears).toBe(5);
      expect(saved.children[0].birthYear).toBe(new Date().getFullYear() - 5);
      expect(saved.children[0].levelConfirmedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(saved.children[0].gradeLevel).toBe("P1");
      const p2Ids = SKILLS.filter((skill) => skill.gradeBand === "P2").map((skill) => skill.id);
      expect(saved.children[0].settings.enabledSkills.every((skillId) => !p2Ids.includes(skillId))).toBe(true);
    });
  });

  it("asks the parent to confirm the level in a new school year instead of auto-promoting", async () => {
    const pinSalt = "annual-level-review-salt";
    const nowYear = new Date().getFullYear();
    const child = createChildProfile("小年", "star", new Date(`${nowYear - 1}-01-05T00:00:00Z`));
    child.ageYears = 6;
    child.birthYear = nowYear - 7;
    child.gradeLevel = "P1";
    child.levelConfirmedOn = `${nowYear - 1}-01-05`;
    saveHousehold({
      version: 4,
      uiLocale: "zh",
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

    expect(screen.getByText("新学年确认")).toBeInTheDocument();
    expect(screen.getByText(/现在约 7 岁/)).toBeInTheDocument();
    expect(document.querySelector(".parent-child-title p")?.textContent).toContain("7 岁 · P1 基础");
    expect((await savedHousehold()).children[0].gradeLevel).toBe("P1");

    fireEvent.click(screen.getByRole("button", { name: "升到下一级" }));
    await waitFor(() => expect(screen.queryByText("新学年确认")).not.toBeInTheDocument());
    const saved = await savedHousehold();
    expect(saved.children[0].gradeLevel).toBe("P2");
    expect(saved.children[0].levelConfirmedOn).toMatch(new RegExp(`^${nowYear}-`));
    expect(saved.children[0].settings.enabledSkills).toEqual(SKILLS.filter((skill) => skill.gradeBand !== "K2").map((skill) => skill.id));
  });

  it("keeps every child learning screen free of keyboard inputs", async () => {
    render(<App />);
    await createFamilyWithChild("小点", "花朵头像");
    fireEvent.click(screen.getByRole("button", { name: /小点/ }));
    expect(document.querySelectorAll("input, textarea, [contenteditable='true']")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    expect(document.querySelectorAll("input, textarea, [contenteditable='true']")).toHaveLength(0);
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
    expect(screen.queryByRole("button", { name: /写字练习/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /小芽口说/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /华文口语小游戏/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /English Speaking/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /跟小芽开始/ })).toBeInTheDocument();
  });

  it("switches the system interface to English while subject screens keep their own language", async () => {
    render(<App />);
    await createFamilyWithChild("小月", "月亮头像");
    await openParentSettings();

    fireEvent.change(screen.getByLabelText("界面语言"), { target: { value: "en" } });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Your child's learning" })).toBeInTheDocument());
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Who is learning today?" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /小月/ }));
    expect(screen.getByRole("button", { name: "Mathematics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chinese" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mathematics" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Mathematics starting check/ })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Hint" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "提示" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Exit" }));

    fireEvent.click(screen.getByRole("button", { name: "Chinese" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /华文起点小试/ })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "提示" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hint" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "退出" }));
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /English starting check/ })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Hint" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "提示" })).not.toBeInTheDocument();

    const saved = await savedHousehold();
    expect(saved.uiLocale).toBe("en");
  });

  it("shows a hint and lets the child retry a choice question before recording it", async () => {
    render(<App />);
    await createFamilyWithChild("小思");
    fireEvent.click(screen.getByRole("button", { name: /小思/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());

    let question = currentQuestion();
    for (let guard = 0; guard < 4 && question.kind !== "choice"; guard += 1) {
      await answerCurrentQuestion();
      fireEvent.click(screen.getByRole("button", { name: "Next question" }));
      await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
      question = currentQuestion();
    }
    expect(question.kind).toBe("choice");
    if (question.kind !== "choice") return;

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByText("Sprout's hint")).toBeInTheDocument();
    const wrong = question.options.find((option) => option !== question.correctAnswer)!;
    fireEvent.click(screen.getByRole("button", { name: wrong }));
    await waitFor(() => expect(screen.getByTestId("retry-feedback")).toBeInTheDocument());
    expect(screen.getByText("Think again")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.queryByTestId("retry-feedback")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: question.correctAnswer }));
    await waitFor(() => expect(screen.getByTestId("answer-feedback")).toBeInTheDocument());

    const saved = await savedHousehold();
    const attempt = saved.children[0].attempts.find((item) => item.questionId === question.id);
    expect(attempt?.correct).toBe(true);
    expect(attempt?.hintUsed).toBe(true);
  });

  it("shows math tool visuals and reads the explanation back", async () => {
    render(<App />);
    await createFamilyWithChild("小图");
    fireEvent.click(screen.getByRole("button", { name: /小图/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    expect(screen.getByText("Math tool")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Math tool:/ })).toBeInTheDocument();

    await answerCurrentQuestion();
    await waitFor(() => expect(screen.getByTestId("answer-feedback")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Read the explanation" })).toBeInTheDocument();
  });

  it("marks the answered screen as feedback and shows Sprout there", async () => {
    render(<App />);
    await createFamilyWithChild("小复");
    fireEvent.click(screen.getByRole("button", { name: /小复/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    await answerCurrentQuestion();
    expect(screen.getByTestId("answer-feedback").closest(".quiz-layout")).toHaveClass("is-feedback");
    expect(screen.getByTestId("feedback-mascot")).toBeInTheDocument();
  });

  it("introduces a new practice skill with a teach card before answering", async () => {
    const pinSalt = "teach-card-salt";
    const child = createChildProfile("小芽", "star", new Date("2026-11-20T00:00:00Z"));
    child.diagnostics.math = { completedAt: "2026-11-20T01:00:00.000Z", sessionId: "diagnostic-math" };
    saveHousehold({
      version: 4,
    uiLocale: "zh",
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
    fireEvent.click(screen.getByRole("button", { name: /小芽/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());

    expect(screen.getByText(/First time/)).toBeInTheDocument();
    expect(screen.getByText(/Sprout explains/)).toBeInTheDocument();
    expect(screen.getAllByText(/Tens and ones/).length).toBeGreaterThanOrEqual(1);
    await answerCurrentQuestion();
    const saved = await savedHousehold();
    const attempt = saved.children[0]?.activeSessions?.math?.attempts.at(-1);
    expect(attempt?.hintUsed).toBe(true);
  });

  it("shows a bar model for a Singapore-style story problem", () => {
    const question = QUESTIONS.find((item) => item.skillId === "math-add-sub-100" && item.template === "story-change");
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    expect(screen.getByText(/Bar model/)).toBeInTheDocument();
    expect(screen.getByText("whole")).toBeInTheDocument();
    expect(screen.getAllByText("part")).toHaveLength(2);
    expect(screen.getByText("part + part = whole")).toBeInTheDocument();
  });

  it("shows a start and end time line without printing the duration answer", () => {
    const question = QUESTIONS.find((item) => item.skillId === "math-time-duration" && item.template === "time-duration");
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    expect(screen.getByText(/Timeline/)).toBeInTheDocument();
    expect(screen.getByText("2:00")).toBeInTheDocument();
    expect(screen.getByText("3:00")).toBeInTheDocument();
    expect(screen.getByTestId("duration-rail")).toHaveTextContent("?");
    expect(screen.queryByText("1 hour")).not.toBeInTheDocument();
  });

  it("shows hours and minutes as a conversion without printing the total", () => {
    const question = QUESTIONS.find((item) => item.skillId === "math-time-duration" && item.template === "time-convert" && /1 hour 30 minutes/i.test(item.prompt));
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    expect(screen.getByText("1 h")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
    expect(screen.queryByText("90 min")).not.toBeInTheDocument();
    expect(screen.getByText(/1 hour = 60 minutes/)).toBeInTheDocument();
  });

  it("draws clock hands from the question without printing the clock answer", () => {
    const question = QUESTIONS.find((item) => item.skillId === "math-time" && item.kind === "choice");
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    expect(screen.getByText("Read the hour and minute hands.")).toBeInTheDocument();
    expect(screen.queryByText(/0?7:35/)).not.toBeInTheDocument();
  });

  it("draws picture graph rows from the question data without printing counts", () => {
    const question = QUESTIONS.find((item) => item.skillId === "math-picture-graph" && /4 apples and 2 pears/i.test(item.prompt));
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    expect(screen.getByText("Apples")).toBeInTheDocument();
    expect(screen.getByText("Pears")).toBeInTheDocument();
    expect(screen.queryByText(/Apples · 4/)).not.toBeInTheDocument();
    expect(screen.getAllByTestId("graph-dot")).toHaveLength(6);
  });

  it("labels picture graph rows that use a colour and an object without printing counts", () => {
    const question = QUESTIONS.find((item) => item.skillId === "math-picture-graph" && /7 red cars and 4 blue cars/i.test(item.prompt));
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    expect(screen.getByText("Red cars")).toBeInTheDocument();
    expect(screen.getByText("Blue cars")).toBeInTheDocument();
    expect(screen.getAllByTestId("graph-dot")).toHaveLength(11);
  });

  it("shows the target place and expanded form for numbers to 1000", () => {
    const placeQuestion = QUESTIONS.find((item) => item.skillId === "math-place-value-1000" && /tens digit in 951/i.test(item.prompt));
    const expandedQuestion = QUESTIONS.find((item) => item.skillId === "math-place-value-1000" && /800 \+ 30 \+ 7/i.test(item.prompt));
    expect(placeQuestion).toBeDefined();
    expect(expandedQuestion).toBeDefined();
    const { unmount } = render(<MathTool question={placeQuestion!} />);
    expect(screen.getByTestId("place-value-chart")).toBeInTheDocument();
    expect(screen.getByText("Tens")).toBeInTheDocument();
    expect(screen.getByTestId("place-digit-1")).toHaveTextContent("?");
    unmount();
    render(<MathTool question={expandedQuestion!} />);
    expect(screen.getByTestId("expanded-form")).toBeInTheDocument();
    expect(screen.getByText("800")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("draws a jump number line for regrouping and three-digit calculations", () => {
    const addQuestion = QUESTIONS.find((item) => item.skillId === "math-add-sub-1000" && /367 \+ 245/i.test(item.prompt));
    const subtractQuestion = QUESTIONS.find((item) => item.skillId === "math-add-sub-regroup" && /74 − 38/i.test(item.prompt));
    expect(addQuestion).toBeDefined();
    expect(subtractQuestion).toBeDefined();
    const { unmount } = render(<MathTool question={addQuestion!} />);
    expect(screen.getByTestId("jump-number-line")).toBeInTheDocument();
    expect(screen.getByText("+ 245")).toBeInTheDocument();
    expect(screen.getByText("Start at 367, then add 245")).toBeInTheDocument();
    unmount();
    render(<MathTool question={subtractQuestion!} />);
    expect(screen.getByTestId("jump-number-line")).toBeInTheDocument();
    expect(screen.getByText("− 38")).toBeInTheDocument();
    expect(screen.getByText("Start at 74, then subtract 38")).toBeInTheDocument();
  });

  it("lets a child tap and rearrange word tiles for sentence order", () => {
    const question = QUESTIONS.find((item) => item.id === "q-english-sentence-order-13");
    expect(question).toBeDefined();
    render(<LanguageTool question={question!} />);
    const tiles = within(screen.getByTestId("sentence-tiles"));
    expect(tiles.getAllByTestId("sentence-tile")).toHaveLength(6);
    fireEvent.click(tiles.getAllByTestId("sentence-tile")[0]);
    expect(screen.getByTestId("sentence-answer")).toHaveTextContent("riding");
    expect(tiles.getAllByTestId("sentence-tile")).toHaveLength(5);
    fireEvent.click(within(screen.getByTestId("sentence-answer")).getByTestId("sentence-tile"));
    expect(screen.getByTestId("sentence-answer")).not.toHaveTextContent("riding");
    expect(tiles.getAllByTestId("sentence-tile")).toHaveLength(6);
  });

  it("keeps shape names out of the shape-reference tool", () => {
    const question = QUESTIONS.find((item) => item.id === "q-math-shapes-6");
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    expect(screen.queryByText("Triangle")).not.toBeInTheDocument();
    expect(screen.queryByText("Square")).not.toBeInTheDocument();
    expect(screen.getAllByText("?")).toHaveLength(4);
  });

  it("builds equal-group boards from division prompts", () => {
    const shareQuestion = QUESTIONS.find((item) => item.skillId === "math-divide-tables" && /12 counters.*3 groups/i.test(item.prompt));
    const factQuestion = QUESTIONS.find((item) => item.skillId === "math-divide-tables" && /5 × 8 = 40/i.test(item.prompt));
    expect(shareQuestion).toBeDefined();
    expect(factQuestion).toBeDefined();
    const { unmount } = render(<MathTool question={shareQuestion!} />);
    expect(screen.getByTestId("division-board")).toBeInTheDocument();
    expect(screen.getByText("3 equal groups")).toBeInTheDocument();
    unmount();
    render(<MathTool question={factQuestion!} />);
    expect(screen.getByTestId("division-board")).toBeInTheDocument();
    expect(screen.getByText("5 equal groups")).toBeInTheDocument();
  });

  it("builds whole and set fraction models from the question", () => {
    const unitQuestion = QUESTIONS.find((item) => item.skillId === "math-fractions" && /cut into 4 equal parts/i.test(item.prompt));
    const setQuestion = QUESTIONS.find((item) => item.skillId === "math-fractions" && /1\/2 of 8/i.test(item.prompt));
    const farQuestion = QUESTIONS.find((item) => item.skillId === "math-fractions" && /fraction of the pizza remains/i.test(item.prompt));
    expect(unitQuestion).toBeDefined();
    expect(setQuestion).toBeDefined();
    expect(farQuestion).toBeDefined();
    const { unmount } = render(<MathTool question={unitQuestion!} />);
    expect(screen.getByTestId("fraction-whole-board")).toBeInTheDocument();
    expect(screen.getByText(/One part is shaded\./)).toBeInTheDocument();
    unmount();
    const { unmount: unmountSet } = render(<MathTool question={setQuestion!} />);
    expect(screen.getByTestId("fraction-set-board")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 equal groups")).toBeInTheDocument();
    unmountSet();
    render(<MathTool question={farQuestion!} />);
    expect(screen.getByTestId("fraction-whole-board")).toBeInTheDocument();
    expect(screen.getByText(/2 of 8 slices eaten/)).toBeInTheDocument();
  });

  it("highlights the measured segment on the centimetre ruler without printing the length", () => {
    const question = QUESTIONS.find((item) => item.skillId === "math-length-measure" && /from 5 cm to 12 cm/i.test(item.prompt));
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    expect(screen.getByTestId("ruler-visual")).toBeInTheDocument();
    expect(screen.getByText("Read the marked segment on the ruler.")).toBeInTheDocument();
    expect(screen.queryByText("Length: 7 cm")).not.toBeInTheDocument();
  });

  it("draws both fractions in a like-fraction calculation", () => {
    const question = QUESTIONS.find((item) => item.skillId === "math-fractions-add-sub" && /4\/7 \+ 2\/7/.test(item.prompt));
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    const cards = screen.getAllByTestId("fraction-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("4/7");
    expect(cards[1]).toHaveTextContent("2/7");
  });

  it("shows unit choices and the kilogram-to-gram conversion without printing the requested answer", () => {
    const choiceQuestion = QUESTIONS.find((item) => item.skillId === "math-measurement-units" && /length of a pencil/i.test(item.prompt));
    const conversionQuestion = QUESTIONS.find((item) => item.skillId === "math-measurement-units" && /5 kilograms is equal/i.test(item.prompt));
    const additionQuestion = QUESTIONS.find((item) => item.skillId === "math-measurement-units" && /3 kg plus 2 kg/i.test(item.prompt));
    expect(choiceQuestion).toBeDefined();
    expect(conversionQuestion).toBeDefined();
    expect(additionQuestion).toBeDefined();
    const { unmount } = render(<MathTool question={choiceQuestion!} />);
    expect(screen.getByTestId("unit-cards")).toBeInTheDocument();
    expect(screen.getByText("centimetres")).toBeInTheDocument();
    unmount();
    const { unmount: unmountConversion } = render(<MathTool question={conversionQuestion!} />);
    expect(screen.getByTestId("unit-conversion")).toBeInTheDocument();
    expect(screen.getByText("5 kg")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.getByText(/1000 g/)).toBeInTheDocument();
    unmountConversion();
    render(<MathTool question={additionQuestion!} />);
    expect(screen.getByTestId("unit-quantities")).toBeInTheDocument();
    expect(screen.queryByTestId("unit-conversion")).not.toBeInTheDocument();
  });

  it("shows the money amount from the question but not the cent answer", () => {
    const amountQuestion = QUESTIONS.find((item) => item.skillId === "math-money" && /\$3.50 is how many cents/i.test(item.prompt));
    const compareQuestion = QUESTIONS.find((item) => item.skillId === "math-money" && /\$6.10 than \$5.85/i.test(item.prompt));
    expect(amountQuestion).toBeDefined();
    expect(compareQuestion).toBeDefined();
    const { unmount } = render(<MathTool question={amountQuestion!} />);
    expect(screen.getByText("$3.50")).toBeInTheDocument();
    expect(screen.getByText("? cents")).toBeInTheDocument();
    expect(screen.queryByText("350 cents")).not.toBeInTheDocument();
    unmount();
    render(<MathTool question={compareQuestion!} />);
    expect(screen.getByText("$6.10")).toBeInTheDocument();
    expect(screen.getByText("$5.85")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.queryByText("25¢")).not.toBeInTheDocument();
  });

  it("shows a number bond for a number-bond question", () => {
    const question = QUESTIONS.find((item) => item.template === "number-bond");
    expect(question).toBeDefined();
    render(<MathTool question={question!} />);
    expect(screen.getByText(/Number bond/)).toBeInTheDocument();
    expect(screen.getByText("part + part = whole")).toBeInTheDocument();
  });

  it("shows handwriting progress and lets a parent narrow the learning level", async () => {
    const pinSalt = "scope-and-writing-salt";
    const child = createChildProfile("小笔", "star", new Date("2026-11-20T00:00:00Z"));
    child.handwriting["人"] = {
      character: "人",
      lastCompletedAt: "2026-11-20T01:00:00.000Z",
      bestMistakes: 1,
      attempts: 1
    };
    saveHousehold({
      version: 4,
    uiLocale: "zh",
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

    expect(screen.getByText("写字练习")).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 100/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("小笔的学习年级"), { target: { value: "P1" } });
    await waitFor(async () => {
      const saved = await savedHousehold();
      const enabled = saved.children[0].settings.enabledSkills;
      const p2Ids = SKILLS.filter((skill) => skill.gradeBand === "P2").map((skill) => skill.id);
      expect(enabled).toContain("math-count-100");
      expect(enabled).not.toContain("math-place-value-1000");
      expect(enabled.every((skillId) => !p2Ids.includes(skillId))).toBe(true);
    });
  });

  it("requires the parent PIN again after the app reloads", async () => {
    const pinSalt = "test-salt";
    saveHousehold({
      version: 4,
    uiLocale: "zh",
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

  it("runs a five-question ladder diagnostic and stores the child result", async () => {
    render(<App />);
    await createFamilyWithChild("小安");
    fireEvent.click(screen.getByRole("button", { name: /小安/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Mathematics starting check/ })).toBeInTheDocument());

    for (let index = 0; index < 5; index += 1) {
      await answerCurrentQuestion();
      fireEvent.click(screen.getByRole("button", { name: "Next question" }));
    }
    await waitFor(() => expect(screen.getByRole("heading", { name: /starting check complete/ })).toBeInTheDocument());
    const saved = await savedHousehold();
    expect(saved.children[0].diagnostics.math).toBeDefined();
    expect(saved.children[0].attempts).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "Back to learning" }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Mathematics practice" })).toBeInTheDocument());
  });

  it("builds and completes a stored daily plan after the placement check", async () => {
    render(<App />);
    await createFamilyWithChild("小芽");
    fireEvent.click(screen.getByRole("button", { name: /小芽/ }));
    expect(screen.getAllByText("先做 5 题，找找起点").length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    await finishCurrentRound(5);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Mathematics starting check complete" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Back to learning" }));

    const mathCard = screen.getByRole("button", { name: "数学 Math" });
    expect(mathCard).toHaveTextContent("先热身，再学 1 个新的");
    expect(mathCard).toHaveTextContent("现在在：");
    fireEvent.click(mathCard);
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    const active = (await savedHousehold()).children[0].activeSessions.math;
    if (!active) throw new Error("Expected an active daily session");
    expect(active.dailyPlan?.items).toHaveLength(8);
    expect(active.plannedQuestionIds).toHaveLength(8);

    await finishCurrentRound(8);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Mathematics practice complete" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Back to learning" }));
    const completedMathCard = screen.getByRole("button", { name: "数学 Math" });
    expect(completedMathCard).toHaveTextContent("今天完成了");
    expect(completedMathCard).not.toHaveTextContent(/本周|本週|隔天/);
    const saved = await savedHousehold();
    expect(saved.children[0].sessions[1].dailyPlan?.items).toHaveLength(8);
    expect(saved.children[0].sessions[1].completedAt).not.toBeNull();
  });

  it("starts a new child with zero growth stars and awards two after the first round", async () => {
    render(<App />);
    await createFamilyWithChild("小星");
    const before = await savedHousehold();
    expect(before.children[0].rewards.lifetimeStars).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /小星/ }));
    expect(screen.getByRole("button", { name: "打开伙伴兑换商城" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    await finishCurrentRound();

    await waitFor(() => expect(screen.getByRole("heading", { name: "Mathematics starting check complete" })).toBeInTheDocument());
    expect(screen.getByText("+2 growth stars")).toBeInTheDocument();
    expect(screen.getByText("2 growth stars in total")).toBeInTheDocument();
    const saved = await savedHousehold();
    expect(saved.children[0].rewards.lifetimeStars).toBe(2);
    expect(saved.children[0].rewards.awardedEventKeys).toEqual([`session-complete:${saved.children[0].sessions[0].id}`]);
  });

  it("lets a parent hide rewards and companion animations from the child surface", async () => {
    const pinSalt = "reward-settings-salt";
    const child = createChildProfile("小静", "star", new Date("2026-11-20T00:00:00Z"));
    saveHousehold({
      version: 4,
    uiLocale: "zh",
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

    fireEvent.click(screen.getByLabelText("奖励与成长星"));
    await waitFor(async () => expect((await savedHousehold()).children[0].settings.rewardsEnabled).toBe(false));
    fireEvent.click(screen.getByLabelText("伙伴动画"));
    await waitFor(async () => expect((await savedHousehold()).children[0].settings.companionAnimationsEnabled).toBe(false));

    await closeParentSettings();
    fireEvent.click(screen.getByRole("button", { name: /小静/ }));
    expect(screen.queryByRole("button", { name: "打开伙伴兑换商城" })).not.toBeInTheDocument();
  });

  it("redeems a companion manually and then lets the child select it", async () => {
    const pinSalt = "companion-shop-salt";
    const child = createChildProfile("小豆", "star", new Date("2026-11-20T00:00:00Z"));
    child.rewards.lifetimeStars = 10;
    saveHousehold({
      version: 4,
    uiLocale: "zh",
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
    fireEvent.click(screen.getByRole("button", { name: /小豆/ }));
    fireEvent.click(screen.getByRole("button", { name: "打开伙伴兑换商城" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "我的学习伙伴" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "兑换" }));
    fireEvent.click(screen.getByRole("button", { name: "确认兑换" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "让豆豆陪我" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "让豆豆陪我" }));
    await waitFor(async () => expect((await savedHousehold()).children[0].rewards.activeCompanionId).toBe("gemini-doudou"));
    const saved = await savedHousehold();
    expect(saved.children[0].rewards.lifetimeStars).toBe(10);
    expect(saved.children[0].rewards.redeemedCompanionIds).toEqual(["gemini-doudou"]);
  });

  it("records one incorrect attempt when a child finishes a matching question after a mismatch", async () => {
    render(<App />);
    await createFamilyWithChild("小禾");
    fireEvent.click(screen.getByRole("button", { name: /小禾/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    expect(document.querySelector(".quiz-layout")).toHaveClass("quiz-match");
    const question = await answerCurrentQuestion(false);
    expect(question.kind).toBe("match");
    expect(screen.getByTestId("answer-feedback")).toHaveClass("wrong-feedback");
    expect(screen.getByTestId("answer-feedback")).toHaveTextContent("mix-up");
    const saved = await savedHousehold();
    expect(saved.children[0].attempts).toHaveLength(1);
    expect(saved.children[0].attempts[0].correct).toBe(false);
  });

  it("renders the English listening game as audio plus picture choices", async () => {
    const pinSalt = "listening-game-salt";
    const child = createChildProfile("小音", "star", new Date("2026-11-20T00:00:00Z"));
    child.diagnostics.english = { completedAt: "2026-11-20T00:00:00Z", sessionId: "setup" };
    child.evidence["english-letters"] = {
      ...child.evidence["english-letters"],
      independentCorrect: 2,
      nEff: 2,
      pKnown: 0.9,
      dueAt: "2026-12-20T00:00:00.000Z"
    };
    for (const skillId of ["english-phonics", "english-sight-words", "english-vocabulary"]) {
      child.evidence[skillId] = {
        ...child.evidence[skillId],
        independentCorrect: 2,
        nEff: 2,
        pKnown: 0.9,
        dueAt: "2026-12-20T00:00:00.000Z"
      };
    }
    saveHousehold({
      version: 4,
    uiLocale: "zh",
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
    fireEvent.click(screen.getByRole("button", { name: /小音/ }));
    fireEvent.click(screen.getByRole("button", { name: "英语 English" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    const listeningQuestions = QUESTIONS.filter((question) => question.skillId === "english-listening" && question.kind === "choice" && question.audioOnly);
    expect(listeningQuestions).toHaveLength(19);
    const listeningQuestion = listeningQuestions[0];
    expect(listeningQuestion).toBeDefined();
    if (!listeningQuestion || listeningQuestion.kind !== "choice") return;
    expect(listeningQuestion.options).toHaveLength(3);
    expect(Object.keys(listeningQuestion.optionImages ?? {})).toHaveLength(3);
    expect(AUDIO_ASSETS[listeningQuestion.audioText!]).toBeTruthy();
    expect(screen.getByRole("button", { name: "Listen" })).toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByRole("heading", { name: "孩子学习情况" })).toBeInTheDocument());
  });

  it("lets a parent change session length and reset one subject", async () => {
    const pinSalt = "parent-settings-salt";
    const child = createChildProfile("小树", "leaf", new Date("2026-11-20T00:00:00Z"));
    child.diagnostics.math = { completedAt: "2026-11-20T01:00:00Z", sessionId: "old-session" };
    saveHousehold({
      version: 4,
    uiLocale: "zh",
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
    await waitFor(() => expect(screen.getByRole("heading", { name: "孩子学习情况" })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("小树的每轮题数"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "重新评估数学" }));
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
      version: 4,
    uiLocale: "zh",
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
    await waitFor(() => expect(screen.getByRole("heading", { name: "孩子学习情况" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "重新评估数学" }));
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
      version: 4,
    uiLocale: "zh",
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
    expect(screen.getByRole("button", { name: "导出答题记录" })).toBeInTheDocument();
    expect(screen.getByText(/课程参考 4 份新加坡教育部（MOE）资料，覆盖 44 条学习目标；0 条游戏内容还在补充，5 条书写目标暂不纳入，8 个知识点为课外补充/)).toBeInTheDocument();
    expect(screen.getByText(/尚未逐条人工复核/)).toBeInTheDocument();
  });

  it("shows independent versions and lets a parent edit, adapt and delete a child profile", async () => {
    const pinSalt = "profile-admin-salt";
    const child = createChildProfile("小树", "leaf", new Date("2026-11-20T00:00:00Z"));
    saveHousehold({
      version: 4,
    uiLocale: "zh",
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
    expect(screen.getByText(/版本 0\.9\.0/)).toBeInTheDocument();
    expect(screen.getByText(/内容 pilot-23/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/本机家庭数据/)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText("高对比"));
    await waitFor(async () => expect((await savedHousehold()).children[0].settings.highContrast).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: "修改档案" }));
    fireEvent.change(screen.getByLabelText("孩子的名字"), { target: { value: "小树新" } });
    fireEvent.change(screen.getByLabelText("孩子年龄"), { target: { value: "5" } });
    expect(screen.getByLabelText("在读年级")).toHaveValue("K2");
    fireEvent.click(screen.getByRole("button", { name: "花朵头像" }));
    fireEvent.click(screen.getByRole("button", { name: "保存档案" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "小树新" })).toBeInTheDocument());
    const edited = (await savedHousehold()).children[0];
    expect(edited.gradeLevel).toBe("K2");
    expect(edited.birthYear).toBe(new Date().getFullYear() - 5);
    fireEvent.click(screen.getByRole("button", { name: "删除孩子" }));
    await waitFor(() => expect(screen.getByText("还没有孩子档案。先添加一个孩子。")).toBeInTheDocument());
    expect((await savedHousehold()).children).toHaveLength(0);
  });

  it("applies parent-managed high contrast and large text settings on the child surface", async () => {
    const pinSalt = "display-settings-salt";
    const child = createChildProfile("小星", "star", new Date("2026-11-20T00:00:00Z"));
    child.settings.highContrast = true;
    child.settings.largeText = true;
    saveHousehold({
      version: 4,
    uiLocale: "zh",
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
    fireEvent.click(screen.getByRole("button", { name: /小星/ }));
    expect(document.querySelector(".child-high-contrast")).toBeInTheDocument();
    expect(document.querySelector(".child-large-text")).toBeInTheDocument();
  });

  it("restores an interrupted diagnostic after reload without repeating the answered question", async () => {
    const first = render(<App />);
    await createFamilyWithChild("小树");
    fireEvent.click(screen.getByRole("button", { name: /小树/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
    const prompt = screen.getByTestId("question-prompt").textContent;
    const question = await answerCurrentQuestion();
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
    expect(question.subject).toBe("math");
    first.unmount();

    render(<App />);
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByText("今天谁来学习？")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /小树/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByText("1 / 5")).toBeInTheDocument());
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

    for (let index = 0; index < 5; index += 1) {
      await answerCurrentQuestion();
      if (index < 4) {
        fireEvent.click(screen.getByRole("button", { name: "Next question" }));
        await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());
      }
    }

    const next = screen.getByRole("button", { name: "Next question" });
    fireEvent.click(next);
    fireEvent.click(next);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Mathematics starting check complete" })).toBeInTheDocument());
    const saved = await savedHousehold();
    expect(saved.children[0].attempts).toHaveLength(5);
    expect(saved.children[0].sessions).toHaveLength(1);
    expect(saved.children[0].rewards.lifetimeStars).toBe(2);
    expect(saved.children[0].rewards.awardedEventKeys).toHaveLength(1);
    expect(saved.children[0].activeSessions.math).toBeUndefined();
  });

  it("does not acknowledge an answer until the encrypted write succeeds", async () => {
    render(<App />);
    await createFamilyWithChild("小安");
    fireEvent.click(screen.getByRole("button", { name: /小安/ }));
    fireEvent.click(screen.getByRole("button", { name: "数学 Math" }));
    await waitFor(() => expect(screen.getByTestId("question-prompt")).toBeInTheDocument());

    const question = currentQuestion();
    const writeSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    if (question.kind === "choice") {
      fireEvent.click(screen.getByRole("button", { name: question.correctAnswer }));
    } else if (question.kind === "match") {
      for (const pair of question.pairs) await tapMatchPair(pair.id);
    }
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("没有保存成功"));
    expect(screen.queryByTestId("answer-feedback")).not.toBeInTheDocument();
    expect(screen.getByText("0 / 5")).toBeInTheDocument();

    writeSpy.mockRestore();
    if (question.kind === "choice") {
      fireEvent.click(screen.getByRole("button", { name: question.correctAnswer }));
    } else {
      fireEvent.click(screen.getByRole("button", { name: "Save again" }));
    }
    await waitFor(() => expect(screen.getByTestId("answer-feedback")).toBeInTheDocument());
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
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
      version: 4 as const,
      householdName: "秘密学习岛",
      parentName: "妈妈",
      uiLocale: "zh" as const,
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

  it("remembers English on the encrypted unlock screen", async () => {
    const child = createChildProfile("加密孩子", "moon", new Date("2026-11-20T00:00:00Z"));
    const household = {
      version: 4 as const,
      householdName: "Secret island",
      parentName: "Mummy",
      uiLocale: "en" as const,
      pinHash: await hashPin("2468", "secure-salt"),
      pinSalt: "secure-salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    };
    const sealed = await createEncryptedHousehold(household, "2468");
    expect(sealed.envelope.uiLocale).toBe("en");
    expect(writeEncryptedEnvelope(sealed.envelope).ok).toBe(true);
    render(<App />);
    expect(screen.getByRole("heading", { name: "Enter the parent PIN" })).toBeInTheDocument();
    expect(screen.getByLabelText("Parent PIN")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Parent PIN"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "Open family space" }));
    await waitFor(() => expect(screen.getByText("Who is learning today?")).toBeInTheDocument());
  });

  it("offers recovery when an encrypted payload cannot be decrypted", async () => {
    const envelope = {
      format: "little-sprout-secure-v1" as const,
      kdfSalt: "salt",
      iv: "AAAAAAAAAAAAAAAA",
      ciphertext: "broken",
      uiLocale: "zh" as const
    };
    expect(writeEncryptedEnvelope(envelope).ok).toBe(true);
    render(<App />);
    fireEvent.change(screen.getByLabelText("家长密码"), { target: { value: "2468" } });
    fireEvent.click(screen.getByRole("button", { name: "打开家庭学习区" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /下载加密数据并重新开始/ })).toBeInTheDocument());
  });
});
