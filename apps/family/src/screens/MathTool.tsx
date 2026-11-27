import { useEffect, useState } from "react";
import type { Question } from "../lib/types";

type ToolKind =
  | "place-value"
  | "number-line"
  | "bar-model"
  | "number-bond"
  | "array"
  | "fraction"
  | "money"
  | "clock"
  | "duration"
  | "shapes"
  | "graph"
  | "ruler"
  | "units"
  | "counting"
  | "pattern"
  | "olympiad";

const TOOL_BY_SKILL: Record<string, ToolKind> = {
  "k2-math-count-20": "number-line",
  "k2-math-add-within-10": "number-line",
  "math-count-100": "place-value",
  "math-place-value-1000": "place-value",
  "math-add-sub-100": "number-line",
  "math-two-step-problems": "bar-model",
  "math-add-sub-1000": "number-line",
  "math-add-sub-regroup": "number-line",
  "math-multiply-tables": "array",
  "math-divide-tables": "array",
  "math-fractions": "fraction",
  "math-fractions-add-sub": "fraction",
  "math-money": "money",
  "math-time": "clock",
  "math-time-duration": "duration",
  "math-shapes": "shapes",
  "math-picture-graph": "graph",
  "math-scaled-picture-graph": "graph",
  "math-length-measure": "ruler",
  "math-measurement-units": "units",
  "math-number-patterns-1000": "pattern",
  "math-olympiad-reasoning": "olympiad"
};

const TOOL_LABEL: Record<ToolKind, string> = {
  "place-value": "Place value",
  "number-line": "Number line",
  "bar-model": "Bar model",
  "number-bond": "Number bond",
  "array": "Array",
  "fraction": "Fraction bars",
  "money": "Money",
  "clock": "Clock",
  "duration": "Timeline",
  "shapes": "Shapes",
  "graph": "Picture graph",
  "ruler": "Centimetre ruler",
  "units": "Unit reference",
  "counting": "Counting pictures",
  "pattern": "Pattern",
  "olympiad": "Olympiad logic"
};

function TensOnesVisual({ tens, ones, hideTens = false, hideTotal = false, label }: { tens: number; ones: number; hideTens?: boolean; hideTotal?: boolean; label?: string }) {
  return (
    <div className="tens-ones-board" data-testid="tens-ones-board" aria-hidden="true">
      {label ? <small className="tens-ones-title">{label}</small> : null}
      <div className="place-value-blocks tens-ones-columns">
        <div className={`place-column${hideTens ? " is-target" : ""}`}>
          <strong>Tens ({hideTens ? "? × 10" : `${tens} × 10`})</strong>
          <div className="base-ten-rods">
            {Array.from({ length: Math.min(10, tens) }, (_, idx) => <span className="block-ten" key={idx} />)}
            {tens === 0 ? <small>0 rods</small> : null}
          </div>
          <small>{hideTens ? "? tens" : `${tens} tens = ${tens * 10}`}</small>
        </div>
        <div className={`place-column${hideTotal ? " is-target" : ""}`}>
          <strong>Ones ({ones} × 1)</strong>
          <div className="base-ten-cubes">
            {Array.from({ length: Math.min(10, ones) }, (_, idx) => <span className="block-one" key={idx} />)}
            {ones === 0 ? <small>0 ones</small> : null}
          </div>
          <small>{ones} {ones === 1 ? "one" : "ones"}</small>
        </div>
      </div>
    </div>
  );
}

function PlaceValue({ question }: { question: Question }) {
  if (question.skillId !== "math-place-value-1000") {
    const prompt = question.prompt;
    const tensInMatch = prompt.match(/how many tens are in (\d+)/i);
    if (tensInMatch) {
      const n = Number(tensInMatch[1]);
      return <TensOnesVisual tens={Math.floor(n / 10)} ones={n % 10} hideTens label={`Count the tens rods in ${n}`} />;
    }
    const tensOnesMatch = prompt.match(/(\d+)\s+tens\s+and\s+(\d+)\s+ones/i);
    if (tensOnesMatch) {
      const t = Number(tensOnesMatch[1]);
      const o = Number(tensOnesMatch[2]);
      return <TensOnesVisual tens={t} ones={o} hideTotal label={`${t} tens (${t * 10}) and ${o} ones = ?`} />;
    }
    const tenMoreMatch = prompt.match(/10\s+more\s+than\s+(\d+)/i);
    if (tenMoreMatch) {
      const n = Number(tenMoreMatch[1]);
      return <TensOnesVisual tens={Math.floor(n / 10)} ones={n % 10} hideTotal label={`Start with ${n} (${Math.floor(n / 10)} tens, ${n % 10} ones), then add 1 more ten rod`} />;
    }
    const boxesMatch = prompt.match(/four boxes and (\d+) loose/i);
    if (boxesMatch) {
      return <TensOnesVisual tens={4} ones={Number(boxesMatch[1])} hideTotal label="4 boxes of 10 + 7 loose pencils" />;
    }
    const compareNums = (prompt.match(/\b\d{2,3}\b/g) ?? []).map(Number);
    if (compareNums.length >= 2) {
      return (
        <div className="place-value-compare" data-testid="place-value-compare" aria-hidden="true">
          {compareNums.slice(0, 3).map((num) => (
            <div className="place-compare-card" key={num}>
              <strong>{num}</strong>
              <span>{Math.floor(num / 10)} tens · {num % 10} ones</span>
            </div>
          ))}
        </div>
      );
    }
    return <TensOnesVisual tens={2} ones={4} label="Each green rod is 1 ten (10); each yellow cube is 1 one (1)" />;
  }
  const expanded = question.prompt.match(/(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)/);
  if (expanded) {
    return (
      <div className="expanded-form" data-testid="expanded-form" aria-hidden="true">
        {expanded.slice(1, 4).flatMap((term, index) => [
          <span key={`term-${index}`}>{term}</span>,
          index < 2 ? <i key={`plus-${index}`}>+</i> : <i key="equals">=</i>
        ])}
        <b>?</b>
      </div>
    );
  }
  const numberMatch = question.prompt.match(/\b(\d{3})\b/);
  if (!numberMatch) {
    return <div className="place-value-blocks" aria-hidden="true"><small>Hundreds · Tens · Ones</small></div>;
  }
  const digits = numberMatch[1].split("").map(Number);
  const targetDigit = question.prompt.match(/digit (\d) in \d{3}/i)?.[1];
  const placeWord = question.prompt.match(/hundreds|tens|ones/i)?.[0]?.toLowerCase();
  let targetIndex = placeWord === "hundreds" ? 0 : placeWord === "tens" ? 1 : placeWord === "ones" ? 2 : digits.findIndex((digit) => String(digit) === targetDigit);
  if (targetIndex < 0) targetIndex = 0;
  const places = [
    { label: "Hundreds", multiplier: "× 100" },
    { label: "Tens", multiplier: "× 10" },
    { label: "Ones", multiplier: "× 1" }
  ];
  return (
    <div className="place-value-blocks place-value-chart" data-testid="place-value-chart" aria-hidden="true">
      {digits.map((digit, index) => (
        <div className={`place-column${index === targetIndex ? " is-target" : ""}`} key={places[index].label}>
          <strong>{places[index].label}</strong>
          <span className="place-digit" data-testid={`place-digit-${index}`}>{index === targetIndex ? "?" : digit}</span>
          <small>{places[index].multiplier}</small>
        </div>
      ))}
    </div>
  );
}

