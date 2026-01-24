import {
  useMutation,
  useQuery,
  UseMutationResult,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { Plan, Sheet } from "@prisma/client";
import { ApiError } from "./api";
import { PlanWithSheets } from "@/utils/csv-export";

export const PLAN_QUERY_KEY = "plan";
const PLAN_QUERY_URL = "/api/plan";

type PlanWithSheet = Plan & {
  Sheet: Pick<Sheet, "id" | "name">[];
};

const usePlanQuery = (): UseQueryResult<PlanWithSheet[], ApiError> => {
  return useQuery<PlanWithSheet[], ApiError>({
    queryKey: [PLAN_QUERY_KEY],
    queryFn: async () => {
      const res = await fetch(PLAN_QUERY_URL);
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
  });
};

const useOnePlanQuery = (planId: string): UseQueryResult<Plan, ApiError> => {
  return useQuery<Plan, ApiError>({
    queryKey: [PLAN_QUERY_KEY, planId],
    queryFn: async () => {
      const res = await fetch(`${PLAN_QUERY_URL}/${planId}`);
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
  });
};

const useMutatePlanQuery = (): UseMutationResult<Plan, ApiError, Partial<Plan>> => {
  const queryClient = useQueryClient();
  return useMutation<Plan, ApiError, Partial<Plan>>({
    mutationFn: async (newPlan) => {
      const res = await fetch(PLAN_QUERY_URL, {
        method: "POST",
        body: JSON.stringify(newPlan),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLAN_QUERY_KEY] });
    },
  });
};

const useDeletePlanQuery = (): UseMutationResult<Plan, ApiError, string> => {
  const queryClient = useQueryClient();
  return useMutation<Plan, ApiError, string>({
    mutationFn: async (planId: string) => {
      const res = await fetch(`${PLAN_QUERY_URL}/${planId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLAN_QUERY_KEY] });
    },
  });
};

const useUpdatePlanQuery = (): UseMutationResult<
  Plan,
  ApiError,
  { planId: string; data: Partial<Plan> }
> => {
  const queryClient = useQueryClient();
  return useMutation<Plan, ApiError, { planId: string; data: Partial<Plan> }>({
    mutationFn: async ({ planId, data }) => {
      const res = await fetch(`${PLAN_QUERY_URL}/${planId}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PLAN_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLAN_QUERY_KEY, variables.planId] });
    },
  });
};

/**
 * Download plan data as CSV
 * Returns the full plan data with all sheets and records for CSV export
 */
const useExportPlanQuery = (planId: string): UseQueryResult<PlanWithSheets, ApiError> => {
  return useQuery<PlanWithSheets, ApiError>({
    queryKey: [PLAN_QUERY_KEY, "export", planId],
    queryFn: async () => {
      const res = await fetch(`${PLAN_QUERY_URL}/${planId}/export`);
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    enabled: false, // Only fetch when manually triggered
  });
};

export {
  usePlanQuery,
  useOnePlanQuery,
  useMutatePlanQuery,
  useDeletePlanQuery,
  useUpdatePlanQuery,
  useExportPlanQuery
};
