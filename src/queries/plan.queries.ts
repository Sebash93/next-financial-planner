import {
  useMutation,
  useQuery,
  UseMutationResult,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { Plan, Sheet } from "@prisma/client";
import { ApiError } from "./api";

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

export { usePlanQuery, useOnePlanQuery, useMutatePlanQuery, useDeletePlanQuery };
