import { Button, View } from "@hozo/core";
import { Svg } from "@hozo/svg";
import type { LandingCopy } from "../lib/lpContent";

interface LandingScreenshotsProps {
  copy: LandingCopy["screenshots"];
}

function Chevron({ d }: { d: string }) {
  return (
    <Svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Svg.Path d={d} />
    </Svg>
  );
}

const arrowClass =
  "absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-surface/80 border border-border text-text hover:border-accent/60 transition-colors backdrop-blur";
const dotClass = "w-2 h-2 rounded-full transition-colors";

// Static markup only: slide changes, autoplay and swipe are wired by the
// inline script in LandingPage.astro through the carousel-* and dot-* IDs.
export default function LandingScreenshots({ copy }: LandingScreenshotsProps) {
  return (
    <View className="block mx-auto">
      <View className="block relative overflow-hidden rounded-xl shadow-2xl">
        <View
          nativeID="carousel-track"
          className="flex flex-row transition-[transform] duration-450 ease-[cubic-bezier(.4,0,.2,1)]"
        >
          {/* Raw media tags: Hozo's Video starts playback from JS after
              hydration, and its Image has no width/height/loading, while this
              page ships no client JS and needs intrinsic sizes against layout
              shift. */}
          <video
            id="carousel-video"
            src="/envarly/walkthrough.mp4"
            poster="/envarly/screenshot-path-editor.png"
            aria-label={copy.videoAlt}
            width="1200"
            height="800"
            className="w-full shrink-0"
            autoPlay
            muted
            playsInline
            preload="auto"
          />
          <img
            src="/envarly/screenshot-path-editor.png"
            alt={copy.pathEditorAlt}
            width="1200"
            height="800"
            className="w-full shrink-0"
            loading="eager"
          />
          <img
            src="/envarly/screenshot-apply-modal.png"
            alt={copy.applyModalAlt}
            width="1200"
            height="800"
            className="w-full shrink-0"
            loading="lazy"
          />
        </View>
        <Button nativeID="carousel-prev" accessibilityLabel={copy.prevLabel} className={`${arrowClass} left-2`}>
          <Chevron d="M15 18l-6-6 6-6" />
        </Button>
        <Button nativeID="carousel-next" accessibilityLabel={copy.nextLabel} className={`${arrowClass} right-2`}>
          <Chevron d="M9 18l6-6-6-6" />
        </Button>
      </View>
      <View className="flex flex-row justify-center gap-2 mt-4">
        <Button nativeID="dot-0" accessibilityLabel={copy.videoLabel} className={`${dotClass} bg-accent`} />
        <Button
          nativeID="dot-1"
          accessibilityLabel={copy.firstLabel}
          className={`${dotClass} bg-muted opacity-40`}
        />
        <Button
          nativeID="dot-2"
          accessibilityLabel={copy.secondLabel}
          className={`${dotClass} bg-muted opacity-40`}
        />
      </View>
    </View>
  );
}
