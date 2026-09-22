import api from "./client";

export type AnalyticsModule = {
  kpis: Record<string, number>;
  charts: Record<string, Array<Record<string, string | number>>>;
};

export type AnalyticsSummary = {
  period: string;
  generated_at: string;
  tms: AnalyticsModule;
  smms: AnalyticsModule;
  tdms: AnalyticsModule;
  department_report: Array<Record<string, string | number>>;
};

export const dataAnalyticsService = {
  tms: () => api.get<AnalyticsModule>("/analytics/tms").then((response) => response.data),
  smms: () => api.get<AnalyticsModule>("/analytics/smms").then((response) => response.data),
  tdms: () => api.get<AnalyticsModule>("/analytics/tdms").then((response) => response.data),
  summary: (period: "daily" | "weekly" | "monthly" = "daily") => api.get<AnalyticsSummary>(`/analytics/summary?period=${period}`).then((response) => response.data),
  exportExcel: () => api.get<Blob>("/export/excel", { responseType: "blob" }).then((response) => response.data),
};
