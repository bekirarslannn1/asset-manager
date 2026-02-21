import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSessionId } from "@/lib/utils";
import type { CartItem, Product } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const sessionId = getSessionId();

  const { data: items = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: [`/api/cart?sessionId=${sessionId}`],
  });

  const addMutation = useMutation({
    mutationFn: (data: { productId: number; variantId?: number; quantity: number; selectedFlavor?: string; selectedWeight?: string }) =>
      apiRequest("POST", "/api/cart", { ...data, sessionId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/cart?sessionId=${sessionId}`] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      apiRequest("PATCH", `/api/cart/${id}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/cart?sessionId=${sessionId}`] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cart/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/cart?sessionId=${sessionId}`] }),
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/cart?sessionId=${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/cart?sessionId=${sessionId}`] }),
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.quantity * parseFloat(item.product.price), 0);

  return {
    items,
    isLoading,
    totalItems,
    totalPrice,
    addToCart: addMutation.mutate,
    updateQuantity: updateMutation.mutate,
    removeItem: removeMutation.mutate,
    clearCart: clearMutation.mutate,
    isAdding: addMutation.isPending,
  };
}
