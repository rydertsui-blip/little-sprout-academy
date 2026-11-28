import { useEffect, useRef } from "react";
import type { CompanionPetState } from "./petState";

interface AnimationSpec {
  file: string;
  frames: number;
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  frameMs: number;
}

interface StatePlaybackSpec {
  animation: keyof typeof ANIMATIONS;
  sequence: readonly number[];
  frameMs: number;
}

const ANIMATION_BASE = "./assets/companions/gemini-doudou";
const FRAME_WIDTH = 344;
const FRAME_HEIGHT = 256;
const CANVAS_WIDTH = 344;
const CANVAS_HEIGHT = 256;

const ANIMATIONS = {
  idle: {
    file: "idle.png",
    frames: 4,
    width: 1376,
    height: 256,
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    frameMs: 240
  },
  walk: {
    file: "walk.png",
    frames: 4,
    width: 1376,
    height: 256,
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    frameMs: 150
  },
  celebrate: {
    file: "celebrate.png",
    frames: 4,
    width: 1376,
    height: 256,
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    frameMs: 180
  }
} satisfies Record<string, AnimationSpec>;

const STATE_PLAYBACK: Record<CompanionPetState, StatePlaybackSpec> = {
  idle: { animation: "idle", sequence: [0, 1, 2, 3], frameMs: 320 },
  greet: { animation: "celebrate", sequence: [0, 1, 2, 3], frameMs: 180 },
  listen: { animation: "idle", sequence: [0, 2], frameMs: 650 },
  think: { animation: "idle", sequence: [2, 0], frameMs: 750 },
  celebrate: { animation: "celebrate", sequence: [0, 1, 2, 3], frameMs: 160 },
  comfort: { animation: "idle", sequence: [0, 3], frameMs: 700 },
  "tap-react": { animation: "celebrate", sequence: [0, 1, 2, 3], frameMs: 170 },
  rest: { animation: "idle", sequence: [1], frameMs: 1_000 }
};

const imageCache = new Map<string, HTMLImageElement>();

function getImage(src: string): HTMLImageElement {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const image = new Image();
  image.src = src;
  imageCache.set(src, image);
  return image;
}

export function AccessoryBadgeIcon({ accessoryId }: { accessoryId: string }) {
  switch (accessoryId) {
    case "acc-sprout-crown":
      return (
        <svg viewBox="0 0 64 40" className="puppy-acc-svg is-hat" aria-hidden="true">
          <path d="M12 28 C20 18, 44 18, 52 28" stroke="#4ea865" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M32 22 C32 10, 20 8, 22 18 C25 22, 30 22, 32 22 Z" fill="#68c97a" />
          <path d="M32 22 C32 10, 44 8, 42 18 C39 22, 34 22, 32 22 Z" fill="#82db92" />
          <circle cx="22" cy="24" r="4" fill="#ffb8c6" />
          <circle cx="42" cy="24" r="4" fill="#ffd966" />
        </svg>
      );
    case "acc-bamboo-copter":
      return (
        <svg viewBox="0 0 64 40" className="puppy-acc-svg is-hat is-spinning" aria-hidden="true">
          <rect x="30" y="14" width="4" height="18" rx="2" fill="#e09f3e" />
          <ellipse cx="32" cy="12" rx="22" ry="4" fill="#ffd166" stroke="#d48b28" strokeWidth="2" />
          <circle cx="32" cy="12" r="4" fill="#ef476f" />
        </svg>
      );
    case "acc-wizard-hat":
      return (
        <svg viewBox="0 0 64 48" className="puppy-acc-svg is-hat" aria-hidden="true">
          <ellipse cx="32" cy="38" rx="24" ry="6" fill="#3a509b" />
          <path d="M16 36 L34 6 L48 36 Z" fill="#4863be" stroke="#2c3e7a" strokeWidth="2" />
          <path d="M18 33 Q32 37 46 33" stroke="#ffd166" strokeWidth="4" fill="none" />
          <polygon points="33,18 35,22 39,22 36,24 37,28 33,26 29,28 30,24 27,22 31,22" fill="#ffd166" />
        </svg>
      );
    case "acc-red-scarf":
      return (
        <svg viewBox="0 0 64 36" className="puppy-acc-svg is-neck" aria-hidden="true">
          <path d="M14 10 Q32 22 50 10 L44 22 Q32 28 20 22 Z" fill="#ef476f" />
          <path d="M28 20 L23 34 L32 28 L39 34 L35 20 Z" fill="#d9385e" />
          <circle cx="32" cy="21" r="4" fill="#ffd166" />
        </svg>
      );
    case "acc-gold-medal":
      return (
        <svg viewBox="0 0 64 42" className="puppy-acc-svg is-neck" aria-hidden="true">
          <path d="M20 6 L28 22 L36 22 L44 6" stroke="#ef476f" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="32" cy="27" r="10" fill="#ffd166" stroke="#d48b28" strokeWidth="2.5" />
          <polygon points="32,20 34,25 39,25 35,28 36,33 32,30 28,33 29,28 25,25 30,25" fill="#d48b28" />
        </svg>
      );
    case "acc-star-glasses":
      return (
        <svg viewBox="0 0 72 32" className="puppy-acc-svg is-eyes" aria-hidden="true">
          <line x1="30" y1="16" x2="42" y2="16" stroke="#f4b84b" strokeWidth="3.5" />
          <circle cx="20" cy="16" r="10" fill="rgba(59, 130, 246, 0.72)" stroke="#f4b84b" strokeWidth="3" />
          <circle cx="52" cy="16" r="10" fill="rgba(59, 130, 246, 0.72)" stroke="#f4b84b" strokeWidth="3" />
          <circle cx="17" cy="13" r="2.2" fill="#ffffff" />
          <circle cx="49" cy="13" r="2.2" fill="#ffffff" />
        </svg>
      );
    default:
      return null;
  }
}

