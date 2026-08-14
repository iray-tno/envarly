import { useTranslation } from "react-i18next";
import i18n from "../i18n";

export type Language = "en" | "ja" | "zh-CN" | "ru" | "ko" | "vi";

const STORAGE_KEY = "envarly-language";

export function useI18n() {
  const { t, i18n: i18next } = useTranslation();
  const language = i18next.language as Language;

  const setLanguage = (lang: Language) => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    } catch {
      // Language switching should still work in test/private-storage contexts.
    }
    i18n.changeLanguage(lang);
  };

  return { t, language, setLanguage };
}
