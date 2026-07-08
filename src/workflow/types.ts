// 工作流节点类型定义

/** pipeline 阶段 ID，与后端 /api/v1/stage/* 端点一一对应 */
export type StageId = "script" | "terms" | "audio" | "subtitle" | "materials" | "render";

/** 节点运行状态 */
export type NodeStatus = "idle" | "running" | "success" | "error";

/** 节点产出的数据，key 是产物名（script/terms/audio_file 等） */
export type NodeOutputs = Record<string, unknown>;

/** 后端 /stage/metadata 返回的单个阶段元数据 */
export interface StageFieldMeta {
  name: string;
  type: string;
  required?: boolean;
  desc: { zh: string; en: string };
}

export interface StageMeta {
  id: StageId;
  name: { zh: string; en: string };
  summary: { zh: string; en: string };
  inputs: StageFieldMeta[];
  outputs: StageFieldMeta[];
  depends_on: StageId[];
  typical_duration: string;
  note?: { zh: string; en: string };
}

/** 大白话补充说明（前端本地维护，与后端结构化元数据合并） */
export interface StageHint {
  /** 一句话解释这个节点干啥（比后端 summary 更口语） */
  what: string;
  /** 什么时候该用它 */
  when?: string;
  /** 踩坑提示 */
  pitfalls?: string;
}

/** 画布上的自定义节点 data */
export interface FlowNodeData extends Record<string, unknown> {
  stageId: StageId;
  status: NodeStatus;
  outputs: NodeOutputs;
  /** 该节点的参数（video_subject / voice_name 等） */
  params: Record<string, unknown>;
  /** 错误信息（status=error 时有值） */
  error?: string;
  /** 运行时关联的后端 task_id（跨阶段复用用） */
  taskId?: string;
  /** 运行进度 0-100（长耗时阶段轮询后端得到，running 时有值） */
  progress?: number;
  /** 已运行秒数（running 时有值，由前端计时器更新） */
  elapsedSeconds?: number;
}
