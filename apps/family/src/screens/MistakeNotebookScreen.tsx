import { BookOpen, Check, ChevronLeft, Flame, Lock, Printer, Sparkles, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { QUESTIONS, SKILLS } from "../content/catalog";
import { subjectName } from "../content/copy";
import { ENGLISH_HANDWRITING_ITEMS } from "../content/englishHandwriting";
import { HANDWRITING_CHARACTERS } from "../content/handwriting";
import { classifyMastery } from "../engine/bkt";
import { playOrSpeak } from "../lib/audio";
import { preAnswerAudio } from "../lib/questionAudio";
import type { ChildProfile, LearningLevel, Question, Subject } from "../lib/types";

interface MistakeNotebookScreenProps {
  child: ChildProfile;
  initialTab?: "notebook" | "worksheet";
  onBack: () => void;
  onLock: () => void | Promise<void>;
  onStartBooster: (subject: Subject, questionIds: string[]) => void;
}

type SubjectFilter = "ALL" | Subject;
type WorksheetKind = "mandarin-grid" | "english-lines" | "math-drill";

function formatQuestionAnswer(question: Question): string {
  if (question.kind === "choice") return question.correctAnswer;
  if (question.kind === "order") return question.correctOrder.join(question.separator ?? " ");
  return question.pairs.map((pair) => `${pair.left} → ${pair.right}`).join("；");
}

export default function MistakeNotebookScreen({
  child,
  initialTab = "notebook",
  onBack,
  onLock,
  onStartBooster
}: MistakeNotebookScreenProps) {
  const [activeTab, setActiveTab] = useState<"notebook" | "worksheet">(initialTab);
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("ALL");
  const [worksheetKind, setWorksheetKind] = useState<WorksheetKind>("mandarin-grid");
  const [worksheetLevel, setWorksheetLevel] = useState<"ALL" | LearningLevel>(child.gradeLevel);
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [prioritizeWeak, setPrioritizeWeak] = useState(true);
  const [pageSeed, setPageSeed] = useState(0);

  // 1. Collect real wrong or hinted attempts from child history
  const mistakeRecords = useMemo(() => {
    const byQuestionId = new Map<
      string,
      {
        question: Question;
        wrongCount: number;
        hintCount: number;
        lastSeenAt: string;
        resolved: boolean;
      }
    >();

    for (const attempt of child.attempts) {
      const q = QUESTIONS.find((item) => item.id === attempt.questionId);
      if (!q) continue;
      const existing = byQuestionId.get(q.id);
      if (!attempt.correct || attempt.hintUsed) {
        byQuestionId.set(q.id, {
          question: q,
          wrongCount: (existing?.wrongCount ?? 0) + (attempt.correct ? 0 : 1),
          hintCount: (existing?.hintCount ?? 0) + (attempt.hintUsed ? 1 : 0),
          lastSeenAt: attempt.createdAt,
          resolved: false
        });
      } else if (existing) {
        existing.resolved = true;
      }
    }

    return [...byQuestionId.values()].sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      return b.wrongCount + b.hintCount - (a.wrongCount + a.hintCount);
    });
  }, [child.attempts]);

  // 2. Weak or due-for-review skills
  const weakSkills = useMemo(() => {
    const enabled = new Set(child.settings.enabledSkills);
    return SKILLS.filter((skill) => enabled.has(skill.id))
      .map((skill) => {
        const ev = child.evidence[skill.id];
        const mastery = classifyMastery(ev);
        const isDue = Boolean(ev?.dueAt && new Date(ev.dueAt).getTime() <= Date.now());
        return {
          skill,
          pKnown: ev?.pKnown ?? 0.35,
          nEff: ev?.nEff ?? 0,
          wrongStreak: ev?.wrongStreak ?? 0,
          mastery,
          isDue
        };
      })
      .filter((row) => row.isDue || row.wrongStreak > 0 || row.mastery === "developing")
      .sort((a, b) => (a.isDue === b.isDue ? a.pKnown - b.pKnown : a.isDue ? -1 : 1));
  }, [child.evidence, child.settings.enabledSkills]);

  // 3. Recommended high-value booster items when historical mistakes are fewer than 6
  const recommendedCuratedQuestions = useMemo(() => {
    const featuredIds = [
      "q-math-olympiad-reasoning-1",
      "q-math-olympiad-reasoning-3",
      "q-math-add-sub-regroup-1",
      "q-math-two-step-problems-1",
      "q-mandarin-idioms-classics-1",
      "q-mandarin-idioms-classics-11",
      "q-mandarin-radicals-homographs-6",
      "q-mandarin-conjunctions-complex-1",
      "q-english-science-nature-1",
      "q-english-science-nature-6",
      "q-english-tenses-agreement-11",
      "q-english-cloze-passage-1"
    ];
    const existingIds = new Set(mistakeRecords.map((item) => item.question.id));
    return featuredIds
      .map((id) => QUESTIONS.find((item) => item.id === id))
      .filter((q): q is Question => Boolean(q && !existingIds.has(q.id)));
  }, [mistakeRecords]);

  const filteredMistakes = useMemo(
    () => mistakeRecords.filter((row) => subjectFilter === "ALL" || row.question.subject === subjectFilter),
    [mistakeRecords, subjectFilter]
  );

  const filteredCurated = useMemo(
    () => recommendedCuratedQuestions.filter((q) => subjectFilter === "ALL" || q.subject === subjectFilter),
    [recommendedCuratedQuestions, subjectFilter]
  );

  function pickPageSlice<T>(items: T[], pageSize: number, seed: number): T[] {
    if (items.length <= pageSize) return items;
    const start = (seed * pageSize) % items.length;
    const doubled = [...items, ...items];
    return doubled.slice(start, start + pageSize);
  }

  // Printable A4 Worksheet generators with weak-first & random page rotation
  const printableMandarinChars = useMemo(() => {
    const pool = HANDWRITING_CHARACTERS.filter(
      (item) => worksheetLevel === "ALL" || item.level === worksheetLevel
    );
    const sorted = prioritizeWeak
      ? [...pool].sort((a, b) => {
          const recA = child.handwriting[a.character];
          const recB = child.handwriting[b.character];
          if (!recA && recB) return -1;
          if (recA && !recB) return 1;
          return (recB?.bestMistakes ?? 0) - (recA?.bestMistakes ?? 0);
        })
      : pool;
    return pickPageSlice(sorted, 10, pageSeed);
  }, [child.handwriting, worksheetLevel, prioritizeWeak, pageSeed]);

  const printableEnglishItems = useMemo(() => {
    const pool = ENGLISH_HANDWRITING_ITEMS.filter(
      (item) => worksheetLevel === "ALL" || item.level === worksheetLevel
    );
    const sorted = prioritizeWeak
      ? [...pool].sort((a, b) => {
          const recA = child.handwriting[a.character];
          const recB = child.handwriting[b.character];
          if (!recA && recB) return -1;
          if (recA && !recB) return 1;
          return (recB?.bestMistakes ?? 0) - (recA?.bestMistakes ?? 0);
        })
      : pool;
    return pickPageSlice(sorted, 10, pageSeed);
  }, [child.handwriting, worksheetLevel, prioritizeWeak, pageSeed]);

  const printableMathQuestions = useMemo(() => {
    const mathMistakes = mistakeRecords
      .filter((row) => row.question.subject === "math" && row.question.kind === "choice")
      .map((row) => row.question);
    const fallbackMath = QUESTIONS.filter(
      (q) =>
        q.subject === "math" &&
        q.kind === "choice" &&
        (q.skillId === "math-olympiad-reasoning" ||
          q.skillId === "math-add-sub-regroup" ||
          q.skillId === "math-two-step-problems" ||
          q.skillId === "math-multiply-tables" ||
          q.skillId === "math-add-sub-1000")
    );
    const orderedSource = prioritizeWeak ? [...mathMistakes, ...fallbackMath] : fallbackMath;
    const deduped: Question[] = [];
    const seen = new Set<string>();
    for (const q of orderedSource) {
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      deduped.push(q);
    }
    return pickPageSlice(deduped, 10, pageSeed);
  }, [mistakeRecords, prioritizeWeak, pageSeed]);

  function startTargetedBooster(targetSubject?: Subject) {
    const chosenSubject: Subject =
      targetSubject ?? (subjectFilter !== "ALL" ? subjectFilter : filteredMistakes[0]?.question.subject ?? "math");
    const realIds = mistakeRecords
      .filter((row) => row.question.subject === chosenSubject)
      .map((row) => row.question.id);
    const curatedIds = recommendedCuratedQuestions
      .filter((q) => q.subject === chosenSubject)
      .map((q) => q.id);
    const fallbackIds = QUESTIONS.filter((q) => q.subject === chosenSubject).map((q) => q.id);
    const merged = Array.from(new Set([...realIds, ...curatedIds, ...fallbackIds])).slice(0, 6);
    onStartBooster(chosenSubject, merged);
  }

  return (
    <div className={`app-shell ${child.settings.highContrast ? "child-high-contrast" : ""} ${child.settings.largeText ? "child-large-text" : ""}`.trim()}>
      <header className="session-header handwriting-header no-print">
        <button className="quiet-button compact-button" type="button" onClick={onBack}>
          <ChevronLeft aria-hidden="true" />返回
        </button>
        <div>
          <p className="eyebrow">{child.name} · 错题特训与 A4 打印字帖工坊</p>
          <h1>我的错题本与打印练习卷</h1>
        </div>
        <button className="quiet-button compact-button" type="button" onClick={() => void onLock()}>
          <Lock aria-hidden="true" />退出并锁定
        </button>
      </header>

      <main className="handwriting-screen">
        <div className="speaking-decks no-print" role="tablist" aria-label="切换错题本与打印练习卷" style={{ justifyContent: "center" }}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "notebook"}
            className={`speaking-deck ${activeTab === "notebook" ? "is-active" : ""}`}
            onClick={() => setActiveTab("notebook")}
          >
            <BookOpen aria-hidden="true" /> 我的错题本与弱项特训（{mistakeRecords.length} 道错题记录）
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "worksheet"}
            className={`speaking-deck ${activeTab === "worksheet" ? "is-active" : ""}`}
            onClick={() => setActiveTab("worksheet")}
          >
            <Printer aria-hidden="true" /> 一键打印 A4 描红与口算练习卷
          </button>
        </div>

        {activeTab === "notebook" ? (
          <section className="arcade-stage-card no-print">
            <div className="arcade-status-banner">
              <img src="./assets/images/studio-notebook.svg" alt="" aria-hidden="true" />
              <div>
                <strong>
                  {mistakeRecords.length > 0
                    ? `已收录 ${mistakeRecords.length} 道做错或用过提示的题目`
                    : "目前还没有历史错题，已为你准备好「高频易错与拓展精选特训题」！"}
                </strong>
                <p>点任意题目的小喇叭可以听小芽老师读题和讲解，也可以一键开启 6 题专项特训闯关。</p>
              </div>
              <button
                type="button"
                className="primary-button compact-button"
                data-testid="start-booster-btn"
                onClick={() => startTargetedBooster()}
              >
                <Flame aria-hidden="true" /> 一键开启 6 题专项特训
              </button>
            </div>

            <div className="arcade-subdeck-bar" role="group" aria-label="按学科筛选错题">
              {(["ALL", "math", "mandarin", "english"] as const).map((subj) => (
                <button
                  key={subj}
                  type="button"
                  className={`speaking-deck ${subjectFilter === subj ? "is-active" : ""}`}
                  onClick={() => setSubjectFilter(subj)}
                >
                  {subj === "ALL" ? "全部学科" : subjectName(subj, "zh")}
                </button>
              ))}
            </div>

            {weakSkills.length > 0 ? (
              <div className="mistake-weak-skills">
                <p className="section-label">当前需要重点巩固的技能节点</p>
                <div className="result-chips">
                  {weakSkills.slice(0, 6).map(({ skill, isDue }) => (
                    <span key={skill.id}>
                      {subjectName(skill.subject, "zh")} · {skill.shortTitle}
                      {isDue ? "（待复习）" : "（建议加练）"}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {filteredMistakes.length > 0 ? (
              <div className="mistake-card-list" data-testid="mistake-history-list">
                <p className="section-label">历史错题与提示记录（{filteredMistakes.length} 题）</p>
                {filteredMistakes.map(({ question, wrongCount, hintCount, resolved }) => {
                  const lang = question.audioLanguage ?? (question.subject === "mandarin" ? "zh-CN" : "en-US");
                  const skill = SKILLS.find((s) => s.id === question.skillId);
                  return (
                    <article key={question.id} className="mistake-item-card">
                      <div className="mistake-item-head">
                        <span className="studio-hub-pill">
                          {subjectName(question.subject, "zh")} · {skill?.shortTitle ?? question.skillId}
                        </span>
                        <small>
                          {wrongCount > 0 ? `答错 ${wrongCount} 次` : ""}
                          {wrongCount > 0 && hintCount > 0 ? " · " : ""}
                          {hintCount > 0 ? `看提示 ${hintCount} 次` : ""}
                          {resolved ? " · 已攻克" : " · 待攻克"}
                        </small>
                      </div>
                      <h3>{question.prompt}</h3>
                      <p className="mistake-item-answer">
                        <strong>正确答案：</strong>
                        {formatQuestionAnswer(question)}
                      </p>
                      <p className="mistake-item-explanation">
                        <strong>小芽老师解析：</strong>
                        {question.explanation}
                      </p>
                      <div className="mistake-item-actions">
                        <button
                          type="button"
                          className="quiet-button compact-button"
                          onClick={() => playOrSpeak(preAnswerAudio(question), lang)}
                        >
                          <Volume2 aria-hidden="true" /> 听题目
                        </button>
                        <button
                          type="button"
                          className="quiet-button compact-button"
                          onClick={() => playOrSpeak(question.explanation, lang)}
                        >
                          <Sparkles aria-hidden="true" /> 听老师讲解析
                        </button>
                        <button
                          type="button"
                          className="primary-button compact-button"
                          onClick={() => startTargetedBooster(question.subject)}
                        >
                          练这一科特训
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}

            <div className="mistake-card-list" data-testid="curated-booster-list">
              <p className="section-label">高频易错与课外拓展精选特训题（{filteredCurated.length} 题）</p>
              {filteredCurated.map((question) => {
                const lang = question.audioLanguage ?? (question.subject === "mandarin" ? "zh-CN" : "en-US");
                const skill = SKILLS.find((s) => s.id === question.skillId);
                return (
                  <article key={question.id} className="mistake-item-card">
                    <div className="mistake-item-head">
                      <span className="studio-hub-pill">
                        {subjectName(question.subject, "zh")} · {skill?.shortTitle ?? question.skillId}
                      </span>
                      <small>精选拔高题</small>
                    </div>
                    <h3>{question.prompt}</h3>
                    <p className="mistake-item-answer">
                      <strong>参考答案：</strong>
                      {formatQuestionAnswer(question)}
                    </p>
                    <p className="mistake-item-explanation">
                      <strong>小芽老师解析：</strong>
                      {question.explanation}
                    </p>
                    <div className="mistake-item-actions">
                      <button
                        type="button"
                        className="quiet-button compact-button"
                        onClick={() => playOrSpeak(preAnswerAudio(question), lang)}
                      >
                        <Volume2 aria-hidden="true" /> 听题目
                      </button>
                      <button
                        type="button"
                        className="quiet-button compact-button"
                        onClick={() => playOrSpeak(question.explanation, lang)}
                      >
                        <Sparkles aria-hidden="true" /> 听老师讲解析
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="arcade-stage-card">
            <div className="worksheet-toolbar no-print">
              <div className="speaking-decks" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`speaking-deck ${worksheetKind === "mandarin-grid" ? "is-active" : ""}`}
                  onClick={() => setWorksheetKind("mandarin-grid")}
                >
                  1. 华文米字格描红字帖（A4）
                </button>
                <button
                  type="button"
                  className={`speaking-deck ${worksheetKind === "english-lines" ? "is-active" : ""}`}
                  onClick={() => setWorksheetKind("english-lines")}
                >
                  2. 英文四线三格字母与单词字帖（A4）
                </button>
                <button
                  type="button"
                  className={`speaking-deck ${worksheetKind === "math-drill" ? "is-active" : ""}`}
                  onClick={() => setWorksheetKind("math-drill")}
                >
                  3. 数学口算与思维巩固练习卷（A4）
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                <div className="speaking-decks" style={{ margin: 0 }}>
                  {(["ALL", "K2", "P1", "P2"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`speaking-deck ${worksheetLevel === lvl ? "is-active" : ""}`}
                      onClick={() => {
                        setWorksheetLevel(lvl);
                        setPageSeed(0);
                      }}
                    >
                      {lvl === "ALL" ? "全部年级" : `${lvl} 年级`}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prioritizeWeak}
                  className={`speaking-deck ${prioritizeWeak ? "is-active" : ""}`}
                  onClick={() => {
                    setPrioritizeWeak((prev) => !prev);
                    setPageSeed(0);
                  }}
                >
                  {prioritizeWeak ? "✓ 已开启：未练过/错题优先" : "未练过/错题优先"}
                </button>
                {worksheetKind === "math-drill" ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showAnswerKey}
                    className={`speaking-deck ${showAnswerKey ? "is-active" : ""}`}
                    onClick={() => setShowAnswerKey((prev) => !prev)}
                  >
                    {showAnswerKey ? "✓ 附带底部参考答案栏" : "隐藏底部参考答案栏"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="quiet-button compact-button"
                  data-testid="shuffle-worksheet-btn"
                  onClick={() => setPageSeed((prev) => prev + 1)}
                >
                  <Sparkles aria-hidden="true" /> 随机换一页（第 {pageSeed + 1} 套）
                </button>
                <button
                  type="button"
                  className="primary-button compact-button"
                  data-testid="print-a4-btn"
                  onClick={() => window.print()}
                >
                  <Printer aria-hidden="true" /> 直接打印 / 导出 A4 PDF
                </button>
              </div>
            </div>

            {/* A4 Printable Sheet Preview & Print Target */}
            <div className="a4-printable-sheet" data-testid="a4-printable-sheet">
              <header className="a4-sheet-header">
                <div>
                  <h2>
                    小芽家庭学习岛 ·{" "}
                    {worksheetKind === "mandarin-grid"
                      ? "华文高频字米字格描红练习卷"
                      : worksheetKind === "english-lines"
                        ? "英文四线三格字母与自然拼读字帖"
                        : "数学口算与奥数思维巩固练习卷"}
                  </h2>
                  <p>
                    姓名：<strong>{child.name}</strong>　｜　年级：<strong>{worksheetLevel === "ALL" ? child.gradeLevel : worksheetLevel}</strong>　｜　日期：____年____月____日　｜　家长奖励星：☆☆☆☆☆
                  </p>
                </div>
              </header>

              {worksheetKind === "mandarin-grid" ? (
                <div className="a4-hanzi-rows">
                  {printableMandarinChars.map((item) => (
                    <div key={item.character} className="a4-hanzi-row">
                      <div className="a4-hanzi-meta">
                        <strong>
                          {item.character} <small>({item.pinyin})</small>
                        </strong>
                        <span>
                          {item.word} · {item.structure}
                        </span>
                      </div>
                      <div className="a4-mizige-boxes">
                        {[0, 1, 2, 3, 4, 5].map((cellIdx) => (
                          <div
                            key={cellIdx}
                            className={`a4-mizige-cell ${cellIdx === 0 ? "is-model" : cellIdx <= 3 ? "is-ghost" : "is-blank"}`}
                          >
                            <span>{cellIdx <= 3 ? item.character : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : worksheetKind === "english-lines" ? (
                <div className="a4-english-rows">
                  {printableEnglishItems.map((item) => (
                    <div key={item.id} className="a4-english-row">
                      <div className="a4-hanzi-meta">
                        <strong>
                          {item.display} <small>{item.phonics}</small>
                        </strong>
                        <span>
                          {item.word} ({item.chinese})
                        </span>
                      </div>
                      <div className="a4-fourline-strip">
                        <span className="is-model">{item.guideText}</span>
                        <span className="is-ghost">{item.guideText}</span>
                        <span className="is-ghost">{item.guideText}</span>
                        <span className="is-ghost">{item.word}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="a4-math-drill">
                  <div className="a4-math-grid">
                    {printableMathQuestions.map((q, idx) => (
                      <div key={q.id} className="a4-math-box">
                        <div className="a4-math-qhead">
                          <strong>第 {idx + 1} 题</strong>
                          <small>{SKILLS.find((s) => s.id === q.skillId)?.shortTitle ?? "数学思维"}</small>
                        </div>
                        <p>{q.prompt}</p>
                        {q.kind === "choice" ? (
                          <div className="a4-math-options">
                            {q.options.map((opt, oIdx) => (
                              <span key={opt}>
                                ({String.fromCharCode(65 + oIdx)}) {opt}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="a4-math-workarea">列式 / 答题区：__________________________</div>
                      </div>
                    ))}
                  </div>
                  {showAnswerKey ? (
                    <footer className="a4-answer-key">
                      <strong>家长核对参考答案：</strong>
                      {printableMathQuestions.map((q, idx) => `${idx + 1}. ${formatQuestionAnswer(q)}`).join("　｜　")}
                    </footer>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
