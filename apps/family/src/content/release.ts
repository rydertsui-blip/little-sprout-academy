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
  version: "pilot-3",
  schemaVersion: 2,
  publishedAt: "2026-11-20",
  releaseStatus: "pilot",
  humanReviewStatus: "pending",
  requiredReviewRoles: [
    "Singapore P1/P2 curriculum teacher",
    "Mandarin language reviewer",
    "English language reviewer"
  ]
};

export const CONTENT_VERSION = CONTENT_PACK.version;
