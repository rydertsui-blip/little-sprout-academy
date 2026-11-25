import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PinyinTool } from "./PinyinTool";
import * as audio from "../lib/audio";
import type { ChoiceQuestion } from "../lib/types";

function makePinyinQuestion(overrides: Partial<ChoiceQuestion>): ChoiceQuestion {
  return {
    id: "q-pinyin-test",
    subject: "mandarin",
    skillId: "mandarin-tones",
    kind: "choice",
    prompt: "“猫” (māo) 是第几声？",
    instruction: "听一听，选声调。",
    correctAnswer: "第一声",
    options: ["第一声", "第二声", "第三声"],
    explanation: "māo 的声调是第一声。",
    difficulty: 1,
    template: "tone",
    displayCharacter: "猫",
    transferLevel: "same-context",
    contextKey: "test-pinyin",
    diagnostic: true,
    reviewStatus: "verified",
    audit: {
      contentVersion: "2026.11.20-moe",
      author: "test",
      sourceRefs: ["test"],
      automatedReview: "passed",
      humanLanguageReview: "pending",
      humanPedagogyReview: "pending",
      provenanceScope: "official-outcome",
    },
    ...overrides,
  };
}

describe("PinyinTool", () => {
  it("renders the tone coaster for mandarin-tones and plays audio on tap", () => {
    const spy = vi.spyOn(audio, "playOrSpeak").mockImplementation(() => {});
    render(<PinyinTool question={makePinyinQuestion({ skillId: "mandarin-tones" })} />);

    expect(screen.getByTestId("pinyin-tone-coaster")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /第二声/ }));
    expect(spy).toHaveBeenCalledWith("麻", "zh-CN");
    spy.mockRestore();
  });

  it("switches tone coaster demo set to ba when the question tests 妈 or 马", () => {
    const spy = vi.spyOn(audio, "playOrSpeak").mockImplementation(() => {});
    render(<PinyinTool question={makePinyinQuestion({ skillId: "mandarin-tones", displayCharacter: "马", prompt: "“马” (mǎ) 是第几声？" })} />);

    fireEvent.click(screen.getByRole("button", { name: /第一声/ }));
    expect(spy).toHaveBeenCalledWith("八", "zh-CN");
    spy.mockRestore();
  });

  it("renders the interactive blend board for initials/finals/syllables without spoiling the target character", () => {
    const spy = vi.spyOn(audio, "playOrSpeak").mockImplementation(() => {});
    render(
      <PinyinTool
        question={makePinyinQuestion({
          skillId: "mandarin-initials",
          displayCharacter: "猫",
          prompt: "“猫”的声母是哪一个？",
          correctAnswer: "m",
        })}
      />
    );

    const board = screen.getByTestId("pinyin-blend-board");
    expect(board).toBeInTheDocument();
    expect(board.textContent).not.toContain("猫");

    fireEvent.click(screen.getByRole("button", { name: /声母/ }));
    expect(spy).toHaveBeenCalledWith("波", "zh-CN");

    fireEvent.click(screen.getByRole("button", { name: /韵母/ }));
    expect(spy).toHaveBeenCalledWith("阿", "zh-CN");

    fireEvent.click(screen.getByRole("button", { name: /拼一拼/ }));
    expect(spy).toHaveBeenCalledWith("八", "zh-CN");
    spy.mockRestore();
  });
});
