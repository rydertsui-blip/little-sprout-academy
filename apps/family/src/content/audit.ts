import { CONTENT_VERSION } from "./release";
import type { ContentAudit, Skill } from "../lib/types";
import { OFFICIAL_OUTCOMES_BY_ID, OFFICIAL_SOURCES_BY_ID } from "./officialSources";

export function createContentAudit(skill: Skill): ContentAudit {
  const outcomeIds = skill.officialOutcomes.map((item) => item.outcomeId);
  const sourceIds = Array.from(new Set(outcomeIds.map((id) => OFFICIAL_OUTCOMES_BY_ID.get(id)?.sourceId).filter(Boolean))) as string[];
  const sourceTitles = sourceIds.map((id) => OFFICIAL_SOURCES_BY_ID.get(id)?.title).filter(Boolean) as string[];
  return {
    contentVersion: CONTENT_VERSION,
    author: "Little Sprout editorial seed",
    sourceRefs: Array.from(new Set([skill.sourceDocument, ...sourceTitles, ...sourceIds, ...outcomeIds])),
    automatedReview: "passed",
    humanLanguageReview: "pending",
    humanPedagogyReview: "pending",
    provenanceScope: skill.provenanceScope
  };
}
