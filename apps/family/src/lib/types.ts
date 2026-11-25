export type Subject = "math" | "mandarin" | "english";
export type Locale = "zh" | "en";
export type LearningLevel = "K2" | "P1" | "P2";
export type MasteryLevel = "unknown" | "developing" | "likely-secure" | "secure";

export interface ContentAudit {
  contentVersion: string;
  author: string;
  sourceRefs: string[];
  automatedReview: "passed" | "failed";
  humanLanguageReview: "pending" | "approved";
  humanPedagogyReview: "pending" | "approved";
  provenanceScope: "official-outcome" | "supplementary-practice";
}

export interface Skill {
  id: string;
  subject: Subject;
  title: string;
  shortTitle: string;
  gradeBand: "K2" | "P1" | "P2" | "P1-P2";
  description: string;
  prerequisites: string[];
  sourceDocument: string;
  provenanceScope: "official-outcome" | "supplementary-practice";
  officialOutcomes: Array<{
    outcomeId: string;
    mapping: "exact" | "broad";
  }>;
}

interface QuestionBase {
  id: string;
  subject: Subject;
  skillId: string;
  prompt: string;
  instruction: string;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  template: string;
  transferLevel: TransferLevel;
  contextKey: string;
  diagnostic: boolean;
  reviewStatus: "verified";
  audit: ContentAudit;
  audioText?: string;
  audioLanguage?: "zh-CN" | "en-US";
  displayCharacter?: string;
  image?: string;
  passage?: string;
  audioOnly?: boolean;
  optionImages?: Record<string, string>;
}

export interface ChoiceQuestion extends QuestionBase {
  kind: "choice";
  options: string[];
  correctAnswer: string;
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
  audioText?: string;
  audioLanguage?: "zh-CN" | "en-US";
  rightImage?: string;
}

export interface MatchQuestion extends QuestionBase {
  kind: "match";
  leftLabel: string;
  rightLabel: string;
  pairs: MatchPair[];
}

export type Question = ChoiceQuestion | MatchQuestion;

export type ResponseMode = "tap-choice" | "tap-match" | "tap-order" | "voice-practice";
export type TransferLevel = "same-context" | "near-transfer" | "far-transfer";

export interface EvidenceDiversity {
  templateFamilies: Record<string, number>;
  responseModes: Record<ResponseMode, number>;
  transferCorrect: number;
  farTransferCorrect: number;
  delayedIndependentCorrect: number;
  contextKeys: string[];
  lastIndependentWrongAt: string | null;
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
  diversity: EvidenceDiversity;
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

export type DailyPlanItemKind = "review" | "current" | "transfer";

export interface DailyPlanItem {
  kind: DailyPlanItemKind;
  skillId: string;
  questionId: string;
  template: string;
}

export interface DailyPlan {
  dateKey: string;
  timezone: "Asia/Singapore";
  subject: Subject;
  questionCount: number;
  estimatedMinutes: number;
  items: DailyPlanItem[];
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
  dailyPlan?: DailyPlan;
  attempts: Attempt[];
  summary: SessionSummaryRow[];
}

export interface GrowthRewardState {
  lifetimeStars: number;
  awardedEventKeys: string[];
  redeemedCompanionIds: string[];
  redeemedAtByCompanionId: Record<string, string>;
  activeCompanionId: string | null;
  dailyAwardKey: string | null;
  dailyStars: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  ageYears: number;
  birthYear?: number;
  gradeLevel: LearningLevel;
  levelConfirmedOn?: string;
  createdAt: string;
  diagnostics: Partial<Record<Subject, { completedAt: string; sessionId: string }>>;
  evidence: Record<string, SkillEvidence>;
  attempts: Attempt[];
  sessions: SessionRecord[];
  activeSessions: Partial<Record<Subject, SessionRecord>>;
  handwriting: Record<string, HandwritingRecord>;
  rewards: GrowthRewardState;
  settings: {
    sessionLength: number;
    enabledSkills: string[];
    highContrast: boolean;
    largeText: boolean;
    rewardsEnabled: boolean;
    companionAnimationsEnabled: boolean;
  };
}

export interface HouseholdState {
  version: 4;
  uiLocale: Locale;
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
