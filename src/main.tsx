import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@xyflow/react/dist/style.css";
import "./i18n";
import "./styles/theme.css";
import { useSettingsStore } from "./store/settingsStore";
import { applyTheme, watchSystemTheme } from "./utils/theme";

// 启动前从 settingsStore 恢复主题（persist 会同步从 localStorage 读）
const { theme } = useSettingsStore.getState();
applyTheme(theme);

// "跟随系统"模式时，系统主题变化 → 实时重新应用
watchSystemTheme(() => {
  const current = useSettingsStore.getState().theme;
  if (current === "system") {
    applyTheme("system");
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
