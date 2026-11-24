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

interface PuppyCompanionProps {
  state: CompanionPetState;
  interactive?: boolean;
  onInteract?: () => void;
  animate?: boolean;
  className?: string;
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

export function PuppyCompanion({ state, interactive = false, onInteract, animate = true, className = "" }: PuppyCompanionProps) {
  const figure = (
    <div className={`puppy-motion ${className}`.trim()} data-testid="puppy-motion" data-state={state}>
      <SpriteCanvas state={state} animate={animate} />
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
