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
      UI_COPY.child.note,
      UI_COPY.session.diagnosticTitle,
      UI_COPY.session.practiceTitle,
      UI_COPY.session.diagnosticResult,
      UI_COPY.session.diagnosticResultBody,
      UI_COPY.session.practiceResultBody,
      ...Object.values(UI_COPY.mastery)
    ].join(" ");
    expect(childFacing).not.toMatch(/系统|证据|算法|概率|定位|掌握度|自适应/);
  });

  it("describes the pilot scope honestly for parents", () => {
    const summary = UI_COPY.parent.contentSummary(CONTENT_VERSION, 33, 228);
    expect(summary).toContain("33 个知识点");
    expect(summary).toContain("228 道题");
    expect(summary).toContain("小学一、二年级");
    expect(summary).toContain("不是完整课程");
    const sourceSummary = UI_COPY.parent.officialSourceSummary(4, 44, 7, 2);
    expect(sourceSummary).toContain("官方来源已机器核对");
    expect(sourceSummary).toContain("7 条尚未有内容");
    expect(sourceSummary).toContain("2 个技能为课外补充");
    expect(UI_COPY.parent.reviewStatus).toContain("未进行");
  });

  it("explains the destructive subject reset before asking for confirmation", () => {
    const confirmation = UI_COPY.parent.resetConfirm("数学");
    expect(confirmation).toContain("重做数学起点");
    expect(confirmation).toContain("历史作答仍会保留");
  });
});
