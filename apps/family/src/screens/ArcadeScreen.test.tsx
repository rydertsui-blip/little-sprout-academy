import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createChildProfile } from "../lib/profile";
import ArcadeScreen from "./ArcadeScreen";
import * as audio from "../lib/audio";

describe("ArcadeScreen (小芽游乐园四大互动小游戏)", () => {
  it("renders Memory Flip and lets a child match all pairs to win", () => {
    vi.spyOn(audio, "playOrSpeak").mockImplementation(() => {});
    const onCompleteGame = vi.fn().mockResolvedValue(1);
    const child = createChildProfile("小游", "star", new Date("2026-11-20T00:00:00Z"));
    render(<ArcadeScreen child={child} onBack={() => {}} onLock={() => {}} onCompleteGame={onCompleteGame} />);

    expect(screen.getByTestId("game-memory-flip")).toBeInTheDocument();
    for (const pairId of ["m-shan", "m-shui", "m-hua", "m-niao", "m-shu", "m-ming"]) {
      fireEvent.click(screen.getByTestId(`flip-card-${pairId}-L`));
      fireEvent.click(screen.getByTestId(`flip-card-${pairId}-R`));
    }
    expect(screen.getByTestId("memory-flip-victory")).toBeInTheDocument();
    expect(onCompleteGame).toHaveBeenCalledWith("arcade:memory:pinyin-hanzi");
  });

  it("switches to Sorting Basket and lets a child shoot all 6 balls into the right baskets", () => {
    vi.spyOn(audio, "playOrSpeak").mockImplementation(() => {});
    const child = createChildProfile("小投", "star", new Date("2026-11-20T00:00:00Z"));
    render(<ArcadeScreen child={child} initialGame="sorting-basket" onBack={() => {}} onLock={() => {}} />);

    expect(screen.getByTestId("game-sorting-basket")).toBeInTheDocument();
    // 17 (left), 24 (right), 39 (left), 50 (right), 63 (left), 88 (right)
    const sequence = ["basket-left", "basket-right", "basket-left", "basket-right", "basket-left", "basket-right"];
    for (const testId of sequence) {
      fireEvent.click(screen.getByTestId(testId));
    }
    expect(screen.getByTestId("sorting-basket-victory")).toBeInTheDocument();
  });

  it("switches to Monster Feeder and feeds 3 target foods to satisfy the monster", () => {
    vi.spyOn(audio, "playOrSpeak").mockImplementation(() => {});
    const child = createChildProfile("小怪", "star", new Date("2026-11-20T00:00:00Z"));
    render(<ArcadeScreen child={child} initialGame="monster-feeder" onBack={() => {}} onLock={() => {}} />);

    expect(screen.getByTestId("game-monster-feeder")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("monster-food-f-1"));
    fireEvent.click(screen.getByTestId("monster-food-f-2"));
    fireEvent.click(screen.getByTestId("monster-food-f-3"));
    expect(screen.getByTestId("monster-feeder-victory")).toBeInTheDocument();
  });

  it("switches to Story Quest and completes all 3 interactive story scenes", () => {
    vi.spyOn(audio, "playOrSpeak").mockImplementation(() => {});
    const child = createChildProfile("小书", "star", new Date("2026-11-20T00:00:00Z"));
    render(<ArcadeScreen child={child} initialGame="story-quest" onBack={() => {}} onLock={() => {}} />);

    expect(screen.getByTestId("game-story-quest")).toBeInTheDocument();
    // Scene 1: 6 块
    fireEvent.click(screen.getByRole("button", { name: "6 块" }));
    fireEvent.click(screen.getByRole("button", { name: /进入下一幕故事/ }));
    // Scene 2: 明
    fireEvent.click(screen.getByRole("button", { name: "明" }));
    fireEvent.click(screen.getByRole("button", { name: /进入下一幕故事/ }));
    // Scene 3: Can you help me, please?
    fireEvent.click(screen.getByRole("button", { name: "Can you help me, please?" }));
    expect(screen.getByTestId("story-quest-victory")).toBeInTheDocument();
  });
});
