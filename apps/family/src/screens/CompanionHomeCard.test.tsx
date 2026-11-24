import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createRewardState } from "../rewards/rewardState";
import { CompanionHomeCard } from "./CompanionHomeCard";

describe("CompanionHomeCard", () => {
  it("shows the next companion threshold when no companion is owned", () => {
    render(<CompanionHomeCard rewards={createRewardState()} animationsEnabled locale="zh" onOpen={() => {}} />);
    expect(screen.getByText("豆豆还差 10 颗成长星")).toBeInTheDocument();
  });

  it("shows the active companion and opens the shop", () => {
    const onOpen = vi.fn();
    render(
      <CompanionHomeCard
        rewards={{ ...createRewardState(), lifetimeStars: 10, redeemedCompanionIds: ["gemini-doudou"], activeCompanionId: "gemini-doudou" }}
        animationsEnabled
        locale="zh"
        onOpen={onOpen}
      />
    );
    expect(screen.getByText("豆豆正在陪你学习")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "打开伙伴兑换商城" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("shows a redeemable state instead of a zero-star lock", () => {
    render(<CompanionHomeCard rewards={{ ...createRewardState(), lifetimeStars: 10 }} animationsEnabled locale="zh" onOpen={() => {}} />);
    expect(screen.getByText("豆豆可以兑换了")).toBeInTheDocument();
    expect(screen.getByText("去兑换伙伴")).toBeInTheDocument();
    expect(screen.queryByText("还差 0 颗成长星")).not.toBeInTheDocument();
  });
});
