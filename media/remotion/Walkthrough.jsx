import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import manifest from "./public/frames/manifest.json";

const TITLEBAR_HEIGHT = 40;
const APP_HEIGHT = 800; // titlebar (40) + content (760)
const CAPTION_HEIGHT = 70;
const CURSOR_MOVE_MS = 350;
const CURSOR_RIPPLE_MS = 450;

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function frameFileAtMs(ms) {
  let acc = 0;
  for (const f of manifest.frames) {
    if (ms < acc + f.holdMs) return f.file;
    acc += f.holdMs;
  }
  return manifest.frames[manifest.frames.length - 1].file;
}

/**
 * Where the synthetic cursor should be at time `ms`, in content coordinates
 * (0-1200 x, 0-760 y). Playwright screenshots never include the real OS
 * cursor, so this reconstructs one from the actual click positions recorded
 * in manifest.clicks — it eases between consecutive clicks, arriving exactly
 * on time, and reports a short ripple window right at each click.
 */
function cursorStateAtMs(ms) {
  const clicks = manifest.clicks ?? [];
  if (clicks.length === 0) return { visible: false };

  let prev = null;
  let next = null;
  for (const c of clicks) {
    if (c.atMs <= ms) prev = c;
    if (c.atMs > ms && next === null) next = c;
  }

  if (!prev) {
    const first = clicks[0];
    const moveStart = first.atMs - CURSOR_MOVE_MS;
    const introStart = moveStart - 200;
    if (ms < introStart) return { visible: false };
    const opacity = clamp01((ms - introStart) / 200);
    return { visible: true, x: first.x, y: first.y, opacity, rippleT: null };
  }

  let x = prev.x;
  let y = prev.y;
  if (next) {
    const moveStart = next.atMs - CURSOR_MOVE_MS;
    if (ms >= moveStart) {
      const t = easeInOut(clamp01((ms - moveStart) / CURSOR_MOVE_MS));
      x = lerp(prev.x, next.x, t);
      y = lerp(prev.y, next.y, t);
    }
  }

  const sincePrevClick = ms - prev.atMs;
  const rippleT = sincePrevClick >= 0 && sincePrevClick < CURSOR_RIPPLE_MS ? sincePrevClick / CURSOR_RIPPLE_MS : null;

  return { visible: true, x, y, opacity: 1, rippleT };
}

function Cursor() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const state = cursorStateAtMs(ms);
  if (!state.visible) return null;

  const compX = state.x;
  const compY = state.y + TITLEBAR_HEIGHT;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: state.opacity }}>
      {state.rippleT !== null && (
        <div
          style={{
            position: "absolute",
            left: compX - 20,
            top: compY - 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid #6d9cf8",
            opacity: 1 - state.rippleT,
            transform: `scale(${0.4 + state.rippleT * 1.2})`,
          }}
        />
      )}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: compX - 2,
          top: compY - 2,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7))",
        }}
      >
        <path
          d="M2 2 L2 20 L7 15.5 L10.5 22 L13 20.5 L9.5 14 L16 14 Z"
          fill="white"
          stroke="black"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function Caption({ text, durationInFrames }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        top: APP_HEIGHT,
        left: 0,
        right: 0,
        height: CAPTION_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          color: "#e6edf3",
          fontSize: 20,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function Walkthrough() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const file = frameFileAtMs(ms);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117" }}>
      <Img
        src={staticFile(`frames/${file}`)}
        style={{ position: "absolute", top: TITLEBAR_HEIGHT, left: 0, width: 1200, height: 760 }}
      />
      <Img
        src={staticFile("titlebar.png")}
        style={{ position: "absolute", top: 0, left: 0, width: 1200, height: TITLEBAR_HEIGHT }}
      />
      <div
        style={{
          position: "absolute",
          top: APP_HEIGHT,
          left: 0,
          right: 0,
          height: CAPTION_HEIGHT,
          backgroundColor: "#161b22",
          borderTop: "1px solid #30363d",
        }}
      />
      {manifest.captions.map((c, i) => {
        const startFrame = Math.round((c.startMs / 1000) * fps);
        const durationInFrames = Math.round(((c.endMs - c.startMs) / 1000) * fps);
        return (
          <Sequence key={i} from={startFrame} durationInFrames={durationInFrames}>
            <Caption text={c.text} durationInFrames={durationInFrames} />
          </Sequence>
        );
      })}
      <Cursor />
    </AbsoluteFill>
  );
}
