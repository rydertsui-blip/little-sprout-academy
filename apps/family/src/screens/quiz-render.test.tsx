import { cleanup, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuizScreen } from "../App";
import { QUESTIONS } from "../content/catalog";

describe("all question render smoke", () => {
  it("renders every one of the 799 questions without throwing", () => {
    expect(QUESTIONS.length).toBe(799);
    for (const question of QUESTIONS) {
      const { container, unmount } = render(
        <QuizScreen
          question={question}
          feedback={null}
          onAnswer={async () => true}
          onNext={() => {}}
          isNewSkill={false}
        />
      );
      const prompt = container.querySelector('[data-testid="question-prompt"]');
      expect(prompt, question.id).toBeTruthy();
      expect(prompt?.textContent, question.id).toBe(question.prompt);
      if (question.kind === "choice") {
        expect(container.querySelectorAll(".answer-option").length, question.id).toBe(3);
      }
      if (question.kind === "match") {
        expect(container.querySelectorAll('[data-match-side="left"]').length, question.id).toBe(question.pairs.length);
        expect(container.querySelectorAll('[data-match-side="right"]').length, question.id).toBe(question.pairs.length);
      }
      unmount();
      cleanup();
    }
  }, 15000);
});
