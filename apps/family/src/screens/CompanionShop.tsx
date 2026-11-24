import { useState } from "react";
import { ArrowLeft, Check, LockKeyhole, Sparkles, Star } from "lucide-react";
import { PuppyCompanion } from "../companions/PuppyCompanion";
import { COMPANIONS } from "../companions/companions";
import { getRedeemableCompanionIds } from "../rewards/rewardState";
import type { GrowthRewardState } from "../lib/types";
import type { Locale } from "../content/copy";

interface CompanionShopProps {
  rewards: GrowthRewardState;
  animationsEnabled: boolean;
  onBack: () => void;
  onRedeem: (companionId: string) => Promise<boolean>;
  onSetActive: (companionId: string) => Promise<boolean>;
  locale: Locale;
}

function localiseCompanion(companion: { id: string; name: string; description: string }, locale: Locale) {
  if (locale !== "en") return companion;
  if (companion.id === "gemini-doudou") {
    return { ...companion, name: "Doudou", description: "A curious, gentle puppy who listens with you and celebrates every finish." };
  }
  return companion;
}

type ShopTab = "redeemable" | "owned";

export function CompanionShop({ rewards, animationsEnabled, onBack, onRedeem, onSetActive, locale }: CompanionShopProps) {
  const en = locale === "en";
  const [tab, setTab] = useState<ShopTab>("redeemable");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const redeemableIds = getRedeemableCompanionIds(rewards);
  const confirmed = confirmId ? COMPANIONS.find((companion) => companion.id === confirmId) : null;

  async function redeem() {
    if (!confirmed || saving) return;
    setSaving(true);
    const ok = await onRedeem(confirmed.id);
    setSaving(false);
    if (ok) {
      setConfirmId(null);
      setError("");
      setTab("owned");
    } else {
      setError(en ? "This was not saved. Your stars and collection are unchanged." : "这次没有保存成功，成长星和收藏都没有改变。");
    }
  }

  async function activate(companionId: string) {
    if (saving) return;
    setSaving(true);
    const ok = await onSetActive(companionId);
    setSaving(false);
    setError(ok ? "" : (en ? "This was not saved. Your active companion is unchanged." : "没有保存成功，当前陪伴角色没有改变。"));
  }

  const visibleCompanions = tab === "redeemable"
    ? COMPANIONS.filter((companion) => !rewards.redeemedCompanionIds.includes(companion.id))
    : COMPANIONS.filter((companion) => rewards.redeemedCompanionIds.includes(companion.id));

  return (
    <main className="companion-shop">
      <header className="companion-shop-header">
        <button className="quiet-button compact-button" type="button" onClick={onBack} aria-label={en ? "Back to the child home" : "返回孩子首页"}><ArrowLeft aria-hidden="true" />{en ? "Back" : "返回"}</button>
        <div>
          <p className="eyebrow">{en ? "Companion Shop" : "伙伴兑换商城"}</p>
          <h1>{en ? "My learning companions" : "我的学习伙伴"}</h1>
        </div>
        <div className="growth-star-balance" aria-label={en ? "Growth stars" : "成长星总数"}><Star aria-hidden="true" /><strong>{rewards.lifetimeStars}</strong><span>{en ? "growth stars" : "颗成长星"}</span></div>
      </header>

      <div className="companion-shop-tabs" role="tablist" aria-label={en ? "Companion categories" : "伙伴分类"}>
        <button type="button" role="tab" aria-selected={tab === "redeemable"} aria-controls="redeemable-panel" onClick={() => setTab("redeemable")}>{en ? "Available" : "可以兑换"}</button>
        <button type="button" role="tab" aria-selected={tab === "owned"} aria-controls="owned-panel" onClick={() => setTab("owned")}>{en ? "My companions" : "我的伙伴"}</button>
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <section className={`companion-shop-grid ${tab === "owned" ? "is-owned-view" : ""}`} id={tab === "redeemable" ? "redeemable-panel" : "owned-panel"} role="tabpanel">
        {visibleCompanions.length === 0 ? (
          <div className="companion-shop-empty">
            {tab === "redeemable" ? <img className="companion-shop-empty-art" src="./assets/images/mystery-egg.png" alt="" /> : <Sparkles aria-hidden="true" />}
            <h2>{tab === "redeemable" ? (en ? "The next companion is being prepared" : "下一只伙伴还在准备中") : (en ? "No companions yet" : "还没有兑换伙伴")}</h2>
            <p>{tab === "redeemable" ? (en ? "The island is designing the next companion. When it arrives, it will appear here and can be redeemed with growth stars." : "小岛正在给下一只伙伴画样子。它来了就会出现在这里，用成长星直接兑换。") : (en ? "Once you reach the threshold, choose a companion from Available." : "达到门槛后，到「可以兑换」选择喜欢的伙伴。")}</p>
          </div>
        ) : visibleCompanions.map((companion) => {
          const owned = rewards.redeemedCompanionIds.includes(companion.id);
          const redeemable = redeemableIds.includes(companion.id);
          const remaining = Math.max(0, companion.unlockAtStars - rewards.lifetimeStars);
          const active = rewards.activeCompanionId === companion.id;
          return (
            <article key={companion.id} className={`companion-shop-card ${owned ? "is-owned" : redeemable ? "is-redeemable" : "is-locked"}`}>
              <div className="companion-card-art" aria-hidden={!redeemable && !owned}>
                <PuppyCompanion state={owned && active ? "celebrate" : "idle"} animate={animationsEnabled} />
              </div>
              <div className="companion-card-copy">
                <span className="companion-card-state">{owned ? (en ? "Owned" : "已经拥有") : redeemable ? (en ? "Available" : "可以兑换") : (en ? "Locked" : "尚未达到")}</span>
                <h2>{localiseCompanion(companion, locale).name}</h2>
                <p>{localiseCompanion(companion, locale).description}</p>
                {owned ? (
                  active ? <div className="current-companion-badge"><Check aria-hidden="true" />{en ? "Active companion" : "正在陪伴"}</div> : <button className="primary-button compact-button" type="button" disabled={saving} onClick={() => void activate(companion.id)}>{en ? `Set ${localiseCompanion(companion, locale).name} as my companion` : `让${companion.name}陪我`}</button>
                ) : redeemable ? (
                  <button className="primary-button compact-button" type="button" onClick={() => setConfirmId(companion.id)}><Sparkles aria-hidden="true" />{en ? "Redeem" : "兑换"}</button>
                ) : (
                  <div className="companion-locked-copy"><LockKeyhole aria-hidden="true" /><span>{en ? `${remaining} more growth stars needed` : `还差 ${remaining} 颗成长星`}</span></div>
                )}
              </div>
            </article>
          );
        })}
        {tab === "redeemable" && visibleCompanions.length > 0 ? (
          <article className="companion-shop-card is-coming" aria-label={en ? "The next companion is being prepared" : "下一只伙伴正在准备"}>
            <div className="companion-card-art companion-card-art-egg" aria-hidden="true">
              <img src="./assets/images/mystery-egg.png" alt="" />
              <span className="companion-egg-badge"><LockKeyhole aria-hidden="true" /></span>
            </div>
            <div className="companion-card-copy">
              <span className="companion-card-state">{en ? "Next companion" : "下一只伙伴"}</span>
              <h2>{en ? "In preparation" : "还在准备中"}</h2>
              <p>{en ? "The island is designing the next companion. It will appear here and can be redeemed with growth stars." : "小岛正在给下一只伙伴画样子。它来了就会出现在这里，用成长星直接兑换。"}</p>
              <div className="companion-locked-copy"><LockKeyhole aria-hidden="true" /><span>{en ? "No lottery, no payment" : "不是抽奖，也不用付款"}</span></div>
            </div>
          </article>
        ) : null}
      </section>

      {confirmed ? (
        <div className="modal-backdrop">
          <div className="modal-card companion-confirm-card" role="dialog" aria-modal="true" aria-labelledby="companion-confirm-title">
            <p className="eyebrow">{en ? "Redeem a companion" : "伙伴兑换"}</p>
            <h2 id="companion-confirm-title">{en ? `Redeem ${localiseCompanion(confirmed, locale).name}` : `兑换${confirmed.name}`}</h2>
            <p>{en ? "It will join your companion collection. No growth stars are deducted and no payment is needed." : "兑换后会加入你的伙伴收藏。成长星不会扣除，也不需要付款。"}</p>
            <div className="dialog-actions">
              <button className="quiet-button" type="button" disabled={saving} onClick={() => setConfirmId(null)}>{en ? "Not now" : "先不兑换"}</button>
              <button className="primary-button" type="button" disabled={saving} onClick={() => void redeem()}>{saving ? (en ? "Saving…" : "保存中…") : (en ? "Confirm redeem" : "确认兑换")}</button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="companion-shop-footnote">
        <span>{en ? `${rewards.lifetimeStars} growth stars` : `已有 ${rewards.lifetimeStars} 颗成长星`}</span>
        <span>{en ? "Stars only grow; there is no purchase, lottery or ranking." : "星星只增不减，不设购买、抽奖或排名。"}</span>
      </footer>
    </main>
  );
}
