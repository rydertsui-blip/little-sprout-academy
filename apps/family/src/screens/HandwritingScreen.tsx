import HanziWriter, { type CharacterJson } from "hanzi-writer";
import { Check, ChevronLeft, ChevronRight, Lock, Pencil, RotateCcw, Sparkles, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { VOICE_LINES } from "../content/audioAssets";
import { ENGLISH_HANDWRITING_ITEMS, type EnglishHandwritingItem } from "../content/englishHandwriting";
import { HANDWRITING_CHARACTERS, type HandwritingCharacter } from "../content/handwriting";
import { playOrSpeak } from "../lib/audio";
import type { ChildProfile, LearningLevel } from "../lib/types";
import { PinyinBlendBar } from "./PinyinTool";

export type HandwritingTraceTarget = Pick<HandwritingCharacter, "character">;

interface HandwritingScreenProps {
  child: ChildProfile;
  initialCharacter?: string;
  initialScriptMode?: "mandarin" | "english";
  onBack: () => void;
  onLock: () => void | Promise<void>;
  onRecord: (entry: HandwritingTraceTarget, mistakes: number) => Promise<boolean>;
}

type Stage = "listening" | "demonstrating" | "writing" | "done";
type TraceResult = { mistakes: number; saved: boolean };
type LevelFilter = "ALL" | LearningLevel;
type ScriptMode = "mandarin" | "english";

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function HandwritingScreen({
  child,
  initialCharacter,
  initialScriptMode = "mandarin",
  onBack,
  onLock,
  onRecord
}: HandwritingScreenProps) {
  const [scriptMode, setScriptMode] = useState<ScriptMode>(initialScriptMode);
  const initialIdx = initialCharacter
    ? Math.max(0, HANDWRITING_CHARACTERS.findIndex((item) => item.character === initialCharacter))
    : 0;
  const [index, setIndex] = useState(initialIdx);
  const [enIndex, setEnIndex] = useState(0);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("ALL");
  const [cycle, setCycle] = useState(0);
  const [stage, setStage] = useState<Stage>("listening");
  const [result, setResult] = useState<TraceResult | null>(null);
  const [readingState, setReadingState] = useState<"playing" | "error" | null>(null);
  const [enStrokeProgress, setEnStrokeProgress] = useState(0);
  const [enUserPaths, setEnUserPaths] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const [enDrawing, setEnDrawing] = useState(false);

  const targetRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const recordRef = useRef(false);
  const entry = HANDWRITING_CHARACTERS[index] ?? HANDWRITING_CHARACTERS[0];
  const enEntry: EnglishHandwritingItem = ENGLISH_HANDWRITING_ITEMS[enIndex] ?? ENGLISH_HANDWRITING_ITEMS[0];

  useEffect(() => {
    if (!initialCharacter) return;
    const found = HANDWRITING_CHARACTERS.findIndex((item) => item.character === initialCharacter);
    if (found >= 0) {
      setScriptMode("mandarin");
      setIndex(found);
    }
  }, [initialCharacter]);

  // Mandarin HanziWriter teacher flow
  useEffect(() => {
    if (scriptMode !== "mandarin") return;
    const target = targetRef.current;
    if (!target) return;
    let cancelled = false;
    let followUpTimer = 0;
    target.innerHTML = "";
    setResult(null);
    setReadingState(null);
    setStage("listening");

    const writer = HanziWriter.create(target, entry.character, {
      width: 310,
      height: 310,
      padding: 18,
      showCharacter: false,
      showOutline: true,
      strokeColor: "#17324d",
      radicalColor: "#1c8b89",
      highlightColor: "#f2a65a",
      outlineColor: "#c8d5d7",
      drawingColor: "#e85c47",
      drawingWidth: 12,
      strokeWidth: 3,
      outlineWidth: 2,
      charDataLoader
    });
    writerRef.current = writer;
    writer.updateDimensions({ width: 310, height: 310, padding: 18 });

    async function runTeacherFlow() {
      await wait(450);
      if (cancelled) return;
      playOrSpeak(entry.introAudioText, "zh-CN");
      setStage("demonstrating");
      writer.showOutline({ duration: 0 });
      await wait(500);
      if (cancelled) return;
      await writer.animateCharacter();
      if (cancelled) return;
      setStage("writing");
      playOrSpeak(VOICE_LINES.traceNow, "zh-CN");
      await wait(900);
      if (cancelled) return;
      beginQuiz(writer, entry, (summary) => {
        if (cancelled) return;
        followUpTimer = window.setTimeout(() => {
          if (!cancelled && summary.totalMistakes <= 1) playOrSpeak(entry.audioText, "zh-CN");
        }, 1700);
      });
    }

    void runTeacherFlow();
    return () => {
      cancelled = true;
      window.clearTimeout(followUpTimer);
      writer.cancelQuiz();
      target.innerHTML = "";
      writerRef.current = null;
    };
  }, [cycle, entry, scriptMode]);

  // English 4-line ruled canvas teacher flow
  useEffect(() => {
    if (scriptMode !== "english") return;
    let cancelled = false;
    setResult(null);
    setReadingState(null);
    setEnStrokeProgress(0);
    setEnUserPaths([]);
    setStage("listening");

    async function runEnglishFlow() {
      await wait(250);
      if (cancelled) return;
      playOrSpeak(enEntry.introAudioText, "en-US");
      setStage("demonstrating");
      await wait(650);
      if (cancelled) return;
      setStage("writing");
    }

    void runEnglishFlow();
    return () => {
      cancelled = true;
    };
  }, [cycle, enEntry, scriptMode]);

  function beginQuiz(writer: HanziWriter, current: HandwritingCharacter, onSettled: (summary: { totalMistakes: number }) => void) {
    writer.cancelQuiz();
    writer.hideCharacter({ duration: 0 });
    writer.showOutline({ duration: 0 });
    void writer.quiz({
      leniency: 1,
      showHintAfterMisses: 2,
      markStrokeCorrectAfterMisses: 5,
      highlightOnComplete: true,
      onComplete: async (summary) => {
        if (recordRef.current) return;
        recordRef.current = true;
        const saved = await onRecord(current, summary.totalMistakes);
        setResult({ mistakes: summary.totalMistakes, saved });
        setStage("done");
        recordRef.current = false;
        playOrSpeak(saved && summary.totalMistakes <= 1 ? VOICE_LINES.writeGreat : VOICE_LINES.writeRetry, "zh-CN");
        onSettled(summary);
      }
    });
  }

  function selectIndex(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= HANDWRITING_CHARACTERS.length) return;
    writerRef.current?.cancelQuiz();
    setReadingState(null);
    if (nextIndex === index) setCycle((value) => value + 1);
    else setIndex(nextIndex);
  }

  function selectEnglishIndex(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= ENGLISH_HANDWRITING_ITEMS.length) return;
    setReadingState(null);
    if (nextIndex === enIndex) setCycle((value) => value + 1);
    else setEnIndex(nextIndex);
  }

  function readCurrentEntry() {
    setReadingState("playing");
    if (scriptMode === "mandarin") {
      playOrSpeak(stage === "done" ? entry.audioText : entry.introAudioText, "zh-CN", (status) => {
        if (status === "ended") setReadingState(null);
        else if (status === "error") setReadingState("error");
      });
    } else {
      playOrSpeak(stage === "done" ? enEntry.audioText : enEntry.introAudioText, "en-US", (status) => {
        if (status === "ended") setReadingState(null);
        else if (status === "error") setReadingState("error");
      });
    }
  }

  async function advanceEnglishStroke(customPath?: Array<{ x: number; y: number }>) {
    if (stage === "done") return;
    const totalStrokes = enEntry.strokes.length;
    const nextProgress = Math.min(totalStrokes, enStrokeProgress + 1);
    const guideStroke = enEntry.strokes[enStrokeProgress] ?? enEntry.strokes[0];
    setEnUserPaths((prev) => [...prev, customPath && customPath.length >= 2 ? customPath : guideStroke]);
    setEnStrokeProgress(nextProgress);

    if (nextProgress >= totalStrokes) {
      const saved = await onRecord({ character: enEntry.character }, 0);
      setResult({ mistakes: 0, saved });
      setStage("done");
      playOrSpeak(enEntry.audioText, "en-US");
    }
  }

  function handleEnglishPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (stage === "done") return;
    if (stage !== "writing") setStage("writing");
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 320;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 220;
    setEnDrawing(true);
    setEnUserPaths((prev) => [...prev, [{ x, y }]]);
  }

  function handleEnglishPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!enDrawing || stage === "done") return;
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 320;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 220;
    setEnUserPaths((prev) => {
      if (prev.length === 0) return [[{ x, y }]];
      const copy = [...prev];
      copy[copy.length - 1] = [...copy[copy.length - 1], { x, y }];
      return copy;
    });
  }

  async function handleEnglishPointerUp() {
    if (!enDrawing) return;
    setEnDrawing(false);
    const totalStrokes = enEntry.strokes.length;
    const nextProgress = Math.min(totalStrokes, enStrokeProgress + 1);
    setEnStrokeProgress(nextProgress);
    if (nextProgress >= totalStrokes) {
      const saved = await onRecord({ character: enEntry.character }, 0);
      setResult({ mistakes: 0, saved });
      setStage("done");
      playOrSpeak(enEntry.audioText, "en-US");
    }
  }

  const completedCount = HANDWRITING_CHARACTERS.filter((item) => child.handwriting[item.character]).length;
  const enCompletedCount = ENGLISH_HANDWRITING_ITEMS.filter((item) => child.handwriting[item.character]).length;

  const visibleCharacters = HANDWRITING_CHARACTERS.map((item, itemIndex) => ({ item, itemIndex })).filter(
    ({ item }) => levelFilter === "ALL" || item.level === levelFilter
  );
  const visibleEnglishItems = ENGLISH_HANDWRITING_ITEMS.map((item, itemIndex) => ({ item, itemIndex })).filter(
    ({ item }) => levelFilter === "ALL" || item.level === levelFilter
  );

  const teacherText =
    scriptMode === "mandarin"
      ? stage === "listening"
        ? `先听小芽老师读：${entry.character}（${entry.pinyin}），${entry.word}。${entry.tip}`
        : stage === "demonstrating"
          ? `看老师写「${entry.character}」（${entry.structure}），注意每一笔从哪里起笔。`
          : stage === "writing"
            ? `轮到你啦！沿着虚线，一笔一划把「${entry.character}」写出来吧。`
            : result && result.mistakes <= 1
              ? `太棒啦！「${entry.character}」写得又工整又准！再听一次：${entry.character}，${entry.word}。`
              : `不要气馁，你已经写完啦！我们再看一次「${entry.character}」的笔顺，慢慢写会更漂亮。`
      : stage === "listening"
        ? `先听标准发音：${enEntry.display}（${enEntry.phonics}），例词 ${enEntry.word}（${enEntry.chinese}）。`
        : stage === "demonstrating"
          ? `看四线三格位置：${enEntry.tip}`
          : stage === "writing"
            ? `轮到你啦！在下方四线三格里沿着虚线描出「${enEntry.display}」（已完成 ${enStrokeProgress}/${enEntry.strokes.length} 笔）。`
            : `太棒啦！「${enEntry.display} · ${enEntry.word}」在四线三格里写得又饱满又规范！`;

  return (
    <div className={`app-shell ${child.settings.highContrast ? "child-high-contrast" : ""} ${child.settings.largeText ? "child-large-text" : ""}`.trim()}>
      <header className="session-header handwriting-header">
        <button className="quiet-button compact-button" type="button" onClick={onBack}><ChevronLeft aria-hidden="true" />返回</button>
        <div>
          <p className="eyebrow">
            {child.name} · 小芽写字（华文 {HANDWRITING_CHARACTERS.length} 字 + 英文四线三格 {ENGLISH_HANDWRITING_ITEMS.length} 项）
          </p>
          <h1>看笔顺，亲手写</h1>
        </div>
        <button className="quiet-button compact-button" type="button" onClick={() => void onLock()}><Lock aria-hidden="true" />退出并锁定</button>
      </header>

      <main className="handwriting-screen teacher-handwriting">
        <div className="speaking-decks" role="tablist" aria-label="切换华文米字格与英文四线三格" style={{ justifyContent: "center", marginBottom: "4px" }}>
          <button
            type="button"
            role="tab"
            aria-selected={scriptMode === "mandarin"}
            className={`speaking-deck ${scriptMode === "mandarin" ? "is-active" : ""}`}
            onClick={() => setScriptMode("mandarin")}
          >
            华文米字格（{completedCount}/{HANDWRITING_CHARACTERS.length} 字）
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scriptMode === "english"}
            className={`speaking-deck ${scriptMode === "english" ? "is-active" : ""}`}
            onClick={() => setScriptMode("english")}
          >
            英文四线三格 A-Z 与单词（{enCompletedCount}/{ENGLISH_HANDWRITING_ITEMS.length}）
          </button>
        </div>

        <section className={`teacher-command handwriting-teacher ${stage}`}>
          <div className="teacher-mascot" aria-hidden="true"><img src="./assets/images/sprout-teacher.png" alt="" /><i /><i /><i /></div>
          <div className="teacher-bubble">
            <small>
              小芽老师 · {scriptMode === "mandarin" ? `${entry.level} · ${entry.structure}` : `${enEntry.level} · 四线三格自然拼读`}
            </small>
            <strong>{teacherText}</strong>
            <button
              className={`audio-button ${readingState ? `is-${readingState}` : ""}`}
              type="button"
              onClick={readCurrentEntry}
              aria-label={readingState === "playing" ? "播放中" : readingState === "error" ? "再点一次" : `朗读 ${scriptMode === "mandarin" ? entry.character : enEntry.display}`}
            >
              <Volume2 aria-hidden="true" />
            </button>
          </div>
        </section>

        {scriptMode === "mandarin" ? (
          <>
            <section className="handwriting-chart">
              <div className="handwriting-chart-heading">
                <p className="eyebrow">选一个字</p>
                <div className="speaking-decks" style={{ margin: 0 }}>
                  {(["ALL", "K2", "P1", "P2"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`speaking-deck ${levelFilter === lvl ? "is-active" : ""}`}
                      onClick={() => setLevelFilter(lvl)}
                    >
                      {lvl === "ALL" ? `全部 (${HANDWRITING_CHARACTERS.length})` : lvl}
                    </button>
                  ))}
                </div>
                <strong>{completedCount} / {HANDWRITING_CHARACTERS.length}</strong>
              </div>
              <div className="handwriting-rail" aria-label="选择汉字">
                {visibleCharacters.map(({ item, itemIndex }) => (
                  <button
                    key={item.character}
                    className={`handwriting-chip ${itemIndex === index ? "is-current" : ""} ${child.handwriting[item.character] ? "is-complete" : ""}`}
                    type="button"
                    aria-label={`学习汉字 ${item.character}`}
                    aria-pressed={itemIndex === index}
                    onClick={() => selectIndex(itemIndex)}
                  >
                    {item.character}
                    {child.handwriting[item.character] ? <Check aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            </section>

            <section className="handwriting-stage">
              <div className="handwriting-character-meta">
                <div className="handwriting-character"><span>{entry.character}</span><small>{entry.pinyin}</small></div>
                <div><h2>{entry.word} <small style={{ fontSize: "0.85rem", opacity: 0.75 }}>({entry.structure})</small></h2><p>{entry.english} · {entry.tip}</p></div>
              </div>
              <div style={{ width: "100%", maxWidth: "420px", margin: "0 auto 0.5rem" }}>
                <PinyinBlendBar char={entry.character} compact />
              </div>
              <div ref={targetRef} className="hanzi-target" aria-label={`${entry.character} 笔顺练习区`} />
              <div className="teacher-stage-label" aria-live="polite">
                {stage === "listening" ? "听字" : stage === "demonstrating" ? "看老师示范" : stage === "writing" ? "轮到你写" : "写完了"}
              </div>
              {result ? (
                <div className={`handwriting-feedback ${result.saved ? (result.mistakes <= 1 ? "correct-feedback" : "wrong-feedback") : "wrong-feedback"}`} role="status">
                  <strong>{result.saved ? (result.mistakes === 0 ? "写得真准！一笔不差！" : result.mistakes <= 1 ? "完成了，写得很棒！" : "不要气馁，再看一次笔顺会更熟练") : "这次没有保存成功"}</strong>
                  <p>{result.saved ? `笔顺提示 ${result.mistakes} 次。` : "请再写一次，让家长看板可以保存进度。"}</p>
                </div>
              ) : null}
              {stage === "done" ? (
                <div className="handwriting-actions">
                  <button className="quiet-button" type="button" onClick={() => selectIndex(index)}><RotateCcw aria-hidden="true" />再写一次</button>
                  {index < HANDWRITING_CHARACTERS.length - 1
                    ? <button className="primary-button" type="button" onClick={() => selectIndex(index + 1)}>写下一个<ChevronRight aria-hidden="true" /></button>
                    : <button className="primary-button" type="button" onClick={onBack}>完成写字<ChevronRight aria-hidden="true" /></button>}
                </div>
              ) : null}
            </section>
          </>
        ) : (
          <>
            <section className="handwriting-chart">
              <div className="handwriting-chart-heading">
                <p className="eyebrow">选一个字母或单词</p>
                <div className="speaking-decks" style={{ margin: 0 }}>
                  {(["ALL", "K2", "P1", "P2"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`speaking-deck ${levelFilter === lvl ? "is-active" : ""}`}
                      onClick={() => setLevelFilter(lvl)}
                    >
                      {lvl === "ALL" ? `全部 (${ENGLISH_HANDWRITING_ITEMS.length})` : lvl === "P2" ? "P2 拼读单词" : `${lvl} 字母`}
                    </button>
                  ))}
                </div>
                <strong>{enCompletedCount} / {ENGLISH_HANDWRITING_ITEMS.length}</strong>
              </div>
              <div className="handwriting-rail" aria-label="选择英文字母或单词">
                {visibleEnglishItems.map(({ item, itemIndex }) => (
                  <button
                    key={item.id}
                    className={`handwriting-chip ${itemIndex === enIndex ? "is-current" : ""} ${child.handwriting[item.character] ? "is-complete" : ""}`}
                    type="button"
                    aria-label={`学习英文 ${item.display}`}
                    aria-pressed={itemIndex === enIndex}
                    onClick={() => selectEnglishIndex(itemIndex)}
                    style={{ width: item.kind === "word" ? "74px" : undefined, fontSize: item.kind === "word" ? "20px" : "24px" }}
                  >
                    {item.display}
                    {child.handwriting[item.character] ? <Check aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            </section>

            <section className="handwriting-stage">
              <div className="handwriting-character-meta">
                <div className="handwriting-character" style={{ width: "110px" }}>
                  <span style={{ fontFamily: '"Andika", sans-serif', fontSize: "40px" }}>{enEntry.display}</span>
                  <small>{enEntry.phonics}</small>
                </div>
                <div>
                  <h2>
                    {enEntry.word} <small style={{ fontSize: "0.9rem", opacity: 0.8 }}>({enEntry.chinese})</small>
                  </h2>
                  <p>{enEntry.tip}</p>
                </div>
              </div>

              <div className="english-phonics-pill-row" style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  className="quiet-button compact-button"
                  onClick={() => playOrSpeak(enEntry.introAudioText, "en-US")}
                >
                  <Volume2 aria-hidden="true" /> 听字母与拼读：{enEntry.display} ({enEntry.phonics})
                </button>
                <button
                  type="button"
                  className="quiet-button compact-button"
                  onClick={() => playOrSpeak(enEntry.word, "en-US")}
                >
                  <Sparkles aria-hidden="true" /> 听例词：{enEntry.word} ({enEntry.chinese})
                </button>
              </div>

              <div className="four-line-canvas-card" style={{ width: "100%", maxWidth: "460px", margin: "0 auto" }}>
                <svg
                  viewBox="0 0 320 220"
                  className="four-line-svg"
                  aria-label={`${enEntry.display} 四线三格描红区`}
                  onPointerDown={handleEnglishPointerDown}
                  onPointerMove={handleEnglishPointerMove}
                  onPointerUp={() => void handleEnglishPointerUp()}
                  style={{
                    width: "100%",
                    height: "auto",
                    border: "2.5px solid #17324d",
                    borderRadius: "16px",
                    background: "#fffdf8",
                    touchAction: "none",
                    cursor: "crosshair"
                  }}
                >
                  {/* 4-Line Ruled Grid */}
                  <line x1="16" y1="40" x2="304" y2="40" stroke="#7a9ec2" strokeWidth="2" />
                  <line x1="16" y1="95" x2="304" y2="95" stroke="#5076bc" strokeWidth="2" strokeDasharray="8 6" />
                  <line x1="16" y1="150" x2="304" y2="150" stroke="#e85c47" strokeWidth="2.5" />
                  <line x1="16" y1="195" x2="304" y2="195" stroke="#7a9ec2" strokeWidth="2" />

                  <text x="20" y="34" fontSize="10" fontWeight="800" fill="#5e7080">1 顶线 Sky</text>
                  <text x="20" y="89" fontSize="10" fontWeight="800" fill="#5076bc">2 中虚线 Grass</text>
                  <text x="20" y="144" fontSize="10" fontWeight="800" fill="#e85c47">3 红基线 Base</text>
                  <text x="20" y="189" fontSize="10" fontWeight="800" fill="#5e7080">4 底线 Root</text>

                  {/* Ghost Guide Typography */}
                  <text
                    x="160"
                    y="148"
                    textAnchor="middle"
                    fontFamily="Andika, PingFang SC, sans-serif"
                    fontSize={enEntry.kind === "word" ? "96" : "112"}
                    fontWeight="700"
                    fill={stage === "done" ? "rgba(45, 113, 71, 0.22)" : "rgba(23, 50, 77, 0.14)"}
                    stroke={stage === "done" ? "#2d7147" : "#94a9b9"}
                    strokeWidth="2"
                    strokeDasharray={stage === "done" ? undefined : "5 4"}
                  >
                    {enEntry.guideText}
                  </text>

                  {/* Active Stroke Start Dot Indicator */}
                  {stage !== "done" && enEntry.strokes[enStrokeProgress] ? (
                    <g>
                      <circle
                        cx={enEntry.strokes[enStrokeProgress][0].x}
                        cy={enEntry.strokes[enStrokeProgress][0].y}
                        r="11"
                        fill="#f4b84b"
                        stroke="#17324d"
                        strokeWidth="2.5"
                      />
                      <text
                        x={enEntry.strokes[enStrokeProgress][0].x}
                        y={enEntry.strokes[enStrokeProgress][0].y + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="900"
                        fill="#17324d"
                      >
                        {enStrokeProgress + 1}
                      </text>
                    </g>
                  ) : null}

                  {/* User / Completed Traced Strokes */}
                  {enUserPaths.map((pts, idx) => (
                    <polyline
                      key={idx}
                      fill="none"
                      stroke="#17324d"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pts.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                    />
                  ))}
                </svg>
              </div>

              <div className="teacher-stage-label" aria-live="polite">
                {stage === "done"
                  ? "四线三格描红完成！"
                  : `第 ${Math.min(enEntry.strokes.length, enStrokeProgress + 1)} / ${enEntry.strokes.length} 笔 · 在四线三格上滑动描红或点下方按钮跟写`}
              </div>

              {stage !== "done" ? (
                <div className="handwriting-actions" style={{ justifyContent: "center" }}>
                  <button
                    className="primary-button compact-button"
                    type="button"
                    data-testid="english-trace-stroke-btn"
                    onClick={() => void advanceEnglishStroke()}
                  >
                    <Pencil aria-hidden="true" />
                    跟老师写第 {enStrokeProgress + 1} 笔（{enStrokeProgress + 1}/{enEntry.strokes.length}）
                  </button>
                </div>
              ) : null}

              {result ? (
                <div className="handwriting-feedback correct-feedback" role="status">
                  <strong>太棒啦！「{enEntry.display} · {enEntry.word}」在四线三格里写得真标准！</strong>
                  <p>已记录到写字档案（已完成 {enCompletedCount}/{ENGLISH_HANDWRITING_ITEMS.length} 个英文四线三格描红）。</p>
                </div>
              ) : null}

              {stage === "done" ? (
                <div className="handwriting-actions">
                  <button className="quiet-button" type="button" onClick={() => selectEnglishIndex(enIndex)}>
                    <RotateCcw aria-hidden="true" />再写一次
                  </button>
                  {enIndex < ENGLISH_HANDWRITING_ITEMS.length - 1 ? (
                    <button className="primary-button" type="button" onClick={() => selectEnglishIndex(enIndex + 1)}>
                      写下一个<ChevronRight aria-hidden="true" />
                    </button>
                  ) : (
                    <button className="primary-button" type="button" onClick={onBack}>
                      完成写字<ChevronRight aria-hidden="true" />
                    </button>
                  )}
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/**
 * Inline stroke-order trace modal interleaved inside Mandarin quiz sessions so children
 * can trace the character they just learned without leaving their quiz session.
 */
export function InlineHandwritingModal({
  entry,
  onClose,
  onRecord
}: {
  entry: HandwritingCharacter;
  onClose: () => void;
  onRecord?: (entry: HandwritingTraceTarget, mistakes: number) => Promise<boolean>;
}) {
  const [stage, setStage] = useState<Stage>("listening");
  const [mistakes, setMistakes] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    let cancelled = false;
    target.innerHTML = "";
    setMistakes(null);
    setStage("listening");

    const writer = HanziWriter.create(target, entry.character, {
      width: 240,
      height: 240,
      padding: 16,
      showCharacter: false,
      showOutline: true,
      strokeColor: "#17324d",
      radicalColor: "#1c8b89",
      highlightColor: "#f2a65a",
      outlineColor: "#c8d5d7",
      drawingColor: "#e85c47",
      drawingWidth: 12,
      strokeWidth: 3,
      outlineWidth: 2,
      charDataLoader
    });

    async function runFlow() {
      await wait(250);
      if (cancelled) return;
      playOrSpeak(entry.introAudioText, "zh-CN");
      setStage("demonstrating");
      await wait(350);
      if (cancelled) return;
      await writer.animateCharacter();
      if (cancelled) return;
      setStage("writing");
      playOrSpeak(VOICE_LINES.traceNow, "zh-CN");
      void writer.quiz({
        leniency: 1,
        showHintAfterMisses: 2,
        markStrokeCorrectAfterMisses: 5,
        highlightOnComplete: true,
        onComplete: async (summary) => {
          if (cancelled) return;
          setMistakes(summary.totalMistakes);
          setStage("done");
          if (onRecord) await onRecord(entry, summary.totalMistakes);
          playOrSpeak(summary.totalMistakes <= 1 ? VOICE_LINES.writeGreat : VOICE_LINES.writeRetry, "zh-CN");
        }
      });
    }

    void runFlow();
    return () => {
      cancelled = true;
      writer.cancelQuiz();
      target.innerHTML = "";
    };
  }, [entry, cycle]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`动手写一写 ${entry.character}`}>
      <div className="modal-card" style={{ maxWidth: "460px", textAlign: "center" }}>
        <p className="eyebrow">认字即写字 · {entry.structure}</p>
        <h2>动手写一写「{entry.character}」（{entry.pinyin} · {entry.word}）</h2>
        <p className="setup-copy">{entry.tip}</p>
        <div style={{ margin: "0.5rem auto" }}>
          <PinyinBlendBar char={entry.character} compact />
        </div>
        <div ref={targetRef} className="hanzi-target" style={{ margin: "0.75rem auto" }} aria-label={`${entry.character} 笔顺练习区`} />
        <p style={{ fontWeight: 700, margin: "0.5rem 0" }}>
          {stage === "listening"
            ? "先听老师读…"
            : stage === "demonstrating"
              ? "看小芽老师示范笔顺…"
              : stage === "writing"
                ? "轮到你啦，沿着虚线写一写！"
                : mistakes !== null && mistakes <= 1
                  ? `写得太棒啦！（提示 ${mistakes} 次）`
                  : `写完啦！不要气馁，多练几次会更顺手（提示 ${mistakes ?? 0} 次）`}
        </p>
        <div className="dialog-actions" style={{ justifyContent: "center" }}>
          <button className="quiet-button compact-button" type="button" onClick={() => setCycle((c) => c + 1)}>
            <RotateCcw aria-hidden="true" />再写一次
          </button>
          <button className="primary-button compact-button" type="button" onClick={onClose}>
            {stage === "done" ? <><Check aria-hidden="true" />写好啦，继续闯关</> : <><X aria-hidden="true" />先回题目</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function charDataLoader(character: string, onLoad: (data: CharacterJson) => void, onError: (error?: unknown) => void) {
  fetch(`./assets/hanzi/${encodeURIComponent(character)}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`Hanzi data ${response.status}`);
      return response.json();
    })
    .then(onLoad)
    .catch(onError);
}
