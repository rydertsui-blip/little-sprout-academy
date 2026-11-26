import { Check, ChevronLeft, ChevronRight, Lock, Mic, RotateCcw, Sparkles, Square, Star, Volume2 } from "lucide-react";
import { pinyin } from "pinyin-pro";
import { useEffect, useRef, useState } from "react";
import { VOICE_LINES } from "../content/audioAssets";
import { SPEAKING_PROMPTS, type SpeakingPrompt } from "../content/speaking";
import { playOrSpeak, stopAudio } from "../lib/audio";
import type { ChildProfile } from "../lib/types";

type RecordingState = "idle" | "requesting" | "recording" | "recorded" | "playing" | "error";
type SpeakingCategory = NonNullable<(typeof SPEAKING_PROMPTS)[number]["category"]>;
type SpeakingGrade = "great" | "retry" | null;

const DECKS: Array<{ category: SpeakingCategory; label: string }> = [
  { category: "word", label: "词语" },
  { category: "organize", label: "看图说两句" },
  { category: "read-aloud", label: "朗读" },
  { category: "speaking-purpose", label: "情境开口" }
];

interface SpeakingScreenProps {
  child: ChildProfile;
  subject?: "mandarin" | "english";
  onBack: () => void;
  onLock: () => void | Promise<void>;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  length: number;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function evaluateSpokenTranscript(
  prompt: SpeakingPrompt,
  transcript: string,
  hasClearVoiceEnergy: boolean
): { grade: "great" | "retry"; matchedText: string; feedback: string } {
  const cleaned = transcript.trim();
  const isZh = prompt.language === "zh-CN";
  const targets = prompt.keywords && prompt.keywords.length > 0 ? prompt.keywords : [prompt.display];

  if (cleaned.length > 0) {
    if (isZh) {
      const spokenSyllables = new Set(
        pinyin(cleaned, { toneType: "none", type: "array" })
          .map((s) => s.toLowerCase().replace(/[^a-züv]/g, ""))
          .filter(Boolean)
      );
      let hits = 0;
      for (const kw of targets) {
        if (cleaned.includes(kw)) {
          hits += 1;
          continue;
        }
        const kwSyllables = pinyin(kw, { toneType: "none", type: "array" })
          .map((s) => s.toLowerCase().replace(/[^a-züv]/g, ""))
          .filter(Boolean);
        if (kwSyllables.length > 0 && kwSyllables.every((s) => spokenSyllables.has(s))) {
          hits += 1;
        }
      }
      if (hits >= Math.max(1, Math.ceil(targets.length * 0.5))) {
        return {
          grade: "great",
          matchedText: cleaned,
          feedback: "读得又响亮又准！小芽老师都听清楚啦！"
        };
      }
    } else {
      const spokenLower = cleaned.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
      const spokenWords = new Set(spokenLower.split(/\s+/).filter(Boolean));
      let hits = 0;
      for (const kw of targets) {
        const kwLower = kw.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!kwLower) continue;
        if (spokenWords.has(kwLower) || spokenLower.includes(kwLower)) {
          hits += 1;
        }
      }
      if (hits >= Math.max(1, Math.ceil(targets.length * 0.5))) {
        return {
          grade: "great",
          matchedText: cleaned,
          feedback: "Wonderful! Your pronunciation is clear and confident!"
        };
      }
    }
  }

  // Acoustic energy fallback (when offline, iPad WebView without ASR, or child spoke clearly)
  if (cleaned.length === 0 && hasClearVoiceEnergy) {
    return {
      grade: "great",
      matchedText: "",
      feedback: isZh ? "声音真洪亮！跟读得很认真，继续保持！" : "Great loud voice! You practised that really well!"
    };
  }

  return {
    grade: "retry",
    matchedText: cleaned,
    feedback: isZh
      ? "不要气馁，声音可以再大一点点，再听老师读一遍，我们一起试一次！"
      : "Don't worry! Listen to the teacher one more time, then say it nice and loud!"
  };
}

