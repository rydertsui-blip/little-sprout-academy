import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Check, Download, Headphones, Lock, Mic, Pencil, Plus, ShieldCheck, Star, Trash2, Upload, X } from "lucide-react";
import { CONTENT_VERSION, QUESTIONS, SKILLS } from "./content/catalog";
import { SUBJECT_NAMES, UI_COPY } from "./content/copy";
import { VOICE_LINES } from "./content/audioAssets";
import { OFFICIAL_ACTIVITIES, OFFICIAL_OUTCOMES, OFFICIAL_SOURCES } from "./content/officialSources";
import { classifyMastery, createSkillEvidence } from "./engine/bkt";
import { buildChildInsights } from "./engine/insights";
import { playOrSpeak } from "./lib/audio";
import { formatBytes, getStorageHealth, requestPersistentStorage, type StorageHealth } from "./lib/storageHealth";
import { APP_VERSION, DATA_SCHEMA_VERSION } from "./lib/version";
import { completeSession, createAdaptiveSession, recordSessionAnswer, selectNextQuestion } from "./engine/session";
import { createChildProfile } from "./lib/profile";
import { hashPin, validatePin } from "./lib/pin";
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
import type { ChildProfile, ChoiceQuestion, HouseholdState, Question, SessionRecord, Subject } from "./lib/types";
import MatchingBoard from "./screens/MatchingBoard";
import SpeakingScreen from "./screens/SpeakingScreen";

type Screen = "profiles" | "child" | "assessment" | "result" | "parent" | "speaking";

const avatars = [
  { id: "star", label: "星星头像", image: "star" },
  { id: "moon", label: "月亮头像", image: "moon" },
  { id: "leaf", label: "叶子头像", image: "seedling" },
  { id: "flower", label: "花朵头像", image: "flower" }
];

const subjectCards: Array<{ subject: Subject; title: string; shortLabel: string; subtitle: string; image: string; className: string }> = [
  { subject: "math", title: "数学 Math", shortLabel: "数学", subtitle: "数感、加减、图形和规律", image: "compass", className: "math-course" },
  { subject: "mandarin", title: "华文 Mandarin", shortLabel: "华文", subtitle: "拼音、识字和短句阅读", image: "bird", className: "mandarin-course" },
  { subject: "english", title: "英语 English", shortLabel: "英语", subtitle: "字母音、拼读和基础单词", image: "abc", className: "english-course" }
];

