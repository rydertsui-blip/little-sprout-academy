import type { MasteryLevel, Subject } from "../lib/types";

export const UI_COPY = {
  setup: {
    eyebrow: "家长设置",
    title: "建立家庭学习区",
    body: "孩子档案和学习记录只保存在这台设备。\n家长密码用于加密保护。",
    householdNameLabel: "家庭名称",
    householdNamePlaceholder: "例如：我们的学习区",
    parentNameLabel: "家长称呼",
    parentNamePlaceholder: "例如：妈妈",
    pinLabel: "家长密码",
    pinPlaceholder: "4 到 6 位数字",
    submit: "建立家庭学习区",
    saveError: "家庭设置没有保存成功，请再试一次。"
  },
  unlock: {
    eyebrow: "家长解锁",
    title: "输入家长密码",
    plainBody: "输入家长密码，打开孩子档案和学习记录。",
    encryptedBody: "孩子档案和学习记录已加密保存在这台设备。"
  },
  profiles: {
    eyebrow: "孩子模式",
    title: "今天谁来学习？",
    body: "选择自己的档案，继续今天的学习。",
    parentEntry: "家长设置",
    empty: "还没有孩子档案。请由家长打开家长设置，建立第一个档案。",
    needsStart: "先做起点小试",
    started: "继续上次的练习"
  },
  child: {
    eyebrow: "今天的一点点",
    topbarFallback: "学习区",
    subtitle: "今天想学哪一科？",
    greeting: (name: string) => `${name}，今天想学哪一科？`,
    body: "一轮做完就休息。答对几次，小芽才知道你真的会了。",
    startDiagnostic: "先做 8 题，找找起点",
    continuePractice: "继续上次的练习",
    note: "遇到不会的，会先拆成小步，再陪你练。",
    sessionBrand: (name: string) => `${name} · 小芽学习`
  },
  session: {
    diagnosticTitle: "起点小试",
    practiceTitle: "继续练习",
    diagnosticResult: "起点找到了",
    practiceResult: "这一轮完成了",
    diagnosticResultBody: "今天从这里继续。下一次会根据你的作答调整难度。",
    practiceResultBody: "这一轮完成了。下一次会继续安排适合你的练习。",
    resultCount: (count: number) => `这一轮做了 ${count} 题`,
    correctTitle: "答对了",
    wrongTitle: "没关系，一起看答案",
    matchCorrectTitle: "三对都配好了",
    matchWrongTitle: "三对配好了，刚才有配错",
    matchMismatchNote: (count: number) => `中间配错 ${count} 次。先一起看正确配对，再继续。`
  },
  parent: {
    eyebrow: "家长设置",
    dashboardTitle: "孩子学习概览",
    appVersion: (appVersion: string, contentVersion: string, schemaVersion: number) => `App ${appVersion} · 内容 ${contentVersion} · 资料格式 ${schemaVersion}`,
    childActivity: (attempts: number, completed: number) => `${attempts} 题已完成 · ${completed} 科完成起点小试`,
    sessionLength: "每轮题数",
    resetSubject: (subject: string) => `重做${subject}起点`,
    resetConfirm: (subject: string) => `重做${subject}起点会清除这一科当前的掌握记录和未完成练习，历史作答仍会保留。确定继续吗？`,
    contentSummary: (version: string, skillCount: number, questionCount: number) => `内容版本 ${version}：${skillCount} 个知识点、${questionCount} 道题。覆盖小学一、二年级的部分内容，不是完整课程。`,
    officialSourceSummary: (sources: number, outcomes: number, uncovered: number, excluded: number, supplementary: number) => `官方来源已机器核对：${sources} 份 MOE PDF、${outcomes} 条目标；${uncovered} 条游戏内容待补；${excluded} 条书写目标不纳入；${supplementary} 个技能为课外补充。`,
    reviewStatus: "人工课纲复核：未进行",
    practiced: (count: number) => `已练 ${count} 个知识点`,
    masteryCounts: (likely: number, secure: number) => `较稳定 ${likely} 个 · 已巩固 ${secure} 个`,
    empty: "还没有孩子档案。先添加一个孩子。",
    addChild: "添加孩子",
    addFirstChild: "添加第一个孩子",
    editChild: "修改档案",
    deleteChild: "删除孩子",
    deleteConfirm: (name: string) => `删除${name}会清除本机的档案和全部学习记录。建议先导出学习记录。确定继续吗？`,
    highContrast: "高对比",
    largeText: "大字",
    importConfirm: "导入会用文件中的孩子和记录替换当前内容。确定继续吗？",
    importError: "这个文件无法读取，当前学习记录没有改变。",
    export: "导出学习记录",
    exportCsv: "导出作答 CSV",
    import: "导入学习记录",
    close: "关闭",
    lock: "退出并锁定"
  },
  mastery: {
    unknown: "还没看清",
    developing: "正在学",
    "likely-secure": "比较稳定",
    secure: "已经巩固"
  } satisfies Record<MasteryLevel, string>,
  storageError: "这次没有保存成功，请再试一次。"
} as const;

export const SUBJECT_NAMES: Record<Subject, string> = {
  math: "数学",
  mandarin: "华文",
  english: "英语"
};
