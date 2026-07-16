import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  useQuery,
  UseQueryResult,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  ngaugeStore,
  PaginatedDataResponse,
  NgaugeDataRow,
} from "@/store/ngauge-store";

export type FiltersType = {
  [key: string]: { items: string[]; operator: string }[];
};
type SortType = { [keyValue: string]: string };

export type UseNgaugePaginatedDataResult = Omit<
  UseQueryResult<PaginatedDataResponse, Error>,
  "data"
> & {
  data: NgaugeDataRow[];
  totalRowCount: number;
  filters: FiltersType | undefined;
  setFilters: Dispatch<SetStateAction<FiltersType | undefined>>;
  sort: SortType | undefined;
  setSort: Dispatch<SetStateAction<SortType | undefined>>;
  refetch: () => Promise<void>;
};

export function useNgaugePaginatedData(
  formId: number,
  tableName: string,
  pageNo: number,
  limit: number,
  initialFilters?: FiltersType,
  initialSort?: SortType,
  enabled: boolean = true,
): UseNgaugePaginatedDataResult {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FiltersType | undefined>(
    initialFilters,
  );
  const [sort, setSort] = useState<SortType | undefined>(initialSort);

  // Keep query key in sync when the parent passes new filter props (route / filter UI).
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    setSort(initialSort);
  }, [initialSort]);

  const queryKey = [
    tableName,
    formId,
    pageNo,
    limit,
    filters,
    sort,
    "paginated",
  ];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const paginatedData = await ngaugeStore.getPaginatedData(
          formId,
          tableName,
          pageNo,
          limit,
          filters,
          sort,
        );
        return paginatedData;
      } catch (error) {
        console.error("Error fetching paginated ngauge data:", error);
        throw error;
      }
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: enabled && !!formId && !!tableName, // Only enable query when formId and tableName are provided and enabled is true
  });

  const refetch = async () => {
    await queryClient.invalidateQueries({
      queryKey,
    });
  };

  return {
    ...query,
    data: query.data?.data ?? [],
    totalRowCount: query.data?.totalRowCount ?? 0,
    filters,
    setFilters,
    sort,
    setSort,
    refetch,
  } as UseNgaugePaginatedDataResult;
}
