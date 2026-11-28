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

export function stopAudio(): void {
  requestVersion += 1;
  clearPlayerHandlers(activeAudio);
  try { activeAudio?.pause(); } catch { /* Audio teardown can fail in restricted browser contexts. */ }
}

/**
 * 只播放预合成的微软 Neural 语音文件。
 * 没有对应的 m4a、或播放失败时，先带缓存穿透参数重试一次，仍失败就上报 error，
 * 绝不回退到浏览器内置的系统语音合成——产品要求音色唯一（只用微软 Neural 预合成音）。
 */
export function playOrSpeak(text: string, language: string, onStatus?: AudioStatusHandler): void {
  void language;
  const asset = getAudioAsset(text);
  const version = ++requestVersion;
  clearPlayerHandlers(activeAudio);
  try { activeAudio?.pause(); } catch { /* Audio teardown can fail in restricted browser contexts. */ }

  const report = (status: AudioStatus) => {
    if (version === requestVersion) onStatus?.(status);
  };

  if (!asset) {
    report("error");
    return;
  }

  const audio = getPlayer();
  let retried = false;

  const fail = () => {
    if (version !== requestVersion) return;
    if (!retried) {
      retried = true;
      start(true);
      return;
    }
    report("error");
  };

  function start(cacheBust: boolean): void {
    clearPlayerHandlers(audio);
    audio.onplay = () => report("playing");
    audio.onended = () => report("ended");
    audio.onerror = () => fail();
    audio.src = `./assets/audio/${asset}.m4a${cacheBust ? `?retry=${Date.now()}` : ""}`;
    audio.load();
    report("playing");
    try {
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        void playback.catch(() => fail());
      }
    } catch {
      fail();
    }
  }

  start(false);
}
