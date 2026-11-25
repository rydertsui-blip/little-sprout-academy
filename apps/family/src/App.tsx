import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Check, Download, Headphones, Lightbulb, Lock, Mic, Pencil, Plus, ShieldCheck, Star, Trash2, Upload, Volume2, X } from "lucide-react";
import { CONTENT_VERSION, QUESTIONS, SKILLS } from "./content/catalog";
import { SUBJECT_NAMES, UI_COPY, subjectLocale, subjectName, uiCopyFor, type Locale, type UiCopy } from "./content/copy";
import { hintForQuestion, teachForQuestion } from "./content/hints";
import { VOICE_LINES } from "./content/audioAssets";
import { OFFICIAL_ACTIVITIES, OFFICIAL_OUTCOMES, OFFICIAL_SOURCES } from "./content/officialSources";
import { classifyMastery, createSkillEvidence } from "./engine/bkt";
import { buildChildInsights } from "./engine/insights";
import { buildDailyPlan, createDailySession, singaporeDateKey } from "./engine/dailyPlan";
import { buildSubjectProgressView } from "./engine/progressView";
import { playOrSpeak, stopAudio } from "./lib/audio";
import { preAnswerAudio } from "./lib/questionAudio";
import { deterministicOptions } from "./lib/options";
import { ageYearsForProfile, birthYearForAge, enabledSkillsForLevel, hasAnnualLevelReviewDue, levelDateKey, nextLearningLevel, recommendedLevelForAge } from "./lib/levels";
import { formatBytes, getStorageHealth, requestPersistentStorage, type StorageHealth } from "./lib/storageHealth";
import { APP_VERSION } from "./lib/version";
import { completeSession, correctCountsForSession, createAdaptiveSession, recordSessionAnswer, selectNextQuestion } from "./engine/session";
import { createChildProfile } from "./lib/profile";
import { hashPin, validatePin } from "./lib/pin";
import { getCompanionById } from "./companions/companions";
import { applyRewardEvent, getRedeemableCompanionIds, redeemCompanion, setActiveCompanion } from "./rewards/rewardState";
import {
  clearHousehold,
  createEncryptedHousehold,
  flushStorageWrites,
  parseHouseholdBackup,
  readHousehold,
  saveEncryptedHousehold,
  unlockEncryptedHousehold,
  writeEncryptedEnvelope,
  type EncryptedEnvelope
} from "./lib/storage";
import type { ChildProfile, ChoiceQuestion, HouseholdState, LearningLevel, Question, SessionRecord, Subject } from "./lib/types";
import { CompanionHomeCard } from "./screens/CompanionHomeCard";
import { CompanionShop } from "./screens/CompanionShop";
import { DailyMissionCard } from "./screens/DailyMissionCard";
import { MathTool } from "./screens/MathTool";
import { LanguageTool } from "./screens/LanguageTool";
import MatchingBoard from "./screens/MatchingBoard";
import HandwritingScreen from "./screens/HandwritingScreen";
import SpeakingScreen from "./screens/SpeakingScreen";
import { HANDWRITING_CHARACTERS, type HandwritingCharacter } from "./content/handwriting";

type Screen = "profiles" | "child" | "assessment" | "result" | "parent" | "speaking" | "handwriting" | "companions";

interface SessionCompletionOutcome {
  session: SessionRecord;
  starsAwarded: number;
  lifetimeStars: number;
  newlyRedeemableCompanionIds: string[];
}

const avatars = [
  { id: "star", label: "星星头像", image: "star", color: "#f4b84b" },
  { id: "moon", label: "月亮头像", image: "moon", color: "#6b8bcc" },
  { id: "leaf", label: "叶子头像", image: "seedling", color: "#cce8c9" },
  { id: "flower", label: "花朵头像", image: "flower", color: "#ffd6cc" },
  { id: "spider", label: "蜘蛛侠头像", image: "avatar-spider", color: "#dbe7f5" },
  { id: "elsa", label: "艾莎头像", image: "avatar-elsa", color: "#e9def5" },
  { id: "mickey", label: "米奇头像", image: "avatar-mickey", color: "#ffd6cc" },
  { id: "minnie", label: "米妮头像", image: "avatar-minnie", color: "#f7c9dd" },
  { id: "mermaid", label: "美人鱼头像", image: "avatar-mermaid", color: "#c9ecec" },
  { id: "wukong", label: "悟空头像", image: "avatar-wukong", color: "#f4b84b" },
  { id: "gourd", label: "葫芦娃头像", image: "avatar-gourd", color: "#ffd9c9" },
  { id: "nezha", label: "哪吒头像", image: "avatar-nezha", color: "#ffd6cc" },
  { id: "blackcat", label: "黑猫警长头像", image: "avatar-blackcat", color: "#d8e2ef" },
  { id: "goat", label: "喜羊羊头像", image: "avatar-goat", color: "#cce8c9" },
  { id: "bear", label: "熊大头像", image: "avatar-bear", color: "#f1d3b4" },
  { id: "ggbond", label: "猪猪侠头像", image: "avatar-ggbond", color: "#ffd6cc" },
  { id: "superwings", label: "乐迪头像", image: "avatar-superwings", color: "#cfe3f7" },
  { id: "pikachu", label: "皮卡丘头像", image: "avatar-pikachu", color: "#cfe3f7" },
  { id: "doraemon", label: "哆啦A梦头像", image: "avatar-doraemon", color: "#fff0ad" },
  { id: "peppa", label: "佩奇头像", image: "avatar-peppa", color: "#d9ecf7" }
];

function avatarFor(id: string) {
  return avatars.find((item) => item.id === id) ?? avatars[0];
}

function ChildAvatar({ avatar, small = false }: { avatar: string; small?: boolean }) {
  const item = avatarFor(avatar);
  return (
    <div className={`profile-avatar ${small ? "small-avatar " : ""}avatar-${avatar}`} style={{ backgroundColor: item.color }}>
      <img src={`./assets/images/${item.image}.png`} alt="" />
    </div>
  );
}

const subjectCards: Array<{ subject: Subject; title: string; shortLabel: string; subtitle: string; image: string; className: string }> = [
  { subject: "math", title: "数学 Math", shortLabel: "数学", subtitle: "数感、加减、图形和规律", image: "island-math", className: "math-course" },
  { subject: "mandarin", title: "华文 Mandarin", shortLabel: "华文", subtitle: "拼音、识字和短句阅读", image: "island-mandarin", className: "mandarin-course" },
  { subject: "english", title: "英语 English", shortLabel: "英语", subtitle: "字母音、拼读和基础单词", image: "island-english", className: "english-course" }
];
const subjectArtById: Record<Subject, string> = { math: "island-math", mandarin: "island-mandarin", english: "island-english" };
const subjectNames = SUBJECT_NAMES;

function skillTitle(skillId: string, locale: Locale): string {
  const skill = SKILLS.find((item) => item.id === skillId);
  return skill ? (locale === "en" ? skill.title : skill.shortTitle) : "";
}

function learningLevelLabel(level: LearningLevel, locale: Locale): string {
  const copy = uiCopyFor(locale);
  return level === "K2" ? copy.parent.levelK2 : level === "P1" ? copy.parent.levelP1 : copy.parent.levelP2;
}

function ageLabel(ageYears: number, locale: Locale): string {
  return locale === "en" ? `${ageYears} yrs` : `${ageYears} 岁`;
}

function insightReasonText(reason: "review-due" | "prerequisite-gap" | "weak-skill" | "new-skill", locale: Locale): string {
  if (locale === "zh") return { "review-due": "到了复习时间", "prerequisite-gap": "先补一个基础点", "weak-skill": "这一项还需要再练", "new-skill": "可以开始新内容" }[reason];
  return { "review-due": "Due for review", "prerequisite-gap": "Fill a prerequisite first", "weak-skill": "Needs more practice", "new-skill": "Ready for new content" }[reason];
}

function avatarLabel(id: string, locale: Locale): string {
  const item = avatarFor(id);
  return locale === "en" ? item.label.replace(/头像$/, "") + " avatar" : item.label;
}
const mappedOfficialOutcomeIds = new Set([
  ...SKILLS.flatMap((skill) => skill.officialOutcomes.map((mapping) => mapping.outcomeId)),
  ...OFFICIAL_ACTIVITIES.flatMap((activity) => activity.outcomeMappings.map((mapping) => mapping.outcomeId))
]);
const excludedOfficialOutcomeCount = OFFICIAL_OUTCOMES.filter((outcome) => outcome.productScope === "excluded-no-writing").length;
const uncoveredOfficialOutcomeCount = OFFICIAL_OUTCOMES.filter((outcome) => outcome.productScope !== "excluded-no-writing" && !mappedOfficialOutcomeIds.has(outcome.id)).length;
const supplementarySkillCount = SKILLS.filter((skill) => skill.provenanceScope === "supplementary-practice").length;

