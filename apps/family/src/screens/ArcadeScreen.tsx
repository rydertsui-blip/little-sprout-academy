import { BookOpen, Check, ChevronLeft, ChevronRight, Flame, Lock, RotateCcw, Sparkles, Star, Trophy, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MEMORY_FLIP_DECKS,
  MONSTER_STAGES,
  SORTING_ROUNDS,
  STORY_QUESTS,
  type ArcadeGameId,
} from "../content/arcade";
import { TEACHER_PRAISE_ZH, VOICE_LINES } from "../content/audioAssets";
import { playOrSpeak, stopAudio } from "../lib/audio";
import type { ChildProfile } from "../lib/types";

interface ArcadeScreenProps {
  child: ChildProfile;
  initialGame?: ArcadeGameId;
  onBack: () => void;
  onLock: () => void | Promise<void>;
  onCompleteGame?: (eventKey: string) => Promise<number>;
}

const GAME_TABS: Array<{ id: ArcadeGameId; label: string; badge: string; art: string; tint: string }> = [
  { id: "memory-flip", label: "翻牌消消乐", badge: "记忆配对", art: "./assets/images/arcade-memory.svg", tint: "is-blue" },
  { id: "sorting-basket", label: "分类投篮赛", badge: "反应归类", art: "./assets/images/arcade-basket.svg", tint: "is-yellow" },
  { id: "monster-feeder", label: "喂饱小怪兽", badge: "趣味速算", art: "./assets/images/arcade-monster.svg", tint: "is-coral" },
  { id: "story-quest", label: "互动绘本闯关", badge: "思维百科", art: "./assets/images/arcade-story.svg", tint: "is-leaf" },
];

interface FlipCard {
  uid: string;
  pairId: string;
  text: string;
  audioText: string;
  lang: "zh-CN" | "en-US";
}

