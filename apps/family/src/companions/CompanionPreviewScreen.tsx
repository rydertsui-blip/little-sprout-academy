import { useEffect, useState } from "react";
import { PuppyCompanion } from "./PuppyCompanion";
import { createPetState, transitionPetState, type CompanionPetState, type PetEvent } from "./petState";

const PREVIEW_STATES: Array<{ label: string; state: CompanionPetState }> = [
  { label: "待机", state: "idle" },
  { label: "打招呼", state: "greet" },
  { label: "聆听", state: "listen" },
  { label: "思考", state: "think" },
  { label: "庆祝", state: "celebrate" },
  { label: "安抚", state: "comfort" },
  { label: "休息", state: "rest" }
];

export function CompanionPreviewScreen() {
  const [pet, setPet] = useState(() => createPetState(Date.now()));

  useEffect(() => {
    if (pet.endsAt === null) return;
    const timer = window.setTimeout(() => {
      setPet((current) => transitionPetState(current, { type: "TICK" }, Date.now()));
    }, Math.max(0, pet.endsAt - Date.now()) + 20);
    return () => window.clearTimeout(timer);
  }, [pet.endsAt]);

  function dispatch(event: PetEvent) {
    setPet((current) => transitionPetState(current, event, Date.now()));
  }

  return (
    <main className="companion-preview-screen">
      <header className="companion-preview-header">
        <p className="eyebrow">角色動畫預覽</p>
        <h1>豆豆，第一隻陪伴小狗</h1>
        <p>这个页面只作开发验收。正式产品会把豆豆放在学习页的安全陪伴区，不会遮挡题目和答案。</p>
      </header>

      <section className="companion-preview-stage" aria-label="陪伴小狗動畫預覽">
        <div className="companion-room">
          <span className="companion-room-cloud cloud-one" aria-hidden="true" />
          <span className="companion-room-cloud cloud-two" aria-hidden="true" />
          <PuppyCompanion state={pet.visual} interactive onInteract={() => dispatch({ type: "TAP" })} className="puppy-preview-size" />
          <div className="companion-safe-zone" aria-hidden="true">
            <span>安全陪伴區</span>
          </div>
        </div>

        <aside className="companion-preview-side">
          <strong>現在狀態：{pet.visual}</strong>
          <p>點豆豆一下，看看牠的反應。正式版本只在角色本體接收觸控，不會攔截背後的答案。</p>
          <div className="companion-state-controls" aria-label="角色狀態預覽">
            {PREVIEW_STATES.map((item) => (
              <button
                key={item.state}
                type="button"
                className={pet.visual === item.state ? "is-active" : ""}
                aria-pressed={pet.visual === item.state}
                onClick={() => dispatch({ type: "SET_STATE", visual: item.state })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="companion-preview-notes" aria-label="動畫規則">
        <h2>已经做进去的行为</h2>
        <div>
          <article>
            <b>安靜陪伴</b>
            <span>呼吸、眨眼、耳朵微動和慢擺尾，不會每兩秒跳一次。</span>
          </article>
          <article>
            <b>聽課模式</b>
            <span>播放題目或語音時側耳、安靜，不跟老師搶聲音。</span>
          </article>
          <article>
            <b>鼓勵而不催促</b>
            <span>思考時歪頭；答錯時坐下陪伴；沒有生氣、乞求或倒數。</span>
          </article>
        </div>
      </section>
    </main>
  );
}