function JumpNumberLine({ question }: { question: Question }) {
  const { a, b } = questionNumbers(question.prompt);
  if (!a || !b) return null;
  const subtract = /[−-]|taken away|remain|lost|left|fewer/i.test(question.prompt);
  const endValue = subtract ? a - b : a + b;
  const round = question.skillId === "math-add-sub-1000" ? 100 : 10;
  const low = Math.max(0, Math.floor((Math.min(a, endValue) - round) / round) * round);
  const high = Math.ceil((Math.max(a, endValue) + round) / round) * round;
  const range = high - low || 1;
  const x = (value: number) => 30 + ((value - low) / range) * 540;
  const tickStep = Math.max(round, Math.ceil((range / 6) / round) * round);
  const ticks: number[] = [];
  for (let value = low; value <= high; value += tickStep) ticks.push(value);
  const xStart = x(a);
  const xEnd = x(endValue);
  const direction = endValue >= a ? 1 : -1;
  return (
    <div className="jump-number-line" data-testid="jump-number-line" aria-hidden="true">
      <svg className="math-svg jump-line-svg" viewBox="0 0 600 112">
        <line x1="30" y1="62" x2="570" y2="62" stroke="#17324d" strokeWidth="3" />
        {ticks.filter((value) => value !== a && value !== endValue).map((value) => (
          <g key={value}>
            <line x1={x(value)} y1="54" x2={x(value)} y2="70" stroke="#17324d" strokeWidth="2" />
            <text x={x(value)} y="96" textAnchor="middle" fontSize="15" fontWeight="800" fill="#17324d">{value}</text>
          </g>
        ))}
        <line x1={xStart} y1="28" x2={xEnd} y2="28" stroke="#e85c47" strokeWidth="4" />
        <polygon points={`${xEnd},28 ${xEnd - direction * 9},21 ${xEnd - direction * 9},35`} fill="#e85c47" />
        <line x1={xStart} y1="48" x2={xStart} y2="74" stroke="#17324d" strokeWidth="2" strokeDasharray="4 3" />
        <text x={xStart} y="108" textAnchor="middle" fontSize="16" fontWeight="900" fill="#17324d">{a}</text>
        <text x={xEnd} y="108" textAnchor="middle" fontSize="18" fontWeight="900" fill="#e85c47">?</text>
        <text x={(xStart + xEnd) / 2} y="20" textAnchor="middle" fontSize="17" fontWeight="900" fill="#e85c47">{subtract ? "−" : "+"} {b}</text>
      </svg>
      <small>Start at {a}, then {subtract ? "subtract" : "add"} {b}</small>
    </div>
  );
}

function NumberLine({ max = 100, question }: { max?: number; question: Question }) {
  const { a, b } = questionNumbers(question.prompt);
  if (["math-add-sub-100", "math-add-sub-regroup", "math-add-sub-1000"].includes(question.skillId) && a > 0 && b > 0 && question.kind === "choice") {
    return <JumpNumberLine question={question} />;
  }
  return (
    <svg className="math-svg number-line-svg" viewBox="0 0 600 92" aria-hidden="true">
      <line x1="30" y1="48" x2="570" y2="48" stroke="#17324d" strokeWidth="3" />
      {Array.from({ length: 11 }, (_, index) => {
        const x = 30 + index * 54;
        return (
          <g key={index}>
            <line x1={x} y1="40" x2={x} y2="56" stroke="#17324d" strokeWidth="2" />
            <text x={x} y="78" textAnchor="middle" fontSize={max > 100 ? 13 : 15} fontWeight="800" fill="#17324d">{index * (max / 10)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function questionNumbers(prompt: string) {
  const numbers = prompt.match(/\d+/g)?.map(Number) ?? [];
  return { a: numbers[0] ?? 0, b: numbers[1] ?? 0 };
}

function BarModel({ question }: { question: Question }) {
  const { a, b } = questionNumbers(question.prompt);
  const subtract = /[−-]|taken away|remain|lost|left|fewer|used|empty|sells|get off/i.test(question.prompt);
  return (
    <div className="bar-model-visual">
      <div className="bar-model-whole"><small>whole</small><strong>{subtract ? a : "?"}</strong></div>
      <div className="bar-model-parts">
        <div className="bar-model-part"><small>part</small><strong>{subtract ? b : a}</strong></div>
        <div className="bar-model-part"><small>part</small><strong>{subtract ? "?" : b}</strong></div>
      </div>
      <p>{subtract ? "whole − part = part" : "part + part = whole"}</p>
    </div>
  );
}

function twoStepSign(prompt: string, value: string): "+" | "−" | null {
  const index = prompt.indexOf(value);
  if (index < 0) return null;
  const before = prompt.slice(Math.max(0, index - 24), index);
  const after = prompt.slice(index + value.length, index + value.length + 24);
  const candidates: Array<{ sign: "+" | "−"; distance: number }> = [];
  const collect = (text: string, scope: "before" | "after", pattern: RegExp, sign: "+" | "−") => {
    for (const match of text.matchAll(pattern)) {
      const distance = scope === "before"
        ? before.length - ((match.index ?? 0) + match[0].length)
        : match.index ?? 0;
      candidates.push({ sign, distance });
    }
  };
  collect(before, "before", /sell|sold|give|gave|away|off|take|taken|eaten|eat|break|broken|used|lose|lost|spend|spent|cost|costs|pay|fewer|remove/gi, "−");
  collect(before, "before", /gets|got|get on|get more|receive|receives|earn|earns|collect|collects|buy|buys|more|add|adds|altogether|in all|total/gi, "+");
  collect(after, "after", /sell|sold|give|gave|away|off|take|taken|eaten|eat|break|broken|used|lose|lost|spend|spent|cost|costs|pay|fewer|remove/gi, "−");
  collect(after, "after", /gets|got|get on|get more|receive|receives|earn|earns|collect|collects|buy|buys|more|add|adds|altogether|in all|total/gi, "+");
  if (!candidates.length) return null;
  return candidates.sort((left, right) => left.distance - right.distance)[0].sign;
}

function TwoStepBar({ question }: { question: Question }) {
  const numbers = question.prompt.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length < 3) return <BarModel question={question} />;
  const [start, changeOne, changeTwo] = numbers;
  const firstSign = twoStepSign(question.prompt, String(changeOne));
  const secondSign = twoStepSign(question.prompt, String(changeTwo));
  return (
    <div className="two-step-model" data-testid="two-step-model">
      <div className="two-step-row">
        <span className="two-step-node"><small>start</small><strong>{start}</strong></span>
        <i aria-hidden="true">→</i>
        <span className="two-step-node"><small>change 1</small><strong>{firstSign ? `${firstSign} ${changeOne}` : changeOne}</strong></span>
        <i aria-hidden="true">→</i>
        <span className="two-step-node"><small>change 2</small><strong>{secondSign ? `${secondSign} ${changeTwo}` : changeTwo}</strong></span>
        <i aria-hidden="true">→</i>
        <span className="two-step-node is-answer"><small>now</small><strong>?</strong></span>
      </div>
      <p>Work through both changes in order.</p>
    </div>
  );
}

function TwoStepArray({ question }: { question: Question }) {
  const groups = question.prompt.match(/(\d+)\s+(?:boxes|bags|trays|rows)\s+with\s+(\d+)/i);
  const rows = Number(groups?.[1] ?? 0);
  const columns = Number(groups?.[2] ?? 0);
  const removed = Number(question.prompt.match(/(\d+)\s+(?:books|oranges|eggs)\s+(?:are\s+)?(?:taken out|eaten|break|broken|sold)/i)?.[1] ?? 0);
  if (!rows || !columns) return null;
  const total = rows * columns;
  return (
    <div className="two-step-array" data-testid="two-step-array">
      <div className="two-step-array-grid" style={{ gridTemplateColumns: `repeat(${columns}, 16px)` }} aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span className={index >= total - removed ? "is-removed" : ""} key={index} />
        ))}
      </div>
      <small>{rows} × {columns} = {total}; {removed} removed</small>
    </div>
  );
}

function TenFrame({ total, initialFilled }: { total: number; initialFilled: number }) {
  const frameSize = total <= 10 ? 10 : 20;
  const [extra, setExtra] = useState<number[]>([]);
  useEffect(() => {
    setExtra([]);
  }, [total, initialFilled]);
  const toggle = (idx: number) => {
    if (idx < initialFilled) return;
    setExtra((prev) => (prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]));
  };
  return (
    <div className="interactive-ten-frame" data-testid="interactive-ten-frame">
      <div className="ten-frame-grid">
        {Array.from({ length: frameSize }, (_, idx) => {
          const isGiven = idx < initialFilled;
          const isAdded = extra.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              className={`ten-frame-cell ${isGiven ? "is-given" : isAdded ? "is-added" : ""}`}
              onClick={() => toggle(idx)}
              aria-label={`Cell ${idx + 1}`}
            >
              {isGiven || isAdded ? <span /> : null}
            </button>
          );
        })}
      </div>
      <small>Tap empty squares to count on ({initialFilled} + {extra.length} = {initialFilled + extra.length})</small>
    </div>
  );
}

function NumberBond({ question }: { question: Question }) {
  const target = question.prompt.match(/makes?\s+(\d+)/i)?.[1];
  const given = question.prompt.match(/(\d+)\s*\+\s*_{2,}/)?.[1];
  if (target && given) {
    const wholeNum = Number(target);
    const givenNum = Number(given);
    return (
      <div className="number-bond-visual" data-testid="number-bond-visual">
        <div className="number-bond-whole"><small>whole</small><strong>{target}</strong></div>
        <div className="number-bond-connector" aria-hidden="true"><i /><i /></div>
        <div className="number-bond-parts">
          <span><small>part</small><strong>{given}</strong></span>
          <span><small>part</small><strong>?</strong></span>
        </div>
        {wholeNum <= 20 ? <TenFrame total={wholeNum} initialFilled={givenNum} /> : null}
        <p>part + part = whole</p>
      </div>
    );
  }
  const { a, b } = questionNumbers(question.prompt);
  return (
    <div className="number-bond-visual">
      <div className="number-bond-whole"><small>whole</small><strong>?</strong></div>
      <div className="number-bond-connector" aria-hidden="true"><i /><i /></div>
      <div className="number-bond-parts">
        <span><small>part</small><strong>{a}</strong></span>
        <span><small>part</small><strong>{b}</strong></span>
      </div>
      <p>part + part = whole</p>
    </div>
  );
}

function ArrayBoard({ question }: { question: Question }) {
  const equation = question.prompt.match(/(\d+)\s*(?:÷|\/|×|x|\*)\s*(\d+)/);
  const story = question.prompt.match(/(\d+)\s+(?:groups?|rows?)\s+(?:have|with)\s+(\d+)/i);
  const first = equation ? Number(equation[1]) : story ? Number(story[1]) : 4;
  const second = equation ? Number(equation[2]) : story ? Number(story[2]) : 5;
  const isDivision = /÷|\//.test(question.prompt);
  const groups = isDivision ? first / second : first;
  const perGroup = second;
  const usable = Boolean(equation || story) && Number.isInteger(groups) && groups > 0 && groups <= 10 && perGroup > 0 && perGroup <= 10;
  const rows = usable ? groups : 4;
  const columns = usable ? perGroup : 5;
  const caption = question.kind === "match" || !usable ? "An array shows equal rows and columns" : `${rows} groups of ${columns}`;
  return (
    <div className="array-board" data-testid="array-board" data-rows={rows} data-columns={columns} aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => (
        <div className="array-row" key={row}>
          {Array.from({ length: columns }, (_, column) => <span key={column} />)}
        </div>
      ))}
      <small>{caption}</small>
    </div>
  );
}

