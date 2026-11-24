export const CONTENT_PACK: {
  id: string;
  version: string;
  schemaVersion: number;
  publishedAt: string;
  releaseStatus: "pilot" | "approved";
  humanReviewStatus: "pending" | "approved";
  requiredReviewRoles: string[];
} = {
  id: "sg-primary-p1-p2",
  version: "pilot-22",
  schemaVersion: 4,
  publishedAt: "2026-11-24",
  releaseStatus: "pilot",
  humanReviewStatus: "pending",
  requiredReviewRoles: [
    "Singapore P1/P2 curriculum teacher",
    "Mandarin language reviewer",
    "English language reviewer"
  ]
};

export const CONTENT_VERSION = CONTENT_PACK.version;
