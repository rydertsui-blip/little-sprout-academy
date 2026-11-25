import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QUESTIONS } from "../content/catalog";
import type { MatchQuestion } from "../lib/types";
import MatchingBoard from "./MatchingBoard";
import { playOrSpeak } from "../lib/audio";

vi.mock("../lib/audio", () => ({ playOrSpeak: vi.fn() }));

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
  beforeEach(() => vi.clearAllMocks());
  it("shows the right column as locked until a left card is chosen, then ready", async () => {
    const onComplete = vi.fn().mockResolvedValue(true);
    render(<MatchingBoard question={question} disabled={false} onComplete={onComplete} />);

    const firstRight = right("pair-2");
    expect(firstRight).toBeDisabled();
    expect(firstRight).toHaveClass("is-locked");
    expect(firstRight).not.toHaveClass("is-ready");
    expect(firstRight).toHaveAccessibleName(/First choose a left card, choose two/);

    fireEvent.click(left("pair-2"));
    await waitFor(() => expect(firstRight).not.toBeDisabled());
    expect(firstRight).toHaveClass("is-ready");
    expect(firstRight).not.toHaveClass("is-locked");
  });

  it("plays a spoken word when its hidden left card is selected and shows a picture on the right", async () => {
    const listening = QUESTIONS.find((item) => item.id === "q-match-english-15") as MatchQuestion;
    const onComplete = vi.fn().mockResolvedValue(true);
    render(<MatchingBoard question={listening} disabled={false} onComplete={onComplete} />);

    const firstLeft = left("q-match-english-15-p1");
    expect(firstLeft).toHaveAccessibleName("play spoken word 1");
    expect(firstLeft).not.toHaveTextContent("apple");
    expect(firstLeft).toHaveTextContent("Listen 1");
    expect(right("q-match-english-15-p1").querySelector("img")?.getAttribute("src")).toBe("./assets/images/apple.png");

    fireEvent.click(firstLeft);
    expect(playOrSpeak).toHaveBeenCalledWith("apple", "en-US", expect.any(Function));
    expect(screen.getByRole("status")).toHaveTextContent("Word 1 selected");
    expect(screen.getByRole("status")).not.toHaveTextContent("apple");

    for (const pair of listening.pairs) {
      fireEvent.click(left(pair.id));
      await waitFor(() => expect(right(pair.id)).not.toBeDisabled());
      fireEvent.click(right(pair.id));
    }
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true, 0));
  });

  it("localizes the audio-first picture match into Mandarin", async () => {
    const listening = QUESTIONS.find((item) => item.id === "q-match-mandarin-2") as MatchQuestion;
    const onComplete = vi.fn().mockResolvedValue(true);
    render(<MatchingBoard question={listening} disabled={false} onComplete={onComplete} />);

    const firstLeft = left("q-match-mandarin-2-p1");
    expect(firstLeft).toHaveAccessibleName("播放第 1 个词语");
    expect(firstLeft).toHaveTextContent("听 1");
    expect(firstLeft).not.toHaveTextContent("猫");
    expect(right("q-match-mandarin-2-p1").querySelector("img")?.getAttribute("src")).toBe("./assets/images/cat.png");

    fireEvent.click(firstLeft);
    expect(playOrSpeak).toHaveBeenCalledWith("猫", "zh-CN", expect.any(Function));
    expect(screen.getByRole("status")).toHaveTextContent("第 1 个词已选择");
    expect(screen.getByRole("status")).not.toHaveTextContent("猫");

    for (const pair of listening.pairs) {
      fireEvent.click(left(pair.id));
      await waitFor(() => expect(right(pair.id)).not.toBeDisabled());
      fireEvent.click(right(pair.id));
    }
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true, 0));
  });

  it("turns a failed listening audio into a retryable visible error", async () => {
    const listening = QUESTIONS.find((item) => item.id === "q-match-english-15") as MatchQuestion;
    const onComplete = vi.fn().mockResolvedValue(true);
    render(<MatchingBoard question={listening} disabled={false} onComplete={onComplete} />);

    const firstLeft = left("q-match-english-15-p1");
    fireEvent.click(firstLeft);
    const callback = vi.mocked(playOrSpeak).mock.calls[0][2]!;
    await act(async () => callback("error"));

    expect(firstLeft).toHaveClass("is-audio-error");
    expect(firstLeft).toHaveTextContent("Try again");
    expect(firstLeft).toHaveAccessibleName(/Audio could not play/);

    fireEvent.click(firstLeft);
    expect(playOrSpeak).toHaveBeenCalledTimes(2);
    expect(firstLeft).not.toHaveClass("is-audio-error");
  });

  it("plays a heard answer before its question in Mandarin", async () => {
    const listening = QUESTIONS.find((item) => item.id === "q-match-mandarin-1") as MatchQuestion;
    const onComplete = vi.fn().mockResolvedValue(true);
    render(<MatchingBoard question={listening} disabled={false} onComplete={onComplete} />);

    const firstLeft = left("q-match-mandarin-1-p1");
    expect(firstLeft).toHaveAccessibleName("播放第 1 个答案");
    expect(firstLeft).toHaveTextContent("听 1");
    expect(firstLeft).not.toHaveTextContent("小明");
    expect(right("q-match-mandarin-1-p1").querySelector("img")).toBeNull();

    fireEvent.click(firstLeft);
    expect(playOrSpeak).toHaveBeenCalledWith("小明", "zh-CN", expect.any(Function));
    expect(screen.getByRole("status")).toHaveTextContent("第 1 个答案已选择");
    expect(screen.getByRole("status")).not.toHaveTextContent("小明");

    for (const pair of listening.pairs) {
      fireEvent.click(left(pair.id));
      await waitFor(() => expect(right(pair.id)).not.toBeDisabled());
      fireEvent.click(right(pair.id));
    }
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true, 0));
  });

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
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
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

