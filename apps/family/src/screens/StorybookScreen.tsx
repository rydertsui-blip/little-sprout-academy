import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, Lock, Pause, Play, Sparkles, Star, Volume2 } from "lucide-react";
import { READ_ALONG_STORYBOOKS, type ReadAlongStorybook, type StorybookPage } from "../content/storybooks";
import { playOrSpeak, stopAudio } from "../lib/audio";
import { playSfx } from "../lib/sfx";
import { ConfettiBurst } from "./ConfettiBurst";
import type { ChildProfile } from "../lib/types";
import type { Locale } from "../content/copy";

interface StorybookScreenProps {
  child: ChildProfile;
  locale: Locale;
  onBack: () => void;
  onLock: () => void | Promise<void>;
  onCompleteBook: (eventKey: string) => Promise<number>;
}

function StorySpreadArt({ page, accent }: { page: StorybookPage; accent: string }) {
  const isNight = ["lantern-river", "moon-bridge", "star-sleep"].includes(page.sceneTheme);
  const isOcean = ["blue-ocean", "rain-river", "watering-pot"].includes(page.sceneTheme);
  const bgTop = isNight ? "#1e2952" : isOcean ? "#cbe8f8" : "#fdf4dc";
  const bgBottom = isNight ? "#334785" : isOcean ? "#8fd0f2" : "#d9f0d1";

  if (page.image) {
    return (
      <div className="storybook-spread-illustration has-art" style={{ "--book-accent": accent } as React.CSSProperties}>
        <img className="storybook-scene-art" src={`./assets/images/${page.image}.png`} alt="" />
      </div>
    );
  }

  return (
    <div className="storybook-spread-illustration" style={{ "--book-accent": accent } as React.CSSProperties}>
      <svg viewBox="0 0 480 260" className="storybook-scene-svg" aria-hidden="true">
        <defs>
          <linearGradient id={`grad-${page.id}-${page.sceneTheme}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={bgTop} />
            <stop offset="100%" stopColor={bgBottom} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="480" height="260" rx="22" fill={`url(#grad-${page.id}-${page.sceneTheme})`} />
        {isNight ? (
          <>
            <circle cx="84" cy="58" r="24" fill="#ffe680" opacity="0.9" />
            <circle cx="94" cy="52" r="20" fill={bgTop} />
            <circle cx="380" cy="48" r="3" fill="#fff4b8" />
            <circle cx="290" cy="70" r="2.5" fill="#fff4b8" />
            <circle cx="195" cy="44" r="3.5" fill="#fff4b8" />
            <path d="M0 198 Q120 172 240 196 T480 190 L480 260 L0 260 Z" fill="#253569" />
          </>
        ) : (
          <>
            <circle cx="405" cy="56" r="28" fill="#ffd166" opacity="0.88" />
            <ellipse cx="115" cy="58" rx="38" ry="16" fill="#ffffff" opacity="0.85" />
            <ellipse cx="140" cy="54" rx="28" ry="14" fill="#ffffff" opacity="0.9" />
            <path d="M0 194 Q130 162 260 192 T480 184 L480 260 L0 260 Z" fill={isOcean ? "#5aa9e6" : "#8ac97e"} />
            <path d="M0 218 Q160 192 320 218 T480 212 L480 260 L0 260 Z" fill={isOcean ? "#3c8dad" : "#67b25c"} />
          </>
        )}
      </svg>
      <div className="storybook-scene-emojis" aria-hidden="true">
        {Array.from(page.illustrationEmoji).map((ch, idx) => (
          <span key={idx} className={`scene-emoji-actor actor-${idx}`}>{ch}</span>
        ))}
      </div>
    </div>
  );
}

export default function StorybookScreen({
  child,
  locale,
  onBack,
  onLock,
  onCompleteBook
}: StorybookScreenProps) {
  const en = locale === "en";
  const [filterLang, setFilterLang] = useState<"all" | "zh" | "en">("all");
  const [activeBook, setActiveBook] = useState<ReadAlongStorybook | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number | null>(null);
  const [isAutoReading, setIsAutoReading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [awardedStars, setAwardedStars] = useState(0);
  const autoReadVersionRef = useRef(0);

  useEffect(() => () => {
    autoReadVersionRef.current += 1;
    stopAudio();
  }, []);

  const completedBookKeys = new Set(
    child.rewards.awardedEventKeys.filter((k) => k.startsWith("storybook:")).map((k) => k.replace("storybook:", ""))
  );

  const visibleBooks = READ_ALONG_STORYBOOKS.filter(
    (b) => filterLang === "all" || b.language === filterLang
  );

  function openBook(book: ReadAlongStorybook) {
    playSfx("page-turn");
    autoReadVersionRef.current += 1;
    setActiveBook(book);
    setPageIndex(0);
    setActiveSentenceIdx(null);
    setIsAutoReading(false);
    setShowQuiz(false);
    setQuizAnswer(null);
    setQuizCorrect(false);
    setAwardedStars(0);
    playOrSpeak(book.introAudio, book.language === "zh" ? "zh-CN" : "en-US");
  }

  function stopAutoRead() {
    autoReadVersionRef.current += 1;
    setIsAutoReading(false);
    setActiveSentenceIdx(null);
    stopAudio();
  }

  function startAutoReadPage(book: ReadAlongStorybook, page: StorybookPage) {
    const version = ++autoReadVersionRef.current;
    setIsAutoReading(true);

    const readNext = (idx: number) => {
      if (version !== autoReadVersionRef.current) return;
      const sentence = page.sentences[idx];
      if (!sentence) {
        setIsAutoReading(false);
        setActiveSentenceIdx(null);
        return;
      }
      setActiveSentenceIdx(idx);
      playSfx("pop");
      playOrSpeak(sentence.audioText, sentence.audioLanguage, (status) => {
        if (version !== autoReadVersionRef.current) return;
        if (status === "ended" || status === "error") {
          window.setTimeout(() => readNext(idx + 1), 260);
        }
      });
    };

    readNext(0);
  }

  function handleTapSentence(page: StorybookPage, idx: number) {
    autoReadVersionRef.current += 1;
    setIsAutoReading(false);
    setActiveSentenceIdx(idx);
    const sentence = page.sentences[idx];
    if (!sentence) return;
    playSfx("pop");
    playOrSpeak(sentence.audioText, sentence.audioLanguage, (status) => {
      if (status === "ended" || status === "error") {
        setActiveSentenceIdx((curr) => (curr === idx ? null : curr));
      }
    });
  }

  function goToPage(nextIdx: number) {
    if (!activeBook) return;
    stopAutoRead();
    playSfx("page-turn");
    if (nextIdx >= activeBook.pages.length) {
      setShowQuiz(true);
      playOrSpeak(activeBook.quiz.audioText, activeBook.quiz.audioLanguage);
      return;
    }
    setShowQuiz(false);
    setPageIndex(Math.max(0, nextIdx));
  }

  async function handleQuizOption(option: string) {
    if (!activeBook || quizCorrect) return;
    setQuizAnswer(option);
    if (option === activeBook.quiz.correctAnswer) {
      setQuizCorrect(true);
      playSfx("combo");
      playOrSpeak(activeBook.completionAudio, activeBook.language === "zh" ? "zh-CN" : "en-US");
      const stars = await onCompleteBook(`storybook:${activeBook.id}`);
      setAwardedStars(stars);
    } else {
      playSfx("gentle-retry");
      playOrSpeak(activeBook.quiz.explanation, activeBook.quiz.audioLanguage);
    }
  }

  const currentPage = activeBook ? activeBook.pages[pageIndex] : null;

  return (
    <div className="app-shell">
      <ConfettiBurst active={quizCorrect} triggerKey={activeBook?.id} />
      <header className="app-header">
        <button
          className="brand-button"
          type="button"
          onClick={() => {
            stopAutoRead();
            if (activeBook) {
              setActiveBook(null);
            } else {
              onBack();
            }
          }}
        >
          <ArrowLeft aria-hidden="true" />
          <span className="brand-copy">
            <strong>{activeBook ? activeBook.title : en ? "Sprout Bilingual Storybooks" : "小芽双语有声绘本馆"}</strong>
            <small>{activeBook ? activeBook.subtitle : en ? "Tap-to-read & Karaoke read-along" : "逐句高亮伴读 · 点句即读 · 绘本小问答"}</small>
          </span>
        </button>
        <div className="header-tools">
          <div className="header-badge" data-testid="storybook-star-badge">
            <Star aria-hidden="true" />
            <span>{en ? `${child.rewards.lifetimeStars} Stars` : `${child.rewards.lifetimeStars} 颗成长星`}</span>
          </div>
          <button className="icon-button" type="button" onClick={() => void onLock()} aria-label={en ? "Lock" : "锁定"}>
            <Lock aria-hidden="true" />
          </button>
        </div>
      </header>

      {!activeBook ? (
        <main className="storybook-library-screen" data-testid="storybook-library">
          <section className="storybook-library-hero">
            <div className="storybook-hero-copy">
              <span className="eyebrow">{en ? "Interactive Read-Along Library" : "双语分级点读绘本馆"}</span>
              <h1>{en ? "Listen, Tap & Read Along with Sprout!" : "跟着小芽老师，逐句点读看绘本！"}</h1>
              <p>
                {en
                  ? "Every storybook supports full-page read-along with sentence highlighting, tap-any-sentence audio, phonics/pinyin word cards, and a star quiz at the end."
                  : "每本绘本都支持「老师逐句高亮伴读」「点哪句读哪句」「重点字词拼音/自然拼读拆解」与尾页闯关赢成长星。"}
              </p>
            </div>
            <div className="storybook-filter-pills" role="tablist" aria-label={en ? "Language filter" : "语言筛选"}>
              <button
                type="button"
                role="tab"
                aria-selected={filterLang === "all"}
                className={`quiet-button compact-button ${filterLang === "all" ? "is-selected" : ""}`}
                onClick={() => setFilterLang("all")}
              >
                {en ? "All Books (6)" : "全部绘本 (6)"}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterLang === "zh"}
                className={`quiet-button compact-button ${filterLang === "zh" ? "is-selected" : ""}`}
                onClick={() => setFilterLang("zh")}
              >
                {en ? "Mandarin Pinyin (3)" : "华文注音绘本 (3)"}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterLang === "en"}
                className={`quiet-button compact-button ${filterLang === "en" ? "is-selected" : ""}`}
                onClick={() => setFilterLang("en")}
              >
                {en ? "English Phonics (3)" : "英文自然拼读绘本 (3)"}
              </button>
            </div>
          </section>

          <section className="storybook-shelf-grid">
            {visibleBooks.map((book) => {
              const isDone = completedBookKeys.has(book.id);
              return (
                <button
                  key={book.id}
                  type="button"
                  className={`storybook-cover-card ${isDone ? "is-completed" : ""}`}
                  data-testid={`storybook-card-${book.id}`}
                  style={{ "--cover-accent": book.coverAccent } as React.CSSProperties}
                  onClick={() => openBook(book)}
                >
                  <div className="storybook-cover-art">
                    <span className="storybook-level-tag">{book.level}</span>
                    {isDone ? (
                      <span className="storybook-done-pill" data-testid={`storybook-done-${book.id}`}>
                        <Check aria-hidden="true" />
                        {en ? "Read" : "已读完"}
                      </span>
                    ) : null}
                    {book.coverImage ? (
                      <img className="storybook-cover-image" src={`./assets/images/${book.coverImage}.png`} alt="" />
                    ) : (
                      <div className="storybook-cover-emoji" aria-hidden="true">{book.coverEmoji}</div>
                    )}
                  </div>
                  <div className="storybook-cover-copy">
                    <small>{book.subtitle}</small>
                    <strong>{book.title}</strong>
                    <span className="storybook-open-cta">
                      <BookOpen aria-hidden="true" />
                      {en ? `Read ${book.pages.length} Pages` : `翻开阅读（共 ${book.pages.length} 页）`}
                    </span>
                  </div>
                </button>
              );
            })}
          </section>
        </main>
      ) : (
        <main className="storybook-reader-screen" data-testid="storybook-reader">
          {!showQuiz && currentPage ? (
            <section className="storybook-open-spread" data-testid="storybook-page-spread">
              <div className="storybook-spread-left">
                <StorySpreadArt page={currentPage} accent={activeBook.coverAccent} />
                <div className="storybook-page-indicator">
                  <span>{en ? `Page ${pageIndex + 1} of ${activeBook.pages.length}` : `第 ${pageIndex + 1} / ${activeBook.pages.length} 页`}</span>
                  <button
                    type="button"
                    className="primary-button compact-button"
                    data-testid="storybook-autoread-btn"
                    onClick={() => {
                      if (isAutoReading) stopAutoRead();
                      else startAutoReadPage(activeBook, currentPage);
                    }}
                  >
                    {isAutoReading ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                    {isAutoReading
                      ? (en ? "Stop Read-Along" : "暂停伴读")
                      : (en ? "Teacher Read-Along" : "老师逐句伴读")}
                  </button>
                </div>
              </div>

              <div className="storybook-spread-right">
                <div className="storybook-sentences-box">
                  <p className="eyebrow">{en ? "Tap any sentence to listen" : "点一点任意句子，听老师朗读"}</p>
                  {currentPage.sentences.map((sentence, idx) => {
                    const isHighlighted = activeSentenceIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`storybook-sentence-card ${isHighlighted ? "is-reading" : ""}`}
                        data-testid={`story-sentence-${idx}`}
                        onClick={() => handleTapSentence(currentPage, idx)}
                      >
                        <div className="storybook-sentence-main">
                          <Volume2 aria-hidden="true" className="sentence-audio-icon" />
                          <div>
                            {sentence.subtext ? <small className="sentence-subtext">{sentence.subtext}</small> : null}
                            <strong className="sentence-text">{sentence.text}</strong>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="storybook-keywords-box">
                  <span className="section-label">{en ? "Key Words & Phonics / Pinyin" : "本页重点字词拆解（点击发音）"}</span>
                  <div className="storybook-keyword-chips">
                    {currentPage.keywords.map((kw) => (
                      <button
                        key={kw.word}
                        type="button"
                        className="storybook-keyword-chip"
                        data-testid={`story-kw-${kw.word}`}
                        onClick={() => {
                          playSfx("pop");
                          playOrSpeak(kw.audioText, kw.audioLanguage);
                        }}
                      >
                        <strong>{kw.word}</strong>
                        <em>{kw.phonetic}</em>
                        <small>{kw.meaning}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="storybook-nav-footer">
                  <button
                    type="button"
                    className="quiet-button compact-button"
                    disabled={pageIndex === 0}
                    onClick={() => goToPage(pageIndex - 1)}
                  >
                    <ChevronLeft aria-hidden="true" />
                    {en ? "Previous Page" : "上一页"}
                  </button>
                  <button
                    type="button"
                    className="primary-button compact-button"
                    data-testid="storybook-next-page-btn"
                    onClick={() => goToPage(pageIndex + 1)}
                  >
                    {pageIndex + 1 < activeBook.pages.length
                      ? (en ? "Next Page" : "下一页")
                      : (en ? "Story Quiz & Star" : "去答绘本小问答")}
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="storybook-quiz-card" data-testid="storybook-quiz">
              <div className="storybook-quiz-header">
                <span className="eyebrow">{en ? "Storybook Check" : "绘本阅读小问答"}</span>
                <h2>{activeBook.quiz.prompt}</h2>
                <button
                  type="button"
                  className="quiet-button compact-button"
                  onClick={() => playOrSpeak(activeBook.quiz.audioText, activeBook.quiz.audioLanguage)}
                >
                  <Volume2 aria-hidden="true" />
                  {en ? "Listen to Question" : "听题目"}
                </button>
              </div>

              <div className="storybook-quiz-options">
                {activeBook.quiz.options.map((opt) => {
                  const isChosen = quizAnswer === opt;
                  const stateClass = isChosen ? (quizCorrect ? "is-correct" : "is-wrong") : "";
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`answer-option ${stateClass}`}
                      data-testid={`storybook-quiz-opt-${opt}`}
                      onClick={() => void handleQuizOption(opt)}
                    >
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {quizAnswer ? (
                <div className={`answer-feedback ${quizCorrect ? "correct-feedback" : "wrong-feedback"}`} data-testid="storybook-quiz-feedback">
                  <strong>
                    {quizCorrect
                      ? (en ? "🎉 Spot on! You finished the storybook!" : "🎉 答对啦！你完整读完了这本绘本！")
                      : (en ? "💡 Let's think about the story again:" : "💡 别急，回想一下故事里的画面：")}
                  </strong>
                  <p>{activeBook.quiz.explanation}</p>
                  {quizCorrect ? (
                    <div className="storybook-reward-banner">
                      <Sparkles aria-hidden="true" />
                      <span>
                        {awardedStars > 0
                          ? (en ? `+${awardedStars} Growth Star earned!` : `获得 +${awardedStars} 颗成长星奖励！`)
                          : (en ? "Book completed! Great job reviewing!" : "已完成绘本阅读打卡！")}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="storybook-nav-footer">
                <button
                  type="button"
                  className="quiet-button compact-button"
                  onClick={() => {
                    setShowQuiz(false);
                    setPageIndex(activeBook.pages.length - 1);
                  }}
                >
                  <ChevronLeft aria-hidden="true" />
                  {en ? "Back to Story" : "看上一页故事"}
                </button>
                <button
                  type="button"
                  className="primary-button compact-button"
                  data-testid="storybook-finish-back-btn"
                  onClick={() => {
                    stopAutoRead();
                    setActiveBook(null);
                  }}
                >
                  {en ? "Back to Bookshelf" : "返回绘本书架"}
                </button>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}
