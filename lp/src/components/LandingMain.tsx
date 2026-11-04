import { Main } from "@hozo/core";
import type { LandingCopy } from "../lib/lpContent";
import LandingAudience from "./LandingAudience";
import LandingFaq from "./LandingFaq";
import LandingFeatures from "./LandingFeatures";
import LandingHero from "./LandingHero";
import LandingStack from "./LandingStack";

interface LandingMainProps {
  copy: LandingCopy;
}

export default function LandingMain({ copy }: LandingMainProps) {
  return (
    <Main className="block">
      <LandingHero copy={copy} />
      <LandingFeatures copy={copy} />
      <LandingAudience copy={copy.audience} />
      <LandingFaq copy={copy.faq} />
      <LandingStack copy={copy.stack} />
    </Main>
  );
}
