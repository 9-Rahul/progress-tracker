"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "firebase/auth";
import { firebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  signInDemo: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);
const demoUser: AuthUser = {
  id: "demo-user",
  name: "Rahul",
  email: "demo@pace.local"
};

function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    window.localStorage.setItem("pace-theme", "dark");
  }, []);

  const value = useMemo(
    () => ({
      theme: "dark" as Theme,
      toggleTheme: () => {}
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function toAuthUser(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): AuthUser {
  return {
    id: user.uid,
    name: user.displayName ?? "Pace User",
    email: user.email ?? "user@pace.local",
    avatar: user.photoURL ?? undefined
  };
}

async function syncUser(user: AuthUser, token?: string) {
  try {
    await fetch("/api/users", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": user.id,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        firebaseUid: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      })
    });
  } catch {
    // The UI remains usable in demo mode if MongoDB is not configured.
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const nextUser = firebaseUser ? toAuthUser(firebaseUser) : null;
      setUser(nextUser);
      if (nextUser && firebaseUser) {
        const token = await firebaseUser.getIdToken();
        await syncUser(nextUser, token);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const setDemoSession = async (nextUser = demoUser) => {
    setUser(nextUser);
    await syncUser(nextUser);
  };

  const queryClient = useQueryClient();

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseReady: isFirebaseConfigured,
      signInWithGoogle: async () => {
        if (!firebaseAuth || !googleProvider) {
          await setDemoSession();
          return;
        }
        const credential = await signInWithPopup(firebaseAuth, googleProvider);
        const nextUser = toAuthUser(credential.user);
        const token = await credential.user.getIdToken();
        setUser(nextUser);
        await syncUser(nextUser, token);
      },
      signInWithEmail: async (email, password) => {
        if (!firebaseAuth) {
          await setDemoSession({ ...demoUser, email });
          return;
        }
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const nextUser = toAuthUser(credential.user);
        const token = await credential.user.getIdToken();
        setUser(nextUser);
        await syncUser(nextUser, token);
      },
      signUpWithEmail: async (name, email, password) => {
        if (!firebaseAuth) {
          await setDemoSession({ id: "demo-user", name, email });
          return;
        }
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await updateProfile(credential.user, { displayName: name });
        const nextUser = toAuthUser({ ...credential.user, displayName: name });
        const token = await credential.user.getIdToken();
        setUser(nextUser);
        await syncUser(nextUser, token);
      },
      signOutUser: async () => {
        if (firebaseAuth) {
          await signOut(firebaseAuth);
        }
        queryClient.clear();
        setUser(null);
      },
      signInDemo: async () => {
        queryClient.clear();
        await setDemoSession();
      }
    }),
    [loading, user, queryClient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { ProjectProvider } from "@/components/project-context";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false, 
        refetchOnReconnect: "always",
        retry: 1
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "var(--apple-card)",
            border: "1px solid var(--apple-border)",
            color: "var(--apple-text-primary)",
            borderRadius: "14px",
            fontFamily: "var(--apple-font)",
            boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.45)"
          }
        }}
        closeButton
      />
      <ThemeProvider>
        <AuthProvider>
          <ProjectProvider>{children}</ProjectProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within Providers");
  }
  return context;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within Providers");
  }
  return context;
}