const subjectNames = SUBJECT_NAMES;
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
  const [screen, setScreen] = useState<Screen>("profiles");
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [showParentGate, setShowParentGate] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupValues, setSetupValues] = useState({ householdName: "", parentName: "", pin: "" });
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string; mismatchCount?: number } | null>(null);
  const [summary, setSummary] = useState<SessionRecord["summary"] | null>(null);
  const answeringRef = useRef(false);
  const advancingRef = useRef(false);
  const startingSubjectRef = useRef(false);

  const activeChild = household?.children.find((child) => child.id === activeChildId) ?? null;
  const storageBanner = storageError ? <div className="storage-banner" role="alert">{UI_COPY.storageError}</div> : null;

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
      version: 2,
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
      version: 2,
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
      const nextSession = existing ?? createAdaptiveSession(activeChild, subject);
      if (!existing) {
        const saved = await updateChild(activeChild.id, (child) => {
          child.activeSessions[subject] = nextSession;
          return child;
        });
        if (!saved) return;
      }
      const question = selectNextQuestion(activeChild, nextSession);
      if (nextSession.attempts.length >= nextSession.length) {
        const completion: { session: SessionRecord | null } = { session: null };
        const saved = await updateChild(activeChild.id, (current) => {
          completion.session = completeSession(nextSession, current);
          if (!completion.session) return current;
          delete current.activeSessions[subject];
          current.diagnostics[subject] = { completedAt: completion.session.completedAt!, sessionId: completion.session.id };
          current.sessions.push(completion.session);
          return current;
        });
        const completed = completion.session;
        if (!saved || !completed) return;
        setSession(completed);
        setSummary(completed.summary);
        setScreen("result");
        return;
      }
      setSession(nextSession);
      setCurrentQuestion(question);
      setFeedback(null);
      setSummary(null);
      setScreen("assessment");
    } finally {
      startingSubjectRef.current = false;
    }
  }

  async function answerQuestion(correct: boolean, answer: string, mismatchCount = 0): Promise<boolean> {
    if (!activeChild || !session || !currentQuestion || feedback || answeringRef.current) return false;
    answeringRef.current = true;
    try {
      let nextSession: SessionRecord | null = null;
      const saved = await updateChild(activeChild.id, (child) => {
        nextSession = recordSessionAnswer(child, session, {
          questionId: currentQuestion.id,
          correct,
          hintUsed: false
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
        const completion: { session: SessionRecord | null } = { session: null };
        const saved = await updateChild(activeChild.id, (child) => {
          completion.session = completeSession(session, child);
          if (!completion.session) return child;
          child.diagnostics[session.subject] = { completedAt: completion.session.completedAt!, sessionId: completion.session.id };
          child.sessions.push(completion.session);
          delete child.activeSessions[session.subject];
          return child;
        });
        const completed = completion.session;
        if (!saved || !completed) return;
        setSummary(completed.summary);
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
    const voice = subject === "math" ? VOICE_LINES.startMath : subject === "mandarin" ? VOICE_LINES.startMandarin : VOICE_LINES.startEnglish;
    playOrSpeak(voice, "zh-CN");
    startSubject(subject);
  }

  function openSpeaking() {
    playOrSpeak(VOICE_LINES.speakingIntro, "zh-CN");
    setScreen("speaking");
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
          <div className="setup-mark"><img src="./assets/images/seedling.png" alt="" /></div>
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
    return <>{storageBanner}<ParentDashboard household={household} onBack={backToProfiles} onAddChild={addChild} onDeleteChild={deleteChild} onUpdateChild={updateChild} onLock={lockHousehold} onImport={importBackup} /></>;
  }

  if (screen === "speaking" && activeChild) {
    return <>{storageBanner}<SpeakingScreen child={activeChild} onBack={() => setScreen("child")} onLock={lockHousehold} /></>;
  }

  if (screen === "assessment" && activeChild && session && currentQuestion) {
    return (
      <div className={childSurfaceClass(activeChild)}>
        {storageBanner}
        <SessionHeader child={activeChild} subject={session.subject} kind={session.kind} answered={session.attempts.length} total={session.length} onBack={() => setScreen("child")} />
        <QuizScreen question={currentQuestion} feedback={feedback} onAnswer={answerQuestion} onNext={advanceSession} />
      </div>
    );
  }

  if (screen === "result" && activeChild && session && summary) {
    return (
      <div className={childSurfaceClass(activeChild)}>
        {storageBanner}
        <SessionHeader child={activeChild} subject={session.subject} kind={session.kind} answered={session.length} total={session.length} onBack={() => setScreen("child")} />
        <SessionResult child={activeChild} subject={session.subject} kind={session.kind} summary={summary} onDone={() => setScreen("child")} onParent={() => { setShowParentGate(true); }} />
        {showParentGate ? <ParentPinDialog household={household} onCancel={() => setShowParentGate(false)} onSuccess={() => { setShowParentGate(false); setScreen("parent"); }} /> : null}
      </div>
    );
  }

  if (screen === "profiles") {
    return (
      <div className="app-shell">
        {storageBanner}
        <TopBar title={household.householdName} subtitle="选择今天的学习档案" onLock={lockHousehold} />
        <main className="profile-screen">
          <div className="profile-heading"><p className="eyebrow">{UI_COPY.profiles.eyebrow}</p><h1>{UI_COPY.profiles.title}</h1><p>{UI_COPY.profiles.body}</p></div>
          <div className="profile-grid">
            {household.children.map((child) => (
              <button key={child.id} className="profile-card" type="button" onClick={() => { setActiveChildId(child.id); setScreen("child"); }} aria-label={`${child.name}的学习档案`}>
                <div className={`profile-avatar avatar-${child.avatar}`}><img src={`./assets/images/${avatars.find((avatar) => avatar.id === child.avatar)?.image ?? "star"}.png`} alt="" /></div>
                <strong>{child.name}</strong><span>{Object.keys(child.diagnostics).length ? UI_COPY.profiles.started : UI_COPY.profiles.needsStart}</span><ChevronRight aria-hidden="true" />
              </button>
            ))}
            {household.children.length === 0 ? <div className="empty-panel profile-empty">{UI_COPY.profiles.empty}</div> : null}
          </div>
          <button className="parent-entry" type="button" onClick={() => setShowParentGate(true)}><ShieldCheck aria-hidden="true" />{UI_COPY.profiles.parentEntry}</button>
        </main>
        {showParentGate ? <ParentPinDialog household={household} onCancel={() => setShowParentGate(false)} onSuccess={() => { setShowParentGate(false); setScreen("parent"); }} /> : null}
      </div>
    );
  }

  return (
    <div className={childSurfaceClass(activeChild)}>
      {storageBanner}
      <TopBar title={activeChild?.name ?? UI_COPY.child.topbarFallback} subtitle={UI_COPY.child.subtitle} onBack={backToProfiles} onLock={lockHousehold} />
      {activeChild ? (
        <main className="child-home">
          <section className="child-teacher">
            <div className="teacher-mascot child-mascot" aria-hidden="true"><img src="./assets/images/seedling.png" alt="" /><i /><i /><i /></div>
            <div className="teacher-bubble child-teacher-bubble">
              <small>小芽老师</small>
              <h1>{UI_COPY.child.greeting(activeChild.name)}</h1>
              <p>{UI_COPY.child.body}</p>
            </div>
            <button className="primary-button teacher-start" type="button" onClick={startRecommendedLearning}>跟小芽开始<ArrowRight aria-hidden="true" /></button>
          </section>
          <div className="subject-grid">
            {subjectCards.map((card) => (
              <button key={card.subject} className={`subject-card ${card.className}`} type="button" aria-label={card.title} onClick={() => startSubject(card.subject)}>
                <div className="subject-art"><img src={`./assets/images/${card.image}.png`} alt="" /></div>
                <div className="subject-copy"><span>学习岛</span><strong>{card.title}</strong><p>{card.subtitle}</p></div>
                <div className="subject-status"><Star aria-hidden="true" /><span>{activeChild.diagnostics[card.subject] ? UI_COPY.child.continuePractice : UI_COPY.child.startDiagnostic}</span><ChevronRight aria-hidden="true" /></div>
              </button>
            ))}
          </div>
          <div className="offline-activity-row">
            <button className="handwriting-entry speaking-entry" type="button" onClick={openSpeaking}>
              <span className="handwriting-entry-icon speaking-entry-icon"><Mic aria-hidden="true" /></span>
              <span className="handwriting-entry-copy"><small>华文 · English</small><strong>听一听，跟着说</strong><p>听示范，录下自己的声音，再回放。</p></span>
              <span className="handwriting-entry-progress"><ChevronRight aria-hidden="true" /></span>
            </button>
          </div>
        </main>
      ) : null}
    </div>
  );
}

function UnlockScreen({ household, onUnlocked }: { household: HouseholdState; onUnlocked: (pin: string) => void | Promise<void> }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validatePin(pin)) { setError("请输入 4 到 6 位数字"); return; }
    setChecking(true);
    const result = await hashPin(pin, household.pinSalt);
    setChecking(false);
    if (result === household.pinHash) await onUnlocked(pin);
    else setError("密码不正确，请再试一次");
  }
  return (
    <div className="app-shell setup-shell">
      <div className="setup-card unlock-card">
        <div className="setup-mark"><img src="./assets/images/seedling.png" alt="" /></div>
        <p className="eyebrow">{household.householdName}</p>
        <h1>{UI_COPY.unlock.title}</h1>
        <p className="setup-copy">{UI_COPY.unlock.plainBody}</p>
        <form onSubmit={submit} className="setup-form">
          <label><span>家长密码</span><input aria-label="家长密码" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value.replace(/[^0-9]/g, "")); setError(""); }} autoFocus /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button wide-button" type="submit" disabled={checking}><ShieldCheck aria-hidden="true" />打开家庭学习区</button>
        </form>
      </div>
    </div>
  );
}

