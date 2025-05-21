import {
  useMutation,
  useQuery,
  UseMutationResult,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { Record as RecordModel } from "@prisma/client";
import { ApiError } from "./api";

export const RECORD_QUERY_KEY = "record";
const RECORD_QUERY_URL = "/api/record";

/**
 * Fetch records for a given sheet
 * @param sheetId - the ID of the sheet to fetch records for
 */
const useRecordQuery = (sheetId: string): UseQueryResult<RecordModel[], ApiError> => {
  return useQuery<RecordModel[], ApiError>({
    queryKey: [RECORD_QUERY_KEY, sheetId],
    queryFn: async () => {
      const res = await fetch(`${RECORD_QUERY_URL}?sheetId=${sheetId}`);
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
  });
};

/**
 * Create a new record
 */
const useMutateRecordQuery = (): UseMutationResult<RecordModel, ApiError, Partial<RecordModel>> => {
  const queryClient = useQueryClient();
  return useMutation<RecordModel, ApiError, Partial<RecordModel>>({
    mutationFn: async (newRecord) => {
      const res = await fetch(RECORD_QUERY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECORD_QUERY_KEY] });
    },
  });
};

/**
 * Delete a record by ID
 */
const useDeleteRecordQuery = (): UseMutationResult<RecordModel, ApiError, number> => {
  const queryClient = useQueryClient();
  return useMutation<RecordModel, ApiError, number>({
    mutationFn: async (recordId) => {
      const res = await fetch(RECORD_QUERY_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordId }),
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      const data = await res.json();
      return data.deletedRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECORD_QUERY_KEY] });
    },
  });
};

export { useRecordQuery, useMutateRecordQuery, useDeleteRecordQuery };
