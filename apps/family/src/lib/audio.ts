import { getAudioAsset } from "../content/audioAssets";

let activeAudio: HTMLAudioElement | null = null;
let requestVersion = 0;

function getPlayer(): HTMLAudioElement {
  activeAudio ??= new Audio();
  return activeAudio;
}

function stopSpeech(): void {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function stopAudio(): void {
  requestVersion += 1;
  try { activeAudio?.pause(); } catch { /* Audio teardown can fail in restricted browser contexts. */ }
  stopSpeech();
}

function bestVoice(language: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const normalized = language.toLowerCase().replace("_", "-");
  return voices.find((item) => item.lang.toLowerCase().replace("_", "-") === normalized)
    ?? voices.find((item) => item.lang.toLowerCase().startsWith(normalized.slice(0, 2)));
}

export function playOrSpeak(text: string, language: string): void {
  const asset = getAudioAsset(text);
  const version = ++requestVersion;
  try { activeAudio?.pause(); } catch { /* Audio teardown can fail in restricted browser contexts. */ }
  stopSpeech();
  if (asset) {
    const audio = getPlayer();
    audio.src = `./assets/audio/${asset}.m4a`;
    audio.load();
    try {
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        void playback.catch(() => {
          if (version === requestVersion) speakFallback(text, language);
        });
      }
    } catch {
      if (version === requestVersion) speakFallback(text, language);
    }
    return;
  }
  speakFallback(text, language);
}

function speakFallback(text: string, language: string): void {
  if (!("speechSynthesis" in window)) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.84;
  const voice = bestVoice(language);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
