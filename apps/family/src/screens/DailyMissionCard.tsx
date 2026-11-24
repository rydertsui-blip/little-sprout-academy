import { SKILLS } from "../content/catalog";
import { uiCopyFor, type Locale } from "../content/copy";
import type { SubjectProgressView } from "../engine/progressView";

interface DailyMissionCardProps {
  progress: SubjectProgressView;
  hasDiagnostic: boolean;
  hasActiveSession: boolean;
  reviewCount: number;
  locale: Locale;
}

export function DailyMissionCard({ progress, hasDiagnostic, hasActiveSession, reviewCount, locale }: DailyMissionCardProps) {
  const copy = uiCopyFor(locale).child;
  const currentSkill = SKILLS.find((skill) => skill.id === progress.currentSkillId);
  const currentTitle = currentSkill ? (locale === "en" ? currentSkill.title : currentSkill.shortTitle) : progress.currentSkillTitle;
  const route = !hasDiagnostic
    ? copy.dailyStart
    : progress.todayCompleted
      ? copy.dailyCompleted
      : hasActiveSession
        ? copy.dailyContinue
        : reviewCount > 0
          ? copy.dailyReviewPlan(reviewCount)
          : copy.dailyWarmupPlan;

  return (
    <div className="daily-mission-card">
      <strong>{route}</strong>
      {hasDiagnostic ? <span>{copy.dailyCurrent(currentTitle)}</span> : null}
    </div>
  );
}
