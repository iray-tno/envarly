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

const APP_HEIGHT = 800; // titlebar (40) + content (760)
const CAPTION_HEIGHT = 70;

function frameFileAtMs(ms) {
  let acc = 0;
  for (const f of manifest.frames) {
    if (ms < acc + f.holdMs) return f.file;
    acc += f.holdMs;
  }
  return manifest.frames[manifest.frames.length - 1].file;
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
        style={{ position: "absolute", top: 40, left: 0, width: 1200, height: 760 }}
      />
      <Img
        src={staticFile("titlebar.png")}
        style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 40 }}
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
    </AbsoluteFill>
  );
}
