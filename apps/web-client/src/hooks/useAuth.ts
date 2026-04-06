import { AuthUser } from "../features/auth/types";
import {
  clearSessionStorage,
  getAccessToken,
  getStoredUser
} from "../lib/storage";

export function useAuth() {
  const accessToken = getAccessToken();
  const user = getStoredUser<AuthUser>();

  return {
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken),
    logout: clearSessionStorage
  };
}