function SecureUnlockScreen({ envelope, onUnlocked, onRecover }: { envelope: EncryptedEnvelope; onUnlocked: (household: HouseholdState, key: CryptoKey) => void; onRecover: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validatePin(pin)) { setError("请输入 4 到 6 位数字"); return; }
    setChecking(true);
    try {
      const result = await unlockEncryptedHousehold(envelope, pin);
      onUnlocked(result.household, result.key);
    } catch {
      setError("密码不正确，或家庭数据无法解密");
      setFailedAttempts((count) => count + 1);
    } finally {
      setChecking(false);
    }
  }
  return (
    <div className="app-shell setup-shell">
      <div className="setup-card unlock-card">
        <div className="setup-mark"><img src="./assets/images/seedling.png" alt="" /></div>
        <p className="eyebrow">{UI_COPY.unlock.eyebrow}</p>
        <h1>{UI_COPY.unlock.title}</h1>
        <p className="setup-copy">{UI_COPY.unlock.encryptedBody}</p>
        <form onSubmit={submit} className="setup-form">
          <label><span>家长密码</span><input aria-label="家长密码" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value.replace(/[^0-9]/g, "")); setError(""); }} autoFocus /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button wide-button" type="submit" disabled={checking}><ShieldCheck aria-hidden="true" />打开家庭学习区</button>
          {failedAttempts > 0 ? <button className="quiet-button wide-button" type="button" onClick={() => {
            downloadJson(envelope, `little-sprout-encrypted-${new Date().toISOString().slice(0, 10)}.json`);
            if (window.confirm("仍然无法打开时，可以先下载加密数据，再重新建立家庭学习区。确定继续吗？")) onRecover();
          }}>下载加密数据并重新开始</button> : null}
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

