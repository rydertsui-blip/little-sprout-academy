import type { ChoiceQuestion, Skill } from "../lib/types";
import { createContentAudit } from "./audit";

function uniqueOptions(answer: string, distractors: string[]): string[] {
  const seen = new Set([answer]);
  return [answer, ...distractors.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  })].slice(0, 3);
}

function makeMathQuestion(skill: Skill, index: number, prompt: string, answer: string, distractors: string[], explanation: string, template: string): ChoiceQuestion {
  return {
    id: `q-${skill.id}-${index + 1}`,
    subject: "math",
    skillId: skill.id,
    kind: "choice",
    prompt,
    instruction: "Tap the correct answer.",
    options: uniqueOptions(answer, distractors),
    correctAnswer: answer,
    explanation,
    difficulty: index < 2 ? 1 : index < 4 ? 2 : 3,
    template,
    diagnostic: false,
    reviewStatus: "verified",
    audit: createContentAudit(skill),
    audioText: prompt,
    audioLanguage: "en-US"
  };
}

const numericDistractors = (answer: number) => [answer - 1, answer + 1, answer + 10].map(String);

export function buildMathQuestions(skill: Skill): ChoiceQuestion[] {
  const q: ChoiceQuestion[] = [];
  switch (skill.id) {
    case "math-count-100": {
      const data = [[37, "How many tens are in 37?"], [46, "How many tens are in 46?"], [58, "How many tens are in 58?"], [63, "How many tens are in 63?"], [72, "How many tens are in 72?"], [84, "How many tens are in 84?"]];
      data.forEach(([n, prompt], index) => {
        const answer = Math.floor(Number(n) / 10);
        q.push(makeMathQuestion(skill, index, String(prompt), String(answer), numericDistractors(answer), `${n} has ${answer} tens and ${Number(n) % 10} ones.`, "place-value"));
      });
      break;
    }
    case "math-place-value-1000": {
      const data = [[428, "hundreds"], [635, "tens"], [702, "hundreds"], [814, "ones"], [350, "tens"], [296, "ones"]];
      data.forEach(([n, place], index) => {
        const digits = String(n).padStart(3, "0").split("").map(Number);
        const answer = ({ hundreds: digits[0], tens: digits[1], ones: digits[2] } as Record<string, number>)[String(place)];
        q.push(makeMathQuestion(skill, index, `What is the ${place} digit in ${n}?`, String(answer), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d !== answer).slice(0, 3).map(String), `In ${n}, the ${place} digit is ${answer}.`, "digit-place"));
      });
      break;
    }
    case "math-add-sub-100": {
      const data: Array<[number, "+" | "-", number, number]> = [[23, "+", 14, 37], [52, "+", 31, 83], [67, "-", 32, 35], [84, "-", 51, 33], [45, "+", 23, 68], [79, "-", 26, 53]];
      data.forEach(([a, op, b, answer], index) => q.push(makeMathQuestion(skill, index, `${a} ${op} ${b} = ?`, String(answer), [answer - 2, answer + 2, answer + 10].map(String), `Start with ${a}, then ${op === "+" ? "add" : "subtract"} ${b}. The answer is ${answer}.`, op === "+" ? "addition" : "subtraction")));
      break;
    }
    case "math-add-sub-regroup": {
      const data: Array<[number, "+" | "-", number, number]> = [[28, "+", 17, 45], [43, "+", 29, 72], [52, "-", 27, 25], [81, "-", 46, 35], [36, "+", 45, 81], [64, "-", 38, 26]];
      data.forEach(([a, op, b, answer], index) => q.push(makeMathQuestion(skill, index, `${a} ${op} ${b} = ?`, String(answer), [answer - 1, answer + 1, answer + 10].map(String), `Regroup when needed. ${a} ${op} ${b} = ${answer}.`, "regrouping")));
      break;
    }
    case "math-add-sub-1000": {
      const data: Array<[number, "+" | "-", number, number]> = [[238, "+", 341, 579], [507, "+", 182, 689], [846, "-", 312, 534], [765, "-", 238, 527], [419, "+", 276, 695], [903, "-", 468, 435]];
      data.forEach(([a, op, b, answer], index) => q.push(makeMathQuestion(skill, index, `${a} ${op} ${b} = ?`, String(answer), [answer - 10, answer + 10, answer + 100].map(String), `Align hundreds, tens and ones. The answer is ${answer}.`, "three-digit")));
      break;
    }
    case "math-multiply-tables": {
      const data = [[2, 4], [3, 5], [4, 3], [5, 6], [10, 4], [2, 9]];
      data.forEach(([a, b], index) => {
        const answer = a * b;
        q.push(makeMathQuestion(skill, index, `${a} × ${b} = ?`, String(answer), [answer + a, Math.max(0, answer - a), answer + 2].map(String), `${a} groups of ${b} make ${answer}.`, "multiplication"));
      });
      break;
    }
    case "math-divide-tables": {
      const data = [[8, 2], [15, 3], [16, 4], [10, 5], [18, 2], [20, 10]];
      data.forEach(([product, divisor], index) => {
        const answer = product / divisor;
        q.push(makeMathQuestion(skill, index, `${product} ÷ ${divisor} = ?`, String(answer), [answer + 1, Math.max(0, answer - 1), answer + 2].map(String), `${divisor} × ${answer} = ${product}, so ${product} ÷ ${divisor} = ${answer}.`, "division"));
      });
      break;
    }
    case "math-fractions": {
      const data = [[4, "one quarter"], [3, "one third"], [5, "one fifth"], [6, "one sixth"], [2, "one half"], [8, "one eighth"]];
      data.forEach(([parts, phrase], index) => q.push(makeMathQuestion(skill, index, `A whole is cut into ${parts} equal parts. One part is ___ of the whole.`, String(phrase), ["one half", "one quarter", "two thirds", "three quarters"], `One of ${parts} equal parts is ${phrase}.`, "unit-fraction")));
      break;
    }
    case "math-money": {
      const data = [[3, 50, 350], [2, 20, 220], [5, 5, 505], [1, 80, 180], [4, 25, 425], [7, 10, 710]];
      data.forEach(([dollars, cents, total], index) => q.push(makeMathQuestion(skill, index, `$${dollars}.${String(cents).padStart(2, "0")} is how many cents?`, String(total), [total - 10, total + 10, total + 100].map(String), `$${dollars} is ${dollars * 100} cents, plus ${cents} cents makes ${total} cents.`, "money")));
      break;
    }
    case "math-time": {
      const data = [[7, 35], [9, 10], [2, 45], [11, 25], [6, 50], [4, 5]];
      data.forEach(([hour, minute], index) => q.push(makeMathQuestion(skill, index, `On a digital clock, ${hour}:${String(minute).padStart(2, "0")} is ${hour} o'clock and how many minutes?`, String(minute), [minute - 5, minute + 5, hour].filter((n) => n >= 0 && n <= 59).map(String), `${hour}:${String(minute).padStart(2, "0")} means ${minute} minutes after ${hour} o'clock.`, "time")));
      break;
    }
    case "math-shapes": {
      const data = [
        ["How many sides does a triangle have?", "3", ["4", "2"]],
        ["How many sides does a square have?", "4", ["3", "5"]],
        ["Which shape has no straight sides?", "circle", ["square", "triangle"]],
        ["Which 3D shape can roll?", "cylinder", ["cube", "cuboid"]],
        ["How many faces does a cube have?", "6", ["4", "8"]],
        ["Which shape has 3 sides?", "triangle", ["circle", "rectangle"]]
      ] as const;
      data.forEach(([prompt, answer, distractors], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], `The correct answer is ${answer}.`, "shape-property")));
      break;
    }
    case "math-picture-graph": {
      const data = [[4, 2, "apples", "pears"], [5, 3, "stars", "moons"], [7, 4, "red cars", "blue cars"], [6, 2, "birds", "fish"], [8, 5, "books", "pencils"], [9, 3, "flowers", "leaves"]];
      data.forEach(([a, b, first, second], index) => {
        const answer = Number(a) - Number(b);
        q.push(makeMathQuestion(skill, index, `A picture graph shows ${a} ${first} and ${b} ${second}. How many more ${first} are there?`, String(answer), [answer + 1, answer + 2, Number(a) + Number(b)].map(String), `${a} − ${b} = ${answer}. There are ${answer} more ${first}.`, "graph-compare"));
      });
      break;
    }
    case "math-length-measure": {
      const data = [
        ["A ribbon starts at 0 cm and ends at 7 cm. How long is the ribbon?", "7 cm", ["6 cm", "8 cm"], "The ribbon is 7 cm long.", "length-measure"],
        ["Which length is the longest?", "8 cm", ["3 cm", "5 cm"], "8 cm is longer than 3 cm and 5 cm.", "length-compare"],
        ["A 6 cm line is extended by 2 cm. How long is the line now?", "8 cm", ["4 cm", "9 cm"], "6 cm + 2 cm = 8 cm.", "length-change"],
        ["A 12 cm strip has 4 cm cut off. How much remains?", "8 cm", ["7 cm", "9 cm"], "12 cm − 4 cm = 8 cm.", "length-change"],
        ["A line is 9 cm long. Another line is 3 cm shorter. How long is the shorter line?", "6 cm", ["7 cm", "12 cm"], "9 cm − 3 cm = 6 cm.", "length-compare"],
        ["A book edge is 18 cm and a pencil is 15 cm. Which is shorter?", "the pencil", ["the book edge", "both are equal"], "15 cm is shorter than 18 cm, so the pencil is shorter.", "length-compare"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], explanation, template)));
      break;
    }
    case "math-fractions-add-sub": {
      const data = [
        ["1/5 + 2/5 = ?", "3/5", ["2/5", "3/10"], "Add the numerators and keep the denominator: 1 + 2 = 3, so 1/5 + 2/5 = 3/5.", "fraction-add-sub"],
        ["3/7 + 2/7 = ?", "5/7", ["1/7", "5/14"], "Keep the denominator: 3 + 2 = 5, so 3/7 + 2/7 = 5/7.", "fraction-add-sub"],
        ["4/9 − 1/9 = ?", "3/9", ["5/9", "3/0"], "Subtract the numerators and keep the denominator: 4 − 1 = 3, so 4/9 − 1/9 = 3/9.", "fraction-add-sub"],
        ["5/8 − 2/8 = ?", "3/8", ["7/8", "3/16"], "Keep the denominator: 5 − 2 = 3, so 5/8 − 2/8 = 3/8.", "fraction-add-sub"],
        ["2/6 + 3/6 = ?", "5/6", ["1/6", "5/12"], "Keep the denominator: 2 + 3 = 5, so 2/6 + 3/6 = 5/6.", "fraction-add-sub"],
        ["6/10 − 4/10 = ?", "2/10", ["10/10", "2/20"], "Keep the denominator: 6 − 4 = 2, so 6/10 − 4/10 = 2/10.", "fraction-add-sub"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], explanation, template)));
      break;
    }
    case "math-measurement-units": {
      const data = [
        ["Which unit is best for the mass of an apple?", "grams", ["litres", "metres"], "Mass is measured in grams or kilograms, so an apple can be measured in grams.", "measurement-unit"],
        ["1 kilogram is equal to how many grams?", "1000 grams", ["100 grams", "10 grams"], "1 kilogram = 1000 grams.", "unit-conversion"],
        ["Which unit is best for the volume of water in a bottle?", "litres", ["kilograms", "centimetres"], "Liquid volume is measured in litres.", "measurement-unit"],
        ["A bag of rice is 5 kg and a bag of flour is 3 kg. Which bag is heavier?", "the rice", ["the flour", "both are equal"], "5 kg is heavier than 3 kg, so the rice is heavier.", "measurement-compare"],
        ["A pail holds 8 litres and a bottle holds 2 litres. How many more litres does the pail hold?", "6 litres", ["4 litres", "10 litres"], "8 litres − 2 litres = 6 litres.", "measurement-change"],
        ["3 kg plus 2 kg is how many kilograms?", "5 kg", ["1 kg", "6 kg"], "3 kg + 2 kg = 5 kg.", "measurement-change"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], explanation, template)));
      break;
    }
  }
  return q;
}
