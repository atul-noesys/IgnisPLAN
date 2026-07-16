import { ngaugeStore, type InfoveaveQueryRequest } from "@/store/ngauge-store";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

export type UseInfoveaveQueryResult = UseQueryResult<
  Array<Array<unknown>>,
  Error
>;

/**
 * Transforms raw query result [headers, ...rows] format to array of objects
 */
function transformQueryData(
  rawData: Array<Array<unknown>> | undefined,
): Array<Record<string, unknown>> {
  if (!rawData || rawData.length === 0) {
    return [];
  }

  const [headers, ...rows] = rawData;
  const headerArray = Array.isArray(headers) ? headers : [];

  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    const rowArray = Array.isArray(row) ? row : [];
    headerArray.forEach((header, index) => {
      obj[String(header)] = rowArray[index];
    });
    return obj;
  });
}

export function useInfoveaveQuery(
  request: InfoveaveQueryRequest | null,
  enabled: boolean = true,
): UseInfoveaveQueryResult & {
  transformedData: Array<Record<string, unknown>>;
} {
  const queryKey = [request?.dataSourceId, request?.query];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!request) {
        throw new Error("Request is required");
      }
      try {
        const result = await ngaugeStore.executeInfoveaveQuery(request);
        return result;
      } catch (error) {
        console.error("Error executing Infoveave query:", error);
        throw error;
      }
    },
    staleTime: 0,
    enabled: enabled && !!request,
  });

  return {
    ...query,
    transformedData: transformQueryData(query.data),
  };
}
