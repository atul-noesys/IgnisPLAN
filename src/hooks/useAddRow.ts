import { useMutation, UseMutationResult } from "@tanstack/react-query";
import {
  ngaugeStore,
  NgaugeDataRow,
  PrimaryKeyData,
} from "@/store/ngauge-store";

type AddRowVariables = {
  formId: number;
  tableName: string;
  rowData: NgaugeDataRow;
  primaryKey?: PrimaryKeyData;
};

type AddRowResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export function useAddRow(): UseMutationResult<
  AddRowResponse,
  Error,
  AddRowVariables
> {
  return useMutation({
    mutationFn: async (variables: AddRowVariables) => {
      try {
        if (variables.primaryKey) {
          const result = await ngaugeStore.EditRowData(
            variables.formId,
            variables.tableName,
            {
              rowData: variables.rowData,
              primaryKeyData: variables.primaryKey,
            },
          );
          return {
            success: result.result,
            data: result,
            error: result.error,
          };
        } else {
          const result = await ngaugeStore.addRow(
            variables.formId,
            variables.tableName,
            variables.rowData,
          );
          return {
            success: true,
            data: result,
          };
        }
      } catch (error) {
        throw error;
      }
    },
    onError: (error) => {
      console.error("Error adding/editing row:", error);
    },
  });
}
