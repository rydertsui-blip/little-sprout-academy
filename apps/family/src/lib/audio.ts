import { getAudioAsset } from "../content/audioAssets";

let activeAudio: HTMLAudioElement | null = null;

function getPlayer(): HTMLAudioElement {
  activeAudio ??= new Audio();
  return activeAudio;
}

export function playOrSpeak(text: string, language: string): void {
  const asset = getAudioAsset(text);
  try { activeAudio?.pause(); } catch { /* Audio teardown can fail in restricted browser contexts. */ }
  if (asset) {
    const audio = getPlayer();
    audio.src = `./assets/audio/${asset}.m4a`;
    audio.load();
    try {
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") void playback.catch(() => speakFallback(text, language));
    } catch {
      speakFallback(text, language);
    }
    return;
  }
  speakFallback(text, language);
}

function speakFallback(text: string, language: string): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.84;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith(language.slice(0, 2)));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
