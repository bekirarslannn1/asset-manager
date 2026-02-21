import { useState, useCallback } from "react";

const MAX_COMPARE = 4;

function getCompareIds(): number[] {
  try {
    return JSON.parse(localStorage.getItem("compare_products") || "[]");
  } catch { return []; }
}

export function useCompare() {
  const [compareIds, setCompareIds] = useState<number[]>(getCompareIds);

  const toggleCompare = useCallback((id: number) => {
    setCompareIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : prev.length < MAX_COMPARE ? [...prev, id] : prev;
      localStorage.setItem("compare_products", JSON.stringify(next));
      window.dispatchEvent(new Event("compare-changed"));
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    localStorage.setItem("compare_products", "[]");
    window.dispatchEvent(new Event("compare-changed"));
  }, []);

  const isInCompare = useCallback((id: number) => compareIds.includes(id), [compareIds]);

  return { compareIds, toggleCompare, clearCompare, isInCompare, compareCount: compareIds.length };
}
