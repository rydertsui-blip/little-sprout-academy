import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QUESTIONS, SKILLS } from "../content/catalog";
import { ENGLISH_HANDWRITING_ITEMS } from "../content/englishHandwriting";
import { createChildProfile } from "../lib/profile";
import HandwritingScreen from "./HandwritingScreen";
import MistakeNotebookScreen from "./MistakeNotebookScreen";

describe("English 4-Line Handwriting, Extracurricular Enrichment Packs & Mistake/Worksheet Studio", () => {
  it("includes 36 graded English 4-line handwriting items (26 A-Z letter pairs + 10 CVC words) and traces strokes", () => {
    expect(ENGLISH_HANDWRITING_ITEMS.length).toBe(36);
    const letters = ENGLISH_HANDWRITING_ITEMS.filter((item) => item.kind === "letter");
    const words = ENGLISH_HANDWRITING_ITEMS.filter((item) => item.kind === "word");
    expect(letters.length).toBe(26);
    expect(words.length).toBe(10);

    const child = createChildProfile("小芽", "star", new Date(), 7, "P1");
    const onRecord = vi.fn().mockResolvedValue(true);

    render(
      <HandwritingScreen
        child={child}
        initialScriptMode="english"
        onBack={() => {}}
        onLock={() => {}}
        onRecord={onRecord}
      />
    );

    expect(screen.getByLabelText("Aa 四线三格描红区")).toBeInTheDocument();
    const strokeBtn = screen.getByTestId("english-trace-stroke-btn");
    expect(strokeBtn).toBeInTheDocument();

    // Aa has 5 strokes in diag style
    for (let i = 0; i < ENGLISH_HANDWRITING_ITEMS[0].strokes.length; i += 1) {
      fireEvent.click(screen.getByTestId("english-trace-stroke-btn"));
    }
    expect(onRecord).toHaveBeenCalledWith({ character: "en-A" }, 0);
  });

  it("registers the 3 extracurricular enrichment skill packs with 18 questions each (54 total)", () => {
    const enrichmentIds = [
      "math-olympiad-reasoning",
      "mandarin-idioms-classics",
      "english-science-nature"
    ];
    for (const id of enrichmentIds) {
      const skill = SKILLS.find((s) => s.id === id);
      expect(skill).toBeDefined();
      expect(skill?.provenanceScope).toBe("supplementary-practice");
      const skillQuestions = QUESTIONS.filter((q) => q.skillId === id);
      expect(skillQuestions.length).toBe(18);
      const kinds = new Set(skillQuestions.map((q) => q.kind));
      expect(kinds.has("choice")).toBe(true);
      expect(kinds.has("match")).toBe(true);
      expect(kinds.has("order")).toBe(true);
    }
  });

  it("renders MistakeNotebookScreen with historical wrong answers, launches a 6-question booster, and previews A4 printable worksheets", () => {
    const child = createChildProfile("小星", "star", new Date(), 7, "P2");
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

    expect(screen.getByTestId("mistake-history-list")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("start-booster-btn"));
    expect(onStartBooster).toHaveBeenCalledTimes(1);
    expect(onStartBooster.mock.calls[0][0]).toBe("math");
    expect(onStartBooster.mock.calls[0][1].length).toBe(6);

    // Switch to Printable A4 Worksheet tab
    fireEvent.click(screen.getByRole("tab", { name: /一键打印 A4/ }));
    expect(screen.getByTestId("a4-printable-sheet")).toBeInTheDocument();
    expect(screen.getByText(/华文高频字米字格描红练习卷/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /英文四线三格字母与单词字帖/ }));
    expect(screen.getByText(/英文四线三格字母与自然拼读字帖/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /数学口算与思维巩固练习卷/ }));
    expect(screen.getByText(/数学口算与奥数思维巩固练习卷/)).toBeInTheDocument();
  });
});
