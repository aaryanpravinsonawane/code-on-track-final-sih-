import api from "./client";
import type { Issue } from "./types";

export const issueService = {
  list: () => api.get<Issue[]>("/issues").then((response) => response.data),
  create: (issue: Pick<Issue, "title" | "description" | "severity" | "department" | "asset">) => api.post<Issue>("/issues", issue).then((response) => response.data),
  update: (id: string, changes: Partial<Pick<Issue, "status" | "severity" | "description">>) => api.patch<Issue>(`/issues/${id}`, changes).then((response) => response.data),
};
