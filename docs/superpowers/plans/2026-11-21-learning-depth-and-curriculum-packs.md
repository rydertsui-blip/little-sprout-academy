> **歷史計劃（2026-11-21）**：本文件記錄當時的 34 個技能／234 題基線與後續實作步驟；目前內容包為 pilot-22、46 個技能、775 題（727 choice + 48 match），請以 `README.md` 與 `apps/family/README.md` 的現行數字為準，不要把本文的 234／34 當作目前驗收標準。

# Learning Depth and Curriculum Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把小芽由「每項技能 6–8 題的辨認練習」提升為可驗證的深度學習系統，建立版本化課程包及可收藏的陪伴角色獎勵，使 P1/P2 現有資料可持續加深，未來 P3 只需新增課程包及每科年級範圍，不需重寫學習引擎。

**Architecture:** 以 `CurriculumPackRegistry → SkillDepthBlueprint → Attempt/Evidence → AdaptiveSelector → RewardLedger/CompanionCatalog → ParentPlan` 六層組成。所有題目保留固定 ID、來源、模板家族、作答方式、遷移程度及可重算答案；掌握度以 BKT 為基礎，但只有同時具備獨立、跨模板、跨表徵、遷移及延後保持證據時才可標為「已鞏固」。成長星由 append-only reward ledger 管理，只用作孩子手動兌換角色、不扣減；課程包是靜態、離線、不可變版本，P3 與 P1/P2 並存，孩子可按科目選擇不同年級。

**Tech Stack:** React 19、TypeScript 7、Vite 8、Vitest 5、Zod 4、Web Crypto AES-GCM、Vite PWA、現有本地 m4a／圖片／拼音及漢字資料。

---

## 1. 決策摘要

1. **不 Fork Kolibri、Oppia、OATutor 或 GCompris。** 它們的整體平台太重、帳號及班級模型不符合單家庭 PWA，題庫也非新加坡 P1–P3。只借內容包、分支補救、BKT、活動分類等局部機制。
2. **P3 不是「把題目換掉」，而是新增 `sg-primary-p3` 課程包。** App 引擎、儲存格式、學習記錄及家長 UI 保持同一套；P3 包註冊後，家長可逐科把學習範圍切到 P3，P1/P2 舊證據仍保留作先修及複習。
3. **年級必須逐科儲存。** 孩子可能數學已 P3、英語仍 P2；不得用單一 `grade` 鎖死全部科目。
4. **不加入 AI 自適應、LLM 出題或 ASR 發音評分。** 現階段採可解釋 BKT、固定間隔複習及規則式選題；未來只有在有真人校準資料後才評估更複雜模型。
5. **語音練習不算掌握證據。** 錄音只作模仿、回放及親子互動；沒有真人或經校準 ASR 時，不得把錄音判為正確／錯誤。
6. **不以題數代替深度。** 同一題型重複十次不算深度；每個技能須跨至少三個模板家族、至少兩種作答方式，並有遷移及延後保持證據。
7. **保留「pilot / machine-verified」誠實狀態。** 沒有新加坡教師及語言審核者前，不得使用 `approved`、`零錯誤` 或 `100% 正確`。發布只能說「已驗證矩陣內沒有已知阻斷問題」。
8. **家長可管理範圍及難度，不直接編輯 MOE 題目。** 家長可切換課程包、逐科選年級、啟停技能、重做起點、設定每輪題數；題目文字只可由受控內容包更新，避免破壞來源及簽名。
9. **唯一交付平台仍是 iPhone／iPad Safari PWA 及 Android 平板 Chrome/Edge PWA。** 不新增桌面版、Android 手機版、原生 App 或 App 內建瀏覽器流程；不加入背景 5 分鐘自動鎖定，只保留家長手動鎖定及重載 PIN 解鎖。
10. **獎勵採「成長星手動兌換角色」，不是可消費虛擬貨幣。** 星星終身累積、永不扣減，完成固定里程碑後孩子可自己兌換動畫陪伴角色，並隨時挑選已兌換角色；沒有購買、抽獎、交易、排名或時間壓力。

## 2. 研究依据與採用方式

