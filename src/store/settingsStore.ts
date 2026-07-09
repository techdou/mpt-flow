import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../i18n";
import type { StageId } from "../workflow/types";

/**
 * 用户设置 store。
 *
 * 用 zustand persist 中间件把状态写到 localStorage（key: mpt-settings），
 * 页面刷新后自动恢复。四个区块对应设置面板的四个分组。
 */

export type Language = "zh" | "en";

export interface SettingsState {
  /** 界面语言，与 i18n 共享 localStorage key (mpt-lang) */
  language: Language;
  /** 后端 API 地址，空字符串 = 走 vite proxy（dev 默认） */
  apiBaseUrl: string;
  /** 请求超时（秒），render 阶段较长 */
  timeout: number;
  /** 每个阶段节点的默认参数，新建节点时自动注入 */
  defaultParams: Partial<Record<StageId, Record<string, unknown>>>;

  setLanguage: (lang: Language) => void;
  setApiBaseUrl: (url: string) => void;
  setTimeout: (seconds: number) => void;
  setDefaultParam: (stageId: StageId, key: string, value: unknown) => void;
  resetSettings: () => void;
}

const DEFAULTS = {
  language: "zh" as Language,
  apiBaseUrl: "",
  timeout: 300,
  defaultParams: {} as Partial<Record<StageId, Record<string, unknown>>>,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },

      setApiBaseUrl: (url) => set({ apiBaseUrl: url.trim() }),
      setTimeout: (seconds) => set({ timeout: Math.max(1, seconds) }),

      setDefaultParam: (stageId, key, value) =>
        set((state) => ({
          defaultParams: {
            ...state.defaultParams,
            [stageId]: {
              ...state.defaultParams[stageId],
              [key]: value,
            },
          },
        })),

      resetSettings: () => set({ ...DEFAULTS }),
    }),
    {
      name: "mpt-settings",
    }
  )
);