function buildDeckCards(deckIndex: number, cycle: number): FlipCard[] {
  const deck = MEMORY_FLIP_DECKS[deckIndex] ?? MEMORY_FLIP_DECKS[0];
  const raw: FlipCard[] = [];
  for (const pair of deck.pairs) {
    raw.push({
      uid: `${pair.id}-L`,
      pairId: pair.id,
      text: pair.leftText,
      audioText: pair.leftAudio,
      lang: pair.lang,
    });
    raw.push({
      uid: `${pair.id}-R`,
      pairId: pair.id,
      text: pair.rightText,
      audioText: pair.rightAudio,
      lang: pair.lang,
    });
  }
  const offset = (deckIndex + cycle + 1) % raw.length;
  return raw
    .map((card, i) => ({ card, sortKey: ((i * 5 + offset) % raw.length) + (i % 2 === 0 ? 0.1 : -0.1) }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((x) => x.card);
}

export default function ArcadeScreen({
  child,
  initialGame = "memory-flip",
  onBack,
  onLock,
  onCompleteGame,
}: ArcadeScreenProps) {
  const [activeGame, setActiveGame] = useState<ArcadeGameId>(initialGame);
  const [starsEarnedToast, setStarsEarnedToast] = useState<number | null>(null);

  // 1. Memory Flip State
  const [flipDeckIdx, setFlipDeckIdx] = useState(0);
  const [flipCycle, setFlipCycle] = useState(0);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [flipMoves, setFlipMoves] = useState(0);
  const flipLockRef = useRef(false);
  const flipTimerRef = useRef(0);

  // 2. Sorting Basket State
  const [sortRoundIdx, setSortRoundIdx] = useState(0);
  const [sortItemIdx, setSortItemIdx] = useState(0);
  const [sortStreak, setSortStreak] = useState(0);
  const [sortFeedback, setSortFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [sortDone, setSortDone] = useState(false);

  // 3. Monster Feeder State
  const [monsterStageIdx, setMonsterStageIdx] = useState(0);
  const [fedFoodIds, setFedFoodIds] = useState<string[]>([]);
  const [wrongFoodIds, setWrongFoodIds] = useState<string[]>([]);
  const [monsterMessage, setMonsterMessage] = useState("");

  // 4. Story Quest State
  const [questIdx, setQuestIdx] = useState(0);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [sceneSolved, setSceneSolved] = useState(false);
  const [sceneFeedback, setSceneFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [questCompleted, setQuestCompleted] = useState(false);

  const flipDeck = MEMORY_FLIP_DECKS[flipDeckIdx] ?? MEMORY_FLIP_DECKS[0];
  const flipCards = useMemo(() => buildDeckCards(flipDeckIdx, flipCycle), [flipDeckIdx, flipCycle]);
  const sortRound = SORTING_ROUNDS[sortRoundIdx] ?? SORTING_ROUNDS[0];
  const currentSortItem = sortRound.items[sortItemIdx] ?? sortRound.items[0];
  const monsterStage = MONSTER_STAGES[monsterStageIdx] ?? MONSTER_STAGES[0];
  const currentQuest = STORY_QUESTS[questIdx] ?? STORY_QUESTS[0];
  const currentScene = currentQuest.scenes[sceneIdx] ?? currentQuest.scenes[0];

  useEffect(() => {
    return () => {
      window.clearTimeout(flipTimerRef.current);
      stopAudio();
    };
  }, []);

  async function triggerGameReward(key: string) {
    if (!onCompleteGame) return;
    const awarded = await onCompleteGame(`arcade:${key}`);
    if (awarded > 0) {
      setStarsEarnedToast(awarded);
    }
  }

  useEffect(() => {
    setStarsEarnedToast(null);
    if (activeGame === "memory-flip") {
      playOrSpeak(flipDeck.introAudio, "zh-CN");
    } else if (activeGame === "sorting-basket") {
      playOrSpeak(sortRound.introAudio, sortRound.id.startsWith("english") ? "en-US" : "zh-CN");
    } else if (activeGame === "monster-feeder") {
      playOrSpeak(monsterStage.cravingAudio, monsterStage.lang);
    } else if (activeGame === "story-quest") {
      playOrSpeak(currentScene.storyAudio, "zh-CN");
    }
  }, [activeGame, flipDeckIdx, sortRoundIdx, monsterStageIdx, questIdx, sceneIdx]);

  // --- Game 1: Memory Flip Handlers ---
  function resetMemoryDeck(nextDeckIdx = flipDeckIdx) {
    window.clearTimeout(flipTimerRef.current);
    flipLockRef.current = false;
    setFlipDeckIdx(nextDeckIdx);
    setFlippedUids([]);
    setMatchedPairIds([]);
    setFlipMoves(0);
    setFlipCycle((c) => c + 1);
  }

  function handleCardFlip(card: FlipCard) {
    if (flipLockRef.current) return;
    if (flippedUids.includes(card.uid) || matchedPairIds.includes(card.pairId)) return;

    playOrSpeak(card.audioText, card.lang);
    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      setFlipMoves((m) => m + 1);
      const firstCard = flipCards.find((c) => c.uid === nextFlipped[0]);
      if (firstCard && firstCard.pairId === card.pairId) {
        const nextMatched = [...matchedPairIds, card.pairId];
        setMatchedPairIds(nextMatched);
        setFlippedUids([]);
        if (nextMatched.length === flipDeck.pairs.length) {
          playOrSpeak(VOICE_LINES.praiseZh2, "zh-CN");
          void triggerGameReward(`memory:${flipDeck.id}`);
        }
      } else {
        flipLockRef.current = true;
        flipTimerRef.current = window.setTimeout(() => {
          setFlippedUids([]);
          flipLockRef.current = false;
        }, 720);
      }
    }
  }

  // --- Game 2: Sorting Basket Handlers ---
  function resetSortingRound(nextIdx = sortRoundIdx) {
    setSortRoundIdx(nextIdx);
    setSortItemIdx(0);
    setSortStreak(0);
    setSortFeedback(null);
    setSortDone(false);
  }

  function handleSortShoot(chosenBasket: "left" | "right") {
    if (sortDone || !currentSortItem) return;
    if (chosenBasket === currentSortItem.basket) {
      const nextStreak = sortStreak + 1;
      setSortStreak(nextStreak);
      setSortFeedback({ ok: true, text: `投进啦！${currentSortItem.explain}` });
      const praise = TEACHER_PRAISE_ZH[nextStreak % TEACHER_PRAISE_ZH.length];
      playOrSpeak(praise, "zh-CN");

      if (sortItemIdx + 1 >= sortRound.items.length) {
        setSortDone(true);
        void triggerGameReward(`sort:${sortRound.id}`);
      } else {
        setSortItemIdx((i) => i + 1);
      }
    } else {
      setSortStreak(0);
      setSortFeedback({
        ok: false,
        text: `差一点点！再看一次：${currentSortItem.explain}`,
      });
      playOrSpeak(VOICE_LINES.retryEncourageZh1, "zh-CN");
    }
  }

  // --- Game 3: Monster Feeder Handlers ---
  function resetMonsterStage(nextIdx = monsterStageIdx) {
    setMonsterStageIdx(nextIdx);
    setFedFoodIds([]);
    setWrongFoodIds([]);
    setMonsterMessage("");
  }

  function handleFeedMonster(food: { id: string; label: string; audioText: string; isTarget: boolean }) {
    if (fedFoodIds.includes(food.id) || wrongFoodIds.includes(food.id)) return;
    const targetTotal = monsterStage.foods.filter((f) => f.isTarget).length;
    if (fedFoodIds.length >= targetTotal) return;

    if (food.isTarget) {
      const nextFed = [...fedFoodIds, food.id];
      setFedFoodIds(nextFed);
      if (nextFed.length >= targetTotal) {
        setMonsterMessage(monsterStage.successAudio);
        playOrSpeak(monsterStage.successAudio, monsterStage.lang);
        void triggerGameReward(`monster:${monsterStage.id}`);
      } else {
        setMonsterMessage(`阿姆阿姆！「${food.label}」真好吃！还要吃 ${targetTotal - nextFed.length} 个！`);
        playOrSpeak(food.audioText, monsterStage.lang);
      }
    } else {
      setWrongFoodIds((prev) => [...prev, food.id]);
      setMonsterMessage(`哎呀，「${food.label}」不是我想要吃的哦，不要气馁，换旁边那块试试！`);
      playOrSpeak(
        monsterStage.lang === "zh-CN" ? VOICE_LINES.retryEncourageZh2 : VOICE_LINES.retryEncourageEn2,
        monsterStage.lang
      );
    }
  }

  // --- Game 4: Story Quest Handlers ---
  function selectQuest(nextQuestIdx: number) {
    setQuestIdx(nextQuestIdx);
    setSceneIdx(0);
    setSceneSolved(false);
    setSceneFeedback(null);
    setQuestCompleted(false);
  }

  function handleStoryAnswer(option: string) {
    if (sceneSolved) return;
    if (option === currentScene.correctAnswer) {
      setSceneSolved(true);
      setSceneFeedback({ ok: true, text: currentScene.successText });
      playOrSpeak(VOICE_LINES.praiseZh3, "zh-CN");
      if (sceneIdx + 1 >= currentQuest.scenes.length) {
        setQuestCompleted(true);
        void triggerGameReward(`quest:${currentQuest.id}`);
      }
    } else {
      setSceneFeedback({ ok: false, text: `别着急，听小芽老师提示：${currentScene.hintText}` });
      playOrSpeak(VOICE_LINES.retryEncourageZh1, "zh-CN");
    }
  }

  function advanceStoryScene() {
    if (sceneIdx + 1 < currentQuest.scenes.length) {
      setSceneIdx((s) => s + 1);
      setSceneSolved(false);
      setSceneFeedback(null);
    }
  }

  const flipAllMatched = matchedPairIds.length === flipDeck.pairs.length;
  const monsterTargetCount = monsterStage.foods.filter((f) => f.isTarget).length;
  const monsterFull = fedFoodIds.length >= monsterTargetCount;

  return (
    <div className={`app-shell ${child.settings.highContrast ? "child-high-contrast" : ""} ${child.settings.largeText ? "child-large-text" : ""}`.trim()}>
      <header className="session-header handwriting-header">
        <button className="quiet-button compact-button" type="button" onClick={onBack}>
          <ChevronLeft aria-hidden="true" />返回学习岛
        </button>
        <div>
          <p className="eyebrow">{child.name} · 小芽游乐园（四大互动闯关游戏）</p>
          <h1>边玩边学，动脑大闯关</h1>
        </div>
        <button className="quiet-button compact-button" type="button" onClick={() => void onLock()}>
          <Lock aria-hidden="true" />退出并锁定
        </button>
      </header>

      <main className="arcade-shell" data-testid="arcade-screen">
        {/* Top Illustrated Game Mode Cards */}
        <nav className="arcade-mode-grid" aria-label="选择游乐园游戏">
          {GAME_TABS.map((tab) => {
            const active = activeGame === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`arcade-mode-card ${tab.tint} ${active ? "is-active" : ""}`}
                aria-pressed={active}
                onClick={() => setActiveGame(tab.id)}
              >
                <div className="arcade-mode-art" aria-hidden="true">
                  <img src={tab.art} alt="" />
                </div>
                <div className="arcade-mode-copy">
                  <small>{tab.badge}</small>
                  <strong>{tab.label}</strong>
                </div>
              </button>
            );
          })}
        </nav>

        {starsEarnedToast ? (
          <div className="answer-feedback correct-feedback" role="status" data-testid="arcade-star-toast">
            <div className="feedback-title">
              <Star aria-hidden="true" />
              <span>恭喜闯关成功！获得 +{starsEarnedToast} 颗成长星！</span>
            </div>
          </div>
        ) : null}

        {/* GAME 1: MEMORY FLIP */}
        {activeGame === "memory-flip" ? (
          <section className="arcade-stage-card" data-testid="game-memory-flip">
            <div className="arcade-subdeck-bar">
              {MEMORY_FLIP_DECKS.map((deck, idx) => (
                <button
                  key={deck.id}
                  type="button"
                  className={`speaking-deck ${flipDeckIdx === idx ? "is-active" : ""}`}
                  onClick={() => resetMemoryDeck(idx)}
                >
                  {deck.title}
                </button>
              ))}
            </div>

            <div className="arcade-status-banner">
              <img src="./assets/images/arcade-memory.svg" alt="" aria-hidden="true" />
              <div>
                <strong>{flipDeck.title}</strong>
                <p>{flipDeck.subtitle} · 已配对 {matchedPairIds.length} / {flipDeck.pairs.length} 对 · 翻牌 {flipMoves} 次</p>
              </div>
              <button
                type="button"
                className="quiet-button compact-button"
                onClick={() => playOrSpeak(flipDeck.introAudio, "zh-CN")}
              >
                <Volume2 aria-hidden="true" />规则
              </button>
            </div>

            <div className="arcade-flip-grid">
              {flipCards.map((card) => {
                const isFlipped = flippedUids.includes(card.uid);
                const isMatched = matchedPairIds.includes(card.pairId);
                const faceUp = isFlipped || isMatched;
                return (
                  <button
                    key={card.uid}
                    type="button"
                    data-testid={`flip-card-${card.uid}`}
                    data-pair-id={card.pairId}
                    className={`arcade-flip-card ${isMatched ? "is-matched" : isFlipped ? "is-flipped" : "is-facedown"}`}
                    onClick={() => handleCardFlip(card)}
                    disabled={isMatched}
                    aria-label={faceUp ? card.text : "翻开卡片"}
                  >
                    {faceUp ? (
                      <div className="arcade-flip-face">
                        <strong>{card.text}</strong>
                        {isMatched ? <span className="arcade-match-badge"><Check aria-hidden="true" />配对成功</span> : null}
                      </div>
                    ) : (
                      <div className="arcade-flip-back">
                        <span className="arcade-flip-star">★</span>
                        <small>点我翻牌</small>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {flipAllMatched ? (
              <div className="answer-feedback correct-feedback" data-testid="memory-flip-victory">
                <div className="feedback-title">
                  <Trophy aria-hidden="true" />
                  <span>太厉害啦！{flipDeck.title} 全部配对成功！</span>
                </div>
                <div className="dialog-actions" style={{ justifyContent: "center", marginTop: "0.5rem" }}>
                  <button className="quiet-button compact-button" type="button" onClick={() => resetMemoryDeck(flipDeckIdx)}>
                    <RotateCcw aria-hidden="true" />再玩一局
                  </button>
                  <button
                    className="primary-button compact-button"
                    type="button"
                    onClick={() => resetMemoryDeck((flipDeckIdx + 1) % MEMORY_FLIP_DECKS.length)}
                  >
                    挑战下一组<ChevronRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* GAME 2: SORTING BASKET */}
        {activeGame === "sorting-basket" ? (
          <section className="arcade-stage-card" data-testid="game-sorting-basket">
            <div className="arcade-subdeck-bar">
              {SORTING_ROUNDS.map((round, idx) => (
                <button
                  key={round.id}
                  type="button"
                  className={`speaking-deck ${sortRoundIdx === idx ? "is-active" : ""}`}
                  onClick={() => resetSortingRound(idx)}
                >
                  {round.title}
                </button>
              ))}
            </div>

            <div className="arcade-status-banner">
              <img src="./assets/images/arcade-basket.svg" alt="" aria-hidden="true" />
              <div>
                <strong>{sortRound.title}</strong>
                <p>第 {Math.min(sortItemIdx + 1, sortRound.items.length)} / {sortRound.items.length} 球 · 连击 x{sortStreak}</p>
              </div>
              <span className="arcade-streak-pill">
                <Flame aria-hidden="true" /> 连击 x{sortStreak}
              </span>
            </div>

            {!sortDone && currentSortItem ? (
              <div className="arcade-court">
                <div className="arcade-ball-launchpad">
                  <div className="arcade-ball-orb" data-testid="sorting-current-ball">
                    <strong>{currentSortItem.label}</strong>
                  </div>
                  <button
                    type="button"
                    className="quiet-button compact-button"
                    onClick={() => playOrSpeak(currentSortItem.audioText, currentSortItem.lang)}
                  >
                    <Volume2 aria-hidden="true" />听一听这颗球
                  </button>
                </div>

                <div className="arcade-hoops-grid">
                  <button
                    type="button"
                    data-testid="basket-left"
                    className="arcade-hoop-card is-left"
                    onClick={() => handleSortShoot("left")}
                  >
                    <img src="./assets/images/arcade-basket.svg" alt="" aria-hidden="true" />
                    <strong>{sortRound.leftBasketTitle}</strong>
                    <small>{sortRound.leftBasketHint}</small>
                    <span className="arcade-shoot-tag">点此投篮</span>
                  </button>
                  <button
                    type="button"
                    data-testid="basket-right"
                    className="arcade-hoop-card is-right"
                    onClick={() => handleSortShoot("right")}
                  >
                    <img src="./assets/images/arcade-basket.svg" alt="" aria-hidden="true" />
                    <strong>{sortRound.rightBasketTitle}</strong>
                    <small>{sortRound.rightBasketHint}</small>
                    <span className="arcade-shoot-tag">点此投篮</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="answer-feedback correct-feedback" data-testid="sorting-basket-victory">
                <div className="feedback-title">
                  <Trophy aria-hidden="true" />
                  <span>神投手！{sortRound.title} 全部投进正确篮筐啦！</span>
                </div>
                <div className="dialog-actions" style={{ justifyContent: "center", marginTop: "0.5rem" }}>
                  <button className="quiet-button compact-button" type="button" onClick={() => resetSortingRound(sortRoundIdx)}>
                    <RotateCcw aria-hidden="true" />再投一轮
                  </button>
                  <button
                    className="primary-button compact-button"
                    type="button"
                    onClick={() => resetSortingRound((sortRoundIdx + 1) % SORTING_ROUNDS.length)}
                  >
                    换下一个球场<ChevronRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {sortFeedback ? (
              <div className={`answer-feedback ${sortFeedback.ok ? "correct-feedback" : "retry-feedback"}`} role="status">
                <p style={{ margin: 0, fontWeight: 700 }}>{sortFeedback.text}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* GAME 3: MONSTER FEEDER */}
        {activeGame === "monster-feeder" ? (
          <section className="arcade-stage-card" data-testid="game-monster-feeder">
            <div className="arcade-subdeck-bar">
              {MONSTER_STAGES.map((stage, idx) => (
                <button
                  key={stage.id}
                  type="button"
                  className={`speaking-deck ${monsterStageIdx === idx ? "is-active" : ""}`}
                  onClick={() => resetMonsterStage(idx)}
                >
                  {stage.title}
                </button>
              ))}
            </div>

            <div className="arcade-monster-stage">
              <div className="arcade-monster-character">
                <img src="./assets/images/arcade-monster.svg" alt="" />
                <div className="arcade-monster-meter" aria-label="小怪兽饱腹度">
                  <span>饱腹度 {fedFoodIds.length} / {monsterTargetCount}</span>
                  <div>
                    <i style={{ width: `${(fedFoodIds.length / monsterTargetCount) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="arcade-monster-bubble">
                <small>贪吃小怪兽 · {monsterStage.title}</small>
                <strong>{monsterMessage || monsterStage.cravingText}</strong>
                <button
                  type="button"
                  className="quiet-button compact-button"
                  onClick={() => playOrSpeak(monsterStage.cravingAudio, monsterStage.lang)}
                >
                  <Volume2 aria-hidden="true" />
                  <span>再听一次小怪兽想吃什么</span>
                </button>
              </div>
            </div>

            <div className="arcade-food-grid">
              {monsterStage.foods.map((food) => {
                const isFed = fedFoodIds.includes(food.id);
                const isWrong = wrongFoodIds.includes(food.id);
                return (
                  <button
                    key={food.id}
                    type="button"
                    data-testid={`monster-food-${food.id}`}
                    className={`arcade-food-plate ${isFed ? "is-fed" : isWrong ? "is-wrong" : ""}`}
                    disabled={isFed || isWrong || monsterFull}
                    onClick={() => handleFeedMonster(food)}
                  >
                    <span className="arcade-food-icon" aria-hidden="true">🍪</span>
                    <strong>{food.label}</strong>
                    <small>{isFed ? "吃进肚子啦！" : isWrong ? "不合胃口" : "点我喂食"}</small>
                  </button>
                );
              })}
            </div>

            {monsterFull ? (
              <div className="answer-feedback correct-feedback" data-testid="monster-feeder-victory">
                <div className="feedback-title">
                  <Sparkles aria-hidden="true" />
                  <span>小怪兽吃得饱饱的！{monsterStage.successAudio}</span>
                </div>
                <div className="dialog-actions" style={{ justifyContent: "center", marginTop: "0.5rem" }}>
                  <button className="quiet-button compact-button" type="button" onClick={() => resetMonsterStage(monsterStageIdx)}>
                    <RotateCcw aria-hidden="true" />再喂一次
                  </button>
                  <button
                    className="primary-button compact-button"
                    type="button"
                    onClick={() => resetMonsterStage((monsterStageIdx + 1) % MONSTER_STAGES.length)}
                  >
                    下一关<ChevronRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* GAME 4: STORY QUEST */}
        {activeGame === "story-quest" ? (
          <section className="arcade-stage-card" data-testid="game-story-quest">
            <div className="arcade-subdeck-bar">
              {STORY_QUESTS.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  className={`speaking-deck ${questIdx === idx ? "is-active" : ""}`}
                  onClick={() => selectQuest(idx)}
                >
                  <BookOpen aria-hidden="true" />
                  {q.title}
                </button>
              ))}
            </div>

            <div className="arcade-scene-steps" aria-label="绘本章节进度">
              {currentQuest.scenes.map((sc, idx) => (
                <span
                  key={sc.id}
                  className={`arcade-scene-step ${idx === sceneIdx ? "is-current" : idx < sceneIdx || questCompleted ? "is-done" : ""}`}
                >
                  <i>{idx + 1}</i>
                  <b>{sc.sceneTitle}</b>
                </span>
              ))}
            </div>

            <div className="arcade-storybook">
              <div className="arcade-story-page is-left-page">
                <div className="arcade-story-illustration">
                  <img src={`./assets/images/${currentScene.image}.png`} alt="" />
                </div>
                <p className="eyebrow">{currentQuest.subtitle}</p>
                <h2>{currentScene.sceneTitle}</h2>
                <p className="arcade-story-paragraph">{currentScene.storyText}</p>
                <button
                  type="button"
                  className="quiet-button compact-button"
                  onClick={() => playOrSpeak(currentScene.storyAudio, "zh-CN")}
                >
                  <Volume2 aria-hidden="true" />听小芽老师讲这一幕故事
                </button>
              </div>

              <div className="arcade-story-page is-right-page">
                <span className="eyebrow">闯关小机关 · 第 {sceneIdx + 1} / {currentQuest.scenes.length} 幕</span>
                <h3>{currentScene.questionText}</h3>
                <div className="answer-grid">
                  {currentScene.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`answer-option ${sceneSolved && option === currentScene.correctAnswer ? "is-correct" : ""}`}
                      disabled={sceneSolved}
                      onClick={() => handleStoryAnswer(option)}
                    >
                      <span>{option}</span>
                    </button>
                  ))}
                </div>

                {sceneFeedback ? (
                  <div className={`answer-feedback ${sceneFeedback.ok ? "correct-feedback" : "retry-feedback"}`} role="status">
                    <p style={{ margin: 0, fontWeight: 700 }}>{sceneFeedback.text}</p>
                    {sceneSolved ? (
                      <div className="dialog-actions" style={{ justifyContent: "center", marginTop: "0.75rem" }}>
                        {sceneIdx + 1 < currentQuest.scenes.length ? (
                          <button className="primary-button compact-button" type="button" onClick={advanceStoryScene}>
                            进入下一幕故事<ChevronRight aria-hidden="true" />
                          </button>
                        ) : (
                          <button
                            className="primary-button compact-button"
                            type="button"
                            onClick={() => selectQuest((questIdx + 1) % STORY_QUESTS.length)}
                          >
                            读下一册绘本<ChevronRight aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {questCompleted ? (
                  <div className="answer-feedback correct-feedback" data-testid="story-quest-victory">
                    <div className="feedback-title">
                      <Trophy aria-hidden="true" />
                      <span>{currentQuest.completionAudio}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
