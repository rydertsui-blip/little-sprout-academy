export type Subject = "math" | "mandarin" | "english";
export type MasteryLevel = "unknown" | "developing" | "likely-secure" | "secure";

export interface ContentAudit {
  contentVersion: string;
  author: string;
  sourceRefs: string[];
  automatedReview: "passed" | "failed";
  humanLanguageReview: "pending" | "approved";
  humanPedagogyReview: "pending" | "approved";
}

export interface Skill {
  id: string;
  subject: Subject;
  title: string;
  shortTitle: string;
  gradeBand: "P1" | "P2" | "P1-P2";
  description: string;
  prerequisites: string[];
  sourceDocument: string;
}

export interface ChoiceQuestion {
  id: string;
  subject: Subject;
  skillId: string;
  kind: "choice";
  prompt: string;
  instruction: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  template: string;
  diagnostic: boolean;
  reviewStatus: "verified";
  audit: ContentAudit;
  audioText?: string;
  audioLanguage?: "zh-CN" | "en-US";
  displayCharacter?: string;
  image?: string;
  passage?: string;
}

export interface SkillEvidence {
  skillId: string;
  pKnown: number;
  pInit: number;
  pGuess: number;
  pSlip: number;
  pTransit: number;
  nEff: number;
  independentCorrect: number;
  correctWithHint: number;
  templates: string[];
  questionIds: string[];
  lastAttemptAt: string | null;
  firstEvidenceAt: string | null;
  lastStageAdvanceAt: string | null;
  delayedEvidence: boolean;
  reviewStage: number;
  dueAt: string | null;
  wrongStreak: number;
}

export interface Attempt {
  id: string;
  childId: string;
  questionId: string;
  skillId: string;
  subject: Subject;
  correct: boolean;
  hintUsed: boolean;
  createdAt: string;
  sessionId: string;
}

export interface HandwritingRecord {
  character: string;
  lastCompletedAt: string;
  bestMistakes: number;
  attempts: number;
}

export interface SessionSummaryRow {
  skillId: string;
  title: string;
  level: MasteryLevel;
  pKnown: number;
  evidenceCount: number;
}

export interface SessionRecord {
  id: string;
  childId: string;
  subject: Subject;
  kind: "diagnostic" | "practice";
  length: number;
  startedAt: string;
  completedAt: string | null;
  plannedQuestionIds: string[];
  attempts: Attempt[];
  summary: SessionSummaryRow[];
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
  diagnostics: Partial<Record<Subject, { completedAt: string; sessionId: string }>>;
  evidence: Record<string, SkillEvidence>;
  attempts: Attempt[];
  sessions: SessionRecord[];
  activeSessions: Partial<Record<Subject, SessionRecord>>;
  handwriting: Record<string, HandwritingRecord>;
  settings: {
    sessionLength: number;
    enabledSkills: string[];
    highContrast: boolean;
    largeText: boolean;
  };
}

export interface HouseholdState {
  version: 2;
  householdName: string;
  parentName: string;
  pinHash: string;
  pinSalt: string;
  createdAt: string;
  children: ChildProfile[];
}

export interface ContentIssue {
  code: string;
  message: string;
  questionId?: string;
  skillId?: string;
}
