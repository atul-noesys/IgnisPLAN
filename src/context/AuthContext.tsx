import axios from "axios";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { User, AuthContextType, RegisterData } from "../types/auth";
import { isTokenValid, getTokenExpiration } from "../utils/tokenValidator";
import { registerAuthLogout } from "../utils/authAxios";
import { requestAccessToken } from "@/auth/login";
import { getCurrentUser } from "@/auth/getCurrentUser";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const login = useCallback(
    async (email: string, password: string, otp?: string) => {
      setIsLoading(true);
      try {
        const response = await requestAccessToken({
          username: email,
          password,
          otp,
        });

        const accessToken = response?.access_token;
        const expiresIn = response?.expires_in;
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
    },
    [],
  );

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
