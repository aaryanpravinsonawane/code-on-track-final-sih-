import api from "./client";
import type { Train } from "./types";

export const trainService = {
  list: () => api.get<Train[]>("/trains").then((response) => response.data),
  create: (train: Train) => api.post<Train>("/trains", train).then((response) => response.data),
  update: (id: string, changes: Partial<Train>) => api.patch<Train>(`/trains/${id}`, changes).then((response) => response.data),
  remove: (id: string) => api.delete<void>(`/trains/${id}`),
};
