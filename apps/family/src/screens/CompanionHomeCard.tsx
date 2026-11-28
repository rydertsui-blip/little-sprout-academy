import { useState } from "react";
import { ChevronRight, Heart, LockKeyhole, Sparkles, Star } from "lucide-react";
import { PuppyCompanion } from "../companions/PuppyCompanion";
import { COMPANIONS, localiseCompanionInfo } from "../companions/companions";
import { COMPANION_ACCESSORIES, PET_TOUCH_VOICES_EN, PET_TOUCH_VOICES_ZH, accessoryName } from "../companions/accessories";
import { playOrSpeak } from "../lib/audio";
import { playSfx } from "../lib/sfx";
import type { GrowthRewardState } from "../lib/types";
import type { Locale } from "../content/copy";

interface CompanionHomeCardProps {
  rewards: GrowthRewardState;
  animationsEnabled: boolean;
  onOpen: () => void;
  locale: Locale;
}

export function CompanionHomeCard({ rewards, animationsEnabled, onOpen, locale }: CompanionHomeCardProps) {
  const [petting, setPetting] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  const active = COMPANIONS.find((companion) => companion.id === rewards.activeCompanionId);
  const owned = COMPANIONS.find((companion) => rewards.redeemedCompanionIds.includes(companion.id));
  const next = COMPANIONS.find((companion) => !rewards.redeemedCompanionIds.includes(companion.id));
  const shown = active ?? owned ?? next;
  const en = locale === "en";
  if (!shown) return null;
  const shownName = localiseCompanionInfo(shown, locale).name;
  const isRedeemed = rewards.redeemedCompanionIds.includes(shown.id);
  const remaining = Math.max(0, shown.unlockAtStars - rewards.lifetimeStars);
  const canRedeem = !isRedeemed && remaining === 0;
  const locked = !isRedeemed && !canRedeem;
  const equippedIds = rewards.equippedAccessoryIds ?? [];
  const equippedLabels = equippedIds
    .map((id) => COMPANION_ACCESSORIES.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .map((a) => accessoryName(a, locale));

  function handlePetTouch() {
    if (!shown) return;
    playSfx("pet-happy");
    const nextIdx = touchCount;
    setTouchCount((c) => c + 1);
    setPetting(true);
    const customVoice = en ? shown.touchVoiceEn : shown.touchVoiceZh;
    const pool = [customVoice, ...(en ? PET_TOUCH_VOICES_EN : PET_TOUCH_VOICES_ZH)];
    const line = pool[nextIdx % pool.length]!;
    setSpeechBubble(line);
    playOrSpeak(line, en ? "en-US" : "zh-CN");
    window.setTimeout(() => setPetting(false), 1400);
  }

  return (
    <div className="companion-home-wrapper">
      <button
        className={`companion-home-card ${locked ? "is-locked" : ""}`.trim()}
        type="button"
        aria-label={en ? "Open the Companion Shop" : "打开伙伴兑换商城"}
        onClick={onOpen}
      >
        <div className="companion-home-art" aria-hidden="true" style={{ background: `linear-gradient(180deg, ${shown.themeTint} 0 72%, #f6dcaa 72% 100%)` }}>
          <PuppyCompanion
            companionId={shown.id}
            state={petting ? "tap-react" : active ? "idle" : "idle"}
            animate={animationsEnabled}
            equippedAccessoryIds={equippedIds}
          />
          {petting ? <span className="pet-heart-float" aria-hidden="true">❤️</span> : null}
        </div>
        <div className="companion-home-copy">
          <span className="eyebrow">{en ? "My learning companion" : "我的学习伙伴"}</span>
          <strong>
            {active
              ? en
                ? `${shownName} is learning with you`
                : `${active.name}正在陪你学习`
              : owned
                ? en
                  ? `${shownName} is waiting in your collection`
                  : `${owned.name}在收藏册里等你`
                : canRedeem
                  ? en
                    ? `${shownName} is ready to redeem`
                    : `${shown.name}可以兑换了`
                  : en
                    ? `${shownName} needs ${remaining} more growth stars`
                    : `${shown.name}还差 ${remaining} 颗成长星`}
          </strong>
          {speechBubble ? (
            <p className="companion-speech-pill" data-testid="companion-speech-pill">{speechBubble}</p>
          ) : equippedLabels.length > 0 ? (
            <small className="companion-equipped-summary">
              ✨ {en ? `Wearing: ${equippedLabels.join(", ")}` : `已穿戴：${equippedLabels.join(" · ")}`}
            </small>
          ) : null}
          {locked ? (
            <div
              className="companion-star-meter"
              aria-label={
                en
                  ? `Growth star progress ${Math.min(rewards.lifetimeStars, shown.unlockAtStars)} / ${shown.unlockAtStars}`
                  : `成长星进度 ${Math.min(rewards.lifetimeStars, shown.unlockAtStars)} / ${shown.unlockAtStars}`
              }
            >
              {Array.from({ length: shown.unlockAtStars }, (_, index) => (
                <Star
                  key={index}
                  aria-hidden="true"
                  fill={index < rewards.lifetimeStars ? "#f4b84b" : "transparent"}
                  className={index < rewards.lifetimeStars ? "is-filled" : ""}
                />
              ))}
            </div>
          ) : null}
          <small>
            <Star aria-hidden="true" />
            {en ? `${rewards.lifetimeStars} growth stars` : `已有 ${rewards.lifetimeStars} 颗成长星`}
          </small>
        </div>
        <div className="companion-home-action">
          {locked ? <LockKeyhole aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
          <span>
            {locked
              ? en
                ? "View the shop"
                : "看看伙伴商城"
              : canRedeem
                ? en
                  ? "Redeem a companion"
                  : "去兑换伙伴"
                : en
                  ? "Companion Shop"
                  : "伙伴商城"}
          </span>
          <ChevronRight aria-hidden="true" />
        </div>
      </button>
      <div className="companion-home-quickbar">
        <button
          type="button"
          className={`quiet-button compact-button pet-interact-btn ${petting ? "is-active" : ""}`}
          data-testid="pet-touch-btn"
          onClick={handlePetTouch}
        >
          <Heart aria-hidden="true" />
          {en ? `Pat ${shownName}` : `摸摸${shown.name}互动`}
        </button>
        <button
          type="button"
          className="quiet-button compact-button"
          data-testid="open-wardrobe-btn"
          onClick={onOpen}
        >
          <Sparkles aria-hidden="true" />
          {en ? "Wardrobe & Dress-up" : "装扮小衣橱"}
        </button>
      </div>
    </div>
  );
}
