import { jwtDecode } from "jwt-decode";

export interface DecodedToken {
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  [key: string]: any;
}

/**
 * Validates if a JWT token is valid and not expired
 * @param token - JWT token string
 * @returns true if token is valid and not expired, false otherwise
 */
export const isTokenValid = (token?: string | null): boolean => {
  if (!token) {
    return false;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);

    // Check if token has expiration
    if (!decoded.exp) {
      return false;
    }

    // Get current time in seconds (JWT exp is in seconds)
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);

    // Add 60 seconds buffer to account for clock skew and prevent using almost-expired tokens
    const bufferTimeInSeconds = 60;

    // Token is valid if expiration is in the future (with buffer)
    return decoded.exp > currentTimeInSeconds + bufferTimeInSeconds;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

/**
 * Gets the expiration time of a token
 * @param token - JWT token string
 * @returns expiration time as Date or null if invalid
 */
export const getTokenExpiration = (token?: string | null): Date | null => {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (!decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error("Error getting token expiration:", error);
    return null;
  }
};

/**
 * Gets remaining time until token expires in milliseconds
 * @param token - JWT token string
 * @returns remaining time in milliseconds or 0 if expired
 */
export const getTokenTimeRemaining = (token?: string | null): number => {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return 0;
  }

  const remaining = expiration.getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
};

/**
 * Decodes token without validation (use with caution)
 * @param token - JWT token string
 * @returns decoded token object or null if invalid
 */
export const decodeTokenSafely = (
  token?: string | null,
): DecodedToken | null => {
  if (!token) {
    return null;
  }

  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};
