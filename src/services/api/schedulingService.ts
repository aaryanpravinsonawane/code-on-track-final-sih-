import api from "./client";
import type { ScheduleRecommendation } from "./types";

export type ScheduleRequest = {
  train_priority: number;
  arrival_time: number;
  departure_time: number;
  platform_availability: string[];
  track_availability: string[];
  section: string;
  duration_minutes: number;
};

export const schedulingService = {
  recommend: (request: ScheduleRequest) => api.post<ScheduleRecommendation>("/scheduling/recommend", request).then((response) => response.data),
};
