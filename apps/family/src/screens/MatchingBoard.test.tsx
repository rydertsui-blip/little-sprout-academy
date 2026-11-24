import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MatchQuestion } from "../lib/types";
import MatchingBoard from "./MatchingBoard";

const question: MatchQuestion = {
  id: "test-match",
  subject: "math",
  skillId: "math-count-100",
  kind: "match",
  prompt: "Match each number.",
  instruction: "Tap a number, then its partner.",
  explanation: "The pairs are 2 and two, 3 and three, 4 and four.",
  difficulty: 1,
  template: "test-match",
  transferLevel: "same-context",
  contextKey: "test-match",
  diagnostic: false,
  reviewStatus: "verified",
  audit: {
    contentVersion: "test",
    author: "test",
    sourceRefs: ["test"],
    automatedReview: "passed",
    humanLanguageReview: "pending",
    humanPedagogyReview: "pending",
    provenanceScope: "official-outcome"
  },
  leftLabel: "Number",
  rightLabel: "Word",
  pairs: [
    { id: "pair-2", left: "2", right: "two" },
    { id: "pair-3", left: "3", right: "three" },
    { id: "pair-4", left: "4", right: "four" }
  ]
};

function left(id: string) {
  return document.querySelector(`[data-match-side="left"][data-pair-id="${id}"]`) as HTMLButtonElement;
}

function right(id: string) {
  return document.querySelector(`[data-match-side="right"][data-pair-id="${id}"]`) as HTMLButtonElement;
}

describe("tap matching board", () => {
  it("keeps a wrong pair retryable and records the completed question once", async () => {
    const onComplete = vi.fn().mockResolvedValue(true);
    render(<MatchingBoard question={question} disabled={false} onComplete={onComplete} />);

    fireEvent.click(left("pair-2"));
    await waitFor(() => expect(right("pair-3")).not.toBeDisabled());
    fireEvent.click(right("pair-3"));
    expect(screen.getByRole("status")).toHaveTextContent("These two do not match");
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(right("pair-2"));
    for (const pair of question.pairs.slice(1)) {
      fireEvent.click(left(pair.id));
      await waitFor(() => expect(right(pair.id)).not.toBeDisabled());
      fireEvent.click(right(pair.id));
    }
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith(false, 1);
  });

  it("reports a first-try completion and prevents duplicate completion calls", async () => {
    const onComplete = vi.fn().mockResolvedValue(true);
    render(<MatchingBoard question={question} disabled={false} onComplete={onComplete} />);

    for (const pair of question.pairs) {
      fireEvent.click(left(pair.id));
      await waitFor(() => expect(right(pair.id)).not.toBeDisabled());
      fireEvent.click(right(pair.id));
    }
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith(true, 0);
  });

  it("offers a save retry without double-counting a failed write", async () => {
    const onComplete = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(<MatchingBoard question={question} disabled={false} onComplete={onComplete} />);

    for (const pair of question.pairs) {
      fireEvent.click(left(pair.id));
      await waitFor(() => expect(right(pair.id)).not.toBeDisabled());
      fireEvent.click(right(pair.id));
    }
    await waitFor(() => expect(screen.getByRole("button", { name: "Save again" })).toBeInTheDocument());
    expect(onComplete).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Save again" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2));
  });
});

