import { describe, expect, it } from "vitest";
import { HANDWRITING_CHARACTERS } from "../content/handwriting";
import { createChildProfile } from "../lib/profile";
import { recordHandwritingPractice } from "./handwriting";

describe("handwriting evidence", () => {
  it("records a complete trace as evidence for character recognition", () => {
    const child = createChildProfile("小星", "star");
    const entry = HANDWRITING_CHARACTERS[0];
    const updated = recordHandwritingPractice(child, entry, 0, new Date("2026-11-20T10:00:00Z"));
    expect(updated.handwriting[entry.character].bestMistakes).toBe(0);
    expect(updated.handwriting[entry.character].attempts).toBe(1);
    expect(updated.attempts.at(-1)?.questionId).toBe(`trace-${entry.character}`);
    expect(updated.evidence["mandarin-characters"].questionIds).toContain(`trace-${entry.character}`);
    expect(updated.evidence["mandarin-characters"].templates).toContain("handwriting-trace");
  });

  it("keeps the best result and does not inflate evidence for a repeated character", () => {
    const child = createChildProfile("小月", "moon");
    const entry = HANDWRITING_CHARACTERS[1];
    recordHandwritingPractice(child, entry, 3, new Date("2026-11-20T10:00:00Z"));
    const probabilityAfterFirst = child.evidence["mandarin-characters"].pKnown;
    recordHandwritingPractice(child, entry, 0, new Date("2026-11-21T10:00:00Z"));
    expect(child.handwriting[entry.character]).toMatchObject({ bestMistakes: 0, attempts: 2 });
    expect(child.evidence["mandarin-characters"].pKnown).toBe(probabilityAfterFirst);
  });
});
