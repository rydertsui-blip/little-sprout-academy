import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Volume2 } from "lucide-react";
import { playOrSpeak, stopAudio } from "../lib/audio";
import { playSfx } from "../lib/sfx";
import {
  decomposeCharacterPinyin,
  PINYIN_FINALS,
  PINYIN_INITIALS,
  PINYIN_WHOLE_SYLLABLES,
  stripPinyinToneMarks,
  type PinyinDecomposition,
  type PinyinGroup,
  type PinyinUnit,
} from "../content/pinyinChart";
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

const COMPANION_CHARS = ["爸", "妈", "八", "跑", "开", "猫", "狗", "山", "花", "水"];

export const PINYIN_SKILLS = new Set([
  "mandarin-initials",
  "mandarin-finals",
  "mandarin-tones",
  "mandarin-syllables",
  "mandarin-characters",
]);

const CHART_GROUPS: ReadonlyArray<{ id: PinyinGroup; label: string; units: readonly PinyinUnit[] }> = [
  { id: "initials", label: "声母 (23)", units: PINYIN_INITIALS },
  { id: "finals", label: "韵母 (24)", units: PINYIN_FINALS },
  { id: "whole", label: "整体认读 (16)", units: PINYIN_WHOLE_SYLLABLES },
];

function usesMaCharacter(question: Question): boolean {
  const combined = `${question.displayCharacter ?? ""}${question.prompt}`;
  return combined.includes("妈") || combined.includes("马");
}

function extractQuestionTargetChars(question: Question): { primary: string; isTargetFromQuestion: boolean; list: string[] } {
  let primary = "";
  if (question.displayCharacter && /[\u4e00-\u9fff]/.test(question.displayCharacter)) {
    primary = Array.from(question.displayCharacter).find((c) => /[\u4e00-\u9fff]/.test(c)) ?? "";
  }
  if (!primary) {
    const quoted = question.prompt.match(/“([\u4e00-\u9fff])”/);
    if (quoted?.[1]) primary = quoted[1];
  }
  if (!primary && question.kind === "match") {
    const firstLeft = Array.from(question.pairs[0]?.left ?? "").find((c) => /[\u4e00-\u9fff]/.test(c));
    if (firstLeft) primary = firstLeft;
  }
  if (!primary && question.kind === "choice" && question.skillId === "mandarin-characters") {
    const optChars = question.options
      .map((o) => Array.from(o).find((c) => /[\u4e00-\u9fff]/.test(c)) ?? "")
      .filter(Boolean);
    if (optChars.length >= 2) {
      return { primary: optChars[0], isTargetFromQuestion: false, list: optChars.slice(0, 3) };
    }
  }

  const isTargetFromQuestion = Boolean(primary);
  const startChar = primary || "爸";
  const companions = COMPANION_CHARS.filter((c) => c !== startChar).slice(0, 2);
  return {
    primary: startChar,
    isTargetFromQuestion,
    list: [startChar, ...companions],
  };
}

function defaultChartGroup(skillId: string): PinyinGroup {
  if (skillId === "mandarin-finals") return "finals";
  if (skillId === "mandarin-syllables") return "whole";
  return "initials";
}

/**
 * Reusable interactive Pinyin Blend Bar ("波 + 啊 = 爸") that supports both:
 * 1. Separate taps on [声母] / [介母] / [韵母] / [拼一拼]
 * 2. One-click automatic 3-step combination reading ("老师带我拼：波 —— 啊 —— 爸！")
 */
