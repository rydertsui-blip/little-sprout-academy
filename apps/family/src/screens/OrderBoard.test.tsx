import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import OrderBoard from "./OrderBoard";
import type { OrderQuestion } from "../lib/types";

const sampleQuestion: OrderQuestion = {
  id: "q-order-test-1",
  subject: "english",
  skillId: "english-sentence-order",
  kind: "order",
  prompt: "Tap the words in order to make a sentence.",
  instruction: "Tap each word block in the right order.",
  tokens: ["apples.", "I", "like"],
  correctOrder: ["I", "like", "apples."],
  separator: " ",
  explanation: "The correct sentence is “I like apples.”",
  difficulty: 1,
  template: "tap-order-sentence",
  transferLevel: "same-context",
  contextKey: "en-order-apples",
  diagnostic: true,
  reviewStatus: "verified",
  audit: {
    contentVersion: "2026.11.20-moe",
    author: "test",
    sourceRefs: ["test"],
    automatedReview: "passed",
    humanLanguageReview: "pending",
    humanPedagogyReview: "pending",
    provenanceScope: "official-outcome"
  }
};

describe("OrderBoard", () => {
  it("lets a child tap tokens in order, remove a placed token, and submit", () => {
    const onComplete = vi.fn();
    render(<OrderBoard question={sampleQuestion} disabled={false} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: "I" }));
    fireEvent.click(screen.getByRole("button", { name: "apples." }));

    // Remove the second placed token and replace with "like" then "apples."
    const slots = screen.getByLabelText("Selected order").querySelectorAll("button");
    fireEvent.click(slots[1]);

    const bank = screen.getByLabelText("Word bank");
    const bankButtons = Array.from(bank.querySelectorAll("button"));
    fireEvent.click(bankButtons.find((btn) => btn.textContent === "like")!);
    fireEvent.click(bankButtons.find((btn) => btn.textContent === "apples.")!);

    fireEvent.click(screen.getByRole("button", { name: /Check/i }));
    expect(onComplete).toHaveBeenCalledWith(true, "I like apples.");
  });
});