| 來源 | 可驗證事實 | 本產品採用 | 不採用 |
|---|---|---|---|
| [OATutor](https://github.com/CAHLR/OATutor) `BKT-brain.js`、`defaultHeuristic.js` | BKT 以 `probMastery/probTransit/probSlip/probGuess` 更新；預設選題只取已完成集合以外、掌握概率最低的題目 | 保留可解釋 BKT；把模板、表徵、遷移、複習加入選題分數 | 不照搬「最低掌握度」單一啟發式，因它不保證題型多樣性 |
| [Kolibri content models](https://github.com/learningequality/kolibri/blob/develop/kolibri/core/content/base_models.py)、[lesson model](https://github.com/learningequality/kolibri/blob/develop/kolibri/core/lessons/models.py) | `content_id` 在內容副本間保持穩定；`channel_id`、channel version、schema version 分開；Lesson 以資源清單及 assignment 管理 | 借不可變課程包、內容版本、schema 相容、每科年級範圍及家長任務清單 | 不引入 Django 伺服器、班級、帳號、同步 |
| [Oppia outcome model](https://github.com/oppia/oppia/blob/develop/core/templates/domain/exploration/outcome.model.ts)、[answer classification](https://github.com/oppia/oppia/blob/develop/core/templates/pages/exploration-player-page/services/answer-classification.service.ts) | 每個答案組可有規則、回饋、下一個 state、remedial destination、`missingPrerequisiteSkillId` | 借「錯答 → 具體提示 → 小步補救 → 返回主線」資料結構 | 不引入大型 exploration editor、社群及帳號 |
| [GCompris 管理手冊](https://github.com/KDE/gcompris/blob/master/docs/docbook/index.docbook) | 圖示先於文字、活動分類、可選 dataset、難度標示、無時間限制、無強制路徑 | 兒童主流程繼續圖像／語音先行、單一主動作、無倒數；活動有難度及模板 metadata | 不照搬 Qt、AGPL 活動或桌面套件 |
| Rosenshine, [Principles of Instruction](https://www.aft.org/sites/default/files/Rosenshine.pdf) | 短回顧、小步驟、示範、大量提問、引導練習、獨立練習、定期複習 | 每輪先複習、再由老師示範、引導、獨立、混合複習 | 不把研究原則變成固定秒數或懲罰 |
| Carpenter、Pan、Butler，[spacing and retrieval review](https://www.nature.com/articles/s44159-022-00089-1) | 間隔提取比集中重讀更利於長期保持，遷移亦受益 | 保留 1/3/7/14/30/60 天間隔；每次以不同題目提取 | 不在小樣本上虛稱已證明個人化最佳間隔 |
| Rohrer、Dedrick、Stershic，[interleaved practice](https://files.eric.ed.gov/fulltext/ED557355.pdf) | 隨機對照試驗顯示混合題型在立即及延後測驗均優於集中同題型 | 新技能初次學會後，練習及複習混入不同模板／題型 | 不在尚未建立基本概念時一開始就全部混合 |
| 新加坡 MOE [數學 2021（2025-10 更新）](https://www.moe.gov.sg/media/files/primary/2021-primary-mathematics-syllabus-p1-to-p6-updated-october-2025.pdf) | P3 有獨立的 10,000、四則運算、等值分數、複合單位、24 小時制、面積周界、角、平行垂直、棒形圖等內容 | P3 包以官方 P3 頁逐條建 outcome | 不以補習網站或二手整理代替 |
| 新加坡 MOE [華文 2024](https://www.moe.gov.sg/media/files/primary/syllabus/f41062a6-3a90-4ed1-bf93-2f1aaabeec43.pdf) | 奠基階段第一階段為 P1/P2，第二階段為 P3/P4；小三自 2026 起實施 | P3 華文屬同一總課綱的新階段，不新建另一套權威 | 不把 P1/P2 broad outcome 假裝成 P3 exact |
| 新加坡 MOE [英語 2020](https://www.moe.gov.sg/media/files/primary/2020-english-language-primary.pdf) | P3/P4 屬 middle primary，能力描述按 progression 表展開 | P3 英語包以 middle-primary outcomes 及 broad mapping 建立 | 不把 listening/reading 的 broad outcome 說成單一微技能已核准 |
| 新加坡 MOE [《歡樂夥伴2.0》生字表](https://www.moe.gov.sg/media/files/primary/syllabus/99b31d48-7f90-420a-a748-f64167c45746.pdf) | 已涵蓋至 P3 下學期字表及課次 | P3 華文識字包只作教材字表及順序證據 | 不冒充 syllabus outcome |
| [Khan Academy Kids Learning Path](https://khankids.zendesk.com/hc/en-us/articles/360048828572-Learn-more-about-the-Learning-Path) | Learning Path 按掌握程度調整；同一主題需要更多練習時會再提供活動 | 借「按掌握推進、需要時再練」 | 不照搬單一線性路徑或全部課程內容 |
| [Khan Academy 每日／每週 mission](https://support.khanacademy.org/hc/en-us/articles/47078681852045-Where-can-I-view-my-skill-progress-in-Khan-Academy-Reimagined) | 每日及每週 mission card 以 mastery icon 顯示進度 | 借「今日目標 + 每週節奏 + 掌握圖示」 | 不在孩子端顯示大量百分比或統計 |
| [IXL recommendations](https://www.ixl.com/recommendations) | 按已練內容提供個人化下一技能建議 | 借「下一技能推薦及先修缺口」 | 不用訂閱制或無止境題庫 |
| [Duolingo streak](https://www.duolingo.com/help/what-is-a-streak) | 以連續完成課程的天數作 streak 動機 | 只借「每日回來」的節奏概念 | 不顯示斷 streak、扣心、排行榜或連續天數壓力 |

## 3. 当前基线與缺口

現時 `ec65c42` 的基線：

- 17 個測試檔、99 項測試全通過；官方來源 4 份 MOE PDF、44 條 P1/P2 outcome，产品范围内未映射數 0。
- 34 個技能、234 題；平均 6.88 題，最低 6 題。
- 4 個技能只有一個模板家族：`math-time`、`math-picture-graph`、`math-fractions-add-sub`、`english-listening`。
- 6 個技能只有選擇題一種作答方式：上述四個再加 `math-length-measure`、`math-measurement-units`。
- `classifyMastery` 只要 4 次獨立答對、4 個不同題目及一次跨 24 小時作答即可 `secure`；不檢查模板、作答方式或遷移。
- 先修解鎖只需 2 次不同題目獨立答對，不要求跨模板；同一題型可解鎖下一步。
- `verify-content.ts` 硬編碼 234 題，新增內容時會直接失敗；未有課程包／年級隔離。
- `HouseholdState` 為 schema 2；沒有逐科年級、課程包版本快照或題目 metadata。
- P3 來源已在本機 PDF 中，但 `outcomes.json` 目前完全沒有 P3 outcome。

結論：現時是可信的家庭試點，不是完整或深度課程。下一步必須先修證據品質及課程包邊界，再擴內容。

按第 5.3 藍圖，完成後的 P1/P2 目標為 **9 個 A 類 × 18 題 + 25 個 B 類 × 12 題 = 462 題**；相對現時 234 題，淨增 228 題。這不是把舊題複製貼上，而是補足每技能缺少的模板、作答方式、遷移及複習題。數學及拼音內容大部分可由確定性生成器擴充；閱讀篇章、英語語境及華文補救文案仍須逐項策展及 fixture 核對。

## 4. 目標架構

```text
MOE PDF manifest + page quotes
           │
           ▼
CurriculumPackManifest ──────► compatibility / SHA / source gate
           │
           ├── SkillGraph (stable IDs, prerequisites, semanticVersion)
           ├── SkillDepthBlueprint (families, modes, transfer, counts)
           └── QuestionBank (stable IDs, answerSpec, depth metadata)
           │
           ▼
    Attempt event log
           │
           ▼
SkillEvidenceV3 (BKT + diversity + transfer + retention)
           │
           ├── MasteryClassifier
           ├── PrerequisiteGate
           └── AdaptiveSelector
           │
           ▼
SessionPlan → teacher-led child flow → parent depth dashboard
```

### 4.1 課程包邊界

- 一個課程包代表一個可發布的年級資料集，內含一至三個科目；P1/P2 暫用 `sg-primary-p1-p2`，P3 後續新增 `sg-primary-p3`。
- 包內只能引用已固定 SHA-256、頁數及引文的 MOE 來源。
- 包版本不可原地改寫；任何題目、答案、音檔、來源或技能語義改動都要升 `version` 及重算 `contentSha256`。
- 包有 `contentSchemaVersion` 及 `appSchemaMin`；不相容時不載入，不以 runtime 猜測補救。
- 同一技能 ID 在不同包版本可延續，但技能有 `semanticVersion`；語義改變時不得把舊掌握度直接沿用。
- 題目 ID 永不移除或重用；退役題目仍保留於歷史映射及備份可讀性。
- 年級範圍按科目儲存：`math: P3`、`mandarin: P3`、`english: P2` 可以同時成立。
- 孩子選 P3 數學時，保留 `sg-primary-p1-p2` 的數學技能作先修／複習，並載入 `sg-primary-p3` 的數學技能作新內容；不把 P3 其他科目強制加入數學 scope。

### 4.2 核心型別

```ts
export type SchoolGrade = "P1" | "P2" | "P3" | "P4" | "P5" | "P6";
export type Subject = "math" | "mandarin" | "english";
export type CognitiveDemand = "recognition" | "discrimination" | "application" | "transfer";
export type TransferLevel = "same-context" | "near-transfer" | "far-transfer";
export type ResponseMode = "tap-choice" | "tap-match" | "tap-order" | "voice-practice";

export interface ItemDepth {
  templateFamily: string;
  responseMode: ResponseMode;
  cognitiveDemand: CognitiveDemand;
  transferLevel: TransferLevel;
  contextKey: string;
}

export interface SkillDepthBlueprint {
  skillId: string;
  targetItemCount: number;
  minTemplateFamilies: number;
  minResponseModes: number;
  minTransferItems: number;
  minContexts: number;
  requiredTemplateFamilies: string[];
}

export interface CurriculumPackManifest {
  id: string;
  version: string;
  contentSchemaVersion: number;
  appSchemaMin: number;
  subjects: Subject[];
  gradeBands: SchoolGrade[];
  sourceIds: string[];
  publishedAt: string;
  contentSha256: string;
  releaseStatus: "pilot" | "approved";
}

export interface LearningScope {
  subject: Subject;
  grade: SchoolGrade;
  packIds: string[];
}

export interface SkillPackBinding {
  packId: string;
  semanticVersion: number;
}

export interface Skill extends SkillPackBinding {
  id: string;
  subject: Subject;
  gradeBand: SchoolGrade[];
  prerequisites: string[];
  provenanceScope: "official-outcome" | "supplementary-practice";
  officialOutcomes: Array<{ outcomeId: string; mapping: "exact" | "broad" }>;
}
```

## 5. 深度內容規格

### 5.1 深度不是難度

- `difficulty` 只表示當前題目對孩子的負荷，1–5。
- `cognitiveDemand` 表示要做什麼：辨認、辨別、應用、遷移。
- `transferLevel` 表示情境是否改變：同情境、近遷移、遠遷移。
- `retention` 不放在題目上；它是「相隔至少 24 小時後仍能獨立答對」的證據屬性。
- `voice-practice` 只記錄參與及回放，不計入 BKT、不計入 secure。

### 5.2 每個技能的內容門檻

| 類別 | 目標題數 | 模板家族 | 作答方式 | 遷移題 | 最少情境 |
|---|---:|---:|---:|---:|---:|
| A：核心基礎 | 18 | 4 | 2 | 2（至少一题 near 或 far） | 3 |
| B：一般技能 | 12 | 3 | 2 | 1 | 2 |

所有技能都以 12 題為底線；A 類須 18 題。題目不是越多越好，但同一模板家族在目標題數內不得少於 2 題，避免「一題代表一種題型」。

### 5.3 34 技能藍圖

下表是實作時必須落入 `SKILL_DEPTH_BLUEPRINTS` 的完整資料；不能只做代表技能。

| 技能 ID | 類別 | 目標 | 必須覆蓋的模板家族 |
|---|---|---:|---|
| `math-count-100` | A | 18 | `number-sequence`, `place-value-tens-ones`, `compare-order` |
| `math-place-value-1000` | B | 12 | `digit-place`, `expanded-form`, `compare-order` |
| `math-add-sub-100` | A | 18 | `number-bond`, `horizontal-equation`, `story-change` |
| `math-add-sub-regroup` | B | 12 | `place-value-trade`, `algorithm-step`, `story-regroup` |
| `math-add-sub-1000` | B | 12 | `column-operation`, `decomposition`, `story-change` |
| `math-multiply-tables` | A | 18 | `equal-groups`, `array`, `fact-family` |
| `math-divide-tables` | B | 12 | `equal-sharing`, `array-inverse`, `fact-family` |
| `math-fractions` | B | 12 | `unit-fraction-visual`, `fraction-of-set`, `fraction-words` |
| `math-money` | B | 12 | `amount-identify`, `compare-pay`, `money-change` |
| `math-time` | B | 12 | `clock-read`, `duration`, `daily-event-order` |
| `math-shapes` | B | 12 | `shape-identify`, `property-classify`, `compose-decompose` |
| `math-picture-graph` | B | 12 | `graph-read`, `graph-compare`, `graph-question` |
| `math-length-measure` | B | 12 | `measure-grid`, `length-compare`, `length-change` |
| `math-fractions-add-sub` | B | 12 | `visual-bar`, `horizontal-equation`, `story-share` |
| `math-measurement-units` | B | 12 | `unit-select`, `unit-convert`, `measurement-compare` |
| `mandarin-initials` | A | 18 | `hear-initial`, `pinyin-family`, `picture-initial` |
| `mandarin-finals` | B | 12 | `hear-final`, `pinyin-family`, `picture-final` |
| `mandarin-tones` | A | 18 | `hear-tone`, `tone-mark`, `same-different-tone` |
| `mandarin-syllables` | B | 12 | `complete-pinyin`, `syllable-picture`, `tone-base-combine` |
| `mandarin-characters` | A | 18 | `meaning-character`, `character-word`, `radical-shape` |
| `mandarin-vocabulary` | B | 12 | `picture-word`, `context-word`, `category-word` |
| `mandarin-reading` | B | 12 | `literal-detail`, `sequence`, `inference-word` |
| `mandarin-classifiers` | B | 12 | `noun-classifier`, `picture-sort`, `phrase-complete` |
| `mandarin-word-order` | B | 12 | `tap-sentence-order`, `missing-word`, `conversation-order` |
| `english-letters` | B | 12 | `letter-name`, `beginning-sound`, `letter-case` |
| `english-listening` | A | 18 | `word-picture`, `instruction-action`, `sentence-picture` |
| `english-phonics` | A | 18 | `initial-sound`, `rhyme`, `word-family` |
| `english-sight-words` | A | 18 | `word-picture`, `cloze`, `sentence-word` |
| `english-vocabulary` | B | 12 | `picture-word`, `category-word`, `context-word` |
| `english-a-an` | B | 12 | `article-sound`, `article-contrast`, `phrase-complete` |
| `english-plural` | B | 12 | `plural-form`, `picture-contrast`, `sentence-choice` |
| `english-sentence-order` | B | 12 | `tap-word-order`, `sentence-ending`, `find-error` |
| `english-reading` | B | 12 | `literal-detail`, `sequence`, `inference` |
| `english-spelling` | B | 12 | `correct-spelling`, `spot-error`, `word-picture` |

### 5.4 題目必須保留的 metadata

```ts
interface QuestionBase {
  id: string;
  packId: string;
  subject: Subject;
  skillId: string;
  template: string;
  depth: ItemDepth;
  difficulty: 1 | 2 | 3 | 4 | 5;
  answerSpec: AnswerSpec;
  misconceptionTags: string[];
  explanation: string;
  audit: ContentAudit;
}

type AnswerSpec =
  | { kind: "single-choice"; correctOptionId: string }
  | { kind: "match"; pairIds: string[] }
  | { kind: "tap-order"; correctTokenIds: string[] }
  | { kind: "voice-practice" };

interface ChoiceQuestion extends QuestionBase {
  kind: "choice";
  options: string[];
  optionIds: string[];
  correctAnswer: string;
  correctOptionId: string;
}
```

選項 label 可以繼續用字串顯示，但每個 label 都要有穩定 `optionId`；`correctOptionId` 指向唯一正確選項。舊題目 migration 時以 `question.id`、選項 label 的 canonical form 及 stable hash 建立 option ID；不得以陣列位置作長期身份。`voice-practice` 永遠不被判定為正確／錯誤。

### 5.5 難度與干擾项規則

- 每個選擇題恰有一個正確答案，兩個合理干擾項；不得有兩個語義上都正確的選項。
- 干擾項至少覆蓋一種常見錯誤：位值錯置、運算方向錯、相近聲母／韻母、大小寫、a/an 音素混淆、時態或語序。
- 同一技能不得出現完全相同的 `prompt + options` 組合。
- 同一模板家族至少兩個不同題目；避免每個家族只有一題。
- 遷移題不得只換人名或顏色；至少改變情境、表徵或提問方向其中一項。
- 數學題答案由生成規則計算，不以手寫答案為唯一來源；測試用獨立算式重算。
- 華文題只可使用官方生字表已列字；拼音由 `pinyin-pro` 及固定音節 fixture 交叉核對。
- 英語題目只使用策展字表；不得靠生成式模型自由改寫閱讀篇章或文法答案。

## 6. 掌握度與先修解鎖

### 6.1 證據欄位

`SkillEvidence` 升級時新增：

```ts
interface EvidenceDiversity {
  templateFamilies: Record<string, number>;
  responseModes: Record<ResponseMode, number>;
  transferCorrect: number;
  farTransferCorrect: number;
  delayedIndependentCorrect: number;
  contextKeys: string[];
  lastIndependentWrongAt: string | null;
}
```

舊版只保存 `templates` 與 `questionIds`；migration 會由歷史 attempts 及舊題目目錄回填能證明的部分，不能證明者保持 0。

### 6.2 掌握分類

| 等級 | 條件 |
|---|---|
| `unknown` | 無獨立證據，且未達到 developing 概率 |
| `developing` | 至少 1 次獨立答對，或已有足夠引導練習但尚未獨立 |
| `likely-secure` | 4 次獨立答對、4 個不同題目、2 個模板家族、2 種作答方式，Wilson lower bound ≥ 0.50 |
| `secure` | 6 次獨立答對、5 個不同題目、3 個模板家族、2 種作答方式、至少 1 次 transfer 答對、至少 1 次 24 小時後 delayed 答對，Wilson lower bound ≥ 0.60 |

補充：

- 最近一次獨立答錯不得立即顯示 `secure`；保留歷史最高證據，但現時分類降至 `likely-secure`，直到再次有正確證據。
- `voice-practice` 不進入上述任何計數。
- 同一題目重複作答只保留一次獨立證據；可作 retention 觀察，但不得假裝成新題目。
- 不因答題速度快而提前 secure；速度不作為熟練證據。

### 6.3 先修解鎖

先修技能須同時滿足：

- 至少 2 個不同題目獨立答對；
- 至少 2 個模板家族；
- 至少 2 種作答方式；
- 最後一次為獨立答對。

只重複同一款題目不會解鎖下一步。若孩子反覆失敗，提供「回到先修／降低複雜度」路徑，不以扣分或封鎖式懲罰呈現。

### 6.4 起點小試

新孩子第一次進入科目：

1. 先用三對點按配對作觸控暖身。
2. 共 8 題，覆蓋該科目至少三個子領域及難度 1–3。
3. 從來沒有證據的 P1/P2 技能只給「暫定起點」，不直接標成 secure。
4. 起點是第一個未滿足先修條件的技能；若全部先修已滿足，才進入下一個新技能。
5. 任一子領域未取樣時，顯示「尚未看清」，不推算成已會。
6. 結果只向孩子說「今天從這裡開始」；概率、Wilson bound、模板數留家長看。

## 7. 自適應選題

### 7.1 兩階段選題

1. **選技能**：先處理到期複習、先修缺口、低掌握技能，再考慮新技能。
2. **選題目**：在目標技能內優先未見過的模板家族、較少使用的作答方式、適合的難度及遷移曝露；避免最近兩題同模板。

### 7.2 評分公式

```ts
score =
  dueReviewBonus
  + prerequisiteDemandBonus
  + weaknessBonus
  + unseenTemplateFamilyBonus
  + underusedResponseModeBonus
  + transferCoverageBonus
  - recentTemplatePenalty
  - successMismatchPenalty
  - difficultyOutsideZonePenalty;
```

固定規則：

- 預測成功率目標 0.75–0.85，不追求 100%。
- 初次學習難度區間 1–2；有獨立證據後才進 2–3。
- 已到期複習優先於新內容，但每輪最多先做 1 題複習，避免孩子一開始便感到全是舊內容。
- 同輪不得重複題目 ID；同一模板家族最多連續 2 題。
- 同分時使用穩定的非密碼學 `stableHash(childId + sessionId + questionId)` 排序，測試可重現，不用 `Math.random()`。
- 若技能沒有合適題目，退回先修或下一個可用技能；不可選擇難度高出目標兩級的題目「硬塞」。

### 7.3 混合複習節奏

- 新技能首次練習：示範 1 → 同情境 2 → 近遷移 2 → 獨立 1。
- 一般 8 題練習：2 道到期複習、4 道當前技能、2 道混合遷移／保持。
- 6 題短練習：1 道到期複習、3 道當前技能、2 道獨立／遷移。
- 不在孩子未見過概念前直接放遠遷移題；遠遷移只在 `likely-secure` 後出現。

## 8. 錯答後的老師式補救

每個技能可有一個 `RemediationPlan`：

```ts
interface RemediationStep {
  kind: "notice" | "example" | "contrast" | "retry" | "prerequisite";
  audioText: string;
  visualCue?: string;
  targetSkillId?: string;
}
```

流程：

1. 答錯 → 先播放具體觀察句，如「先看十位，再和個位合起來」，不說空泛「再試一次」。
2. 同一題可再試一次；提示後答對記為 `hintUsed: true`，不作獨立證據。
3. 再錯 → 顯示 worked example 或 A/B 對照，然後換同模板較易題。
4. 仍錯 → 返回先修技能，不把目前技能標記完成。
5. 每次只出現一個主要動作：「再試一次」或「下一題」；不增加求助、提示、重播等多個競爭按鈕。

## 9. 家長端內容及進度管理

### 9.1 家長可做的事

- 每個孩子逐科選 P1/P2/P3 學習範圍。
- 查看已安裝課程包的名稱、版本、科目、年級、來源、題數及 `pilot` 狀態。
- 啟停個別技能，但不可刪除 MOE 來源或改寫答案。
- 設定每輪 6/8/10 題及是否優先複習。
- 重做某科起點；歷史 attempts 保留。
- 匯出 CSV 加入 `packId`、`packVersion`、`templateFamily`、`responseMode`、`transferLevel`、`skillSemanticVersion`。
- 查看「認得出」「換方式也會」「隔天仍記得」三層證據，而不只顯示 secure 數量。

### 9.2 家長文案原則

- 不用「AI 已了解孩子」或「完全掌握」。
- 用「這項只做過同一類題，還未證明換方式也會」。
- 用「已隔天答對 1 次，仍未到長期保持」。
- 用「P3 課程包未安裝／未通過驗證，暫不可啟用」。
- 顯示「本內容為家庭試點、機器核對；未經真人課綱覆核」。

### 9.3 課程包切換文案

- 升級：`切換後會保留 P1/P2 的學習記錄，舊內容仍可作複習。`
- 套件缺少先修：`這個科目還缺少可用的先修課程包，暫未切換。`
- 版本未驗證：`這個課程包未通過完整性檢查，不會套用到孩子。`
- 回滾：`已切回上一版課程包；歷史作答仍保留，新內容改為上次已驗證版本。`

### 9.4 成長星與陪伴角色

孩子可以有累積感和收藏感，但不把它做成可消費虛擬貨幣。名稱使用「成長星」，不使用金幣、現金、價格、抽獎或排行榜。

核心規則：

- 每輪正常完成：2 顆成長星；同一 `sessionId` 只發一次。
- 隔天完成一次到期複習：2 顆；同一技能每天最多一次。
- 獨立完成一次遷移題：1 顆；每天最多 2 顆。
- 答錯後願意再看提示並重試：1 顆；每天最多 1 顆，只獎勵持續嘗試，不假裝答對。
- 答錯不扣星；退出、時間慢、需要提示都不扣星。
- 每日最多 6 顆，避免把學習變成刷分；上限只是防止無限累積，不在孩子介面顯示倒數懲罰。
- 不因正確率低而不發完成星；獎勵針對完成、返回複習、遷移及嘗試。
- 所有成長星保存在孩子的加密本機資料，不上傳、不可購買、不可轉讓、不可與其他孩子比較。

「兌換」採用固定收藏里程碑，不扣星：

```ts
interface GrowthRewardState {
  lifetimeStars: number;
  awardedEventKeys: string[];
  redeemedCompanionIds: string[];
  redeemedAtByCompanionId: Record<string, string>;
  activeCompanionId: string | null;
}

interface CompanionManifest {
  id: string;
  name: string;
  unlockAtStars: number;
  assetSetId: string;
  voiceLanguage: "zh-CN" | "en-US";
  subjectAffinity: Subject[];
  safeGreetingAudio: string;
  safeEncouragementAudio: string;
}
```

- 第一隻陪伴角色在 10 顆星變成可兌換，讓孩子約完成數輪後便能親自兌換第一個角色。
- 之後可設 20、35、55、80、110 顆星；實際角色數量及門檻由 `companion-pack` 資料決定，不硬編碼在 UI。
- 到達門檻後角色只在收藏冊顯示「可以兌換」；孩子自己按下「兌換」才播放短動畫並加入收藏。孩子可略過動畫，不會因略過而失去角色。
- 星星總數只增不減，因此「兌換」不會令已有的 10 顆變成 0 顆；孩子看到的是收藏進度，而不是交易餘額。
- 兌換不扣星、不消耗角色；同一角色只可兌換一次，兌換後可隨時設為 active companion。
- 不設限定時間、隨機抽獎、每日簽到斷 streak 或需要每天回來否則失去角色。

陪伴角色行為：

- 每輪只選一隻 active companion；可在收藏冊切換，不允許同時多隻遮擋畫面。
- 角色由孩子兌換後，首頁以一個小型陪伴區顯示；孩子點角色可看收藏及更換 active companion，主要「跟小芽開始」仍只有一個主動作。
- 未來角色數量增加時，收藏冊按 `companion-pack` 自動分頁；孩子可挑選任何已兌換角色，不限最近一隻，也不需要重新花星。
- 每輪開始時角色說一句安全開場，例如「先聽一次，再一起做」。
- 角色可提示學習節奏，但不得自行判斷答案；教學提示仍由題目／補救計劃決定，避免角色語氣與正確內容衝突。
- 每輪完成後才顯示成長星及新角色；不在每答一題後插播動畫。
- 減少動畫偏好時只保留靜態角色及文字回饋；高對比模式不使用半透明角色遮擋內容。
- 角色資產全部本地打包；不得 runtime 載入外部 CDN。新增角色需通過資產 hash、尺寸、離線 precache 及首屏遮擋測試。
- 家長可關閉陪伴角色及獎勵動畫；關閉後學習流程、證據及進度完全不變。

第一隻動畫角色：小狗 `豆豆`。

- 手工分層 SVG 造型已被否決，不再作為正式角色或後續角色模板。
- 正式素材由用戶的 Gemini App 生成：1376×768、4×3、共 12 幀，洋紅背景，再於本地去背及切幀。
- 成品包含 idle、walk、celebrate 三條 4 幀動畫帶，每格 344×256；以 Canvas 2D、關閉 image smoothing 播放。
- 原圖、成品每檔 SHA-256、幀尺寸及來源記錄在 `apps/family/public/assets/companions/gemini-doudou/manifest.json`。
- 2026-11-21 已完成替換後的開發預覽：八狀態機、點擊反應、安全區、iPhone/desktop/reduced-motion 真瀏覽器截圖。小狗尚未接入孩子首頁、兌換商城或獎勵資料。
- 性格是好奇、溫柔、會等待，不搶小芽老師的教學角色。
- 小狗是 app 內陪伴寵物，不是作業系統層可離開 PWA 的桌面 app。
- 小狗只在安全陪伴區活動，不跨越題目、答案、音訊或主要按鈕；不可自由拖到整個畫面。
- 可用一個單指 tap 與小狗互動；不用雙擊、長按、拖曳或手勢組合。
- tap 小狗會觸發短反應，例如跳一下、擺尾、眨眼或播放一句安全短句；反應結束後回到 idle。
- idle 狀態可有眨眼、耳朵微動、尾巴慢擺、坐下或短距離在安全區內踱步；不做高頻閃爍或搶注意力的 loop。

小狗視覺狀態機：

```ts
export type CompanionPetState =
  | "idle"
  | "greet"
  | "listen"
  | "think"
  | "celebrate"
  | "comfort"
  | "tap-react"
  | "rest";
```

狀態觸發：

| 狀態 | 觸發 | 行為 |
|---|---|---|
| `idle` | 沒有教學音訊、孩子未互動 | 播放 4 幀 idle 循環 |
| `greet` | 進入科目或新一輪 | 播放 4 幀 celebrate，配合安全招呼聲 |
| `listen` | 播放題目或指令 | idle 第 0/2 幀低頻循環並保持安靜 |
| `think` | 孩子停在同一題超過合理時間 | idle 第 2/0 幀慢速交替；不催促、不顯示倒數 |
| `celebrate` | 完成一輪或兌換角色 | 播放 4 幀 celebrate 並加一次短 bounce |
| `comfort` | 答錯或需要補救 | idle 第 0/3 幀低頻循環，短句「一起再看一步」 |
| `tap-react` | 孩子主動 tap 小狗 | 播放 celebrate 一次，1.2 秒內回 idle |
| `rest` | 長時間無操作但 app 未鎖定 | idle 第 1 幀靜止；不自動鎖定、不結束 session |

動畫及音訊規則：

- 教學音訊優先於陪伴音訊；小芽老師或題目正在播放時，小狗只做動作，不出聲。
- 小狗不可自行說出答案、判斷對錯或猜發音；所有教學提示由 `RemediationPlan` 決定。
- 角色短句只能屬安全陪伴語：打招呼、等待、一起看、完成、休息。
- 同一短句至少 30 秒內不重播；孩子連續 tap 時只做動作，不反覆播聲。
- `prefers-reduced-motion` 下只保留淡入淡出或靜態表情，不播放行走、旋轉或大幅位移。
- 高對比模式下不使用半透明影子；小狗以實色輪廓顯示。

第一個角色的技術方案：

- 使用 Gemini 生成並已本地去背的 sprite strips，不自行繪製角色，也不引入 runtime Lottie／Rive／外部 sprite CDN。
- `PuppyCompanion` 以 Canvas 2D 讀取三條 1376×256 sprite strips，每幀 344×256，按狀態序列及 frameMs 播放。
- `prefers-reduced-motion` 下只畫該動畫第一幀，不播放連續幀或 wrapper bounce。
- 動作由 `CompanionPetController` 狀態機驅動，不由頁面零散 CSS class 直接拼接。
- 小狗渲染層固定 `pointer-events: none`，只有角色本體的小 hit area 設 `pointer-events: auto`，避免阻擋背後操作。
- 安全區尺寸以短邊百分比及 CSS clamp 定義；所有 viewport 下角色最大佔用短邊 18%。

夥伴兌換館 UI：

- 入口名稱使用「夥伴兌換商城」（孩子可見到商城式角色卡），但不使用「付款」「購買」或真實貨幣符號；「兌換」只指用累積成長星解鎖收藏。
- 首頁陪伴區只提供一個入口；進入後用兩個 tab：`可以兌換`、`我的夥伴`。
- 每張角色卡顯示角色預覽、名字、需要的 `lifetimeStars` 及狀態：`尚未達到`、`可以兌換`、`已經擁有`。
- 尚未達到時只顯示 `再累積 X 顆成長星`；不顯示限時倒數、折扣、抽獎概率或「快搶」。
- `可以兌換` 卡片有一個主要按鈕 `兌換`；按下後先出現確認，確認文案是 `兌換後會加入你的夥伴收藏，成長星不會扣除。`
- 兌換成功後播放可略過的角色揭示動畫，下一個主要動作是 `設為陪伴`；若孩子不設，角色仍保留在收藏。
- `我的夥伴` tab 顯示已兌換角色及 `正在陪伴` 狀態；孩子可隨時選擇任何一隻已兌換角色。
- 新角色增加時，兌換館可自動分頁／分類；已兌換角色不會因新增角色而消失或需要重新兌換。
- 關閉獎勵功能時整個兌換館入口隱藏，不顯示空商店或鎖定卡片。

家長文案：

- `成長星只記錄完成和複習，不是成績，也不會因答錯扣除。`
- `角色是收藏獎勵，不需要購買，也不能轉給其他孩子。`
- `夥伴兌換館只展示解鎖進度；兌換不扣星、不收款、沒有隨機抽獎。`
- `目前未上傳任何獎勵或角色使用資料。`

### 9.5 長期進度、每日練習及每週節奏

孩子需要知道自己「正在走到哪裡」，但不是看到虛假的 `完成 37%`。產品分三層：

1. **長期進度**：每科自己的技能路徑、目前技能、已穩定技能及待複習技能。
2. **每日練習**：每次 6–10 題、約 10 分鐘，混合複習、當前技能及一題遷移／獨立題。
3. **每週節奏**：顯示本週完成了幾次短練習及哪些技能有進步；不顯示連續天數斷裂懲罰。

孩子首頁仍保留三科選擇，但每科卡上顯示：

- `今天先複習 1 項，再學 1 項新內容`
- `目前在：10 以內加減`
- `這一科已有 3 項隔天仍記得`

不使用一個百分比把三科或整份課程混在一起。孩子只需要知道下一小步；完整清單留家長看。

每日練習生成規則：

```ts
interface DailyPlan {
  dateKey: string;
  timezone: "Asia/Singapore";
  subject: Subject;
  items: Array<{
    kind: "review" | "current" | "transfer";
    skillId: string;
  }>;
  totalQuestions: number;
  estimatedMinutes: number;
  completedAt: string | null;
}
```

- 日期邊界固定 `Asia/Singapore`，不以裝置時區判斷。
- 6 題模式：1 道複習 + 3 道當前技能 + 2 道獨立／遷移。
- 8 題模式：2 道複習 + 4 道當前技能 + 2 道獨立／遷移。
- 10 題模式：2 道複習 + 5 道當前技能 + 3 道獨立／遷移。
- 若沒有到期複習，複習位置改為同科最近學過的 warm-up；不假裝成新內容。
- 若當前技能未到 transfer-ready，transfer 位置改為較易的同模板獨立題，文案顯示「先鞏固」。
- 計劃在打開科目時建立；中途離開可恢復，不重設題數或重複發星。
- 錯過一天不會清零進度、不會扣星、不會顯示「你已中斷」；到期複習自然累積，下一次先處理。
- 每日練習完成只影響節奏和獎勵，不直接把技能標成 secure；掌握仍由證據引擎決定。

長期進度模型：

```ts
interface SubjectProgressView {
  subject: Subject;
  currentSkillId: string;
  currentSkillTitle: string;
  stableSkillIds: string[];
  retainedSkillIds: string[];
  dueReviewSkillIds: string[];
  weeklySessions: number;
  weeklyIndependentCorrect: number;
}
```

- 採用「站」而不是百分比：`開始 → 正在學 → 換方式也會 → 隔天仍記得`。
- 孩子只看到三至四個站點摘要；完整 34 技能及證據留在家長看板。
- 不顯示「贏過誰」「班級排名」「連續 100 天」。
- 每周只顯示 `本週已練習 X 次`，不要求連續，不把缺席變成失敗。
- 陪伴角色可站在目前站點旁，但不遮擋技能名稱及開始按鈕。

每日任務與獎勵的關係：

- 每日練習完成：2 顆成長星，同一日期同一科目只發一次。
- 隔天完成到期複習：2 顆成長星，同一技能同日最多一次。
- 完成一題獨立遷移：1 顆，每日最多 2 顆。
- 答錯後按提示重試：1 顆，每日最多 1 顆。
- 所有獎勵共用每日 6 顆上限；完成多科不會突破上限。
- 獎勵畫面只說「今天完成了」，不說「你比昨天快」或「你不夠好」。

## 10. P3 內容包生命週期

### 10.1 現在要建立的擴充能力

- 課程包 registry 及逐科年級 scope。
- 測試專用 `sg-primary-p3-fixture`，只用於自動測試，不出現在孩子 UI。
- P3 fixture 含三個科目、至少一個跨包先修及一個全新技能，用以驗證切換、資料保留、選擇器及回滾。
- 不建立任何未完成 P3 production pack；家長 UI 不會顯示假 P3。

### 10.2 真正 P3 包製作流程

1. 在 `outcomes.json` 新增 P3 outcome，每條有官方 PDF 頁碼及原文引文。
2. 在 `skills-p3.ts` 建立 P3 技能圖，先修可指向 P2 技能。
3. 在 `sg-primary-p3` manifest 固定來源、年級、科目及 schema。
4. 依 34 技能藍圖同類規則建立 P3 題目、模板家族、作答方式及遷移題。
5. 執行 `verify:sources`、`verify:content`、`verify:depth`、`npm test`、`build`。
6. 另寫 P3 內容製作計劃，逐科讀官方 P3 表及教材字表；不把 P3 內容塞入本計劃的測試 fixture。

### 10.3 建議 P3 技能骨架

以下為 P3 production pack 的初始技能地圖；實際 outcome ID、exact/broad 映射及中文教材字表仍須在 P3 內容計劃逐條核對。

| 科目 | 新技能骨架 |
|---|---|
| 數學 | `math-p3-numbers-10000`, `math-p3-add-sub-4digit`, `math-p3-multiply-divide-6to9`, `math-p3-division-remainder`, `math-p3-multiply-divide-3x1`, `math-p3-equivalent-fractions`, `math-p3-compare-unlike-fractions`, `math-p3-related-fractions-add-sub`, `math-p3-money-decimal`, `math-p3-compound-measurements`, `math-p3-time-duration-24h`, `math-p3-area-perimeter`, `math-p3-angles`, `math-p3-parallel-perpendicular`, `math-p3-bar-graphs` |
| 華文 | `mandarin-p3-characters`, `mandarin-p3-reading-literal`, `mandarin-p3-reading-inference`, `mandarin-p3-reading-main-idea`, `mandarin-p3-listening-instructions`, `mandarin-p3-vocabulary-context`；`mandarin-p3-oral-retell` 只作口語練習，不作 secure 證據 |
| 英語 | `english-p3-listening-instructions`, `english-p3-listening-sentences`, `english-p3-phonics-multisyllable`, `english-p3-vocabulary-context`, `english-p3-grammar-sentences`, `english-p3-reading-literal`, `english-p3-reading-sequence`, `english-p3-reading-inference`, `english-p3-spelling-frequent`；`english-p3-oral-purpose` 只作口語練習 |

### 10.4 升級驗收

- P2 孩子升級數學 P3 後，P2 已 secure 技能仍保留；P3 新技能依 P2 先修顯示可用／不可用。
- 英語仍 P2 時，不顯示 P3 英語練習。
- 切換前未完成的 session 不會混用兩個 pack version。
- P3 包移除或回滾時，歷史 P3 attempts 仍可讀，當前 scope 不會指向不存在的技能。
- 同一家庭資料由 schema 2 升到 schema 3 後，舊題目 ID、舊 CSV 及備份仍可讀。

## 11. 發佈規則

### P0／阻斷

- 任一內容包答案不可由規則或 fixture 驗證。
- 同一技能有兩個語義正確選項，或題目引用錯誤來源／頁碼。
- P3 切換後丟失 P1/P2 證據，或舊備份無法解密／遷移。
- 孩子模式可進入課程包管理、家長設定或看到其他孩子資料。
- 離線冷啟動後缺少已啟用 pack，卻仍把孩子導向空白題目。

### P1／必須修

- 主要兒童操作在 iPad 或 Android 平板首屏被遮擋。
- 同輪重複同一題目、同模板連續超過 2 題。
- 已 secure 技能因舊資料遷移錯誤而錯誤保留。
- 家長看到「保存成功」但資料實際未寫入。

### 不可宣稱

- 「完全覆蓋 P1–P3 課程」
- 「100% 正確／零錯誤」
- 「真人老師已核准」
- 「AI 已判斷發音正確」
- 「真機 PWA 已驗收」如尚未完成 iPhone/iPad/Android 平板實際加入主畫面及離線冷啟

---

## 12. 實施任務

以下任務依序執行。每個任務單獨形成可運行、可測試的增量；不要在同一 commit 混入多個階段。

### Task 1：建立深度及課程包型別

**Files:**
- Create: `apps/family/src/content/depth.ts`
- Modify: `apps/family/src/lib/types.ts`
- Test: `apps/family/src/content/depth.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
import { describe, expect, it } from "vitest";
import { isTransferEvidence, responseModeForQuestionKind } from "./depth";

describe("depth contract", () => {
  it("maps tapping question kinds to response modes", () => {
    expect(responseModeForQuestionKind("choice")).toBe("tap-choice");
    expect(responseModeForQuestionKind("match")).toBe("tap-match");
  });

  it("counts only near or far transfer as transfer evidence", () => {
    expect(isTransferEvidence("same-context")).toBe(false);
    expect(isTransferEvidence("near-transfer")).toBe(true);
    expect(isTransferEvidence("far-transfer")).toBe(true);
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/depth.test.ts`

Expected: FAIL，訊息含 `Cannot find module './depth'`。

- [ ] **Step 3: 寫最小實作**

```ts
export type SchoolGrade = "P1" | "P2" | "P3" | "P4" | "P5" | "P6";
export type Subject = "math" | "mandarin" | "english";
export type CognitiveDemand = "recognition" | "discrimination" | "application" | "transfer";
export type TransferLevel = "same-context" | "near-transfer" | "far-transfer";
export type ResponseMode = "tap-choice" | "tap-match" | "tap-order" | "voice-practice";

export function responseModeForQuestionKind(kind: "choice" | "match"): ResponseMode {
  return kind === "choice" ? "tap-choice" : "tap-match";
}

export function isTransferEvidence(level: TransferLevel): boolean {
  return level === "near-transfer" || level === "far-transfer";
}
```

在 `types.ts` 重新 export 這些型別，並把 `ItemDepth`、`SkillDepthBlueprint`、`CurriculumPackManifest`、`LearningScope` 放進 `depth.ts`，避免循環 import。

- [ ] **Step 4: 跑測試確認通過**

Run: `cd apps/family && npx vitest run src/content/depth.test.ts`

Expected: `2 passed`。

- [ ] **Step 5: Commit**

```bash
git add apps/family/src/content/depth.ts apps/family/src/content/depth.test.ts apps/family/src/lib/types.ts
git commit -m "feat: define learning depth and curriculum pack contracts"
```

### Task 2：為現有 234 題補齊深度 metadata

**Files:**
- Modify: `apps/family/src/content/math.ts`
- Modify: `apps/family/src/content/language.ts`
- Modify: `apps/family/src/content/matching.ts`
- Modify: `apps/family/src/lib/types.ts`
- Test: `apps/family/src/content/depth.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
import { QUESTIONS } from "./catalog";
import type { Question } from "../lib/types";

it("gives every current question a valid depth record", () => {
  for (const question of QUESTIONS) {
    expect(question.depth.templateFamily.length, question.id).toBeGreaterThan(0);
    expect(["tap-choice", "tap-match", "tap-order", "voice-practice"]).toContain(question.depth.responseMode);
    expect(["recognition", "discrimination", "application", "transfer"]).toContain(question.depth.cognitiveDemand);
    expect(["same-context", "near-transfer", "far-transfer"]).toContain(question.depth.transferLevel);
  }
});

it("does not infer depth from an unstable display label", () => {
  const question = QUESTIONS[0] as Question;
  expect(question.depth).not.toHaveProperty("prompt");
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/depth.test.ts -t "depth record"`

Expected: FAIL，`question.depth` 為 undefined。

- [ ] **Step 3: 實作共用 builder**

在 `depth.ts` 加入：

```ts
export function makeDepth(
  templateFamily: string,
  responseMode: ResponseMode,
  cognitiveDemand: CognitiveDemand,
  transferLevel: TransferLevel,
  contextKey: string
): ItemDepth {
  if (!templateFamily.trim()) throw new Error("templateFamily is required");
  if (!contextKey.trim()) throw new Error("contextKey is required");
  return { templateFamily, responseMode, cognitiveDemand, transferLevel, contextKey };
}
```

在 `QuestionBase` 加 `depth: ItemDepth`。`makeMathQuestion`、`makeLanguageQuestion`、`makeMatchQuestion` 接受 `templateFamily`、`cognitiveDemand`、`transferLevel`、`contextKey`。現有題目預設為 `same-context`；有故事、圖表、句子情境者為 `near-transfer`；純算式與配對不得假裝 far transfer。

- [ ] **Step 4: 跑全內容測試確認通過**

Run: `cd apps/family && npx vitest run src/content/depth.test.ts src/content/content.test.ts`

Expected: 全部 passed；現有 234 題仍可解析。

- [ ] **Step 5: Commit**

```bash
git add apps/family/src/content/math.ts apps/family/src/content/language.ts apps/family/src/content/matching.ts apps/family/src/content/depth.ts apps/family/src/content/depth.test.ts apps/family/src/lib/types.ts
git commit -m "feat: annotate content with depth metadata"
```

### Task 3：建立課程包 manifest 及 registry

**Files:**
- Create: `apps/family/src/content/packs/registry.ts`
- Create: `apps/family/src/content/packs/registry.test.ts`
- Modify: `apps/family/src/content/release.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
import { describe, expect, it } from "vitest";
import { getPack, getPacksForScope } from "./registry";

describe("curriculum pack registry", () => {
  it("registers the current P1/P2 pack once", () => {
    expect(getPack("sg-primary-p1-p2").id).toBe("sg-primary-p1-p2");
  });

  it("returns only packs compatible with a P2 math scope", () => {
    const packs = getPacksForScope({ subject: "math", grade: "P2", packIds: ["sg-primary-p1-p2"] });
    expect(packs.map((pack) => pack.id)).toEqual(["sg-primary-p1-p2"]);
  });

  it("does not expose an absent P3 pack as available", () => {
    expect(getPacksForScope({ subject: "math", grade: "P3", packIds: ["sg-primary-p1-p2"] }).map((pack) => pack.id)).toEqual(["sg-primary-p1-p2"]);
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/packs/registry.test.ts`

Expected: FAIL，`registry` 不存在。

- [ ] **Step 3: 寫 registry**

```ts
const CURRENT_P1_P2: CurriculumPackManifest = {
  id: "sg-primary-p1-p2",
  version: CONTENT_PACK.version,
  contentSchemaVersion: CONTENT_PACK.schemaVersion,
  appSchemaMin: DATA_SCHEMA_VERSION,
  subjects: ["math", "mandarin", "english"],
  gradeBands: ["P1", "P2"],
  sourceIds: ["moe-math-2021-oct-2025"],
  publishedAt: CONTENT_PACK.publishedAt,
  contentSha256: CONTENT_PACK.contentSha256,
  releaseStatus: "pilot"
};
```

`sg-primary-p1-p2` 是同一個 manifest，以 `subjects` 宣告三科；不要建立三個同 ID manifest，否則 registry 無法唯一解析。

`CONTENT_PACK.contentSha256` 在 release manifest 中固定，`npm run update:content` 只可同時更新 `content.sha256` 及 `CONTENT_PACK.contentSha256`；不得在瀏覽器 runtime 用 `fs.readFileSync` 讀本機檔案。

```ts
export function getPacksForScope(scope: LearningScope): CurriculumPackManifest[] {
  return PACKS.filter((pack) => pack.subjects.includes(scope.subject))
    .filter((pack) => scope.packIds.includes(pack.id))
    .filter((pack) => pack.gradeBands.includes(scope.grade) || pack.gradeBands.some((grade) => gradeRank(grade) < gradeRank(scope.grade)));
}

function gradeRank(grade: SchoolGrade): number {
  return Number(grade.slice(1));
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `cd apps/family && npx vitest run src/content/packs/registry.test.ts`

Expected: `3 passed`。

- [ ] **Step 5: Commit**

```bash
git add apps/family/src/content/packs/registry.ts apps/family/src/content/packs/registry.test.ts apps/family/src/content/release.ts
git commit -m "feat: register versioned curriculum packs"
```

### Task 4：建立 34 技能深度藍圖及驗證

**Files:**
- Create: `apps/family/src/content/depthBlueprint.ts`
- Create: `apps/family/src/content/depthBlueprint.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
import { describe, expect, it } from "vitest";
import { SKILLS } from "./skills";
import { SKILL_DEPTH_BLUEPRINTS, getDepthBlueprint } from "./depthBlueprint";

describe("skill depth blueprints", () => {
  it("covers every skill exactly once", () => {
    const ids = SKILL_DEPTH_BLUEPRINTS.map((blueprint) => blueprint.skillId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(SKILLS.map((skill) => skill.id)));
  });

  it("requires three families and two response modes for every skill", () => {
    for (const skill of SKILLS) {
      const blueprint = getDepthBlueprint(skill.id);
      expect(blueprint.minTemplateFamilies).toBeGreaterThanOrEqual(3);
      expect(blueprint.minResponseModes).toBeGreaterThanOrEqual(2);
      expect(blueprint.targetItemCount).toBeGreaterThanOrEqual(12);
    }
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/depthBlueprint.test.ts`

Expected: FAIL，找不到 `depthBlueprint`。

- [ ] **Step 3: 寫 34 個 blueprint**

```ts
export const SKILL_DEPTH_BLUEPRINTS: SkillDepthBlueprint[] = [
  {
    skillId: "math-count-100",
    targetItemCount: 18,
    minTemplateFamilies: 4,
    minResponseModes: 2,
    minTransferItems: 2,
    minContexts: 3,
    requiredTemplateFamilies: ["number-sequence", "place-value-tens-ones", "compare-order", "count-to-100"]
  },
  ...DEPTH_ROWS_FROM_SECTION_5_3.map(toBlueprint)
];
```

`DEPTH_ROWS_FROM_SECTION_5_3` 必須逐字包含第 5.3 表全部 34 列；測試會比對 `SKILLS` 全集。`getDepthBlueprint` 遇到未知技能必須 throw，不得回傳通用預設值。

- [ ] **Step 4: 跑測試確認通過**

Run: `cd apps/family && npx vitest run src/content/depthBlueprint.test.ts`

Expected: `2 passed`。

- [ ] **Step 5: Commit**

```bash
git add apps/family/src/content/depthBlueprint.ts apps/family/src/content/depthBlueprint.test.ts
git commit -m "feat: define depth targets for all skills"
```

### Task 5：把內容驗證改為按課程包及深度執行

**Files:**
- Modify: `apps/family/scripts/verify-content.ts`
- Modify: `apps/family/src/content/catalog.ts`
- Modify: `apps/family/package.json`
- Test: `apps/family/src/content/content.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
it("reports depth failures by skill", () => {
  const issues = validateContentCatalog();
  expect(issues.some((issue) => issue.code === "depth-template-families" && issue.skillId === "math-time")).toBe(true);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/content.test.ts -t "depth failures"`

Expected: FAIL，現時沒有 `depth-template-families`。

- [ ] **Step 3: 移除硬編碼 234 並加入深度問題**

`verify-content.ts` 不再 assert `QUESTIONS.length === 234`，改為：

```ts
console.log(`Verified ${packs.length} pack manifests, ${SKILLS.length} skills, ${QUESTIONS.length} questions.`);
```

`validateContentCatalog` 每位技能按 blueprint 計算：

- `too-few-questions` 改為 `< blueprint.targetItemCount`；
- `depth-template-families` 為少於 `minTemplateFamilies`；
- `depth-response-modes` 為少於 `minResponseModes`；
- `depth-transfer-items` 為少於 `minTransferItems`；
- `depth-contexts` 為少於 `minContexts`；
- `depth-family-count` 任一 required family 少於 2 題。

`package.json` 加：

```json
"verify:depth": "tsx scripts/verify-content.ts --depth"
```

- [ ] **Step 4: 確認現時如實報缺口**

Run: `cd apps/family && npm run verify:depth`

Expected: FAIL，列出至少 `math-time`、`math-picture-graph`、`math-fractions-add-sub`、`english-listening` 的模板／作答方式缺口；不應假裝現有內容已達標。

- [ ] **Step 5: Commit**

```bash
git add apps/family/scripts/verify-content.ts apps/family/src/content/catalog.ts apps/family/src/content/content.test.ts apps/family/package.json
git commit -m "test: enforce per-skill content depth"
```

### Task 6：資料 schema 3：逐科年級、課程包快照及深度證據

**Files:**
- Modify: `apps/family/src/lib/types.ts`
- Modify: `apps/family/src/lib/version.ts`
- Modify: `apps/family/src/lib/storage.ts`
- Modify: `apps/family/src/lib/profile.ts`
- Test: `apps/family/src/lib/storage.test.ts`

- [ ] **Step 1: 寫 migration 失敗測試**

```ts
it("migrates schema 2 to schema 3 without losing attempts", () => {
  const old = {
    version: 2,
    householdName: "学习区",
    parentName: "妈妈",
    pinHash: "hash",
    pinSalt: "salt",
    createdAt: "2026-11-20T00:00:00.000Z",
    children: [legacyChildFixture]
  };
  const migrated = migrateHousehold(old);
  expect(migrated.version).toBe(3);
  expect(migrated.children[0].attempts).toEqual(legacyChildFixture.attempts);
  expect(migrated.children[0].learningScopes.math.grade).toBe("P2");
  expect(migrated.children[0].learningScopes.math.packIds).toEqual(["sg-primary-p1-p2"]);
});

it("preserves P2 evidence when the child switches math to P3", () => {
  const child = createChildProfile("小星", "star");
  const before = child.evidence["math-add-sub-100"];
  child.learningScopes.math = { subject: "math", grade: "P3", packIds: ["sg-primary-p1-p2", "sg-primary-p3-fixture"] };
  expect(child.evidence["math-add-sub-100"]).toEqual(before);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/lib/storage.test.ts -t "schema 2 to schema 3"`

Expected: FAIL，`version` 仍為 2 且沒有 `learningScopes`。

- [ ] **Step 3: 實作 schema 3**

```ts
export interface HouseholdStateV3 {
  version: 3;
  householdName: string;
  parentName: string;
  pinHash: string;
  pinSalt: string;
  createdAt: string;
  children: ChildProfileV3[];
}

export interface ChildProfileV3 extends ChildProfile {
  learningScopes: Record<Subject, LearningScope>;
}

export interface AttemptV3 extends Attempt {
  packId: string;
  packVersion: string;
  templateFamily: string;
  responseMode: ResponseMode;
  transferLevel: TransferLevel;
  skillSemanticVersion: number;
}

export interface SessionRecordV3 extends Omit<SessionRecord, "attempts"> {
  packVersions: Record<string, string>;
  attempts: AttemptV3[];
}
```

Migration 規則：

```ts
const defaultScope: LearningScope = {
  subject,
  grade: "P2",
  packIds: ["sg-primary-p1-p2"]
};
```

- 對 schema 2 的孩子建立三科 `learningScopes`，預設 P2，因現有資料是 P1/P2。
- 舊 `Attempt` 的 `packId` 填 `sg-primary-p1-p2`，`packVersion` 填 `CONTENT_PACK.version`。
- 舊 `template` 如能由 current question ID 找到，回填 `templateFamily`；否則 `legacy-template`。
- `responseMode` 由 question.kind 回填；找不到則 `tap-choice`。
- 舊 `transferLevel` 一律 `same-context`，不把未標記題目冒充遷移證據。
- `SkillEvidence` 新增 `diversity`、`skillSemanticVersion`；缺值時空集合／0。
- `DATA_SCHEMA_VERSION` 改為 3；未加密和加密備份都要走同一 migration。

- [ ] **Step 4: 跑 storage 及備份測試**

Run: `cd apps/family && npx vitest run src/lib/storage.test.ts src/lib/storageHealth.test.ts`

Expected: 全部 passed；schema 1、2、3 fixture 均可讀，舊 attempts 不丟失。

- [ ] **Step 5: Commit**

```bash
git add apps/family/src/lib/types.ts apps/family/src/lib/version.ts apps/family/src/lib/storage.ts apps/family/src/lib/profile.ts apps/family/src/lib/storage.test.ts
git commit -m "feat: migrate family data for learning scopes and depth evidence"
```

### Task 7：BKT 更新加入模板、表徵、遷移及延後保持

**Files:**
- Modify: `apps/family/src/engine/bkt.ts`
- Modify: `apps/family/src/engine/bkt.test.ts`
- Modify: `apps/family/src/engine/session.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
it("records template, response mode, transfer and context diversity", () => {
  const start = new Date("2026-11-20T08:00:00.000Z");
  let evidence = createSkillEvidence("math-add-sub-100", start);
  evidence = updateBktEvidence(evidence, {
    correct: true,
    hintUsed: false,
    questionId: "q1",
    template: "number-bond",
    templateFamily: "number-bond",
    responseMode: "tap-choice",
    transferLevel: "same-context",
    contextKey: "bare-number",
    at: start
  });
  expect(evidence.diversity.templateFamilies["number-bond"]).toBe(1);
  expect(evidence.diversity.responseModes["tap-choice"]).toBe(1);
  expect(evidence.diversity.transferCorrect).toBe(0);
});

it("does not treat repeated template families as breadth", () => {
  let evidence = createSkillEvidence("english-phonics");
  for (const [index, questionId] of ["a", "b", "c"].entries()) {
    evidence = updateBktEvidence(evidence, {
      correct: true,
      hintUsed: false,
      questionId,
      template: "initial-sound",
      templateFamily: "initial-sound",
      responseMode: "tap-choice",
      transferLevel: "same-context",
      contextKey: "word",
      at: new Date(`2026-11-20T0${index}:00:00.000Z`)
    });
  }
  expect(Object.keys(evidence.diversity.templateFamilies)).toEqual(["initial-sound"]);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/engine/bkt.test.ts -t "template, response mode"`

Expected: FAIL，`BktObservation` 未接受新欄位。

- [ ] **Step 3: 擴充 BktObservation 及更新函式**

```ts
export interface BktObservation {
  correct: boolean;
  hintUsed: boolean;
  template: string;
  templateFamily: string;
  responseMode: ResponseMode;
  transferLevel: TransferLevel;
  contextKey: string;
  questionId: string;
  at?: Date;
}
```

只在「新題目且非提示」時更新：

- `templateFamilies[templateFamily] += 1`
- `responseModes[responseMode] += 1`
- `transferCorrect += 1` if correct and `isTransferEvidence(transferLevel)`
- `farTransferCorrect += 1` if correct and `far-transfer`
- `delayedIndependentCorrect += 1` if correct and 距首次證據 ≥ 24 小時
- `contextKeys` 去重加入 `contextKey`
- `lastIndependentWrongAt` 記錄最近一次獨立答錯

同一 question ID 重複作答不得增加 diversity counts。`voice-practice` 不得呼叫 `updateBktEvidence`。

- [ ] **Step 4: 跑 BKT 及 session 測試**

Run: `cd apps/family && npx vitest run src/engine/bkt.test.ts src/engine/session.test.ts`

Expected: 全部 passed；舊「same question 不增加」測試仍通過。

- [ ] **Step 5: Commit**

```bash
git add apps/family/src/engine/bkt.ts apps/family/src/engine/bkt.test.ts apps/family/src/engine/session.ts
git commit -m "feat: track evidence diversity and transfer"
```

### Task 8：收緊掌握分類及 secure 門檻

**Files:**
- Modify: `apps/family/src/engine/bkt.ts`
- Modify: `apps/family/src/engine/bkt.test.ts`
- Modify: `apps/family/src/content/content.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
function addEvidence(
  evidence: SkillEvidence,
  input: { questionId: string; family: string; mode: ResponseMode; transfer: TransferLevel; at: string; correct?: boolean }
) {
  return updateBktEvidence(evidence, {
    questionId: input.questionId,
    template: input.family,
    templateFamily: input.family,
    responseMode: input.mode,
    transferLevel: input.transfer,
    contextKey: input.family,
    correct: input.correct ?? true,
    hintUsed: false,
    at: new Date(input.at)
  });
}

it("does not mark four same-family answers as secure", () => {
  let evidence = createSkillEvidence("math-count-100", new Date("2026-11-20T00:00:00.000Z"));
  for (const id of ["q1", "q2", "q3", "q4"]) {
    evidence = addEvidence(evidence, { questionId: id, family: "place-value", mode: "tap-choice", transfer: "same-context", at: "2026-11-21T00:00:00.000Z" });
  }
  expect(classifyMastery(evidence, new Date("2026-11-21T01:00:00.000Z"))).not.toBe("secure");
});

it("marks secure only after three families, two modes, transfer and delayed evidence", () => {
  let evidence = createSkillEvidence("math-count-100", new Date("2026-11-20T00:00:00.000Z"));
  evidence = addEvidence(evidence, { questionId: "q1", family: "number-sequence", mode: "tap-choice", transfer: "same-context", at: "2026-11-20T00:00:00.000Z" });
  evidence = addEvidence(evidence, { questionId: "q2", family: "place-value-tens-ones", mode: "tap-match", transfer: "same-context", at: "2026-11-20T01:00:00.000Z" });
  evidence = addEvidence(evidence, { questionId: "q3", family: "compare-order", mode: "tap-choice", transfer: "same-context", at: "2026-11-20T02:00:00.000Z" });
  evidence = addEvidence(evidence, { questionId: "q4", family: "number-sequence", mode: "tap-order", transfer: "same-context", at: "2026-11-20T03:00:00.000Z" });
  evidence = addEvidence(evidence, { questionId: "q5", family: "place-value-tens-ones", mode: "tap-match", transfer: "near-transfer", at: "2026-11-20T04:00:00.000Z" });
  evidence = addEvidence(evidence, { questionId: "q6", family: "compare-order", mode: "tap-choice", transfer: "far-transfer", at: "2026-11-21T04:00:00.000Z" });
  expect(classifyMastery(evidence, new Date("2026-11-21T05:00:00.000Z"))).toBe("secure");
});

it("drops secure after the most recent independent attempt is wrong", () => {
  const evidence = addEvidence(secureFixture, {
    questionId: "q7",
    family: "compare-order",
    mode: "tap-choice",
    transfer: "same-context",
    at: "2026-11-22T04:00:00.000Z",
    correct: false
  });
  expect(classifyMastery(evidence, new Date("2026-11-22T05:00:00.000Z"))).toBe("likely-secure");
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/engine/bkt.test.ts -t "same-family"`

Expected: FAIL，現時仍會 secure。

- [ ] **Step 3: 實作 classifyMastery**

```ts
const templateFamilies = Object.keys(evidence.diversity.templateFamilies).length;
const responseModes = Object.keys(evidence.diversity.responseModes).length;
const lastIndependentWrong = evidence.diversity.lastIndependentWrongAt;
const hasRecentWrong = Boolean(lastIndependentWrong && evidence.lastAttemptAt && lastIndependentWrong >= evidence.lastAttemptAt);

if (
  !hasRecentWrong
  && evidence.independentCorrect >= 6
  && evidence.questionIds.length >= 5
  && templateFamilies >= 3
  && responseModes >= 2
  && evidence.diversity.transferCorrect >= 1
  && evidence.diversity.delayedIndependentCorrect >= 1
  && lower >= 0.60
) return "secure";
```

`likely-secure` 用 4 / 4 / 2 / 2 / lower ≥ 0.50。若 `hasRecentWrong`，最高只能是 `likely-secure`。

- [ ] **Step 4: 更新內容可行性 fixture**

現有 `content.test.ts` 的「4 題即可 secure」測試要改為 6 題、3 家族、2 模式、1 transfer、1 delayed；舊 fixture 應改為驗證「不再可 secure」，並另加完整 fixture 驗證可 secure。

- [ ] **Step 5: 跑測試確認通過**

Run: `cd apps/family && npx vitest run src/engine/bkt.test.ts src/content/content.test.ts`

Expected: 全部 passed；不再存在 4 題即 secure 的測試。

- [ ] **Step 6: Commit**

```bash
git add apps/family/src/engine/bkt.ts apps/family/src/engine/bkt.test.ts apps/family/src/content/content.test.ts
git commit -m "feat: require depth and retention evidence for mastery"
```

### Task 9：先修解鎖改為跨模板及跨作答方式

**Files:**
- Modify: `apps/family/src/engine/session.ts`
- Modify: `apps/family/src/engine/session.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
it("does not unlock a prerequisite from two questions in one template family", () => {
  const child = createChildProfile("小星", "star");
  child.diagnostics.math = { completedAt: "2026-11-20T09:00:00.000Z", sessionId: "setup" };
  child.evidence["math-count-100"] = {
    ...child.evidence["math-count-100"],
    independentCorrect: 2,
    nEff: 2,
    questionIds: ["q1", "q2"],
    diversity: {
      templateFamilies: { "place-value": 2 },
      responseModes: { "tap-choice": 2, "tap-match": 0, "tap-order": 0, "voice-practice": 0 },
      transferCorrect: 0,
      farTransferCorrect: 0,
      delayedIndependentCorrect: 0,
      contextKeys: ["bare-number"],
      lastIndependentWrongAt: null
    }
  };
  expect(recommendedNextSkills(child, "math").map((item) => item.skill.id)).not.toContain("math-add-sub-100");
});

it("unlocks after two families and two response modes", () => {
  const child = twoFamilyPrerequisiteFixture();
  expect(recommendedNextSkills(child, "math").map((item) => item.skill.id)).toContain("math-add-sub-100");
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/engine/session.test.ts -t "one template family"`

Expected: FAIL，現時只看 correct 數量。

- [ ] **Step 3: 實作 isPrerequisiteReady**

```ts
function isPrerequisiteReady(evidence: SkillEvidence): boolean {
  if (!evidence) return false;
  const families = Object.keys(evidence.diversity.templateFamilies).length;
  const modes = Object.keys(evidence.diversity.responseModes).filter(
    (mode) => mode !== "voice-practice" && evidence.diversity.responseModes[mode as ResponseMode] > 0
  ).length;
  const lastWrong = evidence.diversity.lastIndependentWrongAt;
  const recentWrong = Boolean(lastWrong && evidence.lastAttemptAt && lastWrong >= evidence.lastAttemptAt);
  return evidence.independentCorrect >= 2 && evidence.questionIds.length >= 2 && families >= 2 && modes >= 2 && !recentWrong;
}
```

保留低門檻的 `developing` 顯示，但先修門禁必須用 `isPrerequisiteReady`，不得用 `independentCorrect >= 2` 單條件。

- [ ] **Step 4: 跑測試確認通過**

Run: `cd apps/family && npx vitest run src/engine/session.test.ts`

Expected: 全部 passed。

- [ ] **Step 5: Commit**

```bash
git add apps/family/src/engine/session.ts apps/family/src/engine/session.test.ts
git commit -m "feat: require diverse evidence before prerequisite unlock"
```

### Task 10：加入可重現的內容多樣性選題器

**Files:**
- Create: `apps/family/src/engine/itemSelector.ts`
- Create: `apps/family/src/engine/itemSelector.test.ts`
- Modify: `apps/family/src/engine/session.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
import { describe, expect, it } from "vitest";
import { createChildProfile } from "../lib/profile";

it("prefers an unseen template family over a repeated family", () => {
  const child = createChildProfile("小星", "star");
  child.evidence["math-count-100"].diversity.templateFamilies = { "place-value-tens-ones": 3 };
  const session = createPracticeSession(child, "math", 1);
  const question = selectNextQuestion(child, session);
  expect(question?.depth.templateFamily).not.toBe("place-value-tens-ones");
});

it("does not repeat the same template family three times consecutively", () => {
  const child = createChildProfile("小星", "star");
  let session = createPracticeSession(child, "math", 6);
  const seen: string[] = [];
  for (let index = 0; index < 3; index += 1) {
    const question = selectNextQuestion(child, session)!;
    seen.push(question.depth.templateFamily);
    session = recordSessionAnswer(child, session, { questionId: question.id, correct: true, hintUsed: false, at: new Date("2026-11-20T10:00:00.000Z") });
  }
  expect(seen[2]).not.toBe(seen[0]);
  expect(seen.join("-")).not.toBe(seen[0] + "-" + seen[0] + "-" + seen[0]);
});

it("is deterministic for the same child, session and candidate set", () => {
  const child = createChildProfile("小月", "moon");
  const session = createPracticeSession(child, "english", 1);
  expect(selectNextQuestion(child, session)?.id).toBe(selectNextQuestion(child, session)?.id);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/engine/itemSelector.test.ts`

Expected: FAIL，`itemSelector` 不存在。

- [ ] **Step 3: 實作分數及 tie-break**

```ts
function itemScore(input: {
  question: Question;
  evidence: SkillEvidence;
  recentFamilies: string[];
  predictedSuccess: number;
}): number {
  const familySeen = input.evidence.diversity.templateFamilies[input.question.depth.templateFamily] ?? 0;
  const modeSeen = input.evidence.diversity.responseModes[input.question.depth.responseMode] ?? 0;
  const sameRecentFamily = input.recentFamilies.filter((family) => family === input.question.depth.templateFamily).length;
  return -familySeen * 2.0
    - modeSeen * 1.0
    + (input.question.depth.transferLevel !== "same-context" ? 1.5 : 0)
    - sameRecentFamily * 3.0
    - Math.abs(input.predictedSuccess - 0.8);
}
```

tie-break：

```ts
function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const stableTieBreak = stableHash(`${child.id}:${session.id}:${question.id}`);
```

不要在瀏覽器 runtime import Node `crypto`；tie-break 只需穩定排序，不是密碼學安全用途。

- [ ] **Step 4: 把 session.ts 的 `selectNextQuestion` 改成呼叫 selector**

- Diagnostic 分支仍保留，但改用同一 `recentFamilies` 及 difficulty rules。
- Practice 分支不再用 `Math.random()`／localeCompare 決定 tie。
- 選題時排除 `voice-practice`，除非呼叫方明確要求口語練習。

- [ ] **Step 5: 跑測試確認通過**

Run: `cd apps/family && npx vitest run src/engine/itemSelector.test.ts src/engine/session.test.ts`

Expected: 全部 passed。

- [ ] **Step 6: Commit**

```bash
git add apps/family/src/engine/itemSelector.ts apps/family/src/engine/itemSelector.test.ts apps/family/src/engine/session.ts
git commit -m "feat: select items by evidence diversity and deterministic score"
```

### Task 11：加入起點診斷的保守估值

**Files:**
- Create: `apps/family/src/engine/placement.ts`
- Create: `apps/family/src/engine/placement.test.ts`
- Modify: `apps/family/src/engine/session.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
it("never assumes an unobserved domain is mastered", () => {
  const result = buildPlacementResult(createChildProfile("小星", "star"), "math");
  expect(result.unknownSkillIds.length).toBeGreaterThan(0);
  expect(result.secureSkillIds).toEqual([]);
  expect(result.startSkillId).toBe("math-count-100");
});

it("starts at the earliest unmet prerequisite", () => {
  const child = readyMathCountFixture();
  expect(buildPlacementResult(child, "math").startSkillId).toBe("math-add-sub-100");
});

it("samples at least three subdomains and never repeats an item", () => {
  let session = createDiagnosticSession(createChildProfile("小月", "moon"), "math");
  const domains = new Set<string>();
  const ids = new Set<string>();
  for (let index = 0; index < 8; index += 1) {
    const question = selectNextQuestion(child, session)!;
    domains.add(question.skillId.split("-")[1]);
    expect(ids.has(question.id)).toBe(false);
    ids.add(question.id);
    session = recordSessionAnswer(child, session, { questionId: question.id, correct: index % 2 === 0, hintUsed: false });
  }
  expect(domains.size).toBeGreaterThanOrEqual(3);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/engine/placement.test.ts`

Expected: FAIL，`placement` 不存在。

- [ ] **Step 3: 實作 PlacementResult**

```ts
export interface PlacementResult {
  startSkillId: string;
  provisionalSkillIds: string[];
  unknownSkillIds: string[];
  secureSkillIds: string[];
  sampledSkillIds: string[];
}
```

- 只從已取樣且有多樣證據的技能列 `provisional`，不列 `secure`。
- `startSkillId` 是該科目技能順序中，第一個先修未 ready 或自身 unknown 的技能。
- 若所有技能均有 secure 證據，才可選下一個未見技能；診斷完成當下通常不會發生。
- 完成後孩子文案只顯示「今天從這裡開始」，不顯示概率。

- [ ] **Step 4: 跑測試確認通過**

Run: `cd apps/family && npx vitest run src/engine/placement.test.ts src/engine/session.test.ts`

Expected: 全部 passed。

- [ ] **Step 5: Commit**

```bash
git add apps/family/src/engine/placement.ts apps/family/src/engine/placement.test.ts apps/family/src/engine/session.ts
git commit -m "feat: add conservative multi-domain placement"
```

### Task 12：加入點按排序題，保持無打字／無描寫

**Files:**
- Modify: `apps/family/src/lib/types.ts`
- Modify: `apps/family/src/App.tsx`
- Modify: `apps/family/src/styles.css`
- Create: `apps/family/src/screens/TapOrderBoard.tsx`
- Create: `apps/family/src/screens/TapOrderBoard.test.tsx`
- Test: `apps/family/src/app.test.tsx`

- [ ] **Step 1: 寫失敗測試**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("completes a sentence by tapping tokens in order", async () => {
  render(<TapOrderBoard
    tokens={[{ id: "the", label: "The" }, { id: "cat", label: "cat" }, { id: "sleeps", label: "sleeps" }]}
    correctTokenIds={["the", "cat", "sleeps"]}
    disabled={false}
    onComplete={(correct) => { expect(correct).toBe(true); }}
  />);
  await userEvent.click(screen.getByRole("button", { name: "The" }));
  await userEvent.click(screen.getByRole("button", { name: "cat" }));
  await userEvent.click(screen.getByRole("button", { name: "sleeps" }));
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/screens/TapOrderBoard.test.tsx`

Expected: FAIL，component 不存在。

- [ ] **Step 3: 實作單一觸控流程**

- 題目顯示已選 token 區及可用 token 區。
- 孩子只點 token，不拖放、不打字。
- 全部點完才呼叫 `onComplete(correct)`，視為一次作答。
- 點錯可取消最後一個 token，不把每次點按拆成多條 attempt。
- 主動作只有「重新排」或 `disabled` 後的全局「下一題」，不新增第二個主按鈕。
- 44 CSS px 最小觸控目標；主要 token 高度 ≥ 56 px。

- [ ] **Step 4: 接入 Question kind**

```ts
export interface TapOrderQuestion extends QuestionBase {
  kind: "tap-order";
  tokens: Array<{ id: string; label: string; audioText?: string }>;
  correctTokenIds: string[];
}
export type Question = ChoiceQuestion | MatchQuestion | TapOrderQuestion;
```

`App.tsx` 增加 `kind === "tap-order"` 分支；`MatchingBoard` 行為不改。

- [ ] **Step 5: 跑 component、app 及觸控測試**

Run: `cd apps/family && npx vitest run src/screens/TapOrderBoard.test.tsx src/app.test.tsx`

Expected: 全部 passed。

- [ ] **Step 6: Commit**

```bash
git add apps/family/src/lib/types.ts apps/family/src/App.tsx apps/family/src/styles.css apps/family/src/screens/TapOrderBoard.tsx apps/family/src/screens/TapOrderBoard.test.tsx apps/family/src/app.test.tsx
git commit -m "feat: add tap-order interaction without typing"
```

### Task 13：加深數學內容至藍圖門檻

**Files:**
- Modify: `apps/family/src/content/math.ts`
- Modify: `apps/family/src/content/matching.ts` only to add second modes where needed
- Create: `apps/family/src/content/math-depth.test.ts`

- [ ] **Step 1: 寫逐技能失敗測試**

```ts
for (const skill of SKILLS.filter((item) => item.subject === "math")) {
  it(`${skill.id} meets its math depth blueprint`, () => {
    const blueprint = getDepthBlueprint(skill.id);
    const questions = QUESTIONS.filter((question) => question.skillId === skill.id);
    expect(questions.length, skill.id).toBe(blueprint.targetItemCount);
    expect(new Set(questions.map((question) => question.depth.templateFamily)).size, skill.id).toBeGreaterThanOrEqual(blueprint.minTemplateFamilies);
    expect(new Set(questions.map((question) => question.depth.responseMode)).size, skill.id).toBeGreaterThanOrEqual(blueprint.minResponseModes);
    expect(questions.filter((question) => isTransferEvidence(question.depth.transferLevel)).length, skill.id).toBeGreaterThanOrEqual(blueprint.minTransferItems);
  });
}
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/math-depth.test.ts`

Expected: FAIL，列出所有未達 12/18 題、缺少家族或缺少作答方式的數學技能。

- [ ] **Step 3: 建立三個共用 builder**

```ts
function makeEquationChoice(skill: Skill, seed: {
  id: string;
  prompt: string;
  answer: number;
  contextKey: string;
  transferLevel: TransferLevel;
}): ChoiceQuestion;

function makeStoryChoice(skill: Skill, seed: {
  id: string;
  story: string;
  answer: string;
  distractors: [string, string];
  explanation: string;
  contextKey: string;
}): ChoiceQuestion;

function makeVisualChoice(skill: Skill, seed: {
  id: string;
  prompt: string;
  image: string;
  answer: string;
  distractors: [string, string];
  family: string;
}): ChoiceQuestion;
```

每個 builder 必須：

- 保留固定 question ID；
- 注入 blueprint family、response mode、cognitive demand、transfer、context；
- 用 `uniqueOptions` 保證答案唯一；
- 不把同一答案放進兩個選項；
- 不生成超出該技能 MOE 範圍的數字。

- [ ] **Step 4: 擴充 15 個數學技能**

必須達成的內容方向：

| 技能 | 新增或補足 |
|---|---|
| `math-count-100` | 序列、位值、比較、100 內分組；A 類 18 題 |
| `math-place-value-1000` | 位值、展開式、比較；12 題 |
| `math-add-sub-100` | 數棒、橫式、故事變化；18 題 |
| `math-add-sub-regroup` | 進退位步驟、位值交換、故事；12 題 |
| `math-add-sub-1000` | 直式、分解、故事；12 題 |
| `math-multiply-tables` | 等組、陣列、fact family；18 題 |
| `math-divide-tables` | 等分、陣列逆運算、fact family；12 題 |
| `math-fractions` | 單位分數圖、集合分數、讀法；12 題 |
| `math-money` | 金額辨識、比較付款、找續；12 題 |
| `math-time` | 時鐘、時距、日常事件排序；12 題，至少 tap-order |
| `math-shapes` | 圖形辨識、屬性分類、拼合分解；12 題 |
| `math-picture-graph` | 讀圖、比較、依圖回答；12 題，至少 tap-order 或 listen-find |
| `math-length-measure` | 尺上量度、比較、長度變化；12 題，至少 tap-order |
| `math-fractions-add-sub` | 分數條、算式、故事；12 題 |
| `math-measurement-units` | 單位選擇、換算、比較；12 題 |

- [ ] **Step 5: 寫獨立答案重算測試**

```ts
it("recomputes every generated arithmetic answer", () => {
  for (const question of arithmeticQuestions) {
    const expression = parseArithmeticExpression(question.prompt);
    expect(evaluate(expression)).toBe(Number(question.correctAnswer));
  }
});

it("accepts only fractions within the P1/P2 denominator range", () => {
  for (const question of fractionQuestions) {
    const fraction = parseFraction(question.correctAnswer);
    expect(fraction.denominator).toBeLessThanOrEqual(12);
  }
});

it("keeps time and money answers within their declared unit", () => {
  for (const question of timeMoneyQuestions) expect(question.answerSpec).not.toEqual({ kind: "voice-practice" });
});
```

- [ ] **Step 6: 跑數學及完整性測試**

Run: `cd apps/family && npx vitest run src/content/math-depth.test.ts src/content/math-expanded-content.test.ts src/content/content.test.ts`

Expected: 全部 passed；`verify:depth` 的數學問題清零。

- [ ] **Step 7: Commit**

```bash
git add apps/family/src/content/math.ts apps/family/src/content/matching.ts apps/family/src/content/math-depth.test.ts apps/family/src/content/math-expanded-content.test.ts
git commit -m "feat: expand math content to depth targets"
```

### Task 14：加深華文內容至藍圖門檻

**Files:**
- Modify: `apps/family/src/content/language.ts`
- Modify: `apps/family/src/content/matching.ts`
- Create: `apps/family/src/content/mandarin-depth.test.ts`

- [ ] **Step 1: 寫逐技能及拼音獨立核對失敗測試**

```ts
for (const skill of SKILLS.filter((item) => item.subject === "mandarin")) {
  it(`${skill.id} meets its Mandarin depth blueprint`, () => {
    const questions = QUESTIONS.filter((question) => question.skillId === skill.id);
    const blueprint = getDepthBlueprint(skill.id);
    expect(questions.length).toBe(blueprint.targetItemCount);
    expect(new Set(questions.map((question) => question.depth.templateFamily)).size).toBeGreaterThanOrEqual(blueprint.minTemplateFamilies);
    expect(new Set(questions.map((question) => question.depth.responseMode)).size).toBeGreaterThanOrEqual(blueprint.minResponseModes);
  });
}

it("checks every pinyin answer independently", () => {
  for (const fixture of PINYIN_ANSWER_FIXTURES) {
    expect(pinyin(fixture.hanzi, { toneType: "symbol" })).toBe(fixture.expectedPinyin);
  }
});

it("uses only characters listed in the verified P1/P2/P3 character list", () => {
  for (const question of QUESTIONS.filter((item) => item.subject === "mandarin")) {
    expect(isOfficialCharacterText(question.prompt, question.displayCharacter ?? "")).toBe(true);
  }
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/mandarin-depth.test.ts`

Expected: FAIL，9 個華文技能未達 12/18 題及模板要求。

- [ ] **Step 3: 建立華文 builder**

```ts
function makeMandarinAudioChoice(skill: Skill, seed: {
  id: string;
  hanzi: string;
  spokenText: string;
  answer: string;
  options: [string, string];
  family: "hear-initial" | "hear-final" | "hear-tone" | "syllable-picture";
  explanation: string;
}): ChoiceQuestion;

function makeMandarinContextChoice(skill: Skill, seed: {
  id: string;
  prompt: string;
  passage: string;
  answer: string;
  options: [string, string];
  family: "literal-detail" | "sequence" | "inference-word" | "context-word";
  explanation: string;
}): ChoiceQuestion;
```

- [ ] **Step 4: 擴充 9 個華文技能**

| 技能 | 必須補足 |
|---|---|
| `mandarin-initials` | 聽聲母、拼音家族、圖片首音；A 類 18 題 |
| `mandarin-finals` | 聽韻母、韻母家族、圖片韻母；12 題 |
| `mandarin-tones` | 聽四聲、聲調標記、同／不同調；A 類 18 題 |
| `mandarin-syllables` | 完整拼音、圖片音節、聲母韻母組合；12 題 |
| `mandarin-characters` | 字義、詞語、偏旁外形；A 類 18 題 |
| `mandarin-vocabulary` | 圖詞、語境用詞、分類；12 題 |
| `mandarin-reading` | 明示細節、事件排序、詞義推斷；12 題 |
| `mandarin-classifiers` | 名詞量詞、圖片分類、短語完成；12 題 |
| `mandarin-word-order` | 點按句序、缺詞、對話排序；12 題 |

- [ ] **Step 5: 保持無書寫**

- 不使用寫字、描紅、筆順評分或文字輸入。
- `displayCharacter` 只作字形辨認，不作書寫要求。
- `voice-practice` 卡片可保留在 SpeakingScreen，但不得由 selector 當作 secure 題目。
- 所有閱讀篇章只用 P1/P2 已教字及短句；超範圍字不得以圖片猜測掩蓋。

- [ ] **Step 6: 跑華文、拼音及來源測試**

Run: `cd apps/family && npx vitest run src/content/mandarin-depth.test.ts src/content/language-accuracy.test.ts src/content/language-games.test.ts`

Expected: 全部 passed。

- [ ] **Step 7: Commit**

```bash
git add apps/family/src/content/language.ts apps/family/src/content/matching.ts apps/family/src/content/mandarin-depth.test.ts apps/family/src/content/language-accuracy.test.ts apps/family/src/content/language-games.test.ts
git commit -m "feat: expand Mandarin content to depth targets"
```

### Task 15：加深英語內容至藍圖門檻

**Files:**
- Modify: `apps/family/src/content/language.ts`
- Modify: `apps/family/src/content/matching.ts`
- Create: `apps/family/src/content/english-depth.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
for (const skill of SKILLS.filter((item) => item.subject === "english")) {
  it(`${skill.id} meets its English depth blueprint`, () => {
    const blueprint = getDepthBlueprint(skill.id);
    const questions = QUESTIONS.filter((question) => question.skillId === skill.id);
    expect(questions.length).toBe(blueprint.targetItemCount);
    expect(new Set(questions.map((question) => question.depth.templateFamily)).size).toBeGreaterThanOrEqual(blueprint.minTemplateFamilies);
    expect(new Set(questions.map((question) => question.depth.responseMode)).size).toBeGreaterThanOrEqual(blueprint.minResponseModes);
  });
}

it("has only one correct spelling option per spelling item", () => {
  for (const question of spellingQuestions) {
    expect(question.options.filter((option) => option === question.correctAnswer)).toHaveLength(1);
    expect(new Set(question.options).size).toBe(3);
  }
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/english-depth.test.ts`

Expected: FAIL，10 個英語技能未達 12/18 題及模板要求。

- [ ] **Step 3: 擴充 10 個英語技能**

| 技能 | 必須補足 |
|---|---|
| `english-letters` | 字母名、首音、大小寫配對；12 題 |
| `english-listening` | 詞找圖、指令動作、句子找圖；A 類 18 題 |
| `english-phonics` | 首音、押韻、word family；A 類 18 題 |
| `english-sight-words` | 詞找圖、克漏字、句中辨詞；A 類 18 題 |
| `english-vocabulary` | 圖詞、分類、語境；12 題 |
| `english-a-an` | 音素選 article、對比、短語完成；12 題 |
| `english-plural` | 複數形式、圖對比、句中選擇；12 題 |
| `english-sentence-order` | 點按詞序、句尾、找錯；12 題 |
| `english-reading` | 明示、排序、推論；12 題 |
| `english-spelling` | 正確拼字、找錯字母、圖詞；12 題 |

- [ ] **Step 4: 英語答案規則**

- 全部保持單選，不要求打字或拼寫輸入。
- `a/an` 只用音素明確的 curated noun list；有爭議字（如 `hour`）不放入 P1 核心。
- 閱讀篇章最多 1–3 句，答案只依篇章可直接證明。
- 不接受「最接近」答案；每個干擾項須有明確錯誤理由。
- 音檔文字與題目答案要一對一；同一音檔不得對應兩個不同問題答案。

- [ ] **Step 5: 跑英語及準確度測試**

Run: `cd apps/family && npx vitest run src/content/english-depth.test.ts src/content/language-accuracy.test.ts src/content/language-games.test.ts`

Expected: 全部 passed。

- [ ] **Step 6: Commit**

```bash
git add apps/family/src/content/language.ts apps/family/src/content/matching.ts apps/family/src/content/english-depth.test.ts apps/family/src/content/language-accuracy.test.ts apps/family/src/content/language-games.test.ts
git commit -m "feat: expand English content to depth targets"
```

### Task 16：建立老師式補救步驟

**Files:**
- Create: `apps/family/src/content/remediation.ts`
- Create: `apps/family/src/content/remediation.test.ts`
- Modify: `apps/family/src/App.tsx`
- Modify: `apps/family/src/content/copy.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
it("provides a concrete first cue for every skill", () => {
  for (const skill of SKILLS) {
    const plan = getRemediationPlan(skill.id);
    expect(plan.steps.length).toBeGreaterThanOrEqual(2);
    expect(plan.steps[0].kind).toBe("notice");
    expect(plan.steps.every((step) => step.audioText.trim().length > 0)).toBe(true);
  });
});

it("does not use generic praise as corrective feedback", () => {
  for (const plan of REMEDIATION_PLANS) {
    const allText = plan.steps.map((step) => step.audioText).join(" ");
    expect(allText).not.toMatch(/你真棒|好厉害|加油|再試一次吧/);
  }
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/remediation.test.ts`

Expected: FAIL，remediation 不存在。

- [ ] **Step 3: 為 34 技能建立兩步以上補救**

```ts
export const REMEDIATION_PLANS: SkillRemediationPlan[] = [
  {
    skillId: "math-count-100",
    steps: [
      { kind: "notice", audioText: "先找十位，再看剩下的個位。", visualCue: "tens-ones" },
      { kind: "example", audioText: "37 是三個十和七個一。", visualCue: "base-ten-37" },
      { kind: "retry", audioText: "換一個數字再試一次。" }
    ]
  },
  ...REMEDIATION_ROWS.map(toRemediationPlan)
];
```

`REMEDIATION_ROWS` 必須為第 5.3 表每個技能提供具體 `notice`、`example`、`retry` 文字；測試會逐一檢查 `SKILLS` 全集，缺一項即失敗。不得回退到通用「再試一次」文案。

- [ ] **Step 4: 接入 QuizScreen**

- `answerFeedback` 仍先顯示簡短具體結果。
- 點「再試一次」後，按 `RemediationPlan` 自動播放 `notice` 或 `example`。
- 第二次仍錯時，顯示 worked example 及下一步較易題。
- 不新增 hint 按鈕；補救由老師式流程自動觸發。

- [ ] **Step 5: 跑 component 及 copy 測試**

Run: `cd apps/family && npx vitest run src/content/remediation.test.ts src/content/copy.test.ts src/app.test.tsx`

Expected: 全部 passed。

- [ ] **Step 6: Commit**

```bash
git add apps/family/src/content/remediation.ts apps/family/src/content/remediation.test.ts apps/family/src/App.tsx apps/family/src/content/copy.ts
git commit -m "feat: add concrete teacher-style remediation"
```

### Task 16A：成長星、角色收藏及陪伴流程

**Files:**
- Create: `apps/family/src/rewards/rewardState.ts`
- Create: `apps/family/src/rewards/rewardState.test.ts`
- Create: `apps/family/src/rewards/companions.ts`
- Create: `apps/family/src/rewards/companions.test.ts`
- Create: `apps/family/src/screens/RewardScreen.tsx`
- Create: `apps/family/src/screens/CompanionShelf.tsx`
- Create: `apps/family/src/screens/CompanionExchangeShop.tsx`
- Create: `apps/family/src/screens/CompanionExchangeShop.test.tsx`
- Modify: `apps/family/src/lib/types.ts`
- Modify: `apps/family/src/lib/storage.ts`
- Modify: `apps/family/src/App.tsx`
- Modify: `apps/family/src/content/copy.ts`
- Modify: `apps/family/vite.config.ts`
- Modify: `apps/family/scripts/postbuild.mjs`

- [ ] **Step 1: 寫獎勵 ledger 失敗測試**

```ts
it("awards a completed session once and never subtracts stars", () => {
  const state = createRewardState();
  const once = applyRewardEvent(state, { eventKey: "session:s1", kind: "session-complete", amount: 2 });
  const twice = applyRewardEvent(once, { eventKey: "session:s1", kind: "session-complete", amount: 2 });
  expect(once.lifetimeStars).toBe(2);
  expect(twice.lifetimeStars).toBe(2);
  expect(twice.awardedEventKeys).toContain("session:s1");
});

it("does not award raw speed or a wrong answer", () => {
  const state = createRewardState();
  const result = applyRewardEvent(state, { eventKey: "wrong:q1", kind: "wrong-answer", amount: 1 });
  expect(result.lifetimeStars).toBe(0);
});

it("caps daily stars without showing a punishment countdown", () => {
  let state = createRewardState();
  for (const eventKey of ["session:a", "session:b", "session:c", "session:d"]) {
    state = applyRewardEvent(state, { eventKey, kind: "session-complete", amount: 2 });
  }
  expect(state.lifetimeStars).toBe(6);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/rewards/rewardState.test.ts`

Expected: FAIL，reward state 不存在。

- [ ] **Step 3: 實作 reward state**

```ts
export type RewardEventKind =
  | "session-complete"
  | "delayed-review"
  | "independent-transfer"
  | "retry-effort"
  | "wrong-answer";

export interface RewardEventInput {
  eventKey: string;
  kind: RewardEventKind;
  amount: number;
  at?: Date;
}

export interface GrowthRewardState {
  lifetimeStars: number;
  awardedEventKeys: string[];
  redeemedCompanionIds: string[];
  redeemedAtByCompanionId: Record<string, string>;
  activeCompanionId: string | null;
  dailyAwardKey: string | null;
  dailyStars: number;
}
```

`applyRewardEvent` 規則：

- `wrong-answer` 金額必為 0；即使呼叫方傳 1，也回傳原 state。
- 同一 `eventKey` 已在 `awardedEventKeys` 時不重複加星。
- 每日總額最多 6；以新加坡固定時區 `Asia/Singapore` 的日期 `YYYY-MM-DD` 作 `dailyAwardKey`，避免旅行或裝置時區改動造成重複發星。
- `amount` 只可為 1 或 2；其他值 throw。
- 函式永不減 `lifetimeStars`，不得出現 `spendStars` 或 `balance` API。

- [ ] **Step 4: 寫孩子手動兌換及陪伴失敗測試**

```ts
it("makes the first companion redeemable at ten stars", () => {
  expect(getRedeemableCompanions(rewardWithStars(9)).map((item) => item.id)).toEqual([]);
  expect(getRedeemableCompanions(rewardWithStars(10)).map((item) => item.id)).toEqual(["sprout"]);
});

it("lets the child redeem without spending stars", () => {
  const before = rewardWithStars(10);
  const after = redeemCompanion(before, "sprout", new Date("2026-11-21T10:00:00.000Z"));
  expect(after.redeemedCompanionIds).toEqual(["sprout"]);
  expect(after.redeemedAtByCompanionId.sprout).toBe("2026-11-21T10:00:00.000Z");
  expect(after.lifetimeStars).toBe(10);
});

it("does not redeem twice on a double tap", () => {
  const before = rewardWithStars(10);
  const once = redeemCompanion(before, "sprout", new Date("2026-11-21T10:00:00.000Z"));
  const twice = redeemCompanion(once, "sprout", new Date("2026-11-21T10:00:01.000Z"));
  expect(twice.redeemedCompanionIds).toEqual(["sprout"]);
  expect(twice.redeemedAtByCompanionId.sprout).toBe("2026-11-21T10:00:00.000Z");
});

it("keeps exactly one active companion", () => {
  const state = redeemTwoCompanions();
  expect(setActiveCompanion(state, "momo").activeCompanionId).toBe("momo");
  expect(setActiveCompanion(state, "sprout").activeCompanionId).toBe("sprout");
});

it("never exposes an unredeemed companion as selectable", () => {
  const state = createRewardState();
  expect(() => setActiveCompanion(state, "momo")).toThrow("Companion is not redeemed");
});
```

- [ ] **Step 5: 實作 companion manifest 及收藏**

```ts
export const COMPANIONS: CompanionManifest[] = [
  {
    id: "sprout",
    name: "小芽",
    unlockAtStars: 10,
    assetSetId: "companion-sprout",
    voiceLanguage: "zh-CN",
    subjectAffinity: ["math", "mandarin", "english"],
    safeGreetingAudio: "我們先聽一次，再一起做。",
    safeEncouragementAudio: "慢慢想，小芽陪你再看一步。"
  },
  {
    id: "momo",
    name: "默默",
    unlockAtStars: 20,
    assetSetId: "companion-momo",
    voiceLanguage: "zh-CN",
    subjectAffinity: ["math"],
    safeGreetingAudio: "先找圖，再一起數一數。",
    safeEncouragementAudio: "這一步錯了也沒關係，我們換個方法。"
  }
];
```

第一版只可放已完成資產的兩個角色；其他角色由 `companion-pack` 加入，不得先顯示空殼或「即將推出」卡片。未來角色增加時，`getRedeemableCompanions`、收藏冊分頁及 active companion 選擇都不需要改學習引擎。

兌換 API 規則：

- `getRedeemableCompanions(state)` 只返回 `lifetimeStars >= unlockAtStars` 且尚未在 `redeemedCompanionIds` 的角色。
- `redeemCompanion(state, id, at)` 不檢查或扣減星星；它只把角色加入收藏並記錄首次兌換時間。
- 已在收藏中的角色再次兌換時回傳原 state，不覆寫 `redeemedAtByCompanionId`。
- 星星不足以到達門檻時 throw `Companion threshold not reached`。
- `setActiveCompanion` 只接受已在 `redeemedCompanionIds` 的角色；孩子可隨時切換已兌換角色。

- [ ] **Step 6: 接入 session 完成及 UI**

- Session 完成後計算符合條件的 reward events；同一 session 只發一次。
- 獎勵畫面只顯示：獲得星星、可兌換角色提示；孩子按下「兌換」後才進入角色揭示動畫。
- `RewardScreen` 只有一個主要動作「回學習區」，不與其他主按鈕同屏競爭。
- `CompanionExchangeShop` 只可從首頁陪伴區開啟；不得新增第二個主導航按鈕。
- `CompanionExchangeShop` 用 tab 分開 `可以兌換` 及 `我的夥伴`；每張卡只可有一個主要按鈕。
- 陪伴角色顯示在題目頁邊角，最大佔用不超過短邊 18%；不得遮擋題目、音訊按鈕或答案選項。
- 每輪最多顯示一次角色慶祝動畫。
- `prefers-reduced-motion` 下不播放位移／縮放動畫；高對比下角色只用靜態輪廓及文字。

兌換館 UI 測試：

```tsx
it("shows redeemable state without commerce wording", () => {
  render(<CompanionExchangeShop state={rewardWithStars(10)} onRedeem={() => {}} onSetActive={() => {}} />);
  expect(screen.getByText("可以兌換")).toBeInTheDocument();
  expect(screen.queryByText("購買")).toBeNull();
  expect(screen.queryByText("付款")).toBeNull();
});

it("confirms redemption and keeps the star total", async () => {
  let state = rewardWithStars(10);
  render(<CompanionExchangeShop
    state={state}
    onRedeem={() => { state = redeemCompanion(state, "sprout", new Date("2026-11-21T10:00:00.000Z")); }}
    onSetActive={() => {}}
  />);
  await userEvent.click(screen.getByRole("button", { name: "兌換" }));
  expect(screen.getByText("成長星不會扣除")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "確認兌換" }));
  expect(state.redeemedCompanionIds).toContain("sprout");
  expect(state.lifetimeStars).toBe(10);
});
```

- [ ] **Step 7: 接入 storage migration**

`SkillEvidence` 及 reward data 一同放入 schema 3 加密家資料。舊孩子 migration 初始化：

```ts
rewards: createRewardState()
```

不得因 migration 自動送星、兌換角色或設 active companion；舊 attempts 只影響學習證據，不回溯計算獎勵。若日後提供「回溯獎勵」，必須另寫明確 migration，不可默認開啟。

- [ ] **Step 8: 家長控制**

Parent dashboard 加兩個開關：

```ts
rewardsEnabled: boolean;
companionAnimationsEnabled: boolean;
```

- 關閉 rewards 後隱藏星星及角色，但不刪除已兌換資料；重新開啟可回復。
- 關閉 animations 後保留角色靜態陪伴。
- 家長可看到 lifetimeStars 及已兌換角色，但不得看到其他孩子排名或總分比較。

- [ ] **Step 9: 資產及離線**

- 角色圖、表情、動畫、音檔全部放在 `apps/family/public/assets/companions/<assetSetId>/`，並進入 PWA precache。
- 每個資產有 stable asset ID、SHA-256、寬高限制及 total bytes。
- 單一角色資產軟上限 500 KB；第一版兩個角色合計 ≤ 1 MB。若超出，先壓縮或移除未使用表情，不提高整包 20 MB 軟上限。
- 不使用 runtime CDN、遠端 Lottie 或外部字型。

- [ ] **Step 10: 跑完整測試**

Run: `cd apps/family && npx vitest run src/rewards/rewardState.test.ts src/rewards/companions.test.ts src/app.test.tsx src/lib/storage.test.ts`

Expected: 全部 passed；同一 session 不會重複得星，角色不會重複或同時啟用。

- [ ] **Step 11: Commit**

```bash
git add apps/family/src/rewards/rewardState.ts apps/family/src/rewards/rewardState.test.ts apps/family/src/rewards/companions.ts apps/family/src/rewards/companions.test.ts apps/family/src/screens/RewardScreen.tsx apps/family/src/screens/CompanionShelf.tsx apps/family/src/screens/CompanionExchangeShop.tsx apps/family/src/screens/CompanionExchangeShop.test.tsx apps/family/src/lib/types.ts apps/family/src/lib/storage.ts apps/family/src/App.tsx apps/family/src/content/copy.ts apps/family/vite.config.ts apps/family/scripts/postbuild.mjs
git commit -m "feat: add non-consumptive growth stars and companion rewards"
```

### Task 16B：每日練習、長期進度及每週節奏

**Files:**
- Create: `apps/family/src/engine/dailyPlan.ts`
- Create: `apps/family/src/engine/dailyPlan.test.ts`
- Create: `apps/family/src/engine/progressView.ts`
- Create: `apps/family/src/engine/progressView.test.ts`
- Create: `apps/family/src/screens/DailyMissionCard.tsx`
- Modify: `apps/family/src/App.tsx`
- Modify: `apps/family/src/content/copy.ts`
- Modify: `apps/family/src/styles.css`
- Modify: `apps/family/src/lib/types.ts`
- Modify: `apps/family/src/lib/storage.ts`

- [x] **Step 1: 寫新加坡日期邊界失敗測試**

```ts
it("uses the Singapore date rather than the device timezone", () => {
  expect(singaporeDateKey(new Date("2026-11-20T15:59:00.000Z"))).toBe("2026-11-20");
  expect(singaporeDateKey(new Date("2026-11-20T16:00:00.000Z"))).toBe("2026-11-21");
});
```

- [x] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/engine/dailyPlan.test.ts -t "Singapore date"`

Expected: FAIL，`singaporeDateKey` 不存在。

- [x] **Step 3: 實作日期及每日計劃**

```ts
export function singaporeDateKey(at: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(at);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
```

```ts
export function buildDailyPlan(input: {
  child: ChildProfile;
  subject: Subject;
  dateKey: string;
  questionCount: 6 | 8 | 10;
}): DailyPlan;
```

生成規則按第 9.5 節；`items` 總數等於 `questionCount`，不得因候選技能不足而靜默減少。若該科目未有足夠可用技能，回傳 `{ status: "needs-scope", reason: "no-ready-skill" }`，不建立空任務。

- [x] **Step 4: 寫每日進度及重複完成測試**

```ts
it("marks a daily plan complete once", () => {
  const child = createChildProfile("小星", "star");
  const plan = buildDailyPlan({ child, subject: "math", dateKey: "2026-11-21", questionCount: 8 });
  expect(completeDailyPlan(child, plan, "session-1").plan.completedAt).not.toBeNull();
  expect(completeDailyPlan(child, plan, "session-1").awarded).toBe(false);
});

it("does not reset mastery or stars after a missed day", () => {
  const child = childWithStarsAndEvidence();
  const before = child.rewards.lifetimeStars;
  expect(buildDailyPlan({ child, subject: "math", dateKey: "2026-11-23", questionCount: 8 }).dateKey).toBe("2026-11-23");
  expect(child.rewards.lifetimeStars).toBe(before);
  expect(child.evidence).toEqual(childWithStarsAndEvidence().evidence);
});
```

- [x] **Step 5: 實作長期進度視圖**

```ts
export interface SubjectProgressView {
  subject: Subject;
  currentSkillId: string;
  currentSkillTitle: string;
  stableCount: number;
  retainedCount: number;
  dueReviewCount: number;
  weeklySessions: number;
  weeklyIndependentCorrect: number;
}

export function buildSubjectProgressView(child: ChildProfile, subject: Subject, now = new Date()): SubjectProgressView;
```

- 不使用 `completed / total * 100`。
- `currentSkillId` 由 `recommendedNextSkills` 決定。
- `stableCount` 及 `retainedCount` 分別由 mastery 和 delayed evidence 計算。
- `weeklySessions` 以最近 7 天 completed sessions 計算。

- [x] **Step 6: 接入孩子首頁**

- 每科卡顯示一句每日任務摘要：先複習、再學習或先鞏固。
- 每科卡顯示目前技能名稱，不顯示 34 項長清單。
- 首頁仍只有一個主要「跟小芽開始」動作；其他是科目卡本身。
- 陪伴角色站在目前技能站點旁，但不得遮擋科名、進度文字及主要按鈕。
- 完成一輪後，該科卡顯示 `今天完成了`，但仍可再練；不鎖死整個科目。
- 中斷後重新進入同一科，恢復未完成 daily plan，不重新計算每日完成星。

- [x] **Step 7: 家長每週摘要**

- 顯示本週完成次數、獨立答對數、需要複習的技能。
- 顯示「本週已練 4 次」，不顯示連續天數。
- 可看到三科各自的下一小步；不把三科總分排名。
- 若孩子一週未使用，顯示 `下一個小步驟`，不顯示責備文案。

- [x] **Step 8: 跑 UI 及 storage 測試**

Run: `cd apps/family && npx vitest run src/engine/dailyPlan.test.ts src/engine/progressView.test.ts src/app.test.tsx src/lib/storage.test.ts`

Expected: 全部 passed；日期邊界、計劃題數、恢復、星星 idempotency 及進度顯示全部有測試。

- [ ] **Step 9: Commit**

```bash
git add apps/family/src/engine/dailyPlan.ts apps/family/src/engine/dailyPlan.test.ts apps/family/src/engine/progressView.ts apps/family/src/engine/progressView.test.ts apps/family/src/screens/DailyMissionCard.tsx apps/family/src/App.tsx apps/family/src/content/copy.ts apps/family/src/styles.css apps/family/src/lib/types.ts apps/family/src/lib/storage.ts apps/family/src/app.test.tsx
git commit -m "feat: add daily practice and subject progress views"
```

### Task 16C：第一隻動畫陪伴小狗及桌面寵物互動

**Files:**
- Create: `apps/family/src/companions/petState.ts`
- Create: `apps/family/src/companions/petState.test.ts`
- Create: `apps/family/src/companions/PuppyCompanion.tsx`
- Create: `apps/family/src/companions/PuppyCompanion.test.tsx`
- Create: `apps/family/src/companions/CompanionPreviewScreen.tsx`
- Create: `apps/family/src/companions/CompanionPreviewScreen.test.tsx`
- Create: `apps/family/src/companions/companionAssets.test.ts`
- Create: `apps/family/src/companions/CompanionPetLayer.tsx`
- Create: `apps/family/src/companions/CompanionPetLayer.test.tsx`
- Create: `apps/family/src/companions/petAudio.ts`
- Create: `work/companion-concepts/gemini-doudou-sprite-sheet.jpeg`
- Create: `apps/family/public/assets/companions/gemini-doudou/manifest.json`
- Create: `apps/family/public/assets/companions/gemini-doudou/{idle,walk,celebrate}.png`
- Modify: `apps/family/src/App.tsx`
- Modify: `apps/family/src/main.tsx`
- Modify: `apps/family/src/styles.css`
- Modify: `apps/family/src/content/audioAssets.ts`

- [ ] **Step 1: 寫寵物狀態機失敗測試**

```ts
it("returns tap-react to idle within the configured duration", () => {
  let state = initialPetState();
  state = transitionPetState(state, { type: "TAP" }, 1_000);
  expect(state.visual).toBe("tap-react");
  state = transitionPetState(state, { type: "TICK", now: 1_500 }, 1_500);
  expect(state.visual).toBe("tap-react");
  state = transitionPetState(state, { type: "TICK", now: 2_200 }, 2_200);
  expect(state.visual).toBe("idle");
});

it("stays quiet while lesson audio is playing", () => {
  const state = transitionPetState(initialPetState(), { type: "LESSON_AUDIO_START" }, 1_000);
  expect(state.visual).toBe("listen");
  expect(state.allowAudio).toBe(false);
});

it("does not use attention-seeking or punishing states", () => {
  expect(PET_STATES).not.toContain("angry");
  expect(PET_STATES).not.toContain("sad-punish");
  expect(PET_STATES).not.toContain("beg");
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/companions/petState.test.ts`

Expected: FAIL，pet state module 不存在。

- [ ] **Step 3: 實作狀態機**

```ts
export const PET_STATES = [
  "idle", "greet", "listen", "think", "celebrate", "comfort", "tap-react", "rest"
] as const;

export interface PetState {
  visual: CompanionPetState;
  allowAudio: boolean;
  enteredAt: number;
  endsAt: number | null;
}
```

轉移規則：

- `TAP` 只在非 `listen` 時進入 `tap-react`；`listen` 時保持 sitting 單幀，不出聲、不跳。
- `LESSON_AUDIO_START` 進入 `listen` 並 `allowAudio: false`。
- `LESSON_AUDIO_END` 回 `idle`。
- `ANSWER_WRONG` 進入 `comfort`，但只說陪伴語，不給教學答案。
- `SESSION_COMPLETE` 或 `COMPANION_REDEEMED` 進入 `celebrate`。
- `IDLE_TIMEOUT` 進入 `rest`，只是坐下，不鎖 app、不結束 session。
- 任何有 `endsAt` 的短狀態到期後回 `idle`。

- [ ] **Step 4: 寫小狗 sprite 及互動失敗測試**

```tsx
it("renders the puppy canvas with an accessible name", () => {
  render(<PuppyCompanion state="idle" />);
  expect(screen.getByLabelText("陪伴小狗豆豆")).toBeInTheDocument();
  expect(screen.getByTestId("puppy-sprite")).toBeInTheDocument();
});

it("reacts when tapped but does not move the learning controls", async () => {
  render(<PuppyCompanion state="idle" onInteract={() => {}} />);
  await userEvent.click(screen.getByRole("button", { name: "和小狗豆豆互动" }));
  expect(screen.getByTestId("puppy-motion")).toHaveAttribute("data-state", "tap-react");
});
```

- [ ] **Step 5: 實作 PuppyCompanion**

使用 Gemini 生成、已本地去背的 3 組動畫條：

```ts
const ANIMATIONS = {
  idle: { file: "idle.png", frames: 4, width: 1376, height: 256, frameWidth: 344, frameHeight: 256 },
  walk: { file: "walk.png", frames: 4, width: 1376, height: 256, frameWidth: 344, frameHeight: 256 },
  celebrate: { file: "celebrate.png", frames: 4, width: 1376, height: 256, frameWidth: 344, frameHeight: 256 }
};
```

- `PuppyCompanion` 用 Canvas 2D 播放，不自行畫角色。
- 每格 344×256；三條動畫帶均為 1376×256，canvas 直接按狀態序列播放。
- 尺寸用固定 canvas 比例，不因狀態改變寬高。
- 只在 `tap-react` 顯示一次短 bounce；`celebrate` 可跳一次再回 idle。
- 讀取 `manifest.json` 及每檔 SHA-256；素材不齊或 hash 不符不得載入。

- [ ] **Step 6: 實作 CompanionPetLayer**

```ts
interface CompanionPetLayerProps {
  visualState: CompanionPetState;
  placement: "home" | "session" | "reward";
  onInteract: () => void;
}
```

- 固定安全區；不允許自由拖到答案區。
- 角色 pointer hit area 與視覺尺寸分離；透明背景不得攔截點擊。
- `home` 可在家長／孩子首頁陪伴區；`session` 在題目頁角落；`reward` 在獎勵結果區。
- 小狗不遮擋系統安全區、主要按鈕、題目文字及選項。
- `reward` 模式只在短時間顯示 celebrate，後續回 idle。

- [ ] **Step 7: 加入寵物短音訊**

建立 5 段本地短音訊：

```text
puppy-hello-zh.m4a
puppy-listen-zh.m4a
puppy-think-zh.m4a
puppy-celebrate-zh.m4a
puppy-tap-zh.m4a
```

- 每段 ≤ 1.5 秒。
- 文字只可為陪伴語，不得包含答案。
- 同一片段 30 秒內不重播。
- 教學音訊播放時不播放寵物音訊。
- 音訊失敗時只顯示表情，不阻塞學習；不得因音訊失敗而重播到下一個題目。

- [ ] **Step 8: 寫安全區及真觸控驗收**

- iPhone 390×844、iPad 1024×768、1180×820、Android 1280×800 及所有方向的截圖中，小狗不遮擋題目、答案及「下一題」。
- 小狗 tap hit area 至少 44 CSS px；不得延伸到其他按鈕。
- 小狗 idle 只在安全區內做小範圍移動，最大位移 ≤ 40 CSS px。
- 每次狀態切換不重置頁面滾動位置。
- `prefers-reduced-motion` 下所有 transform 動畫在 0.01ms 完成；小狗仍可見。
- 減少動畫、高對比、VoiceOver／TalkBack 的基本焦點名稱都存在。

- [ ] **Step 9: 跑 component 及 app 測試**

Run: `cd apps/family && npx vitest run src/companions/petState.test.ts src/companions/PuppyCompanion.test.tsx src/companions/companionAssets.test.ts src/companions/CompanionPetLayer.test.tsx src/app.test.tsx`

Expected: 全部 passed。

- [ ] **Step 10: Commit**

```bash
git add apps/family/src/companions/petState.ts apps/family/src/companions/petState.test.ts apps/family/src/companions/PuppyCompanion.tsx apps/family/src/companions/PuppyCompanion.test.tsx apps/family/src/companions/CompanionPreviewScreen.tsx apps/family/src/companions/CompanionPreviewScreen.test.tsx apps/family/src/companions/companionAssets.test.ts apps/family/src/companions/CompanionPetLayer.tsx apps/family/src/companions/CompanionPetLayer.test.tsx apps/family/src/companions/petAudio.ts apps/family/public/assets/companions/gemini-doudou work/companion-concepts/gemini-doudou-sprite-sheet.jpeg apps/family/src/App.tsx apps/family/src/main.tsx apps/family/src/styles.css apps/family/src/content/audioAssets.ts
git commit -m "feat: add animated interactive puppy companion"
```

### Task 17：加入逐科年級及課程包家長控制

**Files:**
- Modify: `apps/family/src/App.tsx`
- Modify: `apps/family/src/content/copy.ts`
- Modify: `apps/family/src/lib/profile.ts`
- Test: `apps/family/src/app.test.tsx`
- Test: `apps/family/src/lib/profile.test.ts`

- [ ] **Step 1: 寫失敗 UI 測試**

```tsx
it("lets a parent switch math to P3 without changing English", async () => {
  const child = createChildProfile("小星", "star");
  render(<ParentGradeControls child={child} onSave={() => {}} />);
  await userEvent.selectOptions(screen.getByLabelText("数学年级"), "P3");
  expect(screen.getByLabelText("英语年级")).toHaveValue("P2");
});

it("does not show a P3 option when no verified P3 pack is registered", () => {
  render(<ParentGradeControls child={createChildProfile("小星", "star")} onSave={() => {}} />);
  expect(screen.queryByRole("option", { name: "P3" })).toBeNull();
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/app.test.tsx -t "math to P3"`

Expected: FAIL，沒有年級控件。

- [ ] **Step 3: 實作家長控件**

每位孩子顯示三列：

```tsx
<label>
  <span>数学年级</span>
  <select value={scopes.math.grade} onChange={(event) => changeScope("math", event.target.value as SchoolGrade)}>
    {availableGradesFor("math").map((grade) => <option key={grade} value={grade}>{grade}</option>)}
  </select>
</label>
```

`availableGradesFor` 只返回已註冊、已通過 schema/hash/depth gate 的 grade；未完成 P3 時不顯示 P3，不以 disabled 假裝可選。

- [ ] **Step 4: 保存及遷移規則**

- 切換只更新該科 `LearningScope`，不動其他科。
- 切換時 `child.activeSessions[subject]` 若存在，顯示「先完成或結束目前練習」，不得中途換 pack version。
- 若新 scope 缺少先修 pack，拒絕切換並顯示原因。
- 設定成功後立即寫入加密家資料；失敗保留舊 scope。

- [ ] **Step 5: 跑 UI、profile 及 storage 測試**

Run: `cd apps/family && npx vitest run src/app.test.tsx src/lib/profile.test.ts src/lib/storage.test.ts`

Expected: 全部 passed。

- [ ] **Step 6: Commit**

```bash
git add apps/family/src/App.tsx apps/family/src/content/copy.ts apps/family/src/lib/profile.ts apps/family/src/app.test.tsx apps/family/src/lib/profile.test.ts
git commit -m "feat: add per-subject curriculum scope controls"
```

### Task 18：加入家長深度看板及下一步計劃

**Files:**
- Create: `apps/family/src/engine/depthInsights.ts`
- Create: `apps/family/src/engine/depthInsights.test.ts`
- Modify: `apps/family/src/engine/insights.ts`
- Modify: `apps/family/src/App.tsx`
- Modify: `apps/family/src/content/copy.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
it("separates recognition, transfer and retention evidence", () => {
  const insight = buildDepthInsight(childWithMixedEvidence, "math-count-100");
  expect(insight.recognitionCount).toBeGreaterThan(0);
  expect(insight.transferCount).toBe(0);
  expect(insight.retentionCount).toBe(0);
  expect(insight.parentSummary).toContain("同一類題");
});

it("recommends a 10-minute plan with review, current skill and transfer", () => {
  const plan = buildTenMinutePlan(child, "math", new Date("2026-11-21T10:00:00.000Z"));
  expect(plan.items).toHaveLength(3);
  expect(plan.items.map((item) => item.kind)).toEqual(["review", "current", "transfer"]);
  expect(plan.totalQuestions).toBeLessThanOrEqual(10);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/engine/depthInsights.test.ts`

Expected: FAIL，`depthInsights` 不存在。

- [ ] **Step 3: 實作深度摘要**

```ts
export interface DepthInsight {
  skillId: string;
  recognitionCount: number;
  transferCount: number;
  retentionCount: number;
  templateFamilyCount: number;
  responseModeCount: number;
  missingEvidence: Array<"template" | "mode" | "transfer" | "retention">;
  parentSummary: string;
}
```

`parentSummary` 只講事實：

- 同一模板 1–2 個：`這項仍以同一類題為主。`
- 有 family 3 但無 transfer：`換方式答對次數不足，未證明能應用。`
- 有 transfer 但無 delayed：`還未隔天再答對。`
- 全部齊：`已有跨題型及隔天保持證據。`

- [ ] **Step 4: 實作 10 分鐘計劃**

```ts
export interface TenMinuteItem {
  kind: "review" | "current" | "transfer";
  skillId: string;
  questionCount: number;
  reason: string;
}
```

規則：

- 有到期複習：2 題 review + 4 題 current + 2 題 transfer。
- 無到期複習：1 題 warm review + 5 題 current + 2 題 transfer。
- 若 current 未有 transfer-ready，transfer 改為同模板獨立題，文案寫「先鞏固」。
- 最多 10 題；孩子仍可只做一輪。

- [ ] **Step 5: 接入 ParentDashboard**

- 每科顯示 2 個最值得練的技能。
- 每個技能顯示三層證據及缺少項。
- 顯示 `contentVersion`、最近 completed session、due review 數。
- 不顯示 `pKnown` 原始概率；只在家長展開詳情時顯示「仍有不確定性」。

- [ ] **Step 6: 跑 dashboard 測試**

Run: `cd apps/family && npx vitest run src/engine/depthInsights.test.ts src/engine/insights.test.ts src/app.test.tsx`

Expected: 全部 passed。

- [ ] **Step 7: Commit**

```bash
git add apps/family/src/engine/depthInsights.ts apps/family/src/engine/depthInsights.test.ts apps/family/src/engine/insights.ts apps/family/src/App.tsx apps/family/src/content/copy.ts apps/family/src/app.test.tsx
git commit -m "feat: add parent depth insight and next plan"
```

### Task 19：用測試專用 P3 課程包驗證升級流程

**Files:**
- Create: `apps/family/src/test/fixtures/p3PackFixture.ts`
- Create: `apps/family/src/content/packs/p3Migration.test.ts`
- Modify: `apps/family/src/content/packs/registry.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
it("keeps P2 evidence and exposes P3 content under a P3 math scope", () => {
  const child = childWithReadyP2Multiplication();
  const p3 = registerTestOnlyPack(P3_FIXTURE_PACK);
  child.learningScopes.math = scopeForP3();
  expect(child.evidence["math-multiply-tables"].independentCorrect).toBe(6);
  expect(getSelectableSkillsForScope(child.learningScopes.math)).toContainEqual(expect.objectContaining({ id: "math-p3-multiply-6to9" }));
  unregisterTestOnlyPack(p3);
});

it("never exposes the test-only pack in production registry", () => {
  expect(PACKS.map((pack) => pack.id)).not.toContain("sg-primary-p3-fixture");
});

it("blocks switching when a prerequisite pack is missing", () => {
  const scope = { subject: "math", grade: "P3", packIds: ["sg-primary-p3-fixture"] } as const;
  expect(getPackCompatibility(scope).ok).toBe(false);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/content/packs/p3Migration.test.ts`

Expected: FAIL，沒有 fixture registration API。

- [ ] **Step 3: 建立 test-only fixture**

```ts
export const P3_FIXTURE_PACK: CurriculumPackManifest = {
  id: "sg-primary-p3-fixture",
  version: "test-1",
  contentSchemaVersion: 5,
  appSchemaMin: 3,
  subjects: ["math"],
  gradeBands: ["P3"],
  sourceIds: ["moe-math-2021-oct-2025"],
  publishedAt: "2026-11-21",
  contentSha256: "test-only",
  releaseStatus: "pilot"
};
```

`getPackCompatibility` 必須同時檢查目標科目年級包及先修包：

```ts
export function getPackCompatibility(scope: LearningScope): { ok: true } | { ok: false; reason: string } {
  const packs = PACKS.filter((pack) => scope.packIds.includes(pack.id));
  const target = packs.some((pack) => pack.subjects.includes(scope.subject) && pack.gradeBands.includes(scope.grade));
  if (!target) return { ok: false, reason: "missing-target-pack" };
  if (scope.grade === "P1") return { ok: true };
  const prerequisite = packs.some(
    (pack) => pack.subjects.includes(scope.subject)
      && pack.gradeBands.some((grade) => gradeRank(grade) < gradeRank(scope.grade))
  );
  return prerequisite ? { ok: true } : { ok: false, reason: "missing-prerequisite-pack" };
}
```

Fixture 至少包括：

- 一個 P3 新技能 `math-p3-multiply-6to9`；
- 其先修指向 `math-multiply-tables`；
- 12 道可驗證題目；
- 3 個 template family；
- 2 個 response modes；
- 1 題 near-transfer。

- [ ] **Step 4: 實作 test-only pack registry API**

```ts
export function registerTestOnlyPack(pack: CurriculumPackManifest): () => void {
  if (!import.meta.env?.VITEST) throw new Error("Test-only packs cannot be registered in production");
  PACKS.push(pack);
  return () => {
    const index = PACKS.findIndex((item) => item.id === pack.id);
    if (index >= 0) PACKS.splice(index, 1);
  };
}
```

若 Vitest 無 `import.meta.env`，改用 `process.env.VITEST === "true"`；production build 中函式仍要 throw。

- [ ] **Step 5: 跑 migration 及 compatibility 測試**

Run: `cd apps/family && npx vitest run src/content/packs/p3Migration.test.ts src/content/packs/registry.test.ts`

Expected: 全部 passed；production registry 不含 fixture。

- [ ] **Step 6: Commit**

```bash
git add apps/family/src/test/fixtures/p3PackFixture.ts apps/family/src/content/packs/p3Migration.test.ts apps/family/src/content/packs/registry.ts
git commit -m "test: prove P3 pack migration without production content"
```

### Task 20：課程包版本快照、離線及回滾

**Files:**
- Modify: `apps/family/src/engine/session.ts`
- Modify: `apps/family/src/App.tsx`
- Modify: `apps/family/vite.config.ts`
- Test: `apps/family/src/engine/session.test.ts`
- Test: `apps/family/src/lib/storage.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
it("does not change pack versions in the middle of a session", () => {
  const session = createAdaptiveSession(child, "math", now);
  expect(session.packVersions["sg-primary-p1-p2"]).toBe(CONTENT_PACK.version);
  child.learningScopes.math.packIds.push("sg-primary-p3-fixture");
  expect(selectNextQuestion(child, session)?.audit.contentVersion).toBe(CONTENT_PACK.version);
});

it("keeps old attempt metadata readable after pack rollback", () => {
  const oldAttempt = attemptWithPack("sg-primary-p3-fixture", "test-1");
  const child = childWithAttempt(oldAttempt);
  child.learningScopes.math.packIds = ["sg-primary-p1-p2"];
  expect(child.attempts.find((attempt) => attempt.id === oldAttempt.id)).toEqual(oldAttempt);
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `cd apps/family && npx vitest run src/engine/session.test.ts -t "middle of a session"`

Expected: FAIL，session 沒有 `packVersions`。

- [ ] **Step 3: 在 session 開頭鎖定版本**

```ts
const sessionPacks = new Map<string, string>();
for (const scope of Object.values(child.learningScopes)) {
  for (const packId of scope.packIds) sessionPacks.set(packId, getPack(packId).version);
}
```

- `SessionRecord.packVersions` 保存此 map。
- `selectNextQuestion` 只選 `session.packVersions` 內的版本。
- `recordSessionAnswer` 把 `packId`、`packVersion`、depth metadata 寫入 attempt。

- [ ] **Step 4: PWA 快取策略**

保留 `globPatterns`，新增明確 assert：

- 所有 production pack hash 檔均在 `dist`；
- `sw.js` manifest 包含音檔及圖片；
- build 後檢查 `family/sw.js` 中的 `self.__WB_MANIFEST` 非空；
- pack 不依賴 runtime CDN。

在 `scripts/postbuild.mjs` 加入：

```js
if (!sw.includes("self.__WB_MANIFEST")) throw new Error("PWA manifest marker missing");
```

- [ ] **Step 5: 跑 session、storage 及 build**

Run: `cd apps/family && npm test && npm run build`

Expected: 全部 passed；build 產生新的 `family/sw.js` 且沒有 hard-coded 234 失敗。

- [ ] **Step 6: Commit**

```bash
git add apps/family/src/engine/session.ts apps/family/src/App.tsx apps/family/vite.config.ts apps/family/scripts/postbuild.mjs apps/family/src/engine/session.test.ts apps/family/src/lib/storage.test.ts
git commit -m "feat: pin curriculum versions per session and verify offline packs"
```

### Task 21：完整驗收矩陣、E2E 及文件更新

**Files:**
- Modify: `工作/` 既有測試腳本：`work/test_family_touch.py`、`work/test_family_webkit.py` if present in workspace
- Modify: `PRODUCT_SPEC.md`
- Modify: `實作進度與發布門.md`
- Modify: `官方課程來源與驗證規範.md`
- Modify: `開源兒童學習項目對標與差距分析.md`
- Create: `apps/family/sources/official/depth-report.md` generated output

- [ ] **Step 1: 先跑現有完整閘門確認基線**

Run:

```bash
cd apps/family
npm run verify:sources
npm run coverage:sources
npm run verify:content
npm run verify:depth
npm test
npm run build
```

Expected:

- sources 4 PDFs verified；
- content signature 只在使用 `update:content` 後更新；
- `verify:depth` 0 errors only after Tasks 13–15 complete；
- tests/build pass。

- [ ] **Step 2: 真觸控 E2E 加入場景**

Chromium／iPad／Android 平板必須驗證：

1. 建立家庭及孩子。
2. 首位孩子做 8 題起點，不出現空白、重題或提前 secure。
3. 錯答後看到具體提示，再試一次會記 `hintUsed`。
4. 完成一輪後家長看板顯示三層證據。
5. 家長把數學 scope 切到 test-only P3 fixture 的 E2E 模式，英語仍 P2。
6. 切換後 P2 evidence 保留，P3 新技能可用。
7. 離線 reload 後遊戲仍可進入。

WebKit／iPhone／iPad 必須驗證：

1. 家庭建立及解鎖。
2. 首頁主要「跟小芽開始」按鈕在首屏。
3. 語音、圖片、tap-order 及 match 可用。
4. 重載後仍鎖定，資料保留。
5. 無文字輸入、無鍵盤彈出。

- [ ] **Step 3: 視覺及觸控門檻**

- 主要按鈕 56 CSS px 以上；所有可點目標 44 px 以上。
- 1180×820、1024×768、820×1180、768×1024、1280×800、800×1280、390×844、844×390 都不得遮擋主要動作。
- 孩子頁不得出現兩個同級主按鈕。
- 文字不得溢出卡片或按鈕。
- tap-order token 不得被安全區或狀態列遮擋。

- [ ] **Step 4: 更新規範文件**

`PRODUCT_SPEC.md` 加入：

- 深度證據的定義；
- 逐科年級 scope；
- 課程包版本及回滾；
- 語音練習不作評分；
- 家長深度看板不得誤導；
- P3 包不齊不得顯示可啟用；
- 成長星是終身累積、永不扣減的解鎖進度，不是可消費虛擬貨幣；
- 陪伴角色不能遮擋學習、不能自行評分，且可由家長關閉。
- 陪伴寵物只在 app 內安全陪伴區活動，不是可在作業系統桌面自由移動的獨立 app；
- 教學音訊播放時寵物不得同時發聲，`prefers-reduced-motion` 下必須停止大幅動作。
- 每日練習不得以斷 streak、扣心或懲罰文案迫使用戶回來；
- 孩子進度不得以虛假百分比代替掌握狀態。

`實作進度與發布門.md` 加入：

- 本輪 pack schema、depth gate、test-only P3 fixture 的完成狀態；
- 實際題數及每技能最低／平均題數；
- 仍未完成：真正 P3 production pack、人工審核、真機 PWA。

`官方課程來源與驗證規範.md` 加入：

- P3 來源沿用同一四份 MOE PDF；
- P3 outcome 必須另建頁碼及引文，不得把 P1/P2 outcome 升 grade；
- 課程包 grade scope 必須對應 source levels。

`開源兒童學習項目對標與差距分析.md` 加入：

- OATutor 的 BKT 不是多樣性演算法；
- Kolibri 內容包只借版本化及 assignment；
- Oppia 只借補救分支；
- GCompris 只借圖示、難度及無時間壓力；
- 不引入任何大型平台依賴。

- [ ] **Step 5: 跑真實 E2E**

Run:

```bash
cd /Users/rydertsui/Desktop/幼儿学习天地
python3 work/test_family_touch.py
python3 work/test_family_webkit.py
```

Expected:

- Chromium touch scenarios 全部 passed；
- WebKit iPhone/iPad scenarios 全部 passed；
- 截圖及 logs 寫入 `work/family-audit/`。

若腳本名稱或路徑在實作時已改變，先以 `rg --files work | rg 'family.*(touch|webkit)'` 找出真實腳本，再更新本計劃的命令；不要用未存在的命令假裝通過。

- [ ] **Step 6: 檢查 plan 與規範一致**

Run:

```bash
rg -n "100%|零錯誤|approved|AI.*評分|完全覆蓋|桌面版" PRODUCT_SPEC.md 實作進度與發布門.md 官方課程來源與驗證規範.md apps/family/src
```

Expected: 無產品文案宣稱不可能保證；`approved` 只出現在授權的資料狀態或否定句中。

- [ ] **Step 7: Commit**

```bash
git add PRODUCT_SPEC.md 實作進度與發布門.md 官方課程來源與驗證規範.md 開源兒童學習項目對標與差距分析.md apps/family/sources/official/depth-report.md work
git commit -m "docs: record depth engine and curriculum pack release gates"
```

---

## 13. 不在此計劃內

- 真正 P3 production pack 的逐題內容；本計劃只建 registry、scope、fixture 及驗證流程，P3 內容另立計劃。
- 小四至小六完整內容；架構可承載，但不在本次交付。
- 任何 LLM 出題、AI 難度預測、AI 寫作／口語評分。
- 原生 App、桌面版、Android 手機 UI 或 App 內建瀏覽器支援。
- 教師／社群多人編輯平台、雲端帳號、跨裝置同步。
- 任意家長自製題目；未經 schema、來源及 hash 驗證的內容不可進入孩子模式。
- 可購買、可花費、可轉讓的虛擬貨幣；隨機抽獎、付費扭蛋、排行、角色交易、限時獨佔或斷 streak 懲罰。
- 會離開 PWA、覆蓋其他 app、常駐系統桌面或需要背景權限的作業系統桌面寵物。
- 真機 PWA 安裝、離線冷啟、麥克風及儲存 quota 驗收；本計劃只能建立自動化與文件門檻，真機結果要另記。

## 14. 里程碑及執行順序

### Milestone A：可驗證的內容包及深度資料

Tasks 1–5。完成後引擎尚未改掌握門檻，但任何新內容已不能繞過 pack、來源、模板及簽名。

### Milestone B：更準確的掌握及先修

Tasks 6–11。完成後 secure 必須有跨模板、跨作答方式、遷移及延後保持證據；起點及先修不再只看答對數量。

### Milestone C：兒童可用的深度互動及陪伴獎勵

Tasks 12、16、16A、16B、16C。加入 tap-order、老師式補救、每日練習、成長星角色收藏及可互動小狗寵物；仍保持單指、單一主動作、無打字、無書寫、無倒計時。

### Milestone D：三科內容真正加深

Tasks 13–15。完成後 34 個技能都達到 A/B 類藍圖。此階段才可更新 `content.sha256` 及把內容版本升到新的深版。

### Milestone E：家長管理及 P3 升級準備

Tasks 17–20。逐科 grade、課程包選擇、深度看板、P3 fixture、版本快照及離線回滾。

### Milestone F：發布前真實驗收

Task 21。Chromium touch、WebKit iPhone/iPad、Android 平板手勢、離線、版本回滾及電話真機另行記錄。沒有真機結果不得說已完成裝置驗收。

## 15. 成功標準

- `npm test`：全部通過；測試數量按新增測試增加，不以舊 99 作為完成標準。
- `npm run verify:sources`：4 份 MOE PDF、所有 P1/P2（及日後 P3）outcome 逐頁引文可重現。
- `npm run verify:content`：所有技能、題目、答案、選項、音檔及 source refs 通過。
- `npm run verify:depth`：34 個技能全部達到 blueprint；A 類 18 題、B 類 12 題；每技能至少 3 個模板家族、2 種作答方式。
- 每個技能至少 1 題 near/far transfer；A 類至少 2 題；A 類至少 3 個 context。
- `classifyMastery`：無延後保持、無遷移、或只有同模板時不得 secure；最近獨立答錯不得保留 secure。
- 起點診斷：8 題不重複；覆蓋至少 3 個子領域；未觀察技能不標 secure。
- P3 fixture：切換後 P1/P2 evidence 不變；P1/P2 先修不足時不可用 P3 新技能；production build 不含 fixture。
- 課程包切換：不得在 mid-session 換版本；rollback 後舊 attempts 仍可讀。
- 兒童主流程：只可點按、拖放不使用、無打字、無書寫評分、無背景自動鎖定、無倒計時。
- 獎勵：同一 session 不重複得星；答錯、慢、退出不扣星；每日上限不外顯成倒數；星星不可花費、購買、轉讓或排名。
- 陪伴角色：未達門檻不可選；同時只有一隻 active companion；動畫可略過、可關閉、可隨減少動畫設定停用。
- 動畫寵物：小狗只在安全區活動、不遮擋任何答案或主要動作；tap 有反應但不阻塞學習；教學音訊播放時不播寵物音訊。
- 寵物狀態：idle／greet／listen／think／celebrate／comfort／tap-react／rest 均有測試；不存在 angry、punish 或 beg 狀態。
- 每日練習：新加坡日期邊界、6/8/10 題比例、恢復中斷、同一 session 只發一次完成星。
- 進度顯示：每科以目前技能、穩定、保持及待複習顯示，不使用 `完成 X%` 或三科合併百分比。
- 首屏主要動作：所有支援 viewport 第一個可見畫面可完成。
- PWA：所有 production pack、音檔、圖片、字型、漢字資料都被 precache；離線重載可進入已啟用 pack。
- 文案：不出現「100% 正確」「零錯誤」「AI 已確認」「真人已核准」；沒有真人審核時保持 pilot。

## 16. 自檢結果

### 規格覆蓋

- 用戶要求「知識內容管理、升 P3 換資料、系統自適應」：Tasks 3、6、17、19、20 及第 10 節。
- 用戶要求「孩子遊戲式、少按鈕、老師主動、語音／動效」：Tasks 12、16 及第 8 節；不加入打字或書寫。
- 用戶要求「AI 先擱置、演算法精明」：第 6–7、10 節使用可解釋 BKT、多樣性、間隔及遷移，不使用未校準 AI。
- 用戶要求「準確度、bug、交互重要」：第 11 節 P0/P1、Task 13–15 的獨立答案核對、Task 21 真實觸控。
- 用戶要求「不同小孩、家長創建檔案、孩子選擇檔案」：現有模型保留；本計劃只加 per-child scope，不破壞 profile selection。
- 用戶要求「只用 iPhone/iPad/Android 平板 PWA」：第 1 節第 9 點及第 13 節 non-goals。
- 用戶要求「升三年級輕鬆換資料」：第 10 節 P3 lifecycle、Tasks 3/6/19/20 及 P3 production pack 的後續獨立計劃。
- 用戶要求「遊戲後累積積分、兌換動畫角色、角色陪伴學習」：第 9.4 節及 Task 16A；以成長星及固定收藏里程碑實現，不作可消費貨幣。
- 用戶要求「有進度、每日練習、透過學習獲積分」：第 9.5 節及 Task 16B；進度以掌握站點顯示，每日練習混合複習／當前／遷移，成長星在完成後才發。
- 用戶要求「陪伴角色像桌面寵物、可動可互動，第一隻是小狗」：第 9.4 節第一個小狗規格及 Task 16C；角色只在 app 安全區內陪伴，不搶教學音訊或遮擋操作。

### Placeholder 掃描

- 計劃中沒有未完成標記、未指定檔案或空泛「稍後處理」。
- P3 production pack 的具體題目被明確分到後續獨立計劃；本計劃不以 fixture 冒充真正 P3 教材。
- 每個內容擴充任務都有檔案、測試、目標、模板家族、作答方式、命令及 commit。

### 型別及命名檢查

- 年級統一為 `SchoolGrade`。
- 科目統一為 `Subject`。
- 課程包統一用 `CurriculumPackManifest`，科目以 `subjects: Subject[]` 表示。
- 技能、題目、attempt 均保留 `packId`；頁面不以 `template` 代替 `templateFamily`。
- 語音一律 `voice-practice`，不得用 `tap-choice` 冒充口語證據。
- `SkillEvidence` 的 `templateFamilies`、`responseModes`、`transferCorrect`、`delayedIndependentCorrect` 在後續任務使用同一命名。

## 17. 執行前確認

這份計劃是架構及 TDD 路線，不是已完成功能的宣稱。執行時必須先在乾淨 worktree 上按 Milestone A → F；不要一次把 34 技能全部改完才跑測試。每個 Task 完成後先看測試失敗原因，再做最小實作，最後才更新內容 hash。

真正 P3 production pack 的第二步計劃應在 Milestone E 通過後再寫，內容包括：

- 官方 P3 outcome 逐頁引文；
- P3 技能圖及 P1/P2 先修接駁；
- P3 中文教材字表及英語 middle-primary progression；
- 每技能 blueprint、題目、音檔、選項 ID及獨立答案 fixture；
- 家長升級、回滾及真機驗收。