export function PinyinBlendBar({
  char,
  maskInitial = false,
  maskFinal = false,
  maskSyllable = false,
  compact = false,
}: {
  char: string;
  maskInitial?: boolean;
  maskFinal?: boolean;
  maskSyllable?: boolean;
  compact?: boolean;
}) {
  const decomp: PinyinDecomposition = useMemo(() => decomposeCharacterPinyin(char), [char]);
  const [activePart, setActivePart] = useState<"initial" | "medial" | "final" | "blend" | null>(null);
  const [isAutoBlending, setIsAutoBlending] = useState(false);
  const timersRef = useRef<number[]>([]);
  const tokenRef = useRef(0);

  function clearTimers() {
    tokenRef.current += 1;
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
    setIsAutoBlending(false);
  }

  useEffect(() => {
    setActivePart(null);
    clearTimers();
    return () => clearTimers();
  }, [char]);

  function runAutoBlend() {
    clearTimers();
    stopAudio();
    const myToken = tokenRef.current;
    setIsAutoBlending(true);

    const steps: Array<{ part: "initial" | "medial" | "final" | "blend"; audioKey: string }> = [];
    if (decomp.initial) {
      steps.push({ part: "initial", audioKey: decomp.initialAudio });
    }
    if (decomp.medial && decomp.medialAudio) {
      steps.push({ part: "medial", audioKey: decomp.medialAudio });
    }
    steps.push({ part: "final", audioKey: decomp.finalAudio });
    steps.push({ part: "blend", audioKey: decomp.syllableAudio });

    const runStep = (idx: number) => {
      if (tokenRef.current !== myToken) return;
      const step = steps[idx];
      if (!step) {
        setIsAutoBlending(false);
        return;
      }
      setActivePart(step.part);
      playSfx("blend-step", idx);
      let advanced = false;
      const next = () => {
        if (advanced || tokenRef.current !== myToken) return;
        advanced = true;
        if (idx + 1 < steps.length) {
          const timer = window.setTimeout(() => runStep(idx + 1), 240);
          timersRef.current.push(timer);
        } else {
          setIsAutoBlending(false);
        }
      };

      // Safety fallback timer so tests or environments without audio events still advance smoothly
      const safetyTimer = window.setTimeout(next, 680);
      timersRef.current.push(safetyTimer);

      playOrSpeak(step.audioKey, "zh-CN", (status) => {
        if (status === "ended" || status === "error") {
          next();
        }
      });
    };

    runStep(0);
  }

  return (
    <div className={`pinyin-blend-widget ${compact ? "is-compact" : ""}`} data-testid="pinyin-blend-widget">
      <div className="pinyin-blend-row">
        {decomp.initial ? (
          <>
            <button
              type="button"
              className={`pinyin-block pinyin-block-initial ${activePart === "initial" ? "is-active" : ""}`}
              onClick={() => {
                clearTimers();
                setActivePart("initial");
                playSfx("blend-step", 0);
                playOrSpeak(decomp.initialAudio, "zh-CN");
              }}
            >
              <small>声母</small>
              <strong>{maskInitial ? "？" : decomp.initial}</strong>
              <Volume2 aria-hidden="true" />
            </button>
            <span className="pinyin-plus" aria-hidden="true">+</span>
          </>
        ) : null}

        {decomp.medial ? (
          <>
            <button
              type="button"
              className={`pinyin-block pinyin-block-medial ${activePart === "medial" ? "is-active" : ""}`}
              onClick={() => {
                clearTimers();
                setActivePart("medial");
                playSfx("blend-step", 1);
                playOrSpeak(decomp.medialAudio ?? "屋", "zh-CN");
              }}
            >
              <small>介母</small>
              <strong>{maskFinal ? "？" : decomp.medial}</strong>
              <Volume2 aria-hidden="true" />
            </button>
            <span className="pinyin-plus" aria-hidden="true">+</span>
          </>
        ) : null}

        <button
          type="button"
          className={`pinyin-block pinyin-block-final ${activePart === "final" ? "is-active" : ""}`}
          onClick={() => {
            clearTimers();
            setActivePart("final");
            playSfx("blend-step", 2);
            playOrSpeak(decomp.finalAudio, "zh-CN");
          }}
        >
          <small>韵母</small>
          <strong>{maskFinal ? "？" : decomp.final}</strong>
          <Volume2 aria-hidden="true" />
        </button>

        <span className="pinyin-plus" aria-hidden="true">=</span>

        <button
          type="button"
          className={`pinyin-block pinyin-block-result ${activePart === "blend" ? "is-active" : ""}`}
          onClick={() => {
            clearTimers();
            setActivePart("blend");
            playSfx("blend-step", 3);
            playOrSpeak(decomp.syllableAudio, "zh-CN");
          }}
        >
          <small>{decomp.isWholeSyllable ? "整体认读" : "拼一拼"}</small>
          <strong>{maskSyllable || maskInitial || maskFinal ? "？" : decomp.syllable}</strong>
          <em>{decomp.char}</em>
        </button>
      </div>

      <div className="pinyin-blend-actions" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          data-testid="pinyin-auto-blend"
          className={`speaking-deck ${isAutoBlending ? "is-active" : ""}`}
          onClick={runAutoBlend}
        >
          <Sparkles aria-hidden="true" />
          {isAutoBlending
            ? "小芽老师连拼中…"
            : `老师带我拼（${decomp.initial ? `${decomp.initialAudio}—` : ""}${decomp.medialAudio ? `${decomp.medialAudio}—` : ""}${decomp.finalAudio}→${decomp.char}）`}
        </button>
        {decomp.isWholeSyllable ? (
          <small className="eyebrow" style={{ margin: 0 }}>整体认读音节 · 可以直接读出整字</small>
        ) : null}
      </div>
    </div>
  );
}

