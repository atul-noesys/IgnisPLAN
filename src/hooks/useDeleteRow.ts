import { ngaugeStore } from "@/store/ngauge-store";
import { useMutation, UseMutationResult } from "@tanstack/react-query";

export function useDeleteRow(): UseMutationResult<
  unknown,
  Error,
  {
    formId: number;
    tableName: string;
    rowId: string | number;
    primaryKey?: string;
  }
> {
  return useMutation({
    mutationFn: async ({
      formId,
      tableName,
      rowId,
      primaryKey = "ROWID",
    }: {
      formId: number;
      tableName: string;
      rowId: string | number;
      primaryKey?: string;
    }) => {
      return ngaugeStore.deleteRow(formId, rowId, tableName, primaryKey);
    },
  });
}
