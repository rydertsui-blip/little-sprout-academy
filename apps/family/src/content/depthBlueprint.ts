import { SKILLS } from "./skills";
import type { Subject } from "../lib/types";

export interface SkillDepthBlueprint {
  skillId: string;
  subject: Subject;
  targetItemCount: number;
  minTemplateFamilies: number;
  minResponseModes: number;
  requiredTemplateFamilies: string[];
}

function blueprint(
  skillId: string,
  subject: Subject,
  targetItemCount: number,
  requiredTemplateFamilies: string[],
  minTemplateFamilies = requiredTemplateFamilies.length
): SkillDepthBlueprint {
  return { skillId, subject, targetItemCount, minTemplateFamilies, minResponseModes: 2, requiredTemplateFamilies };
}

export const SKILL_DEPTH_BLUEPRINTS: SkillDepthBlueprint[] = [
  blueprint("k2-math-count-20", "math", 12, ["k2-count-dots", "k2-compare-number", "k2-number-sequence"]),
  blueprint("k2-math-add-within-10", "math", 12, ["k2-add-pictures", "k2-subtract-pictures", "k2-number-bond"]),
  blueprint("math-count-100", "math", 18, ["place-value", "number-sequence", "compare-order", "tens-ones"]),
  blueprint("math-place-value-1000", "math", 18, ["digit-place", "expanded-form", "digit-value"]),
  blueprint("math-add-sub-100", "math", 18, ["addition", "subtraction", "number-bond", "story-change"]),
  blueprint("math-two-step-problems", "math", 12, ["two-step-add-sub", "two-step-multiply", "two-step-money"]),
  blueprint("math-add-sub-regroup", "math", 18, ["regrouping", "place-value-trade", "algorithm-step"]),
  blueprint("math-add-sub-1000", "math", 18, ["three-digit", "column-operation", "decomposition"]),
  blueprint("math-multiply-tables", "math", 18, ["multiplication", "equal-groups", "array", "fact-family"]),
  blueprint("math-divide-tables", "math", 18, ["division", "equal-sharing", "array-inverse"]),
  blueprint("math-fractions", "math", 18, ["unit-fraction", "fraction-of-set", "fraction-words"]),
  blueprint("math-money", "math", 18, ["money", "amount-identify", "compare-pay"]),
  blueprint("math-time", "math", 18, ["time", "clock-read", "duration"]),
  blueprint("math-time-duration", "math", 18, ["time-duration", "time-change", "time-convert"]),
  blueprint("math-shapes", "math", 12, ["shape-property", "shape-identify", "shape-classify"]),
  blueprint("math-picture-graph", "math", 18, ["graph-compare", "graph-read", "graph-question"]),
  blueprint("math-length-measure", "math", 18, ["length-measure", "length-compare", "length-change"]),
  blueprint("math-fractions-add-sub", "math", 18, ["fraction-add-sub", "visual-bar", "fraction-story"]),
  blueprint("math-measurement-units", "math", 18, ["measurement-unit", "unit-select", "unit-convert"], 3),
  blueprint("math-scaled-picture-graph", "math", 18, ["scaled-graph-read", "scaled-graph-compare", "scaled-graph-total"]),
  blueprint("math-number-patterns-1000", "math", 18, ["odd-even-identify", "pattern-1000", "mixed-mul-add"]),
  blueprint("math-olympiad-reasoning", "math", 18, ["balance-substitute", "queue-logic", "work-backwards"]),
  blueprint("k2-mandarin-listen", "mandarin", 12, ["listen-animal", "listen-color", "listen-number"]),
  blueprint("k2-mandarin-vocabulary", "mandarin", 12, ["category-word", "context-word", "meaning"]),
  blueprint("mandarin-initials", "mandarin", 18, ["initial", "initial-family", "picture-initial", "same-initial"]),
  blueprint("mandarin-finals", "mandarin", 12, ["final", "final-family", "picture-final"]),
  blueprint("mandarin-tones", "mandarin", 18, ["tone", "tone-mark", "same-different-tone"]),
  blueprint("mandarin-syllables", "mandarin", 12, ["syllable", "complete-pinyin", "tone-base-combine"]),
  blueprint("mandarin-characters", "mandarin", 18, ["meaning-character", "character-word", "radical-shape"]),
  blueprint("mandarin-vocabulary", "mandarin", 12, ["meaning", "context-word", "category-word"]),
  blueprint("mandarin-reading", "mandarin", 12, ["who", "object", "sequence", "inference-word"], 3),
  blueprint("mandarin-reading-inference", "mandarin", 18, ["feeling", "why", "next"]),
  blueprint("mandarin-listening", "mandarin", 12, ["listen-where", "listen-action", "listen-object"]),
  blueprint("mandarin-classifiers", "mandarin", 12, ["classifier", "phrase-complete", "picture-sort"]),
  blueprint("mandarin-word-order", "mandarin", 12, ["sentence-order", "missing-word", "conversation-order"]),
  blueprint("mandarin-radicals-homographs", "mandarin", 18, ["radical-meaning", "homograph-cloze", "radical-family"]),
  blueprint("mandarin-synonyms-collocations", "mandarin", 18, ["synonym-word", "antonym-word", "word-collocation"]),
  blueprint("mandarin-conjunctions-complex", "mandarin", 18, ["conjunction-cloze", "complex-clause", "sequence-clauses"]),
  blueprint("mandarin-passage-comprehension", "mandarin", 18, ["passage-main-idea", "passage-cause", "passage-lesson"]),
  blueprint("mandarin-idioms-classics", "mandarin", 18, ["idiom-meaning", "idiom-story-cloze", "classic-poem"]),
  blueprint("k2-english-listen", "english", 12, ["listen-animal", "listen-color", "listen-number"]),
  blueprint("k2-english-letters", "english", 12, ["letter-case", "alphabet-order", "beginning-letter"]),
  blueprint("english-letters", "english", 12, ["beginning-letter", "letter-name", "letter-case"]),
  blueprint("english-listening", "english", 18, ["listen-find"], 1),
  blueprint("english-listening-comprehension", "english", 18, ["listen-inference", "listen-where"]),
  blueprint("english-phonics", "english", 18, ["initial-sound", "rhyme", "word-family"]),
  blueprint("english-sight-words", "english", 18, ["cloze", "sentence-word", "word-choice"]),
  blueprint("english-vocabulary", "english", 12, ["picture-word", "category-word", "word-meaning"]),
  blueprint("english-a-an", "english", 12, ["article"], 1),
  blueprint("english-plural", "english", 12, ["plural"], 1),
  blueprint("english-sentence-order", "english", 18, ["sentence-order"], 1),
  blueprint("english-reading", "english", 12, ["literal"], 1),
  blueprint("english-reading-inference", "english", 12, ["inference", "sequence", "why"]),
  blueprint("english-spelling", "english", 12, ["spelling"], 1),
  blueprint("english-tenses-agreement", "english", 18, ["subject-verb-agreement", "present-continuous", "past-tense"]),
  blueprint("english-prepositions-connectors", "english", 18, ["preposition-place", "connector-clause", "preposition-time"]),
  blueprint("english-pronouns-questions", "english", 18, ["pronoun-case", "possessive-pronoun", "wh-question-word"]),
  blueprint("english-cloze-passage", "english", 18, ["grammar-cloze", "vocabulary-cloze", "connector-cloze"]),
  blueprint("english-science-nature", "english", 18, ["life-cycle", "plant-weather", "science-experiment"])
];

const BLUEPRINT_BY_ID = new Map(SKILL_DEPTH_BLUEPRINTS.map((item) => [item.skillId, item]));

export function getDepthBlueprint(skillId: string): SkillDepthBlueprint {
  const found = BLUEPRINT_BY_ID.get(skillId);
  if (!found) throw new Error(`Unknown skill blueprint: ${skillId}`);
  return found;
}

export function missingDepthBlueprints(): string[] {
  return SKILLS.map((skill) => skill.id).filter((id) => !BLUEPRINT_BY_ID.has(id));
}
