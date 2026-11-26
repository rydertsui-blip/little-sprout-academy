import type { Question } from "./types";

function escapeSpeechText(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function speechRevealsAnswer(question: Question, text: string): boolean {
  if (question.kind !== "choice") return false;
  if (question.subject === "math") return false;
  const answer = question.correctAnswer.trim().toLowerCase();
  const spoken = text.trim().toLowerCase();
  if (!answer) return false;
  if (spoken === answer) return true;
  if (answer.length <= 2 && /[\u3400-\u9fff]/.test(answer)) {
    const normalizedSpoken = answer === "一样" ? spoken.replace(/一样吗/g, "") : spoken;
    if (normalizedSpoken.includes(answer)) return true;
  }
  const wordChar = "a-z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ";
  return new RegExp(`(^|[^${wordChar}])${escapeSpeechText(answer)}($|[^${wordChar}])`, "i").test(spoken);
}

export function preAnswerAudio(question: Question): string {
  const text = question.audioText ?? question.prompt;
  if (question.audioOnly || !speechRevealsAnswer(question, text)) return text;
  if (question.prompt && !speechRevealsAnswer(question, question.prompt)) return question.prompt;
  return question.instruction || question.prompt;
}
