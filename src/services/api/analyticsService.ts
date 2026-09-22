import api from "./client";
import type { Analytics } from "./types";

export const analyticsService = {
  get: () => api.get<Analytics>("/analytics").then((response) => response.data),
};
