import axios from "axios";
import i18n from "../i18n";

/**
 * axios 实例。
 *
 * baseURL：空 = 走 vite proxy（dev 默认，/api 转发到后端）；
 *          非空 = 直连后端绝对地址（settingsStore 配置后生效）。
 * timeout：默认 300s，render 阶段可能很久；settingsStore 可配。
 */
const client = axios.create({
  baseURL: "",
  timeout: 300000,
  headers: { "Content-Type": "application/json" },
});

// 统一错误处理：把后端返回的 {status, message, data} 结构解包
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      i18n.t("client.networkError");
    return Promise.reject(new Error(typeof msg === "string" ? msg : JSON.stringify(msg)));
  }
);

/**
 * 运行时更新 axios 配置（设置面板调用）。
 * baseURL 空 = 回退到 vite proxy。
 */
export function updateClientConfig(baseUrl: string, timeoutSeconds: number) {
  client.defaults.baseURL = baseUrl || "";
  client.defaults.timeout = Math.max(1, timeoutSeconds) * 1000;
}

// 启动时从 settingsStore 恢复配置（如果有持久化值的话）
try {
  const raw = localStorage.getItem("mpt-settings");
  if (raw) {
    const saved = JSON.parse(raw);
    const baseUrl = saved?.state?.apiBaseUrl;
    const timeout = saved?.state?.timeout;
    if (baseUrl) client.defaults.baseURL = baseUrl;
    if (typeof timeout === "number") client.defaults.timeout = Math.max(1, timeout) * 1000;
  }
} catch {
  // 持久化数据损坏时静默回退到默认值
}

export default client;