export function PinyinTool({ question, hintActive = false }: { question: Question; defaultOpen?: boolean; hintActive?: boolean }) {
  const [activeTone, setActiveTone] = useState<number | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"blend" | "chart">("blend");
  const [chartGroup, setChartGroup] = useState<PinyinGroup>(() => defaultChartGroup(question.skillId));
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  useEffect(() => {
    setActiveTone(null);
    setDemoIndex(0);
    setViewMode("blend");
    setChartGroup(defaultChartGroup(question.skillId));
    setActiveSymbol(null);
  }, [question.id, question.skillId]);

  useEffect(() => {
    if (!hintActive) return;
    if (question.skillId === "mandarin-initials") {
      setViewMode("chart");
      setChartGroup("initials");
    } else if (question.skillId === "mandarin-finals") {
      setViewMode("chart");
      setChartGroup("finals");
    }
  }, [hintActive, question.skillId]);

  const isToneSkill = question.skillId === "mandarin-tones";
  const toneSet = useMemo(() => (usesMaCharacter(question) ? TONE_SET_BA : TONE_SET_MA), [question]);
  const targetChars = useMemo(() => extractQuestionTargetChars(question), [question]);
  const hiddenAnswer = useMemo(() => {
    if (question.kind !== "choice") return "";
    return stripPinyinToneMarks(question.correctAnswer);
  }, [question]);

  if (!PINYIN_SKILLS.has(question.skillId)) return null;

  const activeChar = targetChars.list[demoIndex] ?? targetChars.primary;
  const isCurrentQuestionChar = demoIndex === 0 && targetChars.isTargetFromQuestion;
  const maskInitial = isCurrentQuestionChar && question.skillId === "mandarin-initials";
  const maskFinal = isCurrentQuestionChar && question.skillId === "mandarin-finals";
  const maskSyllable = isCurrentQuestionChar && question.skillId === "mandarin-syllables";

  if (isToneSkill) {
    const selectedTone = toneSet.find((item) => item.tone === activeTone) ?? null;
    return (
      <div className={`math-tool pinyin-tool${hintActive ? " is-hint-focus" : ""}`} role="group" aria-label="拼音教具：声调过山车">
        <div className="math-tool-header">
          <span>拼音教具</span>
          <strong>声调过山车 · 本题「{targetChars.primary}」</strong>
          <small>{hintActive ? "点四声对比本题" : "点一下听四声"}</small>
        </div>
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
                    playSfx("blend-step", item.tone - 1);
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
              : `先点一点四个声调听声音，再对比本题「${targetChars.primary}」是第几声。`}
          </p>
        </div>
      </div>
    );
  }

  const currentGroup = CHART_GROUPS.find((item) => item.id === chartGroup) ?? CHART_GROUPS[0];

  return (
    <div className={`math-tool pinyin-tool${hintActive ? " is-hint-focus" : ""}`} role="group" aria-label="拼音教具：拼读积木台">
      <div className="math-tool-header">
        <span>拼音教具</span>
        <strong>拼读积木台 · 本题「{targetChars.primary}」</strong>
        <small>{hintActive ? "点拼音听标准音" : "分开点或让老师带拼"}</small>
      </div>
      <div className="math-tool-body pinyin-tool-body" data-testid="pinyin-blend-board">
        <div className="pinyin-mode-switch" role="tablist" aria-label="拼音教具模式">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "blend"}
            className={`pinyin-demo-tab ${viewMode === "blend" ? "is-active" : ""}`}
            onClick={() => setViewMode("blend")}
          >
            拼读积木
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "chart"}
            className={`pinyin-demo-tab ${viewMode === "chart" ? "is-active" : ""}`}
            onClick={() => setViewMode("chart")}
          >
            全部拼音表 (63)
          </button>
        </div>

        {viewMode === "blend" ? (
          <>
            <div className="pinyin-demo-tabs" role="group" aria-label="示范拼读例字">
              {targetChars.list.map((charItem, idx) => {
                const dec = decomposeCharacterPinyin(charItem);
                const isTargetTab = idx === 0 && targetChars.isTargetFromQuestion;
                const label = isTargetTab
                  ? `本题：${charItem}`
                  : `${charItem} ${dec.syllable}`;
                return (
                  <button
                    key={`${charItem}-${idx}`}
                    type="button"
                    className={`pinyin-demo-tab ${idx === demoIndex ? "is-active" : ""}`}
                    aria-pressed={idx === demoIndex}
                    onClick={() => setDemoIndex(idx)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <PinyinBlendBar
              char={activeChar}
              maskInitial={maskInitial}
              maskFinal={maskFinal}
              maskSyllable={maskSyllable}
            />

            <p className="pinyin-tool-caption">
              可以分开点声母、韵母、拼一拼，也可以点「老师带我拼」听连拼（当前题待考项已遮成“？”，不泄题）。
            </p>
          </>
        ) : (
          <div className="pinyin-chart-panel" data-testid="pinyin-full-chart">
            <div className="pinyin-demo-tabs" role="group" aria-label="拼音分类">
              {CHART_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`pinyin-demo-tab ${group.id === chartGroup ? "is-active" : ""}`}
                  aria-pressed={group.id === chartGroup}
                  onClick={() => {
                    setChartGroup(group.id);
                    setActiveSymbol(null);
                  }}
                >
                  {group.label}
                </button>
              ))}
            </div>

            <div className="pinyin-chart-grid">
              {currentGroup.units.map((unit) => {
                const isMasked = hiddenAnswer !== "" && stripPinyinToneMarks(unit.symbol) === hiddenAnswer;
                const isActive = activeSymbol === unit.symbol;
                return (
                  <button
                    key={`${unit.group}-${unit.symbol}`}
                    type="button"
                    className={`pinyin-chart-key ${isActive ? "is-active" : ""} ${isMasked ? "is-masked" : ""}`}
                    disabled={isMasked}
                    aria-label={isMasked ? "本题答案已隐藏" : `听拼音 ${unit.symbol}`}
                    aria-pressed={isActive}
                    onClick={() => {
                      setActiveSymbol(unit.symbol);
                      playSfx("pop");
                      playOrSpeak(unit.audioKey, "zh-CN");
                    }}
                  >
                    <strong>{isMasked ? "？" : unit.symbol}</strong>
                  </button>
                );
              })}
            </div>

            <p className="pinyin-tool-caption">
              点任意拼音听标准读音；当前题目的答案已自动隐藏，放心练习。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
