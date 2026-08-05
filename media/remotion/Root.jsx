import { Composition } from "remotion";
import manifest from "./public/frames/manifest.json";
import { Walkthrough } from "./Walkthrough";

const totalMs = manifest.frames.reduce((sum, f) => sum + f.holdMs, 0);
const durationInFrames = Math.ceil((totalMs / 1000) * manifest.fps);

export const RemotionRoot = () => (
  <Composition
    id="Walkthrough"
    component={Walkthrough}
    durationInFrames={durationInFrames}
    fps={manifest.fps}
    width={1200}
    height={870}
  />
);
