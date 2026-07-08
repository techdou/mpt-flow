import axios from "axios";

// axios 实例。baseURL 留空，dev 环境通过 vite proxy 把 /api 转发到后端。
// 生产环境部署时改成后端的实际地址。
const client = axios.create({
  baseURL: "",
  timeout: 300000, // 5 分钟，render 阶段可能很久
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
      "网络请求失败";
    return Promise.reject(new Error(typeof msg === "string" ? msg : JSON.stringify(msg)));
  }
);

export default client;
