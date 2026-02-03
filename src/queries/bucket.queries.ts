import {
  useMutation,
  useQuery,
  UseMutationResult,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { Bucket } from "@prisma/client";

const BUCKET_QUERY_KEY = "bucket";
const BUCKET_QUERY_URL = "/api/bucket";

// Define error type for API responses
interface ApiError {
  message: string;
  status?: number;
}

/**
 * Fetch all buckets
 */
const useAllBucketsQuery = (): UseQueryResult<Bucket[], ApiError> => {
  return useQuery<Bucket[], ApiError>({
    queryKey: [BUCKET_QUERY_KEY],
    queryFn: async () => {
      const res = await fetch(BUCKET_QUERY_URL);
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
  });
};

/**
 * Fetch buckets for a given sheet
 * @param sheetId - the ID of the sheet to fetch buckets for
 */
const useBucketQuery = (
  sheetId: string
): UseQueryResult<Bucket[], ApiError> => {
  return useQuery<Bucket[], ApiError>({
    queryKey: [BUCKET_QUERY_KEY, sheetId],
    queryFn: async () => {
      const res = await fetch(`${BUCKET_QUERY_URL}?sheetId=${sheetId}`);
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
  });
};

/**
 * Create a new bucket
 */
const useMutateBucketQuery = (): UseMutationResult<
  Bucket,
  ApiError,
  Partial<Bucket>
> => {
  const queryClient = useQueryClient();
  return useMutation<Bucket, ApiError, Partial<Bucket>>({
    mutationFn: async (newBucket) => {
      const res = await fetch(BUCKET_QUERY_URL, {
        method: "POST",
        body: JSON.stringify(newBucket),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUCKET_QUERY_KEY] });
    },
  });
};

/**
 * Delete a bucket by ID
 */
const useDeleteBucketQuery = (): UseMutationResult<
  Bucket,
  ApiError,
  number
> => {
  const queryClient = useQueryClient();
  return useMutation<Bucket, ApiError, number>({
    mutationFn: async (bucketId) => {
      const res = await fetch(`${BUCKET_QUERY_URL}/${bucketId}`, {
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
      queryClient.invalidateQueries({ queryKey: [BUCKET_QUERY_KEY] });
    },
  });
};

export {
  useAllBucketsQuery,
  useBucketQuery,
  useMutateBucketQuery,
  useDeleteBucketQuery,
};