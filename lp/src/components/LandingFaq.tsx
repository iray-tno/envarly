import { Code, Heading, Link, Paragraph, Preformatted, Section, View } from "@hozo/core";
import { GITHUB_URL, type LandingCopy } from "../lib/lpContent";

interface LandingFaqProps {
  copy: LandingCopy["faq"];
}

export default function LandingFaq({ copy }: LandingFaqProps) {
  return (
    <Section nativeID="faq" className="block w-full mx-auto max-w-3xl px-6 py-16">
      <Heading level={2} className="text-2xl font-bold text-text mb-8">
        {copy.heading}
      </Heading>
      {copy.items.map((item) => (
        <View
          key={item.id}
          nativeID={`faq-${item.id}`}
          className="block min-w-0 scroll-mt-20 border-t border-border py-6"
        >
          <Heading level={3} className="text-base font-semibold text-text mb-3">
            {item.question}
          </Heading>
          <Paragraph className="text-sm text-muted leading-relaxed">{item.answer}</Paragraph>
          {item.id === "cli" && (
            <>
              <Paragraph className="text-sm text-muted leading-relaxed mt-3">
                {copy.cliSetup}
              </Paragraph>
              <Preformatted className="block overflow-x-auto border border-border rounded-lg bg-surface p-4 my-4 text-sm text-text">
                <Code>{"envarly --help\nenvarly list --scope user"}</Code>
              </Preformatted>
              <Link
                href={`${GITHUB_URL}/blob/main/README.md#cli-usage`}
                className="text-sm text-accent underline underline-offset-4 hover:text-text"
              >
                {copy.cliDocs}
              </Link>
            </>
          )}
        </View>
      ))}
    </Section>
  );
}
