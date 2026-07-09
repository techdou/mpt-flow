import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore, type Language } from "../store/settingsStore";
import { updateClientConfig } from "../api/client";
import { STAGE_PARAMS } from "../workflow/stageParams";
import { STAGE_ORDER } from "../workflow/metadata";
import type { StageId } from "../workflow/types";

/**
 * 设置面板（Modal 弹窗）。
 *
 * 四个区块：
 *   1. 语言（与 i18n 联动）
 *   2. 后端地址（动态改 axios baseURL）
 *   3. 请求超时（动态改 axios timeout）
 *   4. 默认参数预设（新建节点时自动带入）
 *
 * 所有值由 settingsStore 管理，persist 到 localStorage。
 * 语言切换即时生效（i18n.changeLanguage）；后端地址/超时点"保存"后生效。
 */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const {
    language, setLanguage,
    apiBaseUrl, setApiBaseUrl,
    timeout, setTimeout: setTimeoutStore,
    defaultParams, setDefaultParam,
    resetSettings,
  } = useSettingsStore();

  // 编辑态：后端地址和超时先存在本地，点保存才应用 + 持久化
  const [editUrl, setEditUrl] = useState(apiBaseUrl);
  const [editTimeout, setEditTimeout] = useState(timeout);

  // ESC 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    setApiBaseUrl(editUrl);
    setTimeoutStore(editTimeout);
    updateClientConfig(editUrl, editTimeout);
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setEditUrl("");
    setEditTimeout(300);
    updateClientConfig("", 300);
    // resetSettings 不重置 language（i18n 的语言由 i18n.changeLanguage 管）
    // 但 resetSettings 把 store.language 设回 zh，需要同步 i18n
    setLanguage("zh");
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  // 参数值解析：与 InspectorPanel 的 handleParamChange 逻辑一致
  const parseParamValue = (key: string, value: string): unknown => {
    if (value === "true") return true;
    if (value === "false") return false;
    if (
      value !== "" &&
      !isNaN(Number(value)) &&
      (key === "paragraph_number" || key === "voice_rate" || key === "video_clip_duration" || key === "video_count")
    ) {
      return Number(value);
    }
    return value;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-[560px] overflow-y-auto rounded-lg border border-mpt-border bg-mpt-dark shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-mpt-border px-5 py-3">
          <h2 className="font-mono text-sm font-bold text-mpt-teal">{t("settings.title")}</h2>
          <button
            onClick={onClose}
            className="text-mpt-muted hover:text-white"
            title={t("settings.close")}
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {/* 1. 语言 */}
          <section>
            <label className="mb-1.5 block text-xs font-medium text-mpt-teal">
              {t("settings.language")}
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1.5 text-sm text-white focus:border-mpt-teal focus:outline-none"
            >
              <option value="zh" className="bg-mpt-panel">中文</option>
              <option value="en" className="bg-mpt-panel">English</option>
            </select>
          </section>

          {/* 2. 后端地址 */}
          <section>
            <label className="mb-1.5 block text-xs font-medium text-mpt-teal">
              {t("settings.apiBaseUrl")}
            </label>
            <input
              type="text"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="http://127.0.0.1:18081"
              className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1.5 text-sm text-white focus:border-mpt-teal focus:outline-none"
            />
            <p className="mt-1 text-xs text-mpt-muted">{t("settings.apiBaseUrlHint")}</p>
          </section>

          {/* 3. 请求超时 */}
          <section>
            <label className="mb-1.5 block text-xs font-medium text-mpt-teal">
              {t("settings.timeout")}
            </label>
            <input
              type="number"
              min={1}
              value={editTimeout}
              onChange={(e) => setEditTimeout(Number(e.target.value) || 300)}
              className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1.5 text-sm text-white focus:border-mpt-teal focus:outline-none"
            />
            <p className="mt-1 text-xs text-mpt-muted">{t("settings.timeoutHint")}</p>
          </section>

          {/* 4. 默认参数预设 */}
          <section>
            <div className="mb-1">
              <label className="block text-xs font-medium text-mpt-teal">
                {t("settings.defaultParams")}
              </label>
              <p className="text-xs text-mpt-muted">{t("settings.defaultParamsHint")}</p>
            </div>
            <div className="space-y-3 rounded border border-mpt-border bg-mpt-panel/50 p-3">
              {STAGE_ORDER.map((stageId) => {
                const params = STAGE_PARAMS[stageId];
                const stageDefaults = defaultParams[stageId] || {};
                return (
                  <div key={stageId}>
                    <div className="mb-1.5 font-mono text-xs text-mpt-gold">{stageId}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {params.map((param) => (
                        <div key={param.key}>
                          <label className="mb-0.5 block text-xs text-mpt-muted">
                            {t(`inspector.params.${param.labelKey}`)}
                          </label>
                          {param.type === "select" ? (
                            <select
                              value={String(stageDefaults[param.key] ?? param.options?.[0] ?? "")}
                              onChange={(e) =>
                                setDefaultParam(stageId, param.key, parseParamValue(param.key, e.target.value))
                              }
                              className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1 text-xs text-white focus:border-mpt-teal focus:outline-none"
                            >
                              {param.options?.map((opt) => (
                                <option key={opt} value={opt} className="bg-mpt-panel">{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={param.type === "number" ? "number" : "text"}
                              value={String(stageDefaults[param.key] ?? "")}
                              onChange={(e) =>
                                setDefaultParam(stageId, param.key, parseParamValue(param.key, e.target.value))
                              }
                              className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1 text-xs text-white focus:border-mpt-teal focus:outline-none"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-between border-t border-mpt-border px-5 py-3">
          <button
            onClick={handleReset}
            className="rounded px-3 py-1.5 text-xs text-mpt-red hover:bg-mpt-red/10"
          >
            {t("settings.reset")}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded px-3 py-1.5 text-xs text-mpt-muted hover:text-white"
            >
              {t("settings.close")}
            </button>
            <button
              onClick={handleSave}
              className="rounded bg-mpt-teal px-4 py-1.5 text-xs font-semibold text-white hover:bg-mpt-teal/80"
            >
              {t("settings.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