function DivisionBoard({ question }: { question: Question }) {
  const divide = question.prompt.match(/(\d+)\s*÷\s*(\d+)/);
  const share = question.prompt.match(/(\d+)\s+counters\s+are\s+shared\s+equally\s+into\s+(\d+)\s+groups/i);
  const array = question.prompt.match(/(\d+)\s+counters\s+in\s+(\d+)\s+equal\s+rows/i);
  const fact = question.prompt.match(/(\d+)\s*×\s*(\d+)\s*=\s*(\d+)/);
  const story = question.prompt.match(/(\d+)\s+(?:cookies|biscuits)\s+are\s+shared\s+equally\s+into\s+(\d+)\s+boxes/i);
  let total = 0;
  let groups = 0;
  let eaten = 0;
  if (story) {
    total = Number(story[1]);
    groups = Number(story[2]);
    eaten = Number(question.prompt.match(/(\d+)\s+(?:cookies|biscuits)\s+are\s+eaten/i)?.[1] ?? 0);
  } else if (share) {
    total = Number(share[1]);
    groups = Number(share[2]);
  } else if (array) {
    total = Number(array[1]);
    groups = Number(array[2]);
  } else if (divide) {
    total = Number(divide[1]);
    groups = Number(divide[2]);
  } else if (fact) {
    total = Number(fact[3]);
    groups = Number(fact[1]);
  }
  const perGroup = groups > 0 ? total / groups : 0;
  if (!Number.isInteger(perGroup) || perGroup <= 0 || perGroup > 10 || groups <= 0 || groups > 10) {
    return <ArrayBoard question={question} />;
  }
  return (
    <div className="division-board" data-testid="division-board" data-groups={groups} aria-hidden="true">
      <div className="division-groups">
        {Array.from({ length: groups }, (_, group) => (
          <div className="division-group" key={group}>
            {Array.from({ length: perGroup }, (_, item) => (
              <span className={`division-dot${eaten && group === groups - 1 && item >= perGroup - eaten ? " is-eaten" : ""}`} key={item} />
            ))}
          </div>
        ))}
      </div>
      <small>{groups} equal groups{eaten ? `; ${eaten} eaten from one group` : ""}</small>
    </div>
  );
}

function fractionParts(prompt: string): Array<[number, number]> {
  return [...prompt.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((match) => [Number(match[1]), Number(match[2])]);
}

function FractionModel({ question }: { question: Question }) {
  const cut = question.prompt.match(/cut into (\d+) equal (parts|slices)/i);
  const set = question.prompt.match(/What is (\d+)\/(\d+) of (\d+)/);
  const [toggledSlices, setToggledSlices] = useState<number[]>([]);
  useEffect(() => {
    setToggledSlices([]);
  }, [question.id]);

  if (set) {
    const numerator = Number(set[1]);
    const groups = Number(set[2]);
    const whole = Number(set[3]);
    const perGroup = whole / groups;
    if (Number.isInteger(perGroup)) {
      return (
        <div className="fraction-set-board" data-testid="fraction-set-board" aria-hidden="true">
          <div className="fraction-set-groups">
            {Array.from({ length: groups }, (_, group) => (
              <div className={`fraction-set-group${group < numerator ? " is-shaded" : ""}`} key={group}>
                {Array.from({ length: perGroup }, (_, item) => <span key={item} />)}
              </div>
            ))}
          </div>
          <small>{numerator} of {groups} equal groups</small>
        </div>
      );
    }
  }
  if (cut) {
    const denominator = Number(cut[1]);
    const eaten = Number(question.prompt.match(/(\d+)\s+(?:slices|parts)\s+are\s+eaten/i)?.[1] ?? 0);
    const askParts = /How many equal parts/i.test(question.prompt);
    const shaded = eaten ? 0 : askParts ? 0 : 1;
    const toggleSlice = (idx: number) => {
      setToggledSlices((prev) => (prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]));
    };
    return (
      <div className="fraction-whole-board" data-testid="fraction-whole-board">
        <svg viewBox="0 0 520 64" role="img" aria-label="Equal parts">
          {Array.from({ length: denominator }, (_, section) => {
            const baseShaded = eaten ? section < eaten : section < shaded;
            const active = toggledSlices.includes(section) ? !baseShaded : baseShaded;
            return (
              <rect
                key={section}
                x={section * (520 / denominator)}
                y="8"
                width={520 / denominator}
                height="48"
                fill={active ? (eaten ? "#f4a7a0" : "#f4b84b") : "#fffdf8"}
                stroke="#17324d"
                strokeWidth="2"
                style={{ cursor: "pointer" }}
                onClick={() => toggleSlice(section)}
              />
            );
          })}
        </svg>
        <small>{askParts ? "How many equal parts? Tap slices to count." : eaten ? `${eaten} of ${denominator} slices eaten (tap slices to shade)` : "One part is shaded. Tap slices to explore."}</small>
      </div>
    );
  }
  return <FractionPairBars question={question} />;
}

