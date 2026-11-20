import HanziWriter, { type CharacterJson } from "hanzi-writer";
import { Check, ChevronLeft, ChevronRight, Lock, Pencil, Play, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HANDWRITING_CHARACTERS, type HandwritingCharacter } from "../content/handwriting";
import { playOrSpeak } from "../lib/audio";
import type { ChildProfile } from "../lib/types";

interface HandwritingScreenProps {
  child: ChildProfile;
  onBack: () => void;
  onLock: () => void | Promise<void>;
  onRecord: (entry: HandwritingCharacter, mistakes: number) => Promise<boolean>;
}

type TraceResult = { mistakes: number; saved: boolean };

export default function HandwritingScreen({ child, onBack, onLock, onRecord }: HandwritingScreenProps) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"idle" | "animating" | "quiz">("idle");
  const [result, setResult] = useState<TraceResult | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const recordRef = useRef(false);
  const entry = HANDWRITING_CHARACTERS[index];

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    target.innerHTML = "";
    setMode("idle");
    setResult(null);
    const writer = HanziWriter.create(target, entry.character, {
      width: 310,
      height: 310,
      padding: 18,
      showCharacter: true,
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
    return () => {
      writer.cancelQuiz();
      target.innerHTML = "";
      writerRef.current = null;
    };
  }, [entry.character]);

  function selectIndex(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= HANDWRITING_CHARACTERS.length) return;
    writerRef.current?.cancelQuiz();
    setIndex(nextIndex);
  }

  async function showStrokeOrder() {
    const writer = writerRef.current;
    if (!writer || mode === "quiz") return;
    setResult(null);
    setMode("animating");
    writer.showCharacter({ duration: 0 });
    await writer.animateCharacter();
    setMode("idle");
  }

  async function startQuiz() {
    const writer = writerRef.current;
    if (!writer || mode !== "idle" || recordRef.current) return;
    setResult(null);
    setMode("quiz");
    writer.cancelQuiz();
    writer.hideCharacter({ duration: 0 });
    writer.showOutline({ duration: 0 });
    writer.quiz({
      leniency: 1,
      showHintAfterMisses: 2,
      markStrokeCorrectAfterMisses: 5,
      highlightOnComplete: true,
      onComplete: async (summary) => {
        if (recordRef.current) return;
        recordRef.current = true;
        const saved = await onRecord(entry, summary.totalMistakes);
        setResult({ mistakes: summary.totalMistakes, saved });
        setMode("idle");
        recordRef.current = false;
      }
    });
  }

  const completedCount = HANDWRITING_CHARACTERS.filter((item) => child.handwriting[item.character]).length;

  return (
    <div className="app-shell">
      <header className="session-header handwriting-header">
        <button className="quiet-button compact-button" type="button" onClick={onBack}><ChevronLeft aria-hidden="true" />返回</button>
        <div><p className="eyebrow">{child.name} · 小芽写字</p><h1>看笔顺，亲手写</h1></div>
        <button className="quiet-button compact-button" type="button" onClick={() => void onLock()}><Lock aria-hidden="true" />退出并锁定</button>
      </header>

      <main className="handwriting-screen">
        <section className="handwriting-chart">
          <div className="handwriting-chart-heading"><p className="eyebrow">写字练习</p><strong>{completedCount} / {HANDWRITING_CHARACTERS.length}</strong></div>
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
            <button className="audio-button" type="button" onClick={() => playOrSpeak(entry.audioText, "zh-CN")} aria-label={`朗读 ${entry.character}`}><Volume2 aria-hidden="true" /></button>
          </div>
          <div ref={targetRef} className="hanzi-target" aria-label={`${entry.character} 笔顺练习区`} />
          <div className="handwriting-actions">
            <button className="quiet-button" type="button" onClick={() => void showStrokeOrder()} disabled={mode === "quiz"}><Play aria-hidden="true" />看笔顺</button>
            <button className="primary-button" type="button" onClick={() => void startQuiz()} disabled={mode !== "idle"}><Pencil aria-hidden="true" />{mode === "quiz" ? "正在写…" : "写一写"}</button>
            {result ? <button className="quiet-button" type="button" onClick={() => void startQuiz()}><RotateCcw aria-hidden="true" />再写一次</button> : null}
          </div>
          {result ? (
            <div className={`handwriting-feedback ${result.saved ? (result.mistakes <= 1 ? "correct-feedback" : "wrong-feedback") : "wrong-feedback"}`} role="status">
              <strong>{result.saved ? result.mistakes === 0 ? "写得很准" : result.mistakes <= 1 ? "完成了" : "再看一次笔顺" : "这次没有保存成功"}</strong>
              <p>{result.saved ? `笔顺提示 ${result.mistakes} 次。` : "请再写一次，让家长看板可以保存进度。"}</p>
            </div>
          ) : null}
        </section>

        <div className="handwriting-navigation">
          <button className="quiet-button compact-button" type="button" onClick={() => selectIndex(index - 1)} disabled={index === 0}><ChevronLeft aria-hidden="true" />上一个</button>
          <span>{index + 1} / {HANDWRITING_CHARACTERS.length}</span>
          <button className="quiet-button compact-button" type="button" onClick={() => selectIndex(index + 1)} disabled={index === HANDWRITING_CHARACTERS.length - 1}>下一个<ChevronRight aria-hidden="true" /></button>
        </div>
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

