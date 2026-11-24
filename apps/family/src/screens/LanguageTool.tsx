import { useEffect, useState } from "react";
import type { ChoiceQuestion, Question } from "../lib/types";

function scrambledWords(question: ChoiceQuestion): string[] {
  const words = question.correctAnswer.replace(/[.!?]+$/g, "").split(/\s+/).filter(Boolean);
  if (words.length < 2) return words;
  const offset = 1 + (question.id.length % (words.length - 1));
  return [...words.slice(offset), ...words.slice(0, offset)];
}

export function LanguageTool({ question }: { question: Question }) {
  const [placedIds, setPlacedIds] = useState<number[]>([]);
  const questionId = question.id;

  useEffect(() => {
    setPlacedIds([]);
  }, [questionId]);

  if (question.skillId !== "english-sentence-order" || question.kind !== "choice") return null;
  const words = scrambledWords(question);
  const placed = placedIds.map((index) => ({ index, word: words[index] })).filter((item) => Boolean(item.word));
  const remaining = words.map((word, index) => ({ index, word })).filter((item) => !placedIds.includes(item.index));

  function toggleWord(index: number) {
    setPlacedIds((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }

  return (
    <details className="math-tool language-tool" aria-label="Language tool: Word tiles" open>
      <summary><span>Language tool</span><strong>Word tiles</strong><small>Tap to build</small></summary>
      <div className="math-tool-body">
        <div className="sentence-answer" data-testid="sentence-answer" aria-live="polite">
          {placed.length > 0
            ? placed.map(({ index, word }) => <button className="sentence-tile is-placed" data-testid="sentence-tile" type="button" key={`${word}-${index}`} onClick={() => toggleWord(index)}>{word}</button>)
            : <span className="sentence-placeholder">Tap the words in order.</span>}
        </div>
        <div className="sentence-tiles" data-testid="sentence-tiles">
          {remaining.map(({ index, word }) => <button className="sentence-tile" data-testid="sentence-tile" type="button" key={`${word}-${index}`} onClick={() => toggleWord(index)}>{word}</button>)}
        </div>
        <div className="sentence-actions">
          <button className="quiet-button compact-button" type="button" onClick={() => setPlacedIds([])} disabled={placedIds.length === 0}>Reset</button>
        </div>
        <p>Tap the words in order, then choose the sentence that matches.</p>
      </div>
    </details>
  );
}
