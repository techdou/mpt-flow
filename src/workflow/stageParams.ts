import type { StageId } from "./types";

/**
 * 各阶段可配置的参数定义。
 *
 * key 是后端 VideoParams 字段名，type 决定渲染成什么控件。
 * InspectorPanel（节点参数）和 SettingsPanel（默认参数预设）共用这份定义，
 * 所以抽到 workflow 层避免重复维护两份。
 */
export interface ParamDef {
  key: string;
  type: "text" | "textarea" | "number" | "select";
  /** i18n key 后缀，完整 key 为 inspector.params.<key> */
  labelKey: string;
  /** i18n key 后缀，完整 key 为 inspector.placeholders.<key>（可选） */
  placeholderKey?: string;
  options?: string[];
}

export const STAGE_PARAMS: Record<StageId, ParamDef[]> = {
  script: [
    { key: "video_subject", type: "text", labelKey: "video_subject", placeholderKey: "video_subject" },
    { key: "video_language", type: "text", labelKey: "video_language", placeholderKey: "video_language" },
    { key: "paragraph_number", type: "number", labelKey: "paragraph_number", placeholderKey: "paragraph_number" },
  ],
  terms: [
    { key: "video_subject", type: "text", labelKey: "video_subject", placeholderKey: "video_subject_terms" },
    { key: "match_materials_to_script", type: "select", labelKey: "match_materials_to_script", options: ["false", "true"] },
  ],
  audio: [
    { key: "voice_name", type: "text", labelKey: "voice_name", placeholderKey: "voice_name" },
    { key: "voice_rate", type: "number", labelKey: "voice_rate", placeholderKey: "voice_rate" },
    { key: "custom_audio_file", type: "text", labelKey: "custom_audio_file", placeholderKey: "custom_audio_file" },
  ],
  subtitle: [
    { key: "subtitle_enabled", type: "select", labelKey: "subtitle_enabled", options: ["true", "false"] },
  ],
  materials: [
    { key: "video_source", type: "select", labelKey: "video_source", options: ["pexels", "pixabay", "coverr", "local"] },
    { key: "video_clip_duration", type: "number", labelKey: "video_clip_duration", placeholderKey: "video_clip_duration" },
  ],
  render: [
    { key: "video_aspect", type: "select", labelKey: "video_aspect", options: ["9:16", "16:9", "1:1"] },
    { key: "video_count", type: "number", labelKey: "video_count", placeholderKey: "video_count" },
    { key: "video_concat_mode", type: "select", labelKey: "video_concat_mode", options: ["random", "sequential"] },
  ],
};

/**
 * select 类型参数的默认值（取 options[0]）。
 * 节点首次选中时，把这些默认值预填进 params。
 */
export function getSelectDefaults(stageId: StageId): Record<string, unknown> {
  const params = STAGE_PARAMS[stageId] || [];
  const defaults: Record<string, unknown> = {};
  for (const p of params) {
    if (p.type === "select" && p.options && p.options.length > 0) {
      defaults[p.key] = p.options[0];
    }
  }
  return defaults;
}
