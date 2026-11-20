import { ChevronLeft, ChevronRight, Lock, Mic, RotateCcw, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VOICE_LINES } from "../content/audioAssets";
import { SPEAKING_PROMPTS } from "../content/speaking";
import { playOrSpeak } from "../lib/audio";
import type { ChildProfile } from "../lib/types";

type RecordingState = "idle" | "requesting" | "recording" | "recorded" | "playing" | "error";

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
  const prompt = SPEAKING_PROMPTS[index];

  useEffect(() => {
    const timer = window.setTimeout(() => playOrSpeak(prompt.text, prompt.language), 500);
    return () => {
      window.clearTimeout(timer);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      recorderRef.current = null;
      stopStream();
      revokeRecording();
    };
  }, [index, prompt.language, prompt.text]);

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
    revokeRecording();
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("error");
      setError("这台装置暂时不能录音。可以先听示范，再跟着读。");
      return;
    }
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredMime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferredMime ? new MediaRecorder(stream, { mimeType: preferredMime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
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
        window.setTimeout(() => void playRecording(true), 450);
      };
      recorder.start();
      setState("recording");
    } catch {
      stopStream();
      setState("error");
      setError("没有麦克风权限。请家长允许麦克风，或者先只跟读示范。");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function playRecording(automatic = false) {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = 0;
    setState("playing");
    try {
      await player.play();
      player.onended = () => setState("recorded");
    } catch {
      if (automatic) setState("recorded");
      else {
        setState("error");
        setError("录音无法回放，请再录一次。");
      }
    }
  }

  function nextPrompt() {
    playOrSpeak(VOICE_LINES.speakingNext, "zh-CN");
    setIndex((value) => (value + 1) % SPEAKING_PROMPTS.length);
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
        <section className={`teacher-command speaking-teacher ${state}`}>
          <div className="teacher-mascot" aria-hidden="true"><img src="./assets/images/seedling.png" alt="" /><i /><i /><i /></div>
          <div className="teacher-bubble">
            <small>小芽老师</small>
            <strong>{state === "recording" ? "我在听，慢慢说。" : state === "recorded" ? "录好了，按一下听听自己的声音。" : state === "playing" ? "正在听你的声音。" : state === "error" ? error : "先听一次，再跟着说。"}</strong>
            <button className="audio-button" type="button" onClick={() => playOrSpeak(prompt.text, prompt.language)} aria-label={`听示范 ${prompt.display}`}><Volume2 aria-hidden="true" /></button>
          </div>
        </section>

        <section className="speaking-card">
          <p className="eyebrow">{prompt.language === "zh-CN" ? "华文跟读" : "English speaking"}</p>
          <h2>{prompt.display}</h2>
          <p className="speaking-translation">{prompt.translation}</p>
          <div className={`record-orb ${state}`} aria-live="polite">
            {state === "recording" ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </div>
          <button
            className="primary-button speaking-main-button"
            type="button"
            disabled={state === "requesting" || state === "playing"}
            onClick={() => state === "recording" ? stopRecording() : state === "recorded" ? void playRecording(false) : void startRecording()}
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
