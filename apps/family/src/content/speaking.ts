export interface SpeakingPrompt {
  id: string;
  text: string;
  display: string;
  language: "zh-CN" | "en-US";
  translation: string;
  category?: "word" | "organize" | "read-aloud" | "speaking-purpose";
  task?: string;
  image?: string;
  keywords?: string[];
}

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  // 1. Word Deck (K2 -> P2 Mandarin & English words)
  { id: "zh-ren", text: "人，大人", display: "人", language: "zh-CN", translation: "person · 大人", keywords: ["人", "大人"] },
  { id: "zh-kou", text: "口，开口", display: "口", language: "zh-CN", translation: "mouth · 开口", keywords: ["口", "开口"] },
  { id: "zh-shan", text: "山，高山", display: "山", language: "zh-CN", translation: "mountain · 高山", keywords: ["山", "高山"] },
  { id: "zh-shou", text: "手，小手", display: "手", language: "zh-CN", translation: "hand · 小手", keywords: ["手", "小手"] },
  { id: "zh-ri", text: "日，太阳", display: "日", language: "zh-CN", translation: "sun · 太阳", keywords: ["日", "太阳"] },
  { id: "zh-yue", text: "月，月亮", display: "月", language: "zh-CN", translation: "moon · 月亮", keywords: ["月", "月亮"] },
  { id: "zh-mu", text: "木，树木", display: "木", language: "zh-CN", translation: "tree · 树木", keywords: ["木", "树木"] },
  { id: "zh-shui", text: "水，喝水", display: "水", language: "zh-CN", translation: "water · 喝水", keywords: ["水", "喝水"] },
  { id: "zh-huo", text: "火，火苗", display: "火", language: "zh-CN", translation: "fire · 火苗", keywords: ["火", "火苗"] },
  { id: "zh-tian", text: "田，田地", display: "田", language: "zh-CN", translation: "field · 田地", keywords: ["田", "田地"] },
  { id: "zh-mu-eye", text: "目，目光", display: "目", language: "zh-CN", translation: "eye · 目光", keywords: ["目", "目光"] },
  { id: "zh-zu", text: "足，足球", display: "足", language: "zh-CN", translation: "foot · 足球", keywords: ["足", "足球"] },
  { id: "zh-hua", text: "花朵", display: "花朵", language: "zh-CN", translation: "flower", image: "flower", keywords: ["花", "花朵"] },
  { id: "zh-shumu", text: "大树", display: "大树", language: "zh-CN", translation: "big tree", image: "tree", keywords: ["树", "大树"] },
  { id: "zh-xiaoniao", text: "小鸟", display: "小鸟", language: "zh-CN", translation: "little bird", image: "bird", keywords: ["鸟", "小鸟"] },
  { id: "zh-shubao", text: "书包", display: "书包", language: "zh-CN", translation: "school bag", image: "books", keywords: ["书", "书包"] },
  { id: "zh-gaoxing", text: "高兴", display: "高兴", language: "zh-CN", translation: "happy / glad", keywords: ["高", "兴", "高兴"] },
  { id: "zh-renzhen", text: "认真", display: "认真", language: "zh-CN", translation: "careful / serious", keywords: ["认", "真", "认真"] },
  { id: "en-apple", text: "apple", display: "apple", language: "en-US", translation: "苹果", image: "apple", keywords: ["apple"] },
  { id: "en-bear", text: "bear", display: "bear", language: "en-US", translation: "熊", image: "bear", keywords: ["bear"] },
  { id: "en-cat", text: "cat", display: "cat", language: "en-US", translation: "猫", image: "cat", keywords: ["cat"] },
  { id: "en-dog", text: "dog", display: "dog", language: "en-US", translation: "狗", image: "dog", keywords: ["dog"] },
  { id: "en-fish", text: "fish", display: "fish", language: "en-US", translation: "鱼", image: "fish", keywords: ["fish"] },
  { id: "en-flower", text: "flower", display: "flower", language: "en-US", translation: "花", image: "flower", keywords: ["flower"] },
  { id: "en-moon", text: "moon", display: "moon", language: "en-US", translation: "月亮", image: "moon", keywords: ["moon"] },
  { id: "en-star", text: "star", display: "star", language: "en-US", translation: "星星", image: "star", keywords: ["star"] },
  { id: "en-sun", text: "sun", display: "sun", language: "en-US", translation: "太阳", image: "sun", keywords: ["sun"] },
  { id: "en-tree", text: "tree", display: "tree", language: "en-US", translation: "树", image: "tree", keywords: ["tree"] },
  { id: "en-rabbit", text: "rabbit", display: "rabbit", language: "en-US", translation: "兔子", image: "rabbit", keywords: ["rabbit"] },
  { id: "en-mountain", text: "mountain", display: "mountain", language: "en-US", translation: "大山", image: "mountain", keywords: ["mountain"] },
  { id: "en-pencil", text: "pencil", display: "pencil", language: "en-US", translation: "铅笔", image: "pencil", keywords: ["pencil"] },
  { id: "en-house", text: "house", display: "house", language: "en-US", translation: "房子", image: "house", keywords: ["house"] },

  // 2. Picture Storytelling / Organize Deck (P1 -> P2)
  { id: "zh-org-apple", text: "苹果，红色，甜甜的。", display: "苹果", language: "zh-CN", translation: "先说这是什么，再说颜色和味道。", category: "organize", task: "先说这是什么，再说颜色和味道。", image: "apple", keywords: ["苹果", "红", "甜"] },
  { id: "zh-org-dog", text: "小狗，棕色，它会跑。", display: "小狗", language: "zh-CN", translation: "先说这是什么，再说它会做什么。", category: "organize", task: "先说这是什么，再说它会做什么。", image: "dog", keywords: ["狗", "棕", "跑"] },
  { id: "zh-org-rain", text: "下雨了，我带了雨伞。", display: "雨天", language: "zh-CN", translation: "先说什么天气，再说你带了什么。", category: "organize", task: "先说什么天气，再说你带了什么。", image: "rain", keywords: ["雨", "伞"] },
  { id: "zh-org-tree", text: "公园里有一棵大树。", display: "大树", language: "zh-CN", translation: "先说在哪里，再说有什么。", category: "organize", task: "先说在哪里，再说有什么。", image: "tree", keywords: ["公园", "树"] },
  { id: "zh-org-sun", text: "太阳出来了，天气很热。", display: "太阳", language: "zh-CN", translation: "先说看到什么，再说天气怎样。", category: "organize", task: "先说看到什么，再说天气怎样。", image: "sun", keywords: ["太阳", "热", "天气"] },
  { id: "zh-org-books", text: "桌上有三本书。", display: "三本书", language: "zh-CN", translation: "先说在哪里，再说有几本书。", category: "organize", task: "先说在哪里，再说有几本书。", image: "books", keywords: ["桌", "三", "书"] },
  { id: "zh-org-bird", text: "树上有一只小鸟，它在开心地唱歌。", display: "小鸟唱歌", language: "zh-CN", translation: "先说小鸟在哪里，再说它在做什么。", category: "organize", task: "先说小鸟在哪里，再说它在做什么。", image: "bird", keywords: ["树", "鸟", "唱"] },
  { id: "zh-org-rabbit", text: "小白兔有长长的耳朵，它爱吃红萝卜。", display: "小白兔", language: "zh-CN", translation: "先说小白兔的样子，再说它爱吃什么。", category: "organize", task: "先说小白兔的样子，再说它爱吃什么。", image: "rabbit", keywords: ["兔", "耳", "吃"] },
  { id: "zh-org-fish", text: "小鱼在清澈的河水里游来游去。", display: "小鱼游泳", language: "zh-CN", translation: "先说小鱼在哪里，再说它怎样游。", category: "organize", task: "先说小鱼在哪里，再说它怎样游。", image: "fish", keywords: ["鱼", "水", "游"] },
  { id: "zh-org-flower", text: "花园里开满了五颜六色的花朵。", display: "美丽的花", language: "zh-CN", translation: "先说在哪里，再说花朵是什么样的。", category: "organize", task: "先说在哪里，再说花朵是什么样的。", image: "flower", keywords: ["花", "开"] },
  { id: "zh-org-moon", text: "夜晚到了，弯弯的月亮挂在天上。", display: "夜晚的月亮", language: "zh-CN", translation: "先说什么时间，再说月亮挂在哪里。", category: "organize", task: "先说什么时间，再说月亮挂在哪里。", image: "moon", keywords: ["夜", "月亮", "天"] },
  { id: "zh-org-cat", text: "小猫趴在垫子上，安静地睡着了。", display: "小猫睡觉", language: "zh-CN", translation: "先说小猫在哪里，再说它在做什么。", category: "organize", task: "先说小猫在哪里，再说它在做什么。", image: "cat", keywords: ["猫", "睡"] },

  // 3. Read-Aloud Deck (P1 simple sentences -> P2 complex sentences with conjunctions)
  { id: "zh-read-mum", text: "我爱妈妈。", display: "我爱妈妈。", language: "zh-CN", translation: "大声读一读，每个字读清楚。", category: "read-aloud", task: "大声读一读，每个字读清楚。", keywords: ["我", "爱", "妈妈"] },
  { id: "zh-read-book", text: "这是我的书。", display: "这是我的书。", language: "zh-CN", translation: "先听示范，再清楚读一次。", category: "read-aloud", task: "先听示范，再清楚读一次。", keywords: ["这", "我", "书"] },
  { id: "zh-read-sleep", text: "弟弟在睡觉。", display: "弟弟在睡觉。", language: "zh-CN", translation: "慢慢读，不要漏字。", category: "read-aloud", task: "慢慢读，不要漏字。", keywords: ["弟弟", "睡觉"] },
  { id: "zh-read-bird", text: "小鸟在天上飞。", display: "小鸟在天上飞。", language: "zh-CN", translation: "读出完整的句子。", category: "read-aloud", task: "读出完整的句子。", keywords: ["小鸟", "天上", "飞"] },
  { id: "zh-read-rain", text: "今天下雨了。", display: "今天下雨了。", language: "zh-CN", translation: "试着读得自然一点。", category: "read-aloud", task: "试着读得自然一点。", keywords: ["今天", "下雨"] },
  { id: "zh-read-park", text: "我们一起去公园。", display: "我们一起去公园。", language: "zh-CN", translation: "先听一次，再完整读出来。", category: "read-aloud", task: "先听一次，再完整读出来。", keywords: ["我们", "一起", "公园"] },
  { id: "zh-read-because", text: "因为外面下大雨，所以我们留在家里看书。", display: "因为外面下大雨，所以我们留在家里看书。", language: "zh-CN", translation: "高年级复句：注意“因为…所以…”的停顿。", category: "read-aloud", task: "注意“因为…所以…”的停顿。", keywords: ["因为", "下雨", "所以", "看书"] },
  { id: "zh-read-although", text: "虽然山路很远，但是大家都没有放弃。", display: "虽然山路很远，但是大家都没有放弃。", language: "zh-CN", translation: "高年级复句：注意“虽然…但是…”的语气。", category: "read-aloud", task: "注意“虽然…但是…”的语气。", keywords: ["虽然", "但是", "放弃"] },
  { id: "zh-read-notonly", text: "姐姐不但喜欢画画，而且弹琴也很好听。", display: "姐姐不但喜欢画画，而且弹琴也很好听。", language: "zh-CN", translation: "高年级复句：读出“不但…而且…”的递进感。", category: "read-aloud", task: "读出“不但…而且…”的递进感。", keywords: ["姐姐", "不但", "画画", "而且"] },
  { id: "zh-read-sequence", text: "我每天回到家，先洗手，再吃水果，然后做功课。", display: "我每天回到家，先洗手，再吃水果，然后做功课。", language: "zh-CN", translation: "高年级承接句：读清楚“先…再…然后…”的顺序。", category: "read-aloud", task: "读清楚“先…再…然后…”的顺序。", keywords: ["先", "洗手", "再", "然后"] },
  { id: "zh-read-aslongas", text: "只要我们每天坚持练习，就能把汉字写得又好又快。", display: "只要我们每天坚持练习，就能把汉字写得又好又快。", language: "zh-CN", translation: "高年级条件句：大声读出自信的语气。", category: "read-aloud", task: "大声读出自信的语气。", keywords: ["只要", "练习", "汉字"] },
  { id: "zh-read-helping", text: "小华看见同学摔倒了，连忙跑过去把他扶起来。", display: "小华看见同学摔倒了，连忙跑过去把他扶起来。", language: "zh-CN", translation: "高年级叙事句：读出关心同学的语气。", category: "read-aloud", task: "读出关心同学的语气。", keywords: ["小华", "同学", "扶"] },

  // 4. English Speaking Purpose Deck (P1 everyday expressions -> P2 grammar & past tense sentences)
  { id: "en-purpose-greet", text: "Hello! How are you?", display: "Hello! How are you?", language: "en-US", translation: "向朋友打招呼。", category: "speaking-purpose", task: "向朋友打招呼。", keywords: ["hello", "how", "are", "you"] },
  { id: "en-purpose-friend", text: "This is my friend.", display: "This is my friend.", language: "en-US", translation: "介绍一位朋友。", category: "speaking-purpose", task: "介绍一位朋友。", keywords: ["this", "my", "friend"] },
  { id: "en-purpose-water", text: "May I have some water, please?", display: "May I have some water, please?", language: "en-US", translation: "礼貌地请别人给你水。", category: "speaking-purpose", task: "礼貌地请别人给你水。", keywords: ["may", "water", "please"] },
  { id: "en-purpose-thanks", text: "Thank you for your help.", display: "Thank you for your help.", language: "en-US", translation: "向帮助你的人道谢。", category: "speaking-purpose", task: "向帮助你的人道谢。", keywords: ["thank", "you", "help"] },
  { id: "en-purpose-play", text: "Let's play together.", display: "Let's play together.", language: "en-US", translation: "邀请朋友一起玩。", category: "speaking-purpose", task: "邀请朋友一起玩。", keywords: ["play", "together"] },
  { id: "en-purpose-help", text: "Can you help me, please?", display: "Can you help me, please?", language: "en-US", translation: "礼貌地请别人帮忙。", category: "speaking-purpose", task: "礼貌地请别人帮忙。", keywords: ["can", "help", "please"] },
  { id: "en-purpose-library", text: "Excuse me, where is the school library?", display: "Excuse me, where is the school library?", language: "en-US", translation: "礼貌地问路：学校图书馆在哪里？", category: "speaking-purpose", task: "礼貌地询问学校图书馆在哪里。", keywords: ["excuse", "where", "library"] },
  { id: "en-purpose-borrow", text: "May I borrow your blue pencil, please?", display: "May I borrow your blue pencil, please?", language: "en-US", translation: "向同学礼貌借蓝色铅笔。", category: "speaking-purpose", task: "向同学礼貌借蓝色铅笔。", keywords: ["borrow", "blue", "pencil"] },
  { id: "en-purpose-yesterday", text: "Yesterday we went to the park and saw colourful birds.", display: "Yesterday we went to the park and saw colourful birds.", language: "en-US", translation: "用过去时讲述昨天去公园看到了彩色的鸟。", category: "speaking-purpose", task: "讲述昨天去公园看到小鸟的经历。", keywords: ["yesterday", "went", "park", "birds"] },
  { id: "en-purpose-umbrella", text: "I took my umbrella because it was raining outside.", display: "I took my umbrella because it was raining outside.", language: "en-US", translation: "用 because 说明带雨伞的原因。", category: "speaking-purpose", task: "说明因为外面下雨所以带了雨伞。", keywords: ["umbrella", "because", "raining"] },
  { id: "en-purpose-weekend", text: "What did you do with your family last weekend?", display: "What did you do with your family last weekend?", language: "en-US", translation: "询问朋友上周末和家人做了什么。", category: "speaking-purpose", task: "询问朋友上周末的活动。", keywords: ["what", "family", "weekend"] },
  { id: "en-purpose-share", text: "We can share this storybook and read it together.", display: "We can share this storybook and read it together.", language: "en-US", translation: "主动和朋友分享故事书一起读。", category: "speaking-purpose", task: "邀请朋友一起分享故事书。", keywords: ["share", "read", "together"] }
];
