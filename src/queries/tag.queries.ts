import {
  useMutation,
  useQuery,
  UseMutationResult,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { Tag } from "@prisma/client";
import { RECORD_QUERY_KEY } from "./record.queries";

export const TAG_QUERY_KEY = "tag";
const TAG_QUERY_URL = "/api/tag";

// Define error type for API responses
interface ApiError {
  message: string;
  status?: number;
}

/**
 * Fetch tags for a given sheet
 * @param sheetId - the ID of the sheet to fetch tags for
 */
const useTagQuery = (sheetId: string): UseQueryResult<Tag[], ApiError> => {
  return useQuery<Tag[], ApiError>({
    queryKey: [TAG_QUERY_KEY, sheetId],
    queryFn: async () => {
      const res = await fetch(`${TAG_QUERY_URL}?sheetId=${sheetId}`);
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
  });
};

/**
 * Create a new tag
 */
const useMutateTagQuery = (): UseMutationResult<Tag, ApiError, Partial<Tag>> => {
  const queryClient = useQueryClient();
  return useMutation<Tag, ApiError, Partial<Tag>>({
    mutationFn: async (newTag) => {
      const res = await fetch(TAG_QUERY_URL, {
        method: "POST",
        body: JSON.stringify(newTag),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAG_QUERY_KEY] });
    },
  });
};

/**
 * Delete a tag
 */
const useDeleteTagQuery = (
  sheetId: string
): UseMutationResult<Tag, ApiError, { tagId: number }> => {
  const queryClient = useQueryClient();
  return useMutation<Tag, ApiError, { tagId: number }>({
    mutationFn: async ({ tagId }) => {
      const res = await fetch(TAG_QUERY_URL, {
        method: "DELETE",
        body: JSON.stringify({ tagId }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAG_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RECORD_QUERY_KEY, sheetId] });
    },
  });
};

export { useTagQuery, useMutateTagQuery, useDeleteTagQuery };
