import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import zhCN from "./locales/zh-CN.json";

const STORAGE_KEY = "envarly-language";
const SUPPORTED_LANGUAGES = ["en", "ja", "zh-CN"] as const;

function getStoredLanguage() {
  try {
    return typeof localStorage !== "undefined" && typeof localStorage.getItem === "function"
      ? localStorage.getItem(STORAGE_KEY)
      : null;
  } catch {
    return null;
  }
}

function detectLanguage(): (typeof SUPPORTED_LANGUAGES)[number] {
  const detected = navigator.language;
  if (detected.startsWith("zh")) return "zh-CN";
  if (detected.startsWith("ja")) return "ja";
  return "en";
}

const stored = getStoredLanguage();
const lng =
  stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored) ? stored : detectLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
    "zh-CN": { translation: zhCN },
  },
  lng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
