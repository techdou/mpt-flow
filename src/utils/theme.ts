import type { Theme } from "../store/settingsStore";

/**
 * 主题切换工具。
 *
 * 通过 toggle <html> 的 .dark class 来切换 CSS 变量。
 * theme.ts 和 settingsStore 分开，避免循环依赖
 * （settingsStore import applyTheme，applyTheme 不 import settingsStore）。
 */

const DARK_CLASS = "dark";

/** 判断系统当前是否暗色 */
function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** 解析 theme → 实际是否暗色 */
export function isDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return systemPrefersDark();
}

/**
 * 应用主题：toggle <html> 的 .dark class。
 * CSS 变量在 :root（亮）和 .dark（暗）里各一套。
 */
export function applyTheme(theme: Theme) {
  const dark = isDark(theme);
  const root = document.documentElement;
  if (dark) {
    root.classList.add(DARK_CLASS);
  } else {
    root.classList.remove(DARK_CLASS);
  }
}

/**
 * 注册系统主题变化监听（"跟随系统"模式时实时响应）。
 * 返回 cleanup 函数。
 */
export function watchSystemTheme(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback();
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
