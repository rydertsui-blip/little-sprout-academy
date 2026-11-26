import { useEffect, useState } from "react";
import type { ChoiceQuestion, Question } from "../lib/types";

const MANDARIN_SENTENCE_CHUNKS: Record<string, string[]> = {
  "我喜欢小猫。": ["我", "喜欢", "小猫"],
  "弟弟去学校。": ["弟弟", "去", "学校"],
  "妈妈在厨房。": ["妈妈", "在", "厨房"],
  "小鸟在天空中飞。": ["小鸟", "在天空中", "飞"],
  "我们一起去公园。": ["我们", "一起", "去公园"],
  "爸爸喜欢喝茶。": ["爸爸", "喜欢", "喝茶"],
  "你好，妈妈。": ["你好", "妈妈"],
  "不用谢。": ["不用", "谢"],
  "我想吃面。": ["我", "想吃", "面"],
  "因为刚下过雨，所以地面还是湿的。": ["因为", "刚下过雨，", "所以", "地面还是湿的。"],
  "虽然路很远，但是我们按时赶到了。": ["虽然", "路很远，", "但是", "我们按时赶到了。"],
  "我先穿好袜子，再穿上运动鞋，然后系好鞋带。": ["我先穿好袜子，", "再穿上运动鞋，", "然后系好鞋带。"]
};

function scrambledWords(question: ChoiceQuestion): string[] {
  if (question.subject === "mandarin") {
    const chunks = MANDARIN_SENTENCE_CHUNKS[question.correctAnswer];
    if (!chunks || chunks.length < 2) return [];
    const offset = 1 + (question.id.length % (chunks.length - 1));
    return [...chunks.slice(offset), ...chunks.slice(0, offset)];
  }
  const words = question.correctAnswer.replace(/[.!?]+$/g, "").split(/\s+/).filter(Boolean);
  if (words.length < 2) return words;
  const offset = 1 + (question.id.length % (words.length - 1));
  return [...words.slice(offset), ...words.slice(0, offset)];
}

export function LanguageTool({ question, hintActive = false }: { question: Question; hintActive?: boolean }) {
  const [placedIds, setPlacedIds] = useState<number[]>([]);
  const questionId = question.id;

  useEffect(() => {
    setPlacedIds([]);
  }, [questionId]);

  const isSupported =
    question.kind === "choice"
    && (question.skillId === "english-sentence-order"
      || ((question.skillId === "mandarin-word-order" || question.skillId === "mandarin-conjunctions-complex") && Boolean(MANDARIN_SENTENCE_CHUNKS[question.correctAnswer])));

  if (!isSupported || question.kind !== "choice") return null;
  const isZh = question.subject === "mandarin";
  const words = scrambledWords(question);
  if (words.length < 2) return null;
  const placed = placedIds.map((index) => ({ index, word: words[index] })).filter((item) => Boolean(item.word));
  const remaining = words.map((word, index) => ({ index, word })).filter((item) => !placedIds.includes(item.index));

  function toggleWord(index: number) {
    setPlacedIds((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }

  return (
    <div className={`math-tool language-tool${hintActive ? " is-hint-focus" : ""}`} role="group" aria-label={isZh ? "语言教具：造句词块" : "Language tool: Word tiles"}>
      <div className="math-tool-header">
        <span>{isZh ? "语言教具" : "Language tool"}</span>
        <strong>{isZh ? "造句词块" : "Word tiles"}</strong>
        <small>{isZh ? "点词块试着排一排" : "Tap to build"}</small>
      </div>
      <div className="math-tool-body">
        <div className="sentence-answer" data-testid="sentence-answer" aria-live="polite">
          {placed.length > 0
            ? placed.map(({ index, word }) => <button className="sentence-tile is-placed" data-testid="sentence-tile" type="button" key={`${word}-${index}`} onClick={() => toggleWord(index)}>{word}</button>)
            : <span className="sentence-placeholder">{isZh ? "按顺序点下面的词块排成一句话。" : "Tap the words in order."}</span>}
        </div>
        <div className="sentence-tiles" data-testid="sentence-tiles">
          {remaining.map(({ index, word }) => <button className="sentence-tile" data-testid="sentence-tile" type="button" key={`${word}-${index}`} onClick={() => toggleWord(index)}>{word}</button>)}
        </div>
        <div className="sentence-actions">
          <button className="quiet-button compact-button" type="button" onClick={() => setPlacedIds([])} disabled={placedIds.length === 0}>{isZh ? "重新排" : "Reset"}</button>
        </div>
        <p>{isZh ? "先用词块排通顺，再在右边选一模一样的句子。" : "Tap the words in order, then choose the sentence that matches."}</p>
      </div>
    </div>
  );
}
