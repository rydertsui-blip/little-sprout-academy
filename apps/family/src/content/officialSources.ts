import sourceManifest from "../../sources/official/source-manifest.json";
import outcomeData from "../../sources/official/outcomes.json";
import activityData from "../../sources/official/activity-outcomes.json";
import type { Subject } from "../lib/types";

export interface OfficialSource {
  id: string;
  subject: Subject;
  title: string;
  documentVersion: string;
  officialUrl: string;
  cacheFile: string;
  sha256: string;
  bytes: number;
  pages: number;
  publishedDateInPdf: string;
}

export interface OfficialOutcome {
  id: string;
  sourceId: string;
  subject: Subject;
  levels: Array<"P1" | "P2" | "P3" | "P4" | "P5" | "P6">;
  levelPrecision: "year" | "lower-primary";
  pdfPage: number;
  quote?: string;
  quoteParts?: string[];
  summary: string;
}

export interface OfficialActivityMapping {
  id: string;
  subject: Subject;
  title: string;
  contentIds: string[];
  outcomeMappings: Array<{
    outcomeId: string;
    mapping: "exact" | "broad";
  }>;
}

export const OFFICIAL_SOURCES = sourceManifest.sources as OfficialSource[];
export const OFFICIAL_OUTCOMES = outcomeData.outcomes as OfficialOutcome[];
export const OFFICIAL_ACTIVITIES = activityData.activities as OfficialActivityMapping[];
export const OFFICIAL_SOURCE_MANIFEST = sourceManifest;
export const OFFICIAL_OUTCOME_DATA = outcomeData;
export const OFFICIAL_ACTIVITY_DATA = activityData;

export const OFFICIAL_SOURCES_BY_ID = new Map(OFFICIAL_SOURCES.map((source) => [source.id, source]));
export const OFFICIAL_OUTCOMES_BY_ID = new Map(OFFICIAL_OUTCOMES.map((outcome) => [outcome.id, outcome]));

