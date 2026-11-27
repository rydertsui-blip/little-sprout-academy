import type { ChoiceQuestion, Skill, TransferLevel } from "../lib/types";
import { createContentAudit } from "./audit";

interface MathDepthSeed {
  prompt: string;
  answer: string;
  distractors: string[];
  explanation: string;
  template: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

function uniqueOptions(answer: string, distractors: string[]): string[] {
  const seen = new Set([answer]);
  return [answer, ...distractors.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  })].slice(0, 3);
}

function makeMathQuestion(skill: Skill, index: number, prompt: string, answer: string, distractors: string[], explanation: string, template: string, explicitDifficulty?: 1 | 2 | 3 | 4 | 5): ChoiceQuestion {
  const transferLevel: TransferLevel = /story|change|share|graph|daily|money/.test(template) ? "near-transfer" : "same-context";
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
    difficulty: explicitDifficulty ?? (index < 2 ? 1 : index < 4 ? 2 : 3),
    template,
    transferLevel,
    contextKey: template,
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
    case "k2-math-count-20": {
      const data = [
        ["How many dots are there? ●●●", "3", ["2", "4"], "There are 3 dots.", "k2-count-dots"],
        ["How many stars are there? ★★★★★", "5", ["4", "6"], "There are 5 stars.", "k2-count-dots"],
        ["Which number is greater, 7 or 12?", "12", ["7", "10"], "12 is greater than 7.", "k2-compare-number"],
        ["Which number is smaller, 9 or 14?", "9", ["14", "10"], "9 is smaller than 14.", "k2-compare-number"],
        ["Which number comes after 8?", "9", ["7", "10"], "Counting on from 8 gives 9.", "k2-number-sequence"],
        ["Which number is missing? 11, 12, __, 14", "13", ["10", "15"], "The missing number is 13.", "k2-number-sequence"],
        ["Count by 2s: 2, 4, 6, __", "8", ["7", "9"], "The pattern adds 2 each time, so the next number is 8.", "k2-pattern"],
        ["What comes next? red, blue, red, blue, __", "red", ["blue", "green"], "The colours repeat red, blue, red, blue, so the next colour is red.", "k2-pattern"],
        ["Which number comes before 13?", "12", ["14", "11"], "Counting back from 13 gives 12.", "k2-number-sequence"],
        ["Which number is 2 more than 15?", "17", ["16", "18"], "Two more than 15 is 17.", "k2-number-sequence"],
        ["Which group has more? ●●● or ●●●●●", "5 dots", ["3 dots", "both are equal"], "5 dots is more than 3 dots.", "k2-compare-groups"],
        ["Which number is 1 more than 14?", "15", ["13", "16"], "One more than 14 is 15.", "k2-number-sequence"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], explanation, template)));
      break;
    }
    case "k2-math-add-within-10": {
      const data = [
        ["How many altogether? ●●● + ●●", "5", ["4", "6"], "3 dots and 2 dots make 5 dots.", "k2-add-pictures"],
        ["How many altogether? ●●●● + ●", "5", ["4", "6"], "4 dots and 1 dot make 5 dots.", "k2-add-pictures"],
        ["How many are left? ●●●●● − ●●", "3", ["2", "4"], "5 dots take away 2 dots leaves 3 dots.", "k2-subtract-pictures"],
        ["How many are left? ●●●●●● − ●●●", "3", ["2", "4"], "6 dots take away 3 dots leaves 3 dots.", "k2-subtract-pictures"],
        ["Which number bond makes 8? 3 + ___", "5", ["4", "6"], "3 and 5 make 8.", "k2-number-bond"],
        ["Which number bond makes 10? 6 + ___", "4", ["3", "5"], "6 and 4 make 10.", "k2-number-bond"],
        ["Which number is 1 more than 7?", "8", ["6", "9"], "One more than 7 is 8.", "k2-one-more-less"],
        ["Which number is 1 less than 9?", "8", ["9", "10"], "One less than 9 is 8.", "k2-one-more-less"],
        ["2 + 3 = ?", "5", ["4", "6"], "2 and 3 make 5.", "k2-add-equation"],
        ["7 − 4 = ?", "3", ["2", "4"], "7 take away 4 leaves 3.", "k2-subtract-equation"],
        ["There are 6 ducks. 2 swim away. How many ducks are left?", "4", ["3", "5"], "6 − 2 = 4 ducks.", "k2-subtract-story"],
        ["There are 4 red cars and 3 blue cars. How many cars are there?", "7", ["6", "8"], "4 + 3 = 7 cars.", "k2-add-story"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], explanation, template)));
      break;
    }
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
    case "math-two-step-problems": {
      const data = [
        ["A shop has 45 apples. It sells 18, then gets 12 more. How many apples are there now?", 39, [37, 75], "45 − 18 = 27, then 27 + 12 = 39.", "two-step-add-sub"],
        ["Ben has 36 stickers. He gives 14 away, then gets 9 more. How many stickers does he have now?", 31, [29, 59], "36 − 14 = 22, then 22 + 9 = 31.", "two-step-add-sub"],
        ["A bus has 58 people. 23 get off, then 15 get on. How many people are on the bus now?", 50, [48, 96], "58 − 23 = 35, then 35 + 15 = 50.", "two-step-add-sub"],
        ["Lina has a 30-page book. She reads 12 pages on Monday and 9 pages on Tuesday. How many pages are left?", 9, [11, 21], "12 + 9 = 21 pages read, then 30 − 21 = 9 pages left.", "two-step-add-sub"],
        ["There are 24 chairs in a room. 9 chairs are used, then 6 more chairs are brought in. How many empty chairs are there now?", 21, [15, 30], "24 − 9 = 15 empty chairs, then 15 + 6 = 21 empty chairs.", "two-step-add-sub"],
        ["A farmer has 16 eggs. He collects 7 more, then sells 5. How many eggs does he have now?", 18, [16, 23], "16 + 7 = 23, then 23 − 5 = 18.", "two-step-add-sub"],
        ["There are 4 boxes with 7 books in each box. 5 books are taken out. How many books remain?", 23, [21, 33], "4 × 7 = 28, then 28 − 5 = 23.", "two-step-multiply"],
        ["There are 3 bags with 8 oranges in each bag. 6 oranges are eaten. How many oranges remain?", 18, [16, 30], "3 × 8 = 24, then 24 − 6 = 18.", "two-step-multiply"],
        ["A tray has 5 rows with 6 eggs in each row. 4 eggs break. How many eggs are left?", 26, [24, 34], "5 × 6 = 30, then 30 − 4 = 26.", "two-step-multiply"],
        ["A pencil costs 40 cents and a ruler costs 25 cents. You pay $1. How much change do you get in cents?", 35, [65, 45], "40 + 25 = 65 cents, then 100 − 65 = 35 cents change.", "two-step-money"],
        ["A book costs $3.50. You pay $5. How much change do you get in cents?", 150, [50, 250], "500 − 350 = 150 cents.", "two-step-money"],
        ["A toy costs $4.20. A bag costs $1.30. How many cents do they cost altogether?", 550, [450, 650], "420 + 130 = 550 cents.", "two-step-money"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, String(answer), [...distractors].map(String), explanation, template, index < 2 ? 3 : index < 6 ? 4 : 5)));
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
      data.forEach(([parts, phrase], index) => q.push(makeMathQuestion(skill, index, `A whole is cut into ${parts} equal parts. Which fraction of the whole is one part? Choose the words.`, String(phrase), ["one fifth", "two thirds", "one half", "one quarter"], `One of ${parts} equal parts is ${phrase}.`, "unit-fraction")));
      break;
    }
    case "math-money": {
      const data = [[3, 50, 350], [2, 20, 220], [5, 5, 505], [1, 80, 180], [4, 25, 425], [7, 10, 710]];
      data.forEach(([dollars, cents, total], index) => q.push(makeMathQuestion(skill, index, `$${dollars}.${String(cents).padStart(2, "0")} is how many cents?`, String(total), [total - 10, total + 10, total + 100].map(String), `$${dollars} is ${dollars * 100} cents, plus ${cents} cents makes ${total} cents.`, "money")));
      break;
    }
    case "math-time": {
      const data = [[7, 35], [9, 10], [2, 45], [11, 25], [6, 50], [4, 5]];
      data.forEach(([hour, minute], index) => q.push(makeMathQuestion(skill, index, `A clock shows ${hour}:${String(minute).padStart(2, "0")}. How many minutes after ${hour} o'clock is it?`, String(minute), [minute - 5, minute + 5, hour].filter((n) => n >= 0 && n <= 59).map(String), `${hour}:${String(minute).padStart(2, "0")} means ${minute} minutes after ${hour} o'clock.`, "time")));
      break;
    }
    case "math-time-duration": {
      const data = [
        ["A film starts at 2:00 and ends at 3:00. How long is the film?", "1 hour", ["30 minutes", "2 hours"], "The film lasts 1 hour.", "time-duration"],
        ["Recess starts at 10:15 and ends at 10:35. How long is recess?", "20 minutes", ["10 minutes", "30 minutes"], "10:35 − 10:15 = 20 minutes.", "time-duration"],
        ["Lunch starts at 12:00 and ends at 12:30. How long is lunch?", "30 minutes", ["20 minutes", "1 hour"], "12:30 − 12:00 = 30 minutes.", "time-duration"],
        ["A bus leaves at 8:10 and the ride takes 20 minutes. What time does it arrive?", "8:30", ["8:20", "8:40"], "8:10 plus 20 minutes is 8:30.", "time-change"],
        ["A lesson is 45 minutes long and starts at 9:00. What time does it end?", "9:45", ["9:30", "10:00"], "9:00 plus 45 minutes is 9:45.", "time-change"],
        ["It is 4:20. What time is it 40 minutes later?", "5:00", ["4:50", "5:20"], "4:20 plus 40 minutes is 5:00.", "time-change"],
        ["It is 6:45. What time is it 15 minutes later?", "7:00", ["6:50", "7:15"], "6:45 plus 15 minutes is 7:00.", "time-change"],
        ["A film is 1 hour 30 minutes long. How many minutes is that?", "90 minutes", ["60 minutes", "120 minutes"], "1 hour is 60 minutes, so 1 hour 30 minutes is 90 minutes.", "time-convert"],
        ["How many minutes are in 2 hours?", "120", ["60", "100"], "2 hours = 2 × 60 = 120 minutes.", "time-convert"],
        ["A train leaves at 3:15 and arrives at 4:05. How many minutes is the journey?", "50 minutes", ["40 minutes", "60 minutes"], "From 3:15 to 4:05 is 50 minutes.", "time-duration"],
        ["Art class starts at 1:40 and lasts 30 minutes. What time does it end?", "2:10", ["2:00", "2:20"], "1:40 plus 30 minutes is 2:10.", "time-change"],
        ["A swim lesson ends at 5:30. It lasted 45 minutes. What time did it start?", "4:45", ["4:30", "5:00"], "5:30 minus 45 minutes is 4:45.", "time-start"],
        ["A class starts at 9:20 and ends at 10:00. How long is the class?", "40 minutes", ["30 minutes", "50 minutes"], "10:00 − 9:20 = 40 minutes.", "time-duration"],
        ["It is 11:40. What time is it 25 minutes later?", "12:05", ["11:55", "12:15"], "11:40 plus 25 minutes is 12:05.", "time-change"],
        ["A film is 2 hours long. It starts at 4:30. What time does it end?", "6:30", ["5:30", "6:00"], "4:30 plus 2 hours is 6:30.", "time-change"],
        ["A walk starts at 3:50 and lasts 35 minutes. What time does it end?", "4:25", ["4:15", "4:35"], "3:50 plus 35 minutes is 4:25.", "time-change"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], explanation, template)));
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
        ["4/9 − 1/9 = ?", "3/9", ["5/9", "3/18"], "Subtract the numerators and keep the denominator: 4 − 1 = 3, so 4/9 − 1/9 = 3/9 (or 1/3 in simplest form).", "fraction-add-sub"],
        ["5/8 − 2/8 = ?", "3/8", ["7/8", "3/16"], "Keep the denominator: 5 − 2 = 3, so 5/8 − 2/8 = 3/8.", "fraction-add-sub"],
        ["2/6 + 3/6 = ?", "5/6", ["1/6", "5/12"], "Keep the denominator: 2 + 3 = 5, so 2/6 + 3/6 = 5/6.", "fraction-add-sub"],
        ["6/10 − 4/10 = ?", "2/10", ["10/10", "2/20"], "Keep the denominator: 6 − 4 = 2, so 6/10 − 4/10 = 2/10 (or 1/5 in simplest form).", "fraction-add-sub"]
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
    case "math-scaled-picture-graph": {
      const data = [
        ["In a picture graph, each star stands for 2 books. The row for Monday has 4 stars. How many books were read on Monday?", "8", ["6", "4"], "4 stars × 2 books = 8 books.", "scaled-graph-read"],
        ["In a picture graph, each apple icon stands for 5 apples. A basket row shows 3 apple icons. How many apples are there?", "15", ["8", "10"], "3 icons × 5 apples = 15 apples.", "scaled-graph-read"],
        ["Each car icon stands for 10 cars. The red car row has 4 icons and the blue car row has 2 icons. How many more red cars than blue cars are there?", "20", ["2", "60"], "(4 − 2) × 10 = 20 more red cars.", "scaled-graph-compare"],
        ["Each circle stands for 2 stickers. Lina has 5 circles and Ben has 3 circles. How many more stickers does Lina have?", "4", ["2", "16"], "(5 − 3) × 2 = 4 more stickers.", "scaled-graph-compare"],
        ["Each flower icon stands for 5 flowers. There are 2 icons for roses and 4 icons for lilies. How many flowers are there altogether?", "30", ["6", "25"], "(2 + 4) × 5 = 30 flowers altogether.", "scaled-graph-total"],
        ["Each ball icon stands for 2 balls. There are 3 icons for footballs and 4 icons for basketballs. How many balls are there altogether?", "14", ["7", "12"], "(3 + 4) × 2 = 14 balls altogether.", "scaled-graph-total"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], explanation, template)));
      break;
    }
    case "math-number-patterns-1000": {
      const data = [
        ["Look at the ones digit of 248. Which kind of number is 248?", "even number", ["odd number", "five-ten number"], "248 ends in 8, so 248 is an even number.", "odd-even-identify"],
        ["Look at the ones digit of 375. Which kind of number is 375?", "odd number", ["even number", "ten-group number"], "375 ends in 5, so 375 is an odd number.", "odd-even-identify"],
        ["What is the next number in the pattern? 320, 330, 340, __", "350", ["345", "360"], "The pattern adds 10 each time: 340 + 10 = 350.", "pattern-1000"],
        ["What is the next number in the pattern? 450, 500, 550, __", "600", ["560", "650"], "The pattern adds 50 each time: 550 + 50 = 600.", "pattern-1000"],
        ["There are 3 boxes with 5 pencils in each box, plus 4 loose pencils. How many pencils are there altogether?", "19", ["15", "23"], "3 × 5 = 15, then 15 + 4 = 19 pencils.", "mixed-mul-add"],
        ["There are 4 plates with 4 cakes on each plate. 3 cakes are eaten. How many cakes are left?", "13", ["16", "19"], "4 × 4 = 16, then 16 − 3 = 13 cakes left.", "mixed-mul-add"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], explanation, template)));
      break;
    }
    case "math-olympiad-reasoning": {
      const data = [
        ["On a balance scale, 1 pineapple weighs as much as 2 mangoes, and 1 mango weighs as much as 3 apples. How many apples balance 1 pineapple?", "6", ["5", "4"], "1 pineapple = 2 mangoes, and 2 × 3 apples = 6 apples.", "balance-substitute"],
        ["1 teapot holds as much water as 3 mugs. Each mug holds 2 small cups. How many small cups fill 1 teapot?", "6", ["5", "8"], "3 mugs × 2 small cups = 6 small cups.", "balance-substitute"],
        ["Children stand in a line. Lina has 4 children in front of her and 3 children behind her. How many children are in the line?", "8", ["7", "9"], "4 in front + 3 behind + Lina herself = 8 children.", "queue-logic"],
        ["In a queue, Ben is 5th from the front and 4th from the back. How many people are in the queue?", "8", ["9", "7"], "5 + 4 − 1 (Ben is counted twice) = 8 people.", "queue-logic"],
        ["A mystery number adds 7 and becomes 20. What is the mystery number?", "13", ["12", "27"], "Work backwards from 20: 20 − 7 = 13.", "work-backwards"]
      ] as const;
      data.forEach(([prompt, answer, distractors, explanation, template], index) => q.push(makeMathQuestion(skill, index, prompt, answer, [...distractors], explanation, template, index < 2 ? 2 : 3)));
      break;
    }
  }
  const choiceTarget = ["math-count-100", "math-add-sub-100", "math-multiply-tables"].includes(skill.id) ? 20 : ["k2-math-count-20", "k2-math-add-within-10", "math-two-step-problems"].includes(skill.id) ? 12 : skill.id === "math-olympiad-reasoning" ? 15 : ["math-time", "math-money", "math-picture-graph", "math-length-measure", "math-fractions-add-sub", "math-measurement-units", "math-place-value-1000", "math-add-sub-regroup", "math-add-sub-1000", "math-divide-tables", "math-fractions", "math-scaled-picture-graph", "math-number-patterns-1000"].includes(skill.id) ? (["math-time", "math-place-value-1000", "math-add-sub-regroup", "math-add-sub-1000", "math-divide-tables", "math-fractions", "math-scaled-picture-graph", "math-number-patterns-1000"].includes(skill.id) ? 16 : 17) : skill.id === "math-time-duration" ? 16 : 11;
  const depthSeeds = buildMathDepthSeeds(skill.id);
  depthSeeds.forEach((seed, offset) => {
    q.push(makeMathQuestion(skill, q.length, seed.prompt, seed.answer, seed.distractors, seed.explanation, seed.template, seed.difficulty));
  });
  if (q.length !== choiceTarget) {
    throw new Error(`${skill.id} has ${q.length} choice questions; expected ${choiceTarget}`);
  }
  return q;
}

