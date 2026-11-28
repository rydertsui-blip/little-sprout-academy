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

function StorybookCompanionArt({ companionId }: { companionId: string }) {
  switch (companionId) {
    case "pikachu-spark":
      return (
        <svg className="puppy-sprite companion-svg-art" data-testid="puppy-sprite" viewBox="0 0 344 256" role="img" aria-label="闪电皮卡丘">
          {/* Lightning tail */}
          <polygon points="228,186 262,152 248,144 294,98 282,162 254,158 238,200" fill="#f6c438" stroke="#17324d" strokeWidth="5" strokeLinejoin="round" />
          {/* Left & Right long ears with black tips */}
          <path d="M126 98 C102 42, 92 22, 108 18 C124 14, 142 54, 150 88 Z" fill="#ffd94a" stroke="#17324d" strokeWidth="5" />
          <path d="M103 36 C100 24, 102 18, 108 18 C115 17, 122 27, 127 40 Z" fill="#17324d" />
          <path d="M196 88 C218 44, 246 28, 256 38 C264 48, 234 80, 212 104 Z" fill="#ffd94a" stroke="#17324d" strokeWidth="5" />
          <path d="M236 42 C246 34, 253 34, 256 38 C259 42, 252 52, 242 61 Z" fill="#17324d" />
          {/* Chubby body & head */}
          <ellipse cx="172" cy="176" rx="56" ry="52" fill="#ffd94a" stroke="#17324d" strokeWidth="5" />
          <circle cx="172" cy="116" r="52" fill="#ffe15c" stroke="#17324d" strokeWidth="5" />
          {/* Eyes, rosy electric cheeks & happy mouth */}
          <circle cx="150" cy="110" r="8" fill="#17324d" />
          <circle cx="148" cy="107" r="3" fill="#ffffff" />
          <circle cx="194" cy="110" r="8" fill="#17324d" />
          <circle cx="192" cy="107" r="3" fill="#ffffff" />
          <circle cx="132" cy="128" r="11" fill="#f16852" stroke="#17324d" strokeWidth="3.5" />
          <circle cx="212" cy="128" r="11" fill="#f16852" stroke="#17324d" strokeWidth="3.5" />
          <path d="M160 124 Q172 134 184 124 Q172 144 160 124 Z" fill="#ef5b6c" stroke="#17324d" strokeWidth="3.5" />
          {/* Waving arms & feet */}
          <ellipse cx="116" cy="148" rx="16" ry="11" transform="rotate(-28 116 148)" fill="#ffe15c" stroke="#17324d" strokeWidth="4.5" />
          <ellipse cx="226" cy="158" rx="15" ry="11" transform="rotate(20 226 158)" fill="#ffe15c" stroke="#17324d" strokeWidth="4.5" />
          <ellipse cx="146" cy="224" rx="18" ry="10" fill="#f4be32" stroke="#17324d" strokeWidth="4.5" />
          <ellipse cx="198" cy="224" rx="18" ry="10" fill="#f4be32" stroke="#17324d" strokeWidth="4.5" />
          {/* Electric sparks */}
          <polyline points="88,118 104,122 96,132 114,134" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="254,116 238,122 246,132 230,136" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "elsa-frost":
      return (
        <svg className="puppy-sprite companion-svg-art" data-testid="puppy-sprite" viewBox="0 0 344 256" role="img" aria-label="冰雪艾莎公主">
          {/* Sheer ice cape & gown */}
          <path d="M112 146 L86 226 Q172 242 258 226 L232 146 Z" fill="#a8e1ff" opacity="0.65" stroke="#17324d" strokeWidth="4" />
          <path d="M132 144 L112 228 Q172 238 232 228 L212 144 Z" fill="#5bc0f8" stroke="#17324d" strokeWidth="5" />
          <path d="M150 144 L142 228 L202 228 L194 144 Z" fill="#86dcff" />
          {/* Platinum blonde hair & side braid */}
          <circle cx="172" cy="98" r="50" fill="#fff6d6" stroke="#17324d" strokeWidth="5" />
          <path d="M198 124 C216 138, 224 166, 212 192 C202 184, 196 160, 192 138 Z" fill="#fdf0c2" stroke="#17324d" strokeWidth="4.5" />
          {/* Ice crystal crown */}
          <polygon points="148,54 160,34 172,46 184,26 196,46 206,36 200,56" fill="#7ce0ff" stroke="#17324d" strokeWidth="4" strokeLinejoin="round" />
          {/* Face */}
          <circle cx="172" cy="106" r="40" fill="#ffe9d6" stroke="#17324d" strokeWidth="4.5" />
          <path d="M132 96 Q154 70 176 86 Q196 72 212 96" fill="#fff6d6" stroke="#17324d" strokeWidth="4.5" />
          <circle cx="156" cy="108" r="6.5" fill="#2563eb" />
          <circle cx="154" cy="106" r="2.2" fill="#ffffff" />
          <circle cx="188" cy="108" r="6.5" fill="#2563eb" />
          <circle cx="186" cy="106" r="2.2" fill="#ffffff" />
          <circle cx="144" cy="120" r="6" fill="#fda4af" opacity="0.65" />
          <circle cx="200" cy="120" r="6" fill="#fda4af" opacity="0.65" />
          <path d="M163 124 Q172 132 181 124" fill="none" stroke="#17324d" strokeWidth="3.5" strokeLinecap="round" />
          {/* Floating crystal snowflakes */}
          <g stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round">
            <line x1="84" y1="78" x2="84" y2="106" />
            <line x1="70" y1="92" x2="98" y2="92" />
            <line x1="74" y1="82" x2="94" y2="102" />
            <line x1="94" y1="82" x2="74" y2="102" />
            <line x1="262" y1="68" x2="262" y2="96" />
            <line x1="248" y1="82" x2="276" y2="82" />
          </g>
        </svg>
      );

    case "wukong-sage":
      return (
        <svg className="puppy-sprite companion-svg-art" data-testid="puppy-sprite" viewBox="0 0 344 256" role="img" aria-label="齐天大圣孙悟空">
          {/* Golden somersault cloud (筋斗云) */}
          <path d="M96 212 C82 212, 74 196, 88 186 C92 172, 114 170, 126 178 C142 166, 176 166, 192 178 C208 168, 232 172, 238 186 C256 188, 260 212, 240 216 Z" fill="#ffd966" stroke="#17324d" strokeWidth="5" />
          {/* Pheasant feathers (凤翅紫金冠翎毛) */}
          <path d="M158 54 C132 16, 88 12, 74 36" fill="none" stroke="#e85c47" strokeWidth="5" strokeLinecap="round" />
          <path d="M186 54 C212 16, 256 12, 270 36" fill="none" stroke="#e85c47" strokeWidth="5" strokeLinecap="round" />
          {/* Monkey tail */}
          <path d="M208 176 C242 168, 252 136, 236 126" fill="none" stroke="#b0723c" strokeWidth="7" strokeLinecap="round" />
          {/* Golden armor body & red scarf */}
          <rect x="138" y="136" width="68" height="52" rx="18" fill="#f4b84b" stroke="#17324d" strokeWidth="5" />
          <path d="M136 138 Q172 156 208 138 L198 156 Q172 166 146 156 Z" fill="#e85c47" stroke="#17324d" strokeWidth="4" />
          {/* Head & Ears */}
          <circle cx="118" cy="102" r="14" fill="#c68642" stroke="#17324d" strokeWidth="4.5" />
          <circle cx="226" cy="102" r="14" fill="#c68642" stroke="#17324d" strokeWidth="4.5" />
          <circle cx="172" cy="98" r="46" fill="#c68642" stroke="#17324d" strokeWidth="5" />
          {/* Heart-shaped monkey face mask */}
          <path d="M138 96 C138 76, 164 76, 172 88 C180 76, 206 76, 206 96 C206 120, 192 134, 172 134 C152 134, 138 120, 138 96 Z" fill="#ffe5c4" stroke="#17324d" strokeWidth="4" />
          {/* Golden headband (紧箍/紫金冠) */}
          <path d="M126 76 Q172 90 218 76" fill="none" stroke="#ffd166" strokeWidth="8" strokeLinecap="round" />
          <path d="M126 76 Q172 90 218 76" fill="none" stroke="#17324d" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="156" cy="102" r="7" fill="#17324d" />
          <circle cx="154" cy="99" r="2.5" fill="#ffd166" />
          <circle cx="188" cy="102" r="7" fill="#17324d" />
          <circle cx="186" cy="99" r="2.5" fill="#ffd166" />
          <path d="M162 118 Q172 126 182 118" fill="none" stroke="#17324d" strokeWidth="3.5" strokeLinecap="round" />
          {/* Ruyi Jingu Bang (如意金箍棒) */}
          <g transform="rotate(-18 172 152)">
            <rect x="78" y="146" width="188" height="11" rx="5.5" fill="#e85c47" stroke="#17324d" strokeWidth="4" />
            <rect x="78" y="146" width="28" height="11" rx="4" fill="#ffd166" stroke="#17324d" strokeWidth="3.5" />
            <rect x="238" y="146" width="28" height="11" rx="4" fill="#ffd166" stroke="#17324d" strokeWidth="3.5" />
          </g>
        </svg>
      );

    case "spider-hero":
      return (
        <svg className="puppy-sprite companion-svg-art" data-testid="puppy-sprite" viewBox="0 0 344 256" role="img" aria-label="吐丝小蜘蛛侠">
          {/* Silver web line */}
          <line x1="232" y1="126" x2="310" y2="26" stroke="#94a3b8" strokeWidth="4" strokeDasharray="6 4" />
          {/* Suit body & legs */}
          <rect x="140" y="144" width="64" height="54" rx="20" fill="#2563eb" stroke="#17324d" strokeWidth="5" />
          <path d="M144 144 L200 144 L192 178 L152 178 Z" fill="#e11d48" stroke="#17324d" strokeWidth="4" />
          {/* Little spider emblem on chest */}
          <circle cx="172" cy="160" r="5" fill="#17324d" />
          <ellipse cx="148" cy="212" rx="16" ry="12" fill="#e11d48" stroke="#17324d" strokeWidth="4.5" />
          <ellipse cx="196" cy="212" rx="16" ry="12" fill="#e11d48" stroke="#17324d" strokeWidth="4.5" />
          {/* Web-shooting arms */}
          <ellipse cx="118" cy="156" rx="18" ry="11" transform="rotate(-20 118 156)" fill="#e11d48" stroke="#17324d" strokeWidth="4.5" />
          <ellipse cx="226" cy="142" rx="18" ry="11" transform="rotate(-35 226 142)" fill="#e11d48" stroke="#17324d" strokeWidth="4.5" />
          {/* Big Chibi Spider-Mask Head */}
          <circle cx="172" cy="98" r="52" fill="#e11d48" stroke="#17324d" strokeWidth="5" />
          {/* Web lines on mask */}
          <line x1="172" y1="46" x2="172" y2="150" stroke="rgba(23,50,77,0.32)" strokeWidth="2.5" />
          <line x1="120" y1="98" x2="224" y2="98" stroke="rgba(23,50,77,0.32)" strokeWidth="2.5" />
          <circle cx="172" cy="98" r="28" fill="none" stroke="rgba(23,50,77,0.28)" strokeWidth="2.5" />
          {/* Big expressive white lenses */}
          <path d="M132 84 C136 68, 160 74, 166 98 C154 114, 130 106, 132 84 Z" fill="#ffffff" stroke="#17324d" strokeWidth="6" strokeLinejoin="round" />
          <path d="M212 84 C208 68, 184 74, 178 98 C190 114, 214 106, 212 84 Z" fill="#ffffff" stroke="#17324d" strokeWidth="6" strokeLinejoin="round" />
        </svg>
      );

    case "dora-pocket":
      return (
        <svg className="puppy-sprite companion-svg-art" data-testid="puppy-sprite" viewBox="0 0 344 256" role="img" aria-label="百宝叮当猫">
          {/* Blue round body & white belly */}
          <ellipse cx="172" cy="176" rx="54" ry="48" fill="#3898ec" stroke="#17324d" strokeWidth="5" />
          <circle cx="172" cy="178" r="36" fill="#ffffff" stroke="#17324d" strokeWidth="4" />
          {/* 4D Magic Pocket */}
          <path d="M146 176 L198 176 A26 26 0 0 1 146 176 Z" fill="#fffdf8" stroke="#17324d" strokeWidth="4" />
          {/* White round hands & feet */}
          <circle cx="112" cy="156" r="14" fill="#ffffff" stroke="#17324d" strokeWidth="4.5" />
          <circle cx="232" cy="156" r="14" fill="#ffffff" stroke="#17324d" strokeWidth="4.5" />
          <ellipse cx="146" cy="224" rx="20" ry="11" fill="#ffffff" stroke="#17324d" strokeWidth="4.5" />
          <ellipse cx="198" cy="224" rx="20" ry="11" fill="#ffffff" stroke="#17324d" strokeWidth="4.5" />
          {/* Big round blue head & white face */}
          <circle cx="172" cy="100" r="56" fill="#3898ec" stroke="#17324d" strokeWidth="5" />
          <ellipse cx="172" cy="110" rx="46" ry="40" fill="#ffffff" stroke="#17324d" strokeWidth="4" />
          {/* Eyes & red nose */}
          <ellipse cx="158" cy="78" rx="13" ry="16" fill="#ffffff" stroke="#17324d" strokeWidth="4" />
          <ellipse cx="186" cy="78" rx="13" ry="16" fill="#ffffff" stroke="#17324d" strokeWidth="4" />
          <circle cx="162" cy="80" r="5" fill="#17324d" />
          <circle cx="182" cy="80" r="5" fill="#17324d" />
          <circle cx="172" cy="94" r="9" fill="#e11d48" stroke="#17324d" strokeWidth="3.5" />
          <circle cx="169" cy="91" r="2.5" fill="#ffffff" />
          {/* Whiskers & big smile */}
          <line x1="172" y1="103" x2="172" y2="124" stroke="#17324d" strokeWidth="3.5" />
          <path d="M146 118 Q172 142 198 118 Z" fill="#ef5b6c" stroke="#17324d" strokeWidth="4" />
          <line x1="118" y1="98" x2="144" y2="104" stroke="#17324d" strokeWidth="3" strokeLinecap="round" />
          <line x1="116" y1="110" x2="144" y2="110" stroke="#17324d" strokeWidth="3" strokeLinecap="round" />
          <line x1="226" y1="98" x2="200" y2="104" stroke="#17324d" strokeWidth="3" strokeLinecap="round" />
          <line x1="228" y1="110" x2="200" y2="110" stroke="#17324d" strokeWidth="3" strokeLinecap="round" />
          {/* Red collar & golden jingle bell */}
          <rect x="130" y="142" width="84" height="11" rx="5.5" fill="#e11d48" stroke="#17324d" strokeWidth="4" />
          <circle cx="172" cy="152" r="11" fill="#ffd166" stroke="#17324d" strokeWidth="4" />
          <circle cx="172" cy="154" r="2.8" fill="#17324d" />
        </svg>
      );

    case "stella-unicorn":
      return (
        <svg className="puppy-sprite companion-svg-art" data-testid="puppy-sprite" viewBox="0 0 344 256" role="img" aria-label="彩虹独角兽星宝">
          {/* Rainbow tail & mane */}
          <path d="M214 166 C254 156, 266 188, 244 210 C226 216, 214 196, 210 182 Z" fill="#f472b6" stroke="#17324d" strokeWidth="4.5" />
          <path d="M218 174 C248 168, 254 194, 236 206" fill="none" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round" />
          {/* Pearly unicorn body & wings */}
          <ellipse cx="176" cy="178" rx="48" ry="38" fill="#fffdf9" stroke="#17324d" strokeWidth="5" />
          <path d="M168 156 C144 128, 108 134, 118 162 C128 176, 152 176, 168 168 Z" fill="#e0f2fe" stroke="#17324d" strokeWidth="4.5" />
          {/* Four hooves */}
          <rect x="140" y="204" width="14" height="24" rx="6" fill="#fffdf9" stroke="#17324d" strokeWidth="4" />
          <rect x="160" y="206" width="14" height="24" rx="6" fill="#fffdf9" stroke="#17324d" strokeWidth="4" />
          <rect x="184" y="206" width="14" height="24" rx="6" fill="#fffdf9" stroke="#17324d" strokeWidth="4" />
          <rect x="204" y="204" width="14" height="24" rx="6" fill="#fffdf9" stroke="#17324d" strokeWidth="4" />
          {/* Head & pastel rainbow mane */}
          <path d="M174 64 C206 64, 218 96, 202 126" fill="none" stroke="#a78bfa" strokeWidth="14" strokeLinecap="round" />
          <path d="M170 68 C198 68, 210 96, 196 122" fill="none" stroke="#f472b6" strokeWidth="8" strokeLinecap="round" />
          <circle cx="158" cy="106" r="42" fill="#fffdf9" stroke="#17324d" strokeWidth="5" />
          {/* Golden spiral horn */}
          <polygon points="146,66 158,20 172,66" fill="#ffd166" stroke="#17324d" strokeWidth="4.5" strokeLinejoin="round" />
          {/* Sparkly eyes & rosy cheeks */}
          <circle cx="144" cy="102" r="7.5" fill="#17324d" />
          <circle cx="142" cy="99" r="2.8" fill="#ffffff" />
          <circle cx="174" cy="102" r="7.5" fill="#17324d" />
          <circle cx="172" cy="99" r="2.8" fill="#ffffff" />
          <circle cx="132" cy="116" r="7" fill="#fbcfe8" />
          <circle cx="184" cy="116" r="7" fill="#fbcfe8" />
          <path d="M150 118 Q158 126 166 118" fill="none" stroke="#17324d" strokeWidth="3.5" strokeLinecap="round" />
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
  companionId?: string;
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
  equippedAccessoryIds = [],
  companionId = "gemini-doudou"
}: PuppyCompanionProps) {
  const isDoudou = !companionId || companionId === "gemini-doudou";
  const figure = (
    <div
      className={`puppy-motion ${className}`.trim()}
      data-testid="puppy-motion"
      data-state={state}
      data-companion-id={companionId}
    >
      {isDoudou ? (
        <SpriteCanvas state={state} animate={animate} />
      ) : (
        <StorybookCompanionArt companionId={companionId} />
      )}
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
