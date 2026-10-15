import { Heading, Paragraph, Section, Text, View } from "@hozo/core";
import type { LandingCopy } from "../lib/lpContent";

interface LandingFeaturesProps {
  copy: Pick<
    LandingCopy,
    "featuresHeading" | "featuresLead" | "features" | "otherFeaturesHeading" | "otherFeatures"
  >;
}

export default function LandingFeatures({ copy }: LandingFeaturesProps) {
  return (
    <Section nativeID="features" className="block w-full mx-auto max-w-5xl px-6 py-20">
      <Heading level={2} className="text-2xl font-bold text-text text-center mb-3">
        {copy.featuresHeading}
      </Heading>
      <Paragraph className="text-muted text-center mb-12">{copy.featuresLead}</Paragraph>
      <View className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {copy.features.map((feature) => (
          <View
            key={feature.title}
            className="block p-5 rounded-xl border border-border bg-surface hover:border-accent/40 transition-colors"
          >
            <Text className="block text-2xl mb-3">{feature.icon}</Text>
            <Heading level={3} className="text-sm font-semibold text-text mb-2">
              {feature.title}
            </Heading>
            <Paragraph className="text-xs text-muted leading-relaxed">{feature.desc}</Paragraph>
          </View>
        ))}
      </View>
      <Paragraph className="text-xs text-muted text-center mb-5 uppercase tracking-widest">
        {copy.otherFeaturesHeading}
      </Paragraph>
      <View className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {copy.otherFeatures.map((feature) => (
          <View key={feature.title} className="flex flex-row items-start gap-3 py-2">
            <Text className="block text-base shrink-0 mt-0.5">{feature.icon}</Text>
            <View className="block min-w-0 flex-1">
              <Heading level={3} className="text-xs font-semibold text-text mb-0.5">
                {feature.title}
              </Heading>
              <Paragraph className="text-xs text-muted leading-relaxed">{feature.desc}</Paragraph>
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}
