import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { QUESTIONS, SKILLS, validateContentCatalog } from "./catalog";
import {
  OFFICIAL_ACTIVITIES,
  OFFICIAL_OUTCOMES,
  OFFICIAL_OUTCOMES_BY_ID,
  OFFICIAL_SOURCES,
  OFFICIAL_SOURCES_BY_ID
} from "./officialSources";

describe("official MOE source provenance", () => {
  it("uses only SHA-256 pinned MOE HTTPS sources", () => {
    expect(OFFICIAL_SOURCES).toHaveLength(4);
    for (const source of OFFICIAL_SOURCES) {
      const url = new URL(source.officialUrl);
      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe("www.moe.gov.sg");
      expect(source.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(source.pages).toBeGreaterThan(0);
    }
  });

  it("has unique official outcomes with exact page evidence", () => {
    expect(new Set(OFFICIAL_OUTCOMES.map((outcome) => outcome.id)).size).toBe(OFFICIAL_OUTCOMES.length);
    for (const outcome of OFFICIAL_OUTCOMES) {
      const source = OFFICIAL_SOURCES_BY_ID.get(outcome.sourceId);
      expect(source).toBeDefined();
      expect(outcome.pdfPage).toBeGreaterThanOrEqual(1);
      expect(outcome.pdfPage).toBeLessThanOrEqual(source!.pages);
      expect(outcome.quoteParts?.length || (outcome.quote ? 1 : 0)).toBeGreaterThan(0);
    }
  });

  it("maps every skill and every question to a known official outcome and source", () => {
    for (const skill of SKILLS) {
      if (skill.provenanceScope === "supplementary-practice") expect(skill.officialOutcomes).toHaveLength(0);
      else expect(skill.officialOutcomes.length).toBeGreaterThan(0);
      for (const mapping of skill.officialOutcomes) {
        const outcome = OFFICIAL_OUTCOMES_BY_ID.get(mapping.outcomeId);
        expect(outcome?.subject).toBe(skill.subject);
      }
    }
    for (const question of QUESTIONS) {
      const skill = SKILLS.find((item) => item.id === question.skillId);
      expect(skill).toBeDefined();
      for (const mapping of skill!.officialOutcomes) {
        const outcome = OFFICIAL_OUTCOMES_BY_ID.get(mapping.outcomeId)!;
        expect(question.audit.sourceRefs).toContain(outcome.id);
        expect(question.audit.sourceRefs).toContain(outcome.sourceId);
      }
    }
    expect(validateContentCatalog().filter((issue) => issue.code.includes("official"))).toEqual([]);
  });

  it("maps the standalone handwriting and speaking activities", () => {
    expect(OFFICIAL_ACTIVITIES.map((activity) => activity.id)).toEqual([
      "activity-handwriting-12-characters",
      "activity-speaking-mandarin-basic-words",
      "activity-speaking-english-basic-words",
      "activity-mandarin-lower-primary-program"
    ]);
    expect(OFFICIAL_ACTIVITIES.find((activity) => activity.id === "activity-mandarin-lower-primary-program")?.kind).toBe("program");
    for (const activity of OFFICIAL_ACTIVITIES) {
      expect(activity.contentIds.length).toBeGreaterThan(0);
      for (const mapping of activity.outcomeMappings) expect(OFFICIAL_OUTCOMES_BY_ID.get(mapping.outcomeId)?.subject).toBe(activity.subject);
    }
  });

  it("keeps the generated source coverage report in sync", () => {
    const report = readFileSync(resolve(process.cwd(), "sources/official/coverage-report.md"), "utf8");
    for (const source of OFFICIAL_SOURCES) expect(report).toContain(source.sha256);
    expect(report).toContain("没有真人教师审核");
  });
});