function createSalt(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function dailyQuestionCount(value: number): 6 | 8 | 10 {
  return value === 6 ? 6 : value === 10 ? 10 : 8;
}

function completeSessionForChild(child: ChildProfile, session: SessionRecord): SessionCompletionOutcome | null {
  const completed = completeSession(session, child);
  if (!completed) return null;
  child.diagnostics[session.subject] = { completedAt: completed.completedAt!, sessionId: completed.id };
  child.sessions.push(completed);
  delete child.activeSessions[session.subject];

  if (!child.settings.rewardsEnabled) {
    return { session: completed, starsAwarded: 0, lifetimeStars: child.rewards.lifetimeStars, newlyRedeemableCompanionIds: [] };
  }

  const redeemableBefore = new Set(getRedeemableCompanionIds(child.rewards));
  const nextRewards = applyRewardEvent(child.rewards, {
    kind: "session-complete",
    eventKey: `session-complete:${completed.id}`,
    amount: 2,
    at: new Date(completed.completedAt ?? Date.now())
  });
  const starsAwarded = nextRewards.lifetimeStars - child.rewards.lifetimeStars;
  child.rewards = nextRewards;
  return {
    session: completed,
    starsAwarded,
    lifetimeStars: nextRewards.lifetimeStars,
    newlyRedeemableCompanionIds: getRedeemableCompanionIds(nextRewards).filter((id) => !redeemableBefore.has(id))
  };
}

function childSurfaceClass(child: ChildProfile | null): string {
  if (!child) return "app-shell";
  return `app-shell ${child.settings.highContrast ? "child-high-contrast" : ""} ${child.settings.largeText ? "child-large-text" : ""}`.trim();
}

export default function App() {
  const initialStorage = readHousehold();
  const initialHousehold = initialStorage.status === "ok" ? initialStorage.household : null;
  const [household, setHousehold] = useState<HouseholdState | null>(initialHousehold);
  const householdRef = useRef<HouseholdState | null>(initialHousehold);
  const persistQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const [unlocked, setUnlocked] = useState(initialStorage.status === "empty");
  const [encryptedEnvelope, setEncryptedEnvelope] = useState<EncryptedEnvelope | null>(initialStorage.status === "encrypted" ? initialStorage.envelope : null);
  const encryptionKeyRef = useRef<CryptoKey | null>(null);
  const [recovery, setRecovery] = useState(initialStorage.status === "corrupt" ? { raw: initialStorage.raw, error: initialStorage.error } : null);
  const [storageError, setStorageError] = useState("");
  const systemLocale: Locale = household?.uiLocale ?? "zh";
  const ui = uiCopyFor(systemLocale);
  const [screen, setScreen] = useState<Screen>("profiles");
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [showParentGate, setShowParentGate] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupValues, setSetupValues] = useState({ householdName: "", parentName: "", pin: "" });
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string; mismatchCount?: number } | null>(null);
  const [summary, setSummary] = useState<SessionRecord["summary"] | null>(null);
  const [sessionReward, setSessionReward] = useState<SessionCompletionOutcome | null>(null);
  const answeringRef = useRef(false);
  const advancingRef = useRef(false);
  const startingSubjectRef = useRef(false);

  useEffect(() => {
    document.documentElement.lang = systemLocale === "zh" ? "zh-Hans" : "en";
  }, [systemLocale]);

  useEffect(() => {
    const stopOnHide = () => stopAudio();
    const stopWhenHidden = () => { if (document.visibilityState === "hidden") stopAudio(); };
    window.addEventListener("pagehide", stopOnHide);
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      window.removeEventListener("pagehide", stopOnHide);
      document.removeEventListener("visibilitychange", stopWhenHidden);
      stopAudio();
    };
  }, []);

  useEffect(() => {
    if (screen !== "assessment" && screen !== "speaking") stopAudio();
  }, [screen]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [screen]);

  const activeChild = household?.children.find((child) => child.id === activeChildId) ?? null;
  const storageBanner = storageError ? <div className="storage-banner" role="alert">{ui.storageError}</div> : null;

  function applyHousehold(next: HouseholdState | null) {
    householdRef.current = next;
    setHousehold(next);
  }

  if (recovery) {
    return <RecoveryScreen recovery={recovery} onReset={() => { clearHousehold(); setRecovery(null); applyHousehold(null); setUnlocked(true); setStorageError(""); }} />;
  }

  async function createHousehold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validatePin(setupValues.pin)) {
      setSetupError("家长密码需要 4 到 6 位数字");
      return;
    }
    const pinSalt = createSalt();
    const pinHash = await hashPin(setupValues.pin, pinSalt);
    const next: HouseholdState = {
      version: 4,
      uiLocale: "zh",
      householdName: setupValues.householdName.trim() || "小芽家庭",
      parentName: setupValues.parentName.trim() || "家长",
      pinHash,
      pinSalt,
      createdAt: new Date().toISOString(),
      children: []
    };
    const sealed = await createEncryptedHousehold(next, setupValues.pin);
    const result = writeEncryptedEnvelope(sealed.envelope);
    if (!result.ok) {
      setSetupError(UI_COPY.setup.saveError);
      return;
    }
    encryptionKeyRef.current = sealed.key;
    setEncryptedEnvelope(sealed.envelope);
    applyHousehold(next);
    setUnlocked(true);
    setSetupError("");
  }

  function commitHousehold(update: (current: HouseholdState) => HouseholdState): Promise<boolean> {
    const operation = async () => {
      try {
        const current = householdRef.current;
        if (!current) return false;
        const key = encryptionKeyRef.current;
        if (!key) {
          setStorageError("当前会话没有可用的加密密钥，请重新解锁");
          return false;
        }
        const next = update(current);
        const result = await saveEncryptedHousehold(next, key);
        if (!result.ok) {
          setStorageError(result.error);
          return false;
        }
        applyHousehold(next);
        setStorageError("");
        return true;
      } catch (error) {
        setStorageError(error instanceof Error ? error.message : String(error));
        return false;
      }
    };
    const queued = persistQueueRef.current.then(operation, operation);
    persistQueueRef.current = queued;
    return queued;
  }

  async function addChild(child: ChildProfile): Promise<boolean> {
    return commitHousehold((current) => ({ ...current, children: [...current.children, child] }));
  }

  async function deleteChild(childId: string): Promise<boolean> {
    return commitHousehold((current) => ({ ...current, children: current.children.filter((child) => child.id !== childId) }));
  }

  async function updateChild(childId: string, update: (child: ChildProfile) => ChildProfile): Promise<boolean> {
    return commitHousehold((current) => ({
      ...current,
      children: current.children.map((child) => child.id === childId ? update(clone(child)) : child)
    }));
  }

  async function importBackup(next: HouseholdState) {
    const saved = await commitHousehold((current) => ({
      ...next,
      version: 4,
      uiLocale: current.uiLocale,
      householdName: current.householdName,
      parentName: current.parentName,
      pinHash: current.pinHash,
      pinSalt: current.pinSalt
    }));
    if (saved) {
      setActiveChildId(null);
      setScreen("parent");
    }
  }

  async function handleLegacyUnlock(pin: string) {
    if (!household) return;
    try {
      const sealed = await createEncryptedHousehold(household, pin);
      const result = writeEncryptedEnvelope(sealed.envelope);
      if (!result.ok) setStorageError(result.error);
      encryptionKeyRef.current = sealed.key;
      setEncryptedEnvelope(sealed.envelope);
      setUnlocked(true);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : String(error));
      setUnlocked(true);
    }
  }

  async function lockHousehold() {
    const mutations = await persistQueueRef.current;
    const pending = await flushStorageWrites();
    if (!mutations || !pending.ok) {
      if (!pending.ok) setStorageError(pending.error);
      return;
    }
    encryptionKeyRef.current = null;
    applyHousehold(null);
    setActiveChildId(null);
    setSession(null);
    setCurrentQuestion(null);
    setUnlocked(false);
    const stored = readHousehold();
    if (stored.status === "encrypted") setEncryptedEnvelope(stored.envelope);
    else if (stored.status === "ok") applyHousehold(stored.household);
    else if (stored.status === "corrupt") setRecovery({ raw: stored.raw, error: stored.error });
  }

  function startSubject(subject: Subject) {
    void startSubjectAsync(subject);
  }

  async function startSubjectAsync(subject: Subject) {
    if (!activeChild || startingSubjectRef.current) return;
    startingSubjectRef.current = true;
    try {
      const existing = activeChild.activeSessions?.[subject];
      const dailyPlanResult = !existing && activeChild.diagnostics[subject]
        ? buildDailyPlan({
            child: activeChild,
            subject,
            dateKey: singaporeDateKey(new Date()),
            questionCount: dailyQuestionCount(activeChild.settings.sessionLength)
          })
        : null;
      const nextSession = existing
        ?? (dailyPlanResult?.status === "ready"
          ? createDailySession(activeChild, subject, dailyPlanResult.plan)
          : createAdaptiveSession(activeChild, subject));
      if (!existing) {
        const saved = await updateChild(activeChild.id, (child) => {
          child.activeSessions[subject] = nextSession;
          return child;
        });
        if (!saved) return;
      }
      const question = selectNextQuestion(activeChild, nextSession);
      if (nextSession.attempts.length >= nextSession.length) {
        const completion: { outcome: SessionCompletionOutcome | null } = { outcome: null };
        const saved = await updateChild(activeChild.id, (current) => {
          completion.outcome = completeSessionForChild(current, nextSession);
          if (!completion.outcome) return current;
          return current;
        });
        const outcome = completion.outcome;
        if (!saved || !outcome) return;
        setSession(outcome.session);
        setSummary(outcome.session.summary);
        setSessionReward(outcome);
        setScreen("result");
        return;
      }
      setSessionReward(null);
      setSession(nextSession);
      setCurrentQuestion(question);
      setFeedback(null);
      setSummary(null);
      setScreen("assessment");
    } finally {
      startingSubjectRef.current = false;
    }
  }

  async function answerQuestion(correct: boolean, answer: string, mismatchCount = 0, hintUsed = false): Promise<boolean> {
    if (!activeChild || !session || !currentQuestion || feedback || answeringRef.current) return false;
    answeringRef.current = true;
    try {
      let nextSession: SessionRecord | null = null;
      const saved = await updateChild(activeChild.id, (child) => {
        nextSession = recordSessionAnswer(child, session, {
          questionId: currentQuestion.id,
          correct,
          hintUsed
        });
        child.activeSessions[session.subject] = nextSession;
        return child;
      });
      if (saved && nextSession) {
        const language = session.subject === "mandarin" ? "zh-CN" : "en-US";
        playOrSpeak(correct ? (language === "zh-CN" ? VOICE_LINES.correctZh : VOICE_LINES.correctEn) : (language === "zh-CN" ? VOICE_LINES.wrongZh : VOICE_LINES.wrongEn), language);
        setSession(nextSession);
        setFeedback({ correct, answer, mismatchCount });
        return true;
      }
      return false;
    } finally {
      answeringRef.current = false;
    }
  }

  async function advanceSession() {
    if (!activeChild || !session || advancingRef.current) return;
    advancingRef.current = true;
    try {
      if (session.attempts.length >= session.length) {
        const completion: { outcome: SessionCompletionOutcome | null } = { outcome: null };
        const saved = await updateChild(activeChild.id, (child) => {
          completion.outcome = completeSessionForChild(child, session);
          if (!completion.outcome) return child;
          return child;
        });
        const outcome = completion.outcome;
        if (!saved || !outcome) return;
        setSession(outcome.session);
        setSummary(outcome.session.summary);
        setSessionReward(outcome);
        setScreen("result");
        setFeedback(null);
        return;
      }
      setCurrentQuestion(selectNextQuestion(activeChild, session));
      setFeedback(null);
      const language = session.subject === "mandarin" ? "zh-CN" : "en-US";
      playOrSpeak(language === "zh-CN" ? VOICE_LINES.nextZh : VOICE_LINES.nextEn, language);
    } finally {
      advancingRef.current = false;
    }
  }

  function startRecommendedLearning() {
    if (!activeChild) return;
    const priority = { "review-due": 0, "prerequisite-gap": 1, "weak-skill": 2, "new-skill": 3 } as const;
    const recommendation = buildChildInsights(activeChild).sort((a, b) => priority[a.reason] - priority[b.reason])[0];
    const subject = recommendation?.subject ?? "math";
    const voice = subject === "math" ? "Today we will start with mathematics. Ready?" : subject === "mandarin" ? VOICE_LINES.startMandarin : "Today we will start with English. Ready?";
    playOrSpeak(voice, subject === "mandarin" ? "zh-CN" : "en-US");
    startSubject(subject);
  }



  async function recordHandwriting(entry: HandwritingCharacter, mistakes: number): Promise<boolean> {
    if (!activeChild) return false;
    const childId = activeChild.id;
    return updateChild(childId, (child) => {
      const previous = child.handwriting[entry.character];
      child.handwriting[entry.character] = {
        character: entry.character,
        lastCompletedAt: new Date().toISOString(),
        bestMistakes: previous ? Math.min(previous.bestMistakes, mistakes) : mistakes,
        attempts: (previous?.attempts ?? 0) + 1
      };
      return child;
    });
  }

  function openCompanions() {
    setScreen("companions");
  }

  async function handleRedeemCompanion(companionId: string): Promise<boolean> {
    if (!activeChild) return false;
    return updateChild(activeChild.id, (child) => {
      child.rewards = redeemCompanion(child.rewards, companionId);
      return child;
    });
  }

  async function handleSetActiveCompanion(companionId: string): Promise<boolean> {
    if (!activeChild) return false;
    return updateChild(activeChild.id, (child) => {
      child.rewards = setActiveCompanion(child.rewards, companionId);
      return child;
    });
  }

  if (encryptedEnvelope && !household) {
    return <SecureUnlockScreen envelope={encryptedEnvelope} onUnlocked={(state, key) => {
      encryptionKeyRef.current = key;
      applyHousehold(state);
      setUnlocked(true);
    }} onRecover={() => {
      clearHousehold();
      setEncryptedEnvelope(null);
      applyHousehold(null);
      setUnlocked(true);
    }} />;
  }

  if (!household) {
    return (
      <div className="app-shell setup-shell">
        <div className="setup-card">
          <div className="setup-mark"><img src="./assets/images/brand-mark.png" alt="" /></div>
          <p className="eyebrow">{UI_COPY.setup.eyebrow}</p>
          <h1>{UI_COPY.setup.title}</h1>
          <p className="setup-copy">{UI_COPY.setup.body}</p>
          <form onSubmit={createHousehold} className="setup-form">
            <label><span>{UI_COPY.setup.householdNameLabel}</span><input aria-label={UI_COPY.setup.householdNameLabel} placeholder={UI_COPY.setup.householdNamePlaceholder} value={setupValues.householdName} onChange={(event) => setSetupValues({ ...setupValues, householdName: event.target.value })} /></label>
            <label><span>{UI_COPY.setup.parentNameLabel}</span><input aria-label={UI_COPY.setup.parentNameLabel} placeholder={UI_COPY.setup.parentNamePlaceholder} value={setupValues.parentName} onChange={(event) => setSetupValues({ ...setupValues, parentName: event.target.value })} /></label>
            <label><span>{UI_COPY.setup.pinLabel}</span><input aria-label={UI_COPY.setup.pinLabel} type="password" inputMode="numeric" maxLength={6} placeholder={UI_COPY.setup.pinPlaceholder} value={setupValues.pin} onChange={(event) => setSetupValues({ ...setupValues, pin: event.target.value.replace(/[^0-9]/g, "") })} /></label>
            {setupError ? <p className="form-error" role="alert">{setupError}</p> : null}
            <button className="primary-button wide-button" type="submit"><ShieldCheck aria-hidden="true" />{UI_COPY.setup.submit}</button>
          </form>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return <UnlockScreen household={household} onUnlocked={handleLegacyUnlock} />;
  }

  const backToProfiles = () => {
    setActiveChildId(null);
    setSession(null);
    setCurrentQuestion(null);
    setScreen("profiles");
  };

  if (screen === "parent") {
    return <>{storageBanner}<ParentDashboard household={household} locale={systemLocale} onSetSystemLocale={(locale) => commitHousehold((current) => ({ ...current, uiLocale: locale }))} onBack={backToProfiles} onAddChild={addChild} onDeleteChild={deleteChild} onUpdateChild={updateChild} onLock={lockHousehold} onImport={importBackup} /></>;
  }

  if (screen === "handwriting" && activeChild) {
    return <>{storageBanner}<HandwritingScreen child={activeChild} onBack={() => setScreen("child")} onLock={lockHousehold} onRecord={recordHandwriting} /></>;
  }

  if (screen === "speaking" && activeChild) {
    return <>{storageBanner}<SpeakingScreen child={activeChild} onBack={() => setScreen("child")} onLock={lockHousehold} /></>;
  }

  if (screen === "companions" && activeChild) {
    return (
      <div className={childSurfaceClass(activeChild)}>
        {storageBanner}
        <CompanionShop
          rewards={activeChild.rewards}
          animationsEnabled={activeChild.settings.companionAnimationsEnabled}
          locale={systemLocale}
          onBack={() => setScreen("child")}
          onRedeem={handleRedeemCompanion}
          onSetActive={handleSetActiveCompanion}
        />
      </div>
    );
  }

  if (screen === "assessment" && activeChild && session && currentQuestion) {
    return (
      <div className={childSurfaceClass(activeChild)}>
        {storageBanner}
        <SessionHeader child={activeChild} subject={session.subject} kind={session.kind} answered={session.attempts.length} total={session.length} onBack={() => setScreen("child")} />
        <QuizScreen
          question={currentQuestion}
          feedback={feedback}
          onAnswer={answerQuestion}
          onNext={advanceSession}
          isNewSkill={session.kind === "practice" && !(activeChild.evidence[currentQuestion.skillId]?.nEff > 0) && !session.attempts.some((attempt) => attempt.skillId === currentQuestion.skillId)}
        />
      </div>
    );
  }

  if (screen === "result" && activeChild && session && summary) {
    return (
      <div className={childSurfaceClass(activeChild)}>
        {storageBanner}
        <SessionResult child={activeChild} subject={session.subject} kind={session.kind} session={session} summary={summary} reward={sessionReward} onDone={() => setScreen("child")} onParent={() => { setShowParentGate(true); }} />
        {showParentGate ? <ParentPinDialog household={household} locale={systemLocale} onCancel={() => setShowParentGate(false)} onSuccess={() => { setShowParentGate(false); setScreen("parent"); }} /> : null}
      </div>
    );
  }

  if (screen === "profiles") {
    return (
      <div className="app-shell">
        {storageBanner}
        <TopBar title={household.householdName} subtitle={systemLocale === "en" ? "Choose avatar" : "先选一个头像"} onParent={() => setShowParentGate(true)} onLock={lockHousehold} locale={systemLocale} />
        <main className="profile-screen">
          <div className="profile-heading"><p className="eyebrow">{ui.profiles.eyebrow}</p><h1>{ui.profiles.title}</h1><p>{ui.profiles.body}</p></div>
          <div className="profile-grid">
            {household.children.map((child) => {
              const currentAge = ageYearsForProfile(child);
              return (
                <button key={child.id} className="profile-card" type="button" onClick={() => { setActiveChildId(child.id); setScreen("child"); }} aria-label={ui.profiles.profileAria(child.name)}>
                  <ChildAvatar avatar={child.avatar} />
                  <strong>{child.name}</strong><small>{ageLabel(currentAge, systemLocale)} · {learningLevelLabel(child.gradeLevel, systemLocale)}</small><span>{Object.keys(child.diagnostics).length ? ui.profiles.started : ui.profiles.needsStart}</span><ChevronRight aria-hidden="true" />
                </button>
              );
            })}
            {household.children.length === 0 ? (
              <div className="empty-panel profile-empty">
                <img className="empty-scene" src="./assets/images/scene-empty.png" alt="" />
                <p>{ui.profiles.empty}</p>
              </div>
            ) : null}
          </div>
          {household.children.length > 0 ? (
            <section className="profiles-welcome" aria-label={systemLocale === "en" ? "Welcome to the island" : "小岛欢迎"}>
              <div className="profiles-welcome-copy">
                <p className="eyebrow">{ui.profiles.welcomeEyebrow}</p>
                <h2>{ui.profiles.welcomeTitle}</h2>
                <p>{ui.profiles.welcomeBody}</p>
                <span className="profiles-welcome-note">{ui.profiles.welcomeNote}</span>
              </div>
              <div className="profiles-welcome-art" aria-hidden="true"><img src="./assets/images/scene-profiles.png" alt="" /></div>
            </section>
          ) : null}
        </main>
        {showParentGate ? <ParentPinDialog household={household} locale={systemLocale} onCancel={() => setShowParentGate(false)} onSuccess={() => { setShowParentGate(false); setScreen("parent"); }} /> : null}
      </div>
    );
  }

  const homeInsight = activeChild
    ? buildChildInsights(activeChild).sort((a, b) => ({ "review-due": 0, "prerequisite-gap": 1, "weak-skill": 2, "new-skill": 3 }[a.reason] - { "review-due": 0, "prerequisite-gap": 1, "weak-skill": 2, "new-skill": 3 }[b.reason]))[0]
    : null;
  const homeSubject = homeInsight?.subject ?? "math";
  const homeSession = activeChild?.activeSessions[homeSubject];
  const homeRemaining = Math.max(1, (homeSession?.length ?? activeChild?.settings.sessionLength ?? 8) - (homeSession?.attempts.length ?? 0));
  const homeHasSession = Boolean(homeSession && homeSession.attempts.length < homeSession.length);
  const writingCompleted = activeChild ? HANDWRITING_CHARACTERS.filter((item) => activeChild.handwriting[item.character]).length : 0;
  const homeCards = subjectCards.map((card) => systemLocale === "en"
    ? {
        ...card,
        title: subjectName(card.subject, "en"),
        shortLabel: subjectName(card.subject, "en"),
        subtitle: card.subject === "math" ? "Number sense, addition and subtraction, shapes and patterns." : card.subject === "mandarin" ? "Pinyin, character recognition and short sentences." : "Letter sounds, phonics and basic words."
      }
    : card);

  return (
    <div className={childSurfaceClass(activeChild)}>
      {storageBanner}
      <TopBar title={activeChild?.name ?? ui.child.topbarFallback} subtitle={ui.child.subtitle} locale={systemLocale} onBack={backToProfiles} onLock={lockHousehold} />
      {activeChild ? (
        <main className="child-home">
          <section className="child-teacher">
            <div className="teacher-mascot child-mascot" aria-hidden="true"><img src="./assets/images/sprout-teacher.png" alt="" /><i /><i /><i /></div>
            <div className="teacher-bubble child-teacher-bubble">
              <small>{ui.child.teacher}</small>
              <h1>{ui.child.greeting(activeChild.name)}</h1>
              <p>{ui.child.body}</p>
            </div>
            <button className="primary-button teacher-start" type="button" onClick={startRecommendedLearning}>{ui.child.start}<small aria-hidden="true">{homeHasSession ? ui.child.startContinue(subjectName(homeSubject, systemLocale), homeRemaining) : ui.child.startToday(subjectName(homeSubject, systemLocale), homeRemaining)}</small><ArrowRight aria-hidden="true" /></button>
          </section>
          <div className="island-trail" aria-hidden="true" data-testid="island-trail">
            <span className="island-trail-label">{ui.child.todayTrail}</span>
            <div className="island-trail-track">
              {homeCards.map((card, index) => (
                <span key={card.subject} className={`island-trail-stop ${homeSubject === card.subject ? "is-current" : ""}`} data-testid="island-trail-stop">
                  <i>{index + 1}</i>
                  <b>{card.shortLabel}</b>
                </span>
              ))}
            </div>
          </div>
          <div className="subject-grid">
            {homeCards.map((card, index) => {
              const progress = buildSubjectProgressView(activeChild, card.subject);
              const reviewCount = Math.min(progress.dueReviewCount, activeChild.settings.sessionLength <= 6 ? 1 : 2);
              const isToday = homeSubject === card.subject;
              return (
              <button key={card.subject} className={`subject-card ${card.className}${isToday ? " is-today" : ""}`} type="button" aria-label={card.title} onClick={() => startSubject(card.subject)}>
                <div className="subject-art">
                  <span className="island-step" aria-hidden="true">{index + 1}</span>
                  {progress.todayCompleted ? (
                    <span className="island-done" aria-hidden="true" data-testid="island-done"><Check aria-hidden="true" /></span>
                  ) : null}
                  <img src={`./assets/images/${card.image}.png`} alt="" />
                </div>
                <div className="subject-copy">
                  <div className="subject-kicker">
                    <span>{ui.child.island}</span>
                    {isToday ? <em className="today-tag" data-testid="island-today">{ui.child.todayHere}</em> : null}
                  </div>
                  <strong>{card.title}</strong>
                  <DailyMissionCard
                    progress={progress}
                    hasDiagnostic={Boolean(activeChild.diagnostics[card.subject])}
                    hasActiveSession={Boolean(activeChild.activeSessions[card.subject])}
                    reviewCount={reviewCount}
                    locale={systemLocale}
                  />
                </div>
                <div className="subject-status"><Star aria-hidden="true" /><span>{activeChild.activeSessions[card.subject] ? ui.child.continueSubject : activeChild.diagnostics[card.subject] ? ui.child.practiceSubject : ui.child.beginSubject}</span><ChevronRight aria-hidden="true" /></div>
              </button>
              );
            })}
          </div>
          {activeChild.settings.rewardsEnabled ? (
            <CompanionHomeCard
              rewards={activeChild.rewards}
              animationsEnabled={activeChild.settings.companionAnimationsEnabled}
              onOpen={openCompanions}
              locale={systemLocale}
            />
          ) : null}
        </main>
      ) : null}
    </div>
  );
}