function FractionBar({ question }: { question: Question }) {
  if (question.skillId === "math-fractions") return <FractionModel question={question} />;
  return <FractionPairBars question={question} />;
}

function FractionPairBars({ question }: { question: Question }) {
  const parts = fractionParts(question.prompt).slice(0, 2);
  const shown = parts.length ? parts : [[1, 5] as [number, number]];
  const takeAway = /[−-]/.test(question.prompt) || (/used|removed|poured out|cut off/i.test(question.prompt) && !/more/i.test(question.prompt));
  const [toggled, setToggled] = useState<string[]>([]);
  useEffect(() => {
    setToggled([]);
  }, [question.id]);
  const toggleSection = (key: string) => {
    setToggled((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };
  return (
    <div className="fraction-pairs" data-testid="fraction-pairs">
      {shown.map(([numerator, denominator], index) => (
        <div className="fraction-card" data-testid="fraction-card" data-fraction={`${numerator}/${denominator}`} key={`${numerator}-${denominator}-${index}`}>
          <svg viewBox="0 0 520 64" role="img" aria-label={`${numerator} out of ${denominator} shaded`}>
            {Array.from({ length: denominator }, (_, section) => {
              const key = `${index}-${section}`;
              const base = section < numerator;
              const active = toggled.includes(key) ? !base : base;
              return (
                <rect
                  key={section}
                  x={section * (520 / denominator)}
                  y="8"
                  width={520 / denominator}
                  height="48"
                  fill={active ? (takeAway && index === 1 ? "#f4a7a0" : "#f4b84b") : "#fffdf8"}
                  stroke="#17324d"
                  strokeWidth="2"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSection(key)}
                />
              );
            })}
          </svg>
          <small>{numerator}/{denominator}{takeAway && index === 1 ? " · take away" : ""}</small>
        </div>
      ))}
    </div>
  );
}

function formatMoney(cents: number): string {
  return `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function formatCents(cents: number): string {
  return `${cents}¢`;
}

function moneyAmounts(prompt: string): number[] {
  const dollarAmounts = [...prompt.matchAll(/\$(\d+)(?:\.(\d{2}))?/g)].map((match) => Number(match[1]) * 100 + Number(match[2] ?? 0));
  if (dollarAmounts.length) return dollarAmounts;
  return [...prompt.matchAll(/(\d+)\s*cents?/gi)].map((match) => Number(match[1]));
}

function MoneyBoard({ question }: { question: Question }) {
  const amounts = moneyAmounts(question.prompt);
  const asksForCents = /how many cents|in cents|cents/i.test(question.prompt);
  const centsOnly = asksForCents && !question.prompt.includes("$");
  const showAmount = centsOnly ? formatCents : formatMoney;
  const comparesOrChanges = /change|more|less|than/i.test(question.prompt);
  const total = /altogether|in all|total/i.test(question.prompt);
  if (amounts.length >= 2 && total && !comparesOrChanges) {
    return (
      <div className="money-equation" data-testid="money-tool" aria-hidden="true">
        <span><small>First</small><strong>{showAmount(amounts[0])}</strong></span>
        <i>+</i>
        <span><small>Second</small><strong>{showAmount(amounts[1])}</strong></span>
        <i>=</i><b>?</b>
      </div>
    );
  }
  if (amounts.length >= 2 && comparesOrChanges) {
    const larger = Math.max(...amounts);
    const smaller = Math.min(...amounts);
    return (
      <div className="money-equation" data-testid="money-tool" aria-hidden="true">
        <span><small>{/change/i.test(question.prompt) ? "Pay" : "Larger"}</small><strong>{showAmount(larger)}</strong></span>
        <i>−</i>
        <span><small>{/change/i.test(question.prompt) ? "Cost" : "Smaller"}</small><strong>{showAmount(smaller)}</strong></span>
        <i>=</i><b>?</b>
      </div>
    );
  }
  if (amounts.length === 1 && asksForCents) {
    return (
      <div className="money-amount" data-testid="money-tool" aria-hidden="true">
        <small>Amount</small>
        <strong>{showAmount(amounts[0])}</strong>
        <span>? cents</span>
      </div>
    );
  }
  if (amounts.length === 1) {
    return (
      <div className="money-amount" data-testid="money-tool" aria-hidden="true">
        <small>Amount</small>
        <strong>{showAmount(amounts[0])}</strong>
      </div>
    );
  }
  return (
    <div className="money-board" data-testid="money-tool" aria-hidden="true">
      <span className="coin coin-dollar">$1</span>
      <span className="coin coin-50">50¢</span>
      <span className="coin coin-20">20¢</span>
      <span className="coin coin-10">10¢</span>
      <span className="coin coin-5">5¢</span>
      <small>$1 = 100 cents</small>
    </div>
  );
}

function Clock({ question }: { question: Question }) {
  const center = 100;
  const hand = (angle: number, length: number) => ({
    x2: center + length * Math.sin(angle),
    y2: center - length * Math.cos(angle)
  });
  const clockTime = question.prompt.match(/(\d{1,2}):(\d{2})/);
  const parsed = clockTime ? Number(clockTime[1]) * 60 + Number(clockTime[2]) : 7 * 60 + 35;
  const hour = hand((((parsed / 60) % 12) + (parsed % 60) / 60) / 12 * Math.PI * 2, 42);
  const minute = hand(((parsed % 60) / 60) * Math.PI * 2, 64);
  return (
    <div className="clock-visual">
      <svg className="math-svg clock-svg" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="76" fill="#fffdf8" stroke="#17324d" strokeWidth="3" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index / 12) * Math.PI * 2;
          return <line key={`tick-${index}`} x1={100 + 66 * Math.sin(angle)} y1={100 - 66 * Math.cos(angle)} x2={100 + 72 * Math.sin(angle)} y2={100 - 72 * Math.cos(angle)} stroke="#17324d" strokeWidth="2" />;
        })}
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index / 12) * Math.PI * 2;
          return <text key={`num-${index}`} x={100 + 52 * Math.sin(angle)} y={100 - 52 * Math.cos(angle)} textAnchor="middle" dominantBaseline="middle" fill="#17324d" fontSize="17" fontWeight="800">{index === 0 ? 12 : index}</text>;
        })}
        <line x1="100" y1="100" x2={hour.x2} y2={hour.y2} stroke="#17324d" strokeWidth="6" />
        <line x1="100" y1="100" x2={minute.x2} y2={minute.y2} stroke="#e85c47" strokeWidth="4" />
        <circle cx="100" cy="100" r="5" fill="#17324d" />
      </svg>
      <small>Read the hour and minute hands.</small>
    </div>
  );
}

function parseClockTime(value: string): number | null {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function clockLabel(totalMinutes: number): string {
  const minutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

function durationLabel(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  if (minutes > 60) return `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) === 1 ? "" : "s"} ${minutes % 60} min`;
  return `${minutes} minutes`;
}

function DurationVisual({ question }: { question: Question }) {
  const clockMatches = [...question.prompt.matchAll(/(\d{1,2}):(\d{2})/g)];
  const clockTimes = clockMatches.map((match) => parseClockTime(match[0])).filter((value): value is number => value !== null);
  const hourMatch = question.prompt.match(/(\d+)\s*hour(?:s)?(?:\s*(?:and\s*)?(\d+)\s*minute(?:s)?)?/i);
  const minuteMatch = question.prompt.match(/(\d+)\s*minute(?:s)?/i);
  const statedDuration = hourMatch
    ? Number(hourMatch[1]) * 60 + Number(hourMatch[2] ?? 0)
    : minuteMatch
      ? Number(minuteMatch[1])
      : null;
  const asksDuration = /how long|how many minutes|how much time/i.test(question.prompt);
  const asksEnd = !asksDuration && /(?:what time does .* (?:end|arrive)|what time is it .* later|arrives at)/i.test(question.prompt);
  const asksStart = /what time did .* start|what time did .* leave/i.test(question.prompt);
  let start: number | null = null;
  let end: number | null = null;
  if (clockTimes.length >= 2) {
    start = clockTimes[0];
    end = clockTimes[1];
  } else if (clockTimes.length === 1 && statedDuration !== null) {
    if (/(?:ends|arrives)\s+at/i.test(question.prompt)) {
      end = clockTimes[0];
      start = end - statedDuration;
    } else {
      start = clockTimes[0];
      end = start + statedDuration;
    }
  }
  if (start === null || end === null) {
    const total = statedDuration ?? 0;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return (
      <div className="duration-visual" data-testid="duration-visual">
        <div className="duration-convert">
          {hours > 0 ? <span><strong>{hours} h</strong><small>hours</small></span> : null}
          {hours > 0 && minutes > 0 ? <i>+</i> : null}
          {minutes > 0 ? <span><strong>{minutes} min</strong><small>minutes</small></span> : null}
          <i>=</i><b>{asksDuration ? "?" : `${total} min`}</b>
        </div>
        <p>Hours and minutes: 1 hour = 60 minutes.</p>
      </div>
    );
  }
  const total = end - start;
  return (
    <div className="duration-visual" data-testid="duration-visual">
      <div className="duration-line">
        <span className="duration-endpoint"><small>Start</small><strong>{asksStart ? "?" : clockLabel(start)}</strong></span>
        <span className="duration-rail"><b data-testid="duration-rail">{asksDuration ? "?" : durationLabel(total)}</b></span>
        <span className="duration-endpoint"><small>End</small><strong>{asksEnd ? "?" : clockLabel(end)}</strong></span>
      </div>
      <p>Start time + duration = end time.</p>
    </div>
  );
}

function CountingPictures({ question }: { question: Question }) {
  const prompt = question.prompt;
  const symbol = prompt.includes("★") ? "★" : prompt.includes("●") ? "●" : "";
  const [tapped, setTapped] = useState<string[]>([]);
  useEffect(() => {
    setTapped([]);
  }, [question.id]);
  if (!symbol) return null;
  const compare = /which group has more/i.test(prompt);
  const separators = compare ? /\s+or\s+/i : /[+−]/;
  const segments = prompt.split(separators).filter((segment) => segment.includes(symbol));
  const counts = segments.map((segment) => Array.from(segment).filter((character) => character === symbol).length);
  const operator = compare ? "or" : /[+＋]/.test(prompt) ? "+" : "−";
  const caption = compare
    ? "Tap each dot to count and compare."
    : /[+＋]/.test(prompt)
      ? "Put the two groups together. Tap to count."
      : /[−]/.test(prompt)
        ? "Take away the second group. Tap to count."
        : symbol === "★" ? "Tap each star to count." : "Tap each dot to count.";
  const toggleItem = (key: string) => {
    setTapped((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };
  return (
    <div className="counting-pictures" data-testid="counting-pictures" data-groups={counts.join(",")}>
      {segments.map((segment, index) => {
        const items = Array.from(segment).filter((character) => character === symbol);
        return (
          <span className="counting-group" key={index}>
            {index > 0 ? <i>{operator}</i> : null}
            {compare ? <small>{index === 0 ? "Group A" : "Group B"}</small> : null}
            <span className={`counting-symbol counting-${symbol === "★" ? "star" : "dot"}`}>
              {items.map((item, itemIdx) => {
                const key = `${index}-${itemIdx}`;
                const order = tapped.indexOf(key);
                const isTapped = order >= 0;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`counting-tap-item ${isTapped ? "is-counted" : ""}`}
                    onClick={() => toggleItem(key)}
                    aria-label={`Count ${itemIdx + 1}`}
                  >
                    <span>{item}</span>
                    {isTapped ? <em>{order + 1}</em> : null}
                  </button>
                );
              })}
            </span>
          </span>
        );
      })}
      <small className="counting-caption">{caption}{tapped.length > 0 ? ` (${tapped.length})` : ""}</small>
    </div>
  );
}

function SequenceTool({ question }: { question: Question }) {
  const prompt = question.prompt;
  const oddEvenMatch = prompt.match(/ones digit of (\d+)/i);
  if (oddEvenMatch || question.template === "odd-even-identify") {
    const numStr = oddEvenMatch?.[1] ?? (prompt.match(/\b(\d{2,3})\b/)?.[1] ?? "");
    const prefix = numStr.slice(0, -1);
    const ones = numStr.slice(-1);
    return (
      <div className="pattern-tool" data-testid="pattern-tool" data-kind="odd-even" aria-hidden="true">
        {numStr ? <span className="pattern-chip">{prefix}<strong style={{ color: "#e85c47", textDecoration: "underline" }}>{ones}</strong></span> : null}
        <small>Even ones: 0, 2, 4, 6, 8 · Odd ones: 1, 3, 5, 7, 9</small>
      </div>
    );
  }
  const colorMatches = [...prompt.matchAll(/\b(red|blue|green|yellow|orange|purple|pink|brown)\b/gi)].map((match) => match[1].toLowerCase());
  if (colorMatches.length >= 2) {
    return (
      <div className="pattern-tool" data-testid="pattern-tool" data-kind="colour" aria-hidden="true">
        {colorMatches.map((color, index) => <span className="pattern-dot" data-color={color} key={`${color}-${index}`} />)}
        <span className="pattern-missing">?</span>
        <small>Continue the colour pattern.</small>
      </div>
    );
  }
  const tail = prompt.split(/[?:]/).slice(-1)[0]?.trim().replace(/\.$/, "") ?? "";
  const tokens = tail.split(/,\s*/).map((token) => token.trim()).filter((token) => /^\d+$|^_+$/.test(token));
  if (tokens.length >= 2) {
    return (
      <div className="pattern-tool" data-testid="pattern-tool" data-kind="number" aria-hidden="true">
        {tokens.map((token, index) => <span className={`pattern-chip${/^_+$/.test(token) ? " is-missing" : ""}`} key={`${token}-${index}`}>{/^_+$/.test(token) ? "?" : token}</span>)}
        <small>{/count by/i.test(prompt) ? "Count on in equal steps." : "Find the missing number."}</small>
      </div>
    );
  }
  const numbers = prompt.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length) {
    return (
      <div className="pattern-tool" data-testid="pattern-tool" data-kind="number" aria-hidden="true">
        <span className="pattern-chip">{numbers.at(-1)}</span>
        <i>→</i>
        <span className="pattern-chip is-missing">?</span>
        <small>{/more than/i.test(prompt) ? "One more." : "What comes next?"}</small>
      </div>
    );
  }
  return null;
}

const SHAPE_FACTS_2D = [
  "Shape 1: 3 straight sides and 3 corners",
  "Shape 2: 4 equal straight sides and 4 corners",
  "Shape 3: 4 straight sides (2 long, 2 short) and 4 corners",
  "Shape 4: 0 straight sides — curved all around"
];

const SHAPE_FACTS_3D = [
  "3D Shape 1: 6 flat square faces — does not roll",
  "3D Shape 2: 6 flat rectangular faces — does not roll",
  "3D Shape 3: 2 flat circular faces and 1 curved surface — can roll",
  "3D Shape 4: 0 flat faces, curved all around — can roll"
];

function Shapes({ question }: { question: Question }) {
  const is3d = /3d|three-dimensional|cube|cuboid|cylinder|sphere|faces|roll/i.test(question.prompt);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  useEffect(() => {
    setSelectedIdx(null);
  }, [question.id]);

  if (is3d) {
    return (
      <div className="shapes-interactive">
        <svg className="math-svg shapes-svg" data-testid="shapes-3d" viewBox="0 0 520 142" aria-hidden="true">
          <g data-shape="cube" style={{ cursor: "pointer" }} onClick={() => setSelectedIdx(0)}>
            <polygon points="38,52 58,34 98,34 78,52" fill="#ffe3a4" stroke={selectedIdx === 0 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 0 ? "3" : "2"} />
            <polygon points="78,52 98,34 98,74 78,92" fill="#f4cf76" stroke={selectedIdx === 0 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 0 ? "3" : "2"} />
            <rect x="38" y="52" width="40" height="40" fill="#fff0c6" stroke={selectedIdx === 0 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 0 ? "3" : "2"} />
          </g>
          <g data-shape="cuboid" style={{ cursor: "pointer" }} onClick={() => setSelectedIdx(1)}>
            <polygon points="150,56 170,40 254,40 234,56" fill="#bfe5e3" stroke={selectedIdx === 1 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 1 ? "3" : "2"} />
            <polygon points="234,56 254,40 254,80 234,96" fill="#9fd4d2" stroke={selectedIdx === 1 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 1 ? "3" : "2"} />
            <rect x="150" y="56" width="84" height="40" fill="#dff0ef" stroke={selectedIdx === 1 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 1 ? "3" : "2"} />
          </g>
          <g data-shape="cylinder" style={{ cursor: "pointer" }} onClick={() => setSelectedIdx(2)}>
            <rect x="300" y="44" width="48" height="44" fill="#d8e2f7" stroke={selectedIdx === 2 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 2 ? "3" : "2"} />
            <ellipse cx="324" cy="44" rx="24" ry="9" fill="#edf2fd" stroke={selectedIdx === 2 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 2 ? "3" : "2"} />
            <ellipse cx="324" cy="88" rx="24" ry="9" fill="#d8e2f7" stroke={selectedIdx === 2 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 2 ? "3" : "2"} />
          </g>
          <g data-shape="sphere" style={{ cursor: "pointer" }} onClick={() => setSelectedIdx(3)}>
            <circle cx="420" cy="66" r="32" fill="#ffd4c7" stroke={selectedIdx === 3 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 3 ? "3" : "2"} />
            <ellipse cx="410" cy="55" rx="12" ry="8" fill="#ffe9e3" opacity="0.8" />
          </g>
          <text x="58" y="126" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
          <text x="192" y="126" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
          <text x="324" y="126" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
          <text x="420" y="126" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
        </svg>
        <small>{selectedIdx !== null ? SHAPE_FACTS_3D[selectedIdx] : "Tap any 3D shape above to inspect its faces and whether it can roll."}</small>
      </div>
    );
  }
  return (
    <div className="shapes-interactive">
      <svg className="math-svg shapes-svg" viewBox="0 0 520 132" aria-hidden="true">
        <polygon points="42,96 82,28 122,96" fill="#ffe3a4" stroke={selectedIdx === 0 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 0 ? "3" : "2"} style={{ cursor: "pointer" }} onClick={() => setSelectedIdx(0)} />
        <rect x="152" y="34" width="66" height="66" fill="#bfe5e3" stroke={selectedIdx === 1 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 1 ? "3" : "2"} style={{ cursor: "pointer" }} onClick={() => setSelectedIdx(1)} />
        <rect x="248" y="50" width="96" height="50" fill="#d8e2f7" stroke={selectedIdx === 2 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 2 ? "3" : "2"} style={{ cursor: "pointer" }} onClick={() => setSelectedIdx(2)} />
        <circle cx="410" cy="68" r="34" fill="#ffd4c7" stroke={selectedIdx === 3 ? "#e85c47" : "#17324d"} strokeWidth={selectedIdx === 3 ? "3" : "2"} style={{ cursor: "pointer" }} onClick={() => setSelectedIdx(3)} />
        <text x="82" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
        <text x="185" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
        <text x="296" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
        <text x="410" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
      </svg>
      <small>{selectedIdx !== null ? SHAPE_FACTS_2D[selectedIdx] : "Tap any shape above to count its sides and corners."}</small>
    </div>
  );
}

function PictureGraph({ question }: { question: Question }) {
  const scaleMatch = question.prompt.match(/each [a-z ]+? stands for (\d+)/i);
  const scale = scaleMatch ? Number(scaleMatch[1]) : 1;
  const namedRows = [...question.prompt.matchAll(/((?:Class|Bus|Shelf|Team|Row) [A-Z]|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|[A-Z][a-z]+)\s+has\s+(\d+)\s+(?:stars?|apple icons?|car icons?|circles?|flower icons?|ball icons?|symbols?|cups?|book icons?|box icons?)/g)];
  const triple = question.prompt.match(/(\d+)\s+([a-z ]+?),\s+(\d+)\s+([a-z ]+?)\s+and\s+(\d+)\s+([a-z ]+?)(?:\.|\s+How|$)/i);
  const pair = question.prompt.match(/(\d+)\s+([a-z ]+?)\s+and\s+(\d+)\s+([a-z ]+?)(?:\.|\s+How|$)/i);
  const single = question.prompt.match(/(?:has|shows)\s+(\d+)\s+(stars?|apple icons?|car icons?|circles?|flower icons?|ball icons?|symbols?|cups?|book icons?|box icons?)/i);
  const rows = namedRows.length >= 2
    ? namedRows.map((m) => ({ count: Number(m[2]), label: m[1] }))
    : triple
      ? [{ count: Number(triple[1]), label: triple[2] }, { count: Number(triple[3]), label: triple[4] }, { count: Number(triple[5]), label: triple[6] }]
      : pair
        ? [{ count: Number(pair[1]), label: pair[2] }, { count: Number(pair[3]), label: pair[4] }]
        : single
          ? [{ count: Number(single[1]), label: single[2] }]
          : [{ count: 4, label: "apples" }, { count: 2, label: "pears" }];
  const colors = ["#ffd4c7", "#cce8c9", "#d8e2f7"];
  return (
    <div className="picture-graph" aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <div key={`${row.label}-${rowIndex}`} data-testid="graph-row"><span>{row.label.charAt(0).toUpperCase() + row.label.slice(1)}</span><div className="graph-dots">{Array.from({ length: Math.min(12, row.count) }, (_, dotIndex) => <i key={dotIndex} data-testid="graph-dot" style={{ background: colors[rowIndex % colors.length] }} />)}</div></div>
      ))}
      <small>Each dot = {scale}</small>
    </div>
  );
}

function centimetres(prompt: string): number[] {
  return [...prompt.matchAll(/(\d+(?:\.\d+)?)\s*cm/g)].map((match) => Number(match[1]));
}

function Ruler({ question }: { question: Question }) {
  const prompt = question.prompt;
  const segment = prompt.match(/(?:starts at|from)\s*(\d+)\s*cm\s*(?:and ends at|to)\s*(\d+)\s*cm/i);
  if (segment) {
    const start = Number(segment[1]);
    const end = Number(segment[2]);
    const max = Math.max(10, Math.ceil(Math.max(start, end) / 10) * 10);
    const left = 20;
    const span = 520;
    const scale = span / max;
    return (
      <div className="ruler-visual" data-testid="ruler-visual" aria-hidden="true">
        <svg className="math-svg ruler-svg" viewBox="0 0 560 82">
          <rect x={left} y="18" width={span} height="48" fill="#ffeab6" stroke="#17324d" strokeWidth="2" />
          <rect className="ruler-segment" x={left + start * scale} y="28" width={(end - start) * scale} height="28" fill="#ffd4c7" stroke="#e85c47" strokeWidth="2" />
          {Array.from({ length: max + 1 }, (_, index) => {
            const x = left + index * scale;
            return (
              <g key={index}>
                <line x1={x} y1="18" x2={x} y2={index % 5 === 0 ? "42" : "32"} stroke="#17324d" strokeWidth="2" />
                {index % 5 === 0 || index === max ? <text x={x} y="64" textAnchor="middle" fontSize="16" fontWeight="800" fill="#17324d">{index}</text> : null}
              </g>
            );
          })}
          {start > 0 && start % 5 !== 0 ? <text x={left + start * scale} y="64" textAnchor="middle" fontSize="16" fontWeight="900" fill="#17324d">{start}</text> : null}
          {end % 5 !== 0 ? <text x={left + end * scale} y="64" textAnchor="middle" fontSize="16" fontWeight="900" fill="#e85c47">{end}</text> : null}
          <text x="540" y="14" textAnchor="end" fontSize="12" fontWeight="800" fill="#17324d">cm</text>
        </svg>
        <small>Read the marked segment on the ruler.</small>
      </div>
    );
  }
  const values = centimetres(prompt);
  if (values.length) {
    const max = Math.max(...values, 1);
    return (
      <div className="length-bars" data-testid="length-bars" aria-hidden="true">
        {values.map((value, index) => (
          <div className="length-bar" key={`${value}-${index}`}>
            <span>{value} cm</span>
            <i style={{ width: `${Math.max(8, (value / max) * 100)}%` }} />
          </div>
        ))}
        <small>Compare the lengths.</small>
      </div>
    );
  }
  return <div className="ruler-visual"><small>0 to 10 cm</small></div>;
}

type UnitMeta = { symbol: string; name: string; property: string };
function unitMeta(label: string): UnitMeta | null {
  const lower = label.toLowerCase();
  if (/kilogram|\bkg\b/.test(lower)) return { symbol: "kg", name: "kilograms", property: "mass" };
  if (/gram|\bg\b/.test(lower)) return { symbol: "g", name: "grams", property: "mass" };
  if (/millilitre|milliliter|\bml\b/.test(lower)) return { symbol: "mL", name: "millilitres", property: "volume" };
  if (/litre|liter|\bl\b/.test(lower)) return { symbol: "L", name: "litres", property: "volume" };
  if (/centimetre|centimeter|\bcm\b/.test(lower)) return { symbol: "cm", name: "centimetres", property: "length" };
  if (/metre|meter|\bm\b/.test(lower)) return { symbol: "m", name: "metres", property: "length" };
  return null;
}

function measurementParts(prompt: string): Array<{ value: string; meta: UnitMeta }> {
  const matches = [...prompt.matchAll(/(\d+(?:\.\d+)?)\s*(kilograms?|kg|grams?|g|millilitres?|ml|litres?|liters?|l|centimetres?|centimeters?|cm|metres?|meters?|m)\b/gi)];
  return matches.map((match) => ({ value: match[1], meta: unitMeta(match[2])! })).filter((item) => item.meta);
}

function Units({ question }: { question: Question }) {
  const prompt = question.prompt;
  const kgToG = /kilograms?|\bkg\b/i.test(prompt) && /\bgrams?\b|\bg\b/i.test(prompt);
  const mToCm = /\bmetres?\b|\bmeters?\b|\bm\b/i.test(prompt) && /\bcentimetres?\b|\bcentimeters?\b|\bcm\b/i.test(prompt);
  const lToMl = /\blitres?\b|\bliters?\b|\bl\b/i.test(prompt) && /\bmillilitres?\b|\bmilliliters?\b|\bml\b/i.test(prompt);
  if (kgToG || mToCm || lToMl) {
    const sourceSymbol = kgToG ? "kg" : mToCm ? "m" : "L";
    const sourceName = kgToG ? "kilograms" : mToCm ? "metres" : "litres";
    const targetName = kgToG ? "grams" : mToCm ? "centimetres" : "millilitres";
    const equivalent = kgToG ? "1000 g" : mToCm ? "100 cm" : "1000 mL";
    const quantity = measurementParts(prompt).find((item) => item.meta.symbol === sourceSymbol);
    const amount = quantity?.value ?? "1";
    return (
      <div className="unit-conversion" data-testid="unit-conversion" aria-hidden="true">
        <span><strong>{amount} {sourceSymbol}</strong><small>{sourceName}</small></span>
        <i>=</i>
        <span><strong>?</strong><small>{targetName}</small></span>
        {amount !== "1" ? <small className="unit-conversion-note">1 {sourceSymbol} = {equivalent}</small> : null}
      </div>
    );
  }
  const quantities = measurementParts(prompt);
  if (quantities.length >= 2) {
    return (
      <div className="unit-cards unit-quantities" data-testid="unit-quantities" aria-hidden="true">
        {quantities.slice(0, 3).map((item, index) => (
          <span key={`${item.value}-${index}`}><strong>{item.value} {item.meta.symbol}</strong><small>{item.meta.property}</small></span>
        ))}
      </div>
    );
  }
  const options = question.kind === "choice" ? question.options.map((option) => unitMeta(option)).filter((item): item is UnitMeta => Boolean(item)) : [];
  const cards = options.length >= 2 ? options : [
    { symbol: "g", name: "grams", property: "mass" },
    { symbol: "kg", name: "kilograms", property: "mass" },
    { symbol: "L", name: "litres", property: "volume" },
    { symbol: "m", name: "metres", property: "length" },
    { symbol: "cm", name: "centimetres", property: "length" }
  ];
  return (
    <div className="unit-cards" data-testid="unit-cards" aria-hidden="true">
      {cards.map((item) => <span key={item.symbol}><strong>{item.symbol}</strong><small>{item.name}</small></span>)}
    </div>
  );
}

function TwoStepTool({ question, hintActive = false }: { question: Question; hintActive?: boolean }) {
  const numbers = question.prompt.match(/\d+/g) ?? [];
  const kind = question.template === "match-two-step"
    ? "Two-step model"
    : question.template === "two-step-money"
      ? "Money model"
      : question.template === "two-step-multiply"
        ? "Array model"
        : numbers.length >= 3
          ? "Two-step model"
          : "Bar model";
  return (
    <div className={`math-tool${hintActive ? " is-hint-focus" : ""}`} role="group" aria-label={`Math tool: ${kind}`}>
      <div className="math-tool-header"><span>Math tool</span><strong>{kind}</strong><small>{hintActive ? "Look here for help" : "Visual helper"}</small></div>
      <div className="math-tool-body">
        {question.template === "match-two-step"
          ? <div className="two-step-strategy" data-testid="two-step-strategy"><p>Work from left to right. Use the first operation, then the second.</p></div>
          : question.template === "two-step-money"
            ? <MoneyBoard question={question} />
            : question.template === "two-step-multiply"
              ? <TwoStepArray question={question} />
              : <TwoStepBar question={question} />}
      </div>
    </div>
  );
}

function OlympiadVisual({ question }: { question: Question }) {
  const prompt = question.prompt;
  const nums = prompt.match(/\d+/g)?.map(Number) ?? [];

  if (question.template === "balance-substitute" || /balance|weighs|★|▲|teapot/i.test(prompt)) {
    const isSymbolEq = /[★▲●■]/.test(prompt);
    return (
      <div className="two-step-model olympiad-balance-board" data-testid="olympiad-balance-board">
        <div className="two-step-row">
          <span className="two-step-node">
            <small>{isSymbolEq ? "Clue 1" : "Scale 1"}</small>
            <strong>{isSymbolEq ? "Same symbols = equal parts" : `1 Big = ${nums[1] ?? 2} Medium`}</strong>
          </span>
          <i aria-hidden="true">⚖️</i>
          <span className="two-step-node">
            <small>{isSymbolEq ? "Clue 2" : "Scale 2"}</small>
            <strong>{isSymbolEq ? "Plug into 2nd equation" : `1 Medium = ${nums[3] ?? nums[2] ?? 3} Small`}</strong>
          </span>
          <i aria-hidden="true">→</i>
          <span className="two-step-node is-answer">
            <small>Substitute</small>
            <strong>?</strong>
          </span>
        </div>
        <p>Olympiad substitution: replace the middle unit step by step to balance the scale.</p>
      </div>
    );
  }

  if (question.template === "queue-logic" || /queue|line|row|sawed|stairs/i.test(prompt)) {
    const isCutOrStair = /sawed|cuts|stairs|floor/i.test(prompt);
    return (
      <div className="two-step-model olympiad-queue-board" data-testid="olympiad-queue-board">
        <div className="two-step-row">
          <span className="two-step-node">
            <small>{isCutOrStair ? "Cuts / Gaps" : "Front"}</small>
            <strong>{nums[0] ?? "A"}</strong>
          </span>
          <i aria-hidden="true">+</i>
          <span className="two-step-node is-answer">
            <small>{isCutOrStair ? "+1 Piece" : "Hero (★)"}</small>
            <strong>1</strong>
          </span>
          {!isCutOrStair ? (
            <>
              <i aria-hidden="true">+</i>
              <span className="two-step-node">
                <small>Back / Rest</small>
                <strong>{nums[1] ?? "B"}</strong>
              </span>
            </>
          ) : null}
          <i aria-hidden="true">=</i>
          <span className="two-step-node is-answer">
            <small>Total</small>
            <strong>?</strong>
          </span>
        </div>
        <p>{isCutOrStair ? "Interval rule: pieces = cuts + 1 (or steps = floor difference)." : "Queue rule: don't forget to count the person in the middle (or subtract 1 if counted twice)!"}</p>
      </div>
    );
  }

  return (
    <div className="two-step-model olympiad-backwards-board" data-testid="olympiad-backwards-board">
      <div className="two-step-row">
        <span className="two-step-node is-answer">
          <small>Start</small>
          <strong>?</strong>
        </span>
        <i aria-hidden="true">⇄</i>
        <span className="two-step-node">
          <small>Change</small>
          <strong>{nums[0] ? `Step (${nums[0]})` : "Flip + / −"}</strong>
        </span>
        <i aria-hidden="true">⇄</i>
        <span className="two-step-node">
          <small>Known End</small>
          <strong>{nums.at(-1) ?? "Result"}</strong>
        </span>
      </div>
      <p>Work backwards from the end: flip addition (+) to subtraction (−) and multiplication (×) to division (÷).</p>
    </div>
  );
}

function ToolVisual({ kind, max, question }: { kind: ToolKind; max: number; question: Question }) {
  if (kind === "place-value") return <PlaceValue question={question} />;
  if (kind === "number-line") return <NumberLine max={max} question={question} />;
  if (kind === "bar-model") return <BarModel question={question} />;
  if (kind === "number-bond") return <NumberBond question={question} />;
  if (kind === "array") return question.skillId === "math-divide-tables" ? <DivisionBoard question={question} /> : <ArrayBoard question={question} />;
  if (kind === "fraction") return <FractionBar question={question} />;
  if (kind === "money") return <MoneyBoard question={question} />;
  if (kind === "clock") return <Clock question={question} />;
  if (kind === "duration") return <DurationVisual question={question} />;
  if (kind === "shapes") return <Shapes question={question} />;
  if (kind === "graph") return <PictureGraph question={question} />;
  if (kind === "ruler") return <Ruler question={question} />;
  if (kind === "counting") return <CountingPictures question={question} />;
  if (kind === "pattern") return <SequenceTool question={question} />;
  if (kind === "olympiad") return <OlympiadVisual question={question} />;
  return <Units question={question} />;
}

export function MathTool({ question, hintActive = false }: { question: Question; defaultOpen?: boolean; hintActive?: boolean }) {
  if (question.skillId === "math-two-step-problems") return <TwoStepTool question={question} hintActive={hintActive} />;
  const skillKind = TOOL_BY_SKILL[question.skillId];
  if (!skillKind) return null;
  const visualKind: ToolKind =
    question.skillId === "k2-math-count-20" && ["count-dots", "k2-count-dots", "compare-groups", "k2-compare-groups"].includes(question.template) ? "counting"
      : question.skillId === "k2-math-count-20" && question.template === "shape-identify" ? "shapes"
      : question.skillId === "k2-math-count-20" && ["k2-number-sequence", "k2-pattern"].includes(question.template) ? "pattern"
      : question.skillId === "math-count-100" && question.template === "number-sequence" ? "pattern"
      : question.skillId === "k2-math-add-within-10" && ["k2-add-pictures", "k2-subtract-pictures"].includes(question.template) ? "counting"
      : question.skillId === "k2-math-add-within-10" && ["k2-add-story", "k2-subtract-story"].includes(question.template) ? "bar-model"
      : skillKind === "number-line" && ["number-bond", "k2-number-bond"].includes(question.template) ? "number-bond"
      : skillKind === "number-line" && (question.template.startsWith("story") || question.template === "multi-step-story" || question.template === "multi-step-regroup") ? "bar-model"
      : skillKind;
  const label = visualKind === "array" && question.skillId === "math-divide-tables"
    ? "Equal groups"
    : visualKind === "fraction" && question.skillId === "math-fractions"
      ? "Fraction model"
      : visualKind === "ruler" && !/(?:starts at|from)\s*\d+\s*cm\s*(?:and ends at|to)\s*\d+\s*cm/i.test(question.prompt)
        ? "Length bars"
        : TOOL_LABEL[visualKind];
  const max = question.skillId === "k2-math-add-within-10" ? 10 : question.skillId === "k2-math-count-20" ? 20 : question.skillId === "math-add-sub-1000" || question.skillId === "math-place-value-1000" ? 1000 : 100;
  if (question.kind === "match" && question.skillId === "math-time") return null;
  const { a, b } = questionNumbers(question.prompt);
  const jumpLine = visualKind === "number-line" && ["math-add-sub-100", "math-add-sub-regroup", "math-add-sub-1000"].includes(question.skillId) && a > 0 && b > 0 && question.kind === "choice";
  return (
    <div className={`math-tool${hintActive ? " is-hint-focus" : ""}`} role="group" aria-label={`Math tool: ${label}`}>
      <div className="math-tool-header"><span>Math tool</span><strong>{label}</strong><small>{hintActive ? "Look here for help" : "Visual helper"}</small></div>
      <div className="math-tool-body">
        <ToolVisual kind={visualKind} max={max} question={question} />
        {jumpLine ? null : visualKind === "number-line" ? <p>Number line: 0 to {max}; each step is {max / 10}</p> : null}
      </div>
    </div>
  );
}
