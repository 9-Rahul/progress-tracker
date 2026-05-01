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
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("pace-theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(stored ?? preferred);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("pace-theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark"))
    }),
    [theme]
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

async function syncUser(user: AuthUser) {
  try {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      if (nextUser) {
        await syncUser(nextUser);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const setDemoSession = async (nextUser = demoUser) => {
    setUser(nextUser);
    await syncUser(nextUser);
  };

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
        setUser(nextUser);
        await syncUser(nextUser);
      },
      signInWithEmail: async (email, password) => {
        if (!firebaseAuth) {
          await setDemoSession({ ...demoUser, email });
          return;
        }
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const nextUser = toAuthUser(credential.user);
        setUser(nextUser);
        await syncUser(nextUser);
      },
      signUpWithEmail: async (name, email, password) => {
        if (!firebaseAuth) {
          await setDemoSession({ id: "demo-user", name, email });
          return;
        }
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await updateProfile(credential.user, { displayName: name });
        const nextUser = toAuthUser({ ...credential.user, displayName: name });
        setUser(nextUser);
        await syncUser(nextUser);
      },
      signOutUser: async () => {
        setUser(null);
        if (firebaseAuth) {
          await signOut(firebaseAuth);
        }
      },
      signInDemo: async () => {
        await setDemoSession();
      }
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { ProjectProvider } from "@/components/project-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>{children}</ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
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
