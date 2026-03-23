import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useLecturerSummary(courseId?: number) {
  return useQuery({
    queryKey: [api.dashboard.lecturerSummary.path, courseId ?? null],
    queryFn: async () => {
      const url = courseId
        ? `${api.dashboard.lecturerSummary.path}?courseId=${courseId}`
        : api.dashboard.lecturerSummary.path;
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch dashboard summary");
      return api.dashboard.lecturerSummary.responses[200].parse(await res.json());
    },
    retry: false,
  });
}
