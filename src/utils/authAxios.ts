import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

let authContextLogout: (() => void) | null = null;

/**
 * Register the logout callback to be called on 401 errors
 */
export const registerAuthLogout = (logoutCallback: () => void) => {
  authContextLogout = logoutCallback;
};

/**
 * Create an Axios instance with JWT interceptors
 */
export const createAuthAxiosInstance = (): AxiosInstance => {
  const instance = axios.create();

  // Request interceptor - add token to requests
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor - handle 401 errors
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      // Handle 401 Unauthorized - token invalid or expired
      if (error.response?.status === 401) {
        console.warn("Token expired or invalid. Logging out...");

        // Clear auth data
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_expiry");
        localStorage.removeItem("auth_user");

        // Call the registered logout callback if available
        if (authContextLogout) {
          authContextLogout();
        }

        // Redirect to login
        window.location.href = "/login";
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

// Default instance
export const authAxios = createAuthAxiosInstance();
