const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 12;

export function useRecentlyViewed() {
  function getRecentlyViewedIds(): number[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id: unknown) => typeof id === "number");
    } catch {
      return [];
    }
  }

  function addToRecentlyViewed(productId: number) {
    const ids = getRecentlyViewedIds();
    const filtered = ids.filter((id) => id !== productId);
    const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return { getRecentlyViewedIds, addToRecentlyViewed };
}
