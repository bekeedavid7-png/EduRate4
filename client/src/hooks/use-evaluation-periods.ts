import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface EvaluationPeriodPayload {
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export function useActiveEvaluationPeriod() {
  return useQuery({
    queryKey: [api.evaluationPeriods.active.path],
    queryFn: async () => {
      const res = await fetch(api.evaluationPeriods.active.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch active evaluation period");
      return api.evaluationPeriods.active.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useAdminEvaluationPeriods(enabled = true) {
  return useQuery({
    queryKey: [api.admin.evaluationPeriods.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.evaluationPeriods.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch evaluation periods");
      return api.admin.evaluationPeriods.list.responses[200].parse(await res.json());
    },
    enabled,
    retry: false,
  });
}

export function useCreateEvaluationPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: EvaluationPeriodPayload) => {
      const res = await fetch(api.admin.evaluationPeriods.create.path, {
        method: api.admin.evaluationPeriods.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create evaluation period");
      }
      return api.admin.evaluationPeriods.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.evaluationPeriods.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.evaluationPeriods.active.path] });
    },
  });
}

export function useUpdateEvaluationPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<EvaluationPeriodPayload> }) => {
      const path = api.admin.evaluationPeriods.update.path.replace(":id", String(id));
      const res = await fetch(path, {
        method: api.admin.evaluationPeriods.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update evaluation period");
      }
      return api.admin.evaluationPeriods.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.evaluationPeriods.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.evaluationPeriods.active.path] });
    },
  });
}

export function useDeleteEvaluationPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const path = api.admin.evaluationPeriods.delete.path.replace(":id", String(id));
      const res = await fetch(path, {
        method: api.admin.evaluationPeriods.delete.method,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete evaluation period");
      }
      return api.admin.evaluationPeriods.delete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.evaluationPeriods.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.evaluationPeriods.active.path] });
    },
  });
}
