import { Paragraph, Section, Text, View } from "@hozo/core";
import type { LandingCopy } from "../lib/lpContent";

interface LandingStackProps {
  copy: LandingCopy["stack"];
}

export default function LandingStack({ copy }: LandingStackProps) {
  return (
    <Section
      nativeID="stack"
      className="block w-full mx-auto max-w-5xl px-6 py-12 border-t border-border"
    >
      <Paragraph className="text-xs text-muted text-center mb-5 uppercase tracking-widest">
        {copy.label}
      </Paragraph>
      <View className="flex flex-row flex-wrap items-center justify-center gap-3">
        {copy.items.map((tech) => (
          <Text
            key={tech}
            className="px-3 py-1.5 rounded-full border border-border text-xs text-muted"
          >
            {tech}
          </Text>
        ))}
      </View>
    </Section>
  );
}
