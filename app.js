const STORAGE_KEY = "little-sprout-progress-v1";

const pinyinCards = [
  { id: "mao", pinyin: "māo", character: "猫", word: "小猫", english: "cat", image: "cat", sentence: "小猫轻轻走，喵喵喵。", audio: "zh-mao" },
  { id: "gou", pinyin: "gǒu", character: "狗", word: "小狗", english: "dog", image: "dog", sentence: "小狗跑得快，摇摇尾巴。", audio: "zh-gou" },
  { id: "yu", pinyin: "yǔ", character: "雨", word: "下雨", english: "rain", image: "rain", sentence: "下雨了，记得带雨伞。", audio: "zh-yu" },
  { id: "shan", pinyin: "shān", character: "山", word: "高山", english: "mountain", image: "mountain", sentence: "高高的山，站在远方。", audio: "zh-shan" },
  { id: "shui", pinyin: "shuǐ", character: "水", word: "喝水", english: "water", image: "water", sentence: "喝一口水，慢慢咽下去。", audio: "zh-shui" },
  { id: "niao", pinyin: "niǎo", character: "鸟", word: "小鸟", english: "bird", image: "bird", sentence: "小鸟飞过来，轻轻唱歌。", audio: "zh-niao" },
  { id: "hua", pinyin: "huā", character: "花", word: "花朵", english: "flower", image: "flower", sentence: "花儿开了，香香的。", audio: "zh-hua" },
  { id: "tu", pinyin: "tù", character: "兔", word: "小兔", english: "rabbit", image: "rabbit", sentence: "小兔蹦蹦跳，爱吃萝卜。", audio: "zh-tu" }
];

const englishWords = [
  { id: "apple", word: "apple", chinese: "苹果", sentence: "One red apple.", image: "apple", audio: "en-apple" },
  { id: "bear", word: "bear", chinese: "小熊", sentence: "A sleepy brown bear.", image: "bear", audio: "en-bear" },
  { id: "cat", word: "cat", chinese: "猫", sentence: "A little cat says meow.", image: "cat", audio: "en-cat" },
  { id: "dog", word: "dog", chinese: "狗", sentence: "The dog can run fast.", image: "dog", audio: "en-dog" },
  { id: "fish", word: "fish", chinese: "鱼", sentence: "A fish swims in water.", image: "fish", audio: "en-fish" },
  { id: "flower", word: "flower", chinese: "花", sentence: "A yellow flower opens.", image: "flower", audio: "en-flower" },
  { id: "moon", word: "moon", chinese: "月亮", sentence: "The moon is bright tonight.", image: "moon", audio: "en-moon" },
  { id: "sun", word: "sun", chinese: "太阳", sentence: "The warm sun is in the sky.", image: "sun", audio: "en-sun" },
  { id: "star", word: "star", chinese: "星星", sentence: "One star twinkles at night.", image: "star", audio: "en-star" },
  { id: "tree", word: "tree", chinese: "树", sentence: "Birds sing in the tree.", image: "tree", audio: "en-tree" }
];

const hanziCharacters = [
  { char: "人", pinyin: "rén", word: "大人", tip: "一撇一捺，像两条腿稳稳站住。", audio: "zh-ren" },
  { char: "日", pinyin: "rì", word: "太阳", tip: "方方的日字里面有一横，像暖暖的阳光。", audio: "zh-ri" },
  { char: "月", pinyin: "yuè", word: "月亮", tip: "弯弯的月字，像挂在天上的月亮。", audio: "zh-yue" },
  { char: "山", pinyin: "shān", word: "高山", tip: "三座高低不同的山峰。", audio: "zh-shan" },
  { char: "水", pinyin: "shuǐ", word: "喝水", tip: "中间壮，两边轻，像流动的水。", audio: "zh-shui" },
  { char: "火", pinyin: "huǒ", word: "火苗", tip: "两边像火星，中间是向上跳的火苗。", audio: "zh-huo" },
  { char: "木", pinyin: "mù", word: "树木", tip: "一竖像树干，一横像伸开的树枝。", audio: "zh-mu" },
  { char: "田", pinyin: "tián", word: "田地", tip: "方方的田字，像一块一块农田。", audio: "zh-tian" },
  { char: "口", pinyin: "kǒu", word: "开口", tip: "方方的口，像张开的嘴巴。", audio: "zh-kou" },
  { char: "手", pinyin: "shǒu", word: "小手", tip: "伸开五指，就是一只手。", audio: "zh-shou" },
  { char: "目", pinyin: "mù", word: "目光", tip: "目字像竖起来的眼睛。", audio: "zh-mu" },
  { char: "足", pinyin: "zú", word: "足球", tip: "上面的口像脚踝，下面像迈开的脚步。", audio: "zh-zu" }
];

