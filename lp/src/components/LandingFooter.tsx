import { Footer, Link, Paragraph, Text, View } from "@hozo/core";
import { GITHUB_URL, type LandingCopy, REPORTS_URL, STORYBOOK_URL } from "../lib/lpContent";

interface LandingFooterProps {
  copy: Pick<LandingCopy, "privacyNote" | "footer">;
}

export default function LandingFooter({ copy }: LandingFooterProps) {
  return (
    <Footer className="block border-t border-[var(--color-border)] mt-12">
      <Paragraph className="w-full mx-auto max-w-2xl px-6 pt-6 text-xs text-[var(--color-muted)] text-center leading-relaxed">
        {copy.privacyNote}
      </Paragraph>
      <View className="w-full mx-auto max-w-5xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Text className="text-xs text-[var(--color-muted)]">{copy.footer.copyright}</Text>
        <View className="flex flex-row flex-wrap justify-center items-center gap-6">
          <Link
            nativeID="footer-github"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            GitHub
          </Link>
          <Link
            href={`${GITHUB_URL}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {copy.footer.releases}
          </Link>
          <Link
            href={STORYBOOK_URL}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Storybook
          </Link>
          <Link
            href={REPORTS_URL}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Reports
          </Link>
          <Link
            href={`${GITHUB_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {copy.footer.license}
          </Link>
        </View>
      </View>
    </Footer>
  );
}
