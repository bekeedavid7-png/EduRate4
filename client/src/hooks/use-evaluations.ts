import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { CreateEvaluationRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useEvaluations() {
  return useQuery({
    queryKey: [api.evaluations.list.path],
    queryFn: async () => {
      const res = await fetch(api.evaluations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch evaluations");
      return api.evaluations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: CreateEvaluationRequest) => {
      const res = await fetch(api.evaluations.create.path, {
        method: api.evaluations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400 || res.status === 401) {
          const err = await res.json();
          throw new Error(err.message || "Failed to submit evaluation");
        }
        throw new Error("Failed to submit evaluation");
      }
      return api.evaluations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.evaluations.list.path] });
      toast({ title: "Evaluation Submitted!", description: "Thank you for your feedback." });
      setLocation("/student");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });
}