const alphabet = [
  ["A", "apple"], ["B", "bear"], ["C", "cat"], ["D", "dog"], ["E", "egg"], ["F", "fish"],
  ["G", "garden"], ["H", "house"], ["I", "insect"], ["J", "juice"], ["K", "kite"], ["L", "leaf"],
  ["M", "moon"], ["N", "nest"], ["O", "orange"], ["P", "pencil"], ["Q", "queen"], ["R", "rain"],
  ["S", "sun"], ["T", "tree"], ["U", "umbrella"], ["V", "violin"], ["W", "water"], ["X", "xylophone"],
  ["Y", "yellow"], ["Z", "zebra"]
];

const courseConfig = {
  pinyin: { kicker: "拼音森林", title: "听一听，找声音", accent: "var(--coral)" },
  english: { kicker: "English Town", title: "Letters & first words", accent: "var(--blue)" },
  hanzi: { kicker: "汉字工坊", title: "看笔顺，亲手写", accent: "var(--leaf)" }
};

const defaultState = {
  completed: { pinyin: [], english: [], hanzi: [] },
  voiceRate: 0.9,
  dailyTarget: 5,
  today: { date: localDateKey(), count: 0 }
};

let state = loadState();
let currentCourse = "home";
let pinyinIndex = 0;
let englishIndex = 0;
let englishMode = "words";
let currentLetter = "A";
let hanziIndex = 0;
let hanziWriter = null;
let toastTimer = null;
let currentAudio = null;

const homeView = document.querySelector("#homeView");
const lessonView = document.querySelector("#lessonView");
const pinyinPanel = document.querySelector("#pinyinPanel");
const englishPanel = document.querySelector("#englishPanel");
const hanziPanel = document.querySelector("#hanziPanel");
const toast = document.querySelector("#toast");
const toastText = document.querySelector("#toastText");
const parentDialog = document.querySelector("#parentDialog");

function localDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return structuredClone(defaultState);
    return {
      ...structuredClone(defaultState),
      ...saved,
      completed: { ...defaultState.completed, ...(saved.completed || {}) },
      today: saved.today || { date: localDateKey(), count: 0 }
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The app remains usable if private browsing blocks local storage.
  }
}

function ensureToday() {
  if (state.today.date !== localDateKey()) {
    state.today = { date: localDateKey(), count: 0 };
    saveState();
  }
}

function assetUrl(path) {
  return new URL(path, document.baseURI).href;
}

function audioUrl(name) {
  return `./assets/audio/${name}.m4a`;
}

