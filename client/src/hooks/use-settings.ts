import { useQuery } from "@tanstack/react-query";
import type { SiteSetting } from "@shared/schema";

export function useSettings() {
  const { data: settings = [], isLoading } = useQuery<SiteSetting[]>({
    queryKey: ["/api/settings"],
  });

  const getSetting = (key: string): string => {
    const s = settings.find(s => s.key === key);
    return s?.value || "";
  };

  return { settings, isLoading, getSetting };
}
