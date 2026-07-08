import client from "./client";
import type { StageId, StageMeta } from "../workflow/types";

/** 后端统一响应体 */
interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

/** 单阶段触发的响应 data */
export interface StageResult {
  task_id: string;
  stage: string;
  outputs: Record<string, unknown>;
  error?: string;
}

/** 任务状态查询结果（GET /tasks/{id}） */
export interface TaskState {
  state: number; // -1=FAILED, 1=COMPLETE, 4=PROCESSING
  progress: number; // 0-100
  [key: string]: unknown;
}

/**
 * 触发某个阶段。
 *
 * @param stage 阶段 ID
 * @param payload 请求体（VideoParams 字段 + 可选 task_id）
 * @returns 阶段产物 + task_id
 */
export async function runStage(
  stage: StageId,
  payload: Record<string, unknown>
): Promise<StageResult> {
  const resp = await client.post<ApiResponse<StageResult | StageResult & { error: string }>>(
    `/api/v1/stage/${stage}`,
    payload
  );

  // 后端错误时 status 仍是 200（utils.get_response），但 data 里有 error 字段
  const data = resp.data.data;
  if (data && typeof data === "object" && "error" in data) {
    throw new Error((data as { error: string }).error);
  }
  return data as StageResult;
}

/**
 * 查询任务状态（进度百分比 + 状态）。
 * 用于 render 等长耗时阶段运行时轮询进度。
 */
export async function getTaskState(taskId: string): Promise<TaskState> {
  const resp = await client.get<ApiResponse<TaskState>>(`/api/v1/tasks/${taskId}`);
  return resp.data.data;
}

/** 拉取所有阶段的元数据（供节点悬停说明用） */
export async function fetchStageMetadata(): Promise<StageMeta[]> {
  const resp = await client.get<ApiResponse<{ stages: StageMeta[] }>>(
    "/api/v1/stage/metadata"
  );
  return resp.data.data.stages;
}
