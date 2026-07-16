import {
  useQuery,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { ngaugeStore, NgaugeDataRow } from "@/store/ngauge-store";

const ROW_QUERY_KEY = ["row"];

export function useNguageRowData(
  formId: number,
  tableName: string,
  rowId: string | number,
  primaryKey = "ROWID",
): UseQueryResult<NgaugeDataRow | null, Error> & {
  refetchRow: () => Promise<void>;
} {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: [...ROW_QUERY_KEY, formId, tableName, rowId],
    queryFn: async () => {
      try {
        const row = await ngaugeStore.getRow(
          formId,
          tableName,
          rowId,
          primaryKey,
        );
        return row;
      } catch (error) {
        console.error("Error fetching row:", error);
        throw error;
      }
    },
    staleTime: 0,
    enabled: !!rowId,
  });

  const refetchRow = async () => {
    await queryClient.invalidateQueries({
      queryKey: [...ROW_QUERY_KEY, formId, tableName, rowId],
    });
  };

  return { ...queryResult, refetchRow };
}

export { ROW_QUERY_KEY };
