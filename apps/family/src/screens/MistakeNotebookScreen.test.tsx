import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QUESTIONS } from "../content/catalog";
import { createChildProfile } from "../lib/profile";
import HandwritingScreen from "./HandwritingScreen";
import { LanguageTool } from "./LanguageTool";
import { MathTool } from "./MathTool";
import MistakeNotebookScreen from "./MistakeNotebookScreen";
import { StreakBadgeWall } from "./StreakBadgeWall";

describe("MistakeNotebookScreen, A4 dynamic generator, enrichment tools & StreakBadgeWall", () => {
  it("renders historical mistakes, curated enrichment boosters, and dynamic A4 printable worksheets with random page rotation", () => {
    const child = createChildProfile("小芽", "star");
    child.attempts.push({
      id: "att-1",
      childId: child.id,
      questionId: "q-math-olympiad-reasoning-1",
      skillId: "math-olympiad-reasoning",
      subject: "math",
      correct: false,
      hintUsed: true,
      createdAt: new Date().toISOString(),
      sessionId: "sess-1"
    });

    const onStartBooster = vi.fn();
    render(
      <MistakeNotebookScreen
        child={child}
        onBack={() => {}}
        onLock={() => {}}
        onStartBooster={onStartBooster}
      />
    );

    expect(screen.getByText("我的错题本与打印练习卷")).toBeInTheDocument();
    expect(screen.getByTestId("mistake-history-list")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("start-booster-btn"));
    expect(onStartBooster).toHaveBeenCalledTimes(1);
    expect(onStartBooster.mock.calls[0][1]).toHaveLength(6);

    // Switch to Printable A4 Worksheet tab
    fireEvent.click(screen.getByRole("tab", { name: /一键打印 A4 描红与口算练习卷/ }));
    expect(screen.getByTestId("a4-printable-sheet")).toBeInTheDocument();
    expect(screen.getByText(/华文高频字米字格描红练习卷/)).toBeInTheDocument();

    // Test random page shuffle button
    const shuffleBtn = screen.getByTestId("shuffle-worksheet-btn");
    expect(shuffleBtn).toHaveTextContent("第 1 套");
    fireEvent.click(shuffleBtn);
    expect(shuffleBtn).toHaveTextContent("第 2 套");

    // Switch to English 4-line worksheet
    fireEvent.click(screen.getByRole("button", { name: /2\. 英文四线三格字母与单词字帖/ }));
    expect(screen.getByText(/英文四线三格字母与自然拼读字帖/)).toBeInTheDocument();

    // Switch to Math drill worksheet
    fireEvent.click(screen.getByRole("button", { name: /3\. 数学口算与思维巩固练习卷/ }));
    expect(screen.getByText(/数学口算与奥数思维巩固练习卷/)).toBeInTheDocument();
    expect(screen.getByText(/家长核对参考答案/)).toBeInTheDocument();
    expect(document.querySelectorAll("input, textarea, [contenteditable='true']")).toHaveLength(0);
  });

  it("switches between Chinese Rice-Grid (100 chars) and English 4-Line Grid (36 items) in HandwritingScreen", () => {
    const child = createChildProfile("小芽", "star");
    const onRecord = vi.fn().mockResolvedValue(true);

    render(
      <HandwritingScreen
        child={child}
        onBack={() => {}}
        onLock={() => {}}
        onRecord={onRecord}
      />
    );

    expect(screen.getByRole("tab", { name: /华文米字格/ })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: /英文四线三格 A-Z 与单词/ }));
    expect(screen.getByRole("tab", { name: /英文四线三格 A-Z 与单词/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("english-four-line-canvas")).toBeInTheDocument();

    for (let step = 0; step < 6; step += 1) {
      const traceBtn = screen.queryByTestId("english-trace-stroke-btn");
      if (traceBtn) fireEvent.click(traceBtn);
    }
    expect(onRecord).toHaveBeenCalled();
  });

  it("renders dedicated visual manipulatives for Olympiad reasoning, Chinese idioms/poems, and English science", () => {
    const olympiadBalance = QUESTIONS.find((q) => q.id === "q-math-olympiad-reasoning-1")!;
    const olympiadQueue = QUESTIONS.find((q) => q.id === "q-math-olympiad-reasoning-3")!;
    const olympiadBackwards = QUESTIONS.find((q) => q.id === "q-math-olympiad-reasoning-5")!;
    const idiomQuestion = QUESTIONS.find((q) => q.id === "q-mandarin-idioms-classics-1")!;
    const poemQuestion = QUESTIONS.find((q) => q.id === "q-mandarin-idioms-classics-11")!;
    const scienceQuestion = QUESTIONS.find((q) => q.id === "q-english-science-nature-1")!;

    const { unmount: u1 } = render(<MathTool question={olympiadBalance} />);
    expect(screen.getByTestId("olympiad-balance-board")).toBeInTheDocument();
    u1();

    const { unmount: u2 } = render(<MathTool question={olympiadQueue} />);
    expect(screen.getByTestId("olympiad-queue-board")).toBeInTheDocument();
    u2();

    const { unmount: u3 } = render(<MathTool question={olympiadBackwards} />);
    expect(screen.getByTestId("olympiad-backwards-board")).toBeInTheDocument();
    u3();

    const { unmount: u4 } = render(<LanguageTool question={idiomQuestion} />);
    expect(screen.getByTestId("idiom-classic-board")).toHaveTextContent("四字成语典故卡");
    u4();

    const { unmount: u5 } = render(<LanguageTool question={poemQuestion} />);
    expect(screen.getByTestId("idiom-classic-board")).toHaveTextContent("《咏鹅》");
    u5();

    const { unmount: u6 } = render(<LanguageTool question={scienceQuestion} />);
    expect(screen.getByTestId("science-nature-board")).toBeInTheDocument();
    u6();
  });

  it("renders the 7-day learning streak calendar and 12 achievement badges wall", () => {
    const child = createChildProfile("小芽", "star");
    child.attempts.push({
      id: "att-1",
      childId: child.id,
      questionId: "q-math-count-100-1",
      skillId: "math-count-100",
      subject: "math",
      correct: true,
      hintUsed: false,
      createdAt: new Date().toISOString(),
      sessionId: "sess-1"
    });
    render(<StreakBadgeWall child={child} locale="zh" />);
    expect(screen.getByTestId("streak-badge-wall")).toBeInTheDocument();
    expect(screen.getByTestId("streak-seven-days").children).toHaveLength(7);
    expect(screen.getByTestId("badge-wall-grid").children).toHaveLength(12);
    expect(screen.getByTestId("badge-card-first-step")).toHaveClass("is-unlocked");

    fireEvent.click(screen.getByTestId("badge-card-first-step"));
    expect(screen.getByTestId("badge-detail-toast")).toHaveTextContent("初登小岛");
  });
});
