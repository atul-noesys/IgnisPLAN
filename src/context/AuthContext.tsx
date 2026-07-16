import axios, { AxiosRequestConfig } from "axios";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { User, AuthContextType, RegisterData, UserRole } from "../types/auth";
import {
  isTokenValid,
  getTokenExpiration,
  decodeTokenSafely,
} from "../utils/tokenValidator";
import { authAxios, registerAuthLogout } from "../utils/authAxios";
import {
  INFOVEAVE_BASE_URL,
  INFOVEAVE_TENANT,
} from "@/store/ngauge-store";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const scopes = [
  "openid",
  "profile",
  "email",
  "infoveaveId",
  "roles",
  "v3",
  "analysis.manage",
  "analysis.read",
  "analysis.execute",
  "job.read",
  "job.manage",
  "task.read",
  "task.manage",
  "job.execute",
  "scipyr.access",
  "ml.access",
  "datamanage.read",
  "datamanage.manage",
  "report.read",
  "user.manage",
  "report.manage",
  "visualize.access",
] as const;

type TokenResponse = {
  access_token: string;
  expires_in?: number;
};

type CurrentUserResponse = {
  id?: string | number;
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleName?: string;
  company?: string;
  createdOn?: string;
};

const urlEncodedParams = <T,>(config: AxiosRequestConfig<T>) => {
  const newConfig = Object.assign({}, config);
  newConfig.transformRequest = [
    function (data: Record<string, string | number>) {
      const str: string[] = [];
      for (const p in data) {
        if (data[p]) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
        }
      }
      return str.join("&");
    },
  ];
  return newConfig;
};

const toAppRole = (roleName?: string): UserRole => {
  const role = (roleName ?? "").toLowerCase();
  if (role.includes("admin")) return "admin";
  if (role.includes("manager")) return "manager";
  if (role.includes("analyst")) return "analyst";
  return "sdr";
};

const getCurrentUser = async (token: string): Promise<User> => {
  try {
    const { data } = await axios.get<CurrentUserResponse>(
      `${INFOVEAVE_BASE_URL}/api/v10/User/CurrentUser`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {
      id: `${data.id ?? data.userName ?? data.email ?? "user"}`,
      email: data.email ?? "",
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      username: data.userName ?? "",
      role: toAppRole(data.roleName),
      company: data.company ?? "Infoveave",
      createdAt: data.createdOn ?? new Date().toISOString(),
    };
  } catch (error) {
    // Fall back to JWT claims when CurrentUser is unavailable for the tenant
    console.warn("CurrentUser API failed, using JWT claims:", error);
    const decoded = decodeTokenSafely(token);
    if (!decoded) {
      throw error;
    }

    const email =
      (typeof decoded.email === "string" && decoded.email) ||
      (typeof decoded.name === "string" && decoded.name) ||
      "";
    const firstName =
      (typeof decoded.given_name === "string" && decoded.given_name) || "";
    const lastName =
      (typeof decoded.family_name === "string" && decoded.family_name) || "";
    const username =
      (typeof decoded.name === "string" && decoded.name) ||
      (typeof decoded.sub === "string" && decoded.sub) ||
      email;

    return {
      id: `${decoded.UserId ?? decoded.sub ?? username}`,
      email,
      firstName,
      lastName,
      username,
      role: toAppRole(
        typeof decoded.roles === "string" ? decoded.roles : undefined,
      ),
      company: "Infoveave",
      createdAt: new Date().toISOString(),
    };
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("auth_user");
    const token = localStorage.getItem("access_token");

    // Validate token on initialization
    if (!token || !isTokenValid(token)) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expiry");
      localStorage.removeItem("auth_user");
      return null;
    }

    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Register logout callback with axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem("auth_user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expiry");
    };

    registerAuthLogout(handleLogout);
  }, []);

  // Monitor token expiration
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      return;
    }

    const expirationTime = getTokenExpiration(token);
    if (!expirationTime) {
      setUser(null);
      return;
    }

    const timeUntilExpiry = expirationTime.getTime() - Date.now();

    // If token expires in less than 5 minutes, logout preemptively
    if (timeUntilExpiry < 5 * 60 * 1000) {
      setUser(null);
      localStorage.removeItem("auth_user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expiry");
      return;
    }

    // Set a timeout to logout before token expires
    const timeout = setTimeout(
      () => {
        const currentToken = localStorage.getItem("access_token");
        if (!isTokenValid(currentToken)) {
          setUser(null);
          localStorage.removeItem("auth_user");
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_expiry");
        }
      },
      Math.max(timeUntilExpiry - 60 * 1000, 1000),
    ); // Check 1 minute before expiry

    return () => clearTimeout(timeout);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAxios.post<TokenResponse>(
        `${INFOVEAVE_BASE_URL}/connect/token`,
        {
          grant_type: "password",
          username: email,
          password,
          scope: scopes.join(" "),
          acr_values: `tenant:${INFOVEAVE_TENANT},otp:null`,
          client_id: "Infoveave.WebApp",
          client_secret: "B7190B8A-DDA2-43C1-A248-18AE9F8B25E9",
        },
        urlEncodedParams({
          responseType: "json",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-web-app": "Infoveave",
          },
        }),
      );

      const accessToken = response.data?.access_token;
      const expiresIn = response.data?.expires_in;
      if (!accessToken) {
        throw new Error("No access token received from login");
      }

      // Validate token before storing
      if (!isTokenValid(accessToken)) {
        throw new Error("Received token is invalid or expired");
      }

      localStorage.setItem("access_token", accessToken);

      if (expiresIn) {
        const expiryTimestamp = Math.floor(Date.now() / 1000) + expiresIn;
        localStorage.setItem("token_expiry", expiryTimestamp.toString());
      }

      const userData = await getCurrentUser(accessToken);
      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));
    } catch (error) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expiry");
      localStorage.removeItem("auth_user");
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        // Token endpoint failures (bad password) vs post-token API failures
        if (!error.config?.url?.includes("/connect/token")) {
          throw new Error(
            status
              ? `Login succeeded but user profile failed (${status})`
              : "Login succeeded but user profile failed",
          );
        }
        throw new Error("Invalid credentials or login failed");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_expiry");
  }, []);

  const register = useCallback(async (_data: RegisterData) => {
    setIsLoading(true);
    try {
      throw new Error("Registration is not configured for this environment");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Export axios instance for use in other parts of the app
export { authAxios } from "../utils/authAxios";
export {
  isTokenValid,
  getTokenExpiration,
  getTokenTimeRemaining,
  decodeTokenSafely,
} from "../utils/tokenValidator";
