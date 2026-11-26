import HanziWriter, { type CharacterJson } from "hanzi-writer";
import { Check, ChevronLeft, ChevronRight, Lock, RotateCcw, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VOICE_LINES } from "../content/audioAssets";
import { HANDWRITING_CHARACTERS, type HandwritingCharacter } from "../content/handwriting";
import { playOrSpeak } from "../lib/audio";
import type { ChildProfile, LearningLevel } from "../lib/types";
import { PinyinBlendBar } from "./PinyinTool";

interface HandwritingScreenProps {
  child: ChildProfile;
  initialCharacter?: string;
  onBack: () => void;
  onLock: () => void | Promise<void>;
  onRecord: (entry: HandwritingCharacter, mistakes: number) => Promise<boolean>;
}

type Stage = "listening" | "demonstrating" | "writing" | "done";
type TraceResult = { mistakes: number; saved: boolean };
type LevelFilter = "ALL" | LearningLevel;

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function HandwritingScreen({ child, initialCharacter, onBack, onLock, onRecord }: HandwritingScreenProps) {
  const initialIdx = initialCharacter
    ? Math.max(0, HANDWRITING_CHARACTERS.findIndex((item) => item.character === initialCharacter))
    : 0;
  const [index, setIndex] = useState(initialIdx);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("ALL");
  const [cycle, setCycle] = useState(0);
  const [stage, setStage] = useState<Stage>("listening");
  const [result, setResult] = useState<TraceResult | null>(null);
  const [readingState, setReadingState] = useState<"playing" | "error" | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const recordRef = useRef(false);
  const entry = HANDWRITING_CHARACTERS[index] ?? HANDWRITING_CHARACTERS[0];

  useEffect(() => {
    if (!initialCharacter) return;
    const found = HANDWRITING_CHARACTERS.findIndex((item) => item.character === initialCharacter);
    if (found >= 0) setIndex(found);
  }, [initialCharacter]);

  useEffect(() => {
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
  }, [cycle, entry]);

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

  function readCurrentEntry() {
    setReadingState("playing");
    playOrSpeak(stage === "done" ? entry.audioText : entry.introAudioText, "zh-CN", (status) => {
      if (status === "ended") setReadingState(null);
      else if (status === "error") setReadingState("error");
    });
  }

  const completedCount = HANDWRITING_CHARACTERS.filter((item) => child.handwriting[item.character]).length;
  const visibleCharacters = HANDWRITING_CHARACTERS.map((item, itemIndex) => ({ item, itemIndex })).filter(
    ({ item }) => levelFilter === "ALL" || item.level === levelFilter
  );

  const teacherText =
    stage === "listening"
      ? `先听小芽老师读：${entry.character}（${entry.pinyin}），${entry.word}。${entry.tip}`
      : stage === "demonstrating"
        ? `看老师写「${entry.character}」（${entry.structure}），注意每一笔从哪里起笔。`
        : stage === "writing"
          ? `轮到你啦！沿着虚线，一笔一划把「${entry.character}」写出来吧。`
          : result && result.mistakes <= 1
            ? `太棒啦！「${entry.character}」写得又工整又准！再听一次：${entry.character}，${entry.word}。`
            : `不要气馁，你已经写完啦！我们再看一次「${entry.character}」的笔顺，慢慢写会更漂亮。`;

  return (
    <div className={`app-shell ${child.settings.highContrast ? "child-high-contrast" : ""} ${child.settings.largeText ? "child-large-text" : ""}`.trim()}>
      <header className="session-header handwriting-header">
        <button className="quiet-button compact-button" type="button" onClick={onBack}><ChevronLeft aria-hidden="true" />返回</button>
        <div><p className="eyebrow">{child.name} · 小芽写字（{HANDWRITING_CHARACTERS.length} 字分级字库）</p><h1>看笔顺，亲手写</h1></div>
        <button className="quiet-button compact-button" type="button" onClick={() => void onLock()}><Lock aria-hidden="true" />退出并锁定</button>
      </header>

      <main className="handwriting-screen teacher-handwriting">
        <section className={`teacher-command handwriting-teacher ${stage}`}>
          <div className="teacher-mascot" aria-hidden="true"><img src="./assets/images/sprout-teacher.png" alt="" /><i /><i /><i /></div>
          <div className="teacher-bubble">
            <small>小芽老师 · {entry.level} · {entry.structure}</small>
            <strong>{teacherText}</strong>
            <button className={`audio-button ${readingState ? `is-${readingState}` : ""}`} type="button" onClick={readCurrentEntry} aria-label={readingState === "playing" ? "播放中" : readingState === "error" ? "再点一次" : `朗读 ${entry.character}`}><Volume2 aria-hidden="true" /></button>
          </div>
        </section>

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
  onRecord?: (entry: HandwritingCharacter, mistakes: number) => Promise<boolean>;
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
