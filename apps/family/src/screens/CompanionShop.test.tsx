import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createRewardState } from "../rewards/rewardState";
import { CompanionShop } from "./CompanionShop";

describe("CompanionShop", () => {
  it("shows a locked companion and the remaining stars", () => {
    render(
      <CompanionShop
        rewards={createRewardState()}
        animationsEnabled
        locale="zh"
        onBack={() => {}}
        onRedeem={async () => true}
        onSetActive={async () => true}
      />
    );
    expect(screen.getByText("豆豆")).toBeInTheDocument();
    expect(screen.getByText("闪电皮卡丘")).toBeInTheDocument();
    expect(screen.getByText("还差 14 颗成长星")).toBeInTheDocument();
    // 只有初始伙伴豆豆可以直接兑换，皮卡丘仍需攒星
    expect(screen.getAllByRole("button", { name: "兑换" })).toHaveLength(1);
    expect(screen.queryByText("购买")).toBeNull();
  });

  it("confirms redemption without charging stars", async () => {
    const onRedeem = vi.fn(async () => true);
    render(
      <CompanionShop
        rewards={{ ...createRewardState(), lifetimeStars: 10 }}
        animationsEnabled
        locale="zh"
        onBack={() => {}}
        onRedeem={onRedeem}
        onSetActive={async () => true}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "兑换" }));
    expect(screen.getByText(/成长星不会扣除/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "确认兑换" }));
    await waitFor(() => expect(onRedeem).toHaveBeenCalledWith("gemini-doudou"));
    expect(screen.getByText("已有 10 颗成长星")).toBeInTheDocument();
  });

  it("lists redeemed companions and can set the active companion", async () => {
    const onSetActive = vi.fn(async () => true);
    render(
      <CompanionShop
        rewards={{
          ...createRewardState(),
          lifetimeStars: 10,
          redeemedCompanionIds: ["gemini-doudou"],
          redeemedAtByCompanionId: { "gemini-doudou": "2026-11-21T00:00:00.000Z" }
        }}
        animationsEnabled
        locale="zh"
        onBack={() => {}}
        onRedeem={async () => true}
        onSetActive={onSetActive}
      />
    );
    fireEvent.click(screen.getByRole("tab", { name: "我的伙伴" }));
    fireEvent.click(screen.getByRole("button", { name: "让豆豆陪我" }));
    await waitFor(() => expect(onSetActive).toHaveBeenCalledWith("gemini-doudou"));
  });
});