function UnlockScreen({ household, onUnlocked }: { household: HouseholdState; onUnlocked: (pin: string) => void | Promise<void> }) {
  const copy = uiCopyFor(household.uiLocale);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validatePin(pin)) { setError(household.uiLocale === "en" ? "Enter a 4 to 6 digit PIN" : "请输入 4 到 6 位数字"); return; }
    setChecking(true);
    const result = await hashPin(pin, household.pinSalt);
    setChecking(false);
    if (result === household.pinHash) await onUnlocked(pin);
    else setError(household.uiLocale === "en" ? "That PIN is not correct. Try again." : "密码不正确，请再试一次");
  }
  return (
    <div className="app-shell setup-shell">
      <div className="setup-card unlock-card">
        <div className="setup-mark"><img src="./assets/images/brand-mark.png" alt="" /></div>
        <p className="eyebrow">{household.householdName}</p>
        <h1>{copy.unlock.title}</h1>
        <p className="setup-copy">{copy.unlock.plainBody}</p>
        <form onSubmit={submit} className="setup-form">
          <label><span>{copy.setup.pinLabel}</span><input aria-label={copy.setup.pinLabel} type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value.replace(/[^0-9]/g, "")); setError(""); }} autoFocus /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button wide-button" type="submit" disabled={checking}><ShieldCheck aria-hidden="true" />{copy.unlock.open}</button>
        </form>
      </div>
    </div>
  );
}

