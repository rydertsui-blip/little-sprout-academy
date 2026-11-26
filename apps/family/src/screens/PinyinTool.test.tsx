import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PinyinTool } from "./PinyinTool";
import {
  ALL_PINYIN_UNITS,
  decomposeCharacterPinyin,
  PINYIN_FINALS,
  PINYIN_INITIALS,
  PINYIN_WHOLE_SYLLABLES,
  getPinyinAudioKey,
} from "../content/pinyinChart";
import { AUDIO_ASSETS } from "../content/audioAssets";
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
  it("maps all 63 standard pinyin units (23 initials + 24 finals + 16 whole syllables) to bundled audio", () => {
    expect(PINYIN_INITIALS).toHaveLength(23);
    expect(PINYIN_FINALS).toHaveLength(24);
    expect(PINYIN_WHOLE_SYLLABLES).toHaveLength(16);
    expect(ALL_PINYIN_UNITS).toHaveLength(63);

    for (const unit of ALL_PINYIN_UNITS) {
      expect(getPinyinAudioKey(unit.symbol), unit.symbol).toBe(unit.audioKey);
      expect(AUDIO_ASSETS[unit.audioKey], `${unit.symbol} -> ${unit.audioKey}`).toBeTruthy();
      expect(AUDIO_ASSETS[unit.symbol], `raw symbol ${unit.symbol}`).toBeTruthy();
    }
  });

  it("dynamically decomposes two-part, three-part, and whole-reading characters", () => {
    const ba = decomposeCharacterPinyin("爸");
    expect(ba.initial).toBe("b");
    expect(ba.initialAudio).toBe("波");
    expect(ba.final).toBe("à");
    expect(ba.finalAudio).toBe("阿");
    expect(ba.medial).toBeUndefined();

    const hua = decomposeCharacterPinyin("花");
    expect(hua.initial).toBe("h");
    expect(hua.medial).toBe("u");
    expect(hua.final).toBe("ā");

    const yue = decomposeCharacterPinyin("月");
    expect(yue.isWholeSyllable).toBe(true);
    expect(yue.baseFinal).toBe("üe");
  });

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

  it("dynamically adapts the blend board to the current question character while masking the tested initial and supporting 3-step auto-blend", () => {
    const spy = vi.spyOn(audio, "playOrSpeak").mockImplementation((_text, _lang, onStatus) => {
      onStatus?.("ended");
    });
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
    expect(board.textContent).toContain("本题：猫");

    // Initial block is masked as ？ so it does not leak "m" visually, but plays "摸" on tap
    const initialBtn = screen.getByRole("button", { name: /声母/ });
    expect(initialBtn.textContent).toContain("？");
    fireEvent.click(initialBtn);
    expect(spy).toHaveBeenCalledWith("摸", "zh-CN");

    fireEvent.click(screen.getByRole("button", { name: /韵母/ }));
    expect(spy).toHaveBeenCalledWith("凹", "zh-CN");

    fireEvent.click(screen.getByRole("button", { name: /拼一拼/ }));
    expect(spy).toHaveBeenCalledWith("猫", "zh-CN");

    // Auto-blend button chains initial -> final -> syllable
    spy.mockClear();
    fireEvent.click(screen.getByTestId("pinyin-auto-blend"));
    expect(spy).toHaveBeenCalledWith("摸", "zh-CN", expect.any(Function));
    spy.mockRestore();
  });

  it("lets children tap any unit in the 63-sound pinyin chart while masking the current question answer", () => {
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

    fireEvent.click(screen.getByRole("tab", { name: /全部拼音表/ }));
    expect(screen.getByTestId("pinyin-full-chart")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "本题答案已隐藏" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "听拼音 zh" }));
    expect(spy).toHaveBeenCalledWith("知", "zh-CN");

    fireEvent.click(screen.getByRole("button", { name: /韵母/ }));
    fireEvent.click(screen.getByRole("button", { name: "听拼音 üe" }));
    expect(spy).toHaveBeenCalledWith("约", "zh-CN");

    fireEvent.click(screen.getByRole("button", { name: /整体认读/ }));
    fireEvent.click(screen.getByRole("button", { name: "听拼音 yuan" }));
    expect(spy).toHaveBeenCalledWith("冤", "zh-CN");
    spy.mockRestore();
  });
});
