import { useCanvasStore } from "../store/canvasStore";
import { useTaskStore } from "../store/taskStore";
import { STAGE_HINTS } from "../workflow/metadata";
import type { StageId } from "../workflow/types";

/**
 * 各阶段可配置的参数定义。
 * key 是字段名（对应后端 VideoParams 字段），type 决定渲染成什么控件。
 */
const STAGE_PARAMS: Record<StageId, { key: string; label: string; type: "text" | "textarea" | "number" | "select"; options?: string[]; placeholder?: string }[]> = {
  script: [
    { key: "video_subject", label: "视频主题", type: "text", placeholder: "如：人工智能的未来" },
    { key: "video_language", label: "脚本语言", type: "text", placeholder: "留空=自动检测" },
    { key: "paragraph_number", label: "段落数", type: "number", placeholder: "1" },
  ],
  terms: [
    { key: "video_subject", label: "视频主题", type: "text", placeholder: "辅助生成关键词" },
    { key: "match_materials_to_script", label: "按脚本顺序匹配", type: "select", options: ["false", "true"] },
  ],
  audio: [
    { key: "voice_name", label: "音色", type: "text", placeholder: "zh-CN-XiaoxiaoNeural-Female" },
    { key: "voice_rate", label: "语速倍率", type: "number", placeholder: "1.0" },
    { key: "custom_audio_file", label: "自定义音频路径", type: "text", placeholder: "留空用 TTS" },
  ],
  subtitle: [
    { key: "subtitle_enabled", label: "启用字幕", type: "select", options: ["true", "false"] },
  ],
  materials: [
    { key: "video_source", label: "素材源", type: "select", options: ["pexels", "pixabay", "coverr", "local"] },
    { key: "video_clip_duration", label: "单片段时长(秒)", type: "number", placeholder: "5" },
  ],
  render: [
    { key: "video_aspect", label: "画幅比例", type: "select", options: ["9:16", "16:9", "1:1"] },
    { key: "video_count", label: "生成数量", type: "number", placeholder: "1" },
    { key: "video_concat_mode", label: "拼接模式", type: "select", options: ["random", "sequential"] },
  ],
};

/**
 * 右侧参数配置面板。
 *
 * 点击节点后显示该节点的可配置参数。用户填的值存到 node.data.params，
 * 运行时会和上游产物合并成请求体。
 */
export function InspectorPanel() {
  const { nodes, selectedNodeId, updateNodeData } = useCanvasStore();
  const { sharedTaskId, runNode, resetTaskId } = useTaskStore();

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="flex w-72 flex-col border-l border-mpt-border bg-mpt-dark">
        <div className="px-4 py-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-mpt-teal">
            参数配置
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-sm text-mpt-muted">
            点击画布上的节点
            <br />
            在这里配置参数
          </p>
        </div>
      </div>
    );
  }

  const stageId = node.data.stageId;
  const params = STAGE_PARAMS[stageId] || [];
  const hint = STAGE_HINTS[stageId];

  const handleParamChange = (key: string, value: string) => {
    let parsed: unknown = value;
    // 数字字段转 number
    if (value !== "" && !isNaN(Number(value)) && key !== "video_subject") {
      const numVal = Number(value);
      if (key === "paragraph_number" || key === "voice_rate" || key === "video_clip_duration" || key === "video_count") {
        parsed = numVal;
      }
    }
    // 布尔字段转 boolean
    if (value === "true") parsed = true;
    if (value === "false") parsed = false;

    updateNodeData(node.id, {
      params: { ...node.data.params, [key]: parsed },
    });
  };

  return (
    <div className="flex w-72 flex-col border-l border-mpt-border bg-mpt-dark">
      <div className="border-b border-mpt-border px-4 py-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-mpt-teal">
          参数配置
        </h2>
        <p className="mt-1 text-sm font-medium text-white">{stageId}</p>
        <p className="mt-1 text-xs text-mpt-muted">{hint.what}</p>
      </div>

      {/* 共享 task_id 状态 */}
      <div className="border-b border-mpt-border bg-mpt-panel px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-mpt-muted">Task ID</span>
          {sharedTaskId && (
            <button
              onClick={resetTaskId}
              className="text-xs text-mpt-red hover:underline"
            >
              重置
            </button>
          )}
        </div>
        <p className="mt-0.5 truncate font-mono text-xs text-mpt-gold">
          {sharedTaskId || "（未创建）"}
        </p>
      </div>

      {/* 参数表单 */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {params.map((param) => (
          <div key={param.key}>
            <label className="mb-1 block text-xs text-mpt-muted">{param.label}</label>
            {param.type === "textarea" ? (
              <textarea
                className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1 text-sm text-white focus:border-mpt-teal focus:outline-none"
                rows={3}
                placeholder={param.placeholder}
                value={String(node.data.params[param.key] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
              />
            ) : param.type === "select" ? (
              <select
                className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1 text-sm text-white focus:border-mpt-teal focus:outline-none"
                value={String(node.data.params[param.key] ?? param.options?.[0] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
              >
                {param.options?.map((opt) => (
                  <option key={opt} value={opt} className="bg-mpt-panel">
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={param.type === "number" ? "number" : "text"}
                className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1 text-sm text-white focus:border-mpt-teal focus:outline-none"
                placeholder={param.placeholder}
                value={String(node.data.params[param.key] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {/* 运行按钮 */}
      <div className="border-t border-mpt-border px-4 py-3">
        <button
          onClick={() => runNode(node.id)}
          disabled={node.data.status === "running"}
          className="w-full rounded-lg bg-mpt-teal py-2 text-sm font-semibold text-white hover:bg-mpt-teal/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {node.data.status === "running" ? "运行中..." : "运行此节点"}
        </button>
        {node.data.status === "error" && node.data.error && (
          <p className="mt-2 text-xs text-mpt-red break-all">{node.data.error}</p>
        )}
      </div>
    </div>
  );
}