function buildMathDepthSeeds(skillId: string): MathDepthSeed[] {
  const seed = (prompt: string, answer: number | string, distractors: Array<number | string>, explanation: string, template: string, difficulty: 1 | 2 | 3 | 4 | 5 = 2): MathDepthSeed => ({
    prompt,
    answer: String(answer),
    distractors: distractors.map(String),
    explanation,
    template,
    difficulty
  });

  switch (skillId) {
    case "math-count-100":
      return [
        seed("Which number is missing? 24, 25, __, 27.", 26, [23, 28], "The sequence goes up by 1, so the missing number is 26.", "number-sequence", 1),
        seed("Which number is missing? 41, __, 43, 44.", 42, [40, 45], "42 comes between 41 and 43.", "number-sequence", 1),
        seed("Which number is missing? 68, 69, __, 71.", 70, [67, 72], "The number after 69 is 70.", "number-sequence", 1),
        seed("Which number is missing? 85, 86, 87, __.", 88, [84, 89], "Counting on by 1 from 87 gives 88.", "number-sequence", 1),
        seed("Which number is greater, 63 or 58?", 63, [58, "both are equal"], "63 has more tens than 58, so 63 is greater.", "compare-order", 2),
        seed("Which number is smaller, 72 or 67?", 67, [72, "both are equal"], "67 is less than 72.", "compare-order", 2),
        seed("Which number comes just after 99?", 100, [98, 101], "Counting one more than 99 gives 100.", "compare-order", 2),
        seed("Order from smallest to largest: 54, 45, 49. Which is smallest?", 45, [49, 54], "45 has the fewest tens, so it is the smallest.", "compare-order", 3),
        seed("What number is 5 tens and 7 ones?", 57, [75, 12], "5 tens make 50, and 7 ones make 57.", "tens-ones", 2),
        seed("What number is 8 tens and 3 ones?", 83, [38, 11], "8 tens make 80, and 3 ones make 83.", "tens-ones", 2),
        seed("What number is 6 tens and 0 ones?", 60, [6, 66], "6 tens make 60, with 0 ones.", "tens-ones", 2),
        seed("What number is 3 tens and 9 ones?", 39, [93, 12], "3 tens make 30, and 9 ones make 39.", "tens-ones", 3),
        seed("Which number is 10 more than 46?", 56, [36, 47], "Adding one ten to 46 gives 56.", "place-value", 3),
        seed("A number has 5 tens and 2 ones. What is the number?", 52, [25, 57], "5 tens make 50, and 2 ones make 52.", "place-value", 3)
      ];
    case "math-place-value-1000":
      return [
        seed("300 + 40 + 6 = ?", 346, [340, 364], "300 + 40 + 6 = 346.", "expanded-form", 2),
        seed("500 + 0 + 8 = ?", 508, [580, 58], "There are 5 hundreds and 8 ones, so the number is 508.", "expanded-form", 3),
        seed("700 + 20 + 9 = ?", 729, [792, 279], "Add 700, 20 and 9 to get 729.", "expanded-form", 2),
        seed("What is the value of the digit 4 in 472?", 400, [40, 4], "The 4 is in the hundreds place, so its value is 400.", "digit-value", 3),
        seed("What is the value of the digit 6 in 263?", 60, [600, 6], "The 6 is in the tens place, so its value is 60.", "digit-value", 3),
        seed("What is the tens digit in 951?", 5, [9, 1, 7], "In 951, the tens digit is 5.", "digit-place", 2),
        seed("What is the ones digit in 486?", 6, [4, 8, 0], "In 486, the ones digit is 6.", "digit-place", 2),
        seed("800 + 30 + 7 = ?", 837, [873, 738, 807], "800 + 30 + 7 = 837.", "expanded-form", 2),
        seed("What is the value of the digit 8 in 583?", 80, [800, 8, 500], "The 8 is in the tens place, so its value is 80.", "digit-value", 3),
        seed("What is the value of the digit 2 in 274?", 200, [20, 2, 700], "The 2 is in the hundreds place, so its value is 200.", "digit-value", 3)
      ];
    case "math-add-sub-100": {
      const pairs: Array<[number, number]> = [[34, 25], [48, 21], [51, 24], [62, 26]];
      const stories: Array<[number, number, "add" | "subtract", string]> = [
        [42, 16, "add", "toy cars"],
        [55, 23, "add", "stickers"],
        [68, 25, "subtract", "pages"],
        [79, 34, "subtract", "marbles"]
      ];
      return [
        ...pairs.map(([a, b], index) => {
          const answer = a + b;
          return seed(`A number bond has ${a} and ${b}. What is the total?`, answer, [answer - 10, answer + 10, Math.abs(a - b)], `${a} + ${b} = ${answer}.`, "number-bond", index < 2 ? 2 : 3);
        }),
        ...stories.map(([a, b, operation, noun], index) => {
          const answer = operation === "add" ? a + b : a - b;
          const prompt = operation === "add" ? `${a} ${noun} are added to ${b} ${noun}. How many are there now?` : `${a} ${noun} are on the table. ${b} are taken away. How many remain?`;
          return seed(prompt, answer, [answer - 2, answer + 2, operation === "add" ? b : a + b], `${operation === "add" ? `${a} + ${b}` : `${a} − ${b}`} = ${answer}.`, "story-change", index < 1 ? 2 : 3);
        }),
        ...[46, 59, 68].map((a, index) => {
          const b = 23 + index * 4;
          const answer = a - b;
          return seed(`${a} − ${b} = ?`, answer, [answer - 1, answer + 1, answer + 10], `${a} − ${b} = ${answer}.`, "horizontal-equation", 3);
        }),
        seed("A shop has 48 apples. It sells 15 apples. How many apples are there now?", 33, [31, 63], "48 − 15 = 33 apples.", "story-change", 3),
        seed("Ben has 35 stickers. He gets 24 more stickers. How many stickers does he have now?", 59, [57, 49], "35 + 24 = 59 stickers.", "story-change", 3),
        seed("A bus has 56 people. 24 people get off. How many people are on the bus now?", 32, [30, 80], "56 − 24 = 32 people.", "story-change", 4)
      ];
    }
    case "math-add-sub-regroup": {
      const items: Array<[number, "+" | "-", number, string]> = [[47, "+", 25, "place-value-trade"], [58, "-", 29, "place-value-trade"], [36, "+", 47, "algorithm-step"], [82, "-", 57, "algorithm-step"], [64, "+", 19, "story-regroup"]];
      return items.map(([a, operation, b, template], index) => {
        const answer = operation === "+" ? a + b : a - b;
        const prompt = index === 4 ? `A basket has ${a} oranges. ${b} more are put in. How many oranges are there?` : `${a} ${operation} ${b} = ?`;
        return seed(prompt, answer, [answer - 1, answer + 1, answer + 10], `Regroup where needed: ${a} ${operation} ${b} = ${answer}.`, template, index < 2 ? 2 : 3);
      }).concat([
        seed("57 + 26 = ?", 83, [82, 84, 93], "7 + 6 = 13, regroup the ten: 57 + 26 = 83.", "regrouping", 2),
        seed("74 − 38 = ?", 36, [35, 37, 46], "14 − 8 = 6 and 6 − 3 = 3, so 74 − 38 = 36.", "regrouping", 2),
        seed("45 + 37 = ?", 82, [81, 83, 92], "5 + 7 = 12, regroup the ten: 45 + 37 = 82.", "place-value-trade", 3),
        seed("91 − 45 = ?", 46, [45, 47, 56], "11 − 5 = 6 and 8 − 4 = 4, so 91 − 45 = 46.", "algorithm-step", 3),
        seed("A shop has 48 pencils. 27 more are delivered. How many pencils are there?", 75, [74, 76, 85], "48 + 27 = 75 pencils.", "story-regroup", 3)
      ]);
    }
    case "math-add-sub-1000": {
      const items: Array<[number, "+" | "-", number, string]> = [[425, "+", 138, "column-operation"], [706, "-", 248, "column-operation"], [300, "+", 50, "decomposition"], [900, "-", 40, "decomposition"], [512, "+", 176, "story-change"]];
      return items.map(([a, operation, b, template], index) => {
        const answer = operation === "+" ? a + b : a - b;
        const prompt = index === 4 ? `A library has ${a} books. ${b} more books arrive. How many books are there?` : `${a} ${operation} ${b} = ?`;
        return seed(prompt, answer, [answer - 10, answer + 10, answer + 100], `Align the places and calculate: ${a} ${operation} ${b} = ${answer}.`, template, index < 2 ? 3 : 4);
      }).concat([
        seed("367 + 245 = ?", 612, [602, 622, 712], "367 + 245 = 612.", "three-digit", 3),
        seed("804 − 357 = ?", 447, [437, 457, 547], "804 − 357 = 447.", "three-digit", 4),
        seed("529 + 284 = ?", 813, [803, 823, 913], "Align the places: 529 + 284 = 813.", "column-operation", 4),
        seed("600 + 70 = ?", 670, [660, 770, 607], "6 hundreds and 7 tens make 670.", "decomposition", 2),
        seed("A school has 605 chairs. 178 more chairs are bought. How many chairs are there?", 783, [773, 793, 883], "605 + 178 = 783 chairs.", "story-change", 4)
      ]);
    }
    case "math-multiply-tables": {
      const groups: Array<[number, number]> = [[2, 6], [3, 7], [4, 5], [5, 8]];
      const arrays: Array<[number, number]> = [[3, 6], [4, 7], [2, 9], [5, 5]];
      const facts: Array<[number, number]> = [[4, 7], [5, 6], [3, 8]];
      return [
        ...groups.map(([count, each], index) => {
          const answer = count * each;
          return seed(`${count} groups have ${each} each. How many altogether?`, answer, [answer - count, answer + count, count + each], `${count} × ${each} = ${answer}.`, "equal-groups", index < 2 ? 2 : 3);
        }),
        ...arrays.map(([rows, columns], index) => {
          const answer = rows * columns;
          return seed(`An array has ${rows} rows with ${columns} in each row. How many are there?`, answer, [answer - rows, answer + rows, rows + columns], `${rows} × ${columns} = ${answer}.`, "array", index < 2 ? 2 : 3);
        }),
        ...facts.map(([factor, other], index) => {
          const product = factor * other;
          return seed(`If ${factor} × ${other} = ${product}, what is ${product} ÷ ${other}?`, factor, [other, product, factor + other], `${factor} × ${other} = ${product}, so ${product} ÷ ${other} = ${factor}.`, "fact-family", 3);
        }),
        seed("There are 4 bags with 6 marbles in each bag. Then 3 marbles are removed. How many marbles are left?", 21, [18, 24], "4 × 6 = 24, then 24 − 3 = 21.", "equal-groups", 4),
        seed("There are 3 boxes with 8 pencils in each box. 5 pencils are used. How many pencils are left?", 19, [16, 24], "3 × 8 = 24, then 24 − 5 = 19.", "equal-groups", 4),
        seed("There are 5 trays with 4 cups on each tray. 2 more cups are added. How many cups are there?", 22, [20, 25], "5 × 4 = 20, then 20 + 2 = 22.", "equal-groups", 5)
      ];
    }
    case "math-divide-tables": {
      const shares: Array<[number, number]> = [[12, 3], [20, 4]];
      const arrays: Array<[number, number]> = [[18, 3], [24, 6]];
      return [
        ...shares.map(([total, groups], index) => {
          const answer = total / groups;
          return seed(`${total} counters are shared equally into ${groups} groups. How many in each group?`, answer, [answer - 1, answer + 1, total - groups], `${groups} × ${answer} = ${total}, so each group has ${answer}.`, "equal-sharing", index === 0 ? 2 : 3);
        }),
        ...arrays.map(([total, rows]) => {
          const answer = total / rows;
          return seed(`An array has ${total} counters in ${rows} equal rows. How many in each row?`, answer, [answer - 1, answer + 1, rows], `${rows} × ${answer} = ${total}.`, "array-inverse", 3);
        }),
        seed("If 5 × 8 = 40, what is 40 ÷ 5?", 8, [5, 9], "The related division fact is 40 ÷ 5 = 8.", "fact-family", 3),
        seed("28 ÷ 4 = ?", 7, [6, 8], "4 × 7 = 28, so 28 ÷ 4 = 7.", "division", 2),
        seed("35 ÷ 5 = ?", 7, [6, 8], "5 × 7 = 35, so 35 ÷ 5 = 7.", "division", 2),
        seed("36 counters are shared equally into 6 groups. How many in each group?", 6, [5, 7], "6 × 6 = 36, so each group has 6.", "equal-sharing", 3),
        seed("An array has 32 counters in 4 equal rows. How many in each row?", 8, [7, 9], "4 × 8 = 32, so each row has 8.", "array-inverse", 3),
        seed("If 6 × 7 = 42, what is 42 ÷ 6?", 7, [6, 8], "The related division fact is 42 ÷ 6 = 7.", "fact-family", 3)
      ];
    }
    case "math-fractions":
      return [
        seed("What is 1/2 of 8?", 4, [2, 8], "One half of 8 is 4.", "fraction-of-set", 2),
        seed("What is 1/4 of 12?", 3, [4, 6], "Twelve split into 4 equal groups gives 3 in each group.", "fraction-of-set", 3),
        seed("What is 1/3 of 9?", 3, [1, 6], "Nine split into 3 equal groups gives 3.", "fraction-of-set", 3),
        seed("A whole is cut into 5 equal parts. Which fraction of the whole is one part?", "1/5", ["1/2", "1/10"], "One of 5 equal parts is one fifth, or 1/5.", "fraction-words", 1),
        seed("A whole is cut into 8 equal parts. Which fraction of the whole is one part?", "1/8", ["1/4", "1/2"], "One of 8 equal parts is one eighth, or 1/8.", "fraction-words", 2),
        seed("A whole is cut into 10 equal parts. Which fraction of the whole is one part? Choose the words.", "one tenth", ["one half", "one quarter"], "One of 10 equal parts is one tenth.", "unit-fraction", 2),
        seed("What is 1/5 of 10?", 2, [5, 10], "Ten split into 5 equal groups gives 2 in each group.", "fraction-of-set", 2),
        seed("What is 1/4 of 16?", 4, [8, 2], "Sixteen split into 4 equal groups gives 4 in each group.", "fraction-of-set", 3),
        seed("A whole is cut into 4 equal parts. Which fraction of the whole is one part?", "1/4", ["1/2", "1/8"], "One of 4 equal parts is one quarter, or 1/4.", "fraction-words", 1),
        seed("A whole is cut into 10 equal parts. Which fraction of the whole is one part?", "1/10", ["1/2", "1/5"], "One of 10 equal parts is one tenth, or 1/10.", "fraction-words", 2)
      ];
    case "math-money":
      return [
        seed("Two $1 coins and three 20-cent coins make how many cents?", 260, [230, 320], "$1 is 100 cents. 200 + 60 = 260 cents.", "amount-identify", 3),
        seed("One $2 coin and two 50-cent coins make how many cents?", 300, [250, 400], "200 + 100 = 300 cents.", "amount-identify", 3),
        seed("How many cents more is $4.20 than $4.05?", 15, [5, 25], "420 − 405 = 15 cents.", "compare-pay", 3),
        seed("How many cents more is $5.50 than $4.80?", 70, [30, 130], "550 − 480 = 70 cents.", "compare-pay", 3),
        seed("An item costs $3.40. You pay $5. How much change in cents?", 160, [140, 260], "500 − 340 = 160 cents.", "money-change", 4),
        seed("A pencil costs $0.80. You pay $1. How much change in cents?", 20, [10, 30], "100 − 80 = 20 cents.", "money-change", 3),
        seed("A notebook costs $2.30. You pay $3. How much change in cents?", 70, [30, 80], "300 − 230 = 70 cents.", "money-change", 3),
        seed("How many cents more is $6.10 than $5.85?", 25, [15, 35], "610 − 585 = 25 cents.", "compare-pay", 3),
        seed("How many cents less is $3.45 than $4.00?", 55, [45, 65], "400 − 345 = 55 cents.", "compare-pay", 3),
        seed("$6.20 is how many cents?", 620, [520, 720], "$6 is 600 cents, plus 20 cents makes 620 cents.", "money", 2),
        seed("Three $1 coins and two 10-cent coins make how many cents?", 320, [300, 330], "300 + 20 = 320 cents.", "amount-identify", 2)
      ];
    case "math-time":
      return [
        seed("A clock shows 8:20. How many minutes after 8 o'clock is it?", 20, [8, 40], "8:20 is 20 minutes after 8.", "clock-read", 1),
        seed("A clock shows 3:55. How many minutes after 3 o'clock is it?", 55, [5, 35], "3:55 is 55 minutes after 3.", "clock-read", 2),
        seed("A lesson starts at 10:15 and lasts 30 minutes. At what minute after 10 does it end?", 45, [15, 55], "15 + 30 = 45 minutes after 10.", "duration", 3),
        seed("A train journey takes 40 minutes and starts at 6:10. At what minute after 6 does it end?", 50, [30, 60], "10 + 40 = 50 minutes after 6.", "duration", 3),
        seed("A 25-minute activity starts at 4:40. At what minute after 5 does it end?", 5, [15, 25], "40 + 25 minutes is 65 minutes after 4, which is 5 minutes after 5.", "daily-event-order", 4),
        seed("A clock shows 10:05. How many minutes after 10 o'clock is it?", 5, [50, 15], "10:05 is 5 minutes after 10.", "clock-read", 1),
        seed("A clock shows 12:40. How many minutes after 12 o'clock is it?", 40, [20, 50], "12:40 is 40 minutes after 12.", "clock-read", 2),
        seed("A lesson starts at 9:05 and lasts 25 minutes. At what minute after 9 does it end?", 30, [20, 35], "5 + 25 = 30 minutes after 9.", "duration", 2),
        seed("A bus journey starts at 1:15 and takes 30 minutes. At what minute after 1 does it end?", 45, [35, 50], "15 + 30 = 45 minutes after 1.", "duration", 3),
        seed("A 20-minute activity starts at 5:50. At what minute after 6 does it end?", 10, [5, 20], "50 + 20 minutes is 70 minutes after 5, which is 10 minutes after 6.", "daily-event-order", 4)
      ];
    case "math-shapes":
      return [
        seed("Which shape has exactly 4 equal sides?", "square", ["rectangle", "triangle"], "A square has four equal sides.", "shape-identify", 2),
        seed("Which 3D shape has 6 square faces?", "cube", ["cylinder", "sphere"], "A cube has six square faces.", "shape-identify", 3),
        seed("How many corners does a triangle have?", 3, [4, 2], "A triangle has three corners.", "shape-classify", 1),
        seed("How many faces does a cuboid have?", 6, [8, 4], "A cuboid has six faces.", "shape-classify", 3),
        seed("Two identical isosceles right triangles are joined along their longest sides. Which shape do they make?", "square", ["circle", "cuboid"], "The two longest sides form the diagonal of a square.", "compose-decompose", 4)
      ];
    case "math-picture-graph":
      return [
        seed("A graph shows 8 red beads and 5 blue beads. How many beads altogether?", 13, [3, 14], "8 + 5 = 13 beads.", "graph-read", 2),
        seed("A graph shows 7 cats and 4 dogs. How many animals altogether?", 11, [3, 12], "7 + 4 = 11 animals.", "graph-read", 2),
        seed("A graph shows 9 apples and 6 oranges. How many more apples than oranges?", 3, [15, 4], "9 − 6 = 3 more apples.", "graph-question", 3),
        seed("A graph shows 10 cars and 7 bicycles. How many fewer bicycles are there?", 3, [17, 4], "10 − 7 = 3 fewer bicycles.", "graph-question", 3),
        seed("A graph shows 6 stars, 4 moons and 2 suns. How many symbols are shown altogether?", 12, [10, 14], "6 + 4 + 2 = 12 symbols.", "graph-read", 3),
        seed("A graph shows 5 red beads and 8 blue beads. How many beads altogether?", 13, [3, 14], "5 + 8 = 13 beads.", "graph-read", 2),
        seed("A graph shows 9 birds and 4 fish. How many animals altogether?", 13, [5, 14], "9 + 4 = 13 animals.", "graph-read", 2),
        seed("A graph shows 11 stars and 5 moons. How many more stars than moons?", 6, [16, 5], "11 − 5 = 6 more stars.", "graph-question", 3),
        seed("A graph shows 8 birds and 5 fish. How many more birds than fish?", 3, [13, 4], "8 − 5 = 3 more birds.", "graph-question", 3),
        seed("A graph shows 7 flowers and 3 leaves. How many more flowers than leaves?", 4, [10, 5], "7 − 3 = 4 more flowers.", "graph-compare", 2),
        seed("A graph shows 6 rabbits and 7 carrots. How many items altogether?", 13, [1, 14], "6 + 7 = 13 items.", "graph-read", 2)
      ];
    case "math-length-measure":
      return [
        seed("A crayon starts at 0 cm and ends at 9 cm. How long is it?", "9 cm", ["8 cm", "10 cm"], "The crayon is 9 cm long.", "length-measure", 1),
        seed("A ruler shows an object from 3 cm to 11 cm. How long is the object?", "8 cm", ["7 cm", "14 cm"], "11 − 3 = 8 cm.", "length-measure", 3),
        seed("Which is longer: 14 cm or 11 cm?", "14 cm", ["11 cm", "both are equal"], "14 cm is longer than 11 cm.", "length-compare", 1),
        seed("Which is shorter: 6 cm or 10 cm?", "6 cm", ["10 cm", "both are equal"], "6 cm is shorter than 10 cm.", "length-compare", 1),
        seed("A 10 cm ribbon is extended by 3 cm. How long is it now?", "13 cm", ["7 cm", "12 cm"], "10 + 3 = 13 cm.", "length-change", 2),
        seed("A shoelace starts at 0 cm and ends at 14 cm. How long is it?", "14 cm", ["13 cm", "15 cm"], "The shoelace is 14 cm long.", "length-measure", 1),
        seed("A ruler shows a toy from 5 cm to 12 cm. How long is the toy?", "7 cm", ["6 cm", "17 cm"], "12 − 5 = 7 cm.", "length-measure", 3),
        seed("A 20 cm ribbon has 7 cm cut off. How much remains?", "13 cm", ["12 cm", "14 cm"], "20 − 7 = 13 cm.", "length-change", 3),
        seed("An 8 cm straw is extended by 6 cm. How long is it now?", "14 cm", ["13 cm", "15 cm"], "8 + 6 = 14 cm.", "length-change", 2),
        seed("Which is shorter: 15 cm or 9 cm?", "9 cm", ["15 cm", "both are equal"], "9 cm is shorter than 15 cm.", "length-compare", 1),
        seed("A 17 cm pencil and a 12 cm crayon. Which is longer?", "the pencil", ["the crayon", "both are equal"], "17 cm is longer than 12 cm, so the pencil is longer.", "length-compare", 2)
      ];
    case "math-fractions-add-sub":
      return [
        seed("A fraction bar has 2/6 shaded, then 3/6 more is shaded. What fraction is shaded in total?", "5/6", ["1/6", "5/12"], "2/6 + 3/6 = 5/6.", "visual-bar", 3),
        seed("A fraction bar has 7/10 shaded, then 2/10 is removed. What fraction remains shaded?", "5/10", ["9/10", "5/20"], "7/10 − 2/10 = 5/10 (or 1/2 in simplest form).", "visual-bar", 3),
        seed("A pie has 3/8 eaten, then 2/8 more is eaten. What fraction is eaten altogether?", "5/8", ["1/8", "5/16"], "3/8 + 2/8 = 5/8.", "fraction-story", 3),
        seed("A bottle is 6/9 full. 2/9 is poured out. What fraction remains?", "4/9", ["8/9", "4/18"], "6/9 − 2/9 = 4/9.", "fraction-story", 3),
        seed("5/9 + 2/9 = ?", "7/9", ["7/18", "3/9"], "Add the numerators and keep the denominator: 5 + 2 = 7, so 7/9.", "fraction-add-sub", 2),
        seed("4/7 + 2/7 = ?", "6/7", ["6/14", "2/7"], "Keep the denominator: 4 + 2 = 6, so 6/7.", "fraction-add-sub", 2),
        seed("8/10 − 3/10 = ?", "5/10", ["11/10", "5/20"], "Keep the denominator: 8 − 3 = 5, so 5/10 (or 1/2 in simplest form).", "fraction-add-sub", 2),
        seed("3/9 + 4/9 = ?", "7/9", ["7/18", "1/9"], "Keep the denominator: 3 + 4 = 7, so 7/9.", "fraction-add-sub", 2),
        seed("9/12 − 5/12 = ?", "4/12", ["14/12", "4/24"], "Keep the denominator: 9 − 5 = 4, so 4/12 (or 1/3 in simplest form).", "fraction-add-sub", 3),
        seed("A garden bed has 2/8 planted with beans, then 5/8 more is planted. What fraction is planted?", "7/8", ["3/8", "7/16"], "2/8 + 5/8 = 7/8.", "fraction-story", 3),
        seed("A tank is 9/10 full. 4/10 is used. What fraction remains?", "5/10", ["13/10", "5/20"], "9/10 − 4/10 = 5/10 (or 1/2 in simplest form).", "fraction-story", 3)
      ];
    case "math-measurement-units":
      return [
        seed("Which unit is best for the length of a classroom?", "metres", ["grams", "litres"], "Long lengths can be measured in metres.", "unit-select", 2),
        seed("Which unit is best for the mass of a bag of rice?", "kilograms", ["litres", "centimetres"], "A heavy bag can be measured in kilograms.", "unit-select", 2),
        seed("2 kilograms is equal to how many grams?", "2000 grams", ["200 grams", "20 grams"], "1 kilogram is 1000 grams, so 2 kilograms is 2000 grams.", "unit-convert", 3),
        seed("3 metres is equal to how many centimetres?", "300 centimetres", ["30 centimetres", "3000 centimetres"], "1 metre is 100 centimetres, so 3 metres is 300 centimetres.", "unit-convert", 3),
        seed("A jug holds 7 litres and another holds 4 litres. How many litres do they hold altogether?", "11 litres", ["3 litres", "12 litres"], "7 + 4 = 11 litres.", "unit-compare", 2),
        seed("Which unit is best for the length of a pencil?", "centimetres", ["kilograms", "litres"], "Short lengths can be measured in centimetres.", "unit-select", 1),
        seed("Which unit is best for the mass of a pencil?", "grams", ["metres", "litres"], "Light objects can be measured in grams.", "unit-select", 1),
        seed("5 kilograms is equal to how many grams?", "5000 grams", ["500 grams", "50 grams"], "Each kilogram is 1000 grams, so 5 kilograms is 5000 grams.", "unit-convert", 3),
        seed("4 metres is equal to how many centimetres?", "400 centimetres", ["40 centimetres", "4000 centimetres"], "Each metre is 100 centimetres, so 4 metres is 400 centimetres.", "unit-convert", 3),
        seed("A bottle holds 2 litres and a jug holds 9 litres. How many litres do they hold altogether?", "11 litres", ["7 litres", "12 litres"], "2 + 9 = 11 litres.", "unit-compare", 2),
        seed("A 6 kg box and a 10 kg box. How many kilograms heavier is the heavier box?", "4 kg", ["16 kg", "5 kg"], "10 − 6 = 4 kg.", "measurement-compare", 3)
      ];
    case "math-scaled-picture-graph":
      return [
        seed("In a picture graph, each symbol stands for 2 children. The swimming row has 6 symbols. How many children chose swimming?", 12, [8, 6], "6 symbols × 2 children = 12 children.", "scaled-graph-read", 2),
        seed("In a picture graph, each star stands for 5 points. Team A has 5 stars. How many points does Team A have?", 25, [10, 20], "5 stars × 5 points = 25 points.", "scaled-graph-read", 2),
        seed("In a picture graph, each cup stands for 10 cups of juice. Tuesday has 3 cups. How many cups of juice were sold on Tuesday?", 30, [13, 20], "3 icons × 10 = 30 cups of juice.", "scaled-graph-read", 2),
        seed("In a picture graph, each book icon stands for 4 books. Shelf B has 4 icons. How many books are on Shelf B?", 16, [8, 12], "4 icons × 4 books = 16 books.", "scaled-graph-read", 3),
        seed("Each symbol stands for 5 pears. Box A has 6 symbols and Box B has 3 symbols. How many more pears are in Box A?", 15, [3, 45], "(6 − 3) × 5 = 15 more pears.", "scaled-graph-compare", 3),
        seed("Each symbol stands for 2 birds. Tree A has 7 symbols and Tree B has 4 symbols. How many fewer birds are in Tree B?", 6, [3, 22], "(7 − 4) × 2 = 6 fewer birds.", "scaled-graph-compare", 3),
        seed("Each symbol stands for 10 marbles. Jar A has 5 symbols and Jar B has 2 symbols. How many more marbles are in Jar A?", 30, [3, 70], "(5 − 2) × 10 = 30 more marbles.", "scaled-graph-compare", 3),
        seed("Each symbol stands for 5 buns. Morning sales show 4 symbols and afternoon sales show 3 symbols. How many buns were sold altogether?", 35, [7, 30], "(4 + 3) × 5 = 35 buns altogether.", "scaled-graph-total", 3),
        seed("Each symbol stands for 2 fish. Tank A has 5 symbols and Tank B has 4 symbols. How many fish are there in both tanks?", 18, [9, 20], "(5 + 4) × 2 = 18 fish altogether.", "scaled-graph-total", 3),
        seed("Each symbol stands for 10 tickets. Class 2A sold 3 symbols and Class 2B sold 5 symbols. How many tickets did they sell altogether?", 80, [8, 70], "(3 + 5) × 10 = 80 tickets altogether.", "scaled-graph-total", 4)
      ];
    case "math-number-patterns-1000":
      return [
        seed("Look at the ones digit of 516. Which kind of number is 516?", "even number", ["odd number", "hundred-odd number"], "516 ends in 6, which can be paired evenly, so 516 is an even number.", "odd-even-identify", 2),
        seed("Look at the ones digit of 689. Which kind of number is 689?", "odd number", ["even number", "two-pair number"], "689 ends in 9, so 689 is an odd number.", "odd-even-identify", 2),
        seed("Look at the ones digit of 740. Which kind of number is 740?", "even number", ["odd number", "three-odd number"], "740 ends in 0, so 740 is an even number.", "odd-even-identify", 2),
        seed("Look at the ones digit of 803. Which kind of number is 803?", "odd number", ["even number", "ten-even number"], "803 ends in 3, so 803 is an odd number.", "odd-even-identify", 2),
        seed("What is the missing number in the pattern? 210, 310, 410, __, 610", 510, [420, 500], "The pattern adds 100 each time: 410 + 100 = 510.", "pattern-1000", 2),
        seed("What is the missing number in the pattern? 780, 760, 740, __, 700", 720, [730, 710], "The pattern subtracts 20 each time: 740 − 20 = 720.", "pattern-1000", 3),
        seed("What is the missing number in the pattern? 125, 130, 135, __, 145", 140, [138, 150], "The pattern adds 5 each time: 135 + 5 = 140.", "pattern-1000", 2),
        seed("5 bags have 4 oranges each, and there are 6 more oranges in a bowl. How many oranges are there altogether?", 26, [20, 24], "5 × 4 = 20, then 20 + 6 = 26 oranges.", "mixed-mul-add", 3),
        seed("3 trays have 10 cups each. 7 cups are taken away. How many cups remain?", 23, [30, 37], "3 × 10 = 30, then 30 − 7 = 23 cups remain.", "mixed-mul-add", 3),
        seed("6 pairs of socks and 3 single socks make how many socks altogether?", 15, [12, 18], "6 × 2 = 12, then 12 + 3 = 15 socks.", "mixed-mul-add", 4)
      ];
    case "math-olympiad-reasoning":
      return [
        seed("If ★ + ★ = 14 and ★ + ● = 11, what number is ●?", 4, [7, 5], "★ = 7 because 7 + 7 = 14. Then 7 + ● = 11, so ● = 4.", "balance-substitute", 3),
        seed("1 watermelon weighs as much as 2 papayas. 1 papaya weighs as much as 4 pears. How many pears balance 1 watermelon?", 8, [6, 10], "2 × 4 pears = 8 pears.", "balance-substitute", 3),
        seed("If ▲ + ▲ + ▲ = 15 and ▲ + ■ = 13, what number is ■?", 8, [5, 9], "▲ = 5 because 5 + 5 + 5 = 15. Then 5 + ■ = 13, so ■ = 8.", "balance-substitute", 3),
        seed("12 children stand in a row. Tom has 5 children in front of him. How many children are behind Tom?", 6, [7, 5], "12 − 5 − 1 (Tom himself) = 6 children behind Tom.", "queue-logic", 3),
        seed("In a race line, Mei is 6th from the front and 6th from the back. How many runners are in the line?", 11, [12, 10], "6 + 6 − 1 = 11 runners.", "queue-logic", 3),
        seed("A wooden log is sawed 3 times into straight pieces. How many pieces of wood are there?", 4, [3, 5], "Each cut adds 1 piece, so 3 cuts make 3 + 1 = 4 pieces.", "queue-logic", 4),
        seed("Sam gives 6 stickers to his sister and then buys 4 more. He now has 15 stickers. How many stickers did Sam have at first?", 17, [13, 19], "Work backwards from 15: 15 − 4 + 6 = 17 stickers at first.", "work-backwards", 4),
        seed("A number is doubled (× 2) and then 3 is added to get 13. What was the starting number?", 5, [6, 8], "Work backwards: 13 − 3 = 10, then 10 ÷ 2 = 5.", "work-backwards", 4),
        seed("Lina is 7 years old and her brother is 11 years old. In 5 years, how many years older than Lina will her brother be?", 4, [9, 5], "The age difference never changes: 11 − 7 = 4 years.", "work-backwards", 3),
        seed("A box of sweets has half eaten, leaving 8 sweets. How many sweets were in the box at first?", 16, [12, 10], "Work backwards: 8 × 2 = 16 sweets.", "work-backwards", 3)
      ];
    default:
      return [];
  }
}