function SecureUnlockScreen({ envelope, onUnlocked, onRecover }: { envelope: EncryptedEnvelope; onUnlocked: (household: HouseholdState, key: CryptoKey) => void; onRecover: () => void }) {
  const copy = uiCopyFor(envelope.uiLocale);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validatePin(pin)) { setError(copy.unlock.invalidPin); return; }
    setChecking(true);
    try {
      const result = await unlockEncryptedHousehold(envelope, pin);
      onUnlocked(result.household, result.key);
    } catch {
      setError(copy.unlock.wrongPin);
      setFailedAttempts((count) => count + 1);
    } finally {
      setChecking(false);
    }
  }
  return (
    <div className="app-shell setup-shell">
      <div className="setup-card unlock-card">
        <div className="setup-mark"><img src="./assets/images/brand-mark.png" alt="" /></div>
        <p className="eyebrow">{copy.unlock.eyebrow}</p>
        <h1>{copy.unlock.title}</h1>
        <p className="setup-copy">{copy.unlock.encryptedBody}</p>
        <form onSubmit={submit} className="setup-form">
          <label><span>{copy.setup.pinLabel}</span><input aria-label={copy.setup.pinLabel} type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value.replace(/[^0-9]/g, "")); setError(""); }} autoFocus /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button wide-button" type="submit" disabled={checking}><ShieldCheck aria-hidden="true" />{copy.unlock.open}</button>
          {failedAttempts > 0 ? <button className="quiet-button wide-button" type="button" onClick={() => {
            downloadJson(envelope, `little-sprout-encrypted-${new Date().toISOString().slice(0, 10)}.json`);
            if (window.confirm(copy.unlock.recoverConfirm)) onRecover();
          }}>{copy.unlock.recover}</button> : null}
        </form>
      </div>
    </div>
  );
}

