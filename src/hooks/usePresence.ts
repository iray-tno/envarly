import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

export type PresenceState = "open" | "closed";

export function usePresence(open: boolean, exitDuration = 180) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<PresenceState>(open ? "open" : "closed");

  useEffect(() => {
    if (open) {
      setMounted(true);
      setState("open");
      return;
    }

    if (!mounted) return;

    setState("closed");
    const timeout = window.setTimeout(() => setMounted(false), reducedMotion ? 0 : exitDuration);
    return () => window.clearTimeout(timeout);
  }, [exitDuration, mounted, open, reducedMotion]);

  return { mounted, state };
}
