import { create } from "zustand";
import type { StageMeta } from "../workflow/types";

/**
 * 节点元数据状态管理。
 *
 * App 启动时从后端 /stage/metadata 拉取，存入 store。
 * NodeShell / NodeTooltip 通过 selector 订阅，拿到响应式更新
 * （取代之前 window.__STAGE_METAS__ 全局变量的反模式）。
 */
interface MetadataState {
  metas: StageMeta[];
  error: string | null;
  loading: boolean;
  setMetas: (metas: StageMeta[]) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useMetadataStore = create<MetadataState>((set) => ({
  metas: [],
  error: null,
  loading: true,
  setMetas: (metas) => set({ metas, loading: false, error: null }),
  setError: (error) => set({ error, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
