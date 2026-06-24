import { createContext, useContext } from "react";
import type { Theme } from "../hooks/useTheme";

export const ThemeContext = createContext<Theme>("dark");

export function useThemeContext(): Theme {
  return useContext(ThemeContext);
}
