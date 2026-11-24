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
  | "units";

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
  "math-length-measure": "ruler",
  "math-measurement-units": "units"
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
  "units": "Unit reference"
};

function PlaceValue({ question }: { question: Question }) {
  if (question.skillId !== "math-place-value-1000") {
    return (
      <div className="place-value-blocks" aria-hidden="true">
        <div className="place-column"><strong>Hundreds</strong><span className="block-hundred" /><small>100</small></div>
        <div className="place-column"><strong>Tens</strong><span className="block-ten" /><small>10</small></div>
        <div className="place-column"><strong>Ones</strong><span className="block-one" /><small>1</small></div>
      </div>
    );
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
  if (["math-add-sub-regroup", "math-add-sub-1000"].includes(question.skillId)) {
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
  const subtract = /[−-]|taken away|remain|lost|left|fewer/i.test(question.prompt);
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

function NumberBond({ question }: { question: Question }) {
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
  const first = equation ? Number(equation[1]) : 4;
  const second = equation ? Number(equation[2]) : 5;
  const isDivision = /÷|\//.test(question.prompt);
  const groups = isDivision ? first / second : first;
  const perGroup = second;
  const usable = Boolean(equation) && Number.isInteger(groups) && groups > 0 && groups <= 10 && perGroup > 0 && perGroup <= 10;
  const rows = usable ? groups : 4;
  const columns = usable ? perGroup : 5;
  const caption = question.kind === "match" || !equation || !usable ? "An array shows equal rows and columns" : `${rows} groups of ${columns}`;
  return (
    <div className="array-board" aria-hidden="true">
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
  const story = question.prompt.match(/(\d+)\s+cookies\s+are\s+shared\s+equally\s+into\s+(\d+)\s+boxes/i);
  let total = 0;
  let groups = 0;
  let eaten = 0;
  if (story) {
    total = Number(story[1]);
    groups = Number(story[2]);
    eaten = Number(question.prompt.match(/(\d+)\s+cookies\s+are\s+eaten/i)?.[1] ?? 0);
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
    return (
      <div className="fraction-whole-board" data-testid="fraction-whole-board" aria-hidden="true">
        <svg viewBox="0 0 520 64" role="img" aria-label="Equal parts">
          {Array.from({ length: denominator }, (_, section) => (
            <rect key={section} x={section * (520 / denominator)} y="8" width={520 / denominator} height="48" fill={eaten && section < eaten ? "#f4a7a0" : section < shaded ? "#f4b84b" : "#fffdf8"} stroke="#17324d" strokeWidth="2" />
          ))}
        </svg>
        <small>{askParts ? "How many equal parts?" : eaten ? `${eaten} of ${denominator} slices eaten` : "One part is shaded."}</small>
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
  return (
    <div className="fraction-pairs" data-testid="fraction-pairs" aria-hidden="true">
      {shown.map(([numerator, denominator], index) => (
        <div className="fraction-card" data-testid="fraction-card" data-fraction={`${numerator}/${denominator}`} key={`${numerator}-${denominator}-${index}`}>
          <svg viewBox="0 0 520 64" role="img" aria-label={`${numerator} out of ${denominator} shaded`}>
            {Array.from({ length: denominator }, (_, section) => (
              <rect key={section} x={section * (520 / denominator)} y="8" width={520 / denominator} height="48" fill={section < numerator ? (takeAway && index === 1 ? "#f4a7a0" : "#f4b84b") : "#fffdf8"} stroke="#17324d" strokeWidth="2" />
            ))}
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

function moneyAmounts(prompt: string): number[] {
  return [...prompt.matchAll(/\$(\d+)(?:\.(\d{2}))?/g)].map((match) => Number(match[1]) * 100 + Number(match[2] ?? 0));
}

function MoneyBoard({ question }: { question: Question }) {
  const amounts = moneyAmounts(question.prompt);
  const asksForCents = /how many cents|in cents|cents/i.test(question.prompt);
  const comparesOrChanges = /change|more|less|than/i.test(question.prompt);
  if (amounts.length >= 2 && comparesOrChanges) {
    const larger = Math.max(...amounts);
    const smaller = Math.min(...amounts);
    return (
      <div className="money-equation" data-testid="money-tool" aria-hidden="true">
        <span><small>{/change/i.test(question.prompt) ? "Pay" : "Larger"}</small><strong>{formatMoney(larger)}</strong></span>
        <i>−</i>
        <span><small>{/change/i.test(question.prompt) ? "Cost" : "Smaller"}</small><strong>{formatMoney(smaller)}</strong></span>
        <i>=</i><b>?</b>
      </div>
    );
  }
  if (amounts.length === 1 && asksForCents) {
    return (
      <div className="money-amount" data-testid="money-tool" aria-hidden="true">
        <small>Amount</small>
        <strong>{formatMoney(amounts[0])}</strong>
        <span>? cents</span>
      </div>
    );
  }
  if (amounts.length === 1) {
    return (
      <div className="money-amount" data-testid="money-tool" aria-hidden="true">
        <small>Amount</small>
        <strong>{formatMoney(amounts[0])}</strong>
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
          return <line key={index} x1={100 + 66 * Math.sin(angle)} y1={100 - 66 * Math.cos(angle)} x2={100 + 72 * Math.sin(angle)} y2={100 - 72 * Math.cos(angle)} stroke="#17324d" strokeWidth="2" />;
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

function Shapes() {
  return (
    <svg className="math-svg shapes-svg" viewBox="0 0 520 132" aria-hidden="true">
      <polygon points="42,96 82,28 122,96" fill="#ffe3a4" stroke="#17324d" strokeWidth="2" />
      <rect x="152" y="34" width="66" height="66" fill="#bfe5e3" stroke="#17324d" strokeWidth="2" />
      <rect x="248" y="50" width="96" height="50" fill="#d8e2f7" stroke="#17324d" strokeWidth="2" />
      <circle cx="410" cy="68" r="34" fill="#ffd4c7" stroke="#17324d" strokeWidth="2" />
      <text x="82" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
      <text x="185" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
      <text x="296" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
      <text x="410" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#17324d">?</text>
    </svg>
  );
}

function PictureGraph({ question }: { question: Question }) {
  const triple = question.prompt.match(/(\d+)\s+([a-z ]+?),\s+(\d+)\s+([a-z ]+?)\s+and\s+(\d+)\s+([a-z ]+?)(?:\.|\s+How|$)/i);
  const pair = question.prompt.match(/(\d+)\s+([a-z ]+?)\s+and\s+(\d+)\s+([a-z ]+?)(?:\.|\s+How|$)/i);
  const rows = triple
    ? [{ count: Number(triple[1]), label: triple[2] }, { count: Number(triple[3]), label: triple[4] }, { count: Number(triple[5]), label: triple[6] }]
    : pair
      ? [{ count: Number(pair[1]), label: pair[2] }, { count: Number(pair[3]), label: pair[4] }]
      : [{ count: 4, label: "apples" }, { count: 2, label: "pears" }];
  const colors = ["#ffd4c7", "#cce8c9", "#d8e2f7"];
  return (
    <div className="picture-graph" aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <div key={`${row.label}-${rowIndex}`} data-testid="graph-row"><span>{row.label.charAt(0).toUpperCase() + row.label.slice(1)}</span><div className="graph-dots">{Array.from({ length: row.count }, (_, dotIndex) => <i key={dotIndex} data-testid="graph-dot" style={{ background: colors[rowIndex % colors.length] }} />)}</div></div>
      ))}
      <small>Each dot = 1</small>
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
  const kgToG = /kilogram|kg/i.test(prompt) && /gram|\bg\b/i.test(prompt);
  const mToCm = /metre|meter|\bm\b/i.test(prompt) && /centimetre|centimeter|\bcm\b/i.test(prompt);
  const lToMl = /litre|liter|\bl\b/i.test(prompt) && /millilitre|\bml\b/i.test(prompt);
  if (kgToG || mToCm || lToMl) {
    const left = kgToG ? "1 kg" : mToCm ? "1 m" : "1 L";
    const right = kgToG ? "1000 g" : mToCm ? "100 cm" : "1000 mL";
    const asksOne = /1\s*(?:kilogram|kg|metre|meter|m|litre|liter|l)\b.*(?:equal|how many)/i.test(prompt) || /how many .* (?:in|is|are) 1\b/i.test(prompt);
    return (
      <div className="unit-conversion" data-testid="unit-conversion" aria-hidden="true">
        <span><strong>{left}</strong><small>{kgToG ? "kilograms" : mToCm ? "metres" : "litres"}</small></span>
        <i>=</i>
        <span><strong>{asksOne ? "?" : right}</strong><small>{kgToG ? "grams" : mToCm ? "centimetres" : "millilitres"}</small></span>
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
  if (kind === "shapes") return <Shapes />;
  if (kind === "graph") return <PictureGraph question={question} />;
  if (kind === "ruler") return <Ruler question={question} />;
  return <Units question={question} />;
}

const TOOL_CAPTION: Partial<Record<ToolKind, string>> = {
  "place-value": "Example: 1 hundred, 1 ten and 1 one"
};

export function MathTool({ question }: { question: Question }) {
  const skillKind = TOOL_BY_SKILL[question.skillId];
  if (!skillKind) return null;
  const visualKind: ToolKind = skillKind === "number-line" && question.template === "number-bond"
    ? "number-bond"
    : skillKind === "number-line" && question.template.startsWith("story")
      ? "bar-model"
      : skillKind;
  const label = visualKind === "array" && question.skillId === "math-divide-tables"
    ? "Equal groups"
    : visualKind === "fraction" && question.skillId === "math-fractions"
      ? "Fraction model"
      : visualKind === "ruler" && !/(?:starts at|from)\s*\d+\s*cm\s*(?:and ends at|to)\s*\d+\s*cm/i.test(question.prompt)
        ? "Length bars"
        : TOOL_LABEL[visualKind];
  const max = question.skillId === "k2-math-add-within-10" ? 10 : question.skillId === "k2-math-count-20" ? 20 : question.skillId === "math-add-sub-1000" || question.skillId === "math-place-value-1000" ? 1000 : 100;
  const jumpLine = visualKind === "number-line" && ["math-add-sub-regroup", "math-add-sub-1000"].includes(question.skillId);
  const dynamicPlaceValue = visualKind === "place-value" && question.skillId === "math-place-value-1000";
  const dynamicDivision = visualKind === "array" && question.skillId === "math-divide-tables";
  return (
    <details className="math-tool" aria-label={`Math tool: ${label}`} open>
      <summary><span>Math tool</span><strong>{label}</strong><small>Open or close</small></summary>
      <div className="math-tool-body">
        <ToolVisual kind={visualKind} max={max} question={question} />
        {jumpLine ? null : visualKind === "number-line" ? <p>Number line: 0 to {max}; each step is {max / 10}</p> : null}
        {TOOL_CAPTION[visualKind] && !dynamicPlaceValue ? <p>{TOOL_CAPTION[visualKind]}</p> : null}
        {["clock", "duration", "fraction", "graph", "money", "ruler", "units"].includes(visualKind) || jumpLine || dynamicPlaceValue || dynamicDivision ? null : <p>Example model. Compare it with the question.</p>}
      </div>
    </details>
  );
}
