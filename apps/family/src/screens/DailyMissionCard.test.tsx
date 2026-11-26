import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyMissionCard } from "./DailyMissionCard";

const progress = {
  subject: "math" as const,
  currentSkillId: "math-count-100",
  currentSkillTitle: "数到100",
  stableCount: 1,
  retainedCount: 1,
  dueReviewCount: 2,
  todaySessions: 0,
  todayCompleted: false,
  weeklySessions: 2,
  weeklyIndependentCorrect: 7
};

describe("DailyMissionCard", () => {
  it("shows a concrete first step before the placement check", () => {
    render(<DailyMissionCard progress={progress} hasDiagnostic={false} hasActiveSession={false} reviewCount={2}
        locale="zh" />);
    expect(screen.getByText("先做 5 题，找找起点")).toBeInTheDocument();
    expect(screen.queryByText("现在在：数到100")).not.toBeInTheDocument();
  });

  it("shows the next step and current station without adult statistics", () => {
    render(<DailyMissionCard progress={progress} hasDiagnostic hasActiveSession={false} reviewCount={2}
        locale="zh" />);
    expect(screen.getByText("先复习 2 个，再学 1 个新的")).toBeInTheDocument();
    expect(screen.getByText("现在在：数到100")).toBeInTheDocument();
    expect(screen.queryByText(/本周|本週|隔天/)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("shows today's completion without locking the subject", () => {
    render(<DailyMissionCard progress={{ ...progress, todayCompleted: true }} hasDiagnostic hasActiveSession={false} reviewCount={2}
        locale="zh" />);
    expect(screen.getByText("今天完成了")).toBeInTheDocument();
  });
});
