import {
  useMutation,
  useQuery,
  UseMutationResult,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { Sheet } from "@prisma/client";
import { ApiError } from "./api";
import { RECORD_QUERY_KEY } from "./record.queries";
import { PLAN_QUERY_KEY } from "./plan.queries";

const SHEET_QUERY_KEY = "sheet";
const SHEET_QUERY_URL = "/api/sheet";

export type SheetWithRecordsSum = Sheet & {
  recordsSum: number;
};

/**
 * Fetch sheets for a given plan
 * @param planId - the ID of the plan to fetch sheets for
 */
const useSheetQuery = (planId: string): UseQueryResult<SheetWithRecordsSum[], ApiError> => {
  return useQuery<SheetWithRecordsSum[], ApiError>({
    queryKey: [SHEET_QUERY_KEY, planId],
    queryFn: async () => {
      const res = await fetch(`${SHEET_QUERY_URL}?planId=${planId}`);
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
  });
};

const useOneSheetQuery = (sheetId: string): UseQueryResult<Sheet, ApiError> => {
  return useQuery<Sheet, ApiError>({
    queryKey: [SHEET_QUERY_KEY, sheetId],
    queryFn: async () => {
      const res = await fetch(`${SHEET_QUERY_URL}/${sheetId}`);
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
  });
};

/**
 * Create a new sheet
 */
const useMutateSheetQuery = (): UseMutationResult<Sheet, ApiError, Partial<Sheet>> => {
  const queryClient = useQueryClient();
  return useMutation<Sheet, ApiError, Partial<Sheet>>({
    mutationFn: async (newSheet) => {
      const res = await fetch(SHEET_QUERY_URL, {
        method: "POST",
        body: JSON.stringify(newSheet),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHEET_QUERY_KEY] });
    },
  });
};

const useDeleteSheetQuery = (planId: string): UseMutationResult<Sheet, ApiError, string> => {
  const queryClient = useQueryClient();
  return useMutation<Sheet, ApiError, string>({
    mutationFn: async (sheetId) => {
      const res = await fetch(`${SHEET_QUERY_URL}/${sheetId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHEET_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLAN_QUERY_KEY, parseInt(planId)] });
    },
  });
};

export { useSheetQuery, useOneSheetQuery, useDeleteSheetQuery, useMutateSheetQuery };