function imageUrl(name) {
  return `./assets/images/${name}.png`;
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function totalStars() {
  return Object.values(state.completed).reduce((sum, list) => sum + list.length, 0);
}

function completedCount(course) {
  return state.completed[course]?.length || 0;
}

function isComplete(course, id) {
  return Boolean(state.completed[course]?.includes(id));
}

function courseSize(course) {
  if (course === "pinyin") return pinyinCards.length;
  if (course === "english") return englishWords.length;
  return hanziCharacters.length;
}

function nextCourse() {
  const candidates = [
    ["pinyin", pinyinIndex, pinyinCards],
    ["english", englishIndex, englishWords],
    ["hanzi", hanziIndex, hanziCharacters]
  ];
  const firstIncomplete = candidates.find(([course, index, items]) => {
    const found = items.findIndex((item, itemIndex) => itemIndex >= index && !isComplete(course, item.id || item.char));
    if (found >= 0) return true;
    return items.length > completedCount(course);
  });
  return firstIncomplete?.[0] || "pinyin";
}

function updateHome() {
  ensureToday();
  const stars = totalStars();
  document.querySelector("#headerStarCount").textContent = stars;
  document.querySelector("#todayProgressText").textContent = `今天完成 ${state.today.count} / ${state.dailyTarget} 张小卡`;

  document.querySelector('[data-progress="pinyin"]').textContent = `${completedCount("pinyin")} / ${pinyinCards.length}`;
  document.querySelector('[data-progress="english"]').textContent = `${completedCount("english")} / ${englishWords.length}`;
  document.querySelector('[data-progress="hanzi"]').textContent = `${completedCount("hanzi")} / ${hanziCharacters.length}`;

  const courses = ["pinyin", "english", "hanzi"];
  courses.forEach((course) => {
    const count = completedCount(course);
    const size = courseSize(course);
    const percent = size ? Math.round((count / size) * 100) : 0;
    const meter = document.querySelector(`[data-meter="${course}"]`);
    const label = document.querySelector(`[data-meter-label="${course}"]`);
    if (meter) meter.style.width = `${percent}%`;
    if (label) label.textContent = `${count} 颗星`;
  });

  const next = nextCourse();
  const nextLabel = { pinyin: "拼音森林", english: "English Town", hanzi: "汉字工坊" }[next];
  document.querySelector("#dailyHint").textContent = stars ? `下一站：${nextLabel}` : "今天从拼音森林出发";
}

function updateLessonHeader() {
  const config = courseConfig[currentCourse];
  if (!config) return;
  document.querySelector("#lessonKicker").textContent = config.kicker;
  document.querySelector("#lessonTitle").textContent = config.title;
  document.querySelector("#lessonProgressBar").style.background = config.accent;

  let index = 0;
  let total = 0;
  if (currentCourse === "pinyin") {
    index = pinyinIndex + 1;
    total = pinyinCards.length;
  } else if (currentCourse === "english") {
    index = englishIndex + 1;
    total = englishWords.length;
  } else if (currentCourse === "hanzi") {
    index = hanziIndex + 1;
    total = hanziCharacters.length;
  }
  document.querySelector("#lessonProgressText").textContent = `${index} / ${total}`;
  document.querySelector("#lessonProgressBar").style.width = `${(index / total) * 100}%`;
}

function showHome() {
  currentCourse = "home";
  homeView.hidden = false;
  homeView.classList.add("is-active");
  lessonView.hidden = true;
  updateHome();
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

function openCourse(course, options = {}) {
  if (!courseConfig[course]) return;
  currentCourse = course;
  homeView.hidden = true;
  homeView.classList.remove("is-active");
  lessonView.hidden = false;

  pinyinPanel.hidden = course !== "pinyin";
  englishPanel.hidden = course !== "english";
  hanziPanel.hidden = course !== "hanzi";

  if (course === "pinyin") {
    if (options.reset) pinyinIndex = 0;
    renderPinyin();
  }
  if (course === "english") renderEnglish();
  if (course === "hanzi") renderHanzi();
  updateLessonHeader();
  history.replaceState(null, "", `#${course}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPinyin() {
  const card = pinyinCards[pinyinIndex];
  if (!card) return;
  pinyinPanel.innerHTML = `
    <div class="study-layout">
      <div class="study-visual" style="background: var(--coral-soft)">
        <p class="study-pinyin">${card.pinyin}</p>
        <img class="study-image" src="${imageUrl(card.image)}" alt="${card.word}">
      </div>
      <div class="study-detail">
        <div>
          <span class="detail-label">听音 · 认字 · 说词语</span>
          <h2 class="detail-word">${card.character} · ${card.word}</h2>
          <p class="detail-reading">${card.english}</p>
        </div>
        <p class="detail-sentence">${card.sentence}</p>
        <button class="audio-button" id="pinyinAudio" type="button">
          <i data-lucide="volume-2" aria-hidden="true"></i>
          <span>再听一次</span>
        </button>
        <div class="study-actions">
          <button class="mark-button ${isComplete("pinyin", card.id) ? "is-complete" : ""}" id="markPinyin" type="button">
            <i data-lucide="check" aria-hidden="true"></i>
            <span>${isComplete("pinyin", card.id) ? "已经学会" : "我学会了"}</span>
          </button>
        </div>
      </div>
    </div>
    ${renderLessonFooter("pinyin", pinyinCards, pinyinIndex)}
  `;
  refreshIcons();
  bindPinyinActions();
  updateLessonHeader();
}

function bindPinyinActions() {
  document.querySelector("#pinyinAudio").addEventListener("click", () => {
    const card = pinyinCards[pinyinIndex];
    playCourseAudio(card.audio, card.word, "zh-CN");
  });
  document.querySelector("#markPinyin").addEventListener("click", () => {
    const card = pinyinCards[pinyinIndex];
    if (isComplete("pinyin", card.id)) {
      showToast("这张小卡已经学会了", false);
      return;
    }
    markComplete("pinyin", card.id);
    window.setTimeout(() => {
      pinyinIndex = (pinyinIndex + 1) % pinyinCards.length;
      renderPinyin();
    }, 520);
  });
  bindGenericLessonNav("pinyin", pinyinCards, (index) => {
    pinyinIndex = index;
    renderPinyin();
  });
}

function renderEnglish() {
  englishPanel.innerHTML = `
    <div class="english-tabs" role="tablist" aria-label="英语学习内容">
      <button class="tab-button ${englishMode === "letters" ? "is-active" : ""}" type="button" data-english-mode="letters" role="tab" aria-selected="${englishMode === "letters"}">字母</button>
      <button class="tab-button ${englishMode === "words" ? "is-active" : ""}" type="button" data-english-mode="words" role="tab" aria-selected="${englishMode === "words"}">单词</button>
    </div>
    ${englishMode === "letters" ? renderAlphabet() : renderEnglishWords()}
  `;
  refreshIcons();
  bindEnglishActions();
  updateLessonHeader();
}

function renderAlphabet() {
  const focus = alphabet.find(([letter]) => letter === currentLetter) || alphabet[0];
  return `
    <div class="alphabet-layout">
      <div class="alphabet-intro">
        <img src="${imageUrl("abc")}" alt="">
        <div>
          <span class="detail-label">先认大写字母</span>
          <h2>A to Z</h2>
        </div>
      </div>
      <div class="alphabet-grid">
        ${alphabet.map(([letter]) => `<button class="letter-chip ${letter === currentLetter ? "is-current" : ""}" type="button" data-letter="${letter}" aria-label="字母 ${letter}">${letter}</button>`).join("")}
      </div>
      <div class="alphabet-focus">
        <span class="alphabet-focus-letter">${focus[0]} ${focus[0].toLowerCase()}</span>
        <div class="alphabet-focus-copy">
          <h3>${focus[0]} is for ${focus[1]}.</h3>
          <p>${focus[1][0].toUpperCase()}${focus[1].slice(1)}</p>
        </div>
        <button class="audio-button" id="letterAudio" type="button">
          <i data-lucide="volume-2" aria-hidden="true"></i>
          <span>听一听</span>
        </button>
      </div>
    </div>
  `;
}

function renderEnglishWords() {
  const card = englishWords[englishIndex];
  return `
    <div class="study-layout">
      <div class="study-visual" style="background: var(--blue-soft)">
        <img class="study-image" src="${imageUrl(card.image)}" alt="${card.word}">
        <p class="study-english-word">${card.word}</p>
      </div>
      <div class="study-detail">
        <div>
          <span class="detail-label">Look · Listen · Say</span>
          <h2 class="detail-word">${card.word}</h2>
          <p class="detail-reading">${card.chinese}</p>
        </div>
        <p class="detail-sentence">${card.sentence}</p>
        <button class="audio-button" id="englishAudio" type="button">
          <i data-lucide="volume-2" aria-hidden="true"></i>
          <span>Listen</span>
        </button>
        <div class="study-actions">
          <button class="mark-button ${isComplete("english", card.id) ? "is-complete" : ""}" id="markEnglish" type="button">
            <i data-lucide="check" aria-hidden="true"></i>
            <span>${isComplete("english", card.id) ? "I know it" : "I know it!"}</span>
          </button>
        </div>
      </div>
    </div>
    ${renderLessonFooter("english", englishWords, englishIndex)}
  `;
}

function bindEnglishActions() {
  document.querySelectorAll("[data-english-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      englishMode = button.dataset.englishMode;
      renderEnglish();
    });
  });

  document.querySelectorAll("[data-letter]").forEach((button) => {
    button.addEventListener("click", () => {
      currentLetter = button.dataset.letter;
      const focus = alphabet.find(([letter]) => letter === currentLetter);
      speakText(`${focus[0]}. ${focus[0]} is for ${focus[1]}.`, "en-US");
      renderEnglish();
    });
  });

  const letterAudio = document.querySelector("#letterAudio");
  if (letterAudio) {
    letterAudio.addEventListener("click", () => {
      const focus = alphabet.find(([letter]) => letter === currentLetter);
      speakText(`${focus[0]}. ${focus[0]} is for ${focus[1]}.`, "en-US");
    });
  }

  const audio = document.querySelector("#englishAudio");
  if (audio) {
    audio.addEventListener("click", () => {
      const card = englishWords[englishIndex];
      playCourseAudio(card.audio, card.word, "en-US");
    });
  }

  const mark = document.querySelector("#markEnglish");
  if (mark) {
    mark.addEventListener("click", () => {
      const card = englishWords[englishIndex];
      if (isComplete("english", card.id)) {
        showToast("这个单词已经学会了", false);
        return;
      }
      markComplete("english", card.id);
      window.setTimeout(() => {
        englishIndex = (englishIndex + 1) % englishWords.length;
        renderEnglish();
      }, 520);
    });
    bindGenericLessonNav("english", englishWords, (index) => {
      englishIndex = index;
      renderEnglish();
    });
  }
}

function renderHanzi() {
  const item = hanziCharacters[hanziIndex];
  hanziPanel.innerHTML = `
    <div class="hanzi-layout">
      <div class="hanzi-rail" aria-label="汉字列表">
        ${hanziCharacters.map((entry, index) => `<button class="hanzi-chip ${index === hanziIndex ? "is-active" : ""} ${isComplete("hanzi", entry.char) ? "is-complete" : ""}" type="button" data-hanzi-index="${index}" aria-label="学习汉字 ${entry.char}">${entry.char}</button>`).join("")}
      </div>
      <div class="hanzi-stage-wrap">
        <div class="hanzi-stage"><div id="characterTarget" aria-label="汉字 ${item.char} 笔顺练习"></div></div>
      </div>
      <div class="hanzi-detail">
        <div>
          <p class="hanzi-pinyin">${item.pinyin}</p>
          <h2 class="hanzi-big-char">${item.char}</h2>
          <p class="hanzi-word">${item.word}</p>
        </div>
        <p class="hanzi-tip">${item.tip}</p>
        <div class="hanzi-actions">
          <button class="quiet-button" id="playStrokes" type="button">
            <i data-lucide="play" aria-hidden="true"></i>
            <span>看笔顺</span>
          </button>
          <button class="quiet-button" id="quizStrokes" type="button">
            <i data-lucide="pencil" aria-hidden="true"></i>
            <span>描一描</span>
          </button>
          <button class="audio-button" id="hanziAudio" type="button" aria-label="朗读 ${item.char}">
            <i data-lucide="volume-2" aria-hidden="true"></i>
          </button>
          <button class="mark-button ${isComplete("hanzi", item.char) ? "is-complete" : ""}" id="markHanzi" type="button">
            <i data-lucide="check" aria-hidden="true"></i>
            <span>${isComplete("hanzi", item.char) ? "已经学会" : "我学会了"}</span>
          </button>
        </div>
      </div>
    </div>
    ${renderLessonFooter("hanzi", hanziCharacters, hanziIndex, "char")}
  `;
  refreshIcons();
  bindHanziActions();
  requestAnimationFrame(initHanziWriter);
  updateLessonHeader();
}

function initHanziWriter() {
  const item = hanziCharacters[hanziIndex];
  const target = document.querySelector("#characterTarget");
  if (!target || !window.HanziWriter) return;
  const stage = target.parentElement;
  const size = Math.max(200, Math.min(stage.clientWidth - 28, stage.clientHeight - 28, 510));
  hanziWriter = HanziWriter.create("characterTarget", item.char, {
    width: size,
    height: size,
    padding: 8,
    showOutline: true,
    showCharacter: false,
    strokeColor: "#17324d",
    radicalColor: "#4fa56e",
    highlightColor: "#f36f59",
    drawingColor: "#f36f59",
    drawingWidth: 24,
    charDataLoader: (char, onComplete, onError) => {
      fetch(`./assets/hanzi/${encodeURIComponent(char)}.json`)
        .then((response) => {
          if (!response.ok) throw new Error(`Hanzi data unavailable: ${char}`);
          return response.json();
        })
        .then(onComplete)
        .catch(onError);
    }
  });
  window.setTimeout(() => hanziWriter.animateCharacter(), 260);
}

function bindHanziActions() {
  document.querySelectorAll("[data-hanzi-index]").forEach((button) => {
    button.addEventListener("click", () => {
      hanziIndex = Number(button.dataset.hanziIndex);
      renderHanzi();
    });
  });

  document.querySelector("#playStrokes")?.addEventListener("click", () => {
    hanziWriter?.animateCharacter();
  });

  document.querySelector("#quizStrokes")?.addEventListener("click", () => {
    if (!hanziWriter) return;
    hanziWriter.quiz({
      onComplete: () => {
        const item = hanziCharacters[hanziIndex];
        if (!isComplete("hanzi", item.char)) markComplete("hanzi", item.char);
        renderHanzi();
      }
    });
  });

  document.querySelector("#hanziAudio")?.addEventListener("click", () => {
    const item = hanziCharacters[hanziIndex];
    playCourseAudio(item.audio, item.char, "zh-CN");
  });

  document.querySelector("#markHanzi")?.addEventListener("click", () => {
    const item = hanziCharacters[hanziIndex];
    if (isComplete("hanzi", item.char)) {
      showToast("这个汉字已经学会了", false);
      return;
    }
    markComplete("hanzi", item.char);
    window.setTimeout(() => {
      hanziIndex = (hanziIndex + 1) % hanziCharacters.length;
      renderHanzi();
    }, 520);
  });

  bindGenericLessonNav("hanzi", hanziCharacters, (index) => {
    hanziIndex = index;
    renderHanzi();
  }, "char");
}

function renderLessonFooter(course, items, currentIndex, idKey = "id") {
  return `
    <div class="lesson-footer">
      <button class="nav-button" type="button" data-nav="${course}-prev">
        <i data-lucide="chevron-left" aria-hidden="true"></i>
        <span>上一张</span>
      </button>
      <div class="card-dots" aria-label="学习进度">
        ${items.map((item, index) => `<button class="card-dot ${index === currentIndex ? "is-current" : ""} ${isComplete(course, item[idKey]) ? "is-complete" : ""}" type="button" data-dot-course="${course}" data-dot-index="${index}" aria-label="第 ${index + 1} 张"></button>`).join("")}
      </div>
      <button class="nav-button" type="button" data-nav="${course}-next">
        <span>下一张</span>
        <i data-lucide="chevron-right" aria-hidden="true"></i>
      </button>
    </div>
  `;
}

function bindGenericLessonNav(course, items, setIndex, idKey = "id") {
  document.querySelector(`[data-nav="${course}-prev"]`)?.addEventListener("click", () => {
    setIndex((getCurrentIndex(course) + items.length - 1) % items.length);
  });
  document.querySelector(`[data-nav="${course}-next"]`)?.addEventListener("click", () => {
    setIndex((getCurrentIndex(course) + 1) % items.length);
  });
  document.querySelectorAll(`[data-dot-course="${course}"]`).forEach((button) => {
    button.addEventListener("click", () => setIndex(Number(button.dataset.dotIndex)));
  });
}

function getCurrentIndex(course) {
  if (course === "pinyin") return pinyinIndex;
  if (course === "english") return englishIndex;
  return hanziIndex;
}

function markComplete(course, id) {
  ensureToday();
  if (isComplete(course, id)) return;
  state.completed[course].push(id);
  if (state.today.date === localDateKey()) state.today.count += 1;
  else state.today = { date: localDateKey(), count: 1 };
  saveState();
  playChime();
  showToast("又学会了一张小卡！", true);
  updateHome();
}

function showToast(message, isReward = true) {
  window.clearTimeout(toastTimer);
  toastText.textContent = message;
  toast.querySelector("img").style.display = isReward ? "block" : "none";
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2300);
}

function playCourseAudio(audioName, fallbackText, language) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  const audio = new Audio(audioUrl(audioName));
  audio.playbackRate = state.voiceRate;
  currentAudio = audio;
  audio.play().catch(() => speakText(fallbackText, language));
}

function speakText(text, language) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = state.voiceRate;
  utterance.pitch = 1.08;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) => voice.lang === language)
    || voices.find((voice) => voice.lang.startsWith(language.split("-")[0]));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

function playChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, context.currentTime + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, context.currentTime + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index * 0.08 + 0.24);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + index * 0.08);
      oscillator.stop(context.currentTime + index * 0.08 + 0.28);
    });
   window.setTimeout(() => context.close(), 700);
  } catch {
    // Sound is a bonus, never a dependency.
  }
}

function openParentDialog() {
  document.querySelector("#voiceRate").value = state.voiceRate;
  document.querySelector("#voiceRateLabel").textContent = `${state.voiceRate.toFixed(2)}×`;
  document.querySelector("#dailyTarget").value = String(state.dailyTarget);
  if (typeof parentDialog.showModal === "function") parentDialog.showModal();
  else parentDialog.setAttribute("open", "");
}

function closeParentDialog() {
  if (typeof parentDialog.close === "function") parentDialog.close();
  else parentDialog.removeAttribute("open");
}

function initEvents() {
  document.querySelector("#brandHome").addEventListener("click", showHome);
  document.querySelector("#backHome").addEventListener("click", showHome);
  document.querySelector("#startDaily").addEventListener("click", () => openCourse(nextCourse()));
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => openCourse(button.dataset.open, { reset: button.dataset.open === "pinyin" }));
  });
  document.querySelector("#parentBtn").addEventListener("click", openParentDialog);
  document.querySelector("#closeParent").addEventListener("click", closeParentDialog);
  document.querySelector("#saveParent").addEventListener("click", () => {
    state.voiceRate = Number(document.querySelector("#voiceRate").value);
    state.dailyTarget = Number(document.querySelector("#dailyTarget").value);
    saveState();
    updateHome();
    closeParentDialog();
    showToast("学习节奏保存好了", false);
  });
  document.querySelector("#voiceRate").addEventListener("input", (event) => {
    document.querySelector("#voiceRateLabel").textContent = `${Number(event.target.value).toFixed(2)}×`;
  });
  document.querySelector("#resetProgress").addEventListener("click", () => {
    state.completed = { pinyin: [], english: [], hanzi: [] };
    state.today = { date: localDateKey(), count: 0 };
    pinyinIndex = 0;
    englishIndex = 0;
    hanziIndex = 0;
    saveState();
    updateHome();
    closeParentDialog();
    showToast("学习记录已清空", false);
  });
  window.addEventListener("hashchange", () => {
    const course = location.hash.replace("#", "");
    if (courseConfig[course]) openCourse(course);
    else showHome();
  });
}

function init() {
  if (window.lucide) {
    refreshIcons();
    window.lucide.createIcons({ attrs: { "stroke-width": 2.4 } });
  }
  initEvents();
  updateHome();
  const initialCourse = location.hash.replace("#", "");
  if (courseConfig[initialCourse]) openCourse(initialCourse);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

init();
