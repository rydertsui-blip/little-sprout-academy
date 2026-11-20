import { CONTENT_VERSION } from "./release";
import type { ContentAudit, Skill } from "../lib/types";

export function createContentAudit(skill: Skill): ContentAudit {
  return {
    contentVersion: CONTENT_VERSION,
    author: "Little Sprout editorial seed",
    sourceRefs: [skill.sourceDocument],
    automatedReview: "passed",
    humanLanguageReview: "pending",
    humanPedagogyReview: "pending"
  };
}
