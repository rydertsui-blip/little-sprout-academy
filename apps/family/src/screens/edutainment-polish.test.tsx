import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { READ_ALONG_STORYBOOKS } from "../content/storybooks";
import { COMPANION_ACCESSORIES } from "../companions/accessories";
import { createChildProfile } from "../lib/profile";
import { createRewardState, toggleEquippedAccessory } from "../rewards/rewardState";
import { isSfxMuted, playSfx, setSfxMuted } from "../lib/sfx";
import StorybookScreen from "./StorybookScreen";
import { CompanionShop } from "./CompanionShop";
import { CompanionHomeCard } from "./CompanionHomeCard";
import { ConfettiBurst } from "./ConfettiBurst";

describe("Professional Edutainment Polish (SFX, Storybooks, Wardrobe, Combo & Chest)", () => {
  it("synthesizes Web Audio sound effects safely and respects mute flag", () => {
    expect(isSfxMuted()).toBe(false);
    expect(() => playSfx("pop")).not.toThrow();
    expect(() => playSfx("blend-step", 1)).not.toThrow();
    expect(() => playSfx("combo")).not.toThrow();
    expect(() => playSfx("chest-open")).not.toThrow();
    setSfxMuted(true);
    expect(isSfxMuted()).toBe(true);
    expect(() => playSfx("correct")).not.toThrow();
    setSfxMuted(false);
  });

  it("renders ConfettiBurst particles when active", () => {
    const { rerender } = render(<ConfettiBurst active={false} />);
    expect(screen.queryByTestId("confetti-burst")).not.toBeInTheDocument();
    rerender(<ConfettiBurst active={true} triggerKey="combo-3" />);
    expect(screen.getByTestId("confetti-burst")).toBeInTheDocument();
  });

  it("provides 6 bilingual read-along storybooks and supports interactive page reading & quiz", () => {
    expect(READ_ALONG_STORYBOOKS).toHaveLength(6);
    const zhBooks = READ_ALONG_STORYBOOKS.filter((b) => b.language === "zh");
    const enBooks = READ_ALONG_STORYBOOKS.filter((b) => b.language === "en");
    expect(zhBooks).toHaveLength(3);
    expect(enBooks).toHaveLength(3);

    const child = createChildProfile("小芽", "star");
    render(
      <StorybookScreen
        child={child}
        locale="zh"
        onBack={() => {}}
        onLock={() => {}}
        onCompleteBook={async () => 1}
      />
    );

    expect(screen.getByTestId("storybook-library")).toBeInTheDocument();
    const firstCard = screen.getByTestId("storybook-card-book-zh-rain-rainbow");
    fireEvent.click(firstCard);

    expect(screen.getByTestId("storybook-reader")).toBeInTheDocument();
    expect(screen.getByTestId("storybook-page-spread")).toBeInTheDocument();

    // Tap first sentence
    const sentence0 = screen.getByTestId("story-sentence-0");
    fireEvent.click(sentence0);
    expect(sentence0.className).toContain("is-reading");

    // Advance through 3 pages to reach the quiz
    fireEvent.click(screen.getByTestId("storybook-next-page-btn"));
    fireEvent.click(screen.getByTestId("storybook-next-page-btn"));
    fireEvent.click(screen.getByTestId("storybook-next-page-btn"));

    expect(screen.getByTestId("storybook-quiz")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("storybook-quiz-opt-七色彩虹桥"));
    expect(screen.getByTestId("storybook-quiz-feedback")).toHaveTextContent("答对啦");
  });

  it("toggles companion accessories mutually exclusively per slot and renders wardrobe", () => {
    expect(COMPANION_ACCESSORIES).toHaveLength(6);
    const hatIds = COMPANION_ACCESSORIES.filter((a) => a.slot === "hat").map((a) => a.id);

    let rewards = { ...createRewardState(), lifetimeStars: 20 };
    rewards = toggleEquippedAccessory(rewards, "acc-sprout-crown", hatIds);
    expect(rewards.equippedAccessoryIds).toEqual(["acc-sprout-crown"]);

    // Equipping another hat replaces the previous hat
    rewards = toggleEquippedAccessory(rewards, "acc-wizard-hat", hatIds);
    expect(rewards.equippedAccessoryIds).toEqual(["acc-wizard-hat"]);

    // Toggling the same hat removes it
    rewards = toggleEquippedAccessory(rewards, "acc-wizard-hat", hatIds);
    expect(rewards.equippedAccessoryIds).toEqual([]);

    render(
      <CompanionHomeCard
        rewards={{ ...rewards, lifetimeStars: 16, equippedAccessoryIds: ["acc-sprout-crown"] }}
        animationsEnabled={false}
        onOpen={() => {}}
        locale="zh"
      />
    );

    fireEvent.click(screen.getByTestId("pet-touch-btn"));
    expect(screen.getByTestId("companion-speech-pill")).toBeInTheDocument();

    render(
      <CompanionShop
        rewards={{ ...rewards, lifetimeStars: 16, equippedAccessoryIds: ["acc-sprout-crown"] }}
        animationsEnabled={false}
        onBack={() => {}}
        onRedeem={async () => true}
        onSetActive={async () => true}
        onToggleAccessory={async () => true}
        locale="zh"
      />
    );

    fireEvent.click(screen.getByTestId("wardrobe-tab"));
    expect(screen.getByTestId("wardrobe-panel")).toBeInTheDocument();
    expect(screen.getByTestId("wardrobe-item-acc-sprout-crown")).toBeInTheDocument();
  });
});
