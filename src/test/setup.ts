import "@testing-library/jest-dom";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { vi } from "vitest";
import en from "../locales/en.json";

function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
  };
}

const testLocalStorage = createStorage();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: testLocalStorage,
});

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: testLocalStorage,
});

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// Mock Tauri's invoke — components never call it directly (they go through api.ts)
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  isTauri: vi.fn(() => true),
}));

// jsdom does not implement matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: query.includes("dark"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom has <dialog> but not its modal API. Hozo's Dialog opens with
// showModal(); give it the part jsdom can represent, the `open` attribute.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
}
