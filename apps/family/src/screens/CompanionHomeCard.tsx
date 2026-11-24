import { ChevronRight, LockKeyhole, Sparkles, Star } from "lucide-react";
import { PuppyCompanion } from "../companions/PuppyCompanion";
import { COMPANIONS } from "../companions/companions";
import type { GrowthRewardState } from "../lib/types";
import type { Locale } from "../content/copy";

interface CompanionHomeCardProps {
  rewards: GrowthRewardState;
  animationsEnabled: boolean;
  onOpen: () => void;
  locale: Locale;
}

function companionName(name: string, locale: Locale) {
  return locale === "en" && name === "豆豆" ? "Doudou" : name;
}

export function CompanionHomeCard({ rewards, animationsEnabled, onOpen, locale }: CompanionHomeCardProps) {
  const active = COMPANIONS.find((companion) => companion.id === rewards.activeCompanionId);
  const owned = COMPANIONS.find((companion) => rewards.redeemedCompanionIds.includes(companion.id));
  const next = COMPANIONS.find((companion) => !rewards.redeemedCompanionIds.includes(companion.id));
  const shown = active ?? owned ?? next;
  const en = locale === "en";
  const shownName = shown ? companionName(shown.name, locale) : "";
  if (!shown) return null;
  const isRedeemed = rewards.redeemedCompanionIds.includes(shown.id);
  const remaining = Math.max(0, shown.unlockAtStars - rewards.lifetimeStars);
  const canRedeem = !isRedeemed && remaining === 0;
  const locked = !isRedeemed && !canRedeem;

  return (
    <button className={`companion-home-card ${locked ? "is-locked" : ""}`.trim()} type="button" aria-label={en ? "Open the Companion Shop" : "打开伙伴兑换商城"} onClick={onOpen}>
      <div className="companion-home-art" aria-hidden="true">
        <PuppyCompanion state={active ? "idle" : "idle"} animate={animationsEnabled} />
      </div>
      <div className="companion-home-copy">
        <span className="eyebrow">{en ? "My learning companion" : "我的学习伙伴"}</span>
        <strong>{active ? (en ? `${shownName} is learning with you` : `${active.name}正在陪你学习`) : owned ? (en ? `${shownName} is waiting in your collection` : `${owned.name}在收藏册里等你`) : canRedeem ? (en ? `${shownName} is ready to redeem` : `${shown.name}可以兑换了`) : (en ? `${shownName} needs ${remaining} more growth stars` : `${shown.name}还差 ${remaining} 颗成长星`)}</strong>
        {locked ? <div className="companion-star-meter" aria-label={en ? `Growth star progress ${Math.min(rewards.lifetimeStars, shown.unlockAtStars)} / ${shown.unlockAtStars}` : `成长星进度 ${Math.min(rewards.lifetimeStars, shown.unlockAtStars)} / ${shown.unlockAtStars}`}>{Array.from({ length: shown.unlockAtStars }, (_, index) => <Star key={index} aria-hidden="true" fill={index < rewards.lifetimeStars ? "#f4b84b" : "transparent"} className={index < rewards.lifetimeStars ? "is-filled" : ""} />)}</div> : null}
        <small><Star aria-hidden="true" />{en ? `${rewards.lifetimeStars} growth stars` : `已有 ${rewards.lifetimeStars} 颗成长星`}</small>
      </div>
      <div className="companion-home-action">
        {locked ? <LockKeyhole aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
        <span>{locked ? (en ? "View the shop" : "看看伙伴商城") : canRedeem ? (en ? "Redeem a companion" : "去兑换伙伴") : (en ? "Companion Shop" : "伙伴商城")}</span>
        <ChevronRight aria-hidden="true" />
      </div>
    </button>
  );
}
