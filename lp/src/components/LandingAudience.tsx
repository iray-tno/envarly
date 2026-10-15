import { Heading, Paragraph, Section } from "@hozo/core";
import type { LandingCopy } from "../lib/lpContent";

interface LandingAudienceProps {
  copy: LandingCopy["audience"];
}

export default function LandingAudience({ copy }: LandingAudienceProps) {
  return (
    <Section className="block w-full mx-auto max-w-3xl px-6 py-16 text-center">
      <Heading level={2} className="text-2xl font-bold text-text mb-4">
        {copy.heading}
      </Heading>
      {copy.paragraphs.map((paragraph) => (
        <Paragraph key={paragraph} className="text-muted leading-relaxed mb-4">
          {paragraph}
        </Paragraph>
      ))}
    </Section>
  );
}
