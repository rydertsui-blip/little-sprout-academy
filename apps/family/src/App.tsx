import { useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Check, Download, Headphones, Lock, Plus, ShieldCheck, Star, Upload, X } from "lucide-react";
import { CONTENT_VERSION, SKILLS } from "./content/catalog";
import { classifyMastery, createSkillEvidence } from "./engine/bkt";
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
import type { ChildProfile, ChoiceQuestion, HouseholdState, MasteryLevel, SessionRecord, Subject } from "./lib/types";

type Screen = "profiles" | "child" | "assessment" | "result" | "parent";

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

const subjectNames: Record<Subject, string> = { math: "数学", mandarin: "华文", english: "英语" };
const masteryLabels: Record<MasteryLevel, string> = { unknown: "等待更多证据", developing: "正在发展", "likely-secure": "暂稳", secure: "稳固" };

function createSalt(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export default function App() {
  const initialStorage = readHousehold();
  const [household, setHousehold] = useState<HouseholdState | null>(initialStorage.status === "ok" ? initialStorage.household : null);
  const [unlocked, setUnlocked] = useState(initialStorage.status === "empty");
  const [encryptedEnvelope, setEncryptedEnvelope] = useState<EncryptedEnvelope | null>(initialStorage.status === "encrypted" ? initialStorage.envelope : null);
  const encryptionKeyRef = useRef<CryptoKey | null>(null);
  const [recovery, setRecovery] = useState(initialStorage.status === "corrupt" ? { raw: initialStorage.raw, error: initialStorage.error } : null);
  const [storageError, setStorageError] = useState("");
  const [screen, setScreen] = useState<Screen>("profiles");
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showParentGate, setShowParentGate] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupValues, setSetupValues] = useState({ householdName: "", parentName: "", pin: "" });
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ChoiceQuestion | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string } | null>(null);
  const [summary, setSummary] = useState<SessionRecord["summary"] | null>(null);
  const answeringRef = useRef(false);

  const activeChild = household?.children.find((child) => child.id === activeChildId) ?? null;
  const storageBanner = storageError ? <div className="storage-banner" role="alert">保存失败：{storageError}</div> : null;

  if (recovery) {
    return <RecoveryScreen recovery={recovery} onReset={() => { clearHousehold(); setRecovery(null); setHousehold(null); setUnlocked(true); setStorageError(""); }} />;
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
      setSetupError(`保存失败：${result.error}`);
      return;
    }
    encryptionKeyRef.current = sealed.key;
    setEncryptedEnvelope(sealed.envelope);
    setHousehold(next);
    setUnlocked(true);
    setSetupError("");
  }

  async function persistHousehold(next: HouseholdState): Promise<boolean> {
    setHousehold(next);
    if (!encryptionKeyRef.current) {
      setStorageError("当前会话没有可用的加密密钥，请重新解锁");
      return false;
    }
    const result = await saveEncryptedHousehold(next, encryptionKeyRef.current);
    if (!result.ok) {
      setStorageError(result.error);
      return false;
    }
    setStorageError("");
    return true;
  }

  async function addChild(child: ChildProfile) {
    if (!household) return;
    if (await persistHousehold({ ...household, children: [...household.children, child] })) setShowAddChild(false);
  }

  async function updateChild(child: ChildProfile): Promise<boolean> {
    if (!household) return false;
    return persistHousehold({ ...household, children: household.children.map((item) => item.id === child.id ? child : item) });
  }

  async function importBackup(next: HouseholdState) {
    if (!household) return;
    const saved = await persistHousehold({
      ...next,
      version: 2,
      householdName: household.householdName,
      parentName: household.parentName,
      pinHash: household.pinHash,
      pinSalt: household.pinSalt
    });
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
    const pending = await flushStorageWrites();
    if (!pending.ok) {
      setStorageError(pending.error);
      return;
    }
    encryptionKeyRef.current = null;
    setHousehold(null);
    setActiveChildId(null);
    setSession(null);
    setCurrentQuestion(null);
    setUnlocked(false);
    const stored = readHousehold();
    if (stored.status === "encrypted") setEncryptedEnvelope(stored.envelope);
    else if (stored.status === "ok") setHousehold(stored.household);
    else if (stored.status === "corrupt") setRecovery({ raw: stored.raw, error: stored.error });
  }

  function startSubject(subject: Subject) {
    void startSubjectAsync(subject);
  }

  async function startSubjectAsync(subject: Subject) {
    if (!activeChild) return;
    const existing = activeChild.activeSessions?.[subject];
    const nextSession = existing ?? createAdaptiveSession(activeChild, subject);
    if (!existing) {
      const child = clone(activeChild);
      child.activeSessions[subject] = nextSession;
      if (!(await updateChild(child))) return;
    }
    const question = selectNextQuestion(activeChild, nextSession);
    if (nextSession.attempts.length >= nextSession.length) {
      const child = clone(activeChild);
      const completed = completeSession(nextSession, child);
      if (completed) {
        delete child.activeSessions[subject];
        child.diagnostics[subject] = { completedAt: completed.completedAt!, sessionId: completed.id };
        child.sessions.push(completed);
        if (!(await updateChild(child))) return;
        setSession(completed);
        setSummary(completed.summary);
        setScreen("result");
      }
      return;
    }
    setSession(nextSession);
    setCurrentQuestion(question);
    setFeedback(null);
    setSummary(null);
    setScreen("assessment");
  }

  async function answerQuestion(answer: string) {
    if (!activeChild || !session || !currentQuestion || feedback || answeringRef.current) return;
    answeringRef.current = true;
    const child = clone(activeChild);
    const nextSession = recordSessionAnswer(child, session, {
      questionId: currentQuestion.id,
      correct: answer === currentQuestion.correctAnswer,
      hintUsed: false
    });
    child.activeSessions[session.subject] = nextSession;
    const saved = await updateChild(child);
    if (saved) {
      setSession(nextSession);
      setFeedback({ correct: answer === currentQuestion.correctAnswer, answer });
    }
    answeringRef.current = false;
  }

  async function advanceSession() {
    if (!activeChild || !session) return;
    if (session.attempts.length >= session.length) {
      const child = clone(activeChild);
      const completed = completeSession(session, child);
      if (!completed) return;
      child.diagnostics[session.subject] = { completedAt: completed.completedAt!, sessionId: completed.id };
      child.sessions.push(completed);
      delete child.activeSessions[session.subject];
      if (!(await updateChild(child))) return;
      setSummary(completed.summary);
      setScreen("result");
      setFeedback(null);
      return;
    }
    setCurrentQuestion(selectNextQuestion(activeChild, session));
    setFeedback(null);
  }

  if (encryptedEnvelope && !household) {
    return <SecureUnlockScreen envelope={encryptedEnvelope} onUnlocked={(state, key) => {
      encryptionKeyRef.current = key;
      setHousehold(state);
      setUnlocked(true);
    }} onRecover={() => {
      clearHousehold();
      setEncryptedEnvelope(null);
      setHousehold(null);
      setUnlocked(true);
    }} />;
  }

  if (!household) {
    return (
      <div className="app-shell setup-shell">
        <div className="setup-card">
          <div className="setup-mark"><img src="./assets/images/seedling.png" alt="" /></div>
          <p className="eyebrow">家庭专属学习空间</p>
          <h1>先建立家庭空间</h1>
          <p className="setup-copy">只有拿到家长密码的人，才能进入孩子档案和学习记录。</p>
          <form onSubmit={createHousehold} className="setup-form">
            <label><span>家庭称呼</span><input aria-label="家庭称呼" placeholder="例如：我们的学习岛" value={setupValues.householdName} onChange={(event) => setSetupValues({ ...setupValues, householdName: event.target.value })} /></label>
            <label><span>家长称呼</span><input aria-label="家长称呼" placeholder="例如：妈妈" value={setupValues.parentName} onChange={(event) => setSetupValues({ ...setupValues, parentName: event.target.value })} /></label>
            <label><span>家长密码</span><input aria-label="家长密码" type="password" inputMode="numeric" maxLength={6} placeholder="4–6 位数字" value={setupValues.pin} onChange={(event) => setSetupValues({ ...setupValues, pin: event.target.value.replace(/[^0-9]/g, "") })} /></label>
            {setupError ? <p className="form-error" role="alert">{setupError}</p> : null}
            <button className="primary-button wide-button" type="submit"><ShieldCheck aria-hidden="true" />建立家庭空间</button>
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
    return <>{storageBanner}<ParentDashboard household={household} onBack={backToProfiles} onUpdateChild={updateChild} onLock={lockHousehold} onImport={importBackup} /></>;
  }

  if (screen === "assessment" && activeChild && session && currentQuestion) {
    return (
      <div className="app-shell">
        {storageBanner}
        <SessionHeader child={activeChild} subject={session.subject} kind={session.kind} answered={session.attempts.length} total={session.length} onBack={() => setScreen("child")} />
        <QuizScreen question={currentQuestion} feedback={feedback} onAnswer={answerQuestion} onNext={advanceSession} />
      </div>
    );
  }

  if (screen === "result" && activeChild && session && summary) {
    return (
      <div className="app-shell">
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
          <div className="profile-heading"><p className="eyebrow">孩子模式</p><h1>今天谁来学习？</h1><p>每个孩子都有自己的进度、复习节奏和学习计划。</p></div>
          <div className="profile-grid">
            {household.children.map((child) => (
              <button key={child.id} className="profile-card" type="button" onClick={() => { setActiveChildId(child.id); setScreen("child"); }} aria-label={`${child.name}的学习档案`}>
                <div className={`profile-avatar avatar-${child.avatar}`}><img src={`./assets/images/${avatars.find((avatar) => avatar.id === child.avatar)?.image ?? "star"}.png`} alt="" /></div>
                <strong>{child.name}</strong><span>{Object.keys(child.diagnostics).length ? "学习岛已开启" : "还没有做入学小测"}</span><ChevronRight aria-hidden="true" />
              </button>
            ))}
            <button className="profile-card add-profile-card" type="button" onClick={() => setShowAddChild(true)} aria-label="添加孩子"><Plus aria-hidden="true" /><strong>添加孩子</strong><span>家长可以建立新的学习档案</span></button>
          </div>
          <button className="parent-entry" type="button" onClick={() => setShowParentGate(true)}><ShieldCheck aria-hidden="true" />家长看板</button>
        </main>
        {showAddChild ? <AddChildDialog onCancel={() => setShowAddChild(false)} onSave={addChild} /> : null}
        {showParentGate ? <ParentPinDialog household={household} onCancel={() => setShowParentGate(false)} onSuccess={() => { setShowParentGate(false); setScreen("parent"); }} /> : null}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {storageBanner}
      <TopBar title={activeChild?.name ?? "学习岛"} subtitle="今天想学什么？" onBack={backToProfiles} onLock={lockHousehold} />
      {activeChild ? (
        <main className="child-home">
          <section className="child-hero"><div className="child-hero-copy"><p className="eyebrow">今天的一点点</p><h1>{activeChild.name}，今天想学什么？</h1><p>每次只要 10–15 分钟。做对了会变成新的证据，不会只用一次答题就判定已经掌握。</p></div><div className="child-hero-visual"><img src="./assets/images/books.png" alt="" /><span>+1</span></div></section>
          <div className="subject-grid">
            {subjectCards.map((card) => (
              <button key={card.subject} className={`subject-card ${card.className}`} type="button" aria-label={card.title} onClick={() => startSubject(card.subject)}>
                <div className="subject-art"><img src={`./assets/images/${card.image}.png`} alt="" /></div>
                <div className="subject-copy"><span>学习岛</span><strong>{card.title}</strong><p>{card.subtitle}</p></div>
                <div className="subject-status"><Star aria-hidden="true" /><span>{activeChild.diagnostics[card.subject] ? "继续今天的练习" : "先做入学小测"}</span><ChevronRight aria-hidden="true" /></div>
              </button>
            ))}
          </div>
          <section className="child-note"><BookOpen aria-hidden="true" /><span>系统只推荐当前证据支持的内容；未知的部分会继续观察。</span></section>
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
        <h1>输入家长密码</h1>
        <p className="setup-copy">孩子档案和学习记录只在这台设备上显示给已解锁的家庭成员。</p>
        <form onSubmit={submit} className="setup-form">
          <label><span>家长密码</span><input aria-label="家长密码" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value.replace(/[^0-9]/g, "")); setError(""); }} autoFocus /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button wide-button" type="submit" disabled={checking}><ShieldCheck aria-hidden="true" />解锁家庭空间</button>
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
        <p className="eyebrow">家庭学习空间</p>
        <h1>输入家长密码</h1>
        <p className="setup-copy">孩子档案已加密保存在这台设备上，只有正确密码能够解密。</p>
        <form onSubmit={submit} className="setup-form">
          <label><span>家长密码</span><input aria-label="家长密码" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value.replace(/[^0-9]/g, "")); setError(""); }} autoFocus /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button wide-button" type="submit" disabled={checking}><ShieldCheck aria-hidden="true" />解锁家庭空间</button>
          {failedAttempts > 0 ? <button className="quiet-button wide-button" type="button" onClick={() => {
            downloadJson(envelope, `little-sprout-encrypted-${new Date().toISOString().slice(0, 10)}.json`);
            if (window.confirm("如果密码仍然无法解密，可以下载当前加密数据后重新建立家庭。确定继续吗？")) onRecover();
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
        <h1>学习记录需要修复</h1>
        <p className="setup-copy">检测到无法读取的数据。系统没有自动覆盖它，你可以先下载损坏数据备份，再重新建立家庭空间。</p>
        <div className="recovery-detail">{recovery.error}</div>
        <div className="dialog-actions">
          <button className="quiet-button" type="button" onClick={downloadBackup}>下载损坏数据</button>
          <button className="primary-button" type="button" onClick={onReset}>清除并重新开始</button>
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
        <p className="eyebrow">家长权限</p><h2>打开家长看板</h2>
        <form onSubmit={submit} className="dialog-form">
          <label><span>家长密码确认</span><input aria-label="家长密码确认" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/[^0-9]/g, ""))} autoFocus /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions"><button className="quiet-button" type="button" onClick={onCancel}>取消</button><button className="primary-button" type="submit">进入看板</button></div>
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
      <div className="header-tools"><div className="header-badge"><ShieldCheck aria-hidden="true" /><span>家庭空间</span></div>{onLock ? <button className="icon-button" type="button" onClick={() => void onLock()} aria-label="锁定家庭空间"><Lock aria-hidden="true" /></button> : null}</div>
    </header>
  );
}

