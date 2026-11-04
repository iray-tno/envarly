import { Button, Code, Text, View } from "@hozo/core";
import { type LandingCopy, WINGET_COMMAND } from "../lib/lpContent";

interface LandingInstallProps {
  copy: LandingCopy["install"];
}

// Static markup only: the copy behaviour is wired by the inline script in
// LandingPage.astro through the winget-* IDs and data-* labels below.
export default function LandingInstall({ copy }: LandingInstallProps) {
  return (
    <View className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-16 -mt-8 text-sm">
      <Text className="text-muted">{copy.label}</Text>
      <View
        nativeID="winget-pill"
        className="flex flex-row items-center gap-1 pl-3 pr-1 py-1 rounded-lg border border-border bg-surface transition-colors"
      >
        <Code nativeID="winget-command" className="font-mono text-xs text-text">
          {WINGET_COMMAND}
        </Code>
        <Button
          nativeID="winget-copy"
          data-copy-label={copy.copy}
          data-copied-label={copy.copied}
          className="grid px-2 py-1 rounded-md text-xs text-muted hover:text-text hover:bg-border/40 transition-colors"
        >
          {/* Both labels are stacked in the same grid cell so the button
              width is always the wider of the two — whichever language —
              and never jitters when the visible label swaps on click.
              `invisible` also keeps them out of the accessibility tree. */}
          <Text className="invisible col-start-1 row-start-1 whitespace-nowrap">{copy.copy}</Text>
          <Text className="invisible col-start-1 row-start-1 whitespace-nowrap">{copy.copied}</Text>
          <Text nativeID="winget-copy-label" className="col-start-1 row-start-1 whitespace-nowrap">
            {copy.copy}
          </Text>
        </Button>
      </View>
    </View>
  );
}
