import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ngaugeStore } from "@/store/ngauge-store";

export function useDistinctColumnItems(
  id: number,
  column: string,
  search?: string,
): UseQueryResult<string[], Error> {
  return useQuery({
    queryKey: ["columnItems", id, column, search],
    queryFn: async () => {
      try {
        const items = await ngaugeStore.GetColumnItems(id, column, search);
        return items;
      } catch (error) {
        console.error("Error fetching column items:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id && !!column,
  });
}
