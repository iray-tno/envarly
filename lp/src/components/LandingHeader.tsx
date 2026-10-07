import { Header, Link, Nav, View } from "@hozo/core";
import {
  GITHUB_URL,
  LANGUAGES,
  type LandingCopy,
  RELEASE_URL,
  REPORTS_URL,
  STORYBOOK_URL,
} from "../lib/lpContent";

interface LandingHeaderProps {
  copy: Pick<LandingCopy, "lang" | "canonicalPath" | "nav">;
}

export default function LandingHeader({ copy }: LandingHeaderProps) {
  return (
    <Header className="block sticky top-0 z-50 border-b border-[var(--color-border)] bg-bg/90 backdrop-blur">
      <View className="w-full mx-auto max-w-5xl px-4 sm:px-6 h-14 flex flex-row items-center justify-between">
        <Link
          href={copy.canonicalPath}
          className="shrink-0 font-semibold text-[var(--color-text)] tracking-tight"
        >
          Envarly
        </Link>
        <Nav className="flex flex-row shrink items-center gap-2 sm:gap-6">
          <Link
            href="#features"
            className="hidden lg:block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {copy.nav.features}
          </Link>
          <Link
            href={STORYBOOK_URL}
            className="hidden lg:block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {copy.nav.storybook}
          </Link>
          <Link
            href={REPORTS_URL}
            className="hidden lg:block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {copy.nav.reports}
          </Link>
          <Link
            nativeID="nav-github"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            GitHub
          </Link>
          <select
            id="lang-select"
            aria-label="Language"
            defaultValue={LANGUAGES.find((language) => language.code === copy.lang)?.path}
            className="max-w-28 sm:max-w-none text-sm bg-transparent border border-[var(--color-border)] rounded-md px-2 py-1 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.path}>
                {language.label}
              </option>
            ))}
          </select>
          <Link
            nativeID="nav-download"
            href={RELEASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 whitespace-nowrap text-sm px-3 sm:px-4 py-1.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium hover:bg-[var(--color-accent-dim)] transition-colors"
          >
            {copy.nav.download}
          </Link>
        </Nav>
      </View>
    </Header>
  );
}
