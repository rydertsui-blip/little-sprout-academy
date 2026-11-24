import { describe, expect, it } from "vitest";
import { UI_COPY } from "./copy";
import { CONTENT_VERSION } from "./release";

describe("role-specific interface copy", () => {
  it("keeps implementation language out of the child workspace", () => {
    const childFacing = [
      UI_COPY.child.eyebrow,
      UI_COPY.child.greeting("小星"),
      UI_COPY.child.body,
      UI_COPY.child.startDiagnostic,
      UI_COPY.child.continuePractice,
      UI_COPY.profiles.body,
      UI_COPY.session.diagnosticTitle,
      UI_COPY.session.practiceTitle,
      UI_COPY.session.diagnosticResult,
      UI_COPY.session.diagnosticResultBody,
      UI_COPY.session.practiceResultBody,
      ...Object.values(UI_COPY.mastery)
    ].join(" ");
    expect(childFacing).not.toMatch(/系统|证据|算法|概率|定位|掌握度|自适应|档案/);
  });

  it("describes the pilot scope honestly for parents", () => {
    const summary = UI_COPY.parent.contentSummary(CONTENT_VERSION, 46, 799);
    expect(summary).toContain("46 个知识点");
    expect(summary).toContain("799 道题");
    expect(summary).toContain("K2 准备");
    expect(summary).toContain("P1–P2");
    expect(summary).toContain("不是完整课程");
    const sourceSummary = UI_COPY.parent.officialSourceSummary(4, 44, 0, 5, 8);
    expect(sourceSummary).toContain("4 份新加坡教育部（MOE）资料");
    expect(sourceSummary).toContain("0 条游戏内容还在补充");
    expect(sourceSummary).toContain("5 条书写目标暂不纳入");
    expect(sourceSummary).toContain("8 个知识点为课外补充");
    expect(UI_COPY.parent.reviewStatus).toContain("尚未逐条人工复核");
  });

  it("explains the destructive subject reset before asking for confirmation", () => {
    const confirmation = UI_COPY.parent.resetConfirm("数学");
    expect(confirmation).toContain("重新评估数学");
    expect(confirmation).toContain("历史作答仍会保留");
  });
});
