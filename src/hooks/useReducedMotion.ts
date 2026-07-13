import { useEffect, useState } from "react";

const query = "(prefers-reduced-motion: reduce)";

function getInitialPreference() {
  return typeof window !== "undefined" && "matchMedia" in window
    ? window.matchMedia(query).matches
    : false;
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(getInitialPreference);

  useEffect(() => {
    if (!("matchMedia" in window)) return;

    const media = window.matchMedia(query);
    const handleChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}
