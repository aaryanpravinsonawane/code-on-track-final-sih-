import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:8000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("trackwise_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