function RecoveryScreen({ recovery, onReset }: { recovery: { raw: string; error: string }; onReset: () => void }) {
  function downloadBackup() {
    downloadText(recovery.raw, `little-sprout-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }
  return (
    <div className="app-shell setup-shell">
      <div className="setup-card">
        <div className="setup-mark"><ShieldCheck aria-hidden="true" /></div>
        <p className="eyebrow">数据保护</p>
        <h1>学习记录需要恢复</h1>
        <p className="setup-copy">这份数据无法读取。系统没有覆盖它。请先下载原文件，再决定是否重新建立家庭学习区。</p>
        <div className="recovery-detail">{recovery.error}</div>
        <div className="dialog-actions">
          <button className="quiet-button" type="button" onClick={downloadBackup}>下载原始数据</button>
          <button className="primary-button" type="button" onClick={onReset}>清除并重新建立</button>
        </div>
      </div>
    </div>
  );
}

function ParentPinDialog({ household, onCancel, onSuccess, locale }: { household: HouseholdState; onCancel: () => void; onSuccess: () => void; locale: Locale }) {
  const copy = uiCopyFor(locale);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validatePin(pin)) { setError(locale === "en" ? "Enter a 4 to 6 digit PIN" : "请输入 4 到 6 位数字"); return; }
    const result = await hashPin(pin, household.pinSalt);
    if (result === household.pinHash) onSuccess();
    else setError(locale === "en" ? "That PIN is not correct." : "密码不正确");
  }
  return (
    <div className="modal-backdrop">
      <div className="modal-card" role="dialog" aria-modal="true">
        <p className="eyebrow">{locale === "en" ? "Parent access" : "家长权限"}</p><h2>{locale === "en" ? "Open parent settings" : "进入家长设置"}</h2>
        <p className="setup-copy">{locale === "en" ? "Enter the parent PIN again before opening settings." : "进入设置前，请再次输入家长密码。"}</p>
        <form onSubmit={submit} className="dialog-form">
          <label><span>{locale === "en" ? "Confirm parent PIN" : "家长密码确认"}</span><input aria-label={locale === "en" ? "Confirm parent PIN" : "家长密码确认"} type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/[^0-9]/g, ""))} autoFocus /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions"><button className="quiet-button" type="button" onClick={onCancel}>{locale === "en" ? "Cancel" : "取消"}</button><button className="primary-button" type="submit">{locale === "en" ? "Open settings" : "进入设置"}</button></div>
        </form>
      </div>
    </div>
  );
}

function TopBar({ title, subtitle, onBack, onParent, onLock, locale }: { title: string; subtitle: string; onBack?: () => void; onParent?: () => void; onLock?: () => void; locale: Locale }) {
  const copy = uiCopyFor(locale);
  return (
    <header className="app-header">
      <button className="brand-button" type="button" onClick={onBack} aria-label={locale === "en" ? "Back to profiles" : "回到孩子选择"}>
        <img className="brand-mark" src="./assets/images/brand-mark.png" alt="" />
        <span className="brand-copy"><strong>{title}</strong><small>{subtitle}</small></span>
      </button>
      <div className="header-tools">
        {onParent
          ? <button className="header-badge header-parent-button" type="button" onClick={onParent} aria-label={copy.profiles.parentEntry}><ShieldCheck aria-hidden="true" /><span className="parent-entry-full">{copy.profiles.parentEntry}</span><span className="parent-entry-short">{locale === "en" ? "Parent" : "家长"}</span></button>
          : <div className="header-badge"><ShieldCheck aria-hidden="true" /><span>{locale === "en" ? "Family edition" : "家庭版"}</span></div>}
        {onLock ? <button className="icon-button" type="button" onClick={() => void onLock()} aria-label={copy.parent.lock}><Lock aria-hidden="true" /></button> : null}
      </div>
    </header>
  );
}

function SessionHeader({ child, subject, kind, answered, total, onBack }: { child: ChildProfile; subject: Subject; kind: "diagnostic" | "practice"; answered: number; total: number; onBack: () => void }) {
  const locale = subjectLocale(subject);
  const copy = uiCopyFor(locale);
  return (
    <header className="session-header">
      <button className="quiet-button compact-button" type="button" onClick={onBack}><ChevronLeft aria-hidden="true" />{copy.session.exit}</button>
      <div><p className="eyebrow">{copy.child.sessionBrand(child.name)}</p><h1>{copy.session.sessionTitle(subjectName(subject, locale), kind)}</h1></div>
      <div className="session-progress"><span>{answered} / {total}</span><div><i style={{ width: `${(answered / total) * 100}%` }} /></div></div>
    </header>
  );
}

export function QuizScreen({ question, feedback, onAnswer, onNext, isNewSkill }: { question: Question; feedback: { correct: boolean; answer: string; mismatchCount?: number } | null; onAnswer: (correct: boolean, answer: string, mismatchCount?: number, hintUsed?: boolean) => Promise<boolean>; onNext: () => void; isNewSkill: boolean }) {
  const options = useMemo(() => question.kind === "choice" ? deterministicOptions(question) : [], [question]);
  const correct = Boolean(feedback?.correct);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const retryRef = useRef<HTMLDivElement | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [pendingWrong, setPendingWrong] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<{ id: string; status: "playing" | "error" } | null>(null);
  const locale = subjectLocale(question.subject);
  const copy = uiCopyFor(locale);
  const hint = hintForQuestion(question, locale);
  const teach = isNewSkill ? teachForQuestion(question, locale) : null;
  const language = question.audioLanguage ?? (question.subject === "mandarin" ? "zh-CN" : "en-US");
  const teachLanguage = locale === "en" ? "en-US" : "zh-CN";
  const contentLanguage = locale === "zh" ? "zh-Hans" : "en";

  useEffect(() => {
    setHintOpen(false);
    setHintUsed(false);
    setPendingWrong(null);
    setAudioStatus(null);
  }, [question.id]);

  useEffect(() => {
    setAudioStatus(null);
  }, [feedback]);

  useEffect(() => () => stopAudio(), []);

  useEffect(() => {
    stopAudio();
  }, [question.id]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [question.id]);

  useEffect(() => {
    if (!feedback || !feedbackRef.current || typeof feedbackRef.current.scrollIntoView !== "function") return;
    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [feedback]);

  useEffect(() => {
    if (feedback) {
      setHintOpen(false);
      setPendingWrong(null);
    }
  }, [feedback]);

  useEffect(() => {
    if (!pendingWrong || !retryRef.current || typeof retryRef.current.scrollIntoView !== "function") return;
    retryRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pendingWrong]);

  function showHint() {
    setHintOpen(true);
    setHintUsed(true);
  }

  function choose(option: string) {
    if (feedback || question.kind !== "choice") return;
    if (option === question.correctAnswer) {
      void onAnswer(true, option, 0, hintUsed || Boolean(teach));
      return;
    }
    if (!pendingWrong) {
      setPendingWrong(option);
      showHint();
      return;
    }
    void onAnswer(false, option, 0, true);
  }

  function showAnswer() {
    if (!pendingWrong) return;
    void onAnswer(false, pendingWrong, 0, true);
  }

  function playQuizAudio(id: string, text: string, languageCode: string) {
    setAudioStatus({ id, status: "playing" });
    playOrSpeak(text, languageCode, (status) => {
      if (status === "ended") {
        setAudioStatus((current) => current?.id === id ? null : current);
      } else if (status === "error") {
        setAudioStatus((current) => current?.id === id ? { id, status: "error" } : current);
      }
    });
  }

  function audioStateFor(id: string): "playing" | "error" | null {
    return audioStatus?.id === id ? audioStatus.status : null;
  }

  function audioTextFor(id: string, fallback: string): string {
    const status = audioStateFor(id);
    return status === "playing" ? copy.session.audioPlaying : status === "error" ? copy.session.audioError : fallback;
  }

  const matchQuestion = question.kind === "match" ? question : null;
  const questionAudioStatus = audioStateFor("question");
  const teachAudioStatus = audioStateFor("teach");
  const hintAudioStatus = audioStateFor("hint");
  const feedbackAudioStatus = audioStateFor("feedback");
  const teachInitiallyOpen = typeof window === "undefined" || (window.innerWidth >= 768 && window.innerHeight >= 700);
  return (
    <main className={`quiz-layout quiz-${question.subject}${question.passage ? " quiz-reading" : ""}${matchQuestion ? " quiz-match" : ""}${feedback ? " is-feedback" : ""}`} lang={contentLanguage}>
      <section className="quiz-stage">
        <div className="quiz-skill-chip">{subjectName(question.subject, locale)}<span>{skillTitle(question.skillId, locale)}</span></div>
        <button className={`audio-button ${question.audioOnly ? "is-game-listen" : ""} ${questionAudioStatus ? `is-${questionAudioStatus}` : ""}`} type="button" onClick={() => playQuizAudio("question", preAnswerAudio(question), language)} aria-label={questionAudioStatus === "playing" ? copy.session.audioPlaying : questionAudioStatus === "error" ? copy.session.audioError : question.audioOnly ? copy.session.listenSound : copy.session.listenQuestion}><Headphones aria-hidden="true" /><span>{audioTextFor("question", question.audioOnly ? copy.session.listenSound : copy.session.listenQuestion)}</span></button>
        {teach ? (
          <details className="skill-teach" open={teachInitiallyOpen}>
            <summary>{copy.session.teachSummary}<small className="skill-teach-toggle">{copy.session.teachToggle}</small></summary>
            <div className="skill-teach-body">
              <strong>{teach.title}</strong>
              <p>{teach.body}</p>
              {teach.example ? <small>{teach.example}</small> : null}
              <button className={`quiet-button compact-button teach-audio ${teachAudioStatus ? `is-${teachAudioStatus}` : ""}`} type="button" aria-label={teachAudioStatus === "playing" ? copy.session.audioPlaying : teachAudioStatus === "error" ? copy.session.audioError : copy.session.teachAudio} onClick={() => playQuizAudio("teach", `${teach.title}${locale === "en" ? ". " : "。"}${teach.body}${teach.example ? `${locale === "en" ? ". " : "。"}${teach.example}` : ""}`, teachLanguage)}><Volume2 aria-hidden="true" />{audioTextFor("teach", copy.session.listenOnce)}</button>
            </div>
          </details>
        ) : null}
        {question.passage && !question.audioOnly ? <div className="question-passage"><span>{question.audioLanguage === "zh-CN" ? copy.session.read : "Read"}</span><p>{question.passage}</p></div> : null}
        {question.displayCharacter ? <div className="character-display">{question.displayCharacter}</div> : null}
        {question.image ? <img className="question-image" src={`./assets/images/${question.image}.png`} alt="" /> : null}
        {question.kind !== "match" ? <p className="question-instruction">{question.instruction}</p> : null}
        <h2 data-testid="question-prompt" data-question-id={question.id}>{question.prompt}</h2>
        {question.subject === "math" ? <MathTool question={question} defaultOpen={question.kind !== "match"} /> : null}
        {question.skillId === "english-sentence-order" ? <LanguageTool question={question} /> : null}
      </section>
      <section className="answer-panel">
        <div className="quiz-tools">
          <button className="hint-button" type="button" onClick={showHint} disabled={Boolean(feedback)} aria-expanded={hintOpen}><Lightbulb aria-hidden="true" />{copy.session.hint}</button>
          <small>{copy.session.hintPrompt}</small>
        </div>
        {hintOpen ? (
          <div className="hint-card" aria-live="polite">
            <div><Lightbulb aria-hidden="true" /><strong>{copy.session.hintTitle}</strong><button className={`icon-button hint-audio ${hintAudioStatus ? `is-${hintAudioStatus}` : ""}`} type="button" aria-label={hintAudioStatus === "playing" ? copy.session.audioPlaying : hintAudioStatus === "error" ? copy.session.audioError : copy.session.listenHint} onClick={() => playQuizAudio("hint", hint, language)}><Volume2 aria-hidden="true" /></button></div>
            <p>{hint}</p>
          </div>
        ) : null}
        {question.kind === "choice" ? (
          <div className="answer-grid">
            {options.map((option) => (
              <button
                key={option}
                className={`answer-option ${question.optionImages ? "image-answer" : ""} ${feedback && option === feedback.answer ? (correct ? "is-correct" : "is-wrong") : ""} ${!feedback && pendingWrong === option ? "is-wrong" : ""} ${feedback && !correct && option === question.correctAnswer ? "is-correct-answer" : ""}`}
                type="button"
                onClick={() => choose(option)}
                disabled={Boolean(feedback)}
              >
                {question.optionImages?.[option] ? <img src={`./assets/images/${question.optionImages[option]}.png`} alt="" /> : null}
                <span>{option}</span>
              </button>
            ))}
          </div>
        ) : matchQuestion ? (
          <MatchingBoard key={matchQuestion.id} question={matchQuestion} disabled={Boolean(feedback)} onComplete={(matchCorrect, mismatchCount) => onAnswer(matchCorrect, "match", mismatchCount, hintUsed || Boolean(teach))} />
        ) : null}
        {feedback ? (
          <div ref={feedbackRef} className={`answer-feedback ${correct ? "correct-feedback" : "wrong-feedback"}`} data-testid="answer-feedback" aria-live="polite">
            <div className="feedback-title">
              <img className="feedback-mascot" data-testid="feedback-mascot" src="./assets/images/sprout-teacher.png" alt="" aria-hidden="true" />
              <span className="feedback-heading">{correct
                ? <><Check aria-hidden="true" />{question.kind === "match" ? copy.session.matchCorrectTitle : copy.session.correctTitle}</>
                : <><X aria-hidden="true" />{question.kind === "match" ? copy.session.matchWrongTitle : copy.session.wrongTitle}</>}</span>
            </div>
            {question.kind === "match" && feedback.mismatchCount ? <p className="match-mismatch-note">{copy.session.matchMismatchNote(feedback.mismatchCount)}</p> : null}
            <p>{question.explanation}</p>
            <button className={`quiet-button compact-button feedback-audio ${feedbackAudioStatus ? `is-${feedbackAudioStatus}` : ""}`} type="button" aria-label={feedbackAudioStatus === "playing" ? copy.session.audioPlaying : feedbackAudioStatus === "error" ? copy.session.audioError : copy.session.explanationAudio} onClick={() => playQuizAudio("feedback", question.explanation, language)}><Volume2 aria-hidden="true" />{audioTextFor("feedback", copy.session.listenExplanation)}</button>
            <button className="primary-button wide-button" type="button" onClick={onNext}>{copy.session.next}<ArrowRight aria-hidden="true" /></button>
          </div>
        ) : pendingWrong ? (
          <div ref={retryRef} className="answer-feedback retry-feedback" data-testid="retry-feedback" aria-live="polite">
            <div className="feedback-title"><Lightbulb aria-hidden="true" />{copy.session.retryTitle}</div>
            <p>{hint}</p>
            <div className="retry-actions">
              <button className="primary-button compact-button" type="button" onClick={() => setPendingWrong(null)}>{copy.session.tryAgain}</button>
              <button className="quiet-button compact-button" type="button" onClick={showAnswer}>{copy.session.showAnswer}</button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function SessionResult({ child, subject, kind, session, summary, reward, onDone, onParent }: { child: ChildProfile; subject: Subject; kind: "diagnostic" | "practice"; session: SessionRecord; summary: SessionRecord["summary"]; reward: SessionCompletionOutcome | null; onDone: () => void; onParent: () => void }) {
  const locale = subjectLocale(subject);
  const copy = uiCopyFor(locale);
  const newlyRedeemableNames = reward?.newlyRedeemableCompanionIds.map((id) => getCompanionById(id)?.name).filter((name): name is string => Boolean(name)) ?? [];
  const correctCounts = correctCountsForSession(session);
  const practicedRows = summary.slice(0, 3);
  const extraCount = Math.max(0, summary.length - practicedRows.length);
  return (
    <main className="result-screen">
      <div className="result-hero">
        <div className="result-hero-copy"><p className="eyebrow">{kind === "diagnostic" ? copy.session.diagnosticResult : copy.session.practiceResult}</p><h1>{copy.session.resultTitle(subjectName(subject, locale), kind)}</h1><p>{kind === "diagnostic" ? copy.session.diagnosticResultBody : copy.session.practiceResultBody}</p></div>
        <div className="result-hero-art" aria-hidden="true"><img src="./assets/images/scene-result.png" alt="" /></div>
      </div>
      <div className="result-stats" aria-label={copy.session.resultAria}>
        <div><strong>{correctCounts.independent}<small>/{session.length}</small></strong><span>{copy.session.resultStatIndependent}</span></div>
        <div><strong>{session.length}</strong><span>{copy.session.resultStatDone}</span></div>
        <div><strong>{summary.length}</strong><span>{copy.session.resultStatSkills}</span></div>
      </div>
      {correctCounts.hinted > 0 ? <p className="result-note">{copy.session.resultHintedNote(correctCounts.hinted)}</p> : null}
      {child.settings.rewardsEnabled && reward ? (
        <section className="result-reward" aria-label={copy.session.rewardAria}>
          <div className="result-reward-total"><Star aria-hidden="true" /><strong>{copy.session.rewardAward(reward.starsAwarded)}</strong><span>{copy.session.rewardTotal(reward.lifetimeStars)}</span></div>
          {reward.starsAwarded === 0 ? <p>{copy.session.rewardDailyCap}</p> : null}
          {newlyRedeemableNames.map((name) => <p className="result-reward-unlock" key={name}>{copy.session.rewardUnlocked(name)}</p>)}
        </section>
      ) : null}
      {practicedRows.length ? (
        <section className="result-practiced" aria-label={copy.session.practicedAria}>
          <p className="section-label">{copy.session.practicedLabel}</p>
          <div className="result-chips">
            {practicedRows.map((row) => <span key={row.skillId}>{skillTitle(row.skillId, locale)}</span>)}
            {extraCount > 0 ? <span className="result-chip-more">{copy.session.moreItems(extraCount)}</span> : null}
          </div>
        </section>
      ) : null}
      {summary.length ? (
        <details className="result-details">
          <summary>{copy.session.resultDetailSummary(summary.length)}</summary>
          <section className="result-list">
            {summary.map((row) => <div className="result-row" key={row.skillId}><span>{skillTitle(row.skillId, locale)}</span><strong>{copy.mastery[row.level]}</strong><small>{copy.session.resultCount(row.evidenceCount)}</small></div>)}
          </section>
        </details>
      ) : null}
      <div className="result-actions"><button className="quiet-button compact-button" type="button" onClick={onParent}><ShieldCheck aria-hidden="true" />{copy.session.parentSettings}</button><button className="primary-button result-primary" type="button" onClick={onDone}>{copy.session.backToLearning}<ChevronRight aria-hidden="true" /></button></div>
    </main>
  );
}

function ParentDashboard({ household, locale, onSetSystemLocale, onBack, onAddChild, onDeleteChild, onUpdateChild, onLock, onImport }: { household: HouseholdState; locale: Locale; onSetSystemLocale: (locale: Locale) => Promise<boolean>; onBack: () => void; onAddChild: (child: ChildProfile) => Promise<boolean>; onDeleteChild: (childId: string) => Promise<boolean>; onUpdateChild: (childId: string, update: (child: ChildProfile) => ChildProfile) => Promise<boolean>; onLock: () => void | Promise<void>; onImport: (household: HouseholdState) => void }) {
  const copy = uiCopyFor(locale);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const now = new Date();

  useEffect(() => {
    void getStorageHealth().then(setStorageHealth);
  }, [household]);

  function resetSubject(child: ChildProfile, subject: Subject) {
    if (!window.confirm(copy.parent.resetConfirm(subjectName(subject, locale)))) return;
    void onUpdateChild(child.id, (next) => {
      delete next.diagnostics[subject];
      delete next.activeSessions[subject];
      for (const skill of SKILLS.filter((item) => item.subject === subject)) {
        next.evidence[skill.id] = createSkillEvidence(skill.id);
      }
      return next;
    });
  }

  function changeSessionLength(child: ChildProfile, length: number) {
    void onUpdateChild(child.id, (next) => {
      next.settings.sessionLength = length;
      return next;
    });
  }

  function applyLearningLevel(child: ChildProfile, level: LearningLevel) {
    void onUpdateChild(child.id, (next) => {
      const changed = next.gradeLevel !== level;
      next.gradeLevel = level;
      next.settings.enabledSkills = enabledSkillsForLevel(level);
      next.levelConfirmedOn = levelDateKey();
      if (changed) next.activeSessions = {};
      return next;
    });
  }

  function confirmLevelReview(child: ChildProfile, level: LearningLevel) {
    applyLearningLevel(child, level);
  }

  function changeChildSetting(child: ChildProfile, key: "highContrast" | "largeText" | "rewardsEnabled" | "companionAnimationsEnabled", enabled: boolean) {
    void onUpdateChild(child.id, (next) => {
      next.settings[key] = enabled;
      return next;
    });
  }

  function exportBackup() {
    downloadJson(household, `little-sprout-family-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }

  function exportAttemptsCsv(child: ChildProfile) {
    const rows = [
      ["child_name", "subject", "skill_id", "question_id", "correct", "hint_used", "answered_at", "session_id", "content_version"],
      ...child.attempts.map((attempt) => [
        child.name,
        attempt.subject,
        attempt.skillId,
        attempt.questionId,
        String(attempt.correct),
        String(attempt.hintUsed),
        attempt.createdAt,
        attempt.sessionId,
        CONTENT_VERSION
      ])
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
    downloadText(csv, `little-sprout-${child.name}-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
  }

  async function importBackupFile(file: File | undefined) {
    if (!file) return;
    try {
      const imported = parseHouseholdBackup(await file.text());
      if (!window.confirm(copy.parent.importConfirm)) return;
      onImport(imported);
    } catch {
      window.alert(copy.parent.importError);
    }
  }

  async function saveChild(child: ChildProfile) {
    if (await onAddChild(child)) setShowAddChild(false);
  }

  async function saveEditedChild(child: ChildProfile) {
    if (await onUpdateChild(child.id, (current) => ({
      ...current,
      name: child.name,
      avatar: child.avatar,
      ageYears: child.ageYears,
      birthYear: child.birthYear,
      gradeLevel: child.gradeLevel,
      levelConfirmedOn: child.levelConfirmedOn,
      settings: { ...current.settings, enabledSkills: child.settings.enabledSkills }
    }))) setEditingChild(null);
  }

  function deleteChild(child: ChildProfile) {
    if (!window.confirm(copy.parent.deleteConfirm(child.name))) return;
    void onDeleteChild(child.id);
  }

  async function persistStorage() {
    await requestPersistentStorage();
    setStorageHealth(await getStorageHealth());
  }

  return (
    <div className="app-shell">
      <header className="app-header parent-header">
        <div>
          <p className="eyebrow">{copy.parent.eyebrow}</p>
          <h1>{copy.parent.dashboardTitle}</h1>
          <p className="parent-intro">{copy.parent.dashboardIntro}</p>
        </div>
        <div className="dashboard-actions"><button className="quiet-button compact-button" type="button" onClick={onBack}><X aria-hidden="true" />{copy.parent.close}</button><button className="quiet-button compact-button" type="button" onClick={() => void onLock()}><Lock aria-hidden="true" />{copy.parent.lock}</button></div>
      </header>
      <main className="parent-dashboard">
        <div className="parent-toolbar">
          {household.children.length > 0 ? <button className="quiet-button compact-button" type="button" onClick={() => setShowAddChild(true)}><Plus aria-hidden="true" />{copy.parent.addChild}</button> : null}
          <label className="parent-scope system-language" title={copy.parent.systemLanguageHint}><span>{copy.parent.systemLanguage}</span><select aria-label={copy.parent.systemLanguage} value={locale} onChange={(event) => void onSetSystemLocale(event.target.value as Locale)}><option value="zh">{copy.parent.languageChinese}</option><option value="en">{copy.parent.languageEnglish}</option></select><small>{copy.parent.systemLanguageHint}</small></label>
          <details className="data-tools">
            <summary><Download aria-hidden="true" />{copy.parent.dataTools}{storageHealth?.persisted === false ? <strong className="summary-alert">{copy.parent.suggestEnable}</strong> : null}{storageHealth && storageHealth.usageRatio !== null && storageHealth.usageRatio >= 0.8 ? <strong className="summary-alert">{copy.parent.spaceLow}</strong> : null}</summary>
            <div className="data-tools-body">
              <div className="data-tools-actions">
                <button className="quiet-button compact-button" type="button" onClick={exportBackup}><Download aria-hidden="true" />{copy.parent.export}</button>
                <label className="quiet-button compact-button file-button"><Upload aria-hidden="true" />{copy.parent.import}<input type="file" accept="application/json,.json" onChange={(event) => void importBackupFile(event.target.files?.[0])} /></label>
              </div>
              {storageHealth ? (
                <div className={`storage-health ${storageHealth.usageRatio !== null && storageHealth.usageRatio >= 0.8 ? "is-warning" : ""}`}>
                  <span>{copy.parent.storageLocal(formatBytes(storageHealth.localBytes))}</span>
                  {storageHealth.usageRatio !== null && storageHealth.usageRatio >= 0.8 ? <strong>{copy.parent.storageWarning}</strong> : null}
                  {storageHealth.persisted === false ? <button className="quiet-button compact-button" type="button" onClick={() => void persistStorage()}>{copy.parent.persistStorage}</button> : null}
                </div>
              ) : null}
            </div>
          </details>
        </div>
        {household.children.length === 0 ? (
          <div className="empty-panel parent-empty">
            <img className="empty-scene" src="./assets/images/scene-empty.png" alt="" />
            <p>{copy.parent.empty}</p>
            <button className="primary-button compact-button empty-action" type="button" onClick={() => setShowAddChild(true)}><Plus aria-hidden="true" />{copy.parent.addFirstChild}</button>
          </div>
        ) : household.children.map((child) => {
          const subjectViews = (Object.keys(subjectNames) as Subject[]).map((subject) => buildSubjectProgressView(child, subject));
          const weeklySessions = subjectViews.reduce((total, view) => total + view.weeklySessions, 0);
          const weeklyCorrect = subjectViews.reduce((total, view) => total + view.weeklyIndependentCorrect, 0);
          const weeklyStable = subjectViews.reduce((total, view) => total + view.stableCount, 0);
          const weeklyDue = subjectViews.reduce((total, view) => total + view.dueReviewCount, 0);
          const completedWriting = HANDWRITING_CHARACTERS.filter((item) => child.handwriting[item.character]).length;
          const started = child.attempts.length > 0 || Object.keys(child.diagnostics).length > 0;
          const currentAge = ageYearsForProfile(child, now);
          const levelReviewDue = hasAnnualLevelReviewDue(child, now);
          return (
            <section className="parent-child-panel" key={child.id}>
              <div className="parent-child-heading">
                <ChildAvatar avatar={child.avatar} small />
                <div className="parent-child-title"><h2>{child.name}</h2><p>{ageLabel(currentAge, locale)} · {learningLevelLabel(child.gradeLevel, locale)} · {child.attempts.length ? copy.parent.childActivity(child.attempts.length, Object.keys(child.diagnostics).length) : copy.parent.notStarted}</p></div>
                <div className="child-profile-actions">
                  <button className="quiet-button compact-button" type="button" onClick={() => setEditingChild(child)}><Pencil aria-hidden="true" />{copy.parent.editChild}</button>
                  <button className="quiet-button compact-button" type="button" onClick={() => exportAttemptsCsv(child)}><Download aria-hidden="true" />{copy.parent.exportCsv}</button>
                </div>
              </div>
              {levelReviewDue ? <LevelReviewPanel child={child} locale={locale} onConfirm={(level) => confirmLevelReview(child, level)} /> : null}
              {started ? <>
                <div className="child-weekly" aria-label={copy.parent.weeklyAria(child.name)}>
                  <p className="section-label">{copy.parent.weeklyTitle}</p>
                  <div className="child-weekly-grid">
                    <div><strong>{weeklySessions}</strong><span>{copy.parent.weeklySessionsLabel}</span></div>
                    <div><strong>{weeklyCorrect}<small> {copy.parent.questionUnit}</small></strong><span>{copy.parent.weeklyCorrectLabel}</span></div>
                    <div><strong>{weeklyStable}</strong><span>{copy.parent.weeklyStableLabel}</span></div>
                    <div><strong>{weeklyDue}</strong><span>{copy.parent.weeklyDueLabel}</span></div>
                  </div>
                </div>
                <p className="section-label">{copy.parent.nextSteps}</p>
                <div className="next-actions" aria-label={copy.parent.nextAria(child.name)}>
                  {(Object.keys(subjectNames) as Subject[]).map((subject) => {
                    const insight = buildChildInsights(child).find((item) => item.subject === subject)!;
                    const hasDiagnostic = Boolean(child.diagnostics[subject]);
                    return (
                      <div className={`next-action next-action-${subject}`} key={subject}>
                        <img className="next-action-art" src={`./assets/images/${subjectArtById[subject]}.png`} alt="" aria-hidden="true" />
                        <span>{subjectName(subject, locale)}</span>
                        {hasDiagnostic ? <>
                          <strong>{skillTitle(insight.nextSkillId, locale)}</strong>
                          <small>{insight.reason === "prerequisite-gap" && insight.weeklyAttempts >= 4 && insight.weeklyCorrect === insight.weeklyAttempts ? copy.parent.allCorrect : insightReasonText(insight.reason, locale)} · {insight.weeklyAttempts ? copy.parent.nearSevenDays(insight.weeklyAttempts, insight.weeklyCorrect, insight.weeklyHinted) : copy.parent.notPracticed}</small>
                        </> : <>
                          <strong>{copy.parent.before}</strong>
                          <small>{copy.parent.beforeHint}</small>
                        </>}
                      </div>
                    );
                  })}
                </div>
                {(Object.keys(subjectNames) as Subject[]).map((subject) => {
                  const subjectSkills = SKILLS.filter((skill) => skill.subject === subject && child.settings.enabledSkills.includes(skill.id));
                  const observed = subjectSkills.filter((skill) => child.evidence[skill.id]?.nEff > 0);
                  const likely = subjectSkills.filter((skill) => classifyMastery(child.evidence[skill.id]) === "likely-secure");
                  const secure = subjectSkills.filter((skill) => classifyMastery(child.evidence[skill.id]) === "secure");
                  const progress = buildSubjectProgressView(child, subject);
                  return (
                    <div className={`subject-summary-row subject-summary-${subject}`} key={subject}>
                      <span>{subjectName(subject, locale)}</span>
                      <strong>{observed.length ? copy.parent.practiced(observed.length) : copy.parent.notStarted}</strong>
                      <small>{observed.length ? `${copy.parent.masteryCounts(likely.length, secure.length)} · ${copy.parent.weeklyProgress(progress.weeklySessions, progress.weeklyIndependentCorrect, progress.dueReviewCount)}` : copy.parent.beforeHint}</small>
                    </div>
                  );
                })}
              </> : <div className="child-start-panel"><strong>{copy.parent.startTitle}</strong><p>{copy.parent.startHint}</p></div>}
              <div className="child-extra-practice" aria-label={copy.parent.extraAria(child.name)}>
                <span><Pencil aria-hidden="true" />{copy.parent.handwriting}</span>
                <strong>{completedWriting} / {HANDWRITING_CHARACTERS.length}</strong>
                <small>{completedWriting ? copy.parent.handwritingSaved : copy.parent.handwritingEmpty}</small>
              </div>
              <p className="section-label">{copy.parent.settingsTitle}</p>
              <label className="parent-scope"><span>{copy.parent.learningLevel}</span><select aria-label={copy.parent.learningLevelAria(child.name)} value={child.gradeLevel} onChange={(event) => applyLearningLevel(child, event.target.value as LearningLevel)}><option value="K2">{copy.parent.levelK2}</option><option value="P1">{copy.parent.levelP1}</option><option value="P2">{copy.parent.levelP2}</option></select><small>{copy.parent.levelHint}</small></label>
              <div className="parent-controls">
                <label><span>{copy.parent.sessionLength}</span><select aria-label={copy.parent.sessionLengthAria(child.name)} value={child.settings.sessionLength} onChange={(event) => changeSessionLength(child, Number(event.target.value))}><option value="6">6 {copy.parent.questionUnit}</option><option value="8">8 {copy.parent.questionUnit}</option><option value="10">10 {copy.parent.questionUnit}</option></select></label>
                <div className="reset-group">{(Object.keys(subjectNames) as Subject[]).map((subject) => <button key={subject} className="quiet-button compact-button" type="button" onClick={() => resetSubject(child, subject)}>{copy.parent.resetSubject(subjectName(subject, locale))}</button>)}</div>
                <div className="accessibility-controls" aria-label={copy.parent.displayAria(child.name)}>
                  <label><input type="checkbox" checked={child.settings.highContrast} onChange={(event) => changeChildSetting(child, "highContrast", event.target.checked)} />{copy.parent.highContrast}</label>
                  <label><input type="checkbox" checked={child.settings.largeText} onChange={(event) => changeChildSetting(child, "largeText", event.target.checked)} />{copy.parent.largeText}</label>
                  <label><input type="checkbox" checked={child.settings.rewardsEnabled} onChange={(event) => changeChildSetting(child, "rewardsEnabled", event.target.checked)} />{copy.parent.rewardsEnabled}</label>
                  <label><input type="checkbox" checked={child.settings.companionAnimationsEnabled} onChange={(event) => changeChildSetting(child, "companionAnimationsEnabled", event.target.checked)} />{copy.parent.companionAnimations}</label>
                </div>
              </div>
              <div className="child-danger-zone"><button className="delete-child-link" type="button" onClick={() => deleteChild(child)}><Trash2 aria-hidden="true" />{copy.parent.deleteChild}</button></div>
            </section>
          );
        })}
        <details className="content-provenance">
          <summary>{copy.parent.aboutContent}</summary>
          <div>
            <p>{copy.parent.contentSummary(CONTENT_VERSION, SKILLS.length, QUESTIONS.length)}</p>
            <p>{copy.parent.officialSourceSummary(OFFICIAL_SOURCES.length, OFFICIAL_OUTCOMES.length, uncoveredOfficialOutcomeCount, excludedOfficialOutcomeCount, supplementarySkillCount)}</p>
            <p className="provenance-review">{copy.parent.reviewStatus}</p>
            <p className="version-line">{copy.parent.appVersion(APP_VERSION, CONTENT_VERSION)}</p>
          </div>
        </details>
      </main>
      {showAddChild ? <AddChildDialog locale={locale} onCancel={() => setShowAddChild(false)} onSave={saveChild} /> : null}
      {editingChild ? <AddChildDialog initialChild={editingChild} locale={locale} onCancel={() => setEditingChild(null)} onSave={saveEditedChild} /> : null}
    </div>
  );
}

function LevelReviewPanel({ child, locale, onConfirm }: { child: ChildProfile; locale: Locale; onConfirm: (level: LearningLevel) => void }) {
  const copy = uiCopyFor(locale);
  const currentLevel = learningLevelLabel(child.gradeLevel, locale);
  const nextLevel = nextLearningLevel(child.gradeLevel);
  return (
    <section className="level-review" aria-labelledby={`level-review-title-${child.id}`}>
      <div className="level-review-copy">
        <p className="eyebrow">{copy.parent.levelReviewEyebrow}</p>
        <h3 id={`level-review-title-${child.id}`}>{copy.parent.levelReviewTitle}</h3>
        <p>{copy.parent.levelReviewBody(child.name, ageYearsForProfile(child), currentLevel)}</p>
        <small>{copy.parent.levelReviewNote}</small>
      </div>
      <div className="level-review-actions">
        <button className="quiet-button compact-button" type="button" onClick={() => onConfirm(child.gradeLevel)}>{copy.parent.keepLevel}</button>
        {nextLevel
          ? <button className="primary-button compact-button" type="button" onClick={() => onConfirm(nextLevel)}>{copy.parent.advanceLevel}</button>
          : <span className="level-review-max">{copy.parent.levelReviewHighest}</span>}
      </div>
    </section>
  );
}

function AddChildDialog({ initialChild, locale, onCancel, onSave }: { initialChild?: ChildProfile; locale: Locale; onCancel: () => void; onSave: (child: ChildProfile) => void | Promise<void> }) {
  const copy = uiCopyFor(locale);
  const editing = Boolean(initialChild);
  const [name, setName] = useState(initialChild?.name ?? "");
  const [avatar, setAvatar] = useState(initialChild?.avatar ?? "star");
  const initialAge = initialChild ? ageYearsForProfile(initialChild) : 6;
  const [ageYears, setAgeYears] = useState(initialAge);
  const [gradeLevel, setGradeLevel] = useState<LearningLevel>(initialChild?.gradeLevel ?? recommendedLevelForAge(initialAge));
  const [levelTouched, setLevelTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const canSave = useMemo(() => name.trim().length > 0, [name]);
  function changeAge(nextAge: number) {
    setAgeYears(nextAge);
    if (!levelTouched) setGradeLevel(recommendedLevelForAge(nextAge));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || savingRef.current) { if (!canSave) setError(locale === "en" ? "Enter the child's name first" : "请先填写孩子的名字"); return; }
    savingRef.current = true;
    setSaving(true);
    try {
      const next = initialChild
        ? {
            ...initialChild,
            name: name.trim(),
            avatar,
            ageYears,
            birthYear: initialAge !== ageYears ? birthYearForAge(ageYears) : (initialChild.birthYear ?? birthYearForAge(ageYears)),
            gradeLevel,
            levelConfirmedOn: initialChild.gradeLevel !== gradeLevel ? levelDateKey() : (initialChild.levelConfirmedOn ?? levelDateKey()),
            settings: { ...initialChild.settings, enabledSkills: enabledSkillsForLevel(gradeLevel) }
          }
        : createChildProfile(name, avatar, new Date(), ageYears, gradeLevel);
      await onSave(next);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="child-profile-title"><p className="eyebrow">{copy.parent.eyebrow}</p><h2 id="child-profile-title">{editing ? (locale === "en" ? "Edit child profile" : "修改孩子档案") : (locale === "en" ? "New child profile" : "新建孩子档案")}</h2><form onSubmit={submit} className="dialog-form"><label><span>{locale === "en" ? "Child's name" : "孩子的名字"}</span><input aria-label={locale === "en" ? "Child's name" : "孩子的名字"} value={name} onChange={(event) => setName(event.target.value)} placeholder={locale === "en" ? "For example: Wei Wei, or a nickname" : "例如：小星，也可以只写小名"} /></label><div className="dialog-fields"><label><span>{locale === "en" ? "Child's age" : "孩子年龄"}</span><select aria-label={locale === "en" ? "Child's age" : "孩子年龄"} value={ageYears} onChange={(event) => changeAge(Number(event.target.value))}>{[4, 5, 6, 7, 8].map((age) => <option key={age} value={age}>{locale === "en" ? `${age} years` : `${age} 岁`}</option>)}</select></label><label><span>{locale === "en" ? "Current level" : "在读年级"}</span><select aria-label={locale === "en" ? "Current level" : "在读年级"} value={gradeLevel} onChange={(event) => { setLevelTouched(true); setGradeLevel(event.target.value as LearningLevel); }}><option value="K2">{copy.parent.levelK2}</option><option value="P1">{copy.parent.levelP1}</option><option value="P2">{copy.parent.levelP2}</option></select></label></div><p className="dialog-note">{locale === "en" ? "Age only suggests a level; confirm the child's actual school level. The parent centre reviews it once a school year. K2 starts with a short readiness layer, then moves into P1 core." : "年龄只用来推荐年级，请按孩子实际在读年级确认；家长中心每学年会提醒确认一次；K2 先练专属基础准备，再进入 P1 核心。"}</p><div className="avatar-picker" aria-label={locale === "en" ? "Choose an avatar" : "选择头像"}>{avatars.map((item) => <button key={item.id} className={`avatar-choice avatar-${item.id} ${avatar === item.id ? "is-selected" : ""}`} style={{ backgroundColor: item.color }} type="button" aria-label={avatarLabel(item.id, locale)} onClick={() => setAvatar(item.id)}><img src={`./assets/images/${item.image}.png`} alt="" /></button>)}</div>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="dialog-actions"><button className="quiet-button" type="button" onClick={onCancel}>{locale === "en" ? "Cancel" : "取消"}</button><button className="primary-button" type="submit" disabled={saving}>{saving ? (locale === "en" ? "Saving…" : "保存中…") : (locale === "en" ? "Save profile" : "保存档案")}</button></div></form></div></div>
  );
}

function downloadJson(value: unknown, filename: string) {
  downloadText(JSON.stringify(value, null, 2), filename);
}

function csvEscape(value: string): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadText(text: string, filename: string, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
