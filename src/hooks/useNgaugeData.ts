import { Dispatch, SetStateAction, useState } from "react";
import {
  useQuery,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { ngaugeStore, NgaugeDataRow } from "@/store/ngauge-store";

type FiltersType = { [key: string]: { items: string[]; operator: string }[] };
type SortType = { [keyValue: string]: string };

export type UseNgaugeDataResult = UseQueryResult<NgaugeDataRow[], Error> & {
  filters: FiltersType | undefined;
  setFilters: Dispatch<SetStateAction<FiltersType | undefined>>;
  sort: SortType | undefined;
  setSort: Dispatch<SetStateAction<SortType | undefined>>;
  refetch: () => Promise<void>;
};

export function useNgaugeData(
  formId: number,
  tableName: string,
  skip = 0,
  take = 200,
  initialFilters?: FiltersType,
  initialSort?: SortType,
  enabled: boolean = true,
): UseNgaugeDataResult {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FiltersType | undefined>(
    initialFilters,
  );
  const [sort, setSort] = useState<SortType | undefined>(initialSort);

  const queryKey = [tableName, formId, filters, sort];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const rawData = await ngaugeStore.getData(
          formId,
          tableName,
          skip,
          take,
          filters,
          sort,
        );
        return rawData;
      } catch (error) {
        console.error("Error fetching ngauge data:", error);
        throw error;
      }
    },
    staleTime: 0,
    enabled: enabled && !!formId && !!tableName, // Only enable query when formId and tableName are provided and enabled is true
  });

  const refetch = async () => {
    await queryClient.invalidateQueries({
      queryKey,
    });
  };

  return {
    ...query,
    filters,
    setFilters,
    sort,
    setSort,
    refetch,
  } as UseNgaugeDataResult;
}
