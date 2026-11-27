import { Award, Check, Flame, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { buildSevenDayStreak, evaluateChildBadges, type AchievementBadgeStatus } from "../content/achievements";
import { VOICE_LINES } from "../content/audioAssets";
import type { Locale } from "../content/copy";
import { playOrSpeak } from "../lib/audio";
import type { ChildProfile } from "../lib/types";

export function StreakBadgeWall({
  child,
  locale = "zh",
  compact = false
}: {
  child: ChildProfile;
  locale?: Locale;
  compact?: boolean;
}) {
  const streak = useMemo(() => buildSevenDayStreak(child), [child]);
  const badges = useMemo(() => evaluateChildBadges(child), [child]);
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadgeStatus | null>(null);

  function handleSelectBadge(badge: AchievementBadgeStatus) {
    setSelectedBadge(badge);
    const speech =
      locale === "en"
        ? badge.unlocked
          ? VOICE_LINES.praiseEn2
          : VOICE_LINES.retryEncourageEn1
        : badge.unlocked
          ? VOICE_LINES.praiseZh2
          : VOICE_LINES.retryEncourageZh1;
    playOrSpeak(speech, locale === "en" ? "en-US" : "zh-CN");
  }

  return (
    <section
      className={`streak-badge-wall ${compact ? "is-compact" : ""}`}
      data-testid="streak-badge-wall"
      aria-label={locale === "en" ? "7-day learning footprint and achievement badges" : "7 天学习足迹与小芽成就勋章墙"}
    >
      <div className="streak-banner-row">
        <div className="streak-summary-box">
          <span className="studio-hub-pill">
            <Flame aria-hidden="true" />{" "}
            {locale === "en"
              ? `${streak.activeDaysCount}/7 days active · ${streak.currentStreak} day streak`
              : `近 7 天打卡 ${streak.activeDaysCount} 天 · 连续坚持 ${streak.currentStreak} 天`}
          </span>
          <h3>
            {locale === "en"
              ? `Sprout Footprint & Badges (${unlockedCount}/${badges.length})`
              : `小芽成长足迹与成就勋章墙（已点亮 ${unlockedCount}/${badges.length} 枚）`}
          </h3>
          <p>
            {locale === "en"
              ? "Practice every day to light up your 7-day sprout footprint and collect all 12 badges!"
              : "每天学一轮、写一写或玩闯关就能点亮当天小树苗，点任意勋章可以听小芽老师播报进度！"}
          </p>
        </div>

        <div className="streak-seven-days" data-testid="streak-seven-days" role="list" aria-label={locale === "en" ? "Last 7 days" : "最近 7 天打卡日历"}>
          {streak.days.map((day) => (
            <div
              key={day.dateKey}
              role="listitem"
              className={`streak-day-pill ${day.active ? "is-active" : ""} ${day.isToday ? "is-today" : ""}`}
            >
              <span className="streak-day-circle" aria-hidden="true">
                {day.active ? <Check aria-hidden="true" /> : "🌱"}
              </span>
              <strong>{locale === "en" ? day.labelEn : day.labelZh}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="badge-wall-grid" data-testid="badge-wall-grid">
        {badges.map((badge) => (
          <button
            key={badge.id}
            type="button"
            data-testid={`badge-card-${badge.id}`}
            className={`badge-wall-card ${badge.unlocked ? "is-unlocked" : "is-locked"} ${selectedBadge?.id === badge.id ? "is-selected" : ""}`}
            onClick={() => handleSelectBadge(badge)}
          >
            <div
              className="badge-wall-icon"
              style={{ backgroundColor: badge.unlocked ? badge.accent : "#eef1ec" }}
              aria-hidden="true"
            >
              <span>{badge.emoji}</span>
            </div>
            <div className="badge-wall-copy">
              <strong>{locale === "en" ? badge.titleEn : badge.titleZh}</strong>
              <small>{locale === "en" ? badge.descEn : badge.descZh}</small>
              <span className={`badge-wall-progress ${badge.unlocked ? "is-done" : ""}`}>
                {badge.unlocked
                  ? locale === "en"
                    ? "★ Unlocked"
                    : "★ 已点亮"
                  : locale === "en"
                    ? badge.progressLabelEn
                    : badge.progressLabelZh}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selectedBadge ? (
        <div className="badge-detail-toast" data-testid="badge-detail-toast" role="status" aria-live="polite">
          <Award aria-hidden="true" />
          <div>
            <strong>
              {selectedBadge.emoji} {locale === "en" ? selectedBadge.titleEn : selectedBadge.titleZh} ·{" "}
              {selectedBadge.unlocked
                ? locale === "en"
                  ? "Unlocked!"
                  : "已点亮！"
                : locale === "en"
                  ? selectedBadge.progressLabelEn
                  : selectedBadge.progressLabelZh}
            </strong>
            <p>{locale === "en" ? selectedBadge.descEn : selectedBadge.descZh}</p>
          </div>
          <Volume2 aria-hidden="true" />
        </div>
      ) : null}
    </section>
  );
}
