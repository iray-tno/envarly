import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

const STORAGE_KEY = "envarly-language";
const stored = localStorage.getItem(STORAGE_KEY);
const detected = navigator.language;
const lng = stored === "ja" || stored === "en" ? stored : detected.startsWith("ja") ? "ja" : "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
