import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Volume2, X } from "lucide-react";
import type { MatchQuestion } from "../lib/types";
import { playOrSpeak } from "../lib/audio";

interface Props {
  question: MatchQuestion;
  disabled: boolean;
  onComplete: (correct: boolean, mismatchCount: number) => Promise<boolean>;
}

interface MatchConnection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const MATCH_LINE_COLORS = ["#2d7147", "#a65432", "#415f93", "#6d4a8a", "#3f6f6f"];

function orderRightPairs(question: MatchQuestion) {
  const score = (value: string) => Array.from(question.id + value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);
  return [...question.pairs].sort((a, b) => score(a.right) - score(b.right));
}

export default function MatchingBoard({ question, disabled, onComplete }: Props) {
  const rightPairs = useMemo(() => orderRightPairs(question), [question]);
  const isEnglishBoard = question.subject !== "mandarin";
  const isListeningMatch = question.template === "match-listen-word" || question.template === "match-listen-wh";
  const isPictureListeningMatch = question.template === "match-listen-word";
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [completedPairIds, setCompletedPairIds] = useState<string[]>([]);
  const [mismatchCount, setMismatchCount] = useState(0);
  const [wrongPairId, setWrongPairId] = useState<string | null>(null);
  const [playingPairId, setPlayingPairId] = useState<string | null>(null);
  const [audioErrorPairId, setAudioErrorPairId] = useState<string | null>(null);
  const [status, setStatus] = useState(isListeningMatch
    ? isEnglishBoard
      ? isPictureListeningMatch ? "Tap a listening card on the left, then its picture word." : "Tap a listening card on the left, then its question."
      : isPictureListeningMatch ? "先点左边的听音卡，再点右边对应的图片词语。" : "先点左边的听音卡，再点右边对应的问题。"
    : isEnglishBoard ? "Tap a card on the left, then its match on the right." : "先点左边的一张，再点右边配对的卡片。");
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const savingRef = useRef(false);
  const selectedPair = question.pairs.find((pair) => pair.id === selectedLeftId) ?? null;

  useEffect(() => {
    if (disabled) {
      setPlayingPairId(null);
      setAudioErrorPairId(null);
    }
  }, [disabled]);
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [connections, setConnections] = useState<MatchConnection[]>([]);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const update = () => {
      const boardRect = board.getBoundingClientRect();
      if (boardRect.width <= 0 || boardRect.height <= 0) return;
      const next = completedPairIds.flatMap((pairId) => {
        const left = cardRefs.current[`left:${pairId}`];
        const right = cardRefs.current[`right:${pairId}`];
        if (!left || !right) return [];
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        if (leftRect.width <= 0 || rightRect.width <= 0) return [];
        return [{
          id: pairId,
          x1: leftRect.right - boardRect.left,
          y1: leftRect.top + leftRect.height / 2 - boardRect.top,
          x2: rightRect.left - boardRect.left,
          y2: rightRect.top + rightRect.height / 2 - boardRect.top,
        }];
      });
      setConnections((previous) => previous.length === 0 && next.length === 0 ? previous : next);
      setBoardSize((previous) => (
        previous.width === boardRect.width && previous.height === boardRect.height
          ? previous
          : { width: boardRect.width, height: boardRect.height }
      ));
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(board);
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("load", update);
    };
  }, [completedPairIds]);

  function setCardRef(side: "left" | "right", pairId: string, node: HTMLButtonElement | null) {
    cardRefs.current[`${side}:${pairId}`] = node;
  }

  async function submitCompletion(wasFirstTry: boolean) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    setStatus(isEnglishBoard ? "Saving this match…" : "正在保存这一次配对…");
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
      setStatus(isEnglishBoard
        ? wasFirstTry
          ? `All ${question.pairs.length} pairs matched.`
          : `All ${question.pairs.length} pairs matched with ${mismatchCount} mistake${mismatchCount === 1 ? "" : "s"}.`
        : wasFirstTry ? "三对都配好了。" : `三对都配好了，中间配错 ${mismatchCount} 次。`);
    } else {
      setSaveFailed(true);
      setStatus(isEnglishBoard ? "This match was not saved. Please try again." : "这一次没有保存成功，请再试一次。");
    }
  }

  function playPairAudio(pair: { id: string; audioText?: string; audioLanguage?: string }, languageCode: string) {
    if (!pair.audioText) return;
    setPlayingPairId(pair.id);
    setAudioErrorPairId(null);
    playOrSpeak(pair.audioText, languageCode, (audioState) => {
      if (audioState === "ended") {
        setPlayingPairId((current) => current === pair.id ? null : current);
      } else if (audioState === "error") {
        setPlayingPairId((current) => current === pair.id ? null : current);
        setAudioErrorPairId((current) => current === pair.id ? current : pair.id);
      }
    });
  }

  function selectLeft(pairId: string) {
    if (disabled || completedPairIds.includes(pairId)) return;
    const pair = question.pairs.find((item) => item.id === pairId);
    if (!pair) return;
    setSelectedLeftId(pairId);
    setWrongPairId(null);
    if (isListeningMatch) {
      const pairIndex = question.pairs.findIndex((item) => item.id === pairId);
      const language = pair.audioLanguage ?? question.audioLanguage ?? (question.subject === "mandarin" ? "zh-CN" : "en-US");
      playPairAudio(pair, language);
      setStatus(isEnglishBoard
        ? isPictureListeningMatch ? `Word ${pairIndex + 1} selected. Now tap its picture word.` : `Answer ${pairIndex + 1} selected. Now tap its question.`
        : isPictureListeningMatch ? `第 ${pairIndex + 1} 个词已选择。现在点右边的图片词语。` : `第 ${pairIndex + 1} 个答案已选择。现在点右边的问题。`);
      return;
    }
    setStatus(isEnglishBoard ? `Selected ${pair.left}. Now tap its match on the right.` : `已选 ${pair.left}，现在点右边配对的卡片。`);
  }

  function selectRight(pairId: string) {
    if (disabled || !selectedPair || completedPairIds.includes(pairId)) return;
    if (pairId === selectedPair.id) {
      const nextCompleted = [...completedPairIds, pairId];
      setCompletedPairIds(nextCompleted);
      setSelectedLeftId(null);
      setWrongPairId(null);
      const language = selectedPair.audioLanguage ?? question.audioLanguage ?? (question.subject === "mandarin" ? "zh-CN" : "en-US");
      playPairAudio(selectedPair, language);
      if (nextCompleted.length === question.pairs.length) {
        const wasFirstTry = mismatchCount === 0;
        void submitCompletion(wasFirstTry);
      } else {
        setStatus(isEnglishBoard ? `Matched! ${question.pairs.length - nextCompleted.length} pairs left.` : `配对成功。还剩 ${question.pairs.length - nextCompleted.length} 对。`);
      }
      return;
    }
    setMismatchCount((count) => count + 1);
    setWrongPairId(pairId);
    setStatus(isEnglishBoard ? "These two do not match. Try again." : "这两张不相配，再试一次。");
  }

  const allMatched = completedPairIds.length === question.pairs.length;
  return (
    <div className="match-board" ref={boardRef} data-testid="match-board">
      {connections.length > 0 && boardSize.width > 0 ? (
        <svg
          className="match-connectors"
          viewBox={`0 0 ${boardSize.width} ${boardSize.height}`}
          aria-hidden="true"
          data-testid="match-connectors"
        >
          {connections.map((connection) => {
            const pairIndex = question.pairs.findIndex((pair) => pair.id === connection.id);
            const color = MATCH_LINE_COLORS[pairIndex % MATCH_LINE_COLORS.length];
            const bend = Math.min(30, Math.abs(connection.y2 - connection.y1) * 0.22 + 7);
            const controlOne = connection.x1 + Math.max(12, (connection.x2 - connection.x1) * 0.42);
            const controlTwo = connection.x2 - Math.max(12, (connection.x2 - connection.x1) * 0.42);
            return (
              <g key={connection.id}>
                <path
                  className="match-connector-line"
                  data-testid="match-connector"
                  d={`M ${connection.x1} ${connection.y1} C ${controlOne} ${connection.y1 - bend}, ${controlTwo} ${connection.y2 + bend}, ${connection.x2} ${connection.y2}`}
                  pathLength="1"
                  stroke={color}
                />
                <circle className="match-connector-endpoint" cx={connection.x1} cy={connection.y1} r="4" fill={color} />
                <circle className="match-connector-endpoint" cx={connection.x2} cy={connection.y2} r="4" fill={color} />
              </g>
            );
          })}
        </svg>
      ) : null}
      <div className="match-columns">
        <section className="match-column" aria-labelledby="match-left-heading">
          <h3 id="match-left-heading">{question.leftLabel}</h3>
          <div className="match-card-stack">
            {question.pairs.map((pair, index) => {
              const complete = completedPairIds.includes(pair.id);
              const selected = selectedLeftId === pair.id;
              const audioError = audioErrorPairId === pair.id;
              return (
                <button
                  key={pair.id}
                  className={`match-card ${isListeningMatch ? "match-card-listen" : ""} ${playingPairId === pair.id ? "is-playing" : ""} ${audioError ? "is-audio-error" : ""} ${selected ? "is-selected" : ""} ${complete ? "is-complete" : ""}`}
                  type="button"
                  data-match-side="left"
                  data-pair-id={pair.id}
                  ref={(node) => setCardRef("left", pair.id, node)}
                  aria-pressed={selected}
                  aria-label={isListeningMatch
                    ? audioError
                      ? isEnglishBoard ? `Audio could not play, try spoken word ${index + 1} again` : `第 ${index + 1} 个${isPictureListeningMatch ? "词语" : "答案"}没有播放出来，再点一次`
                      : isEnglishBoard
                        ? `${complete ? "Completed, " : ""}play spoken word ${index + 1}`
                        : `${complete ? "已完成，" : ""}播放第 ${index + 1} 个${isPictureListeningMatch ? "词语" : "答案"}`
                    : isEnglishBoard ? `${complete ? "Completed, " : ""}choose ${pair.left}` : `${complete ? "已完成，" : ""}选择 ${pair.left}`}
                  onClick={() => selectLeft(pair.id)}
                  disabled={disabled || complete}
                >
                  {isListeningMatch ? <Volume2 className="match-listen-speaker" aria-hidden="true" /> : null}
                  <span>{isListeningMatch ? `${isEnglishBoard ? "Listen" : "听"} ${index + 1}` : pair.left}</span>
                  {audioError ? <span className="match-audio-error" aria-hidden="true">{isEnglishBoard ? "Try again" : "再点一次"}</span> : null}
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
              const locked = !selectedPair && !complete;
              const ready = Boolean(selectedPair) && !complete;
              const lockHint = locked ? (isEnglishBoard ? "First choose a left card, " : "先点左边的卡片，") : "";
              return (
                <button
                  key={pair.id}
                  className={`match-card match-card-right ${pair.rightImage ? "match-card-picture" : ""} ${locked ? "is-locked" : ""} ${ready ? "is-ready" : ""} ${complete ? "is-complete" : ""} ${wrong ? "is-wrong" : ""}`}
                  type="button"
                  data-match-side="right"
                  data-pair-id={pair.id}
                  ref={(node) => setCardRef("right", pair.id, node)}
                  aria-label={isEnglishBoard
                    ? `${complete ? "Completed, " : wrong ? "Wrong just now, " : lockHint}choose ${pair.right}`
                    : `${complete ? "已完成，" : wrong ? "刚才配错了，" : locked ? "先点左边的卡片，" : ""}选择 ${pair.right}`}
                  onClick={() => selectRight(pair.id)}
                  disabled={disabled || !selectedPair || complete}
                >
                  {pair.rightImage ? <img src={`./assets/images/${pair.rightImage}.png`} alt="" /> : null}
                  <span>{pair.right}</span>
                  {complete ? <Check aria-hidden="true" /> : wrong ? <X aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      </div>
      {(!allMatched || saveFailed || saving) ? (
        <div className={`match-status ${wrongPairId ? "is-wrong" : ""}`} id="match-status" role="status" aria-live="polite">
          <strong>{isEnglishBoard
            ? `${completedPairIds.length} / ${question.pairs.length} pairs matched`
            : `${completedPairIds.length} / ${question.pairs.length} 对完成`}</strong>
          <span>{status}</span>
          {mismatchCount > 0 && completedPairIds.length < question.pairs.length ? (
            <small>{isEnglishBoard
              ? `${mismatchCount} mistake${mismatchCount === 1 ? "" : "s"} so far. Keep trying.`
              : `配错 ${mismatchCount} 次，可以继续试。`}</small>
          ) : null}
          {saveFailed ? <button className="quiet-button match-retry-button" type="button" onClick={() => void submitCompletion(mismatchCount === 0)} disabled={saving}>{isEnglishBoard ? "Save again" : "重新保存"}</button> : null}
        </div>
      ) : null}
    </div>
  );
}

