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

function IdiomClassicBoard({ question, hintActive }: { question: Question; hintActive: boolean }) {
  const isPoem = question.template === "classic-poem" || /古诗|《/.test(question.prompt);
  const poemTitle = question.prompt.match(/《([^》]+)》/)?.[1] ?? "经典古诗";
  const idiomMatch = question.prompt.match(/“([^”]{4})”/)?.[1];

  return (
    <div
      className={`math-tool language-tool${hintActive ? " is-hint-focus" : ""}`}
      data-testid="idiom-classic-board"
      role="group"
      aria-label="语言教具：成语与古诗赏析卡"
    >
      <div className="math-tool-header">
        <span>国学启蒙教具</span>
        <strong>{isPoem ? `古诗意境卡 · 《${poemTitle}》` : "四字成语典故卡"}</strong>
        <small>{isPoem ? "品画面 · 对诗句" : "看典故 · 悟道理"}</small>
      </div>
      <div className="math-tool-body">
        {isPoem ? (
          <div className="two-step-model">
            <div className="two-step-row">
              <span className="two-step-node">
                <small>诗名</small>
                <strong>《{poemTitle}》</strong>
              </span>
              <i aria-hidden="true">📜</i>
              <span className="two-step-node">
                <small>格律</small>
                <strong>五言绝句（每句 5 字）</strong>
              </span>
              <i aria-hidden="true">→</i>
              <span className="two-step-node is-answer">
                <small>想画面</small>
                <strong>诗中有画</strong>
              </span>
            </div>
            <p>先在脑海里想象古诗描写的景色或动作，再选出最贴切的一句。</p>
          </div>
        ) : (
          <div className="two-step-model">
            <div className="two-step-row">
              {idiomMatch
                ? idiomMatch.split("").map((ch, idx) => (
                    <span key={`${ch}-${idx}`} className="two-step-node">
                      <small>第 {idx + 1} 字</small>
                      <strong>{ch}</strong>
                    </span>
                  ))
                : [
                    <span key="s1" className="two-step-node">
                      <small>第 1 步</small>
                      <strong>读情境线索</strong>
                    </span>,
                    <i key="a1" aria-hidden="true">→</i>,
                    <span key="s2" className="two-step-node">
                      <small>第 2 步</small>
                      <strong>想成语故事</strong>
                    </span>,
                    <i key="a2" aria-hidden="true">→</i>,
                    <span key="s3" className="two-step-node is-answer">
                      <small>第 3 步</small>
                      <strong>选四字成语</strong>
                    </span>
                  ]}
            </div>
            <p>每个四字成语背后都有一个小故事：先看主角做了什么，再想它比喻什么道理。</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScienceNatureBoard({ question, hintActive }: { question: Question; hintActive: boolean }) {
  const isLifeCycle = question.template === "life-cycle" || /life cycle|caterpillar|tadpole|roots|sunlight|seed|feathers/i.test(question.prompt);
  const isWeather = question.template === "plant-weather" || /freezer|evaporation|raindrops|rainbow|shadow/i.test(question.prompt);

  const stages = isLifeCycle
    ? [
        { label: "Stage 1", title: "Egg / Seed", art: "sci-seed" },
        { label: "Stage 2", title: "Grow & Feed", art: "sci-caterpillar" },
        { label: "Stage 3", title: "Change / Roots", art: "sci-pupa" },
        { label: "Stage 4", title: "Adult / Bloom", art: "sci-butterfly" }
      ]
    : isWeather
      ? [
          { label: "Cold", title: "Solid Ice", art: "sci-ice" },
          { label: "Warm", title: "Liquid Water", art: "sci-drop" },
          { label: "Sun", title: "Vapour & Clouds", art: "sci-vapor" },
          { label: "Light", title: "Rain & Shadow", art: "sci-rainbow" }
        ]
      : [
          { label: "Observe", title: "Look & Listen", art: "sci-observe" },
          { label: "Test", title: "Float / Magnet", art: "sci-experiment" },
          { label: "Compare", title: "Light / Waterproof", art: "sci-compare" },
          { label: "Conclude", title: "Science Fact", art: "sci-conclude" }
        ];

  const answerText = String((question as { correctAnswer?: string }).correctAnswer ?? "").toLowerCase();
  const stageHints = isLifeCycle
    ? [["egg", "seed"], ["caterpillar", "larva", "grow"], ["pupa", "chrysalis", "roots", "change"], ["butterfly", "bloom", "adult"]]
    : isWeather
      ? [["ice", "solid", "freeze", "cold"], ["water", "liquid", "melt", "warm"], ["vapour", "vapor", "cloud", "gas", "sun"], ["rainbow", "shadow", "light"]]
      : [["observe", "look", "listen"], ["test", "magnet", "float", "sink"], ["compare", "light", "waterproof"], ["conclude", "fact"]];
  const answerStage = stageHints.findIndex((hints) => hints.some((hint) => answerText.includes(hint)));

  return (
    <div
      className={`math-tool language-tool${hintActive ? " is-hint-focus" : ""}`}
      data-testid="science-nature-board"
      role="group"
      aria-label="Science tool: Nature & experiment board"
    >
      <div className="math-tool-header">
        <span>Science lab tool</span>
        <strong>{isLifeCycle ? "Life cycle & plants" : isWeather ? "Water & weather cycle" : "Science experiment lab"}</strong>
        <small>Observe how nature works</small>
      </div>
      <div className="math-tool-body">
        <div className="two-step-model">
          <div className="two-step-row">
            {stages.map((stage, idx) => (
              <span key={stage.label} className={`two-step-node${hintActive && idx === answerStage ? " is-answer" : ""}`}>
                <img className="two-step-node-art" src={`./assets/images/${stage.art}.png`} alt="" aria-hidden="true" />
                <small>{stage.label}</small>
                <strong>{stage.title}</strong>
              </span>
            ))}
          </div>
          <p>
            {isLifeCycle
              ? "Living things grow in stages and need sunlight, water, and air."
              : isWeather
                ? "Heating and cooling change water between ice, liquid, and vapour; light makes rainbows and shadows."
                : "Test materials carefully: wood floats, magnets attract iron, glass lets light through, and plastic blocks water."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LanguageTool({ question, hintActive = false }: { question: Question; hintActive?: boolean }) {
  const [placedIds, setPlacedIds] = useState<number[]>([]);
  const questionId = question.id;

  useEffect(() => {
    setPlacedIds([]);
  }, [questionId]);

  if (question.skillId === "mandarin-idioms-classics") {
    return <IdiomClassicBoard question={question} hintActive={hintActive} />;
  }

  if (question.skillId === "english-science-nature") {
    return <ScienceNatureBoard question={question} hintActive={hintActive} />;
  }

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
