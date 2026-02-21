import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSessionId } from "@/lib/utils";
import type { Favorite, Product } from "@shared/schema";

type FavoriteWithProduct = Favorite & { product: Product };

export function useFavorites() {
  const sessionId = getSessionId();

  const { data: favorites = [], isLoading } = useQuery<FavoriteWithProduct[]>({
    queryKey: [`/api/favorites?sessionId=${sessionId}`],
  });

  const toggleMutation = useMutation({
    mutationFn: (productId: number) =>
      apiRequest("POST", "/api/favorites/toggle", { sessionId, productId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/favorites?sessionId=${sessionId}`] }),
  });

  const isFavorite = (productId: number) => favorites.some(f => f.productId === productId);

  return { favorites, isLoading, toggleFavorite: toggleMutation.mutate, isFavorite };
}
