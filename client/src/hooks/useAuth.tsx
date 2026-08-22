import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  clearAuthState,
  getCurrentUser,
  getStoredUser,
  loginUser,
  logoutUser,
  registerUser,
} from "@/lib/api";
import type { AuthUser } from "@/types/auth";

interface AuthContextType {
  user: AuthUser | null;
  session: { accessToken: string; refreshToken: string } | null;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    grade: string,
  ) => Promise<{ error: Error | null; data: { user: AuthUser | null } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedUser = getStoredUser();
        const currentUser = await getCurrentUser();
        if (!isMounted) return;

        setUser(currentUser ?? storedUser ?? null);
        const accessToken = localStorage.getItem("smart-soma-access-token");
        const refreshToken = localStorage.getItem("smart-soma-refresh-token");
        setSession(
          accessToken && refreshToken ? { accessToken, refreshToken } : null,
        );
      } catch {
        if (isMounted) {
          clearAuthState();
          setUser(null);
          setSession(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    grade: string,
  ) => {
    try {
      const data = await registerUser({ displayName, email, password, grade });
      setUser(data.user);
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return { error: null, data: { user: data.user } };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error : new Error("Registration failed"),
        data: null,
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await loginUser({ email, password });
      setUser(data.user);
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Login failed"),
      };
    }
  };

  const signOut = async () => {
    await logoutUser();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