function SessionHeader({ child, subject, kind, answered, total, onBack }: { child: ChildProfile; subject: Subject; kind: "diagnostic" | "practice"; answered: number; total: number; onBack: () => void }) {
  return (
    <header className="session-header">
      <button className="quiet-button compact-button" type="button" onClick={onBack}><ChevronLeft aria-hidden="true" />退出</button>
      <div><p className="eyebrow">{child.name} · 家庭学习岛</p><h1>{subjectNames[subject]}{kind === "diagnostic" ? "入学小测" : "自适应练习"}</h1></div>
      <div className="session-progress"><span>{answered} / {total}</span><div><i style={{ width: `${(answered / total) * 100}%` }} /></div></div>
    </header>
  );
}

function QuizScreen({ question, feedback, onAnswer, onNext }: { question: ChoiceQuestion; feedback: { correct: boolean; answer: string } | null; onAnswer: (answer: string) => void; onNext: () => void }) {
  const options = useMemo(() => deterministicOptions(question), [question]);
  const correct = feedback?.answer === question.correctAnswer;
  return (
    <main className="quiz-layout">
      <section className="quiz-stage">
        <button className="audio-button" type="button" onClick={() => speakText(question.audioText ?? question.prompt, question.audioLanguage ?? "en-US")} aria-label="朗读题目"><Headphones aria-hidden="true" /></button>
        {question.passage ? <div className="question-passage"><span>Read</span><p>{question.passage}</p></div> : null}
        {question.displayCharacter ? <div className="character-display">{question.displayCharacter}</div> : null}
        {question.image ? <img className="question-image" src={`./assets/images/${question.image}.png`} alt="" /> : null}
        <p className="question-instruction">{question.instruction}</p>
        <h2 data-testid="question-prompt">{question.prompt}</h2>
      </section>
      <section className="answer-panel">
        <div className="answer-grid">
          {options.map((option) => (
            <button
              key={option}
              className={`answer-option ${feedback && option === feedback.answer ? (correct ? "is-correct" : "is-wrong") : ""} ${feedback && !correct && option === question.correctAnswer ? "is-correct-answer" : ""}`}
              data-correct={option === question.correctAnswer ? "true" : "false"}
              type="button"
              onClick={() => onAnswer(option)}
              disabled={Boolean(feedback)}
            >{option}</button>
          ))}
        </div>
        {feedback ? (
          <div className={`answer-feedback ${correct ? "correct-feedback" : "wrong-feedback"}`} data-testid="answer-feedback">
            <div className="feedback-title">{correct ? <><Check aria-hidden="true" />答对了</> : <><X aria-hidden="true" />再看一眼</>}</div>
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
      <div className="result-hero"><img src="./assets/images/sparkles.png" alt="" /><p className="eyebrow">{kind === "diagnostic" ? "第一份学习线索" : "这一轮练习完成"}</p><h1>{subjectNames[subject]}{kind === "diagnostic" ? "小测完成" : "练习完成"}</h1><p>这不是给孩子贴年级标签，而是帮助系统知道下一步从哪里开始。</p></div>
      <section className="result-list">
        {summary.map((row) => <div className="result-row" key={row.skillId}><span>{row.title}</span><strong>{masteryLabels[row.level]}</strong><small>{Math.round(row.pKnown * 100)}% 初步估计</small></div>)}
      </section>
      <div className="result-actions"><button className="quiet-button" type="button" onClick={onParent}><ShieldCheck aria-hidden="true" />家长看板</button><button className="primary-button" type="button" onClick={onDone}>回到学习岛<ChevronRight aria-hidden="true" /></button></div>
    </main>
  );
}

function ParentDashboard({ household, onBack, onUpdateChild, onLock, onImport }: { household: HouseholdState; onBack: () => void; onUpdateChild: (child: ChildProfile) => void; onLock: () => void | Promise<void>; onImport: (household: HouseholdState) => void }) {
  function resetSubject(child: ChildProfile, subject: Subject) {
    const next = clone(child);
    delete next.diagnostics[subject];
    delete next.activeSessions[subject];
    for (const skill of SKILLS.filter((item) => item.subject === subject)) {
      next.evidence[skill.id] = createSkillEvidence(skill.id);
    }
    onUpdateChild(next);
  }

  function changeSessionLength(child: ChildProfile, length: number) {
    const next = clone(child);
    next.settings.sessionLength = length;
    onUpdateChild(next);
  }

  function exportBackup() {
    downloadJson(household, `little-sprout-family-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async function importBackupFile(file: File | undefined) {
    if (!file) return;
    try {
      const imported = parseHouseholdBackup(await file.text());
      if (!window.confirm("导入会替换当前家庭中的全部孩子和学习记录，确定继续吗？")) return;
      onImport(imported);
    } catch {
      window.alert("这个备份文件无法读取，当前学习记录没有改变。");
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header"><div><p className="eyebrow">家长专属</p><h1>学习进度总览</h1></div><div className="dashboard-actions"><button className="quiet-button compact-button" type="button" onClick={onBack}><X aria-hidden="true" />关闭</button><button className="quiet-button compact-button" type="button" onClick={() => void onLock()}><Lock aria-hidden="true" />锁定</button></div></header>
      <main className="parent-dashboard">
        <div className="backup-panel">
          <button className="quiet-button compact-button" type="button" onClick={exportBackup}><Download aria-hidden="true" />导出学习备份</button>
          <label className="quiet-button compact-button file-button"><Upload aria-hidden="true" />导入学习备份<input type="file" accept="application/json,.json" onChange={(event) => void importBackupFile(event.target.files?.[0])} /></label>
        </div>
        {household.children.length === 0 ? <div className="empty-panel">还没有孩子档案。回到孩子选择页，添加第一个档案。</div> : household.children.map((child) => (
          <section className="parent-child-panel" key={child.id}>
            <div className="parent-child-heading"><div className={`profile-avatar small-avatar avatar-${child.avatar}`}><img src={`./assets/images/${avatars.find((avatar) => avatar.id === child.avatar)?.image ?? "star"}.png`} alt="" /></div><div><h2>{child.name}</h2><p>{child.attempts.length} 次有效作答 · {Object.keys(child.diagnostics).length} 科已完成定位</p></div></div>
            <div className="parent-controls">
              <label><span>每次题量</span><select aria-label={`${child.name}的每次题量`} value={child.settings.sessionLength} onChange={(event) => changeSessionLength(child, Number(event.target.value))}><option value="6">6 题</option><option value="8">8 题</option><option value="10">10 题</option></select></label>
              <div className="reset-group">{(Object.keys(subjectNames) as Subject[]).map((subject) => <button key={subject} className="quiet-button compact-button" type="button" onClick={() => resetSubject(child, subject)}>重新定位{subjectNames[subject]}</button>)}</div>
              <small>内容包 {CONTENT_VERSION} · 30 个知识点 · 180 道选择题 · 试点覆盖，不代表完整 P1/P2 课程</small>
            </div>
            {(Object.keys(subjectNames) as Subject[]).map((subject) => {
              const subjectSkills = SKILLS.filter((skill) => skill.subject === subject);
              const observed = subjectSkills.filter((skill) => child.evidence[skill.id]?.nEff > 0);
              const secure = subjectSkills.filter((skill) => classifyMastery(child.evidence[skill.id]) === "secure" || classifyMastery(child.evidence[skill.id]) === "likely-secure");
              return <div className="subject-summary-row" key={subject}><span>{subjectNames[subject]}</span><strong>{observed.length} 个知识点有证据</strong><small>{secure.length} 个暂稳/稳固</small></div>;
            })}
          </section>
        ))}
      </main>
    </div>
  );
}

function AddChildDialog({ onCancel, onSave }: { onCancel: () => void; onSave: (child: ChildProfile) => void | Promise<void> }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("star");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const canSave = useMemo(() => name.trim().length > 0, [name]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || saving) { if (!canSave) setError("请先填写孩子名字"); return; }
    setSaving(true);
    await onSave(createChildProfile(name, avatar));
    setSaving(false);
  }
  return (
    <div className="modal-backdrop"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-child-title"><p className="eyebrow">家长操作</p><h2 id="add-child-title">新建孩子档案</h2><form onSubmit={submit} className="dialog-form"><label><span>孩子名字</span><input aria-label="孩子名字" value={name} onChange={(event) => setName(event.target.value)} placeholder="只填写日常称呼也可以" autoFocus /></label><div className="avatar-picker" aria-label="选择头像">{avatars.map((item) => <button key={item.id} className={`avatar-choice ${avatar === item.id ? "is-selected" : ""}`} type="button" aria-label={item.label} onClick={() => setAvatar(item.id)}><img src={`./assets/images/${item.image}.png`} alt="" /></button>)}</div>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="dialog-actions"><button className="quiet-button" type="button" onClick={onCancel}>取消</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "保存中…" : "保存档案"}</button></div></form></div></div>
  );
}

function deterministicOptions(question: ChoiceQuestion): string[] {
  const score = (value: string) => Array.from(question.id + value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);
  return [...question.options].sort((a, b) => score(a) - score(b));
}

function speakText(text: string, language: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.85;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith(language.slice(0, 2)));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function downloadJson(value: unknown, filename: string) {
  downloadText(JSON.stringify(value, null, 2), filename);
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