function ParentPinDialog({ household, onCancel, onSuccess }: { household: HouseholdState; onCancel: () => void; onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validatePin(pin)) { setError("请输入 4 到 6 位数字"); return; }
    const result = await hashPin(pin, household.pinSalt);
    if (result === household.pinHash) onSuccess();
    else setError("密码不正确");
  }
  return (
    <div className="modal-backdrop">
      <div className="modal-card" role="dialog" aria-modal="true">
        <p className="eyebrow">家长权限</p><h2>进入家长设置</h2>
        <p className="setup-copy">进入设置前，请再次输入家长密码。</p>
        <form onSubmit={submit} className="dialog-form">
          <label><span>家长密码确认</span><input aria-label="家长密码确认" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/[^0-9]/g, ""))} autoFocus /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions"><button className="quiet-button" type="button" onClick={onCancel}>取消</button><button className="primary-button" type="submit">进入设置</button></div>
        </form>
      </div>
    </div>
  );
}

function TopBar({ title, subtitle, onBack, onLock }: { title: string; subtitle: string; onBack?: () => void; onLock?: () => void }) {
  return (
    <header className="app-header">
      <button className="brand-button" type="button" onClick={onBack} aria-label="回到孩子选择">
        <img className="brand-mark" src="./assets/images/seedling.png" alt="" />
        <span className="brand-copy"><strong>{title}</strong><small>{subtitle}</small></span>
      </button>
      <div className="header-tools"><div className="header-badge"><ShieldCheck aria-hidden="true" /><span>家庭模式</span></div>{onLock ? <button className="icon-button" type="button" onClick={() => void onLock()} aria-label="退出并锁定"><Lock aria-hidden="true" /></button> : null}</div>
    </header>
  );
}

