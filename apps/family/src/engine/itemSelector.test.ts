import { describe, expect, it } from "vitest";
import { getQuestionsForSubject } from "../content/catalog";
import { createChildProfile } from "../lib/profile";
import { selectDiverseQuestion } from "./itemSelector";
import { createAdaptiveSession, recordSessionAnswer, selectNextQuestion } from "./session";

describe("diverse item selector", () => {
  it("prefers an unseen family and transfer question over a repeated family", () => {
    const child = createChildProfile("小星", "star");
    const evidence = child.evidence["math-count-100"];
    evidence.diversity.templateFamilies = { "place-value": 4 };
    evidence.diversity.responseModes["tap-choice"] = 4;
    evidence.diversity.contextKeys = ["place-value"];
    const candidates = getQuestionsForSubject("math").filter((question) => question.skillId === "math-count-100" && !question.id.includes("1"));
    const selected = selectDiverseQuestion({
      candidates,
      evidence,
      recentFamilies: ["place-value", "place-value"],
      recentModes: ["tap-choice", "tap-choice"],
      targetDifficulty: 2,
      predictedSuccess: 0.8,
      tieKey: "child:session"
    });
    expect(selected?.template).not.toBe("place-value");
  });

  it("is deterministic for the same child, session and candidate set", () => {
    const child = createChildProfile("小月", "moon");
    const session = createAdaptiveSession(child, "english", new Date("2026-11-20T10:00:00Z"), { kind: "practice", length: 6 });
    expect(selectNextQuestion(child, session)?.id).toBe(selectNextQuestion(child, session)?.id);
  });

  it("does not choose three consecutive questions from the same template", () => {
    const child = createChildProfile("小安", "star", new Date("2026-11-20T10:00:00Z"));
    child.diagnostics.math = { completedAt: "2026-11-20T09:00:00Z", sessionId: "setup" };
    let session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"), { kind: "practice", length: 6 });
    const templates: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const question = selectNextQuestion(child, session)!;
      templates.push(question.template);
      session = recordSessionAnswer(child, session, { questionId: question.id, correct: true, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    }
    expect(templates[2]).not.toBe(templates[0]);
    expect(`${templates[0]}-${templates[1]}-${templates[2]}`).not.toBe(`${templates[0]}-${templates[0]}-${templates[0]}`);
  });
});
