import { ENGLISH_HANDWRITING_ITEMS } from "./englishHandwriting";
import { HANDWRITING_CHARACTERS } from "./handwriting";
import { singaporeDateKey } from "../engine/dailyPlan";
import type { ChildProfile } from "../lib/types";

export interface StreakDayCell {
  dateKey: string;
  labelZh: string;
  labelEn: string;
  active: boolean;
  isToday: boolean;
}

export interface StreakSummary {
  days: StreakDayCell[];
  activeDaysCount: number;
  currentStreak: number;
  totalActiveDays: number;
}

export interface AchievementBadgeStatus {
  id: string;
  emoji: string;
  accent: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  unlocked: boolean;
  progressLabelZh: string;
  progressLabelEn: string;
}

const WEEKDAY_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function collectChildActiveDates(child: ChildProfile): Set<string> {
  const dates = new Set<string>();
  for (const attempt of child.attempts) {
    if (attempt.createdAt) dates.add(singaporeDateKey(new Date(attempt.createdAt)));
  }
  for (const session of child.sessions) {
    if (session.completedAt) dates.add(singaporeDateKey(new Date(session.completedAt)));
    else if (session.startedAt) dates.add(singaporeDateKey(new Date(session.startedAt)));
  }
  for (const rec of Object.values(child.handwriting)) {
    if (rec?.lastCompletedAt) dates.add(singaporeDateKey(new Date(rec.lastCompletedAt)));
  }
  return dates;
}

export function buildSevenDayStreak(child: ChildProfile, now = new Date()): StreakSummary {
  const activeDates = collectChildActiveDates(child);
  const days: StreakDayCell[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(now.getTime() - offset * 86_400_000);
    const dateKey = singaporeDateKey(d);
    const dayIndex = d.getDay();
    days.push({
      dateKey,
      labelZh: offset === 0 ? "今天" : WEEKDAY_ZH[dayIndex],
      labelEn: offset === 0 ? "Today" : WEEKDAY_EN[dayIndex],
      active: activeDates.has(dateKey),
      isToday: offset === 0
    });
  }

  let currentStreak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const d = new Date(now.getTime() - offset * 86_400_000);
    const key = singaporeDateKey(d);
    if (activeDates.has(key)) {
      currentStreak += 1;
    } else if (offset === 0) {
      // Allow streak from yesterday if today hasn't started yet
      continue;
    } else {
      break;
    }
  }

  return {
    days,
    activeDaysCount: days.filter((item) => item.active).length,
    currentStreak,
    totalActiveDays: activeDates.size
  };
}

