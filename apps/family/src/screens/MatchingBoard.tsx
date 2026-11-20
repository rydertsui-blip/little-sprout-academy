import { useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import type { MatchQuestion } from "../lib/types";
import { playOrSpeak } from "../lib/audio";

interface Props {
  question: MatchQuestion;
  disabled: boolean;
  onComplete: (correct: boolean, mismatchCount: number) => Promise<boolean>;
}

function orderRightPairs(question: MatchQuestion) {
  const score = (value: string) => Array.from(question.id + value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);
  return [...question.pairs].sort((a, b) => score(a.right) - score(b.right));
}

export default function MatchingBoard({ question, disabled, onComplete }: Props) {
  const rightPairs = useMemo(() => orderRightPairs(question), [question]);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [completedPairIds, setCompletedPairIds] = useState<string[]>([]);
  const [mismatchCount, setMismatchCount] = useState(0);
  const [wrongPairId, setWrongPairId] = useState<string | null>(null);
  const [status, setStatus] = useState("先点左边的一张，再点右边配对的卡片。");
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const savingRef = useRef(false);
  const selectedPair = question.pairs.find((pair) => pair.id === selectedLeftId) ?? null;

  async function submitCompletion(wasFirstTry: boolean) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    setStatus("正在保存这一次配对…");
    let saved = false;
    try {
      saved = await onComplete(wasFirstTry, mismatchCount);
    } catch {
      saved = false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
    if (saved) {
      setStatus(wasFirstTry ? "三对都配好了。" : `三对都配好了，中间配错 ${mismatchCount} 次。`);
    } else {
      setSaveFailed(true);
      setStatus("这一次没有保存成功，请再试一次。");
    }
  }

  function selectLeft(pairId: string) {
    if (disabled || completedPairIds.includes(pairId)) return;
    const pair = question.pairs.find((item) => item.id === pairId);
    if (!pair) return;
    setSelectedLeftId(pairId);
    setWrongPairId(null);
    setStatus(`已选 ${pair.left}，现在点右边配对的卡片。`);
  }

  function selectRight(pairId: string) {
    if (disabled || !selectedPair || completedPairIds.includes(pairId)) return;
    if (pairId === selectedPair.id) {
      const nextCompleted = [...completedPairIds, pairId];
      setCompletedPairIds(nextCompleted);
      setSelectedLeftId(null);
      setWrongPairId(null);
      const language = selectedPair.audioLanguage ?? question.audioLanguage ?? (question.subject === "mandarin" ? "zh-CN" : "en-US");
      if (selectedPair.audioText) playOrSpeak(selectedPair.audioText, language);
      if (nextCompleted.length === question.pairs.length) {
        const wasFirstTry = mismatchCount === 0;
        void submitCompletion(wasFirstTry);
      } else {
        setStatus(`配对成功。还剩 ${question.pairs.length - nextCompleted.length} 对。`);
      }
      return;
    }
    setMismatchCount((count) => count + 1);
    setWrongPairId(pairId);
    setStatus("这两张不相配，再试一次。");
  }

  return (
    <div className="match-board" data-testid="match-board">
      <div className="match-columns">
        <section className="match-column" aria-labelledby="match-left-heading">
          <h3 id="match-left-heading">{question.leftLabel}</h3>
          <div className="match-card-stack">
            {question.pairs.map((pair) => {
              const complete = completedPairIds.includes(pair.id);
              const selected = selectedLeftId === pair.id;
              return (
                <button
                  key={pair.id}
                  className={`match-card ${selected ? "is-selected" : ""} ${complete ? "is-complete" : ""}`}
                  type="button"
                  data-match-side="left"
                  data-pair-id={pair.id}
                  aria-pressed={selected}
                  aria-label={`${complete ? "已完成，" : ""}选择 ${pair.left}`}
                  onClick={() => selectLeft(pair.id)}
                  disabled={disabled || complete}
                >
                  <span>{pair.left}</span>
                  {complete ? <Check aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </section>
        <section className="match-column" aria-labelledby="match-right-heading">
          <h3 id="match-right-heading">{question.rightLabel}</h3>
          <div className="match-card-stack">
            {rightPairs.map((pair) => {
              const complete = completedPairIds.includes(pair.id);
              const wrong = wrongPairId === pair.id;
              return (
                <button
                  key={pair.id}
                  className={`match-card match-card-right ${complete ? "is-complete" : ""} ${wrong ? "is-wrong" : ""}`}
                  type="button"
                  data-match-side="right"
                  data-pair-id={pair.id}
                  aria-label={`${complete ? "已完成，" : wrong ? "刚才配错了，" : ""}选择 ${pair.right}`}
                  onClick={() => selectRight(pair.id)}
                  disabled={disabled || !selectedPair || complete}
                >
                  <span>{pair.right}</span>
                  {complete ? <Check aria-hidden="true" /> : wrong ? <X aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <div className={`match-status ${wrongPairId ? "is-wrong" : ""}`} id="match-status" role="status" aria-live="polite">
        <strong>{completedPairIds.length} / {question.pairs.length} 对完成</strong>
        <span>{status}</span>
        {mismatchCount > 0 && completedPairIds.length < question.pairs.length ? <small>配错 {mismatchCount} 次，可以继续试。</small> : null}
        {saveFailed ? <button className="quiet-button match-retry-button" type="button" onClick={() => void submitCompletion(mismatchCount === 0)} disabled={saving}>重新保存</button> : null}
      </div>
    </div>
  );
}