function SessionHeader({ child, subject, kind, answered, total, onBack }: { child: ChildProfile; subject: Subject; kind: "diagnostic" | "practice"; answered: number; total: number; onBack: () => void }) {
  return (
    <header className="session-header">
      <button className="quiet-button compact-button" type="button" onClick={onBack}><ChevronLeft aria-hidden="true" />退出</button>
      <div><p className="eyebrow">{UI_COPY.child.sessionBrand(child.name)}</p><h1>{subjectNames[subject]}{kind === "diagnostic" ? UI_COPY.session.diagnosticTitle : UI_COPY.session.practiceTitle}</h1></div>
      <div className="session-progress"><span>{answered} / {total}</span><div><i style={{ width: `${(answered / total) * 100}%` }} /></div></div>
    </header>
  );
}

function QuizScreen({ question, feedback, onAnswer, onNext }: { question: Question; feedback: { correct: boolean; answer: string; mismatchCount?: number } | null; onAnswer: (correct: boolean, answer: string, mismatchCount?: number) => Promise<boolean>; onNext: () => void }) {
  const options = useMemo(() => question.kind === "choice" ? deterministicOptions(question) : [], [question]);
  const correct = Boolean(feedback?.correct);
  const matchQuestion = question.kind === "match" ? question : null;
  return (
    <main className="quiz-layout">
      <section className="quiz-stage">
        <button className="audio-button" type="button" onClick={() => playOrSpeak(question.audioText ?? question.prompt, question.audioLanguage ?? "en-US")} aria-label="朗读题目"><Headphones aria-hidden="true" /></button>
        {question.passage ? <div className="question-passage"><span>{question.audioLanguage === "zh-CN" ? "读一读" : "Read"}</span><p>{question.passage}</p></div> : null}
        {question.displayCharacter ? <div className="character-display">{question.displayCharacter}</div> : null}
        {question.image ? <img className="question-image" src={`./assets/images/${question.image}.png`} alt="" /> : null}
        <p className="question-instruction">{question.instruction}</p>
        <h2 data-testid="question-prompt" data-question-id={question.id}>{question.prompt}</h2>
      </section>
      <section className="answer-panel">
        {question.kind === "choice" ? (
          <div className="answer-grid">
            {options.map((option) => (
              <button
                key={option}
                className={`answer-option ${feedback && option === feedback.answer ? (correct ? "is-correct" : "is-wrong") : ""} ${feedback && !correct && option === question.correctAnswer ? "is-correct-answer" : ""}`}
                data-correct={option === question.correctAnswer ? "true" : "false"}
                type="button"
                onClick={() => void onAnswer(option === question.correctAnswer, option)}
                disabled={Boolean(feedback)}
              >{option}</button>
            ))}
          </div>
        ) : matchQuestion ? (
          <MatchingBoard key={matchQuestion.id} question={matchQuestion} disabled={Boolean(feedback)} onComplete={(matchCorrect, mismatchCount) => onAnswer(matchCorrect, "match", mismatchCount)} />
        ) : null}
        {feedback ? (
          <div className={`answer-feedback ${correct ? "correct-feedback" : "wrong-feedback"}`} data-testid="answer-feedback">
            <div className="feedback-title">{correct
              ? <><Check aria-hidden="true" />{question.kind === "match" ? UI_COPY.session.matchCorrectTitle : UI_COPY.session.correctTitle}</>
              : <><X aria-hidden="true" />{question.kind === "match" ? UI_COPY.session.matchWrongTitle : UI_COPY.session.wrongTitle}</>}
            </div>
            {question.kind === "match" && feedback.mismatchCount ? <p className="match-mismatch-note">{UI_COPY.session.matchMismatchNote(feedback.mismatchCount)}</p> : null}
            <p>{question.explanation}</p>
            <button className="primary-button wide-button" type="button" onClick={onNext}>下一题<ArrowRight aria-hidden="true" /></button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function SessionResult({ child, subject, kind, summary, onDone, onParent }: { child: ChildProfile; subject: Subject; kind: "diagnostic" | "practice"; summary: SessionRecord["summary"]; onDone: () => void; onParent: () => void }) {
  return (
    <main className="result-screen">
      <div className="result-hero"><img src="./assets/images/sparkles.png" alt="" /><p className="eyebrow">{kind === "diagnostic" ? UI_COPY.session.diagnosticResult : UI_COPY.session.practiceResult}</p><h1>{subjectNames[subject]}{kind === "diagnostic" ? "起点小试完成" : "练习完成"}</h1><p>{kind === "diagnostic" ? UI_COPY.session.diagnosticResultBody : UI_COPY.session.practiceResultBody}</p></div>
      <section className="result-list">
        {summary.map((row) => <div className="result-row" key={row.skillId}><span>{row.title}</span><strong>{UI_COPY.mastery[row.level]}</strong><small>{UI_COPY.session.resultCount(row.evidenceCount)}</small></div>)}
      </section>
      <div className="result-actions"><button className="quiet-button" type="button" onClick={onParent}><ShieldCheck aria-hidden="true" />家长设置</button><button className="primary-button" type="button" onClick={onDone}>回到学习区<ChevronRight aria-hidden="true" /></button></div>
    </main>
  );
}

function ParentDashboard({ household, onBack, onAddChild, onDeleteChild, onUpdateChild, onLock, onImport }: { household: HouseholdState; onBack: () => void; onAddChild: (child: ChildProfile) => Promise<boolean>; onDeleteChild: (childId: string) => Promise<boolean>; onUpdateChild: (childId: string, update: (child: ChildProfile) => ChildProfile) => Promise<boolean>; onLock: () => void | Promise<void>; onImport: (household: HouseholdState) => void }) {
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);

  useEffect(() => {
    void getStorageHealth().then(setStorageHealth);
  }, [household]);

  function resetSubject(child: ChildProfile, subject: Subject) {
    if (!window.confirm(UI_COPY.parent.resetConfirm(subjectNames[subject]))) return;
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

  function changeAccessibility(child: ChildProfile, key: "highContrast" | "largeText", enabled: boolean) {
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
      if (!window.confirm(UI_COPY.parent.importConfirm)) return;
      onImport(imported);
    } catch {
      window.alert(UI_COPY.parent.importError);
    }
  }

  async function saveChild(child: ChildProfile) {
    if (await onAddChild(child)) setShowAddChild(false);
  }

  async function saveEditedChild(child: ChildProfile) {
    if (await onUpdateChild(child.id, (current) => ({ ...current, name: child.name, avatar: child.avatar }))) setEditingChild(null);
  }

  function deleteChild(child: ChildProfile) {
    if (!window.confirm(UI_COPY.parent.deleteConfirm(child.name))) return;
    void onDeleteChild(child.id);
  }

  async function persistStorage() {
    await requestPersistentStorage();
    setStorageHealth(await getStorageHealth());
  }

  return (
    <div className="app-shell">
      <header className="app-header"><div><p className="eyebrow">{UI_COPY.parent.eyebrow}</p><h1>{UI_COPY.parent.dashboardTitle}</h1><p className="version-line">{UI_COPY.parent.appVersion(APP_VERSION, CONTENT_VERSION, DATA_SCHEMA_VERSION)}</p></div><div className="dashboard-actions"><button className="quiet-button compact-button" type="button" onClick={onBack}><X aria-hidden="true" />{UI_COPY.parent.close}</button><button className="quiet-button compact-button" type="button" onClick={() => void onLock()}><Lock aria-hidden="true" />{UI_COPY.parent.lock}</button></div></header>
      <main className="parent-dashboard">
        <div className="backup-panel">
          <button className="quiet-button compact-button" type="button" onClick={() => setShowAddChild(true)}><Plus aria-hidden="true" />{UI_COPY.parent.addChild}</button>
          <button className="quiet-button compact-button" type="button" onClick={exportBackup}><Download aria-hidden="true" />{UI_COPY.parent.export}</button>
          <label className="quiet-button compact-button file-button"><Upload aria-hidden="true" />{UI_COPY.parent.import}<input type="file" accept="application/json,.json" onChange={(event) => void importBackupFile(event.target.files?.[0])} /></label>
        </div>
        {storageHealth ? (
          <div className={`storage-health ${storageHealth.usageRatio !== null && storageHealth.usageRatio >= 0.8 ? "is-warning" : ""}`}>
            <span>本机家庭数据 {formatBytes(storageHealth.localBytes)}{storageHealth.quotaBytes !== null ? ` · 浏览器已用 ${formatBytes(storageHealth.usageBytes ?? 0)} / ${formatBytes(storageHealth.quotaBytes)}` : ""}</span>
            {storageHealth.usageRatio !== null && storageHealth.usageRatio >= 0.8 ? <strong>储存空间接近上限，请先导出学习记录。</strong> : null}
            {storageHealth.persisted === false ? <button className="quiet-button compact-button" type="button" onClick={() => void persistStorage()}>启用持久储存</button> : null}
          </div>
        ) : null}
        {household.children.length === 0 ? <div className="empty-panel">{UI_COPY.parent.empty}<button className="primary-button compact-button empty-action" type="button" onClick={() => setShowAddChild(true)}><Plus aria-hidden="true" />{UI_COPY.parent.addFirstChild}</button></div> : household.children.map((child) => (
          <section className="parent-child-panel" key={child.id}>
            <div className="parent-child-heading"><div className={`profile-avatar small-avatar avatar-${child.avatar}`}><img src={`./assets/images/${avatars.find((avatar) => avatar.id === child.avatar)?.image ?? "star"}.png`} alt="" /></div><div><h2>{child.name}</h2><p>{UI_COPY.parent.childActivity(child.attempts.length, Object.keys(child.diagnostics).length)}</p></div><div className="child-profile-actions"><button className="quiet-button compact-button" type="button" onClick={() => setEditingChild(child)}><Pencil aria-hidden="true" />{UI_COPY.parent.editChild}</button><button className="quiet-button compact-button danger-button" type="button" onClick={() => deleteChild(child)}><Trash2 aria-hidden="true" />{UI_COPY.parent.deleteChild}</button><button className="quiet-button compact-button" type="button" onClick={() => exportAttemptsCsv(child)}><Download aria-hidden="true" />{UI_COPY.parent.exportCsv}</button></div></div>
            <div className="parent-controls">
              <label><span>{UI_COPY.parent.sessionLength}</span><select aria-label={`${child.name}的${UI_COPY.parent.sessionLength}`} value={child.settings.sessionLength} onChange={(event) => changeSessionLength(child, Number(event.target.value))}><option value="6">6 题</option><option value="8">8 题</option><option value="10">10 题</option></select></label>
              <div className="reset-group">{(Object.keys(subjectNames) as Subject[]).map((subject) => <button key={subject} className="quiet-button compact-button" type="button" onClick={() => resetSubject(child, subject)}>{UI_COPY.parent.resetSubject(subjectNames[subject])}</button>)}</div>
              <div className="accessibility-controls" aria-label={`${child.name}的显示设置`}>
                <label><input type="checkbox" checked={child.settings.highContrast} onChange={(event) => changeAccessibility(child, "highContrast", event.target.checked)} />{UI_COPY.parent.highContrast}</label>
                <label><input type="checkbox" checked={child.settings.largeText} onChange={(event) => changeAccessibility(child, "largeText", event.target.checked)} />{UI_COPY.parent.largeText}</label>
              </div>
              <small>{UI_COPY.parent.contentSummary(CONTENT_VERSION, SKILLS.length, QUESTIONS.length)}<br />{UI_COPY.parent.officialSourceSummary(OFFICIAL_SOURCES.length, OFFICIAL_OUTCOMES.length, uncoveredOfficialOutcomeCount, excludedOfficialOutcomeCount, supplementarySkillCount)}<br />{UI_COPY.parent.reviewStatus}</small>
            </div>
            <div className="next-actions" aria-label={`${child.name}的下一步建议`}>
              {buildChildInsights(child).map((insight) => (
                <div className="next-action" key={insight.subject}>
                  <span>{subjectNames[insight.subject]}</span>
                  <strong>{insight.nextSkillTitle}</strong>
                  <small>{insight.reasonText} · 近 7 天 {insight.weeklyAttempts} 题，独立答对 {insight.weeklyCorrect} 题，提示 {insight.weeklyHinted} 次</small>
                </div>
              ))}
            </div>
            {(Object.keys(subjectNames) as Subject[]).map((subject) => {
              const subjectSkills = SKILLS.filter((skill) => skill.subject === subject);
              const observed = subjectSkills.filter((skill) => child.evidence[skill.id]?.nEff > 0);
              const likely = subjectSkills.filter((skill) => classifyMastery(child.evidence[skill.id]) === "likely-secure");
              const secure = subjectSkills.filter((skill) => classifyMastery(child.evidence[skill.id]) === "secure");
              return <div className="subject-summary-row" key={subject}><span>{subjectNames[subject]}</span><strong>{UI_COPY.parent.practiced(observed.length)}</strong><small>{UI_COPY.parent.masteryCounts(likely.length, secure.length)}</small></div>;
            })}
          </section>
        ))}
      </main>
      {showAddChild ? <AddChildDialog onCancel={() => setShowAddChild(false)} onSave={saveChild} /> : null}
      {editingChild ? <AddChildDialog initialChild={editingChild} onCancel={() => setEditingChild(null)} onSave={saveEditedChild} /> : null}
    </div>
  );
}

function AddChildDialog({ initialChild, onCancel, onSave }: { initialChild?: ChildProfile; onCancel: () => void; onSave: (child: ChildProfile) => void | Promise<void> }) {
  const editing = Boolean(initialChild);
  const [name, setName] = useState(initialChild?.name ?? "");
  const [avatar, setAvatar] = useState(initialChild?.avatar ?? "star");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const canSave = useMemo(() => name.trim().length > 0, [name]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || savingRef.current) { if (!canSave) setError("请先填写孩子的名字"); return; }
    savingRef.current = true;
    setSaving(true);
    try {
      const next = initialChild ? { ...initialChild, name: name.trim(), avatar } : createChildProfile(name, avatar);
      await onSave(next);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="child-profile-title"><p className="eyebrow">家长设置</p><h2 id="child-profile-title">{editing ? "修改孩子档案" : "新建孩子档案"}</h2><form onSubmit={submit} className="dialog-form"><label><span>孩子的名字</span><input aria-label="孩子的名字" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：小星，也可以只写小名" autoFocus /></label><div className="avatar-picker" aria-label="选择头像">{avatars.map((item) => <button key={item.id} className={`avatar-choice ${avatar === item.id ? "is-selected" : ""}`} type="button" aria-label={item.label} onClick={() => setAvatar(item.id)}><img src={`./assets/images/${item.image}.png`} alt="" /></button>)}</div>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="dialog-actions"><button className="quiet-button" type="button" onClick={onCancel}>取消</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "保存中…" : "保存档案"}</button></div></form></div></div>
  );
}

function deterministicOptions(question: ChoiceQuestion): string[] {
  const score = (value: string) => Array.from(question.id + value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);
  return [...question.options].sort((a, b) => score(a) - score(b));
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