export function evaluateChildBadges(child: ChildProfile, now = new Date()): AchievementBadgeStatus[] {
  const streak = buildSevenDayStreak(child, now);
  const totalAttempts = child.attempts.length;
  const correctAttempts = child.attempts.filter((a) => a.correct).length;
  const independentCorrect = child.attempts.filter((a) => a.correct && !a.hintUsed).length;
  const diagCount = Object.keys(child.diagnostics).length;

  const pinyinCorrect = child.attempts.filter(
    (a) =>
      a.correct &&
      ["mandarin-initials", "mandarin-finals", "mandarin-tones", "mandarin-syllables"].includes(a.skillId)
  ).length;

  const olympiadCorrect = child.attempts.filter(
    (a) =>
      a.correct &&
      ["math-olympiad-reasoning", "math-two-step-problems", "math-number-patterns-1000"].includes(a.skillId)
  ).length;

  const classicCorrect = child.attempts.filter(
    (a) =>
      a.correct &&
      ["mandarin-idioms-classics", "mandarin-passage-comprehension", "mandarin-reading-inference"].includes(a.skillId)
  ).length;

  const scienceCorrect = child.attempts.filter(
    (a) =>
      a.correct &&
      ["english-science-nature", "english-reading-inference", "english-cloze-passage"].includes(a.skillId)
  ).length;

  const zhWritingDone = HANDWRITING_CHARACTERS.filter((item) => Boolean(child.handwriting[item.character])).length;
  const enWritingDone = ENGLISH_HANDWRITING_ITEMS.filter((item) => Boolean(child.handwriting[item.character])).length;
  const stars = child.rewards.lifetimeStars;
  const companionsCount = child.rewards.redeemedCompanionIds.length;
  const sessionsDone = child.sessions.length;

  return [
    {
      id: "first-step",
      emoji: "🌱",
      accent: "#cce8c9",
      titleZh: "初登小岛",
      titleEn: "First Sprout",
      descZh: "完成第 1 道学习题目",
      descEn: "Complete your first learning question",
      unlocked: totalAttempts >= 1,
      progressLabelZh: `${Math.min(1, totalAttempts)} / 1 题`,
      progressLabelEn: `${Math.min(1, totalAttempts)} / 1 question`
    },
    {
      id: "island-explorer",
      emoji: "🧭",
      accent: "#d8e2f7",
      titleZh: "三岛探险家",
      titleEn: "Island Explorer",
      descZh: "完成任意 1 科起点小试",
      descEn: "Finish a subject starting check",
      unlocked: diagCount >= 1,
      progressLabelZh: `${diagCount} / 3 科已测`,
      progressLabelEn: `${diagCount} / 3 subjects`
    },
    {
      id: "pinyin-master",
      emoji: "🎵",
      accent: "#ffe3a4",
      titleZh: "拼音小达人",
      titleEn: "Pinyin Master",
      descZh: "声母、韵母、声调与音节答对 6 题",
      descEn: "Answer 6 Pinyin questions correctly",
      unlocked: pinyinCorrect >= 6,
      progressLabelZh: `${Math.min(6, pinyinCorrect)} / 6 题`,
      progressLabelEn: `${Math.min(6, pinyinCorrect)} / 6 correct`
    },
    {
      id: "olympiad-detective",
      emoji: "⚖️",
      accent: "#ffd4c7",
      titleZh: "奥数小侦探",
      titleEn: "Olympiad Detective",
      descZh: "奥数巧算与应用推理答对 3 题",
      descEn: "Solve 3 Olympiad or multi-step logic puzzles",
      unlocked: olympiadCorrect >= 3,
      progressLabelZh: `${Math.min(3, olympiadCorrect)} / 3 题`,
      progressLabelEn: `${Math.min(3, olympiadCorrect)} / 3 solved`
    },
    {
      id: "classic-poet",
      emoji: "📜",
      accent: "#f7d9c4",
      titleZh: "国学小诗人",
      titleEn: "Classical Poet",
      descZh: "成语典故、古诗与短文阅读答对 3 题",
      descEn: "Answer 3 Chinese idioms, poems or stories",
      unlocked: classicCorrect >= 3,
      progressLabelZh: `${Math.min(3, classicCorrect)} / 3 题`,
      progressLabelEn: `${Math.min(3, classicCorrect)} / 3 correct`
    },
    {
      id: "science-ranger",
      emoji: "🔬",
      accent: "#bfe5e3",
      titleZh: "科学探索家",
      titleEn: "Science Ranger",
      descZh: "自然科学百科与推理阅读答对 3 题",
      descEn: "Answer 3 Science & nature inquiry questions",
      unlocked: scienceCorrect >= 3,
      progressLabelZh: `${Math.min(3, scienceCorrect)} / 3 题`,
      progressLabelEn: `${Math.min(3, scienceCorrect)} / 3 correct`
    },
    {
      id: "calligrapher-zh",
      emoji: "🖌️",
      accent: "#ffd6cc",
      titleZh: "小小书法家",
      titleEn: "Chinese Calligrapher",
      descZh: "在米字格写字工坊完成 5 个汉字描红",
      descEn: "Trace 5 Chinese characters in the rice-grid",
      unlocked: zhWritingDone >= 5,
      progressLabelZh: `${Math.min(5, zhWritingDone)} / 5 字`,
      progressLabelEn: `${Math.min(5, zhWritingDone)} / 5 chars`
    },
    {
      id: "phonics-writer-en",
      emoji: "🔤",
      accent: "#e9def5",
      titleZh: "四线三格拼读家",
      titleEn: "Phonics Writer",
      descZh: "在英文四线三格完成 5 个字母或单词",
      descEn: "Trace 5 English letters or CVC words",
      unlocked: enWritingDone >= 5,
      progressLabelZh: `${Math.min(5, enWritingDone)} / 5 项`,
      progressLabelEn: `${Math.min(5, enWritingDone)} / 5 items`
    },
    {
      id: "star-collector",
      emoji: "⭐",
      accent: "#fff0ad",
      titleZh: "摘星小能手",
      titleEn: "Star Collector",
      descZh: "累计赢得 6 颗成长星",
      descEn: "Earn 6 lifetime growth stars",
      unlocked: stars >= 6,
      progressLabelZh: `${Math.min(6, stars)} / 6 星`,
      progressLabelEn: `${Math.min(6, stars)} / 6 stars`
    },
    {
      id: "companion-friend",
      emoji: "🐶",
      accent: "#f4cf76",
      titleZh: "伙伴好朋友",
      titleEn: "Companion Bestie",
      descZh: "在商城兑换第 1 位学习伙伴",
      descEn: "Redeem your first learning companion",
      unlocked: companionsCount >= 1,
      progressLabelZh: `${Math.min(1, companionsCount)} / 1 伙伴`,
      progressLabelEn: `${Math.min(1, companionsCount)} / 1 buddy`
    },
    {
      id: "independent-thinker",
      emoji: "🏆",
      accent: "#cfe3f7",
      titleZh: "独立思考王",
      titleEn: "Independent Thinker",
      descZh: "不看提示独立答对 15 道题目",
      descEn: "Answer 15 questions correctly without hints",
      unlocked: independentCorrect >= 15,
      progressLabelZh: `${Math.min(15, independentCorrect)} / 15 题`,
      progressLabelEn: `${Math.min(15, independentCorrect)} / 15 independent`
    },
    {
      id: "streak-sprout",
      emoji: "🔥",
      accent: "#f7c9dd",
      titleZh: "坚持小树苗",
      titleEn: "Persistent Sprout",
      descZh: "累计完成 3 轮学习或打卡 3 天",
      descEn: "Complete 3 learning rounds or 3 active days",
      unlocked: sessionsDone >= 3 || streak.totalActiveDays >= 3 || correctAttempts >= 25,
      progressLabelZh: `${Math.min(3, Math.max(sessionsDone, streak.totalActiveDays))} / 3 轮`,
      progressLabelEn: `${Math.min(3, Math.max(sessionsDone, streak.totalActiveDays))} / 3 rounds`
    }
  ];
}
