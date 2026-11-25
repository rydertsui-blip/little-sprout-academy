import { getAudioAsset } from "../content/audioAssets";

export type AudioStatus = "playing" | "ended" | "error";
export type AudioStatusHandler = (status: AudioStatus) => void;

let activeAudio: HTMLAudioElement | null = null;
let requestVersion = 0;

function getPlayer(): HTMLAudioElement {
  activeAudio ??= new Audio();
  return activeAudio;
}

function clearPlayerHandlers(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.onplay = null;
  audio.onended = null;
  audio.onerror = null;
}

function stopSpeech(): void {
  if ("speechSynthesis" in window && window.speechSynthesis) window.speechSynthesis.cancel();
}

export function stopAudio(): void {
  requestVersion += 1;
  clearPlayerHandlers(activeAudio);
  try { activeAudio?.pause(); } catch { /* Audio teardown can fail in restricted browser contexts. */ }
  stopSpeech();
}

function bestVoice(language: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const normalized = language.toLowerCase().replace("_", "-");
  return voices.find((item) => item.lang.toLowerCase().replace("_", "-") === normalized)
    ?? voices.find((item) => item.lang.toLowerCase().startsWith(normalized.slice(0, 2)));
}

export function playOrSpeak(text: string, language: string, onStatus?: AudioStatusHandler): void {
  const asset = getAudioAsset(text);
  const version = ++requestVersion;
  clearPlayerHandlers(activeAudio);
  try { activeAudio?.pause(); } catch { /* Audio teardown can fail in restricted browser contexts. */ }
  stopSpeech();

  const report = (status: AudioStatus) => {
    if (version === requestVersion) onStatus?.(status);
  };

  if (asset) {
    const audio = getPlayer();
    let fallbackStarted = false;
    const useSpeechFallback = () => {
      if (version !== requestVersion || fallbackStarted) return;
      fallbackStarted = true;
      speakFallback(text, language, version, report);
    };
    audio.onplay = () => report("playing");
    audio.onended = () => report("ended");
    audio.onerror = () => {
      useSpeechFallback();
    };
    audio.src = `./assets/audio/${asset}.m4a`;
    audio.load();
    report("playing");
    try {
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        void playback.catch(() => {
          if (version === requestVersion) {
            useSpeechFallback();
          }
        });
      }
    } catch {
      useSpeechFallback();
    }
    return;
  }
  speakFallback(text, language, version, report);
}

function speakFallback(text: string, language: string, version: number, report: (status: AudioStatus) => void): void {
  if (!("speechSynthesis" in window) || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    report("error");
    return;
  }
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.84;
  const voice = bestVoice(language);
  if (voice) utterance.voice = voice;
  utterance.onstart = () => report("playing");
  utterance.onend = () => report("ended");
  utterance.onerror = () => report("error");
  report("playing");
  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    report("error");
  }
}
