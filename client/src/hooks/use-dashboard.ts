import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useLecturerSummary() {
  return useQuery({
    queryKey: [api.dashboard.lecturerSummary.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.lecturerSummary.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch dashboard summary");
      return api.dashboard.lecturerSummary.responses[200].parse(await res.json());
    },
    retry: false,
  });
}
