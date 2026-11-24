import type { Subject } from "../lib/types";

export interface CompanionDefinition {
  id: string;
  name: string;
  unlockAtStars: number;
  assetSetId: string;
  description: string;
  subjectAffinity: Subject[];
  safeGreetingText: string;
  safeEncouragementText: string;
}

export const COMPANIONS: CompanionDefinition[] = [
  {
    id: "gemini-doudou",
    name: "豆豆",
    unlockAtStars: 10,
    assetSetId: "gemini-doudou",
    description: "好奇、温柔的小狗，会陪你听题和庆祝完成。",
    subjectAffinity: ["math", "mandarin", "english"],
    safeGreetingText: "我先坐好，我们一起开始。",
    safeEncouragementText: "慢慢想，我会陪你再看一步。"
  }
];

export function getCompanionById(id: string): CompanionDefinition | undefined {
  return COMPANIONS.find((companion) => companion.id === id);
}
