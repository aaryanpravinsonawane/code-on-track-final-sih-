import api from "./client";
import type { AiOptimizationResult, AiTrain, DelayPrediction } from "./types";

export const optimizerService = {
  platform: (trains: AiTrain[], platforms: string[]) => api.post<AiOptimizationResult>("/optimizer/platform", { trains, platforms }).then((response) => response.data),
  track: (trains: AiTrain[], tracks: string[]) => api.post<AiOptimizationResult>("/optimizer/track", { trains, tracks }).then((response) => response.data),
  schedule: (trains: AiTrain[], tracks: string[]) => api.post<AiOptimizationResult>("/optimizer/schedule", { trains, tracks }).then((response) => response.data),
  conflicts: (trains: AiTrain[]) => api.post<{ conflicts: Array<Record<string, string | string[]>> }>("/optimizer/conflicts", { trains }).then((response) => response.data),
  predictDelay: (features: { traffic_volume: number; platform_usage: number; incident_count: number; train_priority: number; historical_delay: number }) => api.post<DelayPrediction>("/predict/delay", features).then((response) => response.data),
};
