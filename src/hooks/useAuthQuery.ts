import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { authAxios } from "../utils/authAxios";
import { isTokenValid } from "../utils/tokenValidator";
import { useAuth } from "../context/AuthContext";

/**
 * Custom hook for GET requests with TanStack Query
 * Automatically handles token validation and auth errors
 */
export const useAuthQuery = <T>(
  queryKey: string[],
  url: string,
  options?: Omit<UseQueryOptions<T, AxiosError>, "queryKey" | "queryFn">,
) => {
  const { user, logout } = useAuth();

  return useQuery<T, AxiosError>({
    queryKey,
    queryFn: async () => {
      const token = localStorage.getItem("access_token");

      // Check if token is valid before making request
      if (!isTokenValid(token)) {
        logout();
        throw new Error("Token is invalid or expired");
      }

      const response = await authAxios.get<T>(url);
      return response.data;
    },
    enabled: !!user && isTokenValid(localStorage.getItem("access_token")), // Only run query if user is authenticated and token is valid
    staleTime: 0, // Always fetch fresh data by default
    ...options,
  });
};

/**
 * Custom hook for POST/PUT/PATCH/DELETE requests with TanStack Query
 * Automatically handles token validation and auth errors
 */
export const useAuthMutation = <T, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options?: Omit<UseMutationOptions<T, AxiosError, TVariables>, "mutationFn">,
) => {
  const { logout } = useAuth();

  return useMutation<T, AxiosError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const token = localStorage.getItem("access_token");

      // Check if token is valid before making request
      if (!isTokenValid(token)) {
        logout();
        throw new Error("Token is invalid or expired");
      }

      return mutationFn(variables);
    },
    onError: (error) => {
      if (error?.response?.status === 401) {
        logout();
      }
    },
    ...options,
  });
};

/**
 * Helper for making authenticated API calls
 * Use this when you don't need React Query integration
 */
export const makeAuthenticatedRequest = async <T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  data?: unknown,
): Promise<T> => {
  const token = localStorage.getItem("access_token");

  if (!isTokenValid(token)) {
    throw new Error("Token is invalid or expired");
  }

  const response = await authAxios({
    method,
    url,
    data,
  });

  return response.data;
};
