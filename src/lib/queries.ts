import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./api";
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return (await api.me()).data.user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}
export function useCart() {
  const session = useSession();
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await api.cart()).data,
    enabled: !!session.data,
  });
}
export function useCartChange() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      slug,
      quantity,
    }: {
      action: "add" | "remove";
      slug: string;
      quantity: number;
    }) => api.changeCart(action, slug, quantity),
    onSuccess: () => client.invalidateQueries({ queryKey: ["cart"] }),
  });
}
