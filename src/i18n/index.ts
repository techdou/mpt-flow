import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import zh from "./zh.json";
import en from "./en.json";

/**
 * i18n 初始化。
 *
 * 语言来源优先级（高→低）：
 *   1. localStorage 里的 mpt-lang（用户手动切换过）
 *   2. 浏览器 navigator.language 前缀匹配
 *   3. 默认 zh
 *
 * 注意：settingsStore 的 language 字段和这里共用同一个 localStorage key (mpt-lang)，
 * 但 i18n 初始化发生在所有 React 组件渲染之前（main.tsx 里 import），
 * 所以这里直接读 localStorage，不走 zustand，避免循环依赖。
 */

const STORAGE_KEY = "mpt-lang";

function detectLanguage(): string {
  // 1. 用户手动切换过的
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "zh" || stored === "en") return stored;

  // 2. 浏览器语言
  const navLang = navigator.language?.toLowerCase() ?? "";
  if (navLang.startsWith("zh")) return "zh";
  if (navLang.startsWith("en")) return "en";

  // 3. 默认中文
  return "zh";
}

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: "zh",
  interpolation: {
    // React 已经做了转义，关掉 i18next 的
    escapeValue: false,
  },
});

// 语言切换时同步 localStorage + document 属性
i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
  const titleKey = lng === "en" ? "app.title" : "app.title";
  document.title = i18n.t(titleKey);
});

export default i18n;
