import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Check } from "lucide-react";
import { subjectLocale } from "../content/copy";
import type { OrderQuestion } from "../lib/types";

interface OrderBoardProps {
  question: OrderQuestion;
  disabled: boolean;
  onComplete: (correct: boolean, assembled: string) => void;
}

function deterministicTokenOrder(question: OrderQuestion): Array<{ index: number; label: string }> {
  const indexed = question.tokens.map((label, index) => ({ index, label }));
  let seed = 0;
  for (let i = 0; i < question.id.length; i += 1) {
    seed = (seed * 31 + question.id.charCodeAt(i)) >>> 0;
  }
  const items = [...indexed];
  for (let i = items.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  if (items.every((item, idx) => item.label === question.correctOrder[idx])) {
    items.reverse();
  }
  return items;
}

export default function OrderBoard({ question, disabled, onComplete }: OrderBoardProps) {
  const locale = subjectLocale(question.subject);
  const bankTokens = useMemo(() => deterministicTokenOrder(question), [question]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  useEffect(() => {
    setSelectedIndices([]);
  }, [question.id]);

  const targetLength = question.correctOrder.length;
  const isComplete = selectedIndices.length === targetLength;

  function pickToken(tokenIndex: number) {
    if (disabled || selectedIndices.includes(tokenIndex) || isComplete) return;
    setSelectedIndices((current) => [...current, tokenIndex]);
  }

  function removeSlot(slotPos: number) {
    if (disabled) return;
    setSelectedIndices((current) => current.filter((_, index) => index !== slotPos));
  }

  function clearAll() {
    if (disabled) return;
    setSelectedIndices([]);
  }

  function submitOrder() {
    if (disabled || !isComplete) return;
    const picked = selectedIndices.map((idx) => question.tokens[idx]);
    const isCorrect = picked.every((token, idx) => token === question.correctOrder[idx]);
    const separator = question.separator ?? "";
    onComplete(isCorrect, picked.join(separator));
  }

  return (
    <div className="order-board" data-testid="order-board">
      <div className="order-slots" aria-label={locale === "zh" ? "已选顺序" : "Selected order"}>
        {Array.from({ length: targetLength }, (_, slotPos) => {
          const tokenIdx = selectedIndices[slotPos];
          const label = tokenIdx !== undefined ? question.tokens[tokenIdx] : null;
          return (
            <button
              key={slotPos}
              type="button"
              className={`order-slot ${label ? "is-filled" : "is-empty"}`}
              disabled={disabled || !label}
              onClick={() => removeSlot(slotPos)}
              aria-label={label ? `${label}` : `${slotPos + 1}`}
            >
              {label ?? String(slotPos + 1)}
            </button>
          );
        })}
      </div>

      <div className="order-bank" aria-label={locale === "zh" ? "词语选项" : "Word bank"}>
        {bankTokens.map(({ index, label }) => {
          const used = selectedIndices.includes(index);
          return (
            <button
              key={`${index}-${label}`}
              type="button"
              className={`order-token ${used ? "is-used" : ""}`}
              disabled={disabled || used || isComplete}
              onClick={() => pickToken(index)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="order-actions">
        <button
          type="button"
          className="quiet-button compact-button"
          disabled={disabled || selectedIndices.length === 0}
          onClick={clearAll}
        >
          <RotateCcw aria-hidden="true" />
          {locale === "zh" ? "重选" : "Clear"}
        </button>
        <button
          type="button"
          className="primary-button compact-button"
          disabled={disabled || !isComplete}
          onClick={submitOrder}
        >
          <Check aria-hidden="true" />
          {locale === "zh" ? "检查答案" : "Check"}
        </button>
      </div>
    </div>
  );
}
