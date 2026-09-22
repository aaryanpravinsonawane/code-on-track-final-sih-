export type Train = {
  id: string;
  name: string;
  type: string;
  section: string;
  arrival: number;
  departure: number;
  priority: number;
  status: string;
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  department: string;
  asset: string;
  status: "Open" | "Investigating" | "Resolved";
  created_at: string;
  resolved_at: string | null;
};

export type ScheduleRecommendation = {
  recommended_platform: string | null;
  recommended_track: string | null;
  conflict_warnings: string[];
  delay_risk_score: number;
  explanation: string[];
};

export type Analytics = {
  train_traffic: Array<{ section: string; count: number }>;
  issue_trends: Array<{ status: string; count: number }>;
  department_performance: Array<{ department: string; open: number }>;
  resolution_rates: Array<{ status: string; count: number }>;
  signal_health: Array<{ health: string; count: number }>;
  power_analytics: Array<{ period: string; consumption: number }>;
  delay_prediction_trends: Array<{ period: string; risk: number }>;
  platform_utilization: Array<{ platform: string; utilization: number }>;
  track_utilization: Array<{ track: string; utilization: number }>;
  conflict_statistics: Array<{ type: string; count: number }>;
  optimization_performance: Array<{ metric: string; value: number }>;
};

export type AiTrain = {
  train_id: string;
  arrival_time: number;
  departure_time: number;
  priority: number;
  section: string;
};

export type AiOptimizationResult = {
  assignments: Array<Record<string, string | number | boolean | null>>;
  conflicts?: Array<Record<string, string | string[]>>;
  optimization_score?: number;
};

export type DelayPrediction = {
  predicted_delay_minutes: number;
  delay_probability: number;
  risk_level: "Low" | "Medium" | "High";
  model: string;
};