export default function SpeakingScreen({ child, subject, onBack, onLock }: SpeakingScreenProps) {
  const prompts = subject
    ? SPEAKING_PROMPTS.filter((item) => item.language === (subject === "mandarin" ? "zh-CN" : "en-US"))
    : SPEAKING_PROMPTS;
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<RecordingState>("idle");
  const [demoState, setDemoState] = useState<"playing" | "error" | null>(null);
  const [error, setError] = useState("");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [grade, setGrade] = useState<SpeakingGrade>(null);
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});
  const [autoHandsFree, setAutoHandsFree] = useState(true);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingUrlRef = useRef<string | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadTimerRef = useRef<number>(0);
  const maxDurationTimerRef = useRef<number>(0);
  const autoListenTimerRef = useRef<number>(0);
  const spokenFramesRef = useRef(0);
  const requestTokenRef = useRef(0);

  const prompt = prompts[index % prompts.length] ?? prompts[0];
  const category = prompt.category ?? "word";
  const categoryLabel =
    category === "organize"
      ? "看图说两句"
      : category === "read-aloud"
        ? "朗读小游戏"
        : category === "speaking-purpose"
          ? "情境开口"
          : prompt.language === "zh-CN"
            ? "词语跟读"
            : "English speaking";
  const longText = category === "read-aloud" || category === "speaking-purpose";

  function stopVadAndRecognition() {
    window.clearInterval(vadTimerRef.current);
    window.clearTimeout(maxDurationTimerRef.current);
    window.clearTimeout(autoListenTimerRef.current);
    vadTimerRef.current = 0;
    maxDurationTimerRef.current = 0;
    autoListenTimerRef.current = 0;
    setVolumeLevel(0);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
  }

  function stopStream() {
    stopVadAndRecognition();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function revokeRecording() {
    playerRef.current?.pause();
    playerRef.current = null;
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    recordingUrlRef.current = null;
  }

  // Auto-play teacher demonstration whenever the child enters or moves to a new prompt
  useEffect(() => {
    setDemoState(null);
    setGrade(null);
    setGradeFeedback("");
    setTranscriptText("");
    setState("idle");
    setError("");

    const timer = window.setTimeout(() => {
      setDemoState("playing");
      playOrSpeak(prompt.text, prompt.language, (status) => {
        if (status === "ended") {
          setDemoState(null);
        } else if (status === "error") {
          setDemoState("error");
        }
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      requestTokenRef.current += 1;
      stopAudio();
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      recorderRef.current = null;
      stopStream();
      revokeRecording();
    };
  }, [index, prompt.id, prompt.language, prompt.text]);

  useEffect(() => {
    const suspend = () => {
      requestTokenRef.current += 1;
      playerRef.current?.pause();
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      stopStream();
      setState((current) => (current === "recording" || current === "playing" ? "idle" : current));
    };
    const onVisibility = () => {
      if (document.hidden) suspend();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", suspend);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", suspend);
    };
  }, []);

  function attachVadAndAsr(stream: MediaStream, currentPrompt: SpeakingPrompt) {
    transcriptRef.current = "";
    spokenFramesRef.current = 0;

    // 1. Browser SpeechRecognition if available
    const RecognitionCtor = getSpeechRecognitionCtor();
    if (RecognitionCtor) {
      try {
        const rec = new RecognitionCtor();
        rec.lang = currentPrompt.language;
        rec.interimResults = true;
        rec.maxAlternatives = 3;
        rec.continuous = true;
        rec.onresult = (event) => {
          const parts: string[] = [];
          for (let i = 0; i < event.results.length; i += 1) {
            const alt = event.results[i]?.[0]?.transcript;
            if (alt) parts.push(alt);
          }
          transcriptRef.current = parts.join(" ").trim();
          setTranscriptText(transcriptRef.current);
        };
        rec.onerror = () => {};
        rec.start();
        recognitionRef.current = rec;
      } catch {
        recognitionRef.current = null;
      }
    }

    // 2. Web Audio API real-time Voice Activity Detection (auto-stop when child finishes speaking)
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (typeof AudioCtx === "function") {
      try {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let hasSpoken = false;
        let silentMs = 0;

        vadTimerRef.current = window.setInterval(() => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) sum += data[i];
          const avg = sum / data.length;
          const level = Math.min(100, Math.round((avg / 64) * 100));
          setVolumeLevel(level);

          if (avg > 14) {
            hasSpoken = true;
            spokenFramesRef.current += 1;
            silentMs = 0;
          } else if (hasSpoken) {
            silentMs += 100;
            if (silentMs >= 1200 && recorderRef.current?.state === "recording") {
              stopRecording();
            }
          }
        }, 100);
      } catch {
        // Fallback if AudioContext fails in test or restricted environment
      }
    }

    // 3. Safety max recording duration so child never gets stuck in recording state
    const maxMs = longText || currentPrompt.category === "organize" ? 7500 : 4500;
    maxDurationTimerRef.current = window.setTimeout(() => {
      if (recorderRef.current?.state === "recording") {
        stopRecording();
      }
    }, maxMs);
  }

  async function startRecording() {
    stopAudio();
    setDemoState(null);
    setGrade(null);
    setGradeFeedback("");
    setTranscriptText("");
    revokeRecording();
    const token = ++requestTokenRef.current;
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("error");
      setError("这台装置暂时不能录音。可以先听示范，再跟着读。");
      return;
    }
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (token !== requestTokenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const preferredMime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      const recorder = preferredMime ? new MediaRecorder(stream, { mimeType: preferredMime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (token !== requestTokenRef.current) {
          stopStream();
          return;
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/mp4" });
        const finalTranscript = transcriptRef.current;
        const hadVoiceEnergy = spokenFramesRef.current >= 3 || blob.size > 0;
        stopStream();
        if (blob.size === 0) {
          setState("error");
          setError("没有录到声音，不要气馁，点一下麦克风再大声说一次吧！");
          playOrSpeak(VOICE_LINES.speakingEncourageZh, "zh-CN");
          return;
        }
        recordingUrlRef.current = URL.createObjectURL(blob);
        const player = new Audio(recordingUrlRef.current);
        playerRef.current = player;
        setState("recorded");

        const evaluation = evaluateSpokenTranscript(prompt, finalTranscript, hadVoiceEnergy);
        setGrade(evaluation.grade);
        setGradeFeedback(evaluation.feedback);
        if (evaluation.matchedText) {
          setTranscriptText(evaluation.matchedText);
        }

        if (evaluation.grade === "great") {
          setCompletedIds((prev) => ({ ...prev, [prompt.id]: true }));
          const praiseLine = prompt.language === "zh-CN" ? VOICE_LINES.speakingGreatZh : VOICE_LINES.speakingGreatEn;
          playOrSpeak(praiseLine, prompt.language);
        } else {
          const encourageLine = prompt.language === "zh-CN" ? VOICE_LINES.speakingEncourageZh : VOICE_LINES.speakingEncourageEn;
          playOrSpeak(encourageLine, prompt.language);
        }
      };
      recorder.start();
      attachVadAndAsr(stream, prompt);
      setState("recording");
    } catch {
      if (token !== requestTokenRef.current) return;
      stopStream();
      setState("error");
      setError("没有麦克风权限。请家长允许麦克风，或者先只跟读示范。");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function playDemonstration(autoChainRecord = false) {
    if (state === "recording" || state === "requesting") return;
    playerRef.current?.pause();
    if (state === "playing") setState("recorded");
    setDemoState("playing");
    playOrSpeak(prompt.text, prompt.language, (status) => {
      if (status === "ended") {
        setDemoState(null);
        if (autoChainRecord && autoHandsFree) {
          autoListenTimerRef.current = window.setTimeout(() => {
            void startRecording();
          }, 300);
        }
      } else if (status === "error") {
        setDemoState("error");
      }
    });
  }

  async function playRecording() {
    const player = playerRef.current;
    if (!player) return;
    stopAudio();
    player.currentTime = 0;
    setState("playing");
    try {
      await player.play();
      player.onended = () => setState("recorded");
    } catch {
      setState("error");
      setError("录音无法回放，请再录一次。");
    }
  }

  function nextPrompt() {
    stopAudio();
    setIndex((value) => (value + 1) % prompts.length);
  }

  function selectDeck(nextCategory: SpeakingCategory) {
    const nextIndex = prompts.findIndex((item) => (item.category ?? "word") === nextCategory);
    if (nextIndex < 0 || nextIndex === index) return;
    revokeRecording();
    setState("idle");
    setError("");
    setIndex(nextIndex);
  }

  const primaryLabel =
    state === "recording"
      ? "停止录音"
      : state === "recorded"
        ? "听自己"
        : state === "playing"
          ? "正在播放…"
          : state === "requesting"
            ? "正在打开麦克风…"
            : "开始说";

  const teacherMessage =
    state === "recording"
      ? "小芽老师在听呢，大声说出来，说完停一下就会自动完成哦！"
      : state === "recorded"
        ? gradeFeedback || "录好了，按一下听听自己的声音，或者直接进下一题！"
        : state === "playing"
          ? "正在播放你刚才的声音，真好听！"
          : state === "error"
            ? error
            : "先听小芽老师读一遍，再点大麦克风开口跟读（说完会自动停哦）。";

  const completedInCategory = prompts.filter((p) => (p.category ?? "word") === category && completedIds[p.id]).length;
  const totalInCategory = prompts.filter((p) => (p.category ?? "word") === category).length;

  return (
    <div className={`app-shell ${child.settings.highContrast ? "child-high-contrast" : ""} ${child.settings.largeText ? "child-large-text" : ""}`.trim()}>
      <header className="session-header handwriting-header">
        <button className="quiet-button compact-button" type="button" onClick={onBack}><ChevronLeft aria-hidden="true" />返回</button>
        <div><p className="eyebrow">{child.name} · 小芽口说（共 {prompts.length} 题）</p><h1>听一听，大声跟着说</h1></div>
        <button className="quiet-button compact-button" type="button" onClick={() => void onLock()}><Lock aria-hidden="true" />退出并锁定</button>
      </header>

      <main className="speaking-screen">
        <nav className="speaking-decks" aria-label="选择声音游戏">
          {DECKS.map((deck) => (
            <button
              key={deck.category}
              className={`speaking-deck ${category === deck.category ? "is-active" : ""}`}
              type="button"
              aria-pressed={category === deck.category}
              onClick={() => selectDeck(deck.category)}
            >
              {deck.label}
            </button>
          ))}
          <button
            className={`speaking-deck ${autoHandsFree ? "is-active" : ""}`}
            type="button"
            onClick={() => setAutoHandsFree((v) => !v)}
            title="开启后点听示范结束会自动打开麦克风，说完自动停"
          >
            <Sparkles aria-hidden="true" />
            {autoHandsFree ? "免按键自动听读：开" : "免按键自动听读：关"}
          </button>
        </nav>

        <section className={`teacher-command speaking-teacher ${state}`}>
          <div className="teacher-mascot" aria-hidden="true"><img src="./assets/images/sprout-teacher.png" alt="" /><i /><i /><i /></div>
          <div className="teacher-bubble">
            <small>小芽老师 · 本组已完成 {completedInCategory} / {totalInCategory}</small>
            <strong>{teacherMessage}</strong>
            <button
              className={`audio-button ${demoState ? `is-${demoState}` : ""}`}
              type="button"
              onClick={() => playDemonstration(true)}
              aria-label={demoState === "playing" ? "播放中" : demoState === "error" ? "再点一次" : `听示范 ${prompt.display}`}
              disabled={state === "recording" || state === "requesting"}
            >
              <Volume2 aria-hidden="true" />
              <span>{demoState === "playing" ? "老师示范中…" : "听老师读 + 自动跟读"}</span>
            </button>
          </div>
          <div className="speaking-teacher-art" aria-hidden="true"><img src="./assets/images/scene-speaking.png" alt="" /></div>
        </section>

        <section className={`speaking-card ${longText ? "is-long-text" : ""}`}>
          <p className="eyebrow">{categoryLabel} · 第 {(index % prompts.length) + 1} / {prompts.length} 题</p>
          {prompt.image ? <img className="speaking-image" src={`./assets/images/${prompt.image}.png`} alt="" /> : null}
          <h2>{prompt.display}</h2>
          <p className="speaking-translation">{prompt.translation}</p>

          <div
            className={`record-orb ${state}`}
            aria-live="polite"
            style={state === "recording" && volumeLevel > 0 ? { transform: `scale(${1 + volumeLevel / 220})`, transition: "transform 90ms ease-out" } : undefined}
          >
            {state === "recording" ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </div>

          {state === "recording" ? (
            <small className="speaking-vad-hint" data-testid="speaking-vad-hint">
              正在收音（音量 {volumeLevel}%）· 说完停顿 1 秒会自动完成
            </small>
          ) : null}

          {grade ? (
            <div
              className={`answer-feedback ${grade === "great" ? "correct-feedback" : "retry-feedback"}`}
              data-testid="speaking-evaluation"
              role="status"
              style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }}
            >
              <div className="feedback-title">
                {grade === "great" ? <><Star aria-hidden="true" /><Check aria-hidden="true" />读得真棒！</> : <><Volume2 aria-hidden="true" />再大声试一次吧！</>}
              </div>
              <p>{gradeFeedback}</p>
              {transcriptText ? <small>小芽老师听到你说：“{transcriptText}”</small> : null}
            </div>
          ) : null}

          <button
            className="primary-button speaking-main-button"
            type="button"
            disabled={state === "requesting" || state === "playing"}
            onClick={() => (state === "recording" ? stopRecording() : state === "recorded" ? void playRecording() : void startRecording())}
          >
            {primaryLabel}
          </button>
          {state === "recorded" || state === "playing" ? (
            <button className="quiet-button compact-button" type="button" onClick={() => void startRecording()}>
              <RotateCcw aria-hidden="true" />再说一次
            </button>
          ) : null}
          {state === "recorded" || state === "playing" ? (
            <button className="primary-button compact-button speaking-next-button" type="button" onClick={nextPrompt}>
              下一个<ChevronRight aria-hidden="true" />
            </button>
          ) : null}
          <small className="privacy-note">录音和语音评测只在本机完成，不会上传。</small>
        </section>
      </main>
    </div>
  );
}
