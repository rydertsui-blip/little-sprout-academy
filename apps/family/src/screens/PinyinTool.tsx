import { useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { playOrSpeak } from "../lib/audio";
import type { Question } from "../lib/types";

interface ToneDemo {
  tone: 1 | 2 | 3 | 4;
  name: string;
  cue: string;
  pinyin: string;
  char: string;
  audioKey: string;
  path: string;
}

interface BlendDemo {
  id: string;
  initial: string;
  initialAudio: string;
  final: string;
  finalAudio: string;
  syllable: string;
  char: string;
  syllableAudio: string;
}

const TONE_SET_MA: ToneDemo[] = [
  { tone: 1, name: "第一声", cue: "平平走", pinyin: "mā", char: "妈", audioKey: "妈", path: "M 12 20 L 68 20" },
  { tone: 2, name: "第二声", cue: "往上爬", pinyin: "má", char: "麻", audioKey: "麻", path: "M 12 44 L 68 18" },
  { tone: 3, name: "第三声", cue: "先下再上", pinyin: "mǎ", char: "马", audioKey: "马", path: "M 12 34 L 38 52 L 68 26" },
  { tone: 4, name: "第四声", cue: "往下滑", pinyin: "mà", char: "骂", audioKey: "骂", path: "M 12 16 L 68 50" },
];

const TONE_SET_BA: ToneDemo[] = [
  { tone: 1, name: "第一声", cue: "平平走", pinyin: "bā", char: "八", audioKey: "八", path: "M 12 20 L 68 20" },
  { tone: 2, name: "第二声", cue: "往上爬", pinyin: "bá", char: "拔", audioKey: "拔", path: "M 12 44 L 68 18" },
  { tone: 3, name: "第三声", cue: "先下再上", pinyin: "bǎ", char: "把", audioKey: "把", path: "M 12 34 L 38 52 L 68 26" },
  { tone: 4, name: "第四声", cue: "往下滑", pinyin: "bà", char: "爸", audioKey: "爸", path: "M 12 16 L 68 50" },
];

const BLEND_DEMOS: BlendDemo[] = [
  { id: "ba", initial: "b", initialAudio: "波", final: "ā", finalAudio: "阿", syllable: "bā", char: "八", syllableAudio: "八" },
  { id: "pao", initial: "p", initialAudio: "坡", final: "ǎo", finalAudio: "袄", syllable: "pǎo", char: "跑", syllableAudio: "跑" },
  { id: "kai", initial: "k", initialAudio: "科", final: "āi", finalAudio: "哀", syllable: "kāi", char: "开", syllableAudio: "开" },
  { id: "mao", initial: "m", initialAudio: "摸", final: "āo", finalAudio: "凹", syllable: "māo", char: "猫", syllableAudio: "猫" },
  { id: "gou", initial: "g", initialAudio: "哥", final: "ǒu", finalAudio: "偶", syllable: "gǒu", char: "狗", syllableAudio: "狗" },
  { id: "shan", initial: "sh", initialAudio: "诗", final: "ān", finalAudio: "安", syllable: "shān", char: "山", syllableAudio: "山" },
];

const PINYIN_SKILLS = new Set([
  "mandarin-initials",
  "mandarin-finals",
  "mandarin-tones",
  "mandarin-syllables",
]);

function usesMaCharacter(question: Question): boolean {
  const combined = `${question.displayCharacter ?? ""}${question.prompt}`;
  return combined.includes("妈") || combined.includes("马");
}

function safeBlendDemos(question: Question): BlendDemo[] {
  const combined = `${question.displayCharacter ?? ""}${question.prompt}`;
  const answer = question.kind === "choice" ? question.correctAnswer : "";
  const filtered = BLEND_DEMOS.filter((demo) => (
    !combined.includes(demo.char)
    && demo.initial !== answer
    && demo.syllable !== answer
  ));
  return (filtered.length >= 3 ? filtered : BLEND_DEMOS).slice(0, 3);
}

export function PinyinTool({ question, defaultOpen = true }: { question: Question; defaultOpen?: boolean }) {
  const [activeTone, setActiveTone] = useState<number | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const [activePart, setActivePart] = useState<"initial" | "final" | "blend" | null>(null);

  useEffect(() => {
    setActiveTone(null);
    setDemoIndex(0);
    setActivePart(null);
  }, [question.id]);

  const isToneSkill = question.skillId === "mandarin-tones";
  const toneSet = useMemo(() => (usesMaCharacter(question) ? TONE_SET_BA : TONE_SET_MA), [question]);
  const blendDemos = useMemo(() => safeBlendDemos(question), [question]);

  if (!PINYIN_SKILLS.has(question.skillId)) return null;

  if (isToneSkill) {
    const selectedTone = toneSet.find((item) => item.tone === activeTone) ?? null;
    return (
      <details className="math-tool pinyin-tool" aria-label="拼音教具：声调过山车" open={defaultOpen}>
        <summary>
          <span>拼音教具</span>
          <strong>声调过山车</strong>
          <small>点一下听四声</small>
        </summary>
        <div className="math-tool-body pinyin-tool-body" data-testid="pinyin-tone-coaster">
          <div className="tone-coaster-grid">
            {toneSet.map((item) => {
              const active = activeTone === item.tone;
              return (
                <button
                  key={item.tone}
                  type="button"
                  className={`tone-coaster-card ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => {
                    setActiveTone(item.tone);
                    playOrSpeak(item.audioKey, "zh-CN");
                  }}
                >
                  <svg className="tone-curve-svg" viewBox="0 0 80 60" aria-hidden="true">
                    <line x1="8" y1="20" x2="72" y2="20" stroke="rgba(23,50,77,0.14)" strokeDasharray="3 3" />
                    <line x1="8" y1="50" x2="72" y2="50" stroke="rgba(23,50,77,0.14)" strokeDasharray="3 3" />
                    <path d={item.path} fill="none" stroke={active ? "#f1775e" : "#17324d"} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <strong>{item.pinyin}</strong>
                  <span>{item.name} · {item.cue}</span>
                  <small>{item.char}</small>
                </button>
              );
            })}
          </div>
          <p className="pinyin-tool-caption">
            {selectedTone
              ? `${selectedTone.name}（${selectedTone.cue}）：${selectedTone.pinyin}（${selectedTone.char}）`
              : "先点一点四个声调听声音，再选这道题的声调。"}
          </p>
        </div>
      </details>
    );
  }

  const currentDemo = blendDemos[demoIndex] ?? blendDemos[0];
  return (
    <details className="math-tool pinyin-tool" aria-label="拼音教具：拼读积木台" open={defaultOpen}>
      <summary>
        <span>拼音教具</span>
        <strong>拼读积木台</strong>
        <small>点一点学拼读</small>
      </summary>
      <div className="math-tool-body pinyin-tool-body" data-testid="pinyin-blend-board">
        <div className="pinyin-demo-tabs" role="group" aria-label="示范拼读例字">
          {blendDemos.map((demo, idx) => (
            <button
              key={demo.id}
              type="button"
              className={`pinyin-demo-tab ${idx === demoIndex ? "is-active" : ""}`}
              aria-pressed={idx === demoIndex}
              onClick={() => {
                setDemoIndex(idx);
                setActivePart(null);
              }}
            >
              {demo.char} {demo.syllable}
            </button>
          ))}
        </div>

        <div className="pinyin-blend-row">
          <button
            type="button"
            className={`pinyin-block pinyin-block-initial ${activePart === "initial" ? "is-active" : ""}`}
            onClick={() => {
              setActivePart("initial");
              playOrSpeak(currentDemo.initialAudio, "zh-CN");
            }}
          >
            <small>声母</small>
            <strong>{currentDemo.initial}</strong>
            <Volume2 aria-hidden="true" />
          </button>

          <span className="pinyin-plus" aria-hidden="true">+</span>

          <button
            type="button"
            className={`pinyin-block pinyin-block-final ${activePart === "final" ? "is-active" : ""}`}
            onClick={() => {
              setActivePart("final");
              playOrSpeak(currentDemo.finalAudio, "zh-CN");
            }}
          >
            <small>韵母</small>
            <strong>{currentDemo.final}</strong>
            <Volume2 aria-hidden="true" />
          </button>

          <span className="pinyin-plus" aria-hidden="true">=</span>

          <button
            type="button"
            className={`pinyin-block pinyin-block-result ${activePart === "blend" ? "is-active" : ""}`}
            onClick={() => {
              setActivePart("blend");
              playOrSpeak(currentDemo.syllableAudio, "zh-CN");
            }}
          >
            <small>拼一拼</small>
            <strong>{currentDemo.syllable}</strong>
            <em>{currentDemo.char}</em>
          </button>
        </div>

        <p className="pinyin-tool-caption">
          先点声母、再点韵母，最后点“拼一拼”听它们合在一起的声音。
        </p>
      </div>
    </details>
  );
}