interface PuppyCompanionProps {
  state: CompanionPetState;
  interactive?: boolean;
  onInteract?: () => void;
  animate?: boolean;
  className?: string;
  equippedAccessoryIds?: string[];
}

function SpriteCanvas({ state, animate }: { state: CompanionPetState; animate: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playback = STATE_PLAYBACK[state];
  const animation = ANIMATIONS[playback.animation];
  const src = `${ANIMATION_BASE}/${animation.file}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = getImage(src);
    if (!canvas || (image.complete && !image.naturalWidth)) return;
    let frameRequest = 0;
    let startedAt: number | null = null;
    const reducedMotion = !animate || (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

    const draw = (now: number) => {
      const context = canvas.getContext("2d", { alpha: true });
      if (!context || !image.naturalWidth) {
        frameRequest = requestAnimationFrame(draw);
        return;
      }
      startedAt ??= now;
      const seqIndex = reducedMotion
        ? 0
        : Math.floor((now - startedAt) / playback.frameMs) % playback.sequence.length;
      const frameIndex = playback.sequence[seqIndex] ?? 0;

      context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.imageSmoothingEnabled = false;
      context.drawImage(
        image,
        frameIndex * animation.frameWidth,
        0,
        animation.frameWidth,
        animation.frameHeight,
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );

      if (!reducedMotion && playback.sequence.length > 1) {
        frameRequest = requestAnimationFrame(draw);
      }
    };

    const start = () => {
      cancelAnimationFrame(frameRequest);
      frameRequest = requestAnimationFrame(draw);
    };
    image.addEventListener("load", start, { once: true });
    if (image.complete) start();

    return () => {
      cancelAnimationFrame(frameRequest);
      image.removeEventListener("load", start);
    };
  }, [animate, animation.file, animation.frameHeight, animation.frameWidth, playback.frameMs, playback.sequence, src]);

  return (
    <canvas
      ref={canvasRef}
      className="puppy-sprite"
      data-testid="puppy-sprite"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      role="img"
      aria-label="陪伴小狗豆豆"
    />
  );
}

export function PuppyCompanion({
  state,
  interactive = false,
  onInteract,
  animate = true,
  className = "",
  equippedAccessoryIds = []
}: PuppyCompanionProps) {
  const figure = (
    <div className={`puppy-motion ${className}`.trim()} data-testid="puppy-motion" data-state={state}>
      <SpriteCanvas state={state} animate={animate} />
      {equippedAccessoryIds.length > 0 ? (
        <div className="puppy-accessory-layer" data-testid="puppy-accessory-layer" aria-hidden="true">
          {equippedAccessoryIds.map((accId) => (
            <AccessoryBadgeIcon key={accId} accessoryId={accId} />
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!interactive) return figure;

  return (
    <button className="puppy-hit-area" type="button" aria-label="和小狗豆豆互动" onClick={onInteract}>
      {figure}
    </button>
  );
}

export const DOUDOU_ANIMATIONS = ANIMATIONS;
