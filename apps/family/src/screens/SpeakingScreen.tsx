import { ChevronLeft, ChevronRight, Lock, Mic, RotateCcw, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SPEAKING_PROMPTS } from "../content/speaking";
import { playOrSpeak, stopAudio } from "../lib/audio";
import type { ChildProfile } from "../lib/types";

type RecordingState = "idle" | "requesting" | "recording" | "recorded" | "playing" | "error";
type SpeakingCategory = NonNullable<(typeof SPEAKING_PROMPTS)[number]["category"]>;

const DECKS: Array<{ category: SpeakingCategory; label: string }> = [
  { category: "word", label: "词语" },
  { category: "organize", label: "看图说两句" },
  { category: "read-aloud", label: "朗读" },
  { category: "speaking-purpose", label: "情境开口" }
];

interface SpeakingScreenProps {
  child: ChildProfile;
  onBack: () => void;
  onLock: () => void | Promise<void>;
}

export default function SpeakingScreen({ child, onBack, onLock }: SpeakingScreenProps) {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingUrlRef = useRef<string | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const requestTokenRef = useRef(0);
  const prompt = SPEAKING_PROMPTS[index];
  const category = prompt.category ?? "word";
  const categoryLabel = category === "organize" ? "看图说两句" : category === "read-aloud" ? "朗读小游戏" : category === "speaking-purpose" ? "情境开口" : prompt.language === "zh-CN" ? "词语跟读" : "English speaking";
  const longText = category === "read-aloud" || category === "speaking-purpose";

  useEffect(() => {
    return () => {
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
  }, [index, prompt.language, prompt.text]);

  useEffect(() => {
    const suspend = () => {
      requestTokenRef.current += 1;
      playerRef.current?.pause();
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      stopStream();
      setState((current) => current === "recording" || current === "playing" ? "idle" : current);
    };
    const onVisibility = () => { if (document.hidden) suspend(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", suspend);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", suspend);
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function revokeRecording() {
    playerRef.current?.pause();
    playerRef.current = null;
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    recordingUrlRef.current = null;
  }

  async function startRecording() {
    stopAudio();
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
      const preferredMime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
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
        stopStream();
        if (blob.size === 0) {
          setState("error");
          setError("没有录到声音，请再说一次。");
          return;
        }
        recordingUrlRef.current = URL.createObjectURL(blob);
        const player = new Audio(recordingUrlRef.current);
        playerRef.current = player;
        setState("recorded");
      };
      recorder.start();
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

  function playDemonstration() {
    if (state === "recording" || state === "requesting") return;
    playerRef.current?.pause();
    if (state === "playing") setState("recorded");
    playOrSpeak(prompt.text, prompt.language);
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
    setIndex((value) => (value + 1) % SPEAKING_PROMPTS.length);
  }

  function selectDeck(nextCategory: SpeakingCategory) {
    const nextIndex = SPEAKING_PROMPTS.findIndex((item) => (item.category ?? "word") === nextCategory);
    if (nextIndex < 0 || nextIndex === index) return;
    revokeRecording();
    setState("idle");
    setError("");
    setIndex(nextIndex);
  }

  const primaryLabel = state === "recording" ? "停止录音" : state === "recorded" ? "听自己" : state === "playing" ? "正在播放…" : state === "requesting" ? "正在打开麦克风…" : "开始说";

  return (
    <div className={`app-shell ${child.settings.highContrast ? "child-high-contrast" : ""} ${child.settings.largeText ? "child-large-text" : ""}`.trim()}>
      <header className="session-header handwriting-header">
        <button className="quiet-button compact-button" type="button" onClick={onBack}><ChevronLeft aria-hidden="true" />返回</button>
        <div><p className="eyebrow">{child.name} · 小芽口说</p><h1>听一听，跟着说</h1></div>
        <button className="quiet-button compact-button" type="button" onClick={() => void onLock()}><Lock aria-hidden="true" />退出并锁定</button>
      </header>

      <main className="speaking-screen">
        <nav className="speaking-decks" aria-label="选择声音游戏">
          {DECKS.map((deck) => (
            <button key={deck.category} className={`speaking-deck ${category === deck.category ? "is-active" : ""}`} type="button" aria-pressed={category === deck.category} onClick={() => selectDeck(deck.category)}>{deck.label}</button>
          ))}
        </nav>
        <section className={`teacher-command speaking-teacher ${state}`}>
          <div className="teacher-mascot" aria-hidden="true"><img src="./assets/images/sprout-teacher.png" alt="" /><i /><i /><i /></div>
          <div className="teacher-bubble">
            <small>小芽老师</small>
            <strong>{state === "recording" ? "我在录音，慢慢说。" : state === "recorded" ? "录好了，按一下听听自己的声音。" : state === "playing" ? "正在播放你的录音。" : state === "error" ? error : "先听一次，再跟着说。"}</strong>
            <button className="audio-button" type="button" onClick={playDemonstration} aria-label={`听示范 ${prompt.display}`} disabled={state === "recording" || state === "requesting"}><Volume2 aria-hidden="true" /></button>
          </div>
          <div className="speaking-teacher-art" aria-hidden="true"><img src="./assets/images/scene-speaking.png" alt="" /></div>
        </section>

        <section className={`speaking-card ${longText ? "is-long-text" : ""}`}>
          <p className="eyebrow">{categoryLabel}</p>
          {prompt.image ? <img className="speaking-image" src={`./assets/images/${prompt.image}.png`} alt="" /> : null}
          <h2>{prompt.display}</h2>
          <p className="speaking-translation">{prompt.translation}</p>
          <div className={`record-orb ${state}`} aria-live="polite">
            {state === "recording" ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </div>
          <button
            className="primary-button speaking-main-button"
            type="button"
            disabled={state === "requesting" || state === "playing"}
            onClick={() => state === "recording" ? stopRecording() : state === "recorded" ? void playRecording() : void startRecording()}
          >
            {primaryLabel}
          </button>
          {state === "recorded" || state === "playing" ? <button className="quiet-button compact-button" type="button" onClick={() => void startRecording()}><RotateCcw aria-hidden="true" />再说一次</button> : null}
          {(state === "recorded" || state === "playing") ? <button className="primary-button compact-button speaking-next-button" type="button" onClick={nextPrompt}>下一个<ChevronRight aria-hidden="true" /></button> : null}
          <small className="privacy-note">录音只留在这一页，不会上传。</small>
        </section>
      </main>
    </div>
  );
}
