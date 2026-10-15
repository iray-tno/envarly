import { Heading, Link, Paragraph, Text, View } from "@hozo/core";
import { GITHUB_URL, type LandingCopy, RELEASE_URL } from "../lib/lpContent";

interface LandingHeroProps {
  copy: LandingCopy["hero"];
}

export default function LandingHero({ copy }: LandingHeroProps) {
  return (
    <>
      <View className="inline-flex flex-row items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted mb-6">
        <Text className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
        <Text>{copy.eyebrow}</Text>
      </View>
      <Heading level={1} className="text-5xl sm:text-6xl font-bold tracking-tight text-text mb-5">
        Envarly
      </Heading>
      {/* Keep responsive leading explicit until iray-tno/hozo#939 is fixed. */}
      <Paragraph className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed sm:leading-relaxed">
        {copy.lead}
      </Paragraph>
      <View className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <Link
          nativeID="hero-download"
          href={RELEASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-dim transition-colors"
        >
          {copy.download}
        </Link>
        <Link
          nativeID="hero-github"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-lg border border-border text-muted font-medium text-sm hover:border-accent hover:text-text transition-colors"
        >
          {copy.github}
        </Link>
      </View>
    </>
  );
}
