import { post } from "./functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePost(url, body, key) {
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery({
    queryKey: [key, body],
    queryFn: async () => {
      console.log("usePost fetching:", url, body);
      return await post(url, body, `useQuery ${key}`);
    },
    staleTime: 1000 * 60, // cache valid for 1 minute
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [key, body] });

  return { data, error, isLoading, invalidate };
}

export function useMutatePost(invalidateKey) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ url, body, key }) => {
      return await post(url, body, key);
    },
    onSuccess: () => {
      if (invalidateKey)
        queryClient.invalidateQueries({ queryKey: [invalidateKey] });
    },
  });

  return mutation;
}
