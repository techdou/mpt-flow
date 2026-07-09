import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore, type Language } from "../store/settingsStore";
import { updateClientConfig } from "../api/client";
import { STAGE_PARAMS } from "../workflow/stageParams";
import { STAGE_ORDER } from "../workflow/metadata";
import { StageIcon } from "./StageIcon";
import { stageColor } from "../workflow/stageVisuals";
import type { StageId } from "../workflow/types";

/**
 * 设置面板（Modal 弹窗）。
 * 默认参数区按阶段折叠，避免信息过载。
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

  const [editUrl, setEditUrl] = useState(apiBaseUrl);
  const [editTimeout, setEditTimeout] = useState(timeout);
  const [expandedStage, setExpandedStage] = useState<StageId | null>(null);

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
    setLanguage("zh");
  };

  const handleLanguageChange = (lang: Language) => setLanguage(lang);

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

  const inputClass =
    "w-full rounded-md border border-mpt-border bg-mpt-elevated px-2.5 py-1.5 text-xs text-white focus:border-mpt-teal focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-[520px] overflow-hidden rounded-xl border border-mpt-border bg-mpt-panel shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-mpt-border px-5 py-3.5">
          <h2 className="font-heading text-sm font-bold text-mpt-teal">{t("settings.title")}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-mpt-muted transition-colors hover:bg-mpt-elevated hover:text-white"
            title={t("settings.close")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(85vh-120px)] space-y-5 overflow-y-auto px-5 py-4">
          {/* 1. 语言 */}
          <section>
            <label className="mb-1.5 block text-xs font-medium text-mpt-teal">
              {t("settings.language")}
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className={inputClass}
            >
              <option value="zh" className="bg-mpt-elevated">中文</option>
              <option value="en" className="bg-mpt-elevated">English</option>
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
              className={inputClass}
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
              className={inputClass}
            />
            <p className="mt-1 text-xs text-mpt-muted">{t("settings.timeoutHint")}</p>
          </section>

          {/* 4. 默认参数预设（折叠式） */}
          <section>
            <label className="mb-1 block text-xs font-medium text-mpt-teal">
              {t("settings.defaultParams")}
            </label>
            <p className="mb-2 text-xs text-mpt-muted">{t("settings.defaultParamsHint")}</p>
            <div className="space-y-1.5">
              {STAGE_ORDER.map((stageId) => {
                const params = STAGE_PARAMS[stageId];
                const stageDefaults = defaultParams[stageId] || {};
                const isOpen = expandedStage === stageId;
                const color = stageColor(stageId);

                return (
                  <div key={stageId} className="overflow-hidden rounded-lg border border-mpt-border bg-mpt-elevated/50">
                    <button
                      onClick={() => setExpandedStage(isOpen ? null : stageId)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-mpt-elevated"
                    >
                      <StageIcon stageId={stageId} className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-medium text-white">{t(`node.stageName.${stageId}`)}</span>
                      <span className="font-mono text-[10px] text-mpt-muted">{stageId}</span>
                      <svg
                        className={`ml-auto h-3 w-3 text-mpt-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-2 gap-2 border-t border-mpt-border px-3 py-2.5 animate-fade-in">
                        {params.map((param) => (
                          <div key={param.key}>
                            <label className="mb-0.5 block text-[10px] text-mpt-muted">
                              {t(`inspector.params.${param.labelKey}`)}
                            </label>
                            {param.type === "select" ? (
                              <select
                                value={String(stageDefaults[param.key] ?? param.options?.[0] ?? "")}
                                onChange={(e) =>
                                  setDefaultParam(stageId, param.key, parseParamValue(param.key, e.target.value))
                                }
                                className={inputClass}
                              >
                                {param.options?.map((opt) => (
                                  <option key={opt} value={opt} className="bg-mpt-elevated">{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={param.type === "number" ? "number" : "text"}
                                value={String(stageDefaults[param.key] ?? "")}
                                onChange={(e) =>
                                  setDefaultParam(stageId, param.key, parseParamValue(param.key, e.target.value))
                                }
                                className={inputClass}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
            className="rounded-md border border-mpt-red/30 px-3 py-1.5 text-xs text-mpt-red transition-colors hover:bg-mpt-red/10"
          >
            {t("settings.reset")}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-mpt-muted transition-colors hover:text-white"
            >
              {t("settings.close")}
            </button>
            <button
              onClick={handleSave}
              className="min-w-[80px] rounded-md bg-mpt-teal px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("settings.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
