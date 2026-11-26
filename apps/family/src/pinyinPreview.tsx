import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { PinyinTool } from "./screens/PinyinTool";
import type { Question } from "./lib/types";
import "./styles.css";

const previewQuestion = {
  id: "pinyin-preview",
  subject: "mandarin",
  kind: "choice",
  skillId: "mandarin-initials",
  prompt: "试听完整拼音表。",
  instruction: "点任意拼音听标准读音。",
  correctAnswer: "",
  displayCharacter: "猫",
} as Question;

function Preview() {
  useEffect(() => {
    const tab = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("全部拼音表"));
    tab?.click();
  }, []);

  return (
    <main className="app-shell">
      <section className="quiz-stage">
        <div className="quiz-skill-chip">华文<span>拼音表试听</span></div>
        <h2>拼音表试听</h2>
        <PinyinTool question={previewQuestion} defaultOpen />
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);
