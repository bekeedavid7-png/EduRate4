import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useLecturers() {
  return useQuery({
    queryKey: [api.lecturers.list.path],
    queryFn: async () => {
      const res = await fetch(api.lecturers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch lecturers");
      return api.lecturers.list.responses[200].parse(await res.json());
    },
  });
}
