import HanziWriter, { type CharacterJson } from "hanzi-writer";
import { Check, ChevronLeft, ChevronRight, Lock, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VOICE_LINES } from "../content/audioAssets";
import { HANDWRITING_CHARACTERS, type HandwritingCharacter } from "../content/handwriting";
import { playOrSpeak } from "../lib/audio";
import type { ChildProfile } from "../lib/types";

interface HandwritingScreenProps {
  child: ChildProfile;
  onBack: () => void;
  onLock: () => void | Promise<void>;
  onRecord: (entry: HandwritingCharacter, mistakes: number) => Promise<boolean>;
}

type Stage = "listening" | "demonstrating" | "writing" | "done";
type TraceResult = { mistakes: number; saved: boolean };

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function HandwritingScreen({ child, onBack, onLock, onRecord }: HandwritingScreenProps) {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [stage, setStage] = useState<Stage>("listening");
  const [result, setResult] = useState<TraceResult | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const recordRef = useRef(false);
  const entry = HANDWRITING_CHARACTERS[index];

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    let cancelled = false;
    let followUpTimer = 0;
    target.innerHTML = "";
    setResult(null);
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
    if (nextIndex === index) setCycle((value) => value + 1);
    else setIndex(nextIndex);
  }

  const completedCount = HANDWRITING_CHARACTERS.filter((item) => child.handwriting[item.character]).length;
  const teacherText = stage === "listening"
    ? `先听：${entry.character}，${entry.pinyin}`
    : stage === "demonstrating"
      ? "看老师写，注意每一笔从哪里开始。"
      : stage === "writing"
        ? "轮到你了，跟着虚线慢慢写。"
        : result && result.mistakes <= 1
          ? `写得很准。再听一次：${entry.character}，${entry.pinyin}`
          : "没关系，再看一次笔顺，慢慢写。";

  return (
    <div className={`app-shell ${child.settings.highContrast ? "child-high-contrast" : ""} ${child.settings.largeText ? "child-large-text" : ""}`.trim()}>
      <header className="session-header handwriting-header">
        <button className="quiet-button compact-button" type="button" onClick={onBack}><ChevronLeft aria-hidden="true" />返回</button>
        <div><p className="eyebrow">{child.name} · 小芽写字</p><h1>看笔顺，亲手写</h1></div>
        <button className="quiet-button compact-button" type="button" onClick={() => void onLock()}><Lock aria-hidden="true" />退出并锁定</button>
      </header>

      <main className="handwriting-screen teacher-handwriting">
        <section className={`teacher-command handwriting-teacher ${stage}`}>
          <div className="teacher-mascot" aria-hidden="true"><img src="./assets/images/seedling.png" alt="" /><i /><i /><i /></div>
          <div className="teacher-bubble">
            <small>小芽老师</small>
            <strong>{teacherText}</strong>
            <button className="audio-button" type="button" onClick={() => playOrSpeak(stage === "done" ? entry.audioText : entry.introAudioText, "zh-CN")} aria-label={`朗读 ${entry.character}`}><Volume2 aria-hidden="true" /></button>
          </div>
        </section>

        <section className="handwriting-chart">
          <div className="handwriting-chart-heading"><p className="eyebrow">选一个字</p><strong>{completedCount} / {HANDWRITING_CHARACTERS.length}</strong></div>
          <div className="handwriting-rail" aria-label="选择汉字">
            {HANDWRITING_CHARACTERS.map((item, itemIndex) => (
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
            <div><h2>{entry.word}</h2><p>{entry.english} · {entry.tip}</p></div>
          </div>
          <div ref={targetRef} className="hanzi-target" aria-label={`${entry.character} 笔顺练习区`} />
          <div className="teacher-stage-label" aria-live="polite">
            {stage === "listening" ? "听字" : stage === "demonstrating" ? "看老师示范" : stage === "writing" ? "轮到你写" : "写完了"}
          </div>
          {result ? (
            <div className={`handwriting-feedback ${result.saved ? (result.mistakes <= 1 ? "correct-feedback" : "wrong-feedback") : "wrong-feedback"}`} role="status">
              <strong>{result.saved ? result.mistakes === 0 ? "写得很准" : result.mistakes <= 1 ? "完成了" : "再看一次笔顺" : "这次没有保存成功"}</strong>
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

function charDataLoader(character: string, onLoad: (data: CharacterJson) => void, onError: (error?: unknown) => void) {
  fetch(`./assets/hanzi/${encodeURIComponent(character)}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`Hanzi data ${response.status}`);
      return response.json();
    })
    .then(onLoad)
    .catch(onError);
}
